<script lang="ts">
	import type { UserRole } from '$lib/types/user';
	import { X, Users, ChevronDown, Trash2 } from '@lucide/svelte';

	interface Props {
		selectedCount: number;
		onBulkRoleChange: (role: UserRole) => void;
		onBulkRemove: () => void;
		onClearSelection: () => void;
		isOwner?: boolean; // Только владелец может изменять роли и удалять
	}

	let { 
		selectedCount, 
		onBulkRoleChange, 
		onBulkRemove, 
		onClearSelection,
		isOwner = false
	}: Props = $props();

	let showRoleDropdown = $state(false);
	let showConfirmRemove = $state(false);

	const roleOptions = [
		{ value: 'user', label: 'Пользователь' },
		{ value: 'moderator', label: 'Модератор' }
	];

	function handleRoleSelect(role: UserRole) {
		onBulkRoleChange(role);
		showRoleDropdown = false;
	}

	function handleRemoveConfirm() {
		onBulkRemove();
		showConfirmRemove = false;
	}

	function handleRemoveCancel() {
		showConfirmRemove = false;
	}

	function toggleRoleDropdown() {
		showRoleDropdown = !showRoleDropdown;
	}

	// Закрываем dropdown при клике вне его
	function handleClickOutside(event: MouseEvent) {
		const target = event.target as HTMLElement;
		if (!target.closest('.role-dropdown')) {
			showRoleDropdown = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

{#if selectedCount > 0}
	<div class="bulk-actions-container">
		<div class="bulk-actions-info">
			<span class="selected-count">Выбрано: {selectedCount}</span>
			<button class="clear-selection-btn" onclick={onClearSelection}>
				<X size={14} />
			</button>
		</div>

		<div class="bulk-actions-buttons">
			{#if isOwner}
			<div class="role-dropdown">
				<button 
					class="bulk-action-btn role-btn"
					onclick={toggleRoleDropdown}
					class:active={showRoleDropdown}
				>
					<Users size={16} />
					Изменить роль
					<ChevronDown size={12} class="dropdown-arrow" />
				</button>

				{#if showRoleDropdown}
					<div class="role-dropdown-menu">
						{#each roleOptions as option}
							<button 
								class="role-option"
								onclick={() => handleRoleSelect(option.value as UserRole)}
							>
								{option.label}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<button 
				class="bulk-action-btn remove-btn"
				onclick={() => showConfirmRemove = true}
			>
				<Trash2 size={16} />
				Удалить
			</button>
			{:else}
			<div class="no-permission-message">
				<span>У вас нет прав для управления пользователями</span>
			</div>
			{/if}
		</div>
	</div>

	<!-- Модальное окно подтверждения удаления -->
	{#if showConfirmRemove}
		<div class="modal-overlay" onclick={handleRemoveCancel}>
			<div class="modal-content" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h3>Подтверждение удаления</h3>
				</div>
				<div class="modal-body">
					<p>Вы уверены, что хотите удалить {selectedCount} пользователей из комнаты?</p>
					<p class="warning-text">Это действие нельзя отменить.</p>
				</div>
				<div class="modal-footer">
					<button class="btn btn--secondary" onclick={handleRemoveCancel}>
						Отмена
					</button>
					<button class="btn btn--danger" onclick={handleRemoveConfirm}>
						Удалить
					</button>
				</div>
			</div>
		</div>
	{/if}
{/if}

<style>
	.bulk-actions-container {
		background: #e8f0fe;
		border: 1px solid #1a73e8;
		border-radius: 8px;
		padding: 12px 16px;
		margin-bottom: 16px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
	}

	.bulk-actions-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.selected-count {
		font-size: 14px;
		font-weight: 500;
		color: #1a73e8;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.clear-selection-btn {
		background: none;
		border: none;
		color: #1a73e8;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s ease;
	}

	.clear-selection-btn:hover {
		background: rgba(26, 115, 232, 0.1);
	}

	.bulk-actions-buttons {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.bulk-action-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 8px 12px;
		border: 1px solid #1a73e8;
		border-radius: 4px;
		background: #ffffff;
		color: #1a73e8;
		font-size: 13px;
		font-weight: 500;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}

	.bulk-action-btn:hover {
		background: #1a73e8;
		color: #ffffff;
	}

	.bulk-action-btn.active {
		background: #1a73e8;
		color: #ffffff;
	}

	.role-dropdown {
		position: relative;
	}

	.role-btn {
		position: relative;
	}

	.role-btn :global(.dropdown-arrow) {
		transition: transform 0.2s ease;
	}

	.role-btn.active :global(.dropdown-arrow) {
		transform: rotate(180deg);
	}

	.role-dropdown-menu {
		position: absolute;
		top: 100%;
		left: 0;
		right: 0;
		background: #ffffff;
		border: 1px solid #dadce0;
		border-radius: 4px;
		box-shadow: 0 4px 12px rgba(60, 64, 67, 0.3);
		z-index: 1000;
		overflow: hidden;
		margin-top: 4px;
	}

	.role-option {
		width: 100%;
		padding: 8px 12px;
		background: none;
		border: none;
		text-align: left;
		font-size: 13px;
		color: #202124;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.role-option:hover {
		background: #f8f9fa;
	}

	.role-option:not(:last-child) {
		border-bottom: 1px solid #e8eaed;
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
	
	.no-permission-message {
		padding: 8px 12px;
		background: #f8f9fa;
		border: 1px solid #dadce0;
		border-radius: 4px;
		color: #5f6368;
		font-size: 13px;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.bulk-actions-container {
			flex-direction: column;
			align-items: stretch;
			gap: 12px;
		}

		.bulk-actions-buttons {
			justify-content: center;
			flex-wrap: wrap;
		}

		.bulk-action-btn {
			flex: 1;
			min-width: 120px;
			justify-content: center;
		}
	}
</style>
