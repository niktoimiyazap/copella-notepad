<script lang="ts">
	interface Props {
		canEdit?: boolean;
		onCreateNote?: () => void;
	}

	let { canEdit = true, onCreateNote }: Props = $props();
</script>

<div class="note-placeholder">
	<div class="placeholder-content">
		<h2 class="placeholder-title">
			{#if canEdit}
				Заметка не выбрана
			{:else}
				У вас нет прав на создание заметок
			{/if}
		</h2>
		{#if canEdit && onCreateNote}
			<button class="btn btn--primary create-note-btn" onclick={() => onCreateNote?.()}>
				<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M12 5v14M5 12h14"/>
				</svg>
				<span>Создать заметку</span>
			</button>
		{/if}
	</div>
</div>

<style>
	.note-placeholder {
		height: 100%;
		width: 100%;
		background: #121212;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.placeholder-content {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
	}

	.placeholder-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 24px;
		color: #7e7e7e;
		margin: 0;
		line-height: 1.2;
	}

	.create-note-btn {
		/* Используем стили из глобальной системы кнопок */
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 12px 16px;
		border: none;
		border-radius: 12px;
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		line-height: 1.2;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		outline: none;
		position: relative;
		overflow: hidden;
		background-color: #FEB1FF;
		color: #000000;
	}

	.create-note-btn:hover:not(:disabled) {
		background-color: #FF9EFF;
		color: #000000;
		transform: translateY(-1px);
	}

	.create-note-btn:focus-visible {
		outline: 2px solid #FEB1FF;
		outline-offset: 2px;
	}

	/* Анимация появления */
	.placeholder-content {
		animation: fadeIn 0.4s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.placeholder-content {
			gap: 20px;
			padding: 0 20px;
		}

		.placeholder-title {
			font-size: 20px;
		}
	}

	@media (max-width: 480px) {
		.placeholder-content {
			gap: 16px;
			padding: 0 16px;
		}

		.placeholder-title {
			font-size: 18px;
		}
	}
</style>
