// Типы данных для WebSocket сервера
import type { WebSocket } from 'ws';

export interface WebSocketMessage {
  type: 'room_update' | 'note_update' | 'participant_join' | 'participant_leave' | 
        'user_online' | 'user_offline' | 'participant_update' | 
        'invite_created' | 'invite_accepted' | 'invite_declined' | 'invite_revoked' | 
        'approval_request' | 'approval_response' | 'join_room' | 'leave_room' | 
        'update_online_status' | 'ping' | 'pong' | 
        'note_content_update' | 'note_saved' | 'cursor_update' | 'cursor_remove' |
        'editing_started' | 'editing_stopped' |
        'yjs_sync_request' | 'yjs_sync' | 'yjs_update';
  room_id?: string;
  data?: any;
  timestamp?: Date;
  user_id?: string;
  token?: string;
}

export interface ConnectedUser {
  userId: string;
  roomId: string;
  ws: WebSocket;
  lastSeen: Date;
  username?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface BroadcastOptions {
  excludeUserId?: string;
  includeOffline?: boolean;
}

export interface AuthResult {
  isValid: boolean;
  userId?: string;
  user?: {
    id: string;
    email: string;
    username?: string;
    fullName?: string;
    avatarUrl?: string;
  };
  error?: string;
}

export interface RoomInviteData {
  id: string;
  roomId: string;
  invitedBy: string;
  requestedBy?: string;
  inviteToken: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'pending_approval';
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

