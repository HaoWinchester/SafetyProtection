/**
 * WebSocket Hook
 * 用于实时数据通信
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { WebSocketMessage, WebSocketMessageType } from '@/types'
import { WS_CONFIG } from '@/utils/constants'

/**
 * WebSocket Hook返回值
 */
interface UseWebSocketReturn {
  socket: Socket | null
  connected: boolean
  connecting: boolean
  error: string | null
  sendMessage: (type: WebSocketMessageType, data: any) => void
  disconnect: () => void
  reconnect: () => void
}

/**
 * WebSocket Hook
 */
export const useWebSocket = (
  enabled: boolean = true,
  onMessage?: (message: WebSocketMessage) => void
): UseWebSocketReturn => {
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const socketRef = useRef<Socket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 连接WebSocket
   */
  const connect = useCallback(() => {
    if (!enabled || socketRef.current?.connected) {
      return
    }

    setConnecting(true)
    setError(null)

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws'
      const socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: WS_CONFIG.RECONNECT_INTERVAL,
        reconnectionAttempts: WS_CONFIG.MAX_RECONNECT_ATTEMPTS,
      })

      socket.on('connect', () => {
        setConnected(true)
        setConnecting(false)
        setError(null)
        reconnectAttemptsRef.current = 0
        console.log('WebSocket connected:', socket.id)
      })

      socket.on('disconnect', (reason) => {
        setConnected(false)
        console.log('WebSocket disconnected:', reason)
      })

      socket.on('connect_error', (err) => {
        setConnecting(false)
        setError(err.message)
        console.error('WebSocket connection error:', err)
      })

      socket.on('message', (message: WebSocketMessage) => {
        if (onMessage) {
          onMessage(message)
        }
      })

      // 监听特定类型的消息
      Object.values(WebSocketMessageType).forEach((type) => {
        socket.on(type, (data: any) => {
          if (onMessage) {
            onMessage({
              type,
              data,
              timestamp: new Date().toISOString(),
            })
          }
        })
      })

      socketRef.current = socket
    } catch (err: any) {
      setConnecting(false)
      setError(err.message)
      console.error('Failed to create WebSocket connection:', err)
    }
  }, [enabled, onMessage])

  /**
   * 断开连接
   */
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setConnected(false)
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  /**
   * 重新连接
   */
  const reconnect = useCallback(() => {
    disconnect()
    reconnectAttemptsRef.current = 0
    connect()
  }, [disconnect, connect])

  /**
   * 发送消息
   */
  const sendMessage = useCallback(
    (type: WebSocketMessageType, data: any) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(type, data)
      } else {
        console.warn('Cannot send message: WebSocket not connected')
      }
    },
    []
  )

  /**
   * 初始化连接
   */
  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    socket: socketRef.current,
    connected,
    connecting,
    error,
    sendMessage,
    disconnect,
    reconnect,
  }
}

export default useWebSocket
