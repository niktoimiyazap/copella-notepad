# API Управления Пользователями

Полнофункциональный API для управления пользователями в комнатах с плавающим интерфейсом.

## Возможности

- ✅ Просмотр всех пользователей комнаты
- ✅ Управление правами отдельных пользователей
- ✅ Два режима: все пользователи или один пользователь
- ✅ Плавающее перетаскиваемое окно
- ✅ Упрощенная регулировка прав
- ✅ Удаление пользователей из комнаты
- ✅ Индикаторы онлайн-статуса

## Установка

### 1. Добавьте контейнер в корень приложения

В файле `src/routes/+layout.svelte`:

```svelte
<script>
  import { UserManagementContainer } from '$lib/api/user-management';
</script>

<slot />

<!-- Добавьте контейнер виджета -->
<UserManagementContainer />
```

## Использование

### Вариант 1: Все пользователи комнаты

```typescript
import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';

// Открыть виджет со всеми пользователями
openAllUsersWidget('room-id-123', {
  onUpdate: (user) => {
    console.log('Пользователь обновлен:', user);
  },
  onClose: () => {
    console.log('Виджет закрыт');
  }
});
```

### Вариант 2: Один пользователь

```typescript
import { openSingleUserWidget } from '$lib/api/user-management/widget-controller';

// Открыть виджет для конкретного пользователя
openSingleUserWidget('room-id-123', 'user-id-456', {
  onUpdate: (user) => {
    console.log('Права пользователя обновлены:', user);
  },
  onClose: () => {
    console.log('Виджет закрыт');
  }
});
```

### Вариант 3: Программное закрытие

```typescript
import { closeWidget } from '$lib/api/user-management/widget-controller';

// Закрыть виджет программно
closeWidget();
```

## Примеры использования в компонентах

### В Svelte компоненте

```svelte
<script>
  import { openAllUsersWidget, openSingleUserWidget } from '$lib/api/user-management/widget-controller';
  
  let roomId = 'current-room-id';
  
  function handleManageAllUsers() {
    openAllUsersWidget(roomId, {
      onUpdate: (user) => {
        // Обновить UI или данные
        console.log('Обновлен пользователь:', user);
      }
    });
  }
  
  function handleManageUser(userId) {
    openSingleUserWidget(roomId, userId, {
      onUpdate: (user) => {
        // Обновить конкретного пользователя в списке
      }
    });
  }
</script>

<button on:click={handleManageAllUsers}>
  Управление пользователями
</button>

<div class="user-list">
  {#each users as user}
    <div class="user">
      <span>{user.fullName}</span>
      <button on:click={() => handleManageUser(user.id)}>
        Настроить
      </button>
    </div>
  {/each}
</div>
```

### С использованием API функций напрямую

```typescript
import { 
  getAllRoomUsers, 
  getRoomUser, 
  updateUserPermissions,
  removeUserFromRoom 
} from '$lib/api/user-management';

// Получить всех пользователей
const response = await getAllRoomUsers('room-id-123');
if (response.success) {
  console.log('Пользователи:', response.users);
}

// Получить одного пользователя
const userResponse = await getRoomUser('room-id-123', 'user-id-456');
if (userResponse.success) {
  console.log('Пользователь:', userResponse.user);
}

// Обновить права пользователя
const updateResponse = await updateUserPermissions({
  roomId: 'room-id-123',
  userId: 'user-id-456',
  permissions: {
    canEdit: true,
    canInvite: false,
    canDelete: false
  }
});

// Удалить пользователя из комнаты
const removeResponse = await removeUserFromRoom('room-id-123', 'user-id-456');
```

## Типы

### UserManagementUser

```typescript
interface UserManagementUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  role: "creator" | "admin" | "participant";
  permissions: {
    canEdit: boolean;
    canInvite: boolean;
    canDelete: boolean;
  };
  isOnline: boolean;
  lastSeen: Date | string;
  joinedAt: Date | string;
}
```

### UserManagementConfig

```typescript
interface UserManagementConfig {
  mode: "all-users" | "single-user";
  roomId: string;
  userId?: string; // Требуется только для режима "single-user"
  onUpdate?: (user: UserManagementUser) => void;
  onClose?: () => void;
}
```

## API Функции

### `getAllRoomUsers(roomId: string)`

Получить всех пользователей комнаты с их правами.

**Возвращает:** `Promise<UserManagementApiResponse>`

### `getRoomUser(roomId: string, userId: string)`

Получить данные конкретного пользователя.

**Возвращает:** `Promise<UserManagementApiResponse>`

### `updateUserPermissions(request: UpdatePermissionsRequest)`

Обновить права или роль пользователя.

**Параметры:**
- `roomId: string` - ID комнаты
- `userId: string` - ID пользователя
- `permissions?: Partial<UserPermissions>` - Новые права (опционально)
- `role?: "admin" | "participant"` - Новая роль (опционально)

**Возвращает:** `Promise<UserManagementApiResponse>`

### `removeUserFromRoom(roomId: string, userId: string)`

Удалить пользователя из комнаты.

**Возвращает:** `Promise<UserManagementApiResponse>`

## Стилизация

Виджет использует встроенные стили, но вы можете их переопределить, используя CSS-переменные:

```css
:global(.user-management-widget) {
  --widget-primary: #667eea;
  --widget-danger: #fc8181;
  --widget-background: white;
  --widget-radius: 12px;
}
```

## Дополнительные возможности

- Виджет можно перетаскивать за заголовок
- Автоматическое обновление данных при открытии
- Индикаторы загрузки и ошибок
- Подтверждение при удалении пользователя
- Адаптивный дизайн

