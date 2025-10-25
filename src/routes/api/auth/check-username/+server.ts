import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { username } = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    return json({ available: !existingUser, error: null });
  } catch (error) {
    console.error('Check username availability error:', error);
    return json({ available: false, error: 'Неожиданная ошибка при проверке username' }, { status: 500 });
  }
};
