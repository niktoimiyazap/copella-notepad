import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { supabase } from '$lib/supabase-server';
import type { RequestHandler } from './$types';

// Получение информации о приглашении по токену
export const GET: RequestHandler = async ({ request, url }) => {
	try {
		const inviteToken = url.searchParams.get('token');

		if (!inviteToken) {
			return json({ error: 'Invite token is required' }, { status: 400 });
		}

		// Находим приглашение
		const invite = await prisma.roomInvite.findFirst({
			where: {
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
		console.error('Error getting invite info:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
