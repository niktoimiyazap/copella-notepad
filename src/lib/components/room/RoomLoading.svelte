<script lang="ts">
	// RoomLoading component - минималистичный компонент загрузки с логотипом и спиннером
	interface Props {
		isVisible?: boolean;
	}

	let { isVisible = true }: Props = $props();
	let loadingElement: HTMLElement;
</script>

<div class="room-loading" bind:this={loadingElement} class:room-loading--hidden={!isVisible}>
	<div class="loading-content">
		<!-- Логотип по центру -->
		<div class="logo-container">
			<img 
				src="/logo/cnotepad.png" 
				alt="Copella Notepad" 
				class="loading-logo" 
			/>
		</div>
		
		<!-- Минималистичный спиннер -->
		<div class="spinner-container">
			<div class="spinner"></div>
		</div>
	</div>
</div>

<style>
	.room-loading {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #121212;
		z-index: 100;
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
	}
	
	.room-loading--hidden {
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
	}
	
	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
	}
	
	
	.logo-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.loading-logo {
		width: 48px;
		height: 48px;
		opacity: 0.9;
		filter: brightness(1.1);
	}
	
	.spinner-container {
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid rgba(255, 255, 255, 0.1);
		border-top: 2px solid #ffffff;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		0% { 
			transform: rotate(0deg); 
		}
		100% { 
			transform: rotate(360deg); 
		}
	}
	
	
</style>
