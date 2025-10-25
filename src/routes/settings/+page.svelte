<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';
	import { ProfileSettings } from '$lib/components/settings';
	import { fetchCurrentUser } from '$lib/api/userApi';
	
	let user = $state<any>(null);
	let loading = $state(true);
	
	onMount(async () => {
		try {
			// Используем правильную функцию с токеном
			const { user: userData, error } = await fetchCurrentUser();
			
			if (error || !userData) {
				console.log('[Settings] User not authenticated:', error);
				goto('/auth/login');
				return;
			}
			
			// Load user settings including bio
			try {
				const token = browser ? localStorage.getItem('session_token') : null;
				const settingsResponse = await fetch('/api/settings/notifications', {
					headers: token ? { 'Authorization': `Bearer ${token}` } : {}
				});
				
				if (settingsResponse.ok) {
					const settings = await settingsResponse.json();
					user = { ...userData, bio: settings.bio };
				} else {
					user = userData;
				}
			} catch (err) {
				console.error('[Settings] Failed to load settings:', err);
				user = userData;
			}
		} catch (error) {
			console.error('[Settings] Failed to load user data:', error);
			goto('/auth/login');
		} finally {
			loading = false;
		}
	});
	
	function handleBack() {
		goto('/');
	}
</script>

<div class="settings-page">
	<div class="settings-container">
		<!-- Header -->
		<div class="settings-header">
			<button class="btn btn--ghost btn--icon" onclick={handleBack} aria-label="Назад">
				<svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M19 12H5M12 19l-7-7 7-7"/>
				</svg>
			</button>
			<h1 class="settings-title">Настройки</h1>
		</div>
		
		<div class="settings-content-single">
			{#if loading}
				<div class="settings-loading">
					<div class="spinner"></div>
					<p>Загрузка настроек...</p>
				</div>
			{:else if user}
				<ProfileSettings {user} />
			{/if}
		</div>
	</div>
</div>

