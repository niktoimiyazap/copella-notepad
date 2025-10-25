import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Возвращаем пользователя из серверной сессии
	// Это позволит сразу инициализировать UI с данными пользователя
	// без дополнительных API запросов
	return {
		user: locals.user ? {
			id: locals.user.id,
			email: locals.user.email,
			username: locals.user.username,
			fullName: locals.user.fullName,
			avatarUrl: locals.user.avatarUrl
		} : null
	};
};

