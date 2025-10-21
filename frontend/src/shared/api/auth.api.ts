import {
  RegisterRequestDto,
  RegisterResponse,
  LoginRequestDto,
  LoginResponse,
  ApiError,
} from '../types/auth.types';

/**
 * Rejestracja nowego użytkownika
 * @param data - dane rejestracyjne (email, password)
 * @returns Promise z tokenem dostępu i danymi użytkownika
 * @throws ApiError w przypadku błędu (400, 409, 500)
 */
export const registerUser = async (
  data: RegisterRequestDto
): Promise<RegisterResponse> => {
  const response = await fetch('/api/v1/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include', // Ważne dla httpOnly cookies (refreshToken)
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }

  return response.json();
};

/**
 * Logowanie użytkownika
 * @param data - dane logowania (email, password)
 * @returns Promise z tokenem dostępu i danymi użytkownika
 * @throws ApiError w przypadku błędu (401, 400, 500)
 */
export const loginUser = async (
  data: LoginRequestDto
): Promise<LoginResponse> => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }

  return response.json();
};

/**
 * Wylogowanie użytkownika (usuwa refreshToken z cookie)
 * @throws ApiError w przypadku błędu
 */
export const logoutUser = async (): Promise<void> => {
  const response = await fetch('/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }
};

/**
 * Odświeżenie tokenu dostępu przy użyciu refreshToken z cookie
 * @returns Promise z nowym tokenem dostępu
 * @throws ApiError w przypadku błędu (401)
 */
export const refreshAccessToken = async (): Promise<{
  accessToken: string;
}> => {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error: ApiError = await response.json();
    throw error;
  }

  return response.json();
};
