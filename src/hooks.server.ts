import { getUserFromSession } from '$lib/session-new';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	// Проверяем сессию пользователя
	const { user } = await getUserFromSession(event);
	
	// Добавляем пользователя в locals для доступа на страницах
	event.locals.user = user || undefined;
	
	return resolve(event);
};

