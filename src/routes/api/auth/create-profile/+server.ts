import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { user_id, email, full_name, username, avatar_url } = await request.json();

    // Создаем запись в нашей собственной базе данных
    const userData = await prisma.user.create({
      data: {
        id: user_id, // Используем ID из Supabase Auth
        email,
        fullName: full_name,
        username,
        avatarUrl: avatar_url
      }
    });

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
    console.error('Create profile error:', error);
    return json({ user: null, error: 'Ошибка создания профиля пользователя' }, { status: 500 });
  }
};
