import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { supabase } from '$lib/supabase';
import type { RequestHandler } from './$types';

// GET /api/users/[id] - получить пользователя по ID
export const GET: RequestHandler = async ({ params, request }) => {
	try {
		const userId = params.id;

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Получаем пользователя из БД
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				fullName: true,
				username: true,
				avatarUrl: true,
				createdAt: true
			}
		});

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json({ user });
	} catch (error) {
		console.error('Error fetching user:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

