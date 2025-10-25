# 🚀 Быстрый старт: API Управления Пользователями

Минимальная интеграция за 3 шага.

## Шаг 1: Добавьте контейнер в Layout

Откройте `src/routes/+layout.svelte` и добавьте:

```svelte
<script>
  import { UserManagementContainer } from '$lib/api/user-management';
</script>

<slot />

<!-- Контейнер виджета -->
<UserManagementContainer />
```

## Шаг 2: Используйте в вашем компоненте

```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  let roomId = 'your-room-id';
</script>

<button on:click={() => openAllUsersWidget(roomId)}>
  Управление пользователями
</button>
```

## Шаг 3: Готово! 🎉

Теперь при клике на кнопку откроется плавающее окно с управлением пользователями.

---

## Дополнительные возможности

### Управление одним пользователем

```svelte
<script>
  import { openSingleUserWidget } from '$lib/api/user-management/widget-controller';
</script>

<button on:click={() => openSingleUserWidget(roomId, userId)}>
  Настроить пользователя
</button>
```

### С обработчиками событий

```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  function handleOpen() {
    openAllUsersWidget(roomId, {
      onUpdate: (user) => {
        console.log('Обновлен:', user);
        // Ваша логика обновления
      },
      onClose: () => {
        console.log('Закрыто');
      }
    });
  }
</script>

<button on:click={handleOpen}>Открыть</button>
```

### Прямое использование API

```typescript
import { getAllRoomUsers } from '$lib/api/user-management';

const response = await getAllRoomUsers(roomId);
if (response.success) {
  console.log(response.users);
}
```

---

## Демо

Хотите протестировать? Импортируйте демо-компонент:

```svelte
<script>
  import Demo from '$lib/api/user-management/demo.svelte';
</script>

<Demo />
```

---

## Документация

- 📖 [Полная документация](./README.md)
- 💡 [Примеры использования](./EXAMPLES.md)
- 🎯 [API Reference](./types.ts)

---

## Структура файлов

```
src/lib/api/user-management/
├── index.ts                          # Главный экспорт
├── types.ts                          # TypeScript типы
├── api.ts                            # API функции
├── widget-controller.ts              # Контроллер виджета
├── UserManagementWidget.svelte       # Компонент виджета
├── UserManagementContainer.svelte    # Контейнер для виджета
├── demo.svelte                       # Демо-страница
├── README.md                         # Полная документация
├── EXAMPLES.md                       # Примеры
└── QUICKSTART.md                     # Этот файл
```

---

## Горячие клавиши (опционально)

Добавьте в ваш компонент:

```svelte
<script>
  import { onMount } from 'svelte';
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  onMount(() => {
    function handleKeyPress(e) {
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
        openAllUsersWidget(roomId);
      }
    }
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  });
</script>
```

Теперь **Ctrl + U** открывает виджет!

---

## Нужна помощь?

- Проблемы с интеграцией? Проверьте [README.md](./README.md)
- Хотите больше примеров? Смотрите [EXAMPLES.md](./EXAMPLES.md)
- Изучите типы в [types.ts](./types.ts)

