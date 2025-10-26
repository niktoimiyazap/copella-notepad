# Dockerfile для WebSocket сервера на Fly.io
FROM node:20-alpine

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci --only=production

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходники
COPY server ./server
COPY src/lib ./src/lib

# Открываем порт
EXPOSE 3001

# Запускаем WebSocket сервер
CMD ["npm", "run", "start:ws"]

