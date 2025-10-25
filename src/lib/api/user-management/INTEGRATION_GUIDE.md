# 🔧 Руководство по интеграции API Управления Пользователями

Это руководство уже выполнено в вашем проекте! API готов к использованию.

## ✅ Что уже сделано

### 1. Контейнер добавлен в Layout
В файле `src/routes/+layout.svelte` уже добавлен:

```svelte
import { UserManagementContainer } from '$lib/api/user-management';

<!-- В конце файла -->
<UserManagementContainer />
```

### 2. Структура файлов создана
```
src/lib/api/user-management/
├── ✅ index.ts                       - Главный экспорт
├── ✅ types.ts                       - TypeScript типы
├── ✅ api.ts                         - API функции
├── ✅ widget-controller.ts           - Контроллер виджета
├── ✅ UserManagementWidget.svelte    - Компонент виджета
├── ✅ UserManagementContainer.svelte - Контейнер
├── ✅ demo.svelte                    - Демо-страница
├── ✅ README.md                      - Документация
├── ✅ EXAMPLES.md                    - Примеры
├── ✅ QUICKSTART.md                  - Быстрый старт
├── ✅ API_OVERVIEW.md                - Обзор API
└── ✅ INTEGRATION_GUIDE.md           - Этот файл
```

## 🚀 Как использовать

### Вариант 1: Кнопка "Управление пользователями"

Добавьте в любой компонент вашего приложения:

```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  // ID текущей комнаты (получите из props или store)
  export let roomId;
</script>

<button on:click={() => openAllUsersWidget(roomId)}>
  👥 Управление пользователями
</button>
```

### Вариант 2: Настройки конкретного пользователя

```svelte
<script>
  import { openSingleUserWidget } from '$lib/api/user-management/widget-controller';
  
  export let roomId;
  export let userId;
</script>

<button on:click={() => openSingleUserWidget(roomId, userId)}>
  ⚙️ Настроить права
</button>
```

### Вариант 3: С обработчиками событий

```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  function handleManageUsers() {
    openAllUsersWidget(roomId, {
      onUpdate: (user) => {
        console.log(`Права пользователя ${user.fullName} обновлены`);
        // Ваша логика обновления UI
      },
      onClose: () => {
        console.log('Панель управления закрыта');
      }
    });
  }
</script>

<button on:click={handleManageUsers}>
  Управление
</button>
```

## 💡 Примеры интеграции в существующие компоненты

### В компоненте комнаты

Найдите ваш компонент комнаты (например, `src/routes/rooms/[id]/+page.svelte`) и добавьте кнопку:

```svelte
<script lang="ts">
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  let { data } = $props();
  const roomId = data.room.id;
</script>

<!-- Где-то в вашем UI -->
<div class="room-header">
  <h1>{data.room.title}</h1>
  
  <!-- Добавьте эту кнопку -->
  <button 
    class="manage-users-btn"
    on:click={() => openAllUsersWidget(roomId)}
  >
    👥 Участники
  </button>
</div>

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

### В настройках комнаты

```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  export let roomId;
</script>

<div class="settings-section">
  <h3>Участники</h3>
  <p>Управляйте доступом пользователей к комнате</p>
  
  <button on:click={() => openAllUsersWidget(roomId)}>
    Управление участниками
  </button>
</div>
```

### В списке пользователей

```svelte
<script>
  import { openSingleUserWidget } from '$lib/api/user-management/widget-controller';
  
  export let users = [];
  export let roomId;
</script>

<div class="users-list">
  {#each users as user}
    <div class="user-item">
      <span>{user.fullName}</span>
      
      <!-- Кнопка настройки для каждого пользователя -->
      <button 
        on:click={() => openSingleUserWidget(roomId, user.id)}
      >
        ⚙️
      </button>
    </div>
  {/each}
</div>
```

## 🔑 Проверка прав доступа

Убедитесь, что только администраторы могут открывать виджет:

```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  import { getUserRoomPermissions } from '$lib/permissions';
  
  export let roomId;
  export let currentUserId;
  
  let canManage = $state(false);
  
  async function checkPermissions() {
    const { permissions } = await getUserRoomPermissions(currentUserId, roomId);
    canManage = permissions.canManageRoom || permissions.isOwner;
  }
  
  $effect(() => {
    checkPermissions();
  });
</script>

{#if canManage}
  <button on:click={() => openAllUsersWidget(roomId)}>
    Управление пользователями
  </button>
{:else}
  <p>Только администраторы могут управлять пользователями</p>
{/if}
```

## 🎯 Рекомендуемые места для добавления кнопок

### 1. Шапка комнаты
Добавьте кнопку "Участники" рядом с названием комнаты.

### 2. Меню комнаты
Если у вас есть выпадающее меню, добавьте пункт "Управление пользователями".

### 3. Список участников
Добавьте иконку настроек рядом с каждым участником.

### 4. Настройки комнаты
В разделе настроек добавьте секцию "Права доступа".

### 5. Контекстное меню
При правом клике на пользователя показывайте опцию "Настроить права".

## 🎨 Стилизация кнопок

### Стиль 1: Градиентная кнопка
```svelte
<button class="manage-btn-gradient">
  👥 Участники
</button>

<style>
  .manage-btn-gradient {
    padding: 10px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.2s;
  }
  
  .manage-btn-gradient:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
</style>
```

### Стиль 2: Иконка-кнопка
```svelte
<button class="manage-btn-icon" title="Управление пользователями">
  ⚙️
</button>

<style>
  .manage-btn-icon {
    width: 36px;
    height: 36px;
    padding: 0;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 50%;
    cursor: pointer;
    font-size: 16px;
    transition: all 0.2s;
  }
  
  .manage-btn-icon:hover {
    background: #edf2f7;
    transform: scale(1.1);
  }
</style>
```

### Стиль 3: Текстовая ссылка
```svelte
<button class="manage-btn-link">
  Управление участниками
</button>

<style>
  .manage-btn-link {
    background: none;
    border: none;
    color: #667eea;
    cursor: pointer;
    font-size: 14px;
    text-decoration: underline;
  }
  
  .manage-btn-link:hover {
    color: #5568d3;
  }
</style>
```

## 🧪 Тестирование

### Создайте демо-страницу

Создайте файл `src/routes/demo-users/+page.svelte`:

```svelte
<script>
  import Demo from '$lib/api/user-management/demo.svelte';
</script>

<Demo />
```

Затем откройте `http://localhost:5173/demo-users` для тестирования.

## 🐛 Решение проблем

### Виджет не открывается
1. Проверьте, что `UserManagementContainer` добавлен в `+layout.svelte`
2. Проверьте консоль браузера на ошибки
3. Убедитесь, что у вас правильный `roomId`

### Данные не загружаются
1. Проверьте, что API endpoints работают (`/api/rooms/[id]/participants`)
2. Проверьте токен авторизации в localStorage
3. Проверьте права доступа текущего пользователя

### Ошибка TypeScript
1. Убедитесь, что все типы импортированы
2. Проверьте версию TypeScript
3. Перезапустите dev server

## 📞 Поддержка

- **Документация:** [README.md](./README.md)
- **Примеры:** [EXAMPLES.md](./EXAMPLES.md)
- **Быстрый старт:** [QUICKSTART.md](./QUICKSTART.md)
- **API обзор:** [API_OVERVIEW.md](./API_OVERVIEW.md)

## ✨ Готово!

API полностью интегрирован и готов к использованию. Просто импортируйте функции и используйте их в любом месте вашего приложения!

```typescript
import { 
  openAllUsersWidget, 
  openSingleUserWidget 
} from '$lib/api/user-management/widget-controller';
```

Счастливого кодирования! 🚀

