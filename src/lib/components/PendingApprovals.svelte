<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getNotificationsClient } from '$lib/notifications-client';
	import type { NotificationMessage } from '$lib/notifications-client';
	
	interface Props {
		roomId: string;
		isOwner: boolean;
	}

	let { roomId, isOwner }: Props = $props();

	let pendingApprovals = $state<any[]>([]);
	let notificationsClient: ReturnType<typeof getNotificationsClient> | null = null;

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
		try {
			const response = await fetch(`/api/rooms/${roomId}/invites/manage`);
			if (response.ok) {
				const data = await response.json();
				pendingApprovals = data.pendingInvites || [];
			}
		} catch (error) {
			console.error('[PendingApprovals] Error loading:', error);
		}
	}

	function handleApprovalRequest(message: NotificationMessage) {
		console.log('[PendingApprovals] New approval request:', message);
		// Перезагружаем список
		loadPendingApprovals();
	}

	async function handleApprove(inviteId: string) {
		try {
			const response = await fetch(`/api/rooms/${roomId}/invites/manage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ inviteId, action: 'approve' })
			});

			if (response.ok) {
				// Удаляем из списка
				pendingApprovals = pendingApprovals.filter(inv => inv.id !== inviteId);
			}
		} catch (error) {
			console.error('[PendingApprovals] Error approving:', error);
		}
	}

	async function handleReject(inviteId: string) {
		try {
			const response = await fetch(`/api/rooms/${roomId}/invites/manage`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ inviteId, action: 'reject' })
			});

			if (response.ok) {
				// Удаляем из списка
				pendingApprovals = pendingApprovals.filter(inv => inv.id !== inviteId);
			}
		} catch (error) {
			console.error('[PendingApprovals] Error rejecting:', error);
		}
	}
</script>

{#if isOwner && pendingApprovals.length > 0}
<div class="pending-approvals">
		<h3>Pending Approvals ({pendingApprovals.length})</h3>
		<div class="approvals-list">
			{#each pendingApprovals as approval}
				<div class="approval-item">
					<div class="approval-info">
						<strong>{approval.requester?.username || approval.requester?.fullName || 'Unknown'}</strong>
						<span class="approval-email">{approval.requester?.email || ''}</span>
					</div>
					<div class="approval-actions">
						<button class="btn-approve" onclick={() => handleApprove(approval.id)}>
							Approve
						</button>
						<button class="btn-reject" onclick={() => handleReject(approval.id)}>
							Reject
						</button>
					</div>
				</div>
			{/each}
		</div>
		</div>
	{/if}

<style>
	.pending-approvals {
		background: #1a1a1a;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		padding: 16px;
		margin-bottom: 24px;
	}

	h3 {
		margin: 0 0 16px 0;
		font-size: 16px;
		color: #ffffff;
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
		padding: 12px;
		background: #0f0f0f;
		border-radius: 6px;
	}

	.approval-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.approval-info strong {
		color: #ffffff;
		font-size: 14px;
	}

	.approval-email {
		color: #888;
		font-size: 12px;
	}

	.approval-actions {
		display: flex;
		gap: 8px;
	}
	
	button {
		padding: 6px 12px;
		border-radius: 4px;
		border: none;
		font-size: 13px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-approve {
		background: #4A9EFF;
		color: white;
	}

	.btn-approve:hover {
		background: #3b7fd6;
	}

	.btn-reject {
		background: #ff4444;
		color: white;
	}

	.btn-reject:hover {
		background: #d63636;
	}
</style>

