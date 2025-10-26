<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { currentUser, authState } from '$lib/stores/user';
	import { fetchCurrentUser, getAuthToken } from '$lib/api/userApi';
	import { realtimeClient } from '$lib/realtime';

	// Получаем токен приглашения из параметров маршрута
	const inviteToken = $derived($page.params.token);
	
	// Состояние страницы
	let inviteData = $state({
		room: null,
		inviter: null,
		expiresAt: null
	});
	
	let isLoading = $state(true);
	let error = $state('');
	let isProcessing = $state(false);
	let showSuccess = $state(false);
	let showDeclined = $state(false);
	let isWaitingApproval = $state(false);
	let showApproved = $state(false);
	let wsConnected = $state(false);

	// Обработчик ответа на одобрение
	function handleApprovalResponse(message: any) {
		console.log('[Invite] Received approval response:', message);
		
		const { status, action, data } = message;
		const approvalStatus = status || action || data?.status || data?.action;
		
		console.log('[Invite] Approval status:', approvalStatus);
		
		if (approvalStatus === 'approved') {
			// Заявка одобрена - показываем галочку, затем переходим в комнату
			console.log('[Invite] Application approved! Showing success message...');
			isWaitingApproval = false;
			showSuccess = false;
			showApproved = true;
			
			// Через 2 секунды перенаправляем в комнату
			setTimeout(() => {
				if (inviteData?.room?.id) {
					console.log('[Invite] Redirecting to room:', inviteData.room.id);
					goto(`/room/${inviteData.room.id}`);
				}
			}, 2000);
		} else if (approvalStatus === 'rejected') {
			// Заявка отклонена
			console.log('[Invite] Application rejected');
			isWaitingApproval = false;
			showSuccess = false;
			error = 'Ваша заявка была отклонена владельцем комнаты';
		}
	}

	onMount(async () => {
		try {
			// Получаем текущего пользователя через централизованный API
			// Если пользователь еще не загружен в store
			if (!$currentUser) {
				const { user: fetchedUser, error: userError } = await fetchCurrentUser();
				if (userError || !fetchedUser) {
					console.error('User authentication error:', userError);
					error = 'Необходима авторизация. Пожалуйста, войдите в систему.';
					isLoading = false;
					// Перенаправляем на страницу логина
					setTimeout(() => goto('/auth/login'), 2000);
					return;
				}
			}

			// Загружаем информацию о приглашении
			await loadInviteInfo();
		} catch (err) {
			console.error('Unexpected error loading invite page:', err);
			error = 'Ошибка загрузки страницы приглашения';
			isLoading = false;
		}
	});

	onDestroy(() => {
		// Удаляем обработчик при уничтожении компонента
		if (realtimeClient && wsConnected) {
			realtimeClient.offMessage('approval_response', handleApprovalResponse);
		}
	});

	async function loadInviteInfo() {
		try {
			// Получаем токен через единый API
			const accessToken = getAuthToken();
			if (!accessToken) {
				error = 'Необходима авторизация';
				isLoading = false;
				setTimeout(() => goto('/auth/login'), 2000);
				return;
			}

			// Загружаем информацию о приглашении
			const response = await fetch(`/api/rooms/invite-info?token=${inviteToken}`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${accessToken}`,
				},
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Ошибка загрузки приглашения';
				isLoading = false;
				return;
			}

			inviteData = result.invite;
			isLoading = false;
		} catch (err) {
			console.error('Error loading invite info:', err);
			error = 'Ошибка загрузки информации о приглашении';
			isLoading = false;
		}
	}

	async function acceptInvite() {
		if (isProcessing) return;
		
		isProcessing = true;
		error = '';

		try {
			// Получаем токен через единый API
			const accessToken = getAuthToken();
			if (!accessToken) {
				error = 'Необходима авторизация';
				isProcessing = false;
				return;
			}

			// Принимаем приглашение
			const response = await fetch(`/api/rooms/${inviteData.room.id}/invites?token=${inviteToken}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${accessToken}`,
				},
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Ошибка принятия приглашения';
				isProcessing = false;
				return;
			}

			if (result.requiresApproval) {
				// Показываем сообщение о том, что заявка отправлена на одобрение
				showSuccess = true;
				isWaitingApproval = true;
				isProcessing = false;
				
				// Подключаемся к WebSocket глобально чтобы получить уведомление об одобрении
				// WebSocket подключится без присоединения к комнате
				try {
					console.log('[Invite] Setting up Realtime connection...');
					if (realtimeClient) {
						// Подписываемся на ВСЕ сообщения для отладки
						realtimeClient.onMessage('*', (message) => {
							console.log('[Invite] Received Realtime message (all):', message);
						});
						
						// Подписываемся на ответ об одобрении ПЕРЕД подключением
						console.log('[Invite] Subscribing to approval_response events...');
						realtimeClient.onMessage('approval_response', handleApprovalResponse);
						
						// Подключаемся к Realtime
						console.log('[Invite] Connecting to Realtime globally...');
						const connected = await realtimeClient.connectGlobal();
						console.log('[Invite] Realtime connection result:', connected);
						
						if (connected) {
							wsConnected = true;
							console.log('[Invite] Successfully connected to WebSocket and subscribed to approval_response events');
						} else {
							console.error('[Invite] Failed to connect to WebSocket');
						}
					} else {
						console.error('[Invite] websocketClient is not available');
					}
				} catch (wsError) {
					console.error('[Invite] Error setting up WebSocket:', wsError);
					// Не показываем ошибку пользователю, он все равно может обновить страницу
				}
			} else {
				// Переходим в комнату сразу
				goto(`/room/${inviteData.room.id}`);
			}
		} catch (err) {
			console.error('Error accepting invite:', err);
			error = 'Ошибка принятия приглашения';
			isProcessing = false;
		}
	}

	async function declineInvite() {
		if (isProcessing) return;
		
		isProcessing = true;
		error = '';

		try {
			// Получаем токен через единый API
			const accessToken = getAuthToken();
			if (!accessToken) {
				error = 'Необходима авторизация';
				isProcessing = false;
				return;
			}

			// Отклоняем приглашение
			const response = await fetch(`/api/rooms/${inviteData.room.id}/invites?token=${inviteToken}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${accessToken}`,
				},
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Ошибка отклонения приглашения';
				isProcessing = false;
				return;
			}

			showDeclined = true;
			setTimeout(() => {
				goto('/');
			}, 3000);
		} catch (err) {
			console.error('Error declining invite:', err);
			error = 'Ошибка отклонения приглашения';
			isProcessing = false;
		}
	}

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('ru-RU', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>Приглашение в комнату - Copella Notepad</title>
</svelte:head>

<div class="invite-page">
	<div class="invite-container">
		{#if isLoading}
			<!-- Загрузка -->
			<div class="invite-card invite-card--center">
				<div class="spinner"></div>
				<p class="status-text">Загрузка приглашения...</p>
			</div>
		{:else if error}
			<!-- Ошибка -->
			<div class="invite-card invite-card--center">
				<div class="status-icon status-icon--error">
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="12" cy="12" r="10" stroke="#EF4444" stroke-width="2"/>
						<path d="M12 8V12" stroke="#EF4444" stroke-width="2" stroke-linecap="round"/>
						<circle cx="12" cy="16" r="1" fill="#EF4444"/>
					</svg>
				</div>
				<h1 class="status-title">Ошибка</h1>
				<p class="status-text">{error}</p>
				<button 
					onclick={() => goto('/')}
					class="btn btn--primary btn--full-width"
				>
					Вернуться на главную
				</button>
			</div>
		{:else if showSuccess}
			<!-- Ожидание одобрения -->
			<div class="invite-card invite-card--center">
				<div class="spinner"></div>
				<h1 class="status-title">Ожидаем принятие</h1>
			</div>
		{:else if showApproved}
			<!-- Заявка принята -->
			<div class="invite-card invite-card--center">
				<div class="status-icon status-icon--success">
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="12" cy="12" r="10" stroke="#22C55E" stroke-width="2"/>
						<path d="M8 12L11 15L16 9" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
				</div>
				<h1 class="status-title">Вы приняты!</h1>
				<p class="status-text">Перенаправление в комнату...</p>
			</div>
		{:else if showDeclined}
			<!-- Отклонение -->
			<div class="invite-card invite-card--center">
				<div class="status-icon">
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<circle cx="12" cy="12" r="10" stroke="#888888" stroke-width="2"/>
						<path d="M8 8L16 16M16 8L8 16" stroke="#888888" stroke-width="2" stroke-linecap="round"/>
					</svg>
				</div>
				<h1 class="status-title">Приглашение отклонено</h1>
				<p class="status-text">
					Вы отклонили приглашение в комнату.
				</p>
				<p class="status-subtext">Перенаправление на главную страницу...</p>
			</div>
		{:else}
			<!-- Основная страница приглашения -->
			<div class="invite-card">
				<!-- Заголовок -->
				<div class="invite-header">
					<h1 class="invite-header-title">Приглашение в комнату</h1>
					<p class="invite-header-subtitle">Вас приглашают присоединиться к совместной работе</p>
				</div>

				<!-- Информация о комнате -->
				<div class="invite-content">
					<div class="room-info">
						<h2 class="room-title">{inviteData.room.title}</h2>
						{#if inviteData.room.description}
							<p class="room-description">{inviteData.room.description}</p>
						{/if}

						<!-- Информация о владельце -->
						<div class="inviter-info">
							{#if inviteData.inviter.avatarUrl}
								<img 
									src={inviteData.inviter.avatarUrl} 
									alt={inviteData.inviter.fullName}
									class="inviter-avatar"
								/>
							{:else}
								<div class="inviter-avatar inviter-avatar--placeholder">
									{inviteData.inviter.fullName.charAt(0).toUpperCase()}
								</div>
							{/if}
							<div class="inviter-details">
								<p class="inviter-name">{inviteData.inviter.fullName}</p>
								<p class="inviter-label">приглашает вас</p>
							</div>
						</div>

						<!-- Дополнительная информация -->
						<div class="room-details">
							<div class="detail-row">
								<span class="detail-label">Участников:</span>
								<span class="detail-value">{inviteData.room._count.participants} / {inviteData.room.participantLimit}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">Истекает:</span>
								<span class="detail-value">{formatDate(inviteData.expiresAt)}</span>
							</div>
						{#if inviteData.room.requireApproval}
							<div class="detail-row detail-row--warning">
								<svg class="warning-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<path d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18C1.64537 18.3024 1.55296 18.6453 1.55199 18.9945C1.55101 19.3437 1.64151 19.6871 1.81445 19.9905C1.98738 20.2939 2.23675 20.5467 2.53773 20.7239C2.83871 20.901 3.18082 20.9962 3.53 21H20.47C20.8192 20.9962 21.1613 20.901 21.4623 20.7239C21.7633 20.5467 22.0126 20.2939 22.1856 19.9905C22.3585 19.6871 22.449 19.3437 22.448 18.9945C22.447 18.6453 22.3546 18.3024 22.18 18L13.71 3.86C13.5318 3.56611 13.2807 3.32312 12.9812 3.15448C12.6817 2.98585 12.3438 2.89725 12 2.89725C11.6562 2.89725 11.3183 2.98585 11.0188 3.15448C10.7193 3.32312 10.4682 3.56611 10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
								</svg>
								<span class="warning-text">Требуется одобрение владельца</span>
							</div>
						{/if}
						</div>
					</div>

					<!-- Кнопки действий -->
					<div class="action-buttons">
						<button 
							onclick={acceptInvite}
							disabled={isProcessing}
							class="btn btn--primary btn--full-width btn--lg"
						>
							{isProcessing ? 'Обработка...' : 'Принять приглашение'}
						</button>
						
						<button 
							onclick={declineInvite}
							disabled={isProcessing}
							class="btn btn--secondary btn--full-width btn--lg"
						>
							Отклонить
						</button>
					</div>

					{#if error}
						<div class="error-message">
							<p>{error}</p>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<style>
	.invite-page {
		min-height: 100vh;
		background: #121212;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
	}

	.invite-container {
		width: 100%;
		max-width: 480px;
	}

	.invite-card {
		background: #1A1A1A;
		border-radius: 16px;
		overflow: hidden;
	}

	.invite-card--center {
		padding: 48px 32px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	/* Loading spinner */
	.spinner {
		width: 48px;
		height: 48px;
		border: 3px solid #2A2A2A;
		border-top: 3px solid #FEB1FF;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 8px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Status messages */
	.status-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 16px;
	}

	.status-icon svg {
		width: 64px;
		height: 64px;
	}

	.status-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 24px;
		color: #FFFFFF;
		margin: 0;
	}

	.status-text {
		font-family: 'Gilroy', sans-serif;
		font-size: 16px;
		font-weight: 500;
		color: #888888;
		margin: 0;
		line-height: 1.5;
	}

	.status-subtext {
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		font-weight: 500;
		color: #666666;
		margin: 0;
		margin-top: 8px;
	}

	/* Invite header */
	.invite-header {
		background: linear-gradient(135deg, #FEB1FF 0%, #FF9EFF 100%);
		padding: 32px 24px;
		text-align: center;
	}

	.invite-header-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 24px;
		color: #000000;
		margin: 0 0 8px 0;
	}

	.invite-header-subtitle {
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		color: #333333;
		margin: 0;
		opacity: 0.9;
	}

	/* Invite content */
	.invite-content {
		padding: 24px;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	/* Room info */
	.room-info {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.room-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 20px;
		color: #FFFFFF;
		margin: 0;
	}

	.room-description {
		font-family: 'Gilroy', sans-serif;
		font-size: 15px;
		font-weight: 500;
		color: #888888;
		margin: 0;
		line-height: 1.5;
	}

	/* Inviter info */
	.inviter-info {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 16px;
		background: #242424;
		border-radius: 12px;
	}

	.inviter-avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.inviter-avatar--placeholder {
		background: #FEB1FF;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		font-size: 20px;
		color: #000000;
	}

	.inviter-details {
		flex: 1;
		min-width: 0;
	}

	.inviter-name {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 16px;
		color: #FFFFFF;
		margin: 0 0 4px 0;
	}

	.inviter-label {
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		font-weight: 500;
		color: #888888;
		margin: 0;
	}

	/* Room details */
	.room-details {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding: 16px;
		background: #242424;
		border-radius: 12px;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
	}

	.detail-label {
		color: #888888;
		font-weight: 500;
	}

	.detail-value {
		color: #FFFFFF;
		font-weight: 600;
	}

	.detail-row--warning {
		color: #FFA500;
		padding-top: 8px;
		border-top: 1px solid #2A2A2A;
		justify-content: flex-start;
		gap: 8px;
	}

	.warning-icon {
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #FFA500;
	}

	.warning-text {
		flex: 1;
		font-weight: 500;
	}

	/* Action buttons */
	.action-buttons {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* Error message */
	.error-message {
		background: #FF4444;
		border-radius: 8px;
		padding: 12px 16px;
		margin-top: -8px;
	}

	.error-message p {
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		font-weight: 600;
		color: #FFFFFF;
		margin: 0;
	}

	/* Responsive */
	@media (max-width: 480px) {
		.invite-page {
			padding: 12px;
		}

		.invite-card--center {
			padding: 32px 20px;
		}

		.invite-header {
			padding: 24px 20px;
		}

		.invite-header-title {
			font-size: 20px;
		}

		.invite-content {
			padding: 20px;
		}

		.room-title {
			font-size: 18px;
		}
	}
</style>
