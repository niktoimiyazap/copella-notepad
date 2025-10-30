import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUserFromToken } from '$lib/utils/userManagement';

// In-memory хранилище активных редакторов (noteId -> Set<userId>)
const activeEditorsStore = new Map<string, Set<string>>();

// Храним информацию о пользователях (userId -> { username, fullName, avatarUrl })
const usersCache = new Map<string, { id: string; username: string; fullName: string; avatarUrl?: string }>();

// Таймауты для автоматического удаления неактивных редакторов (noteId:userId -> timeoutId)
const editorTimeouts = new Map<string, NodeJS.Timeout>();

const EDITOR_TIMEOUT = 60000; // 60 секунд неактивности

// GET /api/notes/[id]/active-editors - получить список активных редакторов
export const GET: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const noteId = params.id;
		
		if (!noteId) {
			return json({ error: 'Note ID is required' }, { status: 400 });
		}

		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Получаем список активных редакторов
		const editorIds = activeEditorsStore.get(noteId) || new Set();
		const editors = Array.from(editorIds)
			.map(userId => usersCache.get(userId))
			.filter((user): user is { id: string; username: string; fullName: string; avatarUrl?: string } => user !== undefined);

		return json({ editors });
	} catch (error) {
		console.error('Error fetching active editors:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/notes/[id]/active-editors - пометить пользователя как активного редактора
export const POST: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const noteId = params.id;
		
		if (!noteId) {
			return json({ error: 'Note ID is required' }, { status: 400 });
		}

		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Добавляем пользователя в список активных редакторов
		if (!activeEditorsStore.has(noteId)) {
			activeEditorsStore.set(noteId, new Set());
		}
		activeEditorsStore.get(noteId)?.add(user.id);

		// Кешируем информацию о пользователе
		usersCache.set(user.id, {
			id: user.id,
			username: user.username,
			fullName: user.fullName,
			avatarUrl: user.avatarUrl || undefined
		});

		// Очищаем предыдущий таймаут
		const timeoutKey = `${noteId}:${user.id}`;
		const existingTimeout = editorTimeouts.get(timeoutKey);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
		}

		// Устанавливаем новый таймаут для автоматического удаления
		const timeout = setTimeout(() => {
			activeEditorsStore.get(noteId)?.delete(user.id);
			editorTimeouts.delete(timeoutKey);
			
			// Если больше нет редакторов - удаляем запись
			if (activeEditorsStore.get(noteId)?.size === 0) {
				activeEditorsStore.delete(noteId);
			}
		}, EDITOR_TIMEOUT);

		editorTimeouts.set(timeoutKey, timeout);

		// Получаем обновленный список редакторов
		const editorIds = activeEditorsStore.get(noteId) || new Set();
		const editors = Array.from(editorIds)
			.map(userId => usersCache.get(userId))
			.filter((user): user is { id: string; username: string; fullName: string; avatarUrl?: string } => user !== undefined);

		return json({ editors });
	} catch (error) {
		console.error('Error adding active editor:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/notes/[id]/active-editors - удалить пользователя из списка активных редакторов
export const DELETE: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const noteId = params.id;
		
		if (!noteId) {
			return json({ error: 'Note ID is required' }, { status: 400 });
		}

		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Удаляем пользователя из списка активных редакторов
		activeEditorsStore.get(noteId)?.delete(user.id);

		// Очищаем таймаут
		const timeoutKey = `${noteId}:${user.id}`;
		const existingTimeout = editorTimeouts.get(timeoutKey);
		if (existingTimeout) {
			clearTimeout(existingTimeout);
			editorTimeouts.delete(timeoutKey);
		}

		// Если больше нет редакторов - удаляем запись
		if (activeEditorsStore.get(noteId)?.size === 0) {
			activeEditorsStore.delete(noteId);
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error removing active editor:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

