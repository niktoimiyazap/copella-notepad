<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		complete: { username: string; avatarUrl: string | null };
		change: { username: string; avatarUrl: string | null };
	}>();

	let username = $state('');
	let avatarFile = $state<FileList | null>(null);
	let avatarPreview = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let usernameError = $state('');

	function handleUsernameInput(event: Event) {
		const target = event.target as HTMLInputElement;
		username = target.value;
		
		// Убираем ошибку при вводе
		if (usernameError) {
			usernameError = '';
		}
		if (error) {
			error = '';
		}

		// Валидация в реальном времени
		validateUsername();
		
		dispatch('change', { username, avatarUrl: avatarPreview || null });
	}

	function validateUsername() {
		if (!username) {
			usernameError = '';
			return false;
		}

		if (username.length < 3) {
			usernameError = 'Никнейм должен содержать минимум 3 символа';
			return false;
		}

		if (username.length > 20) {
			usernameError = 'Никнейм не должен превышать 20 символов';
			return false;
		}

		if (!/^[a-zA-Z0-9_]+$/.test(username)) {
			usernameError = 'Никнейм может содержать только буквы, цифры и подчеркивания';
			return false;
		}

		usernameError = '';
		return true;
	}

	function handleAvatarChange() {
		if (avatarFile && avatarFile[0]) {
			const file = avatarFile[0];
			
			// Проверяем размер файла (максимум 5MB)
			if (file.size > 5 * 1024 * 1024) {
				error = 'Размер файла не должен превышать 5MB';
				return;
			}

			// Проверяем тип файла
			if (!file.type.startsWith('image/')) {
				error = 'Пожалуйста, выберите изображение';
				return;
			}

			const reader = new FileReader();
			reader.onload = (e) => {
				avatarPreview = e.target?.result as string;
				error = '';
				dispatch('change', { username, avatarUrl: avatarPreview });
			};
			reader.readAsDataURL(file);
		}
	}

	function removeAvatar() {
		avatarPreview = '';
		avatarFile = null;
		error = '';
		dispatch('change', { username, avatarUrl: null });
	}

	function handleSubmit() {
		if (!username.trim()) {
			error = 'Пожалуйста, введите никнейм';
			return;
		}

		if (!validateUsername()) {
			error = usernameError;
			return;
		}

		isLoading = true;
		dispatch('complete', { 
			username: username.trim(),
			avatarUrl: avatarPreview || null
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

<div class="username-selection-container">
	<div class="username-selection-header">
		<h2 class="username-selection-title">Завершите настройку профиля</h2>
		<p class="username-selection-subtitle">Выберите никнейм и аватарку</p>
	</div>

	<div class="username-selection-form">
		<!-- Компактная секция с аватаркой и никнеймом -->
		<div class="profile-section">
			<label class="input-label">Профиль</label>
			
			<div class="profile-input-group">
				<!-- Аватарка слева -->
				<div class="avatar-container">
					{#if avatarPreview}
						<div class="avatar-preview">
							<img src={avatarPreview} alt="Preview" />
							<button type="button" class="remove-avatar-btn" onclick={removeAvatar} disabled={isLoading}>
								×
							</button>
						</div>
					{:else}
						<div class="avatar-placeholder">
							<input
								type="file"
								accept="image/*"
								bind:files={avatarFile}
								onchange={handleAvatarChange}
								class="avatar-input"
								id="avatar"
								disabled={isLoading}
							/>
							<label for="avatar" class="avatar-upload-btn">
								+
							</label>
						</div>
					{/if}
				</div>

				<!-- Поле никнейма справа -->
				<div class="username-input-container">
					<input
						id="username"
						type="text"
						bind:value={username}
						oninput={handleUsernameInput}
						placeholder="Ваш никнейм"
						class="username-input"
						class:error={usernameError}
						required
						disabled={isLoading}
						maxlength="20"
					/>
					{#if usernameError}
						<div class="input-error">
							{usernameError}
						</div>
					{/if}
				</div>
			</div>
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
			disabled={isLoading || !username.trim() || !!usernameError}
		>
			{#if isLoading}
				<span class="btn-spinner"></span>
				Создание аккаунта...
			{:else}
				Завершить регистрацию
			{/if}
		</button>
	</div>
</div>

<style>
	.username-selection-container {
		display: flex;
		flex-direction: column;
		gap: 32px;
		width: 100%;
		max-width: 500px;
		margin: 0 auto;
	}

	.username-selection-header {
		text-align: center;
	}

	.username-selection-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 800;
		font-size: 32px;
		color: #FFFFFF;
		margin: 0 0 8px 0;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.username-selection-subtitle {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 18px;
		color: #888888;
		margin: 0;
	}

	.username-selection-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.profile-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.input-label {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		color: #FFFFFF;
		letter-spacing: 0.02em;
	}

	.profile-input-group {
		display: flex;
		align-items: flex-start;
		gap: 16px;
	}

	.avatar-container {
		flex-shrink: 0;
	}

	.avatar-preview {
		position: relative;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		overflow: hidden;
		border: 1px solid #3A3A3A;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar-preview img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.remove-avatar-btn {
		position: absolute;
		top: -4px;
		right: -4px;
		width: 20px;
		height: 20px;
		background: #FF4444;
		color: #FFFFFF;
		border: none;
		border-radius: 50%;
		font-size: 12px;
		font-weight: bold;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	.remove-avatar-btn:hover:not(:disabled) {
		background: #FF6666;
	}

	.remove-avatar-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.avatar-placeholder {
		position: relative;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		border: 1px dashed #3A3A3A;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #1A1A1A;
		transition: border-color 0.2s ease;
	}

	.avatar-placeholder:hover {
		border-color: #FEB1FF;
	}

	.avatar-input {
		display: none;
	}

	.avatar-upload-btn {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #888888;
		font-size: 20px;
		font-weight: 300;
		cursor: pointer;
		transition: color 0.2s ease;
	}

	.avatar-placeholder:hover .avatar-upload-btn {
		color: #FEB1FF;
	}

	.username-input-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.username-input {
		background: #1A1A1A;
		border: 1px solid #2A2A2A;
		border-radius: 8px;
		padding: 12px 16px;
		font-family: 'Gilroy', sans-serif;
		font-size: 16px;
		color: #FFFFFF;
		width: 100%;
		transition: all 0.2s ease;
	}

	.username-input:focus {
		outline: none;
		border-color: #FEB1FF;
		background: #1F1F1F;
	}

	.username-input::placeholder {
		color: #666666;
	}

	.username-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.username-input.error {
		border-color: #FF4444;
		background: #2A1A1A;
	}

	.input-error {
		font-family: 'Gilroy', sans-serif;
		font-size: 12px;
		color: #FF4444;
		margin-top: 2px;
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

	/* Мобильные стили */
	@media (max-width: 480px) {
		.username-selection-title {
			font-size: 24px;
		}

		.username-selection-subtitle {
			font-size: 16px;
		}

		.profile-input-group {
			gap: 12px;
		}

		.avatar-preview,
		.avatar-placeholder {
			width: 40px;
			height: 40px;
		}

		.remove-avatar-btn {
			width: 18px;
			height: 18px;
			font-size: 10px;
		}

		.username-input {
			padding: 10px 14px;
			font-size: 14px;
		}
	}
</style>
