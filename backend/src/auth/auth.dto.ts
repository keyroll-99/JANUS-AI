import { z } from 'zod';

/**
 * Schema for user registration
 * Validates email format and password strength
 */
export const RegisterUserSchema = z.object({
  email: z
    .email({ error: 'Invalid email format.' })
    .transform(val => val.trim().toLowerCase()),
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters long.' })
    .max(72, { error: 'Password must not exceed 72 characters.' }),
});

export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;

/**
 * Schema for user login
 * Validates required email and password fields
 */
export const LoginUserSchema = z.object({
  email: z
    .email({ error: 'Invalid email format.' })
    .transform(val => val.trim().toLowerCase()),
  password: z
    .string()
    .min(1, { error: 'Password is required.' }),
});

export type LoginUserDto = z.infer<typeof LoginUserSchema>;

/**
 * Response type for successful authentication
 * Contains access token, refresh token, and user data
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * Response type for token refresh
 */
export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}
