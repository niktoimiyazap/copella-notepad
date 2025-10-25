// Обработчик приглашений и заявок в реальном времени
import { prisma } from '../../../src/lib/prisma.js';
import type { WebSocketMessage, RoomInviteData } from '../types.js';
import type { ConnectionHandler } from './connectionHandler.js';

export class InviteHandler {
  constructor(private connectionHandler: ConnectionHandler) {}

  /**
   * Отправка уведомления о новом приглашении
   */
  async notifyInviteCreated(roomId: string, invite: RoomInviteData): Promise<void> {
    try {
      // Получаем информацию о приглашении с данными о комнате и отправителе
      const inviteWithDetails = await prisma.roomInvite.findUnique({
        where: { id: invite.id },
        include: {
          room: {
            select: {
              id: true,
              title: true,
              description: true,
              coverImageUrl: true
            }
          },
          inviter: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true
            }
          }
        }
      });

      if (!inviteWithDetails) return;

      const message: WebSocketMessage = {
        type: 'invite_created',
        room_id: roomId,
        data: {
          invite: inviteWithDetails
        },
        timestamp: new Date()
      };

      // Отправляем всем участникам комнаты
      this.connectionHandler.broadcastToRoom(roomId, message);

      console.log(`[InviteHandler] Invite created notification sent for room ${roomId}`);
    } catch (error) {
      console.error('[InviteHandler] Error notifying invite created:', error);
    }
  }

  /**
   * Отправка уведомления о новой заявке на вступление
   */
  async notifyApprovalRequest(roomId: string, invite: RoomInviteData): Promise<void> {
    try {
      // Получаем информацию о заявке с данными о пользователе
      const inviteWithDetails = await prisma.roomInvite.findUnique({
        where: { id: invite.id },
        include: {
          room: {
            select: {
              id: true,
              title: true,
              description: true,
              coverImageUrl: true,
              createdBy: true
            }
          },
          requester: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              email: true
            }
          },
          inviter: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true
            }
          }
        }
      });

      if (!inviteWithDetails || !inviteWithDetails.requester) return;

      const message: WebSocketMessage = {
        type: 'approval_request',
        room_id: roomId,
        data: {
          invite: inviteWithDetails,
          user: inviteWithDetails.requester,
          message: `${inviteWithDetails.requester.fullName} хочет присоединиться к комнате`
        },
        timestamp: new Date()
      };

      // Отправляем только создателю комнаты
      const creatorId = inviteWithDetails.room.createdBy;
      this.connectionHandler.sendToUser(creatorId, roomId, message);

      console.log(`[InviteHandler] Approval request sent to room creator ${creatorId}`);
    } catch (error) {
      console.error('[InviteHandler] Error notifying approval request:', error);
    }
  }

  /**
   * Отправка уведомления об одобрении/отклонении заявки
   */
  async notifyApprovalResponse(
    roomId: string,
    inviteId: string,
    action: 'approved' | 'rejected',
    requesterId: string
  ): Promise<void> {
    try {
      const invite = await prisma.roomInvite.findUnique({
        where: { id: inviteId },
        include: {
          room: {
            select: {
              id: true,
              title: true,
              description: true,
              coverImageUrl: true
            }
          },
          requester: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true
            }
          }
        }
      });

      if (!invite) return;

      const message: WebSocketMessage = {
        type: 'approval_response',
        room_id: roomId,
        data: {
          invite,
          action,
          status: action, // Добавляем для обратной совместимости
          message: action === 'approved' 
            ? `Ваша заявка на вступление в комнату "${invite.room.title}" одобрена!`
            : `Ваша заявка на вступление в комнату "${invite.room.title}" отклонена`
        },
        timestamp: new Date()
      };

      // Отправляем уведомление пользователю, подавшему заявку
      this.connectionHandler.sendToUser(requesterId, roomId, message);
    } catch (error) {
      console.error('[InviteHandler] Error notifying approval response:', error);
    }
  }

  /**
   * Отправка уведомления о принятом приглашении
   */
  async notifyInviteAccepted(roomId: string, invite: RoomInviteData, userId: string): Promise<void> {
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
        type: 'invite_accepted',
        room_id: roomId,
        data: {
          invite,
          user,
          message: `${user.fullName} присоединился к комнате`
        },
        timestamp: new Date()
      };

      // Отправляем всем участникам комнаты
      this.connectionHandler.broadcastToRoom(roomId, message);

      console.log(`[InviteHandler] Invite accepted notification sent for room ${roomId}`);
    } catch (error) {
      console.error('[InviteHandler] Error notifying invite accepted:', error);
    }
  }

  /**
   * Отправка уведомления об отклоненном приглашении
   */
  async notifyInviteDeclined(roomId: string, invite: RoomInviteData): Promise<void> {
    try {
      const message: WebSocketMessage = {
        type: 'invite_declined',
        room_id: roomId,
        data: {
          invite
        },
        timestamp: new Date()
      };

      // Отправляем только создателю комнаты
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        select: { createdBy: true }
      });

      if (room) {
        this.connectionHandler.sendToUser(room.createdBy, roomId, message);
      }

      console.log(`[InviteHandler] Invite declined notification sent for room ${roomId}`);
    } catch (error) {
      console.error('[InviteHandler] Error notifying invite declined:', error);
    }
  }

  /**
   * Отправка уведомления об отозванном приглашении
   */
  async notifyInviteRevoked(roomId: string, inviteId: string): Promise<void> {
    try {
      const message: WebSocketMessage = {
        type: 'invite_revoked',
        room_id: roomId,
        data: {
          inviteId
        },
        timestamp: new Date()
      };

      // Отправляем всем участникам комнаты
      this.connectionHandler.broadcastToRoom(roomId, message);

      console.log(`[InviteHandler] Invite revoked notification sent for room ${roomId}`);
    } catch (error) {
      console.error('[InviteHandler] Error notifying invite revoked:', error);
    }
  }

  /**
   * Получение списка ожидающих заявок для комнаты
   */
  async getPendingApprovals(roomId: string, creatorId: string): Promise<any[]> {
    try {
      const room = await prisma.room.findFirst({
        where: {
          id: roomId,
          createdBy: creatorId
        }
      });

      if (!room) {
        throw new Error('Room not found or access denied');
      }

      const pendingInvites = await prisma.roomInvite.findMany({
        where: {
          roomId,
          status: 'pending_approval'
        },
        include: {
          requester: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true,
              email: true
            }
          },
          inviter: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return pendingInvites;
    } catch (error) {
      console.error('[InviteHandler] Error getting pending approvals:', error);
      return [];
    }
  }
}

