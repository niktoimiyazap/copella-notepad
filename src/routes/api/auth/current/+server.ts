import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase-server';
import { ensureUserProfile } from '$lib/utils/userManagement';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  try {
    // Получаем токен из заголовков
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ user: null, error: 'Токен авторизации не найден' }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // 1. Получаем текущего пользователя из Supabase Auth
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return json({ user: null, error: authError?.message || 'Пользователь не аутентифицирован' }, { status: 401 });
    }

    // 2. Получаем данные пользователя из нашей собственной базы данных
    const { user: userData, error: userError } = await ensureUserProfile(authUser);
    
    if (userError) {
      return json({ user: null, error: userError }, { status: 500 });
    }

    return json({ user: userData, error: null });
  } catch (error) {
    console.error('Get current user error:', error);
    return json({ user: null, error: 'Неожиданная ошибка при получении пользователя' }, { status: 500 });
  }
};
