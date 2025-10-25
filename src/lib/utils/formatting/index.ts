/**
 * Главный файл с утилитами форматирования
 */

export * from './textFormat';
export * from './headings';
export * from './alignment';
export * from './lists';
export * from './color';
export * from './tagProcessor';
export * from '../tagColors';

/**
 * Интерфейс для активных форматов
 */
export interface ActiveFormats {
	bold: boolean;
	italic: boolean;
	underline: boolean;
	strikethrough: boolean;
	h1: boolean;
	h2: boolean;
	h3: boolean;
	normalText: boolean;
	'align-left': boolean;
	'align-center': boolean;
	'align-right': boolean;
	ul: boolean;
	ol: boolean;
}

/**
 * Получает все активные форматы для текущего выделения
 */
export function getActiveFormats(): ActiveFormats {
	return {
		bold: document.queryCommandState('bold'),
		italic: document.queryCommandState('italic'),
		underline: document.queryCommandState('underline'),
		strikethrough: document.queryCommandState('strikeThrough'),
		h1: isHeadingActive(1),
		h2: isHeadingActive(2),
		h3: isHeadingActive(3),
		normalText: isNormalText(),
		'align-left': document.queryCommandState('justifyLeft'),
		'align-center': document.queryCommandState('justifyCenter'),
		'align-right': document.queryCommandState('justifyRight'),
		ul: document.queryCommandState('insertUnorderedList'),
		ol: document.queryCommandState('insertOrderedList')
	};
}

// Импорты для использования в функции
import { isHeadingActive, isNormalText } from './headings';
