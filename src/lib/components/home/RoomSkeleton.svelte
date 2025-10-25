<script lang="ts">
	// RoomSkeleton component props
	interface Props {
		isLarge?: boolean;
	}
	
	let { isLarge = false }: Props = $props();
</script>

<div 
	class="room-skeleton" 
	class:room-skeleton--large={isLarge}
>
	<div class="skeleton-image-container">
		<div class="skeleton-image"></div>
		
		<!-- Скелетон для даты -->
		<div class="skeleton-date"></div>
		
		<!-- Скелетон для количества участников -->
		<div class="skeleton-participants"></div>
		
		<!-- Скелетон для заголовка -->
		<div class="skeleton-title-container">
			<div class="skeleton-title"></div>
		</div>
	</div>
</div>

<style>
	.room-skeleton {
		background: #1A1A1A;
		border-radius: 12px;
		overflow: hidden;
		border: 1px solid #2A2A2A;
		position: relative;
	}
	
	.room-skeleton--large {
		height: 380px;
	}
	
	.room-skeleton:not(.room-skeleton--large) {
		height: 180px;
	}
	
	.skeleton-image-container {
		flex: 1;
		position: relative;
		overflow: hidden;
		width: 100%;
		height: 100%;
	}
	
	.skeleton-image {
		width: 100%;
		height: 100%;
		background: #1F1F1F;
		animation: shimmer 2s infinite ease-in-out;
		opacity: 0.8;
	}
	
	.skeleton-date {
		position: absolute;
		top: 12px;
		left: 12px;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		border-radius: 6px;
		width: 50px;
		height: 20px;
		border: 1px solid rgba(255, 255, 255, 0.05);
		animation: shimmer 2s infinite ease-in-out;
		animation-delay: 0.3s;
		opacity: 0.6;
	}
	
	.skeleton-participants {
		position: absolute;
		top: 12px;
		right: 12px;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		border-radius: 6px;
		width: 35px;
		height: 20px;
		border: 1px solid rgba(255, 255, 255, 0.05);
		animation: shimmer 2s infinite ease-in-out;
		animation-delay: 0.5s;
		opacity: 0.6;
	}
	
	.skeleton-title-container {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(0, 0, 0, 0.6);
		padding: 20px 16px 16px;
	}
	
	.skeleton-title {
		height: 16px;
		background: #2A2A2A;
		border-radius: 3px;
		animation: shimmer 2s infinite ease-in-out;
		animation-delay: 0.7s;
		opacity: 0.7;
	}
	
	@keyframes shimmer {
		0% {
			opacity: 0.4;
		}
		50% {
			opacity: 0.7;
		}
		100% {
			opacity: 0.4;
		}
	}
	
	/* Для больших карточек */
	.room-skeleton--large .skeleton-title {
		height: 20px;
		width: 75%;
	}
	
	.room-skeleton:not(.room-skeleton--large) .skeleton-title {
		height: 14px;
		width: 85%;
	}
</style>
