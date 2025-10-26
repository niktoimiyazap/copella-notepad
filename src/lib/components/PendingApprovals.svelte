<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { getPendingApprovals, approveRequest, rejectRequest, type PendingApproval } from '$lib/approvals';
	import { useRealtime } from '$lib/realtime';
	import { toast } from 'svelte-sonner';
	
	interface Props {
		roomId: string;
	}
	
	let { roomId }: Props = $props();
	
	let approvals = $state<PendingApproval[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	
	const ws = useRealtime(roomId);
	
	async function loadApprovals() {
		loading = true;
		error = null;
		
		const result = await getPendingApprovals(roomId);
		
		if (result.error) {
			error = result.error;
			toast.error(result.error);
		} else {
			approvals = result.approvals || [];
		}
		
		loading = false;
	}
	
	async function handleApprove(inviteId: string, userName: string) {
		const result = await approveRequest(roomId, inviteId);
		
		if (result.error) {
			toast.error(result.error);
		} else {
			toast.success(`Заявка от ${userName} одобрена`);
			await loadApprovals();
		}
	}
	
	async function handleReject(inviteId: string, userName: string) {
		const result = await rejectRequest(roomId, inviteId);
		
		if (result.error) {
			toast.error(result.error);
		} else {
			toast.success(`Заявка от ${userName} отклонена`);
			await loadApprovals();
		}
	}
	
	onMount(async () => {
		await loadApprovals();
		
		// Подписываемся на новые заявки
		ws.onApprovalRequest((message) => {
			const { user } = message.data;
			toast.info(`Новая заявка от ${user.fullName}`);
			loadApprovals();
		});
		
		// Подключаемся к WebSocket
		await ws.connect();
	});
	
	onDestroy(() => {
		ws.disconnect();
	});
</script>

<div class="pending-approvals">
	{#if loading}
		<div class="loading">
			<div class="spinner"></div>
			<p>Загрузка заявок...</p>
		</div>
	{:else if error}
		<div class="error">
			<p>{error}</p>
			<button class="error-retry-btn" onclick={() => loadApprovals()}>Повторить</button>
		</div>
	{:else if approvals.length === 0}
		<div class="empty">
			<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="empty-icon">
				<path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<circle cx="8.5" cy="7" r="4" stroke="currentColor" stroke-width="2"/>
				<path d="M20 8V14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				<path d="M23 11H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			<p>Нет ожидающих заявок</p>
		</div>
	{:else}
		<div class="approvals-list">
			{#each approvals as approval (approval.id)}
				<div class="approval-row">
					<div class="user-section">
						{#if approval.requester.avatarUrl}
							<img 
								src={approval.requester.avatarUrl} 
								alt={approval.requester.fullName}
								class="avatar"
							/>
						{:else}
							<div class="avatar-placeholder">
								{approval.requester.fullName.charAt(0).toUpperCase()}
							</div>
						{/if}
						
						<div class="user-details">
							<div class="user-name">{approval.requester.fullName}</div>
							<div class="user-meta">
								<span class="username">@{approval.requester.username}</span>
								{#if approval.requester.email}
									<span class="separator">•</span>
									<span class="email">{approval.requester.email}</span>
								{/if}
							</div>
							<div class="request-time">
								{new Date(approval.createdAt).toLocaleString('ru-RU', {
									day: 'numeric',
									month: 'long',
									hour: '2-digit',
									minute: '2-digit'
								})}
							</div>
						</div>
					</div>
					
					<div class="actions">
						<button 
							class="action-btn approve-btn"
							onclick={() => handleApprove(approval.id, approval.requester.fullName)}
							title="Принять заявку"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							Принять
						</button>
						<button 
							class="action-btn reject-btn"
							onclick={() => handleReject(approval.id, approval.requester.fullName)}
							title="Отклонить заявку"
						>
							<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
							</svg>
							Отклонить
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.pending-approvals {
		width: 100%;
	}
	
	.loading, .error, .empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 40px 20px;
		text-align: center;
	}
	
	.spinner {
		width: 16px;
		height: 16px;
		border: 2px solid #e8eaed;
		border-top: 2px solid #1a73e8;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 12px;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.loading p {
		font-size: 13px;
		color: #5f6368;
		margin: 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.error {
		gap: 12px;
	}
	
	.error p {
		font-size: 13px;
		color: #d93025;
		margin: 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.error-retry-btn {
		padding: 6px 16px;
		background: #1a73e8;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 13px;
		font-weight: 500;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		transition: background-color 0.2s ease;
	}
	
	.error-retry-btn:hover {
		background: #1765cc;
	}
	
	.empty {
		gap: 12px;
	}
	
	.empty-icon {
		color: #dadce0;
	}
	
	.empty p {
		font-size: 13px;
		color: #5f6368;
		margin: 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.approvals-list {
		display: flex;
		flex-direction: column;
		gap: 0;
	}
	
	.approval-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid #e8eaed;
		gap: 16px;
		transition: background-color 0.2s ease;
	}
	
	.approval-row:last-child {
		border-bottom: none;
	}
	
	.approval-row:hover {
		background: #f8f9fa;
	}
	
	.user-section {
		display: flex;
		align-items: center;
		gap: 12px;
		flex: 1;
		min-width: 0;
	}
	
	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		object-fit: cover;
		flex-shrink: 0;
	}
	
	.avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		font-weight: 500;
		flex-shrink: 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.user-details {
		flex: 1;
		min-width: 0;
	}
	
	.user-name {
		font-size: 14px;
		font-weight: 500;
		color: #202124;
		margin: 0 0 2px 0;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.user-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		color: #5f6368;
		margin: 0 0 2px 0;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.username {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.separator {
		color: #dadce0;
	}
	
	.email {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.request-time {
		font-size: 11px;
		color: #5f6368;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	.actions {
		display: flex;
		gap: 8px;
		flex-shrink: 0;
	}
	
	.action-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 12px;
		border: 1px solid;
		border-radius: 4px;
		font-size: 13px;
		font-weight: 500;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		cursor: pointer;
		transition: all 0.2s ease;
		white-space: nowrap;
	}
	
	.approve-btn {
		background: #ffffff;
		border-color: #137333;
		color: #137333;
	}
	
	.approve-btn:hover {
		background: #137333;
		color: #ffffff;
	}
	
	.reject-btn {
		background: #ffffff;
		border-color: #d93025;
		color: #d93025;
	}
	
	.reject-btn:hover {
		background: #d93025;
		color: #ffffff;
	}
	
	/* Адаптивность */
	@media (max-width: 768px) {
		.approval-row {
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}
		
		.actions {
			width: 100%;
		}
		
		.action-btn {
			flex: 1;
			justify-content: center;
		}
	}
</style>

