# 🔄 Миграция данных из SQLite в PostgreSQL

Если у вас уже есть данные в локальной SQLite базе и вы хотите перенести их в PostgreSQL.

---

## Вариант 1: Начать с чистой базы (рекомендуется)

Самый простой вариант - начать с нуля:

```bash
# Просто примените миграции на новую PostgreSQL базу
npm run db:migrate:deploy
```

Все пользователи зарегистрируются заново через Supabase Auth.

---

## Вариант 2: Экспорт/Импорт данных

### Шаг 1: Экспорт данных из SQLite

Создайте скрипт для экспорта (например, `scripts/export-data.ts`):

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db' // Ваша старая SQLite база
    }
  }
});

async function exportData() {
  const data = {
    users: await prisma.user.findMany(),
    rooms: await prisma.room.findMany(),
    notes: await prisma.note.findMany(),
    tags: await prisma.tag.findMany(),
    noteTags: await prisma.noteTag.findMany(),
    roomParticipants: await prisma.roomParticipant.findMany(),
    roomInvites: await prisma.roomInvite.findMany(),
    sessions: await prisma.session.findMany(),
    userSettings: await prisma.userSettings.findMany(),
  };

  fs.writeFileSync('data-export.json', JSON.stringify(data, null, 2));
  console.log('✅ Data exported to data-export.json');
}

exportData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Запустите:
```bash
npx tsx scripts/export-data.ts
```

### Шаг 2: Импорт в PostgreSQL

Создайте скрипт импорта (`scripts/import-data.ts`):

```typescript
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient(); // Будет использовать DATABASE_URL из .env

async function importData() {
  const data = JSON.parse(fs.readFileSync('data-export.json', 'utf-8'));

  console.log('Importing users...');
  for (const user of data.users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: user,
      create: user,
    });
  }

  console.log('Importing rooms...');
  for (const room of data.rooms) {
    await prisma.room.upsert({
      where: { id: room.id },
      update: room,
      create: room,
    });
  }

  console.log('Importing notes...');
  for (const note of data.notes) {
    await prisma.note.upsert({
      where: { id: note.id },
      update: note,
      create: note,
    });
  }

  console.log('Importing tags...');
  for (const tag of data.tags) {
    await prisma.tag.upsert({
      where: { id: tag.id },
      update: tag,
      create: tag,
    });
  }

  console.log('Importing note tags...');
  for (const noteTag of data.noteTags) {
    await prisma.noteTag.upsert({
      where: { noteId_tagId: { noteId: noteTag.noteId, tagId: noteTag.tagId } },
      update: noteTag,
      create: noteTag,
    });
  }

  console.log('Importing room participants...');
  for (const participant of data.roomParticipants) {
    await prisma.roomParticipant.upsert({
      where: { id: participant.id },
      update: participant,
      create: participant,
    });
  }

  console.log('Importing room invites...');
  for (const invite of data.roomInvites) {
    await prisma.roomInvite.upsert({
      where: { id: invite.id },
      update: invite,
      create: invite,
    });
  }

  console.log('Importing sessions...');
  for (const session of data.sessions) {
    await prisma.session.upsert({
      where: { id: session.id },
      update: session,
      create: session,
    });
  }

  console.log('Importing user settings...');
  for (const settings of data.userSettings) {
    await prisma.userSettings.upsert({
      where: { id: settings.id },
      update: settings,
      create: settings,
    });
  }

  console.log('✅ All data imported!');
}

importData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Перед импортом убедитесь, что `.env` указывает на PostgreSQL:
```bash
# .env
DATABASE_URL=postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

Запустите импорт:
```bash
npx tsx scripts/import-data.ts
```

---

## Вариант 3: Использование pgloader (продвинутый)

Можно использовать утилиту `pgloader` для прямой миграции:

```bash
# macOS
brew install pgloader

# Ubuntu/Debian
sudo apt-get install pgloader
```

Создайте файл конфигурации `migrate.load`:

```sql
LOAD DATABASE
  FROM sqlite://./prisma/dev.db
  INTO postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

WITH include drop, create tables, create indexes, reset sequences

SET work_mem to '16MB', maintenance_work_mem to '512 MB';
```

Запустите:
```bash
pgloader migrate.load
```

⚠️ **Внимание**: Этот метод может потребовать дополнительной настройки схемы.

---

## ⚠️ Важные замечания

1. **Даты**: SQLite хранит даты как строки, PostgreSQL - как timestamp. Убедитесь, что формат совместим.

2. **ID генерация**: 
   - SQLite: автоинкремент целых чисел
   - PostgreSQL (с cuid): строковые ID
   - Если используете cuid, ID должны остаться как есть

3. **Транзакции**: Для больших баз используйте транзакции:
```typescript
await prisma.$transaction(async (tx) => {
  // Ваши операции импорта
});
```

4. **Внешние ключи**: Импортируйте данные в правильном порядке:
   1. Users
   2. Rooms
   3. Notes
   4. Tags
   5. RoomParticipants
   6. NoteTags
   7. RoomInvites
   8. Sessions
   9. UserSettings

---

## 🧪 Тестирование

После миграции проверьте:

```bash
# Подключитесь к PostgreSQL
npm run db:studio

# Проверьте количество записей
# SELECT COUNT(*) FROM "User";
# SELECT COUNT(*) FROM "Room";
# и т.д.
```

---

## 🔙 Откат

Если что-то пошло не так:

```bash
# Сбросить базу PostgreSQL
npx prisma migrate reset

# Или удалить все данные вручную через Prisma Studio
npm run db:studio
```

---

## 💡 Рекомендация

Для большинства случаев **рекомендуется начать с чистой базы** (Вариант 1), особенно если:
- У вас мало данных
- Приложение еще в разработке
- Это тестовые данные

Миграция данных нужна только если у вас уже есть **реальные пользователи и важные данные**.

