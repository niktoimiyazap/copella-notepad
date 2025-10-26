import { config as loadEnv } from 'dotenv';
import { URL } from 'url';

// Load environment variables
loadEnv();

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  max_connections: number;
  idle_timeout: number;
}

export function getDatabaseConfig(): DatabaseConfig {
  // Check if we have a DATABASE_URL (common for Supabase and other PostgreSQL services)
  const databaseUrl = process.env.DATABASE_URL;
  
  if (databaseUrl) {
    try {
      const parsedUrl = new URL(databaseUrl);
      
      return {
        host: parsedUrl.hostname,
        port: parseInt(parsedUrl.port) || 5432,
        database: parsedUrl.pathname.slice(1), // Remove leading '/'
        username: parsedUrl.username,
        password: parsedUrl.password,
        ssl: process.env.DATABASE_SSL === 'true' || true, // Default to true for cloud databases
        max_connections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
        idle_timeout: parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000'),
      };
    } catch (error) {
      console.error('Error parsing DATABASE_URL:', error);
      throw new Error('Invalid DATABASE_URL format');
    }
  }
  
  // Fallback to individual environment variables
  const host = process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DATABASE_PORT || process.env.DB_PORT || '5432');
  const database = process.env.DATABASE_NAME || process.env.DB_NAME || 'postgres';
  const username = process.env.DATABASE_USER || process.env.DB_USER || 'postgres';
  const password = process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || '';
  const ssl = process.env.DATABASE_SSL === 'true' || process.env.DB_SSL === 'true';
  const max_connections = parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20');
  const idle_timeout = parseInt(process.env.DATABASE_IDLE_TIMEOUT || '30000');
  
  // Validate required fields
  if (!host || !database || !username) {
    throw new Error('Missing required database configuration. Please set DATABASE_URL or individual DB_* environment variables');
  }
  
  return {
    host,
    port,
    database,
    username,
    password,
    ssl,
    max_connections,
    idle_timeout,
  };
}

