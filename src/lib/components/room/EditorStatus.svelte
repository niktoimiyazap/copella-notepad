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
	<!-- Уведомления о редактировании для каждого пользователя -->
	{#each editingUsers as user (user.userId)}
		<div class="editing-notification">
			<UserAvatar 
				username={user.username}
				avatarUrl={user.avatarUrl}
				size="small"
			/>
			<span class="editing-text">{user.username || 'Аноним'} редактирует</span>
		</div>
	{/each}

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
		gap: 8px;
		padding: 6px 12px;
		background-color: rgba(254, 177, 255, 0.15);
		border: 1px solid rgba(254, 177, 255, 0.4);
		border-radius: 10px;
		animation: fadeIn 0.3s ease;
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
			padding: 5px 10px;
			gap: 6px;
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
			padding: 4px 8px;
			gap: 4px;
		}
		
		.editing-text {
			font-size: 11px;
		}

		.sync-status {
			padding: 5px;
		}
	}
</style>

