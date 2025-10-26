// Supabase Realtime клиент - замена WebSocket сервера
// Использует Supabase Realtime Channels для real-time обновлений
import { supabase } from './supabase';
import { browser } from '$app/environment';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeMessage {
  type: 'room_update' | 'note_update' | 'participant_join' | 'participant_leave' | 
        'user_online' | 'user_offline' | 'participant_update' | 
        'invite_created' | 'invite_accepted' | 'invite_declined' | 'invite_revoked' | 
        'approval_request' | 'approval_response' | 'room_joined' | 'error' | 'pong' |
        'note_content_update' | 'note_saved' | 'cursor_update' | 'cursor_remove' |
        'editing_started' | 'editing_stopped' |
        'yjs_sync_request' | 'yjs_sync' | 'yjs_update';
  room_id?: string;
  data?: any;
  timestamp?: Date;
  user_id?: string;
}

type MessageHandler = (message: RealtimeMessage) => void;

class SupabaseRealtimeClient {
  private channels: Map<string, RealtimeChannel> = new Map();
  private messageHandlers: Map<string, MessageHandler[]> = new Map();
  private currentRoomId: string | null = null;
  private connectionRefCount = 0;
  private globalChannel: RealtimeChannel | null = null;
  private isGlobalConnected = false;

  constructor() {
    // Cleanup при закрытии страницы
    if (browser && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.cleanup();
      });
    }
  }

  /**
   * Глобальное подключение (для уведомлений вне комнат)
   */
  async connectGlobal(): Promise<boolean> {
    if (this.isGlobalConnected && this.globalChannel) {
      return true;
    }

    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[Realtime] No authenticated user');
        return false;
      }

      // Создаем глобальный канал для пользователя
      const channelName = `user:${user.id}`;
      this.globalChannel = supabase.channel(channelName);

      // Подписываемся на broadcast сообщения
      this.globalChannel
        .on('broadcast', { event: 'message' }, ({ payload }) => {
          this.handleMessage(payload as RealtimeMessage);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isGlobalConnected = true;
            console.log('[Realtime] Global connection established');
          } else if (status === 'CLOSED') {
            this.isGlobalConnected = false;
            console.log('[Realtime] Global connection closed');
          } else if (status === 'CHANNEL_ERROR') {
            this.isGlobalConnected = false;
            console.error('[Realtime] Global connection error');
          }
        });

      return true;
    } catch (error) {
      console.error('[Realtime] Error connecting globally:', error);
      return false;
    }
  }

  /**
   * Подключение к комнате
   */
  async connect(roomId: string): Promise<boolean> {
    // Если уже подключены к этой комнате
    if (this.currentRoomId === roomId && this.channels.has(roomId)) {
      this.connectionRefCount++;
      return true;
    }

    // Если подключаемся к новой комнате, отключаемся от старой
    if (this.currentRoomId && this.currentRoomId !== roomId) {
      await this.forceDisconnect();
    }

    try {
      // Получаем текущего пользователя
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('[Realtime] No authenticated user');
        return false;
      }

      this.currentRoomId = roomId;
      this.connectionRefCount = 1;

      // Создаем канал для комнаты
      const channelName = `room:${roomId}`;
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: user.id,
          },
          broadcast: {
            self: false, // Не получаем собственные сообщения обратно
          },
        },
      });

      // Подписываемся на broadcast сообщения
      channel
        .on('broadcast', { event: 'message' }, ({ payload }) => {
          this.handleMessage(payload as RealtimeMessage);
        })
        // Подписываемся на presence (кто онлайн)
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          console.log('[Realtime] Presence sync:', state);
          
          // Отправляем событие обновления онлайн пользователей
          const onlineUsers = Object.keys(state);
          this.handleMessage({
            type: 'user_online',
            room_id: roomId,
            data: { onlineUsers },
            timestamp: new Date()
          });
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('[Realtime] User joined:', key);
          this.handleMessage({
            type: 'participant_join',
            room_id: roomId,
            data: { userId: key, presences: newPresences },
            timestamp: new Date()
          });
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('[Realtime] User left:', key);
          this.handleMessage({
            type: 'participant_leave',
            room_id: roomId,
            data: { userId: key, presences: leftPresences },
            timestamp: new Date()
          });
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] Connected to room:', roomId);
            
            // Трекаем свой presence
            await channel.track({
              user_id: user.id,
              online_at: new Date().toISOString(),
            });

            // Отправляем событие успешного подключения
            this.handleMessage({
              type: 'room_joined',
              room_id: roomId,
              timestamp: new Date()
            });
          } else if (status === 'CLOSED') {
            console.log('[Realtime] Connection closed for room:', roomId);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[Realtime] Channel error for room:', roomId);
          }
        });

      this.channels.set(roomId, channel);
      return true;
    } catch (error) {
      console.error('[Realtime] Error connecting to room:', error);
      return false;
    }
  }

  /**
   * Отправка сообщения в комнату
   */
  async send(message: RealtimeMessage) {
    const roomId = message.room_id || this.currentRoomId;
    if (!roomId) {
      console.error('[Realtime] No room ID specified');
      return;
    }

    const channel = this.channels.get(roomId);
    if (!channel) {
      console.error('[Realtime] Channel not found for room:', roomId);
      return;
    }

    try {
      await channel.send({
        type: 'broadcast',
        event: 'message',
        payload: message,
      });
    } catch (error) {
      console.error('[Realtime] Error sending message:', error);
    }
  }

  /**
   * Обработка входящих сообщений
   */
  private handleMessage(message: RealtimeMessage) {
    // Вызываем обработчики для конкретного типа сообщения
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('[Realtime] Error in message handler:', error);
      }
    });

    // Вызываем общие обработчики
    const allHandlers = this.messageHandlers.get('*') || [];
    allHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('[Realtime] Error in general message handler:', error);
      }
    });
  }

  /**
   * Регистрация обработчика сообщений
   */
  public onMessage(type: string, handler: MessageHandler) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, []);
    }
    this.messageHandlers.get(type)!.push(handler);
  }

  /**
   * Удаление обработчика сообщений
   */
  public offMessage(type: string, handler: MessageHandler) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Отключение от комнаты
   */
  public async disconnect() {
    this.connectionRefCount = Math.max(0, this.connectionRefCount - 1);
    
    if (this.connectionRefCount === 0) {
      await this.forceDisconnect();
    }
  }

  /**
   * Принудительное отключение
   */
  private async forceDisconnect() {
    if (this.currentRoomId) {
      const channel = this.channels.get(this.currentRoomId);
      if (channel) {
        await supabase.removeChannel(channel);
        this.channels.delete(this.currentRoomId);
      }
    }

    this.currentRoomId = null;
    this.connectionRefCount = 0;
    this.messageHandlers.clear();
  }

  /**
   * Очистка всех подключений
   */
  private async cleanup() {
    // Отключаем глобальный канал
    if (this.globalChannel) {
      await supabase.removeChannel(this.globalChannel);
      this.globalChannel = null;
      this.isGlobalConnected = false;
    }

    // Отключаем все каналы комнат
    for (const [roomId, channel] of this.channels.entries()) {
      await supabase.removeChannel(channel);
      this.channels.delete(roomId);
    }

    this.messageHandlers.clear();
    this.currentRoomId = null;
    this.connectionRefCount = 0;
  }

  /**
   * Проверка подключения
   */
  public isConnected(): boolean {
    if (!this.currentRoomId) {
      return false;
    }
    const channel = this.channels.get(this.currentRoomId);
    return channel !== undefined;
  }

  /**
   * Получение текущей комнаты
   */
  public getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }
}

// Создаем глобальный экземпляр клиента только в браузере
export const realtimeClient = browser ? new SupabaseRealtimeClient() : null as any;

// Утилиты для работы с Realtime (совместимость с WebSocket API)
export function useRealtime(roomId: string) {
  const connect = async () => {
    return await realtimeClient.connect(roomId);
  };

  const disconnect = async () => {
    await realtimeClient.disconnect();
  };

  const onNoteUpdate = (handler: MessageHandler) => {
    realtimeClient.onMessage('note_update', handler);
  };

  const onParticipantUpdate = (handler: MessageHandler) => {
    realtimeClient.onMessage('participant_update', handler);
  };

  const onUserOnline = (handler: MessageHandler) => {
    realtimeClient.onMessage('user_online', handler);
  };

  const onUserOffline = (handler: MessageHandler) => {
    realtimeClient.onMessage('user_offline', handler);
  };

  const onInviteUpdate = (handler: MessageHandler) => {
    realtimeClient.onMessage('invite_created', handler);
    realtimeClient.onMessage('invite_accepted', handler);
    realtimeClient.onMessage('invite_declined', handler);
    realtimeClient.onMessage('invite_revoked', handler);
  };

  const onApprovalRequest = (handler: MessageHandler) => {
    realtimeClient.onMessage('approval_request', handler);
  };

  const onApprovalResponse = (handler: MessageHandler) => {
    realtimeClient.onMessage('approval_response', handler);
  };

  const onError = (handler: MessageHandler) => {
    realtimeClient.onMessage('error', handler);
  };

  const onNoteContentUpdate = (handler: MessageHandler) => {
    realtimeClient.onMessage('note_content_update', handler);
  };

  const onNoteSaved = (handler: MessageHandler) => {
    realtimeClient.onMessage('note_saved', handler);
  };

  const onCursorUpdate = (handler: MessageHandler) => {
    realtimeClient.onMessage('cursor_update', handler);
  };

  const sendNoteContentUpdate = async (noteId: string, content: string, title?: string) => {
    if (!realtimeClient.isConnected()) {
      return;
    }

    await realtimeClient.send({
      type: 'note_content_update',
      room_id: roomId,
      data: {
        noteId,
        content,
        title
      },
      timestamp: new Date()
    });
  };

  const sendCursorUpdate = async (
    noteId: string,
    position: { line: number; column: number } | null,
    selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null
  ) => {
    if (!realtimeClient.isConnected()) {
      return;
    }

    await realtimeClient.send({
      type: 'cursor_update',
      room_id: roomId,
      data: {
        noteId,
        position,
        selection
      },
      timestamp: new Date()
    });
  };

  const onEditingStarted = (handler: MessageHandler) => {
    realtimeClient.onMessage('editing_started', handler);
  };

  const onEditingStopped = (handler: MessageHandler) => {
    realtimeClient.onMessage('editing_stopped', handler);
  };

  const sendEditingStarted = async (noteId: string) => {
    if (!realtimeClient.isConnected()) {
      return;
    }

    await realtimeClient.send({
      type: 'editing_started',
      room_id: roomId,
      data: {
        noteId
      },
      timestamp: new Date()
    });
  };

  const sendEditingStopped = async (noteId: string) => {
    if (!realtimeClient.isConnected()) {
      return;
    }

    await realtimeClient.send({
      type: 'editing_stopped',
      room_id: roomId,
      data: {
        noteId
      },
      timestamp: new Date()
    });
  };

  const onMessage = (type: string, handler: MessageHandler) => {
    realtimeClient.onMessage(type, handler);
  };

  const offMessage = (type: string, handler: MessageHandler) => {
    realtimeClient.offMessage(type, handler);
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
    isConnected: realtimeClient.isConnected.bind(realtimeClient)
  };
}

