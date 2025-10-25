/**
 * Единый API модуль для работы с пользователем
 * Все операции с пользователем должны проходить через этот модуль
 */
import { browser } from '$app/environment';
import { userActions, type User } from '$lib/stores/user';
import { supabase } from '$lib/supabase';

export interface AuthResult {
	user: User | null;
	error: string | null;
	session?: any;
}

/**
 * Получает токен из localStorage (для backward compatibility с Supabase)
 */
function getAccessToken(): string | null {
	if (!browser) return null;
	return localStorage.getItem('session_token');
}

/**
 * Сохраняет токены в localStorage (для backward compatibility с Supabase)
 */
function saveTokens(accessToken: string, refreshToken: string) {
	if (!browser) return;
	localStorage.setItem('session_token', accessToken);
	localStorage.setItem('refresh_token', refreshToken);
}

/**
 * Удаляет токены из localStorage
 */
function clearTokens() {
	if (!browser) return;
	localStorage.removeItem('session_token');
	localStorage.removeItem('refresh_token');
}

/**
 * Обновляет токен через Supabase
 */
async function refreshAuthToken(): Promise<string | null> {
	try {
		const { data, error } = await supabase.auth.refreshSession();
		
		if (error || !data.session || !data.user) {
			console.warn('[UserAPI] Session refresh failed (keeping logged in):', error);
			// НЕ чистим токены - оставляем пользователя залогиненным
			return null;
		}

		// Сохраняем новые токены
		if (data.session.access_token) {
			saveTokens(data.session.access_token, data.session.refresh_token || '');
			return data.session.access_token;
		}
		
		return null;
	} catch (error) {
		console.warn('[UserAPI] Error refreshing token (keeping logged in):', error);
		// НЕ чистим токены
		return null;
	}
}

/**
 * Регистрация нового пользователя
 */
export async function register(data: {
	email: string;
	password: string;
	full_name: string;
	username: string;
	avatar_url?: string;
}): Promise<AuthResult> {
	try {
		console.log('[UserAPI] Registering user:', data.email);

		const response = await fetch('/api/auth/register', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				email: data.email,
				password: data.password,
				full_name: data.full_name,
				username: data.username,
				avatar_url: data.avatar_url
			})
		});

		const result = await response.json();

		if (!response.ok || result.error) {
			console.error('[UserAPI] Registration failed:', result.error);
			return {
				user: null,
				error: result.error || 'Ошибка регистрации'
			};
		}

		if (!result.user) {
			return {
				user: null,
				error: 'Не удалось создать пользователя'
			};
		}

		const user: User = {
			id: result.user.id,
			email: result.user.email,
			fullName: result.user.fullName || result.user.full_name,
			username: result.user.username,
			avatarUrl: result.user.avatarUrl || result.user.avatar_url
		};

		// Сохраняем токены если есть
		if (result.session) {
			saveTokens(result.session.access_token, result.session.refresh_token);
		}

		// Обновляем store
		userActions.setUser(user);

		console.log('[UserAPI] Registration successful:', user.email);
		return { user, error: null, session: result.session };
	} catch (error) {
		console.error('[UserAPI] Registration error:', error);
		return { user: null, error: 'Неожиданная ошибка при регистрации' };
	}
}

/**
 * Вход пользователя
 */
export async function login(email: string, password: string): Promise<AuthResult> {
	try {
		console.log('[UserAPI] Logging in:', email);

		const response = await fetch('/api/auth/login-new', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email, password })
		});

		const result = await response.json();

		if (!response.ok || result.error) {
			console.error('[UserAPI] Login failed:', result.error);
			return {
				user: null,
				error: result.error || 'Ошибка входа'
			};
		}

		if (!result.user) {
			return {
				user: null,
				error: 'Не удалось получить данные пользователя'
			};
		}

		const user: User = {
			id: result.user.id,
			email: result.user.email,
			fullName: result.user.fullName || result.user.full_name,
			username: result.user.username,
			avatarUrl: result.user.avatarUrl || result.user.avatar_url
		};

		// Сохраняем токены если есть
		if (result.session) {
			saveTokens(result.session.access_token, result.session.refresh_token);
		}

		// Обновляем store
		userActions.setUser(user);

		console.log('[UserAPI] Login successful:', user.email);
		return { user, error: null, session: result.session };
	} catch (error) {
		console.error('[UserAPI] Login error:', error);
		return { user: null, error: 'Неожиданная ошибка при входе' };
	}
}

/**
 * Выход пользователя
 */
export async function logout(): Promise<{ error: string | null }> {
	try {
		console.log('[UserAPI] Logging out');

		// Вызываем API выхода
		const response = await fetch('/api/auth/logout-new', {
			method: 'POST'
		});

		if (!response.ok) {
			const result = await response.json();
			console.error('[UserAPI] Logout failed:', result.error);
			// Даже если API вернул ошибку, все равно очищаем локальное состояние
		}

		// Очищаем токены и store
		clearTokens();
		userActions.logout();

		console.log('[UserAPI] Logout successful');
		return { error: null };
	} catch (error) {
		console.error('[UserAPI] Logout error:', error);
		// Все равно очищаем локальное состояние
		clearTokens();
		userActions.logout();
		return { error: null }; // Не возвращаем ошибку, т.к. локально все очищено
	}
}

/**
 * Получение текущего пользователя через API
 * Используется для проверки/обновления данных пользователя
 */
export async function fetchCurrentUser(): Promise<AuthResult> {
	try {
		if (!browser) {
			return { user: null, error: 'Не в браузере' };
		}

		let accessToken = getAccessToken();

		if (!accessToken) {
			console.log('[UserAPI] No access token found');
			return { user: null, error: 'Пользователь не аутентифицирован' };
		}

		let response = await fetch('/api/auth/me', {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${accessToken}`
			}
		});

		// Если токен истёк (401), пробуем обновить его
		if (response.status === 401) {
			console.log('[UserAPI] Token expired, attempting refresh...');
			
			const newToken = await refreshAuthToken();
			
			if (!newToken) {
				console.warn('[UserAPI] Failed to refresh token (keeping logged in)');
				// НЕ выкидываем пользователя - просто возвращаем ошибку
				return { user: null, error: 'Сессия истекла, не удалось обновить' };
			}
			
			// Повторяем запрос с новым токеном
			console.log('[UserAPI] Retrying with refreshed token...');
			response = await fetch('/api/auth/me', {
				method: 'GET',
				headers: {
					'Authorization': `Bearer ${newToken}`
				}
			});
		}

		if (!response.ok) {
			console.warn('[UserAPI] Auth API returned (keeping logged in):', response.status);
			// НЕ выкидываем пользователя
			return { user: null, error: 'Ошибка аутентификации' };
		}

		const data = await response.json();

		if (!data.user) {
			console.warn('[UserAPI] No user in response (keeping logged in)');
			// НЕ выкидываем пользователя
			return { user: null, error: 'Пользователь не найден' };
		}

		const user: User = {
			id: data.user.id,
			email: data.user.email || '',
			fullName: data.user.fullName || data.user.full_name || 'User',
			username: data.user.username || 'user',
			avatarUrl: data.user.avatarUrl || data.user.avatar_url
		};

		// Обновляем store
		userActions.setUser(user);

		return { user, error: null };
	} catch (error) {
		console.warn('[UserAPI] Fetch user error (keeping logged in):', error);
		// НЕ выкидываем пользователя
		return { user: null, error: 'Ошибка при получении пользователя' };
	}
}

/**
 * Обновление профиля пользователя
 */
export async function updateProfile(updates: {
	full_name?: string;
	username?: string;
	avatar_url?: string;
}): Promise<AuthResult> {
	try {
		const accessToken = getAccessToken();

		if (!accessToken) {
			return { user: null, error: 'Пользователь не аутентифицирован' };
		}

		const response = await fetch('/api/auth/profile', {
			method: 'PUT',
			headers: {
				'Authorization': `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(updates)
		});

		const result = await response.json();

		if (!response.ok) {
			return { user: null, error: result.error || 'Ошибка обновления профиля' };
		}

		if (result.user) {
			const user: User = {
				id: result.user.id,
				email: result.user.email,
				fullName: result.user.fullName || result.user.full_name,
				username: result.user.username,
				avatarUrl: result.user.avatarUrl || result.user.avatar_url
			};

			// Обновляем store
			userActions.setUser(user);

			return { user, error: null };
		}

		return { user: null, error: 'Не удалось обновить профиль' };
	} catch (error) {
		console.error('[UserAPI] Update profile error:', error);
		return { user: null, error: 'Неожиданная ошибка при обновлении профиля' };
	}
}

/**
 * Проверка доступности username
 */
export async function checkUsernameAvailability(username: string): Promise<{ available: boolean; error: string | null }> {
	try {
		const response = await fetch('/api/auth/check-username', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ username })
		});

		const result = await response.json();

		if (!response.ok) {
			return { available: false, error: result.error || 'Ошибка проверки username' };
		}

		return result;
	} catch (error) {
		console.error('[UserAPI] Check username error:', error);
		return { available: false, error: 'Неожиданная ошибка при проверке username' };
	}
}

/**
 * Проверка доступности email
 */
export async function checkEmailAvailability(email: string): Promise<{ available: boolean; error: string | null }> {
	try {
		const response = await fetch('/api/auth/check-email', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email })
		});

		const result = await response.json();

		if (!response.ok) {
			return { available: false, error: result.error || 'Ошибка проверки email' };
		}

		return result;
	} catch (error) {
		console.error('[UserAPI] Check email error:', error);
		return { available: false, error: 'Неожиданная ошибка при проверке email' };
	}
}

/**
 * Получение токена для API запросов
 * Используется в других модулях для авторизации запросов
 */
export function getAuthToken(): string | null {
	return getAccessToken();
}
