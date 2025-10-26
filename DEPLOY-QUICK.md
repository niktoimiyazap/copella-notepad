# ⚡ Быстрый деплой за 15 минут

## 1️⃣ Supabase (2 мин)
```bash
# 1. Создайте проект на supabase.com
# 2. Скопируйте URL, ANON_KEY и DATABASE_URL
# 3. Примените миграции:
npm run db:migrate:deploy
```

## 2️⃣ Vercel (3 мин)
```bash
# 1. Закоммитьте изменения
git add . && git commit -m "Ready to deploy" && git push

# 2. Создайте проект на vercel.com
# 3. Добавьте переменные окружения:
DATABASE_URL=postgresql://...
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
PUBLIC_WS_URL=wss://copella-websocket.fly.dev  # Обновите после деплоя

# 4. Deploy!
```

## 3️⃣ Fly.io (5 мин) ✈️

### Установка flyctl:
```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Деплой:
```bash
# 1. Логин (создаст аккаунт если нет)
flyctl auth login

# 2. Запуск приложения (выберите имя для своего приложения)
flyctl launch --no-deploy

# 3. Установите переменные окружения:
flyctl secrets set DATABASE_URL="postgresql://..."
flyctl secrets set PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
flyctl secrets set PUBLIC_SUPABASE_ANON_KEY="eyJ..."
flyctl secrets set PUBLIC_FRONTEND_URL="https://your-app.vercel.app"

# 4. Деплой!
flyctl deploy

# 5. Получите URL:
flyctl status
# URL будет вида: copella-websocket.fly.dev
```

### После деплоя:
```bash
# Вернитесь в Vercel и обновите переменные:
PUBLIC_WS_URL=wss://copella-websocket.fly.dev
WS_SERVER_URL=https://copella-websocket.fly.dev/notify
```

## ✅ Готово!

Проверьте:
- https://ваш-проект.vercel.app
- https://copella-websocket.fly.dev/health

---

## 🔑 Все переменные окружения:

### `.env` (локально):
```env
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
PUBLIC_WS_URL=ws://localhost:3001
```

### Vercel:
```
DATABASE_URL=postgresql://...
PUBLIC_SUPABASE_URL=https://...
PUBLIC_SUPABASE_ANON_KEY=eyJ...
PUBLIC_WS_URL=wss://copella-websocket.fly.dev
WS_SERVER_URL=https://copella-websocket.fly.dev/notify
```

### Fly.io:
```
DATABASE_URL=postgresql://...
PUBLIC_SUPABASE_URL=https://...
PUBLIC_SUPABASE_ANON_KEY=eyJ...
PUBLIC_FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
WS_PORT=3001
```

---

## 💰 Стоимость: **$0 / месяц БЕСПЛАТНО!** 

| Сервис | План | Лимит |
|--------|------|-------|
| Supabase | Free | 500MB базы, 2GB bandwidth |
| Vercel | Hobby | 100GB трафик |
| Fly.io | Free | 3 VMs (256MB), 160GB трафик ✅ |

**Преимущества Fly.io:**
- ✅ **БЕСПЛАТНО навсегда** (3 shared VMs)
- ✅ **НЕ засыпает** - WebSocket всегда активен
- ✅ **Быстрый деплой** - 2-3 минуты
- ✅ **Глобальная сеть** - низкая задержка

---

## 📊 Полезные команды Fly.io:

```bash
# Посмотреть логи
flyctl logs

# Посмотреть статус
flyctl status

# Масштабировать (добавить VM)
flyctl scale count 2

# Открыть в браузере
flyctl open

# SSH в контейнер (для отладки)
flyctl ssh console

# Обновить переменные
flyctl secrets set KEY=value
```

---

## 🔧 Troubleshooting:

### WebSocket не подключается?
```bash
# Проверьте логи
flyctl logs

# Проверьте статус машин
flyctl status

# Убедитесь что машина запущена
flyctl machine list
```

### Нужно обновить код?
```bash
git add . && git commit -m "Update"
git push
flyctl deploy
```

### Проверить health endpoint:
```bash
curl https://your-app.fly.dev/health
```
