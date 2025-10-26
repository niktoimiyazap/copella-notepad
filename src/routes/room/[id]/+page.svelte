<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import RoomHeader from '$lib/components/room/RoomHeader.svelte';
	import RightSidebar from '$lib/components/room/RightSidebar.svelte';
	import NoteEditor from '$lib/components/room/NoteEditor.svelte';
	import NotePlaceholder from '$lib/components/room/NotePlaceholder.svelte';
	import RoomLoading from '$lib/components/room/RoomLoading.svelte';
	import RoomErrorPlaceholder from '$lib/components/room/RoomErrorPlaceholder.svelte';
	import EditNoteTitleModal from '$lib/components/ui/EditNoteTitleModal.svelte';
	import { currentUser, userActions } from '$lib/stores/user';
	import { fetchCurrentUser } from '$lib/api/userApi';
	import { getRoomNotes, type Note } from '$lib/notes';
	import { getRoomParticipants, getUserRoomPermissions } from '$lib/permissions';
	import { getRoom, updateRoom, type Room } from '$lib/rooms';
	import { initParticipantsOnlineTracking } from '$lib/utils/participantsOnlineStatus';
	import { openSingleUserWidget } from '$lib/api/user-management';

	// Получаем ID комнаты из параметров маршрута
	const roomId = $derived($page.params.id);
	
	// Типы для участников из API
	type Participant = Room['participants'][number];
	
	// Состояние комнаты
	let roomData = $state<{
		id: string | undefined;
		title: string;
		participants: Participant[];
		notes: Note[];
		creator: Room['creator'] | null;
		isPublic: boolean;
	}>({
		id: undefined,
		title: 'Загрузка...',
		participants: [],
		notes: [],
		creator: null,
		isPublic: true
	});
	
	let isLoading = $state(true);
	let isSidebarCollapsed = $state(true);
	let showLoading = $state(true);
	let error = $state('');
	let selectedNoteId = $state<string | undefined>(undefined);
	let isEditModalOpen = $state(false);
	let editingNoteId = $state<string | undefined>(undefined);
	let editingNoteTitle = $state('');
	let isRightSidebarOpen = $state(false);
	let isMobile = $state(false);
	let windowWidth = $state(0);
	
	// Права доступа пользователя в комнате
	let canEdit = $state(false);
	let canDelete = $state(false);
	let canInvite = $state(false);
	let canManageRoom = $state(false);
	
	// Функция для отключения WebSocket
	let disconnectOnlineTracking: (() => void) | null = null;

	// Reactive derived value for mobile detection
	const isMobileDevice = $derived(windowWidth <= 768);
	
	// Effect to update isMobile when windowWidth changes
	$effect(() => {
		isMobile = isMobileDevice;
	});

	// Функция управления правым сайдбаром
	function toggleRightSidebar() {
		isRightSidebarOpen = !isRightSidebarOpen;
	}

	onMount(async () => {
		// Initial check for window width
		windowWidth = window.innerWidth;
		isMobile = windowWidth <= 768;
		
		const handleResize = () => {
			windowWidth = window.innerWidth;
		};
		
		window.addEventListener('resize', handleResize);
		
		// Cleanup resize listener on unmount
		const cleanupResize = () => {
			window.removeEventListener('resize', handleResize);
		};

		try {
			// Проверяем наличие roomId
			if (!roomId) {
				error = 'ID комнаты не найден';
				isLoading = false;
				return;
			}
			
			// Получаем текущего пользователя из централизованного store
			// Если пользователь еще не загружен, загружаем его
			if (!$currentUser) {
				const { user, error: userError } = await fetchCurrentUser();
				if (userError || !user) {
					console.warn('User authentication error (continuing anyway):', userError);
					// НЕ останавливаем загрузку - просто работаем без пользователя
				}
			}

			// Загружаем данные комнаты
			const { room, error: roomError } = await getRoom(roomId);
			if (roomError || !room) {
				console.error('Room fetch error:', roomError);
				error = roomError || 'Комната не найдена';
				isLoading = false;
				return;
			}
			
		roomData.id = room.id;
		roomData.title = room.title;
		roomData.participants = room.participants;
		roomData.creator = room.creator;
		roomData.isPublic = room.isPublic;

			// Проверяем права доступа пользователя в комнате
			if ($currentUser?.id) {
				const { permissions, error: permError } = await getUserRoomPermissions($currentUser.id, roomId);
				if (!permError) {
					canEdit = permissions.canEdit;
					canDelete = permissions.canDelete;
					canInvite = permissions.canInvite;
					canManageRoom = permissions.canManageRoom;
				}
		}

			// Загружаем заметки комнаты
			const { notes, error: notesError } = await getRoomNotes(roomId);
			if (notesError) {
				console.error('Notes fetch error:', notesError);
				error = notesError;
			} else {
				roomData.notes = notes;
			}

		// Инициализируем отслеживание онлайн статуса участников
		// И ждем подключения к WebSocket ПЕРЕД показом интерфейса
		// ТОЛЬКО если пользователь является участником комнаты
		if ($currentUser?.id) {
			// Проверяем, является ли пользователь участником комнаты
			const isParticipant = roomData.participants.some(p => p.userId === $currentUser.id);
			
			if (isParticipant) {
				// Отключаем старое соединение если оно есть
				if (disconnectOnlineTracking) {
					disconnectOnlineTracking();
				}
				
				try {
					// Ждем подключения к WebSocket и получения начальных данных
					disconnectOnlineTracking = await initParticipantsOnlineTracking(
						roomId,
						$currentUser.id,
						() => roomData.participants as any[],
						(updatedParticipants) => {
							roomData.participants = updatedParticipants as Participant[];
						}
					);
				} catch (wsError) {
					console.error('WebSocket connection error:', wsError);
					// Продолжаем работу даже если WebSocket не подключился
					// (пользователь сможет работать с комнатой, но без real-time обновлений)
				}
			} else {
				console.log('[Room] User is not a participant, skipping WebSocket connection');
			}
		}

			// Скрываем загрузку после подключения к WebSocket
			showLoading = false;
			setTimeout(() => {
				isLoading = false;
			}, 450);
		} catch (err) {
			console.error('Unexpected error loading room data:', err);
			error = 'Ошибка загрузки данных комнаты';
			isLoading = false;
		}

		// Return cleanup function
		return () => {
			cleanupResize();
		};
	});

	// Отключаемся от WebSocket при размонтировании компонента
	onDestroy(() => {
		if (disconnectOnlineTracking) {
			disconnectOnlineTracking();
		}
	});

	function handleShareRoom() {
		// TODO: Implement room sharing logic
	}

	function handleNoteClick(noteId: string) {
		selectedNoteId = noteId;
	}

	function handleNoteContentChange(noteId: string, content: string) {
		// НЕ обновляем локальное состояние!
		// Сохранение происходит через Yjs в реальном времени
		// Обновление локального массива вызывает пересоздание DiffSyncManager
		// Просто игнорируем это событие
		// TODO: Возможно, можно удалить этот колбэк полностью в будущем
	}

	function handleParticipantClick(participantId: string, event?: MouseEvent) {
		// Открываем виджет управления пользователем только если у текущего пользователя есть права
		if (!canManageRoom || !roomId) {
			return;
		}

		// Находим участника по ID
		const participant = roomData.participants.find(p => p.id === participantId);
		if (!participant) {
			console.error('Participant not found:', participantId);
			return;
		}

		// Открываем виджет управления для этого пользователя
		openSingleUserWidget(roomId, participant.userId, {
			targetElement: event,
			onUpdate: (updatedUser) => {
				console.log('User updated:', updatedUser);
				// Перезагружаем участников комнаты
				reloadParticipants();
			},
			onClose: () => {
				console.log('User management widget closed');
			}
		});
	}

	// Функция для перезагрузки участников
	async function reloadParticipants() {
		if (!roomId) return;
		
		try {
			const { participants, error: participantsError } = await getRoomParticipants(roomId);
			if (!participantsError && participants) {
				roomData.participants = participants as Participant[];
			}
		} catch (error) {
			console.error('Error reloading participants:', error);
		}
	}

	async function handleCreateNote() {
		try {
			if (!roomId) {
				console.error('Cannot create note: roomId is undefined');
				return;
			}
			
			const { createNote } = await import('$lib/notes');
			
			const { note, error: createError } = await createNote({
				roomId: roomId,
				title: 'Новая заметка',
				content: '',
				createdBy: $currentUser?.id
			});
			
			if (createError) {
				console.error('Error creating note:', createError);
				// TODO: Show error message to user
				return;
			}
			
			if (note) {
				// Add new note to the list
				roomData.notes = [...roomData.notes, note];
				selectedNoteId = note.id;
			}
		} catch (error) {
			console.error('Unexpected error creating note:', error);
			// TODO: Show error message to user
		}
	}

	function handleSidebarCollapseChange(collapsed: boolean) {
		isSidebarCollapsed = collapsed;
	}

	function handleEditNoteTitle(noteId: string) {
		const note = roomData.notes.find(n => n.id === noteId);
		if (!note) {
			console.error('Note not found:', noteId);
			return;
		}
		
		editingNoteId = noteId;
		editingNoteTitle = note.title;
		isEditModalOpen = true;
	}

	async function handleSaveNoteTitle(newTitle: string) {
		if (!editingNoteId) return;
		
		// Сохраняем noteId локально, чтобы он не обнулился во время async операции
		const noteIdToUpdate = editingNoteId;
		
		try {
			const { updateNote } = await import('$lib/notes');
			const { note: updatedNote, error: updateError } = await updateNote(noteIdToUpdate, {
				title: newTitle
			});
			
			if (updateError) {
				console.error('Error updating note title:', updateError);
				// TODO: Show error message to user
				return;
			}
			
			if (updatedNote) {
				// Update note in the list
				roomData.notes = roomData.notes.map(n => 
					n.id === noteIdToUpdate ? updatedNote : n
				);
			}
		} catch (error) {
			console.error('Unexpected error updating note title:', error);
			// TODO: Show error message to user
		} finally {
			handleCancelEdit();
		}
	}

	function handleCancelEdit() {
		isEditModalOpen = false;
		editingNoteId = undefined;
		editingNoteTitle = '';
	}

	async function handleDeleteNote(noteId: string) {
		if (!confirm('Вы уверены, что хотите удалить эту заметку?')) {
			return;
		}
		
		try {
			const { deleteNote } = await import('$lib/notes');
			const { error: deleteError } = await deleteNote(noteId);
			
			if (deleteError) {
				console.error('Error deleting note:', deleteError);
				// TODO: Show error message to user
				return;
			}
			
			// Remove note from the list
			roomData.notes = roomData.notes.filter(n => n.id !== noteId);
			
			// If deleted note was selected, clear selection
			if (selectedNoteId === noteId) {
				selectedNoteId = undefined;
			}
		} catch (error) {
			console.error('Unexpected error deleting note:', error);
			// TODO: Show error message to user
		}
	}

	async function handleTitleChange(event: CustomEvent<{ newTitle: string }>) {
		const { newTitle } = event.detail;
		if (newTitle && newTitle !== roomData.title && roomId) {
			const oldTitle = roomData.title;
			try {
				// Обновляем название в локальном состоянии
				roomData.title = newTitle;
				
				// Сохраняем изменения на сервере
				const { room: updatedRoom, error: updateError } = await updateRoom(roomId, {
					title: newTitle
				});
				
				if (updateError) {
					console.error('Error updating room title:', updateError);
					// Возвращаем старое название в случае ошибки
					roomData.title = oldTitle;
					// TODO: Show error message to user
				}
			} catch (error) {
				console.error('Unexpected error updating room title:', error);
				// Возвращаем старое название в случае ошибки
				roomData.title = oldTitle;
				// TODO: Show error message to user
			}
		}
	}

	async function handleRetry() {
		error = '';
		isLoading = true;
		showLoading = true;
		
		try {
			// Проверяем наличие roomId
			if (!roomId) {
				error = 'ID комнаты не найден';
				isLoading = false;
				return;
			}
			
			// Получаем текущего пользователя из централизованного store
			if (!$currentUser) {
				const { user, error: userError } = await fetchCurrentUser();
				if (userError || !user) {
					console.warn('User authentication error on retry (continuing anyway):', userError);
					// НЕ останавливаем - продолжаем работу
				}
			}

			// Загружаем данные комнаты
			const { room, error: roomError } = await getRoom(roomId);
			if (roomError || !room) {
				error = roomError || 'Комната не найдена';
				isLoading = false;
				return;
			}
			
		roomData.id = room.id;
		roomData.title = room.title;
		roomData.participants = room.participants;
		roomData.creator = room.creator;
		roomData.isPublic = room.isPublic;

			// Проверяем права доступа пользователя в комнате
			if ($currentUser?.id) {
				const { permissions, error: permError } = await getUserRoomPermissions($currentUser.id, roomId);
				if (!permError) {
					canEdit = permissions.canEdit;
					canDelete = permissions.canDelete;
				}
			}

			// Загружаем заметки комнаты
			const { notes, error: notesError } = await getRoomNotes(roomId);
			if (notesError) {
				error = notesError;
			} else {
				roomData.notes = notes;
			}

		// Инициализируем отслеживание онлайн статуса участников
		// И ждем подключения к WebSocket ПЕРЕД показом интерфейса
		// ТОЛЬКО если пользователь является участником комнаты
		if ($currentUser?.id) {
			// Проверяем, является ли пользователь участником комнаты
			const isParticipant = roomData.participants.some(p => p.userId === $currentUser.id);
			
			if (isParticipant) {
				// Отключаем старое соединение если оно есть
				if (disconnectOnlineTracking) {
					disconnectOnlineTracking();
				}
				
				try {
					// Ждем подключения к WebSocket и получения начальных данных
					disconnectOnlineTracking = await initParticipantsOnlineTracking(
						roomId,
						$currentUser.id,
						() => roomData.participants as any[],
						(updatedParticipants) => {
							roomData.participants = updatedParticipants as Participant[];
						}
					);
				} catch (wsError) {
					console.error('WebSocket reconnection error:', wsError);
					// Продолжаем работу даже если WebSocket не подключился
				}
			} else {
				console.log('[Room] User is not a participant, skipping WebSocket reconnection');
			}
		}

			// Скрываем загрузку после подключения к WebSocket
			showLoading = false;
			setTimeout(() => {
				isLoading = false;
			}, 450);
	} catch (err) {
		error = 'Ошибка загрузки данных комнаты';
		isLoading = false;
	}
}
</script>

<div class="room-page">
	<div class="room-layout" class:sidebar-collapsed={isSidebarCollapsed}>
		{#if isLoading}
			<RoomLoading isVisible={showLoading} />
		{/if}
		
		{#if error}
			<RoomErrorPlaceholder 
				error={error}
				onRetry={handleRetry}
				onReload={() => window.location.reload()}
			/>
		{:else}
		<RoomHeader 
			title={roomData.title}
			roomId={roomData.id}
			onShare={handleShareRoom}
			isOwner={$currentUser?.id === roomData.creator?.id}
			canInvite={canInvite}
			canManageRoom={canManageRoom}
			onToggleRightSidebar={toggleRightSidebar}
			showRightSidebarButton={isMobile && !isRightSidebarOpen}
			isPublic={roomData.isPublic}
			on:titleChange={handleTitleChange}
		/>
			
			<div class="room-content">
				<main class="room-main">
					{#if !isLoading && roomData.id}
						{#if selectedNoteId}
							{@const selectedNote = roomData.notes.find(n => n.id === selectedNoteId)}
							{#if selectedNote}
								<NoteEditor 
									selectedNote={selectedNote}
									roomId={roomData.id}
									canEdit={canEdit}
									onContentChange={handleNoteContentChange}
								/>
							{:else}
								<NotePlaceholder canEdit={canEdit} onCreateNote={handleCreateNote} />
							{/if}
						{:else}
							<NotePlaceholder canEdit={canEdit} onCreateNote={handleCreateNote} />
						{/if}
					{/if}
				</main>
			</div>
		{/if}
	</div>
	
	<RightSidebar 
		participants={roomData.participants}
		notes={roomData.notes}
		selectedNoteId={selectedNoteId}
		canEdit={canEdit}
		canDelete={canDelete}
		onNoteClick={handleNoteClick}
		onParticipantClick={handleParticipantClick}
		onCollapseChange={handleSidebarCollapseChange}
		onCreateNote={handleCreateNote}
		onEditNoteTitle={handleEditNoteTitle}
		onDeleteNote={handleDeleteNote}
		isOpen={isRightSidebarOpen}
		onToggle={toggleRightSidebar}
		isPublic={roomData.isPublic}
	/>
	
	<!-- Модальное окно для редактирования названия заметки -->
	<EditNoteTitleModal 
		isOpen={isEditModalOpen}
		currentTitle={editingNoteTitle}
		onSave={handleSaveNoteTitle}
		onCancel={handleCancelEdit}
	/>
</div>

<style>
	.room-page {
		height: 100%;
		display: flex;
		flex-direction: column;
		background-color: #121212;
	}


	.room-layout {
		flex: 1;
		display: flex;
		flex-direction: column;
		height: 100%;
		width: calc(100% - 280px);
		transition: width 0.3s ease;
		position: relative;
	}

	.room-layout.sidebar-collapsed {
		width: calc(100% - 60px);
	}

	.room-content {
		flex: 1;
		display: flex;
		gap: 8px;
		padding: 24px;
		position: relative;
		background-color: #121212;
		min-height: 0;
	}

	.room-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0; /* Позволяет контенту сжиматься */
		min-height: 0;
	}


	/* Адаптивность для мобильных устройств */
	@media (max-width: 768px) {
		.room-layout {
			width: 100%;
		}

		.room-layout.sidebar-collapsed {
			width: 100%;
		}

		.room-content {
			flex-direction: column;
			gap: 12px;
			padding: 12px;
		}

		.room-main {
			margin-right: 0;
			order: 1;
		}
	}

	@media (max-width: 480px) {
		.room-content {
			padding: 8px;
			gap: 8px;
		}
	}
</style>
