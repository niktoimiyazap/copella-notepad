// Типы для API управления пользователями

export interface UserPermissions {
  canEdit: boolean;
  canInvite: boolean;
  canDelete: boolean;
}

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface UserManagementUser {
  id: string;
  username: string;
  fullName: string;
  avatarUrl?: string;
  role: "creator" | "admin" | "participant";
  permissions: UserPermissions;
  isOnline: boolean;
  lastSeen: Date | string;
  joinedAt: Date | string;
}

export interface UserManagementApiResponse {
  success: boolean;
  error?: string;
  user?: UserManagementUser;
  users?: UserManagementUser[];
}

export interface UpdatePermissionsRequest {
  userId: string;
  roomId: string;
  permissions?: Partial<UserPermissions>;
  role?: "admin" | "participant";
}

// Режимы отображения интерфейса
export type UserManagementMode = "all-users" | "single-user";

// Конфигурация для открытия API
export interface UserManagementConfig {
  mode: UserManagementMode;
  roomId: string;
  userId?: string; // Требуется только для режима "single-user"
  initialPosition?: WidgetPosition; // Начальная позиция виджета
  onUpdate?: (user: UserManagementUser) => void;
  onClose?: () => void;
}

