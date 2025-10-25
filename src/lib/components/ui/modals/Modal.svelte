<script lang="ts">
	interface Props {
		isOpen: boolean;
		onClose: () => void;
		title?: string;
		className?: string;
	}

	let { 
		isOpen, 
		onClose, 
		title, 
		className = '' 
	}: Props = $props();

	function handleBackdropClick(event: Event) {
		if (event.target === event.currentTarget) {
			onClose();
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div 
		class="modal-backdrop" 
		onclick={handleBackdropClick}
		onkeydown={handleKeydown}
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? "modal-title" : undefined}
	>
		<div class="modal-container" class:modal-container--custom={className}>
			<div class="modal-header">
				{#if title}
					<h2 id="modal-title" class="modal-title">{title}</h2>
				{/if}
				<button 
					class="btn btn--icon btn--ghost" 
					onclick={onClose}
					aria-label="Закрыть модальное окно"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</button>
			</div>
			<div class="modal-content">
				<slot />
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 20px;
	}

	.modal-container {
		background: #1e1e1e;
		border-radius: 16px;
		border: 1px solid #3a3a3a;
		max-width: 450px;
		width: 100%;
		max-height: 90vh;
		overflow: hidden;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		display: flex;
		flex-direction: column;
	}

	.modal-container--custom {
		/* Дополнительные стили для кастомных модалок */
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		border-bottom: 1px solid #3a3a3a;
		margin-bottom: 0;
	}

	.modal-title {
		font-weight: 600;
		font-size: 16px;
		color: #ffffff;
		margin: 0;
	}

	.modal-content {
		padding: 16px;
		overflow-y: auto;
		flex: 1;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		transition: all 0.15s ease;
		text-decoration: none;
		outline: none;
	}

	.btn--icon {
		width: 24px;
		height: 24px;
		padding: 0;
	}

	.btn--ghost {
		background: transparent;
		color: #cccccc;
	}

	.btn--ghost:hover {
		background: #3a3a3a;
		color: #ffffff;
	}
</style>