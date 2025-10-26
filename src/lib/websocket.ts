// WebSocket клиент для real-time обновлений
import { supabase } from './supabase';
import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';

// Функция для получения токена авторизации
async function getAuthToken(): Promise<string | null> {
	try {
		// Сначала пытаемся получить токен из localStorage (приоритет)
		if (browser && typeof window !== 'undefined') {
			const token = window.localStorage.getItem('session_token');
			if (token) {
				return token;
			}
		}
		
		// Fallback: пытаемся получить через Supabase
		const { data: { session } } = await supabase.auth.getSession();
		if (session?.access_token) {
			return session.access_token;
		}
		
		return null;
	} catch (error) {
		console.error('[getAuthToken] Error:', error);
		return null;
	}
}

interface WebSocketMessage {
  type: 'room_update' | 'note_update' | 'participant_join' | 'participant_leave' | 
        'user_online' | 'user_offline' | 'participant_update' | 
        'invite_created' | 'invite_accepted' | 'invite_declined' | 'invite_revoked' | 
        'approval_request' | 'approval_response' | 'room_joined' | 'error' | 'pong' |
        'note_content_update' | 'note_saved' | 'cursor_update';
  room_id?: string;
  data?: any;
  timestamp?: Date;
}

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isConnecting = false;
  private currentRoomId: string | null = null;
  private connectionRefCount = 0; // Счетчик активных подписчиков
  private joinRoomTimeout: ReturnType<typeof setTimeout> | null = null;
  private joinRoomAttempts = 0;
  private maxJoinRoomAttempts = 3;
  private isRoomJoined = false;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private lastPongTime: number = 0;
  private pingTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Автоматическое переподключение при потере соединения
    if (browser && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.forceDisconnect();
      });
    }
  }

  async connectGlobal(): Promise<boolean> {
    // Если уже есть подключение, просто возвращаем true
    if (this.isConnected()) {
      return true;
    }

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;

    try {
      // Получаем токен аутентификации
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Подключаемся к WebSocket серверу (глобально, без присоединения к комнате)
      const wsBaseUrl = env.PUBLIC_WS_URL || 'ws://localhost:3001';
      console.log('[WebSocket] PUBLIC_WS_URL from env:', env.PUBLIC_WS_URL);
      console.log('[WebSocket] Using wsBaseUrl:', wsBaseUrl);
      const wsUrl = `${wsBaseUrl}?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket connection'));
          return;
        }

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          console.log('[WebSocket] Global connection established');
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          console.log('[WebSocket] Global connection closed');
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.isConnecting = false;
          reject(error);
        };
      });
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      return false;
    }
  }

  async connect(roomId: string): Promise<boolean> {
    // Если уже подключены к этой же комнате, увеличиваем счетчик и ничего не делаем
    if (this.currentRoomId === roomId && this.isConnected() && this.isRoomJoined) {
      this.connectionRefCount++;
      return true;
    }

    // Если подключаемся к новой комнате, отключаемся от старой
    if (this.currentRoomId && this.currentRoomId !== roomId && this.ws) {
      this.forceDisconnect();
    }

    if (this.isConnecting) {
      return false;
    }

    this.isConnecting = true;
    this.currentRoomId = roomId;
    this.connectionRefCount = 1; // Устанавливаем начальное значение
    this.isRoomJoined = false;
    this.joinRoomAttempts = 0;

    try {
      // Получаем токен аутентификации
      const token = await getAuthToken();
      
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Подключаемся к WebSocket серверу
      const wsBaseUrl = env.PUBLIC_WS_URL || 'ws://localhost:3001';
      console.log('[WebSocket] PUBLIC_WS_URL from env:', env.PUBLIC_WS_URL);
      console.log('[WebSocket] Using wsBaseUrl:', wsBaseUrl);
      const wsUrl = `${wsBaseUrl}?token=${token}`;
      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        if (!this.ws) {
          reject(new Error('Failed to create WebSocket connection'));
          return;
        }

        // Обработчик подтверждения присоединения к комнате
        const handleRoomJoined = (message: WebSocketMessage) => {
          if (message.type === 'room_joined') {
            this.isRoomJoined = true;
            this.joinRoomAttempts = 0;
            
            // Очищаем таймаут
            if (this.joinRoomTimeout) {
              clearTimeout(this.joinRoomTimeout);
              this.joinRoomTimeout = null;
            }
            
            // Удаляем временный обработчик
            this.offMessage('room_joined', handleRoomJoined);
            
            // Запускаем периодический ping для поддержания соединения
            this.startPingInterval(roomId);
            
            resolve(true);
          }
        };

        // Обработчик ошибок
        const handleError = (message: WebSocketMessage) => {
          if (message.type === 'error') {
            console.error('[WebSocket] Server error:', message.data?.error);
            
            // Если ошибка связана с доступом к комнате, не переподключаемся
            if (message.data?.error?.includes('Access denied')) {
              this.offMessage('error', handleError);
              this.offMessage('room_joined', handleRoomJoined);
              reject(new Error(message.data.error));
            }
          }
        };

        // Регистрируем временные обработчики ДО открытия соединения
        this.onMessage('room_joined', handleRoomJoined);
        this.onMessage('error', handleError);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          
          // Присоединяемся к комнате с повторными попытками
          this.joinRoomWithRetry(roomId);
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Error parsing message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.isRoomJoined = false;
          
          // Очищаем таймаут
          if (this.joinRoomTimeout) {
            clearTimeout(this.joinRoomTimeout);
            this.joinRoomTimeout = null;
          }
          
          // Останавливаем ping интервал
          this.stopPingInterval();
          
          // Переподключаемся только если это не намеренное закрытие
          // Код 1000 = нормальное закрытие, 1001 = уход со страницы
          if (event.code !== 1000 && event.code !== 1001) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.isConnecting = false;
          reject(error);
        };
      });
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      return false;
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    if (!this.currentRoomId) {
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect(this.currentRoomId!);
    }, delay);
  }

  private joinRoomWithRetry(roomId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot join room - WebSocket not connected');
      return;
    }

    this.joinRoomAttempts++;
    
    this.send({
      type: 'join_room',
      room_id: roomId
    });

    // Устанавливаем таймаут для повторной попытки
    if (this.joinRoomTimeout) {
      clearTimeout(this.joinRoomTimeout);
    }

    this.joinRoomTimeout = setTimeout(() => {
      if (!this.isRoomJoined && this.joinRoomAttempts < this.maxJoinRoomAttempts) {
        this.joinRoomWithRetry(roomId);
      } else if (!this.isRoomJoined) {
        console.error(`[WebSocket] Failed to join room after ${this.maxJoinRoomAttempts} attempts`);
        // Пробуем переподключиться полностью
        this.attemptReconnect();
      }
    }, 3000); // 3 секунды таймаут для подтверждения
  }

  private joinRoom(roomId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.send({
      type: 'join_room',
      room_id: roomId
    });
  }

  private leaveRoom(roomId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    this.send({
      type: 'leave_room',
      room_id: roomId
    });
  }

  public send(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
    }
  }

  private handleMessage(message: WebSocketMessage) {
    // Обработка pong сообщений
    if (message.type === 'pong') {
      this.lastPongTime = Date.now();
      if (this.pingTimeout) {
        clearTimeout(this.pingTimeout);
        this.pingTimeout = null;
      }
      return; // Pong не нужно распространять на другие обработчики
    }

    // Вызываем обработчики для конкретного типа сообщения
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });

    // Вызываем общие обработчики
    const allHandlers = this.messageHandlers.get('*') || [];
    allHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in general message handler:', error);
      }
    });
  }

  private startPingInterval(roomId: string) {
    // Останавливаем предыдущий интервал если он был
    this.stopPingInterval();

    this.lastPongTime = Date.now();

    // Отправляем ping каждые 30 секунд
    this.pingInterval = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        this.stopPingInterval();
        return;
      }

      // Отправляем ping
      this.send({
        type: 'ping',
        room_id: roomId
      });

      // Устанавливаем таймаут для pong - если не получили ответ за 10 секунд, переподключаемся
      this.pingTimeout = setTimeout(() => {
        const timeSinceLastPong = Date.now() - this.lastPongTime;
        if (timeSinceLastPong > 10000) {
          this.stopPingInterval();
          this.attemptReconnect();
        }
      }, 10000);
    }, 30000);
  }

  private stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pingTimeout) {
      clearTimeout(this.pingTimeout);
      this.pingTimeout = null;
    }
  }

  // Публичные методы
  public onMessage(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  public offMessage(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  public disconnect() {
    // Уменьшаем счетчик подписчиков
    this.connectionRefCount = Math.max(0, this.connectionRefCount - 1);
    
    // Отключаемся только если больше нет подписчиков
    if (this.connectionRefCount === 0) {
      this.forceDisconnect();
    }
  }

  private forceDisconnect() {
    // Очищаем таймаут присоединения к комнате
    if (this.joinRoomTimeout) {
      clearTimeout(this.joinRoomTimeout);
      this.joinRoomTimeout = null;
    }

    // Останавливаем ping интервал
    this.stopPingInterval();

    if (this.currentRoomId && this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.leaveRoom(this.currentRoomId);
    }

    if (this.ws) {
      // Удаляем обработчики, чтобы не получать события после закрытия
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.onmessage = null;
      
      // Закрываем соединение если оно открыто
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }

    this.currentRoomId = null;
    this.reconnectAttempts = 0;
    this.isConnecting = false;
    this.connectionRefCount = 0;
    this.joinRoomAttempts = 0;
    this.isRoomJoined = false;
    this.messageHandlers.clear();
  }

  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
}

// Создаем глобальный экземпляр WebSocket клиента только в браузере
export const websocketClient = browser ? new WebSocketClient() : null as any;

// Утилиты для работы с WebSocket
export function useWebSocket(roomId: string) {
  const connect = async () => {
    return await websocketClient.connect(roomId);
  };

  const disconnect = () => {
    websocketClient.disconnect();
  };

  const onNoteUpdate = (handler: MessageHandler) => {
    websocketClient.onMessage('note_update', handler);
  };

  const onParticipantUpdate = (handler: MessageHandler) => {
    websocketClient.onMessage('participant_update', handler);
  };

  const onUserOnline = (handler: MessageHandler) => {
    websocketClient.onMessage('user_online', handler);
  };

  const onUserOffline = (handler: MessageHandler) => {
    websocketClient.onMessage('user_offline', handler);
  };

  const onInviteUpdate = (handler: MessageHandler) => {
    websocketClient.onMessage('invite_created', handler);
    websocketClient.onMessage('invite_accepted', handler);
    websocketClient.onMessage('invite_declined', handler);
    websocketClient.onMessage('invite_revoked', handler);
  };

  const onApprovalRequest = (handler: MessageHandler) => {
    websocketClient.onMessage('approval_request', handler);
  };

  const onApprovalResponse = (handler: MessageHandler) => {
    websocketClient.onMessage('approval_response', handler);
  };

  const onError = (handler: MessageHandler) => {
    websocketClient.onMessage('error', handler);
  };

  const onNoteContentUpdate = (handler: MessageHandler) => {
    websocketClient.onMessage('note_content_update', handler);
  };

  const onNoteSaved = (handler: MessageHandler) => {
    websocketClient.onMessage('note_saved', handler);
  };

  const onCursorUpdate = (handler: MessageHandler) => {
    websocketClient.onMessage('cursor_update', handler);
  };

  const sendNoteContentUpdate = (noteId: string, content: string, title?: string) => {
    if (!websocketClient.isConnected()) {
      return;
    }

    websocketClient.send({
      type: 'note_content_update',
      room_id: roomId,
      data: {
        noteId,
        content,
        title
      }
    });
  };

  const sendCursorUpdate = (
    noteId: string,
    position: { line: number; column: number } | null,
    selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null
  ) => {
    if (!websocketClient.isConnected()) {
      return;
    }

    websocketClient.send({
      type: 'cursor_update',
      room_id: roomId,
      data: {
        noteId,
        position,
        selection
      }
    });
  };

  const onEditingStarted = (handler: MessageHandler) => {
    websocketClient.onMessage('editing_started', handler);
  };

  const onEditingStopped = (handler: MessageHandler) => {
    websocketClient.onMessage('editing_stopped', handler);
  };

  const sendEditingStarted = (noteId: string) => {
    if (!websocketClient.isConnected()) {
      return;
    }

    websocketClient.send({
      type: 'editing_started',
      room_id: roomId,
      data: {
        noteId
      }
    });
  };

  const sendEditingStopped = (noteId: string) => {
    if (!websocketClient.isConnected()) {
      return;
    }

    websocketClient.send({
      type: 'editing_stopped',
      room_id: roomId,
      data: {
        noteId
      }
    });
  };

  const onMessage = (type: string, handler: MessageHandler) => {
    websocketClient.onMessage(type, handler);
  };

  const offMessage = (type: string, handler: MessageHandler) => {
    websocketClient.offMessage(type, handler);
  };

  return {
    connect,
    disconnect,
    onNoteUpdate,
    onParticipantUpdate,
    onUserOnline,
    onUserOffline,
    onInviteUpdate,
    onApprovalRequest,
    onApprovalResponse,
    onError,
    onNoteContentUpdate,
    onNoteSaved,
    onCursorUpdate,
    onEditingStarted,
    onEditingStopped,
    sendNoteContentUpdate,
    sendCursorUpdate,
    sendEditingStarted,
    sendEditingStopped,
    onMessage,
    offMessage,
    isConnected: websocketClient.isConnected.bind(websocketClient)
  };
}
