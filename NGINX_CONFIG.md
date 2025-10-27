# Nginx конфигурация для Yjs WebSocket

Добавьте в FastPanel конфигурацию для домена `yjs.copella.live`:

## Nginx location для /yjs

```nginx
location /yjs {
    proxy_pass http://localhost:1234;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # Важные настройки для WebSocket
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
    proxy_connect_timeout 86400;
    
    # Отключаем буферизацию для WebSocket
    proxy_buffering off;
}
```

## Или создайте поддомен yjs.copella.live

Если хотите использовать отдельный поддомен:

1. Создайте A-запись для `yjs.copella.live` → IP сервера
2. Создайте сайт в FastPanel для `yjs.copella.live`
3. Включите SSL (Let's Encrypt)
4. Добавьте в конфигурацию:

```nginx
server {
    listen 443 ssl http2;
    server_name yjs.copella.live;
    
    # SSL сертификаты (FastPanel настроит автоматически)
    
    location / {
        proxy_pass http://localhost:1234;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        proxy_connect_timeout 86400;
        
        proxy_buffering off;
    }
}
```

## Environment Variables на VPS

Добавьте в `/home/vladikkrivolapovik/copella-notepad/.env`:

```bash
# Yjs WebSocket port
YJS_WS_PORT=1234
```

## PM2 команды

```bash
# Запуск всех серверов
pm2 start ecosystem.config.cjs

# Рестарт yjs сервера
pm2 restart copella-yjs

# Логи
pm2 logs copella-yjs --lines 50

# Статус
pm2 list
```

