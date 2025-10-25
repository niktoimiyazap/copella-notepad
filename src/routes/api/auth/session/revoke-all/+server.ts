import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

// POST: Revoke all sessions except current
export const POST: RequestHandler = async ({ locals, cookies }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const currentToken = cookies.get('sb-access-token');

    // Delete all sessions except the current one
    await prisma.session.deleteMany({
      where: {
        userId: user.id,
        token: {
          not: currentToken || ''
        }
      }
    });

    return json({ success: true, message: 'Все остальные сессии завершены' });
  } catch (error) {
    console.error('Revoke all sessions error:', error);
    return json({ error: 'Ошибка завершения сессий' }, { status: 500 });
  }
};

