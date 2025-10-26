// Real-time collaborative editing client с использованием Yjs (CRDT)
import * as Y from 'yjs';
import { websocketClient } from '../websocket';

export interface CursorInfo {
  userId: string;
  username?: string;
  avatarUrl?: string;
  position: number;
  selection?: { start: number; end: number };
  color: string;
  timestamp: number;
  noteId?: string;
}

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

  // Батчинг для обновлений контента
  private pendingContentUpdate: string | null = null;
  private contentUpdateTimeout: ReturnType<typeof setTimeout> | null = null;

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

    // Создаем Yjs документ
    this.ydoc = new Y.Doc();
    this.ytext = this.ydoc.getText('content');

    // Создаем Undo Manager с умными настройками
    this.undoManager = new Y.UndoManager(this.ytext, {
      trackedOrigins: new Set(['local']), // Отменяем только локальные изменения
      captureTimeout: 500 // Группируем быстрые изменения (печать) в одну отмену
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
      }
    });

    // Подписываемся на updates для отправки на сервер
    this.ydoc.on('update', (update: Uint8Array, origin: any) => {
      // Не отправляем updates которые пришли с сервера (origin === 'server')
      if (origin !== 'server' && this.isInitialized) {
        this.sendUpdate(update);
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
      websocketClient.onMessage('cursor_update', this.messageHandler);
      websocketClient.onMessage('cursor_remove', this.messageHandler);
      websocketClient.onMessage('note_saved', this.messageHandler);

      // Запрашиваем начальное состояние документа
      await this.requestSync();
      
      this.onSyncStatus('connected');
    } catch (error) {
      console.error('[YjsSync] Initialization error:', error);
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
        
        case 'cursor_update':
          this.handleCursorUpdate(message.data);
          break;
        
        case 'cursor_remove':
          this.handleCursorRemove(message.data);
          break;
        
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
      }
    } catch (error) {
      console.error('[YjsSync] Error handling message:', error);
    }
  }

  /**
   * Запрос начальной синхронизации с сервером
   */
  private async requestSync() {
    if (!websocketClient) {
      console.error('[YjsSync] WebSocket client not available');
      return;
    }
    
    console.log('[YjsSync] Requesting sync for note:', this.noteId);
    
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
    
    console.log('[YjsSync] Received sync, update size:', data.update.length);
    
    try {
      // Валидация данных
      if (!data.update || !Array.isArray(data.update)) {
        console.error('[YjsSync] Invalid sync data received');
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
      
      console.log('[YjsSync] Sync complete, content length:', content.length);
    } catch (error) {
      console.error('[YjsSync] Error applying sync update:', error);
      // Не выставляем статус error, просто логируем
      // Документ может синхронизироваться через последующие updates
      console.warn('[YjsSync] Continuing despite sync error, waiting for updates...');
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
   * Отправка update на сервер
   */
  private sendUpdate(update: Uint8Array) {
    if (!websocketClient || !this.isActive) return;
    
    // Не отправляем пустые updates
    if (!update || update.length === 0) {
      console.warn('[YjsSync] Ignoring empty update');
      return;
    }
    
    this.isSyncing = true;
    this.onSyncStatus('syncing');
    
    // Конвертируем Uint8Array в обычный массив для JSON
    websocketClient.send({
      type: 'yjs_update',
      room_id: this.roomId,
      data: {
        noteId: this.noteId,
        update: Array.from(update)
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
   * Обработка обновления курсора
   */
  private handleCursorUpdate(data: CursorInfo) {
    if (data.noteId !== this.noteId) return;
    
    // Получаем стабильный цвет для пользователя
    const color = this.getUserColor(data.userId);
    
    this.remoteCursors.set(data.userId, {
      ...data,
      color
    });
    
    this.onCursorsUpdate(new Map(this.remoteCursors));
    
    // Удаляем старые курсоры (более 5 секунд, было 10)
    const now = Date.now();
    for (const [userId, cursor] of this.remoteCursors.entries()) {
      if (now - cursor.timestamp > 5000) {
        this.remoteCursors.delete(userId);
      }
    }
  }

  /**
   * Обработка удаления курсора (когда пользователь убирает фокус)
   */
  private handleCursorRemove(data: { noteId?: string; userId: string }) {
    // Удаляем курсор пользователя безусловно
    // Это гарантирует что курсор исчезнет при blur/visibility change
    this.remoteCursors.delete(data.userId);
    this.onCursorsUpdate(new Map(this.remoteCursors));
  }


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
   */
  public updateContent(newContent: string) {
    if (!this.isActive || !this.isInitialized) return;
    
    // Сохраняем pending обновление
    this.pendingContentUpdate = newContent;
    
    // Отменяем предыдущий таймер
    if (this.contentUpdateTimeout) {
      clearTimeout(this.contentUpdateTimeout);
    }
    
    // Применяем с задержкой для батчинга быстрых изменений
    // Увеличено с 50ms до 150ms для лучшей производительности на продакшене
    this.contentUpdateTimeout = setTimeout(() => {
      this.applyContentUpdate();
    }, 150); // 150ms батчинг - группирует быстрый набор текста
  }

  /**
   * Применение накопленных изменений контента
   */
  private applyContentUpdate() {
    if (!this.pendingContentUpdate || !this.isActive || !this.isInitialized) return;
    
    const newContent = this.pendingContentUpdate;
    this.pendingContentUpdate = null;
    
    const currentContent = this.ytext.toString();
    
    // Игнорируем если контент не изменился
    if (newContent === currentContent) return;
    
    // ВАЖНО: Проверяем что изменение не слишком большое
    // Если изменение > 50% документа, возможно это конфликт - игнорируем
    const changeSize = Math.abs(newContent.length - currentContent.length);
    if (currentContent.length > 100 && changeSize > currentContent.length * 0.5) {
      console.warn('[YjsSync] Large change detected, possible conflict. Skipping to avoid duplication.');
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
  }


  /**
   * Обновление позиции курсора
   */
  public updateCursor(position: number, selection?: { start: number; end: number }) {
    if (!websocketClient || !this.isActive) return;
    
    // Если position === -1, это значит убрать курсор (blur)
    if (position === -1) {
      websocketClient.send({
        type: 'cursor_remove',
        room_id: this.roomId,
        data: {
          noteId: this.noteId
        }
      });
      return;
    }
    
    websocketClient.send({
      type: 'cursor_update',
      room_id: this.roomId,
      data: {
        noteId: this.noteId,
        position,
        selection
      }
    });
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
    
    // Очищаем pending обновления
    if (this.contentUpdateTimeout) {
      clearTimeout(this.contentUpdateTimeout);
      this.contentUpdateTimeout = null;
    }
    this.pendingContentUpdate = null;
    
    // Отписываемся от WebSocket сообщений
    if (websocketClient && this.messageHandler) {
      websocketClient.offMessage('yjs_sync', this.messageHandler);
      websocketClient.offMessage('yjs_update', this.messageHandler);
      websocketClient.offMessage('cursor_update', this.messageHandler);
      websocketClient.offMessage('cursor_remove', this.messageHandler);
      websocketClient.offMessage('note_saved', this.messageHandler);
    }
    
    // Очищаем Undo Manager
    this.undoManager.clear();
    this.undoManager.destroy();
    
    // Очищаем Yjs документ
    this.ydoc.destroy();
    
    this.remoteCursors.clear();
  }
}

