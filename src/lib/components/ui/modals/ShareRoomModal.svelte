<script lang="ts">
	import Modal from './Modal.svelte';
	import type { ModalProps } from './types';
	import { goto } from '$app/navigation';
	import { notifications } from '$lib/notifications';
	import { browser } from '$app/environment';

	// Функция для получения токена авторизации
	async function getAuthToken(): Promise<string | null> {
		try {
			// Сначала пытаемся получить токен из localStorage (приоритет)
			if (browser && typeof window !== 'undefined') {
				const token = window.localStorage.getItem('session_token');
				if (token) {
					return token;
				}
			}
			
			// Fallback: пытаемся получить через Supabase
			const { supabase } = await import('$lib/supabase');
			const { data: { session } } = await supabase.auth.getSession();
			if (session?.access_token) {
				return session.access_token;
			}
			
			return null;
		} catch (error) {
			console.error('[getAuthToken] Error:', error);
			return null;
		}
	}

	interface ShareRoomModalProps extends ModalProps {
		roomTitle?: string;
		roomId?: string;
		isOwner?: boolean;
		canInvite?: boolean;
		canManageRoom?: boolean;
		isPublic?: boolean;
	}

	let { isOpen, onClose, roomTitle = 'Комната', roomId, isOwner = false, canInvite = false, canManageRoom = false, isPublic = true }: ShareRoomModalProps = $props();

	// Состояние для переключения вкладок
	let activeTab = $state('general'); // 'general' | 'invites'

	// Реактивное обновление активной вкладки при открытии модалки
	$effect(() => {
		if (isOpen) {
			// Если есть право управления - показываем общую вкладку, если только приглашение - вкладку инвайтов
			activeTab = canManageRoom ? 'general' : 'invites';
		}
	});

	// Состояние для дополнительных опций
	let requireApproval = $state(false);

	// Состояния для загрузки и ошибок
	let isLoading = $state(false);
	let isSaving = $state(false);
	let error = $state('');
	let successMessage = $state('');

	// Состояние для управления приглашениями
	let inviteError = $state('');
	let inviteSuccessMessage = $state('');
	let inviteLoading = $state(false);
	let inviteLinkGenerated = $state('');
	let inviteExpiresAt = $state('');
	let invites = $state([]);
	
	// Локальное состояние для типа комнаты
	let roomIsPublic = $state(isPublic);

	// Загружаем настройки комнаты и приглашения
	$effect(() => {
		if (roomId) {
			loadRoomSettings();
			if (isOwner) {
				loadInvites();
			}
		}
	});

	// Функция для загрузки настроек комнаты
	async function loadRoomSettings() {
		if (!roomId) return;
		
		isLoading = true;
		error = '';
		
		try {
			const { getRoom } = await import('$lib/rooms');
			const { room, error: roomError } = await getRoom(roomId);
			if (roomError) {
				error = roomError;
				return;
			}
			
			if (room) {
				// Сохраняем тип комнаты
				roomIsPublic = room.isPublic;
				
				// Загружаем настройку одобрения
				requireApproval = room.requireApproval || false;
			}
		} catch (err) {
			console.error('Error loading room settings:', err);
			error = 'Ошибка загрузки настроек комнаты';
		} finally {
			isLoading = false;
		}
	}

	// Функция для сохранения настроек
	async function saveSettings() {
		if (!roomId) return;
		
		isSaving = true;
		error = '';
		successMessage = '';
		
		try {
			const { updateRoomPermissions } = await import('$lib/rooms');
			const { room, error: saveError } = await updateRoomPermissions(roomId, {
				requireApproval
			});
			if (saveError) {
				error = saveError;
				return;
			}
			
			successMessage = 'Настройки успешно сохранены!';
			
			// Автоматически скрываем сообщение об успехе через 3 секунды
			setTimeout(() => {
				successMessage = '';
			}, 3000);
			
		} catch (err) {
			console.error('Error saving room settings:', err);
			error = 'Ошибка сохранения настроек';
		} finally {
			isSaving = false;
		}
	}

	// Функция для перехода в мастер управления пользователями
	function handleUserManagementClick() {
		// Закрываем модальное окно и переходим на страницу управления пользователями для конкретной комнаты
		onClose();
		if (roomId) {
			goto(`/users/${roomId}`);
		} else {
			// Fallback на общую страницу пользователей, если roomId не указан
			goto('/users');
		}
	}

	// Функции для управления приглашениями
	async function loadInvites() {
		if (!roomId || !isOwner) return;
		
		try {
			inviteLoading = true;
			inviteError = '';

			// Получаем токен авторизации
			const token = await getAuthToken();
			if (!token) {
				inviteError = 'Необходима авторизация';
				return;
			}

			// Загружаем приглашения
			const response = await fetch(`/api/rooms/${roomId}/invites/manage`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			const result = await response.json();

			if (!response.ok) {
				inviteError = result.error || 'Ошибка загрузки приглашений';
				return;
			}

			// Загружаем только активные приглашения
			invites = result.invites.filter((invite: any) => invite.status === 'pending');

		} catch (err) {
			console.error('Error loading invites:', err);
			inviteError = 'Ошибка загрузки приглашений';
		} finally {
			inviteLoading = false;
		}
	}

	async function createInvite() {
		if (!roomId || !isOwner) return;
		
		try {
			inviteLoading = true;
			inviteError = '';
			inviteSuccessMessage = '';

			// Получаем токен авторизации
			const token = await getAuthToken();
			if (!token) {
				inviteError = 'Необходима авторизация';
				return;
			}

			// Создаем приглашение
			const response = await fetch(`/api/rooms/${roomId}/invites`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
			});

			const result = await response.json();

			if (!response.ok) {
				inviteError = result.error || 'Ошибка создания приглашения';
				return;
			}

			// Формируем ссылку для приглашения
			const baseUrl = window.location.origin;
			inviteLinkGenerated = `${baseUrl}/invite/${result.invite.inviteToken}`;
			inviteExpiresAt = new Date(result.invite.expiresAt).toLocaleDateString('ru-RU', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});

			inviteSuccessMessage = 'Приглашение создано успешно!';
			notifications.success('Приглашение создано успешно!');
			
			// Обновляем список приглашений
			await loadInvites();

		} catch (err) {
			console.error('Error creating invite:', err);
			inviteError = 'Ошибка создания приглашения';
		} finally {
			inviteLoading = false;
		}
	}

	async function copyGeneratedInviteLink() {
		try {
			await navigator.clipboard.writeText(inviteLinkGenerated);
			notifications.success('Ссылка скопирована в буфер обмена!');
		} catch (err) {
			console.error('Error copying to clipboard:', err);
			notifications.error('Ошибка копирования ссылки');
		}
	}

	async function revokeInvite(inviteId: string) {
		if (!roomId || !isOwner) return;
		
		try {
			inviteLoading = true;
			inviteError = '';

			// Получаем токен авторизации
			const token = await getAuthToken();
			if (!token) {
				inviteError = 'Необходима авторизация';
				return;
			}

			// Отзываем приглашение
			const response = await fetch(`/api/rooms/${roomId}/invites/manage`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`,
				},
				body: JSON.stringify({ inviteId })
			});

			const result = await response.json();

			if (!response.ok) {
				inviteError = result.error || 'Ошибка отзыва приглашения';
				return;
			}

			inviteSuccessMessage = result.message;
			notifications.success(result.message);
			
			// Обновляем список приглашений
			await loadInvites();

		} catch (err) {
			console.error('Error revoking invite:', err);
			inviteError = 'Ошибка отзыва приглашения';
			notifications.error('Ошибка отзыва приглашения');
		} finally {
			inviteLoading = false;
		}
	}

	import { formatDateLong } from '$lib/utils/dates';
	
	function formatDate(dateString: string) {
		return formatDateLong(dateString);
	}
</script>

<Modal {isOpen} {onClose} title="Управление комнатой" className="share-room-modal">
	<div class="share-room-content">
		<!-- Название комнаты -->
		<div class="room-header">
			<h3 class="room-name">{roomTitle}</h3>
			<p class="room-description">Управляйте доступом и участниками комнаты</p>
		</div>

		<!-- Вкладки -->
		<div class="tabs-container">
			<div class="tabs">
				{#if canManageRoom}
					<button 
						class="tab-button {activeTab === 'general' ? 'tab-button--active' : ''}"
						onclick={() => activeTab = 'general'}
					>
						Общая
					</button>
				{/if}
				{#if isOwner || canInvite}
					<button 
						class="tab-button {activeTab === 'invites' ? 'tab-button--active' : ''}"
						onclick={() => activeTab = 'invites'}
					>
						Инвайты
					</button>
				{/if}
			</div>
		</div>

		<!-- Контент вкладок -->
		{#if activeTab === 'general'}
			<!-- Вкладка Общая -->
			
			<!-- Кнопка управления пользователями (только для публичных комнат) -->
			{#if roomIsPublic && canManageRoom}
			<div class="user-management-section">
				<button
					type="button"
					class="btn btn--primary btn--full-width"
					onclick={handleUserManagementClick}
				>
					<svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
						<path d="M20 8v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M23 11h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						<path d="M20 8l3 3-3 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<span>Перейти в мастер управления пользователями</span>
				</button>
				<p class="management-hint">Управляйте правами и ролями участников в мастере управления</p>
			</div>
			{:else if !roomIsPublic}
			<!-- Сообщение для приватных комнат -->
			<div class="private-room-notice">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
					<rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="2"/>
					<circle cx="12" cy="16" r="1" fill="currentColor"/>
					<path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2"/>
				</svg>
				<div class="notice-content">
					<strong>Приватная комната</strong>
					<p>Это личное пространство. Управление участниками недоступно.</p>
				</div>
			</div>
			{/if}

			<!-- Настройки приёма участников -->
			<div class="additional-options">
				<div class="section-label">Настройки приёма участников</div>
				
				<div class="option-item">
					<div class="option-info">
						<span class="option-title">Требовать одобрения</span>
						<span class="option-description">Новые участники должны быть одобрены владельцем перед вступлением в комнату</span>
					</div>
					<label class="toggle-switch">
						<input 
							type="checkbox" 
							bind:checked={requireApproval}
							disabled={!canManageRoom}
						/>
						<span class="toggle-slider"></span>
					</label>
				</div>
			</div>

			<!-- Сообщения об ошибках и успехе -->
			{#if error}
				<div class="error-message">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
						<line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
						<line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
					</svg>
					<span>{error}</span>
				</div>
			{/if}

			{#if successMessage}
				<div class="success-message">
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					<span>{successMessage}</span>
				</div>
			{/if}

			<!-- Кнопки действий -->
			<div class="modal-actions">
				<button
					type="button"
					class="btn btn--secondary"
					onclick={onClose}
					disabled={isSaving}
				>
					Закрыть
				</button>
				{#if canManageRoom}
					<button
						type="button"
						class="btn btn--primary"
						onclick={saveSettings}
						disabled={isSaving || isLoading}
					>
						{#if isSaving}
							<svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
								<path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							<span>Сохранение...</span>
						{:else}
							<svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								<polyline points="17,21 17,13 7,13 7,21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								<polyline points="7,3 7,8 15,8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							<span>Сохранить настройки</span>
						{/if}
					</button>
				{/if}
			</div>

		{:else if activeTab === 'invites' && (isOwner || canInvite)}
			<!-- Контент вкладки Инвайты -->
			<div class="invites-content">
				<!-- Создание приглашения -->
				<div class="invite-create-section">
					<h3 class="section-title">Создать новое приглашение</h3>
					<p class="section-description">
						Создайте ссылку для приглашения новых участников в комнату. 
						Ссылка будет действительна в течение 7 дней.
					</p>
					
					<button 
						onclick={createInvite}
						disabled={inviteLoading}
						class="btn btn--primary btn--full-width"
					>
						{inviteLoading ? 'Создание...' : 'Создать приглашение'}
					</button>
				</div>

				{#if inviteLinkGenerated}
					<div class="invite-link-section">
						<h4 class="section-subtitle">Ссылка для приглашения</h4>
						<div class="invite-link-container">
							<input 
								type="text" 
								value={inviteLinkGenerated} 
								readonly
								class="invite-link-input"
							/>
							<button 
								onclick={copyGeneratedInviteLink}
								class="btn btn--secondary btn--sm"
							>
								Копировать
							</button>
						</div>
						<p class="invite-expires">
							Истекает: {inviteExpiresAt}
						</p>
					</div>
				{/if}

				<!-- Активные приглашения -->
				<div class="active-invites-section">
					<h3 class="section-title">Активные приглашения ({invites.length})</h3>
					{#if invites.length === 0}
						<p class="empty-state">Нет активных приглашений</p>
					{:else}
						<div class="invites-list">
							{#each invites as invite}
								<div class="invite-item">
									<div class="invite-info">
										<p class="invite-id">Приглашение #{invite.id.slice(-8)}</p>
										<p class="invite-created">Создано: {formatDate(invite.createdAt)}</p>
										<p class="invite-expires">Истекает: {formatDate(invite.expiresAt)}</p>
									</div>
									<button 
										onclick={() => revokeInvite(invite.id)}
										disabled={inviteLoading}
										class="btn btn--danger btn--sm"
									>
										Отозвать
									</button>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Сообщения об ошибках и успехе для приглашений -->
				{#if inviteError}
					<div class="error-message">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
							<line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/>
							<line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/>
						</svg>
						<span>{inviteError}</span>
					</div>
				{/if}

				{#if inviteSuccessMessage}
					<div class="success-message">
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
							<path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
						</svg>
						<span>{inviteSuccessMessage}</span>
					</div>
				{/if}
			</div>

			<!-- Кнопки действий для вкладки Инвайты -->
			<div class="modal-actions">
				<button
					type="button"
					class="btn btn--secondary"
					onclick={onClose}
				>
					Закрыть
				</button>
			</div>
		{/if}
	</div>
</Modal>

<style>
	.share-room-modal .modal-container {
		max-width: 520px;
	}

	.share-room-content {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	/* Заголовок комнаты */
	.room-header {
		text-align: center;
		margin-bottom: 8px;
	}

	.room-name {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 20px;
		color: #FFFFFF;
		margin: 0 0 8px 0;
	}

	.room-description {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #888888;
		margin: 0;
	}

	/* Пригласительная ссылка */
	.invite-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.invite-link-container {
		display: flex;
		gap: 8px;
		align-items: stretch;
	}

	.invite-link-input {
		flex: 1;
		background: #2A2A2A;
		border: 1px solid #3A3A3A;
		border-radius: 8px;
		padding: 12px 16px;
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #FFFFFF;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.invite-link-input:focus {
		border-color: #FEB1FF;
		box-shadow: 0 0 0 2px rgba(254, 177, 255, 0.2);
	}

	.invite-link-input::placeholder {
		color: #666666;
	}

	/* Права участников */
	.permissions-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-label {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 16px;
		color: #FFFFFF;
		margin: 0;
	}
	
	.section-label-small {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		color: #FFFFFF;
		margin: 0;
	}
	
	.section-description-small {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 13px;
		color: #888888;
		margin: 8px 0 0 0;
		line-height: 1.5;
	}

	.permissions-list {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.permission-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		background: #2A2A2A;
		border: 1px solid #3A3A3A;
		border-radius: 12px;
		transition: border-color 0.2s ease;
	}

	.permission-item:hover {
		border-color: #FEB1FF;
	}

	.permission-info {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
	}

	.permission-icon {
		width: 40px;
		height: 40px;
		background: #FEB1FF;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #000000;
	}

	.permission-details {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.permission-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		color: #FFFFFF;
	}

	.permission-description {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 12px;
		color: #888888;
	}

	/* Переключатели */
	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 48px;
		height: 24px;
		cursor: pointer;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: #3A3A3A;
		transition: 0.2s;
		border-radius: 24px;
	}

	.toggle-slider:before {
		position: absolute;
		content: "";
		height: 18px;
		width: 18px;
		left: 3px;
		bottom: 3px;
		background-color: #ffffff;
		transition: 0.2s;
		border-radius: 50%;
	}

	input:checked + .toggle-slider {
		background-color: #FEB1FF;
	}

	input:checked + .toggle-slider:before {
		transform: translateX(24px);
		background-color: #000000;
	}

	/* Секция управления пользователями */
	.user-management-section {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* Уведомление для приватных комнат */
	.private-room-notice {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background: rgba(254, 177, 255, 0.1);
		border: 1px solid rgba(254, 177, 255, 0.3);
		border-radius: 12px;
		color: #FEB1FF;
	}

	.private-room-notice svg {
		flex-shrink: 0;
		margin-top: 2px;
	}

	.notice-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.notice-content strong {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		color: #FEB1FF;
	}

	.notice-content p {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 13px;
		color: #c4a3c5;
		margin: 0;
	}
	
	/* Информационное уведомление */
	.info-notice {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background: rgba(59, 130, 246, 0.1);
		border: 1px solid rgba(59, 130, 246, 0.3);
		border-radius: 12px;
		color: #60a5fa;
	}
	
	.info-notice svg {
		flex-shrink: 0;
		margin-top: 2px;
	}
	
	.info-notice .notice-content strong {
		color: #60a5fa;
	}
	
	.info-notice .notice-content p {
		color: #93c5fd;
	}
	
	/* Подсказка для мастера управления */
	.management-hint {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 13px;
		color: #888888;
		margin: 12px 0 0 0;
		text-align: center;
	}

	/* Дополнительные опции */
	.additional-options {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.option-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: #2A2A2A;
		border: 1px solid #3A3A3A;
		border-radius: 8px;
		transition: border-color 0.2s ease;
	}

	.option-item:hover {
		border-color: #FEB1FF;
	}

	.option-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
	}

	.option-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 14px;
		color: #FFFFFF;
	}

	.option-description {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 12px;
		color: #888888;
	}

	/* Кнопки действий */
	.modal-actions {
		display: flex;
		gap: 12px;
		justify-content: flex-end;
		padding-top: 8px;
	}

	/* Стили для иконок в кнопках */
	.btn-icon {
		width: 16px;
		height: 16px;
		flex-shrink: 0;
	}

	/* Поле ввода даты и времени */
	.time-restriction-input {
		margin-top: 12px;
		padding: 12px 16px;
		background: #1A1A1A;
		border: 1px solid #3A3A3A;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.input-label {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 14px;
		color: #FFFFFF;
	}

	.datetime-input {
		background: #2A2A2A;
		border: 1px solid #3A3A3A;
		border-radius: 6px;
		padding: 8px 12px;
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #FFFFFF;
		outline: none;
		transition: border-color 0.2s ease;
	}

	.datetime-input:focus {
		border-color: #FEB1FF;
		box-shadow: 0 0 0 2px rgba(254, 177, 255, 0.2);
	}

	/* Сообщения об ошибках и успехе */
	.error-message {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 8px;
		color: #EF4444;
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
	}

	.success-message {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 12px 16px;
		background: rgba(34, 197, 94, 0.1);
		border: 1px solid rgba(34, 197, 94, 0.3);
		border-radius: 8px;
		color: #22C55E;
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.share-room-content {
			gap: 20px;
		}

		.room-name {
			font-size: 18px;
		}

		.invite-link-container {
			flex-direction: column;
		}

		.modal-actions {
			flex-direction: column;
		}

		.modal-actions .btn {
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.share-room-content {
			gap: 16px;
		}

		.permission-item {
			padding: 12px;
		}

		.permission-icon {
			width: 32px;
			height: 32px;
		}

		.option-item {
			padding: 10px 12px;
		}
	}

	/* Стили для вкладок */
	.tabs-container {
		border-bottom: 1px solid #3A3A3A;
		margin-bottom: 24px;
	}

	.tabs {
		display: flex;
	}

	.tab-button {
		flex: 1;
		padding: 12px 16px;
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		color: #888888;
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 14px;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.tab-button:hover {
		color: #FFFFFF;
	}

	.tab-button--active {
		color: #FEB1FF;
		border-bottom-color: #FEB1FF;
	}

	/* Стили для контента приглашений */
	.invites-content {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.invite-create-section {
		text-align: center;
		padding: 20px;
		background: #2A2A2A;
		border: 1px solid #3A3A3A;
		border-radius: 12px;
	}

	.section-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 18px;
		color: #FFFFFF;
		margin: 0 0 8px 0;
	}

	.section-subtitle {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 16px;
		color: #FFFFFF;
		margin: 0 0 12px 0;
	}

	.section-description {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #888888;
		margin: 0 0 20px 0;
		line-height: 1.5;
	}

	.invite-link-section {
		padding: 16px;
		background: #2A2A2A;
		border: 1px solid #3A3A3A;
		border-radius: 8px;
	}

	.invite-expires {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 12px;
		color: #888888;
		margin: 8px 0 0 0;
	}

	.active-invites-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.invites-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.invite-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		background: #2A2A2A;
		border: 1px solid #3A3A3A;
		border-radius: 8px;
		transition: border-color 0.2s ease;
	}

	.invite-item:hover {
		border-color: #FEB1FF;
	}

	.invite-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
	}

	.invite-id {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		color: #FFFFFF;
		margin: 0;
	}

	.invite-created,
	.invite-expires {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 12px;
		color: #888888;
		margin: 0;
	}

	.empty-state {
		text-align: center;
		padding: 40px 20px;
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #888888;
		margin: 0;
	}

	/* Стили для кнопок */
	.btn--danger {
		background: #EF4444;
		color: #FFFFFF;
		border: 1px solid #EF4444;
	}

	.btn--danger:hover {
		background: #DC2626;
		border-color: #DC2626;
	}

	.btn--full-width {
		width: 100%;
	}
</style>
