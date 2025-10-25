<script lang="ts">
	import { DocsHeader } from '$lib/components/docs';
	import { Users, Loader2, Check, Wifi, WifiOff } from '@lucide/svelte';
</script>

<div class="docs-page">
	<DocsHeader />

	<main class="docs-main">
		<div class="docs-container">
			<div class="docs-content">
				<h1>Совместное редактирование</h1>
				<p class="docs-intro">
					Copella Notepad позволяет нескольким пользователям работать над одним документом одновременно. 
					Вы видите курсоры других пользователей, их выделения и изменения в реальном времени.
					Для начала работы создайте <a href="/docs/rooms" class="shortcut-link">комнату</a> и настройте <a href="/docs/user-permissions" class="shortcut-link">права доступа</a> для участников.
				</p>

				<section class="docs-section">
					<h2>Как это работает</h2>
					<p>
						Система совместного редактирования использует технологию CRDT (Conflict-free Replicated Data Type) 
						на основе Yjs для автоматического разрешения конфликтов. Все изменения синхронизируются через WebSocket 
						в реальном времени, обеспечивая плавную совместную работу без необходимости ручного разрешения конфликтов.
					</p>

					<div class="feature-grid">
						<div class="feature-card">
							<div class="feature-icon">
								<Users size={24} />
							</div>
							<h3>Real-time синхронизация</h3>
							<p>Изменения появляются у всех участников мгновенно без задержек</p>
						</div>

						<div class="feature-card">
							<div class="feature-icon">
								<Wifi size={24} />
							</div>
							<h3>Автосохранение</h3>
							<p>Документ автоматически сохраняется каждые 2 секунды после изменений</p>
						</div>

						<div class="feature-card">
							<div class="feature-icon">
								<Check size={24} />
							</div>
							<h3>Без конфликтов</h3>
							<p>CRDT автоматически разрешает конфликты при одновременных правках</p>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Курсоры пользователей</h2>
					<p>
						Во время совместного редактирования вы видите курсоры других участников комнаты. 
						Каждый пользователь получает уникальный цвет курсора, который сохраняется во всех сессиях.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Курсоры других пользователей:</span>
						</div>
						<div class="demo-content">
							<div class="demo-editor">
								<div class="demo-text">
									<p>Это пример текста, который редактируют несколько пользователей одновременно.</p>
									
									<!-- Демо курсоры -->
									<div class="demo-cursor" style="--cursor-color: #FF6B6B; left: 120px; top: 10px;">
										<div class="cursor-line"></div>
										<div class="cursor-flag">Александр</div>
									</div>
									
									<div class="demo-cursor" style="--cursor-color: #4ECDC4; left: 280px; top: 30px;">
										<div class="cursor-line"></div>
										<div class="cursor-flag">Мария</div>
									</div>

									<div class="demo-cursor" style="--cursor-color: #F7DC6F; left: 450px; top: 10px;">
										<div class="cursor-line"></div>
										<div class="cursor-flag">Иван</div>
									</div>
								</div>
							</div>
						</div>
						<div class="demo-description">
							Курсоры других пользователей с их именами и уникальными цветами
						</div>
					</div>

					<h3>Особенности курсоров</h3>
					<div class="cursor-features">
						<div class="cursor-feature">
							<h4>Уникальный цвет</h4>
							<p>Каждый пользователь получает стабильный цвет из палитры 20 цветов. Цвет генерируется на основе userId и остается постоянным.</p>
							<div class="color-palette">
								<div class="color-sample" style="background-color: #FF6B6B;"></div>
								<div class="color-sample" style="background-color: #4ECDC4;"></div>
								<div class="color-sample" style="background-color: #45B7D1;"></div>
								<div class="color-sample" style="background-color: #FFA07A;"></div>
								<div class="color-sample" style="background-color: #98D8C8;"></div>
								<div class="color-sample" style="background-color: #F7DC6F;"></div>
								<div class="color-sample" style="background-color: #BB8FCE;"></div>
								<div class="color-sample" style="background-color: #85C1E2;"></div>
								<div class="color-sample" style="background-color: #F8B739;"></div>
								<div class="color-sample" style="background-color: #52B788;"></div>
								<div class="color-sample" style="background-color: #E74C3C;"></div>
								<div class="color-sample" style="background-color: #3498DB;"></div>
								<div class="color-sample" style="background-color: #9B59B6;"></div>
								<div class="color-sample" style="background-color: #1ABC9C;"></div>
								<div class="color-sample" style="background-color: #F39C12;"></div>
								<div class="color-sample" style="background-color: #E67E22;"></div>
								<div class="color-sample" style="background-color: #16A085;"></div>
								<div class="color-sample" style="background-color: #27AE60;"></div>
								<div class="color-sample" style="background-color: #2980B9;"></div>
								<div class="color-sample" style="background-color: #8E44AD;"></div>
							</div>
						</div>

						<div class="cursor-feature">
							<h4>Имя пользователя</h4>
							<p>Над курсором отображается флажок с именем пользователя, чтобы вы знали, кто сейчас редактирует.</p>
						</div>

						<div class="cursor-feature">
							<h4>Анимация мигания</h4>
							<p>Курсор мигает как обычный текстовый курсор для лучшей видимости (период 1 секунда).</p>
						</div>

						<div class="cursor-feature">
							<h4>Плавное движение</h4>
							<p>Курсоры двигаются плавно с анимацией перехода (0.15s), создавая естественное ощущение.</p>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Выделение текста</h2>
					<p>
						Когда пользователи выделяют текст, вы видите их выделение полупрозрачным цветом, 
						соответствующим цвету их курсора.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Выделение текста другими пользователями:</span>
						</div>
						<div class="demo-content">
							<div class="demo-editor">
								<div class="demo-text">
									<p>
										<span>Пользователи могут </span>
										<span class="demo-selection" style="--selection-color: #FF6B6B;">выделять текст</span>
										<span> для редактирования. Вы видите </span>
										<span class="demo-selection" style="--selection-color: #4ECDC4;">выделения других участников</span>
										<span> в реальном времени.</span>
									</p>
								</div>
							</div>
						</div>
						<div class="demo-description">
							Выделения текста отображаются полупрозрачным цветом пользователя (opacity 0.2)
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
							<strong>Совет:</strong> Выделение автоматически обновляется при движении курсора, показывая динамическое выделение в процессе редактирования.
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Статус синхронизации</h2>
					<p>
						В правом нижнем углу редактора отображается статус синхронизации и информация о 
						пользователях, которые сейчас редактируют документ.
					</p>

					<div class="status-demo">
						<div class="status-example">
							<h4>Подключено</h4>
							<p>WebSocket соединение установлено, изменения синхронизируются</p>
							<div class="status-indicator status-connected">
								<Wifi size={16} />
								<span>Подключено</span>
							</div>
						</div>

						<div class="status-example">
							<h4>Синхронизация</h4>
							<p>Изменения отправляются на сервер</p>
							<div class="status-indicator status-syncing">
								<Loader2 size={16} class="spinning" />
								<span>Синхронизация...</span>
							</div>
						</div>

						<div class="status-example">
							<h4>Сохранено</h4>
							<p>Все изменения успешно сохранены в базу данных</p>
							<div class="status-indicator status-saved">
								<Check size={16} />
								<span>Сохранено</span>
							</div>
						</div>

						<div class="status-example">
							<h4>Ошибка</h4>
							<p>Проблема с подключением или синхронизацией</p>
							<div class="status-indicator status-error">
								<WifiOff size={16} />
								<span>Ошибка</span>
							</div>
						</div>
					</div>

					<h3>Уведомления о редактировании</h3>
					<p>
						Когда другой пользователь активно редактирует документ (двигает курсор или вводит текст), 
						в правом нижнем углу появляется уведомление с аватаром и именем пользователя.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Уведомление о редактировании:</span>
						</div>
						<div class="demo-content">
							<div class="editing-notification">
								<div class="user-avatar">АП</div>
								<span class="editing-text">Александр редактирует</span>
							</div>
						</div>
						<div class="demo-description">
							Уведомление исчезает через 500мс после остановки активности пользователя
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Технические детали</h2>
					<p>
						Для любознательных: вот как работает система совместного редактирования под капотом.
					</p>

					<div class="tech-details">
						<div class="tech-detail">
							<h4>Yjs CRDT</h4>
							<p>
								Используется библиотека Yjs, реализующая CRDT (Conflict-free Replicated Data Type). 
								Это означает, что даже при одновременном редактировании одного и того же места 
								в документе конфликты разрешаются автоматически и детерминированно.
							</p>
						</div>

						<div class="tech-detail">
							<h4>WebSocket</h4>
							<p>
								Все изменения передаются через WebSocket соединение для минимальной задержки. 
								Курсоры обновляются с throttling (каждые 50мс) для оптимизации производительности.
							</p>
						</div>

						<div class="tech-detail">
							<h4>Автосохранение</h4>
							<p>
								Сервер автоматически сохраняет изменения в базу данных с задержкой 2 секунды 
								после последнего изменения. Это позволяет группировать быстрые правки в одну операцию записи.
							</p>
						</div>

						<div class="tech-detail">
							<h4>Стабильные цвета</h4>
							<p>
								Цвет курсора генерируется хешированием userId. Это обеспечивает, что один и тот же 
								пользователь всегда получает один и тот же цвет во всех сессиях и комнатах.
							</p>
						</div>

						<div class="tech-detail">
							<h4>Undo/Redo</h4>
							<p>
								Система отмены действий (Ctrl+Z / Ctrl+Y) работает корректно в многопользовательской среде. 
								Отменяются только локальные изменения, а изменения других пользователей сохраняются.
							</p>
						</div>

						<div class="tech-detail">
							<h4>Оптимизация</h4>
							<p>
								Используется differential synchronization - отправляются только изменения (diff), 
								а не весь документ. Курсоры рендерятся с помощью CSS transform для GPU-ускорения.
							</p>
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
							<strong>Интересный факт:</strong> Старые курсоры автоматически удаляются через 5 секунд неактивности, 
							что предотвращает накопление "призрачных" курсоров отключившихся пользователей.
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Рекомендации по использованию</h2>
					<p>
						Советы для эффективной совместной работы над документами.
					</p>

					<div class="tips-grid">
						<div class="tip-card">
							<div class="tip-card-icon">
								<Users size={20} />
							</div>
							<h4>Разделяйте работу</h4>
							<p>При работе над большим документом договоритесь, кто над какой частью работает</p>
						</div>

						<div class="tip-card">
							<div class="tip-card-icon">
								<Wifi size={20} />
							</div>
							<h4>Проверяйте статус</h4>
							<p>Обращайте внимание на индикатор синхронизации - убедитесь, что изменения сохранены</p>
						</div>

						<div class="tip-card">
							<div class="tip-card-icon">
								<Check size={20} />
							</div>
							<h4>Следите за курсорами</h4>
							<p>Курсоры других пользователей помогают избежать одновременного редактирования одного места</p>
						</div>

						<div class="tip-card">
							<div class="tip-card-icon">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
									<polyline points="17 8 12 3 7 8"/>
									<line x1="12" y1="3" x2="12" y2="15"/>
								</svg>
							</div>
							<h4>Используйте историю</h4>
							<p>Undo/Redo работает корректно - не бойтесь экспериментировать с правками</p>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Часто задаваемые вопросы</h2>
					
					<div class="faq-list">
						<div class="faq-item">
							<h4>Что происходит, если два человека редактируют одно место?</h4>
							<p>
								CRDT автоматически разрешает конфликт. Обычно изменения объединяются, и оба пользователя 
								видят результат почти мгновенно. Порядок символов определяется алгоритмом Yjs.
							</p>
						</div>

						<div class="faq-item">
							<h4>Можно ли работать офлайн?</h4>
							<p>
								Нет, для совместного редактирования требуется активное интернет-соединение. 
								При потере соединения вы увидите индикатор ошибки, и изменения не будут синхронизироваться 
								до восстановления соединения.
							</p>
						</div>

						<div class="faq-item">
							<h4>Сколько человек может редактировать одновременно?</h4>
							<p>
								Технически ограничений нет, но для комфортной работы рекомендуется не более 10 активных 
								редакторов одновременно. При большем количестве экран может быть перегружен курсорами.
							</p>
						</div>

						<div class="faq-item">
							<h4>Как работает форматирование при совместной работе?</h4>
							<p>
								Форматирование применяется к выделенному тексту каждым пользователем независимо. 
								Если два пользователя форматируют одно и то же, применяется последнее изменение. 
								Подробнее в разделе <a href="/docs/formatting" class="shortcut-link">форматирование текста</a>.
							</p>
						</div>

						<div class="faq-item">
							<h4>Почему мой курсор иногда прыгает?</h4>
							<p>
								Это может происходить, когда другой пользователь редактирует текст перед вашей позицией. 
								Система автоматически корректирует позицию курсора, чтобы он оставался в логически правильном месте.
							</p>
						</div>

						<div class="faq-item">
							<h4>Можно ли отключить отображение курсоров?</h4>
							<p>
								Курсоры отображаются автоматически для всех пользователей с правами редактирования. 
								Отключить их нельзя, так как это ключевая часть совместной работы. Если вам нужно работать 
								в одиночку, используйте <a href="/docs/user-permissions" class="shortcut-link">систему прав</a> 
								чтобы временно ограничить доступ других участников.
							</p>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Связанные разделы</h2>
					<div class="related-links">
						<a href="/docs/rooms" class="related-link">
							<div class="related-icon">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
									<polyline points="9,22 9,12 15,12 15,22"/>
								</svg>
							</div>
							<div>
								<h4>Создание комнат</h4>
								<p>Узнайте, как создать комнату для совместной работы</p>
							</div>
						</a>

						<a href="/docs/user-permissions" class="related-link">
							<div class="related-icon">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<path d="M12 2L2 7l10 5 10-5-10-5z"/>
									<path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
								</svg>
							</div>
							<div>
								<h4>Управление пользователями</h4>
								<p>Настройте права доступа для участников комнаты</p>
							</div>
						</a>

						<a href="/docs/shortcuts" class="related-link">
							<div class="related-icon">
								<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
									<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
									<line x1="8" y1="21" x2="16" y2="21"/>
									<line x1="12" y1="17" x2="12" y2="21"/>
								</svg>
							</div>
							<div>
								<h4>Горячие клавиши</h4>
								<p>Ускорьте работу с помощью клавиатурных сочетаний</p>
							</div>
						</a>
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
		margin: 32px 0 16px 0;
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

	/* Feature Grid */
	.feature-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 20px;
		margin: 32px 0;
	}

	.feature-card {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 20px;
		text-align: center;
	}

	.feature-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 56px;
		height: 56px;
		margin: 0 auto 16px auto;
		background-color: rgba(254, 177, 255, 0.1);
		border-radius: 12px;
		color: #FEB1FF;
	}

	.feature-card h3 {
		margin: 0 0 8px 0;
		font-size: 18px;
		font-weight: 500;
		color: #ffffff;
	}

	.feature-card p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
		line-height: 1.5;
	}

	/* UI Demo */
	.ui-demo {
		margin: 24px 0;
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
		padding: 0;
	}

	.demo-description {
		margin-top: 12px;
		font-size: 13px;
		color: #a0a0a0;
	}

	/* Demo Editor */
	.demo-editor {
		position: relative;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 32px;
		min-height: 120px;
	}

	.demo-text {
		position: relative;
		font-size: 16px;
		color: #c0c0c0;
		line-height: 1.7;
	}

	/* Demo Cursor */
	.demo-cursor {
		position: absolute;
		pointer-events: none;
		animation: fade-in 0.3s ease-out;
	}

	.cursor-line {
		width: 2px;
		height: 20px;
		background-color: var(--cursor-color);
		animation: cursor-blink 1s infinite;
	}

	.cursor-flag {
		position: absolute;
		top: -24px;
		left: 2px;
		padding: 2px 8px;
		background-color: var(--cursor-color);
		color: white;
		font-size: 11px;
		font-weight: 500;
		border-radius: 4px;
		white-space: nowrap;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	}

	@keyframes cursor-blink {
		0%, 49% {
			opacity: 1;
		}
		50%, 100% {
			opacity: 0.3;
		}
	}

	@keyframes fade-in {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	/* Demo Selection */
	.demo-selection {
		background-color: var(--selection-color);
		opacity: 0.3;
		padding: 2px 0;
	}

	/* Cursor Features */
	.cursor-features {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 20px;
		margin: 24px 0;
	}

	.cursor-feature {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 20px;
	}

	.cursor-feature h4 {
		margin: 0 0 8px 0;
		font-size: 16px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.cursor-feature p {
		margin: 0;
		font-size: 14px;
		color: #c0c0c0;
		line-height: 1.5;
	}

	/* Color Palette */
	.color-palette {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 12px;
	}

	.color-sample {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		border: 1px solid #3a3a3a;
		transition: transform 0.2s ease;
	}

	.color-sample:hover {
		transform: scale(1.1);
	}

	/* Status Demo */
	.status-demo {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 16px;
		margin: 24px 0;
	}

	.status-example {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
	}

	.status-example h4 {
		margin: 0 0 4px 0;
		font-size: 14px;
		font-weight: 500;
		color: #ffffff;
	}

	.status-example p {
		margin: 0 0 12px 0;
		font-size: 12px;
		color: #a0a0a0;
	}

	.status-indicator {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
	}

	.status-connected {
		background-color: rgba(52, 211, 153, 0.15);
		border: 1px solid rgba(52, 211, 153, 0.4);
		color: #34D399;
	}

	.status-syncing {
		background-color: rgba(96, 165, 250, 0.15);
		border: 1px solid rgba(96, 165, 250, 0.4);
		color: #60A5FA;
	}

	.status-saved {
		background-color: rgba(52, 211, 153, 0.15);
		border: 1px solid rgba(52, 211, 153, 0.4);
		color: #34D399;
	}

	.status-error {
		background-color: rgba(239, 68, 68, 0.15);
		border: 1px solid rgba(239, 68, 68, 0.4);
		color: #EF4444;
	}

	:global(.spinning) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}

	/* Editing Notification */
	.editing-notification {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 8px 14px;
		background-color: rgba(254, 177, 255, 0.15);
		border: 1px solid rgba(254, 177, 255, 0.4);
		border-radius: 10px;
	}

	.user-avatar {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background-color: #FEB1FF;
		color: #121212;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 11px;
		font-weight: 600;
	}

	.editing-text {
		font-size: 13px;
		color: #FEB1FF;
		font-weight: 500;
	}

	/* Tech Details */
	.tech-details {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 20px;
		margin: 24px 0;
	}

	.tech-detail {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 20px;
	}

	.tech-detail h4 {
		margin: 0 0 12px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.tech-detail p {
		margin: 0;
		font-size: 14px;
		color: #c0c0c0;
		line-height: 1.6;
	}

	/* Tips Grid */
	.tips-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 16px;
		margin: 24px 0;
	}

	.tip-card {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 20px;
		text-align: center;
		transition: border-color 0.2s ease;
	}

	.tip-card:hover {
		border-color: #FEB1FF;
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
		line-height: 1.5;
	}

	/* FAQ */
	.faq-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
		margin: 24px 0;
	}

	.faq-item {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 20px;
	}

	.faq-item h4 {
		margin: 0 0 8px 0;
		font-size: 16px;
		font-weight: 500;
		color: #FEB1FF;
	}

	.faq-item p {
		margin: 0;
		font-size: 14px;
		color: #c0c0c0;
		line-height: 1.6;
	}

	/* Related Links */
	.related-links {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
		margin: 24px 0;
	}

	.related-link {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.2s ease;
	}

	.related-link:hover {
		border-color: #FEB1FF;
		transform: translateY(-2px);
	}

	.related-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: rgba(254, 177, 255, 0.1);
		border-radius: 6px;
		color: #FEB1FF;
		flex-shrink: 0;
	}

	.related-link h4 {
		margin: 0 0 4px 0;
		font-size: 14px;
		font-weight: 500;
		color: #ffffff;
	}

	.related-link p {
		margin: 0;
		font-size: 13px;
		color: #a0a0a0;
	}

	/* Tip/Warning */
	.tip {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		border-radius: 8px;
		margin: 24px 0;
		background-color: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
	}

	.tip-icon {
		color: #3b82f6;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.tip-content {
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

		.feature-grid {
			grid-template-columns: 1fr;
		}

		.cursor-features {
			grid-template-columns: 1fr;
		}

		.status-demo {
			grid-template-columns: 1fr;
		}

		.tech-details {
			grid-template-columns: 1fr;
		}

		.tips-grid {
			grid-template-columns: 1fr;
		}

		.related-links {
			grid-template-columns: 1fr;
		}

		.demo-cursor {
			display: none;
		}

		.color-palette {
			justify-content: center;
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

		.demo-editor {
			padding: 20px;
		}

		.feature-card {
			padding: 16px;
		}

		.tech-detail {
			padding: 16px;
		}
	}
</style>

