export type UserRole = 'admin' | 'moderator' | 'user'; // admin = создатель
export type UserStatus = 'active' | 'inactive' | 'pending';

export interface UserPermissions {
	canEdit: boolean;
	canInvite: boolean;
	canDelete: boolean;
	canManageUsers: boolean;
}

export interface User {
	id: string;
	username: string;
	email: string;
	role: UserRole;
	status: UserStatus;
	lastActive: Date;
	avatar: string | null;
	permissions: UserPermissions;
	// Дополнительные поля для совместимости с реальными данными
	name?: string; // Для обратной совместимости
	createdAt?: Date;
	updatedAt?: Date;
}

export interface UserFilters {
	role?: UserRole;
	status?: UserStatus;
	search?: string;
}

export interface BulkAction {
	id: string;
	label: string;
	icon?: string;
	requiresConfirmation?: boolean;
}
