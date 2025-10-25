<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		// Перенаправляем на главную страницу, так как без roomId страница пользователей не имеет смысла
		goto('/');
	});
</script>

<div class="redirect-message">
	<p>Перенаправление на главную страницу...</p>
</div>

<style>
	.redirect-message {
		display: flex;
		justify-content: center;
		align-items: center;
		height: 100vh;
		background: #f8f9fa;
		color: #202124;
		font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
</style>
