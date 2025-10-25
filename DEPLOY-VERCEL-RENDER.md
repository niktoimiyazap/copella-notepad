# Деплой на Vercel (Frontend) + Render (WebSocket Backend)

Эта инструкция описывает процесс развёртывания приложения с разделением фронтенда и WebSocket сервера:
- **Vercel**: Фронтенд (SvelteKit)
- **Render**: WebSocket сервер

## Предварительные требования

1. Аккаунты:
   - [Supabase](https://supabase.com) - БД и аутентификация
   - [Vercel](https://vercel.com) - Фронтенд хостинг
   - [Render](https://render.com) - WebSocket сервер

2. Установленные инструменты:
   - Node.js 18+
   - Git
   - npm

## Часть 1: Настройка Supabase

### 1.1 Создание проекта

1. Войдите в [Supabase Dashboard](https://app.supabase.com)
2. Создайте новый проект
3. Дождитесь завершения инициализации (2-3 минуты)

### 1.2 Получение credentials

1. Перейдите в **Settings → API**
2. Скопируйте:
   - `URL` → это ваш `PUBLIC_SUPABASE_URL`
   - `anon/public` ключ → это ваш `PUBLIC_SUPABASE_ANON_KEY`

3. Перейдите в **Settings → Database**
4. Найдите "Connection string" → **URI**
5. Скопируйте строку подключения (замените `[YOUR-PASSWORD]` на ваш пароль)
   - Это ваш `DATABASE_URL`

### 1.3 Настройка базы данных

Выполните миграции локально или через Supabase SQL Editor:

```sql
-- Скопируйте содержимое файла prisma/migrations/0_init/migration.sql
-- и выполните в Supabase SQL Editor
```

## Часть 2: Деплой WebSocket сервера на Render

### 2.1 Подготовка репозитория

1. Убедитесь, что ваш код в Git репозитории (GitHub/GitLab)
2. Файл `render.yaml` уже настроен

### 2.2 Создание Web Service на Render

1. Войдите в [Render Dashboard](https://dashboard.render.com)
2. Нажмите **New +** → **Web Service**
3. Подключите ваш Git репозиторий
4. Render автоматически обнаружит `render.yaml`

### 2.3 Настройка переменных окружения

В настройках сервиса добавьте переменные:

```bash
# Обязательные переменные
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=ваш_ключ
PUBLIC_FRONTEND_URL=https://ваш-домен.vercel.app
NODE_ENV=production
WS_PORT=10000
```

### 2.4 Деплой

1. Нажмите **Create Web Service**
2. Дождитесь завершения деплоя (5-10 минут)
3. Скопируйте URL вашего сервера (например: `https://copella-websocket.onrender.com`)

### 2.5 Проверка работы

Откройте в браузере:
```
https://ваш-сервер.onrender.com/health
```

Должен вернуть:
```json
{"status":"ok","timestamp":"2024-..."}
```

## Часть 3: Деплой фронтенда на Vercel

### 3.1 Импорт проекта

1. Войдите в [Vercel Dashboard](https://vercel.com/dashboard)
2. Нажмите **Add New → Project**
3. Импортируйте ваш Git репозиторий
4. Vercel автоматически определит SvelteKit

### 3.2 Настройка переменных окружения

В разделе **Environment Variables** добавьте:

```bash
# Supabase
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=ваш_ключ
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# WebSocket (замените на ваш Render URL)
PUBLIC_WS_URL=wss://copella-websocket.onrender.com
WS_SERVER_URL=https://copella-websocket.onrender.com/notify
```

**⚠️ ВАЖНО**: 
- `PUBLIC_WS_URL` использует протокол `wss://` (не `https://`)
- `WS_SERVER_URL` использует протокол `https://` с путем `/notify`

### 3.3 Build & Output Settings

Vercel должен автоматически определить:
- **Framework Preset**: SvelteKit
- **Build Command**: `npm run build` или `vite build`
- **Output Directory**: `.svelte-kit`

### 3.4 Деплой

1. Нажмите **Deploy**
2. Дождитесь завершения сборки (2-5 минут)
3. Откройте ваш сайт по предоставленному URL

## Часть 4: Обновление конфигурации

### 4.1 Обновите PUBLIC_FRONTEND_URL на Render

После деплоя на Vercel вы получите URL (например: `https://copella.vercel.app`)

1. Вернитесь в Render Dashboard
2. Откройте ваш Web Service
3. Перейдите в **Environment**
4. Обновите `PUBLIC_FRONTEND_URL` на ваш Vercel URL
5. Сохраните и дождитесь рестарта сервиса

### 4.2 Настройка домена (опционально)

**На Vercel:**
1. Settings → Domains
2. Добавьте свой домен
3. Настройте DNS записи

**На Render:**
1. Settings → Custom Domain
2. Добавьте поддомен для WebSocket (например: `ws.yourdomain.com`)

После настройки домена обновите переменные:
- На Vercel: `PUBLIC_WS_URL` и `WS_SERVER_URL`
- На Render: `PUBLIC_FRONTEND_URL`

## Часть 5: Проверка работы

### 5.1 Проверка WebSocket подключения

1. Откройте фронтенд в браузере
2. Откройте DevTools → Console
3. Войдите в аккаунт
4. Создайте или откройте комнату
5. В консоли должно быть сообщение: `[WebSocket] Global connection established`

### 5.2 Проверка реального времени

Проверьте функциональность:
- ✅ Онлайн статус участников
- ✅ Приглашения в комнаты
- ✅ Заявки на вступление
- ✅ Удаление участников
- ✅ Real-time обновления заметок

### 5.3 Отладка проблем

**Если WebSocket не подключается:**

1. Проверьте консоль браузера на ошибки
2. Проверьте логи Render:
   ```
   Dashboard → Your Service → Logs
   ```
3. Убедитесь, что `PUBLIC_WS_URL` правильный
4. Проверьте, что `PUBLIC_FRONTEND_URL` на Render указывает на ваш Vercel домен

**Если уведомления не работают:**

1. Проверьте, что `WS_SERVER_URL` на Vercel правильный
2. Проверьте логи Render для `/notify` запросов
3. Убедитесь, что `WS_SERVER_URL` заканчивается на `/notify`

## Переменные окружения - Полный список

### Vercel (Frontend)
```bash
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
DATABASE_URL=postgresql://postgres:...
PUBLIC_WS_URL=wss://copella-websocket.onrender.com
WS_SERVER_URL=https://copella-websocket.onrender.com/notify
```

### Render (WebSocket Server)
```bash
DATABASE_URL=postgresql://postgres:...
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
PUBLIC_FRONTEND_URL=https://copella.vercel.app
NODE_ENV=production
WS_PORT=10000
```

## Troubleshooting

### CORS ошибки

Если видите CORS ошибки в консоли:
1. Убедитесь, что `PUBLIC_FRONTEND_URL` на Render правильный
2. Включает ли он протокол (`https://`)?
3. Не имеет ли слеш в конце?

### WebSocket подключение отклонено

1. Проверьте, что используете `wss://` (не `ws://`)
2. Render автоматически предоставляет SSL
3. Проверьте health endpoint: `https://your-app.onrender.com/health`

### "User not found in database" ошибки

Эта ошибка теперь должна быть исправлена. Если всё равно появляется:
1. Убедитесь, что пользователь является участником комнаты
2. Проверьте, что миграции БД выполнены
3. Посмотрите логи на Render

### Free tier ограничения

**Render Free tier:**
- Сервис засыпает после 15 минут неактивности
- Первое подключение может занять 30-60 секунд (cold start)
- 750 часов в месяц бесплатно

**Vercel Free tier:**
- 100GB bandwidth
- 6000 минут build time
- Без cold starts

## Мониторинг

### Render
- Dashboard → Logs (real-time)
- Dashboard → Metrics (CPU, Memory)

### Vercel  
- Dashboard → Deployments → Logs
- Analytics (если включено)

### Supabase
- Dashboard → Database → Query Performance
- Dashboard → API → Logs

## Обновление приложения

### При изменении кода:

**WebSocket сервер:**
1. Push изменения в Git
2. Render автоматически запустит новый деплой
3. Дождитесь завершения (5-10 минут)

**Фронтенд:**
1. Push изменения в Git  
2. Vercel автоматически запустит новую сборку
3. Дождитесь завершения (2-5 минут)

### При изменении БД схемы:

1. Создайте миграцию локально: `npm run db:migrate`
2. Выполните в Supabase SQL Editor
3. Или используйте `npm run db:push` локально (требует прямой доступ к БД)

## Полезные ссылки

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)

