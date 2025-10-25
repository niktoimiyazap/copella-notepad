<script lang="ts">
	import { DocsHeader } from '$lib/components/docs';
	import { Tag, Palette, Zap, Info } from '@lucide/svelte';
</script>

<div class="docs-page">
	<DocsHeader />

	<main class="docs-main">
		<div class="docs-container">
			<div class="docs-content">
				<h1>Теги</h1>
				<p class="docs-intro">
					Система тегов в Copella Notepad позволяет быстро создавать цветные метки для организации и выделения важной информации. 
					Используйте специальные команды TAG для мгновенного форматирования текста с цветным фоном, особенно полезно для <a href="/docs/teleprompter" class="shortcut-link">телесуфлера</a> и презентаций.
					Для начала работы создайте <a href="/docs/rooms" class="shortcut-link">новую комнату</a> или изучите <a href="/docs/shortcuts" class="shortcut-link">горячие клавиши</a> для быстрого форматирования.
				</p>

				<section class="docs-section">
					<h2>Основы работы с тегами</h2>
					<p>
						Теги в Copella Notepad работают через специальные команды, которые автоматически преобразуются в цветные метки. 
						Это позволяет быстро выделять важную информацию без использования сложных инструментов форматирования, что особенно ценно при работе с <a href="/docs/teleprompter" class="shortcut-link">телесуфлером</a>.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Пример команды тега:</span>
						</div>
						<div class="demo-content">
							<div class="demo-tag-command">
								<code class="tag-command">TAG=Важно(Red)</code>
								<span class="arrow">→</span>
								<span class="tag-result" style="background-color: #FF4444; color: #FFFFFF;">Важно</span>
							</div>
						</div>
						<div class="demo-description">
							Команда TAG автоматически преобразуется в цветную метку
						</div>
					</div>

					<div class="tag-basics">
						<div class="tag-basic">
							<div class="tag-basic-header">
								<div class="tag-basic-icon">
									<Tag size={20} />
								</div>
								<div class="tag-basic-info">
									<h4>Простой синтаксис</h4>
									<p>Используйте команду <code>TAG=Текст(Цвет)</code> для создания меток.</p>
								</div>
							</div>
						</div>

						<div class="tag-basic">
							<div class="tag-basic-header">
								<div class="tag-basic-icon">
									<Zap size={20} />
								</div>
								<div class="tag-basic-info">
									<h4>Мгновенное форматирование</h4>
									<p>Команды обрабатываются автоматически при вводе в редакторе и в <a href="/docs/teleprompter" class="shortcut-link">телесуфлере</a>.</p>
								</div>
							</div>
						</div>

						<div class="tag-basic">
							<div class="tag-basic-header">
								<div class="tag-basic-icon">
									<Palette size={20} />
								</div>
								<div class="tag-basic-info">
									<h4>11 цветов</h4>
									<p>Доступно 11 предустановленных цветов для различных типов информации в редакторе и <a href="/docs/teleprompter" class="shortcut-link">телесуфлере</a>.</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Синтаксис команд</h2>
					<p>
						Все команды тегов следуют единому синтаксису. Название цвета указывается на английском языке в скобках после текста.
					</p>

					<div class="syntax-examples">
						<div class="syntax-example">
							<h4>Базовая структура</h4>
							<div class="syntax-code">
								<code>TAG=Текст(Цвет)</code>
							</div>
							<p>Где "Текст" - это содержимое метки, а "Цвет" - название цвета на английском языке.</p>
						</div>

						<div class="syntax-example">
							<h4>Примеры команд</h4>
							<div class="syntax-examples-list">
								<div class="syntax-example-item">
									<code>TAG=Важно(Red)</code>
									<span class="arrow">→</span>
									<span class="tag-preview" style="background-color: #FF4444; color: #FFFFFF;">Важно</span>
								</div>
								<div class="syntax-example-item">
									<code>TAG=Информация(Blue)</code>
									<span class="arrow">→</span>
									<span class="tag-preview" style="background-color: #4444FF; color: #FFFFFF;">Информация</span>
								</div>
								<div class="syntax-example-item">
									<code>TAG=Успех(Green)</code>
									<span class="arrow">→</span>
									<span class="tag-preview" style="background-color: #44FF44; color: #000000;">Успех</span>
								</div>
								<div class="syntax-example-item">
									<code>\TAG=Буквальный текст(Red)</code>
									<span class="arrow">→</span>
									<span class="text-preview">TAG=Буквальный текст(Red)</span>
								</div>
							</div>
						</div>
					</div>

					<div class="tip">
						<div class="tip-icon">
							<Info size={16} />
						</div>
						<div class="tip-content">
							<strong>Совет:</strong> Названия цветов чувствительны к регистру. Используйте только строчные буквы: red, blue, green и т.д.
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Доступные цвета</h2>
					<p>
						Система тегов поддерживает 11 предустановленных цветов. Каждый цвет автоматически получает контрастный текст для лучшей читаемости.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Палитра цветов:</span>
						</div>
						<div class="demo-content">
							<div class="color-palette">
								<div class="color-item">
									<div class="color-preview" style="background-color: #FF4444;"></div>
									<span class="color-name">red</span>
								</div>
								<div class="color-item">
									<div class="color-preview" style="background-color: #4444FF;"></div>
									<span class="color-name">blue</span>
								</div>
								<div class="color-item">
									<div class="color-preview" style="background-color: #44FF44;"></div>
									<span class="color-name">green</span>
								</div>
								<div class="color-item">
									<div class="color-preview" style="background-color: #FFFF44;"></div>
									<span class="color-name">yellow</span>
								</div>
								<div class="color-item">
									<div class="color-preview" style="background-color: #FF8844;"></div>
									<span class="color-name">orange</span>
								</div>
								<div class="color-item">
									<div class="color-preview" style="background-color: #8844FF;"></div>
									<span class="color-name">purple</span>
								</div>
								<div class="color-item">
									<div class="color-preview" style="background-color: #FF44FF;"></div>
									<span class="color-name">pink</span>
								</div>
								<div class="color-item">
									<div class="color-preview" style="background-color: #44FFFF;"></div>
									<span class="color-name">cyan</span>
								</div>
								<div class="color-item">
									<div class="color-preview" style="background-color: #888888;"></div>
									<span class="color-name">gray</span>
								</div>
								<div class="color-item">
									<div class="color-preview" style="background-color: #000000;"></div>
									<span class="color-name">black</span>
								</div>
								<div class="color-item">
									<div class="color-preview" style="background-color: #FFFFFF; border: 1px solid #3a3a3a;"></div>
									<span class="color-name">white</span>
								</div>
							</div>
						</div>
						<div class="demo-description">
							Все доступные цвета для создания тегов
						</div>
					</div>

					<div class="color-usage">
						<div class="color-usage-item">
							<h4>Рекомендации по использованию</h4>
							<div class="usage-examples">
								<div class="usage-example">
									<span class="usage-tag" style="background-color: #FF4444; color: #FFFFFF;">red</span>
									<span class="usage-text">Для важных уведомлений и ошибок</span>
								</div>
								<div class="usage-example">
									<span class="usage-tag" style="background-color: #4444FF; color: #FFFFFF;">blue</span>
									<span class="usage-text">Для информационных сообщений</span>
								</div>
								<div class="usage-example">
									<span class="usage-tag" style="background-color: #44FF44; color: #000000;">green</span>
									<span class="usage-text">Для успешных операций и подтверждений</span>
								</div>
								<div class="usage-example">
									<span class="usage-tag" style="background-color: #FFFF44; color: #000000;">yellow</span>
									<span class="usage-text">Для предупреждений и внимания</span>
								</div>
								<div class="usage-example">
									<span class="usage-tag" style="background-color: #FF8844; color: #FFFFFF;">orange</span>
									<span class="usage-text">Для временных меток и напоминаний</span>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Практический пример</h2>
					<p>
						Вот пример реального текста с использованием тегов. Слева показан исходный текст из редактора с командами TAG, а справа - как этот же текст будет выглядеть в телесуфлере после обработки.
					</p>

					<div class="practical-example">
						<div class="example-editor">
							<h4>Текст в редакторе</h4>
							<div class="editor-content">
								<div class="editor-text">
									<h3>План презентации проекта</h3>
									<p>TAG=Важно(Red) Начало в 14:00</p>
									<p>TAG=Подготовка(Blue) Проверить оборудование</p>
									<p>TAG=Материалы(Green) Презентация готова</p>
									<p>TAG=Вопрос(Yellow) Нужны ли дополнительные слайды?</p>
									<p>TAG=Идея(Purple) Добавить интерактивную часть</p>
									<p>TAG=Ссылка(Cyan) https://example.com/demo</p>
									<p>TAG=Напоминание(Orange) Взять флешку с бэкапом</p>
									<p>TAG=Завершено(Green) Согласовано с командой</p>
								</div>
							</div>
						</div>

						<div class="example-teleprompter">
							<h4>Текст в телесуфлере</h4>
							<div class="teleprompter-content">
								<div class="teleprompter-text">
									<h3>План презентации проекта</h3>
									<p><span class="tag-result" style="background-color: #FF4444; color: #FFFFFF;">Важно</span> Начало в 14:00</p>
									<p><span class="tag-result" style="background-color: #4444FF; color: #FFFFFF;">Подготовка</span> Проверить оборудование</p>
									<p><span class="tag-result" style="background-color: #44FF44; color: #000000;">Материалы</span> Презентация готова</p>
									<p><span class="tag-result" style="background-color: #FFFF44; color: #000000;">Вопрос</span> Нужны ли дополнительные слайды?</p>
									<p><span class="tag-result" style="background-color: #8844FF; color: #FFFFFF;">Идея</span> Добавить интерактивную часть</p>
									<p><span class="tag-result" style="background-color: #44FFFF; color: #000000;">Ссылка</span> https://example.com/demo</p>
									<p><span class="tag-result" style="background-color: #FF8844; color: #FFFFFF;">Напоминание</span> Взять флешку с бэкапом</p>
									<p><span class="tag-result" style="background-color: #44FF44; color: #000000;">Завершено</span> Согласовано с командой</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Интеграция с телесуфлером</h2>
					<p>
						Теги созданы специально для работы с <a href="/docs/teleprompter" class="shortcut-link">телесуфлером</a>. Они помогают структурировать текст для презентаций и выступлений, делая важную информацию более заметной во время чтения.
					</p>

					<div class="teleprompter-integration">
						<div class="integration-item">
							<h4>Визуальные подсказки</h4>
							<p>Цветные теги служат визуальными подсказками во время выступления, помогая быстро ориентироваться в тексте и не пропускать важные моменты.</p>
						</div>

						<div class="integration-item">
							<h4>Структурирование контента</h4>
							<p>Теги помогают разделить текст на логические блоки: важные моменты, вопросы аудитории, ссылки на ресурсы и напоминания.</p>
						</div>

						<div class="integration-item">
							<h4>Улучшение читаемости</h4>
							<p>В режиме телесуфлера цветные метки делают текст более читаемым и помогают поддерживать зрительный контакт с аудиторией.</p>
						</div>

						<div class="integration-item">
							<h4>Автоматическая обработка</h4>
							<p>При переходе в <a href="/docs/teleprompter" class="shortcut-link">режим телесуфлера</a> все команды TAG автоматически преобразуются в цветные метки для удобного чтения.</p>
						</div>
					</div>

					<div class="tip">
						<div class="tip-icon">
							<Info size={16} />
						</div>
						<div class="tip-content">
							<strong>Совет:</strong> Используйте теги для создания структурированных сценариев выступлений. Это особенно полезно для презентаций, докладов и онлайн-трансляций.
						</div>
					</div>

					<div class="tip">
						<div class="tip-icon">
							<Info size={16} />
						</div>
						<div class="tip-content">
							<strong>Экранирование команд:</strong> Если вам нужно написать буквальный текст "TAG=текст(цвет)" без его обработки как команды, используйте обратный слеш: <code>\TAG=текст(цвет)</code>. Это отобразит обычный текст без форматирования.
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
							<strong>Важно:</strong> Команды TAG должны быть введены точно в указанном формате на одной строке. Неправильный синтаксис или многострочные команды не будут обработаны системой.
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

	/* Tag Command Demo */
	.demo-tag-command {
		display: flex;
		align-items: center;
		gap: 16px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
	}

	.tag-command {
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 4px;
		padding: 8px 12px;
		font-family: monospace;
		font-size: 14px;
		color: #FEB1FF;
	}

	.arrow {
		color: #888888;
		font-size: 18px;
		font-weight: bold;
	}

	.tag-result {
		padding: 4px 8px;
		border-radius: 4px;
		font-weight: 500;
		font-size: 14px;
	}

	/* Tag Basics */
	.tag-basics {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.tag-basic {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 20px;
	}

	.tag-basic-header {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}

	.tag-basic-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background-color: rgba(254, 177, 255, 0.1);
		border-radius: 8px;
		color: #FEB1FF;
		flex-shrink: 0;
	}

	.tag-basic-info h4 {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.tag-basic-info p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
	}

	/* Syntax Examples */
	.syntax-examples {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 20px;
		margin: 20px 0;
	}

	.syntax-example {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 20px;
	}

	.syntax-example h4 {
		margin: 0 0 12px 0;
		font-size: 16px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.syntax-code {
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 4px;
		padding: 12px;
		margin: 12px 0;
	}

	.syntax-code code {
		font-family: monospace;
		font-size: 14px;
		color: #FEB1FF;
	}

	.syntax-examples-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.syntax-example-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px 0;
	}

	.syntax-example-item code {
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 4px;
		padding: 4px 8px;
		font-family: monospace;
		font-size: 13px;
		color: #FEB1FF;
	}

	.tag-preview {
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 500;
	}

	.text-preview {
		font-family: monospace;
		font-size: 13px;
		color: #c0c0c0;
		background-color: #2a2a2a;
		padding: 2px 6px;
		border-radius: 4px;
		border: 1px solid #3a3a3a;
	}

	/* Color Palette */
	.color-palette {
		display: flex;
		gap: 12px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
		overflow-x: auto;
		scrollbar-width: thin;
		scrollbar-color: #3a3a3a #1a1a1a;
	}

	.color-palette::-webkit-scrollbar {
		height: 6px;
	}

	.color-palette::-webkit-scrollbar-track {
		background: #1a1a1a;
		border-radius: 3px;
	}

	.color-palette::-webkit-scrollbar-thumb {
		background: #3a3a3a;
		border-radius: 3px;
	}

	.color-palette::-webkit-scrollbar-thumb:hover {
		background: #4a4a4a;
	}

	.color-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
		min-width: 60px;
	}

	.color-preview {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		border: 1px solid #3a3a3a;
	}

	.color-name {
		font-size: 12px;
		color: #a0a0a0;
		text-align: center;
	}

	/* Color Usage */
	.color-usage {
		margin: 20px 0;
	}

	.color-usage-item {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 20px;
	}

	.usage-examples {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-top: 12px;
	}

	.usage-example {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.usage-tag {
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 12px;
		font-weight: 500;
		min-width: 50px;
		text-align: center;
	}

	.usage-text {
		font-size: 14px;
		color: #c0c0c0;
	}

	/* Practical Example */
	.practical-example {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 20px;
		margin: 20px 0;
	}

	.example-editor, .example-teleprompter {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 20px;
	}

	.example-editor h4, .example-teleprompter h4 {
		margin: 0 0 16px 0;
		font-size: 16px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.editor-content, .teleprompter-content {
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 4px;
		padding: 16px;
		min-height: 300px;
	}

	.editor-text, .teleprompter-text {
		font-size: 14px;
		line-height: 1.6;
		color: #c0c0c0;
	}

	.editor-text h3, .teleprompter-text h3 {
		margin: 0 0 16px 0;
		font-size: 18px;
		font-weight: 600;
		color: #ffffff;
	}

	.editor-text p, .teleprompter-text p {
		margin: 0 0 8px 0;
	}

	.editor-text {
		font-family: monospace;
	}

	.teleprompter-text .tag-result {
		padding: 2px 6px;
		border-radius: 4px;
		font-weight: 500;
		font-size: 13px;
		margin-right: 8px;
	}

	/* Teleprompter Integration */
	.teleprompter-integration {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.integration-item {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 20px;
	}

	.integration-item h4 {
		margin: 0 0 8px 0;
		font-size: 16px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.integration-item p {
		margin: 0;
		font-size: 14px;
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

		.tag-basics {
			grid-template-columns: 1fr;
		}

		.syntax-examples {
			grid-template-columns: 1fr;
		}


		.practical-example {
			grid-template-columns: 1fr;
		}

		.teleprompter-integration {
			grid-template-columns: 1fr;
		}


		.demo-tag-command {
			flex-direction: column;
			gap: 12px;
			text-align: center;
		}

		.syntax-example-item {
			flex-direction: column;
			gap: 8px;
			text-align: center;
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

		.tag-basic {
			padding: 16px;
		}

		.syntax-example {
			padding: 16px;
		}

		.example-category {
			padding: 16px;
		}

		.integration-item {
			padding: 16px;
		}


		.color-preview {
			width: 32px;
			height: 32px;
		}
	}
</style>
