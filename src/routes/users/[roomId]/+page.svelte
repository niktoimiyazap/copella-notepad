<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import UserTable from '$lib/components/users/UserTable.svelte';
	import UserFilters from '$lib/components/users/UserFilters.svelte';
	import BulkActions from '$lib/components/users/BulkActions.svelte';
	import UserAnalytics from '$lib/components/users/UserAnalytics.svelte';
	import PendingApprovals from '$lib/components/PendingApprovals.svelte';
	import type { User, UserRole } from '$lib/types/user';
	import { getRoomParticipants, updateParticipantRole, updateParticipantPermissions, removeRoomParticipant } from '$lib/permissions';
	import { currentUser, userActions } from '$lib/stores/user';
	import { fetchCurrentUser } from '$lib/api/userApi';
	import { getRoom } from '$lib/rooms';

	// Получаем ID комнаты из параметров маршрута
	const roomId = $derived($page.params.roomId);

	// Состояние пользователей
	let users = $state<User[]>([]);
	let filteredUsers = $state<User[]>([]);
	let isLoading = $state(true);
	let selectedUsers = $state<Set<string>>(new Set());
	let error = $state<string>('');
	let roomTitle = $state<string>('Загрузка...');
	let requireApproval = $state<boolean>(false);
	let isPublic = $state<boolean>(true);
	let ownerId = $state<string | undefined>(undefined); // ID владельца комнаты
	let currentUserRole = $state<UserRole | undefined>(undefined); // Роль текущего пользователя

	// Состояние фильтров
	let searchQuery = $state('');
	let selectedRole = $state('');
	let selectedActivity = $state('');

	// Инициализация данных
	onMount(async () => {
		try {
			// Получаем текущего пользователя из централизованного store
			if (!$currentUser) {
				const { user, error: userError } = await fetchCurrentUser();
				if (userError || !user) {
					error = 'Необходима авторизация для доступа к управлению пользователями';
					isLoading = false;
					// Редирект на страницу логина
					setTimeout(() => goto('/auth/login'), 2000);
					return;
				}
			}

		// Загружаем информацию о комнате
		const { room, error: roomError } = await getRoom(roomId);
		if (roomError) {
			error = roomError;
			isLoading = false;
			return;
		}
		
		// Проверяем, является ли комната приватной
		isPublic = room.isPublic;
		if (!isPublic) {
			// Для приватных комнат управление пользователями недоступно
			// Редиректим обратно в комнату
			goto(`/room/${roomId}`);
			return;
		}
		
		roomTitle = room.title;
		requireApproval = room.requireApproval || false;
		ownerId = room.createdBy; // Сохраняем ID владельца
		
		// Проверяем права доступа текущего пользователя к управлению комнатой
		const currentUserId = $currentUser?.id;
		if (currentUserId) {
			// Получаем информацию об участнике для проверки роли
			const { participants: currentUserParticipants } = await getRoomParticipants(roomId);
			const currentUserParticipant = currentUserParticipants.find(p => p.userId === currentUserId);
			
			// Определяем роль текущего пользователя
			currentUserRole = mapParticipantRoleToUserRole(currentUserParticipant?.role || 'user');
			
			// Проверяем, является ли пользователь owner или admin
			// Только owner и admin имеют доступ к управлению пользователями
			const isOwnerOrAdmin = currentUserId === ownerId || 
			                       currentUserParticipant?.role === 'owner' || 
			                       currentUserParticipant?.role === 'admin';
			
			if (!isOwnerOrAdmin) {
				error = 'У вас нет прав для управления пользователями этой комнаты';
				isLoading = false;
				// Редирект обратно в комнату через 2 секунды
				setTimeout(() => goto(`/room/${roomId}`), 2000);
				return;
			}
		}

			// Загружаем участников комнаты
			const { participants, error: participantsError } = await getRoomParticipants(roomId);
			if (participantsError) {
				error = participantsError;
				isLoading = false;
				return;
			}

			// Преобразуем участников в формат User
			users = participants.map(participant => ({
				id: participant.userId,
				username: participant.user?.username || 'Unknown',
				name: participant.user?.username || 'Unknown', // Для обратной совместимости
				email: participant.user?.email || '',
				role: mapParticipantRoleToUserRole(participant.role),
				status: 'active', // Убираем статус, оставляем только active
				lastActive: participant.lastSeenAt ? new Date(participant.lastSeenAt) : new Date(),
				avatar: participant.user?.avatarUrl || null,
				permissions: mapParticipantToPermissions(participant)
			}));

			// Инициализируем отфильтрованный список
			applyFilters();

			isLoading = false;
		} catch (err) {
			console.error('Error loading users:', err);
			error = 'Ошибка загрузки пользователей';
			isLoading = false;
		}
	});

	// Функция для преобразования роли участника в роль пользователя
	function mapParticipantRoleToUserRole(participantRole: string): UserRole {
		switch (participantRole) {
			case 'creator':
			case 'owner':
			case 'admin':
				return 'admin'; // admin = создатель в UI
			case 'moderator':
				return 'moderator';
			default:
				return 'user';
		}
	}

	// Функция для преобразования участника в права доступа
	function mapParticipantToPermissions(participant: any) {
		// Для admin/owner используем предустановленные права (владелец комнаты)
		switch (participant.role) {
			case 'creator':
			case 'owner':
			case 'admin':
				return {
						canEdit: true,
						canInvite: true,
						canDelete: true,
						canManageUsers: true
				};
			case 'moderator':
				// Модератор имеет все права кроме управления пользователями
				return {
						canEdit: true,
						canInvite: true,
						canDelete: true,
						canManageUsers: false
				};
		default:
			// Для обычных пользователей только право на редактирование или ничего
			return {
					canEdit: participant.canEdit === true,
					canInvite: false,
					canDelete: false,
					canManageUsers: false
			};
				}
			}

	// Функции управления пользователями
	function handleUserSelect(userId: string, selected: boolean) {
		if (selected) {
			selectedUsers.add(userId);
		} else {
			selectedUsers.delete(userId);
		}
		selectedUsers = new Set(selectedUsers);
	}

	function handleSelectAll(selected: boolean) {
		if (selected) {
			// Добавляем всех отфильтрованных пользователей
			filteredUsers.forEach(user => {
				selectedUsers.add(user.id);
			});
		} else {
			// Удаляем всех отфильтрованных пользователей из выбора
			filteredUsers.forEach(user => {
				selectedUsers.delete(user.id);
			});
		}
		selectedUsers = new Set(selectedUsers);
	}

	async function handleUserRoleChange(userId: string, newRole: UserRole) {
		// Преобразуем роль пользователя в роль участника
		const participantRole = mapUserRoleToParticipantRole(newRole);

		// Обновляем роль на сервере
		const { success, error: updateError } = await updateParticipantRole(roomId, userId, participantRole);
		
		if (!success) {
			error = updateError || 'Ошибка обновления роли';
			return;
		}

		// Обновляем локальное состояние
		const userIndex = users.findIndex(user => user.id === userId);
		if (userIndex !== -1) {
			users[userIndex].role = newRole;
			// Для модераторов НЕ меняем права автоматически - они остаются редактируемыми
			// Только для админов устанавливаем все права, для обычных пользователей - базовые
			if (newRole !== 'moderator') {
				updateUserPermissions(userIndex, newRole);
			}
		}
	}

	// Функция для преобразования роли пользователя в роль участника
	function mapUserRoleToParticipantRole(userRole: UserRole): string {
		switch (userRole) {
			case 'admin':
				return 'admin';
			case 'moderator':
				return 'moderator';
			default:
				return 'user';
		}
	}

	function updateUserPermissions(userIndex: number, role: UserRole) {
		const user = users[userIndex];
		switch (role) {
			case 'admin':
				// Владелец комнаты - все права
				user.permissions = {
					canEdit: true,
					canInvite: true,
					canDelete: true,
					canManageUsers: true
				};
				break;
			case 'moderator':
				// Модератор - все права кроме управления пользователями
				user.permissions = {
					canEdit: true,
					canInvite: true,
					canDelete: true,
					canManageUsers: false
				};
				break;
			case 'user':
				// Обычный пользователь - по умолчанию только редактирование
				user.permissions = {
					canEdit: true,
					canInvite: false,
					canDelete: false,
					canManageUsers: false
				};
				break;
		}
		users = [...users];
	}


	async function handlePermissionChange(userId: string, permission: string, value: boolean) {
		const userIndex = users.findIndex(user => user.id === userId);
		if (userIndex === -1) return;

		// Создаем копию прав с обновленным значением
		const updatedPermissions = {
			...users[userIndex].permissions,
			[permission]: value
		};

		// Обновляем права на сервере
		const { success, error: updateError } = await updateParticipantPermissions(roomId, userId, updatedPermissions);
		
		if (!success) {
			error = updateError || 'Ошибка обновления прав';
			return;
		}

		// Обновляем локальное состояние
		users[userIndex].permissions = updatedPermissions;
		
		// НЕ меняем роль при изменении прав - роль задаётся отдельно
		// Это позволяет модераторам иметь индивидуальные права (как в Telegram)
		
		users = [...users];
	}

	// Состояние для модалки передачи прав
	let showTransferOwnershipModal = $state(false);
	let selectedNewOwnerId = $state<string | null>(null);
	let selectedNewOwnerName = $state<string>('');

	// Функция для передачи прав владельца
	function handleTransferOwnership(newOwnerId: string) {
		const user = users.find(u => u.id === newOwnerId);
		if (user) {
			selectedNewOwnerId = newOwnerId;
			selectedNewOwnerName = user.username || user.name;
			showTransferOwnershipModal = true;
		}
	}

	// Подтверждение передачи прав
	async function confirmTransferOwnership() {
		if (!selectedNewOwnerId) return;

		try {
			// Получаем токен из localStorage
			const token = typeof window !== 'undefined' ? localStorage.getItem('session_token') : null;
			
			const headers: Record<string, string> = {
				'Content-Type': 'application/json'
			};
			
			// Добавляем токен если он есть
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
			
			const response = await fetch(`/api/rooms/${roomId}/transfer-ownership`, {
				method: 'POST',
				headers,
				body: JSON.stringify({ newOwnerId: selectedNewOwnerId }),
				credentials: 'include'
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Ошибка передачи прав';
				showTransferOwnershipModal = false;
				return;
			}

			// Закрываем модальное окно
			showTransferOwnershipModal = false;
			
			// Обновляем владельца комнаты
			ownerId = selectedNewOwnerId;
			
			// Перезагружаем список участников для обновления ролей
			const { participants, error: participantsError } = await getRoomParticipants(roomId);
			if (!participantsError && participants) {
				// Обновляем пользователей с новыми ролями
				users = participants.map(participant => ({
					id: participant.userId,
					username: participant.user?.username || 'Unknown',
					name: participant.user?.username || 'Unknown',
					email: participant.user?.email || '',
					role: mapParticipantRoleToUserRole(participant.role),
					status: 'active',
					lastActive: participant.lastSeenAt ? new Date(participant.lastSeenAt) : new Date(),
					avatar: participant.user?.avatarUrl || null,
					permissions: mapParticipantToPermissions(participant)
				}));
				
				// Применяем текущие фильтры
				applyFilters();
				
				// Обновляем роль текущего пользователя
				const currentUserId = $currentUser?.id;
				if (currentUserId) {
					const currentUserParticipant = participants.find(p => p.userId === currentUserId);
					if (currentUserParticipant) {
						currentUserRole = mapParticipantRoleToUserRole(currentUserParticipant.role);
					}
				}
			}
			
			// Проверяем, потерял ли текущий пользователь права на управление
			const currentUserId = $currentUser?.id;
			if (currentUserId && currentUserId !== selectedNewOwnerId) {
				const currentUserParticipant = participants?.find(p => p.userId === currentUserId);
				const stillHasAccess = currentUserId === ownerId || 
				                       currentUserParticipant?.role === 'owner' || 
				                       currentUserParticipant?.role === 'admin';
				
				if (!stillHasAccess) {
					// Пользователь больше не имеет прав - редирект в комнату
					error = 'Вы больше не являетесь владельцем комнаты';
					setTimeout(() => goto(`/room/${roomId}`), 2000);
					return;
				}
			}
			
			// Показываем сообщение об успехе
			error = ''; // Очищаем ошибки
			// Можно добавить success message, если хотите

		} catch (err) {
			console.error('Error transferring ownership:', err);
			error = 'Ошибка передачи прав владельца';
			showTransferOwnershipModal = false;
		}
	}

	// Отмена передачи прав
	function cancelTransferOwnership() {
		showTransferOwnershipModal = false;
		selectedNewOwnerId = null;
		selectedNewOwnerName = '';
	}

	// Функция для преобразования прав в роль пользователя
	function mapPermissionsToUserRole(permissions: any): UserRole {
		// Если включено право управления - это всегда админ
		if (permissions.canManageUsers) {
			return 'admin';
		} 
		// Если есть права на редактирование и приглашения (без управления) - модератор
		else if (permissions.canEdit && permissions.canInvite) {
			return 'moderator';
		}
		// Если есть хотя бы какие-то права - обычный пользователь
		else if (permissions.canEdit || permissions.canInvite || permissions.canDelete) {
			return 'user';
		}
		// Если все права выключены - участник
		else {
			return 'user'; // или 'participant', в зависимости от вашей логики
		}
	}

	// Функции фильтрации
	function applyFilters() {
		let filtered = [...users];

		// Поиск по имени или email
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase().trim();
			filtered = filtered.filter(user => 
				(user.username || user.name || '').toLowerCase().includes(query) ||
				(user.email || '').toLowerCase().includes(query)
			);
		}

		// Фильтр по роли
		if (selectedRole) {
			filtered = filtered.filter(user => user.role === selectedRole);
		}

		// Фильтр по активности
		if (selectedActivity) {
			const now = new Date();
			filtered = filtered.filter(user => {
				const lastActive = new Date(user.lastActive);
				const diffInMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60);
				const diffInHours = diffInMinutes / 60;
				const diffInDays = diffInHours / 24;

				switch (selectedActivity) {
					case 'online':
						return diffInMinutes <= 5; // Онлайн (активен в последние 5 минут)
					case 'recent':
						return diffInHours <= 24; // Недавно активные (в последние 24 часа)
					case 'inactive':
						return diffInDays > 7; // Неактивные (более 7 дней)
					default:
						return true;
				}
			});
		}

		filteredUsers = filtered;
	}

	// Обработчики фильтров
	function handleSearchChange(query: string) {
		searchQuery = query;
		applyFilters();
	}

	function handleRoleFilterChange(role: string) {
		selectedRole = role;
		applyFilters();
	}

	function handleActivityFilterChange(activity: string) {
		selectedActivity = activity;
		applyFilters();
	}

	function handleClearFilters() {
		searchQuery = '';
		selectedRole = '';
		selectedActivity = '';
		applyFilters();
	}

	// Функции массовых операций
	async function handleBulkRoleChange(role: UserRole) {
		const selectedUserIds = Array.from(selectedUsers);
		const participantRole = mapUserRoleToParticipantRole(role);

		for (const userId of selectedUserIds) {
			const { success, error: updateError } = await updateParticipantRole(roomId, userId, participantRole);
			if (!success) {
				console.error(`Error updating role for user ${userId}:`, updateError);
			}
		}

		// Обновляем локальное состояние
		users = users.map(user => {
			if (selectedUsers.has(user.id)) {
				user.role = role;
				updateUserPermissions(users.indexOf(user), role);
			}
			return user;
		});

		applyFilters();
		selectedUsers = new Set();
	}

	async function handleBulkRemove() {
		const selectedUserIds = Array.from(selectedUsers);
		
		if (selectedUserIds.length === 0) return;
		
		// Проверяем, что владелец не выбран
		if (ownerId && selectedUserIds.includes(ownerId)) {
			error = 'Невозможно удалить владельца комнаты';
			return;
		}
		
		// Только владелец может удалять пользователей
		if ($currentUser?.id !== ownerId) {
			error = 'У вас нет прав для удаления пользователей';
			return;
		}
		
		let successCount = 0;
		let errorCount = 0;
		
		// Удаляем каждого пользователя
		for (const userId of selectedUserIds) {
			// Дополнительная проверка - нельзя удалить владельца
			if (userId === ownerId) {
				errorCount++;
				console.error(`Cannot remove owner: ${userId}`);
				continue;
			}
			
			const { success, error: removeError } = await removeRoomParticipant(roomId, userId);
			
			if (success) {
				successCount++;
				// Удаляем пользователя из локального списка
				users = users.filter(user => user.id !== userId);
			} else {
				errorCount++;
				console.error(`Error removing user ${userId}:`, removeError);
			}
		}
		
		// Обновляем отфильтрованный список
		applyFilters();
		
		// Очищаем выбор
		selectedUsers = new Set();
		
		// Показываем результат
		if (successCount > 0) {
			console.log(`Успешно удалено пользователей: ${successCount}`);
		}
		if (errorCount > 0) {
			error = `Не удалось удалить ${errorCount} пользователей`;
		}
	}

	function handleClearSelection() {
		selectedUsers = new Set();
	}
</script>

<svelte:head>
	<title>Пользователи - {roomTitle} - Copella Notepad</title>
</svelte:head>

<div class="admin-wrapper">
	<div class="admin-header">
		<h1>Пользователи</h1>
	</div>
	
	<div class="admin-content">
		{#if isLoading}
			<div class="loading-state">
				<div class="loading-spinner"></div>
				<p>Загрузка пользователей...</p>
			</div>
		{:else if error}
			<div class="error-state">
				<p class="error-message">{error}</p>
				<button class="btn btn--primary" onclick={() => window.location.reload()}>
					Попробовать снова
				</button>
			</div>
		{:else if users.length === 0}
			<div class="empty-state">
				<p>В этой комнате пока нет участников</p>
			</div>
		{:else}
			<!-- Статистика и аналитика -->
			<UserAnalytics {users} />

			<!-- Заявки на одобрение (если включено requireApproval) -->
			{#if requireApproval}
				<div class="approvals-section">
					<PendingApprovals roomId={roomId} isOwner={$currentUser?.id === ownerId} />
				</div>
			{/if}

			<!-- Фильтры -->
			<UserFilters
				{searchQuery}
				{selectedRole}
				{selectedActivity}
				onSearchChange={handleSearchChange}
				onRoleFilterChange={handleRoleFilterChange}
				onActivityFilterChange={handleActivityFilterChange}
				onClearFilters={handleClearFilters}
			/>

			<!-- Массовые операции -->
			<BulkActions
				selectedCount={selectedUsers.size}
				onBulkRoleChange={handleBulkRoleChange}
				onBulkRemove={handleBulkRemove}
				onClearSelection={handleClearSelection}
				isOwner={$currentUser?.id === ownerId}
			/>

			<!-- Таблица пользователей -->
			<div class="table-wrapper">
				<UserTable
					users={filteredUsers}
					{selectedUsers}
					onUserSelect={handleUserSelect}
					onSelectAll={handleSelectAll}
					onUserRoleChange={handleUserRoleChange}
					onPermissionChange={handlePermissionChange}
					onTransferOwnership={handleTransferOwnership}
					currentUserId={$currentUser?.id}
					{ownerId}
					{currentUserRole}
				/>
			</div>

			<!-- Информация о результатах фильтрации -->
			{#if filteredUsers.length !== users.length}
				<div class="filter-results-info">
					<p>Показано {filteredUsers.length} из {users.length} пользователей</p>
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Модальное окно подтверждения передачи прав владельца -->
{#if showTransferOwnershipModal}
	<div 
		class="modal-overlay" 
		role="button" 
		tabindex="0"
		onclick={cancelTransferOwnership}
		onkeydown={(e) => e.key === 'Escape' && cancelTransferOwnership()}
	>
		<div 
			class="modal-content" 
			role="dialog"
			tabindex="-1"
			aria-labelledby="transfer-modal-title"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<div class="modal-header">
				<h3 id="transfer-modal-title">Подтверждение передачи прав</h3>
			</div>
			<div class="modal-body">
				<p>Вы уверены, что хотите передать права владельца пользователю <strong>{selectedNewOwnerName}</strong>?</p>
				<p class="warning-text">После этого вы станете администратором с ограниченными правами. Это действие нельзя отменить.</p>
			</div>
			<div class="modal-footer">
				<button class="btn btn--secondary" onclick={cancelTransferOwnership}>
					Отмена
				</button>
				<button class="btn btn--danger" onclick={confirmTransferOwnership}>
					Передать права
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.admin-wrapper {
		width: 100%;
		background: #ffffff;
	}


	.admin-header {
		margin-bottom: 8px;
		padding: 12px 16px;
		background: #ffffff;
		border: 1px solid #dadce0;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
	}

	.admin-header h1 {
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
		font-size: 22px;
		color: #202124;
		margin: 0;
		line-height: 1.2;
		letter-spacing: 0;
	}

	.admin-content {
		background: #ffffff;
	}

	.table-wrapper {
		background: #ffffff;
		border: 1px solid #dadce0;
		border-radius: 8px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
		gap: 8px;
	}

	.loading-spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #e1e5e9;
		border-top: 2px solid #FEB1FF;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.loading-state p {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
		font-size: 12px;
		color: #6b7280;
		margin: 0;
	}

	.error-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
		gap: 16px;
	}

	.error-message {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #dc2626;
		margin: 0;
		text-align: center;
	}

	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
		gap: 8px;
	}

	.empty-state p {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #6b7280;
		margin: 0;
		text-align: center;
	}

	/* Стили для секции заявок */
	.approvals-section {
		margin-bottom: 16px;
	}

	.filter-results-info {
		background: #f8f9fa;
		border: 1px solid #dadce0;
		border-radius: 8px;
		padding: 12px 16px;
		margin-top: 16px;
		text-align: center;
	}

	.filter-results-info p {
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 400;
		font-size: 13px;
		color: #5f6368;
		margin: 0;
	}

	/* Модальное окно */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		overflow-y: auto;
		padding: 20px;
	}

	.modal-content {
		background: #ffffff;
		border-radius: 8px;
		box-shadow: 0 8px 32px rgba(60, 64, 67, 0.3);
		max-width: 400px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-header {
		padding: 20px 24px 0;
	}

	.modal-header h3 {
		font-size: 18px;
		font-weight: 500;
		color: #202124;
		margin: 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.modal-body {
		padding: 16px 24px;
	}

	.modal-body p {
		font-size: 14px;
		color: #5f6368;
		margin: 0 0 8px 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		line-height: 1.4;
	}

	.modal-body p strong {
		color: #202124;
		font-weight: 500;
	}

	.warning-text {
		color: #d93025 !important;
		font-weight: 500;
	}

	.modal-footer {
		padding: 0 24px 20px;
		display: flex;
		gap: 12px;
		justify-content: flex-end;
	}

	.btn {
		padding: 8px 16px;
		border-radius: 4px;
		font-size: 14px;
		font-weight: 500;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		cursor: pointer;
		transition: all 0.2s ease;
		border: 1px solid transparent;
	}

	.btn--secondary {
		background: #ffffff;
		border-color: #dadce0;
		color: #5f6368;
	}

	.btn--secondary:hover {
		background: #f8f9fa;
		border-color: #1a73e8;
		color: #1a73e8;
	}

	.btn--danger {
		background: #d93025;
		color: #ffffff;
	}

	.btn--danger:hover {
		background: #b52d20;
	}
</style>