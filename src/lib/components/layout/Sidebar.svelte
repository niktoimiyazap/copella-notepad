<script lang="ts">
	import '../../styles/sidebar.css';
	import { onMount } from 'svelte';
	import { CreateRoomModal } from '../ui/modals';
	import { goto } from '$app/navigation';
	import { logout } from '$lib/api/userApi';
	import { createRoom } from '$lib/rooms';
	import UserAvatar from '../UserAvatar.svelte';
	
	// Sidebar component props
	interface Props {
		activeRoom?: string;
		userNickname?: string;
		userAvatar?: string;
		isMini?: boolean;
		isOpen?: boolean;
		onToggle?: () => void;
	}
	
	let { activeRoom = '', userNickname = '@nickname', userAvatar, isMini = true, isOpen = false, onToggle }: Props = $props();
	
	let sidebarElement: HTMLElement;
	let backdropElement: HTMLElement;
	let hoverTimeout: ReturnType<typeof setTimeout>;
	let isMobile = $state(false);
	let windowWidth = $state(0);
	let isCreateRoomModalOpen = $state(false);
	
	// Reactive derived value for mobile detection
	const isMobileDevice = $derived(windowWidth <= 768);
	
	// Effect to update isMobile when windowWidth changes
	$effect(() => {
		isMobile = isMobileDevice;
		// Убираем автоматическое раскрытие сайдбара при определении мобильного устройства
	});
	
	onMount(() => {
		// Initial check
		windowWidth = window.innerWidth;
		isMobile = windowWidth <= 768;
		// Убираем автоматическое раскрытие сайдбара при инициализации
		
		const handleResize = () => {
			windowWidth = window.innerWidth;
		};
		
		window.addEventListener('resize', handleResize);
		
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});
	
	// Desktop hover handlers
	function handleMouseEnter() {
		if (!isMobile) {
			clearTimeout(hoverTimeout);
			hoverTimeout = setTimeout(() => {
				isMini = false;
			}, 150); // 150ms delay
		}
	}
	
	function handleMouseLeave() {
		if (!isMobile) {
			clearTimeout(hoverTimeout);
			isMini = true;
		}
	}
	
	// Mobile handlers
	function toggleSidebar() {
		if (isMobile && onToggle) {
			onToggle();
		}
	}
	
	function closeSidebar() {
		if (isMobile && onToggle) {
			onToggle();
		}
	}
	
	// Handle backdrop click
	function handleBackdropClick() {
		closeSidebar();
	}
	
	function handleCreateRoom() {
		isCreateRoomModalOpen = true;
	}

	function handleCloseModal() {
		isCreateRoomModalOpen = false;
	}

	async function handleSubmitRoom(roomData: any) {
		try {
			const result = await createRoom({
				title: roomData.title,
				description: '',
				isPublic: roomData.isPublic,
				coverImageUrl: roomData.coverImage,
				participantLimit: roomData.participantLimit
			});
			
			if (result.error) {
				// Можно показать уведомление об ошибке
			} else if (result.room) {
				// Перенаправляем на страницу созданной комнаты
				goto(`/room/${result.room.id}`);
			}
		} catch (error) {
			// Обработка ошибки
		} finally {
			handleCloseModal();
		}
	}
	
	function handleRoomsClick() {
		goto('/');
	}
	
	function handleLogoClick() {
		goto('/');
	}
	
	function handleSettingsClick() {
		goto('/settings');
	}
	
	async function handleLogoutClick() {
		try {
			// Используем единый API для выхода
			const { error } = await logout();
			if (error) {
				console.error('Logout error:', error);
			}
			// Перенаправляем на страницу входа (даже если была ошибка, локально все очищено)
			goto('/auth/login');
		} catch (error) {
			console.error('Logout error:', error);
			// Перенаправляем на страницу входа в любом случае
			goto('/auth/login');
		}
	}
	
	function handleDocsClick() {
		goto('/docs');
	}

	// Модальное окно создания комнаты
	function handleCloseCreateRoomModal() {
		isCreateRoomModalOpen = false;
	}

	function handleSubmitCreateRoom(roomData: any) {
		// TODO: Implement room creation logic with API call
		// Здесь можно добавить вызов API для создания комнаты
		
		// После успешного создания закрываем модальное окно
		isCreateRoomModalOpen = false;
	}
</script>

<!-- Mobile backdrop -->
{#if isMobile && isOpen}
	<div 
		class="sidebar-backdrop" 
		bind:this={backdropElement}
		onclick={handleBackdropClick}
	></div>
{/if}

<aside 
	class="sidebar" 
	class:sidebar--mini={isMini && !isMobile}
	class:sidebar--expanded={!isMini || isMobile}
	class:sidebar--mobile-open={isMobile && isOpen}
	class:sidebar--mobile={isMobile}
	bind:this={sidebarElement}
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<div class="sidebar-header">
		<img 
			src={(isMobile && isOpen) || (!isMobile && !isMini) ? "/logo/cnotepad-full.png" : "/logo/cnotepad.png"} 
			alt="Copella Notepad" 
			class="sidebar-logo" 
			onclick={handleLogoClick}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && handleLogoClick()}
		/>
	</div>
	
	<nav class="sidebar-nav">
		<button 
			class="nav-button nav-button--primary" 
			onclick={handleCreateRoom}
			data-tooltip="Создать"
		>
			<img src="/icons/plus.svg" alt="Plus" class="nav-icon" />
			<span>Создать</span>
		</button>
		
		<button 
			class="nav-button" 
			onclick={handleRoomsClick}
			data-tooltip="Комнаты"
		>
			<img src="/icons/door-closed.svg" alt="Rooms" class="nav-icon" />
			<span>Комнаты</span>
		</button>
		
		<div class="rooms-list">
			<!-- Список комнат будет загружаться динамически -->
		</div>
	</nav>
	
	<div class="sidebar-footer">
		<div class="user-info">
			<UserAvatar username={userNickname} avatarUrl={userAvatar} size="medium" />
			<span class="user-nickname">{userNickname}</span>
		</div>
		
		<button 
			class="nav-button" 
			onclick={handleSettingsClick}
			data-tooltip="Настройки"
		>
			<img src="/icons/settings.svg" alt="Settings" class="nav-icon" />
			<span>Настройки</span>
		</button>
		
		<button 
			class="nav-button" 
			onclick={handleDocsClick}
			data-tooltip="Документация"
		>
			<img src="/icons/book-open.svg" alt="Documentation" class="nav-icon" />
			<span>Документация</span>
		</button>
		
		<button 
			class="nav-button" 
			onclick={handleLogoutClick}
			data-tooltip="Выйти"
		>
			<img src="/icons/log-out.svg" alt="Logout" class="nav-icon" />
			<span>Выйти</span>
		</button>
	</div>
</aside>

<!-- Модальное окно создания комнаты -->
<CreateRoomModal 
	isOpen={isCreateRoomModalOpen}
	onClose={handleCloseModal}
	onSubmit={handleSubmitRoom}
/>

