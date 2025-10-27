import { env } from '$env/dynamic/public';

export type NotificationType = 
  | 'invite:created'
  | 'invite:accepted'
  | 'approval:request'
  | 'approval:response'
  | 'participant:update'
  | 'ownership:transfer';

export interface NotificationMessage {
  type: NotificationType;
  roomId: string;
  data: any;
  timestamp: number;
}

type NotificationHandler = (message: NotificationMessage) => void;

class NotificationsClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private handlers = new Map<NotificationType, Set<NotificationHandler>>();
  private subscribedRooms = new Set<string>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private isIntentionalClose = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
    }
  }

  private connect() {
    const wsUrl = env.PUBLIC_NOTIFICATIONS_WS_URL || 'ws://localhost:3001';
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Переподписываемся на все комнаты после переподключения
        this.subscribedRooms.forEach(roomId => {
          this.subscribeToRoom(roomId);
        });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type === 'subscribed') {
            return;
          }
          
          // Вызываем обработчики для этого типа уведомления
          const handlers = this.handlers.get(message.type);
          if (handlers) {
            handlers.forEach(handler => {
              try {
                handler(message);
              } catch (error) {
                // Handler error
              }
            });
          }
        } catch (error) {
          // Error parsing message
        }
      };
      
      this.ws.onclose = () => {
        this.ws = null;
        
        // Автоматическое переподключение (если не было намеренного закрытия)
        if (!this.isIntentionalClose && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000);
          
          this.reconnectTimer = setTimeout(() => {
            this.connect();
          }, delay);
        }
      };
      
      this.ws.onerror = (error) => {
        // WebSocket error
      };
    } catch (error) {
      // Connection error
    }
  }

  // Подписка на комнату
  subscribeToRoom(roomId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.subscribedRooms.add(roomId);
      return;
    }
    
    this.subscribedRooms.add(roomId);
    
    this.ws.send(JSON.stringify({
      type: 'subscribe',
      roomId
    }));
  }

  // Отписка от комнаты
  unsubscribeFromRoom(roomId: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    
    this.subscribedRooms.delete(roomId);
    
    this.ws.send(JSON.stringify({
      type: 'unsubscribe',
      roomId
    }));
  }

  // Добавление обработчика уведомлений
  on(type: NotificationType, handler: NotificationHandler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
  }

  // Удаление обработчика
  off(type: NotificationType, handler: NotificationHandler) {
    const handlers = this.handlers.get(type);
    if (handlers) {
      handlers.delete(handler);
      
      if (handlers.size === 0) {
        this.handlers.delete(type);
      }
    }
  }

  // Закрытие соединения
  close() {
    this.isIntentionalClose = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.subscribedRooms.clear();
    this.handlers.clear();
  }

  // Проверка состояния соединения
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
let notificationsClient: NotificationsClient | null = null;

export function getNotificationsClient(): NotificationsClient {
  if (typeof window === 'undefined') {
    throw new Error('NotificationsClient can only be used in the browser');
  }
  
  if (!notificationsClient) {
    notificationsClient = new NotificationsClient();
  }
  
  return notificationsClient;
}

export function closeNotificationsClient() {
  if (notificationsClient) {
    notificationsClient.close();
    notificationsClient = null;
  }
}

