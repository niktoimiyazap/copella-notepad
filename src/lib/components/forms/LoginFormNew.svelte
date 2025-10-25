<script lang="ts">
	import { loginSchema, type LoginInput, getFieldErrors } from '$lib/validation/schemas';
	import { toast } from 'svelte-sonner';
	
	interface Props {
		onSubmit: (data: LoginInput) => Promise<void>;
		isLoading?: boolean;
	}
	
	let { onSubmit, isLoading = false }: Props = $props();
	
	let email = $state('');
	let password = $state('');
	let showPassword = $state(false);
	let errors = $state<Record<string, string>>({});
	
	async function handleSubmit(event: Event) {
		event.preventDefault();
		errors = {};
		
		// Валидация с zod
		const result = loginSchema.safeParse({ email, password });
		
		if (!result.success) {
			errors = getFieldErrors(result.error);
			toast.error('Пожалуйста, исправьте ошибки в форме');
			return;
		}
		
		// Вызываем родительский обработчик
		await onSubmit(result.data);
	}
	
	function handleEmailInput() {
		if (errors.email) errors = { ...errors, email: '' };
	}
	
	function handlePasswordInput() {
		if (errors.password) errors = { ...errors, password: '' };
	}
</script>

<form onsubmit={handleSubmit} class="login-form">
	<!-- Email -->
	<div class="input-group">
		<label for="email" class="input-label">Email</label>
		<input
			id="email"
			type="email"
			bind:value={email}
			oninput={handleEmailInput}
			placeholder="your@email.com"
			class="modern-input"
			class:error={errors.email}
			disabled={isLoading}
			required
		/>
		{#if errors.email}
			<span class="error-text">{errors.email}</span>
		{/if}
	</div>

	<!-- Password -->
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
				class:error={errors.password}
				disabled={isLoading}
				required
			/>
			<button
				type="button"
				class="password-toggle"
				onclick={() => showPassword = !showPassword}
				disabled={isLoading}
			>
				{#if showPassword}
					<img src="/icons/eye-off.svg" alt="Скрыть" />
				{:else}
					<img src="/icons/eye.svg" alt="Показать" />
				{/if}
			</button>
		</div>
		{#if errors.password}
			<span class="error-text">{errors.password}</span>
		{/if}
	</div>

	<!-- Submit button -->
	<button type="submit" class="submit-btn" disabled={isLoading}>
		{#if isLoading}
			Вход...
		{:else}
			Войти
		{/if}
	</button>
</form>

<style>
	.login-form {
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
		color: #E0E0E0;
	}

	.modern-input {
		width: 100%;
		padding: 14px 16px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		font-family: 'Gilroy', sans-serif;
		font-size: 16px;
		color: #FFFFFF;
		transition: all 0.2s ease;
	}

	.modern-input:focus {
		outline: none;
		background: rgba(255, 255, 255, 0.08);
		border-color: #FEB1FF;
		box-shadow: 0 0 0 3px rgba(254, 177, 255, 0.1);
	}

	.modern-input.error {
		border-color: #FF6B6B;
	}

	.modern-input:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.password-wrapper {
		position: relative;
		width: 100%;
	}

	.password-input {
		padding-right: 48px;
	}

	.password-toggle {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		cursor: pointer;
		padding: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.6;
		transition: opacity 0.2s ease;
	}

	.password-toggle:hover {
		opacity: 1;
	}

	.password-toggle:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.password-toggle img {
		width: 20px;
		height: 20px;
		filter: invert(1);
	}

	.error-text {
		font-family: 'Gilroy', sans-serif;
		font-size: 13px;
		color: #FF6B6B;
		margin-top: -4px;
	}

	.submit-btn {
		width: 100%;
		padding: 16px;
		background: linear-gradient(135deg, #FEB1FF 0%, #C89DFF 100%);
		border: none;
		border-radius: 12px;
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 16px;
		color: #121212;
		cursor: pointer;
		transition: all 0.2s ease;
		margin-top: 8px;
	}

	.submit-btn:hover:not(:disabled) {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(254, 177, 255, 0.4);
	}

	.submit-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
		transform: none;
	}
</style>

