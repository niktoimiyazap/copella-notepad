/**
 * Утилиты для работы со списками
 */

export function createUnorderedList() {
	document.execCommand('insertUnorderedList');
}

export function createOrderedList() {
	document.execCommand('insertOrderedList');
}

export function isUnorderedListActive(): boolean {
	return document.queryCommandState('insertUnorderedList');
}

export function isOrderedListActive(): boolean {
	return document.queryCommandState('insertOrderedList');
}
