<script lang="ts">
	import { DocsHeader } from '$lib/components/docs';
	import { 
		Play,
		Pause,
		RotateCcw,
		X,
		Monitor,
		Settings,
		Eye
	} from '@lucide/svelte';
</script>

<div class="docs-page">
	<DocsHeader />

	<main class="docs-main">
		<div class="docs-container">
			<div class="docs-content">
				<h1>Телесуфлер</h1>
				<p class="docs-intro">
					Телесуфлер Copella Notepad — это мощный инструмент для презентаций, выступлений и записи видео. 
					Он позволяет отображать текст с плавной прокруткой, настраиваемой скоростью и удобным управлением.
					Для начала работы создайте <a href="/docs/rooms" class="shortcut-link">новую комнату</a> и изучите <a href="/docs/shortcuts" class="shortcut-link">горячие клавиши</a> для быстрого управления.
				</p>

				<section class="docs-section">
					<h2>Основы работы с телесуфлером</h2>
					<p>
						Телесуфлер предназначен для отображения текста с автоматической прокруткой, что идеально подходит 
						для презентаций, выступлений, записи видео и других ситуаций, когда нужно читать текст, 
						не отрывая взгляд от камеры или аудитории.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Кнопка телесуфлера:</span>
						</div>
						<div class="demo-content">
							<button class="demo-teleprompter-button">
								<Monitor size={16} />
								<span>Телесуфлер</span>
							</button>
						</div>
						<div class="demo-description">
							Нажмите эту кнопку в панели инструментов редактора для открытия телесуфлера
						</div>
					</div>

					<div class="feature-highlight">
						<div class="feature-icon">
							<Eye size={20} />
						</div>
						<div class="feature-content">
							<h3>Два режима работы</h3>
							<p>Телесуфлер работает в двух режимах: режим редактирования для подготовки текста и режим воспроизведения для презентации.</p>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Режимы работы</h2>
					
					<div class="mode-examples">
						<div class="mode-example">
							<div class="mode-header">
								<div class="mode-icon editing">
									<Settings size={20} />
								</div>
								<div class="mode-info">
									<h4>Режим редактирования</h4>
									<p>Подготовка и редактирование текста перед презентацией.</p>
								</div>
							</div>
							<div class="mode-features">
								<ul>
									<li>Редактирование текста в реальном времени</li>
									<li>Поддержка форматирования и <a href="/docs/formatting" class="shortcut-link">стилей текста</a></li>
									<li>Обработка <a href="/docs/tags" class="shortcut-link">тегов и упоминаний</a></li>
									<li>Настройка размера шрифта</li>
									<li>Предварительный просмотр текста</li>
								</ul>
							</div>
						</div>

						<div class="mode-example">
							<div class="mode-header">
								<div class="mode-icon playing">
									<Play size={20} />
								</div>
								<div class="mode-info">
									<h4>Режим воспроизведения</h4>
									<p>Автоматическая прокрутка текста для презентации или записи.</p>
								</div>
							</div>
							<div class="mode-features">
								<ul>
									<li>Плавная автоматическая прокрутка</li>
									<li>Настраиваемая скорость чтения</li>
									<li>Визуальная маска для фокусировки</li>
									<li>Управление с клавиатуры</li>
									<li>Пауза и возобновление</li>
								</ul>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Управление телесуфлером</h2>
					<p>
						Телесуфлер предоставляет интуитивные элементы управления для комфортной работы.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Панель управления:</span>
						</div>
						<div class="demo-content">
							<div class="demo-controls">
								<button class="demo-control-button demo-control-button--primary">
									<Play size={16} />
								</button>
								<button class="demo-control-button">
									<RotateCcw size={16} />
								</button>
								<button class="demo-control-button">
									<X size={16} />
								</button>
							</div>
						</div>
						<div class="demo-description">
							Основные кнопки управления телесуфлером
						</div>
					</div>

					<div class="control-options">
						<div class="control-option">
							<div class="control-header">
								<div class="control-icon play">
									<Play size={20} />
								</div>
								<div class="control-info">
									<h4>Воспроизведение / Пауза</h4>
									<p>Запускает или приостанавливает автоматическую прокрутку текста.</p>
								</div>
							</div>
						</div>

						<div class="control-option">
							<div class="control-header">
								<div class="control-icon reset">
									<RotateCcw size={20} />
								</div>
								<div class="control-info">
									<h4>Сброс</h4>
									<p>Возвращает прокрутку к началу текста и останавливает воспроизведение.</p>
								</div>
							</div>
						</div>

						<div class="control-option">
							<div class="control-header">
								<div class="control-icon close">
									<X size={20} />
								</div>
								<div class="control-info">
									<h4>Закрытие</h4>
									<p>Выходит из режима телесуфлера и возвращает к обычному редактору.</p>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Настройки телесуфлера</h2>
					<p>
						Телесуфлер предоставляет гибкие настройки для адаптации под ваши потребности. 
						Все параметры можно изменять в реальном времени во время работы.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Панели настроек:</span>
						</div>
						<div class="demo-content">
							<div class="demo-settings">
								<div class="demo-setting-panel">
									<div class="demo-panel-header">
										<span class="demo-panel-label">Скорость</span>
										<span class="demo-panel-value">50</span>
									</div>
									<div class="demo-slider"></div>
								</div>
								<div class="demo-setting-panel">
									<div class="demo-panel-header">
										<span class="demo-panel-label">Размер</span>
										<span class="demo-panel-value">28px</span>
									</div>
									<div class="demo-slider"></div>
								</div>
							</div>
						</div>
						<div class="demo-description">
							Панели настроек скорости и размера шрифта
						</div>
					</div>

					<div class="setting-options">
						<div class="setting-option">
							<div class="setting-header">
								<div class="setting-icon speed">
									<Settings size={20} />
								</div>
								<div class="setting-info">
									<h4>Скорость прокрутки</h4>
									<p>Настройте скорость автоматической прокрутки текста от 10 до 100 пикселей в секунду.</p>
								</div>
							</div>
							<div class="setting-details">
								<strong>Рекомендации:</strong>
								<ul>
									<li><strong>10-30</strong> — Медленная скорость для сложных текстов</li>
									<li><strong>40-60</strong> — Средняя скорость для большинства случаев</li>
									<li><strong>70-100</strong> — Быстрая скорость для опытных спикеров</li>
								</ul>
							</div>
						</div>

						<div class="setting-option">
							<div class="setting-header">
								<div class="setting-icon font">
								<Monitor size={20} />
								</div>
								<div class="setting-info">
									<h4>Размер шрифта</h4>
									<p>Изменяйте размер текста от 16 до 48 пикселей для оптимальной читаемости.</p>
								</div>
							</div>
							<div class="setting-details">
								<strong>Рекомендации:</strong>
								<ul>
									<li><strong>16-20px</strong> — Для близкого чтения</li>
									<li><strong>24-32px</strong> — Стандартный размер для презентаций</li>
									<li><strong>36-48px</strong> — Крупный шрифт для больших экранов</li>
								</ul>
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

	/* Feature highlight */
	.feature-highlight {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 20px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
		margin: 24px 0;
	}

	.feature-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background-color: #2a2a2a;
		border-radius: 8px;
		color: #FEB1FF;
		flex-shrink: 0;
	}

	.feature-content h3 {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.feature-content p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
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

	/* Demo Teleprompter Button */
	.demo-teleprompter-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		background-color: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 8px;
		color: #ffffff;
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.demo-teleprompter-button:hover {
		background-color: #3a3a3a;
		border-color: #FEB1FF;
	}

	/* Demo Controls */
	.demo-controls {
		display: flex;
		gap: 8px;
		background-color: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		border-radius: 12px;
		padding: 8px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.demo-control-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background-color: #3A3A3A;
		border: none;
		border-radius: 8px;
		color: #FFFFFF;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.demo-control-button--primary {
		background-color: #FEB1FF;
		color: #1A1A1A;
	}

	.demo-control-button:hover {
		background-color: #4A4A4A;
		transform: translateY(-1px);
	}

	.demo-control-button--primary:hover {
		background-color: #FF9EFF;
	}

	/* Demo Settings */
	.demo-settings {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.demo-setting-panel {
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		border-radius: 12px;
		padding: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		min-width: 160px;
	}

	.demo-panel-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8px;
	}

	.demo-panel-label {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 12px;
		color: #FFFFFF;
		opacity: 0.8;
	}

	.demo-panel-value {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 12px;
		color: #FEB1FF;
	}

	.demo-slider {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 2px;
		position: relative;
	}

	.demo-slider::after {
		content: '';
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 16px;
		height: 16px;
		background: #FEB1FF;
		border-radius: 50%;
	}

	/* Mode Examples */
	.mode-examples {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
		gap: 20px;
		margin: 20px 0;
	}

	.mode-example {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
		padding: 20px;
	}

	.mode-header {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 16px;
	}

	.mode-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.mode-icon.editing {
		background-color: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}

	.mode-icon.playing {
		background-color: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	.mode-info h4 {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.mode-info p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
	}

	.mode-features ul {
		margin: 0;
		padding-left: 20px;
	}

	.mode-features li {
		font-size: 14px;
		margin: 0 0 4px 0;
	}

	/* Control Options */
	.control-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 20px;
		margin: 20px 0;
	}

	.control-option {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
		padding: 20px;
	}

	.control-header {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 16px;
	}

	.control-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.control-icon.play {
		background-color: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	.control-icon.reset {
		background-color: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
	}

	.control-icon.close {
		background-color: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.control-info h4 {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.control-info p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
	}

	.control-details {
		padding-left: 56px;
	}

	.control-details ul {
		margin: 8px 0 0 0;
		padding-left: 20px;
	}

	.control-details li {
		font-size: 14px;
		margin: 0 0 4px 0;
	}

	/* Setting Options */
	.setting-options {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 20px;
		margin: 20px 0;
	}

	.setting-option {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
		padding: 20px;
	}

	.setting-header {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 16px;
	}

	.setting-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.setting-icon.speed {
		background-color: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}

	.setting-icon.font {
		background-color: rgba(139, 92, 246, 0.1);
		color: #8b5cf6;
	}

	.setting-info h4 {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.setting-info p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
	}

	.setting-details {
		padding-left: 56px;
	}

	.setting-details ul {
		margin: 8px 0 0 0;
		padding-left: 20px;
	}

	.setting-details li {
		font-size: 14px;
		margin: 0 0 4px 0;
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

		.mode-examples {
			grid-template-columns: 1fr;
		}

		.control-options {
			grid-template-columns: 1fr;
		}

		.setting-options {
			grid-template-columns: 1fr;
		}


		.control-details {
			padding-left: 0;
		}

		.setting-details {
			padding-left: 0;
		}

		.demo-settings {
			flex-direction: column;
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

		.mode-example {
			padding: 16px;
		}

		.control-option {
			padding: 16px;
		}

		.setting-option {
			padding: 16px;
		}


	}
</style>
