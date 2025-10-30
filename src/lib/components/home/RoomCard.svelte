<script lang="ts">
	import { currentUser } from '$lib/stores/user';
	import { getOptimizedRoomCover } from '$lib/utils/imageOptimization';

	// RoomCard component props
	interface Props {
		room: {
			id: string;
			name: string;
			image?: string;
			participants?: number;
			date?: string;
			isLarge?: boolean;
			isOwner?: string; // ID владельца комнаты
		};
		onClick?: (roomId: string) => void;
		onEdit?: (roomId: string) => void;
		onDelete?: (roomId: string) => void;
	}
	
	let { room, onClick, onEdit, onDelete }: Props = $props();
	
	// Состояние для анимации удаления
	let isDeleting = $state(false);
	
	// Состояние загрузки изображения
	let imageLoaded = $state(false);
	let imageError = $state(false);
	
	// Проверяем, является ли текущий пользователь владельцем комнаты
	let isUserOwner = $derived($currentUser?.id === room.isOwner);
	
	// Оптимизированный URL обложки (разный размер для обычных и больших карточек)
	const coverSize = $derived(room.isLarge ? 'medium' : 'small');
	const optimizedCoverUrl = $derived(getOptimizedRoomCover(room.image, coverSize));
	
	function handleClick() {
		onClick?.(room.id);
	}
	
	function handleEdit(event: Event) {
		event.stopPropagation();
		onEdit?.(room.id);
	}
	
	function handleDelete(event: Event) {
		event.stopPropagation();
		if (!isDeleting) {
			isDeleting = true;
			// Простая анимация удаления с задержкой
			setTimeout(() => {
				onDelete?.(room.id);
			}, 300);
		}
	}
	
	function handleImageLoad() {
		imageLoaded = true;
	}
	
	function handleImageError() {
		imageError = true;
	}
</script>

<div 
	class="room-card" 
	class:room-card--large={room.isLarge}
	class:room-card--deleting={isDeleting}
	role="button"
	tabindex={isDeleting ? -1 : 0}
	onclick={handleClick}
	onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && handleClick()}
>
	<!-- Карточка комнаты -->
	<div class="room-image-container">
		{#if optimizedCoverUrl && !imageError}
			<!-- Blur placeholder пока изображение загружается -->
			{#if !imageLoaded}
				<div class="room-image-skeleton"></div>
			{/if}
			<img 
				src={optimizedCoverUrl} 
				alt={room.name} 
				class="room-image"
				class:room-image--loaded={imageLoaded}
				loading="lazy"
				decoding="async"
				onload={handleImageLoad}
				onerror={handleImageError}
			/>
		{:else}
			<div class="room-image-placeholder">
				<img src="/icons/message-circle.svg" alt="Room" class="room-icon" />
			</div>
		{/if}
		
		<!-- Стеклянные панели позади информации -->
		{#if room.date}
			<div class="room-date">
				{room.date}
			</div>
		{/if}
		
		{#if room.participants !== undefined}
			<div class="room-participants">
				<img src="/icons/users.svg" alt="Participants" class="participants-icon" />
				<span>{room.participants}</span>
			</div>
		{/if}
		
		<!-- Стеклянная панель с кнопками действий (показываем только владельцу) -->
		{#if isUserOwner && (onEdit || onDelete)}
			<div class="room-actions">
				{#if onEdit}
					<button 
						class="action-button action-button--edit" 
						onclick={handleEdit}
						title="Редактировать комнату"
					>
						<img src="/icons/edit.svg" alt="Edit" class="action-icon" />
					</button>
				{/if}
				{#if onDelete}
					<button 
						class="action-button action-button--delete" 
						onclick={handleDelete}
						title="Удалить комнату"
					>
						<img src="/icons/trash.svg" alt="Delete" class="action-icon" />
					</button>
				{/if}
			</div>
		{/if}
		
		<!-- Заголовок снизу -->
		<div class="room-title-container">
			<h3 class="room-name">{room.name}</h3>
		</div>
	</div>
</div>


<style>
	.room-card {
		background: #1A1A1A;
		border-radius: 18px;
		cursor: pointer;
		transition: all 0.3s ease;
		overflow: hidden;
		border: 1px solid #2A2A2A;
		display: flex;
		flex-direction: column;
		width: 100%;
		text-align: left;
		position: relative;
		outline: none;
	}
	
	.room-card:focus-visible {
		border-color: #FEB1FF;
		box-shadow: 0 0 0 2px rgba(254, 177, 255, 0.2);
	}
	
	.room-card:hover {
		background: #242424;
		border-color: #404040;
	}
	
	.room-card--large {
		height: 392px;
	}
	
	.room-card:not(.room-card--large) {
		height: 180px;
	}
	
	.room-date {
		position: absolute;
		top: 12px;
		left: 12px;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(8px);
		border-radius: 12px;
		padding: 6px 10px;
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 11px;
		color: #ffffff;
		z-index: 2;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.room-image-container {
		flex: 1;
		position: relative;
		overflow: hidden;
	}
	
	.room-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.3s ease-in-out;
	}
	
	.room-image--loaded {
		opacity: 1;
	}
	
	.room-image-skeleton {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: linear-gradient(
			90deg,
			#1a1a1a 0%,
			#242424 50%,
			#1a1a1a 100%
		);
		background-size: 200% 100%;
		animation: shimmer 1.5s infinite;
	}
	
	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
	
	.room-image-placeholder {
		width: 100%;
		height: 100%;
		background: #222222;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.room-icon {
		width: 32px;
		height: 32px;
		opacity: 0.7;
		filter: brightness(0) invert(1);
	}
	
	.room-participants {
		position: absolute;
		top: 12px;
		right: 12px;
		display: flex;
		align-items: center;
		gap: 6px;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(8px);
		border-radius: 12px;
		padding: 6px 10px;
		z-index: 2;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.participants-icon {
		width: 14px;
		height: 14px;
		opacity: 0.8;
		filter: brightness(0) invert(1);
	}
	
	.room-participants span {
		font-family: 'Gilroy', sans-serif;
		font-weight: 500;
		font-size: 11px;
		color: #ffffff;
	}
	
	.room-title-container {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
		padding: 20px 16px 16px;
	}
	
	.room-name {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 18px;
		line-height: 1.3;
		color: #ffffff;
		margin: 0;
		text-align: left;
	}
	
	.room-card--large .room-name {
		font-size: 22px;
	}
	
	.room-card--large .room-title-container {
		padding: 24px 20px 20px;
	}
	
	.room-card--large .room-participants span {
		font-size: 12px;
	}
	
	.room-card--large .participants-icon {
		width: 16px;
		height: 16px;
	}
	
	
	/* Стеклянная панель с кнопками действий */
	.room-actions {
		position: absolute;
		bottom: 12px;
		right: 12px;
		display: flex;
		gap: 8px;
		background: rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(8px);
		border-radius: 12px;
		padding: 6px;
		z-index: 3;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}
	
	.action-button {
		background: transparent;
		border: none;
		border-radius: 10px;
		padding: 6px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
		position: relative;
	}
	
	.action-button:hover {
		background: rgba(255, 255, 255, 0.1);
	}
	
	.action-button:active {
		opacity: 0.8;
	}
	
	.action-button--edit:hover {
		background: rgba(59, 130, 246, 0.2);
	}
	
	.action-button--delete:hover {
		background: rgba(239, 68, 68, 0.2);
	}
	
	.action-icon {
		width: 14px;
		height: 14px;
		opacity: 0.8;
		filter: brightness(0) invert(1);
		transition: opacity 0.2s ease;
	}
	
	.action-button:hover .action-icon {
		opacity: 1;
	}
	
	/* Адаптация для больших карточек */
	.room-card--large .room-actions {
		bottom: 16px;
		right: 16px;
		padding: 8px;
		gap: 10px;
	}
	
	.room-card--large .action-button {
		padding: 8px;
	}
	
	.room-card--large .action-icon {
		width: 16px;
		height: 16px;
	}
	
	/* Состояние удаления */
	.room-card--deleting {
		pointer-events: none;
		opacity: 0;
		transform: scale(0.8);
		transition: all 0.3s ease;
	}
</style>

