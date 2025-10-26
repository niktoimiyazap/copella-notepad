import { PrismaClient } from '@prisma/client';

// Создаем единственный экземпляр Prisma клиента для WebSocket сервера
// с оптимизированными настройками для long-running процесса
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  // Оптимизация для WebSocket сервера
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Prisma] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Prisma] Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Проверка подключения при старте
export async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('[Prisma] Database connection successful');
    return true;
  } catch (error) {
    console.error('[Prisma] Database connection error:', error);
    return false;
  }
}

