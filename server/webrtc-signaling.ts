/**
 * Простой Signaling сервер для y-webrtc
 * Просто пересылает сообщения между peers в одной комнате
 */

import { WebSocketServer, WebSocket } from 'ws';

const PORT = 4444;

// Комнаты: Map<roomName, Set<WebSocket>>
const rooms = new Map<string, Set<WebSocket>>();

const wss = new WebSocketServer({ 
  port: PORT,
  perMessageDeflate: false // Отключаем сжатие для скорости
});

console.log(`[WebRTC Signaling] 🚀 Server started on port ${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('[WebRTC Signaling] New connection');
  
  const subscribedRooms = new Set<string>();

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'subscribe':
          // Подписка на комнату
          const topics = Array.isArray(message.topics) ? message.topics : [message.topics];
          
          topics.forEach((topic: string) => {
            if (!rooms.has(topic)) {
              rooms.set(topic, new Set());
            }
            rooms.get(topic)!.add(ws);
            subscribedRooms.add(topic);
          });
          
          console.log(`[WebRTC Signaling] Client subscribed to rooms: ${topics.join(', ')}`);
          break;
          
        case 'unsubscribe':
          // Отписка от комнаты
          const unsubTopics = Array.isArray(message.topics) ? message.topics : [message.topics];
          
          unsubTopics.forEach((topic: string) => {
            const room = rooms.get(topic);
            if (room) {
              room.delete(ws);
              subscribedRooms.delete(topic);
              
              // Удаляем пустую комнату
              if (room.size === 0) {
                rooms.delete(topic);
              }
            }
          });
          
          console.log(`[WebRTC Signaling] Client unsubscribed from rooms: ${unsubTopics.join(', ')}`);
          break;
          
        case 'publish':
          // Пересылка сообщения всем в комнате (кроме отправителя)
          const topic = message.topic;
          const room = rooms.get(topic);
          
          if (room) {
            const payload = JSON.stringify(message);
            let sentCount = 0;
            
            room.forEach((client) => {
              // Не отправляем обратно отправителю
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(payload);
                sentCount++;
              }
            });
            
            // Логируем только раз в 10 сообщений для производительности
            if (Math.random() < 0.1) {
              console.log(`[WebRTC Signaling] Forwarded message in room "${topic}" to ${sentCount} peers`);
            }
          }
          break;
          
        case 'ping':
          // Ответ на ping
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'pong' }));
          }
          break;
      }
    } catch (error) {
      console.error('[WebRTC Signaling] Error handling message:', error);
    }
  });

  ws.on('close', () => {
    // Удаляем из всех комнат при отключении
    subscribedRooms.forEach((topic) => {
      const room = rooms.get(topic);
      if (room) {
        room.delete(ws);
        
        // Удаляем пустую комнату
        if (room.size === 0) {
          rooms.delete(topic);
        }
      }
    });
    
    console.log(`[WebRTC Signaling] Client disconnected (was in ${subscribedRooms.size} rooms)`);
  });

  ws.on('error', (error) => {
    console.error('[WebRTC Signaling] WebSocket error:', error);
  });
});

// Периодически чистим пустые комнаты
setInterval(() => {
  let cleaned = 0;
  rooms.forEach((clients, roomName) => {
    if (clients.size === 0) {
      rooms.delete(roomName);
      cleaned++;
    }
  });
  
  if (cleaned > 0) {
    console.log(`[WebRTC Signaling] Cleaned ${cleaned} empty rooms. Active rooms: ${rooms.size}`);
  }
}, 60000); // Каждую минуту

// Статистика каждые 5 минут
setInterval(() => {
  const totalPeers = Array.from(rooms.values()).reduce((sum, room) => sum + room.size, 0);
  console.log(`[WebRTC Signaling] 📊 Stats: ${rooms.size} rooms, ${totalPeers} total peers`);
}, 300000);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[WebRTC Signaling] Shutting down...');
  wss.close(() => {
    console.log('[WebRTC Signaling] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[WebRTC Signaling] Shutting down...');
  wss.close(() => {
    console.log('[WebRTC Signaling] Server closed');
    process.exit(0);
  });
});

