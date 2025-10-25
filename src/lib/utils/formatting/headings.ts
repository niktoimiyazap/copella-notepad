/**
 * Утилиты для работы с заголовками
 * Используем fontSize для inline-стилей (выделенный текст) или formatBlock для блочных заголовков
 */

// Размеры шрифта для HTML font size attribute (1-7)
// Используем большие размеры для заголовков
const HEADING_FONT_SIZES: Record<number, string> = {
	1: '7',  // h1 - самый большой
	2: '6',  // h2 - средний  
	3: '5'   // h3 - чуть больше обычного
};

export function applyHeading(level: 1 | 2 | 3) {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return;

	const range = selection.getRangeAt(0);
	
	// Если есть выделенный текст, применяем размер шрифта как inline-стиль
	if (!range.collapsed) {
		// Применяем размер шрифта к выделенному тексту
		document.execCommand('fontSize', false, HEADING_FONT_SIZES[level]);
		// Делаем текст жирным для эффекта заголовка
		document.execCommand('bold', false);
	} else {
		// Если текст не выделен, применяем к текущему блоку (блочный заголовок)
		document.execCommand('formatBlock', false, `h${level}`);
	}
}

export function resetTextSize() {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return;

	const range = selection.getRangeAt(0);
	
	// Если есть выделенный текст
	if (!range.collapsed) {
		// Устанавливаем нормальный размер шрифта (3 = 13.5px, стандартный размер)
		document.execCommand('fontSize', false, '3');
		
		// Убираем жирность, если она есть (toggle off)
		if (document.queryCommandState('bold')) {
			document.execCommand('bold', false);
		}
	} else {
		// Если текст не выделен, возвращаем блок к обычному параграфу
		document.execCommand('formatBlock', false, 'p');
	}
}

export function isHeadingActive(level: 1 | 2 | 3): boolean {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return false;
	
	const range = selection.getRangeAt(0);
	const container = range.commonAncestorContainer;
	const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
	
	if (!element) return false;
	
	const headingElement = element.closest(`h${level}`);
	return !!headingElement;
}

export function isNormalText(): boolean {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return false;
	
	const range = selection.getRangeAt(0);
	const container = range.commonAncestorContainer;
	const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
	
	if (!element) return true; // Если нет элемента, считаем что это обычный текст
	
	// Проверяем, что это не заголовок
	const headingElement = element.closest('h1, h2, h3, h4, h5, h6');
	return !headingElement;
}
