<script lang="ts">
	// MentionHighlight component props
	interface Props {
		text: string;
		mentionType: 'background' | 'color' | 'highlight';
		value?: string;
		isActive?: boolean;
	}

	let { text, mentionType, value = '', isActive = false }: Props = $props();

	// Определяем стили в зависимости от типа упоминания
	let mentionStyles = $derived(() => {
		switch (mentionType) {
			case 'background':
				return {
					background: value || '#FEB1FF',
					color: '#000000',
					padding: '2px 6px',
					borderRadius: '4px'
				};
			case 'color':
				return {
					color: value || '#FEB1FF',
					background: 'transparent'
				};
			case 'highlight':
				return {
					background: value || 'rgba(254, 177, 255, 0.3)',
					color: '#FFFFFF',
					padding: '1px 3px',
					borderRadius: '2px'
				};
			default:
				return {};
		}
	});

	// Форматируем текст для отображения
	let displayText = $derived(() => {
		if (mentionType === 'background' && value) {
			return `@background(${value})`;
		} else if (mentionType === 'color' && value) {
			return `@color(${value})`;
		} else if (mentionType === 'highlight' && value) {
			return `@highlight(${value})`;
		}
		return text;
	});
</script>

<span 
	class="mention-highlight" 
	class:mention-highlight--active={isActive}
	style={mentionStyles()}
	title="Упоминание: {mentionType}"
>
	{displayText}
</span>

<style>
	.mention-highlight {
		display: inline-block;
		transition: all 0.2s ease;
		font-weight: 500;
		position: relative;
	}

	.mention-highlight--active {
		transform: scale(1.02);
		box-shadow: 0 0 0 2px rgba(254, 177, 255, 0.3);
	}

	.mention-highlight:hover {
		transform: scale(1.01);
		opacity: 0.9;
	}
</style>
