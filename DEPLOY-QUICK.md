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
PUBLIC_WS_URL=wss://your-app.onrender.com  # Обновите после деплоя
WS_SERVER_URL=https://your-app.onrender.com/notify

# 4. Deploy!
```

## 3️⃣ Render (10 мин) 

### Создание сервиса:
```bash
# 1. Зайдите на render.com
# 2. New + → Web Service
# 3. Подключите ваш GitHub репозиторий
# 4. Render автоматически обнаружит render.yaml!
```

### Настройка переменных:
В Render Dashboard добавьте:
```bash
DATABASE_URL=postgresql://...
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
PUBLIC_FRONTEND_URL=https://your-app.vercel.app
```

### После деплоя (5-10 мин):
```bash
# Получите URL (например: your-app.onrender.com)
# Вернитесь в Vercel и обновите переменные:
PUBLIC_WS_URL=wss://your-app.onrender.com
WS_SERVER_URL=https://your-app.onrender.com/notify
```

## ✅ Готово!

Проверьте:
- https://ваш-проект.vercel.app
- https://your-app.onrender.com/health

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
WS_SERVER_URL=https://your-app.onrender.com/notify
```

### Render:
```
DATABASE_URL=postgresql://...
PUBLIC_SUPABASE_URL=https://...
PUBLIC_SUPABASE_ANON_KEY=eyJ...
PUBLIC_FRONTEND_URL=https://your-app.vercel.app
NODE_ENV=production
WS_PORT=10000
```

---

## 💰 Стоимость: **$0 / месяц БЕСПЛАТНО!** 

| Сервис | План | Лимит |
|--------|------|-------|
| Supabase | Free | 500MB базы |
| Vercel | Hobby | 100GB трафик |
| Render | Free | 750 часов, ⚠️ 15 мин → cold start |

**О Render Free tier:**
- ✅ **БЕСПЛАТНО навсегда**
- ⚠️ **Cold start 30-60 сек** после 15 мин неактивности
- ✅ **Автоматически просыпается** при подключении
- ✅ **SSL из коробки**

---

## 🔧 Troubleshooting:

### WebSocket не подключается?
- Проверьте логи в Render Dashboard → Logs
- Убедитесь что `PUBLIC_FRONTEND_URL` на Render правильный
- Проверьте health: `https://your-app.onrender.com/health`

### Нужно обновить код?
```bash
git add . && git commit -m "Update"
git push
# Render автоматически задеплоит!
```

### Медленное первое подключение?
Это нормально для Render Free - cold start 30-60 сек. Последующие подключения быстрые.
