import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import { getCurrentUserFromToken } from '$lib/utils/userManagement';

// GET /api/rooms/[id]/notes - получить заметки комнаты
export const GET: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const roomId = params.id;
		
		// Валидация ID комнаты
		if (!roomId || typeof roomId !== 'string') {
			console.error('Invalid room ID:', roomId);
			return json({ error: 'Invalid room ID' }, { status: 400 });
		}
		
		// Проверяем формат CUID (должен быть 25 символов)
		if (roomId.length !== 25) {
			console.error('Invalid room ID format:', roomId, 'length:', roomId.length);
			return json({ error: 'Invalid room ID format' }, { status: 400 });
		}
		
		console.log('Fetching notes for room:', roomId);

		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

	// Проверяем доступ к комнате - только для создателя и участников
	console.log('Checking access to room:', roomId, 'for user:', user.id);
	
	const room = await prisma.room.findFirst({
		where: {
			id: roomId,
			OR: [
				{ createdBy: user.id },
				{
					participants: {
						some: {
							userId: user.id
						}
					}
				}
			]
		}
	});

		if (!room) {
			console.error('Room not found or access denied for user:', user.id, 'room:', roomId);
			return json({ error: 'Room not found or access denied' }, { status: 404 });
		}
		
		console.log('Room found:', room.title, 'isPublic:', room.isPublic);

		// Получаем заметки из локальной базы данных (Prisma)
		const notesData = await prisma.note.findMany({
			where: {
				roomId: roomId
			},
			orderBy: {
				updatedAt: 'desc'
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

		console.log('Notes fetched from local database:', notesData.length);

		return json({ notes: notesData || [] });
	} catch (error) {
		console.error('Error fetching room notes:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/rooms/[id]/notes - создать новую заметку
export const POST: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const roomId = params.id;
		
		// Валидация ID комнаты
		if (!roomId || typeof roomId !== 'string' || roomId.length !== 25) {
			return json({ error: 'Invalid room ID format' }, { status: 400 });
		}
		
		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { title, content, createdBy } = body;

		// Валидация
		if (!title || title.trim().length === 0) {
			return json({ error: 'Title is required' }, { status: 400 });
		}

	// Проверяем доступ к комнате - только для создателя и участников
	const room = await prisma.room.findFirst({
		where: {
			id: roomId,
			OR: [
				{ createdBy: user.id },
				{
					participants: {
						some: {
							userId: user.id
						}
					}
				}
			]
		}
	});

		if (!room) {
			return json({ error: 'Room not found or access denied' }, { status: 404 });
		}

		// Создаем заметку
		const note = await prisma.note.create({
			data: {
				roomId: roomId,
				title: title.trim(),
				content: content || '',
				createdBy: createdBy || user.id
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

		console.log('Note created successfully:', note.id);
		return json({ note }, { status: 201 });
	} catch (error) {
		console.error('Error creating note:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
