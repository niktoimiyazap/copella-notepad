<script lang="ts">
	import { Loader2, Check } from '@lucide/svelte';
	import UserAvatar from '../UserAvatar.svelte';
	
	interface EditorUser {
		userId: string;
		username?: string;
		avatarUrl?: string;
		color: string;
	}
	
	interface Props {
		syncStatus?: 'connected' | 'syncing' | 'saved' | 'error';
		editingUsers?: EditorUser[];
	}
	
	let { syncStatus = 'connected', editingUsers = [] }: Props = $props();
</script>

{#if editingUsers.length > 0 || syncStatus === 'syncing' || syncStatus === 'saved'}
<div class="editor-status">
	<!-- Компактный показ нескольких пользователей -->
	{#if editingUsers.length > 0}
		<div class="editing-notification">
			<!-- Показываем аватары всех редактирующих -->
			<div class="editing-avatars">
				{#each editingUsers.slice(0, 3) as user (user.userId)}
					<div class="avatar-wrapper" style="--user-color: {user.color}">
						<UserAvatar 
							username={user.username}
							avatarUrl={user.avatarUrl}
							size="small"
						/>
					</div>
				{/each}
				{#if editingUsers.length > 3}
					<div class="more-users">
						+{editingUsers.length - 3}
					</div>
				{/if}
			</div>
			
			<!-- Текст с количеством -->
			<span class="editing-text">
				{#if editingUsers.length === 1}
					{editingUsers[0].username || 'Пользователь'} редактирует
				{:else if editingUsers.length === 2}
					{editingUsers[0].username || 'Пользователь'} и {editingUsers[1].username || 'пользователь'} редактируют
				{:else}
					{editingUsers.length} пользователей редактируют
				{/if}
			</span>
		</div>
	{/if}

	<!-- Индикатор синхронизации - только при синхронизации или сохранении -->
	{#if syncStatus === 'syncing'}
		<div class="sync-status syncing" title="Синхронизация...">
			<Loader2 size={16} class="spinning" />
		</div>
	{:else if syncStatus === 'saved'}
		<div class="sync-status saved" title="Сохранено">
			<Check size={16} />
		</div>
	{/if}
</div>
{/if}

<style>
	.editor-status {
		position: absolute;
		bottom: 24px;
		right: 24px;
		display: flex;
		align-items: center;
		gap: 12px;
		z-index: 100;
		pointer-events: none;
	}

	.editor-status > * {
		pointer-events: auto;
	}
	
	/* Уведомление о редактировании */
	.editing-notification {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 14px;
		background-color: rgba(254, 177, 255, 0.15);
		border: 1px solid rgba(254, 177, 255, 0.4);
		border-radius: 12px;
		animation: fadeIn 0.3s ease;
		backdrop-filter: blur(10px);
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Контейнер для аватаров */
	.editing-avatars {
		display: flex;
		align-items: center;
		gap: -4px; /* Отрицательный gap для наложения */
	}

	.avatar-wrapper {
		position: relative;
		border: 2px solid var(--user-color, #FEB1FF);
		border-radius: 50%;
		background-color: #1A1A1A;
		transition: transform 0.2s ease;
	}

	.avatar-wrapper:not(:first-child) {
		margin-left: -8px; /* Наложение аватаров */
	}

	.avatar-wrapper:hover {
		transform: translateY(-2px) scale(1.05);
		z-index: 10;
	}

	/* Индикатор +N пользователей */
	.more-users {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		margin-left: -8px;
		background: linear-gradient(135deg, rgba(254, 177, 255, 0.3), rgba(254, 177, 255, 0.5));
		border: 2px solid rgba(254, 177, 255, 0.6);
		border-radius: 50%;
		font-size: 11px;
		font-weight: 600;
		color: #FEB1FF;
		backdrop-filter: blur(10px);
	}

	.editing-text {
		font-size: 13px;
		color: #FEB1FF;
		font-weight: 500;
		white-space: nowrap;
	}

	/* Индикатор синхронизации */
	.sync-status {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 8px;
		border-radius: 10px;
		transition: all 0.2s ease;
	}

	.sync-status.syncing {
		color: #60A5FA;
		background-color: rgba(96, 165, 250, 0.15);
		border: 1px solid rgba(96, 165, 250, 0.4);
	}

	.sync-status.saved {
		color: #34D399;
		background-color: rgba(52, 211, 153, 0.15);
		border: 1px solid rgba(52, 211, 153, 0.4);
	}

	/* Анимация вращения для иконки синхронизации */
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

	/* Адаптивность для мобильных устройств */
	@media (max-width: 768px) {
		.editor-status {
			bottom: 12px;
			right: 12px;
			gap: 8px;
		}
		
		.editing-notification {
			padding: 5px 12px;
			gap: 8px;
		}
		
		.avatar-wrapper:not(:first-child) {
			margin-left: -6px;
		}

		.more-users {
			width: 24px;
			height: 24px;
			margin-left: -6px;
			font-size: 10px;
		}
		
		.editing-text {
			font-size: 12px;
		}

		.sync-status {
			padding: 6px;
		}
	}

	@media (max-width: 480px) {
		.editor-status {
			bottom: 8px;
			right: 8px;
			gap: 6px;
		}
		
		.editing-notification {
			padding: 4px 10px;
			gap: 6px;
		}

		.avatar-wrapper {
			border-width: 1.5px;
		}
		
		.avatar-wrapper:not(:first-child) {
			margin-left: -4px;
		}

		.more-users {
			width: 22px;
			height: 22px;
			margin-left: -4px;
			font-size: 9px;
			border-width: 1.5px;
		}
		
		.editing-text {
			font-size: 11px;
		}

		.sync-status {
			padding: 5px;
		}
	}
</style>

