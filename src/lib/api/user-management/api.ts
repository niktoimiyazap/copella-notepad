// API функции для управления пользователями

import type { 
  UserManagementUser, 
  UserManagementApiResponse, 
  UpdatePermissionsRequest 
} from './types';

// Получение токена авторизации
async function getAuthToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  
  const token = window.localStorage.getItem('session_token');
  if (token) return token;
  
  try {
    const { supabase } = await import('$lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      localStorage.setItem('session_token', session.access_token);
      return session.access_token;
    }
  } catch (error) {
    console.error('[UserManagementAPI] Error getting token:', error);
  }
  
  return null;
}

// Базовая функция для API запросов
async function apiRequest<T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> {
  const token = await getAuthToken();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Неизвестная ошибка' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Получить всех пользователей комнаты с их правами
 */
export async function getAllRoomUsers(roomId: string): Promise<UserManagementApiResponse> {
  try {
    const data = await apiRequest<{ participants: any[] }>(
      `/api/rooms/${roomId}/participants`,
      { method: 'GET' }
    );

    const users: UserManagementUser[] = data.participants.map((p: any) => ({
      id: p.userId,
      username: p.user.username,
      fullName: p.user.fullName,
      avatarUrl: p.user.avatarUrl,
      role: p.role,
      permissions: {
        canEdit: p.canEdit ?? false,
        canInvite: p.canInvite ?? false,
        canDelete: p.canDelete ?? false,
      },
      isOnline: p.isOnline,
      lastSeen: p.lastSeen,
      joinedAt: p.joinedAt,
    }));

    return { success: true, users };
  } catch (error) {
    console.error('[UserManagementAPI] Error getting all users:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ошибка загрузки пользователей' 
    };
  }
}

/**
 * Получить данные одного пользователя
 */
export async function getRoomUser(
  roomId: string, 
  userId: string
): Promise<UserManagementApiResponse> {
  try {
    const response = await getAllRoomUsers(roomId);
    
    if (!response.success || !response.users) {
      return response;
    }

    const user = response.users.find(u => u.id === userId);
    
    if (!user) {
      return { 
        success: false, 
        error: 'Пользователь не найден' 
      };
    }

    return { success: true, user };
  } catch (error) {
    console.error('[UserManagementAPI] Error getting user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ошибка загрузки пользователя' 
    };
  }
}

/**
 * Обновить права пользователя
 */
export async function updateUserPermissions(
  request: UpdatePermissionsRequest
): Promise<UserManagementApiResponse> {
  try {
    const { roomId, userId, permissions, role } = request;
    
    // Обновляем права, если они указаны
    if (permissions) {
      await apiRequest(
        `/api/rooms/${roomId}/participants`,
        {
          method: 'PATCH',
          body: JSON.stringify({ userId, permissions }),
        }
      );
    }

    // Обновляем роль, если она указана
    if (role) {
      await apiRequest(
        `/api/rooms/${roomId}/participants`,
        {
          method: 'PUT',
          body: JSON.stringify({ userId, role }),
        }
      );
    }

    // Получаем обновленные данные пользователя
    return await getRoomUser(roomId, userId);
  } catch (error) {
    console.error('[UserManagementAPI] Error updating permissions:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ошибка обновления прав' 
    };
  }
}

/**
 * Удалить пользователя из комнаты
 */
export async function removeUserFromRoom(
  roomId: string, 
  userId: string
): Promise<UserManagementApiResponse> {
  try {
    await apiRequest(
      `/api/rooms/${roomId}/participants`,
      {
        method: 'DELETE',
        body: JSON.stringify({ userId }),
      }
    );

    return { success: true };
  } catch (error) {
    console.error('[UserManagementAPI] Error removing user:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Ошибка удаления пользователя' 
    };
  }
}

