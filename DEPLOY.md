# 🚀 Инструкция по деплою Copella Notepad

Полностью бесплатный деплой вашего приложения с collaborative editing!

## 📋 Что нужно

- [ ] Аккаунт на [Supabase](https://supabase.com) (бесплатно)
- [ ] Аккаунт на [Vercel](https://vercel.com) (бесплатно)
- [ ] Аккаунт на [Render](https://render.com) (бесплатно)
- [ ] GitHub аккаунт (для деплоя)

---

## 🎯 Архитектура

```
┌─────────────────────────────────────────────┐
│  Vercel                                     │
│  ├─ Frontend (SvelteKit)                   │
│  └─ API Routes                              │
└─────────────────────────────────────────────┘
              │
              ├─────────────────┐
              │                 │
              ▼                 ▼
┌──────────────────┐   ┌─────────────────┐
│  Supabase        │   │  Render.com     │
│  PostgreSQL DB   │   │  WebSocket      │
│  500MB бесплатно │   │  для Yjs        │
└──────────────────┘   └─────────────────┘
```

---

## 📝 Шаг 1: Настройка Supabase (База данных)

### 1.1 Создайте проект

1. Зайдите на [supabase.com](https://supabase.com)
2. Нажмите **"New Project"**
3. Выберите организацию (или создайте новую)
4. Заполните:
   - **Name**: `copella-notepad` (или любое название)
   - **Database Password**: Придумайте надежный пароль (СОХРАНИТЕ ЕГО!)
   - **Region**: Выберите ближайший к вам
   - **Pricing Plan**: **Free** (500MB, этого хватит)
5. Нажмите **"Create new project"**
6. ⏳ Подождите 2-3 минуты, пока проект создается

### 1.2 Получите данные для подключения

1. Перейдите в **Settings** → **API**
2. Скопируйте:
   - **Project URL** (начинается с `https://xxx.supabase.co`)
   - **anon public key** (длинный JWT токен)

3. Перейдите в **Settings** → **Database**
4. Прокрутите вниз до **Connection String** → выберите **URI**
5. Скопируйте строку подключения и **замените `[YOUR-PASSWORD]` на ваш пароль из шага 1.1**

Пример:
```
postgresql://postgres:ваш_пароль@db.xxxxx.supabase.co:5432/postgres
```

### 1.3 Примените миграции

1. Откройте терминал в папке проекта
2. Создайте файл `.env` (если его нет):

```bash
cp .env.example .env
```

3. Отредактируйте `.env`:

```env
# Supabase Configuration
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=ваш_anon_key_здесь

# Database
DATABASE_URL=postgresql://postgres:ваш_пароль@db.xxxxx.supabase.co:5432/postgres

# WebSocket (пока оставьте localhost)
PUBLIC_WS_URL=ws://localhost:3001
```

4. Примените миграции:

```bash
npm run db:migrate:deploy
```

Вы должны увидеть: ✅ Все миграции применены

---

## 📝 Шаг 2: Деплой на Vercel (Frontend + API)

### 2.1 Подготовка репозитория

1. Закоммитьте все изменения:

```bash
git add .
git commit -m "Готов к деплою"
git push
```

### 2.2 Создание проекта на Vercel

1. Зайдите на [vercel.com](https://vercel.com)
2. Нажмите **"Add New..."** → **"Project"**
3. Импортируйте ваш GitHub репозиторий
4. **Framework Preset**: SvelteKit (должно определиться автоматически)
5. **Root Directory**: оставьте пустым
6. Нажмите **"Environment Variables"** и добавьте:

```
DATABASE_URL=postgresql://postgres:ваш_пароль@db.xxxxx.supabase.co:5432/postgres
PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=ваш_anon_key
PUBLIC_WS_URL=wss://ваш-websocket-сервер.onrender.com
```

⚠️ **Важно**: `PUBLIC_WS_URL` мы заполним после шага 3!

7. Нажмите **"Deploy"**
8. ⏳ Подождите 2-3 минуты

### 2.3 Проверка

После успешного деплоя вы получите URL типа `https://ваш-проект.vercel.app`

---

## 📝 Шаг 3: Деплой WebSocket на Render

### 3.1 Создание Web Service

1. Зайдите на [render.com](https://render.com)
2. Нажмите **"New +"** → **"Web Service"**
3. Подключите GitHub репозиторий (тот же, что и для Vercel)
4. Заполните:
   - **Name**: `copella-websocket` (или любое название)
   - **Region**: Выберите ближайший
   - **Branch**: `main` (или ваша основная ветка)
   - **Runtime**: **Node**
   - **Build Command**: `npm install`
   - **Start Command**: `npm run start:ws`
   - **Instance Type**: **Free**

### 3.2 Добавление переменных окружения

Прокрутите вниз до **Environment Variables** и добавьте:

```
NODE_ENV=production
WS_PORT=10000
DATABASE_URL=postgresql://postgres:ваш_пароль@db.xxxxx.supabase.co:5432/postgres
```

### 3.3 Деплой

1. Нажмите **"Create Web Service"**
2. ⏳ Подождите 5-10 минут (первый деплой может быть долгим)
3. После успешного деплоя скопируйте URL вашего сервиса

Пример: `https://copella-websocket.onrender.com`

### 3.4 Проверка WebSocket

Откройте в браузере:
```
https://copella-websocket.onrender.com/health
```

Должны увидеть:
```json
{"status":"ok","timestamp":"2025-..."}
```

### 3.5 Обновите Vercel

1. Вернитесь в Vercel
2. Перейдите в **Settings** → **Environment Variables**
3. Найдите `PUBLIC_WS_URL` и измените на:

```
wss://copella-websocket.onrender.com
```

⚠️ Обратите внимание: `wss://` (с SSL), а не `ws://`!

4. Перейдите в **Deployments**
5. Нажмите на последний деплой → **"..."** → **"Redeploy"**

---

## ✅ Готово!

Теперь ваше приложение полностью развернуто!

🌐 **Frontend**: `https://ваш-проект.vercel.app`  
🔌 **WebSocket**: `wss://copella-websocket.onrender.com`  
🗄️ **База данных**: Supabase PostgreSQL

---

## 📊 Лимиты бесплатных планов

| Сервис | Что дает | Лимиты | Навсегда? |
|--------|----------|--------|-----------|
| **Supabase** | PostgreSQL база | 500MB, 2GB трафик/мес | ✅ Да |
| **Vercel** | Frontend + API | 100GB трафик/мес | ✅ Да |
| **Render** | WebSocket сервер | 750 часов/мес, засыпает через 15 мин | ✅ Да |

### ⚠️ Важно про Render WebSocket:

**Проблема**: Сервер "засыпает" через 15 минут без активности.  
**Решение**: У вас уже настроен **ping каждые 30 секунд**, который автоматически будет будить сервер!

**Что это значит**:
- Если никто не использует приложение 15+ минут → WebSocket засыпает
- Когда пользователь заходит → первое подключение займет ~30-60 секунд (холодный старт)
- После первого подключения все работает мгновенно
- Пока хоть один пользователь онлайн → сервер не засыпает

---

## 🔧 Настройка кастомного домена (опционально)

### Для Vercel:

1. В Vercel перейдите в **Settings** → **Domains**
2. Добавьте ваш домен
3. Следуйте инструкциям Vercel по настройке DNS

---

## 🐛 Решение проблем

### Проблема: "Database connection failed"

**Решение**:
1. Проверьте правильность `DATABASE_URL` в переменных окружения
2. Убедитесь, что пароль не содержит специальных символов (или они экранированы)
3. Проверьте в Supabase: Settings → Database → Connection pooling должно быть включено

### Проблема: WebSocket не подключается

**Решение**:
1. Убедитесь, что в Vercel используется `wss://` (с SSL)
2. Проверьте, что Render сервис запущен (не suspended)
3. Откройте `/health` endpoint и убедитесь, что он отвечает

### Проблема: "Too many connections" в базе

**Решение**:
Supabase бесплатный план ограничивает количество подключений. Используйте connection pooling:

В Supabase: Settings → Database → скопируйте **Connection Pooling** URI вместо обычного.

---

## 📈 Мониторинг

### Vercel
- **Deployments**: Все деплои и логи
- **Analytics**: Статистика посещений (платно)

### Render
- **Logs**: В реальном времени
- **Metrics**: CPU, Memory, Response Time

### Supabase
- **Database**: Размер базы, количество запросов
- **API**: Количество запросов к API
- **Table Editor**: Просмотр данных

---

## 🔐 Безопасность

### ✅ Что уже настроено:
- SSL/TLS шифрование (через Vercel и Render)
- JWT авторизация через Supabase
- WebSocket авторизация по токенам

### 🔒 Рекомендации:
1. Регулярно меняйте пароль базы данных
2. Не публикуйте `.env` файл в Git (уже в `.gitignore`)
3. Используйте Row Level Security (RLS) в Supabase для дополнительной защиты

---

## 🎉 Поздравляем!

Ваше приложение теперь доступно в интернете **полностью бесплатно**!

Если возникнут вопросы, проверьте:
- Логи в Vercel
- Логи в Render
- Метрики в Supabase

---

## 📚 Полезные ссылки

- [Документация Supabase](https://supabase.com/docs)
- [Документация Vercel](https://vercel.com/docs)
- [Документация Render](https://render.com/docs)
- [SvelteKit Deployment](https://kit.svelte.dev/docs/adapter-auto)

