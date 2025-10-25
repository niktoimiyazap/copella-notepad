// Глобальное состояние комнат (nanostores)
import { map } from 'nanostores';

export interface Room {
	id: string;
	title: string;
	description?: string;
	isPublic: boolean;
	coverImageUrl?: string;
	participantLimit: number;
	createdBy: string;
	createdAt: string;
	_count: {
		participants: number;
		notes: number;
	};
}

// Список комнат
export const $rooms = map({
	list: [] as Room[],
	isLoading: false,
	error: null as string | null
});

// Текущая комната
export const $currentRoom = map<{
	room: Room | null;
	isLoading: boolean;
	error: string | null;
}>({
	room: null,
	isLoading: false,
	error: null
});

// Действия для комнат
export const roomsActions = {
	setRooms(rooms: Room[]) {
		$rooms.setKey('list', rooms);
		$rooms.setKey('error', null);
	},
	
	setLoading(isLoading: boolean) {
		$rooms.setKey('isLoading', isLoading);
	},
	
	setError(error: string | null) {
		$rooms.setKey('error', error);
	},
	
	addRoom(room: Room) {
		const currentList = $rooms.get().list;
		$rooms.setKey('list', [room, ...currentList]);
	},
	
	updateRoom(roomId: string, updates: Partial<Room>) {
		const currentList = $rooms.get().list;
		const updatedList = currentList.map(room =>
			room.id === roomId ? { ...room, ...updates } : room
		);
		$rooms.setKey('list', updatedList);
	},
	
	removeRoom(roomId: string) {
		const currentList = $rooms.get().list;
		$rooms.setKey('list', currentList.filter(room => room.id !== roomId));
	}
};

// Действия для текущей комнаты
export const currentRoomActions = {
	setRoom(room: Room | null) {
		$currentRoom.setKey('room', room);
		$currentRoom.setKey('error', null);
	},
	
	setLoading(isLoading: boolean) {
		$currentRoom.setKey('isLoading', isLoading);
	},
	
	setError(error: string | null) {
		$currentRoom.setKey('error', error);
	},
	
	clear() {
		$currentRoom.set({ room: null, isLoading: false, error: null });
	}
};

