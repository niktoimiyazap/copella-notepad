/**
 * Серверный батчинг для оптимизации WebSocket broadcast
 * Собирает обновления и отправляет их пакетами
 */

interface QueuedBroadcast {
  roomId: string;
  message: any;
  excludeUserId?: string;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
}

type BroadcastCallback = (roomId: string, messages: any[], excludeUserId?: string) => void;

export class ServerBatcher {
  private queue: Map<string, QueuedBroadcast[]> = new Map();
  private flushTimers: Map<string, NodeJS.Timeout> = new Map();
  private broadcastCallback: BroadcastCallback;
  
  // Настройки батчинга
  private config = {
    maxWaitTime: 50, // 50ms оптимально для мобильных устройств (как в Figma)
    maxBatchSize: 50, // Максимум 50 обновлений в одном батче
  };

  constructor(broadcastCallback: BroadcastCallback) {
    this.broadcastCallback = broadcastCallback;
  }

  /**
   * Добавить сообщение в очередь для room
   */
  public enqueue(
    roomId: string,
    message: any,
    excludeUserId?: string,
    priority: 'high' | 'normal' | 'low' = 'normal'
  ): void {
    // Получаем или создаем очередь для room
    let roomQueue = this.queue.get(roomId);
    if (!roomQueue) {
      roomQueue = [];
      this.queue.set(roomId, roomQueue);
    }

    roomQueue.push({
      roomId,
      message,
      excludeUserId,
      priority,
      timestamp: Date.now(),
    });

    // High priority сообщения отправляем немедленно
    if (priority === 'high') {
      this.flushRoom(roomId);
      return;
    }

    // Проверяем размер батча для этой room
    if (roomQueue.length >= this.config.maxBatchSize) {
      this.flushRoom(roomId);
      return;
    }

    // Устанавливаем таймер если его нет
    if (!this.flushTimers.has(roomId)) {
      const timer = setTimeout(() => {
        this.flushRoom(roomId);
      }, this.config.maxWaitTime);
      
      this.flushTimers.set(roomId, timer);
    }
  }

  /**
   * Немедленная отправка всех сообщений для конкретной room
   */
  public flushRoom(roomId: string): void {
    // Отменяем таймер
    const timer = this.flushTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.flushTimers.delete(roomId);
    }

    // Получаем очередь
    const roomQueue = this.queue.get(roomId);
    if (!roomQueue || roomQueue.length === 0) {
      return;
    }

    // Сортируем по приоритету
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    roomQueue.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Группируем по excludeUserId для оптимизации
    const grouped = new Map<string | undefined, any[]>();
    for (const item of roomQueue) {
      const key = item.excludeUserId;
      let messages = grouped.get(key);
      if (!messages) {
        messages = [];
        grouped.set(key, messages);
      }
      messages.push(item.message);
    }

    // Отправляем каждую группу
    for (const [excludeUserId, messages] of grouped.entries()) {
      this.broadcastCallback(roomId, messages, excludeUserId);
    }

    // Очищаем очередь
    this.queue.delete(roomId);
  }

  /**
   * Немедленная отправка всех сообщений для всех rooms
   */
  public flushAll(): void {
    const roomIds = Array.from(this.queue.keys());
    for (const roomId of roomIds) {
      this.flushRoom(roomId);
    }
  }

  /**
   * Очистка
   */
  public destroy(): void {
    // Флашим все сообщения перед уничтожением
    this.flushAll();
    
    // Очищаем таймеры
    for (const timer of this.flushTimers.values()) {
      clearTimeout(timer);
    }
    this.flushTimers.clear();
    this.queue.clear();
  }

  /**
   * Получить общий размер очередей
   */
  public getTotalQueueSize(): number {
    let total = 0;
    for (const queue of this.queue.values()) {
      total += queue.length;
    }
    return total;
  }
}

