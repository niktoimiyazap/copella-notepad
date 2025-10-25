import { Pool, PoolClient } from 'pg';
import { getDatabaseConfig } from '../../server/database/config';

// Создаем пул соединений с базой данных
let pool: Pool | null = null;

export function getDatabasePool(): Pool {
  if (!pool) {
    const config = getDatabaseConfig();
    pool = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.username,
      password: config.password,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.max_connections,
      idleTimeoutMillis: config.idle_timeout,
    });

    // Обработка ошибок пула
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

// Функция для выполнения запросов
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getDatabasePool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(text, params);
    return result.rows;
  } finally {
    client.release();
  }
}

// Функция для выполнения одной записи
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const results = await query<T>(text, params);
  return results.length > 0 ? results[0] : null;
}

// Функция для выполнения транзакций
export async function transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const pool = getDatabasePool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Закрытие пула соединений
export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Типы для пользователей
export interface User {
  id: string;
  email: string;
  full_name: string;
  username: string;
  avatar_url?: string;
  created_at: Date;
  updated_at: Date;
}

// Функции для работы с пользователями
export const userQueries = {
  // Создание пользователя
  async create(user: Omit<User, 'created_at' | 'updated_at'>): Promise<User> {
    const result = await queryOne<User>(`
      INSERT INTO users (id, email, full_name, username, avatar_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [user.id, user.email, user.full_name, user.username, user.avatar_url]);
    
    if (!result) {
      throw new Error('Failed to create user');
    }
    
    return result;
  },

  // Получение пользователя по ID
  async getById(id: string): Promise<User | null> {
    return await queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
  },

  // Получение пользователя по email
  async getByEmail(email: string): Promise<User | null> {
    return await queryOne<User>('SELECT * FROM users WHERE email = $1', [email]);
  },

  // Получение пользователя по username
  async getByUsername(username: string): Promise<User | null> {
    return await queryOne<User>('SELECT * FROM users WHERE username = $1', [username]);
  },

  // Обновление пользователя
  async update(id: string, updates: Partial<Pick<User, 'full_name' | 'username' | 'avatar_url'>>): Promise<User> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (updates.full_name !== undefined) {
      fields.push(`full_name = $${paramIndex++}`);
      values.push(updates.full_name);
    }
    if (updates.username !== undefined) {
      fields.push(`username = $${paramIndex++}`);
      values.push(updates.username);
    }
    if (updates.avatar_url !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(updates.avatar_url);
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const result = await queryOne<User>(`
      UPDATE users 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (!result) {
      throw new Error('Failed to update user');
    }

    return result;
  },

  // Проверка доступности username
  async isUsernameAvailable(username: string): Promise<boolean> {
    const result = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE username = $1',
      [username]
    );
    return result ? result.count === 0 : true;
  },

  // Проверка доступности email
  async isEmailAvailable(email: string): Promise<boolean> {
    const result = await queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM users WHERE email = $1',
      [email]
    );
    return result ? result.count === 0 : true;
  }
};
