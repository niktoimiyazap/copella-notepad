import { PrismaClient } from '@prisma/client';

// Создаем глобальную переменную для Prisma клиента
declare global {
  var __prisma: PrismaClient | undefined;
}

// Создаем экземпляр Prisma клиента
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// В development режиме сохраняем клиент в глобальной переменной
// чтобы избежать создания множественных соединений при hot reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Функция для закрытия соединения
export async function disconnectPrisma() {
  await prisma.$disconnect();
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
