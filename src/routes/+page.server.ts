import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	// Если пользователь не авторизован - редирект на страницу входа
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}
	
	// Возвращаем данные пользователя
	return {
		user: locals.user
	};
};

