import { prisma } from '$lib/prisma';
import { supabase } from '$lib/supabase';
import { getIronSession } from 'iron-session';
import type { User } from '@supabase/supabase-js';
import type { RequestEvent, Cookies } from '@sveltejs/kit';
import type { SessionData } from '$lib/session-new';

/**
 * Константы для ролей пользователей
 */
export const ROLE_LABELS: Record<string, string> = {
  user: 'Пользователь',
  moderator: 'Модератор',
  admin: 'Владелец'
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'Активный',
  inactive: 'Неактивный',
  pending: 'Ожидает'
};

/**
 * Валидация данных пользователя
 */
export function validateUser(userData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!userData.name || userData.name.trim() === '') {
    errors.push('Имя обязательно для заполнения');
  }

  if (!userData.email || userData.email.trim() === '') {
    errors.push('Email обязателен для заполнения');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('Некорректный формат email');
  }

  if (!userData.role) {
    errors.push('Роль обязательна для выбора');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Настройки сессии (дублируем из session-new.ts)
 */
const sessionOptions = {
  password: process.env.SESSION_SECRET || 'complex_password_at_least_32_characters_long_for_security_purposes',
  cookieName: 'copella_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 90, // 90 дней
    path: '/',
  },
};

/**
 * Создает профиль пользователя в локальной базе данных, если он не существует
 * @param authUser - Пользователь из Supabase Auth
 * @returns Объект с данными пользователя или ошибкой
 */
export async function ensureUserProfile(authUser: User): Promise<{ user: any; error: string | null }> {
  try {
    // Сначала проверяем, существует ли пользователь
    let userData = await prisma.user.findUnique({
      where: { id: authUser.id }
    });

    // Если пользователь не найден, создаем его
    if (!userData) {
      userData = await prisma.user.create({
        data: {
          id: authUser.id,
          email: authUser.email || '',
          fullName: authUser.user_metadata?.full_name || 'Пользователь',
          username: authUser.user_metadata?.username || `user_${authUser.id.slice(0, 8)}`,
          avatarUrl: authUser.user_metadata?.avatar_url || null
        }
      });
    }

    return {
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.fullName,
        username: userData.username,
        avatar_url: userData.avatarUrl
      },
      error: null
    };
  } catch (error) {
    console.error('Error ensuring user profile:', error);
    return {
      user: null,
      error: 'Ошибка создания профиля пользователя'
    };
  }
}

/**
 * Получает текущего пользователя из серверной cookie-сессии или токена авторизации
 * Сначала проверяет cookie-сессию, затем fallback на токен
 * @param request - HTTP запрос
 * @param cookies - Cookies объект из SvelteKit (опционально)
 * @returns Объект с данными пользователя или ошибкой
 */
export async function getCurrentUserFromToken(request: Request, cookies?: Cookies): Promise<{ user: any; error: string | null }> {
  try {
    // Пытаемся получить пользователя из cookie-сессии (если cookies предоставлены)
    if (cookies) {
      try {
        const session = await getIronSession<SessionData>(request, cookies, sessionOptions);
        
        if (session.isLoggedIn && session.userId) {
          // Получаем данные пользователя из БД
          const userData = await prisma.user.findUnique({
            where: { id: session.userId },
            select: {
              id: true,
              email: true,
              username: true,
              fullName: true,
              avatarUrl: true
            }
          });

          if (userData) {
            return {
              user: {
                id: userData.id,
                email: userData.email,
                full_name: userData.fullName,
                username: userData.username,
                avatar_url: userData.avatarUrl
              },
              error: null
            };
          }
        }
      } catch (sessionError) {
        console.log('[getCurrentUserFromToken] Session check failed, trying token:', sessionError);
      }
    }

    // Fallback: Получаем токен из заголовков (для обратной совместимости)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Токен авторизации не найден' };
    }

    const token = authHeader.substring(7);

    // Получаем пользователя из Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return { user: null, error: authError?.message || 'Пользователь не аутентифицирован' };
    }

    // Обеспечиваем наличие профиля пользователя в локальной БД
    return await ensureUserProfile(authUser);
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, error: 'Неожиданная ошибка при получении пользователя' };
  }
}