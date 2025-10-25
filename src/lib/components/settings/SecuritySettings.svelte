<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Props {
		user: any;
	}
	
	let { user }: Props = $props();
	
	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let changingPassword = $state(false);
	let sessions = $state<any[]>([]);
	let loadingSessions = $state(true);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	
	onMount(async () => {
		await loadSessions();
	});
	
	async function loadSessions() {
		loadingSessions = true;
		try {
			const response = await fetch('/api/auth/session');
			if (response.ok) {
				const data = await response.json();
				sessions = data.sessions || [];
			}
		} catch (error) {
			console.error('Failed to load sessions:', error);
		} finally {
			loadingSessions = false;
		}
	}
	
	async function handleChangePassword() {
		message = null;
		
		// Валидация
		if (!currentPassword || !newPassword || !confirmPassword) {
			message = { type: 'error', text: 'Заполните все поля' };
			return;
		}
		
		if (newPassword !== confirmPassword) {
			message = { type: 'error', text: 'Пароли не совпадают' };
			return;
		}
		
		if (newPassword.length < 8) {
			message = { type: 'error', text: 'Пароль должен содержать минимум 8 символов' };
			return;
		}
		
		changingPassword = true;
		
		try {
			const response = await fetch('/api/auth/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					currentPassword,
					newPassword
				})
			});
			
			if (response.ok) {
				message = { type: 'success', text: 'Пароль успешно изменен' };
				currentPassword = '';
				newPassword = '';
				confirmPassword = '';
			} else {
				const error = await response.json();
				message = { type: 'error', text: error.message || 'Ошибка при изменении пароля' };
			}
		} catch (error) {
			message = { type: 'error', text: 'Произошла ошибка при изменении пароля' };
		} finally {
			changingPassword = false;
		}
	}
	
	async function handleRevokeSession(sessionId: string) {
		if (!confirm('Вы уверены, что хотите завершить эту сессию?')) return;
		
		try {
			const response = await fetch(`/api/auth/session/${sessionId}`, {
				method: 'DELETE'
			});
			
			if (response.ok) {
				await loadSessions();
				message = { type: 'success', text: 'Сессия завершена' };
			} else {
				message = { type: 'error', text: 'Ошибка при завершении сессии' };
			}
		} catch (error) {
			message = { type: 'error', text: 'Произошла ошибка' };
		}
	}
	
	async function handleRevokeAllSessions() {
		if (!confirm('Вы уверены, что хотите завершить все сессии, кроме текущей?')) return;
		
		try {
			const response = await fetch('/api/auth/session/revoke-all', {
				method: 'POST'
			});
			
			if (response.ok) {
				await loadSessions();
				message = { type: 'success', text: 'Все сессии завершены' };
			} else {
				message = { type: 'error', text: 'Ошибка при завершении сессий' };
			}
		} catch (error) {
			message = { type: 'error', text: 'Произошла ошибка' };
		}
	}
	
	function getDeviceIcon(userAgent: string): string {
		if (!userAgent) return '💻';
		
		const ua = userAgent.toLowerCase();
		if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) return '📱';
		if (ua.includes('tablet') || ua.includes('ipad')) return '📱';
		if (ua.includes('mac')) return '🖥️';
		if (ua.includes('windows')) return '💻';
		if (ua.includes('linux')) return '🐧';
		return '💻';
	}
	
	function formatDeviceInfo(session: any): string {
		const parts = [];
		if (session.browser) parts.push(session.browser);
		if (session.os) parts.push(session.os);
		return parts.join(' · ') || 'Неизвестное устройство';
	}
	
	function formatLastActive(date: string): string {
		const now = new Date();
		const sessionDate = new Date(date);
		const diffMs = now.getTime() - sessionDate.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMins / 60);
		const diffDays = Math.floor(diffHours / 24);
		
		if (diffMins < 1) return 'Только что';
		if (diffMins < 60) return `${diffMins} мин. назад`;
		if (diffHours < 24) return `${diffHours} ч. назад`;
		return `${diffDays} дн. назад`;
	}
</script>

<!-- Change password section -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Изменить пароль</h2>
		<p class="settings-section-description">
			Обновите ваш пароль для повышения безопасности
		</p>
	</div>
	
	<div class="settings-field">
		<label class="settings-field-label">Текущий пароль</label>
		<input 
			type="password" 
			class="settings-field-input" 
			bind:value={currentPassword}
			placeholder="Введите текущий пароль"
			autocomplete="current-password"
		/>
	</div>
	
	<div class="settings-field">
		<label class="settings-field-label">Новый пароль</label>
		<input 
			type="password" 
			class="settings-field-input" 
			bind:value={newPassword}
			placeholder="Введите новый пароль"
			autocomplete="new-password"
		/>
		<p class="settings-field-hint">Минимум 8 символов</p>
	</div>
	
	<div class="settings-field">
		<label class="settings-field-label">Подтвердите пароль</label>
		<input 
			type="password" 
			class="settings-field-input" 
			bind:value={confirmPassword}
			placeholder="Повторите новый пароль"
			autocomplete="new-password"
		/>
	</div>
	
	{#if message}
		<div class="settings-message" class:settings-message--success={message.type === 'success'} class:settings-message--error={message.type === 'error'}>
			{message.text}
		</div>
	{/if}
	
	<div class="settings-actions">
		<button 
			class="btn btn--primary" 
			onclick={handleChangePassword}
			disabled={changingPassword}
		>
			{changingPassword ? 'Изменение...' : 'Изменить пароль'}
		</button>
	</div>
</div>

<!-- Active sessions section -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Активные сессии</h2>
		<p class="settings-section-description">
			Управляйте устройствами, на которых выполнен вход в ваш аккаунт
		</p>
	</div>
	
	{#if loadingSessions}
		<div class="settings-loading">
			<div class="spinner"></div>
			<p>Загрузка сессий...</p>
		</div>
	{:else if sessions.length === 0}
		<p class="settings-field-hint">Активных сессий не найдено</p>
	{:else}
		<div class="sessions-list">
			{#each sessions as session}
				<div class="session-item" class:current={session.isCurrent}>
					<div class="session-icon">{getDeviceIcon(session.userAgent)}</div>
					<div class="session-info">
						<div class="session-device">{formatDeviceInfo(session)}</div>
						<div class="session-details">
							{session.ip || 'IP неизвестен'} · {formatLastActive(session.lastActiveAt)}
						</div>
					</div>
					{#if session.isCurrent}
						<span class="session-current-badge">Текущая</span>
					{:else}
						<button 
							class="btn btn--ghost btn--sm" 
							onclick={() => handleRevokeSession(session.id)}
						>
							Завершить
						</button>
					{/if}
				</div>
			{/each}
		</div>
		
		{#if sessions.length > 1}
			<div class="settings-actions">
				<button 
					class="btn btn--ghost" 
					onclick={handleRevokeAllSessions}
				>
					Завершить все остальные сессии
				</button>
			</div>
		{/if}
	{/if}
</div>

<style>
	.settings-message {
		padding: 12px 16px;
		border-radius: 8px;
		font-family: 'Gilroy', sans-serif;
		font-size: 14px;
		margin-top: 16px;
	}
	
	.settings-message--success {
		background: rgba(46, 213, 115, 0.1);
		color: #2ed573;
		border: 1px solid rgba(46, 213, 115, 0.3);
	}
	
	.settings-message--error {
		background: rgba(255, 68, 68, 0.1);
		color: #ff4444;
		border: 1px solid rgba(255, 68, 68, 0.3);
	}
</style>

