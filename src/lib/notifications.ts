// Система уведомлений
interface Notification {
	id: string;
	message: string;
	type: 'success' | 'error' | 'info' | 'warning';
	duration?: number;
}

class NotificationManager {
	private notifications: Notification[] = [];
	private listeners: ((notifications: Notification[]) => void)[] = [];

	// Добавить уведомление
	add(notification: Omit<Notification, 'id'>) {
		const id = Math.random().toString(36).substr(2, 9);
		const newNotification: Notification = {
			id,
			...notification,
			duration: notification.duration || 5000
		};

		this.notifications.push(newNotification);
		this.notifyListeners();

		// Автоматически удаляем уведомление через указанное время
		setTimeout(() => {
			this.remove(id);
		}, newNotification.duration);
	}

	// Удалить уведомление
	remove(id: string) {
		this.notifications = this.notifications.filter(n => n.id !== id);
		this.notifyListeners();
	}

	// Очистить все уведомления
	clear() {
		this.notifications = [];
		this.notifyListeners();
	}

	// Получить все уведомления
	getAll(): Notification[] {
		return [...this.notifications];
	}

	// Подписаться на изменения
	subscribe(listener: (notifications: Notification[]) => void) {
		this.listeners.push(listener);
		return () => {
			this.listeners = this.listeners.filter(l => l !== listener);
		};
	}

	// Уведомить слушателей
	private notifyListeners() {
		this.listeners.forEach(listener => listener(this.notifications));
	}

	// Удобные методы для разных типов уведомлений
	success(message: string, duration?: number) {
		this.add({ message, type: 'success', duration });
	}

	error(message: string, duration?: number) {
		this.add({ message, type: 'error', duration });
	}

	info(message: string, duration?: number) {
		this.add({ message, type: 'info', duration });
	}

	warning(message: string, duration?: number) {
		this.add({ message, type: 'warning', duration });
	}
}

// Создаем глобальный экземпляр
export const notifications = new NotificationManager();
