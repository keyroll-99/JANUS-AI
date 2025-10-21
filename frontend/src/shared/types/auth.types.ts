/**
 * Wartości formularza rejestracji (frontend)
 */
export interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * DTO wysyłane do API (zgodne z backend)
 */
export interface RegisterRequestDto {
  email: string;
  password: string;
}

/**
 * Odpowiedź z API po pomyślnej rejestracji
 */
export interface RegisterResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * Wartości formularza logowania (frontend)
 */
export interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

/**
 * DTO logowania wysyłane do API
 */
export interface LoginRequestDto {
  email: string;
  password: string;
}

/**
 * Odpowiedź z API po pomyślnym logowaniu
 */
export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * Struktura błędu zwracanego przez API
 */
export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
