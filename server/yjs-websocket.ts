/**
 * YJS WebSocket сервер с персистентностью в PostgreSQL
 * Использует y-websocket protocol для совместимости с клиентом
 * Работает на порту 1234
 */

import { WebSocketServer } from 'ws';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { loadYjsDocument, saveYjsUpdate } from './yjs-persistence';

const PORT = process.env.YJS_WS_PORT || 1234;

// Кеш активных документов в памяти
const docs = new Map<string, WSSharedDoc>();

// Message types
const messageSync = 0;
const messageAwareness = 1;

class WSSharedDoc extends Y.Doc {
  name: string;
  conns: Map<any, Set<number>>;
  awareness: awarenessProtocol.Awareness;

  constructor(name: string) {
    super();
    this.name = name;
    this.conns = new Map();
    this.awareness = new awarenessProtocol.Awareness(this);
  }
}

// Создаем WebSocket сервер
const wss = new WebSocketServer({ 
  port: Number(PORT),
  perMessageDeflate: {
    zlibDeflateOptions: { chunkSize: 1024, memLevel: 8, level: 6 },
    zlibInflateOptions: { chunkSize: 10 * 1024 },
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
async function getOrCreateDoc(noteId: string): Promise<WSSharedDoc> {
  let doc = docs.get(noteId);
  
  if (!doc) {
    console.log(`[Yjs] Loading document from DB: ${noteId}`);
    
    // Загружаем из БД
    const loadedDoc = await loadYjsDocument(noteId);
    
    // Создаем WSSharedDoc и копируем состояние
    doc = new WSSharedDoc(noteId);
    const state = Y.encodeStateAsUpdate(loadedDoc);
    Y.applyUpdate(doc, state);
    
    docs.set(noteId, doc);
    
    // Подписываемся на обновления для сохранения в БД
    doc.on('update', (update: Uint8Array) => {
      saveYjsUpdate(noteId, update).catch(err => 
        console.error(`[Yjs] Error saving update for ${noteId}:`, err)
      );
    });
    
    // Очищаем через 10 минут неактивности
    setTimeout(() => {
      if (doc && doc.conns.size === 0) {
        docs.delete(noteId);
        console.log(`[Yjs] Removed inactive document: ${noteId}`);
      }
    }, 10 * 60 * 1000);
  }
  
  return doc;
}

// Обработка подключений с правильным y-websocket протоколом
wss.on('connection', async (ws: any, req) => {
  const noteId = req.url?.slice(1) || 'default';
  console.log(`[Yjs] Client connected to note: ${noteId}`);
  
  ws.binaryType = 'arraybuffer';
  const doc = await getOrCreateDoc(noteId);
  
  doc.conns.set(ws, new Set());
  
  // Отправляем sync step 1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  ws.send(encoding.toUint8Array(encoder));
  
  // Обработка сообщений
  ws.on('message', (message: ArrayBuffer) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(message));
      const messageType = decoding.readVarUint(decoder);
      
      switch (messageType) {
        case messageSync:
          const responseEncoder = encoding.createEncoder();
          encoding.writeVarUint(responseEncoder, messageSync);
          syncProtocol.readSyncMessage(decoder, responseEncoder, doc, ws);
          if (encoding.length(responseEncoder) > 1) {
            ws.send(encoding.toUint8Array(responseEncoder));
          }
          break;
        case messageAwareness:
          awarenessProtocol.applyAwarenessUpdate(doc.awareness, decoding.readVarUint8Array(decoder), ws);
          break;
      }
    } catch (err) {
      console.error('[Yjs] Error processing message:', err);
    }
  });
  
  ws.on('close', () => {
    doc.conns.delete(ws);
    awarenessProtocol.removeAwarenessStates(doc.awareness, Array.from(doc.conns.keys()), ws);
    console.log(`[Yjs] Client disconnected from note: ${noteId}`);
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

