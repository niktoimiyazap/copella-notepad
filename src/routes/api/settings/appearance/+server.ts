import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

// GET: Get appearance settings
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
      theme: settings.theme,
      accentColor: settings.accentColor,
      fontSize: settings.fontSize,
      compactMode: settings.compactMode,
      animationsEnabled: settings.animationsEnabled
    });
  } catch (error) {
    console.error('Get appearance settings error:', error);
    return json({ error: 'Ошибка получения настроек' }, { status: 500 });
  }
};

// PATCH: Update appearance settings
export const PATCH: RequestHandler = async ({ request, locals }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const data = await request.json();

    // Validate theme
    if (data.theme && !['dark', 'light', 'auto'].includes(data.theme)) {
      return json({ error: 'Неверное значение темы' }, { status: 400 });
    }

    // Validate fontSize
    if (data.fontSize && !['small', 'medium', 'large'].includes(data.fontSize)) {
      return json({ error: 'Неверное значение размера шрифта' }, { status: 400 });
    }

    // Validate accentColor (basic hex validation)
    if (data.accentColor && !/^#[0-9A-F]{6}$/i.test(data.accentColor)) {
      return json({ error: 'Неверный формат цвета' }, { status: 400 });
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
    console.error('Update appearance settings error:', error);
    return json({ error: 'Ошибка обновления настроек' }, { status: 500 });
  }
};

