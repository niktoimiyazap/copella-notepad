// Функции для работы с заявками на вступление в комнату

// Функция для получения токена сессии
async function getSessionToken(): Promise<string | null> {
	try {
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

// Типы
export interface PendingApproval {
	id: string;
	roomId: string;
	invitedBy: string;
	requestedBy: string;
	inviteToken: string;
	status: 'pending_approval';
	expiresAt: string;
	createdAt: string;
	updatedAt: string;
	requester: {
		id: string;
		username: string;
		fullName: string;
		avatarUrl?: string;
		email?: string;
	};
	inviter: {
		id: string;
		username: string;
		fullName: string;
		avatarUrl?: string;
	};
}

export interface ApprovalsResult {
	approvals?: PendingApproval[];
	error?: string;
}

export interface ApprovalActionResult {
	message?: string;
	error?: string;
}

// Получение списка ожидающих заявок для комнаты
export async function getPendingApprovals(roomId: string): Promise<ApprovalsResult> {
	try {
		const sessionToken = await getSessionToken();
		if (!sessionToken) {
			return { error: 'Unauthorized' };
		}

		const response = await fetch(`/api/rooms/${roomId}/approvals`, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${sessionToken}`,
			},
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка получения заявок' };
		}

		return { approvals: result.approvals };
	} catch (error) {
		console.error('Get pending approvals error:', error);
		return { error: 'Неожиданная ошибка при получении заявок' };
	}
}

// Одобрение заявки
export async function approveRequest(roomId: string, inviteId: string): Promise<ApprovalActionResult> {
	try {
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
				action: 'approve'
			})
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка одобрения заявки' };
		}

		return { message: result.message };
	} catch (error) {
		console.error('Approve request error:', error);
		return { error: 'Неожиданная ошибка при одобрении заявки' };
	}
}

// Отклонение заявки
export async function rejectRequest(roomId: string, inviteId: string): Promise<ApprovalActionResult> {
	try {
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
				action: 'reject'
			})
		});

		const result = await response.json();

		if (!response.ok) {
			return { error: result.error || 'Ошибка отклонения заявки' };
		}

		return { message: result.message };
	} catch (error) {
		console.error('Reject request error:', error);
		return { error: 'Неожиданная ошибка при отклонении заявки' };
	}
}

