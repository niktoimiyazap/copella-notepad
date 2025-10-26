# ⚡ Быстрый деплой за 10 минут

## 1️⃣ Supabase (2 мин)
```bash
# 1. Создайте проект на supabase.com
# 2. Скопируйте URL, ANON_KEY и DATABASE_URL
# 3. Примените миграции:
npm run db:migrate:deploy
```

## 2️⃣ Vercel (5 мин)
```bash
# 1. Закоммитьте изменения
git add . && git commit -m "Ready to deploy" && git push

# 2. Создайте проект на vercel.com
# 3. Добавьте переменные окружения:
DATABASE_URL=postgresql://...
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 4. Deploy!
```

## ✅ Готово!

Проверьте:
- https://ваш-проект.vercel.app

---

## 🎉 Что изменилось?

**Теперь используется Supabase Realtime вместо отдельного WebSocket сервера!**

### ✅ Преимущества:
- **100% БЕСПЛАТНО** - никаких дополнительных сервисов
- **НЕТ ДЕПЛОЯ СЕРВЕРА** - всё работает через Supabase
- **ВСЕГДА АКТИВНО** - нет cold starts
- **ПРОЩЕ** - меньше настроек

### 🔧 Что было убрано:
- ❌ WebSocket сервер на Node.js  
- ❌ Отдельный деплой на Render/Fly.io/Railway
- ❌ Дополнительные переменные окружения для WS

---

## 🔑 Переменные окружения:

### `.env` (локально):
```env
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres
```

### Vercel:
```
DATABASE_URL=postgresql://...
PUBLIC_SUPABASE_URL=https://...
PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

---

## 💰 Стоимость: **$0 / месяц НАВСЕГДА!**

| Сервис | План | Лимит |
|--------|------|-------|
| Supabase | Free | 500MB базы, 2GB bandwidth, Realtime included ✨ |
| Vercel | Hobby | 100GB трафик |

---

## 🚀 Как это работает?

### Раньше (WebSocket сервер):
```
Клиент → WebSocket сервер (Render/Fly.io) → База данных
           ↳ Нужен деплой, может засыпать
```

### Сейчас (Supabase Realtime):
```
Клиент → Supabase Realtime → База данных
          ↳ Встроен в Supabase, всегда активен
```

---

## 📚 Что работает через Realtime:

- ✅ Онлайн статус участников
- ✅ Приглашения в комнаты
- ✅ Заявки на вступление
- ✅ Удаление участников
- ✅ Real-time обновления заметок
- ✅ Совместное редактирование (Yjs)
- ✅ Курсоры других пользователей
- ✅ Уведомления

---

## 🔧 Troubleshooting:

### Realtime не работает?
1. Проверьте что Realtime включён в Supabase:
   - Settings → API → Realtime
2. Убедитесь что переменные окружения правильные
3. Проверьте консоль браузера на ошибки

### Как проверить что Realtime работает?
1. Откройте DevTools → Console
2. Войдите в комнату
3. Должно быть сообщение: `[Realtime] Connected to room: ROOM_ID`

---

## 📝 Примечание:

Этот проект теперь использует **Supabase Realtime Channels** для всех real-time функций.
Больше не нужно деплоить отдельный WebSocket сервер! 🎉
