<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { notifications } from '$lib/notifications';
	import NotificationToast from './NotificationToast.svelte';

	let notificationList = $state([]);

	onMount(() => {
		// Подписываемся на изменения уведомлений
		const unsubscribe = notifications.subscribe((notifications) => {
			notificationList = notifications;
		});

		// Инициализируем список
		notificationList = notifications.getAll();

		return unsubscribe;
	});

	function handleClose(id: string) {
		notifications.remove(id);
	}
</script>

<!-- Контейнер для уведомлений -->
<div class="notification-container">
	{#each notificationList as notification (notification.id)}
		<NotificationToast
			message={notification.message}
			type={notification.type}
			duration={notification.duration}
			onClose={() => handleClose(notification.id)}
		/>
	{/each}
</div>

<style>
	.notification-container {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 9999;
		pointer-events: none;
	}

	.notification-container > :global(*) {
		pointer-events: auto;
	}
</style>
