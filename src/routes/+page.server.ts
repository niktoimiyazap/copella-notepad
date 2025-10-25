import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Возвращаем пользователя если есть в серверной сессии
	// Но не делаем redirect если нет - клиент сам проверит через localStorage
	return {
		user: locals.user || null
	};
};

