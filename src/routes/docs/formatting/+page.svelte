<script lang="ts">
	import { DocsHeader } from '$lib/components/docs';
	import { 
		Bold, 
		Italic, 
		Underline, 
		Strikethrough, 
		Heading1, 
		Heading2, 
		Heading3,
		RotateCcw,
		List, 
		ListOrdered 
	} from '@lucide/svelte';
</script>

<div class="docs-page">
	<DocsHeader />

	<main class="docs-main">
		<div class="docs-container">
			<div class="docs-content">
				<h1>Форматирование текста</h1>
				<p class="docs-intro">
					Редактор Copella Notepad предоставляет мощные инструменты для форматирования текста. 
					Вы можете изменять стиль, размер, цвет и расположение текста для создания красивых и структурированных документов.
					Для начала работы создайте <a href="/docs/rooms" class="shortcut-link">новую комнату</a> или изучите <a href="/docs/shortcuts" class="shortcut-link">горячие клавиши</a> для быстрого форматирования.
				</p>

				<section class="docs-section">
					<h2>Базовое форматирование текста</h2>
					<p>
						Основные инструменты форматирования доступны в панели инструментов редактора. 
						Выделите текст и нажмите соответствующую кнопку для применения стиля.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Панель форматирования:</span>
						</div>
						<div class="demo-content">
							<div class="demo-toolbar">
								<div class="demo-button-group">
									<button class="demo-format-button demo-format-button--active">
										<Bold size={16} />
									</button>
									<button class="demo-format-button">
										<Italic size={16} />
									</button>
									<button class="demo-format-button">
										<Underline size={16} />
									</button>
									<button class="demo-format-button">
										<Strikethrough size={16} />
									</button>
								</div>
								<div class="demo-separator"></div>
								<div class="demo-button-group">
									<button class="demo-format-button">
										<Heading1 size={16} />
									</button>
									<button class="demo-format-button">
										<Heading2 size={16} />
									</button>
									<button class="demo-format-button">
										<Heading3 size={16} />
									</button>
									<button class="demo-format-button demo-format-button--active">
										<RotateCcw size={16} />
									</button>
								</div>
							</div>
						</div>
						<div class="demo-description">
							Панель инструментов редактора с кнопками форматирования
						</div>
					</div>

					<h3>Доступные стили</h3>
					
					<div class="format-options">
						<div class="format-option">
							<div class="format-header">
								<div class="format-info">
									<h4>Жирный текст</h4>
									<p>Делает текст жирным для выделения важной информации.</p>
								</div>
							</div>
						</div>

						<div class="format-option">
							<div class="format-header">
								<div class="format-info">
									<h4>Курсив</h4>
									<p>Наклоняет текст для выделения или акцента.</p>
								</div>
							</div>
						</div>

						<div class="format-option">
							<div class="format-header">
								<div class="format-info">
									<h4>Подчеркивание</h4>
									<p>Добавляет линию под текстом для выделения.</p>
								</div>
							</div>
						</div>

						<div class="format-option">
							<div class="format-header">
								<div class="format-info">
									<h4>Зачеркивание</h4>
									<p>Перечеркивает текст для обозначения удаленного или устаревшего контента.</p>
								</div>
							</div>
						</div>
					</div>

					<div class="shortcuts-info">
						<p><strong>Горячие клавиши:</strong> Для быстрого форматирования используйте <a href="/docs/shortcuts" class="shortcut-link">горячие клавиши</a>. Это значительно ускорит вашу работу с текстом. Отформатированный текст можно использовать в <a href="/docs/teleprompter" class="shortcut-link">телесуфлере</a> для презентаций.</p>
					</div>
				</section>

				<section class="docs-section">
					<h2>Заголовки и размеры текста</h2>
					<p>
						Используйте заголовки для структурирования документа и создания иерархии информации. 
						Заголовки помогают читателям быстро ориентироваться в тексте.
						Для быстрого применения заголовков используйте <a href="/docs/shortcuts" class="shortcut-link">горячие клавиши</a>.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Примеры заголовков:</span>
						</div>
						<div class="demo-content">
							<div class="demo-headings">
								<h1 class="demo-h1">Заголовок 1</h1>
								<h2 class="demo-h2">Заголовок 2</h2>
								<h3 class="demo-h3">Заголовок 3</h3>
								<p class="demo-normal">Обычный текст</p>
							</div>
						</div>
						<div class="demo-description">
							Различные уровни заголовков и обычный текст
						</div>
					</div>

					<div class="heading-options">
						<div class="heading-option">
							<h4>Заголовок 1 (H1)</h4>
							<p>Самый крупный заголовок, используется для главных разделов документа.</p>
							<div class="heading-example">
								<h1 class="example-h1">Пример заголовка 1</h1>
							</div>
						</div>

						<div class="heading-option">
							<h4>Заголовок 2 (H2)</h4>
							<p>Заголовок среднего размера для подразделов.</p>
							<div class="heading-example">
								<h2 class="example-h2">Пример заголовка 2</h2>
							</div>
						</div>

						<div class="heading-option">
							<h4>Заголовок 3 (H3)</h4>
							<p>Меньший заголовок для детализации разделов.</p>
							<div class="heading-example">
								<h3 class="example-h3">Пример заголовка 3</h3>
							</div>
						</div>

						<div class="heading-option">
							<h4>Обычный текст</h4>
							<p>Стандартный размер текста для основного контента.</p>
							<div class="heading-example">
								<p class="example-normal">Пример обычного текста</p>
							</div>
						</div>
					</div>

					<div class="tip">
						<div class="tip-icon">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"/>
								<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
								<line x1="12" y1="17" x2="12.01" y2="17"/>
							</svg>
						</div>
						<div class="tip-content">
							<strong>Совет:</strong> Используйте заголовки последовательно - H1 для главных разделов, H2 для подразделов, H3 для детализации.
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Выравнивание текста</h2>
					<p>
						Выравнивание текста помогает создать визуально привлекательный и читаемый документ. 
						Вы можете выровнять текст по левому краю, по центру или по правому краю.
						Узнайте больше о <a href="/docs/shortcuts" class="shortcut-link">горячих клавишах</a> для быстрого выравнивания.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Кнопки выравнивания:</span>
						</div>
						<div class="demo-content">
							<div class="demo-alignment-buttons">
								<button class="demo-align-button demo-align-button--active">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<line x1="21" y1="10" x2="7" y2="10"/>
										<line x1="21" y1="6" x2="3" y2="6"/>
										<line x1="21" y1="14" x2="3" y2="14"/>
										<line x1="21" y1="18" x2="7" y2="18"/>
									</svg>
								</button>
								<button class="demo-align-button">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<line x1="18" y1="10" x2="6" y2="10"/>
										<line x1="21" y1="6" x2="3" y2="6"/>
										<line x1="21" y1="14" x2="3" y2="14"/>
										<line x1="18" y1="18" x2="6" y2="18"/>
									</svg>
								</button>
								<button class="demo-align-button">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<line x1="3" y1="10" x2="17" y2="10"/>
										<line x1="21" y1="6" x2="3" y2="6"/>
										<line x1="21" y1="14" x2="3" y2="14"/>
										<line x1="3" y1="18" x2="17" y2="18"/>
									</svg>
								</button>
							</div>
						</div>
						<div class="demo-description">
							Кнопки для выравнивания текста по левому краю, центру и правому краю
						</div>
					</div>

					<div class="alignment-examples">
						<div class="alignment-example">
							<h4>Выравнивание по левому краю</h4>
							<p>Стандартное выравнивание для большинства текстовых документов.</p>
							<div class="example-text example-text--left">
								Этот текст выровнен по левому краю. Это наиболее распространенный способ выравнивания текста в документах, так как он обеспечивает хорошую читаемость и привычен для большинства читателей.
							</div>
						</div>

						<div class="alignment-example">
							<h4>Выравнивание по центру</h4>
							<p>Идеально подходит для заголовков, цитат и декоративных элементов.</p>
							<div class="example-text example-text--center">
								Этот текст выровнен по центру. Центрирование часто используется для заголовков, подписей к изображениям и других элементов, которые должны привлекать внимание.
							</div>
						</div>

						<div class="alignment-example">
							<h4>Выравнивание по правому краю</h4>
							<p>Подходит для дат, подписей и специальных форматов.</p>
							<div class="example-text example-text--right">
								Этот текст выровнен по правому краю. Такое выравнивание часто используется для дат, подписей, адресов и других элементов, которые должны быть выровнены по правому краю страницы.
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Списки</h2>
					<p>
						Списки помогают организовать информацию в структурированном виде. 
						Вы можете создавать маркированные (неупорядоченные) и нумерованные (упорядоченные) списки.
						Для быстрого создания списков используйте <a href="/docs/shortcuts" class="shortcut-link">горячие клавиши</a>.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Кнопки списков:</span>
						</div>
						<div class="demo-content">
							<div class="demo-list-buttons">
								<button class="demo-list-button">
									<List size={16} />
								</button>
								<button class="demo-list-button">
									<ListOrdered size={16} />
								</button>
							</div>
						</div>
						<div class="demo-description">
							Кнопки для создания маркированного и нумерованного списков
						</div>
					</div>

					<div class="list-examples">
						<div class="list-example">
							<h4>Маркированный список</h4>
							<p>Используется для перечисления элементов без определенного порядка.</p>
							<div class="example-list">
								<ul class="example-ul">
									<li>Первый элемент списка</li>
									<li>Второй элемент списка</li>
									<li>Третий элемент списка</li>
									<li>Четвертый элемент списка</li>
								</ul>
							</div>
						</div>

						<div class="list-example">
							<h4>Нумерованный список</h4>
							<p>Используется для перечисления элементов в определенном порядке.</p>
							<div class="example-list">
								<ol class="example-ol">
									<li>Первый шаг</li>
									<li>Второй шаг</li>
									<li>Третий шаг</li>
									<li>Четвертый шаг</li>
								</ol>
							</div>
						</div>
					</div>

					<div class="tip">
						<div class="tip-icon">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"/>
								<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
								<line x1="12" y1="17" x2="12.01" y2="17"/>
							</svg>
						</div>
						<div class="tip-content">
							<strong>Совет:</strong> Для выхода из списка нажмите Enter дважды или используйте кнопку "Сброс размера текста".
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Цвета текста</h2>
					<p>
						Цветовое оформление помогает выделить важную информацию и сделать документ более привлекательным. 
						Вы можете изменять цвет текста.
						Для работы с цветами также доступны <a href="/docs/shortcuts" class="shortcut-link">горячие клавиши</a>.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Цветовой пикер:</span>
						</div>
						<div class="demo-content">
							<div class="demo-color-picker">
								<div class="demo-color-button">
									<div class="demo-color-preview" style="background-color: #FEB1FF;"></div>
									<span>Цвет текста</span>
								</div>
							</div>
						</div>
						<div class="demo-description">
							Цветовой пикер для выбора цвета текста
						</div>
					</div>

					<div class="color-options">
						<div class="color-option">
							<h4>Цвет текста</h4>
							<p>Изменяет цвет самого текста для выделения важной информации.</p>
							<div class="color-examples">
								<span class="color-example" style="color: #FEB1FF;">Розовый текст</span>
								<span class="color-example" style="color: #22c55e;">Зеленый текст</span>
								<span class="color-example" style="color: #3b82f6;">Синий текст</span>
								<span class="color-example" style="color: #f59e0b;">Оранжевый текст</span>
							</div>
						</div>

					</div>

					<div class="warning">
						<div class="warning-icon">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
								<line x1="12" y1="9" x2="12" y2="13"/>
								<line x1="12" y1="17" x2="12.01" y2="17"/>
							</svg>
						</div>
						<div class="warning-content">
							<strong>Важно:</strong> Используйте цвета умеренно. Слишком много цветов может сделать документ трудночитаемым.
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

	.docs-section h3 {
		margin: 32px 0 12px 0;
		font-size: 20px;
		font-weight: 500;
		color: #ffffff;
	}

	.docs-section h4 {
		margin: 20px 0 8px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.docs-section p {
		margin: 0 0 16px 0;
		font-size: 16px;
		color: #c0c0c0;
		line-height: 1.6;
	}

	.docs-section ul {
		margin: 0 0 16px 0;
		padding-left: 24px;
	}

	.docs-section li {
		margin: 0 0 8px 0;
		font-size: 16px;
		color: #c0c0c0;
		line-height: 1.5;
	}

	/* UI Demo */
	.ui-demo {
		margin: 20px 0;
	}

	.demo-header {
		margin-bottom: 12px;
	}

	.demo-title {
		font-size: 14px;
		font-weight: 500;
		color: #ffffff;
	}

	.demo-content {
		padding: 16px 0;
		display: flex;
		justify-content: flex-start;
		align-items: center;
	}

	.demo-description {
		margin-top: 8px;
		font-size: 13px;
		color: #a0a0a0;
		text-align: left;
	}

	/* Demo Toolbar */
	.demo-toolbar {
		display: flex;
		align-items: center;
		gap: 6px;
		background-color: #242424;
		border: 1px solid #3A3A3A;
		border-radius: 8px;
		padding: 8px 12px;
	}

	.demo-button-group {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.demo-format-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 6px;
		color: #888888;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.demo-format-button--active {
		background-color: #FEB1FF;
		border-color: #FEB1FF;
		color: #121212;
	}

	.demo-format-button:hover {
		background-color: #3a3a3a;
		color: #ffffff;
	}

	.demo-format-button--active:hover {
		background-color: #E879F9;
	}

	.demo-separator {
		width: 1px;
		height: 24px;
		background-color: #3A3A3A;
		margin: 0 8px;
	}

	/* Demo Headings */
	.demo-headings {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 16px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
	}

	.demo-h1 {
		margin: 0;
		font-size: 28px;
		font-weight: 700;
		color: #FEB1FF;
	}

	.demo-h2 {
		margin: 0;
		font-size: 22px;
		font-weight: 600;
		color: #FEB1FF;
	}

	.demo-h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.demo-normal {
		margin: 0;
		font-size: 16px;
		color: #c0c0c0;
	}

	/* Demo Alignment Buttons */
	.demo-alignment-buttons {
		display: flex;
		gap: 4px;
		background-color: #242424;
		border: 1px solid #3A3A3A;
		border-radius: 8px;
		padding: 8px;
	}

	.demo-align-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 6px;
		color: #888888;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.demo-align-button--active {
		background-color: #FEB1FF;
		border-color: #FEB1FF;
		color: #121212;
	}

	/* Demo List Buttons */
	.demo-list-buttons {
		display: flex;
		gap: 4px;
		background-color: #242424;
		border: 1px solid #3A3A3A;
		border-radius: 8px;
		padding: 8px;
	}

	.demo-list-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 6px;
		color: #888888;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	/* Demo Color Picker */
	.demo-color-picker {
		display: flex;
		gap: 12px;
		background-color: #242424;
		border: 1px solid #3A3A3A;
		border-radius: 8px;
		padding: 12px;
	}

	.demo-color-button {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 6px;
		color: #c0c0c0;
		font-size: 14px;
	}

	.demo-color-preview {
		width: 20px;
		height: 20px;
		border-radius: 4px;
		border: 1px solid #3a3a3a;
	}

	/* Format Options */
	.format-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.format-option {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
		padding: 20px;
	}

	.format-header {
		margin-bottom: 16px;
	}

	.format-info h4 {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.format-info p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
	}

	.format-details {
		font-size: 14px;
		color: #a0a0a0;
	}

	.shortcuts-info {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
		margin: 20px 0;
	}

	.shortcuts-info p {
		margin: 0;
		font-size: 14px;
		color: #c0c0c0;
		line-height: 1.5;
	}

	.format-details kbd {
		display: inline-block;
		padding: 2px 6px;
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 4px;
		font-family: monospace;
		font-size: 12px;
		color: #ffffff;
	}

	/* Heading Options */
	.heading-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.heading-option {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
	}

	.heading-option h4 {
		margin: 0 0 8px 0;
		font-size: 14px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.heading-option p {
		margin: 0 0 12px 0;
		font-size: 13px;
		color: #a0a0a0;
	}

	.heading-example {
		padding: 8px 0;
	}

	.example-h1 {
		margin: 0;
		font-size: 24px;
		font-weight: 700;
		color: #FEB1FF;
	}

	.example-h2 {
		margin: 0;
		font-size: 20px;
		font-weight: 600;
		color: #FEB1FF;
	}

	.example-h3 {
		margin: 0;
		font-size: 18px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.example-normal {
		margin: 0;
		font-size: 16px;
		color: #c0c0c0;
	}

	/* Alignment Examples */
	.alignment-examples {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.alignment-example {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
	}

	.alignment-example h4 {
		margin: 0 0 8px 0;
		font-size: 14px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.alignment-example p {
		margin: 0 0 12px 0;
		font-size: 13px;
		color: #a0a0a0;
	}

	.example-text {
		padding: 12px;
		background-color: #2a2a2a;
		border-radius: 6px;
		font-size: 14px;
		color: #c0c0c0;
		line-height: 1.5;
	}

	.example-text--left {
		text-align: left;
	}

	.example-text--center {
		text-align: center;
	}

	.example-text--right {
		text-align: right;
	}

	/* List Examples */
	.list-examples {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.list-example {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
	}

	.list-example h4 {
		margin: 0 0 8px 0;
		font-size: 14px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.list-example p {
		margin: 0 0 12px 0;
		font-size: 13px;
		color: #a0a0a0;
	}

	.example-list {
		padding: 8px 0;
	}

	.example-ul {
		margin: 0;
		padding-left: 20px;
		color: #c0c0c0;
	}

	.example-ul li {
		margin: 0 0 4px 0;
		font-size: 14px;
	}

	.example-ol {
		margin: 0;
		padding-left: 20px;
		color: #c0c0c0;
	}

	.example-ol li {
		margin: 0 0 4px 0;
		font-size: 14px;
	}

	/* Color Options */
	.color-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.color-option {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
	}

	.color-option h4 {
		margin: 0 0 8px 0;
		font-size: 14px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.color-option p {
		margin: 0 0 12px 0;
		font-size: 13px;
		color: #a0a0a0;
	}

	.color-examples {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.color-example {
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 500;
	}

	/* Shortcuts Grid */
	.shortcuts-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.shortcut-item {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
	}

	.shortcut-keys {
		display: flex;
		align-items: center;
		gap: 4px;
		flex-shrink: 0;
	}

	.shortcut-keys kbd {
		display: inline-block;
		padding: 4px 8px;
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 4px;
		font-family: monospace;
		font-size: 12px;
		color: #ffffff;
		font-weight: 500;
	}

	.shortcut-description strong {
		display: block;
		margin-bottom: 4px;
		font-size: 14px;
		color: #ffffff;
	}

	.shortcut-description p {
		margin: 0;
		font-size: 13px;
		color: #a0a0a0;
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
		border-radius: 8px;
		padding: 16px;
		text-align: center;
	}

	.tip-card-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background-color: rgba(254, 177, 255, 0.1);
		border-radius: 8px;
		color: #FEB1FF;
		margin: 0 auto 12px auto;
	}

	.tip-card h4 {
		margin: 0 0 8px 0;
		font-size: 14px;
		font-weight: 500;
		color: #ffffff;
	}

	.tip-card p {
		margin: 0;
		font-size: 13px;
		color: #a0a0a0;
	}

	/* Tips and warnings */
	.tip, .warning {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		border-radius: 8px;
		margin: 20px 0;
	}

	.tip {
		background-color: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
	}

	.warning {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
	}

	.tip-icon {
		color: #3b82f6;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.warning-icon {
		color: #ef4444;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.tip-content, .warning-content {
		font-size: 14px;
		color: #c0c0c0;
		line-height: 1.5;
	}

	/* Shortcut links */
	.shortcut-link {
		color: #FEB1FF;
		text-decoration: none;
		font-weight: 500;
		transition: color 0.2s ease;
	}

	.shortcut-link:hover {
		color: #E879F9;
		text-decoration: underline;
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

		.docs-section h3 {
			font-size: 18px;
		}

		.format-options {
			grid-template-columns: 1fr;
		}

		.heading-options {
			grid-template-columns: 1fr;
		}

		.alignment-examples {
			grid-template-columns: 1fr;
		}

		.list-examples {
			grid-template-columns: 1fr;
		}

		.color-options {
			grid-template-columns: 1fr;
		}

		.shortcuts-grid {
			grid-template-columns: 1fr;
		}

		.tips-grid {
			grid-template-columns: 1fr;
		}

		.format-header {
			flex-direction: column;
			gap: 12px;
		}

		.demo-toolbar {
			flex-wrap: wrap;
			gap: 4px;
		}

		.demo-color-picker {
			flex-direction: column;
			gap: 8px;
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

		.docs-section h3 {
			font-size: 16px;
		}

		.format-option {
			padding: 16px;
		}

		.heading-option {
			padding: 12px;
		}

		.alignment-example {
			padding: 12px;
		}

		.list-example {
			padding: 12px;
		}

		.color-option {
			padding: 12px;
		}

		.shortcut-item {
			padding: 12px;
		}

		.tip-card {
			padding: 12px;
		}
	}
</style>
