<script lang="ts">
	interface Participant {
		id: string;
		roomId: string;
		userId: string;
		joinedAt: Date | string;
		lastSeen: Date | string;
		isOnline: boolean;
		user: {
			id: string;
			username: string;
			fullName: string;
			avatarUrl?: string;
		};
	}

	interface Props {
		participants: Participant[];
		onParticipantClick?: (participantId: string) => void;
		isCollapsed: boolean;
	}

	let { participants, onParticipantClick, isCollapsed }: Props = $props();

</script>

<div class="participants-section">
	{#if !isCollapsed}
		<h3 class="section-title">Участники</h3>
	{/if}
	<div class="participants-list">
		{#each participants as participant, index (participant.id)}
			<div 
				class="participant-item" 
				class:collapsed={isCollapsed}
				onclick={() => onParticipantClick?.(participant.id)}
			>
				<div class="participant-avatar">
					{#if participant.isOnline}
						<div class="online-indicator"></div>
					{/if}
				</div>
				{#if !isCollapsed}
					<span class="participant-nickname">{participant.user.username}</span>
				{/if}
			</div>
		{/each}
	</div>
</div>

<style>
	.participants-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
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

	.participants-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.participant-item {
		display: flex;
		align-items: center;
		gap: 12px;
		cursor: pointer;
		padding: 12px;
		border-radius: 12px;
		background-color: #242424;
		position: relative;
		overflow: hidden;
		
		/* Оптимизированные анимации - только transform и opacity */
		transition: 
			background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.participant-item:hover {
		background-color: #2A2A2A;
		transform: translateY(-1px);
	}

	.participant-item.collapsed {
		justify-content: center;
		gap: 0;
		padding: 8px;
		width: 40px;
		height: 40px;
		position: relative;
		background-color: transparent;
		/* Плавный переход для layout изменений */
		transition: 
			background-color 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			padding 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			gap 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.participant-avatar {
		width: 36px;
		height: 36px;
		background-color: #2A2A2A;
		border-radius: 50%;
		border: 2px solid #3A3A3A;
		flex-shrink: 0;
		position: relative;
		
		/* Оптимизированные анимации для аватара */
		transition: 
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.online-indicator {
		position: absolute;
		bottom: -2px;
		right: -2px;
		width: 12px;
		height: 12px;
		background-color: #40FF56;
		border-radius: 50%;
		border: 2px solid #1A1A1A;
		box-shadow: 0 0 0 1px #40FF56;
		animation: pulse 2s infinite;
		
		/* Плавные анимации для индикатора */
		transition: 
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@keyframes pulse {
		0% {
			box-shadow: 0 0 0 0 rgba(64, 255, 86, 0.7);
		}
		70% {
			box-shadow: 0 0 0 4px rgba(64, 255, 86, 0);
		}
		100% {
			box-shadow: 0 0 0 0 rgba(64, 255, 86, 0);
		}
	}

	.participant-item.collapsed .participant-avatar {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		width: 32px;
		height: 32px;
		/* Плавный переход для позиционирования */
		transition: 
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			left 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			top 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.participant-item.collapsed .online-indicator {
		width: 10px;
		height: 10px;
		bottom: -1px;
		right: -1px;
		border-width: 1px;
		/* Плавные переходы для мини режима */
		transition: 
			width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			height 0.3s cubic-bezier(0.4, 0, 0.2, 1),
			transform 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.participant-nickname {
		font-family: 'Gilroy', sans-serif;
		font-weight: 600;
		font-size: 14px;
		line-height: 1.2;
		color: #7E7E7E;
		text-align: left;
		
		/* Плавные анимации для текста */
		transition: 
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
			width 0.2s cubic-bezier(0.4, 0, 0.2, 1) 0.1s,
			color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.participant-item.collapsed .participant-nickname {
		opacity: 0;
		width: 0;
		overflow: hidden;
		transition: 
			opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			width 0.2s cubic-bezier(0.4, 0, 0.2, 1),
			color 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}

	.participant-item:hover .participant-nickname {
		color: #FFFFFF;
	}


	/* Адаптивность для мобильных устройств */
	@media (max-width: 768px) {
		.participants-list {
			flex-direction: row;
			gap: 12px;
			overflow-x: auto;
		}

		.participant-item {
			flex-shrink: 0;
			width: auto;
			height: auto;
			position: static;
		}

		.participant-avatar {
			position: static;
			transform: none;
		}

		.section-title {
			opacity: 1;
			width: auto;
			overflow: visible;
		}

		.participant-nickname {
			opacity: 1;
			width: auto;
			overflow: visible;
		}
	}
</style>
