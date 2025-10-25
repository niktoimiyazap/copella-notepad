<script lang="ts">
  /**
   * Демо-страница для тестирования API управления пользователями
   * Используйте этот компонент для тестирования функциональности
   */
  import { onMount } from 'svelte';
  import { openAllUsersWidget, openSingleUserWidget } from './widget-controller';
  import { getAllRoomUsers, type UserManagementUser } from './index';
  
  // Демо-данные
  let roomId = '';
  let selectedUserId = '';
  let users: UserManagementUser[] = [];
  let loading = false;
  let message = '';
  
  async function loadUsers() {
    if (!roomId) {
      message = 'Введите ID комнаты';
      return;
    }
    
    loading = true;
    message = '';
    
    const response = await getAllRoomUsers(roomId);
    
    if (response.success && response.users) {
      users = response.users;
      message = `Загружено пользователей: ${users.length}`;
    } else {
      message = `Ошибка: ${response.error}`;
    }
    
    loading = false;
  }
  
  function handleOpenAllUsers() {
    if (!roomId) {
      alert('Введите ID комнаты');
      return;
    }
    
    openAllUsersWidget(roomId, {
      onUpdate: (user) => {
        console.log('Пользователь обновлен:', user);
        message = `Обновлен: ${user.fullName}`;
        
        // Обновляем в локальном списке
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          users[index] = user;
          users = [...users];
        }
      },
      onClose: () => {
        console.log('Виджет закрыт');
      }
    });
  }
  
  function handleOpenSingleUser() {
    if (!roomId || !selectedUserId) {
      alert('Введите ID комнаты и выберите пользователя');
      return;
    }
    
    openSingleUserWidget(roomId, selectedUserId, {
      onUpdate: (user) => {
        console.log('Пользователь обновлен:', user);
        message = `Обновлен: ${user.fullName}`;
        
        // Обновляем в локальном списке
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          users[index] = user;
          users = [...users];
        }
      }
    });
  }
</script>

<div class="demo-container">
  <div class="demo-header">
    <h1>🎯 Демо: API Управления Пользователями</h1>
    <p>Тестирование функциональности управления пользователями в комнатах</p>
  </div>
  
  <div class="demo-controls">
    <div class="control-group">
      <label for="room-id">ID Комнаты:</label>
      <input
        id="room-id"
        type="text"
        bind:value={roomId}
        placeholder="Введите ID комнаты"
      />
      <button on:click={loadUsers} disabled={loading}>
        {loading ? 'Загрузка...' : 'Загрузить пользователей'}
      </button>
    </div>
    
    {#if message}
      <div class="message" class:error={message.includes('Ошибка')}>
        {message}
      </div>
    {/if}
  </div>
  
  <div class="demo-actions">
    <h3>Действия:</h3>
    <div class="actions-grid">
      <div class="action-card">
        <h4>📋 Все пользователи</h4>
        <p>Открыть виджет со всеми пользователями комнаты</p>
        <button class="primary-btn" on:click={handleOpenAllUsers}>
          Открыть список пользователей
        </button>
      </div>
      
      <div class="action-card">
        <h4>👤 Один пользователь</h4>
        <p>Открыть виджет для управления конкретным пользователем</p>
        <select bind:value={selectedUserId}>
          <option value="">Выберите пользователя</option>
          {#each users as user}
            <option value={user.id}>{user.fullName} (@{user.username})</option>
          {/each}
        </select>
        <button class="secondary-btn" on:click={handleOpenSingleUser}>
          Открыть настройки пользователя
        </button>
      </div>
    </div>
  </div>
  
  {#if users.length > 0}
    <div class="demo-users">
      <h3>Загруженные пользователи ({users.length}):</h3>
      <div class="users-grid">
        {#each users as user}
          <div class="user-card">
            <div class="user-avatar">
              {#if user.avatarUrl}
                <img src={user.avatarUrl} alt={user.fullName} />
              {:else}
                <div class="avatar-placeholder">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
              {/if}
              {#if user.isOnline}
                <span class="online-badge">🟢</span>
              {/if}
            </div>
            
            <div class="user-info">
              <h4>{user.fullName}</h4>
              <p>@{user.username}</p>
              <span class="role-badge role-{user.role}">
                {user.role}
              </span>
            </div>
            
            <div class="user-permissions">
              <div class="permission">
                <span>✏️ Редактирование:</span>
                <strong>{user.permissions.canEdit ? '✅' : '❌'}</strong>
              </div>
              <div class="permission">
                <span>📨 Приглашение:</span>
                <strong>{user.permissions.canInvite ? '✅' : '❌'}</strong>
              </div>
              <div class="permission">
                <span>🗑️ Удаление:</span>
                <strong>{user.permissions.canDelete ? '✅' : '❌'}</strong>
              </div>
            </div>
            
            <button 
              class="manage-btn" 
              on:click={() => {
                selectedUserId = user.id;
                handleOpenSingleUser();
              }}
            >
              Управление
            </button>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <div class="demo-info">
    <h3>ℹ️ Информация</h3>
    <div class="info-grid">
      <div class="info-item">
        <strong>Режим "Все пользователи":</strong>
        <p>Показывает список всех пользователей с упрощенной регулировкой прав через чекбоксы</p>
      </div>
      <div class="info-item">
        <strong>Режим "Один пользователь":</strong>
        <p>Детальный просмотр и настройка прав конкретного пользователя</p>
      </div>
      <div class="info-item">
        <strong>Права доступа:</strong>
        <ul>
          <li>🖊️ Редактирование - может редактировать заметки</li>
          <li>📨 Приглашение - может приглашать других пользователей</li>
          <li>🗑️ Удаление - может удалять заметки</li>
        </ul>
      </div>
    </div>
  </div>
</div>

<style>
  .demo-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .demo-header {
    text-align: center;
    margin-bottom: 40px;
  }
  
  .demo-header h1 {
    font-size: 32px;
    margin-bottom: 12px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .demo-header p {
    color: #718096;
    font-size: 16px;
  }
  
  .demo-controls {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 32px;
  }
  
  .control-group {
    display: flex;
    gap: 12px;
    align-items: center;
  }
  
  .control-group label {
    font-weight: 600;
    color: #2d3748;
  }
  
  .control-group input {
    flex: 1;
    padding: 10px 16px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.2s;
  }
  
  .control-group input:focus {
    outline: none;
    border-color: #667eea;
  }
  
  .control-group button {
    padding: 10px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
  }
  
  .control-group button:hover:not(:disabled) {
    background: #5568d3;
  }
  
  .control-group button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .message {
    margin-top: 16px;
    padding: 12px;
    background: #f0fff4;
    border: 1px solid #9ae6b4;
    border-radius: 8px;
    color: #22543d;
  }
  
  .message.error {
    background: #fff5f5;
    border-color: #fc8181;
    color: #742a2a;
  }
  
  .demo-actions {
    margin-bottom: 32px;
  }
  
  .demo-actions h3 {
    margin-bottom: 16px;
    color: #2d3748;
  }
  
  .actions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .action-card {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .action-card h4 {
    margin: 0;
    color: #2d3748;
    font-size: 18px;
  }
  
  .action-card p {
    margin: 0;
    color: #718096;
    font-size: 14px;
  }
  
  .action-card select {
    padding: 10px;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
  }
  
  .primary-btn, .secondary-btn {
    padding: 12px 24px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
  }
  
  .primary-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
  }
  
  .primary-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
  
  .secondary-btn {
    background: #edf2f7;
    color: #2d3748;
  }
  
  .secondary-btn:hover {
    background: #e2e8f0;
  }
  
  .demo-users {
    margin-bottom: 32px;
  }
  
  .demo-users h3 {
    margin-bottom: 16px;
    color: #2d3748;
  }
  
  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }
  
  .user-card {
    background: white;
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .user-avatar {
    position: relative;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
    margin: 0 auto;
  }
  
  .user-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .avatar-placeholder {
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 24px;
  }
  
  .online-badge {
    position: absolute;
    bottom: 2px;
    right: 2px;
    font-size: 14px;
  }
  
  .user-info {
    text-align: center;
  }
  
  .user-info h4 {
    margin: 0 0 4px;
    color: #2d3748;
  }
  
  .user-info p {
    margin: 0 0 8px;
    color: #718096;
    font-size: 14px;
  }
  
  .role-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }
  
  .role-creator {
    background: #fef5e7;
    color: #f39c12;
  }
  
  .role-admin {
    background: #ebf4ff;
    color: #4299e1;
  }
  
  .role-participant {
    background: #f0fff4;
    color: #48bb78;
  }
  
  .user-permissions {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: #f7fafc;
    border-radius: 8px;
    font-size: 13px;
  }
  
  .permission {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .manage-btn {
    padding: 10px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: background 0.2s;
  }
  
  .manage-btn:hover {
    background: #5568d3;
  }
  
  .demo-info {
    background: #f7fafc;
    padding: 24px;
    border-radius: 12px;
  }
  
  .demo-info h3 {
    margin-bottom: 16px;
    color: #2d3748;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
  }
  
  .info-item {
    background: white;
    padding: 16px;
    border-radius: 8px;
  }
  
  .info-item strong {
    display: block;
    margin-bottom: 8px;
    color: #2d3748;
  }
  
  .info-item p {
    margin: 0;
    color: #718096;
    font-size: 14px;
  }
  
  .info-item ul {
    margin: 8px 0 0;
    padding-left: 20px;
    color: #718096;
    font-size: 14px;
  }
  
  .info-item li {
    margin-bottom: 4px;
  }
</style>

