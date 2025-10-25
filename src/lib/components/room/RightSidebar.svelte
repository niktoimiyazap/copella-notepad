<script lang="ts">
	import UserAvatar from '../UserAvatar.svelte';
	import { formatDate } from '$lib/utils/dates';
	import { onMount } from 'svelte';
	
	interface Participant {
		id: string;
		roomId: string;
		userId: string;
		role: "creator" | "owner" | "admin" | "moderator" | "participant" | "user";
		joinedAt: Date | string;
		lastSeen: Date | string;
		isOnline: boolean;
		user: {
			id: string;
			username: string;
			fullName: string;
			avatarUrl?: string;
		};
	}

	interface Note {
		id: string;
		title: string;
		content?: string;
		updatedAt: Date | string;
	}

	interface Props {
		participants: Participant[];
		notes: Note[];
		selectedNoteId?: string;
		canEdit?: boolean;
		canDelete?: boolean;
		onNoteClick?: (noteId: string) => void;
		onParticipantClick?: (participantId: string, event?: MouseEvent) => void;
		onCollapseChange?: (isCollapsed: boolean) => void;
		onCreateNote?: () => void;
		onEditNoteTitle?: (noteId: string) => void;
		onDeleteNote?: (noteId: string) => void;
		isOpen?: boolean;
		onToggle?: () => void;
		isPublic?: boolean;
	}

	let { participants, notes, selectedNoteId, canEdit = true, canDelete = false, onNoteClick, onParticipantClick, onCollapseChange, onCreateNote, onEditNoteTitle, onDeleteNote, isOpen = false, onToggle, isPublic = true }: Props = $props();
	
	let isCollapsed = $state(true);
	let isMobile = $state(false);
	let windowWidth = $state(0);
	let backdropElement: HTMLElement;
	let sidebarElement: HTMLElement;

	// Reactive derived value for mobile detection
	const isMobileDevice = $derived(windowWidth <= 768);
	
	// Effect to update isMobile when windowWidth changes
	$effect(() => {
		isMobile = isMobileDevice;
	});

	onMount(() => {
		// Initial check
		windowWidth = window.innerWidth;
		isMobile = windowWidth <= 768;
		
		const handleResize = () => {
			windowWidth = window.innerWidth;
		};
		
		window.addEventListener('resize', handleResize);
		
		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	function toggleCollapse() {
		if (isMobile) {
			// На мобильных управляем открытием/закрытием через callback
			if (onToggle) {
				onToggle();
			}
		} else {
			// На десктопе управляем сворачиванием
			isCollapsed = !isCollapsed;
			onCollapseChange?.(isCollapsed);
		}
	}

	function handleBackdropClick() {
		if (isMobile && onToggle) {
			onToggle();
		}
	}

	function toggleMobileSidebar() {
		if (onToggle) {
			onToggle();
		}
	}

	function getRoleDisplayName(role: string): string {
		switch (role) {
			case 'creator':
			case 'owner':
			case 'admin':
				return 'Владелец';
			case 'moderator':
				return 'Модератор';
			case 'participant':
			case 'user':
				return 'Участник';
			default:
				return 'Участник';
		}
	}
</script>

<!-- Mobile backdrop -->
{#if isMobile && isOpen}
	<div 
		class="right-sidebar-backdrop" 
		bind:this={backdropElement}
		onclick={handleBackdropClick}
		onkeydown={(e) => e.key === 'Escape' && handleBackdropClick()}
		role="button"
		tabindex="-1"
		aria-label="Закрыть панель"
	></div>
{/if}

<aside 
	class="right-sidebar" 
	class:collapsed={isCollapsed && !isMobile}
	class:right-sidebar--mobile={isMobile}
	class:right-sidebar--mobile-open={isMobile && isOpen}
	bind:this={sidebarElement}
>
	<!-- Заголовок с кнопкой сворачивания -->
	<div class="sidebar-header">
		{#if !isMobile}
			<button class="toggle-btn" onclick={toggleCollapse} title={isCollapsed ? 'Развернуть' : 'Свернуть'}>
				<svg class="chevron-icon" class:rotated={!isCollapsed} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M15 18l-6-6 6-6"/>
				</svg>
			</button>
		{:else}
			<h2 class="sidebar-mobile-title">Панель</h2>
		{/if}
	</div>
	
	<!-- Контент сайдбара -->
	<div class="sidebar-content">
		<!-- Участники (только для публичных комнат) -->
		{#if isPublic}
		<div class="section">
			{#if !isCollapsed || isMobile}
				<h3 class="section-title">Участники</h3>
			{:else}
				<!-- Мини-блок участников в свернутом состоянии -->
				<div class="participants-mini">
					<div class="participants-mini-header">
						<span class="participants-count">{participants.length}</span>
					</div>
					<div class="participants-mini-avatars">
						{#each participants.slice(0, 3) as participant (participant.id)}
							<button 
								class="mini-avatar-container" 
								class:online={participant.isOnline}
								onclick={(e) => onParticipantClick?.(participant.id, e)}
								title={participant.user.username}
								type="button"
							>
								<UserAvatar 
									username={participant.user.username} 
									avatarUrl={participant.user.avatarUrl} 
									size="small" 
								/>
								{#if participant.isOnline}
									<div class="mini-online-dot"></div>
								{/if}
							</button>
						{/each}
						{#if participants.length > 3}
							<div class="more-participants" title="Еще {participants.length - 3} участников">
								+{participants.length - 3}
							</div>
						{/if}
					</div>
				</div>
			{/if}
			<div class="participants-list" class:hidden={isCollapsed && !isMobile}>
				{#each participants as participant (participant.id)}
					<button 
						class="participant-item" 
						class:collapsed={isCollapsed && !isMobile}
						onclick={(e) => onParticipantClick?.(participant.id, e)}
						type="button"
					>
						<div class="avatar-container">
							<UserAvatar 
								username={participant.user.username} 
								avatarUrl={participant.user.avatarUrl} 
								size="medium" 
							/>
							{#if participant.isOnline}
								<div class="online-dot"></div>
							{/if}
						</div>
						{#if !isCollapsed || isMobile}
							<div class="participant-info">
								<span class="name">{participant.user.username}</span>
								{#if participant.role === 'creator' || participant.role === 'owner'}
									<span class="role role--creator">{getRoleDisplayName(participant.role)}</span>
								{:else if participant.role === 'admin'}
									<span class="role role--admin">{getRoleDisplayName(participant.role)}</span>
								{:else if participant.role === 'moderator'}
									<span class="role role--moderator">{getRoleDisplayName(participant.role)}</span>
								{:else}
									<span class="role role--participant">{getRoleDisplayName(participant.role)}</span>
								{/if}
							</div>
						{/if}
					</button>
				{/each}
			</div>
		</div>
		{/if}

		<!-- Заметки -->
		<div class="section">
			{#if !isCollapsed || isMobile}
				<h3 class="section-title">Заметки</h3>
			{/if}
			<div class="notes-list">
				<!-- Кнопка создания заметки (показываем только если есть права на редактирование) -->
				{#if canEdit && onCreateNote}
				<div class="create-note-item" class:collapsed={isCollapsed && !isMobile}>
					<button 
						class="btn btn--primary create-note-button"
						class:collapsed={isCollapsed && !isMobile}
						onclick={() => onCreateNote?.()}
					>
						<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 5v14M5 12h14"/>
						</svg>
						{#if !isCollapsed || isMobile}
							<span class="create-note-text">Создать</span>
						{/if}
					</button>
				</div>
				{/if}
				
				{#each notes as note (note.id)}
					<div 
						class="note-item" 
						class:collapsed={isCollapsed && !isMobile}
						class:selected={selectedNoteId === note.id}
					>
						<button 
							class="btn btn--primary note-button"
							class:collapsed={isCollapsed && !isMobile}
							class:selected={selectedNoteId === note.id}
							onclick={() => onNoteClick?.(note.id)}
						>
							<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
								<polyline points="14,2 14,8 20,8"/>
							</svg>
							{#if !isCollapsed || isMobile}
								<div class="note-content">
									<span class="note-title">{note.title}</span>
									<span class="note-date">{formatDate(note.updatedAt)}</span>
								</div>
							{/if}
						</button>
						
						{#if !isCollapsed || isMobile}
							<div class="note-actions">
								{#if canEdit && onEditNoteTitle}
									<button 
										class="edit-button"
										onclick={(e) => {
											e.stopPropagation();
											onEditNoteTitle(note.id);
										}}
										title="Редактировать название"
									>
										<svg class="edit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
											<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
										</svg>
									</button>
								{/if}
								
								{#if canDelete && onDeleteNote}
									<button 
										class="delete-button"
										onclick={(e) => {
											e.stopPropagation();
											onDeleteNote(note.id);
										}}
										title="Удалить заметку"
									>
										<svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<polyline points="3,6 5,6 21,6"/>
											<path d="M19,6v14a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6m3,0V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2v2"/>
											<line x1="10" y1="11" x2="10" y2="17"/>
											<line x1="14" y1="11" x2="14" y2="17"/>
										</svg>
									</button>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</div>
</aside>

<style>
	.right-sidebar {
		position: fixed;
		top: 0;
		right: 0;
		width: 280px;
		height: 100vh;
		background: #1a1a1a;
		border-left: 1px solid #2a2a2a;
		display: flex;
		flex-direction: column;
		z-index: 100;
		transition: width 0.3s ease;
		box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
	}

	.right-sidebar.collapsed {
		width: 60px;
	}

	.sidebar-header {
		padding: 16px;
		border-bottom: 1px solid #2a2a2a;
		display: flex;
		justify-content: flex-end;
	}

	.right-sidebar.collapsed:not(.right-sidebar--mobile) .sidebar-header {
		justify-content: center;
		padding: 16px 8px;
	}

	.right-sidebar--mobile .sidebar-header {
		justify-content: flex-start;
	}

	.sidebar-mobile-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 18px;
		color: #ffffff;
		margin: 0;
		width: 100%;
		text-align: left;
	}

	.toggle-btn {
		width: 40px;
		height: 40px;
		background: #242424;
		border: none;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}

	.toggle-btn:hover {
		background: #2a2a2a;
		transform: translateY(-1px);
	}

	.toggle-btn:hover .chevron-icon {
		opacity: 1;
		transform: scale(1.1);
	}

	.chevron-icon {
		width: 20px;
		height: 20px;
		color: #7e7e7e;
		transition: transform 0.3s ease;
		filter: brightness(0) invert(1);
		opacity: 0.5;
	}

	.chevron-icon.rotated {
		transform: rotate(180deg);
	}

	.sidebar-content {
		flex: 1;
		padding: 16px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.right-sidebar.collapsed .sidebar-content {
		padding: 16px 8px;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.section-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		color: #ffffff;
		margin: 0;
		opacity: 1;
		transition: opacity 0.2s ease;
	}

	.right-sidebar.collapsed .section-title {
		opacity: 0;
		height: 0;
		overflow: hidden;
		transition: opacity 0.2s ease 0.1s, height 0.2s ease 0.1s;
	}

	.participants-list,
	.notes-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.participants-list.hidden {
		display: none;
	}

	/* Стили для мини-блока участников */
	.participants-mini {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px;
		background: #242424;
		border-radius: 12px;
		margin-bottom: 8px;
	}

	.participants-mini-header {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
	}

	.participants-count {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 12px;
		color: #ffffff;
		background: #3a3a3a;
		padding: 2px 6px;
		border-radius: 8px;
		min-width: 16px;
		flex-shrink: 0;
		text-align: center;
	}

	.participants-mini-avatars {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		flex-wrap: wrap;
	}

	.mini-avatar-container {
		position: relative;
		cursor: pointer;
		transition: all 0.2s ease;
		background: none;
		border: none;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mini-avatar-container:hover {
		transform: scale(1.1);
	}

	.mini-avatar-container.online :global(.user-avatar) {
		border-color: #40ff56;
	}

	.mini-online-dot {
		position: absolute;
		bottom: -1px;
		right: -1px;
		width: 6px;
		height: 6px;
		background: #40ff56;
		border-radius: 50%;
		border: 1px solid #1a1a1a;
	}

	.more-participants {
		width: 24px;
		height: 24px;
		background: #3a3a3a;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 11px;
		color: #7e7e7e;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid #4a4a4a;
	}

	.more-participants:hover {
		background: #4a4a4a;
		color: #ffffff;
		transform: scale(1.1);
	}

	.participant-item,
	.note-item,
	.create-note-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0;
		background: transparent;
		border: none;
		border-radius: 12px;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
		cursor: pointer;
		width: 100%;
		text-align: left;
	}

	.participant-item:hover,
	.note-item:hover,
	.create-note-item:hover {
		transform: translateY(-1px);
	}

	.participant-item.collapsed,
	.note-item.collapsed,
	.create-note-item.collapsed {
		justify-content: center;
		position: relative;
	}

	/* Стили для кнопок заметок */
	.note-button {
		width: 100%;
		justify-content: flex-start;
		padding: 12px;
		background: #242424;
		color: #7e7e7e;
		border: none;
		border-radius: 12px;
		text-align: left;
		position: relative;
	}

	.note-button:hover {
		background: #2a2a2a;
		color: #ffffff;
		transform: translateY(-1px);
	}

	/* Переопределяем стили для выбранной заметки */
	.note-button.btn--primary.selected {
		background: #FEB1FF !important;
		color: #000000 !important;
	}

	.note-button.btn--primary.selected:hover {
		background: #FF9EFF !important;
		color: #000000 !important;
	}

	.note-button.collapsed {
		width: 40px;
		height: 40px;
		padding: 12px;
		justify-content: center;
	}

	.note-button.collapsed .btn-icon {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 20px;
		height: 20px;
	}

	/* Стили для действий с заметками */
	.note-actions {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		gap: 4px;
		opacity: 0;
		transition: all 0.2s ease;
	}

	.note-item:hover .note-actions {
		opacity: 1;
	}

	.edit-button,
	.delete-button {
		width: 24px;
		height: 24px;
		background: rgba(0, 0, 0, 0.3);
		border: none;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.edit-button:hover {
		background: rgba(59, 130, 246, 0.3);
		transform: scale(1.1);
	}

	.delete-button:hover {
		background: rgba(239, 68, 68, 0.3);
		transform: scale(1.1);
	}

	.edit-icon,
	.delete-icon {
		width: 12px;
		height: 12px;
		color: #ffffff;
		filter: brightness(0) invert(1);
	}

	.avatar-container {
		position: relative;
		flex-shrink: 0;
	}

	.participant-item.collapsed .avatar-container {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	.participant-item.collapsed .avatar-container :global(.user-avatar) {
		width: 20px;
		height: 20px;
	}

	.online-dot {
		position: absolute;
		bottom: -1px;
		right: -1px;
		width: 8px;
		height: 8px;
		background: #40ff56;
		border-radius: 50%;
		border: 1px solid #1a1a1a;
	}

	.participant-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
		align-items: flex-start;
	}

	.name {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 14px;
		color: #7e7e7e;
		opacity: 1;
		transition: opacity 0.2s ease;
	}

	.participant-item.collapsed .name {
		opacity: 0;
		width: 0;
		overflow: hidden;
		transition: opacity 0.2s ease 0.1s, width 0.2s ease 0.1s;
	}

	.role {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 11px;
		padding: 6px 12px;
		border-radius: 14px;
		opacity: 1;
		transition: opacity 0.2s ease;
		text-transform: none;
		letter-spacing: 0;
		width: auto;
		display: inline-block;
		text-align: center;
		white-space: nowrap;
	}

	.role--creator {
		background: linear-gradient(135deg, #FEB1FF, #FF9EFF);
		color: #000000;
		font-weight: 500;
	}

	.role--admin {
		background: linear-gradient(135deg, #4F46E5, #7C3AED);
		color: #ffffff;
		font-weight: 400;
	}

	.role--moderator {
		background: linear-gradient(135deg, #10B981, #059669);
		color: #ffffff;
		font-weight: 400;
	}

	.role--participant {
		background: #3a3a3a;
		color: #7e7e7e;
		font-weight: 400;
	}

	.participant-item.collapsed .role {
		opacity: 0;
		width: 0;
		overflow: hidden;
		transition: opacity 0.2s ease 0.1s, width 0.2s ease 0.1s;
	}

	.note-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
		opacity: 1;
		transition: opacity 0.2s ease;
		margin-left: 12px;
	}

	.note-button.collapsed .note-content {
		opacity: 0;
		width: 0;
		overflow: hidden;
		transition: opacity 0.2s ease 0.1s, width 0.2s ease 0.1s;
	}

	.note-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 14px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.note-button .note-title {
		color: inherit;
	}

	.note-date {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 12px;
		opacity: 0.7;
	}

	/* Стили для кнопки создания заметки */
	.create-note-button {
		width: 100%;
		justify-content: flex-start;
		padding: 12px;
	}

	.create-note-button.collapsed {
		width: 40px;
		height: 40px;
		padding: 12px;
		justify-content: center;
	}

	.create-note-button.collapsed .btn-icon {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 20px;
		height: 20px;
	}

	.create-note-text {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		margin-left: 12px;
		opacity: 1;
		transition: opacity 0.2s ease;
	}

	.create-note-button.collapsed .create-note-text {
		opacity: 0;
		width: 0;
		overflow: hidden;
		transition: opacity 0.2s ease 0.1s, width 0.2s ease 0.1s;
	}

	/* Скроллбар */
	.sidebar-content::-webkit-scrollbar {
		width: 4px;
	}

	.sidebar-content::-webkit-scrollbar-track {
		background: transparent;
	}

	.sidebar-content::-webkit-scrollbar-thumb {
		background: #3a3a3a;
		border-radius: 2px;
	}

	.sidebar-content::-webkit-scrollbar-thumb:hover {
		background: #4a4a4a;
	}

	/* Mobile sidebar states */
	.right-sidebar--mobile {
		position: fixed;
		right: 0;
		top: 0;
		z-index: 1000;
		transform: translateX(100%);
		width: 280px;
		height: 100vh;
		border-left: 1px solid #2a2a2a;
		box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.right-sidebar--mobile-open {
		transform: translateX(0);
	}

	/* Right sidebar backdrop */
	.right-sidebar-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		background-color: rgba(0, 0, 0, 0.3);
		z-index: 999;
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
	}

	/* Мобильная адаптация */
	@media (max-width: 768px) {
		.right-sidebar:not(.right-sidebar--mobile) {
			display: none;
		}

		/* На мобильных всегда показываем развернутое содержимое */
		.right-sidebar--mobile .section-title {
			opacity: 1 !important;
			height: auto !important;
		}

		.right-sidebar--mobile .name,
		.right-sidebar--mobile .note-content,
		.right-sidebar--mobile .create-note-text {
			opacity: 1 !important;
			width: auto !important;
			overflow: visible !important;
		}

		.right-sidebar--mobile .participants-mini {
			display: none !important;
		}

		.right-sidebar--mobile .participants-list.hidden {
			display: flex !important;
		}
	}
</style>
