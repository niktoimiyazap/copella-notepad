<script lang="ts">
	import RoomCard from './RoomCard.svelte';
	import RoomsGridSkeleton from './RoomsGridSkeleton.svelte';
	
	// RoomsGrid component props
	interface Props {
		rooms?: Array<{
			id: string;
			name: string;
			image?: string;
			participants?: number;
			date?: string;
			isLarge?: boolean;
			isOwner?: string; // ID владельца комнаты
		}>;
		onRoomClick?: (roomId: string) => void;
		onRoomEdit?: (roomId: string) => void;
		onRoomDelete?: (roomId: string) => void;
		isLoading?: boolean;
	}

	// Экспортируем rooms для доступа извне
	export { rooms };
	
	// Экспортируем функцию для получения комнат
	export function getRooms() {
		return rooms;
	}

	// Функция для добавления новой комнаты (будет экспортирована)
	export function addRoom(roomData: {
		id: string;
		name: string;
		image?: string;
		participants?: number;
	}) {
		const newRoom = {
			...roomData,
			participants: roomData.participants || 1,
			date: 'Только что',
			isLarge: localRooms.length === 0 // Первая комната всегда большая
		};
		
		localRooms = [...localRooms, newRoom];
	}

	// Функция для обновления существующей комнаты
	export function updateRoom(roomId: string, updatedData: {
		name?: string;
		image?: string;
		participants?: number;
	}) {
		// Проверяем, есть ли комната с таким ID
		const roomIndex = localRooms.findIndex(room => room.id === roomId);
		
		if (roomIndex === -1) {
			return;
		}
		
		// Создаем новый массив для правильной реактивности в Svelte 5
		const updatedRooms = [...localRooms];
		const oldRoom = updatedRooms[roomIndex];
		updatedRooms[roomIndex] = {
			...oldRoom,
			...updatedData,
			date: 'Только что' // Обновляем время последнего изменения
		};
		
		// Присваиваем новый массив для триггера реактивности
		localRooms = updatedRooms;
	}
	
	let { 
		rooms: propRooms,
		onRoomClick,
		onRoomEdit,
		onRoomDelete,
		isLoading = false
	}: Props = $props();

	// Локальное состояние комнат (начинаем с пустого списка)
	let localRooms = $state([]);
	
	// Используем переданные комнаты или локальные
	let rooms = $derived(propRooms && propRooms.length > 0 ? propRooms : localRooms);
	
	// Создаем отфильтрованные массивы с помощью $derived
	let largeRooms = $derived(rooms.filter(room => room.isLarge));
	let regularRooms = $derived(rooms.filter(room => !room.isLarge));
	
	function handleRoomClick(roomId: string) {
		onRoomClick?.(roomId);
		// TODO: Implement room navigation logic
	}
	
	function handleRoomEdit(roomId: string) {
		onRoomEdit?.(roomId);
		// TODO: Implement room edit logic
	}
	
	function handleRoomDelete(roomId: string) {
		onRoomDelete?.(roomId);
		
		// Удаляем комнату из локального состояния
		if (!propRooms) { // Работаем с локальным состоянием только если не переданы комнаты извне
			localRooms = localRooms.filter(room => room.id !== roomId);
			
			// Перестраиваем сетку - назначаем новую большую карточку
			reorganizeGrid();
		}
	}
	
	function reorganizeGrid() {
		// Если удалили большую карточку, делаем первую оставшуюся большой
		const largeRoom = localRooms.find(room => room.isLarge);
		if (!largeRoom && localRooms.length > 0) {
			localRooms = localRooms.map((room, index) => ({
				...room,
				isLarge: index === 0
			}));
		}
	}
</script>

{#if isLoading}
	<RoomsGridSkeleton count={8} />
{:else if rooms.length === 0}
	<div class="empty-state">
		<div class="empty-state-content">
			<h2>Создайте свою первую комнату</h2>
			<p>Нажмите кнопку "Создать" в заголовке, чтобы начать работу</p>
		</div>
	</div>
{:else}
	<div class="rooms-grid">
		{#each largeRooms as room (room.id)}
			<RoomCard 
				{room} 
				onClick={handleRoomClick}
				onEdit={handleRoomEdit}
				onDelete={handleRoomDelete}
			/>
		{/each}
		{#each regularRooms as room (room.id)}
			<RoomCard 
				{room} 
				onClick={handleRoomClick}
				onEdit={handleRoomEdit}
				onDelete={handleRoomDelete}
			/>
		{/each}
	</div>
{/if}

<style>
	.empty-state {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 400px;
		padding: 40px;
	}

	.empty-state-content {
		text-align: center;
		max-width: 400px;
	}

	.empty-state-content h2 {
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 32px;
		line-height: 1.209;
		color: #FFFFFF;
		margin: 0 0 16px 0;
	}

	.empty-state-content p {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 16px;
		line-height: 1.5;
		color: #7E7E7E;
		margin: 0;
	}

	.rooms-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 180px);
		gap: 32px;
		grid-template-areas: 
			"large small1 small2"
			"large small3 small4"
			"small5 small6 small7";
		flex: 1;
		padding: 40px;
	}
	
	.rooms-grid :global(.room-card--large) {
		grid-area: large;
	}
	
	/* Responsive adjustments */
	@media (max-width: 1400px) {
		.rooms-grid {
			grid-template-columns: repeat(2, 1fr);
			grid-template-areas: 
				"large small1"
				"large small2"
				"small3 small4"
				"small5 small6"
				"small7 .";
		}
	}

	@media (max-width: 1024px) {
		.rooms-grid {
			grid-template-columns: 1fr;
			grid-template-rows: auto;
			grid-template-areas: 
				"large"
				"small1"
				"small2"
				"small3"
				"small4"
				"small5"
				"small6"
				"small7";
			padding: 32px;
		}
		
		.rooms-grid :global(.room-card--large) {
			grid-area: large;
			height: 300px;
		}
		
		.rooms-grid :global(.room-card:not(.room-card--large)) {
			height: 160px;
		}
	}

	@media (max-width: 768px) {
		.rooms-grid {
			gap: 20px;
			padding: 24px;
		}
		
		.rooms-grid :global(.room-card--large) {
			height: 280px;
		}
		
		.rooms-grid :global(.room-card:not(.room-card--large)) {
			height: 140px;
		}
	}

	@media (max-width: 480px) {
		.rooms-grid {
			gap: 16px;
			padding: 20px;
		}
		
		.rooms-grid :global(.room-card--large) {
			height: 260px;
		}
		
		.rooms-grid :global(.room-card:not(.room-card--large)) {
			height: 120px;
		}
	}
</style>
