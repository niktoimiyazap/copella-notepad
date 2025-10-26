// Real-time collaborative editing client с использованием Yjs (CRDT)
import * as Y from 'yjs';
import { Awareness } from 'y-protocols/awareness';
import { IndexeddbPersistence } from 'y-indexeddb';
import { websocketClient } from '../websocket';
import { WebSocketBatcher } from './websocketBatcher';

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
  connectionQuality?: ConnectionQuality; // Качество соединения пользователя
  latency?: number; // RTT в миллисекундах
}

// Детект мобильного устройства
const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.matchMedia('(max-width: 768px)').matches;
};

interface DiffSyncOptions {
  noteId: string;
  roomId: string;
  onContentUpdate: (content: string) => void;
  onCursorsUpdate: (cursors: Map<string, CursorInfo>) => void;
  onSyncStatus: (status: 'connected' | 'syncing' | 'saved' | 'error') => void;
}

export class DiffSyncManager {
  private noteId: string;
  private roomId: string;
  private ydoc: Y.Doc;
  private ytext: Y.Text;
  private undoManager: Y.UndoManager;
  private awareness: Awareness;
  private indexeddbProvider: IndexeddbPersistence | null = null;
  private isActive = true;
  private isSyncing = false;
  private isInitialized = false;
  
  // Callbacks
  private onContentUpdate: (content: string) => void;
  private onCursorsUpdate: (cursors: Map<string, CursorInfo>) => void;
  private onSyncStatus: (status: 'connected' | 'syncing' | 'saved' | 'error') => void;
  
  // Курсоры других пользователей
  private remoteCursors = new Map<string, CursorInfo>();
  
  // WebSocket
  private messageHandler: ((message: any) => void) | null = null;

  // Батчинг для обновлений контента (адаптивный для мобильных)
  private pendingContentUpdate: string | null = null;
  private contentUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
  private isMobile: boolean = isMobileDevice();
  
  // Батчинг для Yjs updates (группируем несколько изменений в один update)
  private pendingUpdates: Uint8Array[] = [];
  private updateBatchTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly UPDATE_BATCH_DELAY = 50; // 50ms задержка для батчинга updates

  // Защита от зацикливания (флаг обновления)
  private updateInProgress = false;
  
  // Батчинг для cursor updates (только для мобильных)
  private cursorBatcher: WebSocketBatcher | null = null;
  private lastCursorUpdate: number = 0;
  private cursorThrottle: number;
  
  // Отслеживание последней позиции курсора для предотвращения дублирующих обновлений
  private lastCursorPosition: number = -1;
  private lastCursorSelection: { start: number; end: number } | undefined = undefined;
  
  // Throttling для awareness updates
  private lastAwarenessUpdate: number = 0;
  private awarenessThrottle: number = 50; // 50ms между обновлениями (оптимально для курсоров, как в Figma)
  private pendingAwarenessUpdate: ReturnType<typeof setTimeout> | null = null;

  // Мониторинг качества соединения
  private pingStartTime: number = 0;
  private latencyHistory: number[] = []; // История последних 10 измерений
  private readonly MAX_LATENCY_HISTORY = 10;
  private currentLatency: number = 0;
  private connectionQuality: ConnectionQuality = 'excellent';
  private latencyCheckInterval: ReturnType<typeof setInterval> | null = null;

  // Цвета для пользователей
  private userColors = new Map<string, string>();
  private colorPalette = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788',
    '#E74C3C', '#3498DB', '#9B59B6', '#1ABC9C', '#F39C12',
    '#E67E22', '#16A085', '#27AE60', '#2980B9', '#8E44AD'
  ];

  constructor(options: DiffSyncOptions) {
    this.noteId = options.noteId;
    this.roomId = options.roomId;
    this.onContentUpdate = options.onContentUpdate;
    this.onCursorsUpdate = options.onCursorsUpdate;
    this.onSyncStatus = options.onSyncStatus;

    // Адаптивный throttle для курсора
    // На мобильных: 100ms = 10 обновлений в секунду (достаточно для отображения курсора)
    // На десктопе: 50ms = 20 обновлений в секунду (оптимально для real-time курсоров, как в Figma)
    this.cursorThrottle = this.isMobile ? 100 : 50;

    // Создаем батчер для cursor updates (только для мобильных)
    if (this.isMobile) {
      this.cursorBatcher = new WebSocketBatcher((messages) => {
        // Отправляем только последнее обновление курсора из батча
        const lastCursor = messages[messages.length - 1];
        if (lastCursor && websocketClient) {
          websocketClient.send(lastCursor);
        }
      });
    }

    // Создаем Yjs документ
    this.ydoc = new Y.Doc();
    this.ytext = this.ydoc.getText('content');

    // Создаем Awareness для синхронизации курсоров и состояния пользователей
    this.awareness = new Awareness(this.ydoc);
    
    // Инициализируем IndexedDB для offline-first и мгновенной загрузки
    if (typeof window !== 'undefined') {
      this.indexeddbProvider = new IndexeddbPersistence(`copella-note-${this.noteId}`, this.ydoc);
    }

    // Создаем Undo Manager с умными настройками
    this.undoManager = new Y.UndoManager(this.ytext, {
      trackedOrigins: new Set(['local']), // Отменяем только локальные изменения
      captureTimeout: this.isMobile ? 800 : 500 // Больше времени для группировки на мобильных
    });

    // Подписываемся на изменения в Yjs документе
    // ВАЖНО: вызываем callback только для удаленных изменений (origin !== 'local')
    this.ytext.observe((event) => {
      if (this.isInitialized) {
        // Проверяем откуда пришло изменение
        const transaction = event.transaction;
        const origin = transaction.origin;
        
        // Игнорируем локальные изменения - они уже в редакторе
        if (origin === 'local') {
          return;
        }
        
        // Применяем только удаленные изменения
        const content = this.ytext.toString();
        this.onContentUpdate(content);
        
        // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Обновляем курсоры после изменения документа
        // Это пересчитает абсолютные позиции из относительных
        this.handleAwarenessChange();
      }
    });

    // Подписываемся на updates для отправки на сервер
    this.ydoc.on('update', (update: Uint8Array, origin: any) => {
      // Не отправляем updates которые пришли с сервера (origin === 'server')
      if (origin !== 'server' && this.isInitialized) {
        this.sendUpdate(update);
      }
    });
    
    // Подписываемся на изменения Awareness для синхронизации курсоров
    this.awareness.on('change', () => {
      this.handleAwarenessChange();
    });
    
    // Подписываемся на awareness updates для отправки на сервер
    this.awareness.on('update', ({ added, updated, removed }: any) => {
      // Отправляем awareness update только если это локальное изменение
      const changedClients = [...added, ...updated, ...removed];
      if (changedClients.includes(this.awareness.clientID)) {
        this.sendAwarenessUpdate();
      }
    });

    this.initialize();
  }

  /**
   * Инициализация WebSocket соединения
   */
  private async initialize() {
    try {
      if (!websocketClient) {
        throw new Error('WebSocket client not available');
      }
      
      // Подписываемся на сообщения для Yjs синхронизации
      this.messageHandler = (message: any) => {
        this.handleWebSocketMessage(message);
      };
      
      // Подписываемся на сообщения
      websocketClient.onMessage('yjs_sync', this.messageHandler);
      websocketClient.onMessage('yjs_update', this.messageHandler);
      websocketClient.onMessage('awareness_update', this.messageHandler);
      // cursor_update и cursor_remove больше не нужны - awareness уже содержит эту информацию
      websocketClient.onMessage('note_saved', this.messageHandler);
      websocketClient.onMessage('latency_pong', this.messageHandler); // Обработка pong для latency
      
      // Обрабатываем переподключение WebSocket
      websocketClient.onMessage('reconnected', async () => {
        await this.reconnect();
      });

      // Запрашиваем начальное состояние документа
      await this.requestSync();
      
      // Запускаем мониторинг качества соединения
      this.startLatencyMonitoring();
      
      this.onSyncStatus('connected');
    } catch (error) {
      console.error('[YjsSync] Initialization error:', error);
      this.onSyncStatus('error');
    }
  }
  
  /**
   * Переподключение после потери соединения
   */
  public async reconnect() {
    if (!this.isActive) return;
    
    this.isInitialized = false;
    this.onSyncStatus('syncing');
    
    try {
      // Запрашиваем полную синхронизацию заново
      await this.requestSync();
      this.onSyncStatus('connected');
    } catch (error) {
      console.error('[YjsSync] Reconnect error:', error);
      this.onSyncStatus('error');
    }
  }

  /**
   * Обработка WebSocket сообщений
   */
  private handleWebSocketMessage(message: any) {
    try {
      switch (message.type) {
        case 'yjs_sync':
          this.handleYjsSync(message.data);
          break;
        
        case 'yjs_update':
          this.handleYjsUpdate(message.data);
          break;
        
        case 'awareness_update':
          this.handleAwarenessUpdate(message.data);
          break;
        
        // cursor_update и cursor_remove удалены - awareness уже содержит информацию о курсорах
        
        case 'note_saved':
          if (message.data.noteId === this.noteId) {
            this.onSyncStatus('saved');
            setTimeout(() => {
              if (this.isActive && !this.isSyncing) {
                this.onSyncStatus('connected');
              }
            }, 2000);
          }
          break;
        
        case 'latency_pong':
          // Обрабатываем pong для вычисления latency
          if (message.data?.timestamp) {
            this.handleLatencyPong(message.data.timestamp);
          }
          break;
      }
    } catch (error) {
      console.error('[YjsSync] Error handling message:', error);
    }
  }

  /**
   * Запрос начальной синхронизации с сервером
   */
  private async requestSync() {
    if (!websocketClient) return;
    
    // Создаем state vector для запроса отсутствующих updates
    const stateVector = Y.encodeStateVector(this.ydoc);
    
    websocketClient.send({
      type: 'yjs_sync_request',
      room_id: this.roomId,
      data: {
        noteId: this.noteId,
        stateVector: Array.from(stateVector) // Конвертируем Uint8Array в обычный массив для JSON
      }
    });
  }

  /**
   * Обработка начальной синхронизации от сервера
   */
  private handleYjsSync(data: { noteId: string; update: number[] }) {
    if (data.noteId !== this.noteId) return;
    
    try {
      // Валидация данных
      if (!data.update || !Array.isArray(data.update)) {
        this.onSyncStatus('error');
        return;
      }
      
      // Конвертируем массив обратно в Uint8Array
      const update = new Uint8Array(data.update);
      
      // Применяем update к документу (origin 'server' чтобы не отправлять обратно)
      Y.applyUpdate(this.ydoc, update, 'server');
      
      // Теперь документ синхронизирован
      this.isInitialized = true;
      
      // Получаем текущий контент
      const content = this.ytext.toString();
      this.onContentUpdate(content);
    } catch (error) {
      // Не выставляем статус error, просто логируем
      // Документ может синхронизироваться через последующие updates
      this.isInitialized = true; // Все равно помечаем как инициализированный
    }
  }

  /**
   * Обработка обновления от другого клиента
   */
  private handleYjsUpdate(data: { noteId: string; update: number[] }) {
    if (data.noteId !== this.noteId) return;
    
    try {
      // Валидация данных
      if (!data.update || !Array.isArray(data.update) || data.update.length === 0) {
        return;
      }
      
      // Конвертируем массив обратно в Uint8Array
      const update = new Uint8Array(data.update);
      
      // Применяем update к документу (origin 'server' чтобы не отправлять обратно)
      Y.applyUpdate(this.ydoc, update, 'server');
    } catch (error: any) {
      // Yjs может выбросить ошибку если update уже применен или некорректен
      // Это не критично - игнорируем
    }
  }

  /**
   * Отправка update на сервер с батчингом
   */
  private sendUpdate(update: Uint8Array) {
    if (!websocketClient || !this.isActive) return;
    
    // Не отправляем пустые updates
    if (!update || update.length === 0) return;
    
    // КРИТИЧНО: Дополнительная валидация Yjs update
    // Минимальный валидный Yjs update должен быть хотя бы 2 байта
    if (update.length < 2) return;
    
    // Добавляем update в очередь для батчинга
    this.pendingUpdates.push(update);
    
    // Отменяем предыдущий таймер батчинга
    if (this.updateBatchTimeout) {
      clearTimeout(this.updateBatchTimeout);
    }
    
    // Устанавливаем новый таймер для отправки батча
    this.updateBatchTimeout = setTimeout(() => {
      this.flushUpdates();
    }, this.UPDATE_BATCH_DELAY);
  }
  
  /**
   * Отправка накопленных updates одним батчем
   */
  private flushUpdates() {
    if (!websocketClient || !this.isActive || this.pendingUpdates.length === 0) {
      return;
    }
    
    try {
      // Мерджим все накопленные updates в один
      const mergedUpdate = Y.mergeUpdates(this.pendingUpdates);
      
      // Очищаем очередь
      this.pendingUpdates = [];
      this.updateBatchTimeout = null;
      
      // Отправляем объединенный update
      if (mergedUpdate.length > 0) {
        this.isSyncing = true;
        this.onSyncStatus('syncing');
        
        const updateArray = Array.from(mergedUpdate);
        
        websocketClient.send({
          type: 'yjs_update',
          room_id: this.roomId,
          data: {
            noteId: this.noteId,
            update: updateArray
          }
        });
        
        // Быстро возвращаем статус в connected
        setTimeout(() => {
          if (this.isActive) {
            this.isSyncing = false;
            this.onSyncStatus('connected');
          }
        }, 100);
      }
    } catch (error) {
      console.error('[YjsSync] Error sending batched update:', error);
      this.pendingUpdates = [];
      this.updateBatchTimeout = null;
      this.isSyncing = false;
      this.onSyncStatus('error');
    }
  }
  
  /**
   * Отправка awareness update на сервер (с throttling)
   */
  private sendAwarenessUpdate() {
    if (!websocketClient || !this.isActive || !this.isInitialized) return;
    
    const now = Date.now();
    const timeSinceLastUpdate = now - this.lastAwarenessUpdate;
    
    // Очищаем отложенное обновление если оно есть
    if (this.pendingAwarenessUpdate) {
      clearTimeout(this.pendingAwarenessUpdate);
      this.pendingAwarenessUpdate = null;
    }
    
    // Если прошло достаточно времени - отправляем сразу
    if (timeSinceLastUpdate >= this.awarenessThrottle) {
      this.lastAwarenessUpdate = now;
      this.doSendAwarenessUpdate();
    } else {
      // Иначе откладываем отправку
      const delay = this.awarenessThrottle - timeSinceLastUpdate;
      this.pendingAwarenessUpdate = setTimeout(() => {
        this.lastAwarenessUpdate = Date.now();
        this.doSendAwarenessUpdate();
        this.pendingAwarenessUpdate = null;
      }, delay);
    }
  }
  
  /**
   * Фактическая отправка awareness update
   */
  private doSendAwarenessUpdate() {
    if (!websocketClient || !this.isActive || !this.isInitialized) return;
    
    // Кодируем локальное состояние awareness
    import('y-protocols/awareness').then(({ encodeAwarenessUpdate }) => {
      const awarenessUpdate = encodeAwarenessUpdate(this.awareness, [this.awareness.clientID]);
      
      // Валидация awareness update перед отправкой
      if (!awarenessUpdate || awarenessUpdate.length === 0) {
        return;
      }
      
      // Awareness update должен содержать данные (минимум 2 байта)
      if (awarenessUpdate.length < 2) {
        return;
      }
      
      try {
        const updateArray = Array.from(awarenessUpdate);
        
        websocketClient.send({
          type: 'awareness_update',
          room_id: this.roomId,
          data: {
            noteId: this.noteId,
            update: updateArray
          }
        });
      } catch (error) {
        console.error('[YjsSync] Error sending awareness update:', error);
      }
    });
  }
  
  /**
   * Обработка awareness update от другого клиента
   */
  private handleAwarenessUpdate(data: { noteId: string; update: number[] }) {
    if (data.noteId !== this.noteId) return;
    
    try {
      // Валидация данных
      if (!data.update || !Array.isArray(data.update) || data.update.length === 0) {
        return;
      }
      
      // Конвертируем массив обратно в Uint8Array
      const update = new Uint8Array(data.update);
      
      // Применяем awareness update
      import('y-protocols/awareness').then(({ applyAwarenessUpdate }) => {
        applyAwarenessUpdate(this.awareness, update, null);
      });
    } catch (error: any) {
      // Игнорируем ошибки awareness updates
    }
  }

  /**
   * Хеширование строки для получения стабильного индекса цвета
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Конвертируем в 32-битное целое
    }
    return Math.abs(hash);
  }

  /**
   * Быстрое хеширование контента для дедупликации
   */
  private hashContent(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `${hash}_${content.length}`;
  }

  /**
   * Получение стабильного цвета для пользователя на основе userId
   */
  private getUserColor(userId: string): string {
    if (!this.userColors.has(userId)) {
      const colorIndex = this.hashUserId(userId) % this.colorPalette.length;
      this.userColors.set(userId, this.colorPalette[colorIndex]);
    }
    return this.userColors.get(userId)!;
  }

  /**
   * Вычисление качества соединения на основе latency
   */
  private calculateConnectionQuality(latency: number): ConnectionQuality {
    if (latency < 0) return 'offline';
    if (latency < 100) return 'excellent'; // <100ms - отлично
    if (latency < 300) return 'good';      // 100-300ms - хорошо
    return 'poor';                          // >300ms - плохо
  }

  /**
   * Обновление latency и качества соединения
   */
  private updateLatency(latency: number) {
    this.currentLatency = latency;
    
    // Добавляем в историю
    this.latencyHistory.push(latency);
    if (this.latencyHistory.length > this.MAX_LATENCY_HISTORY) {
      this.latencyHistory.shift();
    }
    
    // Вычисляем среднее значение для стабильности
    const avgLatency = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;
    
    // Обновляем качество соединения
    const newQuality = this.calculateConnectionQuality(avgLatency);
    
    if (newQuality !== this.connectionQuality) {
      this.connectionQuality = newQuality;
      // Качество соединения изменилось - обновляем awareness
    }
  }

  /**
   * Начало мониторинга latency
   */
  private startLatencyMonitoring() {
    // Проверяем latency каждые 5 секунд
    this.latencyCheckInterval = setInterval(() => {
      this.measureLatency();
    }, 5000);
    
    // Первое измерение сразу
    this.measureLatency();
  }

  /**
   * Остановка мониторинга latency
   */
  private stopLatencyMonitoring() {
    if (this.latencyCheckInterval) {
      clearInterval(this.latencyCheckInterval);
      this.latencyCheckInterval = null;
    }
  }

  /**
   * Измерение latency (отправляем ping, ждем pong)
   */
  private measureLatency() {
    if (!websocketClient || !websocketClient.isConnected()) {
      this.updateLatency(-1); // offline
      return;
    }
    
    this.pingStartTime = Date.now();
    
    // Отправляем специальное ping сообщение
    websocketClient.send({
      type: 'latency_ping',
      room_id: this.roomId,
      timestamp: this.pingStartTime
    });
  }

  /**
   * Обработка latency pong от сервера
   */
  private handleLatencyPong(timestamp: number) {
    if (this.pingStartTime > 0) {
      const latency = Date.now() - this.pingStartTime;
      this.updateLatency(latency);
      this.pingStartTime = 0;
    }
  }

  /**
   * Обработка изменений Awareness (курсоры других пользователей)
   * КОНВЕРТИРУЕТ ОТНОСИТЕЛЬНЫЕ ПОЗИЦИИ в абсолютные для отрисовки
   */
  private handleAwarenessChange() {
    const states = this.awareness.getStates();
    const localClientId = this.awareness.clientID;
    
    // Очищаем старые курсоры
    this.remoteCursors.clear();
    
    // Обрабатываем состояния всех клиентов
    states.forEach((state, clientId) => {
      // Пропускаем свой собственный курсор
      if (clientId === localClientId) return;
      
      const cursor = state.cursor;
      if (!cursor || !cursor.userId) return;
      
      // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Конвертируем RelativePosition в абсолютную позицию
      let position: number;
      
      // Проверяем есть ли relativePosition (новый формат)
      if (cursor.relativePosition) {
        // Конвертируем относительную позицию в абсолютную
        const absolutePosition = Y.createAbsolutePositionFromRelativePosition(
          cursor.relativePosition,
          this.ydoc
        );
        
        // Если не удалось конвертировать (например, позиция была удалена), пропускаем курсор
        if (!absolutePosition) {
          console.warn('[Awareness] ⚠️ Не удалось конвертировать относительную позицию:', {
            userId: cursor.userId,
            noteId: cursor.noteId
          });
          return;
        }
        
        position = absolutePosition.index;
      } else if (cursor.position !== undefined) {
        // Fallback для старого формата (абсолютная позиция)
        position = cursor.position;
      } else {
        // Нет ни относительной ни абсолютной позиции
        return;
      }
      
      // ⚠️ КРИТИЧНО: Фильтруем невалидные позиции (баг "слет в начало")
      // Пропускаем курсоры с position: 0 или отрицательными значениями
      if (position === 0 || position < 0) {
        console.warn('[Awareness] ⚠️ Отфильтрован невалидный курсор:', {
          userId: cursor.userId,
          position: position,
          noteId: cursor.noteId
        });
        return;
      }
      
      // Конвертируем относительное выделение в абсолютное (если есть)
      let selection: { start: number; end: number } | undefined = undefined;
      if (cursor.relativeSelection) {
        const absoluteStart = Y.createAbsolutePositionFromRelativePosition(
          cursor.relativeSelection.start,
          this.ydoc
        );
        const absoluteEnd = Y.createAbsolutePositionFromRelativePosition(
          cursor.relativeSelection.end,
          this.ydoc
        );
        
        if (absoluteStart && absoluteEnd) {
          selection = {
            start: absoluteStart.index,
            end: absoluteEnd.index
          };
        }
      } else if (cursor.selection) {
        // Fallback для старого формата
        selection = cursor.selection;
      }
      
      // Получаем стабильный цвет для пользователя
      const color = this.getUserColor(cursor.userId);
      
      this.remoteCursors.set(cursor.userId, {
        userId: cursor.userId,
        username: cursor.username,
        avatarUrl: cursor.avatarUrl,
        position: position,
        selection: selection,
        color,
        timestamp: Date.now(),
        noteId: this.noteId,
        connectionQuality: cursor.connectionQuality,
        latency: cursor.latency
      });
    });
    
    this.onCursorsUpdate(new Map(this.remoteCursors));
  }
  
  // handleCursorUpdate и handleCursorRemove удалены - используем только Yjs Awareness


  /**
   * Находит длину общего префикса двух строк
   */
  private commonPrefixLength(str1: string, str2: string): number {
    const minLen = Math.min(str1.length, str2.length);
    for (let i = 0; i < minLen; i++) {
      if (str1[i] !== str2[i]) {
        return i;
      }
    }
    return minLen;
  }

  /**
   * Находит длину общего суффикса двух строк
   */
  private commonSuffixLength(str1: string, str2: string, prefixLen: number): number {
    const maxLen = Math.min(str1.length - prefixLen, str2.length - prefixLen);
    for (let i = 0; i < maxLen; i++) {
      if (str1[str1.length - 1 - i] !== str2[str2.length - 1 - i]) {
        return i;
      }
    }
    return maxLen;
  }

  /**
   * Обновление локального контента (вызывается при редактировании)
   * Адаптивная задержка в зависимости от устройства
   */
  public updateContent(newContent: string) {
    if (!this.isActive || !this.isInitialized) return;
    
    // Сохраняем pending обновление
    this.pendingContentUpdate = newContent;
    
    // Отменяем предыдущий таймер
    if (this.contentUpdateTimeout) {
      clearTimeout(this.contentUpdateTimeout);
    }
    
    // Увеличенная задержка для лучшего батчинга при быстрой печати
    // 30ms для desktop (оптимальный баланс), 50ms для mobile
    const delay = this.isMobile ? 50 : 30;
    
    this.contentUpdateTimeout = setTimeout(() => {
      this.applyContentUpdate();
    }, delay);
  }

  /**
   * Применение накопленных изменений контента
   */
  private applyContentUpdate() {
    if (!this.pendingContentUpdate || !this.isActive || !this.isInitialized) {
      return;
    }
    
    // Защита от зацикливания - не обрабатываем если уже в процессе
    if (this.updateInProgress) {
      return;
    }
    
    const newContent = this.pendingContentUpdate;
    this.pendingContentUpdate = null;
    
    const currentContent = this.ytext.toString();
    
    // Игнорируем если контент не изменился
    if (newContent === currentContent) {
      return;
    }
    
    // Вычисляем умный diff: находим общий префикс и суффикс
    const prefixLen = this.commonPrefixLength(currentContent, newContent);
    const suffixLen = this.commonSuffixLength(currentContent, newContent, prefixLen);
    
    // Вычисляем что нужно удалить и вставить
    const deleteStart = prefixLen;
    const deleteLen = currentContent.length - prefixLen - suffixLen;
    const insertText = newContent.substring(prefixLen, newContent.length - suffixLen);
    
    // Не применяем если нет реальных изменений
    if (deleteLen === 0 && insertText.length === 0) {
      return;
    }
    
    // Устанавливаем флаг что обновление в процессе
    this.updateInProgress = true;
    
    try {
      // Применяем изменения только к изменённой части
      // transact группирует операции для оптимальной производительности
      this.ydoc.transact(() => {
        // Сначала удаляем (если нужно)
        if (deleteLen > 0) {
          this.ytext.delete(deleteStart, deleteLen);
        }
        
        // Потом вставляем (если есть что вставить)
        if (insertText.length > 0) {
          this.ytext.insert(deleteStart, insertText);
        }
      }, 'local'); // Указываем origin 'local' для отслеживания в UndoManager
      
      // Yjs автоматически генерирует update event, который отправится на сервер
      // через обработчик ydoc.on('update') в конструкторе
    } finally {
      // Снимаем флаг обновления
      this.updateInProgress = false;
    }
  }


  /**
   * Обновление позиции курсора через Yjs Awareness (оптимизировано)
   * ИСПОЛЬЗУЕТ ОТНОСИТЕЛЬНЫЕ ПОЗИЦИИ для автоматической коррекции при изменении текста
   */
  public updateCursor(position: number, selection?: { start: number; end: number }, userId?: string, username?: string, avatarUrl?: string) {
    if (!this.isActive) return;
    
    // Если position === -1, это значит убрать курсор (blur)
    if (position === -1) {
      // Удаляем локальное состояние awareness
      this.awareness.setLocalStateField('cursor', null);
      
      // Сбрасываем сохраненную позицию
      this.lastCursorPosition = -1;
      this.lastCursorSelection = undefined;
      return;
    }
    
    // КРИТИЧНО: Проверяем изменилась ли вообще позиция курсора
    const selectionChanged = this.hasSelectionChanged(selection);
    const positionChanged = position !== this.lastCursorPosition;
    
    if (!positionChanged && !selectionChanged) {
      // Позиция и выделение не изменились - не отправляем дублирующее обновление
      return;
    }
    
    // Throttling для cursor updates
    const now = Date.now();
    if (now - this.lastCursorUpdate < this.cursorThrottle) {
      // Пропускаем обновление из-за throttle
      return;
    }
    
    // Сохраняем текущую позицию для следующей проверки
    this.lastCursorPosition = position;
    this.lastCursorSelection = selection ? { ...selection } : undefined;
    this.lastCursorUpdate = now;
    
    // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Создаем относительную позицию в Yjs
    // RelativePosition автоматически корректируется при вставке/удалении текста
    const relativePosition = Y.createRelativePositionFromTypeIndex(this.ytext, position);
    
    // Создаем относительные позиции для выделения (если есть)
    let relativeSelection: { start: Y.RelativePosition; end: Y.RelativePosition } | undefined = undefined;
    if (selection) {
      const relativeStart = Y.createRelativePositionFromTypeIndex(this.ytext, selection.start);
      const relativeEnd = Y.createRelativePositionFromTypeIndex(this.ytext, selection.end);
      relativeSelection = {
        start: relativeStart,
        end: relativeEnd
      };
    }
    
    // Обновляем локальное состояние awareness с относительными позициями
    // Awareness автоматически синхронизирует это состояние с другими клиентами
    this.awareness.setLocalStateField('cursor', {
      userId: userId || 'unknown',
      username,
      avatarUrl,
      relativePosition,        // ИСПОЛЬЗУЕМ RelativePosition вместо числа
      relativeSelection,       // Относительное выделение
      noteId: this.noteId,
      timestamp: now,
      connectionQuality: this.connectionQuality,
      latency: Math.round(this.currentLatency)
    });
  }
  
  /**
   * Проверка изменилось ли выделение
   */
  private hasSelectionChanged(selection?: { start: number; end: number }): boolean {
    // Оба undefined - не изменилось
    if (!selection && !this.lastCursorSelection) {
      return false;
    }
    
    // Одно есть, другого нет - изменилось
    if (!selection || !this.lastCursorSelection) {
      return true;
    }
    
    // Сравниваем координаты
    return selection.start !== this.lastCursorSelection.start || 
           selection.end !== this.lastCursorSelection.end;
  }

  /**
   * Принудительная синхронизация
   */
  public async forceSync() {
    // Запрашиваем свежую версию с сервера
    await this.requestSync();
  }

  /**
   * Отменить последнее действие (Ctrl+Z)
   */
  public undo(): boolean {
    if (!this.isActive || !this.isInitialized) {
      return false;
    }
    const result = this.undoManager.undo();
    return result !== null;
  }

  /**
   * Вернуть отменённое действие (Ctrl+Y / Ctrl+Shift+Z)
   */
  public redo(): boolean {
    if (!this.isActive || !this.isInitialized) {
      return false;
    }
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
   * Очистка
   */
  public destroy() {
    this.isActive = false;
    
    // Отправляем оставшиеся updates перед закрытием
    if (this.updateBatchTimeout) {
      clearTimeout(this.updateBatchTimeout);
      this.updateBatchTimeout = null;
    }
    this.flushUpdates();
    
    // Удаляем локальное состояние awareness (курсор)
    this.awareness.setLocalState(null);
    
    // Уничтожаем awareness
    this.awareness.destroy();
    
    // Флашим и уничтожаем батчер
    if (this.cursorBatcher) {
      this.cursorBatcher.flush();
      this.cursorBatcher.destroy();
      this.cursorBatcher = null;
    }
    
    // Очищаем pending обновления
    if (this.contentUpdateTimeout) {
      clearTimeout(this.contentUpdateTimeout);
      this.contentUpdateTimeout = null;
    }
    this.pendingContentUpdate = null;
    
    // Очищаем отложенное awareness обновление
    if (this.pendingAwarenessUpdate) {
      clearTimeout(this.pendingAwarenessUpdate);
      this.pendingAwarenessUpdate = null;
    }
    
    // Останавливаем мониторинг latency
    this.stopLatencyMonitoring();
    
    // Сбрасываем сохраненную позицию курсора
    this.lastCursorPosition = -1;
    this.lastCursorSelection = undefined;
    this.lastCursorUpdate = 0;
    
    // Очищаем очередь updates
    this.pendingUpdates = [];
    
    // Закрываем IndexedDB провайдер
    if (this.indexeddbProvider) {
      this.indexeddbProvider.destroy();
      this.indexeddbProvider = null;
    }
    
    // Отписываемся от WebSocket сообщений
    if (websocketClient && this.messageHandler) {
      websocketClient.offMessage('yjs_sync', this.messageHandler);
      websocketClient.offMessage('yjs_update', this.messageHandler);
      websocketClient.offMessage('awareness_update', this.messageHandler);
      // cursor_update и cursor_remove больше не используются
      websocketClient.offMessage('note_saved', this.messageHandler);
      websocketClient.offMessage('reconnected', this.messageHandler);
    }
    
    // Очищаем Undo Manager
    this.undoManager.clear();
    this.undoManager.destroy();
    
    // Очищаем Yjs документ
    this.ydoc.destroy();
    
    this.remoteCursors.clear();
  }
}

