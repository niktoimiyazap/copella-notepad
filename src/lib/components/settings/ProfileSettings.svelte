<script lang="ts">
	import { onMount } from 'svelte';
	import UserAvatar from '../UserAvatar.svelte';
	import { userActions } from '$lib/stores/user';
	import { compressImage, IMAGE_PRESETS } from '$lib/utils/imageOptimization';
	
	interface Props {
		user: any;
	}
	
	let { user }: Props = $props();
	
	let displayName = $state(user?.displayName || user?.fullName || '');
	let username = $state(user?.username || '');
	let email = $state(user?.email || '');
	let saving = $state(false);
	let uploadingAvatar = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	
	async function handleSaveProfile() {
		saving = true;
		message = null;
		
		try {
			const token = localStorage.getItem('session_token');
			
			const response = await fetch('/api/auth/profile', {
				method: 'PATCH',
				headers: { 
					'Content-Type': 'application/json',
					...(token ? { 'Authorization': `Bearer ${token}` } : {})
				},
				credentials: 'include',
				body: JSON.stringify({
					displayName,
					username
				})
			});
			
		if (response.ok) {
			message = { type: 'success', text: 'Профиль успешно обновлен' };
			// Обновляем данные пользователя
			const updatedUser = await response.json();
			Object.assign(user, updatedUser);
			// Обновляем глобальный стор пользователя
			userActions.updateUser({ 
				fullName: updatedUser.displayName,
				username: updatedUser.username 
			});
		} else {
				const error = await response.json();
				message = { type: 'error', text: error.error || 'Ошибка при обновлении профиля' };
			}
		} catch (error) {
			message = { type: 'error', text: 'Произошла ошибка при сохранении' };
		} finally {
			saving = false;
		}
	}
	
	async function handleAvatarUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		
		if (!file) return;
		
		// Проверка размера файла (макс 5MB)
		if (file.size > 5 * 1024 * 1024) {
			message = { type: 'error', text: 'Файл слишком большой (макс. 5MB)' };
			return;
		}
		
		// Проверка типа файла
		if (!file.type.startsWith('image/')) {
			message = { type: 'error', text: 'Выберите изображение' };
			return;
		}
		
		uploadingAvatar = true;
		message = null;
		
		try {
			const token = localStorage.getItem('session_token');
			
			// Сжимаем изображение перед загрузкой
			message = { type: 'success', text: 'Оптимизация изображения...' };
			const compressedBlob = await compressImage(
				file,
				IMAGE_PRESETS.avatar.maxWidth,
				IMAGE_PRESETS.avatar.maxHeight,
				IMAGE_PRESETS.avatar.quality
			);
			
			const formData = new FormData();
			formData.append('avatar', compressedBlob, 'avatar.jpg');
			
			message = { type: 'success', text: 'Загрузка...' };
			const response = await fetch('/api/upload/avatar', {
				method: 'POST',
				headers: token ? {
					'Authorization': `Bearer ${token}`
				} : {},
				credentials: 'include',
				body: formData
			});
			
		if (response.ok) {
			const data = await response.json();
			user.avatarUrl = data.avatarUrl;
			// Обновляем глобальный стор пользователя
			userActions.updateUser({ avatarUrl: data.avatarUrl });
			message = { type: 'success', text: 'Аватар успешно обновлен' };
		} else {
				const error = await response.json();
				message = { type: 'error', text: error.error || 'Ошибка при загрузке аватара' };
			}
		} catch (error) {
			console.error('Avatar upload error:', error);
			message = { type: 'error', text: 'Произошла ошибка при загрузке' };
		} finally {
			uploadingAvatar = false;
		}
	}
	
	async function handleRemoveAvatar() {
		if (!confirm('Вы уверены, что хотите удалить аватар?')) return;
		
		uploadingAvatar = true;
		message = null;
		
		try {
			const token = localStorage.getItem('session_token');
			
			const response = await fetch('/api/upload/avatar', {
				method: 'DELETE',
				headers: token ? {
					'Authorization': `Bearer ${token}`
				} : {},
				credentials: 'include'
			});
			
		if (response.ok) {
			user.avatarUrl = null;
			// Обновляем глобальный стор пользователя
			userActions.updateUser({ avatarUrl: null });
			message = { type: 'success', text: 'Аватар удален' };
		} else {
				const error = await response.json();
				message = { type: 'error', text: error.error || 'Ошибка при удалении аватара' };
			}
		} catch (error) {
			message = { type: 'error', text: 'Произошла ошибка при удалении' };
		} finally {
			uploadingAvatar = false;
		}
	}
</script>

<div class="settings-section">
	<div class="settings-section-header">
		<h2 class="settings-section-title">Профиль</h2>
		<p class="settings-section-description">
			Управляйте информацией вашего профиля
		</p>
	</div>
	
	<!-- Avatar upload -->
	<div class="avatar-upload-section">
		<div class="avatar-preview">
			{#if user.avatarUrl}
				<img src={user.avatarUrl} alt={user.username} />
			{:else}
				<UserAvatar username={user.username} avatarUrl={user.avatarUrl} size="large" />
			{/if}
		</div>
		<div class="avatar-actions">
			<div class="avatar-actions-buttons">
				<label class="btn btn--secondary btn--sm">
					<input 
						type="file" 
						accept="image/*" 
						style="display: none;" 
						onchange={handleAvatarUpload}
						disabled={uploadingAvatar}
					/>
					{uploadingAvatar ? 'Загрузка...' : 'Загрузить'}
				</label>
				{#if user.avatarUrl}
					<button 
						class="btn btn--ghost btn--sm" 
						onclick={handleRemoveAvatar}
						disabled={uploadingAvatar}
					>
						Удалить
					</button>
				{/if}
			</div>
			<p class="settings-field-hint">JPG, PNG или GIF. Макс. 5MB.</p>
		</div>
	</div>
	
	<!-- Display name -->
	<div class="settings-field">
		<label class="settings-field-label">Отображаемое имя</label>
		<input 
			type="text" 
			class="settings-field-input" 
			bind:value={displayName}
			placeholder="Введите ваше имя"
		/>
		<p class="settings-field-hint">Это имя будут видеть другие пользователи</p>
	</div>
	
	<!-- Username -->
	<div class="settings-field">
		<label class="settings-field-label">Имя пользователя</label>
		<input 
			type="text" 
			class="settings-field-input" 
			bind:value={username}
			placeholder="@username"
			disabled
		/>
		<p class="settings-field-hint">Имя пользователя нельзя изменить</p>
	</div>
	
	<!-- Email -->
	<div class="settings-field">
		<label class="settings-field-label">Email</label>
		<input 
			type="email" 
			class="settings-field-input" 
			bind:value={email}
			placeholder="your@email.com"
			disabled
		/>
		<p class="settings-field-hint">Для изменения email обратитесь в поддержку</p>
	</div>
	
	<!-- Message -->
	{#if message}
		<div class="settings-message" class:settings-message--success={message.type === 'success'} class:settings-message--error={message.type === 'error'}>
			{message.text}
		</div>
	{/if}
	
	<!-- Actions -->
	<div class="settings-actions">
		<button 
			class="btn btn--primary" 
			onclick={handleSaveProfile}
			disabled={saving}
		>
			{saving ? 'Сохранение...' : 'Сохранить изменения'}
		</button>
	</div>
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

