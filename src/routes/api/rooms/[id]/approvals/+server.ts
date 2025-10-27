// API endpoint для получения списка ожидающих заявок
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { supabase } from '$lib/supabase-server';
import type { RequestHandler } from './$types';

// Получение всех заявок ожидающих одобрения (только для владельца)
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

		// Получаем все заявки ожидающие одобрения
		const pendingApprovals = await prisma.roomInvite.findMany({
			where: {
				roomId,
				status: 'pending_approval'
			},
			include: {
				requester: {
					select: {
						id: true,
						username: true,
						fullName: true,
						avatarUrl: true,
						email: true
					}
				},
				inviter: {
					select: {
						id: true,
						username: true,
						fullName: true,
						avatarUrl: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		return json({ approvals: pendingApprovals });

	} catch (error) {
		console.error('Error getting pending approvals:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

