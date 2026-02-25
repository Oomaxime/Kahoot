import { useEffect, useRef, useState, useCallback } from 'react'
import type { ClientMessage, ServerMessage } from '../shared-types/index'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected'

const MAX_RECONNECT_DELAY = 30000

export function useWebSocket(
  url: string | null,
  onMessage: (msg: ServerMessage) => void,
) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const unmountedRef = useRef(false)
  const onMessageRef = useRef(onMessage)
  useEffect(() => { onMessageRef.current = onMessage }, [onMessage])

  const connect = useCallback(() => {
    if (unmountedRef.current || !url) return

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setStatus('connecting')

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      if (unmountedRef.current) {
        ws.close()
        return
      }
      console.log('[useWebSocket] Connected')
      setStatus('connected')
      reconnectAttemptRef.current = 0
    }

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string) as ServerMessage
        onMessageRef.current(message)
      } catch (err) {
        console.error('[useWebSocket] Parse error:', err)
      }
    }

    ws.onclose = () => {
      if (unmountedRef.current) return
      console.log('[useWebSocket] Disconnected')
      setStatus('disconnected')
      wsRef.current = null

      const delay = Math.min(
        1000 * Math.pow(2, reconnectAttemptRef.current),
        MAX_RECONNECT_DELAY
      )
      console.log(`[useWebSocket] Reconnecting in ${delay}ms...`)
      reconnectAttemptRef.current += 1

      reconnectTimeoutRef.current = setTimeout(() => {
        if (!unmountedRef.current) {
          connect()
        }
      }, delay)
    }

    ws.onerror = (event: Event) => {
      console.error('[useWebSocket] Error:', event)
    }
  }, [url])

  useEffect(() => {
    unmountedRef.current = false
    if (url) connect()

    return () => {
      unmountedRef.current = true

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [connect])

  const sendMessage = useCallback((message: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.warn('[useWebSocket] Cannot send, WebSocket not connected')
    }
  }, [])

  return { status, sendMessage }
}
