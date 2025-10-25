

const WS_SERVER_URL = 'http://localhost:3001/notify';

interface ApprovalResponseNotification {
  type: 'approval_response';
  roomId: string;
  inviteId: string;
  action: 'approved' | 'rejected';
  requesterId: string;
}

interface ApprovalRequestNotification {
  type: 'approval_request';
  roomId: string;
  invite: any;
}

interface ParticipantUpdateNotification {
  type: 'participant_update';
  roomId: string;
  participant: any;
  action: string;
}

interface InviteCreatedNotification {
  type: 'invite_created';
  roomId: string;
  invite: any;
}

interface InviteAcceptedNotification {
  type: 'invite_accepted';
  roomId: string;
  invite: any;
  userId: string;
}

type WebSocketNotification = 
  | ApprovalResponseNotification 
  | ApprovalRequestNotification 
  | ParticipantUpdateNotification
  | InviteCreatedNotification
  | InviteAcceptedNotification;

/**
 * Отправляет уведомление в WebSocket сервер
 */
async function sendNotification(notification: WebSocketNotification): Promise<boolean> {
  try {
    const response = await fetch(WS_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notification)
    });

    if (!response.ok) {
      console.error('[WebSocket Notify] Failed to send notification:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('[WebSocket Notify] Error sending notification:', error);
    return false;
  }
}

/**
 * Отправляет уведомление об одобрении/отклонении заявки
 */
export async function notifyApprovalResponse(
  roomId: string,
  inviteId: string,
  action: 'approved' | 'rejected',
  requesterId: string
): Promise<boolean> {
  return sendNotification({
    type: 'approval_response',
    roomId,
    inviteId,
    action,
    requesterId
  });
}

/**
 * Отправляет уведомление о новой заявке на вступление
 */
export async function notifyApprovalRequest(
  roomId: string,
  invite: any
): Promise<boolean> {
  return sendNotification({
    type: 'approval_request',
    roomId,
    invite
  });
}

/**
 * Отправляет уведомление об обновлении участника (присоединение/выход)
 */
export async function notifyParticipantUpdate(
  roomId: string,
  participant: any,
  action: string
): Promise<boolean> {
  return sendNotification({
    type: 'participant_update',
    roomId,
    participant,
    action
  });
}

/**
 * Отправляет уведомление о созданном приглашении
 */
export async function notifyInviteCreated(
  roomId: string,
  invite: any
): Promise<boolean> {
  return sendNotification({
    type: 'invite_created',
    roomId,
    invite
  });
}

/**
 * Отправляет уведомление о принятом приглашении
 */
export async function notifyInviteAccepted(
  roomId: string,
  invite: any,
  userId: string
): Promise<boolean> {
  return sendNotification({
    type: 'invite_accepted',
    roomId,
    invite,
    userId
  });
}

