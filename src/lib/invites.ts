// Функция для получения токена сессии (Supabase access token)
async function getSessionToken(): Promise<string | null> {
	try {
		// Получаем токен сессии из localStorage (это Supabase access token)
		const sessionToken = localStorage.getItem('session_token');
		
		if (!sessionToken) {
			console.error('No session token found in localStorage');
			return null;
		}

		return sessionToken;
	} catch (error) {
		console.error('Error getting session token:', error);
		return null;
	}
}

// Типы для приглашений
export interface RoomInvite {
	id: string;
	roomId: string;
	invitedBy: string;
	requestedBy?: string;
	inviteToken: string;
	status: 'pending' | 'accepted' | 'declined' | 'expired' | 'pending_approval';
	expiresAt: string;
	createdAt: string;
	updatedAt: string;
	room: {
		id: string;
		title: string;
		description?: string;
		coverImageUrl?: string;
		participantLimit: number;
		requireApproval: boolean;
		creator: {
			id: string;
			username: string;
			fullName: string;
			avatarUrl?: string;
		};
		_count: {
			participants: number;
		};
	};
	inviter: {
		id: string;
		username: string;
		fullName: string;
		avatarUrl?: string;
	};
	requester?: {
		id: string;
		username: string;
		fullName: string;
		avatarUrl?: string;
		email?: string;
	};
}

export interface InviteInfo {
	id: string;
	room: {
		id: string;
		title: string;
		description?: string;
		coverImageUrl?: string;
		participantLimit: number;
		requireApproval: boolean;
		creator: {
			id: string;
			username: string;
			fullName: string;
			avatarUrl?: string;
		};
		_count: {
			participants: number;
		};
	};
	inviter: {
		id: string;
		username: string;
		fullName: string;
		avatarUrl?: string;
	};
	expiresAt: string;
}

// Результат операций
export interface InviteResult {
	invite?: RoomInvite;
	error?: string;
}

export interface InviteInfoResult {
	invite?: InviteInfo;
	error?: string;
}

export interface InvitesResult {
	invites?: RoomInvite[];
	error?: string;
}

export interface InviteActionResult {
	message?: string;
	requiresApproval?: boolean;
	error?: string;
}

// Функция для создания приглашения
export async function createRoomInvite(roomId: string): Promise<InviteResult> {
	try {
		// Получаем токен сессии
		const sessionToken = await getSessionToken();
		if (!sessionToken) {
			return { error: 'Unauthorized' };
		}

		const response = await fetch(`/api/rooms/${roomId}/invites`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${sessionToken}`,
			},
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка создания приглашения' };
		}

		return { invite: result.invite };
	} catch (error) {
		console.error('Create room invite error:', error);
		return { error: 'Неожиданная ошибка при создании приглашения' };
	}
}

// Функция для получения информации о приглашении
export async function getInviteInfo(inviteToken: string): Promise<InviteInfoResult> {
	try {
		// Получаем токен сессии
		const sessionToken = await getSessionToken();
		if (!sessionToken) {
			return { error: 'Unauthorized' };
		}

		const response = await fetch(`/api/rooms/invite-info?token=${inviteToken}`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${sessionToken}`,
			},
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка получения информации о приглашении' };
		}

		return { invite: result.invite };
	} catch (error) {
		console.error('Get invite info error:', error);
		return { error: 'Неожиданная ошибка при получении информации о приглашении' };
	}
}

// Функция для принятия приглашения
export async function acceptRoomInvite(roomId: string, inviteToken: string): Promise<InviteActionResult> {
	try {
		// Получаем токен сессии
		const sessionToken = await getSessionToken();
		if (!sessionToken) {
			return { error: 'Unauthorized' };
		}

		const response = await fetch(`/api/rooms/${roomId}/invites?token=${inviteToken}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${sessionToken}`,
			},
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка принятия приглашения' };
		}

		return { 
			message: result.message,
			requiresApproval: result.requiresApproval
		};
	} catch (error) {
		console.error('Accept room invite error:', error);
		return { error: 'Неожиданная ошибка при принятии приглашения' };
	}
}

// Функция для отклонения приглашения
export async function declineRoomInvite(roomId: string, inviteToken: string): Promise<InviteActionResult> {
	try {
		// Получаем токен сессии
		const sessionToken = await getSessionToken();
		if (!sessionToken) {
			return { error: 'Unauthorized' };
		}

		const response = await fetch(`/api/rooms/${roomId}/invites?token=${inviteToken}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${sessionToken}`,
			},
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка отклонения приглашения' };
		}

		return { message: result.message };
	} catch (error) {
		console.error('Decline room invite error:', error);
		return { error: 'Неожиданная ошибка при отклонении приглашения' };
	}
}

// Функция для получения всех приглашений комнаты (только для владельца)
export async function getRoomInvites(roomId: string): Promise<InvitesResult> {
	try {
		// Получаем токен сессии
		const sessionToken = await getSessionToken();
		if (!sessionToken) {
			return { error: 'Unauthorized' };
		}

		const response = await fetch(`/api/rooms/${roomId}/invites/manage`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${sessionToken}`,
			},
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка получения приглашений' };
		}

		return { invites: result.invites };
	} catch (error) {
		console.error('Get room invites error:', error);
		return { error: 'Неожиданная ошибка при получении приглашений' };
	}
}

// Функция для одобрения/отклонения заявки
export async function handleInviteApproval(roomId: string, inviteId: string, action: 'approve' | 'reject'): Promise<InviteActionResult> {
	try {
		// Получаем токен сессии
		const sessionToken = await getSessionToken();
		if (!sessionToken) {
			return { error: 'Unauthorized' };
		}

		const response = await fetch(`/api/rooms/${roomId}/invites/manage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${sessionToken}`,
			},
			body: JSON.stringify({
				inviteId,
				action
			})
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || `Ошибка ${action === 'approve' ? 'одобрения' : 'отклонения'} заявки` };
		}

		return { message: result.message };
	} catch (error) {
		console.error(`Handle invite approval error (${action}):`, error);
		return { error: `Неожиданная ошибка при ${action === 'approve' ? 'одобрении' : 'отклонении'} заявки` };
	}
}

// Функция для отзыва приглашения
export async function revokeRoomInvite(roomId: string, inviteId: string): Promise<InviteActionResult> {
	try {
		// Получаем токен сессии
		const sessionToken = await getSessionToken();
		if (!sessionToken) {
			return { error: 'Unauthorized' };
		}

		const response = await fetch(`/api/rooms/${roomId}/invites/manage`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${sessionToken}`,
			},
			body: JSON.stringify({ inviteId })
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка отзыва приглашения' };
		}

		return { message: result.message };
	} catch (error) {
		console.error('Revoke room invite error:', error);
		return { error: 'Неожиданная ошибка при отзыве приглашения' };
	}
}
