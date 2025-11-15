import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { refreshAccessToken } from '../api/auth.api';
import { ReactNode } from 'react';

// Mock auth API
jest.mock('../api/auth.api', () => ({
  refreshAccessToken: jest.fn(),
}));

/**
 * Frontend Unit Tests - AuthContext
 * Testing login/logout flow and token refresh as per test-plan.md
 */
describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  describe('Initial state', () => {
    it('should start with unauthenticated state when no token in localStorage', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
    });

    it('should restore session from localStorage', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      localStorage.setItem('accessToken', 'stored-token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe('stored-token');
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('user', 'invalid-json');

      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.user).toBeNull();
    });
  });

  describe('Login flow', () => {
    it('should update state and localStorage on login', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockToken = 'new-access-token';

      act(() => {
        result.current.login(mockToken, mockUser);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.accessToken).toBe(mockToken);
      expect(localStorage.getItem('accessToken')).toBe(mockToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('should allow login with different users', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      const user1 = { id: 'user-1', email: 'user1@example.com' };
      const user2 = { id: 'user-2', email: 'user2@example.com' };

      act(() => {
        result.current.login('token-1', user1);
      });
      expect(result.current.user).toEqual(user1);

      act(() => {
        result.current.logout();
      });

      act(() => {
        result.current.login('token-2', user2);
      });
      expect(result.current.user).toEqual(user2);
    });
  });

  describe('Logout flow', () => {
    it('should clear state and localStorage on logout', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      localStorage.setItem('accessToken', 'token');
      localStorage.setItem('user', JSON.stringify(mockUser));

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.accessToken).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should handle logout when already logged out', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(() => {
        act(() => {
          result.current.logout();
        });
      }).not.toThrow();

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('Token refresh', () => {
    it('should automatically refresh token after 14 minutes', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const newToken = 'refreshed-token';

      (refreshAccessToken as jest.Mock).mockResolvedValue({
        accessToken: newToken,
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login('original-token', mockUser);
      });

      // Fast-forward 14 minutes
      act(() => {
        jest.advanceTimersByTime(14 * 60 * 1000);
      });

      await waitFor(() => {
        expect(refreshAccessToken).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(result.current.accessToken).toBe(newToken);
      });

      expect(localStorage.getItem('accessToken')).toBe(newToken);
    });

    it('should logout on refresh token failure', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      (refreshAccessToken as jest.Mock).mockRejectedValue(
        new Error('Refresh token expired')
      );

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login('original-token', mockUser);
      });

      // Fast-forward 14 minutes
      act(() => {
        jest.advanceTimersByTime(14 * 60 * 1000);
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should not refresh when not authenticated', () => {
      const { result } = renderHook(() => useAuth(), { wrapper });

      expect(result.current.isAuthenticated).toBe(false);

      // Fast-forward 14 minutes
      act(() => {
        jest.advanceTimersByTime(14 * 60 * 1000);
      });

      expect(refreshAccessToken).not.toHaveBeenCalled();
    });

    it('should clear old refresh interval on logout', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      (refreshAccessToken as jest.Mock).mockResolvedValue({
        accessToken: 'new-token',
      });

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login('token', mockUser);
      });

      act(() => {
        result.current.logout();
      });

      // Fast-forward 14 minutes after logout
      act(() => {
        jest.advanceTimersByTime(14 * 60 * 1000);
      });

      // Should not attempt refresh after logout
      expect(refreshAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('updateAccessToken', () => {
    it('should update token without affecting user data', () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login('original-token', mockUser);
      });

      act(() => {
        result.current.updateAccessToken('new-token');
      });

      expect(result.current.accessToken).toBe('new-token');
      expect(result.current.user).toEqual(mockUser);
      expect(localStorage.getItem('accessToken')).toBe('new-token');
    });
  });

  describe('Hook usage outside provider', () => {
    it('should throw error when useAuth used outside AuthProvider', () => {
      // Suppress console.error for this test
      const originalError = console.error;
      console.error = jest.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');

      console.error = originalError;
    });
  });

  describe('Multiple refresh cycles', () => {
    it('should handle multiple refresh intervals correctly', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      (refreshAccessToken as jest.Mock)
        .mockResolvedValueOnce({ accessToken: 'token-refresh-1' })
        .mockResolvedValueOnce({ accessToken: 'token-refresh-2' })
        .mockResolvedValueOnce({ accessToken: 'token-refresh-3' });

      const { result } = renderHook(() => useAuth(), { wrapper });

      act(() => {
        result.current.login('original-token', mockUser);
      });

      // First refresh (14 min)
      act(() => {
        jest.advanceTimersByTime(14 * 60 * 1000);
      });

      await waitFor(() => {
        expect(result.current.accessToken).toBe('token-refresh-1');
      });

      // Second refresh (28 min total)
      act(() => {
        jest.advanceTimersByTime(14 * 60 * 1000);
      });

      await waitFor(() => {
        expect(result.current.accessToken).toBe('token-refresh-2');
      });

      expect(refreshAccessToken).toHaveBeenCalledTimes(2);
    });
  });
});
