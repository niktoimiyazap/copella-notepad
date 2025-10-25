/**
 * Цвета для тегов
 */
export const TAG_COLORS = {
	red: '#FF4444',
	blue: '#4444FF',
	green: '#44FF44',
	yellow: '#FFFF44',
	orange: '#FF8844',
	purple: '#8844FF',
	pink: '#FF44FF',
	cyan: '#44FFFF',
	gray: '#888888',
	black: '#000000',
	white: '#FFFFFF'
} as const;

/**
 * Получить цвет тега по имени
 */
export function getTagColor(colorName: string): string | null {
	return TAG_COLORS[colorName as keyof typeof TAG_COLORS] || null;
}

/**
 * Получить контрастный цвет для фона
 */
export function getContrastColor(backgroundColor: string): string {
	const hex = backgroundColor.replace('#', '');
	const r = parseInt(hex.substr(0, 2), 16);
	const g = parseInt(hex.substr(2, 2), 16);
	const b = parseInt(hex.substr(4, 2), 16);
	const brightness = (r * 299 + g * 587 + b * 114) / 1000;
	return brightness > 128 ? '#000000' : '#FFFFFF';
}

/**
 * Массив цветов для UI компонентов
 */
export const TAG_COLOR_OPTIONS = [
	{ name: 'red', value: TAG_COLORS.red },
	{ name: 'blue', value: TAG_COLORS.blue },
	{ name: 'green', value: TAG_COLORS.green },
	{ name: 'yellow', value: TAG_COLORS.yellow },
	{ name: 'orange', value: TAG_COLORS.orange },
	{ name: 'purple', value: TAG_COLORS.purple },
	{ name: 'pink', value: TAG_COLORS.pink },
	{ name: 'cyan', value: TAG_COLORS.cyan },
	{ name: 'gray', value: TAG_COLORS.gray }
];
