import { json } from '@sveltejs/kit';
import { destroySession } from '$lib/session-new';
import type { RequestHandler } from './$types';

// POST /api/auth/logout-new - выход
export const POST: RequestHandler = async (event) => {
	try {
		const result = await destroySession(event);

		if (result.error) {
			return json({ error: result.error }, { status: 500 });
		}

		return json({ message: 'Logged out successfully' });
	} catch (error) {
		console.error('Logout error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

