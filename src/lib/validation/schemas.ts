// Схемы валидации с Zod
import { z } from 'zod';

// Схема для логина
export const loginSchema = z.object({
	email: z
		.string()
		.min(1, 'Email обязателен')
		.email('Введите корректный email адрес'),
	password: z
		.string()
		.min(6, 'Пароль должен содержать минимум 6 символов')
		.max(100, 'Пароль не должен превышать 100 символов')
});

// Схема для регистрации (шаг 1A - имя и email)
export const registerStep1ASchema = z.object({
	fullName: z
		.string()
		.min(2, 'Имя должно содержать минимум 2 символа')
		.max(50, 'Имя не должно превышать 50 символов')
		.trim(),
	email: z
		.string()
		.min(1, 'Email обязателен')
		.email('Введите корректный email адрес')
		.toLowerCase()
});

// Схема для регистрации (шаг 1B - пароль)
export const registerStep1BSchema = z
	.object({
		password: z
			.string()
			.min(6, 'Пароль должен содержать минимум 6 символов')
			.max(100, 'Пароль не должен превышать 100 символов'),
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Пароли не совпадают',
		path: ['confirmPassword']
	});

// Схема для выбора username
export const usernameSchema = z.object({
	username: z
		.string()
		.min(3, 'Никнейм должен содержать минимум 3 символа')
		.max(20, 'Никнейм не должен превышать 20 символов')
		.regex(/^[a-zA-Z0-9_]+$/, 'Никнейм может содержать только буквы, цифры и символ _')
		.toLowerCase()
});

// Схема для создания комнаты
export const createRoomSchema = z.object({
	title: z
		.string()
		.min(3, 'Название должно содержать минимум 3 символа')
		.max(100, 'Название не должно превышать 100 символов')
		.trim(),
	description: z
		.string()
		.max(500, 'Описание не должно превышать 500 символов')
		.trim()
		.optional(),
	isPublic: z.boolean().default(false),
	participantLimit: z
		.number()
		.min(2, 'Минимум 2 участника')
		.max(100, 'Максимум 100 участников')
		.default(10),
	allowEdit: z.boolean().default(true),
	allowInvite: z.boolean().default(true),
	allowDelete: z.boolean().default(false),
	requireApproval: z.boolean().default(false)
});

// Схема для создания заметки
export const createNoteSchema = z.object({
	title: z
		.string()
		.min(1, 'Название обязательно')
		.max(200, 'Название не должно превышать 200 символов')
		.trim(),
	content: z.string().optional()
});

// Схема для обновления профиля
export const updateProfileSchema = z.object({
	fullName: z
		.string()
		.min(2, 'Имя должно содержать минимум 2 символа')
		.max(50, 'Имя не должно превышать 50 символов')
		.trim()
		.optional(),
	username: z
		.string()
		.min(3, 'Никнейм должен содержать минимум 3 символа')
		.max(20, 'Никнейм не должен превышать 20 символов')
		.regex(/^[a-zA-Z0-9_]+$/, 'Никнейм может содержать только буквы, цифры и символ _')
		.toLowerCase()
		.optional(),
	avatarUrl: z.string().url('Неверный формат URL').optional().or(z.literal(''))
});

// Типы из схем (автоматически!)
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterStep1AInput = z.infer<typeof registerStep1ASchema>;
export type RegisterStep1BInput = z.infer<typeof registerStep1BSchema>;
export type UsernameInput = z.infer<typeof usernameSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Утилита для получения первой ошибки
export function getFirstError(errors: z.ZodError): string {
	return errors.errors[0]?.message || 'Ошибка валидации';
}

// Утилита для получения ошибок по полям
export function getFieldErrors(errors: z.ZodError): Record<string, string> {
	const fieldErrors: Record<string, string> = {};
	
	errors.errors.forEach((error) => {
		const field = error.path[0] as string;
		if (field && !fieldErrors[field]) {
			fieldErrors[field] = error.message;
		}
	});
	
	return fieldErrors;
}

