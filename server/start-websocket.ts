// Запуск WebSocket сервера
// ВАЖНО: Загружаем переменные окружения ДО всех остальных импортов
// Auto-deploy enabled via GitHub Actions ✅🚀
import 'dotenv/config';

import { createServer } from 'http';
import { WebSocketManager } from './websocket/index.js';
import { setWebSocketManager } from '../src/lib/websocket-singleton.js';
import { testConnection } from './database/prisma.js';

const PORT = process.env.WS_PORT || 3001;

// Список разрешенных origins для CORS
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://localhost:5173',
  process.env.PUBLIC_FRONTEND_URL, // URL фронтенда на Vercel
].filter(Boolean); // Убираем undefined значения

// Функция для добавления CORS заголовков
function setCorsHeaders(res: any, req: any) {
  const origin = req.headers.origin || req.headers.referer;
  
  // Разрешаем все origins в dev режиме, или проверяем список в production
  if (process.env.NODE_ENV !== 'production' || !origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => 
      allowed && origin.startsWith(allowed)
    );
    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    }
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

// Создаем HTTP сервер для WebSocket
const server = createServer((req, res) => {
  // Добавляем CORS заголовки для всех запросов
  setCorsHeaders(res, req);
  
  // Обработка preflight запросов
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Простой health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  // HTTP API для отправки уведомлений из SvelteKit
  if (req.method === 'POST' && req.url === '/notify') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const notification = JSON.parse(body);
        
        // Получаем wsManager через замыкание (он будет создан ниже)
        const manager = globalThis.wsManager as WebSocketManager;
        if (!manager) {
          throw new Error('WebSocket Manager not initialized');
        }
        
        // Обрабатываем разные типы уведомлений
        switch (notification.type) {
          case 'approval_response':
            manager.notifyApprovalResponse(
              notification.roomId,
              notification.inviteId,
              notification.action,
              notification.requesterId
            );
            break;
          case 'approval_request':
            manager.notifyApprovalRequest(notification.roomId, notification.invite);
            break;
          case 'participant_update':
            manager.notifyParticipantUpdate(
              notification.roomId,
              notification.participant,
              notification.action
            );
            break;
          case 'participant_removed':
            manager.notifyParticipantRemoved(notification.roomId, notification.userId);
            break;
          case 'invite_created':
            manager.notifyInviteCreated(notification.roomId, notification.invite);
            break;
          case 'invite_accepted':
            manager.notifyInviteAccepted(notification.roomId, notification.invite, notification.userId);
            break;
          default:
            console.warn('[WebSocket HTTP API] Unknown notification type:', notification.type);
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        console.error('[WebSocket HTTP API] Error processing notification:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(error) }));
      }
    });
    return;
  }
  
  res.writeHead(404);
  res.end();
});

// Функция для запуска сервера с проверкой БД
async function startServer() {
  // Проверяем подключение к базе данных
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.error('[WebSocket Server] Failed to connect to database. Exiting...');
    process.exit(1);
  }

  // Создаем WebSocket Manager
  const wsManager = new WebSocketManager(server);

  // Сохраняем в globalThis для доступа из HTTP обработчика
  (globalThis as any).wsManager = wsManager;

  // Регистрируем в singleton для использования в API endpoints
  setWebSocketManager(wsManager);

  // Экспортируем для использования в других местах
  // @ts-ignore
  globalThis.wsManagerExport = wsManager;

  // Запускаем сервер
  server.listen(PORT, () => {
    console.log(`[WebSocket Server] Listening on port ${PORT}`);
  });
  
  return wsManager;
}

// Запускаем сервер
const wsManagerPromise = startServer();

// Экспортируем для использования в других местах
export const wsManager = await wsManagerPromise;

// Graceful shutdown
let isShuttingDown = false;

const shutdown = async () => {
  if (isShuttingDown) {
    return;
  }
  
  isShuttingDown = true;
  console.log('[WebSocket Server] Shutting down...');
  
  try {
    await wsManager.shutdown();
    server.close(() => {
      console.log('[WebSocket Server] Closed');
      process.exit(0);
    });
    
    // Если сервер не закрылся за 5 секунд, принудительно завершаем
    setTimeout(() => {
      console.log('[WebSocket Server] Forcing shutdown...');
      process.exit(1);
    }, 5000);
  } catch (error) {
    console.error('[WebSocket Server] Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

