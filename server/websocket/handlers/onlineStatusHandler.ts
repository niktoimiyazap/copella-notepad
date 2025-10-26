// Обработчик статуса онлайн пользователей
import { prisma } from '../../database/prisma.js';
import type { WebSocketMessage } from '../types.js';
import type { ConnectionHandler } from './connectionHandler.js';

export class OnlineStatusHandler {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 секунд
  private readonly OFFLINE_THRESHOLD = 60000; // 60 секунд

  constructor(private connectionHandler: ConnectionHandler) {
    this.initializeOnlineStatuses();
    this.startHeartbeat();
  }

  /**
   * Инициализация онлайн статусов при запуске сервера
   * Сбрасываем все статусы на offline
   */
  private async initializeOnlineStatuses(): Promise<void> {
    try {
      const result = await prisma.roomParticipant.updateMany({
        where: {
          isOnline: true
        },
        data: {
          isOnline: false,
          lastSeen: new Date()
        }
      });
      
      console.log(`[OnlineStatusHandler] Reset ${result.count} online statuses to offline on startup`);
    } catch (error) {
      console.error('[OnlineStatusHandler] Error initializing online statuses:', error);
    }
  }

  /**
   * Запуск heartbeat для проверки активности пользователей
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      this.checkInactiveConnections();
    }, this.HEARTBEAT_INTERVAL);

    console.log('[OnlineStatusHandler] Heartbeat started');
  }

  /**
   * Остановка heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
      console.log('[OnlineStatusHandler] Heartbeat stopped');
    }
  }

  /**
   * Проверка неактивных подключений
   */
  private async checkInactiveConnections(): Promise<void> {
    const now = new Date();
    const rooms = new Map<string, string[]>(); // roomId -> userIds[]

    // Собираем информацию о неактивных пользователях
    for (const roomId of this.getRoomIds()) {
      const users = this.connectionHandler.getConnectedUsers(roomId);
      const inactiveUsers: string[] = [];

      for (const user of users) {
        const timeSinceLastSeen = now.getTime() - user.lastSeen.getTime();
        if (timeSinceLastSeen > this.OFFLINE_THRESHOLD) {
          inactiveUsers.push(user.userId);
        }
      }

      if (inactiveUsers.length > 0) {
        rooms.set(roomId, inactiveUsers);
      }
    }

    // Обрабатываем неактивных пользователей
    for (const [roomId, userIds] of rooms.entries()) {
      for (const userId of userIds) {
        await this.handleUserInactive(userId, roomId);
      }
    }
  }

  /**
   * Обработка неактивного пользователя
   */
  private async handleUserInactive(userId: string, roomId: string): Promise<void> {
    try {
      // Обновляем статус в базе данных
      await prisma.roomParticipant.updateMany({
        where: {
          userId,
          roomId
        },
        data: {
          isOnline: false,
          lastSeen: new Date()
        }
      });

      // Уведомляем других участников
      this.notifyUserOffline(roomId, userId);

      console.log(`[OnlineStatusHandler] User ${userId} marked as inactive in room ${roomId}`);
    } catch (error) {
      console.error('[OnlineStatusHandler] Error handling inactive user:', error);
    }
  }

  /**
   * Уведомление об онлайн статусе пользователя
   */
  async notifyUserOnline(roomId: string, userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatarUrl: true
        }
      });

      if (!user) return;

      const message: WebSocketMessage = {
        type: 'user_online',
        room_id: roomId,
        data: {
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          avatarUrl: user.avatarUrl,
          timestamp: new Date()
        },
        timestamp: new Date()
      };

      this.connectionHandler.broadcastToRoom(roomId, message, userId);

      console.log(`[OnlineStatusHandler] User ${userId} is online in room ${roomId}`);
    } catch (error) {
      console.error('[OnlineStatusHandler] Error notifying user online:', error);
    }
  }

  /**
   * Уведомление об оффлайн статусе пользователя
   */
  async notifyUserOffline(roomId: string, userId: string): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          fullName: true
        }
      });

      if (!user) return;

      const message: WebSocketMessage = {
        type: 'user_offline',
        room_id: roomId,
        data: {
          userId: user.id,
          username: user.username,
          fullName: user.fullName,
          timestamp: new Date()
        },
        timestamp: new Date()
      };

      this.connectionHandler.broadcastToRoom(roomId, message);

      console.log(`[OnlineStatusHandler] User ${userId} is offline in room ${roomId}`);
    } catch (error) {
      console.error('[OnlineStatusHandler] Error notifying user offline:', error);
    }
  }

  /**
   * Получение списка онлайн пользователей в комнате
   * Возвращает только тех, кто действительно подключен через WebSocket
   */
  async getOnlineUsers(roomId: string): Promise<any[]> {
    try {
      // Получаем список реально подключенных пользователей из WebSocket
      const connectedUsers = this.connectionHandler.getConnectedUsers(roomId);
      const connectedUserIds = new Set(connectedUsers.map(u => u.userId));

      // Получаем участников из БД с фильтром по реально подключенным
      const participants = await prisma.roomParticipant.findMany({
        where: {
          roomId,
          userId: {
            in: Array.from(connectedUserIds)
          }
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true
            }
          }
        }
      });

      // Обновляем статус isOnline для всех подключенных пользователей в БД
      // (на случай если он был сброшен, но пользователь подключен)
      if (connectedUserIds.size > 0) {
        await prisma.roomParticipant.updateMany({
          where: {
            roomId,
            userId: {
              in: Array.from(connectedUserIds)
            },
            isOnline: false
          },
          data: {
            isOnline: true,
            lastSeen: new Date()
          }
        });
      }

      return participants.map(p => ({
        ...p.user,
        lastSeen: p.lastSeen
      }));
    } catch (error) {
      console.error('[OnlineStatusHandler] Error getting online users:', error);
      return [];
    }
  }

  /**
   * Получение количества онлайн пользователей в комнате
   * Возвращает количество реально подключенных через WebSocket
   */
  async getOnlineUsersCount(roomId: string): Promise<number> {
    try {
      // Получаем количество реально подключенных пользователей
      const connectedUsers = this.connectionHandler.getConnectedUsers(roomId);
      return connectedUsers.length;
    } catch (error) {
      console.error('[OnlineStatusHandler] Error getting online users count:', error);
      return 0;
    }
  }

  /**
   * Вспомогательный метод для получения списка активных комнат
   */
  private getRoomIds(): string[] {
    return this.connectionHandler.getActiveRoomIds();
  }
}

