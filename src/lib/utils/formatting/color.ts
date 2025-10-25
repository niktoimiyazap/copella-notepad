/**
 * Утилиты для работы с цветом текста
 */

export function applyTextColor(color: string) {
	document.execCommand('foreColor', false, color);
}

export function applyBackgroundColor(color: string) {
	if (color === 'transparent') {
		// При выборе прозрачного фона создаем новый текстовый блок
		// чтобы последующий текст не наследовал маркер
		createNewTextBlock();
	} else {
		// Для обычных цветов используем стандартный execCommand
		document.execCommand('backColor', false, color);
	}
}


function createNewTextBlock() {
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return;
	
	const range = selection.getRangeAt(0);
	
	// Создаем новый параграф
	const newParagraph = document.createElement('p');
	newParagraph.innerHTML = '<br>'; // Добавляем пустую строку
	
	// Находим правильное место для вставки
	const container = range.commonAncestorContainer;
	let targetElement: Element;
	
	if (container.nodeType === Node.TEXT_NODE) {
		targetElement = container.parentElement!;
	} else {
		targetElement = container as Element;
	}
	
	// Ищем корневой элемент редактора
	let editorRoot = targetElement;
	while (editorRoot && !editorRoot.hasAttribute('contenteditable')) {
		editorRoot = editorRoot.parentElement!;
	}
	
	if (editorRoot) {
		// Вставляем новый параграф в конец редактора
		editorRoot.appendChild(newParagraph);
		
		// Перемещаем курсор в новый параграф
		const newRange = document.createRange();
		newRange.setStart(newParagraph, 0);
		newRange.collapse(true);
		
		selection.removeAllRanges();
		selection.addRange(newRange);
	}
}

export function getCurrentTextColor(): string {
	// Получаем текущий цвет текста из выделения
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return '#FFFFFF';
	
	const range = selection.getRangeAt(0);
	const container = range.commonAncestorContainer;
	const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
	
	const computedStyle = window.getComputedStyle(element);
	return computedStyle.color || '#FFFFFF';
}

export function getCurrentBackgroundColor(): string {
	// Получаем текущий цвет фона из выделения
	const selection = window.getSelection();
	if (!selection || selection.rangeCount === 0) return 'transparent';
	
	const range = selection.getRangeAt(0);
	const container = range.commonAncestorContainer;
	const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container as Element;
	
	const computedStyle = window.getComputedStyle(element);
	return computedStyle.backgroundColor || 'transparent';
}



