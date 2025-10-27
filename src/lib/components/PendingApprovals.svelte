<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getNotificationsClient } from '$lib/notifications-client';
	import type { NotificationMessage } from '$lib/notifications-client';
	import { getPendingApprovals, approveRequest, rejectRequest } from '$lib/approvals';
	import type { PendingApproval } from '$lib/approvals';
	
	interface Props {
		roomId: string;
		isOwner: boolean;
	}

	let { roomId, isOwner }: Props = $props();

	let pendingApprovals = $state<PendingApproval[]>([]);
	let notificationsClient: ReturnType<typeof getNotificationsClient> | null = null;
	let loading = $state(false);
	let error = $state<string | null>(null);

	onMount(async () => {
		// Загружаем pending approvals
		await loadPendingApprovals();

		// Подключаемся к уведомлениям если владелец
		if (isOwner && typeof window !== 'undefined') {
			try {
				notificationsClient = getNotificationsClient();
				notificationsClient.subscribeToRoom(roomId);

				// Слушаем уведомления о новых заявках
				notificationsClient.on('approval:request', handleApprovalRequest);
			} catch (error) {
				console.error('[PendingApprovals] Error connecting to notifications:', error);
			}
		}
	});

	onDestroy(() => {
		if (notificationsClient) {
			notificationsClient.off('approval:request', handleApprovalRequest);
			notificationsClient.unsubscribeFromRoom(roomId);
		}
	});

	async function loadPendingApprovals() {
		loading = true;
		error = null;
		try {
			const result = await getPendingApprovals(roomId);
			if (result.error) {
				error = result.error;
				console.error('[PendingApprovals] Error loading:', result.error);
			} else {
				pendingApprovals = result.approvals || [];
			}
		} catch (err) {
			error = 'Неожиданная ошибка';
			console.error('[PendingApprovals] Error loading:', err);
		} finally {
			loading = false;
		}
	}

	function handleApprovalRequest(message: NotificationMessage) {
		console.log('[PendingApprovals] New approval request:', message);
		// Перезагружаем список
		loadPendingApprovals();
	}

	async function handleApprove(inviteId: string) {
		try {
			const result = await approveRequest(roomId, inviteId);
			if (result.error) {
				console.error('[PendingApprovals] Error approving:', result.error);
				alert(result.error);
			} else {
				// Удаляем из списка
				pendingApprovals = pendingApprovals.filter(inv => inv.id !== inviteId);
			}
		} catch (err) {
			console.error('[PendingApprovals] Error approving:', err);
		}
	}

	async function handleReject(inviteId: string) {
		try {
			const result = await rejectRequest(roomId, inviteId);
			if (result.error) {
				console.error('[PendingApprovals] Error rejecting:', result.error);
				alert(result.error);
			} else {
				// Удаляем из списка
				pendingApprovals = pendingApprovals.filter(inv => inv.id !== inviteId);
			}
		} catch (err) {
			console.error('[PendingApprovals] Error rejecting:', err);
		}
	}
</script>

{#if isOwner}
	{#if loading}
		<div class="pending-approvals">
			<p class="loading-text">Загрузка заявок...</p>
		</div>
	{:else if error}
		<div class="pending-approvals">
			<p class="error-text">Ошибка: {error}</p>
			<button class="btn-retry" onclick={() => loadPendingApprovals()}>
				Повторить
			</button>
		</div>
	{:else if pendingApprovals.length > 0}
		<div class="pending-approvals">
			<h3>Заявки на вступление ({pendingApprovals.length})</h3>
			<div class="approvals-list">
				{#each pendingApprovals as approval}
					<div class="approval-item">
						<div class="approval-info">
							<strong>{approval.requester?.username || approval.requester?.fullName || 'Unknown'}</strong>
							<span class="approval-email">{approval.requester?.email || ''}</span>
						</div>
						<div class="approval-actions">
							<button class="btn-approve" onclick={() => handleApprove(approval.id)}>
								Одобрить
							</button>
							<button class="btn-reject" onclick={() => handleReject(approval.id)}>
								Отклонить
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
{/if}

<style>
	.pending-approvals {
		background: #ffffff;
		border: 1px solid #dadce0;
		border-radius: 8px;
		padding: 20px;
		margin-bottom: 24px;
		box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
	}

	h3 {
		margin: 0 0 16px 0;
		font-size: 18px;
		color: #202124;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-weight: 500;
	}
	
	.approvals-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.approval-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		background: #f8f9fa;
		border: 1px solid #e8eaed;
		border-radius: 8px;
	}

	.approval-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.approval-info strong {
		color: #202124;
		font-size: 14px;
		font-weight: 500;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.approval-email {
		color: #5f6368;
		font-size: 13px;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.approval-actions {
		display: flex;
		gap: 8px;
	}
	
	button {
		padding: 8px 16px;
		border-radius: 4px;
		border: none;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.btn-approve {
		background: #1a73e8;
		color: white;
	}

	.btn-approve:hover {
		background: #1557b0;
		box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
	}

	.btn-reject {
		background: #d93025;
		color: white;
	}

	.btn-reject:hover {
		background: #b52d20;
		box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
	}

	.loading-text {
		color: #5f6368;
		font-size: 14px;
		text-align: center;
		margin: 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.error-text {
		color: #d93025;
		font-size: 14px;
		margin: 0 0 12px 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.btn-retry {
		background: #1a73e8;
		color: white;
		padding: 8px 16px;
		border-radius: 4px;
		border: none;
		font-size: 14px;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.btn-retry:hover {
		background: #1557b0;
		box-shadow: 0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
	}
</style>

