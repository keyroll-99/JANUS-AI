import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../shared/contexts/AuthContext';
import { Spin } from 'antd';

/**
 * Strona główna - przekierowuje na dashboard lub login
 * w zależności od stanu uwierzytelnienia
 */
const Home = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Pokazujemy spinner podczas przekierowania
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <Spin size="large" />
    </div>
  );
};

export const Component = Home;
