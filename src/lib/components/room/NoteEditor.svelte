<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import EditorToolbar from './EditorToolbar.svelte';
	import EditorContent from './EditorContent.svelte';
	import RemoteCursors from './RemoteCursors.svelte';
	import EditorStatus from './EditorStatus.svelte';
	import Teleprompter from '../Teleprompter.svelte';
	import {
		getActiveFormats,
		type ActiveFormats
	} from '../../utils/formatting';
	import { DiffSyncManager, type CursorInfo } from '../../utils/diffSync';
	import { useWebSocket } from '../../websocket';
	import { applyIncrementalUpdate } from '../../utils/domDiff';
	
	type SyncStatus = 'connected' | 'syncing' | 'saved' | 'error';

	interface Note {
		id: string;
		title: string;
		content?: string;
		updatedAt: Date | string;
	}

	interface Props {
		selectedNote: Note;
		roomId?: string;
		canEdit?: boolean;
		onContentChange?: (noteId: string, content: string) => void;
	}

	let { selectedNote, roomId, canEdit = true, onContentChange }: Props = $props();

	let editorElement = $state<HTMLDivElement>();
	let isFocused = $state(false);
	let content = $state('');
	let activeFormats = $state<ActiveFormats>({
		bold: false,
		italic: false,
		underline: false,
		strikethrough: false,
		h1: false,
		h2: false,
		h3: false,
		normalText: false,
		'align-left': false,
		'align-center': false,
		'align-right': false,
		ul: false,
		ol: false
	});

	// Состояние телесуфлера
	let isTeleprompterMode = $state(false);

	let savedSelection: Range | null = null;
	let lastSelectedNoteId = $state<string | null>(null);
	let syncStatus = $state<SyncStatus>('connected');
	
	// Undo/Redo состояние
	let canUndo = $state(false);
	let canRedo = $state(false);
	
	// Отслеживаем ID заметки для менеджера синхронизации
	let lastSyncManagerNoteId = $state<string | null>(null);
	
	// Курсоры других пользователей
	let remoteCursors = $state<Map<string, CursorInfo>>(new Map());
	let cursorUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
	
	// Дебоунсинг для статуса редактирования
	let isBeingEdited = $state(false);
	let editingStatusTimeout: ReturnType<typeof setTimeout> | null = null;
	
	// Отслеживание состояния мыши для выделения текста
	let isMouseDown = $state(false);
	let mouseMoveThrottleTimeout: ReturnType<typeof setTimeout> | null = null;

	// Менеджер синхронизации
	let diffSyncManager: DiffSyncManager | null = null;
	
	// Throttle для предотвращения слишком частых обновлений при быстрой печати
	let lastInputTime = 0;
	let inputThrottleDelay = 16; // ~60 FPS, достаточно для плавности

	// Флаг для отслеживания активного ввода текста
	let isTyping = false;
	let typingTimeout: ReturnType<typeof setTimeout> | null = null;
	
	// Throttle для обновлений DOM от сервера
	let pendingRemoteUpdate: string | null = null;
	let remoteUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
	let lastRemoteUpdateTime = 0;

	// Реактивно обновляем содержимое редактора при изменении выбранной заметки
	$effect(() => {
		if (selectedNote && editorElement) {
			// Если заметка изменилась, загружаем новое содержимое
			if (lastSelectedNoteId !== selectedNote.id) {
				// Загружаем содержимое выбранной заметки в редактор
				editorElement.innerHTML = selectedNote.content || '';
				content = selectedNote.content || '';
				updateActiveFormats();
				lastSelectedNoteId = selectedNote.id;
			}
		}
	});

	// Реактивно обновляем менеджер синхронизации при смене заметки
	// ВАЖНО: Создаём manager ТОЛЬКО если ID заметки изменился!
	$effect(() => {
		const currentNoteId = selectedNote?.id;
		
		// Проверяем изменился ли ID заметки
		if (currentNoteId && roomId && currentNoteId !== lastSyncManagerNoteId) {
			// Обновляем последний ID
			lastSyncManagerNoteId = currentNoteId;
			
			// ВАЖНО: Очищаем курсоры при смене заметки
			remoteCursors = new Map();
			
			// Очищаем старый менеджер
			if (diffSyncManager) {
				diffSyncManager.destroy();
			}

			// Создаем новый менеджер для текущей заметки
			diffSyncManager = new DiffSyncManager({
				noteId: currentNoteId,
				roomId: roomId,
				onContentUpdate: (newContent) => {
					// Применяем обновление только если есть реальная разница
					if (!editorElement) return;
					
					// Проверяем, действительно ли контент отличается
					const currentContent = editorElement.innerHTML;
					if (currentContent === newContent) {
						return;
					}
					
					// КРИТИЧНО: Если пользователь активно печатает, откладываем обновление
					// чтобы не сбрасывать курсор во время ввода
					if (isTyping) {
						// Сохраняем pending обновление для применения позже
						pendingRemoteUpdate = newContent;
						return;
					}
					
					// Throttle: не обновляем DOM чаще чем раз в 100ms
					const now = Date.now();
					const timeSinceLastUpdate = now - lastRemoteUpdateTime;
					
					if (timeSinceLastUpdate < 100 && !isFocused) {
						// Сохраняем pending обновление
						pendingRemoteUpdate = newContent;
						
						// Если таймер не установлен, устанавливаем
						if (!remoteUpdateTimeout) {
							remoteUpdateTimeout = setTimeout(() => {
								applyRemoteUpdate();
							}, 100 - timeSinceLastUpdate);
						}
						return;
					}
					
					// Применяем обновление немедленно
					applyRemoteContentUpdate(newContent);
				},
				onCursorsUpdate: (cursors) => {
					// КРИТИЧНО: Фильтруем курсоры только для ТЕКУЩЕЙ заметки
					const filteredCursors = new Map<string, CursorInfo>();
					for (const [userId, cursor] of cursors.entries()) {
						// Показываем курсор только если он для текущей заметки
						if (cursor.noteId === currentNoteId) {
							filteredCursors.set(userId, cursor);
						}
					}
					
					remoteCursors = filteredCursors;
					
					// Обновляем статус редактирования с дебоунсингом
					if (editingStatusTimeout) {
						clearTimeout(editingStatusTimeout);
					}
					
					// Показываем статус только если есть активные курсоры
					if (filteredCursors.size > 0) {
						isBeingEdited = true;
					} else {
						// Скрываем статус с задержкой 500мс
						editingStatusTimeout = setTimeout(() => {
							if (remoteCursors.size === 0) {
								isBeingEdited = false;
							}
						}, 500);
					}
				},
				onSyncStatus: (status) => {
					syncStatus = status;
				}
			});
		}
	});

	onMount(() => {
		// Устанавливаем фокус на редактор при монтировании
		if (editorElement) {
			editorElement.focus();
		}
		
		// Слушаем события visibility для скрытия курсора когда страница неактивна
		const handleVisibilityChange = () => {
			if (document.hidden) {
				// Страница скрыта (телефон погас, свернули вкладку) - убираем курсор
				if (diffSyncManager) {
					diffSyncManager.updateCursor(-1);
				}
			}
		};
		
		document.addEventListener('visibilitychange', handleVisibilityChange);
		
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	});

	onDestroy(() => {
		// ВАЖНО: Удаляем курсор перед уничтожением компонента
		if (diffSyncManager) {
			diffSyncManager.updateCursor(-1);
		}
		
		// Очищаем таймеры при размонтировании
		if (cursorUpdateTimeout) {
			clearTimeout(cursorUpdateTimeout);
		}
		if (editingStatusTimeout) {
			clearTimeout(editingStatusTimeout);
		}
		if (mouseMoveThrottleTimeout) {
			clearTimeout(mouseMoveThrottleTimeout);
		}
		if (typingTimeout) {
			clearTimeout(typingTimeout);
		}
		if (remoteUpdateTimeout) {
			clearTimeout(remoteUpdateTimeout);
		}

		// Очищаем менеджер синхронизации
		if (diffSyncManager) {
			diffSyncManager.destroy();
			diffSyncManager = null;
		}
		
		// Очищаем все курсоры
		remoteCursors = new Map();
	});

	// Функция для применения отложенного обновления от сервера
	function applyRemoteUpdate() {
		if (pendingRemoteUpdate && editorElement) {
			applyRemoteContentUpdate(pendingRemoteUpdate);
			pendingRemoteUpdate = null;
		}
		remoteUpdateTimeout = null;
	}
	
	// Функция для применения обновления контента от сервера
	function applyRemoteContentUpdate(newContent: string) {
		if (!editorElement) return;
		
		// Обновляем время последнего обновления
		lastRemoteUpdateTime = Date.now();
		
		const currentContent = editorElement.innerHTML;
		
		// Если контент идентичен, ничего не делаем
		if (currentContent === newContent) {
			return;
		}
		
		// КРИТИЧНО: НЕ блокируем обновления, если пользователь печатает!
		// Только откладываем на короткое время если идет активный ввод (isTyping)
		if (isTyping) {
			// Сохраняем pending только если идет активная печать прямо сейчас
			pendingRemoteUpdate = newContent;
			return;
		}
		
		// Сохраняем позицию скролла
		const scrollTop = editorElement.scrollTop;
		
		// Применяем обновление используя requestAnimationFrame для плавности
		requestAnimationFrame(() => {
			if (!editorElement) return;
			
			// КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: Инкрементальное обновление DOM с сохранением курсора
			// morphDOM автоматически сохраняет курсор, даже если пользователь в фокусе
			const hasChanges = applyIncrementalUpdate(editorElement, newContent, true);
			
			if (hasChanges) {
				content = newContent;
				
				// ВАЖНО: Триггерим событие для обновления курсоров других пользователей
				editorElement.dispatchEvent(new CustomEvent('content-updated'));
			}
			
			// Восстанавливаем скролл
			editorElement.scrollTop = scrollTop;
		});
	}

	function handleFocus() {
		isFocused = true;
	}

	function handleBlur() {
		isFocused = false;
		isTyping = false;
		
		// Отправляем "пустой" курсор при потере фокуса
		if (diffSyncManager) {
			// Отправляем специальное значение -1 чтобы убрать курсор
			diffSyncManager.updateCursor(-1);
		}
		
		// Применяем все отложенные обновления когда пользователь убирает фокус
		if (pendingRemoteUpdate) {
			// Применяем сразу, не ждем
			applyRemoteUpdate();
		}
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLDivElement;
		
		// Устанавливаем флаг активного ввода
		isTyping = true;
		
		// Сбрасываем предыдущий таймер
		if (typingTimeout) {
			clearTimeout(typingTimeout);
		}
		
		// Сбрасываем флаг isTyping через короткую паузу после последнего символа
		typingTimeout = setTimeout(() => {
			isTyping = false;
			
			// Применяем отложенное обновление если есть
			if (pendingRemoteUpdate) {
				applyRemoteUpdate();
			}
		}, 200); // 200мс - короткая пауза между символами, но достаточная для батчинга
		
		// Убираем placeholder при вводе текста
		if (target.innerHTML === '<br>' || target.innerHTML === '') {
			content = '';
		} else {
			content = target.innerHTML;
		}
		
		// Обновляем локальное состояние
		if (selectedNote && onContentChange) {
			onContentChange(selectedNote.id, content);
		}
		
		// Отправляем в менеджер diff-синхронизации немедленно
		if (diffSyncManager) {
			diffSyncManager.updateContent(content);
		}
		
		// НЕ триггерим content-updated при локальном вводе!
		// Курсоры других пользователей обновятся когда придут изменения от сервера
		// Локальный ввод не должен влиять на чужие курсоры
		
		// НЕ обновляем форматы и undo/redo на каждое нажатие - это замедляет ввод
		// Они обновятся в handleKeyUp и handleMouseUp
	}

	function handleKeyDown(event: KeyboardEvent) {
		// Обработка горячих клавиш для телесуфлера
		if (isTeleprompterMode) {
			switch (event.key) {
				case 'Escape':
					event.preventDefault();
					exitTeleprompter();
					break;
			}
			return;
		}

	// Обработка горячих клавиш для редактора
	if (event.ctrlKey || event.metaKey) {
		switch (event.key) {
			case 'z':
				// Undo/Redo через Yjs
				if (!event.shiftKey) {
					event.preventDefault();
					handleUndo();
				} else {
					// Shift+Ctrl+Z = Redo (Mac style)
					event.preventDefault();
					handleRedo();
				}
				break;
			case 'y':
				// Ctrl+Y = Redo (Windows style)
				event.preventDefault();
				handleRedo();
				break;
			case 'b':
				event.preventDefault();
				document.execCommand('bold');
				updateActiveFormats();
				break;
			case 'i':
				event.preventDefault();
				document.execCommand('italic');
				updateActiveFormats();
				break;
			case 'u':
				event.preventDefault();
				document.execCommand('underline');
				updateActiveFormats();
				break;
			case 't':
				event.preventDefault();
				toggleTeleprompter();
				break;
		}
	}
	
	// Обработка горячих клавиш с Shift
	if ((event.ctrlKey || event.metaKey) && event.shiftKey) {
		switch (event.key) {
			case 'S':
				event.preventDefault();
				document.execCommand('strikeThrough');
				updateActiveFormats();
				break;
			case 'L':
				event.preventDefault();
				document.execCommand('justifyLeft');
				updateActiveFormats();
				break;
			case 'E':
				event.preventDefault();
				document.execCommand('justifyCenter');
				updateActiveFormats();
				break;
			case 'R':
				event.preventDefault();
				document.execCommand('justifyRight');
				updateActiveFormats();
				break;
			case '*': // Shift+8 дает *
				event.preventDefault();
				document.execCommand('insertUnorderedList');
				updateActiveFormats();
				break;
			case '&': // Shift+7 дает &
				event.preventDefault();
				document.execCommand('insertOrderedList');
				updateActiveFormats();
				break;
		}
	}
	
	// Обработка горячих клавиш для заголовков и обычного текста
	if (event.ctrlKey || event.metaKey) {
		switch (event.key) {
			case '1':
				event.preventDefault();
				document.execCommand('formatBlock', false, 'h1');
				updateActiveFormats();
				break;
			case '2':
				event.preventDefault();
				document.execCommand('formatBlock', false, 'h2');
				updateActiveFormats();
				break;
			case '3':
				event.preventDefault();
				document.execCommand('formatBlock', false, 'h3');
				updateActiveFormats();
				break;
			case '0':
				event.preventDefault();
				document.execCommand('formatBlock', false, 'div');
				updateActiveFormats();
				break;
		}
	}
		
		// Обработка клавиш удаления
		if (event.key === 'Backspace' || event.key === 'Delete') {
			// Проверяем содержимое после удаления
			setTimeout(() => {
				if (editorElement && (editorElement.innerHTML === '<br>' || editorElement.innerHTML === '')) {
					editorElement.innerHTML = '';
				}
			}, 0);
		}
	}

	function handlePaste(event: ClipboardEvent) {
		event.preventDefault();
		const text = event.clipboardData?.getData('text/plain') || '';
		document.execCommand('insertText', false, text);
	}

	function updateActiveFormats() {
		if (!editorElement) return;
		activeFormats = getActiveFormats();
		// Также сохраняем выделение при обновлении форматов
		saveSelection();
	}

	function updateUndoRedoState() {
		if (diffSyncManager) {
			canUndo = diffSyncManager.canUndo();
			canRedo = diffSyncManager.canRedo();
		}
	}

	function handleUndo() {
		if (diffSyncManager && editorElement) {
			// Сохраняем позицию курсора
			const selection = window.getSelection();
			const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
			const startOffset = range?.startOffset || 0;
			
			// Выполняем Undo
			const undoResult = diffSyncManager.undo();
			
			if (undoResult) {
				// Принудительно обновляем редактор (обходим проверку isFocused)
				const newContent = diffSyncManager.getContent();
				editorElement.innerHTML = newContent;
				content = newContent;
				
				// Пытаемся восстановить курсор (приблизительно)
				try {
					if (editorElement.firstChild) {
						const newRange = document.createRange();
						const newSelection = window.getSelection();
						const textNode = editorElement.firstChild;
						const offset = Math.min(startOffset, textNode.textContent?.length || 0);
						newRange.setStart(textNode, offset);
						newRange.collapse(true);
						newSelection?.removeAllRanges();
						newSelection?.addRange(newRange);
					}
				} catch (e) {
					console.error('[NoteEditor] Error restoring cursor:', e);
				}
				
				updateActiveFormats();
				updateUndoRedoState();
			}
		}
	}

	function handleRedo() {
		if (diffSyncManager && editorElement) {
			// Сохраняем позицию курсора
			const selection = window.getSelection();
			const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
			const startOffset = range?.startOffset || 0;
			
			// Выполняем Redo
			if (diffSyncManager.redo()) {
				// Принудительно обновляем редактор (обходим проверку isFocused)
				const newContent = diffSyncManager.getContent();
				editorElement.innerHTML = newContent;
				content = newContent;
				
				// Пытаемся восстановить курсор (приблизительно)
				try {
					if (editorElement.firstChild) {
						const newRange = document.createRange();
						const newSelection = window.getSelection();
						const textNode = editorElement.firstChild;
						const offset = Math.min(startOffset, textNode.textContent?.length || 0);
						newRange.setStart(textNode, offset);
						newRange.collapse(true);
						newSelection?.removeAllRanges();
						newSelection?.addRange(newRange);
					}
				} catch (e) {
					// Игнорируем ошибки позиционирования курсора
				}
				
				updateActiveFormats();
				updateUndoRedoState();
			}
		}
	}

	// Функции телесуфлера
	function toggleTeleprompter() {
		if (isTeleprompterMode) {
			exitTeleprompter();
		} else {
			// Вход в режим телесуфлера
			enterTeleprompter();
		}
	}

	function enterTeleprompter() {
		if (!editorElement) {
			return;
		}
		
		// Передаем HTML содержимое в телесуфлер, сохраняя переносы строк
		content = editorElement.innerHTML || '';
		
		isTeleprompterMode = true;
	}

	function exitTeleprompter() {
		isTeleprompterMode = false;
	}

	// Синхронизируем изменения из телесуфлера обратно в редактор
	function syncContentFromTeleprompter(newContent: string) {
		if (editorElement) {
			// Если содержимое содержит HTML теги (отформатированные теги), используем innerHTML
			// Иначе используем textContent для обычного текста
			if (newContent.includes('<span') || newContent.includes('<div') || newContent.includes('<p')) {
				editorElement.innerHTML = newContent;
			} else {
				editorElement.textContent = newContent;
			}
			content = editorElement.innerHTML;
			updateActiveFormats();
			
			// Сохраняем изменения в заметке локально
			if (selectedNote && onContentChange) {
				onContentChange(selectedNote.id, content);
			}

			// Отправляем в менеджер синхронизации
			if (diffSyncManager) {
				diffSyncManager.updateContent(content);
			}
		}
	}

	// Функции для работы с выделением
	function saveSelection() {
		const selection = window.getSelection();
		if (selection && selection.rangeCount > 0) {
			savedSelection = selection.getRangeAt(0).cloneRange();
		}
	}

	function restoreSelection() {
		if (savedSelection && editorElement) {
			const selection = window.getSelection();
			if (selection) {
				selection.removeAllRanges();
				selection.addRange(savedSelection);
			}
		}
	}

	// Отправка позиции курсора
	function updateCursorPosition(immediate = false) {
		if (!diffSyncManager || !editorElement) return;
		
		// Отменяем предыдущий таймер
		if (cursorUpdateTimeout) {
			clearTimeout(cursorUpdateTimeout);
		}
		
		const doUpdate = () => {
			const selection = window.getSelection();
			if (!selection || selection.rangeCount === 0) return;
			
			try {
				const range = selection.getRangeAt(0);
				const position = getCursorPosition(range);
				
				if (position !== null) {
					// Получаем информацию о выделении если есть
					let selectionInfo = undefined;
					if (!range.collapsed) {
						// Есть выделение
						const startPos = getCursorPositionFromPoint(range.startContainer, range.startOffset);
						const endPos = getCursorPositionFromPoint(range.endContainer, range.endOffset);
						
						if (startPos !== null && endPos !== null) {
							selectionInfo = { start: startPos, end: endPos };
						}
					}
					
					diffSyncManager?.updateCursor(position, selectionInfo);
				}
			} catch (error) {
				// Игнорируем ошибки
			}
		};
		
		// Если immediate=true (во время выделения мышью), обновляем немедленно без задержки
		if (immediate) {
			doUpdate();
		} else {
			// Задержка для батчинга, увеличена для лучшей производительности на продакшене
			cursorUpdateTimeout = setTimeout(doUpdate, 250);
		}
	}

	// Получение позиции курсора в тексте
	function getCursorPosition(range: Range): number | null {
		if (!editorElement) return null;
		
		try {
			const preRange = document.createRange();
			preRange.selectNodeContents(editorElement);
			preRange.setEnd(range.endContainer, range.endOffset);
			return preRange.toString().length;
		} catch (error) {
			return null;
		}
	}

	// Получение позиции курсора из конкретной точки в DOM
	function getCursorPositionFromPoint(node: Node, offset: number): number | null {
		if (!editorElement) return null;
		
		try {
			const preRange = document.createRange();
			preRange.selectNodeContents(editorElement);
			preRange.setEnd(node, offset);
			return preRange.toString().length;
		} catch (error) {
			return null;
		}
	}

	// Функция для восстановления курсора по числовой позиции
	function restoreCursorPosition(element: HTMLElement, position: number): void {
		try {
			const walker = document.createTreeWalker(
				element,
				NodeFilter.SHOW_TEXT,
				null
			);

			let currentPos = 0;
			let node = walker.nextNode();

			while (node) {
				const textLength = (node.textContent || '').length;
				
				if (currentPos + textLength >= position) {
					const offset = position - currentPos;
					const range = document.createRange();
					range.setStart(node, Math.min(offset, textLength));
					range.setEnd(node, Math.min(offset, textLength));
					
					const selection = window.getSelection();
					if (selection) {
						selection.removeAllRanges();
						selection.addRange(range);
					}
					return;
				}
				
				currentPos += textLength;
				node = walker.nextNode();
			}

			// Если не нашли позицию, ставим курсор в конец
			const range = document.createRange();
			range.selectNodeContents(element);
			range.collapse(false);
			
			const selection = window.getSelection();
			if (selection) {
				selection.removeAllRanges();
				selection.addRange(range);
			}
		} catch (error) {
			// Игнорируем ошибки восстановления курсора
		}
	}
	
	// Обработчики событий мыши для отслеживания выделения
	function handleMouseDown() {
		isMouseDown = true;
	}
	
	function handleMouseMove() {
		// Обновляем позицию курсора в реальном времени только если идёт выделение
		// Используем throttling чтобы не вызывать слишком часто
		if (isMouseDown && !mouseMoveThrottleTimeout) {
			updateCursorPosition(true); // immediate = true для мгновенного обновления
			
			// Ограничиваем частоту обновлений до 50мс (20 раз в секунду)
			mouseMoveThrottleTimeout = setTimeout(() => {
				mouseMoveThrottleTimeout = null;
			}, 50);
		}
	}
	
	function handleMouseUp() {
		isMouseDown = false;
		updateActiveFormats();
		updateCursorPosition();
	}
</script>

<div class="note-editor">
	<!-- Панель инструментов -->
	<EditorToolbar 
		{activeFormats}
		{isTeleprompterMode}
		{canEdit}
		{canUndo}
		{canRedo}
		onFormatChange={updateActiveFormats}
		onTeleprompterToggle={toggleTeleprompter}
		onUndo={handleUndo}
		onRedo={handleRedo}
	/>

	<!-- Область редактирования с курсорами -->
	<div class="editor-wrapper" style="position: relative;">
		<EditorContent 
			bind:editorElement
			{content}
			{canEdit}
			isBeingEdited={false}
			onFocus={handleFocus}
			onBlur={handleBlur}
			onInput={handleInput}
			onKeyDown={handleKeyDown}
			onPaste={handlePaste}
			onMouseDown={handleMouseDown}
			onMouseMove={handleMouseMove}
			onMouseUp={handleMouseUp}
			onKeyUp={() => {
				updateActiveFormats();
				updateCursorPosition();
			}}
		/>
		
		<!-- Курсоры других пользователей -->
		{#if roomId && canEdit}
			<RemoteCursors cursors={remoteCursors} {editorElement} />
		{/if}
		
		<!-- Статус редактирования и синхронизации -->
		{#if roomId}
			<EditorStatus 
				{syncStatus}
				editingUsers={Array.from(remoteCursors.values()).map(cursor => ({
					userId: cursor.userId,
					username: cursor.username,
					avatarUrl: cursor.avatarUrl,
					color: cursor.color
				}))}
			/>
		{/if}
	</div>

	<!-- Телесуфлер -->
	<Teleprompter 
		text={content}
		isOpen={isTeleprompterMode}
		isBeingEdited={false}
		editorUsername={undefined}
		onClose={exitTeleprompter}
		onContentChange={syncContentFromTeleprompter}
	/>
</div>

<style>
	@import '../../styles/editor-formatting.css';

	.note-editor {
		height: 100%;
		display: flex;
		flex-direction: column;
		background-color: #1A1A1A;
		border-radius: 16px;
		border: 1px solid #2A2A2A;
		overflow-x: hidden;
	}

	.editor-wrapper {
		position: relative;
		flex: 1;
		display: flex;
		flex-direction: column;
		min-height: 0;
	}

	/* Адаптивность для мобильных устройств */
	@media (max-width: 768px) {
		.note-editor {
			margin-right: 0 !important;
		}
	}
</style>