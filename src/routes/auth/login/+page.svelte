<script lang="ts">
	import { login } from '$lib/api/userApi';
	import { currentUser, userActions } from '$lib/stores/user';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let showPassword = $state(false);

	// Проверяем, авторизован ли пользователь
	onMount(async () => {
		// Проверяем и пользователя в store, и наличие токена
		// Это предотвращает редирект-луп после регистрации
		const user = userActions.getUser();
		const token = localStorage.getItem('session_token');
		
		if (user && token) {
			console.log('[Login page] User already authenticated, redirecting to home');
			goto('/');
			return;
		}
		
		// Если есть user в store но нет токена - очищаем store
		if (user && !token) {
			console.log('[Login page] User in store but no token, clearing store');
			userActions.logout();
		}
		
		// Обработка якорных ссылок
		const hash = window.location.hash;
		if (hash === '#login-form') {
			setTimeout(() => {
				const element = document.getElementById('login-form');
				if (element) {
					element.scrollIntoView({ behavior: 'smooth' });
				}
			}, 100);
		}
	});

	async function handleSubmit(event: Event) {
		event.preventDefault();
		
		if (!email || !password) {
			error = 'Пожалуйста, заполните все поля';
			return;
		}

		isLoading = true;
		error = '';

		// Используем единый API для логина
		const { user, error: loginError } = await login(email, password);

		if (loginError) {
			error = loginError;
			isLoading = false;
			return;
		}

		if (user) {
			// Перенаправляем на главную страницу с полной перезагрузкой
			// чтобы серверная сессия обновилась
			console.log('[Login page] Login successful, redirecting to home page');
			window.location.href = '/';
		} else {
			isLoading = false;
		}
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function goToRegister() {
		goto('/auth/register');
	}
</script>

<div class="auth-page">
	<!-- Background grid -->
	<div class="background-grid"></div>
	
	<!-- Main content with asymmetric layout -->
	<div class="auth-layout">
		<!-- Left section - Form -->
		<div class="form-section">
			<div class="form-container">
				<div class="brand-section">
					<img src="/logo/cnotepad-full.png" alt="Copella Notepad" class="brand-logo" />
					<div class="brand-text">
						<h1 class="brand-title">Добро пожаловать</h1>
						<p class="brand-subtitle">Войдите в свой аккаунт</p>
					</div>
				</div>

				<form id="login-form" onsubmit={handleSubmit} class="login-form">
					<div class="input-group">
						<label for="email" class="input-label">Email</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							placeholder="your@email.com"
							class="modern-input"
							required
							disabled={isLoading}
						/>
					</div>

					<div class="input-group">
						<label for="password" class="input-label">Пароль</label>
						<div class="password-wrapper">
							<input
								id="password"
								type={showPassword ? 'text' : 'password'}
								bind:value={password}
								placeholder="••••••••"
								class="modern-input password-input"
								required
								disabled={isLoading}
							/>
							<button
								type="button"
								class="password-toggle"
								onclick={togglePasswordVisibility}
								disabled={isLoading}
							>
								{#if showPassword}
									<img src="/icons/eye-off.svg" alt="Скрыть пароль" />
								{:else}
									<img src="/icons/eye.svg" alt="Показать пароль" />
								{/if}
							</button>
						</div>
					</div>

					{#if error}
						<div class="error-alert">
							{error}
						</div>
					{/if}

					<button
						type="submit"
						class="submit-btn"
						disabled={isLoading}
					>
						{#if isLoading}
							<span class="btn-spinner"></span>
							Вход...
						{:else}
							Войти
						{/if}
					</button>
				</form>

				<div class="form-footer">
					<span>Нет аккаунта?</span>
					<button type="button" class="register-link" onclick={goToRegister}>
						Зарегистрироваться
					</button>
				</div>
			</div>
		</div>

		<!-- Right section - Login image -->
		<div class="visual-section">
			<div class="login-image-container">
				<img src="/images/loginimage.png" alt="Login illustration" class="login-image" />
			</div>
		</div>
	</div>
</div>

<style>
	.auth-page {
		min-height: 100vh;
		background: #121212;
		position: relative;
		overflow: hidden;
		scroll-behavior: smooth;
	}

	.background-grid {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-image: 
			linear-gradient(rgba(254, 177, 255, 0.03) 1px, transparent 1px),
			linear-gradient(90deg, rgba(254, 177, 255, 0.03) 1px, transparent 1px);
		background-size: 50px 50px;
		opacity: 0.5;
	}

	.auth-layout {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		min-height: 100vh;
		position: relative;
		z-index: 1;
	}

	.form-section {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px;
		background: #121212;
	}

	.form-container {
		width: 100%;
		max-width: 400px;
	}

	.brand-section {
		margin-bottom: 40px;
	}

	.brand-logo {
		height: 40px;
		margin-bottom: 20px;
	}

	.brand-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 800;
		font-size: 36px;
		color: #FFFFFF;
		margin: 0 0 8px 0;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.brand-subtitle {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 18px;
		color: #888888;
		margin: 0;
	}

	.login-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
		margin-bottom: 32px;
	}

	.input-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.input-label {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		color: #FFFFFF;
		letter-spacing: 0.02em;
	}

	.modern-input {
		background: #1A1A1A;
		border: 2px solid #2A2A2A;
		border-radius: 8px;
		padding: 16px 20px;
		font-family: 'Gilroy', sans-serif;
		font-size: 16px;
		color: #FFFFFF;
		width: 100%;
	}

	.modern-input:focus {
		outline: none;
		border-color: #FEB1FF;
		background: #1F1F1F;
	}

	.modern-input::placeholder {
		color: #666666;
	}

	.modern-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.password-wrapper {
		position: relative;
	}

	.password-input {
		padding-right: 60px;
	}

	.password-toggle {
		position: absolute;
		right: 16px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		padding: 8px;
		border-radius: 4px;
	}

	.password-toggle:hover {
		background: rgba(254, 177, 255, 0.1);
	}

	.password-toggle img {
		width: 18px;
		height: 18px;
		opacity: 0.8;
		filter: brightness(0) invert(1);
	}

	.password-toggle:hover img {
		opacity: 1;
		filter: brightness(0) invert(1) sepia(1) saturate(5) hue-rotate(280deg);
	}

	.error-alert {
		background: #FF4444;
		color: #FFFFFF;
		padding: 12px 16px;
		border-radius: 8px;
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		font-weight: 500;
		text-align: center;
		border-left: 4px solid #FF6666;
	}

	.submit-btn {
		background: #FEB1FF;
		color: #000000;
		border: none;
		border-radius: 8px;
		padding: 16px 24px;
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 16px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		width: 100%;
		letter-spacing: 0.02em;
	}

	.submit-btn:hover:not(:disabled) {
		background: #FF9EFF;
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}

	.btn-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #000000;
		border-top: 2px solid transparent;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.form-footer {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		color: #888888;
	}

	.register-link {
		background: none;
		border: none;
		color: #FEB1FF;
		cursor: pointer;
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
	}

	.register-link:hover {
		color: #FF9EFF;
		text-decoration: underline;
	}

	.visual-section {
		background: #1A1A1A;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.login-image-container {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.login-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
	}

	@media (max-width: 1024px) {
		.auth-layout {
			grid-template-columns: 1fr;
		}

		.visual-section {
			display: none;
		}

		.form-section {
			padding: 20px;
		}

		.brand-title {
			font-size: 28px;
		}
	}

	@media (max-width: 480px) {
		.form-section {
			padding: 16px;
		}

		.brand-title {
			font-size: 24px;
		}

		.brand-subtitle {
			font-size: 16px;
		}
	}
</style>

