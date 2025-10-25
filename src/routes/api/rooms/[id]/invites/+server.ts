import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { randomBytes } from 'crypto';
import { performSecurityCheck, checkInviteCreationRateLimit, validateUserAuth } from '$lib/security/inviteSecurity';
import { notifyInviteCreated, notifyApprovalRequest, notifyInviteAccepted, notifyParticipantUpdate } from '$lib/websocket-notify';
import type { RequestHandler } from './$types';

// Создание приглашения в комнату
export const POST: RequestHandler = async ({ request, params, url }) => {
	try {
		const roomId = params.id;
		if (!roomId) {
			return json({ error: 'Room ID is required' }, { status: 400 });
		}

		// Получаем токен сессии
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionToken = authHeader.substring(7);
		const authResult = await validateUserAuth(sessionToken);
		
		if (!authResult.isValid || !authResult.user) {
			return json({ error: authResult.error || 'Invalid session' }, { status: 401 });
		}

		const user = authResult.user;

		// Проверяем rate limiting
		const rateLimitCheck = checkInviteCreationRateLimit(user.id);
		if (!rateLimitCheck.isValid) {
			return json({ error: rateLimitCheck.error }, { status: 429 });
		}

		// Проверяем права на создание приглашения
		const securityCheck = await performSecurityCheck('create', user.id, roomId);
		if (!securityCheck.isValid) {
			return json({ error: securityCheck.error }, { status: 403 });
		}

		// Генерируем уникальный токен приглашения
		const inviteToken = randomBytes(32).toString('hex');
		
		// Создаем приглашение (действительно 7 дней)
		const expiresAt = new Date();
		expiresAt.setDate(expiresAt.getDate() + 7);

		const invite = await prisma.roomInvite.create({
			data: {
				roomId,
				invitedBy: user.id,
				inviteToken,
				expiresAt
			},
			include: {
				room: {
					select: {
						id: true,
						title: true,
						description: true,
						coverImageUrl: true,
						participantLimit: true,
						creator: {
							select: {
								id: true,
								username: true,
								fullName: true,
								avatarUrl: true
							}
						}
					}
				}
			}
		});

		// Отправляем уведомление через WebSocket
		await notifyInviteCreated(roomId, invite);

		// Возвращаем информацию о приглашении
		return json({
			invite: {
				id: invite.id,
				inviteToken: invite.inviteToken,
				expiresAt: invite.expiresAt,
				room: invite.room
			}
		});

	} catch (error) {
		console.error('Error creating room invite:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// Получение информации о приглашении по токену
export const GET: RequestHandler = async ({ request, params, url }) => {
	try {
		const roomId = params.id;
		const inviteToken = url.searchParams.get('token');

		if (!roomId || !inviteToken) {
			return json({ error: 'Room ID and invite token are required' }, { status: 400 });
		}

		// Находим приглашение
		const invite = await prisma.roomInvite.findFirst({
			where: {
				roomId,
				inviteToken,
				status: 'pending',
				expiresAt: {
					gt: new Date() // Проверяем, что приглашение не истекло
				}
			},
			include: {
				room: {
					select: {
						id: true,
						title: true,
						description: true,
						coverImageUrl: true,
						participantLimit: true,
						requireApproval: true,
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
								participants: true
							}
						}
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
			}
		});

		if (!invite) {
			return json({ error: 'Invite not found or expired' }, { status: 404 });
		}

		// Возвращаем информацию о приглашении (без чувствительных данных)
		return json({
			invite: {
				id: invite.id,
				room: invite.room,
				inviter: invite.inviter,
				expiresAt: invite.expiresAt
			}
		});

	} catch (error) {
		console.error('Error getting room invite:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// Принятие приглашения
export const PUT: RequestHandler = async ({ request, params, url }) => {
	try {
		const roomId = params.id;
		const inviteToken = url.searchParams.get('token');

		if (!roomId || !inviteToken) {
			return json({ error: 'Room ID and invite token are required' }, { status: 400 });
		}

		// Получаем токен сессии
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionToken = authHeader.substring(7);
		const authResult = await validateUserAuth(sessionToken);
		
		if (!authResult.isValid || !authResult.user) {
			return json({ error: authResult.error || 'Invalid session' }, { status: 401 });
		}

		const user = authResult.user;

		// Находим приглашение
		const invite = await prisma.roomInvite.findFirst({
			where: {
				roomId,
				inviteToken,
				status: 'pending',
				expiresAt: {
					gt: new Date()
				}
			},
			include: {
				room: {
					include: {
						_count: {
							select: {
								participants: true
							}
						}
					}
				}
			}
		});

		if (!invite) {
			return json({ error: 'Invite not found or expired' }, { status: 404 });
		}

		// Проверяем, не является ли пользователь уже участником
		const existingParticipant = await prisma.roomParticipant.findFirst({
			where: {
				roomId,
				userId: user.id
			}
		});

		if (existingParticipant) {
			return json({ error: 'User is already a participant' }, { status: 400 });
		}

		// Проверяем лимит участников
		if (invite.room._count.participants >= invite.room.participantLimit) {
			return json({ error: 'Room is full' }, { status: 400 });
		}

		// Если требуется одобрение, создаем заявку
		if (invite.room.requireApproval) {
			// Обновляем статус приглашения на "ожидает одобрения" и сохраняем ID заявителя
			const updatedInvite = await prisma.roomInvite.update({
				where: { id: invite.id },
				data: { 
					status: 'pending_approval',
					requestedBy: user.id
				},
				include: {
					room: {
						select: {
							id: true,
							title: true,
							description: true,
							coverImageUrl: true,
							createdBy: true
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
				}
			});

		// Отправляем уведомление владельцу комнаты через WebSocket
		await notifyApprovalRequest(roomId, updatedInvite);

			return json({
				message: 'Application submitted for approval',
				requiresApproval: true
			});
		}

	// Если одобрение не требуется, добавляем пользователя в комнату
	await prisma.$transaction(async (tx) => {
		// Добавляем участника (проверка на дубликат уже выполнена выше)
		await tx.roomParticipant.create({
			data: {
				roomId,
				userId: user.id,
				role: 'participant'
			}
		});

		// Обновляем статус приглашения
		await tx.roomInvite.update({
			where: { id: invite.id },
			data: { status: 'accepted' }
		});
	});

		// Отправляем уведомления через WebSocket
		await notifyInviteAccepted(roomId, invite, user.id);
		await notifyParticipantUpdate(roomId, { userId: user.id, roomId }, 'joined');

		return json({
			message: 'Successfully joined the room',
			requiresApproval: false
		});

	} catch (error) {
		console.error('Error accepting room invite:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// Отклонение приглашения
export const DELETE: RequestHandler = async ({ request, params, url }) => {
	try {
		const roomId = params.id;
		const inviteToken = url.searchParams.get('token');

		if (!roomId || !inviteToken) {
			return json({ error: 'Room ID and invite token are required' }, { status: 400 });
		}

		// Получаем токен сессии
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const sessionToken = authHeader.substring(7);
		const authResult = await validateUserAuth(sessionToken);
		
		if (!authResult.isValid || !authResult.user) {
			return json({ error: authResult.error || 'Invalid session' }, { status: 401 });
		}

		const user = authResult.user;

		// Находим приглашение
		const invite = await prisma.roomInvite.findFirst({
			where: {
				roomId,
				inviteToken,
				status: 'pending'
			}
		});

		if (!invite) {
			return json({ error: 'Invite not found' }, { status: 404 });
		}

		// Обновляем статус приглашения
		await prisma.roomInvite.update({
			where: { id: invite.id },
			data: { status: 'declined' }
		});

		return json({ message: 'Invite declined' });

	} catch (error) {
		console.error('Error declining room invite:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
