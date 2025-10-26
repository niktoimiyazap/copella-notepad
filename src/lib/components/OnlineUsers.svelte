<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { useRealtime } from '$lib/realtime';
	
	export let roomId: string;
	
	let onlineUsers = $state<Array<{
		userId: string;
		username?: string;
		fullName?: string;
		avatarUrl?: string;
		lastSeen?: Date;
	}>>([]);
	
	const ws = useRealtime(roomId);
	
	function addOrUpdateUser(data: any) {
		const index = onlineUsers.findIndex(u => u.userId === data.userId);
		const user = {
			userId: data.userId,
			username: data.username,
			fullName: data.fullName,
			avatarUrl: data.avatarUrl,
			lastSeen: new Date()
		};
		
		if (index >= 0) {
			onlineUsers[index] = user;
		} else {
			onlineUsers = [...onlineUsers, user];
		}
	}
	
	function removeUser(userId: string) {
		onlineUsers = onlineUsers.filter(u => u.userId !== userId);
	}
	
	onMount(async () => {
		// Подписываемся на события онлайн статуса
		ws.onUserOnline((message) => {
			addOrUpdateUser(message.data);
		});
		
		ws.onUserOffline((message) => {
			removeUser(message.data.userId);
		});
		
		// Подключаемся к WebSocket
		await ws.connect();
	});
	
	onDestroy(() => {
		ws.disconnect();
	});
</script>

<div class="online-users">
	<div class="header">
		<h3>Онлайн</h3>
		<span class="count">{onlineUsers.length}</span>
	</div>
	
	{#if onlineUsers.length === 0}
		<div class="empty">
			<p>Нет пользователей онлайн</p>
		</div>
	{:else}
		<div class="users-list">
			{#each onlineUsers as user (user.userId)}
				<div class="user-item">
					<div class="user-avatar-container">
						{#if user.avatarUrl}
							<img 
								src={user.avatarUrl} 
								alt={user.fullName || user.username}
								class="user-avatar"
							/>
						{:else}
							<div class="user-avatar-placeholder">
								{(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
							</div>
						{/if}
						<div class="online-indicator"></div>
					</div>
					
					<div class="user-info">
						<div class="user-name">{user.fullName || user.username}</div>
						{#if user.username && user.fullName}
							<div class="user-username">@{user.username}</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.online-users {
		width: 100%;
		max-width: 300px;
		background: white;
		border: 1px solid #e5e7eb;
		border-radius: 12px;
		padding: 16px;
	}
	
	.header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16px;
	}
	
	.header h3 {
		font-size: 16px;
		font-weight: 600;
		margin: 0;
		color: #1a1a1a;
	}
	
	.count {
		background: #10b981;
		color: white;
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 12px;
		font-weight: 600;
	}
	
	.empty {
		padding: 20px;
		text-align: center;
		color: #6b7280;
		font-size: 14px;
	}
	
	.users-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	
	.user-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px;
		border-radius: 8px;
		transition: background 0.2s;
	}
	
	.user-item:hover {
		background: #f9fafb;
	}
	
	.user-avatar-container {
		position: relative;
	}
	
	.user-avatar,
	.user-avatar-placeholder {
		width: 40px;
		height: 40px;
		border-radius: 50%;
	}
	
	.user-avatar {
		object-fit: cover;
	}
	
	.user-avatar-placeholder {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		font-weight: 600;
	}
	
	.online-indicator {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 12px;
		height: 12px;
		background: #10b981;
		border: 2px solid white;
		border-radius: 50%;
		animation: pulse 2s ease-in-out infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
			transform: scale(1);
		}
		50% {
			opacity: 0.7;
			transform: scale(1.1);
		}
	}
	
	.user-info {
		flex: 1;
		min-width: 0;
	}
	
	.user-name {
		font-size: 14px;
		font-weight: 500;
		color: #1a1a1a;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.user-username {
		font-size: 12px;
		color: #6b7280;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>

