import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { refreshAccessToken } from '../api/auth.api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider dla kontekstu uwierzytelnienia
 * Zarządza stanem użytkownika, tokenem dostępu i automatycznym odświeżaniem tokena
 */
export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    // Inicjalizacja z localStorage
    return localStorage.getItem('accessToken');
  });
  const [user, setUser] = useState<User | null>(() => {
    // Inicjalizacja z localStorage
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  /**
   * Zapisuje token i dane użytkownika po pomyślnym logowaniu/rejestracji
   */
  const login = (token: string, userData: User) => {
    setAccessToken(token);
    setUser(userData);
    localStorage.setItem('accessToken', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  /**
   * Czyści token i dane użytkownika po wylogowaniu
   */
  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  };

  /**
   * Aktualizuje token dostępu (używane przy odświeżaniu)
   */
  const updateAccessToken = (token: string) => {
    setAccessToken(token);
    localStorage.setItem('accessToken', token);
  };

  /**
   * Automatyczne odświeżanie tokena co 14 minut (token wygasa po 15 minutach)
   */
  useEffect(() => {
    if (!accessToken) return;

    const refreshInterval = setInterval(
      async () => {
        try {
          const response = await refreshAccessToken();
          updateAccessToken(response.accessToken);
        } catch (error) {
          console.error('Failed to refresh token:', error);
          logout();
        }
      },
      14 * 60 * 1000
    ); // 14 minut

    return () => clearInterval(refreshInterval);
  }, [accessToken]);

  const value: AuthContextType = {
    isAuthenticated: !!accessToken,
    user,
    accessToken,
    login,
    logout,
    updateAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook do używania kontekstu uwierzytelnienia
 * @throws Error jeśli użyty poza AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
