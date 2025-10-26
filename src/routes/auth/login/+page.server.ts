import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Редирект отключен - проверка авторизации только на клиенте
	// Избегаем циклических редиректов между / и /auth/login
	return {
		user: locals.user || null
	};
};

