// Безопасность для системы приглашений
import { prisma } from '$lib/prisma';
import { supabase } from '$lib/supabase';

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

// Проверка прав пользователя на управление приглашениями
export async function canManageInvites(userId: string, roomId: string): Promise<SecurityCheck> {
	try {
		// Проверяем, является ли пользователь создателем комнаты
		const room = await prisma.room.findFirst({
			where: {
				id: roomId,
				createdBy: userId
			}
		});

		if (!room) {
			return {
				isValid: false,
				error: 'Room not found or access denied'
			};
		}

		return {
			isValid: true,
			room
		};
	} catch (error) {
		console.error('Error checking invite management permissions:', error);
		return {
			isValid: false,
			error: 'Internal server error'
		};
	}
}

// Проверка прав пользователя на принятие приглашения
export async function canAcceptInvite(userId: string, roomId: string): Promise<SecurityCheck> {
	try {
		// Проверяем, не является ли пользователь уже участником
		const existingParticipant = await prisma.roomParticipant.findFirst({
			where: {
				roomId,
				userId
			}
		});

		if (existingParticipant) {
			return {
				isValid: false,
				error: 'User is already a participant'
			};
		}

		// Проверяем лимит участников
		const room = await prisma.room.findFirst({
			where: { id: roomId },
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
				error: 'Room not found'
			};
		}

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
		console.error('Error checking invite acceptance permissions:', error);
		return {
			isValid: false,
			error: 'Internal server error'
		};
	}
}

// Проверка аутентификации пользователя через Supabase токен
export async function validateUserAuth(sessionToken: string): Promise<SecurityCheck> {
	try {
		if (!sessionToken) {
			return {
				isValid: false,
				error: 'Session token is required'
			};
		}

		// Проверяем токен через Supabase
		const { data: { user }, error: authError } = await supabase.auth.getUser(sessionToken);
		
		if (authError || !user) {
			console.log('Supabase auth validation failed:', authError?.message);
			return {
				isValid: false,
				error: authError?.message || 'Invalid or expired session'
			};
		}

		// Получаем данные пользователя из нашей БД
		const dbUser = await prisma.user.findUnique({
			where: { id: user.id },
			select: {
				id: true,
				email: true,
				fullName: true,
				username: true,
				avatarUrl: true,
				createdAt: true
			}
		});

		if (!dbUser) {
			console.log('User not found in database:', user.id);
			return {
				isValid: false,
				error: 'User not found'
			};
		}

		console.log('User authenticated successfully:', dbUser.username);

		return {
			isValid: true,
			user: dbUser
		};
	} catch (error) {
		console.error('Error validating user auth:', error);
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
	userId: string,
	roomId: string,
	inviteToken?: string
): Promise<SecurityCheck> {
	try {
		// Общая проверка аутентификации - userId уже проверен в вызывающем коде
		// Здесь мы просто проверяем, что userId не пустой
		if (!userId) {
			return {
				isValid: false,
				error: 'User ID is required'
			};
		}

		switch (operation) {
			case 'create':
				return await canCreateInvite(userId, roomId);
			
			case 'accept':
				if (!inviteToken) {
					return { isValid: false, error: 'Invite token is required' };
				}
				const inviteCheck = await validateInviteToken(inviteToken);
				if (!inviteCheck.isValid) {
					return inviteCheck;
				}
				return await canAcceptInvite(userId, roomId);
			
			case 'decline':
				if (!inviteToken) {
					return { isValid: false, error: 'Invite token is required' };
				}
				return await validateInviteToken(inviteToken);
			
			case 'manage':
				return await canManageInvites(userId, roomId);
			
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
