import { createServer } from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import type { ClientMessage } from '../../packages/shared-types'
import { QuizRoom } from './QuizRoom'
import { send, generateQuizCode } from './utils'

const PORT = 3001

const rooms = new Map<string, QuizRoom>()
const clientRoomMap = new Map<WebSocket, { room: QuizRoom; playerId: string }>()
const hostRoomMap = new Map<WebSocket, QuizRoom>()

function cleanupRoom(room: QuizRoom, hostWs: WebSocket): void {
  room.end()
  rooms.delete(room.code)
  hostRoomMap.delete(hostWs)

  for (const [clientWs, entry] of clientRoomMap) {
    if (entry.room === room) clientRoomMap.delete(clientWs)
  }
}

const httpServer = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Quiz WebSocket Server is running')
})

const wss = new WebSocketServer({ server: httpServer })

wss.on('connection', (ws: WebSocket) => {
  console.log('[Server] Nouvelle connexion WebSocket')

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
  console.log(`[Server] Serveur WebSocket demarre sur ws://localhost:${PORT}`)
})