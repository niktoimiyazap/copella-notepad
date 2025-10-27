import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase-server';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    // 1. Проверяем аутентификацию через Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return json({ user: null, error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return json({ user: null, error: 'Ошибка аутентификации' }, { status: 400 });
    }

    // 2. Получаем данные пользователя из нашей собственной базы данных
    const userData = await prisma.user.findUnique({
      where: { id: authData.user.id }
    });

    if (!userData) {
      return json({ user: null, error: 'Профиль пользователя не найден' }, { status: 404 });
    }

    return json({ 
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.fullName,
        username: userData.username,
        avatar_url: userData.avatarUrl
      }, 
      error: null 
    });
  } catch (error) {
    console.error('Login error:', error);
    return json({ user: null, error: 'Неожиданная ошибка при входе' }, { status: 500 });
  }
};
