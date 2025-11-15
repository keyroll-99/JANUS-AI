import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route wrapper
 * Sprawdza czy użytkownik jest zalogowany
 * Jeśli nie - przekierowuje na /login
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Nie renderuj nic dopóki nie zweryfikujemy autentykacji
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
