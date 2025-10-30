import { json } from '@sveltejs/kit';
import { prisma } from '$lib/prisma';
import { createClient } from '@supabase/supabase-js';
import type { RequestHandler } from './$types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// POST: Upload avatar to Supabase Storage
export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    // Получаем текущего пользователя из locals (установлен в hooks.server.ts)
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем токен пользователя из заголовков
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Токен авторизации не найден' }, { status: 401 });
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
    const file = formData.get('avatar') as File;

    if (!file) {
      return json({ error: 'Файл не загружен' }, { status: 400 });
    }

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return json({ error: 'Файл должен быть изображением' }, { status: 400 });
    }

    // Проверяем размер файла (максимум 5MB)
    if (file.size > MAX_FILE_SIZE) {
      return json({ error: 'Файл слишком большой (максимум 5MB)' }, { status: 400 });
    }

    // Генерируем уникальное имя файла
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    // Преобразуем File в ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Удаляем старый аватар, если существует
    if (user.avatarUrl) {
      try {
        // Извлекаем путь из URL (после /storage/v1/object/public/avatars/)
        const urlParts = user.avatarUrl.split('/avatars/');
        if (urlParts.length > 1) {
          const oldPath = urlParts[1];
          if (oldPath.startsWith(user.id + '/')) {
            await supabaseWithAuth.storage.from('avatars').remove([oldPath]);
          }
        }
      } catch (err) {
        console.error('Failed to delete old avatar:', err);
      }
    }

    // Загружаем файл в Supabase Storage с токеном пользователя
    const { data, error } = await supabaseWithAuth.storage
      .from('avatars')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Error uploading avatar to Supabase:', error);
      return json({ error: 'Ошибка загрузки аватара' }, { status: 500 });
    }

    // Получаем публичный URL
    const { data: urlData } = supabaseWithAuth.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Обновляем URL аватара в базе данных
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: urlData.publicUrl }
    });

    return json({ avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error('Upload avatar error:', error);
    return json({ error: 'Ошибка загрузки аватара' }, { status: 500 });
  }
};

// DELETE: Remove avatar from Supabase Storage
export const DELETE: RequestHandler = async ({ request, locals }) => {
  try {
    // Получаем текущего пользователя из locals (установлен в hooks.server.ts)
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    // Получаем токен пользователя из заголовков
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ error: 'Токен авторизации не найден' }, { status: 401 });
    }
    const userToken = authHeader.substring(7);

    // Создаем клиент Supabase с токеном пользователя
    const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${userToken}`
        }
      }
    });

    // Удаляем файл из Supabase Storage, если существует
    if (user.avatarUrl) {
      try {
        // Извлекаем путь из URL
        const urlParts = user.avatarUrl.split('/avatars/');
        if (urlParts.length > 1) {
          const path = urlParts[1];
          
          // Проверяем, что пользователь пытается удалить свой файл
          if (!path.startsWith(user.id + '/')) {
            return json({ error: 'Доступ запрещен' }, { status: 403 });
          }

          // Удаляем файл из Supabase Storage
          const { error } = await supabaseWithAuth.storage
            .from('avatars')
            .remove([path]);

          if (error) {
            console.error('Error deleting avatar from Supabase:', error);
          }
        }
      } catch (err) {
        console.error('Failed to delete avatar file:', err);
      }
    }

    // Обновляем URL аватара на null в базе данных
    await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl: null }
    });

    return json({ success: true });
  } catch (error) {
    console.error('Delete avatar error:', error);
    return json({ error: 'Ошибка удаления аватара' }, { status: 500 });
  }
};

