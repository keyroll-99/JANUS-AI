import { useNavigate, Link } from 'react-router-dom';
import { Layout, Card, Typography, Space, message } from 'antd';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { useAuth } from '../../shared/contexts/AuthContext';
import { RegisterResponse } from '../../shared/types/auth.types';
import './Register.scss';

const { Content } = Layout;
const { Title, Text } = Typography;

/**
 * Strona rejestracji nowego użytkownika
 * Po pomyślnej rejestracji przekierowuje na /onboarding
 */
const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  /**
   * Obsługa pomyślnej rejestracji
   * - Loguje użytkownika (zapisuje token i dane)
   * - Wyświetla komunikat powitalny
   * - Przekierowuje na stronę onboardingu
   */
  const handleSuccess = (response: RegisterResponse) => {
    login(response.accessToken, response.user);
    message.success('Witamy w Janus AI!');
    navigate('/onboarding');
  };

  return (
    <Layout className="register-page">
      <Content className="register-page__content">
        <Card className="register-page__card">
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Title level={2} className="register-page__title">
              Rejestracja
            </Title>

            <RegisterForm onSuccess={handleSuccess} />

            <Text className="register-page__login-link">
              Masz już konto? <Link to="/login">Zaloguj się</Link>
            </Text>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};

export const Component = Register;
