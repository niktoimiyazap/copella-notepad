<script lang="ts">
	import { getOptimizedAvatar } from '$lib/utils/imageOptimization';
	
	interface Props {
		username?: string;
		avatarUrl?: string;
		size?: 'small' | 'medium' | 'large';
	}

	let { username = '', avatarUrl, size = 'medium' }: Props = $props();

	// Получаем первую букву username
	const firstLetter = $derived(username.charAt(0).toUpperCase() || '?');
	
	// Оптимизированный URL аватара
	const optimizedAvatarUrl = $derived(getOptimizedAvatar(avatarUrl, size));
	
	// Состояние загрузки
	let imageLoaded = $state(false);
	let imageError = $state(false);
	
	function handleImageLoad() {
		imageLoaded = true;
	}
	
	function handleImageError() {
		imageError = true;
	}
</script>

<div class="user-avatar" class:avatar--small={size === 'small'} class:avatar--medium={size === 'medium'} class:avatar--large={size === 'large'}>
	{#if optimizedAvatarUrl && !imageError}
		<img 
			src={optimizedAvatarUrl} 
			alt="User Avatar" 
			class="avatar-image"
			class:avatar-image--loaded={imageLoaded}
			loading="lazy"
			decoding="async"
			onload={handleImageLoad}
			onerror={handleImageError}
		/>
		{#if !imageLoaded}
			<div class="avatar-letter avatar-placeholder">
				{firstLetter}
			</div>
		{/if}
	{:else}
		<div class="avatar-letter">
			{firstLetter}
		</div>
	{/if}
</div>

<style>
	.user-avatar {
		border-radius: 50%;
		border: 2px solid #2A2A2A;
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: #242424;
	}

	.avatar--small {
		width: 24px;
		height: 24px;
	}

	.avatar--medium {
		width: 36px;
		height: 36px;
	}

	.avatar--large {
		width: 48px;
		height: 48px;
	}

	.avatar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: 50%;
		position: absolute;
		top: 0;
		left: 0;
		opacity: 0;
		transition: opacity 0.3s ease-in-out;
	}
	
	.avatar-image--loaded {
		opacity: 1;
	}
	
	.avatar-placeholder {
		opacity: 0.5;
	}

	.avatar-letter {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #FEB1FF 0%, #FF9EFF 100%);
		color: #000000;
		font-family: 'Gilroy', sans-serif;
		font-weight: 700;
		text-transform: uppercase;
		border-radius: 50%;
	}

	.avatar--small .avatar-letter {
		font-size: 10px;
	}

	.avatar--medium .avatar-letter {
		font-size: 14px;
	}

	.avatar--large .avatar-letter {
		font-size: 18px;
	}

	/* Специальное позиционирование для мини-сайдбара */
	:global(.sidebar--mini) .user-avatar {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		z-index: 10;
	}
</style>
