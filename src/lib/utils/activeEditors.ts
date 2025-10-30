import { browser } from '$app/environment';

// Клиентская утилита для работы с активными редакторами

export interface ActiveEditor {
	id: string;
	username: string;
	fullName: string;
	avatarUrl?: string;
}

// Получаем токен авторизации
function getAuthToken(): string | null {
	if (!browser) return null;
	return localStorage.getItem('session_token');
}

// Получить список активных редакторов для заметки
export async function getActiveEditors(noteId: string): Promise<{ editors: ActiveEditor[]; error: string | null }> {
	try {
		const token = getAuthToken();
		if (!token) {
			return { editors: [], error: 'Not authenticated' };
		}

		const response = await fetch(`/api/notes/${noteId}/active-editors`, {
			method: 'GET',
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (!response.ok) {
			return { editors: [], error: 'Failed to fetch active editors' };
		}

		const data = await response.json();
		return { editors: data.editors || [], error: null };
	} catch (error) {
		console.error('Error fetching active editors:', error);
		return { editors: [], error: 'Unexpected error' };
	}
}

// Пометить себя как активного редактора
export async function markAsActiveEditor(noteId: string): Promise<{ editors: ActiveEditor[]; error: string | null }> {
	try {
		const token = getAuthToken();
		if (!token) {
			return { editors: [], error: 'Not authenticated' };
		}

		const response = await fetch(`/api/notes/${noteId}/active-editors`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (!response.ok) {
			return { editors: [], error: 'Failed to mark as active editor' };
		}

		const data = await response.json();
		return { editors: data.editors || [], error: null };
	} catch (error) {
		console.error('Error marking as active editor:', error);
		return { editors: [], error: 'Unexpected error' };
	}
}

// Удалить себя из списка активных редакторов
export async function removeAsActiveEditor(noteId: string): Promise<{ error: string | null }> {
	try {
		const token = getAuthToken();
		if (!token) {
			return { error: 'Not authenticated' };
		}

		const response = await fetch(`/api/notes/${noteId}/active-editors`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${token}`
			}
		});

		if (!response.ok) {
			return { error: 'Failed to remove as active editor' };
		}

		return { error: null };
	} catch (error) {
		console.error('Error removing as active editor:', error);
		return { error: 'Unexpected error' };
	}
}

// Класс для автоматического управления статусом активного редактора
export class ActiveEditorTracker {
	private noteId: string;
	private intervalId: number | null = null;
	private readonly HEARTBEAT_INTERVAL = 30000; // 30 секунд

	constructor(noteId: string) {
		this.noteId = noteId;
	}

	// Начать отслеживание
	async start(): Promise<void> {
		if (!browser) return;

		// Сразу помечаем себя как активного редактора
		await markAsActiveEditor(this.noteId);

		// Устанавливаем интервал для heartbeat
		this.intervalId = window.setInterval(async () => {
			await markAsActiveEditor(this.noteId);
		}, this.HEARTBEAT_INTERVAL);
	}

	// Остановить отслеживание
	async stop(): Promise<void> {
		if (!browser) return;

		// Очищаем интервал
		if (this.intervalId !== null) {
			clearInterval(this.intervalId);
			this.intervalId = null;
		}

		// Удаляем себя из списка активных редакторов
		await removeAsActiveEditor(this.noteId);
	}

	// Обновить noteId (если пользователь переключился на другую заметку)
	async switchNote(newNoteId: string): Promise<void> {
		// Останавливаем отслеживание текущей заметки
		await this.stop();

		// Обновляем ID заметки
		this.noteId = newNoteId;

		// Запускаем отслеживание новой заметки
		await this.start();
	}
}

