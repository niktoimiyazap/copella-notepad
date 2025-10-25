import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

// GET: Get all user sessions
export const GET: RequestHandler = async ({ locals, cookies }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const currentToken = cookies.get('sb-access-token');

    const sessions = await prisma.session.findMany({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date()
        }
      },
      orderBy: {
        lastActivityAt: 'desc'
      }
    });

    // Parse user agents and mark current session
    const sessionsWithInfo = sessions.map((session) => {
      const ua = session.userAgent || '';
      const isCurrent = session.token === currentToken;

      // Simple user agent parsing
      let browser = 'Неизвестный браузер';
      let os = 'Неизвестная ОС';

      if (ua.includes('Chrome')) browser = 'Chrome';
      else if (ua.includes('Firefox')) browser = 'Firefox';
      else if (ua.includes('Safari')) browser = 'Safari';
      else if (ua.includes('Edge')) browser = 'Edge';

      if (ua.includes('Windows')) os = 'Windows';
      else if (ua.includes('Mac')) os = 'macOS';
      else if (ua.includes('Linux')) os = 'Linux';
      else if (ua.includes('Android')) os = 'Android';
      else if (ua.includes('iOS') || ua.includes('iPhone')) os = 'iOS';

      return {
        id: session.id,
        browser,
        os,
        ip: session.ipAddress,
        lastActiveAt: session.lastActivityAt,
        userAgent: session.userAgent,
        isCurrent
      };
    });

    return json({ sessions: sessionsWithInfo });
  } catch (error) {
    console.error('Get sessions error:', error);
    return json({ error: 'Ошибка получения сессий' }, { status: 500 });
  }
};

