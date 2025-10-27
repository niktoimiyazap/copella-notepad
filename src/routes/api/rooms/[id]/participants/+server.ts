import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import { supabase } from '$lib/supabase';

// Функция для получения текущего пользователя из токена
async function getCurrentUserFromToken(request: Request) {
	try {
		// Получаем токен из заголовков
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return { user: null, error: 'Токен авторизации не найден' };
		}

		const token = authHeader.substring(7);

		// Получаем пользователя из Supabase Auth
		const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

		if (authError || !authUser) {
			return { user: null, error: authError?.message || 'Пользователь не аутентифицирован' };
		}

		// Получаем данные пользователя из нашей базы данных
		let userData = await prisma.user.findUnique({
			where: { id: authUser.id }
		});

		// Если пользователь не найден в локальной БД, создаем его автоматически
		if (!userData) {
			try {
				userData = await prisma.user.create({
					data: {
						id: authUser.id,
						email: authUser.email || '',
						fullName: authUser.user_metadata?.full_name || 'Пользователь',
						username: authUser.user_metadata?.username || `user_${authUser.id.slice(0, 8)}`,
						avatarUrl: authUser.user_metadata?.avatar_url || null
					}
				});
			} catch (createError) {
				console.error('Error creating user profile:', createError);
				return { user: null, error: 'Ошибка создания профиля пользователя' };
			}
		}

		return { 
			user: {
				id: userData.id,
				email: userData.email,
				full_name: userData.fullName,
				username: userData.username,
				avatar_url: userData.avatarUrl
			}, 
			error: null 
		};
	} catch (error) {
		console.error('Get current user error:', error);
		return { user: null, error: 'Неожиданная ошибка при получении пользователя' };
	}
}

// GET /api/rooms/[id]/participants - получить участников комнаты
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
		
		console.log('Fetching participants for room:', roomId);

	// Получаем текущего пользователя
	const { user, error: authError } = await getCurrentUserFromToken(request);
	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
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

		// Получаем участников из локальной базы данных
		const participants = await prisma.roomParticipant.findMany({
			where: {
				roomId
			},
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
		});

		return json({ participants });
	} catch (error) {
		console.error('Error fetching room participants:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PUT /api/rooms/[id]/participants - обновить роль участника
export const PUT: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const roomId = params.id;
		
		// Валидация ID комнаты
		if (!roomId || typeof roomId !== 'string' || roomId.length !== 25) {
			return json({ error: 'Invalid room ID' }, { status: 400 });
		}

	// Получаем текущего пользователя
	const { user, error: authError } = await getCurrentUserFromToken(request);
	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Парсим тело запроса
	const body = await request.json();
	const { userId, role } = body;

	if (!userId || !role) {
		return json({ error: 'Missing userId or role' }, { status: 400 });
	}

	// БЕЗОПАСНОСТЬ: Валидация допустимых ролей
	const VALID_ROLES = ['creator', 'owner', 'admin', 'moderator', 'user', 'participant'];
	if (!VALID_ROLES.includes(role)) {
		return json({ error: 'Invalid role' }, { status: 400 });
	}

	// Проверяем, что текущий пользователь имеет права на управление участниками
	const currentParticipant = await prisma.roomParticipant.findFirst({
		where: {
			roomId,
			userId: user.id
		}
	});

	if (!currentParticipant || !['creator', 'owner', 'admin'].includes(currentParticipant.role)) {
		return json({ error: 'Insufficient permissions' }, { status: 403 });
	}

	// Проверяем, что целевой участник существует в комнате
	const targetParticipant = await prisma.roomParticipant.findFirst({
		where: {
			roomId,
			userId
		}
	});

	if (!targetParticipant) {
		return json({ error: 'User is not a participant of this room' }, { status: 404 });
	}

	// БЕЗОПАСНОСТЬ: Запрещаем изменять роль creator
	if (targetParticipant.role === 'creator') {
		return json({ error: 'Cannot change creator role' }, { status: 403 });
	}

	// БЕЗОПАСНОСТЬ: Проверяем иерархию ролей
	// Только creator может назначать owner
	if (role === 'owner' && currentParticipant.role !== 'creator') {
		return json({ error: 'Only creator can assign owner role' }, { status: 403 });
	}

	// Admin не может назначать admin или owner
	if (currentParticipant.role === 'admin' && ['admin', 'owner'].includes(role)) {
		return json({ error: 'Admins cannot assign admin or owner roles' }, { status: 403 });
	}

	// БЕЗОПАСНОСТЬ: Нельзя изменить свою собственную роль
	if (userId === user.id) {
		return json({ error: 'Cannot change your own role' }, { status: 403 });
	}

	// Обновляем роль участника
	const updatedParticipant = await prisma.roomParticipant.update({
		where: {
			id: targetParticipant.id
		},
		data: {
			role
		},
			include: {
				user: {
					select: {
						id: true,
						username: true,
						fullName: true,
						avatarUrl: true
					}
				}
			}
		});

		return json({ participant: updatedParticipant });
	} catch (error) {
		console.error('Error updating participant role:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// PATCH /api/rooms/[id]/participants - обновить права участника
export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const roomId = params.id;
		
		// Валидация ID комнаты
		if (!roomId || typeof roomId !== 'string' || roomId.length !== 25) {
			return json({ error: 'Invalid room ID' }, { status: 400 });
		}

	// Получаем текущего пользователя
	const { user, error: authError } = await getCurrentUserFromToken(request);
	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Парсим тело запроса
	const body = await request.json();
	const { userId, permissions } = body;

	if (!userId || !permissions) {
		return json({ error: 'Missing userId or permissions' }, { status: 400 });
	}

	// БЕЗОПАСНОСТЬ: Нельзя изменить свои собственные права
	if (userId === user.id) {
		return json({ error: 'Cannot change your own permissions' }, { status: 403 });
	}

	// Проверяем, что текущий пользователь имеет права на управление участниками
	const currentParticipant = await prisma.roomParticipant.findFirst({
		where: {
			roomId,
			userId: user.id
		}
	});

	if (!currentParticipant || !['creator', 'owner', 'admin'].includes(currentParticipant.role)) {
		return json({ error: 'Insufficient permissions' }, { status: 403 });
	}

	// Проверяем, что целевой участник существует в комнате
	const targetParticipant = await prisma.roomParticipant.findFirst({
		where: {
			roomId,
			userId
		}
	});

	if (!targetParticipant) {
		return json({ error: 'User is not a participant of this room' }, { status: 404 });
	}

	// БЕЗОПАСНОСТЬ: Запрещаем изменять права creator, owner и admin
	if (['creator', 'owner', 'admin'].includes(targetParticipant.role)) {
		return json({ error: 'Cannot change permissions for creator, owner or admin' }, { status: 403 });
	}

		// Не меняем роль при обновлении прав - роль задаётся отдельно
		// Сохраняем текущую роль участника
		const currentRole = targetParticipant.role;

		// Обновляем индивидуальные права участника (без изменения роли)
		const updatedParticipant = await prisma.roomParticipant.update({
			where: {
				id: targetParticipant.id
			},
			data: {
				// Сохраняем индивидуальные права для модераторов и обычных пользователей
				// Для админов/владельцев права не сохраняются (определяются ролью)
				canEdit: (currentRole === 'moderator' || currentRole === 'user' || currentRole === 'participant') ? permissions.canEdit : null,
				canInvite: (currentRole === 'moderator' || currentRole === 'user' || currentRole === 'participant') ? permissions.canInvite : null,
				canDelete: (currentRole === 'moderator' || currentRole === 'user' || currentRole === 'participant') ? permissions.canDelete : null
			},
			include: {
				user: {
					select: {
						id: true,
						username: true,
						fullName: true,
						avatarUrl: true
					}
				}
			}
		});

		return json({ participant: updatedParticipant });
	} catch (error) {
		console.error('Error updating participant permissions:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/rooms/[id]/participants - удалить участника из комнаты
export const DELETE: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const roomId = params.id;
		
		// Валидация ID комнаты
		if (!roomId || typeof roomId !== 'string' || roomId.length !== 25) {
			return json({ error: 'Invalid room ID' }, { status: 400 });
		}

	// Получаем текущего пользователя
	const { user, error: authError } = await getCurrentUserFromToken(request);
	if (authError || !user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

		// Парсим тело запроса
		const body = await request.json();
		const { userId } = body;

		if (!userId) {
			return json({ error: 'Missing userId' }, { status: 400 });
		}

		// Получаем комнату
		const room = await prisma.room.findUnique({
			where: { id: roomId }
		});

		if (!room) {
			return json({ error: 'Room not found' }, { status: 404 });
		}

		// Проверяем, что текущий пользователь имеет права на управление участниками
		const isOwner = room.createdBy === user.id;
		const currentParticipant = await prisma.roomParticipant.findFirst({
			where: {
				roomId,
				userId: user.id
			}
		});

		const hasManageRights = isOwner || (currentParticipant && ['creator', 'owner', 'admin'].includes(currentParticipant.role));

		if (!hasManageRights) {
			return json({ error: 'Insufficient permissions' }, { status: 403 });
		}

	// Нельзя удалить владельца комнаты
	if (userId === room.createdBy) {
		return json({ error: 'Cannot remove room owner' }, { status: 400 });
	}

	// Проверяем, что целевой участник существует в комнате
	const targetParticipant = await prisma.roomParticipant.findFirst({
		where: {
			roomId,
			userId
		}
	});

	if (!targetParticipant) {
		return json({ error: 'User is not a participant of this room' }, { status: 404 });
	}

	// БЕЗОПАСНОСТЬ: Запрещаем удалять участника с ролью creator
	if (targetParticipant.role === 'creator') {
		return json({ error: 'Cannot remove room creator' }, { status: 403 });
	}

	// Удаляем участника и все его ожидающие приглашения/заявки в транзакции
	await prisma.$transaction(async (tx) => {
		// Удаляем участника
		await tx.roomParticipant.delete({
			where: {
				id: targetParticipant.id
			}
		});

		// Удаляем все ожидающие приглашения и заявки для этого пользователя в этой комнате
		await tx.roomInvite.deleteMany({
			where: {
				roomId,
				OR: [
					{ requestedBy: userId },
					{ invitedBy: userId }
				],
				status: {
					in: ['pending', 'pending_approval']
				}
			}
		});
	});

	// Отправляем WebSocket уведомление удаленному пользователю
	try {
		const WS_SERVER_URL = process.env.WS_SERVER_URL || 'http://localhost:3001';
		const response = await fetch(`${WS_SERVER_URL}/broadcast`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				type: 'participant:update',
				roomId,
				data: {
					userId,
					removed: true
				},
				timestamp: Date.now()
			})
		});
		
		if (!response.ok) {
			console.error('[Participant DELETE] Failed to send removal notification');
		}
	} catch (error) {
		console.error('[Participant DELETE] Error sending removal notification:', error);
	}

	return json({ success: true, message: 'Participant removed successfully' });
	} catch (error) {
		console.error('Error removing participant:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
