// Обработчик синхронизации контента заметок в реальном времени
import { PrismaClient } from '@prisma/client';
import type { ConnectionHandler } from './connectionHandler.js';
import type { WebSocketMessage } from '../types.js';
import type { WebSocket } from 'ws';

const prisma = new PrismaClient();

interface NoteContentUpdate {
  noteId: string;
  content: string;
  title?: string;
  userId: string;
  timestamp: number;
}

export class NoteContentHandler {
  private connectionHandler: ConnectionHandler;
  private pendingUpdates: Map<string, NoteContentUpdate> = new Map();
  private saveTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly SAVE_DELAY = 0; // Сохранение сразу после изменения

  constructor(connectionHandler: ConnectionHandler) {
    this.connectionHandler = connectionHandler;
    console.log('[NoteContentHandler] Initialized');
  }

  /**
   * Обработка обновления контента заметки
   */
  async handleNoteContentUpdate(
    ws: WebSocket,
    userId: string,
    roomId: string,
    noteId: string,
    content: string,
    title?: string
  ): Promise<void> {
    console.log(`[NoteContentHandler] Received content update for note ${noteId} from user ${userId}`);

    try {
      // Проверяем, существует ли заметка и имеет ли пользователь доступ
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

      if (!note) {
        this.sendError(ws, 'Note not found');
        return;
      }

      // Проверяем, является ли пользователь участником комнаты
      const isParticipant = note.room.participants.some(p => p.userId === userId);
      if (!isParticipant) {
        this.sendError(ws, 'Access denied');
        return;
      }

      // Проверяем разрешения на редактирование
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
        this.sendError(ws, 'Edit permission denied');
        return;
      }

      // Сохраняем обновление в памяти
      const update: NoteContentUpdate = {
        noteId,
        content,
        title,
        userId,
        timestamp: Date.now()
      };
      this.pendingUpdates.set(noteId, update);

      // Немедленно транслируем изменения другим пользователям в комнате
      this.broadcastNoteContentUpdate(roomId, noteId, content, title, userId);

      // Устанавливаем/переустанавливаем таймер для сохранения в БД
      this.scheduleSave(noteId, roomId);

    } catch (error) {
      console.error('[NoteContentHandler] Error handling note content update:', error);
      this.sendError(ws, 'Internal server error');
    }
  }

  /**
   * Планирование сохранения в БД с задержкой
   */
  private scheduleSave(noteId: string, roomId: string): void {
    // Очищаем предыдущий таймер, если он есть
    const existingTimer = this.saveTimers.get(noteId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Устанавливаем новый таймер
    const timer = setTimeout(async () => {
      await this.saveToDatabase(noteId, roomId);
    }, this.SAVE_DELAY);

    this.saveTimers.set(noteId, timer);
  }

  /**
   * Сохранение в базу данных
   */
  private async saveToDatabase(noteId: string, roomId: string): Promise<void> {
    const update = this.pendingUpdates.get(noteId);
    if (!update) {
      console.warn(`[NoteContentHandler] No pending update for note ${noteId}`);
      return;
    }

    try {
      console.log(`[NoteContentHandler] Saving note ${noteId} to database`);

      // Обновляем заметку в базе данных
      const updatedNote = await prisma.note.update({
        where: { id: noteId },
        data: {
          content: update.content,
          ...(update.title !== undefined && { title: update.title }),
          updatedAt: new Date()
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatarUrl: true
            }
          }
        }
      });

      console.log(`[NoteContentHandler] Note ${noteId} saved successfully`);

      // Уведомляем всех участников о том, что заметка сохранена
      this.connectionHandler.broadcastToRoom(roomId, {
        type: 'note_saved',
        room_id: roomId,
        data: {
          noteId: noteId,
          savedAt: new Date(),
          savedBy: update.userId
        },
        timestamp: new Date()
      });

      // Удаляем из ожидающих обновлений
      this.pendingUpdates.delete(noteId);
      this.saveTimers.delete(noteId);

    } catch (error) {
      console.error(`[NoteContentHandler] Error saving note ${noteId}:`, error);
      
      // Пробуем снова через 2 секунды
      setTimeout(() => {
        this.saveToDatabase(noteId, roomId);
      }, 2000);
    }
  }

  /**
   * Трансляция обновления контента заметки всем участникам комнаты
   */
  private broadcastNoteContentUpdate(
    roomId: string,
    noteId: string,
    content: string,
    title: string | undefined,
    userId: string
  ): void {
    const message: WebSocketMessage = {
      type: 'note_content_update',
      room_id: roomId,
      data: {
        noteId,
        content,
        title,
        updatedBy: userId,
        timestamp: Date.now()
      },
      timestamp: new Date()
    };

    // Транслируем всем, кроме отправителя
    this.connectionHandler.broadcastToRoom(roomId, message, userId);
  }

  /**
   * Принудительное сохранение всех ожидающих обновлений
   */
  async flushAll(): Promise<void> {
    console.log(`[NoteContentHandler] Flushing ${this.pendingUpdates.size} pending updates`);

    // Очищаем все таймеры
    for (const timer of this.saveTimers.values()) {
      clearTimeout(timer);
    }
    this.saveTimers.clear();

    // Сохраняем все ожидающие обновления
    const savePromises: Promise<void>[] = [];
    
    for (const [noteId, update] of this.pendingUpdates.entries()) {
      const note = await prisma.note.findUnique({
        where: { id: noteId },
        select: { roomId: true }
      });
      
      if (note) {
        savePromises.push(this.saveToDatabase(noteId, note.roomId));
      }
    }

    await Promise.all(savePromises);
    console.log('[NoteContentHandler] All pending updates flushed');
  }

  /**
   * Получение курсора пользователя в заметке
   */
  handleCursorUpdate(
    userId: string,
    roomId: string,
    noteId: string,
    position: { line: number; column: number } | null,
    selection: { start: { line: number; column: number }; end: { line: number; column: number } } | null
  ): void {
    const message: WebSocketMessage = {
      type: 'cursor_update',
      room_id: roomId,
      data: {
        noteId,
        userId,
        position,
        selection,
        timestamp: Date.now()
      },
      timestamp: new Date()
    };

    // Транслируем всем, кроме отправителя
    this.connectionHandler.broadcastToRoom(roomId, message, userId);
  }

  /**
   * Уведомление о начале редактирования
   */
  handleEditingStarted(
    userId: string,
    roomId: string,
    noteId: string,
    username?: string
  ): void {
    const message: WebSocketMessage = {
      type: 'editing_started',
      room_id: roomId,
      data: {
        noteId,
        userId,
        username,
        timestamp: Date.now()
      },
      timestamp: new Date()
    };

    // Транслируем всем, кроме отправителя
    this.connectionHandler.broadcastToRoom(roomId, message, userId);
  }

  /**
   * Уведомление о завершении редактирования
   */
  handleEditingStopped(
    userId: string,
    roomId: string,
    noteId: string
  ): void {
    const message: WebSocketMessage = {
      type: 'editing_stopped',
      room_id: roomId,
      data: {
        noteId,
        userId,
        timestamp: Date.now()
      },
      timestamp: new Date()
    };

    // Транслируем всем, кроме отправителя
    this.connectionHandler.broadcastToRoom(roomId, message, userId);
  }

  /**
   * Отправка ошибки клиенту
   */
  private sendError(ws: WebSocket, error: string): void {
    if (ws.readyState === 1) { // WebSocket.OPEN
      try {
        ws.send(JSON.stringify({
          type: 'error',
          data: { error },
          timestamp: new Date()
        }));
      } catch (err) {
        console.error('[NoteContentHandler] Error sending error message:', err);
      }
    }
  }

  /**
   * Очистка при завершении работы
   */
  async shutdown(): Promise<void> {
    console.log('[NoteContentHandler] Shutting down...');
    await this.flushAll();
  }
}

