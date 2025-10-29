import { PrismaClient } from '@prisma/client';

// Создаем глобальную переменную для Prisma клиента
declare global {
  var __prisma: PrismaClient | undefined;
}

// Функция для получения DATABASE_URL с валидацией
function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  // Для production логируем только факт наличия URL (без самого URL для безопасности)
  if (process.env.NODE_ENV === 'production') {
    console.log('Database URL is configured');
  }

  return databaseUrl;
}

// Создаем экземпляр Prisma клиента с явной конфигурацией для serverless
function createPrismaClient() {
  // Отключаем DEBUG логи Prisma в production
  if (process.env.NODE_ENV === 'production') {
    process.env.DEBUG = '';
  }

  const databaseUrl = getDatabaseUrl();

  return new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
    // Минимальное логирование: только критические ошибки в production
    log: process.env.NODE_ENV === 'production' 
      ? [] // Полностью отключаем логи в production для максимальной производительности
      : ['error', 'warn'], // В development оставляем только ошибки и предупреждения
  });
}

// Экспортируем Prisma клиент
export const prisma = globalThis.__prisma || createPrismaClient();

// В development режиме сохраняем клиент в глобальной переменной
// чтобы избежать создания множественных соединений при hot reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Функция для закрытия соединения
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting Prisma:', error);
  }
}

// Функция для проверки подключения
export async function testPrismaConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Prisma connection error:', error);
    return false;
  }
}

// Helper-функция для выполнения Prisma операций с автоматическим retry при P1017
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionClosed = 
        error?.code === 'P1017' || 
        error?.message?.includes('Server has closed the connection') ||
        error?.message?.includes('Connection terminated unexpectedly');

      if (isConnectionClosed && attempt < maxRetries - 1) {
        console.log(`[Prisma Retry] Connection closed, retrying (${attempt + 1}/${maxRetries})...`);
        // Exponential backoff: 100ms, 200ms, 400ms
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        // Переподключаемся
        try {
          await prisma.$disconnect();
          await prisma.$connect();
        } catch (reconnectError) {
          console.error('[Prisma Retry] Reconnection failed:', reconnectError);
        }
        continue;
      }
      
      throw error;
    }
  }
  
  throw new Error('[Prisma Retry] All retry attempts failed');
}
