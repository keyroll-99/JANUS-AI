import { AuthService } from '../../../src/auth/auth.service';
import { supabase } from '../../../src/shared/config/supabase';
import { AuthError } from '@supabase/supabase-js';

// Mock Supabase client
jest.mock('../../../src/shared/config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      refreshSession: jest.fn(),
      signOut: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'authenticated',
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_in: 3600,
        token_type: 'bearer',
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const result = await authService.register({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should throw error when email already exists', async () => {
      const mockError = {
        message: 'User already registered',
        name: 'AuthApiError',
        status: 400,
      } as AuthError;

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('An account with this email already exists.');
    });

    it('should throw error when session is not created', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'test@example.com' },
          session: null,
        },
        error: null,
      });

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow('Registration succeeded but session was not created.');
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'authenticated',
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
        expires_in: 3600,
        token_type: 'bearer',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: {
          user: mockUser,
          session: mockSession,
        },
        error: null,
      });

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual({
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123',
        user: {
          id: 'user-123',
          email: 'test@example.com',
        },
      });
    });

    it('should throw error with invalid credentials', async () => {
      const mockError = {
        message: 'Invalid login credentials',
        name: 'AuthApiError',
        status: 400,
      } as AuthError;

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password.');
    });
  });

  describe('refresh', () => {
    it('should successfully refresh access token', async () => {
      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
      };

      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: {
          session: mockSession,
        },
        error: null,
      });

      const result = await authService.refresh('old-refresh-token');

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });

      expect(supabase.auth.refreshSession).toHaveBeenCalledWith({
        refresh_token: 'old-refresh-token',
      });
    });

    it('should throw error with invalid refresh token', async () => {
      const mockError = {
        message: 'Invalid Refresh Token: Not Found',
        name: 'AuthApiError',
        status: 400,
      } as AuthError;

      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: mockError,
      });

      await expect(
        authService.refresh('invalid-token')
      ).rejects.toThrow('Your session has expired. Please log in again.');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      await expect(
        authService.logout('refresh-token')
      ).resolves.not.toThrow();

      expect(supabase.auth.setSession).toHaveBeenCalled();
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should not throw error even if signOut fails', async () => {
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      const mockError = {
        message: 'Session not found',
        name: 'AuthApiError',
      } as AuthError;

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      // Should not throw - logout is best-effort
      await expect(
        authService.logout('refresh-token')
      ).resolves.not.toThrow();
    });
  });
});
