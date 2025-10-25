import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

// GET: Get notification settings
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
      emailNotifications: settings.emailNotifications,
      mentionNotifications: settings.mentionNotifications,
      inviteNotifications: settings.inviteNotifications,
      commentNotifications: settings.commentNotifications,
      roomActivityNotifications: settings.roomActivityNotifications,
      browserNotifications: settings.browserNotifications,
      soundEnabled: settings.soundEnabled
    });
  } catch (error) {
    console.error('Get notification settings error:', error);
    return json({ error: 'Ошибка получения настроек' }, { status: 500 });
  }
};

// PATCH: Update notification settings
export const PATCH: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const data = await request.json();

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
    console.error('Update notification settings error:', error);
    return json({ error: 'Ошибка обновления настроек' }, { status: 500 });
  }
};

