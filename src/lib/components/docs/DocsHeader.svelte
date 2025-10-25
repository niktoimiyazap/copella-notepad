<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	interface Breadcrumb {
		label: string;
		path?: string;
	}

	// Получаем текущий путь для хлебных крошек
	const currentPath = $derived($page.url.pathname);
	
	// Генерируем хлебные крошки на основе пути
	const breadcrumbs = $derived(() => {
		const pathSegments = currentPath.split('/').filter(Boolean);
		const crumbs: Breadcrumb[] = [];
		
		// Всегда начинаем с "Документация"
		crumbs.push({ label: 'Документация', path: '/docs' });
		
		// Добавляем остальные сегменты пути
		let pathBuilder = '/docs';
		for (let i = 1; i < pathSegments.length; i++) {
			pathBuilder += `/${pathSegments[i]}`;
			const segment = pathSegments[i];
			
			// Преобразуем сегменты в читаемые названия
			let label = segment;
			switch (segment) {
				case 'user-guide':
					label = 'Руководство пользователя';
					break;
				case 'api':
					label = 'API документация';
					break;
				case 'examples':
					label = 'Примеры';
					break;
				case 'faq':
					label = 'FAQ';
					break;
				default:
					// Преобразуем kebab-case в обычный текст
					label = segment.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
			}
			
			// Последний элемент не должен быть ссылкой
			const isLast = i === pathSegments.length - 1;
			crumbs.push({
				label,
				path: isLast ? undefined : pathBuilder
			});
		}
		
		return crumbs;
	});

	function goBack() {
		goto('/');
	}

	function navigateTo(path: string) {
		goto(path);
	}
</script>

<header class="docs-header">
	<div class="header-left">
		<button class="back-button" on:click={goBack}>
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<path d="M19 12H5M12 19l-7-7 7-7"/>
			</svg>
		</button>
		
		<div class="logo-section">
			<img src="/logo/cnotepad.png" alt="Copella Notepad" class="logo" />
			<h1>Документация</h1>
		</div>
	</div>

	<div class="header-right">
		<nav class="breadcrumbs">
			{#each breadcrumbs() as crumb, index}
				{#if crumb.path}
					<button class="breadcrumb-link" on:click={() => navigateTo(crumb.path)}>
						{crumb.label}
					</button>
				{:else}
					<span class="breadcrumb-current">{crumb.label}</span>
				{/if}
				
				{#if index < breadcrumbs().length - 1}
					<svg class="breadcrumb-separator" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M9 18l6-6-6-6"/>
					</svg>
				{/if}
			{/each}
		</nav>
	</div>
</header>

<style>
	.docs-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 32px;
		border-bottom: 1px solid #2a2a2a;
		background-color: #121212;
		min-height: 64px;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.back-button {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		background-color: #2a2a2a;
		border: none;
		border-radius: 8px;
		color: #ffffff;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.back-button:hover {
		background-color: #3a3a3a;
		transform: translateX(-2px);
	}

	.logo-section {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.logo {
		width: 24px;
		height: 24px;
		object-fit: contain;
	}

	.logo-section h1 {
		margin: 0;
		font-size: 18px;
		font-weight: 400;
		color: #ffffff;
	}

	.header-right {
		display: flex;
		align-items: center;
	}

	.breadcrumbs {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.breadcrumb-link {
		background: none;
		border: none;
		color: #a0a0a0;
		font-size: 14px;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 4px;
		transition: all 0.2s ease;
	}

	.breadcrumb-link:hover {
		color: #ffffff;
		background-color: #2a2a2a;
	}

	.breadcrumb-current {
		color: #ffffff;
		font-size: 14px;
		font-weight: 500;
		padding: 4px 8px;
	}

	.breadcrumb-separator {
		color: #666;
		flex-shrink: 0;
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.docs-header {
			padding: 12px 20px;
			flex-direction: column;
			gap: 12px;
			align-items: flex-start;
		}

		.header-left {
			width: 100%;
			justify-content: space-between;
		}

		.header-right {
			width: 100%;
		}

		.breadcrumbs {
			flex-wrap: wrap;
			gap: 6px;
		}

		.breadcrumb-link,
		.breadcrumb-current {
			font-size: 13px;
			padding: 2px 6px;
		}

		.logo-section h1 {
			font-size: 16px;
		}
	}

	@media (max-width: 480px) {
		.docs-header {
			padding: 12px 16px;
		}

		.logo-section {
			gap: 8px;
		}

		.logo {
			width: 20px;
			height: 20px;
		}

		.logo-section h1 {
			font-size: 15px;
		}

		.breadcrumb-link,
		.breadcrumb-current {
			font-size: 12px;
		}
	}
</style>
