import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

// GET: Get privacy settings
export const GET: RequestHandler = async ({ locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Get or create user settings
    let settings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });

    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId: user.id }
      });
    }

    return json({
      profileVisibility: settings.profileVisibility,
      showOnlineStatus: settings.showOnlineStatus,
      allowInvites: settings.allowInvites,
      allowMentions: settings.allowMentions,
      showActivityStatus: settings.showActivityStatus
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    return json({ error: 'Ошибка получения настроек' }, { status: 500 });
  }
};

// PATCH: Update privacy settings
export const PATCH: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const data = await request.json();

    // Validate profileVisibility
    if (data.profileVisibility && !['public', 'private'].includes(data.profileVisibility)) {
      return json({ error: 'Неверное значение видимости профиля' }, { status: 400 });
    }

    // Update or create settings
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...data
      },
      update: data
    });

    return json({ success: true, settings });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    return json({ error: 'Ошибка обновления настроек' }, { status: 500 });
  }
};

