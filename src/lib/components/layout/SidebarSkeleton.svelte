<script lang="ts">
	import '../../styles/sidebar.css';
	import '../../styles/skeleton.css';
	
	interface Props {
		isMini?: boolean;
		isOpen?: boolean;
		isMobile?: boolean;
	}
	
	let { isMini = true, isOpen = false, isMobile = false }: Props = $props();
</script>

<aside 
	class="sidebar sidebar-skeleton" 
	class:sidebar--mini={isMini && !isMobile}
	class:sidebar--expanded={!isMini || isMobile}
	class:sidebar--mobile-open={isMobile && isOpen}
	class:sidebar--mobile={isMobile}
>
	<div class="sidebar-header">
		<div class="skeleton skeleton-logo" class:skeleton-logo--mini={isMini && !isMobile}></div>
	</div>
	
	<nav class="sidebar-nav">
		<div class="skeleton skeleton-button skeleton-button--primary"></div>
		<div class="skeleton skeleton-button"></div>
	</nav>
	
	<div class="sidebar-footer">
		<div class="user-info">
			<div class="skeleton skeleton-avatar"></div>
			<div class="skeleton skeleton-text skeleton-nickname"></div>
		</div>
		
		<div class="skeleton skeleton-button"></div>
		<div class="skeleton skeleton-button"></div>
		<div class="skeleton skeleton-button"></div>
	</div>
</aside>

<style>
	.sidebar-skeleton {
		pointer-events: none;
		animation: fadeIn 0.3s ease-in-out;
	}
	
	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	
	.skeleton-logo {
		width: 32px;
		height: 32px;
		border-radius: 4px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.skeleton-logo--mini {
		width: 32px;
		height: 32px;
	}
	
	.sidebar--expanded .skeleton-logo,
	.sidebar--mobile-open .skeleton-logo {
		width: 160px;
		height: 40px;
	}
	
	.skeleton-button {
		height: 44px;
		border-radius: 12px;
		margin-bottom: 0;
	}
	
	.skeleton-button--primary {
		background: linear-gradient(
			90deg,
			rgba(74, 144, 226, 0.2) 25%,
			rgba(74, 144, 226, 0.3) 50%,
			rgba(74, 144, 226, 0.2) 75%
		);
		background-size: 200% 100%;
		animation: skeleton-loading 1.5s ease-in-out infinite;
	}
	
	.sidebar-nav {
		gap: 8px;
	}
	
	.skeleton-avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		flex-shrink: 0;
	}
	
	.skeleton-nickname {
		height: 14px;
		flex: 1;
		border-radius: 4px;
		margin-left: 12px;
		max-width: 100px;
	}
	
	.sidebar--mini .skeleton-nickname {
		display: none;
	}
	
	.user-info {
		display: flex;
		align-items: center;
		padding: 12px;
		margin-bottom: 8px;
		border-radius: 12px;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.sidebar--expanded .user-info {
		padding: 12px 16px;
	}
	
	.sidebar--mini .user-info {
		justify-content: center;
		padding: 12px;
	}
</style>

