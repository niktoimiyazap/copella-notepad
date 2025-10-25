/**
 * Централизованное управление состоянием пользователя
 * Единый источник правды для данных пользователя во всем приложении
 */
import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

export interface User {
	id: string;
	email: string;
	username: string;
	fullName: string;
	avatarUrl?: string | null;
}

export interface AuthState {
	isAuthenticated: boolean;
	isLoading: boolean;
	error: string | null;
	isInitialized: boolean;
}

// Текущий пользователь - единый источник правды
export const currentUser = writable<User | null>(null);

// Состояние авторизации
export const authState = writable<AuthState>({
	isAuthenticated: false,
	isLoading: true,
	error: null,
	isInitialized: false
});

/**
 * Действия для управления состоянием пользователя
 */
export const userActions = {
	/**
	 * Инициализация пользователя из серверных данных (SSR)
	 * Вызывается один раз при загрузке приложения
	 */
	initializeFromServer(user: User | null) {
		currentUser.set(user);
		authState.update(state => ({
			...state,
			isAuthenticated: !!user,
			isLoading: false,
			isInitialized: true,
			error: null
		}));
	},

	/**
	 * Установка пользователя (после логина, обновления профиля и т.д.)
	 */
	setUser(user: User | null) {
		currentUser.set(user);
		authState.update(state => ({
			...state,
			isAuthenticated: !!user,
			error: null,
			isInitialized: true,
			isLoading: false
		}));
	},

	/**
	 * Обновление данных пользователя (без полной замены)
	 */
	updateUser(updates: Partial<User>) {
		currentUser.update(current => {
			if (current) {
				return { ...current, ...updates };
			}
			return current;
		});
	},
	
	/**
	 * Установка состояния загрузки
	 */
	setLoading(isLoading: boolean) {
		authState.update(state => ({ ...state, isLoading }));
	},
	
	/**
	 * Установка ошибки
	 */
	setError(error: string | null) {
		authState.update(state => ({
			...state,
			error,
			isLoading: false
		}));
	},
	
	/**
	 * Выход пользователя
	 */
	logout() {
		currentUser.set(null);
		authState.update(state => ({
			...state,
			isAuthenticated: false,
			error: null,
			isLoading: false
		}));
		
		// Очистка localStorage токенов
		if (browser) {
			localStorage.removeItem('session_token');
			localStorage.removeItem('refresh_token');
		}
	},

	/**
	 * Проверка инициализации
	 */
	isInitialized(): boolean {
		let initialized = false;
		authState.subscribe(state => {
			initialized = state.isInitialized;
		})();
		return initialized;
	},

	/**
	 * Получение текущего пользователя
	 */
	getUser(): User | null {
		let user: User | null = null;
		currentUser.subscribe(u => {
			user = u;
		})();
		return user;
	}
};

