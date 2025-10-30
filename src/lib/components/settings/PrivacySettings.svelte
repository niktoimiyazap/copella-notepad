<script lang="ts">
	import { onMount } from 'svelte';
	
	interface Props {
		user: any;
	}
	
	let { user }: Props = $props();
	
	// Privacy settings
	let profileVisibility = $state<'public' | 'private'>('public');
	let showOnlineStatus = $state(true);
	let allowInvites = $state(true);
	let allowMentions = $state(true);
	let showActivityStatus = $state(true);
	let saving = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	
	onMount(async () => {
		await loadPrivacySettings();
	});
	
	async function loadPrivacySettings() {
		try {
			const token = localStorage.getItem('session_token');
			const response = await fetch('/api/settings/privacy', {
				headers: token ? { 'Authorization': `Bearer ${token}` } : {},
				credentials: 'include'
			});
			if (response.ok) {
				const data = await response.json();
				profileVisibility = data.profileVisibility ?? 'public';
				showOnlineStatus = data.showOnlineStatus ?? true;
				allowInvites = data.allowInvites ?? true;
				allowMentions = data.allowMentions ?? true;
				showActivityStatus = data.showActivityStatus ?? true;
			}
		} catch (error) {
			console.error('Failed to load privacy settings:', error);
		}
	}
	
	async function saveSettings() {
		saving = true;
		message = null;
		
		try {
			const token = localStorage.getItem('session_token');
			const response = await fetch('/api/settings/privacy', {
				method: 'PATCH',
				headers: { 
					'Content-Type': 'application/json',
					...(token ? { 'Authorization': `Bearer ${token}` } : {})
				},
				credentials: 'include',
				body: JSON.stringify({
					profileVisibility,
					showOnlineStatus,
					allowInvites,
					allowMentions,
					showActivityStatus
				})
			});
			
			if (response.ok) {
				message = { type: 'success', text: 'Настройки приватности сохранены' };
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
			case 'onlineStatus':
				showOnlineStatus = !showOnlineStatus;
				break;
			case 'invites':
				allowInvites = !allowInvites;
				break;
			case 'mentions':
				allowMentions = !allowMentions;
				break;
			case 'activityStatus':
				showActivityStatus = !showActivityStatus;
				break;
		}
		saveSettings();
	}
	
	function setProfileVisibility(visibility: 'public' | 'private') {
		profileVisibility = visibility;
		saveSettings();
	}
</script>

<!-- Profile visibility -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Видимость профиля</h2>
		<p class="settings-section-description">
			Контролируйте, кто может видеть ваш профиль
		</p>
	</div>
	
	<div class="visibility-options">
		<button 
			class="type-button" 
			class:type-button--active={profileVisibility === 'public'}
			onclick={() => setProfileVisibility('public')}
		>
			<div class="type-icon">🌍</div>
			<div class="type-text">
				<div class="type-title">Публичный</div>
				<div class="type-description">Ваш профиль виден всем пользователям</div>
			</div>
		</button>
		
		<button 
			class="type-button" 
			class:type-button--active={profileVisibility === 'private'}
			onclick={() => setProfileVisibility('private')}
		>
			<div class="type-icon">🔒</div>
			<div class="type-text">
				<div class="type-title">Приватный</div>
				<div class="type-description">Только участники ваших комнат видят профиль</div>
			</div>
		</button>
	</div>
</div>

<!-- Online status and activity -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Статус и активность</h2>
		<p class="settings-section-description">
			Управляйте видимостью вашей активности
		</p>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('onlineStatus')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Показывать онлайн-статус</div>
			<div class="settings-toggle-description">
				Другие пользователи видят, когда вы онлайн
			</div>
		</div>
		<div class="toggle-switch" class:active={showOnlineStatus}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('activityStatus')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Показывать статус активности</div>
			<div class="settings-toggle-description">
				Участники комнат видят, что вы печатаете
			</div>
		</div>
		<div class="toggle-switch" class:active={showActivityStatus}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
</div>

<!-- Interactions -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Взаимодействие</h2>
		<p class="settings-section-description">
			Контролируйте, как другие могут взаимодействовать с вами
		</p>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('invites')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Разрешить приглашения</div>
			<div class="settings-toggle-description">
				Другие пользователи могут приглашать вас в комнаты
			</div>
		</div>
		<div class="toggle-switch" class:active={allowInvites}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
	
	<div class="settings-toggle" onclick={() => toggleSwitch('mentions')}>
		<div class="settings-toggle-info">
			<div class="settings-toggle-label">Разрешить упоминания</div>
			<div class="settings-toggle-description">
				Другие пользователи могут упоминать вас в заметках
			</div>
		</div>
		<div class="toggle-switch" class:active={allowMentions}>
			<div class="toggle-switch-handle"></div>
		</div>
	</div>
</div>

<!-- Data management -->
<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Управление данными</h2>
		<p class="settings-section-description">
			Экспортируйте или удалите ваши данные
		</p>
	</div>
	
	<div class="data-actions">
		<button class="btn btn--ghost">
			<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
				<polyline points="7 10 12 15 17 10"/>
				<line x1="12" y1="15" x2="12" y2="3"/>
			</svg>
			Экспортировать данные
		</button>
		<p class="settings-field-hint">Скачайте копию всех ваших данных</p>
	</div>
</div>

{#if message}
	<div class="settings-message" class:settings-message--success={message.type === 'success'} class:settings-message--error={message.type === 'error'}>
		{message.text}
	</div>
{/if}

<!-- Danger zone -->
<div class="settings-danger-zone">
	<h3 class="settings-danger-title">Опасная зона</h3>
	<p class="settings-danger-description">
		Будьте осторожны с этими действиями. Они необратимы.
	</p>
	<button class="btn btn--danger">
		Удалить аккаунт
	</button>
</div>

<style>
	.visibility-options {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}
	
	@media (max-width: 768px) {
		.visibility-options {
			grid-template-columns: 1fr;
		}
	}
	
	.data-actions {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	
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

