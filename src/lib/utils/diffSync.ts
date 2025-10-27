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
  
  // Throttling для курсоров
  private lastCursorUpdate = 0;
  private cursorThrottle = 16; // ~60 FPS
  
  // Защита от зацикливания
  private updateInProgress = false;

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
        console.log('[IndexedDB] ✅ Loaded from cache');
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
        // URL WebSocket сервера
        const wsUrl = env.PUBLIC_WS_URL || 'ws://localhost:1234';
        // Убираем протокол для y-websocket (он добавляет сам)
        const wsHost = wsUrl.replace(/^wss?:\/\//, '');
        const useSecure = wsUrl.startsWith('wss://');
        
        // Уникальная комната для каждой заметки
        const roomName = `copella-room-${this.roomId}-note-${this.noteId}`;
        
        console.log('[WebSocket] 🚀 Connecting to:', wsHost);
        console.log('[WebSocket] 🔑 Room:', roomName);
        
        this.wsProvider = new WebsocketProvider(
          wsHost,
          roomName,
          this.ydoc,
          {
            // Параметры подключения
            connect: true,
            awareness: this.ydoc.awareness,
            params: {
              // Опционально: можно передавать token для авторизации
            },
            // Используем wss:// если URL начинается с wss://
            WebSocketPolyfill: useSecure ? undefined : undefined,
            // Максимум переподключений
            maxBackoffTime: 5000,
          }
        );

        // Обработчики событий
        this.wsProvider.on('status', ({ status }: { status: string }) => {
          console.log('[WebSocket] Status:', status);
          
          if (status === 'connected') {
            this.isInitialized = true;
            this.onSyncStatus('connected');
          } else if (status === 'disconnected') {
            this.onSyncStatus('error');
          }
        });

        this.wsProvider.on('sync', (isSynced: boolean) => {
          if (isSynced) {
            console.log('[WebSocket] ✅ Synced with server');
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
          noteId: this.noteId
        });

        // Слушаем изменения awareness (курсоры других пользователей)
        this.wsProvider.awareness.on('change', () => {
          this.handleAwarenessChange();
        });

      } catch (error) {
        console.error('[WebSocket] ❌ Failed to initialize:', error);
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
      
      // Удаленные изменения
      console.log('[Yjs] 📝 Remote update');
      
      this.onSyncStatus('syncing');
      
      const content = this.ytext.toString();
      this.onContentUpdate(content);
      
      setTimeout(() => {
        if (this.isActive) {
          this.onSyncStatus('connected');
        }
      }, 100);
      
      // Обновляем курсоры после изменения документа
      this.handleAwarenessChange();
    });
    
    // Отмечаем как инициализированный
    this.isInitialized = true;
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
        noteId: this.noteId
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
   */
  public updateContent(newContent: string) {
    if (!this.isActive || this.updateInProgress) return;
    
    const currentContent = this.ytext.toString();
    
    // Игнорируем если контент не изменился
    if (newContent === currentContent) {
      return;
    }
    
    this.updateInProgress = true;
    
    try {
      this.onSyncStatus('syncing');
      
      // Простое обновление: удаляем все и вставляем новое
      this.ydoc.transact(() => {
        this.ytext.delete(0, this.ytext.length);
        this.ytext.insert(0, newContent);
      }, 'local');
      
      setTimeout(() => {
        if (this.isActive) {
          this.onSyncStatus('connected');
        }
      }, 100);
    } finally {
      this.updateInProgress = false;
    }
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
    
    console.log('[DiffSync] 🔌 Destroyed');
  }
}
