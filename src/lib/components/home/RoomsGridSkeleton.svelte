<script lang="ts">
	import RoomSkeleton from './RoomSkeleton.svelte';
	
	// RoomsGridSkeleton component props
	interface Props {
		count?: number; // количество скелетон-карточек для отображения
		isVisible?: boolean; // видимость скелетона для плавного исчезновения
	}
	
	let { count = 8, isVisible = true }: Props = $props();
	
	// Создаем массив для рендеринга скелетон-карточек
	const skeletonRooms = Array.from({ length: count }, (_, i) => ({
		id: `skeleton-${i}`,
		isLarge: i === 0 // первая карточка большая
	}));
</script>

<div class="rooms-grid-skeleton">
	{#each skeletonRooms as room (room.id)}
		<RoomSkeleton isLarge={room.isLarge} />
	{/each}
</div>

<style>
	.rooms-grid-skeleton {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		grid-template-rows: repeat(3, 180px);
		gap: 32px;
		grid-template-areas: 
			"large small1 small2"
			"large small3 small4"
			"small5 small6 small7";
		flex: 1;
		padding: 40px;
	}
	
	.rooms-grid-skeleton :global(.room-skeleton--large) {
		grid-area: large;
	}
	
	/* Responsive adjustments - копируем стили из RoomsGrid */
	@media (max-width: 1400px) {
		.rooms-grid-skeleton {
			grid-template-columns: repeat(2, 1fr);
			grid-template-areas: 
				"large small1"
				"large small2"
				"small3 small4"
				"small5 small6"
				"small7 .";
		}
	}

	@media (max-width: 1024px) {
		.rooms-grid-skeleton {
			grid-template-columns: 1fr;
			grid-template-rows: auto;
			grid-template-areas: 
				"large"
				"small1"
				"small2"
				"small3"
				"small4"
				"small5"
				"small6"
				"small7";
			padding: 32px;
		}
		
		.rooms-grid-skeleton :global(.room-skeleton--large) {
			grid-area: large;
			height: 300px;
		}
		
		.rooms-grid-skeleton :global(.room-skeleton:not(.room-skeleton--large)) {
			height: 160px;
		}
	}

	@media (max-width: 768px) {
		.rooms-grid-skeleton {
			gap: 20px;
			padding: 24px;
		}
		
		.rooms-grid-skeleton :global(.room-skeleton--large) {
			height: 280px;
		}
		
		.rooms-grid-skeleton :global(.room-skeleton:not(.room-skeleton--large)) {
			height: 140px;
		}
	}

	@media (max-width: 480px) {
		.rooms-grid-skeleton {
			gap: 16px;
			padding: 20px;
		}
		
		.rooms-grid-skeleton :global(.room-skeleton--large) {
			height: 260px;
		}
		
		.rooms-grid-skeleton :global(.room-skeleton:not(.room-skeleton--large)) {
			height: 120px;
		}
	}
</style>
