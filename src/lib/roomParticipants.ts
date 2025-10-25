// Динамический импорт Prisma Client для избежания проблем в браузере

// Типы для участников комнаты
export interface RoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  role: "creator" | "admin" | "participant";
  joinedAt: Date;
  lastSeen: Date;
  isOnline: boolean;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl?: string;
  };
}

export interface RoomParticipantResult {
  participant?: RoomParticipant;
  participants?: RoomParticipant[];
  success?: boolean;
  error?: string;
}

// Функция для добавления участника в комнату
export async function addRoomParticipant(roomId: string, userId: string): Promise<RoomParticipantResult> {
  try {
    const { prisma } = await import('./prisma');
    // Проверяем, существует ли уже такой участник
    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });

    if (existingParticipant) {
      return { error: 'Пользователь уже является участником этой комнаты' };
    }

    // Добавляем участника
    const participant = await prisma.roomParticipant.create({
      data: {
        roomId,
        userId,
        role: "participant", // По умолчанию новые участники получают роль "participant"
        joinedAt: new Date(),
        lastSeen: new Date(),
        isOnline: true
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

    return { participant };
  } catch (error) {
    console.error('Add room participant error:', error);
    return { error: 'Неожиданная ошибка при добавлении участника' };
  }
}

// Функция для удаления участника из комнаты
export async function removeRoomParticipant(roomId: string, userId: string): Promise<RoomParticipantResult> {
  try {
    const { prisma } = await import('./prisma');
    await prisma.roomParticipant.delete({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Remove room participant error:', error);
    return { error: 'Неожиданная ошибка при удалении участника' };
  }
}

// Функция для получения участников комнаты
export async function getRoomParticipants(roomId: string): Promise<RoomParticipantResult> {
  try {
    const { prisma } = await import('./prisma');
    const participants = await prisma.roomParticipant.findMany({
      where: {
        roomId
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
      },
      orderBy: [
        { role: 'asc' }, // Сначала creator, потом admin, потом participant
        { joinedAt: 'asc' }
      ]
    });

    return { participants };
  } catch (error) {
    console.error('Get room participants error:', error);
    return { error: 'Неожиданная ошибка при получении участников' };
  }
}

// Функция для обновления статуса онлайн участника
export async function updateUserOnlineStatus(userId: string, roomId: string, isOnline: boolean): Promise<RoomParticipantResult> {
  try {
    const { prisma } = await import('./prisma');
    
    // Проверяем, существует ли участник
    const existingParticipant = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });

    // Если участник не существует, возвращаем ошибку
    // НЕ создаем участника автоматически - это должно делаться явно при присоединении к комнате
    if (!existingParticipant) {
      return { error: 'Пользователь не является участником комнаты' };
    }

    // Обновляем статус существующего участника
    const participant = await prisma.roomParticipant.update({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      },
      data: {
        isOnline,
        lastSeen: new Date()
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

    return { participant };
  } catch (error) {
    console.error('Update user online status error:', error);
    return { error: 'Неожиданная ошибка при обновлении статуса' };
  }
}

// Функция для проверки, является ли пользователь участником комнаты
export async function isUserRoomParticipant(userId: string, roomId: string): Promise<boolean> {
  try {
    const { prisma } = await import('./prisma');
    const participant = await prisma.roomParticipant.findUnique({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      }
    });

    return participant !== null;
  } catch (error) {
    console.error('Check user room participant error:', error);
    return false;
  }
}

// Функция для получения прав пользователя в комнате
export async function getUserRoomPermissions(userId: string, roomId: string): Promise<{
  permissions: {
    canEdit: boolean;
    canDelete: boolean;
    canInvite: boolean;
    canManageRoom: boolean;
    isOwner: boolean;
    isParticipant: boolean;
  };
  error: string | null;
}> {
  try {
    const { prisma } = await import('./prisma');
    // Получаем информацию о комнате вместе с настройками разрешений
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      select: { 
        createdBy: true,
        allowEdit: true,
        allowInvite: true,
        allowDelete: true
      }
    });

    if (!room) {
      return {
        permissions: {
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageRoom: false,
          isOwner: false,
          isParticipant: false
        },
        error: 'Комната не найдена'
      };
    }

    // Проверяем, является ли пользователь создателем комнаты
    const isOwner = room.createdBy === userId;

    // Получаем информацию об участнике (включая роль)
    const participant = await prisma.roomParticipant.findFirst({
      where: {
        roomId: roomId,
        userId: userId
      },
      select: {
        role: true,
        canEdit: true,
        canInvite: true,
        canDelete: true
      }
    });

    const isParticipant = !!participant;

    // Определяем права на основе роли участника
    let permissions;

    if (isOwner || participant?.role === 'creator' || participant?.role === 'owner') {
      // Владелец или создатель - все права включая управление комнатой
      permissions = {
        canEdit: true,
        canDelete: true,
        canInvite: true,
        canManageRoom: true,
        isOwner,
        isParticipant: true
      };
    } else if (participant?.role === 'admin') {
      // Админ (владелец) - все права включая управление комнатой
      permissions = {
        canEdit: true,
        canDelete: true,
        canInvite: true,
        canManageRoom: true,
        isOwner: false,
        isParticipant: true
      };
    } else if (participant?.role === 'moderator') {
      // Модератор - все права кроме управления комнатой
      permissions = {
        canEdit: true,
        canInvite: true,
        canDelete: true,
        canManageRoom: false,
        isOwner: false,
        isParticipant: true
      };
    } else if (participant?.role === 'user' || participant?.role === 'participant') {
      // Обычный пользователь - только право на редактирование или ничего
      permissions = {
        canEdit: participant.canEdit === true,
        canDelete: false,
        canInvite: false,
        canManageRoom: false,
        isOwner: false,
        isParticipant: true
      };
    } else {
      // Не участник - нет прав
      permissions = {
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManageRoom: false,
        isOwner: false,
        isParticipant: false
      };
    }

    return { permissions, error: null };
  } catch (error) {
    return {
      permissions: {
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManageRoom: false,
        isOwner: false,
        isParticipant: false
      },
      error: 'Неожиданная ошибка при определении прав'
    };
  }
}
