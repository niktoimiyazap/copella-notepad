<script lang="ts">
	interface Props {
		username?: string;
		avatarUrl?: string;
		size?: 'small' | 'medium' | 'large';
	}

	let { username = '', avatarUrl, size = 'medium' }: Props = $props();

	// Получаем первую букву username
	const firstLetter = $derived(username.charAt(0).toUpperCase() || '?');
	
	// Размеры для разных вариантов
	const sizeClasses = {
		small: 'avatar--small',
		medium: 'avatar--medium', 
		large: 'avatar--large'
	};
</script>

<div class="user-avatar" class:avatar--small={size === 'small'} class:avatar--medium={size === 'medium'} class:avatar--large={size === 'large'}>
	{#if avatarUrl}
		<img src={avatarUrl} alt="User Avatar" class="avatar-image" />
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
