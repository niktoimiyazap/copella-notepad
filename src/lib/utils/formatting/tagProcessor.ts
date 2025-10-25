/**
 * Обработчик команд TAG для текстового редактора
 * Поддерживает команды вида: TAG=Text(Color)
 * Пример: TAG=Важный текст(Red) -> текст "Важный текст" с красным фоном
 */

// Поддерживаемые цвета
const SUPPORTED_COLORS: Record<string, string> = {
	'red': '#FF4444',
	'blue': '#4444FF',
	'green': '#44FF44',
	'yellow': '#FFFF44',
	'orange': '#FF8844',
	'purple': '#8844FF',
	'pink': '#FF44FF',
	'cyan': '#44FFFF',
	'gray': '#888888',
	'black': '#000000',
	'white': '#FFFFFF'
};

/**
 * Парсит команду TAG и возвращает объект с текстом и цветом
 * @param command - команда вида "TAG=Text(Color)"
 * @returns объект с текстом и цветом или null если команда невалидна
 */
export function parseTagCommand(command: string): { text: string; color: string } | null {
	// Проверяем, не экранирована ли команда обратным слешем
	if (command.startsWith('\\TAG=')) {
		return null;
	}
	
	// Регулярное выражение для парсинга команды TAG=Text(Color)
	// Более строгое: не должно содержать переносы строк и должно быть на одной строке
	const tagRegex = /^TAG=([^\n\r(]+)\(([^\n\r)]+)\)$/i;
	const match = command.match(tagRegex);
	
	if (!match) {
		return null;
	}
	
	const text = match[1].trim();
	const colorName = match[2].trim().toLowerCase();
	
	// Дополнительная проверка: текст и цвет не должны быть пустыми
	if (!text || !colorName) {
		return null;
	}
	
	// Проверяем, поддерживается ли цвет
	const color = SUPPORTED_COLORS[colorName];
	if (!color) {
		return null;
	}
	
	return { text, color };
}

/**
 * Проверяет, является ли строка командой TAG
 * @param text - текст для проверки
 * @returns true если это команда TAG
 */
export function isTagCommand(text: string): boolean {
	const trimmedText = text.trim();
	
	// Проверяем, не экранирована ли команда обратным слешем
	if (trimmedText.startsWith('\\TAG=')) {
		return false;
	}
	
	// Более строгая проверка: команда должна быть на одной строке без переносов
	return /^TAG=[^\n\r(]+\([^\n\r)]+\)$/i.test(trimmedText);
}

/**
 * Обрабатывает команду TAG в тексте редактора
 * Заменяет команду на отформатированный текст
 * @param editorElement - элемент редактора
 * @param command - команда TAG
 * @returns true если команда была обработана
 */
export function processTagCommand(editorElement: HTMLElement, command: string): boolean {
	const parsed = parseTagCommand(command);
	if (!parsed) {
		return false;
	}
	
	const { text, color } = parsed;
	
	// Создаем элемент span с нужным форматированием
	const span = document.createElement('span');
	span.textContent = text;
	span.style.backgroundColor = color;
	span.style.color = getContrastColor(color);
	span.style.padding = '2px 6px';
	span.style.borderRadius = '4px';
	span.style.fontWeight = '500';
	
	// Находим команду в тексте и заменяем её
	const textContent = editorElement.textContent || '';
	const commandIndex = textContent.indexOf(command);
	
	if (commandIndex === -1) {
		return false;
	}
	
	// Создаем range для замены
	const range = document.createRange();
	const walker = document.createTreeWalker(
		editorElement,
		NodeFilter.SHOW_TEXT,
		null
	);
	
	let currentPos = 0;
	let textNode: Text | null = null;
	let startOffset = 0;
	
	// Находим текстовый узел, содержащий команду
	while (walker.nextNode()) {
		const node = walker.currentNode as Text;
		const nodeLength = node.textContent?.length || 0;
		
		if (currentPos + nodeLength > commandIndex) {
			textNode = node;
			startOffset = commandIndex - currentPos;
			break;
		}
		
		currentPos += nodeLength;
	}
	
	if (!textNode) {
		return false;
	}
	
	// Проверяем, что команда помещается в текстовый узел
	const nodeText = textNode.textContent || '';
	if (startOffset + command.length > nodeText.length) {
		return false;
	}
	
	// Устанавливаем range на команду
	range.setStart(textNode, startOffset);
	range.setEnd(textNode, startOffset + command.length);
	
	// Заменяем команду на отформатированный элемент
	range.deleteContents();
	range.insertNode(span);
	
	// Устанавливаем курсор после вставленного элемента
	const newRange = document.createRange();
	newRange.setStartAfter(span);
	newRange.collapse(true);
	
	const selection = window.getSelection();
	if (selection) {
		selection.removeAllRanges();
		selection.addRange(newRange);
	}
	
	return true;
}

/**
 * Обрабатывает все команды TAG в тексте редактора
 * @param editorElement - элемент редактора
 * @returns количество обработанных команд
 */
export function processAllTagCommands(editorElement: HTMLElement): number {
	const textContent = editorElement.textContent || '';
	const lines = textContent.split('\n');
	let processedCount = 0;
	
	// Обрабатываем команды в обратном порядке, чтобы не нарушать индексы
	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i].trim();
		if (isTagCommand(line)) {
			if (processTagCommand(editorElement, line)) {
				processedCount++;
			}
		}
	}
	
	return processedCount;
}

/**
 * Получает контрастный цвет для текста на заданном фоне
 * @param backgroundColor - цвет фона в формате #RRGGBB
 * @returns цвет текста (#000000 или #FFFFFF)
 */
function getContrastColor(backgroundColor: string): string {
	// Убираем # если есть
	const hex = backgroundColor.replace('#', '');
	
	// Конвертируем в RGB
	const r = parseInt(hex.substr(0, 2), 16);
	const g = parseInt(hex.substr(2, 2), 16);
	const b = parseInt(hex.substr(4, 2), 16);
	
	// Вычисляем яркость
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;
	
	// Возвращаем черный или белый в зависимости от яркости
	return brightness > 128 ? '#000000' : '#FFFFFF';
}

/**
 * Извлекает исходный текст с командами TAG из HTML
 * @param html - HTML содержимое редактора
 * @returns исходный текст с командами TAG
 */
export function extractOriginalTextWithTags(html: string): string {
	// Создаем временный элемент для парсинга HTML
	const tempDiv = document.createElement('div');
	tempDiv.innerHTML = html;
	
	// Извлекаем текст из всех элементов
	const textContent = tempDiv.textContent || tempDiv.innerText || '';
	
	// Если в тексте есть команды TAG, возвращаем их
	if (textContent.includes('TAG=')) {
		return textContent;
	}
	
	// Если команд TAG нет, возвращаем обычный текст
	return textContent;
}

/**
 * Получает список поддерживаемых цветов
 * @returns объект с названиями цветов и их значениями
 */
export function getSupportedColors(): Record<string, string> {
	return { ...SUPPORTED_COLORS };
}

/**
 * Добавляет новый поддерживаемый цвет
 * @param name - название цвета
 * @param value - значение цвета в формате #RRGGBB
 */
export function addSupportedColor(name: string, value: string): void {
	SUPPORTED_COLORS[name.toLowerCase()] = value;
}

/**
 * Обрабатывает экранированные команды TAG в тексте
 * Убирает обратный слеш перед TAG= для отображения буквального текста
 * @param text - текст для обработки
 * @returns текст с обработанными экранированными командами
 */
export function processEscapedTagCommands(text: string): string {
	// Заменяем \TAG= на TAG= для отображения буквального текста
	return text.replace(/\\TAG=/g, 'TAG=');
}
