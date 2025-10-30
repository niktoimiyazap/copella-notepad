<script lang="ts">
	// RoomLoading component - минималистичный компонент загрузки с логотипом и анимацией
	interface Props {
		isVisible?: boolean;
		showAnimation?: boolean; // Показывать ли анимацию вместо статичного логотипа
	}

	let { isVisible = true, showAnimation = false }: Props = $props();
	let loadingElement: HTMLElement;
	let animationStarted = $state(false);
	let isZooming = $state(false);
	
	// Отслеживаем изменение showAnimation для плавного перехода
	$effect(() => {
		if (showAnimation && !animationStarted) {
			// Небольшая задержка для плавного появления анимации
			setTimeout(() => {
				animationStarted = true;
			}, 300);
		} else if (!showAnimation) {
			animationStarted = false;
		}
	});
	
	// Отслеживаем скрытие для запуска zoom эффекта
	$effect(() => {
		if (!isVisible && animationStarted) {
			// Запускаем эффект приближения перед исчезновением
			isZooming = true;
		} else if (isVisible) {
			isZooming = false;
		}
	});
</script>

<div class="room-loading" bind:this={loadingElement} class:room-loading--hidden={!isVisible}>
	<div class="loading-content">
		<!-- Логотип по центру (показывается сначала) -->
		<div class="logo-container" class:logo-container--hidden={animationStarted} class:logo-container--fading={isZooming}>
			<img 
				src="/logo/cnotepad.png" 
				alt="Copella Notepad" 
				class="loading-logo" 
			/>
			<!-- Белый спиннер под логотипом -->
			<div class="white-spinner"></div>
		</div>
		
		<!-- Элегантная анимация "печатающихся" точек -->
		<div class="animation-container" class:animation-container--visible={animationStarted} class:animation-container--zooming={isZooming}>
			<div class="typing-loader">
				<div class="typing-dot dot-1"></div>
				<div class="typing-dot dot-2"></div>
				<div class="typing-dot dot-3"></div>
			</div>
		</div>
	</div>
</div>

<style>
	.room-loading {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #121212;
		z-index: 9999;
		opacity: 1;
		visibility: visible;
		pointer-events: auto;
	}
	
	.room-loading--hidden {
		opacity: 0;
		visibility: hidden;
		pointer-events: none;
		transition: opacity 0.6s ease 0.3s, visibility 0.6s ease 0.3s;
	}
	
	.loading-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		position: relative;
		width: 120px;
		height: 120px;
	}
	
	.logo-container {
		display: flex;
		align-items: center;
		justify-content: center;
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		opacity: 1;
		transition: opacity 0.5s ease, transform 0.5s ease;
		z-index: 2;
	}
	
	.logo-container--hidden {
		opacity: 0;
		transform: translate(-50%, -50%) scale(0.8);
		pointer-events: none;
	}
	
	/* Затухание логотипа при zoom эффекте */
	.logo-container--fading {
		opacity: 0 !important;
		transition: opacity 0.3s ease;
	}
	
	.loading-logo {
		width: 48px;
		height: 48px;
		opacity: 0.9;
		filter: brightness(1.1);
	}
	
	/* Белый спиннер под логотипом - минималистичный и элегантный */
	.white-spinner {
		position: absolute;
		top: calc(50% + 50px);
		left: 50%;
		transform: translate(-50%, -50%);
		width: 20px;
		height: 20px;
		border: 2px solid rgba(255, 255, 255, 0.08);
		border-top-color: rgba(255, 255, 255, 0.6);
		border-radius: 50%;
		animation: white-spinner-rotate 1s linear infinite;
	}
	
	@keyframes white-spinner-rotate {
		0% {
			transform: translate(-50%, -50%) rotate(0deg);
		}
		100% {
			transform: translate(-50%, -50%) rotate(360deg);
		}
	}
	
	/* Контейнер для элегантной анимации */
	.animation-container {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%) scale(1);
		width: 80px;
		height: 30px;
		opacity: 0;
		transition: opacity 0.5s ease, transform 0.4s ease;
		z-index: 1;
	}
	
	.animation-container--visible {
		opacity: 1;
	}
	
	/* Эффект приближения при исчезновении */
	.animation-container--zooming {
		transform: translate(-50%, -50%) scale(1.8);
		opacity: 0;
		transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease;
	}
	
	/* Контейнер для печатающихся точек */
	.typing-loader {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		width: 100%;
		height: 100%;
	}
	
	/* Точки - минималистичные, элегантные */
	.typing-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background-color: rgba(254, 177, 255, 0.9);
		animation: typing-bounce 1.4s ease-in-out infinite;
	}
	
	.dot-1 {
		animation-delay: 0s;
	}
	
	.dot-2 {
		animation-delay: 0.2s;
	}
	
	.dot-3 {
		animation-delay: 0.4s;
	}
	
	/* Анимация "печатания" - плавное появление и исчезание */
	@keyframes typing-bounce {
		0%, 60%, 100% {
			transform: translateY(0);
			opacity: 0.4;
		}
		30% {
			transform: translateY(-12px);
			opacity: 1;
		}
	}
</style>
