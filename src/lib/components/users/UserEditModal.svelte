<script lang="ts">
	import Modal from '../ui/modals/Modal.svelte';
	import type { ModalProps } from '../ui/modals/types';
	import type { User, UserRole, UserStatus } from '$lib/types/user';
	import { validateUser, ROLE_LABELS, STATUS_LABELS } from '$lib/utils/userManagement';

	interface UserEditModalProps extends ModalProps {
		user?: User | null;
		mode: 'create' | 'edit';
	}

	let { isOpen, onClose, user = null, mode }: UserEditModalProps = $props();

	// Состояние формы
	let formData = $state({
		name: '',
		email: '',
		role: 'user' as UserRole,
		status: 'pending' as UserStatus,
		permissions: {
			canEdit: false,
			canInvite: false,
			canDelete: false,
			canManageUsers: false
		}
	});

	let errors = $state<string[]>([]);
	let isSubmitting = $state(false);

	// Инициализация формы
	$effect(() => {
		if (isOpen) {
			if (mode === 'edit' && user) {
				formData = {
					name: user.name,
					email: user.email,
					role: user.role,
					status: user.status,
					permissions: { ...user.permissions }
				};
			} else {
				// Сброс формы для создания
				formData = {
					name: '',
					email: '',
					role: 'user',
					status: 'pending',
					permissions: {
						canEdit: false,
						canInvite: false,
						canDelete: false,
						canManageUsers: false
					}
				};
			}
			errors = [];
		}
	});

	// Обновление прав при изменении роли
	$effect(() => {
		const rolePermissions = {
			admin: {
				canEdit: true,
				canInvite: true,
				canDelete: true,
				canManageUsers: true
			},
			moderator: {
				canEdit: true,
				canInvite: true,
				canDelete: true,
				canManageUsers: false
			},
			user: {
				canEdit: true,
				canInvite: false,
				canDelete: false,
				canManageUsers: false
			}
		};

		formData.permissions = { ...rolePermissions[formData.role] };
	});

	function handleSubmit() {
		errors = [];
		isSubmitting = true;

		// Валидация
		const validation = validateUser(formData);
		if (!validation.isValid) {
			errors = validation.errors;
			isSubmitting = false;
			return;
		}

		// Имитация отправки данных
		setTimeout(() => {
			console.log('Сохранение пользователя:', formData);
			isSubmitting = false;
			onClose();
		}, 1000);
	}

	function handleClose() {
		if (!isSubmitting) {
			onClose();
		}
	}

	const modalTitle = mode === 'create' ? 'Добавить пользователя' : 'Редактировать пользователя';
</script>

<Modal {isOpen} onClose={handleClose} title={modalTitle} className="user-edit-modal">
	<div class="user-edit-content">
		{#if errors.length > 0}
			<div class="error-messages">
				{#each errors as error}
					<div class="error-message">{error}</div>
				{/each}
			</div>
		{/if}

		<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="user-form">
			<div class="form-group">
				<label for="name" class="form-label">Имя</label>
				<input
					id="name"
					type="text"
					bind:value={formData.name}
					class="form-input"
					placeholder="Введите имя"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="form-group">
				<label for="email" class="form-label">Email</label>
				<input
					id="email"
					type="email"
					bind:value={formData.email}
					class="form-input"
					placeholder="user@example.com"
					required
					disabled={isSubmitting}
				/>
			</div>

			<div class="form-row">
				<div class="form-group">
					<label for="role" class="form-label">Роль</label>
					<select
						id="role"
						bind:value={formData.role}
						class="form-select"
						required
						disabled={isSubmitting}
					>
						{#each Object.entries(ROLE_LABELS) as [role, label]}
							<option value={role}>{label}</option>
						{/each}
					</select>
				</div>

				<div class="form-group">
					<label for="status" class="form-label">Статус</label>
					<select
						id="status"
						bind:value={formData.status}
						class="form-select"
						required
						disabled={isSubmitting}
					>
						{#each Object.entries(STATUS_LABELS) as [status, label]}
							<option value={status}>{label}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="form-group">
				<label class="form-label">Права доступа</label>
				<div class="permissions-grid">
					<label class="permission-item">
						<input
							type="checkbox"
							bind:checked={formData.permissions.canEdit}
							disabled={isSubmitting}
							class="permission-checkbox"
						/>
						<span class="permission-label">Редактирование</span>
					</label>

					<label class="permission-item">
						<input
							type="checkbox"
							bind:checked={formData.permissions.canInvite}
							disabled={isSubmitting}
							class="permission-checkbox"
						/>
						<span class="permission-label">Приглашения</span>
					</label>

					<label class="permission-item">
						<input
							type="checkbox"
							bind:checked={formData.permissions.canDelete}
							disabled={isSubmitting}
							class="permission-checkbox"
						/>
						<span class="permission-label">Удаление</span>
					</label>

					<label class="permission-item">
						<input
							type="checkbox"
							bind:checked={formData.permissions.canManageUsers}
							disabled={isSubmitting}
							class="permission-checkbox"
						/>
						<span class="permission-label">Управление</span>
					</label>
				</div>
			</div>

			<div class="form-actions">
				<button
					type="button"
					class="btn btn--secondary"
					onclick={handleClose}
					disabled={isSubmitting}
				>
					Отмена
				</button>
				<button
					type="submit"
					class="btn btn--primary"
					disabled={isSubmitting}
				>
					{#if isSubmitting}
						<div class="btn-spinner"></div>
						<span>Сохранение...</span>
					{:else}
						<span>{mode === 'create' ? 'Добавить' : 'Сохранить'}</span>
					{/if}
				</button>
			</div>
		</form>
	</div>
</Modal>

<style>
	.user-edit-modal .modal-container {
		max-width: 500px;
		background: #ffffff;
		border: 1px solid #e1e5e9;
		border-radius: 8px;
		box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
	}

	.user-edit-content {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.error-messages {
		display: flex;
		flex-direction: column;
		gap: 4px;
		padding: 12px 16px;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 6px;
	}

	.error-message {
		font-size: 13px;
		color: #dc2626;
	}

	.user-form {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.form-label {
		font-weight: 600;
		font-size: 14px;
		color: #ffffff;
		font-family: 'Gilroy', sans-serif;
	}

	.form-input,
	.form-select {
		padding: 12px 16px;
		border: 1px solid #2A2A2A;
		border-radius: 8px;
		background: #242424;
		font-size: 14px;
		color: #ffffff;
		transition: border-color 0.2s ease;
		font-family: 'Gilroy', sans-serif;
	}

	.form-input:focus,
	.form-select:focus {
		outline: none;
		border-color: #FEB1FF;
		box-shadow: 0 0 0 1px rgba(254, 177, 255, 0.2);
	}

	.form-input:disabled,
	.form-select:disabled {
		background: #1A1A1A;
		color: #7E7E7E;
		cursor: not-allowed;
	}

	.permissions-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
		padding: 12px;
		background: #2a2a2a;
		border: 1px solid #3a3a3a;
		border-radius: 8px;
	}

	.permission-item {
		display: flex;
		align-items: center;
		gap: 4px;
		cursor: pointer;
	}

	.permission-checkbox {
		width: 12px;
		height: 12px;
		accent-color: #FEB1FF;
	}

	.permission-label {
		font-size: 11px;
		color: #cccccc;
	}

	.form-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		padding-top: 8px;
	}

	.btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 16px;
		border: 1px solid #3a3a3a;
		border-radius: 8px;
		font-weight: 500;
		font-size: 12px;
		line-height: 1.2;
		cursor: pointer;
		transition: all 0.15s ease;
		text-decoration: none;
		outline: none;
		background: #2a2a2a;
		color: #ffffff;
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.btn--primary {
		background-color: #FEB1FF;
		color: #000000;
		border-color: #FEB1FF;
	}

	.btn--primary:hover:not(:disabled) {
		background-color: #FF9EFF;
		border-color: #FF9EFF;
		color: #000000;
	}

	.btn--secondary {
		background-color: #2a2a2a;
		color: #cccccc;
		border-color: #3a3a3a;
	}

	.btn--secondary:hover:not(:disabled) {
		background-color: #3a3a3a;
		border-color: #FEB1FF;
		color: #FEB1FF;
	}

	.btn-spinner {
		width: 12px;
		height: 12px;
		border: 2px solid transparent;
		border-top: 2px solid currentColor;
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
</style>