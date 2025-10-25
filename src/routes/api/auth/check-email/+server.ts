import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { email } = await request.json();

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    return json({ available: !existingUser, error: null });
  } catch (error) {
    console.error('Check email availability error:', error);
    return json({ available: false, error: 'Неожиданная ошибка при проверке email' }, { status: 500 });
  }
};
