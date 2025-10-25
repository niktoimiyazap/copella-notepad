// Система сессий на основе iron-session
import { getIronSession, type IronSession } from 'iron-session';
import { prisma } from './prisma';
import type { RequestEvent } from '@sveltejs/kit';

// Интерфейс данных сессии
export interface SessionData {
  userId?: string;
  email?: string;
  username?: string;
  isLoggedIn: boolean;
}

// Настройки сессии
const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_security_purposes',
  cookieName: 'copella_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // только HTTPS в продакшене
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 90, // 90 дней
    path: '/',
  },
};

// Получить сессию из запроса
export async function getSession(event: RequestEvent): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(event.request, event.cookies, sessionOptions);
  return session;
}

// Создать новую сессию для пользователя
export async function createUserSession(event: RequestEvent, userId: string) {
  try {
    // Получаем пользователя из БД
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true
      }
    });

    if (!user) {
      return { error: 'User not found' };
    }

    // Получаем сессию и устанавливаем данные
    const session = await getSession(event);
    session.userId = user.id;
    session.email = user.email;
    session.username = user.username;
    session.isLoggedIn = true;

    // Сохраняем сессию в cookie
    await session.save();

    console.log('Session created for user:', user.username);

    return { user, error: null };
  } catch (error) {
    console.error('Error creating session:', error);
    return { error: 'Failed to create session' };
  }
}

// Получить текущего пользователя из сессии
export async function getUserFromSession(event: RequestEvent) {
  try {
    const session = await getSession(event);

    if (!session.isLoggedIn || !session.userId) {
      return { user: null, error: 'Not authenticated' };
    }

    // Получаем полные данные пользователя из БД
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true,
        createdAt: true
      }
    });

    if (!user) {
      // Сессия есть, но пользователя нет - удаляем сессию
      await destroySession(event);
      return { user: null, error: 'User not found' };
    }

    return { user, error: null };
  } catch (error) {
    console.error('Error getting user from session:', error);
    return { user: null, error: 'Failed to get user' };
  }
}

// Удалить сессию
export async function destroySession(event: RequestEvent) {
  try {
    const session = await getSession(event);
    session.destroy();
    console.log('Session destroyed');
    return { error: null };
  } catch (error) {
    console.error('Error destroying session:', error);
    return { error: 'Failed to destroy session' };
  }
}

// Обновить сессию (продлить срок действия)
export async function refreshSession(event: RequestEvent) {
  try {
    const session = await getSession(event);
    
    if (!session.isLoggedIn || !session.userId) {
      return { error: 'Not authenticated' };
    }

    // Просто сохраняем сессию заново, что обновит cookie
    await session.save();
    
    console.log('Session refreshed for user:', session.username);
    return { error: null };
  } catch (error) {
    console.error('Error refreshing session:', error);
    return { error: 'Failed to refresh session' };
  }
}

// Проверить, авторизован ли пользователь
export async function isAuthenticated(event: RequestEvent): Promise<boolean> {
  try {
    const session = await getSession(event);
    return session.isLoggedIn === true && !!session.userId;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
}

