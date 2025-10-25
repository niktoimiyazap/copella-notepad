import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import { getCurrentUserFromToken } from '$lib/utils/userManagement';
import { notifyParticipantUpdate } from '$lib/websocket-notify';

// POST /api/rooms/[id]/transfer-ownership - передать права владельца другому пользователю
export const POST: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const roomId = params.id;

		// Валидация ID комнаты
		if (!roomId || typeof roomId !== 'string' || roomId.length !== 25) {
			return json({ error: 'Invalid room ID' }, { status: 400 });
		}

		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Парсим тело запроса
		const body = await request.json();
		const { newOwnerId } = body;

		if (!newOwnerId || typeof newOwnerId !== 'string') {
			return json({ error: 'New owner ID is required' }, { status: 400 });
		}

		// Проверяем, что текущий пользователь является владельцем комнаты
		const room = await prisma.room.findFirst({
			where: {
				id: roomId,
				createdBy: user.id
			},
			include: {
				participants: {
					where: {
						userId: {
							in: [user.id, newOwnerId]
						}
					}
				}
			}
		});

		if (!room) {
			return json({ error: 'Room not found or you are not the owner' }, { status: 404 });
		}

		// Проверяем, что новый владелец является участником комнаты
		const newOwnerParticipant = room.participants.find(p => p.userId === newOwnerId);
		if (!newOwnerParticipant) {
			return json({ error: 'New owner must be a participant of the room' }, { status: 400 });
		}

		// Нельзя передать права самому себе
		if (newOwnerId === user.id) {
			return json({ error: 'You are already the owner' }, { status: 400 });
		}

		// Выполняем передачу прав в транзакции
		await prisma.$transaction(async (tx) => {
			// 1. Обновляем владельца комнаты
			await tx.room.update({
				where: { id: roomId },
				data: { 
					createdBy: newOwnerId,
					updatedAt: new Date()
				}
			});

			// 2. Обновляем роль нового владельца на 'owner'
			await tx.roomParticipant.update({
				where: { id: newOwnerParticipant.id },
				data: {
					role: 'owner',
					canEdit: null,
					canInvite: null,
					canDelete: null
				}
			});

			// 3. Понижаем старого владельца до администратора
			const oldOwnerParticipant = room.participants.find(p => p.userId === user.id);
			if (oldOwnerParticipant) {
				await tx.roomParticipant.update({
					where: { id: oldOwnerParticipant.id },
					data: {
						role: 'admin',
						canEdit: null,
						canInvite: null,
						canDelete: null
					}
				});
			} else {
				// Если старого владельца нет в участниках, создаем его как админа
				await tx.roomParticipant.create({
					data: {
						roomId: roomId,
						userId: user.id,
						role: 'admin',
						canEdit: null,
						canInvite: null,
						canDelete: null
					}
				});
			}
		});

		// Отправляем WebSocket уведомление всем участникам комнаты об изменении ролей
		try {
			// Получаем обновленные данные участников для отправки через WebSocket
			const updatedParticipants = await prisma.roomParticipant.findMany({
				where: { roomId },
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

			// Уведомляем всех участников комнаты об обновлении
			await notifyParticipantUpdate(roomId, {
				action: 'ownership_transferred',
				oldOwnerId: user.id,
				newOwnerId,
				participants: updatedParticipants
			}, 'ownership_transferred');

			console.log(`[Transfer Ownership] WebSocket notification sent for room ${roomId}`);
		} catch (wsError) {
			console.error('[Transfer Ownership] Failed to send WebSocket notification:', wsError);
			// Не прерываем выполнение, если WebSocket не работает
		}

		return json({ 
			message: 'Ownership transferred successfully',
			newOwnerId 
		});

	} catch (error) {
		console.error('Error transferring room ownership:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

