<script lang="ts">
	import { formatDate } from '$lib/utils/dates';
	
	interface Note {
		id: string;
		title: string;
		content: string;
		updatedAt: Date;
	}

	interface Props {
		notes: Note[];
		onNoteClick?: (noteId: string) => void;
		onCreateNote?: () => void;
		isCollapsed: boolean;
	}

	let { notes, onNoteClick, onCreateNote, isCollapsed }: Props = $props();
</script>

<div class="notes-section">
	{#if !isCollapsed}
		<h3 class="section-title">Заметки</h3>
	{/if}
	<div class="notes-list">
		{#each notes as note, index (note.id)}
			<div 
				class="note-item" 
				class:collapsed={isCollapsed}
				onclick={() => onNoteClick?.(note.id)}
			>
				<img src="/icons/message-circle.svg" alt="Note" class="note-icon" />
				{#if !isCollapsed}
					<div class="note-info">
						<span class="note-title">{note.title}</span>
						<span class="note-date">{formatDate(note.updatedAt)}</span>
					</div>
				{/if}
			</div>
		{/each}
		
		<!-- Кнопка создания новой заметки -->
		<button 
			class="nav-button nav-button--primary" 
			class:collapsed={isCollapsed}
			onclick={() => onCreateNote?.()}
			title="Создать заметку"
		>
			<img src="/icons/plus.svg" alt="Create Note" class="nav-icon" />
			{#if !isCollapsed}
				<span>Создать заметку</span>
			{/if}
		</button>
	</div>
</div>

<style>
	/* Импорт стилей сайдбара для кнопок */
	@import '../../styles/sidebar.css';
	
	.notes-section {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.section-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 16px;
		line-height: 1.2;
		color: #FFFFFF;
		margin: 0;
		text-align: left;
		
		/* Плавные анимации для заголовка */
		transition: 
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
	}

	.notes-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.note-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		background-color: #242424;
		border-radius: 12px;
		cursor: pointer;
		position: relative;
		overflow: hidden;
		
		/* Оптимизированные анимации - только transform и opacity */
		transition: 
			background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.note-item:hover {
		background-color: #2A2A2A;
		transform: translateY(-1px);
	}

	.note-item.collapsed {
		justify-content: center;
		align-items: center;
		gap: 0;
		padding: 8px;
		width: 40px;
		height: 40px;
		position: relative;
		/* Плавный переход для layout изменений */
		transition: 
			background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			padding 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			gap 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.note-icon {
		width: 20px;
		height: 20px;
		filter: brightness(0) invert(0.5);
		flex-shrink: 0;
		position: relative;
		
		/* Оптимизированные анимации для иконки */
		transition: 
			filter 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.note-item.collapsed .note-icon {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 16px;
		height: 16px;
		/* Плавный переход для позиционирования */
		transition: 
			filter 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.note-item:hover .note-icon {
		filter: brightness(0) invert(1);
		transform: scale(1.1);
	}

	.note-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
		
		/* Плавные анимации для информации */
		transition: 
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s;
	}

	.note-item.collapsed .note-info {
		opacity: 0;
		transform: translateX(-10px);
		transition: 
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		pointer-events: none;
	}

	.note-title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		line-height: 1.2;
		color: #7E7E7E;
		text-align: left;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		
		/* Плавные анимации для заголовка */
		transition: 
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
			width 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
			color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.note-item.collapsed .note-title {
		opacity: 0;
		width: 0;
		overflow: hidden;
		transition: 
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.note-item:hover .note-title {
		color: #FFFFFF;
	}

	.note-date {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 12px;
		color: #5A5A5A;
		text-align: left;
		
		/* Плавные анимации для даты */
		transition: 
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
			width 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
			color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.note-item.collapsed .note-date {
		opacity: 0;
		width: 0;
		overflow: hidden;
		transition: 
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	/* Стили для кнопки создания заметки в свернутом состоянии */
	.collapsed.nav-button {
		justify-content: center;
		padding: 12px;
		width: 40px;
		height: 40px;
		position: relative;
	}

	.collapsed.nav-button span {
		opacity: 0;
		width: 0;
		overflow: hidden;
		transition: opacity 0.2s ease 0.1s, width 0.2s ease 0.1s;
	}

	.collapsed.nav-button .nav-icon {
		margin: 0;
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	/* Адаптивность для мобильных устройств */
	@media (max-width: 768px) {
		.notes-list {
			flex-direction: row;
			gap: 8px;
			overflow-x: auto;
		}

		.note-item {
			flex-shrink: 0;
			min-width: 120px;
			width: auto;
			height: auto;
			position: static;
		}

		.note-icon {
			position: static;
			transform: none;
		}

		.section-title {
			opacity: 1;
			width: auto;
			overflow: visible;
		}

		.note-title,
		.note-date {
			opacity: 1;
			width: auto;
			overflow: visible;
		}

		.collapsed.nav-button {
			flex-shrink: 0;
			min-width: 120px;
			width: auto;
			height: auto;
			position: static;
		}

		.collapsed.nav-button .nav-icon {
			position: static;
			transform: none;
		}

		.collapsed.nav-button span {
			opacity: 1;
			width: auto;
			overflow: visible;
		}
	}
</style>
