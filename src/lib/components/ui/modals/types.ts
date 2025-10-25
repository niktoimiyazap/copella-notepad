// Общие типы для модальных окон комнат

export interface RoomData {
	id?: string;
	title: string;
	isPublic: boolean;
	coverImage?: string;
	participantLimit: number;
}

export interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit?: (roomData: RoomData) => void;
}

export interface EditModalProps extends ModalProps {
	roomData?: RoomData;
}

// Состояние формы комнаты
export interface RoomFormState {
	id?: string;
	title: string;
	isPublic: boolean;
	coverImage: string;
	participantLimit: number;
	isLoading: boolean;
	uploadedImage: File | null;
	uploadedImageUrl: string;
	uploadedImagePath?: string; // Путь к файлу в Supabase Storage
	isUploading?: boolean; // Статус загрузки изображения
}

// Функции для работы с формой
export interface RoomFormActions {
	handleSubmit: (event: Event) => void;
	handleClose: () => void;
	handleImageUpload: (event: Event) => Promise<void>;
	removeUploadedImage: () => Promise<void>;
	handleParticipantLimitChange: (event: Event) => void;
	resetForm: () => void;
}
