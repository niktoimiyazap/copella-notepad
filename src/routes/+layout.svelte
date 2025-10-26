<script lang="ts">
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import { Toaster } from 'svelte-sonner';
	import { UserManagementContainer } from '$lib/api/user-management';
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount, setContext } from 'svelte';
	import { currentUser } from '$lib/stores/user';

	let { children, data } = $props();
	
	// Проверяем, находимся ли мы на страницах аутентификации
	const isAuthPage = $derived($page.url.pathname.startsWith('/auth'));
	const isDocsPage = $derived($page.url.pathname.startsWith('/docs'));
	const isUserManagementPage = $derived($page.url.pathname.startsWith('/users'));
	
	// Управление состоянием левого сайдбара для мобильных
	let isLeftSidebarOpen = $state(false);
	let isMobile = $state(false);
	let windowWidth = $state(0);

	// Reactive derived value for mobile detection
	const isMobileDevice = $derived(windowWidth <= 768);
	
	// Effect to update isMobile when windowWidth changes
	$effect(() => {
		isMobile = isMobileDevice;
	});

	function toggleLeftSidebar() {
		isLeftSidebarOpen = !isLeftSidebarOpen;
	}

	// Предоставляем функцию toggle через context для использования в дочерних компонентах
	setContext('toggleLeftSidebar', toggleLeftSidebar);
	setContext('isLeftSidebarOpen', () => isLeftSidebarOpen);
	setContext('isMobile', () => isMobile);
	
	// Функция для обновления высоты viewport (важно для мобильных браузеров)
	function updateViewportHeight() {
		// Получаем реальную высоту окна браузера
		const vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
	}
	
	onMount(() => {
		// Отслеживаем размер окна для определения мобильного устройства
		windowWidth = window.innerWidth;
		isMobile = windowWidth <= 768;
		
		// Устанавливаем правильную высоту viewport при загрузке
		updateViewportHeight();
		
		const handleResize = () => {
			windowWidth = window.innerWidth;
			// Обновляем высоту viewport при изменении размера окна
			updateViewportHeight();
		};
		
		// Обработчик для iOS Safari (когда появляется/исчезает адресная строка)
		const handleOrientationChange = () => {
			updateViewportHeight();
		};
		
		window.addEventListener('resize', handleResize);
		window.addEventListener('orientationchange', handleOrientationChange);
		
		// Также обновляем при скролле (для некоторых мобильных браузеров)
		let ticking = false;
		const handleScroll = () => {
			if (!ticking) {
				window.requestAnimationFrame(() => {
					updateViewportHeight();
					ticking = false;
				});
				ticking = true;
			}
		};
		
		// На мобильных устройствах следим за scroll для обновления высоты
		if (isMobile) {
			window.addEventListener('scroll', handleScroll, { passive: true });
		}
		
		return () => {
			window.removeEventListener('resize', handleResize);
			window.removeEventListener('orientationchange', handleOrientationChange);
			if (isMobile) {
				window.removeEventListener('scroll', handleScroll);
			}
		};
	});
	
	// Используем данные из $currentUser
	// Данные загружаются асинхронно через API на главной странице
	const userNickname = $derived(
		$currentUser ? `@${$currentUser.username}` : '@user'
	);
	
	const userAvatar = $derived($currentUser?.avatarUrl ?? null);
</script>

<svelte:head>
	<link rel="icon" href="/favicon.svg" />
	<title>Copella Notepad</title>
</svelte:head>

<div class="app" class:docs-page={isDocsPage} class:user-management-page={isUserManagementPage} class:auth-page={isAuthPage}>
	{#if !isDocsPage && !isUserManagementPage && !isAuthPage}
		<Sidebar 
			userNickname={userNickname} 
			userAvatar={userAvatar}
			isMini={true}
			isOpen={isLeftSidebarOpen}
			onToggle={toggleLeftSidebar}
		/>
	{/if}
	
	<main class="main-content" class:full-width={isDocsPage || isUserManagementPage || isAuthPage}>
		{@render children?.()}
	</main>
</div>

<!-- Toast уведомления -->
<Toaster 
	position="top-right" 
	richColors 
	closeButton
	duration={4000}
/>

<!-- Контейнер для виджета управления пользователями -->
<UserManagementContainer />
