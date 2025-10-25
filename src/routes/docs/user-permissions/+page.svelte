<script lang="ts">
	import { DocsHeader } from '$lib/components/docs';
	import { 
		Users,
		Shield,
		UserCog,
		Lock,
		Unlock,
		Crown,
		Star,
		User,
		Info,
		Check,
		X
	} from '@lucide/svelte';
</script>

<div class="docs-page">
	<DocsHeader />

	<main class="docs-main">
		<div class="docs-container">
			<div class="docs-content">
				<h1>Управление пользователями и правами</h1>
				<p class="docs-intro">
					Система управления пользователями и правами в Copella Notepad предоставляет гибкие возможности для организации совместной работы. 
					Настройте роли участников, управляйте индивидуальными правами и контролируйте доступ к комнатам и заметкам.
					Начните с создания <a href="/docs/rooms" class="shortcut-link">новой комнаты</a>, изучите <a href="/docs/collaboration" class="shortcut-link">совместный режим</a> и используйте <a href="/docs/shortcuts" class="shortcut-link">горячие клавиши</a> для быстрой работы.
				</p>

				<section class="docs-section">
					<h2>Основы системы прав</h2>
					<p>
						Система прав в Copella Notepad построена на ролевой модели с возможностью индивидуальной настройки. 
						Каждый участник комнаты имеет роль, определяющую базовый набор прав, которые могут быть дополнительно настроены индивидуально.
					</p>

					<div class="feature-highlights">
						<div class="feature-highlight">
							<div class="feature-icon">
								<Shield size={20} />
							</div>
							<div class="feature-content">
								<h3>Ролевая модель</h3>
								<p>3 уровня доступа от владельца до обычного участника с предустановленными правами.</p>
							</div>
						</div>

						<div class="feature-highlight">
							<div class="feature-icon">
								<UserCog size={20} />
							</div>
							<div class="feature-content">
								<h3>Индивидуальные права</h3>
								<p>Настройка прав для каждого участника независимо от его роли, как в Telegram.</p>
							</div>
						</div>

						<div class="feature-highlight">
							<div class="feature-icon">
								<Lock size={20} />
							</div>
							<div class="feature-content">
								<h3>Гибкий контроль</h3>
								<p>Управление доступом на уровне комнат, заметок и отдельных действий.</p>
							</div>
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Роли участников</h2>
					<p>
						В системе предусмотрено 3 основные роли, каждая из которых определяет базовый набор прав доступа. 
						Роли формируют иерархию от владельца до обычного участника.
					</p>

					<div class="roles-grid">
						<div class="role-card owner">
							<div class="role-header">
								<div class="role-icon">
									<Crown size={20} />
								</div>
								<div class="role-info">
									<h4>Владелец</h4>
									<span class="role-badge">admin</span>
								</div>
							</div>
							<div class="role-description">
								<p>Владелец комнаты с полными правами управления. Имеет абсолютный контроль над комнатой и не может быть удален.</p>
							</div>
							<div class="role-permissions">
								<h5>Права доступа:</h5>
								<ul>
									<li><Check size={14} /> Редактирование всех заметок</li>
									<li><Check size={14} /> Удаление любых заметок</li>
									<li><Check size={14} /> Приглашение пользователей</li>
									<li><Check size={14} /> Управление участниками и правами</li>
									<li><Check size={14} /> Изменение настроек комнаты</li>
									<li><Check size={14} /> Удаление комнаты</li>
									<li><Check size={14} /> Передача прав владельца</li>
								</ul>
							</div>
						</div>

						<div class="role-card admin">
							<div class="role-header">
								<div class="role-icon">
									<Star size={20} />
								</div>
								<div class="role-info">
									<h4>Модератор</h4>
									<span class="role-badge">moderator</span>
								</div>
							</div>
							<div class="role-description">
								<p>Расширенные права для модерации контента. Может редактировать и удалять заметки, приглашать участников.</p>
							</div>
							<div class="role-permissions">
								<h5>Права доступа:</h5>
								<ul>
									<li><Check size={14} /> Редактирование всех заметок</li>
									<li><Check size={14} /> Удаление любых заметок</li>
									<li><Check size={14} /> Приглашение пользователей</li>
									<li><X size={14} /> Управление участниками и правами</li>
									<li><X size={14} /> Изменение настроек комнаты</li>
									<li><X size={14} /> Удаление комнаты</li>
								</ul>
							</div>
						</div>

						<div class="role-card user">
							<div class="role-header">
								<div class="role-icon">
									<User size={20} />
								</div>
								<div class="role-info">
									<h4>Пользователь</h4>
									<span class="role-badge">user</span>
								</div>
							</div>
							<div class="role-description">
								<p>Базовые права участника. По умолчанию может только просматривать содержимое, все права настраиваются индивидуально владельцем.</p>
							</div>
							<div class="role-permissions">
								<h5>Права доступа:</h5>
								<ul>
									<li><span class="permission-custom">~</span> Редактирование (настраивается)</li>
									<li><span class="permission-custom">~</span> Удаление (настраивается)</li>
									<li><span class="permission-custom">~</span> Приглашение (настраивается)</li>
									<li><X size={14} /> Управление участниками</li>
									<li><X size={14} /> Изменение настроек комнаты</li>
								</ul>
							</div>
						</div>
					</div>

					<div class="tip">
						<div class="tip-icon">
							<Info size={16} />
						</div>
						<div class="tip-content">
							<strong>Совет:</strong> Владелец комнаты всегда имеет максимальные права и не может быть удален или ограничен. Для передачи прав используйте функцию "Передать права владельца".
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Индивидуальные права участников</h2>
					<p>
						Помимо ролей, каждому участнику можно настроить индивидуальные права, которые переопределяют стандартные права роли. 
						Это позволяет создавать гибкие сценарии доступа, как в Telegram.
					</p>

					<div class="permissions-explanation">
						<div class="permission-item">
							<div class="permission-header">
								<div class="permission-icon edit">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
										<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
									</svg>
								</div>
								<div class="permission-info">
									<h4>Редактирование (canEdit)</h4>
									<p>Право на создание и редактирование заметок в комнате.</p>
								</div>
							</div>
							<div class="permission-details">
								<strong>Что позволяет:</strong>
								<ul>
									<li>Создавать новые заметки</li>
									<li>Редактировать свои заметки</li>
									<li>Использовать <a href="/docs/formatting" class="shortcut-link">форматирование текста</a></li>
									<li>Работать с <a href="/docs/tags" class="shortcut-link">тегами</a></li>
									<li>Использовать <a href="/docs/teleprompter" class="shortcut-link">телесуфлер</a></li>
								</ul>
							</div>
						</div>

						<div class="permission-item">
							<div class="permission-header">
								<div class="permission-icon delete">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<polyline points="3 6 5 6 21 6"/>
										<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
										<line x1="10" y1="11" x2="10" y2="17"/>
										<line x1="14" y1="11" x2="14" y2="17"/>
									</svg>
								</div>
								<div class="permission-info">
									<h4>Удаление (canDelete)</h4>
									<p>Право на удаление заметок других пользователей.</p>
								</div>
							</div>
							<div class="permission-details">
								<strong>Что позволяет:</strong>
								<ul>
									<li>Удалять любые заметки в комнате</li>
									<li>Очищать комнату от устаревшего контента</li>
									<li>Модерировать содержимое</li>
								</ul>
								<div class="warning-small">
									<strong>Важно:</strong> Пользователь всегда может удалить свои собственные заметки независимо от этого права.
								</div>
							</div>
						</div>

						<div class="permission-item">
							<div class="permission-header">
								<div class="permission-icon invite">
									<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
										<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
										<circle cx="8.5" cy="7" r="4"/>
										<line x1="20" y1="8" x2="20" y2="14"/>
										<line x1="23" y1="11" x2="17" y2="11"/>
									</svg>
								</div>
								<div class="permission-info">
									<h4>Приглашение (canInvite)</h4>
									<p>Право на добавление новых участников в комнату.</p>
								</div>
							</div>
							<div class="permission-details">
								<strong>Что позволяет:</strong>
								<ul>
									<li>Приглашать новых участников</li>
									<li>Отправлять ссылки-приглашения</li>
									<li>Расширять команду</li>
								</ul>
								<div class="tip-small">
									<strong>Совет:</strong> Для публичных комнат это право контролирует, кто может приглашать участников по ссылке.
								</div>
							</div>
						</div>
					</div>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Пример настройки прав:</span>
						</div>
						<div class="demo-content">
							<div class="demo-permissions">
								<div class="demo-permission-toggle">
									<span class="toggle-label">Редактирование</span>
									<div class="toggle-switch active"></div>
								</div>
								<div class="demo-permission-toggle">
									<span class="toggle-label">Удаление</span>
									<div class="toggle-switch"></div>
								</div>
								<div class="demo-permission-toggle">
									<span class="toggle-label">Приглашение</span>
									<div class="toggle-switch"></div>
								</div>
							</div>
						</div>
						<div class="demo-description">
							Переключатели для настройки индивидуальных прав участника
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Виджет управления пользователями</h2>
					<p>
						Для управления участниками и их правами используется специальный виджет — плавающее окно, 
						которое можно перемещать и изменять размер. Виджет доступен владельцам и модераторам комнаты.
					</p>

					<div class="ui-demo">
						<div class="demo-header">
							<span class="demo-title">Интерфейс виджета управления:</span>
						</div>
						<div class="demo-content">
							<div class="widget-mockup">
								<div class="widget-mockup-header">
									<span class="widget-mockup-title">Управление пользователями</span>
									<button class="widget-mockup-close">×</button>
								</div>
								<div class="widget-mockup-content">
									<div class="widget-user-item">
										<div class="widget-user-info">
											<div class="widget-avatar">И</div>
											<div class="widget-user-details">
												<div class="widget-user-name">Иван Петров</div>
												<div class="widget-user-username">@ivanpetrov</div>
												<div class="widget-user-badge creator">Владелец</div>
											</div>
										</div>
									</div>
									<div class="widget-user-item">
										<div class="widget-user-info">
											<div class="widget-avatar">М</div>
											<div class="widget-user-details">
												<div class="widget-user-name">Мария Сидорова</div>
												<div class="widget-user-username">@mariasidorova</div>
												<div class="widget-user-badge admin">Модератор</div>
											</div>
										</div>
									</div>
									<div class="widget-user-item">
										<div class="widget-user-info">
											<div class="widget-avatar">А</div>
											<div class="widget-user-details">
												<div class="widget-user-name">Алексей Смирнов</div>
												<div class="widget-user-username">@alexsmirnov</div>
												<div class="widget-user-badge participant">Участник</div>
											</div>
										</div>
										<div class="widget-permissions">
											<label>
												<input type="checkbox" checked disabled />
												<span>Редактирование</span>
											</label>
											<label>
												<input type="checkbox" disabled />
												<span>Приглашение</span>
											</label>
											<label>
												<input type="checkbox" disabled />
												<span>Удаление</span>
											</label>
										</div>
										<button class="widget-remove-btn">Удалить</button>
									</div>
								</div>
								<div class="widget-mockup-footer">
									<span class="widget-api-version">МУП API v1.0</span>
								</div>
							</div>
						</div>
						<div class="demo-description">
							Виджет управления пользователями показывает список участников с возможностью настройки прав
						</div>
					</div>

					<div class="tip">
						<div class="tip-icon">
							<Info size={16} />
						</div>
						<div class="tip-content">
							<strong>Совет:</strong> Владелец комнаты не может изменить свои права или удалить себя. Только владелец может передать права владельца другому участнику.
						</div>
					</div>
				</section>

				<section class="docs-section">
					<h2>Страница управления пользователями</h2>
					<p>
						Помимо плавающего виджета, в Copella Notepad есть отдельная полноэкранная страница для управления пользователями публичных комнат. 
						Эта страница предоставляет расширенный функционал для работы с участниками, включая аналитику, фильтрацию и массовые операции.
					</p>

					<div class="page-screenshot">
						<img src="/images/user-management-page.png" alt="Страница управления пользователями - аналитика и статистика" />
						<p class="screenshot-caption">Страница управления пользователями с панелью аналитики и статистики</p>
					</div>

					<h3>Аналитика и статистика</h3>
					<p>
						В верхней части страницы отображается панель аналитики с ключевыми метриками:
					</p>
					<div class="page-features-list">
						<div class="page-feature-item">
							<h4>Общая статистика</h4>
							<p>Общее количество участников, число пользователей онлайн, активных за последние 24 часа и неактивных более 7 дней.</p>
						</div>

						<div class="page-feature-item">
							<h4>Распределение по ролям</h4>
							<p>Визуализация количества владельцев, модераторов и обычных пользователей с процентным соотношением.</p>
						</div>

						<div class="page-feature-item">
							<h4>Топ активных пользователей</h4>
							<p>Список 5 наиболее активных участников с отображением их ролей и времени последней активности.</p>
						</div>

						<div class="page-feature-item">
							<h4>График активности</h4>
							<p>Визуальное представление распределения пользователей по ролям в виде столбчатой диаграммы.</p>
						</div>
					</div>

					<h3>Фильтрация и поиск</h3>
					<p>
						Система фильтров позволяет быстро находить нужных участников:
					</p>
					<div class="page-features-list">
						<div class="page-feature-item">
							<h4>Поиск</h4>
							<p>Поиск участников по имени или email с функцией быстрой очистки.</p>
						</div>

						<div class="page-feature-item">
							<h4>Фильтр по ролям</h4>
							<p>Отображение только владельцев, модераторов или обычных пользователей.</p>
						</div>

						<div class="page-feature-item">
							<h4>Фильтр по активности</h4>
							<p>Выбор пользователей по статусу: онлайн, недавно активные или неактивные.</p>
						</div>

						<div class="page-feature-item">
							<h4>Очистка фильтров</h4>
							<p>Быстрый сброс всех примененных фильтров одной кнопкой.</p>
						</div>
					</div>

					<h3>Массовые операции</h3>
					<p>
						Владелец комнаты может выполнять действия сразу с несколькими участниками:
					</p>
					<div class="page-features-list">
						<div class="page-feature-item">
							<h4>Выбор пользователей</h4>
							<p>Множественный выбор участников через чекбоксы в таблице с возможностью выбрать всех.</p>
						</div>

						<div class="page-feature-item">
							<h4>Изменение ролей</h4>
							<p>Изменение роли для нескольких выбранных пользователей одновременно (на пользователя или модератора).</p>
						</div>

						<div class="page-feature-item">
							<h4>Массовое удаление</h4>
							<p>Удаление выбранных участников из комнаты с подтверждением действия в модальном окне.</p>
						</div>

						<div class="page-feature-item">
							<h4>Контроль прав доступа</h4>
							<p>Массовые операции доступны только владельцу комнаты для обеспечения безопасности.</p>
						</div>
					</div>

					<h3>Таблица пользователей</h3>
					<p>
						Основная таблица содержит полную информацию обо всех участниках с возможностью:
					</p>
					<ul>
						<li>Просмотра роли, прав доступа и последней активности каждого участника</li>
						<li>Изменения роли отдельного пользователя (для владельца)</li>
						<li>Настройки индивидуальных прав доступа (canEdit, canInvite, canDelete)</li>
						<li>Передачи прав владельца другому участнику (только для текущего владельца)</li>
						<li>Удаления участников из комнаты</li>
					</ul>

					<h3>Заявки на вступление</h3>
					<p>
						Если для комнаты включена модерация (requireApproval), на странице отображается отдельный раздел с заявками на вступление, где владелец может одобрить или отклонить запросы на присоединение к комнате.
					</p>

					<div class="tip">
						<div class="tip-icon">
							<Info size={16} />
						</div>
						<div class="tip-content">
							<strong>Важно:</strong> Страница управления доступна только для публичных комнат. Для приватных комнат эта функция недоступна, так как в них может быть только владелец.
						</div>
					</div>
				</section>

				<div class="warning">
					<div class="warning-icon">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
							<line x1="12" y1="9" x2="12" y2="13"/>
							<line x1="12" y1="17" x2="12.01" y2="17"/>
						</svg>
					</div>
					<div class="warning-content">
						<strong>Важно:</strong> Изменения прав применяются мгновенно. Убедитесь, что понимаете последствия перед изменением ролей или удалением участников. Передача прав владельца необратима.
					</div>
				</div>

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
		max-width: 1000px;
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

	.docs-section h5 {
		margin: 16px 0 8px 0;
		font-size: 14px;
		font-weight: 600;
		color: #FEB1FF;
		text-transform: uppercase;
		letter-spacing: 0.5px;
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

	/* Feature highlights */
	.feature-highlights {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
		margin: 24px 0;
	}

	.feature-highlight {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		padding: 20px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
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

	/* Roles Grid */
	.roles-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 16px;
		margin: 24px 0;
	}

	.role-card {
		background-color: transparent;
		padding: 20px 0;
		transition: opacity 0.2s ease;
	}

	.role-card:hover {
		opacity: 0.8;
	}

	.role-header {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	.role-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		flex-shrink: 0;
	}

	.role-card.owner .role-icon {
		color: #FFD700;
	}

	.role-card.admin .role-icon {
		color: #8A2BE2;
	}

	.role-card.user .role-icon {
		color: #22c55e;
	}

	.role-info {
		flex: 1;
	}

	.role-info h4 {
		margin: 0 0 2px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.role-badge {
		display: inline-block;
		font-size: 11px;
		font-family: monospace;
		color: #707070;
	}

	.role-description {
		margin-bottom: 12px;
	}

	.role-description p {
		margin: 0;
		font-size: 13px;
		color: #909090;
		line-height: 1.5;
	}

	.role-permissions ul {
		list-style: none;
		padding: 0;
		margin: 4px 0 0 0;
	}

	.role-permissions li {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 3px 0;
		font-size: 13px;
		color: #a0a0a0;
	}

	.role-permissions li :global(svg) {
		flex-shrink: 0;
		opacity: 0.5;
	}

	.permission-custom {
		font-size: 13px;
		opacity: 0.5;
	}

	/* Permissions Explanation */
	.permissions-explanation {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin: 24px 0;
	}

	.permission-item {
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 12px;
		padding: 20px;
	}

	.permission-header {
		display: flex;
		align-items: flex-start;
		gap: 16px;
		margin-bottom: 16px;
	}

	.permission-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 40px;
		height: 40px;
		border-radius: 8px;
		flex-shrink: 0;
	}

	.permission-icon.edit {
		background-color: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}

	.permission-icon.delete {
		background-color: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.permission-icon.invite {
		background-color: rgba(34, 197, 94, 0.1);
		color: #22c55e;
	}

	.permission-info h4 {
		margin: 0 0 4px 0;
		font-size: 16px;
		font-weight: 500;
		color: #ffffff;
	}

	.permission-info p {
		margin: 0;
		font-size: 14px;
		color: #a0a0a0;
	}

	.permission-details {
		padding-left: 56px;
	}

	.permission-details ul {
		margin: 8px 0 16px 0;
		padding-left: 20px;
	}

	.permission-details li {
		font-size: 14px;
		margin: 0 0 4px 0;
	}

	.warning-small, .tip-small {
		padding: 12px;
		border-radius: 6px;
		font-size: 13px;
		margin-top: 12px;
	}

	.warning-small {
		background-color: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #c0c0c0;
	}

	.tip-small {
		background-color: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.2);
		color: #c0c0c0;
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

	.demo-permissions {
		display: flex;
		flex-direction: column;
		gap: 12px;
		background-color: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
		min-width: 250px;
	}

	.demo-permission-toggle {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.toggle-label {
		font-size: 14px;
		color: #c0c0c0;
	}

	.toggle-switch {
		width: 44px;
		height: 24px;
		background-color: #3a3a3a;
		border-radius: 12px;
		position: relative;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.toggle-switch::after {
		content: '';
		position: absolute;
		top: 2px;
		left: 2px;
		width: 20px;
		height: 20px;
		background-color: #ffffff;
		border-radius: 50%;
		transition: transform 0.2s ease;
	}

	.toggle-switch.active {
		background-color: #FEB1FF;
	}

	.toggle-switch.active::after {
		transform: translateX(20px);
	}

	/* Widget Mockup */
	.widget-mockup {
		width: 100%;
		max-width: 360px;
		background-color: #ffffff;
		border-radius: 8px;
		border: 1px solid #dadce0;
		box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
		overflow: hidden;
	}

	.widget-mockup-header {
		padding: 12px 16px;
		background: #ffffff;
		border-bottom: 1px solid #dadce0;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.widget-mockup-title {
		font-family: 'Gilroy', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 14px;
		font-weight: 600;
		color: #202124;
	}

	.widget-mockup-close {
		background: none;
		border: none;
		color: #5f6368;
		font-size: 20px;
		cursor: default;
		padding: 4px;
		width: 28px;
		height: 28px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
	}

	.widget-mockup-content {
		padding: 12px;
		max-height: 360px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.widget-user-item {
		background: #f8f9fa;
		border: 1px solid #e8eaed;
		border-radius: 8px;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.widget-user-info {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.widget-avatar {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: #1a73e8;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		font-size: 14px;
		flex-shrink: 0;
	}

	.widget-user-details {
		flex: 1;
		min-width: 0;
	}

	.widget-user-name {
		font-size: 13px;
		font-weight: 600;
		color: #202124;
		margin-bottom: 2px;
	}

	.widget-user-username {
		font-size: 11px;
		color: #5f6368;
		margin-bottom: 4px;
	}

	.widget-user-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 10px;
		font-weight: 500;
	}

	.widget-user-badge.creator {
		background: #fef7e0;
		color: #ea8600;
	}

	.widget-user-badge.admin {
		background: #e8f0fe;
		color: #1967d2;
	}

	.widget-user-badge.participant {
		background: #e6f4ea;
		color: #137333;
	}

	.widget-permissions {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding: 4px 0;
	}

	.widget-permissions label {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #202124;
	}

	.widget-permissions input[type="checkbox"] {
		width: 14px;
		height: 14px;
	}

	.widget-remove-btn {
		padding: 6px 12px;
		background: transparent;
		color: #d93025;
		border: 1px solid #d93025;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 500;
		align-self: flex-start;
		cursor: default;
	}

	.widget-mockup-footer {
		padding: 8px 16px;
		background: #f8f9fa;
		border-top: 1px solid #e8eaed;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.widget-api-version {
		font-size: 10px;
		font-weight: 400;
		color: #5f6368;
		letter-spacing: 0.3px;
	}

	/* Page screenshot */
	.page-screenshot {
		margin: 32px 0;
		text-align: center;
	}

	.page-screenshot img {
		width: 100%;
		max-width: 1200px;
		height: auto;
		border-radius: 8px;
		border: 1px solid #2a2a2a;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	}

	.screenshot-caption {
		margin: 12px 0 0 0;
		font-size: 13px;
		color: #909090;
		font-style: italic;
		text-align: center;
	}

	/* Page features list */
	.page-features-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
		margin: 20px 0;
	}

	.page-feature-item {
		padding: 16px 0;
	}

	.page-feature-item h4 {
		margin: 0 0 8px 0;
		font-size: 15px;
		font-weight: 500;
		color: #ffffff;
	}

	.page-feature-item p {
		margin: 0;
		font-size: 13px;
		color: #a0a0a0;
		line-height: 1.5;
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
	@media (max-width: 1024px) {
		.roles-grid {
			grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		}
	}

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

		.feature-highlights {
			grid-template-columns: 1fr;
		}

		.roles-grid {
			grid-template-columns: 1fr;
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

		.role-card {
			padding: 20px;
		}

		.permission-item {
			padding: 16px;
		}

		.permission-details {
			padding-left: 0;
		}
	}
</style>

