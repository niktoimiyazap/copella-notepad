<script lang="ts">
	import { DocsHeader } from '$lib/components/docs';
</script>

<div class="docs-page">
	<DocsHeader />

	<main class="docs-main">
		<div class="docs-container">
			<div class="docs-content">
				<h1>Создание комнат</h1>
				<p class="docs-intro">
					Комнаты в Copella Notepad — это рабочие пространства, где вы можете создавать и редактировать заметки, 
					работать в команде и организовывать контент. Каждая комната может быть настроена под ваши потребности.
					После создания комнаты изучите <a href="/docs/formatting" class="shortcut-link">форматирование текста</a> для работы с контентом.
				</p>

				<section class="docs-section">
					<h2>Основы создания комнаты</h2>
					<p>
						Для создания новой комнаты нажмите кнопку <strong>"Создать"</strong> в заголовке главной страницы. 
						Откроется модальное окно с формой создания комнаты.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Кнопка создания комнаты:</span>
						</div>
						<div class="demo-content">
							<button class="demo-create-button">
								<span>Создать</span>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<line x1="12" y1="5" x2="12" y2="19"/>
									<line x1="5" y1="12" x2="19" y2="12"/>
								</svg>
							</button>
						</div>
						<div class="demo-description">
							Нажмите эту кнопку в заголовке главной страницы для создания новой комнаты
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Настройки комнаты</h2>
					
					<h3>Название комнаты</h3>
					<p>
						Введите уникальное название для вашей комнаты. Название должно быть:
					</p>
					<ul>
						<li>От 1 до 50 символов</li>
						<li>Понятным и описательным</li>
						<li>Уникальным среди ваших комнат</li>
					</ul>

					<h3>Тип комнаты</h3>
					<p>Выберите тип доступа для вашей комнаты:</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Выбор типа комнаты:</span>
						</div>
						<div class="demo-content">
							<div class="demo-type-buttons">
								<button class="demo-type-button demo-type-button--active">
									<span class="demo-type-icon">
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<circle cx="12" cy="12" r="10"/>
											<path d="M2 12h20"/>
											<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
										</svg>
									</span>
							<span class="demo-type-text">
								<span class="demo-type-title">Публичная</span>
								<span class="demo-type-description">Доступна по ссылке</span>
							</span>
								</button>
								<button class="demo-type-button">
									<span class="demo-type-icon">
										<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
											<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
											<circle cx="12" cy="16" r="1" fill="currentColor"/>
											<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
										</svg>
									</span>
						<span class="demo-type-text">
							<span class="demo-type-title">Приватная</span>
							<span class="demo-type-description">Личное пространство</span>
						</span>
								</button>
							</div>
						</div>
						<div class="demo-description">
							Выберите один из двух типов доступа к комнате
						</div>
					</div>

					<div class="setting-option">
						<div class="setting-header">
							<div class="setting-icon public">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<circle cx="12" cy="12" r="10"/>
									<path d="M2 12h20"/>
									<path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
								</svg>
							</div>
					<div class="setting-info">
						<h4>Публичная комната</h4>
						<p>Любой пользователь может присоединиться к комнате по ссылке.</p>
					</div>
						</div>
						<div class="setting-details">
							<strong>Когда использовать:</strong>
							<ul>
								<li>Для открытых проектов</li>
								<li>Общественных мероприятий</li>
								<li>Образовательных целей</li>
								<li>Когда нужно легко делиться ссылкой</li>
							</ul>
						</div>
					</div>

					<div class="setting-option">
						<div class="setting-header">
							<div class="setting-icon private">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
									<circle cx="12" cy="16" r="1" fill="currentColor"/>
									<path d="M7 11V7a5 5 0 0 1 10 0v4"/>
								</svg>
							</div>
				<div class="setting-info">
					<h4>Приватная комната</h4>
					<p>Личное пространство только для создателя. Другие пользователи не могут присоединиться.</p>
				</div>
						</div>
						<div class="setting-details">
					<strong>Когда использовать:</strong>
					<ul>
						<li>Личные заметки и записи</li>
						<li>Конфиденциальная информация</li>
						<li>Персональные проекты</li>
						<li>Черновики и идеи</li>
					</ul>
						</div>
					</div>

					<h3>Обложка комнаты</h3>
					<p>
						Загрузите изображение для обложки комнаты. Это поможет визуально идентифицировать комнату 
						среди других в вашем списке.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Загрузка обложки:</span>
						</div>
						<div class="demo-content">
							<div class="demo-upload-area">
								<div class="demo-upload-icon">
									<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M21 15V19A2 2 0 0 1 19 21H5A2 2 0 0 1 3 19V15"/>
										<polyline points="17,8 12,3 7,8"/>
										<line x1="12" y1="3" x2="12" y2="15"/>
									</svg>
								</div>
								<span class="demo-upload-text">Загрузить обложку</span>
								<span class="demo-upload-hint">JPG, PNG до 5MB</span>
							</div>
						</div>
						<div class="demo-description">
							Перетащите изображение или нажмите для выбора файла
						</div>
					</div>

					<div class="image-requirements">
						<h4>Требования к изображению:</h4>
						<ul>
							<li><strong>Формат:</strong> JPG, PNG</li>
							<li><strong>Размер:</strong> до 5MB</li>
							<li><strong>Рекомендуемое соотношение:</strong> 16:9</li>
							<li><strong>Минимальное разрешение:</strong> 800x450px</li>
						</ul>
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
							<strong>Совет:</strong> Используйте яркие, контрастные изображения для лучшей видимости в сетке комнат.
						</div>
					</div>

					<h3>Лимит участников</h3>
					<p>
						Установите максимальное количество участников, которые могут одновременно находиться в комнате. 
						Это помогает контролировать размер команды и производительность.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Настройка лимита участников:</span>
						</div>
						<div class="demo-content">
							<div class="demo-range-container">
								<input type="range" min="1" max="50" value="10" class="demo-range-input" disabled />
								<div class="demo-range-value">
									<span class="demo-range-number">10</span>
									<span class="demo-range-unit">человек</span>
								</div>
							</div>
						</div>
						<div class="demo-description">
							Перетащите ползунок для установки лимита от 1 до 50 участников
						</div>
					</div>

					<div class="participant-limits">
						<div class="limit-option">
							<h4>1-10 участников</h4>
							<p>Идеально для небольших команд, личных проектов и индивидуальной работы.</p>
						</div>
						<div class="limit-option">
							<h4>11-25 участников</h4>
							<p>Подходит для средних команд, рабочих групп и проектов с несколькими участниками.</p>
						</div>
						<div class="limit-option">
							<h4>26-50 участников</h4>
							<p>Для больших команд, образовательных мероприятий и масштабных проектов.</p>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Процесс создания</h2>
					
					<div class="step-list">
						<div class="step">
							<div class="step-number">1</div>
							<div class="step-content">
								<h3>Заполните основную информацию</h3>
								<p>Введите название комнаты и выберите тип доступа (публичная или приватная).</p>
							</div>
						</div>

						<div class="step">
							<div class="step-number">2</div>
							<div class="step-content">
								<h3>Настройте визуальное оформление</h3>
								<p>Загрузите обложку комнаты для лучшей идентификации в списке.</p>
							</div>
						</div>

						<div class="step">
							<div class="step-number">3</div>
							<div class="step-content">
								<h3>Установите лимит участников</h3>
								<p>Выберите максимальное количество участников с помощью слайдера.</p>
							</div>
						</div>

						<div class="step">
							<div class="step-number">4</div>
							<div class="step-content">
								<h3>Создайте комнату</h3>
								<p>Нажмите кнопку "Создать комнату" для завершения процесса.</p>
							</div>
						</div>
					</div>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Кнопка создания комнаты:</span>
						</div>
						<div class="demo-content">
							<button class="demo-submit-button">
								<span>Создать комнату</span>
							</button>
						</div>
						<div class="demo-description">
							Нажмите эту кнопку для завершения создания комнаты
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>После создания</h2>
					
					<p>После успешного создания комнаты вы можете:</p>
					<ul>
						<li><strong>Перейти в комнату</strong> — автоматически откроется интерфейс редактирования</li>
						<li><strong>Настроить права доступа</strong> — управлять участниками и их разрешениями</li>
						<li><strong>Создать заметки</strong> — начать работу с контентом, используя <a href="/docs/formatting" class="shortcut-link">инструменты форматирования</a></li>
						<li><strong>Добавить участников</strong> — только для публичных комнат можно поделиться ссылкой</li>
					</ul>

					<div class="warning">
						<div class="warning-icon">
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
								<line x1="12" y1="9" x2="12" y2="13"/>
								<line x1="12" y1="17" x2="12.01" y2="17"/>
							</svg>
						</div>
						<div class="warning-content">
							<strong>Важно:</strong> После создания комнаты вы автоматически становитесь её администратором с полными правами управления.
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Управление комнатами</h2>
					
					<p>Созданные комнаты отображаются на главной странице в виде сетки карточек. Вы можете:</p>
					<ul>
						<li><strong>Открыть комнату</strong> — кликните по карточке для входа</li>
						<li><strong>Редактировать настройки</strong> — используйте меню действий на карточке</li>
						<li><strong>Удалить комнату</strong> — через меню действий (действие необратимо)</li>
						<li><strong>Поделиться комнатой</strong> — для публичных комнат можно скопировать ссылку (недоступно для приватных)</li>
					</ul>
					<p>Для эффективной работы в комнате изучите <a href="/docs/shortcuts" class="shortcut-link">горячие клавиши</a> и используйте <a href="/docs/teleprompter" class="shortcut-link">телесуфлер</a> для презентаций.</p>
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

	/* Demo Create Button */
	.demo-create-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 20px;
		background-color: #FEB1FF;
		border: none;
		border-radius: 8px;
		color: #121212;
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.demo-create-button:hover {
		background-color: #E879F9;
	}

	/* Demo Type Buttons */
	.demo-type-buttons {
		display: flex;
		gap: 12px;
	}

	.demo-type-button {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 16px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
		flex: 1;
	}

	.demo-type-button--active {
		border-color: #FEB1FF;
		background-color: rgba(254, 177, 255, 0.05);
	}

	.demo-type-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		background-color: #2a2a2a;
		border-radius: 8px;
		color: #666666;
		flex-shrink: 0;
	}

	.demo-type-button--active .demo-type-icon {
		color: #FEB1FF;
	}

	.demo-type-text {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.demo-type-title {
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.demo-type-description {
		font-size: 14px;
		color: #a0a0a0;
	}

	/* Demo Upload Area */
	.demo-upload-area {
		width: 300px;
		aspect-ratio: 16 / 9;
		background: #2A2A2A;
		border: 2px dashed #3A3A3A;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 12px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.demo-upload-area:hover {
		border-color: #FEB1FF;
		background: rgba(254, 177, 255, 0.05);
	}

	.demo-upload-icon {
		color: #888888;
		transition: color 0.2s ease;
	}

	.demo-upload-area:hover .demo-upload-icon {
		color: #FEB1FF;
	}

	.demo-upload-text {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 16px;
		color: #888888;
		transition: color 0.2s ease;
	}

	.demo-upload-area:hover .demo-upload-text {
		color: #FEB1FF;
	}

	.demo-upload-hint {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #666666;
	}

	/* Demo Range */
	.demo-range-container {
		display: flex;
		align-items: center;
		gap: 16px;
		width: 300px;
	}

	.demo-range-input {
		flex: 1;
		height: 6px;
		background: #3A3A3A;
		border-radius: 3px;
		outline: none;
		cursor: pointer;
		-webkit-appearance: none;
	}

	.demo-range-input::-webkit-slider-thumb {
		-webkit-appearance: none;
		width: 20px;
		height: 20px;
		background: #FEB1FF;
		border-radius: 50%;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.demo-range-input::-webkit-slider-thumb:hover {
		transform: scale(1.1);
	}

	.demo-range-input::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: #FEB1FF;
		border-radius: 50%;
		cursor: pointer;
		border: none;
	}

	.demo-range-value {
		display: flex;
		flex-direction: column;
		align-items: center;
		min-width: 80px;
	}

	.demo-range-number {
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 24px;
		color: #FEB1FF;
	}

	.demo-range-unit {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 12px;
		color: #888888;
	}

	/* Demo Submit Button */
	.demo-submit-button {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 12px 24px;
		background-color: #FEB1FF;
		border: none;
		border-radius: 8px;
		color: #121212;
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 16px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.demo-submit-button:hover {
		background-color: #E879F9;
	}

	/* Setting options */
	.setting-option {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
		padding: 20px;
		margin: 20px 0;
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

	.setting-icon.public {
		background-color: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	.setting-icon.private {
		background-color: rgba(239, 68, 68, 0.1);
		color: #ef4444;
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

	/* Image requirements */
	.image-requirements {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
		margin: 20px 0;
	}

	.image-requirements h4 {
		margin: 0 0 12px 0;
		font-size: 14px;
		font-weight: 500;
		color: #ffffff;
	}

	.image-requirements ul {
		margin: 0;
		padding-left: 20px;
	}

	.image-requirements li {
		font-size: 14px;
		margin: 0 0 4px 0;
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

	/* Participant limits */
	.participant-limits {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.limit-option {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
	}

	.limit-option h4 {
		margin: 0 0 8px 0;
		font-size: 14px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.limit-option p {
		margin: 0;
		font-size: 13px;
		color: #a0a0a0;
	}

	/* Step list */
	.step-list {
		display: flex;
		flex-direction: column;
		gap: 24px;
		margin: 24px 0;
	}

	.step {
		display: flex;
		align-items: flex-start;
		gap: 16px;
	}

	.step-number {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: #FEB1FF;
		color: #121212;
		border-radius: 50%;
		font-weight: 600;
		font-size: 14px;
		flex-shrink: 0;
	}

	.step-content h3 {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.step-content p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
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

		.feature-highlight {
			padding: 16px;
		}

		.setting-header {
			flex-direction: column;
			gap: 12px;
		}

		.setting-details {
			padding-left: 0;
		}

		.participant-limits {
			grid-template-columns: 1fr;
		}

		.step {
			flex-direction: column;
			text-align: center;
		}

		.demo-type-buttons {
			flex-direction: column;
		}

		.demo-upload-area {
			width: 100%;
			max-width: 300px;
		}

		.demo-range-container {
			width: 100%;
			max-width: 300px;
			flex-direction: column;
			gap: 12px;
		}

		.demo-range-value {
			min-width: auto;
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

		.feature-highlight {
			padding: 12px;
		}

		.setting-option {
			padding: 16px;
		}
	}
</style>
