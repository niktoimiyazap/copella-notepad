import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/prisma';
import { getCurrentUserFromToken } from '$lib/utils/userManagement';

// PATCH /api/rooms/[id]/permissions - обновить разрешения комнаты
export const PATCH: RequestHandler = async ({ params, request, cookies }) => {
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
		const { 
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

		// Подготавливаем данные для обновления
		const updateData: any = {
			updatedAt: new Date()
		};

		if (allowEdit !== undefined) updateData.allowEdit = allowEdit;
		if (allowInvite !== undefined) updateData.allowInvite = allowInvite;
		if (allowDelete !== undefined) updateData.allowDelete = allowDelete;
		if (requireApproval !== undefined) updateData.requireApproval = requireApproval;

		// Обновляем комнату
		const updatedRoom = await prisma.room.update({
			where: { id: roomId },
			data: updateData,
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
		console.error('Error updating room permissions:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
