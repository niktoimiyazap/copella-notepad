# 📚 Обзор API Управления Пользователями

## 🎯 Что это?

Полнофункциональный API для управления пользователями в комнатах с красивым плавающим интерфейсом.

## ✨ Основные возможности

### 1. Плавающий виджет с двумя режимами
- **Все пользователи** - просмотр и управление всеми пользователями комнаты
- **Один пользователь** - детальные настройки конкретного пользователя

### 2. Функции управления
- ✅ Просмотр пользователей с правами
- ✅ Изменение прав (редактирование, приглашение, удаление)
- ✅ Изменение ролей (admin, participant)
- ✅ Удаление пользователей из комнаты
- ✅ Индикаторы онлайн-статуса

### 3. UI/UX
- 🎨 Современный дизайн с градиентами
- 🖱️ Перетаскиваемое окно
- 📱 Адаптивная верстка
- ⚡ Плавные анимации
- 🔄 Индикаторы загрузки

## 📦 Структура файлов

```
user-management/
├── 📄 index.ts                       - Главный экспортный файл
├── 📄 types.ts                       - TypeScript типы и интерфейсы
├── 📄 api.ts                         - API функции для работы с сервером
├── 📄 widget-controller.ts           - Контроллер управления виджетом
├── 🎨 UserManagementWidget.svelte    - Основной компонент виджета
├── 🎨 UserManagementContainer.svelte - Контейнер для виджета
├── 🎨 demo.svelte                    - Демо-страница с примерами
├── 📖 README.md                      - Полная документация
├── 📖 EXAMPLES.md                    - Примеры использования
├── 📖 QUICKSTART.md                  - Быстрый старт
└── 📖 API_OVERVIEW.md                - Этот файл
```

## 🔌 API Функции

### Функции виджета

#### `openAllUsersWidget(roomId, options?)`
Открывает виджет со всеми пользователями комнаты.

**Параметры:**
- `roomId: string` - ID комнаты
- `options?.onUpdate` - Callback при обновлении пользователя
- `options?.onClose` - Callback при закрытии виджета

**Пример:**
```typescript
openAllUsersWidget('room-123', {
  onUpdate: (user) => console.log('Updated:', user)
});
```

#### `openSingleUserWidget(roomId, userId, options?)`
Открывает виджет для конкретного пользователя.

**Параметры:**
- `roomId: string` - ID комнаты
- `userId: string` - ID пользователя
- `options?.onUpdate` - Callback при обновлении
- `options?.onClose` - Callback при закрытии

**Пример:**
```typescript
openSingleUserWidget('room-123', 'user-456', {
  onUpdate: (user) => console.log('Updated:', user)
});
```

#### `closeWidget()`
Программно закрывает открытый виджет.

**Пример:**
```typescript
closeWidget();
```

### API функции

#### `getAllRoomUsers(roomId)`
Получает всех пользователей комнаты с их правами.

**Возвращает:** `Promise<UserManagementApiResponse>`

**Пример:**
```typescript
const response = await getAllRoomUsers('room-123');
if (response.success) {
  console.log(response.users);
}
```

#### `getRoomUser(roomId, userId)`
Получает данные конкретного пользователя.

**Возвращает:** `Promise<UserManagementApiResponse>`

**Пример:**
```typescript
const response = await getRoomUser('room-123', 'user-456');
if (response.success) {
  console.log(response.user);
}
```

#### `updateUserPermissions(request)`
Обновляет права или роль пользователя.

**Параметры:**
```typescript
{
  roomId: string;
  userId: string;
  permissions?: {
    canEdit?: boolean;
    canInvite?: boolean;
    canDelete?: boolean;
  };
  role?: 'admin' | 'participant';
}
```

**Пример:**
```typescript
await updateUserPermissions({
  roomId: 'room-123',
  userId: 'user-456',
  permissions: { canEdit: true }
});
```

#### `removeUserFromRoom(roomId, userId)`
Удаляет пользователя из комнаты.

**Возвращает:** `Promise<UserManagementApiResponse>`

**Пример:**
```typescript
const response = await removeUserFromRoom('room-123', 'user-456');
if (response.success) {
  console.log('User removed');
}
```

## 📘 TypeScript типы

### `UserManagementUser`
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

### `UserManagementConfig`
```typescript
interface UserManagementConfig {
  mode: "all-users" | "single-user";
  roomId: string;
  userId?: string;
  onUpdate?: (user: UserManagementUser) => void;
  onClose?: () => void;
}
```

### `UserManagementApiResponse`
```typescript
interface UserManagementApiResponse {
  success: boolean;
  error?: string;
  user?: UserManagementUser;
  users?: UserManagementUser[];
}
```

## 🎨 Компоненты

### `UserManagementWidget`
Основной компонент плавающего виджета.

**Props:**
- `config: UserManagementConfig` - Конфигурация виджета
- `isOpen: boolean` - Состояние открытия/закрытия

### `UserManagementContainer`
Контейнер для виджета. Добавьте в корень приложения.

**Использование:**
```svelte
<script>
  import { UserManagementContainer } from '$lib/api/user-management';
</script>

<UserManagementContainer />
```

## 🎯 Store

### `widgetStore`
Svelte store для управления состоянием виджета.

**Структура:**
```typescript
{
  isOpen: boolean;
  config: UserManagementConfig | null;
}
```

**Использование:**
```typescript
import { widgetStore } from '$lib/api/user-management/widget-controller';

// Подписка на изменения
widgetStore.subscribe(state => {
  console.log('Widget open:', state.isOpen);
});
```

## 🚀 Быстрая интеграция

### 1. Добавьте контейнер в Layout
```svelte
<script>
  import { UserManagementContainer } from '$lib/api/user-management';
</script>

<slot />
<UserManagementContainer />
```

### 2. Используйте где угодно
```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
</script>

<button on:click={() => openAllUsersWidget(roomId)}>
  Управление пользователями
</button>
```

## 🎨 Кастомизация

Виджет использует CSS-переменные (можно переопределить):

```css
:global(.user-management-widget) {
  /* Переопределите стили здесь */
}
```

## 📖 Дополнительные ресурсы

- **Быстрый старт:** [QUICKSTART.md](./QUICKSTART.md)
- **Полная документация:** [README.md](./README.md)
- **Примеры кода:** [EXAMPLES.md](./EXAMPLES.md)
- **Демо:** [demo.svelte](./demo.svelte)

## 💡 Сценарии использования

### Сценарий 1: Кнопка в меню комнаты
```svelte
<button on:click={() => openAllUsersWidget(roomId)}>
  👥 Участники
</button>
```

### Сценарий 2: Контекстное меню пользователя
```svelte
<div class="user-menu">
  <button on:click={() => openSingleUserWidget(roomId, userId)}>
    ⚙️ Настройки
  </button>
</div>
```

### Сценарий 3: Административная панель
```svelte
{#if isAdmin}
  <button on:click={() => openAllUsersWidget(roomId)}>
    Управление доступом
  </button>
{/if}
```

### Сценарий 4: Программное управление
```typescript
// Получить всех пользователей
const { users } = await getAllRoomUsers(roomId);

// Дать всем права на редактирование
for (const user of users) {
  await updateUserPermissions({
    roomId,
    userId: user.id,
    permissions: { canEdit: true }
  });
}
```

## ⚡ Производительность

- ✅ Lazy loading компонентов
- ✅ Оптимизированные ре-рендеры
- ✅ Минимальные API запросы
- ✅ Кэширование данных
- ✅ Плавные анимации через CSS

## 🔒 Безопасность

- ✅ Проверка токенов авторизации
- ✅ Валидация прав доступа на сервере
- ✅ Защита от XSS
- ✅ Безопасные API вызовы

## 🐛 Отладка

```typescript
// Включите логирование в консоли
console.log('[UserManagementAPI] Debug mode');

// Все API функции логируют ошибки
const response = await getAllRoomUsers('invalid-id');
// Выведет: [UserManagementAPI] Error getting all users: ...
```

## 📱 Поддержка устройств

- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mobile (адаптивный дизайн)
- ✅ Tablet
- ✅ Touch events для перетаскивания

## 🎉 Готово к использованию!

API полностью готов к работе. Начните с [QUICKSTART.md](./QUICKSTART.md) для быстрой интеграции.

---

**Версия:** 1.0.0  
**Автор:** Copella Notepad Team  
**Лицензия:** MIT

