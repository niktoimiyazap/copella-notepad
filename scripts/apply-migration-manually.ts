/**
 * Скрипт для ручного применения миграции на продакшене
 * Применяет SQL миграцию напрямую к БД
 */

import { prisma } from '../src/lib/prisma';

const migrationSQL = `
-- Добавление индексов для оптимизации запросов (если еще нет)

-- Индексы для таблицы Room
CREATE INDEX IF NOT EXISTS "Room_createdBy_idx" ON "Room"("createdBy");
CREATE INDEX IF NOT EXISTS "Room_createdAt_idx" ON "Room"("createdAt");
CREATE INDEX IF NOT EXISTS "Room_isPublic_idx" ON "Room"("isPublic");

-- Индексы для таблицы RoomParticipant
CREATE INDEX IF NOT EXISTS "RoomParticipant_userId_idx" ON "RoomParticipant"("userId");
CREATE INDEX IF NOT EXISTS "RoomParticipant_roomId_idx" ON "RoomParticipant"("roomId");

-- Индексы для таблицы Note
CREATE INDEX IF NOT EXISTS "Note_roomId_idx" ON "Note"("roomId");
CREATE INDEX IF NOT EXISTS "Note_updatedAt_idx" ON "Note"("updatedAt");
CREATE INDEX IF NOT EXISTS "Note_createdBy_idx" ON "Note"("createdBy");

-- Создание таблицы YjsUpdate для персистентности collaborative editing
CREATE TABLE IF NOT EXISTS "YjsUpdate" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "clock" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "YjsUpdate_pkey" PRIMARY KEY ("id")
);

-- Индексы для таблицы YjsUpdate
CREATE INDEX IF NOT EXISTS "YjsUpdate_noteId_clock_idx" ON "YjsUpdate"("noteId", "clock");
CREATE INDEX IF NOT EXISTS "YjsUpdate_noteId_idx" ON "YjsUpdate"("noteId");

-- Уникальный индекс
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'YjsUpdate_noteId_clock_key'
    ) THEN
        CREATE UNIQUE INDEX "YjsUpdate_noteId_clock_key" ON "YjsUpdate"("noteId", "clock");
    END IF;
END $$;

-- Добавление внешнего ключа (если еще нет)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'YjsUpdate_noteId_fkey'
    ) THEN
        ALTER TABLE "YjsUpdate" 
        ADD CONSTRAINT "YjsUpdate_noteId_fkey" 
        FOREIGN KEY ("noteId") REFERENCES "Note"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
`;

async function applyMigration() {
  try {
    console.log('[Migration] Starting manual migration...');
    
    // Разбиваем на отдельные команды и выполняем
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      try {
        await prisma.$executeRawUnsafe(statement);
        console.log('[Migration] ✓ Executed successfully');
      } catch (error: any) {
        // Игнорируем ошибки "already exists"
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          console.log('[Migration] ℹ Already exists, skipping');
        } else {
          console.error('[Migration] ✗ Error:', error.message);
        }
      }
    }
    
    console.log('[Migration] Migration completed successfully!');
  } catch (error) {
    console.error('[Migration] Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();

