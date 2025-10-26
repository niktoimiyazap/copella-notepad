// Аутентификация для WebSocket
import { supabase } from '../../src/lib/supabase-server.js';
import { prisma } from '../../src/lib/prisma.js';
import type { AuthResult } from './types.js';

/**
 * Проверка токена аутентификации и получение информации о пользователе
 */
export async function authenticateToken(token: string): Promise<AuthResult> {
  if (!token) {
    return {
      isValid: false,
      error: 'Token is required'
    };
  }

  try {
    // Проверяем токен через Supabase
    const { data: { user }, error: supabaseError } = await supabase.auth.getUser(token);
    
    if (supabaseError || !user) {
      return {
        isValid: false,
        error: 'Invalid or expired token'
      };
    }

    // Получаем дополнительную информацию о пользователе из локальной БД
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        avatarUrl: true
      }
    });

    // Если пользователя нет в локальной БД - создаем его автоматически
    if (!dbUser) {
      console.log('[authenticateToken] User not found in database, creating:', user.id);
      try {
        // Генерируем уникальный username на основе email или user id
        const baseUsername = user.email?.split('@')[0] || `user_${user.id.slice(0, 8)}`;
        let username = baseUsername;
        let attempt = 0;
        
        // Пытаемся найти свободный username
        while (attempt < 10) {
          const existingUser = await prisma.user.findUnique({
            where: { username }
          });
          
          if (!existingUser) {
            break; // username свободен
          }
          
          // Добавляем суффикс к username
          attempt++;
          username = `${baseUsername}_${attempt}`;
        }
        
        dbUser = await prisma.user.create({
          data: {
            id: user.id,
            email: user.email || '',
            fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
            username,
            avatarUrl: user.user_metadata?.avatar_url
          },
          select: {
            id: true,
            email: true,
            username: true,
            fullName: true,
            avatarUrl: true
          }
        });
        console.log('[authenticateToken] User created successfully:', dbUser.id);
      } catch (createError) {
        console.error('[authenticateToken] Error creating user:', createError);
        return {
          isValid: false,
          error: 'Failed to create user in database'
        };
      }
    }

    return {
      isValid: true,
      userId: user.id,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        username: dbUser.username,
        fullName: dbUser.fullName,
        avatarUrl: dbUser.avatarUrl || undefined
      }
    };
  } catch (error) {
    console.error('[authenticateToken] Error:', error);
    return {
      isValid: false,
      error: 'Authentication failed'
    };
  }
}

/**
 * Проверка прав доступа пользователя к комнате
 */
export async function checkRoomAccess(userId: string, roomId: string): Promise<boolean> {
  try {
    const participant = await prisma.roomParticipant.findFirst({
      where: {
        userId,
        roomId
      }
    });

    return !!participant;
  } catch (error) {
    console.error('[checkRoomAccess] Error:', error);
    return false;
  }
}

/**
 * Проверка, является ли пользователь создателем комнаты
 */
export async function isRoomCreator(userId: string, roomId: string): Promise<boolean> {
  try {
    const room = await prisma.room.findFirst({
      where: {
        id: roomId,
        createdBy: userId
      }
    });

    return !!room;
  } catch (error) {
    console.error('[isRoomCreator] Error:', error);
    return false;
  }
}

