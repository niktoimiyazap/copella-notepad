/**
 * Утилиты для оптимизации изображений на клиенте
 * Для Free плана Supabase (без Image Transformations API)
 */

/**
 * Сжимает изображение на клиенте перед загрузкой
 * @param file - Файл изображения
 * @param maxWidth - Максимальная ширина
 * @param maxHeight - Максимальная высота
 * @param quality - Качество (0-1)
 * @returns Promise с сжатым Blob
 */
export async function compressImage(
	file: File,
	maxWidth: number = 1200,
	maxHeight: number = 1200,
	quality: number = 0.8
): Promise<Blob> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (e) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement('canvas');
				let { width, height } = img;

				// Рассчитываем новые размеры с сохранением пропорций
				if (width > maxWidth) {
					height = (height * maxWidth) / width;
					width = maxWidth;
				}
				if (height > maxHeight) {
					width = (width * maxHeight) / height;
					height = maxHeight;
				}

				canvas.width = width;
				canvas.height = height;

				const ctx = canvas.getContext('2d');
				if (!ctx) {
					reject(new Error('Failed to get canvas context'));
					return;
				}

				// Рисуем изображение с новыми размерами
				ctx.drawImage(img, 0, 0, width, height);

				// Конвертируем в Blob с качеством
				canvas.toBlob(
					(blob) => {
						if (blob) {
							resolve(blob);
						} else {
							reject(new Error('Failed to create blob'));
						}
					},
					'image/jpeg',
					quality
				);
			};
			img.onerror = reject;
			img.src = e.target?.result as string;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/**
 * Предустановленные размеры для разных типов изображений
 */
export const IMAGE_PRESETS = {
	// Аватары
	avatar: { maxWidth: 200, maxHeight: 200, quality: 0.85 },
	
	// Обложки комнат
	roomCover: { maxWidth: 1200, maxHeight: 800, quality: 0.80 },
};

/**
 * Для Free плана просто возвращаем оригинальный URL
 * (оптимизация происходит при загрузке на сервер)
 */
export function getOptimizedAvatar(
	url: string | null | undefined,
	size?: 'small' | 'medium' | 'large'
): string | null {
	return url || null;
}

/**
 * Для Free плана просто возвращаем оригинальный URL  
 * (оптимизация происходит при загрузке на сервер)
 */
export function getOptimizedRoomCover(
	url: string | null | undefined,
	size?: 'small' | 'medium' | 'large'
): string | null {
	return url || null;
}

/**
 * Генерирует data URL для blur placeholder
 */
export function getBlurDataURL(width: number = 40, height: number = 40): string {
	// Создаем простой градиент как placeholder
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
			<defs>
				<linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
					<stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
					<stop offset="100%" style="stop-color:#242424;stop-opacity:1" />
				</linearGradient>
			</defs>
			<rect width="${width}" height="${height}" fill="url(#grad)" />
		</svg>
	`;
	
	return `data:image/svg+xml;base64,${btoa(svg)}`;
}

