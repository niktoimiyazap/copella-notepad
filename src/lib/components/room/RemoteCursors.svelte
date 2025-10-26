<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { CursorInfo, ConnectionQuality } from '../../utils/diffSync';
	import { Wifi, WifiOff } from '@lucide/svelte';

	interface Props {
		cursors: Map<string, CursorInfo>;
		editorElement: HTMLElement | null;
	}

	let { cursors, editorElement = $bindable(null) }: Props = $props();
	
	/**
	 * Получение иконки для качества соединения
	 */
	function getConnectionIcon(quality?: ConnectionQuality) {
		switch (quality) {
			case 'excellent':
			case 'good':
				return Wifi;
			case 'poor':
			case 'offline':
				return WifiOff;
			default:
				return Wifi;
		}
	}
	
	/**
	 * Получение цвета для качества соединения
	 */
	function getConnectionColor(quality?: ConnectionQuality) {
		switch (quality) {
			case 'excellent':
				return '#52B788'; // зеленый
			case 'good':
				return '#FFA07A'; // оранжевый
			case 'poor':
				return '#FF6B6B'; // красный
			case 'offline':
				return '#666'; // серый
			default:
				return '#52B788';
		}
	}
	
	/**
	 * Получение текста для качества соединения
	 */
	function getConnectionText(quality?: ConnectionQuality, latency?: number) {
		if (latency !== undefined && latency >= 0) {
			return `${Math.round(latency)}ms`;
		}
		switch (quality) {
			case 'excellent':
				return 'Отлично';
			case 'good':
				return 'Хорошо';
			case 'poor':
				return 'Плохо';
			case 'offline':
				return 'Офлайн';
			default:
				return '';
		}
	}

	let cursorElements = new Map<string, HTMLElement>();
	let animationFrame: number | null = null;
	let scrollAnimationFrame: number | null = null;
	
	// Интерполяция для плавного движения курсоров
	let cursorTargetPositions = new Map<string, { top: number; left: number }>();
	let cursorCurrentPositions = new Map<string, { top: number; left: number }>();
	let interpolationFrame: number | null = null;

	/**
	 * Получение позиции для курсора в пикселях
	 */
	function getPixelPosition(position: number): { top: number; left: number } | null {
		if (!editorElement) return null;

		try {
			// Создаем range для позиции
			const range = document.createRange();
			const walker = document.createTreeWalker(
				editorElement,
				NodeFilter.SHOW_TEXT,
				null
			);

			let currentPos = 0;
			let node = walker.nextNode();

			while (node) {
				const textLength = (node.textContent || '').length;
				
				if (currentPos + textLength >= position) {
					const offset = position - currentPos;
					range.setStart(node, Math.min(offset, textLength));
					range.setEnd(node, Math.min(offset, textLength));
					
					const rect = range.getBoundingClientRect();
					const editorRect = editorElement.getBoundingClientRect();
					
					// Не добавляем scrollTop/scrollLeft, так как контейнер курсоров 
					// находится внутри скроллящегося редактора и двигается вместе с ним
					return {
						top: rect.top - editorRect.top,
						left: rect.left - editorRect.left
					};
				}
				
				currentPos += textLength;
				node = walker.nextNode();
			}
		} catch (error) {
			// Игнорируем ошибку
		}

		return null;
	}

	/**
	 * Получение прямоугольников для выделенного текста
	 */
	function getSelectionRects(start: number, end: number): DOMRect[] | null {
		if (!editorElement) return null;

		try {
			const range = document.createRange();
			const walker = document.createTreeWalker(
				editorElement,
				NodeFilter.SHOW_TEXT,
				null
			);

			let currentPos = 0;
			let startNode = null;
			let startOffset = 0;
			let endNode = null;
			let endOffset = 0;

			// Находим начальную и конечную позиции
			let node = walker.nextNode();
			while (node) {
				const textLength = (node.textContent || '').length;
				
				if (!startNode && currentPos + textLength >= start) {
					startNode = node;
					startOffset = start - currentPos;
				}
				
				if (!endNode && currentPos + textLength >= end) {
					endNode = node;
					endOffset = end - currentPos;
					break;
				}
				
				currentPos += textLength;
				node = walker.nextNode();
			}

			if (startNode && endNode) {
				range.setStart(startNode, Math.min(startOffset, startNode.textContent?.length || 0));
				range.setEnd(endNode, Math.min(endOffset, endNode.textContent?.length || 0));
				
				const rects = Array.from(range.getClientRects());
				return rects;
			}
		} catch (error) {
			// Игнорируем ошибку
		}

		return null;
	}

	/**
	 * Обновление позиций курсоров
	 */
	/**
	 * Обновление позиций всех курсоров с интерполяцией
	 */
	function updateCursors() {
		if (!editorElement) return;

		for (const [userId, cursor] of cursors.entries()) {
			const targetPosition = getPixelPosition(cursor.position);
			
			if (targetPosition) {
				let cursorEl = cursorElements.get(userId);
				
				if (cursorEl) {
					// Сохраняем целевую позицию для интерполяции
					cursorTargetPositions.set(userId, targetPosition);
					
					// Инициализируем текущую позицию если её нет
					if (!cursorCurrentPositions.has(userId)) {
						cursorCurrentPositions.set(userId, { ...targetPosition });
						cursorEl.style.transform = `translate(${targetPosition.left}px, ${targetPosition.top}px)`;
					}
				}
			}
		}
		
		// Запускаем интерполяцию если она не запущена
		if (!interpolationFrame) {
			startInterpolation();
		}
	}
	
	/**
	 * Плавная интерполяция курсоров (убирает рывки)
	 */
	function startInterpolation() {
		function interpolate() {
			let hasMovement = false;
			
			cursorElements.forEach((element, userId) => {
				const target = cursorTargetPositions.get(userId);
				const current = cursorCurrentPositions.get(userId);
				
				if (!target || !current) return;
				
				// Коэффициент интерполяции (0.3 = плавное движение)
				const lerpFactor = 0.3;
				
				// Вычисляем новую позицию
				const newLeft = current.left + (target.left - current.left) * lerpFactor;
				const newTop = current.top + (target.top - current.top) * lerpFactor;
				
				// Проверяем достигли ли цели (с погрешностью 0.5px)
				const distanceLeft = Math.abs(target.left - newLeft);
				const distanceTop = Math.abs(target.top - newTop);
				
				if (distanceLeft > 0.5 || distanceTop > 0.5) {
					hasMovement = true;
					
					// Обновляем текущую позицию
					cursorCurrentPositions.set(userId, { left: newLeft, top: newTop });
					
					// Применяем к элементу
					element.style.transform = `translate(${newLeft}px, ${newTop}px)`;
				} else {
					// Достигли цели - устанавливаем точную позицию
					cursorCurrentPositions.set(userId, { ...target });
					element.style.transform = `translate(${target.left}px, ${target.top}px)`;
				}
			});
			
			// Продолжаем интерполяцию если есть движение
			if (hasMovement) {
				interpolationFrame = requestAnimationFrame(interpolate);
			} else {
				interpolationFrame = null;
			}
		}
		
		interpolationFrame = requestAnimationFrame(interpolate);
	}

	/**
	 * Action для регистрации элемента курсора
	 */
	function registerCursorElement(node: HTMLElement, userId: string) {
		cursorElements.set(userId, node);
		
		// Сразу обновляем позицию для этого курсора
		requestAnimationFrame(() => {
			const cursor = cursors.get(userId);
			if (cursor) {
				const position = getPixelPosition(cursor.position);
				if (position) {
					node.style.transform = `translate(${position.left}px, ${position.top}px)`;
				}
			}
		});
		
		return {
			destroy() {
				cursorElements.delete(userId);
			}
		};
	}

	/**
	 * Обработчик скролла редактора
	 */
	function handleEditorScroll() {
		if (scrollAnimationFrame) {
			cancelAnimationFrame(scrollAnimationFrame);
		}
		
		scrollAnimationFrame = requestAnimationFrame(() => {
			updateCursors();
		});
	}

	/**
	 * Реактивное обновление при изменении курсоров или editorElement
	 */
	$effect(() => {
		// Триггер при изменении cursors или editorElement
		// Создаем зависимость от всех курсоров
		if (cursors.size > 0 && editorElement) {
			if (animationFrame) {
				cancelAnimationFrame(animationFrame);
			}
			
			animationFrame = requestAnimationFrame(() => {
				updateCursors();
			});
		}
	});

	/**
	 * Обработчик обновления контента
	 */
	function handleContentUpdate() {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
		
		animationFrame = requestAnimationFrame(() => {
			updateCursors();
		});
	}

	/**
	 * Добавляем обработчики скролла и обновления контента
	 */
	$effect(() => {
		if (editorElement) {
			editorElement.addEventListener('scroll', handleEditorScroll);
			// Слушаем событие обновления контента для обновления позиций курсоров
			editorElement.addEventListener('content-updated', handleContentUpdate);
			
			return () => {
				if (editorElement) {
					editorElement.removeEventListener('scroll', handleEditorScroll);
					editorElement.removeEventListener('content-updated', handleContentUpdate);
				}
			};
		}
	});

	onDestroy(() => {
		if (animationFrame) {
			cancelAnimationFrame(animationFrame);
		}
		if (scrollAnimationFrame) {
			cancelAnimationFrame(scrollAnimationFrame);
		}
		if (interpolationFrame) {
			cancelAnimationFrame(interpolationFrame);
		}
	});
</script>

	{#if editorElement}
	<div class="remote-cursors-container">
		{#each Array.from(cursors.entries()) as [userId, cursor] (userId)}
			<!-- Курсор -->
			<div
				use:registerCursorElement={userId}
				class="remote-cursor"
				style="--cursor-color: {cursor.color}"
			>
				<div class="cursor-line"></div>
				<div class="cursor-flag">
					<span class="cursor-flag-name">{cursor.username || 'Пользователь'}</span>
					{#if cursor.connectionQuality}
						{@const Icon = getConnectionIcon(cursor.connectionQuality)}
						<span 
							class="cursor-flag-connection"
							style="color: {getConnectionColor(cursor.connectionQuality)}"
							title="{getConnectionText(cursor.connectionQuality, cursor.latency)}"
						>
							<Icon size={12} />
						</span>
					{/if}
				</div>
			</div>
			
			<!-- Выделение (если есть) -->
			{#if cursor.selection && cursor.selection.start !== cursor.selection.end}
				{@const rects = getSelectionRects(cursor.selection.start, cursor.selection.end)}
				{#if rects && editorElement}
					{@const editorRect = editorElement.getBoundingClientRect()}
					{#each rects as rect, i (i)}
						<div
							class="remote-selection"
							style="
								--cursor-color: {cursor.color};
								transform: translate({rect.left - editorRect.left}px, {rect.top - editorRect.top}px);
								width: {rect.width}px;
								height: {rect.height}px;
							"
						></div>
					{/each}
				{/if}
			{/if}
		{/each}
	</div>
{/if}

<style>
	.remote-cursors-container {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 10;
	}

	.remote-cursor {
		position: absolute;
		top: 0;
		left: 0;
		pointer-events: none;
		will-change: transform;
		/* Убираем CSS transition - используем JavaScript интерполяцию для плавности */
	}

	.cursor-line {
		width: 2px;
		height: 20px;
		background-color: var(--cursor-color);
		animation: cursor-blink 1s infinite;
	}

	.cursor-flag {
		position: absolute;
		top: -22px;
		left: 2px;
		padding: 2px 6px;
		background-color: var(--cursor-color);
		color: white;
		font-size: 11px;
		font-weight: 500;
		border-radius: 4px;
		white-space: nowrap;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
		display: flex;
		align-items: center;
		gap: 4px;
	}
	
	.cursor-flag-name {
		display: inline-block;
	}
	
	.cursor-flag-connection {
		display: inline-flex;
		align-items: center;
		opacity: 0.9;
	}

	@keyframes cursor-blink {
		0%, 49% {
			opacity: 1;
		}
		50%, 100% {
			opacity: 0.3;
		}
	}

	/* Плавное появление/исчезновение */
	.remote-cursor {
		animation: fade-in 0.2s ease-out;
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Выделение текста другими пользователями */
	.remote-selection {
		position: absolute;
		top: 0;
		left: 0;
		background-color: var(--cursor-color);
		opacity: 0.2;
		pointer-events: none;
		will-change: transform, width, height;
		/* Быстрое обновление выделения для real-time синхронизации */
		transition: transform 30ms linear, width 30ms linear, height 30ms linear, opacity 200ms ease-out;
	}
</style>

