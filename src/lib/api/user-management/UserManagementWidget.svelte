<script lang="ts">
  import { onMount } from 'svelte';
  import { fly, fade } from 'svelte/transition';
  import type { UserManagementConfig, UserManagementUser } from './types';
  import { getAllRoomUsers, getRoomUser, updateUserPermissions, removeUserFromRoom } from './api';

  // Пропсы
  export let config: UserManagementConfig;
  export let isOpen = false;

  // Состояние
  let users: UserManagementUser[] = [];
  let selectedUser: UserManagementUser | null = null;
  let loading = false;
  let error = '';
  let position = config.initialPosition || { x: 100, y: 100 };
  let size = { width: 360, height: 480 };
  let isDragging = false;
  let dragOffset = { x: 0, y: 0 };
  let isResizing = false;
  let resizeDirection = '';
  let resizeStart = { x: 0, y: 0, width: 0, height: 0, posX: 0, posY: 0 };

  // Обновляем позицию при изменении config
  $: if (config.initialPosition) {
    position = config.initialPosition;
  }

  // Минимальные и максимальные размеры
  const MIN_WIDTH = 320;
  const MAX_WIDTH = 600;
  const MIN_HEIGHT = 400;
  const MAX_HEIGHT = 800;

  // Загрузка данных
  async function loadData() {
    loading = true;
    error = '';

    try {
      if (config.mode === 'all-users') {
        const response = await getAllRoomUsers(config.roomId);
        if (response.success && response.users) {
          users = response.users;
        } else {
          error = response.error || 'Ошибка загрузки пользователей';
        }
      } else if (config.mode === 'single-user' && config.userId) {
        const response = await getRoomUser(config.roomId, config.userId);
        if (response.success && response.user) {
          selectedUser = response.user;
        } else {
          error = response.error || 'Ошибка загрузки пользователя';
        }
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Неизвестная ошибка';
    } finally {
      loading = false;
    }
  }

  // Обновление прав
  async function updatePermissions(userId: string, permissions: any) {
    loading = true;
    error = '';

    try {
      const response = await updateUserPermissions({
        userId,
        roomId: config.roomId,
        permissions,
      });

      if (response.success) {
        if (response.user) {
          if (config.mode === 'single-user') {
            selectedUser = response.user;
          } else {
            const index = users.findIndex(u => u.id === userId);
            if (index !== -1) {
              users[index] = response.user;
              users = [...users]; // Триггер реактивности
            }
          }
          config.onUpdate?.(response.user);
        }
      } else {
        error = response.error || 'Ошибка обновления прав';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Неизвестная ошибка';
    } finally {
      loading = false;
    }
  }

  // Удаление пользователя
  async function removeUser(userId: string) {
    if (!confirm('Удалить пользователя из комнаты?')) return;

    loading = true;
    error = '';

    try {
      const response = await removeUserFromRoom(config.roomId, userId);
      if (response.success) {
        users = users.filter(u => u.id !== userId);
      } else {
        error = response.error || 'Ошибка удаления пользователя';
      }
    } catch (e) {
      error = e instanceof Error ? e.message : 'Неизвестная ошибка';
    } finally {
      loading = false;
    }
  }

  // Перетаскивание
  function startDrag(e: MouseEvent) {
    if ((e.target as HTMLElement).closest('.widget-content')) return;
    if ((e.target as HTMLElement).closest('.resize-handle')) return;
    isDragging = true;
    dragOffset = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  }

  function onDrag(e: MouseEvent) {
    if (isDragging) {
    position = {
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y,
    };
    } else if (isResizing) {
      handleResize(e);
    }
  }

  function stopDrag() {
    isDragging = false;
    isResizing = false;
    resizeDirection = '';
  }

  // Изменение размера
  function startResize(e: MouseEvent, direction: string) {
    e.stopPropagation();
    isResizing = true;
    resizeDirection = direction;
    resizeStart = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
      posX: position.x,
      posY: position.y
    };
  }

  function handleResize(e: MouseEvent) {
    if (!isResizing) return;

    const deltaX = e.clientX - resizeStart.x;
    const deltaY = e.clientY - resizeStart.y;

    let newWidth = resizeStart.width;
    let newHeight = resizeStart.height;
    let newX = resizeStart.posX;
    let newY = resizeStart.posY;

    // Изменение по горизонтали
    if (resizeDirection.includes('right')) {
      newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStart.width + deltaX));
    } else if (resizeDirection.includes('left')) {
      const potentialWidth = resizeStart.width - deltaX;
      if (potentialWidth >= MIN_WIDTH && potentialWidth <= MAX_WIDTH) {
        newWidth = potentialWidth;
        newX = resizeStart.posX + deltaX;
      }
    }

    // Изменение по вертикали
    if (resizeDirection.includes('bottom')) {
      newHeight = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, resizeStart.height + deltaY));
    } else if (resizeDirection.includes('top')) {
      const potentialHeight = resizeStart.height - deltaY;
      if (potentialHeight >= MIN_HEIGHT && potentialHeight <= MAX_HEIGHT) {
        newHeight = potentialHeight;
        newY = resizeStart.posY + deltaY;
      }
    }

    size = { width: newWidth, height: newHeight };
    position = { x: newX, y: newY };
  }

  function handleKeyDown(e: KeyboardEvent) {
    // Позволяем использовать Enter/Space для начала перетаскивания
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
    }
  }

  function closeWidget() {
    isOpen = false;
    config.onClose?.();
  }

  onMount(() => {
    if (isOpen) {
      loadData();
    }
  });

  $: if (isOpen) {
    loadData();
  }
</script>

<svelte:window on:mousemove={onDrag} on:mouseup={stopDrag} />

{#if isOpen}
  <div
    class="user-management-widget"
    style="left: {position.x}px; top: {position.y}px; width: {size.width}px; height: {size.height}px;"
    transition:fade={{ duration: 200 }}
  >
    <div class="widget-header" on:mousedown={startDrag} on:keydown={handleKeyDown} role="button" tabindex="0">
      <h3>
        {config.mode === 'all-users' ? 'Управление пользователями' : 'Настройки пользователя'}
      </h3>
      <button class="close-btn" on:click={closeWidget}>×</button>
    </div>

    <div class="widget-content">
      {#if loading}
        <div class="loading">
          <div class="spinner"></div>
          <p>Загрузка...</p>
        </div>
      {:else if error}
        <div class="error">
          <p>{error}</p>
          <button on:click={loadData}>Повторить</button>
        </div>
      {:else if config.mode === 'all-users'}
        <div class="users-list">
          {#each users as user (user.id)}
            <div class="user-item" transition:fly={{ y: 20, duration: 200 }}>
              <div class="user-info">
                <div class="user-avatar">
                  {#if user.avatarUrl}
                    <img src={user.avatarUrl} alt={user.fullName} />
                  {:else}
                    <div class="avatar-placeholder">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  {/if}
                  {#if user.isOnline}
                    <span class="online-indicator"></span>
                  {/if}
                </div>
                <div class="user-details">
                  <p class="user-name">{user.fullName}</p>
                  <p class="user-username">@{user.username}</p>
                  <span class="user-role role-{user.role}">
                    {user.role === 'creator' ? 'Создатель' : user.role === 'admin' ? 'Админ' : 'Участник'}
                  </span>
                </div>
              </div>

              {#if user.role !== 'creator'}
                <div class="user-permissions">
                  <label>
                    <input
                      type="checkbox"
                      checked={user.permissions.canEdit}
                      on:change={(e) => updatePermissions(user.id, { 
                        ...user.permissions, 
                        canEdit: e.currentTarget.checked 
                      })}
                      disabled={loading}
                    />
                    <span>Редактирование</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={user.permissions.canInvite}
                      on:change={(e) => updatePermissions(user.id, { 
                        ...user.permissions, 
                        canInvite: e.currentTarget.checked 
                      })}
                      disabled={loading}
                    />
                    <span>Приглашение</span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={user.permissions.canDelete}
                      on:change={(e) => updatePermissions(user.id, { 
                        ...user.permissions, 
                        canDelete: e.currentTarget.checked 
                      })}
                      disabled={loading}
                    />
                    <span>Удаление</span>
                  </label>
                </div>

                <button class="remove-btn" on:click={() => removeUser(user.id)}>
                  Удалить
                </button>
              {/if}
            </div>
          {/each}
        </div>
      {:else if selectedUser}
        <div class="single-user-view">
          <div class="user-header">
            <div class="user-avatar large">
              {#if selectedUser.avatarUrl}
                <img src={selectedUser.avatarUrl} alt={selectedUser.fullName} />
              {:else}
                <div class="avatar-placeholder">
                  {selectedUser.fullName.charAt(0).toUpperCase()}
                </div>
              {/if}
              {#if selectedUser.isOnline}
                <span class="online-indicator"></span>
              {/if}
            </div>
            <div class="user-details">
              <h4>{selectedUser.fullName}</h4>
              <p>@{selectedUser.username}</p>
              <span class="user-role role-{selectedUser.role}">
                {selectedUser.role === 'creator' ? 'Создатель' : selectedUser.role === 'admin' ? 'Админ' : 'Участник'}
              </span>
            </div>
          </div>

          {#if selectedUser.role !== 'creator'}
            <div class="permissions-section">
              <h5>Права доступа</h5>
              <div class="permission-toggles">
                <label class="permission-item">
                  <div class="permission-info">
                    <span class="permission-name">Редактирование</span>
                    <span class="permission-desc">Может редактировать заметки</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedUser.permissions.canEdit}
                    on:change={(e) => updatePermissions(selectedUser.id, { 
                      ...selectedUser.permissions, 
                      canEdit: e.currentTarget.checked 
                    })}
                    disabled={loading}
                  />
                </label>

                <label class="permission-item">
                  <div class="permission-info">
                    <span class="permission-name">Приглашение</span>
                    <span class="permission-desc">Может приглашать других пользователей</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedUser.permissions.canInvite}
                    on:change={(e) => updatePermissions(selectedUser.id, { 
                      ...selectedUser.permissions, 
                      canInvite: e.currentTarget.checked 
                    })}
                    disabled={loading}
                  />
                </label>

                <label class="permission-item">
                  <div class="permission-info">
                    <span class="permission-name">Удаление</span>
                    <span class="permission-desc">Может удалять заметки</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedUser.permissions.canDelete}
                    on:change={(e) => updatePermissions(selectedUser.id, { 
                      ...selectedUser.permissions, 
                      canDelete: e.currentTarget.checked 
                    })}
                    disabled={loading}
                  />
                </label>
              </div>

              <button class="danger-btn" on:click={() => removeUser(selectedUser.id)}>
                Удалить из комнаты
              </button>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <div class="widget-footer">
      <span class="api-version">МУП API v1.0</span>
    </div>

    <!-- Ручки изменения размера -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="resize-handle resize-right" on:mousedown={(e) => startResize(e, 'right')}></div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="resize-handle resize-bottom" on:mousedown={(e) => startResize(e, 'bottom')}></div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="resize-handle resize-left" on:mousedown={(e) => startResize(e, 'left')}></div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="resize-handle resize-top" on:mousedown={(e) => startResize(e, 'top')}></div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="resize-handle resize-corner resize-bottom-right" on:mousedown={(e) => startResize(e, 'bottom-right')}></div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="resize-handle resize-corner resize-bottom-left" on:mousedown={(e) => startResize(e, 'bottom-left')}></div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="resize-handle resize-corner resize-top-right" on:mousedown={(e) => startResize(e, 'top-right')}></div>
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="resize-handle resize-corner resize-top-left" on:mousedown={(e) => startResize(e, 'top-left')}></div>
  </div>
{/if}

<style>
  .user-management-widget {
    position: fixed;
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #dadce0;
    box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 320px;
    max-width: 600px;
    min-height: 400px;
    max-height: 800px;
  }

  .widget-header {
    padding: 12px 16px;
    background: #ffffff;
    border-bottom: 1px solid #dadce0;
    color: #202124;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: move;
    user-select: none;
  }

  .widget-header h3 {
    margin: 0;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #202124;
  }

  .close-btn {
    background: none;
    border: none;
    color: #5f6368;
    font-size: 20px;
    cursor: pointer;
    padding: 4px;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background 0.2s, color 0.2s;
  }

  .close-btn:hover {
    background: #f1f3f4;
    color: #202124;
  }

  .widget-content {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
  }

  .loading, .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 32px 20px;
    text-align: center;
  }

  .loading p, .error p {
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    color: #5f6368;
  }

  .spinner {
    width: 32px;
    height: 32px;
    border: 2px solid #e1e5e9;
    border-top: 2px solid #1a73e8;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 12px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .error p {
    color: #d93025;
    margin-bottom: 12px;
  }

  .error button {
    padding: 8px 16px;
    background: #1a73e8;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 500;
    font-size: 14px;
    transition: background 0.2s;
  }

  .error button:hover {
    background: #1765cc;
  }

  .users-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .user-item {
    background: #f8f9fa;
    border: 1px solid #e8eaed;
    border-radius: 8px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: box-shadow 0.2s;
  }

  .user-item:hover {
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3);
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .user-avatar {
    position: relative;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;
    border: 1px solid #e8eaed;
  }

  .user-avatar.large {
    width: 64px;
    height: 64px;
  }

  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: #1a73e8;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 500;
    font-size: 16px;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .online-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 10px;
    height: 10px;
    background: #34a853;
    border: 2px solid white;
    border-radius: 50%;
  }

  .user-details {
    flex: 1;
    min-width: 0;
  }

  .user-name {
    margin: 0;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 500;
    font-size: 14px;
    color: #202124;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-username {
    margin: 2px 0;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    color: #5f6368;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .user-role {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .role-creator {
    background: #fef7e0;
    color: #ea8600;
  }

  .role-admin {
    background: #e8f0fe;
    color: #1967d2;
  }

  .role-participant {
    background: #e6f4ea;
    color: #137333;
  }

  .user-permissions {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 4px 0;
  }

  .user-permissions label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    color: #202124;
  }

  .user-permissions label span {
    user-select: none;
  }

  .user-permissions input[type="checkbox"] {
    cursor: pointer;
    width: 16px;
    height: 16px;
  }

  .remove-btn {
    padding: 6px 12px;
    background: transparent;
    color: #d93025;
    border: 1px solid #d93025;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 500;
    align-self: flex-start;
    transition: all 0.2s;
  }

  .remove-btn:hover {
    background: #d93025;
    color: white;
  }

  .single-user-view {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .user-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e8eaed;
  }

  .user-header h4 {
    margin: 0 0 4px;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 16px;
    font-weight: 500;
    color: #202124;
  }

  .user-header p {
    margin: 0 0 6px;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    color: #5f6368;
  }

  .permissions-section h5 {
    margin: 0 0 12px;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 13px;
    font-weight: 500;
    color: #5f6368;
    text-transform: uppercase;
    letter-spacing: 0.8px;
  }

  .permission-toggles {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 16px;
  }

  .permission-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 12px;
    background: #f8f9fa;
    border: 1px solid #e8eaed;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .permission-item:hover {
    background: #f1f3f4;
    box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3);
  }

  .permission-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .permission-name {
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 500;
    font-size: 13px;
    color: #202124;
  }

  .permission-desc {
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12px;
    color: #5f6368;
  }

  .permission-item input[type="checkbox"] {
    cursor: pointer;
    width: 18px;
    height: 18px;
  }

  .danger-btn {
    width: 100%;
    padding: 10px;
    background: transparent;
    color: #d93025;
    border: 1px solid #d93025;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 500;
    font-size: 14px;
    transition: all 0.2s;
  }

  .danger-btn:hover {
    background: #d93025;
    color: white;
  }

  /* Скроллбар */
  .widget-content::-webkit-scrollbar {
    width: 8px;
  }

  .widget-content::-webkit-scrollbar-track {
    background: transparent;
  }

  .widget-content::-webkit-scrollbar-thumb {
    background: #dadce0;
    border-radius: 4px;
  }

  .widget-content::-webkit-scrollbar-thumb:hover {
    background: #bdc1c6;
  }

  /* Футер */
  .widget-footer {
    padding: 8px 16px;
    background: #f8f9fa;
    border-top: 1px solid #e8eaed;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .api-version {
    font-family: 'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 11px;
    font-weight: 400;
    color: #5f6368;
    letter-spacing: 0.3px;
  }

  /* Ручки изменения размера */
  .resize-handle {
    position: absolute;
    background: transparent;
    z-index: 10;
  }

  .resize-right {
    right: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: ew-resize;
  }

  .resize-left {
    left: 0;
    top: 0;
    bottom: 0;
    width: 6px;
    cursor: ew-resize;
  }

  .resize-bottom {
    left: 0;
    right: 0;
    bottom: 0;
    height: 6px;
    cursor: ns-resize;
  }

  .resize-top {
    left: 0;
    right: 0;
    top: 0;
    height: 6px;
    cursor: ns-resize;
  }

  .resize-corner {
    width: 12px;
    height: 12px;
  }

  .resize-bottom-right {
    right: 0;
    bottom: 0;
    cursor: nwse-resize;
  }

  .resize-bottom-left {
    left: 0;
    bottom: 0;
    cursor: nesw-resize;
  }

  .resize-top-right {
    right: 0;
    top: 0;
    cursor: nesw-resize;
  }

  .resize-top-left {
    left: 0;
    top: 0;
    cursor: nwse-resize;
  }

  /* Видимая индикация при наведении */
  .resize-handle:hover {
    background: rgba(26, 115, 232, 0.1);
  }

  .resize-corner:hover::after {
    content: '';
    position: absolute;
    width: 8px;
    height: 8px;
    background: #1a73e8;
    border-radius: 2px;
    opacity: 0.6;
  }

  .resize-bottom-right:hover::after {
    right: 2px;
    bottom: 2px;
  }

  .resize-bottom-left:hover::after {
    left: 2px;
    bottom: 2px;
  }

  .resize-top-right:hover::after {
    right: 2px;
    top: 2px;
  }

  .resize-top-left:hover::after {
    left: 2px;
    top: 2px;
  }
</style>

