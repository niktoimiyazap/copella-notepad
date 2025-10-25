# 📚 Документация API Управления Пользователями

Полная навигация по документации.

---

## 🚀 Начните здесь

### Для новичков
1. 👉 **[QUICKSTART.md](./QUICKSTART.md)** - Быстрый старт за 3 шага
2. 👉 **[HOW_TO_USE.md](./HOW_TO_USE.md)** - Простые примеры использования

### Для разработчиков
1. 👉 **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Гид по интеграции в проект
2. 👉 **[README.md](./README.md)** - Полная документация
3. 👉 **[API_OVERVIEW.md](./API_OVERVIEW.md)** - Обзор всех возможностей

### Примеры кода
1. 👉 **[EXAMPLES.md](./EXAMPLES.md)** - 8+ реальных примеров
2. 👉 **[demo.svelte](./demo.svelte)** - Интерактивная демо-страница

---

## 📂 Файлы проекта

### Основные файлы
| Файл | Описание |
|------|----------|
| `index.ts` | Главный экспортный файл |
| `types.ts` | TypeScript типы и интерфейсы |
| `api.ts` | API функции для работы с сервером |
| `widget-controller.ts` | Контроллер управления виджетом |

### Компоненты
| Файл | Описание |
|------|----------|
| `UserManagementWidget.svelte` | Основной компонент виджета |
| `UserManagementContainer.svelte` | Контейнер для виджета |
| `demo.svelte` | Демо-страница с примерами |

### Документация
| Файл | Назначение |
|------|-----------|
| `INDEX.md` | Этот файл - навигация |
| `QUICKSTART.md` | Быстрый старт |
| `HOW_TO_USE.md` | Как использовать |
| `README.md` | Полная документация |
| `EXAMPLES.md` | Примеры использования |
| `API_OVERVIEW.md` | Обзор API |
| `INTEGRATION_GUIDE.md` | Гид по интеграции |

---

## 🎯 Что можно делать?

### Режимы работы
1. **Все пользователи** - Показать всех пользователей комнаты
2. **Один пользователь** - Настроить конкретного пользователя

### Возможности
- ✅ Просмотр списка пользователей
- ✅ Изменение прав (редактирование, приглашение, удаление)
- ✅ Изменение ролей (admin, participant)
- ✅ Удаление пользователей
- ✅ Индикаторы онлайн-статуса
- ✅ Плавающее перетаскиваемое окно

---

## 🔧 Основные функции

### Функции виджета
```typescript
openAllUsersWidget(roomId, options?)      // Открыть все пользователи
openSingleUserWidget(roomId, userId, ...)  // Открыть один пользователь
closeWidget()                              // Закрыть виджет
```

### API функции
```typescript
getAllRoomUsers(roomId)                    // Получить всех
getRoomUser(roomId, userId)                // Получить одного
updateUserPermissions(request)             // Обновить права
removeUserFromRoom(roomId, userId)         // Удалить
```

---

## 💡 Быстрый пример

```svelte
<script>
  import { openAllUsersWidget } from '$lib/api/user-management/widget-controller';
  
  let roomId = 'your-room-id';
</script>

<button on:click={() => openAllUsersWidget(roomId)}>
  Управление пользователями
</button>
```

---

## 📖 Рекомендуемый путь изучения

### Уровень 1: Базовое использование (5 минут)
1. Прочитайте [QUICKSTART.md](./QUICKSTART.md)
2. Скопируйте пример из [HOW_TO_USE.md](./HOW_TO_USE.md)
3. Добавьте кнопку в ваш компонент

### Уровень 2: Продвинутое использование (15 минут)
1. Изучите [EXAMPLES.md](./EXAMPLES.md)
2. Прочитайте [API_OVERVIEW.md](./API_OVERVIEW.md)
3. Настройте под свои нужды

### Уровень 3: Полное понимание (30 минут)
1. Прочитайте [README.md](./README.md)
2. Изучите [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
3. Посмотрите исходный код в `widget-controller.ts` и `api.ts`

---

## 🎨 Демо

Хотите попробовать прямо сейчас?

Создайте страницу:
```svelte
<!-- src/routes/demo-users/+page.svelte -->
<script>
  import Demo from '$lib/api/user-management/demo.svelte';
</script>

<Demo />
```

Откройте: `http://localhost:5173/demo-users`

---

## 🔗 Быстрые ссылки

### Документация
- 📖 [Полная документация](./README.md)
- 🚀 [Быстрый старт](./QUICKSTART.md)
- 📝 [Как использовать](./HOW_TO_USE.md)
- 💡 [Примеры](./EXAMPLES.md)
- 🔍 [API обзор](./API_OVERVIEW.md)
- 🔧 [Гид по интеграции](./INTEGRATION_GUIDE.md)

### Файлы
- 📄 [types.ts](./types.ts) - TypeScript типы
- 📄 [api.ts](./api.ts) - API функции
- 📄 [widget-controller.ts](./widget-controller.ts) - Контроллер
- 🎨 [demo.svelte](./demo.svelte) - Демо

---

## ❓ Нужна помощь?

### Не работает?
1. Проверьте, что `UserManagementContainer` добавлен в `+layout.svelte`
2. Проверьте консоль браузера на ошибки
3. Убедитесь, что у вас правильный `roomId`

### Хотите узнать больше?
- Начните с [QUICKSTART.md](./QUICKSTART.md)
- Изучите [EXAMPLES.md](./EXAMPLES.md)
- Прочитайте [README.md](./README.md)

### Хотите кастомизировать?
- Изучите типы в [types.ts](./types.ts)
- Посмотрите стили в [UserManagementWidget.svelte](./UserManagementWidget.svelte)
- Прочитайте о кастомизации в [README.md](./README.md)

---

## 🎉 Готово к использованию!

API полностью настроен и готов к работе. Просто импортируйте и используйте:

```typescript
import { 
  openAllUsersWidget, 
  openSingleUserWidget 
} from '$lib/api/user-management/widget-controller';
```

**Счастливого кодирования!** 🚀

---

**Версия:** 1.0.0  
**Статус:** ✅ Готово к использованию  
**Документация:** Полная  
**Примеры:** 8+ примеров  
**Тесты:** Демо-страница

