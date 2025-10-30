<script lang="ts">
	import type { Note } from '$lib/notes';
	import NoteCard from './NoteCard.svelte';
	
	interface Props {
		notes: Array<Note & { 
			creator?: { 
				id: string; 
				username: string; 
				fullName: string; 
				avatarUrl?: string 
			} 
		}>;
		selectedNoteId?: string;
		canEdit?: boolean;
		onNoteClick?: (noteId: string) => void;
		onCreateNote?: () => void;
		activeEditorsMap?: Map<string, Array<{ id: string; username: string; fullName: string; avatarUrl?: string }>>;
	}

	let { 
		notes, 
		selectedNoteId, 
		canEdit = true, 
		onNoteClick, 
		onCreateNote,
		activeEditorsMap = new Map()
	}: Props = $props();
	
	function handleNoteClick(noteId: string) {
		onNoteClick?.(noteId);
	}
	
	function handleCreateClick() {
		onCreateNote?.();
	}
</script>

<div class="notes-grid">
	{#if notes.length === 0}
		<div class="notes-grid__empty">
			<div class="empty-state">
				<div class="empty-state__icon">
					<svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
						<polyline points="14 2 14 8 20 8"/>
						<line x1="12" y1="18" x2="12" y2="12"/>
						<line x1="9" y1="15" x2="15" y2="15"/>
					</svg>
				</div>
				<h2 class="empty-state__title">Заметок пока нет</h2>
				<p class="empty-state__description">
					{#if canEdit}
						Создайте первую заметку, чтобы начать работу
					{:else}
						У вас нет прав на создание заметок в этой комнате
					{/if}
				</p>
				{#if canEdit && onCreateNote}
					<button class="btn btn--primary" onclick={handleCreateClick}>
						<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M12 5v14M5 12h14"/>
						</svg>
						<span>Создать заметку</span>
					</button>
				{/if}
			</div>
		</div>
	{:else}
		<div class="notes-grid__header">
			<h2 class="notes-grid__title">Заметки</h2>
			{#if canEdit && onCreateNote}
				<button class="btn btn--secondary btn--sm" onclick={handleCreateClick}>
					<svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path d="M12 5v14M5 12h14"/>
					</svg>
					<span>Создать</span>
				</button>
			{/if}
		</div>
		
		<div class="notes-grid__cards">
			{#each notes as note (note.id)}
				<NoteCard 
					{note}
					isSelected={selectedNoteId === note.id}
					activeEditors={activeEditorsMap.get(note.id) || []}
					onClick={() => handleNoteClick(note.id)}
				/>
			{/each}
		</div>
	{/if}
</div>

<style>
	.notes-grid {
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		padding: 24px;
		background: #121212;
		overflow-y: auto;
	}

	.notes-grid__empty {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.empty-state {
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 20px;
		max-width: 400px;
		padding: 40px 20px;
	}

	.empty-state__icon {
		color: #7E7E7E;
		opacity: 0.5;
	}

	.empty-state__title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 22px;
		color: #FFFFFF;
		margin: 0;
	}

	.empty-state__description {
		font-family: 'Gilroy', sans-serif;
		font-weight: 400;
		font-size: 14px;
		color: #7E7E7E;
		margin: 0;
		line-height: 1.5;
	}

	.notes-grid__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 20px;
		gap: 16px;
	}

	.notes-grid__title {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 24px;
		color: #FFFFFF;
		margin: 0;
	}

	.notes-grid__cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 16px;
	}

	/* Адаптивность */
	@media (max-width: 1024px) {
		.notes-grid__cards {
			grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		}
	}

	@media (max-width: 768px) {
		.notes-grid {
			padding: 16px;
		}

		.notes-grid__header {
			margin-bottom: 16px;
		}

		.notes-grid__title {
			font-size: 20px;
		}

		.notes-grid__cards {
			grid-template-columns: 1fr;
			gap: 12px;
		}

		.empty-state {
			padding: 20px;
			gap: 16px;
		}

		.empty-state__title {
			font-size: 18px;
		}

		.empty-state__description {
			font-size: 13px;
		}
	}

	@media (max-width: 480px) {
		.notes-grid {
			padding: 12px;
		}

		.notes-grid__header {
			flex-direction: column;
			align-items: flex-start;
			gap: 12px;
		}

		.notes-grid__title {
			font-size: 18px;
		}
	}
</style>

