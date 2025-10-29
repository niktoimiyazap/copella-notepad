-- Добавление индексов для оптимизации запросов

-- Индексы для таблицы Room
CREATE INDEX "Room_createdBy_idx" ON "Room"("createdBy");
CREATE INDEX "Room_createdAt_idx" ON "Room"("createdAt");
CREATE INDEX "Room_isPublic_idx" ON "Room"("isPublic");

-- Индексы для таблицы RoomParticipant
CREATE INDEX "RoomParticipant_userId_idx" ON "RoomParticipant"("userId");
CREATE INDEX "RoomParticipant_roomId_idx" ON "RoomParticipant"("roomId");

-- Индексы для таблицы Note
CREATE INDEX "Note_roomId_idx" ON "Note"("roomId");
CREATE INDEX "Note_updatedAt_idx" ON "Note"("updatedAt");
CREATE INDEX "Note_createdBy_idx" ON "Note"("createdBy");

-- Создание таблицы YjsUpdate для персистентности collaborative editing
CREATE TABLE "YjsUpdate" (
    "id" TEXT NOT NULL,
    "noteId" TEXT NOT NULL,
    "clock" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "YjsUpdate_pkey" PRIMARY KEY ("id")
);

-- Индексы для таблицы YjsUpdate
CREATE INDEX "YjsUpdate_noteId_clock_idx" ON "YjsUpdate"("noteId", "clock");
CREATE INDEX "YjsUpdate_noteId_idx" ON "YjsUpdate"("noteId");
CREATE UNIQUE INDEX "YjsUpdate_noteId_clock_key" ON "YjsUpdate"("noteId", "clock");

-- Добавление внешнего ключа
ALTER TABLE "YjsUpdate" ADD CONSTRAINT "YjsUpdate_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

