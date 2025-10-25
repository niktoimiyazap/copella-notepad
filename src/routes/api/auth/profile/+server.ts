import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

// PATCH: Update user profile
export const PATCH: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { displayName, username, bio } = await request.json();

    // Check if username is taken (if changed)
    if (username && username !== user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username }
      });
      
      if (existingUser) {
        return json({ error: 'Это имя пользователя уже занято' }, { status: 400 });
      }
    }

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: displayName,
        username: username || user.username
      }
    });

    // Update bio in settings
    if (bio !== undefined) {
      await prisma.userSettings.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          bio
        },
        update: {
          bio
        }
      });
    }

    return json({
      id: updatedUser.id,
      email: updatedUser.email,
      displayName: updatedUser.fullName,
      username: updatedUser.username,
      avatarUrl: updatedUser.avatarUrl
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return json({ error: 'Ошибка обновления профиля' }, { status: 500 });
  }
};

// Backward compatibility with PUT
export const PUT = PATCH;
