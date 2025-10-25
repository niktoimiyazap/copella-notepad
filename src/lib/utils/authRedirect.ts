/**
 * Централизованная обработка ошибок авторизации с редиректом на логин
 */
import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { userActions } from '$lib/stores/user';

/**
 * Перенаправляет пользователя на страницу логина и очищает данные сессии
 */
export function redirectToLogin() {
	if (!browser) {
		return;
	}
	
	console.warn('[AuthRedirect] Unauthorized - redirecting to login page');
	
	// Очищаем пользователя и токены
	userActions.logout();
	
	// Перенаправляем на страницу логина
	goto('/auth/login', { replaceState: true });
}

/**
 * Проверяет, является ли ответ ошибкой авторизации (401)
 * и перенаправляет пользователя на страницу логина если токен не может быть обновлен
 */
export function handleUnauthorizedResponse(response: Response, afterRefreshAttempt: boolean = false): boolean {
	if (response.status === 401 && afterRefreshAttempt) {
		// Если это 401 ПОСЛЕ попытки обновить токен - редиректим на логин
		redirectToLogin();
		return true;
	}
	return false;
}

