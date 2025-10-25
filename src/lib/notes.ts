import { supabase } from './supabase';
import { browser } from '$app/environment';
import { handleUnauthorizedResponse } from './utils/authRedirect';

// Функция для обновления токена через Supabase
async function refreshAuthToken(): Promise<string | null> {
	try {
		const { data, error } = await supabase.auth.refreshSession();
		
		if (error || !data.session || !data.user) {
			console.warn('[Notes] Session refresh failed (keeping logged in):', error);
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
		console.warn('[Notes] Error refreshing token (keeping logged in):', error);
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
		console.error('[Notes getAuthToken] Error:', error);
		return null;
	}
}

// Вспомогательная функция для выполнения fetch с автоматическим retry при 401
async function fetchWithTokenRefresh(url: string, options: RequestInit): Promise<Response> {
	let response = await fetch(url, options);
	
	// Если получили 401, пробуем обновить токен и повторить запрос
	if (response.status === 401) {
		console.log('[Notes] Token expired, attempting refresh...');
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

// Типы для заметок
export interface Note {
  id: string;
  roomId: string;
  title: string;
  content?: string;
  createdBy?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateNoteData {
  roomId: string;
  title: string;
  content?: string;
  createdBy?: string;
}

export interface UpdateNoteData {
  title?: string;
  content?: string;
}

// Единая функция для создания заметки
export async function createNote(data: CreateNoteData): Promise<{ note: Note | null; error: string | null }> {
  try {
    // Получаем токен авторизации
    const token = await getAuthToken();
    
    if (!token) {
      return { note: null, error: 'Пользователь не аутентифицирован' };
    }

    const response = await fetchWithTokenRefresh(`/api/rooms/${data.roomId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: data.title,
        content: data.content || '',
        createdBy: data.createdBy
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return { note: null, error: result.error || 'Ошибка создания заметки' };
    }

    return { note: result.note, error: null };
  } catch (error) {
    console.error('Create note error:', error);
    return { note: null, error: 'Неожиданная ошибка при создании заметки' };
  }
}

// Единая функция для получения заметок комнаты
export async function getRoomNotes(roomId: string): Promise<{ notes: Note[]; error: string | null }> {
  try {
    // Валидация roomId
    if (!roomId || typeof roomId !== 'string') {
      return { notes: [], error: 'Invalid room ID' };
    }

    // Получаем токен авторизации
    const token = await getAuthToken();
    
    if (!token) {
      return { notes: [], error: 'Пользователь не аутентифицирован' };
    }

    const response = await fetchWithTokenRefresh(`/api/rooms/${roomId}/notes`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { notes: [], error: result.error || `Ошибка получения заметок (${response.status})` };
    }

    return { notes: result.notes || [], error: null };
  } catch (error) {
    console.error('Get room notes error:', error);
    return { notes: [], error: 'Неожиданная ошибка при получении заметок' };
  }
}

// Единая функция для получения заметки по ID
export async function getNoteById(noteId: string): Promise<{ note: Note | null; error: string | null }> {
  try {
    // Получаем токен авторизации
    const token = await getAuthToken();
    
    if (!token) {
      return { note: null, error: 'Пользователь не аутентифицирован' };
    }

    const response = await fetchWithTokenRefresh(`/api/notes/${noteId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { note: null, error: result.error || 'Ошибка получения заметки' };
    }

    return { note: result.note, error: null };
  } catch (error) {
    console.error('Get note by ID error:', error);
    return { note: null, error: 'Неожиданная ошибка при получении заметки' };
  }
}

// Единая функция для обновления заметки
export async function updateNote(noteId: string, updates: UpdateNoteData): Promise<{ note: Note | null; error: string | null }> {
  try {
    // Получаем токен авторизации
    const token = await getAuthToken();
    
    if (!token) {
      return { note: null, error: 'Пользователь не аутентифицирован' };
    }

    const response = await fetchWithTokenRefresh(`/api/notes/${noteId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(updates)
    });

    const result = await response.json();

    if (!response.ok) {
      return { note: null, error: result.error || 'Ошибка обновления заметки' };
    }

    return { note: result.note, error: null };
  } catch (error) {
    console.error('Update note error:', error);
    return { note: null, error: 'Неожиданная ошибка при обновлении заметки' };
  }
}

// Единая функция для удаления заметки
export async function deleteNote(noteId: string): Promise<{ error: string | null }> {
  try {
    // Получаем токен авторизации
    const token = await getAuthToken();
    
    if (!token) {
      return { error: 'Пользователь не аутентифицирован' };
    }

    const response = await fetchWithTokenRefresh(`/api/notes/${noteId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();

    if (!response.ok) {
      return { error: result.error || 'Ошибка удаления заметки' };
    }

    return { error: null };
  } catch (error) {
    console.error('Delete note error:', error);
    return { error: 'Неожиданная ошибка при удалении заметки' };
  }
}

// Единая функция для сохранения текста заметки
export async function saveNoteContent(noteId: string, content: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const result = await updateNote(noteId, { content });
    return { success: result.note !== null, error: result.error };
  } catch (error) {
    console.error('Save note content error:', error);
    return { success: false, error: 'Неожиданная ошибка при сохранении заметки' };
  }
}

// Единая функция для генерации названия заметки
export function generateNoteTitle(content: string): string {
  if (!content || content.trim() === '') {
    return 'Без названия';
  }

  // Берем первую строку как название
  const firstLine = content.split('\n')[0].trim();
  
  // Ограничиваем длину названия
  if (firstLine.length > 50) {
    return firstLine.substring(0, 47) + '...';
  }
  
  return firstLine || 'Без названия';
}

// Единая функция для автосохранения заметки
export async function autoSaveNote(noteId: string, content: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const title = generateNoteTitle(content);
    
    const result = await updateNote(noteId, { 
      content,
      title 
    });

    return { success: result.note !== null, error: result.error };
  } catch (error) {
    console.error('Auto save note error:', error);
    return { success: false, error: 'Неожиданная ошибка при автосохранении заметки' };
  }
}
