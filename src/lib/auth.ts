import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Типы для аутентификации
export interface AuthUser {
  id: string; // ID из Supabase Auth
  email: string;
  full_name: string;
  username: string;
  avatar_url?: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  username: string;
  avatar_url?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

// Результат операций
export interface AuthResult {
  user: AuthUser | null;
  error: string | null;
}

// Функция для регистрации пользователя
export async function registerUser(data: RegisterData): Promise<AuthResult> {
  try {
    console.log('[registerUser] Attempting to register:', data.email);

    // Используем API endpoint, который создает и Supabase пользователя, и серверную сессию
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
      console.error('[registerUser] Registration failed:', result.error);
      return { 
        user: null, 
        error: result.error || 'Ошибка регистрации' 
      };
    }

    if (!result.user) {
      console.error('[registerUser] No user in response');
      return { 
        user: null, 
        error: 'Не удалось создать пользователя' 
      };
    }

    console.log('[registerUser] Registration successful for:', result.user.email);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.full_name,
        username: result.user.username,
        avatar_url: result.user.avatar_url
      },
      error: null
    };
  } catch (error) {
    console.error('[registerUser] Unexpected error:', error);
    return { user: null, error: 'Неожиданная ошибка при регистрации' };
  }
}

// Функция для входа пользователя
export async function loginUser(data: LoginData): Promise<AuthResult> {
  try {
    console.log('[loginUser] Attempting login for:', data.email);
    
    // Используем новый API endpoint, который создает серверную сессию
    const response = await fetch('/api/auth/login-new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: data.email,
        password: data.password
      })
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      console.error('[loginUser] Login failed:', result.error);
      return { 
        user: null, 
        error: result.error || 'Ошибка входа' 
      };
    }

    if (!result.user) {
      console.error('[loginUser] No user in response');
      return { 
        user: null, 
        error: 'Не удалось получить данные пользователя' 
      };
    }

    console.log('[loginUser] Login successful for:', result.user.email);

    // Сохраняем Supabase сессию если она есть
    if (result.session && browser) {
      localStorage.setItem('session_token', result.session.access_token);
      localStorage.setItem('refresh_token', result.session.refresh_token);
      console.log('[loginUser] Supabase tokens saved to localStorage');
    }

    // Возвращаем пользователя
    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        full_name: result.user.fullName,
        username: result.user.username,
        avatar_url: result.user.avatarUrl
      },
      error: null
    };
  } catch (error) {
    console.error('[loginUser] Unexpected error:', error);
    return { user: null, error: 'Неожиданная ошибка при входе' };
  }
}

// Функция для выхода пользователя
export async function logoutUser(): Promise<{ error: string | null }> {
  try {
    console.log('[logoutUser] Logging out...');
    
    // Удаляем токены из localStorage (если они есть)
    if (browser) {
      localStorage.removeItem('session_token');
      localStorage.removeItem('refresh_token');
    }

    // Используем новый API endpoint для удаления серверной сессии
    const response = await fetch('/api/auth/logout-new', {
      method: 'POST'
    });

    if (!response.ok) {
      const result = await response.json();
      console.error('[logoutUser] Logout failed:', result.error);
      return { error: result.error || 'Ошибка выхода' };
    }

    console.log('[logoutUser] Logout successful');
    return { error: null };
  } catch (error) {
    console.error('[logoutUser] Unexpected error:', error);
    return { error: 'Неожиданная ошибка при выходе' };
  }
}

// Функция для обновления сессии Supabase
export async function refreshSession(): Promise<AuthResult> {
  try {
    // Обновляем сессию через Supabase
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error || !data.session || !data.user) {
      console.warn('Supabase session refresh error (keeping user logged in):', error);
      // НЕ выкидываем пользователя - просто возвращаем ошибку
      return { user: null, error: error?.message || 'Не удалось обновить сессию' };
    }

    // Сохраняем новые токены
    if (browser) {
      localStorage.setItem('session_token', data.session.access_token);
      localStorage.setItem('refresh_token', data.session.refresh_token);
    }

    console.log('Session refreshed successfully for user:', data.user.email);
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.user_metadata?.full_name || 'User',
        username: data.user.user_metadata?.username || 'user',
        avatar_url: data.user.user_metadata?.avatar_url
      },
      error: null
    };
  } catch (error) {
    console.warn('Refresh session error (keeping user logged in):', error);
    // НЕ выкидываем пользователя
    return { user: null, error: 'Неожиданная ошибка при обновлении сессии' };
  }
}

// Функция для получения текущего пользователя
export async function getCurrentUser(): Promise<AuthResult> {
  try {
    // Проверяем, что мы в браузере
    if (!browser) {
      console.log('[getCurrentUser] Not in browser environment');
      return { user: null, error: 'Не в браузере' };
    }

    // Получаем токен сессии из localStorage
    let accessToken = localStorage.getItem('session_token');
    
    if (!accessToken) {
      console.log('[getCurrentUser] No access token found');
      return { user: null, error: 'Пользователь не аутентифицирован' };
    }

    console.log('[getCurrentUser] Checking auth with API...');

    // Проверяем токен через наш API
    let response = await fetch('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    // Если токен истёк (401), пробуем обновить его
    if (response.status === 401) {
      console.log('[getCurrentUser] Token expired, attempting refresh...');
      
      const refreshResult = await refreshSession();
      
      if (refreshResult.error || !refreshResult.user) {
        console.warn('[getCurrentUser] Failed to refresh session (keeping logged in):', refreshResult.error);
        // НЕ выкидываем - просто возвращаем ошибку, токены остаются
        return { user: null, error: 'Сессия истекла, не удалось обновить' };
      }
      
      // Получаем новый токен после обновления
      accessToken = localStorage.getItem('session_token');
      
      if (!accessToken) {
        console.warn('[getCurrentUser] No token after refresh (keeping logged in)');
        return { user: null, error: 'Не удалось получить новый токен' };
      }
      
      // Повторяем запрос с новым токеном
      console.log('[getCurrentUser] Retrying with refreshed token...');
      response = await fetch('/api/auth/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
    }

    if (!response.ok) {
      console.warn('[getCurrentUser] Auth API returned (keeping logged in):', response.status);
      // НЕ выкидываем пользователя
      return { user: null, error: 'Ошибка аутентификации' };
    }

    const data = await response.json();
    
    if (!data.user) {
      console.warn('[getCurrentUser] No user in response (keeping logged in)');
      // НЕ выкидываем пользователя
      return { user: null, error: 'Пользователь не найден' };
    }

    console.log('[getCurrentUser] User authenticated:', data.user.email);

    return {
      user: {
        id: data.user.id,
        email: data.user.email || '',
        full_name: data.user.fullName || data.user.full_name || 'User',
        username: data.user.username || 'user',
        avatar_url: data.user.avatarUrl || data.user.avatar_url
      },
      error: null
    };
  } catch (error) {
    console.warn('[getCurrentUser] Error (keeping logged in):', error);
    // НЕ выкидываем пользователя
    return { user: null, error: 'Ошибка при получении пользователя' };
  }
}

// Функция для обновления профиля пользователя
export async function updateUserProfile(userId: string, updates: {
  full_name?: string;
  username?: string;
  avatar_url?: string;
}): Promise<AuthResult> {
  try {
    // Получаем токен из Supabase
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      return { user: null, error: 'Пользователь не аутентифицирован' };
    }

    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });

    const result = await response.json();
    
    if (!response.ok) {
      return { user: null, error: result.error || 'Ошибка обновления профиля' };
    }

    return result;
  } catch (error) {
    console.error('Update profile error:', error);
    return { user: null, error: 'Неожиданная ошибка при обновлении профиля' };
  }
}

// Функция для проверки доступности username
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
    console.error('Check username availability error:', error);
    return { available: false, error: 'Неожиданная ошибка при проверке username' };
  }
}

// Дополнительная функция для проверки доступности email
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
    console.error('Check email availability error:', error);
    return { available: false, error: 'Неожиданная ошибка при проверке email' };
  }
}
