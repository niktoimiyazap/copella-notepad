<script lang="ts">
	import { onMount } from 'svelte';
	import { notifications } from '$lib/notifications';

	interface Props {
		isOpen: boolean;
		roomId: string;
		onClose: () => void;
	}

	let { isOpen, roomId, onClose }: Props = $props();

	// Состояние модалки
	let activeTab = $state('create'); // 'create' | 'manage'
	let isLoading = $state(false);
	let error = $state('');
	let successMessage = $state('');

	// Состояние для создания приглашения
	let inviteLink = $state('');
	let inviteExpiresAt = $state('');

	// Состояние для управления приглашениями
	let invites = $state([]);
	let pendingApprovals = $state([]);

	// Загружаем данные при открытии модалки
	$effect(() => {
		if (isOpen && roomId) {
			loadInvites();
		}
	});

	async function loadInvites() {
		try {
			isLoading = true;
			error = '';

			// Получаем токен сессии
			const sessionToken = localStorage.getItem('session_token');
			if (!sessionToken) {
				error = 'Необходима авторизация';
				return;
			}

			// Загружаем приглашения
			const response = await fetch(`/api/rooms/${roomId}/invites/manage`, {
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${sessionToken}`,
				},
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Ошибка загрузки приглашений';
				return;
			}

			// Разделяем приглашения на активные и ожидающие одобрения
			invites = result.invites.filter((invite: any) => invite.status === 'pending');
			pendingApprovals = result.invites.filter((invite: any) => invite.status === 'pending_approval');

		} catch (err) {
			console.error('Error loading invites:', err);
			error = 'Ошибка загрузки приглашений';
		} finally {
			isLoading = false;
		}
	}

	async function createInvite() {
		try {
			isLoading = true;
			error = '';
			successMessage = '';

			// Получаем токен сессии
			const sessionToken = localStorage.getItem('session_token');
			if (!sessionToken) {
				error = 'Необходима авторизация';
				return;
			}

			// Создаем приглашение
			const response = await fetch(`/api/rooms/${roomId}/invites`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${sessionToken}`,
				},
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Ошибка создания приглашения';
				return;
			}

			// Формируем ссылку для приглашения
			const baseUrl = window.location.origin;
			inviteLink = `${baseUrl}/invite/${result.invite.inviteToken}`;
			inviteExpiresAt = new Date(result.invite.expiresAt).toLocaleDateString('ru-RU', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit'
			});

			successMessage = 'Приглашение создано успешно!';
			notifications.success('Приглашение создано успешно!');
			
			// Обновляем список приглашений
			await loadInvites();

		} catch (err) {
			console.error('Error creating invite:', err);
			error = 'Ошибка создания приглашения';
		} finally {
			isLoading = false;
		}
	}

	async function copyInviteLink() {
		try {
			await navigator.clipboard.writeText(inviteLink);
			notifications.success('Ссылка скопирована в буфер обмена!');
		} catch (err) {
			console.error('Error copying to clipboard:', err);
			notifications.error('Ошибка копирования ссылки');
		}
	}

	async function handleApproval(inviteId: string, action: 'approve' | 'reject') {
		try {
			isLoading = true;
			error = '';

			// Получаем токен сессии
			const sessionToken = localStorage.getItem('session_token');
			if (!sessionToken) {
				error = 'Необходима авторизация';
				return;
			}

			// Отправляем действие
			const response = await fetch(`/api/rooms/${roomId}/invites/manage`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${sessionToken}`,
				},
				body: JSON.stringify({
					inviteId,
					action
				})
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || `Ошибка ${action === 'approve' ? 'одобрения' : 'отклонения'} заявки`;
				return;
		}

		successMessage = result.message;
		notifications.success(result.message);
		
		// Обновляем список приглашений
		await loadInvites();

	} catch (err) {
		console.error(`Error ${action}ing invite:`, err);
		error = `Ошибка ${action === 'approve' ? 'одобрения' : 'отклонения'} заявки`;
		notifications.error(`Ошибка ${action === 'approve' ? 'одобрения' : 'отклонения'} заявки`);
	} finally {
		isLoading = false;
	}
	}

	async function revokeInvite(inviteId: string) {
		try {
			isLoading = true;
			error = '';

			// Получаем токен сессии
			const sessionToken = localStorage.getItem('session_token');
			if (!sessionToken) {
				error = 'Необходима авторизация';
				return;
			}

			// Отзываем приглашение
			const response = await fetch(`/api/rooms/${roomId}/invites/manage`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${sessionToken}`,
				},
				body: JSON.stringify({ inviteId })
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Ошибка отзыва приглашения';
				return;
			}

		successMessage = result.message;
		notifications.success(result.message);
		
		// Обновляем список приглашений
		await loadInvites();

	} catch (err) {
		console.error('Error revoking invite:', err);
		error = 'Ошибка отзыва приглашения';
		notifications.error('Ошибка отзыва приглашения');
	} finally {
		isLoading = false;
	}
	}

	import { formatDateLong } from '$lib/utils/dates';
	
	function formatDate(dateString: string) {
		return formatDateLong(dateString);
	}
</script>

{#if isOpen}
	<!-- Overlay -->
	<div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
		<div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
			<!-- Header -->
			<div class="flex items-center justify-between p-6 border-b border-gray-200">
				<h2 class="text-2xl font-bold text-gray-900">Управление приглашениями</h2>
				<button 
					onclick={onClose}
					class="text-gray-400 hover:text-gray-600 transition-colors"
				>
					<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
					</svg>
				</button>
			</div>

			<!-- Tabs -->
			<div class="flex border-b border-gray-200">
				<button 
					onclick={() => activeTab = 'create'}
					class="flex-1 py-3 px-6 text-center font-medium transition-colors {activeTab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
				>
					Создать приглашение
				</button>
				<button 
					onclick={() => activeTab = 'manage'}
					class="flex-1 py-3 px-6 text-center font-medium transition-colors {activeTab === 'manage' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}"
				>
					Управление
				</button>
			</div>

			<!-- Content -->
			<div class="p-6 max-h-[60vh] overflow-y-auto">
				{#if activeTab === 'create'}
					<!-- Создание приглашения -->
					<div class="space-y-6">
						<div>
							<h3 class="text-lg font-semibold text-gray-900 mb-4">Создать новое приглашение</h3>
							<p class="text-gray-600 mb-6">
								Создайте ссылку для приглашения новых участников в комнату. 
								Ссылка будет действительна в течение 7 дней.
							</p>
							
							<button 
								onclick={createInvite}
								disabled={isLoading}
								class="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
							>
								{isLoading ? 'Создание...' : 'Создать приглашение'}
							</button>
						</div>

						{#if inviteLink}
							<div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
								<h4 class="font-medium text-gray-900 mb-2">Ссылка для приглашения</h4>
								<div class="flex items-center space-x-2 mb-2">
									<input 
										type="text" 
										value={inviteLink} 
										readonly
										class="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-white text-sm"
									/>
									<button 
										onclick={copyInviteLink}
										class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm"
									>
										Копировать
									</button>
								</div>
								<p class="text-sm text-gray-600">
									Истекает: {inviteExpiresAt}
								</p>
							</div>
						{/if}
					</div>

				{:else if activeTab === 'manage'}
					<!-- Управление приглашениями -->
					<div class="space-y-6">
						<!-- Ожидающие одобрения -->
						{#if pendingApprovals.length > 0}
							<div>
								<h3 class="text-lg font-semibold text-gray-900 mb-4">
									Заявки на вступление ({pendingApprovals.length})
								</h3>
								<div class="space-y-3">
									{#each pendingApprovals as invite}
										<div class="border border-gray-200 rounded-lg p-4">
											<div class="flex items-center justify-between">
												<div class="flex items-center space-x-3">
													{#if invite.inviter.avatarUrl}
														<img 
															src={invite.inviter.avatarUrl} 
															alt={invite.inviter.fullName}
															class="w-10 h-10 rounded-full"
														/>
													{:else}
														<div class="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
															{invite.inviter.fullName.charAt(0).toUpperCase()}
														</div>
													{/if}
													<div>
														<p class="font-medium text-gray-900">{invite.inviter.fullName}</p>
														<p class="text-sm text-gray-600">@{invite.inviter.username}</p>
														<p class="text-xs text-gray-500">{formatDate(invite.createdAt)}</p>
													</div>
												</div>
												<div class="flex space-x-2">
													<button 
														onclick={() => handleApproval(invite.id, 'approve')}
														disabled={isLoading}
														class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
													>
														Одобрить
													</button>
													<button 
														onclick={() => handleApproval(invite.id, 'reject')}
														disabled={isLoading}
														class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
													>
														Отклонить
													</button>
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Активные приглашения -->
						<div>
							<h3 class="text-lg font-semibold text-gray-900 mb-4">
								Активные приглашения ({invites.length})
							</h3>
							{#if invites.length === 0}
								<p class="text-gray-500 text-center py-8">Нет активных приглашений</p>
							{:else}
								<div class="space-y-3">
									{#each invites as invite}
										<div class="border border-gray-200 rounded-lg p-4">
											<div class="flex items-center justify-between">
												<div>
													<p class="font-medium text-gray-900">Приглашение #{invite.id.slice(-8)}</p>
													<p class="text-sm text-gray-600">
														Создано: {formatDate(invite.createdAt)}
													</p>
													<p class="text-sm text-gray-600">
														Истекает: {formatDate(invite.expiresAt)}
													</p>
												</div>
												<button 
													onclick={() => revokeInvite(invite.id)}
													disabled={isLoading}
													class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
												>
													Отозвать
												</button>
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Сообщения об ошибках и успехе -->
				{#if error}
					<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
						<p class="text-red-600 text-sm">{error}</p>
					</div>
				{/if}

				{#if successMessage}
					<div class="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
						<p class="text-green-600 text-sm">{successMessage}</p>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
