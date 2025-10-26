/**
 * Инкрементальное обновление DOM без полной перезаписи
 * Патчит только изменённые узлы для плавности
 */

interface CursorPosition {
  node: Node;
  offset: number;
}

/**
 * Сохраняет текущую позицию курсора
 */
export function saveCursorPosition(container: HTMLElement): CursorPosition | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  
  try {
    const range = selection.getRangeAt(0);
    return {
      node: range.startContainer,
      offset: range.startOffset
    };
  } catch {
    return null;
  }
}

/**
 * Восстанавливает позицию курсора
 */
export function restoreCursorPosition(container: HTMLElement, position: CursorPosition | null): void {
  if (!position) return;
  
  try {
    // Проверяем что node все еще в DOM
    if (!container.contains(position.node)) {
      // Если узел был удален, ставим курсор в конец
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(container);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
      return;
    }
    
    const range = document.createRange();
    const selection = window.getSelection();
    
    // Проверяем что offset валидный
    const maxOffset = position.node.nodeType === Node.TEXT_NODE
      ? (position.node.textContent?.length || 0)
      : position.node.childNodes.length;
    
    const safeOffset = Math.min(position.offset, maxOffset);
    
    range.setStart(position.node, safeOffset);
    range.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(range);
  } catch (error) {
    // Игнорируем ошибки восстановления курсора
    console.warn('[DomDiff] Could not restore cursor:', error);
  }
}

/**
 * Применяет HTML diff инкрементально без полной перезаписи
 * Возвращает true если были изменения
 */
export function applyIncrementalUpdate(
  container: HTMLElement,
  newHTML: string,
  preserveCursor = true
): boolean {
  const currentHTML = container.innerHTML;
  
  // Быстрая проверка - если контент идентичен, ничего не делаем
  if (currentHTML === newHTML) {
    return false;
  }
  
  // Сохраняем курсор если нужно
  const savedCursor = preserveCursor ? saveCursorPosition(container) : null;
  
  // Создаем временный контейнер с новым контентом
  const temp = document.createElement('div');
  temp.innerHTML = newHTML;
  
  // ВАЖНО: Морфим только детей, не сам контейнер
  // Это сохраняет стили, классы и атрибуты контейнера (padding, background и т.д.)
  morphChildren(container, temp);
  
  // Восстанавливаем курсор
  if (savedCursor) {
    restoreCursorPosition(container, savedCursor);
  }
  
  return true;
}

/**
 * Морфит один DOM узел в другой (патчит изменения)
 * Алгоритм похож на morphdom / nanomorph
 */
function morphDOM(fromNode: Element, toNode: Element): void {
  // Если типы узлов разные - заменяем полностью
  if (fromNode.nodeName !== toNode.nodeName) {
    fromNode.parentNode?.replaceChild(toNode.cloneNode(true), fromNode);
    return;
  }
  
  // Синхронизируем атрибуты
  syncAttributes(fromNode as HTMLElement, toNode as HTMLElement);
  
  // Морфим дочерние узлы
  morphChildren(fromNode, toNode);
}

/**
 * Синхронизирует атрибуты между узлами
 */
function syncAttributes(fromNode: HTMLElement, toNode: HTMLElement): void {
  // Удаляем атрибуты которых нет в toNode
  const fromAttrs = fromNode.attributes;
  for (let i = fromAttrs.length - 1; i >= 0; i--) {
    const attr = fromAttrs[i];
    if (!toNode.hasAttribute(attr.name)) {
      fromNode.removeAttribute(attr.name);
    }
  }
  
  // Добавляем/обновляем атрибуты из toNode
  const toAttrs = toNode.attributes;
  for (let i = 0; i < toAttrs.length; i++) {
    const attr = toAttrs[i];
    const fromValue = fromNode.getAttribute(attr.name);
    if (fromValue !== attr.value) {
      fromNode.setAttribute(attr.name, attr.value);
    }
  }
}

/**
 * Морфит дочерние узлы
 */
function morphChildren(fromNode: Element, toNode: Element): void {
  const fromChildren = Array.from(fromNode.childNodes);
  const toChildren = Array.from(toNode.childNodes);
  
  const maxLength = Math.max(fromChildren.length, toChildren.length);
  
  for (let i = 0; i < maxLength; i++) {
    const fromChild = fromChildren[i];
    const toChild = toChildren[i];
    
    // Если toChild отсутствует - удаляем fromChild
    if (!toChild) {
      if (fromChild) {
        fromNode.removeChild(fromChild);
      }
      continue;
    }
    
    // Если fromChild отсутствует - добавляем toChild
    if (!fromChild) {
      fromNode.appendChild(toChild.cloneNode(true));
      continue;
    }
    
    // Оба существуют - проверяем типы
    if (fromChild.nodeType !== toChild.nodeType) {
      fromNode.replaceChild(toChild.cloneNode(true), fromChild);
      continue;
    }
    
    // Текстовые узлы - просто обновляем контент
    if (fromChild.nodeType === Node.TEXT_NODE) {
      if (fromChild.textContent !== toChild.textContent) {
        fromChild.textContent = toChild.textContent;
      }
      continue;
    }
    
    // Элементы - рекурсивно морфим
    if (fromChild.nodeType === Node.ELEMENT_NODE) {
      morphDOM(fromChild as Element, toChild as Element);
    }
  }
}

/**
 * Оптимизированная версия для простого текста
 * Используется когда нет форматирования
 */
export function applyTextOnlyUpdate(
  container: HTMLElement,
  newText: string,
  preserveCursor = true
): boolean {
  const currentText = container.textContent || '';
  
  if (currentText === newText) {
    return false;
  }
  
  // Сохраняем курсор
  const savedCursor = preserveCursor ? saveCursorPosition(container) : null;
  
  // Для простого текста - просто обновляем textContent
  container.textContent = newText;
  
  // Восстанавливаем курсор
  if (savedCursor) {
    restoreCursorPosition(container, savedCursor);
  }
  
  return true;
}

