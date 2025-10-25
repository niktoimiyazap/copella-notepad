import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

// DELETE: Revoke a specific session
export const DELETE: RequestHandler = async ({ params, locals, cookies }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const sessionId = params.id;
    const currentToken = cookies.get('sb-access-token');

    // Find the session
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      return json({ error: 'Сессия не найдена' }, { status: 404 });
    }

    // Check if user owns this session
    if (session.userId !== user.id) {
      return json({ error: 'Нет доступа' }, { status: 403 });
    }

    // Prevent deleting current session
    if (session.token === currentToken) {
      return json({ error: 'Нельзя завершить текущую сессию' }, { status: 400 });
    }

    // Delete the session
    await prisma.session.delete({
      where: { id: sessionId }
    });

    return json({ success: true });
  } catch (error) {
    console.error('Revoke session error:', error);
    return json({ error: 'Ошибка завершения сессии' }, { status: 500 });
  }
};

