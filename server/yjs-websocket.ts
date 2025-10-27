/**
 * Простой y-websocket сервер для синхронизации Yjs
 * Работает на порту 1234
 */

import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { setupWSConnection } from 'y-websocket/bin/utils';

const PORT = process.env.YJS_WS_PORT || 1234;

// Создаем WebSocket сервер с адаптивным сжатием
const wss = new WebSocketServer({ 
  port: Number(PORT),
  // Включаем агрессивное сжатие для текстовых данных (Yjs отлично сжимается)
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 8,
      level: 6 // Более сильное сжатие (текст сжимается отлично)
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 15, // Максимальный размер окна для лучшего сжатия
    concurrencyLimit: 10,
    threshold: 256 // Сжимаем даже небольшие сообщения (256 байт)
  }
});

console.log(`[Yjs WebSocket] 🚀 Server started on port ${PORT}`);

// Карта документов (для персистентности в памяти)
const docs = new Map<string, Y.Doc>();

// Обработка подключений
wss.on('connection', (ws, req) => {
  console.log('[Yjs WebSocket] New connection');
  
  setupWSConnection(ws, req, {
    // Callback для получения/создания документа
    docName: req.url?.slice(1) || 'default',
    
    // Callback для персистентности (опционально)
    gc: true // Включаем garbage collection для Yjs
  });
});

wss.on('error', (error) => {
  console.error('[Yjs WebSocket] Error:', error);
});

// Graceful shutdown
const shutdown = () => {
  console.log('[Yjs WebSocket] Shutting down...');
  
  wss.close(() => {
    console.log('[Yjs WebSocket] Closed');
    process.exit(0);
  });
  
  // Принудительное завершение через 5 секунд
  setTimeout(() => {
    console.log('[Yjs WebSocket] Forcing shutdown...');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

