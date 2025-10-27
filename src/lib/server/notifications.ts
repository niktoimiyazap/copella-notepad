import type { NotificationType, NotificationMessage } from '../notifications-client';

const NOTIFICATIONS_SERVER_URL = process.env.NOTIFICATIONS_SERVER_URL || 'ws://localhost:3001';

// Отправка уведомления через WebSocket сервер
async function sendNotification(notification: NotificationMessage) {
  // В production окружении уведомления отправляются через внутренний API
  // В development - через WebSocket напрямую
  
  try {
    // Используем fetch для отправки уведомления на наш внутренний эндпоинт
    // который затем broadcast'ит через WebSocket
    const response = await fetch('http://localhost:3001/broadcast', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notification),
    }).catch(() => {
      // HTTP API недоступен
    });
  } catch (error) {
    // Error sending notification
  }
}

// Уведомления о приглашениях
export async function notifyInviteCreated(roomId: string, data: any) {
  await sendNotification({
    type: 'invite:created',
    roomId,
    data,
    timestamp: Date.now(),
  });
}

export async function notifyInviteAccepted(roomId: string, data: any) {
  await sendNotification({
    type: 'invite:accepted',
    roomId,
    data,
    timestamp: Date.now(),
  });
}

// Уведомления о заявках
export async function notifyApprovalRequest(roomId: string, data: any) {
  await sendNotification({
    type: 'approval:request',
    roomId,
    data,
    timestamp: Date.now(),
  });
}

export async function notifyApprovalResponse(roomId: string, data: any) {
  await sendNotification({
    type: 'approval:response',
    roomId,
    data,
    timestamp: Date.now(),
  });
}

// Уведомления об обновлении участников
export async function notifyParticipantUpdate(roomId: string, data: any) {
  await sendNotification({
    type: 'participant:update',
    roomId,
    data,
    timestamp: Date.now(),
  });
}

// Уведомление о передаче прав владельца
export async function notifyOwnershipTransfer(roomId: string, data: any) {
  await sendNotification({
    type: 'ownership:transfer',
    roomId,
    data,
    timestamp: Date.now(),
  });
}

