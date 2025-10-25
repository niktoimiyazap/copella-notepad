# Примеры использования API Управления Пользователями

## Пример 1: Кнопка управления в комнате

```svelte
<script lang="ts">
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  export let roomId: string;
  
  function handleOpenUserManagement() {
    openAllUsersWidget(roomId, {
      onUpdate: (user) => {
        console.log(`Права пользователя ${user.fullName} обновлены`);
      },
      onClose: () => {
        console.log('Панель управления закрыта');
      }
    });
  }
</script>

<button class="manage-users-btn" on:click={handleOpenUserManagement}>
  👥 Управление пользователями
</button>

<style>
  .manage-users-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }
</style>
```

## Пример 2: Контекстное меню для пользователя

```svelte
<script lang="ts">
  import { openSingleUserWidget } from '$lib/api/user-management/widget-controller';
  import type { UserManagementUser } from '$lib/api/user-management';
  
  export let user: UserManagementUser;
  export let roomId: string;
  
  let showMenu = false;
  
  function handleManageUser() {
    openSingleUserWidget(roomId, user.id, {
      onUpdate: (updatedUser) => {
        // Обновить локальные данные пользователя
        user = updatedUser;
      }
    });
    showMenu = false;
  }
</script>

<div class="user-card">
  <img src={user.avatarUrl} alt={user.fullName} />
  <span>{user.fullName}</span>
  
  <button on:click={() => showMenu = !showMenu}>⋮</button>
  
  {#if showMenu}
    <div class="menu">
      <button on:click={handleManageUser}>
        ⚙️ Настроить права
      </button>
    </div>
  {/if}
</div>
```

## Пример 3: Интеграция с таблицей пользователей

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getAllRoomUsers, type UserManagementUser } from '$lib/api/user-management';
  import { openSingleUserWidget } from '$lib/api/user-management/widget-controller';
  
  export let roomId: string;
  
  let users: UserManagementUser[] = [];
  let loading = true;
  
  onMount(async () => {
    const response = await getAllRoomUsers(roomId);
    if (response.success && response.users) {
      users = response.users;
    }
    loading = false;
  });
  
  function handleEditUser(userId: string) {
    openSingleUserWidget(roomId, userId, {
      onUpdate: (updatedUser) => {
        // Обновить пользователя в таблице
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
          users[index] = updatedUser;
          users = [...users];
        }
      }
    });
  }
</script>

<div class="users-table">
  {#if loading}
    <p>Загрузка...</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Пользователь</th>
          <th>Роль</th>
          <th>Редактирование</th>
          <th>Приглашение</th>
          <th>Удаление</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {#each users as user}
          <tr>
            <td>
              <div class="user-cell">
                <img src={user.avatarUrl} alt={user.fullName} />
                <div>
                  <p>{user.fullName}</p>
                  <span>@{user.username}</span>
                </div>
              </div>
            </td>
            <td>
              <span class="role-badge role-{user.role}">
                {user.role}
              </span>
            </td>
            <td>{user.permissions.canEdit ? '✅' : '❌'}</td>
            <td>{user.permissions.canInvite ? '✅' : '❌'}</td>
            <td>{user.permissions.canDelete ? '✅' : '❌'}</td>
            <td>
              <button on:click={() => handleEditUser(user.id)}>
                Настроить
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>
```

## Пример 4: Использование с горячими клавишами

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  export let roomId: string;
  
  onMount(() => {
    function handleKeyPress(event: KeyboardEvent) {
      // Ctrl + U = открыть управление пользователями
      if (event.ctrlKey && event.key === 'u') {
        event.preventDefault();
        openAllUsersWidget(roomId);
      }
    }
    
    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  });
</script>

<div class="room-content">
  <p>Нажмите <kbd>Ctrl + U</kbd> для управления пользователями</p>
  <!-- Остальной контент комнаты -->
</div>
```

## Пример 5: Автоматическое обновление при изменениях

```svelte
<script lang="ts">
  import { writable } from 'svelte/store';
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  import type { UserManagementUser } from '$lib/api/user-management';
  
  export let roomId: string;
  
  const usersStore = writable<UserManagementUser[]>([]);
  
  function handleOpenWithSync() {
    openAllUsersWidget(roomId, {
      onUpdate: (updatedUser) => {
        // Автоматически синхронизировать изменения
        usersStore.update(users => {
          const index = users.findIndex(u => u.id === updatedUser.id);
          if (index !== -1) {
            users[index] = updatedUser;
            return [...users];
          }
          return users;
        });
        
        // Можно также отправить уведомление
        showNotification(`Права пользователя ${updatedUser.fullName} обновлены`);
      }
    });
  }
  
  function showNotification(message: string) {
    // Ваша логика уведомлений
    console.log(message);
  }
</script>

<button on:click={handleOpenWithSync}>
  Управление с синхронизацией
</button>

<div class="users-list">
  {#each $usersStore as user}
    <div class="user-item">
      {user.fullName} - {user.role}
    </div>
  {/each}
</div>
```

## Пример 6: Использование с правами доступа

```svelte
<script lang="ts">
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  import { getUserRoomPermissions } from '$lib/permissions';
  
  export let roomId: string;
  export let currentUserId: string;
  
  let canManageUsers = false;
  
  async function checkPermissions() {
    const { permissions } = await getUserRoomPermissions(currentUserId, roomId);
    canManageUsers = permissions.canManageRoom || permissions.isOwner;
  }
  
  function handleOpenManagement() {
    if (!canManageUsers) {
      alert('У вас нет прав для управления пользователями');
      return;
    }
    
    openAllUsersWidget(roomId);
  }
  
  $: checkPermissions();
</script>

{#if canManageUsers}
  <button on:click={handleOpenManagement}>
    Управление пользователями
  </button>
{:else}
  <p>Только администраторы могут управлять пользователями</p>
{/if}
```

## Пример 7: Прямое использование API без UI

```typescript
import {
  getAllRoomUsers,
  updateUserPermissions,
  removeUserFromRoom
} from '$lib/api/user-management';

// Массовое обновление прав
async function grantEditPermissionsToAll(roomId: string) {
  const response = await getAllRoomUsers(roomId);
  
  if (response.success && response.users) {
    for (const user of response.users) {
      if (user.role === 'participant') {
        await updateUserPermissions({
          roomId,
          userId: user.id,
          permissions: {
            canEdit: true,
            canInvite: user.permissions.canInvite,
            canDelete: user.permissions.canDelete
          }
        });
      }
    }
  }
}

// Удалить неактивных пользователей
async function removeInactiveUsers(roomId: string, daysInactive: number) {
  const response = await getAllRoomUsers(roomId);
  
  if (response.success && response.users) {
    const now = new Date();
    
    for (const user of response.users) {
      if (user.role !== 'creator') {
        const lastSeen = new Date(user.lastSeen);
        const daysSinceLastSeen = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastSeen > daysInactive) {
          await removeUserFromRoom(roomId, user.id);
        }
      }
    }
  }
}
```

## Пример 8: Встраивание в модальное окно

```svelte
<script lang="ts">
  import { widgetStore } from '$lib/api/user-management/widget-controller';
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  export let roomId: string;
  let showModal = false;
  
  function handleOpenInModal() {
    showModal = true;
    openAllUsersWidget(roomId, {
      onClose: () => {
        showModal = false;
      }
    });
  }
</script>

<button on:click={handleOpenInModal}>
  Открыть в модальном окне
</button>

{#if showModal}
  <div class="modal-overlay" on:click={() => showModal = false}>
    <div class="modal-content" on:click|stopPropagation>
      <!-- Виджет автоматически отобразится здесь -->
    </div>
  </div>
{/if}
```

