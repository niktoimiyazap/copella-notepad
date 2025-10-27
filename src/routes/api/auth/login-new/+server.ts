import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase-server';
import { prisma } from '$lib/prisma';
import { createUserSession } from '$lib/session-new';
import type { RequestHandler } from './$types';

// POST /api/auth/login-new - вход с iron-session
export const POST: RequestHandler = async (event) => {
	try {
		const { email, password } = await event.request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		// 1. Проверяем credentials через Supabase Auth
		const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (authError || !authData.user) {
			return json({ error: authError?.message || 'Invalid credentials' }, { status: 401 });
		}

		console.log('Supabase auth successful for:', email);

		// 2. Проверяем/создаем пользователя в локальной БД
		let dbUser = await prisma.user.findUnique({
			where: { id: authData.user.id }
		});

		if (!dbUser) {
			// Создаем пользователя если его нет
			dbUser = await prisma.user.create({
				data: {
					id: authData.user.id,
					email: authData.user.email || '',
					fullName: authData.user.user_metadata?.full_name || email.split('@')[0],
					username: authData.user.user_metadata?.username || email.split('@')[0],
					avatarUrl: authData.user.user_metadata?.avatar_url
				}
			});
		}

		// 3. Создаем сессию в cookie
		console.log('[Login] Creating session for user:', dbUser.id);
		try {
			const sessionResult = await createUserSession(event, dbUser.id);

			if (sessionResult.error) {
				console.error('[Login] Session creation failed:', sessionResult.error);
				// Временный workaround - возвращаем успех даже если сессия не создана
				// Пользователь будет использовать Supabase токен
				console.warn('[Login] Proceeding without session cookie (using Supabase token only)');
			} else {
				console.log('[Login] Session created successfully');
			}
		} catch (sessionError) {
			console.error('[Login] Session creation threw error:', sessionError);
			console.warn('[Login] Proceeding without session cookie (using Supabase token only)');
		}

		return json({
			user: {
				id: dbUser.id,
				email: dbUser.email,
				username: dbUser.username,
				fullName: dbUser.fullName,
				avatarUrl: dbUser.avatarUrl
			},
			session: authData.session // Возвращаем Supabase сессию
		});
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

