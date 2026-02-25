import WebSocket from 'ws'
import type { ServerMessage } from '../../packages/shared-types'

export function send(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message))
  }
}

export function broadcast(clients: Iterable<WebSocket>, message: ServerMessage): void {
  const data = JSON.stringify(message)
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  }
}

export function generateQuizCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}