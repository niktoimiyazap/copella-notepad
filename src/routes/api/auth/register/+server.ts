import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase-server';
import { prisma } from '$lib/prisma';
import { createUserSession } from '$lib/session-new';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
  try {
    const { email, password, full_name, username, avatar_url } = await event.request.json();

    console.log('[Register] Attempting to register user:', email);

    // 1. Сначала регистрируем в Supabase Auth (только email/password)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password
    });

    if (authError) {
      console.error('[Register] Supabase auth error:', authError);
      return json({ user: null, error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return json({ user: null, error: 'Ошибка создания пользователя в Supabase Auth' }, { status: 400 });
    }

    console.log('[Register] Supabase user created:', authData.user.id);

    // 2. Создаем запись в нашей собственной базе данных
    let userData;
    try {
      userData = await prisma.user.create({
        data: {
          id: authData.user.id, // Используем ID из Supabase Auth
          email,
          fullName: full_name,
          username,
          avatarUrl: avatar_url
        }
      });
      console.log('[Register] Database user created:', userData.id);
    } catch (userError) {
      console.error('[Register] Database error:', userError);
      // Если не удалось создать запись в нашей БД, удаляем пользователя из Supabase Auth
      await supabase.auth.admin.deleteUser(authData.user.id);
      return json({ user: null, error: `Ошибка создания профиля: ${userError}` }, { status: 500 });
    }

    // 3. Создаем сессию в cookie
    const sessionResult = await createUserSession(event, userData.id);

    if (sessionResult.error) {
      console.error('[Register] Session creation error:', sessionResult.error);
      return json({ user: null, error: sessionResult.error }, { status: 500 });
    }

    console.log('[Register] Registration successful for:', userData.email);

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
    console.error('[Register] Unexpected error:', error);
    return json({ user: null, error: 'Неожиданная ошибка при регистрации' }, { status: 500 });
  }
};
