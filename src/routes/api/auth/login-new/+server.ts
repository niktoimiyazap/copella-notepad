import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';
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

		// 2. Используем данные из Supabase напрямую (без Prisma для Vercel Serverless)
		const user = {
			id: authData.user.id,
			email: authData.user.email || email,
			username: authData.user.user_metadata?.username || email.split('@')[0],
			fullName: authData.user.user_metadata?.full_name || email.split('@')[0],
			avatarUrl: authData.user.user_metadata?.avatar_url
		};

		// 3. Пытаемся создать сессию в cookie (но не фейлим если не получится)
		console.log('[Login] Attempting to create session for user:', user.id);
		try {
			await createUserSession(event, user.id);
			console.log('[Login] Session created successfully');
		} catch (sessionError) {
			console.warn('[Login] Session creation failed, continuing with Supabase token only:', sessionError);
		}

		return json({
			user,
			session: authData.session // Возвращаем Supabase сессию
		});
	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

