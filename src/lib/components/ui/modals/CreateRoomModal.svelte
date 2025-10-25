<script lang="ts">
	import Modal from './Modal.svelte';
	import type { ModalProps } from './types';
	import { createRoomFormActions, initializeRoomFormState } from './roomForm';

	let { isOpen, onClose, onSubmit }: ModalProps = $props();
	
	// Инициализируем состояние формы
	let formState = $state(initializeRoomFormState());
	
	// Создаем действия для формы
	const formActions = createRoomFormActions(
		formState,
		(updates) => {
			Object.assign(formState, updates);
		},
		onSubmit,
		onClose,
		false // не режим редактирования
	);
</script>

<Modal {isOpen} onClose={formActions.handleClose} title="Создать комнату">
	<form onsubmit={formActions.handleSubmit} class="create-room-form">
		<!-- Название комнаты -->
		<div class="form-group">
			<label for="room-title" class="form-label">Название комнаты</label>
			<input
				id="room-title"
				type="text"
				bind:value={formState.title}
				placeholder="Введите название комнаты"
				class="form-input"
				required
				disabled={formState.isLoading}
				maxlength="50"
			/>
			<div class="char-counter">
				<span class:char-counter--warning={formState.title.length > 40}>
					{formState.title.length}/50
				</span>
			</div>
		</div>

		<!-- Тип комнаты -->
		<div class="form-group">
			<label class="form-label">Тип комнаты</label>
			<div class="button-group">
				<button
					type="button"
					class="type-button" class:type-button--active={formState.isPublic}
					onclick={() => formState.isPublic = true}
					disabled={formState.isLoading}
				>
					<span class="type-icon">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
							<path d="M2 12h20" stroke="currentColor" stroke-width="2"/>
							<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" stroke="currentColor" stroke-width="2"/>
						</svg>
					</span>
				<span class="type-text">
					<span class="type-title">Публичная</span>
					<span class="type-description">Доступна по ссылке</span>
				</span>
				</button>
				<button
					type="button"
					class="type-button" class:type-button--active={!formState.isPublic}
					onclick={() => formState.isPublic = false}
					disabled={formState.isLoading}
				>
					<span class="type-icon">
						<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
							<circle cx="12" cy="16" r="1" fill="currentColor"/>
							<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2"/>
						</svg>
					</span>
			<span class="type-text">
				<span class="type-title">Приватная</span>
				<span class="type-description">Личное пространство</span>
			</span>
				</button>
			</div>
		</div>

		<!-- Обложка -->
		<div class="form-group">
			<label class="form-label">Обложка комнаты</label>
			<div class="cover-upload-section">
				{#if formState.uploadedImageUrl}
					<div class="cover-preview-container">
						<img src={formState.uploadedImageUrl} alt="Cover preview" class="cover-preview-image" />
						<button
							type="button"
							class="btn btn--icon-sm btn--ghost"
							onclick={formActions.removeUploadedImage}
							disabled={formState.isLoading}
							aria-label="Удалить обложку"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
						</button>
					</div>
				{:else}
					<div class="cover-upload-area">
						{#if formState.isUploading}
							<div class="upload-loading">
								<div class="spinner"></div>
								<span class="upload-text">Загрузка...</span>
							</div>
						{:else}
							<input
								type="file"
								id="cover-upload"
								accept="image/*"
								onchange={formActions.handleImageUpload}
								disabled={formState.isLoading}
								class="cover-upload-input"
							/>
							<label for="cover-upload" class="cover-upload-label">
								<div class="upload-icon">
									<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
										<path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										<polyline points="17,8 12,3 7,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
										<line x1="12" y1="3" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
									</svg>
								</div>
								<span class="upload-text">Загрузить обложку</span>
								<span class="upload-hint">JPG, PNG до 5MB</span>
							</label>
						{/if}
					</div>
				{/if}
			</div>
	</div>

	<!-- Лимит участников (только для публичных комнат) -->
	{#if formState.isPublic}
	<div class="form-group">
		<label for="participant-limit" class="form-label">Лимит участников</label>
		<div class="range-container">
			<input
				id="participant-limit"
				type="range"
				min="1"
				max="50"
				bind:value={formState.participantLimit}
				class="range-input"
				disabled={formState.isLoading}
			/>
			<div class="range-value">
				<span class="range-number">{formState.participantLimit}</span>
				<span class="range-unit">человек</span>
			</div>
		</div>
	</div>
	{/if}

	<!-- Кнопки действий -->
		<div class="form-actions">
			<button
				type="button"
				class="btn btn--secondary"
				onclick={formActions.handleClose}
				disabled={formState.isLoading || formState.isUploading}
			>
				Отмена
			</button>
			<button
				type="submit"
				class="btn btn--primary"
				disabled={formState.isLoading || formState.isUploading || !formState.title.trim()}
			>
				{#if formState.isLoading}
					<span class="loading-spinner"></span>
					Создание...
				{:else}
					Создать комнату
				{/if}
			</button>
		</div>
	</form>
</Modal>

<style>
	.create-room-form {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	/* Загрузка обложки */
	.cover-upload-section {
		width: 100%;
	}

	.cover-upload-area {
		width: 100%;
		aspect-ratio: 16 / 9;
		background: #2A2A2A;
		border: 2px dashed #3A3A3A;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.cover-upload-area:hover {
		border-color: #FEB1FF;
		background: #2A2A2A;
	}

	.cover-upload-input {
		display: none;
	}

	.cover-upload-label {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		cursor: pointer;
		width: 100%;
		height: 100%;
	}

	.upload-icon {
		width: 48px;
		height: 48px;
		color: #888888;
		transition: color 0.2s ease;
	}

	.cover-upload-area:hover .upload-icon {
		color: #FEB1FF;
	}

	.upload-text {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 16px;
		color: #888888;
		transition: color 0.2s ease;
	}

	.cover-upload-area:hover .upload-text {
		color: #FEB1FF;
	}

	.upload-hint {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #666666;
	}

	.upload-loading {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		height: 100%;
		min-height: 150px;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 3px solid #3A3A3A;
		border-top-color: #FEB1FF;
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.cover-preview-container {
		width: 100%;
		aspect-ratio: 16 / 9;
		position: relative;
		border-radius: 12px;
		overflow: hidden;
		background: #2A2A2A;
	}

	.cover-preview-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	/* Кнопка удаления обложки */
	.cover-preview-container .btn {
		position: absolute;
		top: 8px;
		right: 8px;
		background: #000000;
		border: 1px solid #3A3A3A;
	}

	.cover-preview-container .btn:hover:not(:disabled) {
		background: #EF4444;
		border-color: #EF4444;
		transform: scale(1.05);
	}

	/* Слайдер для лимита участников */
	.range-container {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.range-input {
		flex: 1;
		height: 6px;
		background: #3A3A3A;
		border-radius: 3px;
		outline: none;
		cursor: pointer;
		-webkit-appearance: none;
		appearance: none;
	}

	.range-input::-webkit-slider-track {
		height: 6px;
		background: #3A3A3A;
		border-radius: 3px;
	}

	.range-input::-moz-range-track {
		height: 6px;
		background: #3A3A3A;
		border-radius: 3px;
		border: none;
	}

	.range-input::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: #FEB1FF;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
		border: none;
		box-shadow: none;
	}

	.range-input::-webkit-slider-thumb:hover {
		transform: none;
	}

	.range-input::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: #FEB1FF;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}

	.range-value {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 80px;
	}

	.range-number {
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 24px;
		color: #FEB1FF;
	}

	.range-unit {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 12px;
		color: #888888;
	}

	/* Кнопки действий */
	.form-actions {
		display: flex;
		gap: 16px;
		justify-content: flex-end;
		padding-top: 8px;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	/* Счетчик символов */
	.char-counter {
		display: flex;
		justify-content: flex-end;
		margin-top: 4px;
	}

	.char-counter span {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 12px;
		color: #888888;
		transition: color 0.2s ease;
	}

	.char-counter--warning {
		color: #FEB1FF !important;
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.create-room-form {
			gap: 20px;
		}

		.button-group {
			flex-direction: column;
		}

		.form-actions {
			flex-direction: column;
		}

		.form-actions .btn {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.create-room-form {
			gap: 16px;
		}

		.type-button {
			padding: 12px;
			gap: 12px;
		}

		.upload-text {
			font-size: 14px;
		}

		.upload-hint {
			font-size: 12px;
		}
	}
</style>