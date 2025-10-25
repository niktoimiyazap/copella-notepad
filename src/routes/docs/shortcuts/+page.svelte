<script lang="ts">
	import { DocsHeader } from '$lib/components/docs';
	import { onMount } from 'svelte';
	import { ChevronUp, ChevronDown } from '@lucide/svelte';

	let isMac = $state(false);

	onMount(() => {
		isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
	});

	function getModifierKey() {
		return isMac ? '⌘' : 'Ctrl';
	}
</script>

<div class="docs-page">
	<DocsHeader />

	<main class="docs-main">
		<div class="docs-container">
			<div class="docs-content">
				<h1>Горячие клавиши</h1>
				<p class="docs-intro">
					Изучите горячие клавиши Copella Notepad для быстрой и эффективной работы. 
					Эти комбинации клавиш помогут вам работать быстрее, не отрываясь от клавиатуры.
					Особенно полезны горячие клавиши для работы с <a href="/docs/teleprompter" class="shortcut-link">телесуфлером</a>.
				</p>

				<section class="docs-section">
					<h2>Форматирование текста</h2>
					<p>
						Основные горячие клавиши для быстрого форматирования текста в редакторе.
					</p>

					<div class="shortcuts-grid">
						<div class="shortcut-item">
							<div class="shortcut-keys">
								<kbd>{getModifierKey()}</kbd> + <kbd>B</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Жирный текст</strong>
								<p>Применяет или убирает жирное начертание выделенного текста</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>I</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Курсив</strong>
								<p>Применяет или убирает курсивное начертание выделенного текста</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>U</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Подчеркивание</strong>
								<p>Применяет или убирает подчеркивание выделенного текста</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>Shift</kbd> + <kbd>S</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Зачеркивание</strong>
								<p>Применяет или убирает зачеркивание выделенного текста</p>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Заголовки и размеры</h2>
					<p>
						Быстрое переключение между различными размерами текста и заголовками.
					</p>

					<div class="shortcuts-grid">
						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>1</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Заголовок 1</strong>
								<p>Применяет стиль заголовка первого уровня</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>2</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Заголовок 2</strong>
								<p>Применяет стиль заголовка второго уровня</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>3</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Заголовок 3</strong>
								<p>Применяет стиль заголовка третьего уровня</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>0</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Обычный текст</strong>
								<p>Возвращает к обычному размеру текста</p>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Выравнивание текста</h2>
					<p>
						Быстрое изменение выравнивания текста для создания структурированных документов.
					</p>

					<div class="shortcuts-grid">
						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>Shift</kbd> + <kbd>L</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Выравнивание по левому краю</strong>
								<p>Выравнивает текст по левому краю</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Выравнивание по центру</strong>
								<p>Центрирует текст</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Выравнивание по правому краю</strong>
								<p>Выравнивает текст по правому краю</p>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Списки</h2>
					<p>
						Быстрое создание и управление списками для структурирования информации.
					</p>

					<div class="shortcuts-grid">
						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>Shift</kbd> + <kbd>8</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Маркированный список</strong>
								<p>Создает маркированный список или преобразует текст в список</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>Shift</kbd> + <kbd>7</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Нумерованный список</strong>
								<p>Создает нумерованный список или преобразует текст в список</p>
							</div>
						</div>

					</div>
				</section>

				<section class="docs-section">
					<h2>Телесуфлер</h2>
					<p>
						Управление режимом телесуфлера для презентаций и выступлений.
					</p>

					<div class="shortcuts-grid">
						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>T</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Переключить телесуфлер</strong>
								<p>Включает или выключает режим телесуфлера</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
								<kbd>Space</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Пауза/Продолжить</strong>
								<p>Приостанавливает или возобновляет прокрутку в телесуфлере</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
								<kbd class="arrow-key"><ChevronUp size={14} /></kbd> / <kbd class="arrow-key"><ChevronDown size={14} /></kbd>
							</div>
							<div class="shortcut-description">
								<strong>Скорость прокрутки</strong>
								<p>Увеличивает или уменьшает скорость прокрутки текста</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
								<kbd>Esc</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Выход из телесуфлера</strong>
								<p>Закрывает режим телесуфлера и возвращает к редактору</p>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Навигация и редактирование</h2>
					<p>
						Основные горячие клавиши для навигации по документу и редактирования.
					</p>

					<div class="shortcuts-grid">
						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>A</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Выделить все</strong>
								<p>Выделяет весь текст в документе</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>Z</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Отменить</strong>
								<p>Отменяет последнее действие</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>Y</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Повторить</strong>
								<p>Повторяет отмененное действие</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>F</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Поиск</strong>
								<p>Открывает панель поиска по документу</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>G</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Перейти к строке</strong>
								<p>Переходит к указанной строке в документе</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>S</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Сохранить</strong>
								<p>Сохраняет текущий документ</p>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Управление комнатами</h2>
					<p>
						Горячие клавиши для быстрого управления комнатами и навигации.
					</p>

					<div class="shortcuts-grid">
						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>N</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Новая комната</strong>
								<p>Создает новую комнату для совместной работы</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>Shift</kbd> + <kbd>N</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Новая заметка</strong>
								<p>Создает новую заметку в текущей комнате</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>K</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Быстрая навигация</strong>
								<p>Открывает панель быстрого поиска комнат и заметок</p>
							</div>
						</div>

						<div class="shortcut-item">
							<div class="shortcut-keys">
										<kbd>{getModifierKey()}</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd>
							</div>
							<div class="shortcut-description">
								<strong>Поделиться комнатой</strong>
								<p>Открывает диалог для приглашения участников</p>
							</div>
						</div>
					</div>
				</section>

			</div>
		</div>
	</main>
</div>

<style>
	.docs-page {
		height: 100%;
		display: flex;
		flex-direction: column;
		background-color: #121212;
		color: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.docs-main {
		flex: 1;
		padding: 40px 32px;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		overflow-y: auto;
	}

	.docs-container {
		width: 100%;
		max-width: 900px;
	}

	.docs-content {
		text-align: left;
	}

	.docs-content h1 {
		margin: 0 0 16px 0;
		font-size: 32px;
		font-weight: 600;
		color: #ffffff;
		line-height: 1.2;
	}

	.docs-intro {
		margin: 0 0 40px 0;
		font-size: 18px;
		color: #a0a0a0;
		line-height: 1.6;
	}

	.docs-section {
		margin-bottom: 48px;
	}

	.docs-section h2 {
		margin: 0 0 20px 0;
		font-size: 24px;
		font-weight: 600;
		color: #ffffff;
		border-bottom: 2px solid #2a2a2a;
		padding-bottom: 8px;
	}

	.docs-section p {
		margin: 0 0 24px 0;
		font-size: 16px;
		color: #c0c0c0;
		line-height: 1.6;
	}

	/* Shortcuts Grid */
	.shortcuts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.shortcut-item {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
		padding: 20px;
		transition: all 0.2s ease;
	}

	.shortcut-item:hover {
		border-color: #3a3a3a;
		background-color: #1f1f1f;
		transform: translateY(-1px);
	}

	.shortcut-keys {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
		min-width: 120px;
	}

	.shortcut-keys kbd {
		display: inline-block;
		padding: 6px 10px;
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 6px;
		font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
		font-size: 13px;
		color: #ffffff;
		font-weight: 500;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.shortcut-keys kbd.arrow-key {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 6px 8px;
		min-width: 28px;
		height: 28px;
	}

	.shortcut-description strong {
		display: block;
		margin-bottom: 6px;
		font-size: 16px;
		color: #ffffff;
		font-weight: 500;
	}

	.shortcut-description p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
		line-height: 1.4;
	}

	/* Tips Grid */
	.tips-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.tip-card {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
		padding: 20px;
		text-align: center;
		transition: all 0.2s ease;
	}

	.tip-card:hover {
		border-color: #3a3a3a;
		background-color: #1f1f1f;
		transform: translateY(-1px);
	}

	.tip-card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		background-color: rgba(254, 177, 255, 0.1);
		border-radius: 12px;
		color: #FEB1FF;
		margin: 0 auto 16px auto;
	}

	.tip-card h4 {
		margin: 0 0 8px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.tip-card p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
		line-height: 1.4;
	}

	/* Tips and warnings */
	.tip {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 20px;
		border-radius: 12px;
		margin: 32px 0;
		background-color: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
	}

	.tip-icon {
		color: #3b82f6;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.tip-content {
		font-size: 15px;
		color: #c0c0c0;
		line-height: 1.5;
	}

	.tip-content kbd {
		display: inline-block;
		padding: 2px 6px;
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 4px;
		font-family: monospace;
		font-size: 12px;
		color: #ffffff;
		margin: 0 2px;
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.docs-main {
			padding: 24px 20px;
		}

		.docs-content h1 {
			font-size: 28px;
		}

		.docs-intro {
			font-size: 16px;
		}

		.docs-section h2 {
			font-size: 22px;
		}

		.shortcuts-grid {
			grid-template-columns: 1fr;
			gap: 12px;
		}

		.tips-grid {
			grid-template-columns: 1fr;
		}

		.shortcut-item {
			padding: 16px;
			flex-direction: column;
			gap: 12px;
		}

		.shortcut-keys {
			min-width: auto;
			justify-content: flex-start;
		}

		.tip-card {
			padding: 16px;
		}
	}

	@media (max-width: 480px) {
		.docs-main {
			padding: 20px 16px;
		}

		.docs-content h1 {
			font-size: 24px;
		}

		.docs-section h2 {
			font-size: 20px;
		}

		.shortcut-item {
			padding: 14px;
		}

		.tip-card {
			padding: 14px;
		}

		.tip {
			padding: 16px;
		}
	}
</style>
