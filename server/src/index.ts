import { createServer, type IncomingMessage, type ServerResponse } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import { URL } from 'url'
import { randomUUID } from 'crypto'
import { SignJWT, jwtVerify } from 'jose'
import type {
  ClientMessage,
  AuthPayload,
  HostAuthPayload,
  PlayerAuthPayload,
} from '../../packages/shared-types'
import { QuizRoom } from './QuizRoom'
import { send, generateQuizCode } from './utils'

const PORT = 3001
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET env variable is required')
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const TOKEN_EXPIRY = process.env.TOKEN_EXPIRY ?? '4h'

const rooms = new Map<string, QuizRoom>()
const clientRoomMap = new Map<WebSocket, { room: QuizRoom; playerId: string }>()
const hostRoomMap = new Map<WebSocket, QuizRoom>()

// jwt

async function signToken(payload: AuthPayload): Promise<string> {
  return new SignJWT({ ...payload } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

async function verifyToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as AuthPayload
  } catch {
    return null
  }
}

// HTtP

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString()))
    req.on('error', reject)
  })
}

function json(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data)
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

//auth routes

async function handleAuthHost(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  let body: { username?: string }
  try {
    body = JSON.parse(await readBody(req))
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  const username = body.username?.trim()
  if (!username) return json(res, 400, { error: 'username is required' })

  const payload: HostAuthPayload = { role: 'host', username }
  const token = await signToken(payload)
  json(res, 200, { token })
}

async function handleAuthPlayer(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' })

  let body: { name?: string; roomCode?: string }
  try {
    body = JSON.parse(await readBody(req))
  } catch {
    return json(res, 400, { error: 'Invalid JSON' })
  }

  const name = body.name?.trim()
  const roomCode = body.roomCode?.trim().toUpperCase()

  if (!name) return json(res, 400, { error: 'name is required' })
  if (!roomCode) return json(res, 400, { error: 'roomCode is required' })
  if (!rooms.has(roomCode)) return json(res, 404, { error: 'Room not found' })

  const payload: PlayerAuthPayload = { role: 'player', name, playerId: randomUUID() }
  const token = await signToken(payload)
  json(res, 200, { token })
}

// room

function cleanupRoom(room: QuizRoom, hostWs: WebSocket): void {
  room.end()
  rooms.delete(room.code)
  hostRoomMap.delete(hostWs)

  for (const [clientWs, entry] of clientRoomMap) {
    if (entry.room === room) clientRoomMap.delete(clientWs)
  }
}

//HTTP server

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const path = url.pathname

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    })
    return res.end()
  }

  if (path === '/auth/host') return handleAuthHost(req, res)
  if (path === '/auth/player') return handleAuthPlayer(req, res)
  if (path === '/' || path === '/health') return json(res, 200, { status: 'ok' })

  json(res, 404, { error: 'Not found' })
})

// ── WebSocket server ─────────────────────────────────────────────────

const wss = new WebSocketServer({ server: httpServer })

wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  const token = url.searchParams.get('token')

  if (!token) {
    send(ws, { type: 'error', message: 'Token manquant' })
    ws.close(4001, 'Missing token')
    return
  }

  const user = await verifyToken(token)
  if (!user) {
    send(ws, { type: 'error', message: 'Token invalide' })
    ws.close(4001, 'Invalid token')
    return
  }

  console.log(`[Server] WS auth: ${user.role} — ${user.role === 'host' ? user.username : user.name}`)

  ws.on('message', (raw: Buffer) => {
    let message: ClientMessage
    try {
      message = JSON.parse(raw.toString()) as ClientMessage
    } catch {
      send(ws, { type: 'error', message: 'Message JSON invalide' })
      return
    }

    console.log('[Server] Message recu:', message.type)

    switch (message.type) {
      case 'join': {
        const room = rooms.get(message.quizCode)
        if (!room) {
          send(ws, { type: 'error', message: 'Salle introuvable' })
          break
        }
        if (room.phase !== 'lobby') {
          send(ws, { type: 'error', message: 'Partie deja en cours' })
          break
        }
        const playerId = room.addPlayer(message.name, ws)
        clientRoomMap.set(ws, { room, playerId })
        break
      }

      case 'answer': {
        const entry = clientRoomMap.get(ws)
        if (!entry) {
          send(ws, { type: 'error', message: 'Joueur non enregistre' })
          break
        }
        entry.room.handleAnswer(entry.playerId, message.choiceIndexes)
        break
      }

      case 'host:create': {
        const code = generateQuizCode()
        const room = new QuizRoom(Date.now().toString(), code)
        room.hostWs = ws
        room.title = message.title
        room.questions = message.questions

        rooms.set(code, room)
        hostRoomMap.set(ws, room)
        send(ws, { type: 'sync', phase: 'lobby', data: { roomCode: code } })
        console.log(`[Server] Quiz cree avec le code: ${code}`)
        break
      }

      case 'host:start': {
        const room = hostRoomMap.get(ws)
        if (!room) {
          send(ws, { type: 'error', message: 'Impossible de demarrer : aucune salle associee' })
          break
        }
        room.start()
        break
      }

      case 'host:next': {
        const room = hostRoomMap.get(ws)
        if (!room) {
          send(ws, { type: 'error', message: 'Impossible de passer a la suite : aucune salle associee' })
          break
        }
        room.nextQuestion()
        break
      }

      case 'host:end': {
        const room = hostRoomMap.get(ws)
        if (!room) {
          send(ws, { type: 'error', message: 'Impossible de terminer : aucune salle associee' })
          break
        }
        cleanupRoom(room, ws)
        break
      }

      default: {
        send(ws, { type: 'error', message: 'Type de message inconnu' })
      }
    }
  })

  ws.on('close', () => {
    console.log('[Server] Connexion fermee')

    if (clientRoomMap.has(ws)) {
      clientRoomMap.delete(ws)
    }

    const room = hostRoomMap.get(ws)
    if (room) cleanupRoom(room, ws)
  })

  ws.on('error', (err: Error) => {
    console.error('[Server] Erreur WebSocket:', err.message)
  })
})

httpServer.listen(PORT, () => {
  console.log(`[Server] Serveur demarre sur http://localhost:${PORT}`)
})
