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

  let databaseUrl = getDatabaseUrl();
  
  // Добавляем параметры connection pool если их нет в URL
  // Увеличиваем лимит соединений и таймауты
  const urlObj = new URL(databaseUrl);
  const params = urlObj.searchParams;
  
  // Устанавливаем оптимальные параметры для connection pool (только если их нет в URL)
  // Параметры уже добавлены в .env, так что эта логика - fallback
  if (!params.has('connection_limit')) {
    params.set('connection_limit', '10'); // Оптимальное значение для локальной разработки
  }
  if (!params.has('pool_timeout')) {
    params.set('pool_timeout', '60'); // Увеличиваем таймаут до 60 секунд
  }
  if (!params.has('connect_timeout')) {
    params.set('connect_timeout', '60'); // Таймаут подключения 60 секунд
  }
  // НЕ добавляем sslmode - Supabase управляет SSL автоматически
  
  databaseUrl = urlObj.toString();

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

// Функция для принудительного пересоздания клиента
export function recreatePrismaClient() {
  if (globalThis.__prisma) {
    globalThis.__prisma.$disconnect().catch(console.error);
    delete globalThis.__prisma;
  }
  const newRawClient = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = newRawClient;
  }
  // Возвращаем клиент с Proxy для автоматического retry
  return createPrismaProxy(newRawClient);
}

// Создаем Proxy для автоматической обертки всех Prisma операций в withRetry
function createPrismaProxy(client: PrismaClient): PrismaClient {
  return new Proxy(client, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);
      
      // Проверяем, является ли это моделью Prisma (user, room, note, и т.д.)
      if (original && typeof original === 'object' && prop !== 'constructor') {
        return new Proxy(original, {
          get(modelTarget, modelProp) {
            const modelOriginal = Reflect.get(modelTarget, modelProp);
            
            // Оборачиваем только методы запросов (find, create, update, delete и т.д.)
            if (typeof modelOriginal === 'function') {
              const methodName = String(modelProp);
              const isQueryMethod = [
                'findUnique', 'findUniqueOrThrow', 'findFirst', 'findFirstOrThrow',
                'findMany', 'create', 'createMany', 'update', 'updateMany',
                'upsert', 'delete', 'deleteMany', 'count', 'aggregate',
                'groupBy', 'findRaw', 'aggregateRaw'
              ].includes(methodName);
              
              if (isQueryMethod) {
                return function(...args: any[]) {
                  // Оборачиваем вызов в withRetry
                  return withRetry(() => modelOriginal.apply(modelTarget, args));
                };
              }
            }
            
            return modelOriginal;
          }
        });
      }
      
      return original;
    }
  }) as PrismaClient;
}

// Экспортируем Prisma клиент с автоматическим retry через Proxy
const rawPrisma = globalThis.__prisma || createPrismaClient();
export let prisma = createPrismaProxy(rawPrisma);

// В development режиме сохраняем клиент в глобальной переменной
// чтобы избежать создания множественных соединений при hot reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = rawPrisma;
}

// Удалили периодическую очистку - она вызывала проблемы

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
  maxRetries: number = 3 // Увеличиваем до 3 попыток
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      const isConnectionClosed = 
        error?.code === 'P1017' || 
        error?.message?.includes('Server has closed the connection') ||
        error?.message?.includes('Connection terminated unexpectedly') ||
        error?.message?.includes('Connection lost') ||
        error?.kind === 'Closed';
      
      const isConnectionPoolTimeout = 
        error?.code === 'P2024' ||
        error?.message?.includes('Timed out fetching a new connection');

      // Для любых проблем с соединением пересоздаем клиент
      if ((isConnectionClosed || isConnectionPoolTimeout) && attempt < maxRetries - 1) {
        console.log(`[Prisma Retry] Connection issue detected (${error?.code || 'unknown'}), recreating client (${attempt + 1}/${maxRetries})...`);
        
        try {
          // Полностью пересоздаем Prisma клиент
          await prisma.$disconnect().catch(() => {});
          prisma = recreatePrismaClient();
          
          // Проверяем новое соединение
          await prisma.$connect();
          
          // Небольшая задержка перед повторной попыткой
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
          
          console.log(`[Prisma Retry] Client recreated, retrying operation...`);
          continue;
        } catch (recreateError) {
          console.error('[Prisma Retry] Failed to recreate client:', recreateError);
          // Продолжаем к следующей попытке
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, attempt)));
            continue;
          }
          throw error;
        }
      }
      
      throw error;
    }
  }
  
  throw new Error('[Prisma Retry] All retry attempts failed');
}
