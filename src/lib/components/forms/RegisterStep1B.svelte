<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		next: { password: string };
		back: void;
		change: { password: string };
	}>();

	let password = $state('');
	let confirmPassword = $state('');
	let showPassword = $state(false);
	let showConfirmPassword = $state(false);
	let isLoading = $state(false);
	let error = $state('');
	let passwordError = $state('');
	let confirmPasswordError = $state('');

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
		validateConfirmPassword();
		dispatch('change', { password });
	}

	function handleConfirmPasswordInput(event: Event) {
		const target = event.target as HTMLInputElement;
		confirmPassword = target.value;
		
		if (confirmPasswordError) {
			confirmPasswordError = '';
		}
		if (error) {
			error = '';
		}

		validateConfirmPassword();
		dispatch('change', { password });
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

	function validateConfirmPassword() {
		if (!confirmPassword) {
			confirmPasswordError = '';
			return false;
		}

		if (password !== confirmPassword) {
			confirmPasswordError = 'Пароли не совпадают';
			return false;
		}

		confirmPasswordError = '';
		return true;
	}

	function togglePasswordVisibility() {
		showPassword = !showPassword;
	}

	function toggleConfirmPasswordVisibility() {
		showConfirmPassword = !showConfirmPassword;
	}

	function handleSubmit() {
		// Валидация всех полей
		const isPasswordValid = validatePassword();
		const isConfirmPasswordValid = validateConfirmPassword();

		if (!password) {
			error = 'Пожалуйста, введите пароль';
			return;
		}

		if (!confirmPassword) {
			error = 'Пожалуйста, подтвердите пароль';
			return;
		}

		if (!isPasswordValid || !isConfirmPasswordValid) {
			error = 'Пожалуйста, исправьте ошибки в форме';
			return;
		}

		isLoading = true;
		dispatch('next', { password });
	}

	function handleBack() {
		dispatch('back');
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

<div class="register-step1b-container">
	<div class="register-step1b-header">
		<h1 class="register-step1b-title">Создать пароль</h1>
		<p class="register-step1b-subtitle">Придумайте надежный пароль</p>
	</div>

	<div class="register-step1b-form">
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

		<div class="input-group">
			<label for="confirmPassword" class="input-label">Подтвердите пароль</label>
			<div class="password-wrapper">
				<input
					id="confirmPassword"
					type={showConfirmPassword ? 'text' : 'password'}
					bind:value={confirmPassword}
					oninput={handleConfirmPasswordInput}
					placeholder="••••••••"
					class="modern-input password-input"
					class:error={confirmPasswordError}
					required
					disabled={isLoading}
					maxlength="100"
				/>
				<button
					type="button"
					class="password-toggle"
					onclick={toggleConfirmPasswordVisibility}
					disabled={isLoading}
				>
					{#if showConfirmPassword}
						<img src="/icons/eye-off.svg" alt="Скрыть пароль" />
					{:else}
						<img src="/icons/eye.svg" alt="Показать пароль" />
					{/if}
				</button>
			</div>
			{#if confirmPasswordError}
				<div class="input-error">
					{confirmPasswordError}
				</div>
			{/if}
		</div>

		{#if error}
			<div class="error-alert">
				{error}
			</div>
		{/if}

		<div class="button-group">
			<button
				type="button"
				class="back-btn"
				onclick={handleBack}
				disabled={isLoading}
			>
				Назад
			</button>

			<button
				type="button"
				class="submit-btn"
				onclick={handleSubmit}
				disabled={isLoading}
			>
				{#if isLoading}
					<span class="btn-spinner"></span>
					Создание...
				{:else}
					Продолжить
				{/if}
			</button>
		</div>
	</div>
</div>

<style>
	.register-step1b-container {
		display: flex;
		flex-direction: column;
		gap: 32px;
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
	}

	.register-step1b-header {
		text-align: center;
	}

	.register-step1b-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 800;
		font-size: 36px;
		color: #FFFFFF;
		margin: 0 0 8px 0;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.register-step1b-subtitle {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 18px;
		color: #888888;
		margin: 0;
	}

	.register-step1b-form {
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

	.button-group {
		display: flex;
		gap: 12px;
	}

	.back-btn {
		background: #2A2A2A;
		color: #FFFFFF;
		border: 2px solid #3A3A3A;
		border-radius: 8px;
		padding: 16px 24px;
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 16px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		letter-spacing: 0.02em;
		transition: all 0.2s ease;
	}

	.back-btn:hover:not(:disabled) {
		background: #3A3A3A;
		border-color: #4A4A4A;
	}

	.back-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
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

	/* Мобильные стили */
	@media (max-width: 480px) {
		.register-step1b-container {
			padding: 0 16px;
		}

		.register-step1b-title {
			font-size: 28px;
		}

		.register-step1b-subtitle {
			font-size: 16px;
		}

		.button-group {
			flex-direction: column;
		}
	}
</style>
