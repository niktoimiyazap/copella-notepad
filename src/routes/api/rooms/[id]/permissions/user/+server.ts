import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCurrentUserFromToken } from '$lib/utils/userManagement';
import { getUserRoomPermissions as getLocalUserRoomPermissions } from '$lib/roomParticipants';

// GET /api/rooms/[id]/permissions/user - получить права текущего пользователя в комнате
export const GET: RequestHandler = async ({ params, request, cookies }) => {
	try {
		const roomId = params.id;

		// Валидация ID комнаты
		if (!roomId || typeof roomId !== 'string') {
			return json({ error: 'Invalid room ID' }, { status: 400 });
		}

		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Получаем права пользователя
		const { permissions, error } = await getLocalUserRoomPermissions(user.id, roomId);

		if (error) {
			return json({ error }, { status: 403 });
		}

		return json({ permissions });
	} catch (error) {
		console.error('Error fetching user permissions:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

