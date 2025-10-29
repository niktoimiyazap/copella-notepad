# Оптимизация производительности Copella Notepad

## Настройки логирования

### Prisma Query Logs

**Проблема:** Детальное логирование каждого SQL запроса (`prisma:query`) создаёт огромный overhead и сильно замедляет работу приложения.

**Решение:**
1. В `src/lib/prisma.ts` логи полностью отключены в production
2. В `ecosystem.config.cjs` явно установлена переменная `DEBUG: ''` для PM2 процессов
3. При инициализации PrismaClient в production `process.env.DEBUG` принудительно очищается

### Vercel Environment Variables

**Важно:** Убедитесь что в Vercel Dashboard → Settings → Environment Variables НЕТ переменной `DEBUG`.

Если она есть - удалите её и сделайте редеплой.

### VPS Environment Variables

На VPS проверьте файл `.env`:
```bash
ssh -i ~/Documents/id_ed25519 vladikkrivolapovik@103.88.243.6
cd ~/copella-notepad
cat .env | grep DEBUG
```

Если переменная `DEBUG` найдена - удалите её и перезапустите PM2:
```bash
pm2 restart all --update-env
```

## Database Connection Pooling

### Для Vercel (serverless)
```
DATABASE_URL=postgresql://...@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### Для VPS (long-running process)
```
DATABASE_URL=postgresql://...@aws-1-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Для локальной разработки
```
DATABASE_URL=postgresql://...@db.ritkgldlcfuksksfiyuw.supabase.co:5432/postgres?sslmode=require&connect_timeout=30&statement_cache_size=500
```

## Рекомендации

1. **Никогда не включайте query логи в production** - они создают огромный overhead
2. **Используйте Session Pooling** для serverless окружений (Vercel)
3. **Ограничивайте connection_limit=1** для serverless функций
4. **Мониторьте memory usage** в PM2 и Vercel
5. **Используйте Prisma statement cache** для локальной разработки

## Мониторинг

### PM2 Logs
```bash
pm2 logs --lines 50
```

### Vercel Logs
```bash
vercel logs --follow
```

### Проверка производительности Prisma
```bash
npm run db:test
```

