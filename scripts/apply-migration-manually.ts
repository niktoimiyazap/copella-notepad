/**
 * Скрипт для ручного применения миграции на продакшене
 * Применяет SQL миграцию напрямую к БД
 */

import { prisma } from '../src/lib/prisma';

// Массив SQL команд для выполнения
const migrationStatements = [
  // Индексы для Room
  'CREATE INDEX IF NOT EXISTS "Room_createdBy_idx" ON "Room"("createdBy")',
  'CREATE INDEX IF NOT EXISTS "Room_createdAt_idx" ON "Room"("createdAt")',
  'CREATE INDEX IF NOT EXISTS "Room_isPublic_idx" ON "Room"("isPublic")',
  
  // Индексы для RoomParticipant
  'CREATE INDEX IF NOT EXISTS "RoomParticipant_userId_idx" ON "RoomParticipant"("userId")',
  'CREATE INDEX IF NOT EXISTS "RoomParticipant_roomId_idx" ON "RoomParticipant"("roomId")',
  
  // Индексы для Note
  'CREATE INDEX IF NOT EXISTS "Note_roomId_idx" ON "Note"("roomId")',
  'CREATE INDEX IF NOT EXISTS "Note_updatedAt_idx" ON "Note"("updatedAt")',
  'CREATE INDEX IF NOT EXISTS "Note_createdBy_idx" ON "Note"("createdBy")',
  
  // Создание таблицы YjsUpdate
  `CREATE TABLE IF NOT EXISTS "YjsUpdate" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "clock" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "YjsUpdate_pkey" PRIMARY KEY ("id")
  )`,
  
  // Индексы для YjsUpdate
  'CREATE INDEX IF NOT EXISTS "YjsUpdate_noteId_clock_idx" ON "YjsUpdate"("noteId", "clock")',
  'CREATE INDEX IF NOT EXISTS "YjsUpdate_noteId_idx" ON "YjsUpdate"("noteId")',
];

async function applyMigration() {
  try {
    console.log('[Migration] Starting manual migration...');
    console.log(`[Migration] Applying ${migrationStatements.length} statements...`);
    
    for (let i = 0; i < migrationStatements.length; i++) {
      const statement = migrationStatements[i];
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`[Migration] ✓ Statement ${i + 1}/${migrationStatements.length} executed`);
      } catch (error: any) {
        // Игнорируем ошибки "already exists"
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log(`[Migration] ℹ Statement ${i + 1}/${migrationStatements.length} already exists, skipping`);
        } else {
          console.error(`[Migration] ✗ Statement ${i + 1}/${migrationStatements.length} failed:`, error.message);
        }
      }
    }
    
    // Проверяем что таблица создана
    const result = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables 
      WHERE table_name = 'YjsUpdate'
    ` as any[];
    
    if (result.length > 0) {
      console.log('[Migration] ✅ YjsUpdate table exists!');
    } else {
      console.log('[Migration] ⚠️  YjsUpdate table not found');
    }
    
    console.log('[Migration] Migration completed!');
  } catch (error) {
    console.error('[Migration] Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();


