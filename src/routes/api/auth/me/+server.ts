import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
import { prisma } from '$lib/prisma';
import type { RequestHandler } from './$types';

// GET /api/auth/me - получить текущего пользователя
export const GET: RequestHandler = async ({ request }) => {
	try {
		console.log('[API /auth/me] Checking auth...');
		
		// Получаем токен из Authorization header
		const authHeader = request.headers.get('Authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			console.log('[API /auth/me] No auth header');
			return json({ error: 'No authorization token' }, { status: 401 });
		}

		const token = authHeader.substring(7); // Убираем "Bearer "
		
		// Проверяем токен через Supabase
		const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(token);
		
		if (authError || !supabaseUser) {
			console.error('[API /auth/me] Invalid token:', authError);
			return json({ error: 'Invalid token' }, { status: 401 });
		}

		console.log('[API /auth/me] Supabase user:', supabaseUser.email);

		// Получаем полный профиль из нашей БД
		const user = await prisma.user.findUnique({
			where: { id: supabaseUser.id },
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
			console.log('[API /auth/me] User not found in DB, returning Supabase data');
			// Возвращаем данные из Supabase, если нет в БД
			return json({
				user: {
					id: supabaseUser.id,
					email: supabaseUser.email,
					fullName: supabaseUser.user_metadata?.full_name || 'User',
					username: supabaseUser.user_metadata?.username || 'user',
					avatarUrl: supabaseUser.user_metadata?.avatar_url
				}
			});
		}

		console.log('[API /auth/me] User found:', user.email);
		return json({ user });
	} catch (error) {
		console.error('[API /auth/me] Error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

