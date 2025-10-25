<script lang="ts">
	interface Props {
		error: string;
		onRetry: () => void;
		onReload?: () => void;
	}
	
	let { error, onRetry, onReload }: Props = $props();
</script>

<div class="error-placeholder">
	<div class="error-content">
		<div class="error-icon">
			<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" fill="currentColor"/>
			</svg>
		</div>
		
		<h2 class="error-title">Ошибка загрузки</h2>
		<p class="error-message">{error}</p>
		
		<div class="error-actions">
			<button 
				onclick={onRetry} 
				class="btn btn--primary"
			>
				Попробовать снова
			</button>
			{#if onReload}
				<button 
					onclick={onReload} 
					class="btn btn--secondary"
				>
					Обновить страницу
				</button>
			{/if}
		</div>
	</div>
</div>

<style>
	.error-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		background-color: #121212;
		padding: 40px 24px;
	}

	.error-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 500px;
		gap: 24px;
		animation: fadeIn 0.3s ease;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.error-icon {
		width: 64px;
		height: 64px;
		color: #FEB1FF;
		opacity: 0.8;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 0.8;
		}
		50% {
			opacity: 0.5;
		}
	}

	.error-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 28px;
		color: #ffffff;
		margin: 0;
		letter-spacing: -0.5px;
	}

	.error-message {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 16px;
		color: #7E7E7E;
		margin: 0;
		line-height: 1.6;
	}

	.error-actions {
		display: flex;
		gap: 12px;
		flex-wrap: wrap;
		justify-content: center;
		margin-top: 8px;
	}

	/* Адаптивность для мобильных */
	@media (max-width: 480px) {
		.error-placeholder {
			padding: 24px 16px;
		}

		.error-content {
			gap: 20px;
		}

		.error-icon {
			width: 48px;
			height: 48px;
		}

		.error-title {
			font-size: 24px;
		}

		.error-message {
			font-size: 14px;
		}

		.error-actions {
			flex-direction: column;
			width: 100%;
		}

		.error-actions .btn {
			width: 100%;
		}
	}
</style>

