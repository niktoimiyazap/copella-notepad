<script lang="ts">
	import '../../../app.css';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { getRoom } from '$lib/rooms';

	let { children } = $props();

	// Получаем ID комнаты из параметров маршрута
	const roomId = $derived($page.params.roomId);
	let roomTitle = $state<string>('Загрузка...');

	// Загружаем название комнаты
	onMount(async () => {
		if (roomId) {
			try {
				const { room, error } = await getRoom(roomId);
				if (room && !error) {
					roomTitle = room.title;
				} else {
					roomTitle = `Комната ${roomId}`;
				}
			} catch (err) {
				console.error('Error loading room title:', err);
				roomTitle = `Комната ${roomId}`;
			}
		}
	});

	function handleBackToApp() {
		// Возвращаемся на страницу комнаты, если roomId доступен
		if (roomId) {
			goto(`/room/${roomId}`);
		} else if (window.history.length > 1) {
			// Если нет roomId, возвращаемся на предыдущую страницу в истории браузера
			window.history.back();
		} else {
			// Если нет истории, переходим на главную страницу
			goto('/');
		}
	}
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<title>Управление пользователями - {roomTitle} - Copella Notepad</title>
</svelte:head>

<div class="user-management-layout">
	<header class="layout-header">
		<div class="header-content">
			<button class="back-button" onclick={handleBackToApp}>
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M19 12H5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					<path d="M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				<span>Вернуться в приложение</span>
			</button>
			
			<div class="header-title">
				<h1>Управление пользователями</h1>
				<p>Административная панель {roomTitle ? `для комнаты "${roomTitle}"` : ''}</p>
			</div>
		</div>
	</header>
	
	<main class="layout-main">
		{@render children?.()}
	</main>
</div>

<style>
	.user-management-layout {
		height: 100vh;
		background: #f8f9fa;
		color: #202124;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.layout-header {
		background: #ffffff;
		border-bottom: 1px solid #dadce0;
		padding: 16px 24px;
		box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
	}

	.header-content {
		max-width: 100%;
		margin: 0;
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.back-button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 16px;
		background: #ffffff;
		border: 1px solid #dadce0;
		border-radius: 4px;
		color: #5f6368;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background: #f8f9fa;
		border-color: #1a73e8;
		color: #1a73e8;
		box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
	}

	.header-title h1 {
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
		font-size: 22px;
		color: #202124;
		margin: 0 0 4px 0;
		line-height: 1.2;
		letter-spacing: 0;
	}

	.header-title p {
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #5f6368;
		margin: 0;
		line-height: 1.4;
	}

	.layout-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		padding: 16px;
		height: 0; /* Это заставляет flex-элемент правильно рассчитывать высоту */
	}

	:global(.user-management-layout *) {
		box-sizing: border-box;
	}

	:global(.user-management-layout h1, 
		.user-management-layout h2, 
		.user-management-layout h3, 
		.user-management-layout h4, 
		.user-management-layout h5, 
		.user-management-layout h6) {
		margin: 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	:global(.user-management-layout p) {
		margin: 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	:global(.user-management-layout button) {
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	:global(.user-management-layout input, 
		.user-management-layout select, 
		.user-management-layout textarea) {
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}


	/* Адаптивность */
	@media (max-width: 768px) {
		.layout-header {
			padding: 12px 16px;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}

		.header-title h1 {
			font-size: 18px;
		}
	}
</style>