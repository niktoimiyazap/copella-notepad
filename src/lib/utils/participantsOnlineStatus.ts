/**
 * Утилита для отслеживания онлайн статуса участников комнаты через WebSocket
 */

import { useWebSocket } from '$lib/websocket';

interface Participant {
	id: string;
	userId: string;
	isOnline: boolean;
	user: {
		id: string;
		username: string;
		fullName: string;
		avatarUrl?: string;
	};
	[key: string]: any;
}

interface OnlineStatusHandlers {
	onUserOnline?: (userId: string) => void;
	onUserOffline?: (userId: string) => void;
}

/**
 * Инициализация отслеживания онлайн статуса участников
 * @param roomId - ID комнаты
 * @param currentUserId - ID текущего пользователя
 * @param getParticipants - Функция для получения текущего массива участников
 * @param setParticipants - Функция для обновления массива участников
 * @param handlers - Дополнительные обработчики событий
 * @returns Promise с функцией отключения
 */
export async function initParticipantsOnlineTracking(
	roomId: string,
	currentUserId: string,
	getParticipants: () => Participant[],
	setParticipants: (participants: Participant[]) => void,
	handlers?: OnlineStatusHandlers
): Promise<() => void> {
	const ws = useWebSocket(roomId);

	// Обработчик подключения пользователя
	const handleUserOnline = (message: any) => {
		const userId = message.data?.userId;
		if (!userId) return;

		const participants = getParticipants();
		// Обновляем статус участника в массиве
		const participantIndex = participants.findIndex(p => p.userId === userId);
		
		if (participantIndex !== -1) {
			// Участник уже есть в списке - просто обновляем статус
			const updatedParticipants = [...participants];
			updatedParticipants[participantIndex] = {
				...updatedParticipants[participantIndex],
				isOnline: true
			};
			setParticipants(updatedParticipants);
		} else {
			// Участника нет в списке - добавляем его
			const newParticipant: Participant = {
				id: `${userId}-${roomId}`, // временный ID
				userId: userId,
				isOnline: true,
				user: {
					id: userId,
					username: message.data?.username || 'Unknown',
					fullName: message.data?.fullName || 'Unknown User',
					avatarUrl: message.data?.avatarUrl
				}
			};
			setParticipants([...participants, newParticipant]);
			console.log(`[ParticipantsOnlineStatus] Added new participant ${userId} to the list`);
		}

		// Вызываем пользовательский обработчик
		handlers?.onUserOnline?.(userId);
	};

	// Обработчик отключения пользователя
	const handleUserOffline = (message: any) => {
		const userId = message.data?.userId;
		if (!userId) return;

		const participants = getParticipants();
		// Обновляем статус участника в массиве
		const participantIndex = participants.findIndex(p => p.userId === userId);
		if (participantIndex !== -1) {
			const updatedParticipants = [...participants];
			updatedParticipants[participantIndex] = {
				...updatedParticipants[participantIndex],
				isOnline: false
			};
			setParticipants(updatedParticipants);
		}

		// Вызываем пользовательский обработчик
		handlers?.onUserOffline?.(userId);
	};

	// Обработчик подключения к комнате
	const handleRoomJoined = (message: any) => {
		const onlineUsers = message.data?.onlineUsers || [];
		const serverCurrentUserId = message.data?.currentUserId;

		// Обновляем статусы всех участников на основе списка с сервера
		const participants = getParticipants();
		const onlineUserIds = new Set(onlineUsers.map((u: any) => u.userId));
		
		const updatedParticipants = participants.map(participant => {
			// Проверяем, есть ли пользователь в списке онлайн с сервера
			const isOnline = onlineUserIds.has(participant.userId);
			
			// Дополнительная проверка для текущего пользователя (на случай рассинхронизации)
			const shouldBeOnline = isOnline || (participant.userId === currentUserId && serverCurrentUserId === currentUserId);
			
			return {
				...participant,
				isOnline: shouldBeOnline
			};
		});

		setParticipants(updatedParticipants);
	};

	// Обработчик обновления участников (включая изменение ролей)
	const handleParticipantUpdate = (message: any) => {
		const action = message.data?.action;
		const updatedParticipantsList = message.data?.participants;

		// Если пришли обновленные данные участников (например, после передачи прав)
		if (action === 'ownership_transferred' && updatedParticipantsList) {
			const currentParticipants = getParticipants();
			
			// Обновляем роли участников, сохраняя текущие статусы онлайн
			const mergedParticipants = currentParticipants.map(currentP => {
				const updatedP = updatedParticipantsList.find((up: any) => up.userId === currentP.userId);
				if (updatedP) {
					return {
						...currentP,
						...updatedP,
						isOnline: currentP.isOnline // Сохраняем текущий статус онлайн
					};
				}
				return currentP;
			});
			
			setParticipants(mergedParticipants);
			console.log('[ParticipantsOnlineStatus] Participants roles updated after ownership transfer');
		} else if (message.data?.participant) {
			// Обработка обновления одного участника
			const updatedParticipant = message.data.participant;
			const currentParticipants = getParticipants();
			const index = currentParticipants.findIndex(p => p.userId === updatedParticipant.userId);
			
			if (index !== -1) {
				const updated = [...currentParticipants];
				updated[index] = {
					...updated[index],
					...updatedParticipant,
					isOnline: updated[index].isOnline // Сохраняем статус онлайн
				};
				setParticipants(updated);
			}
		}
	};

	// Обработчик удаления участника
	const handleParticipantRemoved = (message: any) => {
		const removedUserId = message.data?.userId;
		
		// Если удалили текущего пользователя - перенаправляем на главную
		if (removedUserId === currentUserId) {
			console.log('[ParticipantsOnlineStatus] Current user was removed from the room');
			// Отключаемся от WebSocket
			ws.disconnect();
			// Показываем сообщение и перенаправляем
			alert('Вы были удалены из этой комнаты');
			window.location.href = '/';
		} else {
			// Удаляем участника из списка
			const currentParticipants = getParticipants();
			const filtered = currentParticipants.filter(p => p.userId !== removedUserId);
			setParticipants(filtered);
		}
	};

	// Подписываемся на события WebSocket
	ws.onUserOnline(handleUserOnline);
	ws.onUserOffline(handleUserOffline);
	ws.onMessage('participant_update', handleParticipantUpdate);
	ws.onMessage('participant_removed', handleParticipantRemoved);

	// Подключаемся к WebSocket и ждем подтверждения присоединения к комнате
	return new Promise((resolve, reject) => {
		// Флаг для предотвращения повторного вызова
		let resolved = false;
		
		// Таймаут для подключения (2 секунды)
		const connectionTimeout = setTimeout(() => {
			if (!resolved) {
				resolved = true;
				console.warn('[ParticipantsOnlineStatus] Connection timeout - continuing without WebSocket');
				// Возвращаем пустую функцию отключения
				resolve(() => {});
			}
		}, 2000);

		// Обработчик для одноразового вызова при успешном присоединении
		const handleInitialRoomJoined = (message: any) => {
			if (resolved) return; // Игнорируем повторные вызовы
			
			resolved = true;
			clearTimeout(connectionTimeout);
			
			// Обрабатываем начальные данные
			handleRoomJoined(message);
			
			// Подписываемся на постоянный обработчик для будущих переподключений
			ws.onMessage('room_joined', (msg: any) => {
				if (!resolved) return; // Обрабатываем только после начальной инициализации
				handleRoomJoined(msg);
			});
			
			// Возвращаем функцию отключения
			resolve(() => {
				ws.disconnect();
			});
		};

		// Обработчик ошибок
		const handleError = (message: any) => {
			if (resolved) return;
			
			resolved = true;
			clearTimeout(connectionTimeout);
			console.error('[ParticipantsOnlineStatus] WebSocket error:', message.data?.error);
			reject(new Error(message.data?.error || 'Failed to connect to room'));
		};

		// Подписываемся на одноразовые обработчики
		ws.onMessage('room_joined', handleInitialRoomJoined);
		ws.onMessage('error', handleError);

		// Подключаемся к WebSocket
		ws.connect().then((connected) => {
			if (!connected && !resolved) {
				resolved = true;
				clearTimeout(connectionTimeout);
				reject(new Error('Failed to connect to WebSocket'));
			}
		}).catch((error) => {
			if (!resolved) {
				resolved = true;
				clearTimeout(connectionTimeout);
				console.error('[ParticipantsOnlineStatus] Connection error:', error);
				reject(error);
			}
		});
	});
}

/**
 * Получение количества онлайн участников
 * @param participants - Массив участников
 */
export function getOnlineParticipantsCount(participants: Participant[]): number {
	return participants.filter(p => p.isOnline).length;
}

/**
 * Получение списка онлайн участников
 * @param participants - Массив участников
 */
export function getOnlineParticipants(participants: Participant[]): Participant[] {
	return participants.filter(p => p.isOnline);
}

/**
 * Проверка онлайн статуса конкретного пользователя
 * @param participants - Массив участников
 * @param userId - ID пользователя
 */
export function isUserOnline(participants: Participant[], userId: string): boolean {
	const participant = participants.find(p => p.userId === userId);
	return participant?.isOnline ?? false;
}
