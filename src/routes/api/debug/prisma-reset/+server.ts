import { json } from '@sveltejs/kit';
import { recreatePrismaClient } from '$lib/prisma';
import type { RequestHandler } from './$types';

// POST /api/debug/prisma-reset - сброс Prisma connection pool (только для development)
export const POST: RequestHandler = async () => {
	if (process.env.NODE_ENV === 'production') {
		return json({ error: 'Not available in production' }, { status: 403 });
	}

	try {
		console.log('[Debug] Resetting Prisma connection pool...');
		const newPrisma = recreatePrismaClient();
		
		// Проверяем подключение
		await newPrisma.$queryRaw`SELECT 1`;
		
		console.log('[Debug] Prisma connection pool reset successful');
		return json({ 
			success: true, 
			message: 'Connection pool reset successfully' 
		});
	} catch (error) {
		console.error('[Debug] Failed to reset connection pool:', error);
		return json({ 
			error: 'Failed to reset connection pool',
			details: error instanceof Error ? error.message : String(error)
		}, { status: 500 });
	}
};

