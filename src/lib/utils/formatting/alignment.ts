/**
 * Утилиты для выравнивания текста
 */

export function alignLeft() {
	document.execCommand('justifyLeft');
}

export function alignCenter() {
	document.execCommand('justifyCenter');
}

export function alignRight() {
	document.execCommand('justifyRight');
}

export function isAlignLeftActive(): boolean {
	return document.queryCommandState('justifyLeft');
}

export function isAlignCenterActive(): boolean {
	return document.queryCommandState('justifyCenter');
}

export function isAlignRightActive(): boolean {
	return document.queryCommandState('justifyRight');
}
