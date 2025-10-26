-- Миграция для исправления уязвимости безопасности с ролями

-- 1. Создаем enum тип для ролей
CREATE TYPE "RoomRole" AS ENUM ('creator', 'owner', 'admin', 'moderator', 'user', 'participant');

-- 2. Очищаем невалидные роли (сбрасываем их на 'participant')
UPDATE "RoomParticipant"
SET role = 'participant'
WHERE role NOT IN ('creator', 'owner', 'admin', 'moderator', 'user', 'participant');

-- 3. Изменяем тип поля role на enum с использованием CAST
ALTER TABLE "RoomParticipant" 
ALTER COLUMN role TYPE "RoomRole" USING role::"RoomRole";

-- 4. Устанавливаем default значение
ALTER TABLE "RoomParticipant" 
ALTER COLUMN role SET DEFAULT 'participant'::"RoomRole";

