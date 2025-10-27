import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

// Получение всех приглашений для комнаты (только для владельца)
export const GET: RequestHandler = async ({ request, params }) => {
	try {
		const roomId = params.id;
		if (!roomId) {
			return json({ error: 'Room ID is required' }, { status: 400 });
		}

		// Получаем токен авторизации
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		const { data: { user }, error: authError } = await supabase.auth.getUser(token);
		
		if (authError || !user) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		// Проверяем доступ: владелец, админ или участник с правом приглашения
		const room = await prisma.room.findUnique({
			where: { id: roomId },
			include: {
				participants: {
					where: {
						userId: user.id
					}
				}
			}
		});

		if (!room) {
			return json({ error: 'Room not found' }, { status: 404 });
		}

		// Проверяем права доступа
		const isOwner = room.createdBy === user.id;
		const participant = room.participants[0];
		const isAdmin = participant?.role === 'admin' || participant?.role === 'creator';
		const canManageInvites = participant?.canInvite === true || isAdmin;

		// Доступ имеют: владелец, админы, или пользователи с правом приглашения
		if (!isOwner && !isAdmin && !canManageInvites) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Получаем все приглашения для комнаты
		const invites = await prisma.roomInvite.findMany({
			where: { roomId },
			include: {
				inviter: {
					select: {
						id: true,
						username: true,
						fullName: true,
						avatarUrl: true
					}
				},
				requester: {
					select: {
						id: true,
						username: true,
						fullName: true,
						avatarUrl: true,
						email: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		return json({ invites });

	} catch (error) {
		console.error('Error getting room invites:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// Одобрение заявки на вступление
export const POST: RequestHandler = async ({ request, params }) => {
	try {
		const roomId = params.id;
		if (!roomId) {
			return json({ error: 'Room ID is required' }, { status: 400 });
		}

		// Получаем токен авторизации
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		const { data: { user }, error: authError } = await supabase.auth.getUser(token);
		
		if (authError || !user) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		// Проверяем доступ: владелец, админ или участник с правом приглашения
		const room = await prisma.room.findUnique({
			where: { id: roomId },
			include: {
				_count: {
					select: {
						participants: true
					}
				},
				participants: {
					where: {
						userId: user.id
					}
				}
			}
		});

		if (!room) {
			return json({ error: 'Room not found' }, { status: 404 });
		}

		// Проверяем права доступа
		const isOwner = room.createdBy === user.id;
		const participant = room.participants[0];
		const isAdmin = participant?.role === 'admin' || participant?.role === 'creator';
		const canManageInvites = participant?.canInvite === true || isAdmin;

		// Доступ имеют: владелец, админы, или пользователи с правом приглашения
		if (!isOwner && !isAdmin && !canManageInvites) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		const { inviteId, action } = await request.json();

		if (!inviteId || !action) {
			return json({ error: 'Invite ID and action are required' }, { status: 400 });
		}

		// Находим приглашение
		const invite = await prisma.roomInvite.findFirst({
			where: {
				id: inviteId,
				roomId,
				status: 'pending_approval'
			}
		});

		if (!invite) {
			return json({ error: 'Invite not found or not pending approval' }, { status: 404 });
		}

		if (action === 'approve') {
			// Проверяем лимит участников
			if (room._count.participants >= room.participantLimit) {
				return json({ error: 'Room is full' }, { status: 400 });
			}

		// Используем requestedBy вместо invitedBy для заявок
		const userIdToAdd = invite.requestedBy || invite.invitedBy;

		// Проверяем, что пользователь еще не является участником
		const existingParticipant = await prisma.roomParticipant.findFirst({
			where: {
				roomId,
				userId: userIdToAdd
			}
		});

		if (existingParticipant) {
			// Пользователь уже участник - просто обновляем статус приглашения
			await prisma.roomInvite.update({
				where: { id: invite.id },
				data: { status: 'accepted' }
			});
			return json({ message: 'User is already a participant' });
		}

		// Одобряем заявку
		await prisma.$transaction(async (tx) => {
			// Добавляем участника
			await tx.roomParticipant.create({
				data: {
					roomId,
					userId: userIdToAdd,
					role: 'participant'
				}
			});

			// Обновляем статус приглашения
			await tx.roomInvite.update({
				where: { id: invite.id },
				data: { status: 'accepted' }
			});
		});

		// Yjs автоматически синхронизирует изменения

			return json({ message: 'Application approved' });
		} else if (action === 'reject') {
			// Отклоняем заявку
			await prisma.roomInvite.update({
				where: { id: invite.id },
				data: { status: 'declined' }
			});

		// Yjs автоматически синхронизирует изменения

			return json({ message: 'Application rejected' });
		} else {
			return json({ error: 'Invalid action' }, { status: 400 });
		}

	} catch (error) {
		console.error('Error managing room invite:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// Отзыв приглашения
export const DELETE: RequestHandler = async ({ request, params }) => {
	try {
		const roomId = params.id;
		if (!roomId) {
			return json({ error: 'Room ID is required' }, { status: 400 });
		}

		// Получаем токен авторизации
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const token = authHeader.substring(7);
		const { data: { user }, error: authError } = await supabase.auth.getUser(token);
		
		if (authError || !user) {
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		// Проверяем доступ: владелец, админ или участник с правом приглашения
		const room = await prisma.room.findUnique({
			where: { id: roomId },
			include: {
				participants: {
					where: {
						userId: user.id
					}
				}
			}
		});

		if (!room) {
			return json({ error: 'Room not found' }, { status: 404 });
		}

		// Проверяем права доступа
		const isOwner = room.createdBy === user.id;
		const participant = room.participants[0];
		const isAdmin = participant?.role === 'admin' || participant?.role === 'creator';
		const canManageInvites = participant?.canInvite === true || isAdmin;

		// Доступ имеют: владелец, админы, или пользователи с правом приглашения
		if (!isOwner && !isAdmin && !canManageInvites) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		const { inviteId } = await request.json();

		if (!inviteId) {
			return json({ error: 'Invite ID is required' }, { status: 400 });
		}

		// Находим приглашение
		const invite = await prisma.roomInvite.findFirst({
			where: {
				id: inviteId,
				roomId
			}
		});

		if (!invite) {
			return json({ error: 'Invite not found' }, { status: 404 });
		}

		// Удаляем приглашение
		await prisma.roomInvite.delete({
			where: { id: invite.id }
		});

		// Yjs автоматически синхронизирует изменения

		return json({ message: 'Invite revoked' });

	} catch (error) {
		console.error('Error revoking room invite:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
