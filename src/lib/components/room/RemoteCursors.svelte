<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { CursorInfo } from '../../utils/diffSync';

	interface Props {
		cursors: Map<string, CursorInfo>;
		editorElement: HTMLElement | null;
	}

	let { cursors, editorElement = $bindable(null) }: Props = $props();

	let cursorElements = new Map<string, HTMLElement>();
	let animationFrame: number | null = null;
	let scrollAnimationFrame: number | null = null;

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
	function updateCursors() {
		if (!editorElement) return;

		for (const [userId, cursor] of cursors.entries()) {
			const position = getPixelPosition(cursor.position);
			
			if (position) {
				let cursorEl = cursorElements.get(userId);
				
				if (cursorEl) {
					// Используем transform вместо top/left для лучшей производительности
					cursorEl.style.transform = `translate(${position.left}px, ${position.top}px)`;
				}
			}
		}
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
	 * Добавляем обработчик скролла при изменении editorElement
	 */
	$effect(() => {
		if (editorElement) {
			editorElement.addEventListener('scroll', handleEditorScroll);
			
			return () => {
				if (editorElement) {
					editorElement.removeEventListener('scroll', handleEditorScroll);
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
					{cursor.username || 'Пользователь'}
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
		/* Плавное движение курсора как в Figma - интерполяция позиции */
		transition: transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1);
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
		/* Плавное изменение выделения */
		transition: transform 100ms ease-out, width 100ms ease-out, height 100ms ease-out, opacity 200ms ease-out;
	}
</style>

