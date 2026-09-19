import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { WS_BASE_URL } from '../api/client';

type MessageHandler = (data: any) => void;

interface SocketContextType {
  isConnected: boolean;
  lastMessage: any;
  subscribe: (eventType: string, handler: MessageHandler) => () => void;
  sendMessage: (msg: any) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const subscribersRef = useRef<Map<string, Set<MessageHandler>>>(new Map());

  const subscribe = useCallback((eventType: string, handler: MessageHandler) => {
    if (!subscribersRef.current.has(eventType)) {
      subscribersRef.current.set(eventType, new Set());
    }
    subscribersRef.current.get(eventType)!.add(handler);

    // Return un-subscriber
    return () => {
      subscribersRef.current.get(eventType)?.delete(handler);
    };
  }, []);

  const sendMessage = useCallback((msg: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  }, []);

  useEffect(() => {
    if (!user || !token) {
      if (socketRef.current) {
        socketRef.current.close();
      }
      setIsConnected(false);
      return;
    }

    let isSubscribed = true;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        const wsUrl = `${WS_BASE_URL}/ws/${user.id}?token=${encodeURIComponent(token)}`;
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isSubscribed) return;
          console.log('[RYDO Realtime] Connected to WebSocket network');
          setIsConnected(true);
        };

        ws.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            setLastMessage(data);

            // Dispatch to registered event listeners
            if (data && data.type) {
              const handlers = subscribersRef.current.get(data.type);
              if (handlers) {
                handlers.forEach((fn) => fn(data));
              }
              // Also dispatch to wildcard listeners
              const allHandlers = subscribersRef.current.get('*');
              if (allHandlers) {
                allHandlers.forEach((fn) => fn(data));
              }
            }
          } catch (e) {
            // non-JSON message
          }
        };

        ws.onclose = () => {
          if (!isSubscribed) return;
          setIsConnected(false);
          // Try reconnecting after 3 seconds
          reconnectTimeout = setTimeout(connectWs, 3000);
        };

        ws.onerror = (err) => {
          console.warn('[RYDO Realtime] Socket error', err);
        };
      } catch (err) {
        console.error('[RYDO Realtime] Connection error:', err);
        reconnectTimeout = setTimeout(connectWs, 4000);
      }
    };

    connectWs();

    // Heartbeat ping interval to keep connection active
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send('ping');
      }
    }, 25000);

    return () => {
      isSubscribed = false;
      clearInterval(pingInterval);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [user?.id, token]);

  return (
    <SocketContext.Provider value={{ isConnected, lastMessage, subscribe, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
