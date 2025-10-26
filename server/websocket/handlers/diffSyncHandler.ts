// Real-time collaborative editing с использованием Yjs (CRDT)
import { prisma } from '../../database/prisma.js';
import type { ConnectionHandler } from './connectionHandler.js';
import type { WebSocket } from 'ws';
import * as Y from 'yjs';
import { ServerBatcher } from '../serverBatcher.js';

interface CursorPosition {
  noteId: string;
  userId: string;
  username?: string;
  avatarUrl?: string;
  position: number;
  selection?: { start: number; end: number };
  timestamp: number;
}

// Хранилище Yjs документов для каждой заметки
const noteDocs = new Map<string, Y.Doc>();
const pendingSaves = new Map<string, NodeJS.Timeout>();
const SAVE_DELAY = 2000; // 2 секунды задержка перед сохранением

export class DiffSyncHandler {
  private connectionHandler: ConnectionHandler;
  private batcher: ServerBatcher;

  constructor(connectionHandler: ConnectionHandler) {
    this.connectionHandler = connectionHandler;
    
    // Создаем батчер для эффективной отправки обновлений
    this.batcher = new ServerBatcher((roomId, messages, excludeUserId) => {
      // Отправляем батч сообщений
      for (const message of messages) {
        this.connectionHandler.broadcastToRoom(roomId, message, excludeUserId);
      }
    });
    
    console.log('[YjsSyncHandler] Initialized with batching');
  }

  /**
   * Получить или создать Y.Doc для заметки
   */
  private async getOrCreateDoc(noteId: string): Promise<Y.Doc | null> {
    // Если документ уже есть в памяти, возвращаем его
    if (noteDocs.has(noteId)) {
      return noteDocs.get(noteId)!;
    }

    try {
      // Загружаем заметку из БД
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        select: { content: true }
      });

      if (!note) {
        return null;
      }

      // Создаем новый Y.Doc
      const ydoc = new Y.Doc();
      const ytext = ydoc.getText('content');

      // Инициализируем контент из БД
      if (note.content) {
        ytext.insert(0, note.content);
      }

      // Подписываемся на изменения для автосохранения
      ydoc.on('update', () => {
        this.scheduleSave(noteId);
      });

      // Сохраняем в памяти
      noteDocs.set(noteId, ydoc);

      return ydoc;
    } catch (error) {
      console.error('[YjsSyncHandler] Error creating doc:', error);
      return null;
    }
  }

  /**
   * Обработка запроса синхронизации от клиента
   */
  async handleYjsSyncRequest(
    ws: WebSocket,
    userId: string,
    roomId: string,
    data: {
      noteId: string;
      stateVector: number[];
    }
  ): Promise<void> {
    const { noteId, stateVector } = data;

    try {
      // Проверяем доступ
      const hasAccess = await this.checkAccess(noteId, roomId, userId);
      if (!hasAccess) {
        this.sendError(ws, 'Access denied');
        return;
      }

      // Получаем или создаем документ
      const ydoc = await this.getOrCreateDoc(noteId);
      if (!ydoc) {
        this.sendError(ws, 'Note not found');
        return;
      }

      // Создаем state vector из массива
      const clientStateVector = new Uint8Array(stateVector);
      
      // Генерируем update для клиента на основе его state vector
      const update = Y.encodeStateAsUpdate(ydoc, clientStateVector);

      // Отправляем update клиенту
      this.sendToClient(ws, {
        type: 'yjs_sync',
        data: {
          noteId,
          update: Array.from(update)
        }
      });

    } catch (error) {
      console.error('[YjsSyncHandler] Error handling sync request:', error);
      this.sendError(ws, 'Failed to sync');
    }
  }

  /**
   * Обработка update от клиента
   */
  async handleYjsUpdate(
    ws: WebSocket,
    userId: string,
    roomId: string,
    data: {
      noteId: string;
      update: number[];
    }
  ): Promise<void> {
    const { noteId, update } = data;

    try {
      // Валидация данных
      if (!update || !Array.isArray(update) || update.length === 0) {
        console.warn('[YjsSyncHandler] Received empty or invalid update for note:', noteId);
        return; // Игнорируем пустые updates без ошибки
      }

      // Проверяем доступ
      const hasAccess = await this.checkAccess(noteId, roomId, userId);
      if (!hasAccess) {
        this.sendError(ws, 'Access denied');
        return;
      }

      // Получаем или создаем документ
      const ydoc = await this.getOrCreateDoc(noteId);
      if (!ydoc) {
        this.sendError(ws, 'Note not found');
        return;
      }

      // Конвертируем массив в Uint8Array
      const updateData = new Uint8Array(update);

      try {
        // Применяем update к серверному документу
        // Yjs автоматически разрешит конфликты благодаря CRDT
        Y.applyUpdate(ydoc, updateData);
        
        // Транслируем update другим клиентам в комнате
        this.broadcastUpdate(roomId, noteId, update, userId);
        
        // Автосохранение запланируется автоматически через обработчик ydoc.on('update')
        
      } catch (applyError: any) {
        // Yjs может выбросить ошибку если update уже применен или некорректен
        // Это не критично - просто логируем и продолжаем
        console.warn('[YjsSyncHandler] Could not apply update (might be duplicate):', applyError.message);
        
        // Все равно транслируем update другим клиентам
        // Они сами решат, нужно ли им это обновление
        this.broadcastUpdate(roomId, noteId, update, userId);
      }

    } catch (error) {
      console.error('[YjsSyncHandler] Error handling update:', error);
      this.sendError(ws, 'Failed to apply update');
    }
  }

  /**
   * Обработка Awareness update от клиента (Yjs протокол для курсоров)
   */
  handleAwarenessUpdate(
    ws: WebSocket,
    userId: string,
    roomId: string,
    data: {
      noteId: string;
      update: number[];
    }
  ): void {
    const { noteId, update } = data;

    // Awareness updates транслируем напрямую без батчинга для low-latency курсоров
    this.connectionHandler.broadcastToRoom(
      roomId,
      {
        type: 'awareness_update',
        room_id: roomId,
        data: {
          noteId,
          update
        },
        timestamp: new Date()
      },
      userId
    );
  }
  
  /**
   * Обработка обновления позиции курсора (fallback для старого протокола)
   */
  handleCursorUpdate(
    ws: WebSocket,
    userId: string,
    roomId: string,
    data: {
      noteId: string;
      username?: string;
      avatarUrl?: string;
      position: number;
      selection?: { start: number; end: number };
    }
  ): void {
    const { noteId, username, avatarUrl, position, selection } = data;

    const cursorData: CursorPosition = {
      noteId,
      userId,
      username,
      avatarUrl,
      position,
      selection,
      timestamp: Date.now()
    };

    // Cursor updates имеют низкий приоритет - батчатся и отправляются позже
    this.batcher.enqueue(
      roomId,
      {
        type: 'cursor_update',
        room_id: roomId,
        data: cursorData,
        timestamp: new Date()
      },
      userId,
      'low' // Низкий приоритет для cursor updates
    );
  }

  /**
   * Обработка удаления курсора (при blur)
   */
  handleCursorRemove(
    ws: WebSocket,
    userId: string,
    roomId: string,
    data: {
      noteId: string;
    }
  ): void {
    // Транслируем всем (кроме отправителя) что курсор удален
    this.connectionHandler.broadcastToRoom(
      roomId,
      {
        type: 'cursor_remove',
        room_id: roomId,
        data: {
          noteId: data.noteId,
          userId
        },
        timestamp: new Date()
      },
      userId
    );
  }

  /**
   * Трансляция update другим клиентам (БЕЗ батчинга для минимальной задержки)
   */
  private broadcastUpdate(
    roomId: string,
    noteId: string,
    update: number[],
    excludeUserId: string
  ): void {
    // Yjs updates отправляем НЕМЕДЛЕННО без батчинга для минимальной задержки
    // Это критично для real-time печати - каждая буква должна приходить мгновенно
    this.connectionHandler.broadcastToRoom(
      roomId,
      {
        type: 'yjs_update',
        room_id: roomId,
        data: {
          noteId,
          update
        },
        timestamp: new Date()
      },
      excludeUserId
    );
  }

  /**
   * Проверка прав доступа
   */
  private async checkAccess(noteId: string, roomId: string, userId: string): Promise<boolean> {
    const note = await prisma.note.findFirst({
      where: {
        id: noteId,
        roomId: roomId
      },
      include: {
        room: {
          include: {
            participants: true
          }
        }
      }
    });

    if (!note) return false;

    const isParticipant = note.room.participants.some(p => p.userId === userId);
    if (!isParticipant) return false;

    // Проверяем права на редактирование
    const participant = note.room.participants.find(p => p.userId === userId);
    const isCreator = note.room.createdBy === userId;
    const isModerator = participant?.role === 'moderator';
    const isAdmin = participant?.role === 'admin' || participant?.role === 'creator';
    const hasEditPermission = participant?.canEdit === true;

    // Пользователь может редактировать если:
    // 1. Он создатель комнаты
    // 2. Он админ или модератор
    // 3. У него явно установлено индивидуальное право canEdit=true
    if (!isCreator && !isAdmin && !isModerator && !hasEditPermission) {
      return false;
    }

    return true;
  }

  /**
   * Планирование сохранения в БД
   */
  private scheduleSave(noteId: string): void {
    // Отменяем предыдущий таймер
    const existing = pendingSaves.get(noteId);
    if (existing) {
      clearTimeout(existing);
    }

    // Устанавливаем новый
    const timer = setTimeout(() => {
      this.saveToDatabase(noteId);
    }, SAVE_DELAY);

    pendingSaves.set(noteId, timer);
  }

  /**
   * Сохранение в базу данных
   */
  private async saveToDatabase(noteId: string): Promise<void> {
    const ydoc = noteDocs.get(noteId);
    if (!ydoc) return;

    try {
      // Получаем текущий контент из Y.Text
      const ytext = ydoc.getText('content');
      const content = ytext.toString();

      await prisma.note.update({
        where: { id: noteId },
        data: {
          content: content,
          updatedAt: new Date()
        }
      });

      // Уведомляем о сохранении
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        select: { roomId: true }
      });

      if (note) {
        this.connectionHandler.broadcastToRoom(note.roomId, {
          type: 'note_saved',
          room_id: note.roomId,
          data: {
            noteId,
            savedAt: new Date()
          },
          timestamp: new Date()
        });
      }

      pendingSaves.delete(noteId);

    } catch (error) {
      console.error(`[YjsSyncHandler] Error saving note ${noteId}:`, error);
      
      // Повторяем через 5 секунд
      setTimeout(() => {
        this.saveToDatabase(noteId);
      }, 5000);
    }
  }

  /**
   * Отправка сообщения клиенту
   */
  private sendToClient(ws: WebSocket, message: any): void {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(JSON.stringify(message));
      } catch (err) {
        console.error('[YjsSyncHandler] Error sending message:', err);
      }
    }
  }

  /**
   * Отправка ошибки клиенту
   */
  private sendError(ws: WebSocket, error: string): void {
    this.sendToClient(ws, {
      type: 'error',
      data: { error },
      timestamp: new Date()
    });
  }

  /**
   * Принудительное сохранение всех заметок
   */
  async flushAll(): Promise<void> {
    console.log(`[YjsSyncHandler] Flushing ${noteDocs.size} notes to database`);

    // Очищаем все таймеры
    for (const timer of pendingSaves.values()) {
      clearTimeout(timer);
    }
    pendingSaves.clear();

    // Сохраняем все заметки
    const savePromises = Array.from(noteDocs.keys()).map(noteId =>
      this.saveToDatabase(noteId)
    );

    await Promise.all(savePromises);
    console.log('[YjsSyncHandler] All notes flushed');
  }

  /**
   * Очистка при завершении
   */
  async shutdown(): Promise<void> {
    console.log('[YjsSyncHandler] Shutting down...');
    
    // Флашим все батчи перед сохранением
    this.batcher.flushAll();
    
    // Сохраняем все заметки
    await this.flushAll();
    
    // Уничтожаем батчер
    this.batcher.destroy();
    
    // Уничтожаем все Y.Doc
    for (const ydoc of noteDocs.values()) {
      ydoc.destroy();
    }
    
    noteDocs.clear();
  }
}
