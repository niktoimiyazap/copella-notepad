// Общая логика для загрузки изображений в модальных окнах
import { browser } from '$app/environment';
import { supabase } from '$lib/supabase';

// Функция для получения токена авторизации
async function getAuthToken(): Promise<string | null> {
	try {
		// Сначала пытаемся получить токен из localStorage (приоритет)
		if (browser && typeof window !== 'undefined') {
			const token = window.localStorage.getItem('session_token');
			if (token) {
				return token;
			}
		}
		
		// Fallback: пытаемся получить через Supabase
		const { data: { session } } = await supabase.auth.getSession();
		if (session?.access_token) {
			return session.access_token;
		}
		
		return null;
	} catch (error) {
		console.error('[getAuthToken] Error:', error);
		return null;
	}
}

export interface ImageUploadState {
	uploadedImage: File | null;
	uploadedImageUrl: string;
	coverImage: string;
	uploadedImagePath?: string; // Путь к файлу в Supabase Storage
	isUploading?: boolean;
}

export interface ImageUploadActions {
	handleImageUpload: (event: Event) => Promise<void>;
	removeUploadedImage: (inputId?: string) => Promise<void>;
	clearImageState: () => void;
}

export function createImageUploadActions(
	state: ImageUploadState,
	updateState: (updates: Partial<ImageUploadState>) => void,
	inputId: string = 'cover-upload'
): ImageUploadActions {
	
	async function handleImageUpload(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		
		if (file) {
			// Проверяем тип файла
			if (!file.type.startsWith('image/')) {
				alert('Пожалуйста, выберите изображение');
				return;
			}
			
			// Проверяем размер файла (максимум 5MB)
			if (file.size > 5 * 1024 * 1024) {
				alert('Размер файла не должен превышать 5MB');
				return;
			}
			
			// Показываем предварительный просмотр с локальным URL
			const previewUrl = URL.createObjectURL(file);
			updateState({
				uploadedImage: file,
				uploadedImageUrl: previewUrl,
				isUploading: true
			});
			
			try {
				// Получаем токен авторизации
				const token = await getAuthToken();
				if (!token) {
					throw new Error('Необходима авторизация');
				}

				// Загружаем файл в Supabase Storage
				const formData = new FormData();
				formData.append('file', file);
				
				const response = await fetch('/api/upload/room-cover', {
					method: 'POST',
					headers: {
						'Authorization': `Bearer ${token}`
					},
					body: formData,
					credentials: 'include'
				});
				
				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || 'Failed to upload image');
				}
				
				const { url, path } = await response.json();
				
				// Очищаем локальный preview URL
				URL.revokeObjectURL(previewUrl);
				
				// Обновляем состояние с публичным URL из Supabase
				updateState({
					uploadedImageUrl: url,
					coverImage: url,
					uploadedImagePath: path,
					isUploading: false
				});
			} catch (error) {
				console.error('Error uploading image:', error);
				alert('Не удалось загрузить изображение. Попробуйте еще раз.');
				
				// Очищаем состояние при ошибке
				URL.revokeObjectURL(previewUrl);
				updateState({
					uploadedImage: null,
					uploadedImageUrl: '',
					coverImage: '',
					isUploading: false
				});
				
				// Очищаем input
				const fileInput = document.getElementById(inputId) as HTMLInputElement;
				if (fileInput) {
					fileInput.value = '';
				}
			}
		}
	}
	
	async function removeUploadedImage(inputId: string = inputId) {
		// Если есть загруженный файл в Supabase, удаляем его
		if (state.uploadedImagePath) {
			try {
				const token = await getAuthToken();
				if (token) {
					await fetch('/api/upload/room-cover', {
						method: 'DELETE',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: JSON.stringify({ path: state.uploadedImagePath }),
						credentials: 'include'
					});
				}
			} catch (error) {
				console.error('Error deleting image from Supabase:', error);
			}
		}
		
		// Очищаем input файла
		const fileInput = document.getElementById(inputId) as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
		
		// Очищаем состояние (не используем URL.revokeObjectURL для Supabase URLs)
		updateState({
			uploadedImage: null,
			uploadedImageUrl: '',
			coverImage: '',
			uploadedImagePath: undefined
		});
	}
	
	function clearImageState() {
		// Очищаем input файла
		const fileInput = document.getElementById(inputId) as HTMLInputElement;
		if (fileInput) {
			fileInput.value = '';
		}
		
		// Не удаляем файл из Supabase при очистке состояния,
		// так как это может использоваться после успешного создания комнаты
		updateState({
			uploadedImage: null,
			uploadedImageUrl: '',
			coverImage: '',
			uploadedImagePath: undefined
		});
	}
	
	return {
		handleImageUpload,
		removeUploadedImage,
		clearImageState
	};
}
