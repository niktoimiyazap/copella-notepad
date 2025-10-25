import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import { getCurrentUserFromToken } from '$lib/utils/userManagement';

// GET /api/rooms - получить все комнаты пользователя
export const GET: RequestHandler = async ({ request, cookies }) => {
	try {
		// Получаем текущего пользователя из cookie-сессии
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Получаем все комнаты, где пользователь является создателем или участником
		const rooms = await prisma.room.findMany({
			where: {
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
			include: {
				creator: {
					select: {
						id: true,
						username: true,
						fullName: true,
						avatarUrl: true
					}
				},
				participants: {
					include: {
						user: {
							select: {
								id: true,
								username: true,
								fullName: true,
								avatarUrl: true
							}
						}
					},
					orderBy: {
						joinedAt: 'asc'
					}
				},
				_count: {
					select: {
						participants: true,
						notes: true
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		return json({ rooms });
	} catch (error) {
		console.error('Error fetching rooms:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// POST /api/rooms - создать новую комнату
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Получаем текущего пользователя из cookie-сессии
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { title, description, isPublic, coverImageUrl, participantLimit } = body;

		// Валидация
		if (!title || title.trim().length === 0) {
			return json({ error: 'Title is required' }, { status: 400 });
		}

		if (title.length > 50) {
			return json({ error: 'Title must be 50 characters or less' }, { status: 400 });
		}

		if (participantLimit && (participantLimit < 1 || participantLimit > 50)) {
			return json({ error: 'Participant limit must be between 1 and 50' }, { status: 400 });
		}

		// Создаем комнату с первой заметкой в транзакции
		const result = await prisma.$transaction(async (tx) => {
			// Создаем комнату
			const room = await tx.room.create({
				data: {
					title: title.trim(),
					description: description?.trim() || null,
					isPublic: isPublic ?? false,
					coverImageUrl: coverImageUrl || null,
					participantLimit: participantLimit || 10,
					createdBy: user.id
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

			// Добавляем создателя как участника с ролью "creator"
			await tx.$executeRaw`
				INSERT INTO RoomParticipant (id, roomId, userId, role, isOnline, joinedAt, lastSeen)
				VALUES (${crypto.randomUUID()}, ${room.id}, ${user.id}, 'creator', true, datetime('now'), datetime('now'))
			`;

			// Создаем первую заметку автоматически
			await tx.note.create({
				data: {
					roomId: room.id,
					title: 'Добро пожаловать!',
					content: 'Это ваша первая заметка в этой комнате. Начните писать здесь!',
					createdBy: user.id
				}
			});

			return room;
		});

		const room = result;

		return json({ room }, { status: 201 });
	} catch (error) {
		console.error('Error creating room:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
