import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Временно отключен редирект - пользователь проверяется на клиенте
	// TODO: Вернуть после настройки SESSION_SECRET на Vercel
	return {
		user: locals.user || null
	};
};

