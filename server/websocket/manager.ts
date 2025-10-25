// Менеджер WebSocket - главный класс для управления WebSocket соединениями
import type { WebSocket } from 'ws';
import { WebSocketServer } from 'ws';
import { authenticateToken } from './auth.js';
import { ConnectionHandler } from './handlers/connectionHandler.js';
import { InviteHandler } from './handlers/inviteHandler.js';
import { OnlineStatusHandler } from './handlers/onlineStatusHandler.js';
import { NoteContentHandler } from './handlers/noteContentHandler.js';
import { DiffSyncHandler } from './handlers/diffSyncHandler.js';
import type { WebSocketMessage } from './types.js';

export class WebSocketManager {
  private wss: WebSocketServer;
  private connectionHandler: ConnectionHandler;
  private inviteHandler: InviteHandler;
  private onlineStatusHandler: OnlineStatusHandler;
  private noteContentHandler: NoteContentHandler;
  private diffSyncHandler: DiffSyncHandler;

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    this.connectionHandler = new ConnectionHandler();
    this.inviteHandler = new InviteHandler(this.connectionHandler);
    this.onlineStatusHandler = new OnlineStatusHandler(this.connectionHandler);
    this.noteContentHandler = new NoteContentHandler(this.connectionHandler);
    this.diffSyncHandler = new DiffSyncHandler(this.connectionHandler);
    
    this.setupWebSocketServer();
    console.log('[WebSocketManager] Initialized');
  }

  /**
   * Настройка WebSocket сервера
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', async (ws: WebSocket, req) => {
      console.log('[WebSocketManager] New WebSocket connection');

      // Получаем токен из URL параметров
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        this.sendError(ws, 'Authentication token required');
        ws.close();
        return;
      }

      // Аутентифицируем пользователя
      const authResult = await authenticateToken(token);
      if (!authResult.isValid || !authResult.user) {
        this.sendError(ws, authResult.error || 'Authentication failed');
        ws.close();
        return;
      }

      const userId = authResult.user.id;
      console.log(`[WebSocketManager] User ${userId} authenticated`);

      // Регистрируем глобальное подключение для пользователя
      this.connectionHandler.registerGlobalConnection(userId, ws);

      // Обработка сообщений
      ws.on('message', async (data) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message, userId, authResult.user!);
        } catch (error) {
          console.error('[WebSocketManager] Error parsing message:', error);
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Обработка закрытия соединения
      ws.on('close', async () => {
        console.log(`[WebSocketManager] User ${userId} disconnected`);
        await this.connectionHandler.handleDisconnection(ws);
      });

      // Обработка ошибок
      ws.on('error', async (error) => {
        console.error('[WebSocketManager] WebSocket error:', error);
        await this.connectionHandler.handleDisconnection(ws);
      });
    });

    console.log('[WebSocketManager] WebSocket server ready');
  }

  /**
   * Обработка входящих сообщений
   */
  private async handleMessage(
    ws: WebSocket,
    message: WebSocketMessage,
    userId: string,
    user: any
  ): Promise<void> {
    const { type, room_id } = message;

    try {
      switch (type) {
        case 'join_room':
          if (room_id) {
            await this.connectionHandler.handleJoinRoom(ws, userId, room_id, {
              username: user.username,
              fullName: user.fullName,
              avatarUrl: user.avatarUrl
            });
          } else {
            this.sendError(ws, 'Room ID is required');
          }
          break;

        case 'leave_room':
          if (room_id) {
            await this.connectionHandler.handleLeaveRoom(ws, userId, room_id);
          } else {
            this.sendError(ws, 'Room ID is required');
          }
          break;

        case 'ping':
          if (room_id) {
            this.connectionHandler.handlePing(ws, userId, room_id);
          }
          break;

        case 'update_online_status':
          if (room_id) {
            await this.onlineStatusHandler.notifyUserOnline(room_id, userId);
          }
          break;

        case 'note_content_update':
          if (room_id && message.data?.noteId) {
            await this.noteContentHandler.handleNoteContentUpdate(
              ws,
              userId,
              room_id,
              message.data.noteId,
              message.data.content || '',
              message.data.title
            );
          } else {
            this.sendError(ws, 'Note ID and room ID are required');
          }
          break;

        // Yjs синхронизация - запрос начального состояния
        case 'yjs_sync_request':
          if (room_id && message.data?.noteId && message.data?.stateVector) {
            await this.diffSyncHandler.handleYjsSyncRequest(
              ws,
              userId,
              room_id,
              {
                noteId: message.data.noteId,
                stateVector: message.data.stateVector
              }
            );
          } else {
            this.sendError(ws, 'Note ID, room ID and state vector are required');
          }
          break;

        // Yjs синхронизация - обновление от клиента
        case 'yjs_update':
          if (room_id && message.data?.noteId && message.data?.update) {
            await this.diffSyncHandler.handleYjsUpdate(
              ws,
              userId,
              room_id,
              {
                noteId: message.data.noteId,
                update: message.data.update
              }
            );
          } else {
            this.sendError(ws, 'Note ID, room ID and update are required');
          }
          break;

        case 'cursor_update':
          if (room_id && message.data?.noteId) {
            this.diffSyncHandler.handleCursorUpdate(
              ws,
              userId,
              room_id,
              {
                noteId: message.data.noteId,
                username: user.username,
                avatarUrl: user.avatarUrl,
                position: message.data.position || 0,
                selection: message.data.selection
              }
            );
          }
          break;

        case 'cursor_remove':
          if (room_id && message.data?.noteId) {
            this.diffSyncHandler.handleCursorRemove(
              ws,
              userId,
              room_id,
              {
                noteId: message.data.noteId
              }
            );
          }
          break;


        case 'editing_started':
          if (room_id && message.data?.noteId) {
            this.noteContentHandler.handleEditingStarted(
              userId,
              room_id,
              message.data.noteId,
              user.username
            );
          }
          break;

        case 'editing_stopped':
          if (room_id && message.data?.noteId) {
            this.noteContentHandler.handleEditingStopped(
              userId,
              room_id,
              message.data.noteId
            );
          }
          break;

        default:
          this.sendError(ws, 'Unknown message type');
      }
    } catch (error) {
      console.error('[WebSocketManager] Error handling message:', error);
      this.sendError(ws, 'Internal server error');
    }
  }

  /**
   * Отправка ошибки клиенту
   */
  private sendError(ws: WebSocket, error: string): void {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(JSON.stringify({
          type: 'error',
          data: { error },
          timestamp: new Date()
        }));
      } catch (err) {
        console.error('[WebSocketManager] Error sending error message:', err);
      }
    }
  }

  // Публичные методы для использования в других частях приложения

  /**
   * Отправка уведомления о новом приглашении
   */
  public notifyInviteCreated(roomId: string, invite: any): void {
    this.inviteHandler.notifyInviteCreated(roomId, invite);
  }

  /**
   * Отправка уведомления о заявке на вступление
   */
  public notifyApprovalRequest(roomId: string, invite: any): void {
    this.inviteHandler.notifyApprovalRequest(roomId, invite);
  }

  /**
   * Отправка уведомления об ответе на заявку
   */
  public notifyApprovalResponse(
    roomId: string,
    inviteId: string,
    action: 'approved' | 'rejected',
    requesterId: string
  ): void {
    this.inviteHandler.notifyApprovalResponse(roomId, inviteId, action, requesterId);
  }

  /**
   * Отправка уведомления о принятом приглашении
   */
  public notifyInviteAccepted(roomId: string, invite: any, userId: string): void {
    this.inviteHandler.notifyInviteAccepted(roomId, invite, userId);
  }

  /**
   * Отправка уведомления об отклоненном приглашении
   */
  public notifyInviteDeclined(roomId: string, invite: any): void {
    this.inviteHandler.notifyInviteDeclined(roomId, invite);
  }

  /**
   * Отправка уведомления об отозванном приглашении
   */
  public notifyInviteRevoked(roomId: string, inviteId: string): void {
    this.inviteHandler.notifyInviteRevoked(roomId, inviteId);
  }

  /**
   * Отправка уведомления об обновлении участника
   */
  public notifyParticipantUpdate(roomId: string, participant: any, action: string): void {
    this.connectionHandler.broadcastToRoom(roomId, {
      type: 'participant_update',
      room_id: roomId,
      data: {
        participant,
        action
      },
      timestamp: new Date()
    });
  }

  /**
   * Отправка уведомления об удалении участника
   */
  public notifyParticipantRemoved(roomId: string, userId: string): void {
    // Отправляем уведомление конкретному пользователю
    this.connectionHandler.sendToUser(userId, roomId, {
      type: 'participant_removed',
      room_id: roomId,
      data: {
        userId
      },
      timestamp: new Date()
    });
    
    // Также отправляем всем остальным в комнате для обновления списка участников
    this.connectionHandler.broadcastToRoom(roomId, {
      type: 'participant_removed',
      room_id: roomId,
      data: {
        userId
      },
      timestamp: new Date()
    }, userId); // Исключаем удаленного пользователя из broadcast
  }

  /**
   * Отправка уведомления об обновлении заметки
   */
  public notifyNoteUpdate(roomId: string, note: any, action: string, updatedBy: string): void {
    this.connectionHandler.broadcastToRoom(roomId, {
      type: 'note_update',
      room_id: roomId,
      data: {
        note,
        action,
        updated_by: updatedBy
      },
      timestamp: new Date()
    });
  }

  /**
   * Получение количества подключенных пользователей в комнате
   */
  public getConnectedUsersCount(roomId: string): number {
    return this.connectionHandler.getConnectedUsersCount(roomId);
  }

  /**
   * Получение списка онлайн пользователей
   */
  public async getOnlineUsers(roomId: string): Promise<any[]> {
    return await this.onlineStatusHandler.getOnlineUsers(roomId);
  }

  /**
   * Остановка WebSocket менеджера
   */
  public async shutdown(): Promise<void> {
    console.log('[WebSocketManager] Shutting down...');
    this.onlineStatusHandler.stopHeartbeat();
    await this.noteContentHandler.shutdown();
    await this.diffSyncHandler.shutdown();
    this.wss.close();
  }
}

