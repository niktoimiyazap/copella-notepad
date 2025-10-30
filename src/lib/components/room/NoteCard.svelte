<script lang="ts">
	import type { Note } from '$lib/notes';
	
	interface Props {
		note: Note & { 
			creator?: { 
				id: string; 
				username: string; 
				fullName: string; 
				avatarUrl?: string 
			} 
		};
		isSelected?: boolean;
		activeEditors?: Array<{ id: string; username: string; fullName: string; avatarUrl?: string }>;
		onClick?: () => void;
		yjsContent?: string; // Содержимое из Yjs WebSocket
	}

	let { note, isSelected = false, activeEditors = [], onClick, yjsContent }: Props = $props();
	
	// Используем либо yjsContent (из веб-сокета), либо note.content (из БД)
	const contentToUse = $derived(yjsContent || note.content || '');
	
	// Вычисляем количество слов
	const wordCount = $derived(() => {
		if (!contentToUse) return 0;
		// Удаляем HTML теги и считаем слова
		const text = contentToUse.replace(/<[^>]*>/g, '').trim();
		if (!text) return 0;
		return text.split(/\s+/).filter(word => word.length > 0).length;
	});
	
	// Получаем превью текста (первые 100 символов)
	const preview = $derived(() => {
		if (!contentToUse) return 'Пустая заметка';
		// Удаляем HTML теги
		const text = contentToUse.replace(/<[^>]*>/g, '').trim();
		if (!text) return 'Пустая заметка';
		return text.length > 100 ? text.substring(0, 100) + '...' : text;
	});
	
	// Форматируем дату последнего обновления
	const formattedDate = $derived(() => {
		const date = new Date(note.updatedAt);
		const now = new Date();
		const diffInMs = now.getTime() - date.getTime();
		const diffInMinutes = Math.floor(diffInMs / 60000);
		const diffInHours = Math.floor(diffInMinutes / 60);
		const diffInDays = Math.floor(diffInHours / 24);
		
		if (diffInMinutes < 1) return 'только что';
		if (diffInMinutes < 60) return `${diffInMinutes} мин. назад`;
		if (diffInHours < 24) return `${diffInHours} ч. назад`;
		if (diffInDays < 7) return `${diffInDays} д. назад`;
		
		return date.toLocaleDateString('ru-RU', { 
			day: 'numeric', 
			month: 'short',
			year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
		});
	});
</script>

<button 
	class="note-card" 
	class:note-card--selected={isSelected}
	onclick={onClick}
	type="button"
>
	<div class="note-card__header">
		<h3 class="note-card__title">{note.title}</h3>
		{#if activeEditors.length > 0}
			<div class="note-card__editors">
				{#each activeEditors.slice(0, 3) as editor}
					<div class="editor-avatar" title={editor.fullName}>
						{#if editor.avatarUrl}
							<img src={editor.avatarUrl} alt={editor.fullName} />
						{:else}
							<span class="editor-avatar__initial">
								{editor.fullName.charAt(0).toUpperCase()}
							</span>
						{/if}
					</div>
				{/each}
				{#if activeEditors.length > 3}
					<div class="editor-avatar editor-avatar--more" title={`+${activeEditors.length - 3} ещё`}>
						<span>+{activeEditors.length - 3}</span>
					</div>
				{/if}
			</div>
		{/if}
	</div>
	
	<p class="note-card__preview">{preview()}</p>
	
	<div class="note-card__footer">
		<div class="note-card__meta">
			<span class="note-card__word-count">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
					<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
					<polyline points="14 2 14 8 20 8"/>
				</svg>
				{wordCount()} {wordCount() === 1 ? 'слово' : wordCount() < 5 ? 'слова' : 'слов'}
			</span>
			<span class="note-card__date">{formattedDate()}</span>
		</div>
	</div>
</button>

<style>
	.note-card {
		position: relative;
		background: #1A1A1A;
		border: 1px solid #2A2A2A;
		border-radius: 18px;
		padding: 16px;
		cursor: pointer;
		transition: all 0.3s ease;
		text-align: left;
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 12px;
		overflow: hidden;
		min-height: 180px;
		outline: none;
	}

	.note-card:hover {
		background: #242424;
		border-color: #404040;
	}
	
	.note-card:focus-visible {
		border-color: #FEB1FF;
		box-shadow: 0 0 0 2px rgba(254, 177, 255, 0.2);
	}

	.note-card--selected {
		border-color: #FEB1FF;
	}

	.note-card__header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	.note-card__title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 16px;
		line-height: 1.3;
		color: #FFFFFF;
		margin: 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
	}

	.note-card__editors {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-shrink: 0;
	}

	.editor-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		overflow: hidden;
		border: 1px solid rgba(255, 255, 255, 0.1);
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(8px);
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		margin-left: -6px;
	}

	.editor-avatar:first-child {
		margin-left: 0;
	}

	.editor-avatar img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.editor-avatar__initial {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 10px;
		color: #FEB1FF;
	}

	.editor-avatar--more {
		background: rgba(254, 177, 255, 0.2);
		border-color: rgba(254, 177, 255, 0.3);
	}

	.editor-avatar--more span {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 9px;
		color: #FEB1FF;
	}

	.note-card__preview {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 13px;
		line-height: 1.5;
		color: #7E7E7E;
		margin: 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
	}

	.note-card__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-top: auto;
	}

	.note-card__meta {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.note-card__word-count {
		display: flex;
		align-items: center;
		gap: 4px;
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 11px;
		color: #7E7E7E;
	}

	.note-card__word-count svg {
		color: #7E7E7E;
		flex-shrink: 0;
		opacity: 0.7;
	}

	.note-card__date {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 11px;
		color: #7E7E7E;
	}

	/* Адаптивность */
	@media (max-width: 768px) {
		.note-card {
			padding: 14px;
			min-height: 160px;
		}

		.note-card__title {
			font-size: 15px;
		}

		.note-card__preview {
			font-size: 12px;
		}

		.editor-avatar {
			width: 22px;
			height: 22px;
		}
	}

	@media (max-width: 480px) {
		.note-card {
			padding: 12px;
			min-height: 140px;
		}

		.note-card__title {
			font-size: 14px;
		}

		.note-card__meta {
			gap: 10px;
		}

		.note-card__word-count {
			font-size: 10px;
		}
		
		.note-card__date {
			font-size: 10px;
		}
	}
</style>

