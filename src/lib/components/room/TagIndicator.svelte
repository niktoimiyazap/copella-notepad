<script lang="ts">
	interface Props {
		tagColor: string;
		position?: { x: number; y: number };
	}

	let { tagColor, position = { x: 0, y: 0 } }: Props = $props();
</script>

<div 
	class="tag-indicator"
	style="left: {position.x}px; top: {position.y}px;"
>
	<div 
		class="tag-dot"
		style="background-color: {tagColor};"
	></div>
</div>

<style>
	.tag-indicator {
		position: absolute;
		z-index: 10;
		pointer-events: none;
	}

	.tag-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.4);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
	}
</style>
