import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import { getCurrentUserFromToken } from '$lib/utils/userManagement';

// GET /api/rooms/[id] - получить конкретную комнату
export const GET: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const roomId = params.id;

		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

	// Получаем комнату - доступ только для создателя и участников
	// ОПТИМИЗАЦИЯ: Убрали загрузку notes и participants для ускорения
	// Они загружаются отдельными запросами через /api/rooms/[id]/notes и /api/rooms/[id]/participants
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
		},
		select: {
			id: true,
			title: true,
			description: true,
			isPublic: true,
			coverImageUrl: true,
			participantLimit: true,
			createdBy: true,
			createdAt: true,
			updatedAt: true,
			allowEdit: true,
			allowInvite: true,
			allowDelete: true,
			requireApproval: true,
			timeRestricted: true,
			accessUntil: true,
			// Только создатель и счетчики
			creator: {
				select: {
					id: true,
					username: true,
					fullName: true,
					avatarUrl: true
				}
			},
			_count: {
				select: {
					participants: true,
					notes: true
				}
			}
		}
	});

	if (!room) {
		return json({ error: 'Room not found' }, { status: 404 });
	}

	// Добавляем пустые массивы для обратной совместимости с фронтендом
	// Фронтенд загружает participants и notes отдельными запросами
	const roomWithArrays = {
		...room,
		participants: [],
		notes: []
	};

	return json({ room: roomWithArrays });
	} catch (error) {
		console.error('Error fetching room:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT /api/rooms/[id] - обновить комнату
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const roomId = params.id;

		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { 
			title, 
			description, 
			isPublic, 
			coverImageUrl, 
			participantLimit,
			allowEdit,
			allowInvite,
			allowDelete,
			requireApproval
		} = body;

		// Проверяем, является ли пользователь создателем комнаты
		const existingRoom = await prisma.room.findFirst({
			where: {
				id: roomId,
				createdBy: user.id
			}
		});

		if (!existingRoom) {
			return json({ error: 'Room not found or access denied' }, { status: 404 });
		}

		// Валидация
		if (title !== undefined && (!title || title.trim().length === 0)) {
			return json({ error: 'Title is required' }, { status: 400 });
		}

		if (title && title.length > 50) {
			return json({ error: 'Title must be 50 characters or less' }, { status: 400 });
		}

		if (participantLimit && (participantLimit < 1 || participantLimit > 50)) {
			return json({ error: 'Participant limit must be between 1 and 50' }, { status: 400 });
		}

		// Обновляем комнату
		const updatedRoom = await prisma.room.update({
			where: { id: roomId },
			data: {
				...(title && { title: title.trim() }),
				...(description !== undefined && { description: description?.trim() || null }),
				...(isPublic !== undefined && { isPublic }),
				...(coverImageUrl !== undefined && { coverImageUrl: coverImageUrl || null }),
				...(participantLimit !== undefined && { participantLimit }),
				...(allowEdit !== undefined && { allowEdit }),
				...(allowInvite !== undefined && { allowInvite }),
				...(allowDelete !== undefined && { allowDelete }),
				...(requireApproval !== undefined && { requireApproval }),
				updatedAt: new Date()
			},
			include: {
				creator: {
					select: {
						id: true,
						username: true,
						fullName: true,
						avatarUrl: true
					}
				},
				_count: {
					select: {
						participants: true,
						notes: true
					}
				}
			}
		});

		return json({ room: updatedRoom });
	} catch (error) {
		console.error('Error updating room:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/rooms/[id] - удалить комнату
export const DELETE: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const roomId = params.id;

		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Проверяем, является ли пользователь создателем комнаты
		const existingRoom = await prisma.room.findFirst({
			where: {
				id: roomId,
				createdBy: user.id
			}
		});

		if (!existingRoom) {
			return json({ error: 'Room not found or access denied' }, { status: 404 });
		}

		// Удаляем комнату (каскадное удаление удалит связанные записи)
		await prisma.room.delete({
			where: { id: roomId }
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting room:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
