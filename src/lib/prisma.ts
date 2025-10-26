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
  return new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
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
