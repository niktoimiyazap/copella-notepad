<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Props {
		user: any;
	}
	
	let { user }: Props = $props();
	
	// Notification preferences
	let emailNotifications = $state(true);
	let mentionNotifications = $state(true);
	let inviteNotifications = $state(true);
	let commentNotifications = $state(true);
	let roomActivityNotifications = $state(false);
	let browserNotifications = $state(false);
	let soundEnabled = $state(true);
	let saving = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	
	onMount(async () => {
		await loadNotificationSettings();
		checkBrowserNotificationPermission();
	});
	
	async function loadNotificationSettings() {
		try {
			const response = await fetch('/api/settings/notifications');
			if (response.ok) {
				const data = await response.json();
				emailNotifications = data.emailNotifications ?? true;
				mentionNotifications = data.mentionNotifications ?? true;
				inviteNotifications = data.inviteNotifications ?? true;
				commentNotifications = data.commentNotifications ?? true;
				roomActivityNotifications = data.roomActivityNotifications ?? false;
				browserNotifications = data.browserNotifications ?? false;
				soundEnabled = data.soundEnabled ?? true;
			}
		} catch (error) {
			console.error('Failed to load notification settings:', error);
		}
	}
	
	function checkBrowserNotificationPermission() {
		if ('Notification' in window) {
			browserNotifications = Notification.permission === 'granted';
		}
	}
	
	async function handleToggleBrowserNotifications() {
		if ('Notification' in window) {
			if (Notification.permission === 'default') {
				const permission = await Notification.requestPermission();
				browserNotifications = permission === 'granted';
				await saveSettings();
			} else if (Notification.permission === 'granted') {
				browserNotifications = false;
				await saveSettings();
			} else {
				message = { 
					type: 'error', 
					text: 'Уведомления заблокированы в настройках браузера' 
				};
			}
		} else {
			message = { 
				type: 'error', 
				text: 'Ваш браузер не поддерживает уведомления' 
			};
		}
	}
	
	async function saveSettings() {
		saving = true;
		message = null;
		
		try {
			const response = await fetch('/api/settings/notifications', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					emailNotifications,
					mentionNotifications,
					inviteNotifications,
					commentNotifications,
					roomActivityNotifications,
					browserNotifications,
					soundEnabled
				})
			});
			
			if (response.ok) {
				message = { type: 'success', text: 'Настройки уведомлений сохранены' };
			} else {
				message = { type: 'error', text: 'Ошибка при сохранении настроек' };
			}
		} catch (error) {
			message = { type: 'error', text: 'Произошла ошибка при сохранении' };
		} finally {
			saving = false;
		}
	}
	
	function toggleSwitch(settingName: string) {
		switch (settingName) {
			case 'email':
				emailNotifications = !emailNotifications;
				break;
			case 'mention':
				mentionNotifications = !mentionNotifications;
				break;
			case 'invite':
				inviteNotifications = !inviteNotifications;
				break;
			case 'comment':
				commentNotifications = !commentNotifications;
				break;
			case 'roomActivity':
				roomActivityNotifications = !roomActivityNotifications;
				break;
			case 'sound':
				soundEnabled = !soundEnabled;
				break;
			case 'browser':
				handleToggleBrowserNotifications();
				return; // Don't save immediately for browser notifications
		}
		saveSettings();
	}
</script>

<!-- Email notifications -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Email уведомления</h2>
		<p class="settings-section-description">
			Выберите, какие уведомления вы хотите получать на email
		</p>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('email')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Email уведомления</div>
			<div class="settings-toggle-description">
				Получать все уведомления на email
			</div>
		</div>
		<div class="toggle-switch" class:active={emailNotifications}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('mention')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Упоминания</div>
			<div class="settings-toggle-description">
				Когда кто-то упоминает вас в заметке
			</div>
		</div>
		<div class="toggle-switch" class:active={mentionNotifications}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('invite')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Приглашения</div>
			<div class="settings-toggle-description">
				Когда вас приглашают в комнату
			</div>
		</div>
		<div class="toggle-switch" class:active={inviteNotifications}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('comment')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Комментарии</div>
			<div class="settings-toggle-description">
				Когда кто-то комментирует вашу заметку
			</div>
		</div>
		<div class="toggle-switch" class:active={commentNotifications}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('roomActivity')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Активность в комнатах</div>
			<div class="settings-toggle-description">
				Уведомления о всех изменениях в ваших комнатах
			</div>
		</div>
		<div class="toggle-switch" class:active={roomActivityNotifications}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
</div>

<!-- Browser notifications -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Уведомления браузера</h2>
		<p class="settings-section-description">
			Управляйте push-уведомлениями в браузере
		</p>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('browser')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Push-уведомления</div>
			<div class="settings-toggle-description">
				Получать уведомления в браузере даже когда вкладка неактивна
			</div>
		</div>
		<div class="toggle-switch" class:active={browserNotifications}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('sound')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Звуковые уведомления</div>
			<div class="settings-toggle-description">
				Воспроизводить звук при получении уведомления
			</div>
		</div>
		<div class="toggle-switch" class:active={soundEnabled}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
</div>

{#if message}
	<div class="settings-message" class:settings-message--success={message.type === 'success'} class:settings-message--error={message.type === 'error'}>
		{message.text}
	</div>
{/if}

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

