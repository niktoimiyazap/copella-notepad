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
	import { openSingleUserWidget } from '$lib/api/user-management';
	import { getNotificationsClient } from '$lib/notifications-client';

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

	// Effect to update document title based on selected note
	$effect(() => {
		if (selectedNoteId) {
			const selectedNote = roomData.notes.find(n => n.id === selectedNoteId);
			if (selectedNote) {
				document.title = `${selectedNote.title} - ${roomData.title}`;
			}
		} else {
			document.title = roomData.title || 'Copella Notepad';
		}
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
			}
		}

	// ОПТИМИЗАЦИЯ: Параллельная загрузка всех данных комнаты
	const [roomResult, notesResult, participantsResult] = await Promise.all([
		getRoom(roomId),
		getRoomNotes(roomId),
		getRoomParticipants(roomId)
	]);

	// Обработка результата загрузки комнаты
	if (roomResult.error || !roomResult.room) {
		console.error('Room fetch error:', roomResult.error);
		error = roomResult.error || 'Комната не найдена';
		isLoading = false;
		return;
	}

	const room = roomResult.room;
	roomData.id = room.id;
	roomData.title = room.title;
	roomData.creator = room.creator;
	roomData.isPublic = room.isPublic;

	// Обработка результата загрузки заметок
	if (notesResult.error) {
		console.error('Notes fetch error:', notesResult.error);
		error = notesResult.error;
	} else {
		roomData.notes = notesResult.notes;
	}

	// Обработка результата загрузки участников
	if (participantsResult.error) {
		console.error('Participants fetch error:', participantsResult.error);
	} else {
		roomData.participants = participantsResult.participants as Participant[];
	}

		// Загружаем права доступа параллельно с обновлением онлайн статуса
		if ($currentUser?.id) {
			const [permissionsResult] = await Promise.all([
				getUserRoomPermissions($currentUser.id, roomId),
				updateOnlineStatus(true)
			]);

			if (!permissionsResult.error) {
				canEdit = permissionsResult.permissions.canEdit;
				canDelete = permissionsResult.permissions.canDelete;
				canInvite = permissionsResult.permissions.canInvite;
				canManageRoom = permissionsResult.permissions.canManageRoom;
			}
		}

		// Подписываемся на WebSocket уведомления (не блокируем UI)
		if ($currentUser?.id) {
			const notificationsClient = getNotificationsClient();
			notificationsClient.subscribeToRoom(roomId);
			
			const handleParticipantUpdate = (data: any) => {
				reloadParticipants();
			};
			
			notificationsClient.on('participant:update', handleParticipantUpdate);
			
			disconnectOnlineTracking = () => {
				notificationsClient.off('participant:update', handleParticipantUpdate);
				notificationsClient.unsubscribeFromRoom(roomId);
			};
		}

		// Убираем искусственную задержку - показываем UI сразу
		showLoading = false;
		isLoading = false;
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
	onDestroy(async () => {
		// Обновляем онлайн статус при выходе из комнаты
		if ($currentUser?.id && roomId) {
			await updateOnlineStatus(false);
		}
		
		if (disconnectOnlineTracking) {
			disconnectOnlineTracking();
		}
	});

	// Функция обновления онлайн статуса
	async function updateOnlineStatus(isOnline: boolean) {
		try {
			const token = localStorage.getItem('session_token');
			if (!token || !roomId) return;

			const response = await fetch(`/api/rooms/${roomId}/online-status`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${token}`,
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ isOnline })
			});
		} catch (error) {
			// Error updating online status
		}
	}

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
				// Перезагружаем участников комнаты
				reloadParticipants();
			},
			onClose: () => {
				// Widget closed
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
		
		// Если открыта заметка - обновляем название заметки
		if (selectedNoteId) {
			const selectedNote = roomData.notes.find(n => n.id === selectedNoteId);
			if (selectedNote && newTitle && newTitle !== selectedNote.title) {
				const oldTitle = selectedNote.title;
				try {
					// Обновляем название в локальном состоянии
					selectedNote.title = newTitle;
					
					// Сохраняем изменения на сервере
					const { updateNote } = await import('$lib/notes');
					const { note: updatedNote, error: updateError } = await updateNote(selectedNoteId, {
						title: newTitle
					});
					
					if (updateError) {
						console.error('Error updating note title:', updateError);
						// Возвращаем старое название в случае ошибки
						selectedNote.title = oldTitle;
						// TODO: Show error message to user
					} else if (updatedNote) {
						// Обновляем заметку в списке
						const noteIndex = roomData.notes.findIndex(n => n.id === selectedNoteId);
						if (noteIndex !== -1) {
							roomData.notes[noteIndex] = updatedNote;
						}
					}
				} catch (error) {
					console.error('Unexpected error updating note title:', error);
					// Возвращаем старое название в случае ошибки
					selectedNote.title = oldTitle;
					// TODO: Show error message to user
				}
			}
		} 
		// Если заметка не открыта - обновляем название комнаты
		else if (newTitle && newTitle !== roomData.title && roomId) {
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
	// Yjs автоматически обрабатывает онлайн статусы участников
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
		{@const selectedNote = selectedNoteId ? roomData.notes.find(n => n.id === selectedNoteId) : undefined}
		{@const displayTitle = selectedNote ? selectedNote.title : roomData.title}
		<RoomHeader 
			title={displayTitle}
			roomTitle={roomData.title}
			roomId={roomData.id}
			onShare={handleShareRoom}
			isOwner={$currentUser?.id === roomData.creator?.id}
			canInvite={canInvite}
			canManageRoom={canManageRoom}
			onToggleRightSidebar={toggleRightSidebar}
			showRightSidebarButton={isMobile && !isRightSidebarOpen}
			isPublic={roomData.isPublic}
			disabled={!canEdit}
			isNoteTitle={!!selectedNote}
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
