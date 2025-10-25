<script lang="ts">
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher<{
		complete: { code: string };
		change: { code: string };
	}>();

	let inputs: HTMLInputElement[] = [];
	let code = $state(['', '', '', '', '', '']);
	let currentIndex = $state(0);
	let error = $state('');
	let isLoading = $state(false);

	function handleInput(index: number, event: Event) {
		const target = event.target as HTMLInputElement;
		const value = target.value;

		// Разрешаем только цифры
		if (!/^\d*$/.test(value)) {
			target.value = code[index];
			return;
		}

		// Обновляем код
		code[index] = value;
		
		// Убираем ошибку при вводе
		if (error) {
			error = '';
		}

		// Переходим к следующему полю
		if (value && index < 5) {
			inputs[index + 1]?.focus();
		}

		// Отправляем событие изменения
		dispatch('change', { code: code.join('') });

		// Проверяем, заполнен ли весь код
		if (code.every(digit => digit !== '')) {
			dispatch('complete', { code: code.join('') });
		}
	}

	function handleKeyDown(index: number, event: KeyboardEvent) {
		const target = event.target as HTMLInputElement;

		// Обработка Backspace
		if (event.key === 'Backspace') {
			if (!target.value && index > 0) {
				// Если поле пустое, переходим к предыдущему
				inputs[index - 1]?.focus();
			} else {
				// Очищаем текущее поле
				code[index] = '';
				target.value = '';
				dispatch('change', { code: code.join('') });
			}
		}

		// Обработка стрелок
		if (event.key === 'ArrowLeft' && index > 0) {
			inputs[index - 1]?.focus();
		}
		if (event.key === 'ArrowRight' && index < 5) {
			inputs[index + 1]?.focus();
		}

		// Обработка Enter
		if (event.key === 'Enter') {
			if (code.every(digit => digit !== '')) {
				dispatch('complete', { code: code.join('') });
			}
		}
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const pastedData = event.clipboardData?.getData('text') || '';
		const digits = pastedData.replace(/\D/g, '').slice(0, 6);

		// Заполняем поля
		for (let i = 0; i < 6; i++) {
			code[i] = digits[i] || '';
			if (inputs[i]) {
				inputs[i].value = code[i];
			}
		}

		// Фокусируемся на последнем заполненном поле или первом пустом
		const lastFilledIndex = digits.length - 1;
		const focusIndex = Math.min(lastFilledIndex + 1, 5);
		inputs[focusIndex]?.focus();

		dispatch('change', { code: code.join('') });

		if (digits.length === 6) {
			dispatch('complete', { code: code.join('') });
		}
	}

	function clearCode() {
		code = ['', '', '', '', '', ''];
		inputs.forEach(input => {
			if (input) input.value = '';
		});
		inputs[0]?.focus();
		error = '';
		dispatch('change', { code: '' });
	}

	function setError(message: string) {
		error = message;
	}

	function setLoading(loading: boolean) {
		isLoading = loading;
	}

	// Экспортируем функции для родительского компонента
	export { clearCode, setError, setLoading };
</script>

<div class="code-input-container">
	<div class="code-input-label">
		Введите код подтверждения
	</div>
	
	<div class="code-input-fields">
		{#each code as _, index}
			<input
				bind:this={inputs[index]}
				type="text"
				inputmode="numeric"
				maxlength="1"
				class="code-input-field"
				class:error={error}
				class:loading={isLoading}
				disabled={isLoading}
				oninput={(e) => handleInput(index, e)}
				onkeydown={(e) => handleKeyDown(index, e)}
				onpaste={handlePaste}
				autocomplete="one-time-code"
			/>
		{/each}
	</div>

	{#if error}
		<div class="code-input-error">
			{error}
		</div>
	{/if}

	<div class="code-input-help">
		Код отправлен на ваш email. Проверьте папку "Спам", если не видите письмо.
	</div>
</div>

<style>
	.code-input-container {
		display: flex;
		flex-direction: column;
		gap: 20px;
		width: 100%;
	}

	.code-input-label {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 16px;
		color: #FFFFFF;
		text-align: center;
		letter-spacing: 0.02em;
	}

	.code-input-fields {
		display: flex;
		justify-content: center;
		gap: 12px;
	}

	.code-input-field {
		width: 48px;
		height: 56px;
		background: #1A1A1A;
		border: 2px solid #2A2A2A;
		border-radius: 8px;
		font-family: 'Gilroy', sans-serif;
		font-size: 24px;
		font-weight: 700;
		color: #FFFFFF;
		text-align: center;
		transition: all 0.2s ease;
	}

	.code-input-field:focus {
		outline: none;
		border-color: #FEB1FF;
		background: #1F1F1F;
		box-shadow: 0 0 0 3px rgba(254, 177, 255, 0.1);
	}

	.code-input-field.error {
		border-color: #FF4444;
		background: #2A1A1A;
	}

	.code-input-field.loading {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.code-input-field:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.code-input-error {
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

	.code-input-help {
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		color: #888888;
		text-align: center;
		line-height: 1.4;
	}

	/* Анимация для фокуса */
	.code-input-field:focus {
		animation: pulse 0.3s ease-in-out;
	}

	@keyframes pulse {
		0% { transform: scale(1); }
		50% { transform: scale(1.05); }
		100% { transform: scale(1); }
	}

	/* Мобильные стили */
	@media (max-width: 480px) {
		.code-input-fields {
			gap: 8px;
		}

		.code-input-field {
			width: 40px;
			height: 48px;
			font-size: 20px;
		}

		.code-input-label {
			font-size: 14px;
		}

		.code-input-help {
			font-size: 12px;
		}
	}
</style>
