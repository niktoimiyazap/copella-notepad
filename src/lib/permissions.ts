// Импортируем функции из локальной базы данных
import { 
  getUserRoomPermissions as getLocalUserRoomPermissions,
  addRoomParticipant as addLocalRoomParticipant,
  removeRoomParticipant as removeLocalRoomParticipant,
  getRoomParticipants as getLocalRoomParticipants,
  updateUserOnlineStatus as updateLocalUserOnlineStatus,
  type RoomParticipant
} from './roomParticipants';
import { browser } from '$app/environment';
import { handleUnauthorizedResponse } from './utils/authRedirect';

// Функция для обновления токена через Supabase
async function refreshAuthToken(): Promise<string | null> {
	try {
		const { supabase } = await import('./supabase');
		const { data, error } = await supabase.auth.refreshSession();
		
		if (error || !data.session || !data.user) {
			console.warn('[Permissions] Session refresh failed (keeping logged in):', error);
			// НЕ чистим токены
			return null;
		}

		// Сохраняем новые токены
		if (browser && data.session.access_token) {
			localStorage.setItem('session_token', data.session.access_token);
			if (data.session.refresh_token) {
				localStorage.setItem('refresh_token', data.session.refresh_token);
			}
			return data.session.access_token;
		}
		
		return null;
	} catch (error) {
		console.warn('[Permissions] Error refreshing token (keeping logged in):', error);
		// НЕ чистим токены
		return null;
	}
}

// Функция для получения токена авторизации
async function getAuthToken(forceRefresh: boolean = false): Promise<string | null> {
	try {
		// Если запрошено принудительное обновление
		if (forceRefresh) {
			return await refreshAuthToken();
		}
		
		// Сначала пытаемся получить токен из localStorage (приоритет)
		if (browser && typeof window !== 'undefined') {
			const token = window.localStorage.getItem('session_token');
			if (token) {
				return token;
			}
		}
		
		// Fallback: пытаемся получить через Supabase
		const { supabase } = await import('./supabase');
		const { data: { session } } = await supabase.auth.getSession();
		if (session?.access_token) {
			if (browser) {
				localStorage.setItem('session_token', session.access_token);
			}
			return session.access_token;
		}
		
		return null;
	} catch (error) {
		console.error('[Permissions getAuthToken] Error:', error);
		return null;
	}
}

// Вспомогательная функция для выполнения fetch с автоматическим retry при 401
async function fetchWithTokenRefresh(url: string, options: RequestInit): Promise<Response> {
	let response = await fetch(url, options);
	
	// Если получили 401, пробуем обновить токен и повторить запрос
	if (response.status === 401) {
		console.log('[Permissions] Token expired, attempting refresh...');
		const newToken = await getAuthToken(true);
		
		if (newToken) {
			// Обновляем заголовок Authorization
			const newOptions = {
				...options,
				headers: {
					...options.headers,
					'Authorization': `Bearer ${newToken}`
				}
			};
			response = await fetch(url, newOptions);
			
			// Если после обновления токена все еще 401 - перенаправляем на логин
			handleUnauthorizedResponse(response, true);
		} else {
			// Не удалось обновить токен - перенаправляем на логин
			handleUnauthorizedResponse(response, true);
		}
	}
	
	return response;
}

// Типы для прав доступа
export interface UserPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  canManageRoom: boolean;
  isOwner: boolean;
  isParticipant: boolean;
}

// Единая функция для определения прав пользователя в комнате
export async function getUserRoomPermissions(userId: string, roomId: string): Promise<{ permissions: UserPermissions; error: string | null }> {
  // Если работаем на сервере, используем локальную функцию
  if (!browser) {
    return await getLocalUserRoomPermissions(userId, roomId);
  }
  
  // Если в браузере, вызываем API endpoint
  try {
    const token = await getAuthToken();
    if (!token) {
      return {
        permissions: {
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageRoom: false,
          isOwner: false,
          isParticipant: false
        },
        error: 'Unauthorized'
      };
    }

    const response = await fetchWithTokenRefresh(`/api/rooms/${roomId}/permissions/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        permissions: {
          canEdit: false,
          canDelete: false,
          canInvite: false,
          canManageRoom: false,
          isOwner: false,
          isParticipant: false
        },
        error: result.error || 'Ошибка получения прав'
      };
    }

    return { permissions: result.permissions, error: null };
  } catch (error) {
    console.error('Get user room permissions error:', error);
    return {
      permissions: {
        canEdit: false,
        canDelete: false,
        canInvite: false,
        canManageRoom: false,
        isOwner: false,
        isParticipant: false
      },
      error: 'Неожиданная ошибка при получении прав'
    };
  }
}

// Функция для проверки доступа пользователя к комнате
export async function checkUserRoomAccess(userId: string, roomId: string): Promise<{ hasAccess: boolean; error: string | null }> {
  try {
    const { permissions, error } = await getUserRoomPermissions(userId, roomId);
    
    if (error) {
      return { hasAccess: false, error };
    }
    
    // Пользователь имеет доступ, если он владелец или участник комнаты
    return { hasAccess: permissions.isOwner || permissions.isParticipant, error: null };
  } catch (error) {
    console.error('Check user room access error:', error);
    return { hasAccess: false, error: 'Неожиданная ошибка при проверке доступа' };
  }
}

// Единая функция для проверки прав на редактирование заметки
export async function canEditNote(userId: string, noteId: string): Promise<{ canEdit: boolean; error: string | null }> {
  try {
    // Импортируем prisma для работы с заметками
    const { prisma } = await import('./prisma');
    
    // Получаем информацию о заметке
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { roomId: true, createdBy: true }
    });

    if (!note) {
      return { canEdit: false, error: 'Заметка не найдена' };
    }

    // Получаем права пользователя в комнате
    const { permissions, error: permissionsError } = await getUserRoomPermissions(userId, note.roomId);
    
    if (permissionsError) {
      return { canEdit: false, error: permissionsError };
    }

    // Пользователь может редактировать заметку, если:
    // 1. Он создал заметку, ИЛИ
    // 2. Он имеет права на редактирование в комнате
    const canEdit = note.createdBy === userId || permissions.canEdit;

    return { canEdit, error: null };
  } catch (error) {
    console.error('Can edit note error:', error);
    return { canEdit: false, error: 'Неожиданная ошибка при проверке прав на редактирование' };
  }
}

// Единая функция для проверки прав на удаление заметки
export async function canDeleteNote(userId: string, noteId: string): Promise<{ canDelete: boolean; error: string | null }> {
  try {
    // Импортируем prisma для работы с заметками
    const { prisma } = await import('./prisma');
    
    // Получаем информацию о заметке
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { roomId: true, createdBy: true }
    });

    if (!note) {
      return { canDelete: false, error: 'Заметка не найдена' };
    }

    // Получаем права пользователя в комнате
    const { permissions, error: permissionsError } = await getUserRoomPermissions(userId, note.roomId);
    
    if (permissionsError) {
      return { canDelete: false, error: permissionsError };
    }

    // Пользователь может удалить заметку, если:
    // 1. Он создал заметку, ИЛИ
    // 2. Он владелец комнаты
    const canDelete = note.createdBy === userId || permissions.isOwner;

    return { canDelete, error: null };
  } catch (error) {
    console.error('Can delete note error:', error);
    return { canDelete: false, error: 'Неожиданная ошибка при проверке прав на удаление' };
  }
}

// Единая функция для добавления участника в комнату
export async function addRoomParticipant(roomId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
  const result = await addLocalRoomParticipant(roomId, userId);
  return {
    success: result.participant !== undefined,
    error: result.error || null
  };
}

// Единая функция для удаления участника из комнаты
export async function removeRoomParticipant(roomId: string, userId: string): Promise<{ success: boolean; error: string | null }> {
  // Если работаем на сервере, используем локальную функцию
  if (!browser) {
    const result = await removeLocalRoomParticipant(roomId, userId);
    return {
      success: result.success || false,
      error: result.error || null
    };
  }
  
  // Если в браузере, вызываем API endpoint
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Unauthorized' };
    }

    const response = await fetchWithTokenRefresh(`/api/rooms/${roomId}/participants`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId })
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Ошибка удаления участника' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Remove room participant error:', error);
    return { success: false, error: 'Неожиданная ошибка при удалении участника' };
  }
}

// Единая функция для получения участников комнаты
export async function getRoomParticipants(roomId: string): Promise<{ participants: RoomParticipant[]; error: string | null }> {
  try {
    // Получаем токен авторизации
    const token = await getAuthToken();
    if (!token) {
      return { participants: [], error: 'Unauthorized' };
    }

    const response = await fetch(`/api/rooms/${roomId}/participants`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { participants: [], error: result.error || 'Ошибка получения участников' };
    }

    return { participants: result.participants || [], error: null };
  } catch (error) {
    console.error('Get room participants error:', error);
    return { participants: [], error: 'Неожиданная ошибка при получении участников' };
  }
}

// Единая функция для обновления статуса онлайн
export async function updateUserOnlineStatus(userId: string, roomId: string, isOnline: boolean): Promise<{ success: boolean; error: string | null }> {
  const result = await updateLocalUserOnlineStatus(userId, roomId, isOnline);
  return {
    success: result.participant !== undefined,
    error: result.error || null
  };
}

// Единая функция для обновления роли участника
export async function updateParticipantRole(roomId: string, userId: string, role: string): Promise<{ success: boolean; error: string | null }> {
  try {
    // Получаем токен авторизации
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Unauthorized' };
    }

    const response = await fetch(`/api/rooms/${roomId}/participants`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, role })
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Ошибка обновления роли' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Update participant role error:', error);
    return { success: false, error: 'Неожиданная ошибка при обновлении роли' };
  }
}

// Единая функция для обновления прав участника
export async function updateParticipantPermissions(roomId: string, userId: string, permissions: any): Promise<{ success: boolean; error: string | null }> {
  try {
    // Получаем токен авторизации
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: 'Unauthorized' };
    }

    const response = await fetch(`/api/rooms/${roomId}/participants`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ userId, permissions })
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Ошибка обновления прав' };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Update participant permissions error:', error);
    return { success: false, error: 'Неожиданная ошибка при обновлении прав' };
  }
}
