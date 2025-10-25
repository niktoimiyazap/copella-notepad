import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// Конфигурация Supabase из переменных окружения
// В SvelteKit используем $env/static/public для доступа к публичным переменным окружения
// Это работает как на сервере (SSR), так и на клиенте
const supabaseUrl = PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Отсутствуют переменные окружения Supabase. Проверьте файл .env');
}

// Создание клиента Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // Автоматически обновляет токен
    persistSession: true, // Сохраняет сессию в localStorage
    detectSessionInUrl: true,
    // Настройки для долгой сессии
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce' // Более безопасный метод аутентификации
  }
});

// Типы для базы данных
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string; // UUID из Supabase Auth
          email: string;
          full_name: string;
          username: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string; // Обязательно передаем ID из Supabase Auth
          email: string;
          full_name: string;
          username: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          username?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rooms: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          is_public: boolean;
          cover_image_url: string | null;
          participant_limit: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          is_public?: boolean;
          cover_image_url?: string | null;
          participant_limit?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          is_public?: boolean;
          cover_image_url?: string | null;
          participant_limit?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      room_participants: {
        Row: {
          id: string;
          room_id: string;
          user_id: string;
          joined_at: string;
          last_seen: string;
          is_online: boolean;
        };
        Insert: {
          id?: string;
          room_id: string;
          user_id: string;
          joined_at?: string;
          last_seen?: string;
          is_online?: boolean;
        };
        Update: {
          id?: string;
          room_id?: string;
          user_id?: string;
          joined_at?: string;
          last_seen?: string;
          is_online?: boolean;
        };
      };
      notes: {
        Row: {
          id: string;
          room_id: string;
          title: string;
          content: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          room_id: string;
          title: string;
          content?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          room_id?: string;
          title?: string;
          content?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
