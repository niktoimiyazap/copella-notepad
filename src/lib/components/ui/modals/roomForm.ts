import type { RoomData, RoomFormState, RoomFormActions } from './types';
import { createImageUploadActions } from './imageUpload';

// Общая логика для форм комнат
export function createRoomFormActions(
	state: RoomFormState,
	updateState: (updates: Partial<RoomFormState>) => void,
	onSubmit?: (roomData: RoomData) => void,
	onClose?: () => void,
	isEditMode: boolean = false,
	initialRoomData?: RoomData
): RoomFormActions {
	
	// Создаем действия для загрузки изображений
	const imageUploadActions = createImageUploadActions(
		{
			uploadedImage: state.uploadedImage,
			uploadedImageUrl: state.uploadedImageUrl,
			coverImage: state.coverImage,
			uploadedImagePath: state.uploadedImagePath,
			isUploading: state.isUploading
		},
		(updates) => updateState(updates),
		isEditMode ? 'cover-upload-edit' : 'cover-upload'
	);
	
	function handleSubmit(event: Event) {
		event.preventDefault();
		
		if (!state.title.trim()) {
			return;
		}
		
		updateState({ isLoading: true });
		
		const roomData: RoomData = {
			...(isEditMode && initialRoomData ? { id: initialRoomData.id } : {}),
			title: state.title.trim(),
			isPublic: state.isPublic,
			coverImage: state.coverImage || undefined,
			participantLimit: state.participantLimit
		};
		
		// Если мы в режиме редактирования, но initialRoomData null, 
		// попробуем получить ID из состояния формы
		if (isEditMode && !roomData.id && state.id) {
			roomData.id = state.id;
		}
		
		// Имитация API вызова
		setTimeout(() => {
			onSubmit?.(roomData);
			updateState({ isLoading: false });
			// Закрываем модалку только для создания, не для редактирования
			if (!isEditMode) {
				handleClose();
			}
		}, 1000);
	}
	
	function handleClose() {
		resetForm();
		onClose?.();
	}
	
	function handleParticipantLimitChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const value = parseInt(target.value);
		if (value >= 1 && value <= 50) {
			updateState({ participantLimit: value });
		}
	}
	
	function resetForm() {
		// Очищаем изображение
		imageUploadActions.clearImageState();
		
		// Сбрасываем остальные поля
		updateState({
			id: initialRoomData?.id,
			title: initialRoomData?.title || '',
			isPublic: initialRoomData?.isPublic ?? true,
			coverImage: initialRoomData?.coverImage || '',
			participantLimit: initialRoomData?.participantLimit || 10,
			isLoading: false
		});
	}
	
	return {
		handleSubmit,
		handleClose,
		handleImageUpload: imageUploadActions.handleImageUpload,
		removeUploadedImage: imageUploadActions.removeUploadedImage,
		handleParticipantLimitChange,
		resetForm
	};
}

// Функция для инициализации состояния формы
export function initializeRoomFormState(initialData?: RoomData): RoomFormState {
	return {
		id: initialData?.id,
		title: initialData?.title || '',
		isPublic: initialData?.isPublic ?? true,
		coverImage: initialData?.coverImage || '',
		participantLimit: initialData?.participantLimit || 10,
		isLoading: false,
		uploadedImage: null,
		uploadedImageUrl: '',
		uploadedImagePath: undefined,
		isUploading: false
	};
}
