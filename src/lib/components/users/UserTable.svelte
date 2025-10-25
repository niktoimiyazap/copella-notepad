<script lang="ts">
	import type { User, UserRole, UserStatus } from '$lib/types/user';
	import UserAvatar from '$lib/components/UserAvatar.svelte';

	interface Props {
		users: User[];
		selectedUsers: Set<string>;
		onUserSelect: (userId: string, selected: boolean) => void;
		onSelectAll: (selected: boolean) => void;
		onUserRoleChange: (userId: string, newRole: UserRole) => void;
		onPermissionChange: (userId: string, permission: string, value: boolean) => void;
		onTransferOwnership?: (userId: string) => void; // Передать права владельца
		currentUserId?: string; // ID текущего пользователя для проверки прав
		ownerId?: string; // ID владельца комнаты
		currentUserRole?: UserRole; // Роль текущего пользователя
	}

	let { users, selectedUsers, onUserSelect, onSelectAll, onUserRoleChange, onPermissionChange, onTransferOwnership, currentUserId, ownerId, currentUserRole }: Props = $props();
	
	// Состояние для меню действий
	let openMenuUserId = $state<string | null>(null);
	
	// Функция для переключения меню
	function toggleMenu(userId: string) {
		openMenuUserId = openMenuUserId === userId ? null : userId;
	}
	
	// Закрыть меню при клике вне его
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.actions-menu-container')) {
			openMenuUserId = null;
		}
	}

	// Подписка на клики для закрытия меню
	$effect(() => {
		if (typeof window !== 'undefined') {
			window.addEventListener('click', handleClickOutside);
			return () => {
				window.removeEventListener('click', handleClickOutside);
			};
		}
	});
	
	// Проверка, является ли текущий пользователь владельцем
	const isCurrentUserOwner = $derived(currentUserId === ownerId);
	
	// Проверка, является ли текущий пользователь админом или владельцем
	const isCurrentUserAdmin = $derived(currentUserRole === 'admin' || isCurrentUserOwner);
	
	// Иерархия ролей (от высшей к низшей): owner > admin > moderator > user
	const roleHierarchy: Record<UserRole, number> = {
		'admin': 3, // admin и owner считаются одинаковыми по уровню
		'moderator': 2,
		'user': 1
	};
	
	// Проверка, может ли текущий пользователь редактировать права другого пользователя
	function canEditUser(userId: string): boolean {
		// Нельзя редактировать самого себя
		if (userId === currentUserId) {
			return false;
		}
		
		// Нельзя редактировать владельца (только owner может передавать права через спец. функцию)
		if (userId === ownerId) {
			return false;
		}
		
		// Owner и Admin могут редактировать пользователей
		if (!isCurrentUserAdmin) {
			return false;
		}
		
		// Находим целевого пользователя
		const targetUser = users.find(u => u.id === userId);
		if (!targetUser) return false;
		
		// Owner может редактировать всех (кроме себя и другого owner'а, что уже проверено выше)
		if (isCurrentUserOwner) {
			return true;
		}
		
		// Admin не может редактировать других admin'ов, только moderator'ов и обычных пользователей
		if (currentUserRole === 'admin') {
			return targetUser.role !== 'admin';
		}
		
		return false;
	}
	
	// Проверка, можно ли редактировать индивидуальные права пользователя
	function canEditIndividualPermissions(user: any): boolean {
		// Если вообще нельзя редактировать пользователя - возвращаем false
		if (!canEditUser(user.id)) {
			return false;
		}
		// Владелец может редактировать права любого пользователя (кроме себя и других владельцев)
		return true;
	}
	
	// Проверка, можно ли редактировать конкретное право для пользователя
	function canEditSpecificPermission(user: any, permission: string): boolean {
		if (!canEditIndividualPermissions(user)) {
			return false;
		}
		
		// Для модераторов владелец может редактировать все права кроме canManageUsers
		if (user.role === 'moderator') {
			// canManageUsers доступно только для admin/owner
			return permission !== 'canManageUsers';
		}
		
		// Для обычных пользователей можно редактировать только canEdit
		// canInvite и canDelete доступны только модераторам и выше
		if (user.role === 'user') {
			return permission === 'canEdit';
		}
		
		return false;
	}

	// Вычисляемые значения
	let allSelected = $derived(users.length > 0 && users.every(user => selectedUsers.has(user.id)));
	let someSelected = $derived(selectedUsers.size > 0 && !allSelected);

	// Функции
	function handleSelectAllChange() {
		if (allSelected) {
			// Снимаем выбор со всех видимых пользователей
			users.forEach(user => {
				if (selectedUsers.has(user.id)) {
					onUserSelect(user.id, false);
				}
			});
		} else {
			// Выбираем всех видимых пользователей
			users.forEach(user => {
				if (!selectedUsers.has(user.id)) {
					onUserSelect(user.id, true);
				}
			});
		}
	}

	function formatLastActive(date: Date): string {
		const now = new Date();
		const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
		
		if (diffInHours < 1) {
			return 'Сейчас';
		} else if (diffInHours < 24) {
			return `${diffInHours}ч`;
		} else {
			const diffInDays = Math.floor(diffInHours / 24);
			return `${diffInDays}д`;
		}
	}
</script>

<div class="user-table-container">
	<table class="user-table">
		<thead>
			<tr>
				<th class="checkbox-column">
					<input
						type="checkbox"
						checked={allSelected}
						indeterminate={someSelected}
						onchange={handleSelectAllChange}
						class="checkbox"
					/>
				</th>
				<th class="user-column">Пользователь</th>
				<th class="role-column">Роль</th>
				<th class="permissions-column">Права</th>
				<th class="last-active-column">Активность</th>
				<th class="actions-column">Действия</th>
			</tr>
		</thead>
		<tbody>
			{#each users as user (user.id)}
				<tr class="user-row" class:selected={selectedUsers.has(user.id)}>
					<td class="checkbox-column">
						<input
							type="checkbox"
							checked={selectedUsers.has(user.id)}
							onchange={(e) => onUserSelect(user.id, (e.target as HTMLInputElement).checked)}
							class="checkbox"
							disabled={user.id === ownerId}
							title={user.id === ownerId ? 'Нельзя выбрать владельца' : ''}
						/>
					</td>
					
					<td class="user-column">
						<div class="user-info">
							<UserAvatar 
								username={user.username || user.name || 'Unknown'} 
								avatarUrl={user.avatar} 
								size="small" 
							/>
							<div class="user-details">
								<span class="user-name">{user.username || user.name}</span>
								<span class="user-email">{user.email}</span>
							</div>
						</div>
					</td>
					
					<td class="role-column">
						<select
							class="select"
							value={user.role}
							onchange={(e) => onUserRoleChange(user.id, (e.target as HTMLSelectElement).value as UserRole)}
							disabled={!canEditUser(user.id)}
						>
							<option value="user">Пользователь</option>
							<option value="moderator">Модератор</option>
						</select>
					</td>
					
				<td class="permissions-column">
					<div class="permissions-grid">
						{#if user.role === 'moderator'}
							<!-- Для модераторов показываем все права и делаем их редактируемыми (кроме canManageUsers) -->
							<label class="permission-item" class:disabled={!canEditSpecificPermission(user, 'canEdit')}>
								<input
									type="checkbox"
									checked={user.permissions.canEdit}
									onchange={(e) => onPermissionChange(user.id, 'canEdit', (e.target as HTMLInputElement).checked)}
									class="permission-checkbox"
									disabled={!canEditSpecificPermission(user, 'canEdit')}
									title={!canEditSpecificPermission(user, 'canEdit') ? 'Нет прав для редактирования' : ''}
								/>
								<span class="permission-label">Редактирование</span>
							</label>
							<label class="permission-item" class:disabled={!canEditSpecificPermission(user, 'canInvite')}>
								<input
									type="checkbox"
									checked={user.permissions.canInvite}
									onchange={(e) => onPermissionChange(user.id, 'canInvite', (e.target as HTMLInputElement).checked)}
									class="permission-checkbox"
									disabled={!canEditSpecificPermission(user, 'canInvite')}
									title={!canEditSpecificPermission(user, 'canInvite') ? 'Нет прав для редактирования' : ''}
								/>
								<span class="permission-label">Приглашения</span>
							</label>
							<label class="permission-item" class:disabled={!canEditSpecificPermission(user, 'canDelete')}>
								<input
									type="checkbox"
									checked={user.permissions.canDelete}
									onchange={(e) => onPermissionChange(user.id, 'canDelete', (e.target as HTMLInputElement).checked)}
									class="permission-checkbox"
									disabled={!canEditSpecificPermission(user, 'canDelete')}
									title={!canEditSpecificPermission(user, 'canDelete') ? 'Нет прав для редактирования' : ''}
								/>
								<span class="permission-label">Удаление</span>
							</label>
							<label class="permission-item" class:disabled={true}>
								<input
									type="checkbox"
									checked={user.permissions.canManageUsers}
									class="permission-checkbox"
									disabled={true}
									title="Управление пользователями доступно только владельцу"
								/>
								<span class="permission-label">Управление</span>
							</label>
						{:else if user.role === 'admin'}
							<!-- Для админов (владельцев) все права disabled -->
							<label class="permission-item" class:disabled={true}>
								<input
									type="checkbox"
									checked={user.permissions.canEdit}
									class="permission-checkbox"
									disabled={true}
									title="Права владельца определяются автоматически"
								/>
								<span class="permission-label">Редактирование</span>
							</label>
							<label class="permission-item" class:disabled={true}>
								<input
									type="checkbox"
									checked={user.permissions.canInvite}
									class="permission-checkbox"
									disabled={true}
									title="Права владельца определяются автоматически"
								/>
								<span class="permission-label">Приглашения</span>
							</label>
							<label class="permission-item" class:disabled={true}>
								<input
									type="checkbox"
									checked={user.permissions.canDelete}
									class="permission-checkbox"
									disabled={true}
									title="Права владельца определяются автоматически"
								/>
								<span class="permission-label">Удаление</span>
							</label>
							<label class="permission-item" class:disabled={true}>
								<input
									type="checkbox"
									checked={user.permissions.canManageUsers}
									class="permission-checkbox"
									disabled={true}
									title="Права владельца определяются автоматически"
								/>
								<span class="permission-label">Управление</span>
							</label>
						{:else}
							<!-- Для обычных пользователей показываем только canEdit -->
							<label class="permission-item" class:disabled={!canEditSpecificPermission(user, 'canEdit')}>
								<input
									type="checkbox"
									checked={user.permissions.canEdit}
									onchange={(e) => onPermissionChange(user.id, 'canEdit', (e.target as HTMLInputElement).checked)}
									class="permission-checkbox"
									disabled={!canEditSpecificPermission(user, 'canEdit')}
									title={!canEditSpecificPermission(user, 'canEdit') ? 'Нет прав для редактирования' : ''}
								/>
								<span class="permission-label">Редактирование</span>
							</label>
						{/if}
					</div>
				</td>
					
					<td class="last-active-column">
						<span class="last-active">{formatLastActive(user.lastActive)}</span>
					</td>
					
					<!-- Колонка действий -->
					<td class="actions-column">
						{#if isCurrentUserOwner && user.id !== currentUserId && user.id !== ownerId}
							<div class="actions-menu-container">
								<button 
									class="actions-menu-button"
									onclick={(e) => {
										e.stopPropagation();
										toggleMenu(user.id);
									}}
									title="Действия"
								>
									<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
										<circle cx="8" cy="2" r="1.5"/>
										<circle cx="8" cy="8" r="1.5"/>
										<circle cx="8" cy="14" r="1.5"/>
									</svg>
								</button>
								
								{#if openMenuUserId === user.id}
									<div class="actions-menu-dropdown">
										<button 
											class="menu-item"
											onclick={(e) => {
												e.stopPropagation();
												if (onTransferOwnership) {
													onTransferOwnership(user.id);
												}
												openMenuUserId = null;
											}}
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
												<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
												<circle cx="8.5" cy="7" r="4"/>
												<polyline points="17 11 19 9 23 13 19 17 17 15"/>
											</svg>
											Передать права владельца
										</button>
									</div>
								{/if}
							</div>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.user-table-container {
		background: #ffffff;
		border: none;
		border-radius: 0;
		overflow: visible;
		width: 100%;
	}

	.user-table {
		width: 100%;
		border-collapse: collapse;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 12px;
	}

	.user-table th {
		background: #f8f9fa;
		padding: 8px 12px;
		text-align: left;
		font-weight: 500;
		color: #5f6368;
		border-bottom: 1px solid #dadce0;
		white-space: nowrap;
		font-size: 11px;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.user-table td {
		padding: 8px 12px;
		border-bottom: 1px solid #e8eaed;
		vertical-align: middle;
	}

	.user-row:hover {
		background: #f8f9fa;
	}

	.user-row.selected {
		background: #e8f0fe;
	}

	/* Колонки */
	.checkbox-column {
		width: 24px;
		text-align: center;
	}

	.user-column {
		min-width: 200px;
	}

	.role-column {
		width: 120px;
	}

	.permissions-column {
		min-width: 200px;
	}

	.last-active-column {
		width: 80px;
	}

	/* Чекбоксы */
	.checkbox {
		width: 16px;
		height: 16px;
		cursor: pointer;
		accent-color: #1a73e8;
	}

	/* Информация о пользователе */
	.user-info {
		display: flex;
		align-items: center;
		gap: 4px;
	}


	.user-details {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.user-name {
		font-weight: 500;
		color: #202124;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-size: 13px;
	}

	.user-email {
		font-weight: 400;
		font-size: 11px;
		color: #5f6368;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	/* Селекты */
	.select {
		width: 100%;
		padding: 6px 8px;
		border: 1px solid #dadce0;
		border-radius: 4px;
		background: #ffffff;
		font-size: 12px;
		color: #202124;
		cursor: pointer;
		font-family: inherit;
		transition: border-color 0.2s ease;
	}

	.select:focus {
		outline: none;
		border-color: #1a73e8;
		box-shadow: 0 0 0 1px rgba(26, 115, 232, 0.2);
	}

	.select:hover {
		border-color: #1a73e8;
	}
	
	.select:disabled {
		background: #f8f9fa;
		color: #9aa0a6;
		cursor: not-allowed;
		opacity: 0.6;
	}

	/* Права доступа */
	.permissions-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 4px;
	}

	.permission-item {
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
		padding: 4px 6px;
		border-radius: 4px;
		transition: background-color 0.2s ease;
		border: 1px solid transparent;
	}

	.permission-item:hover {
		background: #f8f9fa;
		border-color: #dadce0;
	}
	
	.permission-item.disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.permission-item.disabled:hover {
		background: transparent;
		border-color: transparent;
	}

	.permission-checkbox {
		width: 14px;
		height: 14px;
		accent-color: #1a73e8;
		margin: 0;
	}

	.permission-checkbox:disabled {
		accent-color: #9aa0a6;
		cursor: not-allowed;
	}

	.permission-label {
		font-size: 11px;
		color: #202124;
		font-weight: 400;
		white-space: nowrap;
	}
	
	.permission-item.disabled .permission-label {
		color: #9aa0a6;
	}

	/* Последняя активность */
	.last-active {
		font-size: 11px;
		color: #5f6368;
	}

	/* Адаптация под мобильные устройства - горизонтальная прокрутка */
	@media (max-width: 1024px) {
		.user-table-container {
			overflow-x: auto;
			-webkit-overflow-scrolling: touch;
		}

		.user-table {
			min-width: 800px;
		}
	}

	/* Стили для колонки действий */
	.actions-column {
		padding: 12px 16px;
		text-align: center;
		width: 80px;
	}

	.actions-menu-container {
		position: relative;
		display: inline-block;
	}

	.actions-menu-button {
		background: transparent;
		border: none;
		padding: 6px;
		cursor: pointer;
		color: #5f6368;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}

	.actions-menu-button:hover {
		background: #f1f3f4;
		color: #202124;
	}

	.actions-menu-dropdown {
		position: absolute;
		top: 100%;
		right: 0;
		margin-top: 4px;
		background: #ffffff;
		border: 1px solid #dadce0;
		border-radius: 8px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
		min-width: 220px;
		z-index: 1000;
		overflow: hidden;
	}

	.menu-item {
		width: 100%;
		padding: 12px 16px;
		border: none;
		background: transparent;
		text-align: left;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 14px;
		color: #202124;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 12px;
		transition: background-color 0.2s ease;
	}

	.menu-item:hover {
		background: #f1f3f4;
	}

	.menu-item svg {
		flex-shrink: 0;
		color: #5f6368;
	}
</style>