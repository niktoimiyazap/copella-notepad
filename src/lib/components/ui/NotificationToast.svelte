<script lang="ts">
	import { onMount } from 'svelte';

	interface Props {
		message: string;
		type?: 'success' | 'error' | 'info' | 'warning';
		duration?: number;
		onClose?: () => void;
	}

	let { 
		message, 
		type = 'info', 
		duration = 5000, 
		onClose 
	}: Props = $props();

	let isVisible = $state(true);
	let progress = $state(100);

	onMount(() => {
		// Автоматически скрываем уведомление через указанное время
		const interval = setInterval(() => {
			progress -= 100 / (duration / 100);
			if (progress <= 0) {
				clearInterval(interval);
				close();
			}
		}, 100);

		return () => clearInterval(interval);
	});

	function close() {
		isVisible = false;
		setTimeout(() => {
			onClose?.();
		}, 300); // Ждем завершения анимации
	}

	function getTypeStyles() {
		switch (type) {
			case 'success':
				return 'bg-green-50 border-green-200 text-green-800';
			case 'error':
				return 'bg-red-50 border-red-200 text-red-800';
			case 'warning':
				return 'bg-yellow-50 border-yellow-200 text-yellow-800';
			default:
				return 'bg-blue-50 border-blue-200 text-blue-800';
		}
	}

	function getIcon() {
		switch (type) {
			case 'success':
				return '✅';
			case 'error':
				return '❌';
			case 'warning':
				return '⚠️';
			default:
				return 'ℹ️';
		}
	}
</script>

{#if isVisible}
	<div class="fixed top-4 right-4 z-50 max-w-sm w-full">
		<div class="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden {getTypeStyles()}">
			<div class="p-4">
				<div class="flex items-start">
					<div class="flex-shrink-0 text-lg mr-3">
						{getIcon()}
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium">
							{message}
						</p>
					</div>
					<button 
						onclick={close}
						class="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
			</div>
			<div class="h-1 bg-gray-200">
				<div 
					class="h-full bg-current transition-all duration-100 ease-linear"
					style="width: {progress}%"
				></div>
			</div>
		</div>
	</div>
{/if}
