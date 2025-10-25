<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import TagIndicator from './TagIndicator.svelte';
	import { getTagColor } from '../../utils/formatting';

	interface Props {
		content: string;
		canEdit?: boolean;
		isBeingEdited?: boolean;
		onFocus: () => void;
		onBlur: () => void;
		onInput: (event: Event) => void;
		onKeyDown: (event: KeyboardEvent) => void;
		onPaste: (event: ClipboardEvent) => void;
		onMouseDown: () => void;
		onMouseMove: () => void;
		onMouseUp: () => void;
		onKeyUp: () => void;
		editorElement?: HTMLDivElement;
	}

	let { content, canEdit = true, isBeingEdited = false, onFocus, onBlur, onInput, onKeyDown, onPaste, onMouseDown, onMouseMove, onMouseUp, onKeyUp, editorElement = $bindable() }: Props = $props();

	let isFocused = $state(false);
	let tags = $state<Array<{id: string, color: string, position: {x: number, y: number}}>>([]);

	// Реактивное обновление индикаторов при изменении содержимого
	$effect(() => {
		if (content && editorElement) {
			setTimeout(() => {
				detectAndCreateTagIndicators();
			}, 100);
		}
	});

	onMount(() => {
		// Устанавливаем фокус на редактор при монтировании
		if (editorElement) {
			editorElement.focus();
		}
		
		// Добавляем обработчик прокрутки для обновления позиций маркеров
		if (editorElement) {
			editorElement.addEventListener('scroll', handleScroll);
		}
	});

	onDestroy(() => {
		// Очищаем обработчик прокрутки при уничтожении компонента
		if (editorElement) {
			editorElement.removeEventListener('scroll', handleScroll);
		}
	});

	// Обработчик прокрутки
	function handleScroll() {
		// Обновляем позиции маркеров при прокрутке
		setTimeout(() => {
			detectAndCreateTagIndicators();
		}, 10);
	}

	function handleFocus() {
		isFocused = true;
		onFocus();
	}

	function handleBlur() {
		isFocused = false;
		// Если содержимое пустое, очищаем его полностью для показа placeholder
		if (editorElement && (editorElement.innerHTML === '<br>' || editorElement.innerHTML === '')) {
			editorElement.innerHTML = '';
		}
		onBlur();
	}


	// Обработчик ввода с обнаружением тегов
	function handleInput(event: Event) {
		onInput(event);
		
		// Обнаруживаем теги после небольшой задержки
		setTimeout(() => {
			detectAndCreateTagIndicators();
		}, 100);
	}

	// Функция для обнаружения команд TAG= в тексте и создания индикаторов
	function detectAndCreateTagIndicators() {
		if (!editorElement) return;
		
		// Очищаем старые индикаторы
		tags = [];
		
		// Получаем весь текст редактора
		const textContent = editorElement.textContent || '';
		
		// Ищем команды TAG= в тексте
		// Более строгое регулярное выражение: не должно содержать переносы строк
		const tagRegex = /TAG=([^\n\r(]+)\(([^\n\r)]+)\)/gi;
		let match;
		let tagId = 0;
		
		while ((match = tagRegex.exec(textContent)) !== null) {
			const fullCommand = match[0];
			const tagText = match[1].trim();
			const colorName = match[2].trim().toLowerCase();
			
			// Проверяем, не экранирована ли команда обратным слешем
			// Ищем позицию команды в исходном тексте
			const commandIndex = textContent.indexOf(fullCommand, match.index);
			if (commandIndex > 0 && textContent[commandIndex - 1] === '\\') {
				continue; // Пропускаем экранированную команду
			}
			
			// Дополнительная проверка: текст и цвет не должны быть пустыми
			if (!tagText || !colorName) {
				continue;
			}
			
			// Получаем цвет
			const color = getTagColor(colorName);
			if (color) {
				// Находим позицию команды в DOM
				const commandIndex = textContent.indexOf(fullCommand, match.index);
				const position = getTextPosition(commandIndex, fullCommand.length);
				
				if (position) {
					tags.push({
						id: `tag-${tagId++}`,
						color: color,
						position: position
					});
				}
			}
		}
	}

	// Функция для получения позиции текста в DOM
	function getTextPosition(textIndex: number, length: number) {
		if (!editorElement) return null;
		
		try {
			// Создаем временный range для поиска позиции
			const range = document.createRange();
			const walker = document.createTreeWalker(
				editorElement,
				NodeFilter.SHOW_TEXT,
				null
			);
			
			let currentIndex = 0;
			let textNode;
			
			while (textNode = walker.nextNode()) {
				const nodeLength = textNode.textContent?.length || 0;
				
				if (currentIndex + nodeLength > textIndex) {
					// Нашли нужный текстовый узел
					const offset = textIndex - currentIndex;
					range.setStart(textNode, offset);
					range.setEnd(textNode, offset + length);
					
					const rect = range.getBoundingClientRect();
					const editorRect = editorElement.getBoundingClientRect();
					
					return {
						x: rect.right - editorRect.left + 2, // Еще правее
						y: rect.top - editorRect.top - 4 // Над текстом
					};
				}
				
				currentIndex += nodeLength;
			}
		} catch (error) {
			console.warn('Ошибка при определении позиции тега:', error);
		}
		
		return null;
	}


</script>

<div class="editor-container">
	<div
		bind:this={editorElement}
		class="editor-content"
		class:focused={isFocused}
		class:read-only={!canEdit || isBeingEdited}
		class:being-edited={isBeingEdited}
		contenteditable={canEdit && !isBeingEdited}
		onfocus={handleFocus}
		onblur={handleBlur}
		oninput={handleInput}
		onkeydown={onKeyDown}
		onpaste={onPaste}
		onmousedown={onMouseDown}
		onmousemove={onMouseMove}
		onmouseup={onMouseUp}
		onkeyup={onKeyUp}
		role="textbox"
		aria-label={isBeingEdited ? "Другой пользователь редактирует..." : (canEdit ? "Редактор заметок" : "Просмотр заметки (только чтение)")}
		tabindex="0"
	></div>
	
	<!-- Индикаторы тегов -->
	{#each tags as tag (tag.id)}
		<TagIndicator 
			tagColor={tag.color}
			position={tag.position}
		/>
	{/each}
</div>

<style>
	.editor-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		position: relative;
		min-height: 0;
	}

	.editor-content {
		flex: 1;
		padding: 32px;
		background-color: #1A1A1A;
		border: none;
		outline: none;
		font-family: 'Gilroy', sans-serif;
		font-size: 16px;
		line-height: 1.7;
		color: #FFFFFF;
		overflow-y: auto;
		transition: all 0.2s ease;
		position: relative;
	}

	.editor-content.focused {
		background-color: #1A1A1A;
	}

	.editor-content p {
		margin: 0 0 16px 0;
	}

	.editor-content p:last-child {
		margin-bottom: 0;
	}

	.editor-content:empty::before {
		content: 'Начните печатать...';
		color: #7E7E7E;
		font-style: italic;
		font-weight: 500;
		pointer-events: none;
	}

	.editor-content.read-only {
		cursor: default;
		background-color: #151515;
	}

	.editor-content.read-only:empty::before {
		content: 'У вас нет прав на редактирование этой комнаты';
		color: #999;
	}
	
	.editor-content.being-edited {
		cursor: not-allowed;
		background-color: #1F1A1F;
		border: 1px solid rgba(254, 177, 255, 0.2);
		user-select: none;
	}
	
	.editor-content.being-edited:empty::before {
		content: 'Другой пользователь редактирует эту заметку...';
		color: #FEB1FF;
	}

	/* Стили для форматированного текста */
	.editor-content b,
	.editor-content strong {
		font-weight: 600;
	}

	.editor-content i,
	.editor-content em {
		font-style: italic;
	}

	.editor-content u {
		text-decoration: underline;
	}

	.editor-content s,
	.editor-content strike {
		text-decoration: line-through;
	}

	.editor-content h1 {
		font-size: 2em;
		font-weight: 700;
		margin: 0.67em 0;
		color: #FFFFFF;
	}

	.editor-content h2 {
		font-size: 1.5em;
		font-weight: 600;
		margin: 0.75em 0;
		color: #FFFFFF;
	}

	.editor-content h3 {
		font-size: 1.17em;
		font-weight: 600;
		margin: 0.83em 0;
		color: #FFFFFF;
	}

	/* Стили для выравнивания */
	.editor-content [style*="text-align: left"] {
		text-align: left !important;
	}

	.editor-content [style*="text-align: center"] {
		text-align: center !important;
	}

	.editor-content [style*="text-align: right"] {
		text-align: right !important;
	}

	/* Скроллбар */
	.editor-content::-webkit-scrollbar {
		width: 6px;
	}

	.editor-content::-webkit-scrollbar-track {
		background: #242424;
	}

	.editor-content::-webkit-scrollbar-thumb {
		background: #555;
		border-radius: 3px;
	}

	.editor-content::-webkit-scrollbar-thumb:hover {
		background: #777;
	}

	/* Стили для команд TAG */
	.editor-content {
		/* Команды TAG отображаются как обычный текст */
	}

	/* Адаптивность для мобильных устройств */
	@media (max-width: 768px) {
		.editor-content {
			padding: 16px;
			font-size: 16px; /* Предотвращает зум на iOS */
		}
	}

	@media (max-width: 480px) {
		.editor-content {
			padding: 12px;
		}
	}
</style>
