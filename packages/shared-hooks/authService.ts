import type { AuthResponse, HostAuthPayload, PlayerAuthPayload } from '../shared-types/index'

const BASE_URL = import.meta.env.VITE_API_URL

/**
 * Decodes the payload of a JWT without verifying the signature.
 * Safe on the client — verification happens server-side on every WS connection.
 */
function decodeToken<T>(token: string): T {
  return JSON.parse(atob(token.split('.')[1]))
}

/**
 * POST /auth/host
 * Body:     { username: string }
 * Response: { token: string }  — JWT payload: { role: 'host', username }
 */
export async function loginHost(username: string): Promise<{ token: string; user: HostAuthPayload }> {
  const res = await fetch(`${BASE_URL}/auth/host`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const { token } = await res.json() as AuthResponse
  return { token, user: decodeToken<HostAuthPayload>(token) }
}

/**
 * POST /auth/player
 * Body:     { name: string, roomCode: string }
 * Response: { token: string }  — JWT payload: { role: 'player', name, playerId }
 */
export async function loginPlayer(name: string, roomCode: string): Promise<{ token: string; user: PlayerAuthPayload }> {
  const res = await fetch(`${BASE_URL}/auth/player`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, roomCode }),
  })
  if (!res.ok) throw new Error(`Login failed: ${res.status}`)
  const { token } = await res.json() as AuthResponse
  return { token, user: decodeToken<PlayerAuthPayload>(token) }
}
