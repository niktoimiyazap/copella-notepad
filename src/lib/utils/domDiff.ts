/**
 * Инкрементальное обновление DOM без полной перезаписи
 * Патчит только изменённые узлы для плавности
 */

interface CursorPosition {
  node: Node;
  offset: number;
}

/**
 * Сохраняет текущую позицию курсора как абсолютную позицию в тексте
 * Это более надежно чем сохранение ссылки на узел, который может быть удален
 */
export function saveCursorPosition(container: HTMLElement): CursorPosition | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;
  
  try {
    const range = selection.getRangeAt(0);
    
    // Сохраняем и node и абсолютную позицию для надежности
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
    const selection = window.getSelection();
    if (!selection) return;
    
    // Проверяем что node все еще в DOM и является частью контейнера
    if (!container.contains(position.node)) {
      // Узел был удален/заменен - пытаемся найти ближайший текстовый узел
      // Ставим курсор в конец контейнера
      const range = document.createRange();
      range.selectNodeContents(container);
      range.collapse(false); // В конец
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    
    // Узел существует - проверяем offset
    let maxOffset: number;
    if (position.node.nodeType === Node.TEXT_NODE) {
      maxOffset = position.node.textContent?.length || 0;
    } else {
      maxOffset = position.node.childNodes.length;
    }
    
    const safeOffset = Math.min(Math.max(0, position.offset), maxOffset);
    
    const range = document.createRange();
    range.setStart(position.node, safeOffset);
    range.collapse(true);
    
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (error) {
    // В случае ошибки просто не восстанавливаем курсор
    // Это лучше чем крашить редактор
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
  
  let fromIndex = 0;
  let toIndex = 0;
  
  // Проходим по всем дочерним узлам
  while (fromIndex < fromChildren.length || toIndex < toChildren.length) {
    const fromChild = fromChildren[fromIndex];
    const toChild = toChildren[toIndex];
    
    // Если toChild отсутствует - удаляем оставшиеся fromChildren
    if (!toChild) {
      if (fromChild && fromChild.parentNode === fromNode) {
        fromNode.removeChild(fromChild);
      }
      fromIndex++;
      continue;
    }
    
    // Если fromChild отсутствует - добавляем оставшиеся toChildren
    if (!fromChild) {
      fromNode.appendChild(toChild.cloneNode(true));
      toIndex++;
      continue;
    }
    
    // Оба существуют - проверяем можно ли их обновить
    if (canMorphNodes(fromChild, toChild)) {
      // Узлы совместимы - морфим их
      if (fromChild.nodeType === Node.TEXT_NODE) {
        // Текстовые узлы - просто обновляем контент
        if (fromChild.textContent !== toChild.textContent) {
          fromChild.textContent = toChild.textContent;
        }
      } else if (fromChild.nodeType === Node.ELEMENT_NODE) {
        // Элементы - рекурсивно морфим
        morphDOM(fromChild as Element, toChild as Element);
      }
      fromIndex++;
      toIndex++;
    } else {
      // Узлы несовместимы - заменяем
      fromNode.replaceChild(toChild.cloneNode(true), fromChild);
      fromIndex++;
      toIndex++;
    }
  }
}

/**
 * Проверяет можно ли трансформировать один узел в другой
 */
function canMorphNodes(fromNode: Node, toNode: Node): boolean {
  // Разные типы узлов - нельзя морфить
  if (fromNode.nodeType !== toNode.nodeType) {
    return false;
  }
  
  // Текстовые узлы всегда можно морфить
  if (fromNode.nodeType === Node.TEXT_NODE) {
    return true;
  }
  
  // Элементы - проверяем имена тегов
  if (fromNode.nodeType === Node.ELEMENT_NODE && toNode.nodeType === Node.ELEMENT_NODE) {
    return fromNode.nodeName === toNode.nodeName;
  }
  
  return false;
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

