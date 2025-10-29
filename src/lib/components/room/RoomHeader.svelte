<script lang="ts">
	import { createEventDispatcher, getContext } from 'svelte';
	import { ShareRoomModal } from '../ui/modals';

	const dispatch = createEventDispatcher();

	interface Props {
		title: string;
		roomTitle: string;
		roomId?: string;
		onShare?: () => void;
		isOwner?: boolean;
		canInvite?: boolean;
		canManageRoom?: boolean;
		onToggleRightSidebar?: () => void;
		showRightSidebarButton?: boolean;
		isPublic?: boolean;
		disabled?: boolean;
		isNoteTitle?: boolean;
	}

	let { title, roomTitle, roomId, onShare, isOwner = false, canInvite = false, canManageRoom = false, onToggleRightSidebar, showRightSidebarButton = false, isPublic = true, disabled = false, isNoteTitle = false }: Props = $props();

	// Получаем функции из context для управления левым сайдбаром
	const toggleLeftSidebar = getContext<(() => void) | undefined>('toggleLeftSidebar');
	const getIsLeftSidebarOpen = getContext<(() => boolean) | undefined>('isLeftSidebarOpen');
	const getIsMobile = getContext<(() => boolean) | undefined>('isMobile');

	// Вычисляем, нужно ли показывать кнопку левого сайдбара
	const showLeftSidebarButton = $derived(
		getIsMobile?.() && !getIsLeftSidebarOpen?.() && typeof toggleLeftSidebar !== 'undefined'
	);

	// Состояние модалок
	let isShareModalOpen = $state(false);

	let isEditing = $state(false);
	let editTitle = $state(title);
	let titleInput = $state<HTMLInputElement | undefined>(undefined);

	// Обновляем editTitle при изменении title
	$effect(() => {
		editTitle = title;
	});

	function startEditing() {
		if (disabled) return;
		isEditing = true;
		editTitle = title;
		setTimeout(() => {
			titleInput?.focus();
			titleInput?.select();
		}, 0);
	}

	function saveTitle() {
		if (editTitle.trim() && editTitle !== title) {
			dispatch('titleChange', { newTitle: editTitle.trim() });
		}
		isEditing = false;
	}

	function cancelEditing() {
		editTitle = title;
		isEditing = false;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			saveTitle();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEditing();
		}
	}

	function handleShareClick() {
		isShareModalOpen = true;
		if (onShare) {
			onShare();
		}
	}

	function closeShareModal() {
		isShareModalOpen = false;
	}

</script>

<header class="room-header">
	<div class="room-header-content">
		<!-- Кнопка возврата на главную -->
		<a 
			href="/"
			class="back-btn" 
			aria-label="Back to home"
			title="На главную"
		>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<path d="M15 18l-6-6 6-6"/>
			</svg>
		</a>

		<!-- Кнопка левого сайдбара (видна только на мобильных) -->
		{#if showLeftSidebarButton}
			<button 
				class="sidebar-toggle-btn sidebar-toggle-btn--left" 
				onclick={() => toggleLeftSidebar?.()}
				aria-label="Toggle left sidebar"
			>
				<span></span>
				<span></span>
				<span></span>
			</button>
		{/if}

		{#if isEditing}
			<div class="title-input-wrapper">
				<input
					bind:this={titleInput}
					bind:value={editTitle}
					class="title-input"
					maxlength="50"
					onkeydown={handleKeyDown}
					onblur={saveTitle}
					placeholder={isNoteTitle ? "Название заметки" : "Название комнаты"}
					disabled={disabled}
				/>
				<span class="char-counter" class:char-counter--warning={editTitle.length > 40}>
					{editTitle.length}/50
				</span>
			</div>
		{:else}
			<div 
				class="room-title" 
				class:room-title--disabled={disabled}
				onclick={startEditing} 
				onkeydown={(e) => e.key === 'Enter' && startEditing()}
				role="button"
				tabindex={disabled ? -1 : 0}
				title={disabled ? (isNoteTitle ? 'У вас нет прав на редактирование заметки' : 'У вас нет прав на редактирование названия комнаты') : 'Нажмите для редактирования'}
			>
				{title}
			</div>
		{/if}
		
		<div class="room-actions">
			{#if (canManageRoom || canInvite) && isPublic}
				<button 
					class="btn btn--primary btn--md" 
					onclick={handleShareClick}
					title="Поделиться комнатой"
				>
					<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="18" cy="5" r="3"></circle>
						<circle cx="6" cy="12" r="3"></circle>
						<circle cx="18" cy="19" r="3"></circle>
						<line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
						<line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
					</svg>
					<span>Поделиться</span>
				</button>
			{/if}
		</div>

		<!-- Кнопка правого сайдбара (видна только на мобильных) -->
		{#if showRightSidebarButton}
			<button 
				class="sidebar-toggle-btn sidebar-toggle-btn--right" 
				onclick={() => onToggleRightSidebar?.()}
				aria-label="Toggle right sidebar"
			>
				<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<circle cx="12" cy="12" r="1"/>
					<circle cx="12" cy="5" r="1"/>
					<circle cx="12" cy="19" r="1"/>
				</svg>
			</button>
		{/if}
	</div>
</header>

<!-- Модалка для поделиться комнатой -->
<ShareRoomModal
	isOpen={isShareModalOpen}
	onClose={closeShareModal}
	roomTitle={roomTitle}
	roomId={roomId}
	isOwner={isOwner}
	canInvite={canInvite}
	canManageRoom={canManageRoom}
	isPublic={isPublic}
/>

<style>
	.room-header {
		background-color: #1A1A1A;
		border-bottom: 1px solid #FFC0D9;
		border-radius: 0 0 11px 11px;
		padding: 0;
	}

	.room-header-content {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		padding: 16px 24px;
		min-height: 60px;
		gap: 16px;
	}

	.room-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 18px;
		line-height: 1.4;
		color: #FFFFFF;
		margin: 0;
		padding: 8px 12px;
		border-radius: 6px;
		min-width: 0;
		max-width: 500px;
		transition: all 0.2s ease;
		text-align: left;
		cursor: pointer;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		background: transparent;
		border: 1px solid transparent;
	}

	.room-title:hover {
		color: #FEB1FF;
		background: rgba(255, 255, 255, 0.02);
		border-color: rgba(255, 255, 255, 0.05);
	}

	.room-title:focus-visible {
		outline: none;
		background: rgba(255, 255, 255, 0.05);
		border-color: rgba(254, 177, 255, 0.2);
	}

	.room-title--disabled {
		cursor: default;
		opacity: 0.6;
	}

	.room-title--disabled:hover {
		color: #FFFFFF;
		background: transparent;
		border-color: transparent;
	}

	.title-input-wrapper {
		position: relative;
		min-width: 0;
		max-width: 500px;
	}

	.title-input {
		width: 100%;
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 18px;
		line-height: 1.4;
		color: #FFFFFF;
		margin: 0;
		padding: 8px 70px 8px 12px;
		border-radius: 6px;
		background: transparent;
		border: 1px solid rgba(254, 177, 255, 0.2);
		outline: none;
		transition: all 0.2s ease;
	}

	.title-input::placeholder {
		color: #7E7E7E;
		opacity: 0.5;
	}

	.title-input:focus {
		border-color: #FEB1FF;
		background: rgba(255, 255, 255, 0.03);
	}

	.title-input:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.char-counter {
		position: absolute;
		right: 12px;
		top: 50%;
		transform: translateY(-50%);
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 11px;
		color: #7E7E7E;
		pointer-events: none;
		user-select: none;
	}

	.char-counter--warning {
		color: #FEB1FF;
	}

	.room-actions {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-shrink: 0;
		margin-left: auto;
	}

	.room-actions .btn {
		white-space: nowrap;
	}

	.room-actions .btn-icon {
		stroke: currentColor;
	}

	/* Кнопка возврата на главную */
	.back-btn {
		width: 44px;
		height: 44px;
		background-color: #242424;
		border: 1px solid #2A2A2A;
		border-radius: 12px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		padding: 0;
		flex-shrink: 0;
		text-decoration: none;
	}

	.back-btn:hover {
		background-color: #2a2a2a;
		border-color: #FEB1FF;
		transform: translateX(-2px);
		text-decoration: none;
	}

	.back-btn svg {
		width: 20px;
		height: 20px;
		color: #ffffff;
	}

	/* Кнопки переключения сайдбаров */
	.sidebar-toggle-btn {
		width: 44px;
		height: 44px;
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
	}

	.sidebar-toggle-btn:hover {
		background-color: #2a2a2a;
		border-color: #3A3A3A;
		transform: translateY(-1px);
	}

	/* Стили для бургер-кнопки (левый сайдбар) */
	.sidebar-toggle-btn--left span {
		display: block;
		width: 20px;
		height: 2px;
		background-color: #ffffff;
		border-radius: 2px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Стили для кнопки меню (правый сайдбар) */
	.sidebar-toggle-btn--right svg {
		width: 20px;
		height: 20px;
		color: #ffffff;
		filter: brightness(0) invert(1);
	}

	/* Десктопные стили */
	@media (min-width: 769px) {
		.room-header-content {
			padding: 20px 32px;
		}

		.room-title {
			font-size: 20px;
			padding: 10px 14px;
		}

		.title-input {
			font-size: 20px;
			padding: 10px 80px 10px 14px;
		}

		.char-counter {
			font-size: 12px;
		}
	}

	/* Показываем кнопки только на мобильных */
	@media (max-width: 768px) {
		.sidebar-toggle-btn {
			display: flex;
			flex-shrink: 0;
		}

		.room-header-content {
			padding: 12px 12px;
			gap: 8px;
			min-height: 56px;
		}

		.room-title {
			font-size: 15px;
			padding: 7px 10px;
			flex: 1;
		}

		.title-input-wrapper {
			max-width: none;
			flex: 1;
		}

		.title-input {
			font-size: 15px;
			padding: 7px 60px 7px 10px;
		}

		.char-counter {
			font-size: 10px;
			right: 10px;
		}

		.room-actions {
			gap: 8px;
			flex-shrink: 0;
		}

		.room-actions .btn span {
			display: none;
		}

		.room-actions .btn {
			padding: 10px;
			min-width: 44px;
			height: 44px;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.room-actions .btn-icon {
			width: 20px;
			height: 20px;
			margin: 0;
		}
	}

	@media (max-width: 480px) {
		.room-header-content {
			padding: 10px 8px;
			gap: 6px;
		}

		.room-title {
			font-size: 14px;
			padding: 6px 8px;
			flex: 1;
		}

		.title-input {
			font-size: 14px;
			padding: 6px 55px 6px 8px;
		}

		.title-input-wrapper {
			flex: 1;
		}

		.char-counter {
			font-size: 10px;
			right: 8px;
		}

		.back-btn {
			width: 40px;
			height: 40px;
		}

		.back-btn svg {
			width: 18px;
			height: 18px;
		}

		.sidebar-toggle-btn {
			width: 40px;
			height: 40px;
		}

		.room-actions .btn {
			width: 40px;
			height: 40px;
			min-width: 40px;
			padding: 8px;
		}

		.room-actions .btn-icon {
			width: 18px;
			height: 18px;
		}

		.sidebar-toggle-btn--left span {
			width: 18px;
		}

		.sidebar-toggle-btn--right svg {
			width: 18px;
			height: 18px;
		}
	}

</style>
