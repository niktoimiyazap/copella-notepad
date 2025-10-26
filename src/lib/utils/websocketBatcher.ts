/**
 * Умный батчинг WebSocket сообщений с приоритизацией
 * Оптимизирован для мобильных устройств и медленных соединений
 */

interface QueuedMessage {
  message: any;
  priority: 'high' | 'normal' | 'low';
  timestamp: number;
}

type FlushCallback = (messages: any[]) => void;

export class WebSocketBatcher {
  private queue: QueuedMessage[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private flushCallback: FlushCallback;
  private isMobile: boolean;
  
  // Настройки батчинга в зависимости от устройства
  private config = {
    // Максимальное время ожидания перед отправкой
    maxWaitTime: 16, // ~60fps для десктопа
    maxWaitTimeMobile: 32, // ~30fps для мобильных
    // Максимальный размер батча
    maxBatchSize: 50,
    maxBatchSizeMobile: 20,
    // Приоритетные сообщения отправляются немедленно
    highPriorityDelay: 0,
  };

  constructor(flushCallback: FlushCallback) {
    this.flushCallback = flushCallback;
    
    // Детект мобильного устройства
    this.isMobile = this.detectMobile();
  }

  /**
   * Детект мобильного устройства
   */
  private detectMobile(): boolean {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.matchMedia('(max-width: 768px)').matches;
  }

  /**
   * Добавить сообщение в очередь
   */
  public enqueue(message: any, priority: 'high' | 'normal' | 'low' = 'normal'): void {
    this.queue.push({
      message,
      priority,
      timestamp: Date.now(),
    });

    // High priority сообщения отправляем немедленно
    if (priority === 'high') {
      this.flush();
      return;
    }

    // Проверяем размер батча
    const maxSize = this.isMobile ? this.config.maxBatchSizeMobile : this.config.maxBatchSize;
    if (this.queue.length >= maxSize) {
      this.flush();
      return;
    }

    // Устанавливаем таймер если его нет
    if (!this.flushTimer) {
      const delay = this.isMobile 
        ? this.config.maxWaitTimeMobile 
        : this.config.maxWaitTime;
      
      this.flushTimer = setTimeout(() => {
        this.flush();
      }, delay);
    }
  }

  /**
   * Немедленная отправка всех сообщений в очереди
   */
  public flush(): void {
    // Отменяем таймер
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Если очередь пустая, ничего не делаем
    if (this.queue.length === 0) {
      return;
    }

    // Сортируем по приоритету (high > normal > low)
    const priorityOrder = { high: 0, normal: 1, low: 2 };
    this.queue.sort((a, b) => {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Извлекаем сообщения из очереди
    const messages = this.queue.map(item => item.message);
    this.queue = [];

    // Отправляем через callback
    this.flushCallback(messages);
  }

  /**
   * Очистка
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    this.queue = [];
  }

  /**
   * Получить текущий размер очереди
   */
  public getQueueSize(): number {
    return this.queue.length;
  }
}

