import { getUserFromSession } from '$lib/session-new';
import { supabase } from '$lib/supabase-server';
import { prisma } from '$lib/prisma';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Сначала пробуем получить пользователя из Authorization header (для API запросов)
	const authHeader = event.request.headers.get('Authorization');
	
	if (authHeader && authHeader.startsWith('Bearer ')) {
		try {
			const token = authHeader.substring(7);
			const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
			
			if (!error && supabaseUser) {
				// Получаем пользователя из нашей БД
				const user = await prisma.user.findUnique({
					where: { id: supabaseUser.id },
					select: {
						id: true,
						email: true,
						username: true,
						fullName: true,
						avatarUrl: true,
						createdAt: true
					}
				});
				
				if (user) {
					event.locals.user = user;
					return resolve(event);
				}
			}
		} catch (err) {
			console.error('[hooks.server] Error verifying token:', err);
		}
	}
	
	// Если токена нет или он невалиден, проверяем cookie сессию
	const { user } = await getUserFromSession(event);
	
	// Добавляем пользователя в locals для доступа на страницах
	event.locals.user = user || undefined;
	
	return resolve(event);
};

