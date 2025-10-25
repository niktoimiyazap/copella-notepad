<script lang="ts">
	import { 
		Bold, 
		Italic, 
		Underline, 
		Strikethrough, 
		Heading1, 
		Heading2, 
		Heading3,
		AlignLeft,
		AlignCenter,
		AlignRight,
		List,
		ListOrdered,
		Monitor,
		RotateCcw,
		Undo,
		Redo
	} from '@lucide/svelte';
	import { onMount } from 'svelte';
	import ColorPicker from '../ColorPicker.svelte';
	import {
		applyBold,
		applyItalic,
		applyUnderline,
		applyStrikethrough,
		applyHeading,
		resetTextSize,
		alignLeft,
		alignCenter,
		alignRight,
		createUnorderedList,
		createOrderedList,
		applyTextColor,
		getActiveFormats,
		type ActiveFormats
	} from '../../utils/formatting';
	interface Props {
		activeFormats: ActiveFormats;
		isTeleprompterMode: boolean;
		canEdit?: boolean;
		canUndo?: boolean;
		canRedo?: boolean;
		onFormatChange: () => void;
		onTeleprompterToggle: () => void;
		onUndo?: () => void;
		onRedo?: () => void;
	}

	let { activeFormats, isTeleprompterMode, canEdit = true, canUndo = false, canRedo = false, onFormatChange, onTeleprompterToggle, onUndo, onRedo }: Props = $props();

	let toolbarContainer: HTMLDivElement;
	let showScrollHint = $state(false);

	onMount(() => {
		checkScrollHint();
		window.addEventListener('resize', checkScrollHint);
		return () => window.removeEventListener('resize', checkScrollHint);
	});

	function checkScrollHint() {
		if (toolbarContainer) {
			const formatButtons = toolbarContainer.querySelector('.format-buttons') as HTMLElement;
			if (formatButtons) {
				// Показываем подсказку, если контент шире контейнера
				showScrollHint = formatButtons.scrollWidth > formatButtons.clientWidth;
			}
		}
	}

	function handleScroll(event: Event) {
		const target = event.target as HTMLElement;
		// Скрываем подсказку, если достигнут конец скролла
		const isAtEnd = target.scrollLeft + target.clientWidth >= target.scrollWidth - 5;
		showScrollHint = !isAtEnd && target.scrollWidth > target.clientWidth;
	}

	function handleColorChange(event: CustomEvent<{ color: string }>) {
		const { color } = event.detail;
		applyTextColor(color);
		onFormatChange();
	}

	// Функции форматирования
	function handleBold() {
		applyBold();
		onFormatChange();
	}

	function handleItalic() {
		applyItalic();
		onFormatChange();
	}

	function handleUnderline() {
		applyUnderline();
		onFormatChange();
	}

	function handleStrikethrough() {
		applyStrikethrough();
		onFormatChange();
	}

	function handleHeading(level: 1 | 2 | 3) {
		applyHeading(level);
		onFormatChange();
	}

	function handleResetTextSize() {
		resetTextSize();
		onFormatChange();
	}

	function handleAlignLeft() {
		alignLeft();
		onFormatChange();
	}

	function handleAlignCenter() {
		alignCenter();
		onFormatChange();
	}

	function handleAlignRight() {
		alignRight();
		onFormatChange();
	}

	function handleUnorderedList() {
		createUnorderedList();
		onFormatChange();
	}

	function handleOrderedList() {
		createOrderedList();
		onFormatChange();
	}
</script>

<div class="editor-toolbar" class:disabled={!canEdit} bind:this={toolbarContainer}>
	<div class="format-buttons" class:show-scroll-hint={showScrollHint} onscroll={handleScroll}>
		<!-- Группа Undo/Redo -->
		<div class="button-group">
			<button
				class="btn btn--icon-sm btn--secondary"
				onclick={onUndo}
				disabled={!canEdit || !canUndo}
				title={canEdit ? "Отменить (Ctrl+Z)" : "Нет прав на редактирование"}
			>
				<Undo size={16} class="btn-icon" />
			</button>
			<button
				class="btn btn--icon-sm btn--secondary"
				onclick={onRedo}
				disabled={!canEdit || !canRedo}
				title={canEdit ? "Вернуть (Ctrl+Y)" : "Нет прав на редактирование"}
			>
				<Redo size={16} class="btn-icon" />
			</button>
		</div>

		<!-- Разделитель -->
		<div class="toolbar-separator"></div>

		<!-- Группа текстового форматирования -->
		<div class="button-group">
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats.bold}
				class:btn--primary={activeFormats.bold}
				onclick={handleBold}
				disabled={!canEdit}
				title={canEdit ? "Жирный (Ctrl+B)" : "Нет прав на редактирование"}
			>
				<Bold size={16} class="btn-icon" />
			</button>
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats.italic}
				class:btn--primary={activeFormats.italic}
				onclick={handleItalic}
				disabled={!canEdit}
				title={canEdit ? "Курсив (Ctrl+I)" : "Нет прав на редактирование"}
			>
				<Italic size={16} class="btn-icon" />
			</button>
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats.underline}
				class:btn--primary={activeFormats.underline}
				onclick={handleUnderline}
				disabled={!canEdit}
				title={canEdit ? "Подчеркнутый (Ctrl+U)" : "Нет прав на редактирование"}
			>
				<Underline size={16} class="btn-icon" />
			</button>
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats.strikethrough}
				class:btn--primary={activeFormats.strikethrough}
				onclick={handleStrikethrough}
				disabled={!canEdit}
				title={canEdit ? "Зачеркнутый (Ctrl+Shift+S)" : "Нет прав на редактирование"}
			>
				<Strikethrough size={16} class="btn-icon" />
			</button>
		</div>
		
		<!-- Разделитель -->
		<div class="toolbar-separator"></div>
		
		<!-- Группа заголовков -->
		<div class="button-group">
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats.h1}
				class:btn--primary={activeFormats.h1}
				onclick={() => handleHeading(1)}
				disabled={!canEdit}
				title={canEdit ? "Заголовок 1 (Ctrl+1)" : "Нет прав на редактирование"}
			>
				<Heading1 size={16} class="btn-icon" />
			</button>
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats.h2}
				class:btn--primary={activeFormats.h2}
				onclick={() => handleHeading(2)}
				disabled={!canEdit}
				title={canEdit ? "Заголовок 2 (Ctrl+2)" : "Нет прав на редактирование"}
			>
				<Heading2 size={16} class="btn-icon" />
			</button>
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats.h3}
				class:btn--primary={activeFormats.h3}
				onclick={() => handleHeading(3)}
				disabled={!canEdit}
				title={canEdit ? "Заголовок 3 (Ctrl+3)" : "Нет прав на редактирование"}
			>
				<Heading3 size={16} class="btn-icon" />
			</button>
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats.normalText}
				class:btn--primary={activeFormats.normalText}
				onclick={handleResetTextSize}
				disabled={!canEdit}
				title={canEdit ? "Обычный текст (Ctrl+0)" : "Нет прав на редактирование"}
			>
				<RotateCcw size={16} class="btn-icon" />
			</button>
		</div>

		<!-- Разделитель -->
		<div class="toolbar-separator"></div>

		<!-- Группа выравнивания -->
		<div class="button-group">
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats['align-left']}
				class:btn--primary={activeFormats['align-left']}
				onclick={handleAlignLeft}
				disabled={!canEdit}
				title={canEdit ? "Выровнять по левому краю (Ctrl+Shift+L)" : "Нет прав на редактирование"}
			>
				<AlignLeft size={16} class="btn-icon" />
			</button>
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats['align-center']}
				class:btn--primary={activeFormats['align-center']}
				onclick={handleAlignCenter}
				disabled={!canEdit}
				title={canEdit ? "Выровнять по центру (Ctrl+Shift+E)" : "Нет прав на редактирование"}
			>
				<AlignCenter size={16} class="btn-icon" />
			</button>
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats['align-right']}
				class:btn--primary={activeFormats['align-right']}
				onclick={handleAlignRight}
				disabled={!canEdit}
				title={canEdit ? "Выровнять по правому краю (Ctrl+Shift+R)" : "Нет прав на редактирование"}
			>
				<AlignRight size={16} class="btn-icon" />
			</button>
		</div>

		<!-- Разделитель -->
		<div class="toolbar-separator"></div>

		<!-- Группа списков -->
		<div class="button-group">
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats.ul}
				class:btn--primary={activeFormats.ul}
				onclick={handleUnorderedList}
				disabled={!canEdit}
				title={canEdit ? "Маркированный список (Ctrl+Shift+8)" : "Нет прав на редактирование"}
			>
				<List size={16} class="btn-icon" />
			</button>
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!activeFormats.ol}
				class:btn--primary={activeFormats.ol}
				onclick={handleOrderedList}
				disabled={!canEdit}
				title={canEdit ? "Нумерованный список (Ctrl+Shift+7)" : "Нет прав на редактирование"}
			>
				<ListOrdered size={16} class="btn-icon" />
			</button>
		</div>
		
		<!-- Разделитель -->
		<div class="toolbar-separator"></div>
		
		<!-- Цветовой пикер -->
		<div class="button-group">
			<ColorPicker disabled={!canEdit} on:colorChange={handleColorChange} />
		</div>

		<!-- Разделитель -->
		<div class="toolbar-separator"></div>

		<!-- Телесуфлер -->
		<div class="button-group">
			<button
				class="btn btn--icon-sm"
				class:btn--secondary={!isTeleprompterMode}
				class:btn--primary={isTeleprompterMode}
				onclick={onTeleprompterToggle}
				title="Телесуфлер (Ctrl+T)"
			>
				<Monitor size={16} class="btn-icon" />
			</button>
		</div>
	</div>
</div>

<style>
	.editor-toolbar {
		display: flex;
		align-items: center;
		padding: 8px 16px;
		background-color: #242424;
		border-bottom: 1px solid #3A3A3A;
		min-height: 40px;
		gap: 12px;
		position: relative;
		z-index: 20;
	}

	.format-buttons {
		display: flex;
		gap: 6px;
		align-items: center;
	}

	/* Группы кнопок */
	.button-group {
		display: flex;
		gap: 6px;
		align-items: center;
		position: static;
	}

	/* Разделитель в панели инструментов */
	.toolbar-separator {
		width: 1px;
		height: 24px;
		background-color: #3A3A3A;
		margin: 0 8px;
		opacity: 0.6;
	}

	/* Компактные кнопки для панели форматирования */
	.format-buttons .btn {
		padding: 6px;
		width: 32px;
		height: 32px;
		border-radius: 8px;
	}

	.format-buttons :global(.btn-icon) {
		width: 14px;
		height: 14px;
	}

	/* Адаптивность для мобильных устройств */
	@media (max-width: 768px) {
		.editor-toolbar {
			padding: 6px 8px;
			gap: 6px;
			min-height: 36px;
			position: relative;
			overflow-x: hidden;
			overflow-y: visible;
		}

		.format-buttons {
			gap: 4px;
			overflow-x: auto;
			overflow-y: visible;
			width: 100%;
			padding-right: 8px;
			/* Скрыть скроллбар для более чистого вида */
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none; /* Firefox */
			-ms-overflow-style: none; /* IE and Edge */
		}

		.format-buttons::-webkit-scrollbar {
			display: none; /* Chrome, Safari, Opera */
		}

		/* Визуальная подсказка о возможности скролла */
		.format-buttons.show-scroll-hint::after {
			content: '';
			position: absolute;
			right: 0;
			top: 0;
			bottom: 0;
			width: 40px;
			background: linear-gradient(to left, #242424 0%, transparent 100%);
			pointer-events: none;
			z-index: 1;
		}

		/* Еще более компактные кнопки на мобильных */
		.format-buttons .btn {
			padding: 4px;
			width: 28px;
			height: 28px;
			flex-shrink: 0; /* Предотвратить сжатие кнопок */
		}

		.format-buttons :global(.btn-icon) {
			width: 12px;
			height: 12px;
		}

		.toolbar-separator {
			flex-shrink: 0; /* Предотвратить сжатие разделителей */
		}
		
	}

	@media (max-width: 480px) {
		.editor-toolbar {
			padding: 4px 6px;
			min-height: 32px;
		}

		.format-buttons {
			gap: 3px;
		}

		/* Максимально компактные кнопки на маленьких экранах */
		.format-buttons .btn {
			padding: 3px;
			width: 26px;
			height: 26px;
		}

		.format-buttons :global(.btn-icon) {
			width: 11px;
			height: 11px;
		}
	}

	/* Предотвратить сжатие групп кнопок при скролле */
	.button-group {
		flex-shrink: 0;
	}

	/* Стили для отключенного состояния тулбара */
	.editor-toolbar.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.format-buttons button:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}
</style>
