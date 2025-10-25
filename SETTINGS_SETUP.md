# Настройка страницы настроек

## Создано

✅ Основная страница настроек `/routes/settings/+page.svelte`
✅ Компоненты для разделов настроек:
  - ProfileSettings - управление профилем и аватаром
  - SecuritySettings - смена пароля и активные сессии
  - NotificationSettings - настройки уведомлений
  - PrivacySettings - настройки приватности
  - AppearanceSettings - внешний вид приложения

✅ API endpoints:
  - `/api/auth/profile` - обновление профиля
  - `/api/upload/avatar` - загрузка/удаление аватара (Supabase Storage)
  - `/api/settings/notifications` - настройки уведомлений
  - `/api/settings/privacy` - настройки приватности
  - `/api/settings/appearance` - настройки внешнего вида
  - `/api/auth/change-password` - смена пароля
  - `/api/auth/session` - управление сессиями

✅ База данных:
  - Добавлена таблица `UserSettings`
  - Связь с таблицей `User`

✅ Стили:
  - `src/lib/styles/settings.css` - стили для страницы настроек

## Настройка Supabase Storage

Необходимо создать bucket для аватаров в Supabase:

1. Откройте Supabase Dashboard
2. Перейдите в Storage
3. Создайте новый bucket с именем `avatars`
4. Настройте политики доступа:

```sql
-- Политика для загрузки (INSERT)
CREATE POLICY "Users can upload their own avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Политика для обновления (UPDATE)
CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Политика для удаления (DELETE)
CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Политика для чтения (SELECT) - публичная
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

5. Установите bucket как публичный для чтения

## Навигация

Страница настроек доступна через боковое меню (кнопка "Настройки" в Sidebar).

## Функционал

### ProfileSettings
- Загрузка и удаление аватара (через Supabase Storage)
- Изменение отображаемого имени
- Редактирование био
- Просмотр username и email (только чтение)

### SecuritySettings
- Смена пароля
- Управление активными сессиями
- Завершение отдельных сессий
- Завершение всех сессий кроме текущей

### NotificationSettings
- Email уведомления (упоминания, приглашения, комментарии, активность)
- Push-уведомления в браузере
- Звуковые уведомления

### PrivacySettings
- Видимость профиля (публичный/приватный)
- Показ онлайн-статуса
- Разрешение приглашений и упоминаний
- Экспорт данных
- Удаление аккаунта

### AppearanceSettings
- Выбор темы (темная/светлая/авто) - пока только темная
- Выбор акцентного цвета (7 вариантов)
- Размер шрифта (маленький/средний/большой)
- Компактный режим
- Включение/отключение анимаций

## TODO (Будущие улучшения)

- [ ] Реализовать светлую тему
- [ ] Добавить автоматическую тему (по системе)
- [ ] Реализовать экспорт данных
- [ ] Добавить функционал удаления аккаунта
- [ ] Реализовать двухфакторную аутентификацию
- [ ] Добавить историю активности аккаунта
- [ ] Реализовать настройки языка интерфейса

