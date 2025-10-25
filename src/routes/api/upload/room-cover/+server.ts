import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createClient } from '@supabase/supabase-js';
import { getCurrentUserFromToken } from '$lib/utils/userManagement';

// POST /api/upload/room-cover - загрузить обложку комнаты в Supabase Storage
export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Получаем токен пользователя из заголовков
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'No authorization token' }, { status: 401 });
		}
		const userToken = authHeader.substring(7);

		// Создаем клиент Supabase с токеном пользователя для прохождения RLS
		const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
		const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || '';
		const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
			global: {
				headers: {
					Authorization: `Bearer ${userToken}`
				}
			}
		});

		// Получаем файл из FormData
		const formData = await request.formData();
		const file = formData.get('file') as File;

		if (!file) {
			return json({ error: 'No file provided' }, { status: 400 });
		}

		// Проверяем тип файла
		if (!file.type.startsWith('image/')) {
			return json({ error: 'File must be an image' }, { status: 400 });
		}

		// Проверяем размер файла (максимум 5MB)
		if (file.size > 5 * 1024 * 1024) {
			return json({ error: 'File size must not exceed 5MB' }, { status: 400 });
		}

		// Генерируем уникальное имя файла
		const fileExt = file.name.split('.').pop();
		const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

		// Преобразуем File в ArrayBuffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = new Uint8Array(arrayBuffer);

		// Загружаем файл в Supabase Storage с токеном пользователя
		const { data, error } = await supabaseWithAuth.storage
			.from('room-covers')
			.upload(fileName, buffer, {
				contentType: file.type,
				upsert: false
			});

		if (error) {
			console.error('Error uploading file to Supabase:', error);
			return json({ error: 'Failed to upload file' }, { status: 500 });
		}

		// Получаем публичный URL
		const { data: urlData } = supabaseWithAuth.storage
			.from('room-covers')
			.getPublicUrl(fileName);

		return json({ 
			url: urlData.publicUrl,
			path: fileName 
		});
	} catch (error) {
		console.error('Error in room cover upload:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

// DELETE /api/upload/room-cover - удалить обложку комнаты из Supabase Storage
export const DELETE: RequestHandler = async ({ request, cookies }) => {
	try {
		// Получаем текущего пользователя
		const { user, error: authError } = await getCurrentUserFromToken(request, cookies);
		if (authError || !user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Получаем токен пользователя из заголовков
		const authHeader = request.headers.get('authorization');
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return json({ error: 'No authorization token' }, { status: 401 });
		}
		const userToken = authHeader.substring(7);

		// Создаем клиент Supabase с токеном пользователя для прохождения RLS
		const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
		const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || '';
		const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
			global: {
				headers: {
					Authorization: `Bearer ${userToken}`
				}
			}
		});

		const body = await request.json();
		const { path } = body;

		if (!path) {
			return json({ error: 'No path provided' }, { status: 400 });
		}

		// Проверяем, что пользователь пытается удалить свой файл
		if (!path.startsWith(user.id + '/')) {
			return json({ error: 'Access denied' }, { status: 403 });
		}

		// Удаляем файл из Supabase Storage с токеном пользователя
		const { error } = await supabaseWithAuth.storage
			.from('room-covers')
			.remove([path]);

		if (error) {
			console.error('Error deleting file from Supabase:', error);
			return json({ error: 'Failed to delete file' }, { status: 500 });
		}

		return json({ success: true });
	} catch (error) {
		console.error('Error in room cover deletion:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};

