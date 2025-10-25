# 📖 Как использовать API Управления Пользователями

## 🎯 Три простых шага

### 1️⃣ Импортируйте функцию
```typescript
import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
```

### 2️⃣ Добавьте кнопку
```svelte
<button on:click={() => openAllUsersWidget(roomId)}>
  Управление пользователями
</button>
```

### 3️⃣ Готово! 🎉

---

## 📋 Все доступные функции

### Открыть список всех пользователей
```typescript
openAllUsersWidget(roomId)
```

### Открыть настройки одного пользователя
```typescript
openSingleUserWidget(roomId, userId)
```

### Закрыть виджет
```typescript
closeWidget()
```

### Получить всех пользователей (без UI)
```typescript
const { users } = await getAllRoomUsers(roomId);
```

### Получить одного пользователя (без UI)
```typescript
const { user } = await getRoomUser(roomId, userId);
```

### Обновить права
```typescript
await updateUserPermissions({
  roomId,
  userId,
  permissions: { canEdit: true, canInvite: false }
});
```

### Удалить пользователя
```typescript
await removeUserFromRoom(roomId, userId);
```

---

## 💡 Реальные примеры

### Пример 1: Кнопка в шапке комнаты
```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  export let roomId;
</script>

<div class="room-header">
  <h1>Моя комната</h1>
  <button on:click={() => openAllUsersWidget(roomId)}>
    👥 Участники
  </button>
</div>
```

### Пример 2: Настройки пользователя
```svelte
<script>
  import { openSingleUserWidget } from '$lib/api/user-management/widget-controller';
  export let roomId, userId;
</script>

<button on:click={() => openSingleUserWidget(roomId, userId)}>
  ⚙️ Настроить
</button>
```

### Пример 3: С обработчиками
```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  function handleOpen() {
    openAllUsersWidget(roomId, {
      onUpdate: (user) => {
        console.log('Обновлен:', user.fullName);
      },
      onClose: () => {
        console.log('Закрыто');
      }
    });
  }
</script>

<button on:click={handleOpen}>Открыть</button>
```

---

## 🎨 Стили кнопок

### Градиент
```svelte
<button class="gradient">Управление</button>

<style>
  .gradient {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }
</style>
```

### Иконка
```svelte
<button class="icon-btn">⚙️</button>

<style>
  .icon-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: none;
    background: #f7fafc;
    cursor: pointer;
  }
</style>
```

---

## 🔒 С проверкой прав

```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  import { getUserRoomPermissions } from '$lib/permissions';
  
  export let roomId, userId;
  let canManage = $state(false);
  
  $effect(async () => {
    const { permissions } = await getUserRoomPermissions(userId, roomId);
    canManage = permissions.canManageRoom;
  });
</script>

{#if canManage}
  <button on:click={() => openAllUsersWidget(roomId)}>
    Управление
  </button>
{/if}
```

---

## 📚 Больше информации

- [README.md](./README.md) - Полная документация
- [QUICKSTART.md](./QUICKSTART.md) - Быстрый старт
- [EXAMPLES.md](./EXAMPLES.md) - Больше примеров
- [API_OVERVIEW.md](./API_OVERVIEW.md) - Обзор API
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - Гид по интеграции

---

## ❓ Часто задаваемые вопросы

### Как получить roomId?
```typescript
// Из props компонента
export let roomId;

// Из URL параметров
import { page } from '$app/stores';
const roomId = $page.params.id;

// Из data
let { data } = $props();
const roomId = data.room.id;
```

### Виджет не открывается?
1. Проверьте, что `UserManagementContainer` добавлен в `+layout.svelte`
2. Проверьте консоль на ошибки
3. Убедитесь, что roomId правильный

### Как стилизовать виджет?
Виджет использует встроенные стили. Для кастомизации переопределите CSS:

```css
:global(.user-management-widget) {
  /* Ваши стили */
}
```

---

**Готово к использованию!** 🚀

Просто импортируйте и используйте:

```typescript
import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
```

