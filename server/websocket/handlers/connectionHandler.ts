// Обработчик подключений WebSocket
import type { WebSocket } from 'ws';
import { updateUserOnlineStatus } from '../../../src/lib/roomParticipants.js';
import type { ConnectedUser, WebSocketMessage } from '../types.js';
import { authenticateToken, checkRoomAccess } from '../auth.js';

export class ConnectionHandler {
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  private roomSubscriptions: Map<string, Set<string>> = new Map();
  private globalConnections: Map<string, WebSocket> = new Map(); // Глобальные подключения пользователей

  /**
   * Регистрация глобального подключения пользователя (без привязки к комнате)
   */
  registerGlobalConnection(userId: string, ws: WebSocket): void {
    console.log(`[ConnectionHandler] Registering global connection for user ${userId}`);
    this.globalConnections.set(userId, ws);
    console.log(`[ConnectionHandler] Total global connections: ${this.globalConnections.size}`);
    console.log(`[ConnectionHandler] Active global users:`, Array.from(this.globalConnections.keys()));
  }

  /**
   * Удаление глобального подключения пользователя
   */
  unregisterGlobalConnection(userId: string): void {
    console.log(`[ConnectionHandler] Unregistering global connection for user ${userId}`);
    this.globalConnections.delete(userId);
  }

  /**
   * Обработка присоединения к комнате
   */
  async handleJoinRoom(
    ws: WebSocket,
    userId: string,
    roomId: string,
    userInfo?: { username?: string; fullName?: string; avatarUrl?: string }
  ): Promise<void> {
    const connectionId = `${userId}-${roomId}`;

    console.log(`[ConnectionHandler] Handling join room: userId=${userId}, roomId=${roomId}`);

    // Регистрируем глобальное подключение если еще не зарегистрировано
    if (!this.globalConnections.has(userId)) {
      this.registerGlobalConnection(userId, ws);
    }

    // Проверяем доступ к комнате
    const hasAccess = await checkRoomAccess(userId, roomId);
    if (!hasAccess) {
      console.error(`[ConnectionHandler] Access denied for user ${userId} to room ${roomId}`);
      this.sendError(ws, 'Access denied to this room');
      return;
    }

    // Проверяем, есть ли уже активное подключение
    const existingConnection = this.connectedUsers.get(connectionId);
    if (existingConnection && existingConnection.ws !== ws) {
      console.log(`[ConnectionHandler] Closing old connection for user ${userId} in room ${roomId}`);
      
      // Закрываем старое соединение
      try {
        if (existingConnection.ws.readyState === 1) { // WebSocket.OPEN
          existingConnection.ws.close(1000, 'New connection established');
        }
      } catch (error) {
        console.error('[ConnectionHandler] Error closing old connection:', error);
      }
      
      // Удаляем старое подключение из подписок
      const roomSubs = this.roomSubscriptions.get(roomId);
      if (roomSubs) {
        roomSubs.delete(connectionId);
      }
    } else if (existingConnection && existingConnection.ws === ws) {
      console.log(`[ConnectionHandler] User ${userId} already connected to room ${roomId} with same WebSocket`);
      // Пользователь уже подключен с этим же WebSocket - просто отправляем подтверждение
      const onlineUsers = this.getConnectedUsers(roomId)
        .map(user => ({
          userId: user.userId,
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl
        }));
      
      this.sendMessage(ws, {
        type: 'room_joined',
        room_id: roomId,
        data: { 
          message: 'Already joined room',
          onlineUsers: onlineUsers,
          currentUserId: userId
        },
        timestamp: new Date()
      });
      return;
    }

    // Сохраняем информацию о подключении
    this.connectedUsers.set(connectionId, {
      userId,
      roomId,
      ws,
      lastSeen: new Date(),
      username: userInfo?.username,
      fullName: userInfo?.fullName,
      avatarUrl: userInfo?.avatarUrl
    });

    // Добавляем в подписки комнаты
    if (!this.roomSubscriptions.has(roomId)) {
      this.roomSubscriptions.set(roomId, new Set());
    }
    this.roomSubscriptions.get(roomId)!.add(connectionId);

    console.log(`[ConnectionHandler] User ${userId} joined room ${roomId}`);

    // Обновляем статус онлайн в базе данных ПЕРЕД отправкой подтверждения
    // Это автоматически создаст запись участника, если её еще нет
    const statusResult = await this.updateOnlineStatus(userId, roomId, true);
    
    // Проверяем успешность операции
    if (statusResult.error) {
      console.error(`[ConnectionHandler] Failed to update online status for user ${userId}:`, statusResult.error);
      // Более информативная ошибка для случая, когда пользователь не является участником
      const errorMessage = statusResult.error.includes('not a participant')
        ? 'You are not a participant in this room'
        : 'Failed to join room';
      this.sendError(ws, errorMessage);
      return;
    }

    // Получаем список ВСЕХ текущих онлайн пользователей в комнате
    const onlineUsers = this.getConnectedUsers(roomId)
      .map(user => ({
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl
      }));

    console.log(`[ConnectionHandler] Online users in room ${roomId}:`, onlineUsers.map(u => u.userId));

    // Отправляем подтверждение с полным списком онлайн пользователей (включая текущего)
    this.sendMessage(ws, {
      type: 'room_joined',
      room_id: roomId,
      data: { 
        message: 'Successfully joined room',
        onlineUsers: onlineUsers,
        currentUserId: userId // Добавляем ID текущего пользователя для явной идентификации
      },
      timestamp: new Date()
    });

    // Уведомляем других участников о новом пользователе (исключая текущего)
    this.broadcastToRoom(roomId, {
      type: 'user_online',
      room_id: roomId,
      data: {
        userId,
        username: userInfo?.username,
        fullName: userInfo?.fullName,
        avatarUrl: userInfo?.avatarUrl
      },
      timestamp: new Date()
    }, userId);

    console.log(`[ConnectionHandler] User ${userId} successfully joined room ${roomId} and other participants notified`);
  }

  /**
   * Обработка выхода из комнаты
   */
  async handleLeaveRoom(ws: WebSocket, userId: string, roomId: string): Promise<void> {
    const connectionId = `${userId}-${roomId}`;

    // Получаем информацию о пользователе перед удалением
    const userInfo = this.connectedUsers.get(connectionId);

    // Удаляем из подключений
    this.connectedUsers.delete(connectionId);

    // Удаляем из подписок комнаты
    const roomSubs = this.roomSubscriptions.get(roomId);
    if (roomSubs) {
      roomSubs.delete(connectionId);
      if (roomSubs.size === 0) {
        this.roomSubscriptions.delete(roomId);
      }
    }

    // Обновляем статус оффлайн в базе данных
    await this.updateOnlineStatus(userId, roomId, false);

    // Уведомляем других участников
    this.broadcastToRoom(roomId, {
      type: 'user_offline',
      room_id: roomId,
      data: {
        userId,
        username: userInfo?.username,
        fullName: userInfo?.fullName
      },
      timestamp: new Date()
    });

    console.log(`[ConnectionHandler] User ${userId} left room ${roomId}`);
  }

  /**
   * Обработка отключения WebSocket
   */
  async handleDisconnection(ws: WebSocket): Promise<void> {
    // Находим и удаляем все подключения для этого WebSocket
    const connectionsToRemove: Array<{ userId: string; roomId: string }> = [];

    for (const [connectionId, user] of this.connectedUsers.entries()) {
      if (user.ws === ws) {
        // ВАЖНО: Используем userId и roomId из объекта user, а не парсим connectionId
        // потому что userId содержит дефисы и split('-') даст неправильный результат
        connectionsToRemove.push({ 
          userId: user.userId, 
          roomId: user.roomId 
        });
      }
    }

    // Удаляем все найденные подключения
    for (const { userId, roomId } of connectionsToRemove) {
      await this.handleLeaveRoom(ws, userId, roomId);
    }

    // Удаляем глобальные подключения для этого WebSocket
    for (const [userId, globalWs] of this.globalConnections.entries()) {
      if (globalWs === ws) {
        this.unregisterGlobalConnection(userId);
      }
    }
  }

  /**
   * Обработка пинга для поддержания соединения
   */
  handlePing(ws: WebSocket, userId: string, roomId: string): void {
    const connectionId = `${userId}-${roomId}`;
    const user = this.connectedUsers.get(connectionId);

    if (user) {
      user.lastSeen = new Date();
      this.sendMessage(ws, {
        type: 'pong',
        timestamp: new Date()
      });
    }
  }

  /**
   * Отправка сообщения в комнату
   */
  broadcastToRoom(roomId: string, message: WebSocketMessage, excludeUserId?: string): void {
    const roomSubs = this.roomSubscriptions.get(roomId);
    if (!roomSubs) return;

    const messageStr = JSON.stringify(message);

    for (const connectionId of roomSubs) {
      const user = this.connectedUsers.get(connectionId);
      
      // Пропускаем отправителя если указан excludeUserId
      if (excludeUserId && user?.userId === excludeUserId) {
        continue;
      }

      if (user && user.ws.readyState === 1) { // WebSocket.OPEN
        try {
          user.ws.send(messageStr);
        } catch (error) {
          console.error('[ConnectionHandler] Error sending message:', error);
          // Удаляем неактивное подключение
          this.connectedUsers.delete(connectionId);
          roomSubs.delete(connectionId);
        }
      }
    }
  }

  /**
   * Отправка сообщения конкретному пользователю
   * Сначала пытается отправить через подключение к комнате, 
   * если не получается - через глобальное подключение
   */
  sendToUser(userId: string, roomId: string, message: WebSocketMessage): void {
    const connectionId = `${userId}-${roomId}`;
    const user = this.connectedUsers.get(connectionId);

    // Пытаемся отправить через подключение к комнате
    if (user && user.ws.readyState === 1) {
      try {
        user.ws.send(JSON.stringify(message));
        return;
      } catch (error) {
        console.error('[ConnectionHandler] Error sending message to user via room connection:', error);
      }
    }

    // Если не получилось через комнату, пытаемся через глобальное подключение
    const globalWs = this.globalConnections.get(userId);
    if (globalWs && globalWs.readyState === 1) {
      try {
        globalWs.send(JSON.stringify(message));
      } catch (error) {
        console.error('[ConnectionHandler] Error sending message to user via global connection:', error);
      }
    }
  }

  /**
   * Отправка сообщения в WebSocket
   */
  private sendMessage(ws: WebSocket, message: WebSocketMessage): void {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('[ConnectionHandler] Error sending message:', error);
      }
    }
  }

  /**
   * Отправка ошибки в WebSocket
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendMessage(ws, {
      type: 'error',
      data: { error },
      timestamp: new Date()
    } as any);
  }

  /**
   * Обновление статуса онлайн в базе данных
   */
  private async updateOnlineStatus(userId: string, roomId: string, isOnline: boolean): Promise<{ error?: string; participant?: any }> {
    try {
      const result = await updateUserOnlineStatus(userId, roomId, isOnline);
      if (result.error) {
        console.error('[ConnectionHandler] Error updating online status:', result.error);
      }
      return result;
    } catch (error) {
      console.error('[ConnectionHandler] Error updating online status:', error);
      return { error: 'Failed to update online status' };
    }
  }

  /**
   * Получение количества подключенных пользователей в комнате
   */
  getConnectedUsersCount(roomId: string): number {
    const roomSubs = this.roomSubscriptions.get(roomId);
    return roomSubs ? roomSubs.size : 0;
  }

  /**
   * Получение списка подключенных пользователей в комнате
   */
  getConnectedUsers(roomId: string): ConnectedUser[] {
    const roomSubs = this.roomSubscriptions.get(roomId);
    if (!roomSubs) return [];

    const users: ConnectedUser[] = [];
    for (const connectionId of roomSubs) {
      const user = this.connectedUsers.get(connectionId);
      if (user) {
        users.push(user);
      }
    }
    return users;
  }

  /**
   * Проверка, подключен ли пользователь
   */
  isUserConnected(userId: string, roomId: string): boolean {
    const connectionId = `${userId}-${roomId}`;
    return this.connectedUsers.has(connectionId);
  }

  /**
   * Получение списка всех активных комнат
   */
  getActiveRoomIds(): string[] {
    return Array.from(this.roomSubscriptions.keys());
  }

  /**
   * Получение всех подключенных пользователей
   */
  getAllConnectedUsers(): ConnectedUser[] {
    return Array.from(this.connectedUsers.values());
  }
}

