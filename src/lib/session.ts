import { prisma } from './prisma.js';
import { randomBytes } from 'crypto';

// Типы для сессий
export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface SessionResult {
  session?: Session;
  user?: any;
  error?: string;
}

// Создание новой сессии
export async function createSession(
  userId: string, 
  userAgent?: string, 
  ipAddress?: string
): Promise<SessionResult> {
  try {
    // Генерируем уникальный токен сессии (64 символа hex)
    const sessionToken = randomBytes(32).toString('hex');
    
    // Сессия действительна 90 дней (увеличено для удобства)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90);

    console.log('Creating session for user:', userId);
    console.log('Session token:', sessionToken.substring(0, 20) + '...');
    console.log('Session expires at:', expiresAt.toISOString());

    // Удаляем старые истекшие сессии пользователя
    await prisma.session.deleteMany({
      where: {
        userId,
        expiresAt: {
          lt: new Date()
        }
      }
    });

    // Создаем сессию в базе данных
    const session = await prisma.session.create({
      data: {
        userId,
        token: sessionToken,
        expiresAt,
        userAgent,
        ipAddress
      }
    });

    // Получаем данные пользователя
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        username: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      await prisma.session.delete({ where: { id: session.id } });
      return { error: 'User not found' };
    }

    console.log('Session created successfully for user:', user.username);

    return { session, user };
  } catch (error) {
    console.error('Error creating session:', error);
    return { error: 'Failed to create session' };
  }
}

// Валидация сессии по токену
export async function validateSession(token: string): Promise<SessionResult> {
  try {
    if (!token) {
      console.log('Session validation: No token provided');
      return { error: 'Session token is required' };
    }

    // Проверяем формат токена (должен быть hex строкой длиной 64 символа)
    if (!/^[a-f0-9]{64}$/.test(token)) {
      console.log('Session validation: Invalid token format, length:', token.length);
      return { error: 'Invalid session token format' };
    }

    console.log('Session validation: Checking token:', token.substring(0, 20) + '...');
    console.log('Session validation: Current time:', new Date().toISOString());

    const currentTime = new Date();

    // Ищем активную сессию
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: {
          gt: currentTime // Проверяем, что сессия не истекла
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            username: true,
            avatarUrl: true,
            createdAt: true
          }
        }
      }
    });

    if (!session) {
      console.log('Session validation: No valid session found for token');
      // Проверяем, есть ли сессия с этим токеном вообще
      const expiredSession = await prisma.session.findFirst({
        where: { token }
      });
      if (expiredSession) {
        console.log('Session validation: Found expired session, expires at:', expiredSession.expiresAt);
        console.log('Session validation: Current time:', currentTime.toISOString());
        // Удаляем истекшую сессию
        await prisma.session.delete({ where: { id: expiredSession.id } });
      } else {
        console.log('Session validation: No session found with this token at all');
      }
      return { error: 'Invalid or expired session' };
    }

    console.log('Session validation: Valid session found for user:', session.user.username);
    console.log('Session validation: Session expires at:', session.expiresAt.toISOString());

    // Проверяем, нужно ли обновить срок действия сессии
    // Если до истечения осталось меньше 30 дней, продлеваем сессию
    const daysUntilExpiry = Math.floor((session.expiresAt.getTime() - currentTime.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 30) {
      console.log('Session validation: Extending session expiry (days remaining:', daysUntilExpiry, ')');
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 90);
      
      await prisma.session.update({
        where: { id: session.id },
        data: { 
          lastActivityAt: currentTime,
          expiresAt: newExpiresAt
        }
      });

      return { 
        session: {
          id: session.id,
          userId: session.userId,
          token: session.token,
          expiresAt: newExpiresAt,
          createdAt: session.createdAt,
          userAgent: session.userAgent,
          ipAddress: session.ipAddress
        },
        user: session.user
      };
    }

    // Обновляем время последней активности
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: currentTime }
    });

    return { 
      session: {
        id: session.id,
        userId: session.userId,
        token: session.token,
        expiresAt: session.expiresAt,
        createdAt: session.createdAt,
        userAgent: session.userAgent,
        ipAddress: session.ipAddress
      },
      user: session.user
    };
  } catch (error) {
    console.error('Error validating session:', error);
    return { error: 'Failed to validate session' };
  }
}

// Удаление сессии (выход)
export async function deleteSession(token: string): Promise<{ error?: string }> {
  try {
    await prisma.session.deleteMany({
      where: { token }
    });

    return {};
  } catch (error) {
    console.error('Error deleting session:', error);
    return { error: 'Failed to delete session' };
  }
}

// Удаление всех сессий пользователя
export async function deleteAllUserSessions(userId: string): Promise<{ error?: string }> {
  try {
    await prisma.session.deleteMany({
      where: { userId }
    });

    return {};
  } catch (error) {
    console.error('Error deleting user sessions:', error);
    return { error: 'Failed to delete user sessions' };
  }
}

// Очистка истекших сессий
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
  }
}

// Обновление сессии (продление срока действия)
export async function refreshSession(token: string): Promise<SessionResult> {
  try {
    if (!token) {
      return { error: 'Session token is required' };
    }

    // Проверяем формат токена
    if (!/^[a-f0-9]{64}$/.test(token)) {
      return { error: 'Invalid session token format' };
    }

    const currentTime = new Date();

    // Ищем сессию
    const session = await prisma.session.findFirst({
      where: {
        token,
        expiresAt: {
          gt: currentTime
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            username: true,
            avatarUrl: true,
            createdAt: true
          }
        }
      }
    });

    if (!session) {
      return { error: 'Invalid or expired session' };
    }

    // Продлеваем срок действия сессии на 90 дней
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 90);

    const updatedSession = await prisma.session.update({
      where: { id: session.id },
      data: {
        expiresAt: newExpiresAt,
        lastActivityAt: currentTime
      }
    });

    console.log('Session refreshed for user:', session.user.username);
    console.log('New expiry date:', newExpiresAt.toISOString());

    return {
      session: {
        id: updatedSession.id,
        userId: updatedSession.userId,
        token: updatedSession.token,
        expiresAt: updatedSession.expiresAt,
        createdAt: updatedSession.createdAt,
        userAgent: updatedSession.userAgent,
        ipAddress: updatedSession.ipAddress
      },
      user: session.user
    };
  } catch (error) {
    console.error('Error refreshing session:', error);
    return { error: 'Failed to refresh session' };
  }
}

// Получение всех активных сессий пользователя
export async function getUserSessions(userId: string): Promise<Session[]> {
  try {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        lastActivityAt: 'desc'
      }
    });

    return sessions.map(session => ({
      id: session.id,
      userId: session.userId,
      token: session.token,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress
    }));
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
}

// Проверка, истекла ли сессия
export async function isSessionExpired(token: string): Promise<boolean> {
  try {
    const session = await prisma.session.findFirst({
      where: { token }
    });

    if (!session) {
      return true;
    }

    return session.expiresAt < new Date();
  } catch (error) {
    console.error('Error checking session expiry:', error);
    return true;
  }
}
