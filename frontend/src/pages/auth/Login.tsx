import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Card, Typography, Space, message } from 'antd';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../shared/contexts/AuthContext';
import { LoginResponse } from '../../shared/types/auth.types';
import './Login.scss';

const { Content } = Layout;
const { Title, Text } = Typography;

/**
 * Strona logowania użytkownika
 * Po pomyślnym logowaniu przekierowuje na /dashboard
 * Jeśli użytkownik jest już zalogowany, automatycznie przekierowuje na /dashboard
 */
const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  /**
   * Przekierowanie jeśli użytkownik jest już zalogowany
   */
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  /**
   * Obsługa pomyślnego logowania
   * - Loguje użytkownika (zapisuje token i dane)
   * - Wyświetla komunikat powitalny
   * - Przekierowuje na dashboard
   */
  const handleSuccess = (response: LoginResponse) => {
    login(response.accessToken, response.user);
    message.success('Witamy z powrotem!');
    navigate('/dashboard');
  };

  return (
    <Layout className="login-page">
      <Content className="login-page__content">
        <Card className="login-page__card">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={2} className="login-page__title">
              Logowanie
            </Title>

            <LoginForm onSuccess={handleSuccess} />

            <Text className="login-page__login-link">
              Nie masz konta? <Link to="/register">Zarejestruj się</Link>
            </Text>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export const Component = Login;
