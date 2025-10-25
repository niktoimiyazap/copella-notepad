<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { currentUser, authState, userActions } from '$lib/stores/user';
	import { fetchCurrentUser } from '$lib/api/userApi';

	interface Props {
		children: any;
		redirectTo?: string;
	}

	let { children, redirectTo = '/auth/login' }: Props = $props();

	let authChecked = $state(false);

	onMount(async () => {
		console.log('[AuthGuard] Starting auth check...');
		
		// Проверка аутентификации выполняется только на клиенте
		if (!browser) {
			console.log('[AuthGuard] Not in browser, marking as checked');
			authChecked = true;
			return;
		}

		// Проверяем, инициализирован ли уже store
		if (userActions.isInitialized()) {
			// Store уже инициализирован, проверяем авторизацию
			const user = userActions.getUser();
			if (user) {
				console.log('[AuthGuard] User already in store, access granted');
				authChecked = true;
			} else {
				console.log('[AuthGuard] No user in store, redirecting');
				authChecked = true;
				goto(redirectTo);
			}
			return;
		}

		// Store не инициализирован, пробуем загрузить пользователя
		console.log('[AuthGuard] Store not initialized, fetching user...');
		const { user: fetchedUser, error } = await fetchCurrentUser();
		
		if (error || !fetchedUser) {
			console.log('[AuthGuard] Auth check failed, redirecting');
			authChecked = true;
			goto(redirectTo);
			return;
		}

		console.log('[AuthGuard] User authenticated:', fetchedUser.email);
		authChecked = true;
	});

	// Передаем данные о пользователе в контекст
	// Используем функции-геттеры для реактивности
	setContext('auth', {
		get user() { return $currentUser; },
		get isAuthenticated() { return $authState.isAuthenticated; },
		get authChecked() { return authChecked; }
	});
</script>

{#if !authChecked}
	<div class="auth-loading">
		<div class="loading-content">
			<!-- Логотип по центру -->
			<div class="logo-container">
				<img 
					src="/logo/cnotepad.png" 
					alt="Copella Notepad" 
					class="loading-logo" 
				/>
			</div>
			
			<!-- Минималистичный спиннер -->
			<div class="spinner-container">
				<div class="spinner"></div>
			</div>
		</div>
	</div>
{:else}
	{@render children({ user, isAuthenticated, authChecked })}
{/if}

<style>
	.auth-loading {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #121212;
		z-index: 1000;
	}
	
	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
	}
	
	.logo-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.loading-logo {
		width: 48px;
		height: 48px;
		opacity: 0.9;
		filter: brightness(1.1);
	}
	
	.spinner-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-top: 2px solid #ffffff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { 
			transform: rotate(0deg); 
		}
		100% { 
			transform: rotate(360deg); 
		}
	}
</style>

