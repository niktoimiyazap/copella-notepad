import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateUserOnlineStatus } from '$lib/permissions';
import { supabase } from '$lib/supabase';

// Функция для получения текущего пользователя из токена
async function getCurrentUserFromToken(request: Request) {
	try {
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return { user: null, error: 'Токен авторизации не найден' };
		}

		const token = authHeader.substring(7);
		const { data: { user }, error: authError } = await supabase.auth.getUser(token);

		if (authError || !user) {
			return { user: null, error: authError?.message || 'Пользователь не аутентифицирован' };
		}

		return { 
			user: {
				id: user.id,
				email: user.email,
				full_name: user.user_metadata?.full_name || 'Пользователь',
				username: user.user_metadata?.username || `user_${user.id.slice(0, 8)}`,
				avatar_url: user.user_metadata?.avatar_url || null
			}, 
			error: null 
		};
	} catch (error) {
		console.error('Get current user error:', error);
		return { user: null, error: 'Неожиданная ошибка при получении пользователя' };
	}
}

// PATCH /api/rooms/[id]/online-status - обновить онлайн статус пользователя
export const PATCH: RequestHandler = async ({ params, request }) => {
	try {
		const roomId = params.id;
		
		if (!roomId || typeof roomId !== 'string' || roomId.length !== 25) {
			return json({ error: 'Invalid room ID' }, { status: 400 });
		}

		const { user, error: authError } = await getCurrentUserFromToken(request);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const body = await request.json();
		const { isOnline } = body;

		if (typeof isOnline !== 'boolean') {
			return json({ error: 'isOnline must be a boolean' }, { status: 400 });
		}

		// Обновляем статус онлайн
		const result = await updateUserOnlineStatus(user.id, roomId, isOnline);

		if (result.error) {
			return json({ error: result.error }, { status: 500 });
		}

		// Отправляем WebSocket уведомление другим участникам
		try {
			const WS_SERVER_URL = process.env.WS_SERVER_URL || 'http://localhost:3001';
			const response = await fetch(`${WS_SERVER_URL}/broadcast`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: 'participant:update',
					roomId,
					data: {
						userId: user.id,
						isOnline,
						username: user.username
					},
					timestamp: Date.now()
				})
			});
		} catch (error) {
			// Error broadcasting notification
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error updating online status:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

