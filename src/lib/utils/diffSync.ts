// Простая и надежная синхронизация с Yjs + WebSocket (без WebRTC)
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';
import { env } from '$env/dynamic/public';

export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'offline';

export interface CursorInfo {
  userId: string;
  username?: string;
  avatarUrl?: string;
  position: number;
  selection?: { start: number; end: number };
  color: string;
  timestamp: number;
  noteId?: string;
  connectionQuality?: ConnectionQuality;
  latency?: number;
}

interface DiffSyncOptions {
  noteId: string;
  roomId: string;
  userId: string;
  username?: string;
  avatarUrl?: string;
  onContentUpdate: (content: string) => void;
  onCursorsUpdate: (cursors: Map<string, CursorInfo>) => void;
  onSyncStatus: (status: 'connected' | 'syncing' | 'saved' | 'error') => void;
}

export class DiffSyncManager {
  private noteId: string;
  private roomId: string;
  private userId: string;
  private username?: string;
  private avatarUrl?: string;
  
  private ydoc: Y.Doc;
  private ytext: Y.Text;
  private undoManager: Y.UndoManager;
  
  private wsProvider: WebsocketProvider | null = null;
  private indexeddbProvider: IndexeddbPersistence | null = null;
  
  private isActive = true;
  private isInitialized = false;
  
  // Callbacks
  private onContentUpdate: (content: string) => void;
  private onCursorsUpdate: (cursors: Map<string, CursorInfo>) => void;
  private onSyncStatus: (status: 'connected' | 'syncing' | 'saved' | 'error') => void;
  
  // Курсоры других пользователей
  private remoteCursors = new Map<string, CursorInfo>();
  
  // Цвета для пользователей
  private userColors = new Map<string, string>();
  private colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
    '#E67E22', '#16A085', '#27AE60', '#2980B9', '#8E44AD'
  ];
  
  // Адаптивная оптимизация в зависимости от качества соединения
  private lastCursorUpdate = 0;
  private cursorThrottle = 30; // Уменьшено с 50 до 30мс для более быстрого отклика
  
  // Защита от зацикливания
  private updateInProgress = false;
  
  // Дебоунсинг для контента (адаптивный)
  private contentUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingContent: string | null = null;
  private contentDebounce = 20; // Уменьшено с 80 до 20мс для более быстрого ввода!
  
  // Определение качества соединения
  private connectionQuality: ConnectionQuality = 'good';
  private latencyHistory: number[] = [];
  private lastSyncTime = 0;

  constructor(options: DiffSyncOptions) {
    this.noteId = options.noteId;
    this.roomId = options.roomId;
    this.userId = options.userId;
    this.username = options.username;
    this.avatarUrl = options.avatarUrl;
    this.onContentUpdate = options.onContentUpdate;
    this.onCursorsUpdate = options.onCursorsUpdate;
    this.onSyncStatus = options.onSyncStatus;

    // Создаем Yjs документ
    this.ydoc = new Y.Doc();
    this.ytext = this.ydoc.getText('content');

    // IndexedDB для offline и быстрой загрузки
    if (typeof window !== 'undefined') {
      this.indexeddbProvider = new IndexeddbPersistence(`copella-note-${this.noteId}`, this.ydoc);
      
      this.indexeddbProvider.once('synced', () => {
        // Сразу показываем cached контент
        const content = this.ytext.toString();
        if (content) {
          this.onContentUpdate(content);
        }
      });
    }

    // WebSocket провайдер для синхронизации
    if (typeof window !== 'undefined') {
      try {
        // URL WebSocket сервера (должен быть ПОЛНЫЙ URL с протоколом!)
        const wsBaseUrl = env.PUBLIC_WS_URL || 'ws://localhost:1234';
        
        // Уникальная комната для каждой заметки
        const roomName = `copella-room-${this.roomId}-note-${this.noteId}`;
        
        // ВАЖНО: serverUrl ДОЛЖЕН содержать протокол (ws:// или wss://)
        // Иначе браузер воспринимает его как относительный путь!
        // y-websocket формирует финальный URL как: serverUrl + '/' + roomName
        let serverUrl = wsBaseUrl;
        
        // Убеждаемся что URL НЕ заканчивается на слеш (y-websocket добавит его сам)
        if (serverUrl.endsWith('/')) {
          serverUrl = serverUrl.slice(0, -1);
        }
        
        this.wsProvider = new WebsocketProvider(
          serverUrl, // ПОЛНЫЙ URL с протоколом: wss://ws.copella.live или ws://localhost:1234
          roomName,  // Имя комнаты (будет добавлено как /{roomName})
          this.ydoc,
          {
            // Параметры подключения для максимальной производительности
            connect: true,
            awareness: this.ydoc.awareness,
            params: {
              // Опционально: можно передавать token для авторизации
            },
            // Быстрое переподключение (уменьшено с 5000 до 2500мс)
            maxBackoffTime: 2500,
            // Быстрое восстановление соединения
            resyncInterval: 3000,
            // Отключаем дополнительные задержки для максимальной скорости
            disableBc: true, // Отключаем BroadcastChannel (дублирование через tabs)
          }
        );

        // Обработчики событий
        this.wsProvider.on('status', ({ status }: { status: string }) => {
          if (status === 'connected') {
            this.isInitialized = true;
            this.onSyncStatus('connected');
          } else if (status === 'disconnected') {
            this.onSyncStatus('error');
          }
        });

        this.wsProvider.on('sync', (isSynced: boolean) => {
          if (isSynced) {
            this.isInitialized = true;
            this.onSyncStatus('connected');
          }
        });

        // Устанавливаем локальное состояние awareness (наш пользователь)
        const userColor = this.getUserColor(this.userId);
        this.wsProvider.awareness.setLocalStateField('user', {
          userId: this.userId,
          username: this.username || 'User',
          avatarUrl: this.avatarUrl,
          color: userColor,
          noteId: this.noteId,
          connectionQuality: this.connectionQuality
        });

        // Слушаем изменения awareness (курсоры других пользователей)
        this.wsProvider.awareness.on('change', () => {
          this.handleAwarenessChange();
        });

      } catch (error) {
        this.onSyncStatus('error');
      }
    }

    // Создаем Undo Manager
    this.undoManager = new Y.UndoManager(this.ytext, {
      trackedOrigins: new Set(['local'])
    });

    // Подписываемся на изменения Yjs документа
    this.ytext.observe((event) => {
      if (!this.isInitialized) return;
      
      const transaction = event.transaction;
      const origin = transaction.origin;
      
      // Игнорируем локальные изменения (уже в редакторе)
      if (origin === 'local') {
        return;
      }
      
      // Измеряем latency для адаптации
      this.measureLatency();
      
      // ОПТИМИЗАЦИЯ: Применяем удаленные изменения немедленно без задержек
      // Yjs CRDT гарантирует правильное разрешение конфликтов
      this.onSyncStatus('syncing');
      
      const content = this.ytext.toString();
      this.onContentUpdate(content);
      
      // Быстрее возвращаемся в статус connected (20мс для минимальной задержки UI)
      setTimeout(() => {
        if (this.isActive) {
          this.onSyncStatus('connected');
        }
      }, 20);
      
      // Обновляем курсоры после изменения документа
      this.handleAwarenessChange();
    });
    
    // Отмечаем как инициализированный
    this.isInitialized = true;
  }

  /**
   * Измерение latency и адаптация throttle/debounce
   */
  private measureLatency() {
    const now = Date.now();
    if (this.lastSyncTime > 0) {
      const latency = now - this.lastSyncTime;
      this.latencyHistory.push(latency);
      
      // Храним только последние 10 измерений
      if (this.latencyHistory.length > 10) {
        this.latencyHistory.shift();
      }
      
      // Вычисляем средний latency
      const avgLatency = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;
      
      // Определяем качество соединения и адаптируем параметры
      let newQuality: ConnectionQuality;
      if (avgLatency < 100) {
        // Отличное соединение (WiFi, 4G+) - максимальная скорость!
        newQuality = 'excellent';
        this.contentDebounce = 10; // Супер быстрый ввод!
        this.cursorThrottle = 20;
      } else if (avgLatency < 300) {
        // Хорошее соединение (хороший 4G, 3G+)
        newQuality = 'good';
        this.contentDebounce = 20; // Быстрый ввод
        this.cursorThrottle = 30;
      } else if (avgLatency < 800) {
        // Слабое соединение (3G)
        newQuality = 'poor';
        this.contentDebounce = 100; // Увеличиваем для экономии трафика
        this.cursorThrottle = 80;
      } else {
        // Очень слабое соединение (2G, Edge)
        newQuality = 'offline';
        this.contentDebounce = 250;
        this.cursorThrottle = 150;
      }
      
      // Обновляем качество соединения в awareness если изменилось
      if (newQuality !== this.connectionQuality) {
        this.connectionQuality = newQuality;
        if (this.wsProvider) {
          this.wsProvider.awareness.setLocalStateField('user', {
            ...this.wsProvider.awareness.getLocalState()?.user,
            connectionQuality: this.connectionQuality
          });
        }
      }
    }
    this.lastSyncTime = now;
  }

  /**
   * Обработка изменений Awareness (курсоры других пользователей)
   */
  private handleAwarenessChange() {
    if (!this.wsProvider) return;
    
    const states = this.wsProvider.awareness.getStates();
    const localClientId = this.wsProvider.awareness.clientID;
    
    // Очищаем старые курсоры
    this.remoteCursors.clear();
    
    // Обрабатываем состояния всех клиентов
    states.forEach((state, clientId) => {
      // Пропускаем свой собственный курсор
      if (clientId === localClientId) return;
      
      const user = state.user;
      const cursor = state.cursor;
      
      if (!user || !cursor) return;
      
      // Фильтруем только курсоры для этой заметки
      if (user.noteId !== this.noteId) return;
      
      this.remoteCursors.set(user.userId, {
        userId: user.userId,
        username: user.username,
        avatarUrl: user.avatarUrl,
        position: cursor.position || 0,
        selection: cursor.selection,
        color: user.color,
        timestamp: Date.now(),
        noteId: this.noteId,
        connectionQuality: user.connectionQuality || 'good'
      });
    });
    
    this.onCursorsUpdate(new Map(this.remoteCursors));
  }

  /**
   * Хеширование для стабильных цветов
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Получение стабильного цвета для пользователя
   */
  private getUserColor(userId: string): string {
    if (!this.userColors.has(userId)) {
      const colorIndex = this.hashUserId(userId) % this.colorPalette.length;
      this.userColors.set(userId, this.colorPalette[colorIndex]);
    }
    return this.userColors.get(userId)!;
  }

  /**
   * Обновление контента (когда пользователь печатает)
   * КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Вычисляем дельты вместо замены всего текста
   */
  public updateContent(newContent: string) {
    if (!this.isActive || this.updateInProgress) return;
    
    const currentContent = this.ytext.toString();
    
    // Игнорируем если контент не изменился
    if (newContent === currentContent) {
      return;
    }
    
    // Дебоунсинг: откладываем обновление для экономии трафика на 3G
    // Это существенно уменьшает количество операций при быстром наборе
    if (this.contentUpdateTimeout) {
      clearTimeout(this.contentUpdateTimeout);
    }
    
    this.pendingContent = newContent;
    
    this.contentUpdateTimeout = setTimeout(() => {
      this.applyContentUpdate();
    }, this.contentDebounce);
  }
  
  /**
   * Применение обновления контента с вычислением дельт
   */
  private applyContentUpdate() {
    if (!this.isActive || this.updateInProgress || !this.pendingContent) return;
    
    const newContent = this.pendingContent;
    this.pendingContent = null;
    
    const currentContent = this.ytext.toString();
    
    // Игнорируем если контент не изменился
    if (newContent === currentContent) {
      return;
    }
    
    this.updateInProgress = true;
    
    try {
      this.onSyncStatus('syncing');
      
      // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Вычисляем минимальные изменения вместо замены всего текста
      // Это позволяет Yjs CRDT правильно разрешать конфликты при одновременном редактировании
      
      const delta = this.computeTextDelta(currentContent, newContent);
      
      if (delta.length > 0) {
        this.ydoc.transact(() => {
          // Применяем все дельты в одной транзакции
          for (const op of delta) {
            if (op.type === 'delete') {
              this.ytext.delete(op.index, op.length);
            } else if (op.type === 'insert') {
              this.ytext.insert(op.index, op.text);
            }
          }
        }, 'local');
      }
      
      setTimeout(() => {
        if (this.isActive) {
          this.onSyncStatus('connected');
        }
      }, 30); // Быстрее возвращаемся в статус connected
    } finally {
      this.updateInProgress = false;
    }
  }
  
  /**
   * Вычисление минимальных изменений между двумя строками
   * Использует простой алгоритм diff
   */
  private computeTextDelta(oldText: string, newText: string): Array<{type: 'insert' | 'delete', index: number, length?: number, text?: string}> {
    const operations: Array<{type: 'insert' | 'delete', index: number, length?: number, text?: string}> = [];
    
    // Находим общий префикс
    let prefixLength = 0;
    while (prefixLength < oldText.length && prefixLength < newText.length && oldText[prefixLength] === newText[prefixLength]) {
      prefixLength++;
    }
    
    // Находим общий суффикс
    let suffixLength = 0;
    while (
      suffixLength < oldText.length - prefixLength && 
      suffixLength < newText.length - prefixLength && 
      oldText[oldText.length - 1 - suffixLength] === newText[newText.length - 1 - suffixLength]
    ) {
      suffixLength++;
    }
    
    // Середина - это то что изменилось
    const oldMiddle = oldText.substring(prefixLength, oldText.length - suffixLength);
    const newMiddle = newText.substring(prefixLength, newText.length - suffixLength);
    
    // Если середина изменилась, создаем операции
    if (oldMiddle.length > 0) {
      // Удаляем старую середину
      operations.push({
        type: 'delete',
        index: prefixLength,
        length: oldMiddle.length
      });
    }
    
    if (newMiddle.length > 0) {
      // Вставляем новую середину
      operations.push({
        type: 'insert',
        index: prefixLength,
        text: newMiddle
      });
    }
    
    return operations;
  }

  /**
   * Обновление позиции курсора
   */
  public updateCursor(position: number, selection?: { start: number; end: number }) {
    if (!this.isActive || !this.wsProvider) return;
    
    // Throttling
    const now = Date.now();
    if (now - this.lastCursorUpdate < this.cursorThrottle) {
      return;
    }
    this.lastCursorUpdate = now;
    
    // Если position === -1, убираем курсор (blur)
    if (position === -1) {
      this.wsProvider.awareness.setLocalStateField('cursor', null);
      return;
    }
    
    // Обновляем локальное состояние awareness
    this.wsProvider.awareness.setLocalStateField('cursor', {
      position,
      selection,
      timestamp: now
    });
  }

  /**
   * Undo
   */
  public undo(): boolean {
    if (!this.isActive) return false;
    const result = this.undoManager.undo();
    return result !== null;
  }

  /**
   * Redo
   */
  public redo(): boolean {
    if (!this.isActive) return false;
    const result = this.undoManager.redo();
    return result !== null;
  }

  /**
   * Можно ли отменить?
   */
  public canUndo(): boolean {
    return this.undoManager.canUndo();
  }

  /**
   * Можно ли вернуть?
   */
  public canRedo(): boolean {
    return this.undoManager.canRedo();
  }

  /**
   * Получить текущий контент
   */
  public getContent(): string {
    return this.ytext.toString();
  }

  /**
   * Очистить историю Undo/Redo
   */
  public clearUndoHistory(): void {
    this.undoManager.clear();
  }

  /**
   * Уничтожить менеджер
   */
  public destroy() {
    this.isActive = false;
    
    // Очищаем таймеры
    if (this.contentUpdateTimeout) {
      clearTimeout(this.contentUpdateTimeout);
      this.contentUpdateTimeout = null;
    }
    
    // Убираем локальное состояние awareness
    if (this.wsProvider) {
      this.wsProvider.awareness.setLocalState(null);
      this.wsProvider.destroy();
      this.wsProvider = null;
    }
    
    // Закрываем IndexedDB
    if (this.indexeddbProvider) {
      this.indexeddbProvider.destroy();
      this.indexeddbProvider = null;
    }
    
    // Очищаем Undo Manager
    this.undoManager.clear();
    this.undoManager.destroy();
    
    // Уничтожаем документ
    this.ydoc.destroy();
    
    this.remoteCursors.clear();
    this.pendingContent = null;
  }
}
