#!/bin/bash

# Скрипт для развертывания на VPS
# Использование: bash deploy-vps.sh

set -e  # Останавливаться при ошибках

echo "🚀 Начинаю развертывание на VPS..."

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Обновление кода
echo -e "${BLUE}📥 Обновление кода из Git...${NC}"
git pull origin main

# 2. Установка зависимостей
echo -e "${BLUE}📦 Установка зависимостей...${NC}"
npm install

# 3. Обновление Nginx конфигурации
echo -e "${BLUE}🔧 Обновление Nginx конфигурации...${NC}"
if [ -f "nginx-vps-config.conf" ]; then
    sudo cp nginx-vps-config.conf /etc/nginx/sites-available/ws.copella.live
    
    # Создаем симлинк если его нет
    if [ ! -L "/etc/nginx/sites-enabled/ws.copella.live" ]; then
        sudo ln -s /etc/nginx/sites-available/ws.copella.live /etc/nginx/sites-enabled/
    fi
    
    # Проверяем конфигурацию
    echo -e "${BLUE}✅ Проверка конфигурации Nginx...${NC}"
    sudo nginx -t
    
    # Перезагружаем Nginx
    echo -e "${BLUE}🔄 Перезагрузка Nginx...${NC}"
    sudo systemctl reload nginx
    
    echo -e "${GREEN}✅ Nginx обновлен${NC}"
else
    echo -e "${RED}❌ Файл nginx-vps-config.conf не найден${NC}"
fi

# 4. Создание директории для логов
echo -e "${BLUE}📁 Создание директории для логов...${NC}"
mkdir -p logs

# 5. Перезапуск PM2 процессов
echo -e "${BLUE}🔄 Перезапуск PM2 процессов...${NC}"

# Останавливаем старые процессы
pm2 delete copella-yjs 2>/dev/null || true
pm2 delete copella-notifications 2>/dev/null || true
pm2 delete copella-websocket 2>/dev/null || true
pm2 delete copella-signaling 2>/dev/null || true

# Запускаем новые процессы
echo -e "${BLUE}🚀 Запуск Yjs WebSocket сервера...${NC}"
pm2 start ecosystem.config.cjs

# Сохраняем конфигурацию PM2
echo -e "${BLUE}💾 Сохранение конфигурации PM2...${NC}"
pm2 save

# Настройка автозапуска PM2 при перезагрузке
echo -e "${BLUE}🔧 Настройка автозапуска PM2...${NC}"
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

# 6. Проверка статуса
echo -e "${BLUE}📊 Проверка статуса сервисов...${NC}"
echo ""
pm2 list

echo ""
echo -e "${GREEN}✅ Развертывание завершено!${NC}"
echo ""
echo -e "${BLUE}📋 Запущенные сервисы:${NC}"
echo "  • Yjs WebSocket Server (port 1234) - /yjs"
echo "  • Notifications Server (port 3001) - /notifications"
echo ""
echo -e "${BLUE}📝 Проверить логи:${NC}"
echo "  pm2 logs copella-yjs"
echo "  pm2 logs copella-notifications"
echo ""
echo -e "${BLUE}🌐 Endpoints:${NC}"
echo "  wss://ws.copella.live/yjs - Yjs collaborative editing"
echo "  wss://ws.copella.live/notifications - Real-time notifications"
echo ""
echo -e "${GREEN}🎉 Все готово!${NC}"

