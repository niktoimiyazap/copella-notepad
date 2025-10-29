/**
 * YJS Persistence layer для PostgreSQL
 * Сохраняет и загружает YJS документы из базы данных
 */

import * as Y from 'yjs';
import { prisma } from '../src/lib/prisma';

/**
 * Загружает YJS документ из PostgreSQL
 * 1. Пытается загрузить из поля Note.content (fallback для старых данных)
 * 2. Применяет все YjsUpdate записи по порядку (инкрементальные обновления)
 */
export async function loadYjsDocument(noteId: string): Promise<Y.Doc> {
  const ydoc = new Y.Doc();
  
  try {
    // Загружаем заметку и все YJS updates
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: {
        content: true,
        yjsUpdates: {
          orderBy: { clock: 'asc' },
          select: { data: true, clock: true }
        }
      }
    });

    if (!note) {
      console.log(`[YJS Persistence] Note ${noteId} not found, creating empty doc`);
      return ydoc;
    }

    // Если есть YJS updates, применяем их (приоритет)
    if (note.yjsUpdates && note.yjsUpdates.length > 0) {
      console.log(`[YJS Persistence] Loading ${note.yjsUpdates.length} updates for note ${noteId}`);
      
      for (const update of note.yjsUpdates) {
        try {
          // Применяем бинарное обновление к документу
          Y.applyUpdate(ydoc, Buffer.from(update.data));
        } catch (error) {
          console.error(`[YJS Persistence] Error applying update:`, error);
        }
      }
    } 
    // Иначе пытаемся загрузить из content (legacy)
    else if (note.content) {
      console.log(`[YJS Persistence] Loading from Note.content for note ${noteId}`);
      const ytext = ydoc.getText('content');
      ytext.insert(0, note.content);
    }

    return ydoc;
  } catch (error) {
    console.error(`[YJS Persistence] Error loading document ${noteId}:`, error);
    return ydoc; // Возвращаем пустой документ в случае ошибки
  }
}

/**
 * Сохраняет YJS update в PostgreSQL
 * Сохраняет как инкрементальное обновление + синхронизирует Note.content
 */
export async function saveYjsUpdate(noteId: string, update: Uint8Array): Promise<void> {
  try {
    // Декодируем update чтобы получить clock
    const ydoc = new Y.Doc();
    Y.applyUpdate(ydoc, update);
    const clock = Date.now(); // Используем timestamp как clock для простоты

    // Получаем текстовое содержимое для синхронизации с Note.content
    const ytext = ydoc.getText('content');
    const content = ytext.toString();

    // Сохраняем в транзакции:
    // 1. YjsUpdate (бинарное обновление)
    // 2. Note.content (текстовое содержимое для поиска и fallback)
    await prisma.$transaction([
      // Создаем YJS update запись
      prisma.yjsUpdate.create({
        data: {
          noteId,
          clock,
          data: Buffer.from(update)
        }
      }),
      // Обновляем текстовое содержимое заметки
      prisma.note.update({
        where: { id: noteId },
        data: { 
          content,
          updatedAt: new Date() 
        }
      })
    ]);

    // Очищаем старые updates (храним только последние 1000)
    await cleanupOldUpdates(noteId);
    
  } catch (error) {
    console.error(`[YJS Persistence] Error saving update for note ${noteId}:`, error);
  }
}

/**
 * Очищает старые YJS updates, оставляя только последние N записей
 * Это предотвращает неограниченный рост таблицы
 */
async function cleanupOldUpdates(noteId: string, keepLast = 1000): Promise<void> {
  try {
    const updates = await prisma.yjsUpdate.findMany({
      where: { noteId },
      orderBy: { clock: 'desc' },
      select: { id: true, clock: true },
      take: keepLast + 100 // Берем чуть больше для безопасности
    });

    if (updates.length > keepLast) {
      const idsToDelete = updates.slice(keepLast).map(u => u.id);
      
      await prisma.yjsUpdate.deleteMany({
        where: {
          id: { in: idsToDelete }
        }
      });
      
      console.log(`[YJS Persistence] Cleaned up ${idsToDelete.length} old updates for note ${noteId}`);
    }
  } catch (error) {
    console.error(`[YJS Persistence] Error cleaning up updates:`, error);
  }
}

/**
 * Компактифицирует YJS updates в один snapshot
 * Полезно для оптимизации после накопления большого количества updates
 */
export async function compactYjsUpdates(noteId: string): Promise<void> {
  try {
    // Загружаем текущий документ
    const ydoc = await loadYjsDocument(noteId);
    
    // Получаем полный snapshot
    const stateVector = Y.encodeStateAsUpdate(ydoc);
    
    // Удаляем все старые updates и сохраняем один snapshot
    await prisma.$transaction([
      // Удаляем все старые updates
      prisma.yjsUpdate.deleteMany({
        where: { noteId }
      }),
      // Создаем новый snapshot
      prisma.yjsUpdate.create({
        data: {
          noteId,
          clock: Date.now(),
          data: Buffer.from(stateVector)
        }
      })
    ]);
    
    console.log(`[YJS Persistence] Compacted updates for note ${noteId}`);
  } catch (error) {
    console.error(`[YJS Persistence] Error compacting updates:`, error);
  }
}

