<script lang="ts">
  /**
   * Контейнер для виджета управления пользователями.
   * Добавьте этот компонент в корень вашего приложения (например, в +layout.svelte)
   */
  import { widgetStore } from './widget-controller';
  import UserManagementWidget from './UserManagementWidget.svelte';
  
  $: isOpen = $widgetStore.isOpen;
  $: config = $widgetStore.config;
</script>

{#if config}
  <UserManagementWidget {config} bind:isOpen />
{/if}

