// Безопасность для системы приглашений с iron-session
import { prisma } from '$lib/prisma';
import { getUserFromSession } from '$lib/session-new';
import type { RequestEvent } from '@sveltejs/kit';

// Интерфейс для проверки безопасности
interface SecurityCheck {
	isValid: boolean;
	error?: string;
	user?: any;
	room?: any;
	invite?: any;
}

// Проверка токена приглашения
export async function validateInviteToken(inviteToken: string): Promise<SecurityCheck> {
	try {
		// Проверяем формат токена (должен быть hex строкой длиной 64 символа)
		if (!/^[a-f0-9]{64}$/.test(inviteToken)) {
			return {
				isValid: false,
				error: 'Invalid invite token format'
			};
		}

		// Ищем приглашение в базе данных
		const invite = await prisma.roomInvite.findFirst({
			where: {
				inviteToken,
				status: 'pending',
				expiresAt: {
					gt: new Date()
				}
			},
			include: {
				room: {
					include: {
						creator: true,
						_count: {
							select: {
								participants: true
							}
						}
					}
				},
				inviter: true
			}
		});

		if (!invite) {
			return {
				isValid: false,
				error: 'Invite not found or expired'
			};
		}

		return {
			isValid: true,
			invite,
			room: invite.room
		};
	} catch (error) {
		console.error('Error validating invite token:', error);
		return {
			isValid: false,
			error: 'Internal server error'
		};
	}
}

// Проверка аутентификации пользователя через сессию
export async function validateUserAuth(event: RequestEvent): Promise<SecurityCheck> {
	try {
		const { user, error } = await getUserFromSession(event);
		
		if (error || !user) {
			return {
				isValid: false,
				error: error || 'Invalid or expired session'
			};
		}

		console.log('User authenticated successfully:', user.username);

		return {
			isValid: true,
			user
		};
	} catch (error) {
		console.error('Error validating user auth:', error);
		return {
			isValid: false,
			error: 'Internal server error'
		};
	}
}

// Проверка прав пользователя на создание приглашений
export async function canCreateInvite(userId: string, roomId: string): Promise<SecurityCheck> {
	try {
		// Проверяем, является ли пользователь создателем комнаты
		const room = await prisma.room.findFirst({
			where: {
				id: roomId,
				createdBy: userId
			},
			include: {
				_count: {
					select: {
						participants: true
					}
				}
			}
		});

		if (!room) {
			return {
				isValid: false,
				error: 'Room not found or access denied'
			};
		}

		// Проверяем, не превышен ли лимит участников
		if (room._count.participants >= room.participantLimit) {
			return {
				isValid: false,
				error: 'Room is full'
			};
		}

		return {
			isValid: true,
			room
		};
	} catch (error) {
		console.error('Error checking invite creation permissions:', error);
		return {
			isValid: false,
			error: 'Internal server error'
		};
	}
}

// Rate limiting для создания приглашений
const inviteCreationLimits = new Map<string, { count: number; resetTime: number }>();

export function checkInviteCreationRateLimit(userId: string): SecurityCheck {
	const now = Date.now();
	const userLimit = inviteCreationLimits.get(userId);

	// Очищаем старые записи
	if (userLimit && now > userLimit.resetTime) {
		inviteCreationLimits.delete(userId);
	}

	// Проверяем лимит (максимум 10 приглашений в час)
	const limit = userLimit || { count: 0, resetTime: now + 3600000 }; // 1 час

	if (limit.count >= 10) {
		return {
			isValid: false,
			error: 'Rate limit exceeded. Maximum 10 invites per hour.'
		};
	}

	// Увеличиваем счетчик
	limit.count++;
	inviteCreationLimits.set(userId, limit);

	return {
		isValid: true
	};
}

// Очистка истекших приглашений
export async function cleanupExpiredInvites(): Promise<void> {
	try {
		await prisma.roomInvite.updateMany({
			where: {
				expiresAt: {
					lt: new Date()
				},
				status: 'pending'
			},
			data: {
				status: 'expired'
			}
		});
	} catch (error) {
		console.error('Error cleaning up expired invites:', error);
	}
}

// Проверка безопасности для всех операций с приглашениями
export async function performSecurityCheck(
	operation: 'create' | 'accept' | 'decline' | 'manage',
	event: RequestEvent,
	roomId: string,
	inviteToken?: string
): Promise<SecurityCheck> {
	try {
		// Проверяем аутентификацию
		const authResult = await validateUserAuth(event);
		if (!authResult.isValid || !authResult.user) {
			return authResult;
		}

		const userId = authResult.user.id;

		switch (operation) {
			case 'create':
				return await canCreateInvite(userId, roomId);
			
			case 'accept':
				if (!inviteToken) {
					return { isValid: false, error: 'Invite token is required' };
				}
				return await validateInviteToken(inviteToken);
			
			case 'decline':
				if (!inviteToken) {
					return { isValid: false, error: 'Invite token is required' };
				}
				return await validateInviteToken(inviteToken);
			
			case 'manage':
				// Проверяем, является ли пользователь создателем комнаты
				const room = await prisma.room.findFirst({
					where: {
						id: roomId,
						createdBy: userId
					}
				});
				if (!room) {
					return { isValid: false, error: 'Room not found or access denied' };
				}
				return { isValid: true, room };
			
			default:
				return { isValid: false, error: 'Invalid operation' };
		}
	} catch (error) {
		console.error('Error performing security check:', error);
		return {
			isValid: false,
			error: 'Internal server error'
		};
	}
}

