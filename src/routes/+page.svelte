<script lang="ts">
	import { onMount } from 'svelte';
	import RoomsGrid from '$lib/components/home/RoomsGrid.svelte';
	import Header from '$lib/components/layout/header/Header.svelte';
	import { EditRoomModal } from '$lib/components/ui/modals';
	import { goto } from '$app/navigation';
	import { getUserRooms, createRoom, updateRoom, deleteRoom, type Room, type CreateRoomData, type UpdateRoomData } from '$lib/rooms';

	interface RoomData {
		id?: string;
		title: string;
		isPublic: boolean;
		coverImage?: string;
		participantLimit: number;
	}
	
	let isEditModalOpen = $state(false);
	let roomToEdit: RoomData | null = $state(null);
	let roomsGridComponent: any = $state(null);
	let rooms: Room[] = $state([]);
	let isLoading = $state(true);
	let error = $state('');
	
	// Загружаем комнаты при монтировании компонента
	onMount(async () => {
		await loadRooms();
	});

	async function loadRooms() {
		isLoading = true;
		error = '';
		
		const result = await getUserRooms();
		if (result.error) {
			error = result.error;
		} else if (result.rooms) {
			rooms = result.rooms;
		}
		
		isLoading = false;
	}
	
	async function handleCreateRoom(roomData: RoomData) {
		const createData: CreateRoomData = {
			title: roomData.title,
			description: '',
			isPublic: roomData.isPublic,
			coverImageUrl: roomData.coverImage,
			participantLimit: roomData.participantLimit
		};
		
		const result = await createRoom(createData);
		if (result.error) {
			error = result.error;
			return;
		}
		
		if (result.room) {
			// Добавляем новую комнату в список
			rooms = [result.room, ...rooms];
			
			// Обновляем компонент RoomsGrid если он существует
			if (roomsGridComponent) {
				roomsGridComponent.addRoom({
					id: result.room.id,
					name: result.room.title,
					image: result.room.coverImageUrl,
					participants: result.room._count.participants
				});
			}
		}
	}
	
	function handleRoomClick(roomId: string) {
		// Переходим на страницу комнаты
		goto(`/room/${roomId}`);
	}
	
	function handleEditRoom(roomId: string) {
		// Находим комнату по ID в нашем списке комнат
		const room = rooms.find(r => r.id === roomId);
		if (room) {
			roomToEdit = {
				id: room.id,
				title: room.title,
				isPublic: room.isPublic,
				participantLimit: room.participantLimit,
				coverImage: room.coverImageUrl
			};
			isEditModalOpen = true;
		}
	}
	
	function handleEditModalClose() {
		isEditModalOpen = false;
		roomToEdit = null;
	}
	
	async function handleEditRoomSubmit(roomData: RoomData) {
		if (!roomData.id) return;
		
		const updateData: UpdateRoomData = {
			title: roomData.title,
			isPublic: roomData.isPublic,
			coverImageUrl: roomData.coverImage,
			participantLimit: roomData.participantLimit
		};
		
		const result = await updateRoom(roomData.id, updateData);
		if (result.error) {
			error = result.error;
			return;
		}
		
		if (result.room) {
			// Обновляем комнату в списке
			rooms = rooms.map(room => 
				room.id === roomData.id ? result.room! : room
			);
			
			// Обновляем компонент RoomsGrid если он существует
			if (roomsGridComponent) {
				const updateData = {
					name: result.room.title,
					image: result.room.coverImageUrl,
					participants: result.room._count.participants
				};
				roomsGridComponent.updateRoom(roomData.id, updateData);
			}
		}
		
		// Закрываем модалку
		handleEditModalClose();
	}
	
	async function handleDeleteRoom(roomId: string) {
		const result = await deleteRoom(roomId);
		if (result.error) {
			error = result.error;
			return;
		}
		
		if (result.success) {
			// Удаляем комнату из списка
			rooms = rooms.filter(room => room.id !== roomId);
			
			// Обновляем компонент RoomsGrid если он существует
			if (roomsGridComponent) {
				// RoomsGrid сам обработает удаление через onRoomDelete
			}
		}
	}
	
</script>

<div class="rooms-page">
	<Header onCreateRoom={handleCreateRoom} />
	
	{#if error}
		<div class="error-message">
			<p>Ошибка: {error}</p>
			<button onclick={loadRooms} class="btn btn--secondary">Попробовать снова</button>
		</div>
	{:else}
		<RoomsGrid 
			bind:this={roomsGridComponent}
			rooms={rooms.map((room, index) => ({
				id: room.id,
				name: room.title,
				image: room.coverImageUrl,
				participants: room._count.participants,
				date: new Date(room.createdAt).toLocaleDateString('ru-RU'),
				isLarge: index === 0, // Первая комната всегда большая
				isOwner: room.createdBy // Передаем ID создателя для проверки прав
			}))}
			{isLoading}
			onRoomClick={handleRoomClick} 
			onRoomEdit={handleEditRoom}
			onRoomDelete={handleDeleteRoom}
		/>
	{/if}
	
	<!-- Модалка редактирования комнаты -->
	<EditRoomModal 
		isOpen={isEditModalOpen}
		onClose={handleEditModalClose}
		onSubmit={handleEditRoomSubmit}
		roomData={roomToEdit}
	/>
</div>

<style>
	.rooms-page {
		height: 100%;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
	}

	.error-message {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px;
		gap: 16px;
		text-align: center;
	}

	.error-message p {
		color: #EF4444;
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 16px;
		margin: 0;
	}
</style>
