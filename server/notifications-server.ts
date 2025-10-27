import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const PORT = process.env.NOTIFICATIONS_PORT || 3001;

// Типы уведомлений
export type NotificationType = 
  | 'invite:created'
  | 'invite:accepted'
  | 'approval:request'
  | 'approval:response'
  | 'participant:update'
  | 'ownership:transfer';

export interface NotificationMessage {
  type: NotificationType;
  roomId: string;
  data: any;
  timestamp: number;
}

// Храним соединения пользователей по комнатам
const roomConnections = new Map<string, Set<WebSocket>>();
const userRooms = new Map<WebSocket, Set<string>>();

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
  // Обрабатываем POST запросы для broadcast'а уведомлений
  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const notification: NotificationMessage = JSON.parse(body);
        broadcastToRoom(notification.roomId, notification);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request' }));
      }
    });
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// WebSocket сервер
const wss = new WebSocketServer({ server });

console.log(`[Notifications] 🔔 Server started on port ${PORT}`);

wss.on('connection', (ws: WebSocket) => {
  console.log('[Notifications] 👤 New connection');
  
  // Инициализируем Set комнат для этого пользователя
  userRooms.set(ws, new Set());

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Подписка на комнату
      if (data.type === 'subscribe' && data.roomId) {
        const roomId = data.roomId;
        
        // Добавляем пользователя в комнату
        if (!roomConnections.has(roomId)) {
          roomConnections.set(roomId, new Set());
        }
        roomConnections.get(roomId)!.add(ws);
        userRooms.get(ws)!.add(roomId);
        
        console.log(`[Notifications] ✅ User subscribed to room: ${roomId}`);
        
        // Отправляем подтверждение
        ws.send(JSON.stringify({
          type: 'subscribed',
          roomId,
          timestamp: Date.now()
        }));
      }
      
      // Отписка от комнаты
      else if (data.type === 'unsubscribe' && data.roomId) {
        const roomId = data.roomId;
        
        roomConnections.get(roomId)?.delete(ws);
        userRooms.get(ws)?.delete(roomId);
        
        console.log(`[Notifications] ❌ User unsubscribed from room: ${roomId}`);
      }
    } catch (error) {
      console.error('[Notifications] ❌ Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('[Notifications] 👋 Connection closed');
    
    // Удаляем пользователя из всех комнат
    const rooms = userRooms.get(ws);
    if (rooms) {
      rooms.forEach(roomId => {
        roomConnections.get(roomId)?.delete(ws);
      });
      userRooms.delete(ws);
    }
  });

  ws.on('error', (error) => {
    console.error('[Notifications] ❌ WebSocket error:', error);
  });
});

// Функция для отправки уведомления всем подписчикам комнаты
export function broadcastToRoom(roomId: string, notification: NotificationMessage) {
  const connections = roomConnections.get(roomId);
  
  if (!connections || connections.size === 0) {
    console.log(`[Notifications] 📭 No subscribers for room: ${roomId}`);
    return;
  }
  
  const message = JSON.stringify({
    ...notification,
    timestamp: Date.now()
  });
  
  let sentCount = 0;
  connections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
      sentCount++;
    }
  });
  
  console.log(`[Notifications] 📨 Sent notification to ${sentCount} users in room: ${roomId}`);
}

// Запускаем HTTP сервер
server.listen(PORT, () => {
  console.log(`[Notifications] 🚀 HTTP server started on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Notifications] 🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    wss.close(() => {
      console.log('[Notifications] ✅ Server closed');
      process.exit(0);
    });
  });
});
