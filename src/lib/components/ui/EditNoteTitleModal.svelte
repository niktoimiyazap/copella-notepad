<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		isOpen: boolean;
		currentTitle: string;
		onSave?: (newTitle: string) => void;
		onCancel?: () => void;
	}

	let { isOpen, currentTitle, onSave, onCancel }: Props = $props();
	
	let inputElement: HTMLInputElement;
	let newTitle = $state('');

	// Синхронизируем с текущим названием при открытии
	$effect(() => {
		if (isOpen) {
			newTitle = currentTitle;
		}
	});

	onMount(() => {
		// Фокус на input при открытии
		if (isOpen && inputElement) {
			setTimeout(() => {
				inputElement.focus();
				inputElement.select();
			}, 100);
		}
	});

	function handleSave() {
		if (newTitle.trim() && newTitle.trim() !== currentTitle) {
			onSave?.(newTitle.trim());
		}
		onCancel?.();
	}

	function handleCancel() {
		newTitle = currentTitle;
		onCancel?.();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			handleSave();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			handleCancel();
		}
	}
</script>

{#if isOpen}
	<div class="modal-overlay" onclick={handleCancel}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<h3 class="modal-title">Редактировать название заметки</h3>
			
			<div class="form-group">
				<label for="note-title-input" class="form-label">Название</label>
				<input
					id="note-title-input"
					bind:this={inputElement}
					bind:value={newTitle}
					class="form-input"
					placeholder="Введите название заметки"
					onkeydown={handleKeyDown}
					maxlength="100"
				/>
			</div>
			
			<div class="modal-actions">
				<button class="btn btn--secondary" onclick={handleCancel}>
					Отмена
				</button>
				<button 
					class="btn btn--primary" 
					onclick={handleSave}
					disabled={!newTitle.trim() || newTitle.trim() === currentTitle}
				>
					Сохранить
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: scale(0.95) translateY(-10px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.modal-content {
		background: #1a1a1a;
		border-radius: 12px;
		padding: 32px;
		width: 90%;
		max-width: 400px;
		border: 1px solid #2a2a2a;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
		animation: slideIn 0.2s ease-out;
	}

	.modal-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 18px;
		color: #ffffff;
		margin: 0 0 24px 0;
		text-align: center;
	}

	.form-group {
		margin-bottom: 32px;
	}

	.form-input {
		background: #2A2A2A;
		border: 1px solid #3A3A3A;
		border-radius: 12px;
		padding: 16px;
		font-family: 'Gilroy', sans-serif;
		font-size: 16px;
		color: #ffffff;
		transition: all 0.2s ease;
		width: 100%;
	}

	.form-input:focus {
		outline: none;
		border-color: #FEB1FF;
		box-shadow: 0 0 0 3px rgba(254, 177, 255, 0.1);
	}

	.form-input::placeholder {
		color: #888888;
	}

	.form-label {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		color: #ffffff;
		margin-bottom: 8px;
		display: block;
	}

	.modal-actions {
		display: flex;
		gap: 16px;
		justify-content: flex-end;
		margin-top: 8px;
	}

	.modal-actions .btn {
		min-width: 100px;
		flex-shrink: 0;
	}
</style>
