/**
 * Утилиты для форматирования текста (жирный, курсив, подчеркнутый, зачеркнутый)
 */

export function applyBold() {
	document.execCommand('bold');
}

export function applyItalic() {
	document.execCommand('italic');
}

export function applyUnderline() {
	document.execCommand('underline');
}

export function applyStrikethrough() {
	document.execCommand('strikeThrough');
}

export function isBoldActive(): boolean {
	return document.queryCommandState('bold');
}

export function isItalicActive(): boolean {
	return document.queryCommandState('italic');
}

export function isUnderlineActive(): boolean {
	return document.queryCommandState('underline');
}

export function isStrikethroughActive(): boolean {
	return document.queryCommandState('strikeThrough');
}
