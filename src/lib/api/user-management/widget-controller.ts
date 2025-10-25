// Контроллер для управления виджетом управления пользователями

import { writable } from 'svelte/store';
import type { UserManagementConfig } from './types';

// Store для управления состоянием виджета
export const widgetStore = writable<{
  isOpen: boolean;
  config: UserManagementConfig | null;
}>({
  isOpen: false,
  config: null,
});

/**
 * Вычисляет позицию виджета относительно элемента
 */
function calculateWidgetPosition(targetElement?: HTMLElement | MouseEvent): { x: number; y: number } {
  // Дефолтная позиция по центру экрана
  const defaultPosition = {
    x: Math.max(100, (window.innerWidth - 360) / 2),
    y: Math.max(100, (window.innerHeight - 480) / 2)
  };

  if (!targetElement) {
    return defaultPosition;
  }

  // Если это MouseEvent, используем координаты клика
  if (targetElement instanceof MouseEvent) {
    return {
      x: Math.min(targetElement.clientX + 10, window.innerWidth - 370),
      y: Math.min(targetElement.clientY + 10, window.innerHeight - 490)
    };
  }

  // Если это элемент, вычисляем позицию рядом с ним
  const rect = targetElement.getBoundingClientRect();
  const widgetWidth = 360;
  const widgetHeight = 480;
  
  // Пытаемся разместить справа от элемента
  let x = rect.right + 10;
  let y = rect.top;
  
  // Если не помещается справа, размещаем слева
  if (x + widgetWidth > window.innerWidth) {
    x = rect.left - widgetWidth - 10;
  }
  
  // Если не помещается слева, размещаем снизу
  if (x < 0) {
    x = rect.left;
    y = rect.bottom + 10;
  }
  
  // Если не помещается снизу, размещаем сверху
  if (y + widgetHeight > window.innerHeight) {
    y = rect.top - widgetHeight - 10;
  }
  
  // Если вообще не помещается, используем дефолтную позицию
  if (y < 0) {
    return defaultPosition;
  }
  
  // Корректируем границы
  x = Math.max(10, Math.min(x, window.innerWidth - widgetWidth - 10));
  y = Math.max(10, Math.min(y, window.innerHeight - widgetHeight - 10));
  
  return { x, y };
}

/**
 * Открыть виджет управления всеми пользователями комнаты
 */
export function openAllUsersWidget(
  roomId: string,
  options?: {
    targetElement?: HTMLElement | MouseEvent;
    onUpdate?: (user: any) => void;
    onClose?: () => void;
  }
) {
  const position = calculateWidgetPosition(options?.targetElement);
  
  widgetStore.set({
    isOpen: true,
    config: {
      mode: 'all-users',
      roomId,
      initialPosition: position,
      onUpdate: options?.onUpdate,
      onClose: () => {
        closeWidget();
        options?.onClose?.();
      },
    },
  });
}

/**
 * Открыть виджет управления конкретным пользователем
 */
export function openSingleUserWidget(
  roomId: string,
  userId: string,
  options?: {
    targetElement?: HTMLElement | MouseEvent;
    onUpdate?: (user: any) => void;
    onClose?: () => void;
  }
) {
  const position = calculateWidgetPosition(options?.targetElement);
  
  widgetStore.set({
    isOpen: true,
    config: {
      mode: 'single-user',
      roomId,
      userId,
      initialPosition: position,
      onUpdate: options?.onUpdate,
      onClose: () => {
        closeWidget();
        options?.onClose?.();
      },
    },
  });
}

/**
 * Закрыть виджет
 */
export function closeWidget() {
  widgetStore.update(state => ({
    ...state,
    isOpen: false,
  }));
  
  // Очищаем config после анимации закрытия
  setTimeout(() => {
    widgetStore.update(state => ({
      ...state,
      config: null,
    }));
  }, 300);
}

