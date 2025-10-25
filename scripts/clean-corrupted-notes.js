// Скрипт для очистки поврежденных заметок с артефактами
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanCorruptedNotes() {
  try {
    console.log('🔍 Поиск заметок с проблемами...\n');

    // Получаем все заметки
    const notes = await prisma.note.findMany({
      select: {
        id: true,
        title: true,
        content: true,
        roomId: true,
        updatedAt: true,
      },
    });

    console.log(`📝 Всего заметок: ${notes.length}\n`);

    const problematicNotes = [];

    for (const note of notes) {
      if (!note.content) continue;

      const contentLength = note.content.length;
      const issues = [];

      // Проверка 1: Размер контента больше 50KB
      if (contentLength > 50000) {
        issues.push(`Огромный размер: ${Math.round(contentLength / 1024)}KB`);
      }

      // Проверка 2: Множественные повторяющиеся фрагменты
      const duplicatePatterns = [
        /(<div><div>){3,}/i,
        /(<br\s*\/?>\s*){10,}/i,
        /(.{10,})\1{3,}/,
        /\/nbsp;/g,
        /\blt;/g,
        /\bbsp;/g,
        /&nпbsp;/g,
      ];

      for (const pattern of duplicatePatterns) {
        const matches = note.content.match(pattern);
        if (matches) {
          issues.push(`Найдены артефакты: ${pattern.toString()}`);
        }
      }

      // Проверка 3: Соотношение тегов к тексту
      const tagsCount = (note.content.match(/<[^>]+>/g) || []).length;
      const textLength = note.content.replace(/<[^>]+>/g, '').length;
      if (tagsCount > textLength) {
        issues.push(`Больше тегов чем текста (${tagsCount} тегов, ${textLength} символов)`);
      }

      if (issues.length > 0) {
        problematicNotes.push({
          ...note,
          contentLength,
          issues,
        });
      }
    }

    if (problematicNotes.length === 0) {
      console.log('✅ Проблемных заметок не найдено!');
      return;
    }

    console.log(`❌ Найдено проблемных заметок: ${problematicNotes.length}\n`);

    // Показываем проблемные заметки
    for (const note of problematicNotes) {
      console.log(`📌 Заметка: "${note.title}"`);
      console.log(`   ID: ${note.id}`);
      console.log(`   Размер: ${Math.round(note.contentLength / 1024)}KB`);
      console.log(`   Обновлена: ${note.updatedAt.toLocaleString()}`);
      console.log(`   Проблемы:`);
      note.issues.forEach((issue) => console.log(`     - ${issue}`));
      console.log(`   Превью контента: ${note.content.substring(0, 200)}...`);
      console.log('');
    }

    // Очищаем проблемные заметки
    console.log('🧹 Очистка проблемных заметок...\n');

    for (const note of problematicNotes) {
      // Базовая очистка контента
      let cleanedContent = note.content;

      // Убираем поломанные HTML-сущности
      cleanedContent = cleanedContent.replace(/\/nbsp;/g, ' ');
      cleanedContent = cleanedContent.replace(/<\/nbsp;>/g, ' ');
      cleanedContent = cleanedContent.replace(/\blt;/g, '');
      cleanedContent = cleanedContent.replace(/\bgt;/g, '');
      cleanedContent = cleanedContent.replace(/\bbsp;/g, ' ');
      cleanedContent = cleanedContent.replace(/\/gt;/g, '');
      cleanedContent = cleanedContent.replace(/\/lt;/g, '');
      cleanedContent = cleanedContent.replace(/\/amp;/g, '&');
      cleanedContent = cleanedContent.replace(/&nпbsp;/g, ' ');
      cleanedContent = cleanedContent.replace(/&nбsp;/g, ' ');

      // Убираем множественные пробелы и переносы
      cleanedContent = cleanedContent.replace(/\s{3,}/g, ' ');

      // Убираем множественные одиночные < или >
      cleanedContent = cleanedContent.replace(/(<\s*){2,}/g, '');
      cleanedContent = cleanedContent.replace(/(>\s*){2,}/g, '');

      // Убираем HTML-комментарии
      cleanedContent = cleanedContent.replace(/<!--[\s\S]*?-->/g, '');

      // Убираем пустые теги
      cleanedContent = cleanedContent.replace(/<div>\s*<\/div>/gi, '');
      cleanedContent = cleanedContent.replace(/<span>\s*<\/span>/gi, '');

      // Убираем множественные <br>
      cleanedContent = cleanedContent.replace(/(<br\s*\/?>\s*){3,}/gi, '<br><br>');

      // Если контент все еще огромный (больше 100KB), обрезаем
      if (cleanedContent.length > 100000) {
        console.log(`   ⚠️  Контент все еще слишком большой, обрезаем до разумного размера...`);
        cleanedContent = cleanedContent.substring(0, 50000) + '\n\n[Контент был обрезан из-за превышения размера]';
      }

      // Обновляем заметку
      await prisma.note.update({
        where: { id: note.id },
        data: {
          content: cleanedContent,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Заметка "${note.title}" очищена`);
      console.log(`   Было: ${Math.round(note.contentLength / 1024)}KB`);
      console.log(`   Стало: ${Math.round(cleanedContent.length / 1024)}KB\n`);
    }

    console.log('✨ Очистка завершена!');
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanCorruptedNotes();

