<script lang="ts">
	import { DocsHeader } from '$lib/components/docs';
	import { goto } from '$app/navigation';

	// Определяем разделы документации
	const docSections = [
		{
			id: 'rooms',
			title: 'Создание комнат',
			description: 'Настройка и управление рабочими пространствами',
			path: '/docs/rooms'
		},
		{
			id: 'formatting',
			title: 'Форматирование текста',
			description: 'Работа с редактором и стилями',
			path: '/docs/formatting'
		},
		{
			id: 'shortcuts',
			title: 'Горячие клавиши',
			description: 'Быстрые команды для эффективной работы',
			path: '/docs/shortcuts'
		},
		{
			id: 'teleprompter',
			title: 'Телесуфлер',
			description: 'Режим для презентаций и выступлений',
			path: '/docs/teleprompter'
		},
		{
			id: 'profile',
			title: 'Кастомизация профиля',
			description: 'Настройка личных данных и предпочтений',
			path: '/docs/profile'
		},
		{
			id: 'collaboration',
			title: 'Совместный режим',
			description: 'Работа в команде и синхронизация',
			path: '/docs/collaboration'
		},
		{
			id: 'tags',
			title: 'Теги',
			description: 'Организация и категоризация контента',
			path: '/docs/tags'
		},
		{
			id: 'user-permissions',
			title: 'Управление пользователями и правами',
			description: 'Роли, права доступа и управление участниками',
			path: '/docs/user-permissions'
		}
	];

	function handleSectionClick(path: string) {
		goto(path);
	}
</script>

<div class="docs-page">
	<DocsHeader />

	<main class="docs-main">
		<div class="docs-container">
			<div class="docs-content">
				<h2>Документация</h2>
				<p class="docs-description">
					Подробное руководство по использованию всех возможностей Copella Notepad.
				</p>
				
				<div class="docs-sections">
					{#each docSections as section}
						<div class="section-item" on:click={() => handleSectionClick(section.path)}>
							<div class="section-icon">
								{#if section.id === 'rooms'}
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
										<polyline points="9,22 9,12 15,12 15,22"/>
									</svg>
								{:else if section.id === 'formatting'}
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
										<polyline points="14,2 14,8 20,8"/>
										<line x1="16" y1="13" x2="8" y2="13"/>
										<line x1="16" y1="17" x2="8" y2="17"/>
										<polyline points="10,9 9,9 8,9"/>
									</svg>
								{:else if section.id === 'shortcuts'}
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
										<line x1="8" y1="21" x2="16" y2="21"/>
										<line x1="12" y1="17" x2="12" y2="21"/>
									</svg>
								{:else if section.id === 'teleprompter'}
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
										<line x1="8" y1="21" x2="16" y2="21"/>
										<line x1="12" y1="17" x2="12" y2="21"/>
										<circle cx="12" cy="10" r="2"/>
									</svg>
								{:else if section.id === 'profile'}
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
										<circle cx="12" cy="7" r="4"/>
									</svg>
								{:else if section.id === 'collaboration'}
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
										<circle cx="9" cy="7" r="4"/>
										<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
										<path d="M16 3.13a4 4 0 0 1 0 7.75"/>
									</svg>
								{:else if section.id === 'tags'}
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
										<line x1="7" y1="7" x2="7.01" y2="7"/>
									</svg>
								{:else if section.id === 'user-permissions'}
									<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
										<path d="M12 2L2 7l10 5 10-5-10-5z"/>
										<path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
										<path d="M12 22V12"/>
									</svg>
								{/if}
							</div>
							<div class="section-content">
								<h3>{section.title}</h3>
								<p>{section.description}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</main>
</div>

<style>
	.docs-page {
		height: 100%;
		display: flex;
		flex-direction: column;
		background-color: #121212;
		color: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}



	.docs-main {
		flex: 1;
		padding: 40px 32px;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		overflow-y: auto;
	}

	.docs-container {
		width: 100%;
		max-width: 800px;
	}

	.docs-content {
		text-align: left;
	}

	.docs-content h2 {
		margin: 0 0 12px 0;
		font-size: 24px;
		font-weight: 400;
		color: #ffffff;
	}

	.docs-description {
		margin: 0 0 40px 0;
		font-size: 16px;
		color: #a0a0a0;
		line-height: 1.6;
	}

	.docs-sections {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 12px;
	}

	.section-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background-color: transparent;
		border: 1px solid #2a2a2a;
		border-radius: 8px;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.section-item:hover {
		border-color: #404040;
		background-color: #0f0f0f;
		transform: translateY(-1px);
	}

	.section-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		background-color: transparent;
		border-radius: 6px;
		color: #666666;
		flex-shrink: 0;
		transition: color 0.2s ease;
	}

	.section-item:hover .section-icon {
		color: #ffffff;
	}

	.section-content h3 {
		margin: 0 0 2px 0;
		font-size: 15px;
		font-weight: 500;
		color: #ffffff;
		line-height: 1.3;
	}

	.section-content p {
		margin: 0;
		font-size: 13px;
		color: #888888;
		line-height: 1.4;
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.docs-main {
			padding: 24px 20px;
		}

		.docs-sections {
			grid-template-columns: 1fr;
			gap: 10px;
		}

		.docs-content h2 {
			font-size: 20px;
		}

		.docs-description {
			font-size: 15px;
		}

		.section-item {
			padding: 14px;
		}

		.section-icon {
			width: 28px;
			height: 28px;
		}

		.section-content h3 {
			font-size: 14px;
		}

		.section-content p {
			font-size: 12px;
		}
	}

	@media (max-width: 480px) {
		.docs-main {
			padding: 20px 16px;
		}

		.docs-sections {
			gap: 8px;
		}

		.section-item {
			padding: 12px;
			gap: 10px;
		}

		.section-icon {
			width: 24px;
			height: 24px;
		}

		.section-content h3 {
			font-size: 13px;
		}

		.section-content p {
			font-size: 11px;
		}
	}
</style>
