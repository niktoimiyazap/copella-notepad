import { supabase } from './supabase';
import { browser } from '$app/environment';
import { handleUnauthorizedResponse } from './utils/authRedirect';

// Функция для обновления токена через Supabase
async function refreshAuthToken(): Promise<string | null> {
	try {
		const { data, error } = await supabase.auth.refreshSession();
		
		if (error || !data.session || !data.user) {
			console.warn('[Rooms] Session refresh failed (keeping logged in):', error);
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
		console.warn('[Rooms] Error refreshing token (keeping logged in):', error);
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
		const { data: { session } } = await supabase.auth.getSession();
		if (session?.access_token) {
			if (browser) {
				localStorage.setItem('session_token', session.access_token);
			}
			return session.access_token;
		}
		
		return null;
	} catch (error) {
		console.error('[Rooms getAuthToken] Error:', error);
		return null;
	}
}

// Вспомогательная функция для выполнения fetch с автоматическим retry при 401
async function fetchWithTokenRefresh(url: string, options: RequestInit): Promise<Response> {
	let response = await fetch(url, options);
	
	// Если получили 401, пробуем обновить токен и повторить запрос
	if (response.status === 401) {
		console.log('[Rooms] Token expired, attempting refresh...');
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

// Типы для комнат
export interface Room {
	id: string;
	title: string;
	description?: string;
	isPublic: boolean;
	coverImageUrl?: string;
	participantLimit: number;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
	// Настройки разрешений
	allowEdit: boolean;
	allowInvite: boolean;
	allowDelete: boolean;
	requireApproval: boolean;
	creator: {
		id: string;
		username: string;
		fullName: string;
		avatarUrl?: string;
	};
	participants: Array<{
		id: string;
		roomId: string;
		userId: string;
		role: "creator" | "admin" | "participant";
		joinedAt: string;
		lastSeen: string;
		isOnline: boolean;
		user: {
			id: string;
			username: string;
			fullName: string;
			avatarUrl?: string;
		};
	}>;
	_count: {
		participants: number;
		notes: number;
	};
}

export interface CreateRoomData {
	title: string;
	description?: string;
	isPublic?: boolean;
	coverImageUrl?: string;
	participantLimit?: number;
	// Настройки разрешений
	allowEdit?: boolean;
	allowInvite?: boolean;
	allowDelete?: boolean;
	requireApproval?: boolean;
}

export interface UpdateRoomData {
	title?: string;
	description?: string;
	isPublic?: boolean;
	coverImageUrl?: string;
	participantLimit?: number;
	// Настройки разрешений
	allowEdit?: boolean;
	allowInvite?: boolean;
	allowDelete?: boolean;
	requireApproval?: boolean;
}

// Результат операций
export interface RoomResult {
	room?: Room;
	error?: string;
}

export interface RoomsResult {
	rooms?: Room[];
	error?: string;
}

// Функция для получения всех комнат пользователя
export async function getUserRooms(): Promise<RoomsResult> {
	try {
		// Получаем токен авторизации
		const token = await getAuthToken();
		if (!token) {
			return { error: 'Unauthorized' };
		}

		const response = await fetchWithTokenRefresh('/api/rooms', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка получения комнат' };
		}

		return { rooms: result.rooms };
	} catch (error) {
		console.error('Get user rooms error:', error);
		return { error: 'Неожиданная ошибка при получении комнат' };
	}
}

// Функция для создания комнаты
export async function createRoom(roomData: CreateRoomData): Promise<RoomResult> {
	try {
		// Получаем токен авторизации
		const token = await getAuthToken();
		if (!token) {
			return { error: 'Unauthorized' };
		}

		const response = await fetchWithTokenRefresh('/api/rooms', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(roomData)
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка создания комнаты' };
		}

		return { room: result.room };
	} catch (error) {
		console.error('Create room error:', error);
		return { error: 'Неожиданная ошибка при создании комнаты' };
	}
}

// Функция для получения конкретной комнаты
export async function getRoom(roomId: string): Promise<RoomResult> {
	try {
		// Получаем токен авторизации
		const token = await getAuthToken();
		if (!token) {
			return { error: 'Unauthorized' };
		}

		const response = await fetchWithTokenRefresh(`/api/rooms/${roomId}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка получения комнаты' };
		}

		return { room: result.room };
	} catch (error) {
		console.error('Get room error:', error);
		return { error: 'Неожиданная ошибка при получении комнаты' };
	}
}

// Функция для обновления комнаты
export async function updateRoom(roomId: string, roomData: UpdateRoomData): Promise<RoomResult> {
	try {
		// Получаем токен авторизации
		const token = await getAuthToken();
		if (!token) {
			return { error: 'Unauthorized' };
		}

		const response = await fetchWithTokenRefresh(`/api/rooms/${roomId}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(roomData)
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка обновления комнаты' };
		}

		return { room: result.room };
	} catch (error) {
		console.error('Update room error:', error);
		return { error: 'Неожиданная ошибка при обновлении комнаты' };
	}
}

// Функция для удаления комнаты
export async function deleteRoom(roomId: string): Promise<{ success?: boolean; error?: string }> {
	try {
		// Получаем токен авторизации
		const token = await getAuthToken();
		if (!token) {
			return { error: 'Unauthorized' };
		}

		const response = await fetchWithTokenRefresh(`/api/rooms/${roomId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка удаления комнаты' };
		}

		return { success: true };
	} catch (error) {
		console.error('Delete room error:', error);
		return { error: 'Неожиданная ошибка при удалении комнаты' };
	}
}

// Функция для обновления разрешений комнаты
export async function updateRoomPermissions(roomId: string, permissions: {
	allowEdit?: boolean;
	allowInvite?: boolean;
	allowDelete?: boolean;
	requireApproval?: boolean;
}): Promise<RoomResult> {
	try {
		// Получаем токен авторизации
		const token = await getAuthToken();
		if (!token) {
			return { error: 'Unauthorized' };
		}

		const response = await fetchWithTokenRefresh(`/api/rooms/${roomId}/permissions`, {
			method: 'PATCH',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`,
			},
			body: JSON.stringify(permissions)
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка обновления разрешений' };
		}

		return { room: result.room };
	} catch (error) {
		console.error('Update room permissions error:', error);
		return { error: 'Неожиданная ошибка при обновлении разрешений' };
	}
}
