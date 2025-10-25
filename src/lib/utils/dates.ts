// Утилиты для работы с датами (dayjs)
import dayjs from 'dayjs';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ru';

// Настраиваем dayjs
dayjs.extend(relativeTimePlugin);
dayjs.locale('ru');

/**
 * Форматировать дату в читаемый формат
 * @example formatDate(new Date()) // "22 окт, 14:30"
 */
export function formatDate(date: Date | string | null | undefined): string {
	if (!date) return 'Неизвестно';
	
	try {
		return dayjs(date).format('D MMM, HH:mm');
	} catch (error) {
		console.error('Error formatting date:', error, date);
		return 'Неизвестно';
	}
}

/**
 * Форматировать дату с годом
 * @example formatDateLong(new Date()) // "22 октября 2024, 14:30"
 */
export function formatDateLong(date: Date | string | null | undefined): string {
	if (!date) return 'Неизвестно';
	
	try {
		return dayjs(date).format('D MMMM YYYY, HH:mm');
	} catch (error) {
		console.error('Error formatting date:', error, date);
		return 'Неизвестно';
	}
}

/**
 * Относительное время (fromNow)
 * @example relativeTime(new Date()) // "2 часа назад"
 */
export function relativeTime(date: Date | string | null | undefined): string {
	if (!date) return 'Неизвестно';
	
	try {
		return dayjs(date).fromNow();
	} catch (error) {
		console.error('Error formatting relative time:', error, date);
		return 'Неизвестно';
	}
}

/**
 * Проверить, сегодня ли дата
 */
export function isToday(date: Date | string | null | undefined): boolean {
	if (!date) return false;
	
	try {
		return dayjs(date).isSame(dayjs(), 'day');
	} catch (error) {
		return false;
	}
}

/**
 * Проверить, вчера ли дата
 */
export function isYesterday(date: Date | string | null | undefined): boolean {
	if (!date) return false;
	
	try {
		return dayjs(date).isSame(dayjs().subtract(1, 'day'), 'day');
	} catch (error) {
		return false;
	}
}

/**
 * Умное форматирование даты
 * - Если сегодня: "Сегодня в 14:30"
 * - Если вчера: "Вчера в 14:30"
 * - Если в этом году: "22 окт в 14:30"
 * - Иначе: "22 окт 2023"
 */
export function smartFormat(date: Date | string | null | undefined): string {
	if (!date) return 'Неизвестно';
	
	try {
		const d = dayjs(date);
		
		if (isToday(date)) {
			return `Сегодня в ${d.format('HH:mm')}`;
		}
		
		if (isYesterday(date)) {
			return `Вчера в ${d.format('HH:mm')}`;
		}
		
		if (d.isSame(dayjs(), 'year')) {
			return d.format('D MMM в HH:mm');
		}
		
		return d.format('D MMM YYYY');
	} catch (error) {
		console.error('Error smart formatting date:', error, date);
		return 'Неизвестно';
	}
}

/**
 * Проверить, истек ли срок
 */
export function isExpired(date: Date | string | null | undefined): boolean {
	if (!date) return true;
	
	try {
		return dayjs(date).isBefore(dayjs());
	} catch (error) {
		return true;
	}
}

/**
 * Получить разницу в днях
 */
export function daysUntil(date: Date | string | null | undefined): number {
	if (!date) return 0;
	
	try {
		return dayjs(date).diff(dayjs(), 'day');
	} catch (error) {
		return 0;
	}
}

/**
 * Форматировать только дату
 * @example formatDateOnly(new Date()) // "22 октября 2024"
 */
export function formatDateOnly(date: Date | string | null | undefined): string {
	if (!date) return 'Неизвестно';
	
	try {
		return dayjs(date).format('D MMMM YYYY');
	} catch (error) {
		return 'Неизвестно';
	}
}

/**
 * Форматировать только время
 * @example formatTimeOnly(new Date()) // "14:30"
 */
export function formatTimeOnly(date: Date | string | null | undefined): string {
	if (!date) return '00:00';
	
	try {
		return dayjs(date).format('HH:mm');
	} catch (error) {
		return '00:00';
	}
}

