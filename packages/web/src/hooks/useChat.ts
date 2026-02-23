import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/auth.store';
import apiClient from '../services/api-client';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface GetMessagesResponse {
  messages: ChatMessage[];
  blockedAt: string | null;
}

interface UseChatOptions {
  conversationId: string | undefined;
}

interface UseChatReturn {
  messages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  blockedAt: string | null;
}

export function useChat({ conversationId }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [blockedAt, setBlockedAt] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelay = useRef(1000);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const lastMessageCount = useRef(0);

  const { user } = useAuthStore();

  // Fetch message history via REST
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await apiClient.get<GetMessagesResponse>(`/messages/conversations/${conversationId}`);
      if (mountedRef.current) {
        setMessages(res.data.messages);
        setBlockedAt(res.data.blockedAt);
        lastMessageCount.current = res.data.messages.length;
        setError(null);
      }
    } catch {
      if (mountedRef.current) {
        setError('Error al cargar mensajes');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [conversationId]);

  // Poll fallback (when WS is not connected)
  const startPolling = useCallback(() => {
    if (pollInterval.current) return;
    pollInterval.current = setInterval(async () => {
      if (!conversationId || !mountedRef.current) return;
      try {
        const res = await apiClient.get<GetMessagesResponse>(`/messages/conversations/${conversationId}`);
        if (mountedRef.current) {
          if (res.data.messages.length !== lastMessageCount.current) {
            setMessages(res.data.messages);
            lastMessageCount.current = res.data.messages.length;
          }
          setBlockedAt(res.data.blockedAt);
        }
      } catch {
        // Silently ignore poll errors
      }
    }, 5000);
  }, [conversationId]);

  const stopPolling = useCallback(() => {
    if (pollInterval.current) {
      clearInterval(pollInterval.current);
      pollInterval.current = null;
    }
  }, []);

  // Connect WebSocket
  const connectWS = useCallback(() => {
    if (!user?.token || !conversationId) return;

    // Build WS URL through the Vite proxy
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/v1/messages/ws?token=${encodeURIComponent(user.token)}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        reconnectDelay.current = 1000; // Reset backoff
        stopPolling(); // Stop polling since WS is connected
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'new_message' && data.message?.conversationId === conversationId) {
            setMessages((prev) => {
              // Avoid duplicates (optimistic + WS push)
              if (prev.some((m) => m.id === data.message.id)) return prev;
              lastMessageCount.current = prev.length + 1;
              return [...prev, data.message];
            });
          }
          // Handle conversation blocked event
          if (data.type === 'conversation_blocked' && data.conversationId === conversationId) {
            setBlockedAt(new Date().toISOString());
          }
        } catch {
          // Ignore malformed WS messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        wsRef.current = null;

        // Start polling as fallback
        startPolling();

        // Reconnect with exponential backoff
        reconnectTimeout.current = setTimeout(() => {
          if (mountedRef.current) {
            reconnectDelay.current = Math.min(reconnectDelay.current * 2, 10000);
            connectWS();
          }
        }, reconnectDelay.current);
      };

      ws.onerror = () => {
        // onclose will fire after onerror, so we handle reconnect there
        ws.close();
      };
    } catch {
      // WS not available — use polling
      startPolling();
    }
  }, [user?.token, conversationId, stopPolling, startPolling]);

  // Initial load + WS connection
  useEffect(() => {
    mountedRef.current = true;
    setIsLoading(true);
    setMessages([]);
    setError(null);
    setIsConnected(false);
    setBlockedAt(null);

    if (conversationId) {
      fetchMessages();
      connectWS();
    } else {
      setIsLoading(false);
    }

    return () => {
      mountedRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      stopPolling();
    };
  }, [conversationId, fetchMessages, connectWS, stopPolling]);

  // Send a message via REST (optimistic update)
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId || !content.trim()) return;

      // Optimistic message
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: optimisticId,
        conversationId,
        senderId: user?.userId || '',
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        lastMessageCount.current = prev.length + 1;
        return [...prev, optimistic];
      });

      try {
        const res = await apiClient.post<ChatMessage>(`/messages/conversations/${conversationId}`, {
          content: content.trim(),
        });
        // Replace optimistic message with real one
        setMessages((prev) => prev.map((m) => (m.id === optimisticId ? res.data : m)));
      } catch {
        // Remove optimistic message on error
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== optimisticId);
          lastMessageCount.current = filtered.length;
          return filtered;
        });
        throw new Error('Error al enviar mensaje');
      }
    },
    [conversationId, user?.userId],
  );

  return { messages, sendMessage, isConnected, isLoading, error, blockedAt };
}
