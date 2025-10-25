import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import { getCurrentUserFromToken } from '$lib/utils/userManagement';
import { canEditNote, canDeleteNote } from '$lib/permissions';

// GET /api/notes/[id] - получить заметку по ID
export const GET: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const noteId = params.id;
		
		// Валидация ID заметки
		if (!noteId || typeof noteId !== 'string') {
			return json({ error: 'Invalid note ID' }, { status: 400 });
		}
		
		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Получаем заметку из локальной базы данных
		const note = await prisma.note.findUnique({
			where: {
				id: noteId
			},
			include: {
			room: {
				select: {
					id: true,
					title: true,
					createdBy: true,
					participants: {
						where: {
							userId: user.id
						}
					}
				}
			},
				creator: {
					select: {
						id: true,
						username: true,
						fullName: true,
						avatarUrl: true
					}
				}
			}
		});

		if (!note) {
			return json({ error: 'Note not found' }, { status: 404 });
		}

	// Проверяем доступ к заметке через комнату - только создатель или участник
	const hasAccess = note.room.createdBy === user.id || 
		note.room.participants.length > 0;

		if (!hasAccess) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		return json({ note });
	} catch (error) {
		console.error('Error fetching note:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT /api/notes/[id] - обновить заметку
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const noteId = params.id;
		
		// Валидация ID заметки
		if (!noteId || typeof noteId !== 'string') {
			return json({ error: 'Invalid note ID' }, { status: 400 });
		}
		
		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { title, content } = body;

		// Проверяем права на редактирование
		const { canEdit, error: editError } = await canEditNote(user.id, noteId);
		
		if (editError || !canEdit) {
			return json({ error: editError || 'Access denied' }, { status: 403 });
		}

		// Обновляем заметку
		const updatedNote = await prisma.note.update({
			where: {
				id: noteId
			},
			data: {
				...(title && { title: title.trim() }),
				...(content !== undefined && { content })
			},
			include: {
				creator: {
					select: {
						id: true,
						username: true,
						fullName: true,
						avatarUrl: true
					}
				}
			}
		});

		return json({ note: updatedNote });
	} catch (error) {
		console.error('Error updating note:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/notes/[id] - удалить заметку
export const DELETE: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const noteId = params.id;
		
		// Валидация ID заметки
		if (!noteId || typeof noteId !== 'string') {
			return json({ error: 'Invalid note ID' }, { status: 400 });
		}
		
		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Проверяем права на удаление
		const { canDelete, error: deleteError } = await canDeleteNote(user.id, noteId);
		
		if (deleteError || !canDelete) {
			return json({ error: deleteError || 'Access denied' }, { status: 403 });
		}

		// Удаляем заметку
		await prisma.note.delete({
			where: {
				id: noteId
			}
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting note:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
