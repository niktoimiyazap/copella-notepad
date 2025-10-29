/**
 * YJS WebSocket сервер с персистентностью в PostgreSQL
 * Работает на порту 1234
 */

import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import { loadYjsDocument, saveYjsUpdate } from './yjs-persistence';

const PORT = process.env.YJS_WS_PORT || 1234;

// Кеш активных документов в памяти (для производительности)
const docs = new Map<string, Y.Doc>();

// Создаем WebSocket сервер с адаптивным сжатием
const wss = new WebSocketServer({ 
  port: Number(PORT),
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 8,
      level: 6
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 15,
    concurrencyLimit: 10,
    threshold: 256
  }
});

console.log(`[Yjs WebSocket] 🚀 Server started on port ${PORT} with PostgreSQL persistence`);

/**
 * Получает или создает YJS документ для заметки
 */
async function getOrCreateDoc(noteId: string): Promise<Y.Doc> {
  let ydoc = docs.get(noteId);
  
  if (!ydoc) {
    console.log(`[Yjs] Loading document from DB: ${noteId}`);
    ydoc = await loadYjsDocument(noteId);
    docs.set(noteId, ydoc);
    
    // Подписываемся на обновления для сохранения в БД
    ydoc.on('update', (update: Uint8Array) => {
      // Сохраняем асинхронно, не блокируя синхронизацию
      saveYjsUpdate(noteId, update).catch(err => 
        console.error(`[Yjs] Error saving update for ${noteId}:`, err)
      );
    });
    
    // Очищаем документ из памяти после 10 минут неактивности
    setTimeout(() => {
      if (ydoc && ydoc.conns?.size === 0) {
        docs.delete(noteId);
        console.log(`[Yjs] Removed inactive document from memory: ${noteId}`);
      }
    }, 10 * 60 * 1000);
  }
  
  return ydoc;
}

// Обработка подключений (упрощенная версия без @y/websocket-server)
wss.on('connection', async (ws, req) => {
  const noteId = req.url?.slice(1) || 'default';
  console.log(`[Yjs] Client connected to note: ${noteId}`);
  
  try {
    const ydoc = await getOrCreateDoc(noteId);
    
    // Отправляем полное состояние документа клиенту
    const syncMessage = Y.encodeStateAsUpdate(ydoc);
    ws.send(syncMessage);
    
    // Обрабатываем входящие обновления от клиента
    ws.on('message', (data: Buffer) => {
      try {
        // Применяем обновление к документу (автоматически вызовет событие 'update')
        Y.applyUpdate(ydoc, new Uint8Array(data));
        
        // Рассылаем обновление всем подключенным клиентам
        wss.clients.forEach(client => {
          if (client !== ws && client.readyState === 1) {
            client.send(data);
          }
        });
      } catch (error) {
        console.error('[Yjs] Error processing update:', error);
      }
    });
    
    ws.on('close', () => {
      console.log(`[Yjs] Client disconnected from note: ${noteId}`);
    });
    
  } catch (error) {
    console.error(`[Yjs] Error setting up connection for ${noteId}:`, error);
    ws.close();
  }
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

