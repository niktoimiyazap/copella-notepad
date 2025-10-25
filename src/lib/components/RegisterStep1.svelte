<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { goto } from '$app/navigation';

	const dispatch = createEventDispatcher<{
		next: { fullName: string; email: string; password: string };
		change: { fullName: string; email: string; password: string };
	}>();

	let fullName = $state('');
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let isLoading = $state(false);
	let error = $state('');
	let fullNameError = $state('');
	let emailError = $state('');
	let passwordError = $state('');

	function handleFullNameInput(event: Event) {
		const target = event.target as HTMLInputElement;
		fullName = target.value;
		
		if (fullNameError) {
			fullNameError = '';
		}
		if (error) {
			error = '';
		}

		validateFullName();
		dispatch('change', { fullName, email, password });
	}

	function handleEmailInput(event: Event) {
		const target = event.target as HTMLInputElement;
		email = target.value;
		
		if (emailError) {
			emailError = '';
		}
		if (error) {
			error = '';
		}

		validateEmail();
		dispatch('change', { fullName, email, password });
	}

	function handlePasswordInput(event: Event) {
		const target = event.target as HTMLInputElement;
		password = target.value;
		
		if (passwordError) {
			passwordError = '';
		}
		if (error) {
			error = '';
		}

		validatePassword();
		dispatch('change', { fullName, email, password });
	}

	function validateFullName() {
		if (!fullName.trim()) {
			fullNameError = '';
			return false;
		}

		if (fullName.trim().length < 2) {
			fullNameError = 'Имя должно содержать минимум 2 символа';
			return false;
		}

		if (fullName.trim().length > 50) {
			fullNameError = 'Имя не должно превышать 50 символов';
			return false;
		}

		fullNameError = '';
		return true;
	}

	function validateEmail() {
		if (!email.trim()) {
			emailError = '';
			return false;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email.trim())) {
			emailError = 'Введите корректный email адрес';
			return false;
		}

		emailError = '';
		return true;
	}

	function validatePassword() {
		if (!password) {
			passwordError = '';
			return false;
		}

		if (password.length < 6) {
			passwordError = 'Пароль должен содержать минимум 6 символов';
			return false;
		}

		if (password.length > 100) {
			passwordError = 'Пароль не должен превышать 100 символов';
			return false;
		}

		passwordError = '';
		return true;
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function handleSubmit() {
		// Валидация всех полей
		const isFullNameValid = validateFullName();
		const isEmailValid = validateEmail();
		const isPasswordValid = validatePassword();

		if (!fullName.trim()) {
			error = 'Пожалуйста, введите ваше имя';
			return;
		}

		if (!email.trim()) {
			error = 'Пожалуйста, введите email';
			return;
		}

		if (!password) {
			error = 'Пожалуйста, введите пароль';
			return;
		}

		if (!isFullNameValid || !isEmailValid || !isPasswordValid) {
			error = 'Пожалуйста, исправьте ошибки в форме';
			return;
		}

		isLoading = true;
		dispatch('next', { 
			fullName: fullName.trim(), 
			email: email.trim().toLowerCase(), 
			password 
		});
	}

	function setError(message: string) {
		error = message;
	}

	function setLoading(loading: boolean) {
		isLoading = loading;
	}

	// Экспортируем функции для родительского компонента
	export { setError, setLoading };
</script>

<div class="register-step1-container">
	<div class="register-step1-header">
		<h1 class="register-step1-title">Создать аккаунт</h1>
		<p class="register-step1-subtitle">Начните с основных данных</p>
	</div>

	<div class="register-step1-form">
		<div class="input-group">
			<label for="fullName" class="input-label">Полное имя</label>
			<input
				id="fullName"
				type="text"
				bind:value={fullName}
				oninput={handleFullNameInput}
				placeholder="Ваше имя"
				class="modern-input"
				class:error={fullNameError}
				required
				disabled={isLoading}
				maxlength="50"
			/>
			{#if fullNameError}
				<div class="input-error">
					{fullNameError}
				</div>
			{/if}
		</div>

		<div class="input-group">
			<label for="email" class="input-label">Email</label>
			<input
				id="email"
				type="email"
				bind:value={email}
				oninput={handleEmailInput}
				placeholder="your@email.com"
				class="modern-input"
				class:error={emailError}
				required
				disabled={isLoading}
			/>
			{#if emailError}
				<div class="input-error">
					{emailError}
				</div>
			{/if}
		</div>

		<div class="input-group">
			<label for="password" class="input-label">Пароль</label>
			<div class="password-wrapper">
				<input
					id="password"
					type={showPassword ? 'text' : 'password'}
					bind:value={password}
					oninput={handlePasswordInput}
					placeholder="••••••••"
					class="modern-input password-input"
					class:error={passwordError}
					required
					disabled={isLoading}
					maxlength="100"
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
			{#if passwordError}
				<div class="input-error">
					{passwordError}
				</div>
			{/if}
		</div>

		{#if error}
			<div class="error-alert">
				{error}
			</div>
		{/if}

		<button
			type="button"
			class="submit-btn"
			onclick={handleSubmit}
			disabled={isLoading}
		>
			{#if isLoading}
				<span class="btn-spinner"></span>
				Отправка...
			{:else}
				Продолжить
			{/if}
		</button>
	</div>

	<div class="register-step1-footer">
		<span>Уже есть аккаунт?</span>
		<button type="button" class="login-link" onclick={() => goto('/auth/login')}>
			Войти
		</button>
	</div>
</div>

<style>
	.register-step1-container {
		display: flex;
		flex-direction: column;
		gap: 32px;
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
	}

	.register-step1-header {
		text-align: center;
	}

	.register-step1-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 800;
		font-size: 36px;
		color: #FFFFFF;
		margin: 0 0 8px 0;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.register-step1-subtitle {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 18px;
		color: #888888;
		margin: 0;
	}

	.register-step1-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
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

	.modern-input.error {
		border-color: #FF4444;
		background: #2A1A1A;
	}

	.input-error {
		font-family: 'Gilroy', sans-serif;
		font-size: 12px;
		color: #FF4444;
		margin-top: 4px;
	}

	.password-wrapper {
		position: relative;
	}

	.password-input {
		padding-right: 50px;
	}

	.password-toggle {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		padding: 6px;
		border-radius: 4px;
		transition: background-color 0.2s ease;
	}

	.password-toggle:hover:not(:disabled) {
		background: rgba(254, 177, 255, 0.1);
	}

	.password-toggle:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.password-toggle img {
		width: 18px;
		height: 18px;
		opacity: 0.8;
		filter: brightness(0) invert(1);
	}

	.password-toggle:hover:not(:disabled) img {
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
		transition: background-color 0.2s ease;
	}

	.submit-btn:hover:not(:disabled) {
		background: #FF9EFF;
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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

	.register-step1-footer {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		color: #888888;
	}

	.login-link {
		background: none;
		border: none;
		color: #FEB1FF;
		cursor: pointer;
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		font-weight: 600;
		text-decoration: none;
		transition: color 0.2s ease;
	}

	.login-link:hover {
		color: #FF9EFF;
		text-decoration: underline;
	}

	/* Мобильные стили */
	@media (max-width: 480px) {
		.register-step1-container {
			padding: 0 16px;
		}

		.register-step1-title {
			font-size: 28px;
		}

		.register-step1-subtitle {
			font-size: 16px;
		}
	}
</style>
