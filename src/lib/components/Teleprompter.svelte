<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { 
		Play,
		Pause,
		RotateCcw,
		X
	} from '@lucide/svelte';
	import MentionHighlight from './MentionHighlight.svelte';
	import { processAllTagCommands, isTagCommand } from '../utils/formatting';

	// Props
	interface Props {
		text: string;
		isOpen?: boolean;
		isBeingEdited?: boolean;
		editorUsername?: string;
		onClose?: () => void;
		onContentChange?: (content: string) => void;
	}

	let { text, isOpen = false, isBeingEdited = false, editorUsername, onClose, onContentChange }: Props = $props();

	// Состояние телесуфлера
	let teleprompterSpeed = $state(50); // пикселей в секунду
	let teleprompterPosition = $state(0);
	let teleprompterAnimation: number | null = null;
	let isTeleprompterPlaying = $state(false);
	let fontSize = $state(28); // размер шрифта
	let containerElement: HTMLElement = $state();
	let textElement: HTMLElement = $state();
	let centerLineElement: HTMLElement = $state();

	// Состояние системы подсказок
	let showSuggestions = $state(false);
	let suggestionsPosition = $state({ x: 0, y: 0 });
	let cursorPosition = $state(0);
	let currentSearchQuery = $state('');

	// Локальное состояние содержимого для редактирования (не реактивное)
	let localContent = text;

	// Автоматически останавливаем воспроизведение, если кто-то начал редактировать
	$effect(() => {
		if (isBeingEdited && isTeleprompterPlaying) {
			pauseTeleprompter();
		}
	});
	
	// Функция для предварительной обработки тегов
	function preprocessTags(inputText: string): string {
		// Если текст уже содержит HTML теги (например, <br>, <div>, <p>), 
		// то обрабатываем только команды TAG, не добавляя лишние <br>
		if (inputText.includes('<') && inputText.includes('>')) {
			// Сначала обрабатываем экранированные команды (убираем обратный слеш)
			let processedText = inputText.replace(/\\TAG=/g, 'TAG=');
			
			// Обрабатываем команды TAG в HTML-тексте
			// Более строгое регулярное выражение: не должно содержать переносы строк
			const tagRegex = /TAG=([^\n\r(]+)\(([^\n\r)]+)\)/gi;
			let match;
			
			while ((match = tagRegex.exec(processedText)) !== null) {
				const fullCommand = match[0];
				const tagText = match[1].trim();
				const colorName = match[2].trim().toLowerCase();
				
				// Дополнительная проверка: текст и цвет не должны быть пустыми
				if (!tagText || !colorName) {
					continue;
				}
				
				// Получаем цвет
				const color = getTagColor(colorName);
				if (color) {
					const contrastColor = getContrastColor(color);
					const formattedTag = `<span style="background-color: ${color}; color: ${contrastColor}; padding: 2px 6px; border-radius: 4px; font-weight: 500;">${tagText}</span>`;
					processedText = processedText.replace(fullCommand, formattedTag);
				}
			}
			
			return processedText;
		}
		
		// Если текст не содержит HTML, обрабатываем как раньше
		if (!inputText.includes('TAG=')) {
			return inputText;
		}
		
		// Обрабатываем теги в любом месте строки
		const lines = inputText.split('\n');
		const processedLines = lines.map(line => {
			// Сначала обрабатываем экранированные команды (убираем обратный слеш)
			let processedLine = line.replace(/\\TAG=/g, 'TAG=');
			
			// Ищем команды TAG в строке (не только в начале)
			// Более строгое регулярное выражение: не должно содержать переносы строк
			const tagRegex = /TAG=([^\n\r(]+)\(([^\n\r)]+)\)/gi;
			let match;
			
			while ((match = tagRegex.exec(processedLine)) !== null) {
				const fullCommand = match[0];
				const tagText = match[1].trim();
				const colorName = match[2].trim().toLowerCase();
				
				// Дополнительная проверка: текст и цвет не должны быть пустыми
				if (!tagText || !colorName) {
					continue;
				}
				
				// Получаем цвет
				const color = getTagColor(colorName);
				if (color) {
					const contrastColor = getContrastColor(color);
					const formattedTag = `<span style="background-color: ${color}; color: ${contrastColor}; padding: 2px 6px; border-radius: 4px; font-weight: 500;">${tagText}</span>`;
					processedLine = processedLine.replace(fullCommand, formattedTag);
				}
			}
			
			return processedLine;
		});
		
		return processedLines.join('<br>');
	}
	
	// Функция для получения цвета тега
	function getTagColor(colorName: string): string | null {
		const colors: Record<string, string> = {
			'red': '#FF4444',
			'blue': '#4444FF',
			'green': '#44FF44',
			'yellow': '#FFFF44',
			'orange': '#FF8844',
			'purple': '#8844FF',
			'pink': '#FF44FF',
			'cyan': '#44FFFF',
			'gray': '#888888',
			'black': '#000000',
			'white': '#FFFFFF'
		};
		return colors[colorName] || null;
	}
	
	// Функция для получения контрастного цвета
	function getContrastColor(backgroundColor: string): string {
		const hex = backgroundColor.replace('#', '');
		const r = parseInt(hex.substr(0, 2), 16);
		const g = parseInt(hex.substr(2, 2), 16);
		const b = parseInt(hex.substr(4, 2), 16);
		const brightness = (r * 299 + g * 587 + b * 114) / 1000;
		return brightness > 128 ? '#000000' : '#FFFFFF';
	}

	// Оптимизация для старых устройств - уменьшаем частоту обновления
	let lastUpdateTime = 0;
	const UPDATE_INTERVAL = 16; // ~60 FPS, но можно увеличить для старых устройств

	// Синхронизируем внешний text с локальным содержимым только при первом рендере
	$effect(() => {
		// Обрабатываем теги только при изменении text извне
		if (text && text !== localContent) {
			localContent = preprocessTags(text);
			formattedText = localContent;
		}
	});

	onMount(() => {
		// Устанавливаем фокус на контейнер для обработки клавиш
		if (containerElement) {
			containerElement.focus();
		}
	});

	onDestroy(() => {
		// Очищаем анимацию при уничтожении компонента
		if (teleprompterAnimation) {
			cancelAnimationFrame(teleprompterAnimation);
		}
	});

	function handleKeyDown(event: KeyboardEvent) {
		// Если телесуфлер воспроизводится, обрабатываем горячие клавиши
		if (isTeleprompterPlaying) {
			switch (event.key) {
				case ' ':
					event.preventDefault();
					toggleTeleprompterPlay();
					break;
				case 'Escape':
					event.preventDefault();
					handleClose();
					break;
				case 'Home':
					event.preventDefault();
					resetTeleprompter();
					break;
				case 'ArrowUp':
					event.preventDefault();
					scrollTeleprompter(-50);
					break;
				case 'ArrowDown':
					event.preventDefault();
					scrollTeleprompter(50);
					break;
				case 'PageUp':
					event.preventDefault();
					scrollTeleprompter(-200);
					break;
				case 'PageDown':
					event.preventDefault();
					scrollTeleprompter(200);
					break;
			}
		} else {
			// В режиме редактирования обрабатываем только Escape
			switch (event.key) {
				case 'Escape':
					event.preventDefault();
					handleClose();
					break;
			}
		}
	}

	function handleWheel(event: WheelEvent) {
		event.preventDefault();
		// Останавливаем автоматическую прокрутку при ручной прокрутке
		if (isTeleprompterPlaying) {
			pauseTeleprompter();
		}
		
		// Прокручиваем в зависимости от направления колесика мыши
		const scrollAmount = event.deltaY > 0 ? 30 : -30;
		scrollTeleprompter(scrollAmount);
	}

	function scrollTeleprompter(amount: number) {
		if (textElement && containerElement) {
			const containerHeight = containerElement.clientHeight;
			const textHeight = textElement.scrollHeight;
			const maxPosition = Math.max(0, textHeight - containerHeight);
			
			// Обновляем позицию с ограничениями
			teleprompterPosition = Math.max(0, Math.min(maxPosition, teleprompterPosition + amount));
		}
	}

	function handleClose() {
		pauseTeleprompter();
		if (onClose) {
			onClose();
		}
	}

	function toggleTeleprompterPlay() {
		// Блокируем воспроизведение, если кто-то редактирует текст
		if (isBeingEdited) {
			return;
		}
		
		if (isTeleprompterPlaying) {
			pauseTeleprompter();
		} else {
			playTeleprompter();
		}
	}

	function playTeleprompter() {
		// Дополнительная проверка на блокировку
		if (isBeingEdited) {
			return;
		}
		
		isTeleprompterPlaying = true;
		lastUpdateTime = performance.now();
		animateTeleprompter();
	}

	function pauseTeleprompter() {
		isTeleprompterPlaying = false;
		if (teleprompterAnimation) {
			cancelAnimationFrame(teleprompterAnimation);
			teleprompterAnimation = null;
		}
	}

	function resetTeleprompter() {
		teleprompterPosition = 0;
		if (isTeleprompterPlaying) {
			pauseTeleprompter();
		}
	}

	function animateTeleprompter() {
		if (!isTeleprompterPlaying) return;
		
		const currentTime = performance.now();
		const deltaTime = currentTime - lastUpdateTime;
		
		// Обновляем только если прошло достаточно времени (оптимизация для старых устройств)
		if (deltaTime >= UPDATE_INTERVAL) {
			// Обновляем позицию с учетом скорости (пиксели в секунду)
			teleprompterPosition += (teleprompterSpeed * deltaTime) / 1000;
			
			// Проверяем, достигли ли конца текста
			if (textElement && containerElement) {
				const containerHeight = containerElement.clientHeight;
				const textHeight = textElement.scrollHeight;
				const maxPosition = Math.max(0, textHeight - containerHeight);
				
				if (teleprompterPosition >= maxPosition) {
					// Достигли конца - останавливаем
					teleprompterPosition = maxPosition;
					pauseTeleprompter();
				}
			}
			
			lastUpdateTime = currentTime;
		}
		
		teleprompterAnimation = requestAnimationFrame(animateTeleprompter);
	}

	function changeTeleprompterSpeed(event: Event) {
		const target = event.target as HTMLInputElement;
		teleprompterSpeed = parseInt(target.value);
	}

	function changeFontSize(event: Event) {
		const target = event.target as HTMLInputElement;
		fontSize = parseInt(target.value);
	}

	function handleTextEdit(event: Event) {
		// Обрабатываем изменения в тексте
		const target = event.target as HTMLElement;
		const newContent = target.innerHTML;
		
		// Обновляем localContent без реактивности
		localContent = newContent;
		formattedText = newContent;
		
		// Синхронизируем изменения с родительским компонентом
		if (onContentChange) {
			onContentChange(newContent);
		}
		
		// Обновляем поисковый запрос для панели предложений
		if (showSuggestions) {
			updateMentionSearchQuery();
		}
	}

	function handleTextKeydown(event: KeyboardEvent) {
		// В режиме редактирования не перехватываем клавиши, кроме специальных случаев
		if (event.key === '@') {
			event.preventDefault();
			// Вставляем символ @ в текст
			document.execCommand('insertText', false, '@');
		}
		// Для всех остальных клавиш (включая пробел) позволяем нормальную обработку
	}


	function updateMentionSearchQuery() {
		if (!textElement || !showSuggestions) return;
		
		// Получаем текст до курсора
		const selection = window.getSelection();
		if (!selection || selection.rangeCount === 0) return;
		
		const range = selection.getRangeAt(0);
		const textNode = range.startContainer;
		const textContent = textNode.textContent || '';
		const cursorPosition = range.startOffset;
		
		// Ищем последний символ @ перед курсором
		const textBeforeCursor = textContent.substring(0, cursorPosition);
		const lastAtIndex = textBeforeCursor.lastIndexOf('@');
		
		if (lastAtIndex !== -1) {
			// Извлекаем текст после @
			const query = textBeforeCursor.substring(lastAtIndex + 1);
			currentSearchQuery = query;
		} else {
			// Если @ не найден, скрываем панель
			hideSuggestions();
		}
	}

	function hideSuggestions() {
		showSuggestions = false;
	}

	function handleMentionSelect(mention: any) {
		// Вставляем выбранное упоминание в текст
		const mentionText = `@${mention.label}(${mention.value || ''})`;
		
		// Здесь нужно будет вставить текст в позицию курсора
		// Пока просто добавляем в конец
		const newContent = localContent + mentionText;
		localContent = newContent;
		formattedText = newContent;
		
		// Обновляем DOM напрямую
		if (textElement) {
			textElement.innerHTML = newContent;
		}
		
		if (onContentChange) {
			onContentChange(newContent);
		}
		
		hideSuggestions();
	}

	// Используем локальное содержимое с форматированием
	let formattedText = localContent;
</script>

{#if isOpen}
	<!-- Телесуфлер -->
	<div 
		class="teleprompter-container"
		onkeydown={handleKeyDown}
		onwheel={handleWheel}
		tabindex="0"
		role="dialog"
		aria-label="Телесуфлер"
		bind:this={containerElement}
	>
		<!-- Основные кнопки управления -->
		<div class="teleprompter-main-controls">
			<div class="main-controls-group">
				<button
					class="btn btn--icon-sm"
					class:btn--primary={isTeleprompterPlaying}
					class:btn--secondary={!isTeleprompterPlaying}
					class:btn--disabled={isBeingEdited}
					onclick={toggleTeleprompterPlay}
					disabled={isBeingEdited}
					title={isBeingEdited 
						? `Заблокировано: ${editorUsername || 'кто-то'} редактирует текст` 
						: (isTeleprompterPlaying ? 'Пауза (Пробел)' : 'Воспроизведение (Пробел)')}
				>
					{#if isTeleprompterPlaying}
						<Pause size={16} class="btn-icon" />
					{:else}
						<Play size={16} class="btn-icon" />
					{/if}
				</button>
				<button
					class="btn btn--icon-sm btn--secondary"
					onclick={resetTeleprompter}
					title="Сброс (Home)"
				>
					<RotateCcw size={16} class="btn-icon" />
				</button>
				<button
					class="btn btn--icon-sm btn--secondary"
					onclick={handleClose}
					title="Выход из телесуфлера (Esc)"
				>
					<X size={16} class="btn-icon" />
				</button>
			</div>
			
			{#if isBeingEdited}
				<div class="editing-notification">
					<span class="editing-indicator"></span>
					<span class="editing-text">{editorUsername || 'Кто-то'} редактирует текст...</span>
				</div>
			{/if}
			</div>
			
		<!-- Размытые панельки с настройками -->
		<div class="teleprompter-settings-panels">
			<!-- Панель скорости -->
			<div class="settings-panel">
				<div class="panel-header">
					<span class="panel-label">Скорость</span>
					<span class="panel-value">{teleprompterSpeed}</span>
				</div>
				<input
					id="speed-control"
					type="range"
					min="10"
					max="100"
					value={teleprompterSpeed}
					oninput={changeTeleprompterSpeed}
					class="settings-slider"
				/>
			</div>

			<!-- Панель размера текста -->
			<div class="settings-panel">
				<div class="panel-header">
					<span class="panel-label">Размер</span>
					<span class="panel-value">{fontSize}px</span>
				</div>
					<input
					id="font-size-control"
					type="range"
					min="16"
					max="48"
					value={fontSize}
					oninput={changeFontSize}
					class="settings-slider"
				/>
			</div>

		</div>
		
		<div class="teleprompter-text-container" bind:this={textElement}>
			<!-- Маска затемнения - только когда воспроизводится -->
			{#if isTeleprompterPlaying}
				<div class="teleprompter-mask">
					<div class="mask-top"></div>
					<div class="mask-center"></div>
					<div class="mask-bottom"></div>
				</div>
			{/if}
			
			<div 
				class="teleprompter-text"
				class:editing-mode={!isTeleprompterPlaying}
				style="transform: translateY(-{teleprompterPosition}px); font-size: {fontSize}px;"
				contenteditable={!isTeleprompterPlaying}
				oninput={handleTextEdit}
				onkeydown={handleTextKeydown}
				role="textbox"
				aria-label="Редактируемый текст телесуфлера"
			>
				{@html formattedText}
			</div>
		</div>

	</div>
{/if}

<style>
	/* Стили телесуфлера */
	.teleprompter-container {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #000000;
		z-index: 1000;
		overflow: hidden;
	}

	/* Основные кнопки управления */
	.teleprompter-main-controls {
		position: absolute;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 20;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		border-radius: 12px;
		padding: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.main-controls-group {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	/* Размытые панельки с настройками */
	.teleprompter-settings-panels {
		position: absolute;
		top: 20px;
		right: 20px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		z-index: 20;
	}

	.settings-panel {
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		border-radius: 12px;
		padding: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		min-width: 160px;
	}

	.panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.panel-label {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 12px;
		color: #FFFFFF;
		opacity: 0.8;
	}

	.panel-value {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 12px;
		color: #FEB1FF;
	}

	.settings-slider {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		outline: none;
		border-radius: 2px;
		-webkit-appearance: none;
		transition: all 0.2s ease;
	}

	.settings-slider:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	.settings-slider::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 16px;
		height: 16px;
		background: #FEB1FF;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.settings-slider::-webkit-slider-thumb:hover {
		background: #FF9EFF;
		transform: scale(1.1);
	}

	.settings-slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		background: #FEB1FF;
		border-radius: 50%;
		cursor: pointer;
		border: none;
		transition: all 0.2s ease;
	}

	.settings-slider::-moz-range-thumb:hover {
		background: #FF9EFF;
		transform: scale(1.1);
	}


	.teleprompter-text-container {
		flex: 1;
		overflow: hidden;
		position: relative;
		background-color: #000000;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 0;
	}

	.teleprompter-mask {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 5;
		pointer-events: none;
	}

	.mask-top {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: calc(50% - 60px);
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 100%);
	}

	.mask-center {
		position: absolute;
		top: calc(50% - 60px);
		left: 0;
		right: 0;
		height: 120px;
		background: transparent;
	}

	.mask-bottom {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(50% - 60px);
		background: linear-gradient(to top, rgba(0, 0, 0, 0.9) 0%, rgba(0, 0, 0, 0.7) 100%);
	}

	.teleprompter-text {
		font-family: 'Gilroy', sans-serif;
		line-height: 1.8;
		color: #FFFFFF;
		text-align: center;
		padding: 0 80px;
		max-width: 900px;
		width: 100%;
		white-space: pre-wrap;
		word-wrap: break-word;
		/* Используем CSS transform для лучшей производительности */
		will-change: transform;
		/* Оптимизация для старых устройств */
		transform: translateZ(0);
		-webkit-transform: translateZ(0);
		font-weight: 500;
		letter-spacing: 0.5px;
		/* Добавляем отступ сверху, чтобы первая строка была видна */
		margin-top: calc(50vh - 60px);
		transition: all 0.2s ease;
	}

	.teleprompter-text.editing-mode {
		background: rgba(255, 255, 255, 0.02);
		border-radius: 8px;
		padding: 20px 80px;
		margin-top: calc(50vh - 80px);
		outline: none;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.teleprompter-text.editing-mode:focus {
		border-color: rgba(254, 177, 255, 0.3);
		background: rgba(255, 255, 255, 0.05);
		box-shadow: 0 0 0 2px rgba(254, 177, 255, 0.1);
	}

	/* Кнопки */
	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 8px 12px;
		border: none;
		border-radius: 8px;
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s ease;
		text-decoration: none;
		white-space: nowrap;
		gap: 8px;
	}

	.btn--icon-sm {
		padding: 8px;
		width: 36px;
		height: 36px;
	}

	.btn--primary {
		background-color: #FEB1FF;
		color: #1A1A1A;
	}

	.btn--primary:hover {
		background-color: #FF9EFF;
		transform: translateY(-1px);
	}

	.btn--secondary {
		background-color: #3A3A3A;
		color: #FFFFFF;
	}

	.btn--secondary:hover {
		background-color: #4A4A4A;
		transform: translateY(-1px);
	}

	.btn--disabled {
		opacity: 0.5;
		cursor: not-allowed !important;
		background-color: #2A2A2A !important;
	}

	.btn--disabled:hover {
		transform: none !important;
		background-color: #2A2A2A !important;
	}

	.editing-notification {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background-color: rgba(254, 177, 255, 0.1);
		border: 1px solid rgba(254, 177, 255, 0.3);
		border-radius: 8px;
		margin-left: 12px;
	}

	.editing-indicator {
		width: 8px;
		height: 8px;
		background-color: #FEB1FF;
		border-radius: 50%;
		animation: pulse 2s infinite;
	}

	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.editing-text {
		font-size: 14px;
		color: #FEB1FF;
		font-weight: 500;
	}

	.btn-icon {
		width: 16px;
		height: 16px;
	}

	/* Адаптивность для телесуфлера */
	@media (max-width: 768px) {
		.teleprompter-main-controls {
			top: 16px;
			padding: 6px;
		}

		.main-controls-group {
			gap: 6px;
		}

		.teleprompter-settings-panels {
			top: 16px;
			right: 16px;
			gap: 8px;
		}

		.settings-panel {
			padding: 10px;
			min-width: 140px;
		}

		.panel-label, .panel-value {
			font-size: 11px;
		}

		.teleprompter-text {
			font-size: 22px;
			padding: 0 40px;
			margin-top: calc(50vh - 40px);
		}

		.mask-center {
			height: 80px;
		}

		.mask-top {
			height: calc(50% - 40px);
		}

		.mask-bottom {
			height: calc(50% - 40px);
		}

		.btn--icon-sm {
			padding: 6px;
			width: 32px;
			height: 32px;
		}

		.btn-icon {
			width: 14px;
			height: 14px;
		}
	}

	@media (max-width: 480px) {
		.teleprompter-main-controls {
			top: 12px;
			padding: 4px;
		}

		.teleprompter-settings-panels {
			top: 12px;
			right: 12px;
			gap: 6px;
		}

		.settings-panel {
			padding: 8px;
			min-width: 120px;
		}

		.panel-label, .panel-value {
			font-size: 10px;
		}

		.teleprompter-text {
			font-size: 20px;
			padding: 0 30px;
			margin-top: calc(50vh - 30px);
		}

		.mask-center {
			height: 60px;
		}

		.mask-top {
			height: calc(50% - 30px);
		}

		.mask-bottom {
			height: calc(50% - 30px);
		}

		.btn--icon-sm {
			padding: 5px;
			width: 30px;
			height: 30px;
		}

		.btn-icon {
			width: 12px;
			height: 12px;
		}
	}

	/* Оптимизация для старых устройств */
	@media (prefers-reduced-motion: reduce) {
		.teleprompter-text {
			transition: none;
		}
		
		.btn {
			transition: none;
		}
	}
</style>
