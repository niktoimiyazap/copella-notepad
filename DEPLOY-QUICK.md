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
PUBLIC_WS_URL=wss://your-app.onrender.com  # Временно оставьте пустым

# 4. Deploy!
```

## 3️⃣ Render (10 мин)
```bash
# 1. Создайте Web Service на render.com
# Runtime: Node
# Build: npm install
# Start: npm run start:ws

# 2. Добавьте переменные:
NODE_ENV=production
WS_PORT=10000
DATABASE_URL=postgresql://...

# 3. После деплоя скопируйте URL
# 4. Вернитесь в Vercel и обновите PUBLIC_WS_URL
```

## ✅ Готово!

Проверьте:
- https://ваш-проект.vercel.app
- https://ваш-ws.onrender.com/health

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
PUBLIC_WS_URL=wss://your-app.onrender.com
```

### Render:
```
NODE_ENV=production
WS_PORT=10000
DATABASE_URL=postgresql://...
```

---

## 💰 Стоимость: **$0 / месяц навсегда**

| Сервис | План | Лимит |
|--------|------|-------|
| Supabase | Free | 500MB базы |
| Vercel | Hobby | 100GB трафик |
| Render | Free | 750 часов |

**Примечание**: Render WebSocket может "засыпать" через 15 минут бездействия, но автоматически просыпается при новом подключении (30-60 сек холодный старт).

---

Подробная инструкция: [DEPLOY.md](./DEPLOY.md)

