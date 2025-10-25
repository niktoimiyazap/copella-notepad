<script lang="ts">
	import { getContext } from 'svelte';
	import { CreateRoomModal } from '../../ui/modals';
	
	interface Props {
		onCreateRoom?: (roomData: RoomData) => void;
		title?: string;
		showCreateButton?: boolean;
	}

	interface RoomData {
		title: string;
		isPublic: boolean;
		coverImage?: string;
		participantLimit: number;
	}
	
	let { 
		onCreateRoom,
		title = 'Комнаты',
		showCreateButton = true
	}: Props = $props();

	// Получаем функции из context для управления левым сайдбаром
	const toggleLeftSidebar = getContext<(() => void) | undefined>('toggleLeftSidebar');
	const getIsLeftSidebarOpen = getContext<(() => boolean) | undefined>('isLeftSidebarOpen');
	const getIsMobile = getContext<(() => boolean) | undefined>('isMobile');

	// Вычисляем, нужно ли показывать кнопку левого сайдбара
	const showLeftSidebarButton = $derived(
		getIsMobile?.() && !getIsLeftSidebarOpen?.() && typeof toggleLeftSidebar !== 'undefined'
	);

	// Состояние модалки
	let isCreateRoomModalOpen = $state(false);
	
	function handleCreateRoom() {
		isCreateRoomModalOpen = true;
	}

	function handleCloseModal() {
		isCreateRoomModalOpen = false;
	}

	function handleSubmitRoom(roomData: RoomData) {
		onCreateRoom?.(roomData);
		// Закрываем модалку после создания комнаты
		handleCloseModal();
	}
</script>

<header class="header">
	<div class="header__content">
		<!-- Кнопка левого сайдбара (видна только на мобильных) -->
		{#if showLeftSidebarButton}
			<button 
				class="sidebar-toggle-btn" 
				onclick={() => toggleLeftSidebar?.()}
				aria-label="Toggle sidebar"
			>
				<span></span>
				<span></span>
				<span></span>
			</button>
		{/if}

		<h1 class="header__title">{title}</h1>
		{#if showCreateButton}
			<button class="btn btn--primary" onclick={handleCreateRoom}>
				<span>Создать</span>
				<img src="/icons/plus.svg" alt="Plus" class="btn-icon" />
			</button>
		{/if}
	</div>
</header>

<!-- Модалка создания комнаты -->
<CreateRoomModal 
	isOpen={isCreateRoomModalOpen}
	onClose={handleCloseModal}
	onSubmit={handleSubmitRoom}
/>

<style>
	.header {
		position: sticky;
		top: 0;
		z-index: 10;
		background-color: #1a1a1a;
		transition: all 0.3s ease;
	}
	
	.header__content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32px 40px;
		max-width: 100%;
	}

	
	.header__title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 36px;
		line-height: 1.2;
		color: #ffffff;
		margin: 0;
		flex: 1;
	}

	/* Кнопка переключения сайдбара */
	.sidebar-toggle-btn {
		width: 48px;
		height: 48px;
		background-color: #242424;
		border: 1px solid #2A2A2A;
		border-radius: 12px;
		cursor: pointer;
		display: none;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		padding: 0;
		flex-shrink: 0;
	}

	.sidebar-toggle-btn:hover {
		background-color: #2a2a2a;
		border-color: #3A3A3A;
		transform: translateY(-1px);
	}

	.sidebar-toggle-btn span {
		display: block;
		width: 20px;
		height: 2px;
		background-color: #ffffff;
		border-radius: 2px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	/* Responsive adjustments */
	@media (max-width: 1024px) {
		.header__content {
			padding: 24px 32px;
		}
		
		.header__title {
			font-size: 32px;
		}
	}
	
	@media (max-width: 768px) {
		.header__content {
			flex-direction: row;
			gap: 16px;
			align-items: center;
			padding: 20px 24px;
			justify-content: space-between;
		}

		.sidebar-toggle-btn {
			display: flex;
		}
		
		.header__title {
			font-size: 28px;
			flex: 1;
		}

		.btn span {
			display: none;
		}

		.btn {
			padding: 12px;
			min-width: 48px;
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: center;
			flex-shrink: 0;
		}

		.btn-icon {
			margin: 0;
			width: 24px;
			height: 24px;
		}
	}
	
	@media (max-width: 480px) {
		.header__content {
			padding: 16px 16px;
			gap: 12px;
		}

		.sidebar-toggle-btn {
			width: 44px;
			height: 44px;
		}

		.sidebar-toggle-btn span {
			width: 18px;
		}
		
		.header__title {
			font-size: 22px;
		}

		.btn {
			padding: 10px;
			min-width: 44px;
			height: 44px;
		}

		.btn-icon {
			width: 20px;
			height: 20px;
		}
	}
</style>
