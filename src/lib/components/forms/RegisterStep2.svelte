<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import CodeInput from '../CodeInput.svelte';

	const dispatch = createEventDispatcher<{
		next: { code: string };
		resend: void;
		back: void;
	}>();

	let codeInput: CodeInput;
	let isLoading = $state(false);
	let error = $state('');
	let email = $state('');
	let resendCooldown = $state(0);
	let resendTimer: number;

	function handleCodeComplete(event: CustomEvent<{ code: string }>) {
		const { code } = event.detail;
		isLoading = true;
		error = '';
		dispatch('next', { code });
	}

	function handleCodeChange(event: CustomEvent<{ code: string }>) {
		// Убираем ошибку при вводе кода
		if (error) {
			error = '';
		}
	}

	function handleResend() {
		if (resendCooldown > 0) return;
		
		isLoading = true;
		error = '';
		dispatch('resend');
		
		// Запускаем таймер обратного отсчета
		resendCooldown = 60;
		resendTimer = setInterval(() => {
			resendCooldown--;
			if (resendCooldown <= 0) {
				clearInterval(resendTimer);
			}
		}, 1000);
	}

	function handleBack() {
		dispatch('back');
	}

	function setError(message: string) {
		error = message;
		codeInput?.setError(message);
	}

	function setLoading(loading: boolean) {
		isLoading = loading;
		codeInput?.setLoading(loading);
	}

	function clearCode() {
		codeInput?.clearCode();
	}

	// Экспортируем функции для родительского компонента
	export { setError, setLoading, clearCode };

	// Очищаем таймер при размонтировании компонента
	$effect(() => {
		return () => {
			if (resendTimer) {
				clearInterval(resendTimer);
			}
		};
	});
</script>

<div class="register-step2-container">
	<div class="register-step2-header">
		<h1 class="register-step2-title">Подтвердите email</h1>
		<p class="register-step2-subtitle">
			Код отправлен на <strong>{email}</strong>
		</p>
	</div>

	<div class="register-step2-form">
		<CodeInput
			bind:this={codeInput}
			on:complete={handleCodeComplete}
			on:change={handleCodeChange}
		/>

		{#if error}
			<div class="error-alert">
				{error}
			</div>
		{/if}

		<div class="resend-section">
			<button
				type="button"
				class="resend-btn"
				onclick={handleResend}
				disabled={isLoading || resendCooldown > 0}
			>
				{#if resendCooldown > 0}
					Повторно через {resendCooldown}с
				{:else}
					Отправить повторно
				{/if}
			</button>
		</div>

		<div class="step2-actions">
			<button
				type="button"
				class="back-btn"
				onclick={handleBack}
				disabled={isLoading}
			>
				Назад
			</button>
		</div>
	</div>
</div>

<style>
	.register-step2-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
		max-width: 400px;
		margin: 0 auto;
	}

	.register-step2-header {
		text-align: center;
	}

	.register-step2-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 800;
		font-size: 28px;
		color: #FFFFFF;
		margin: 0 0 8px 0;
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.register-step2-subtitle {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #888888;
		margin: 0;
		line-height: 1.4;
	}

	.register-step2-subtitle strong {
		color: #FEB1FF;
		font-weight: 600;
	}

	.register-step2-form {
		display: flex;
		flex-direction: column;
		gap: 16px;
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

	.resend-section {
		text-align: center;
	}

	.resend-btn {
		background: transparent;
		color: #888888;
		border: 1px solid #2A2A2A;
		border-radius: 6px;
		padding: 8px 16px;
		font-family: 'Gilroy', sans-serif;
		font-size: 13px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.resend-btn:hover:not(:disabled) {
		background: #2A2A2A;
		border-color: #3A3A3A;
		color: #FFFFFF;
	}

	.resend-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.step2-actions {
		display: flex;
		justify-content: center;
		margin-top: 8px;
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

	/* Мобильные стили */
	@media (max-width: 480px) {
		.register-step2-container {
			gap: 16px;
		}

		.register-step2-title {
			font-size: 24px;
		}

		.register-step2-subtitle {
			font-size: 13px;
		}

		.register-step2-form {
			gap: 12px;
		}
	}
</style>
