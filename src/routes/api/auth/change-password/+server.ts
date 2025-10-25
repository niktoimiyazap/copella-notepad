import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase-server';
import type { RequestHandler } from './$types';

// POST: Change password
export const POST: RequestHandler = async ({ request, locals, cookies }) => {
  try {
    const user = locals.user;
    if (!user) {
      return json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    // Validate input
    if (!currentPassword || !newPassword) {
      return json({ error: 'Заполните все поля' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return json({ error: 'Пароль должен содержать минимум 8 символов' }, { status: 400 });
    }

    // Get session token from cookies
    const token = cookies.get('sb-access-token');
    if (!token) {
      return json({ error: 'Сессия не найдена' }, { status: 401 });
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (signInError) {
      return json({ error: 'Неверный текущий пароль' }, { status: 400 });
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      return json({ error: updateError.message }, { status: 400 });
    }

    return json({ success: true, message: 'Пароль успешно изменен' });
  } catch (error) {
    console.error('Change password error:', error);
    return json({ error: 'Ошибка изменения пароля' }, { status: 500 });
  }
};

