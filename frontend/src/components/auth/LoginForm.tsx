import { useState } from 'react';
import { Form, Input, Button, Alert, Checkbox } from 'antd';
import {
  LoginFormValues,
  LoginResponse,
  ApiError,
} from '../../shared/types/auth.types';
import { loginUser } from '../../shared/api/auth.api';

interface LoginFormProps {
  onSuccess: (response: LoginResponse) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Formularz logowania użytkownika
 * Zawiera pola: email, password i opcjonalny checkbox "Zapamiętaj mnie"
 */
export const LoginForm = ({ onSuccess, onError }: LoginFormProps) => {
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obsługa wysłania formularza po pomyślnej walidacji
   */
  const handleFinish = async (values: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await loginUser({
        email: values.email.toLowerCase().trim(),
        password: values.password,
      });
      onSuccess(response);
    } catch (err: any) {
      let errorMessage = 'Wystąpił nieoczekiwany błąd.';

      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        errorMessage =
          'Brak połączenia z internetem. Sprawdź swoje połączenie i spróbuj ponownie.';
      } else if (err.statusCode === 401) {
        errorMessage = 'Nieprawidłowy adres e-mail lub hasło.';
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Czyszczenie komunikatu błędu podczas edycji formularza
   */
  const handleValuesChange = () => {
    if (error) {
      setError(null);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      onValuesChange={handleValuesChange}
      autoComplete="off"
      initialValues={{ remember: false }}
      size="large"
    >
      {error && (
        <Form.Item>
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
          />
        </Form.Item>
      )}

      <Form.Item
        label="Adres e-mail"
        name="email"
        rules={[
          { required: true, message: 'Adres e-mail jest wymagany' },
          { type: 'email', message: 'Wprowadź poprawny adres e-mail' },
        ]}
      >
        <Input placeholder="twoj@email.com" />
      </Form.Item>

      <Form.Item
        label="Hasło"
        name="password"
        rules={[{ required: true, message: 'Hasło jest wymagane' }]}
      >
        <Input.Password placeholder="••••••••" />
      </Form.Item>

      <Form.Item name="remember" valuePropName="checked" noStyle>
        <Checkbox>Zapamiętaj mnie</Checkbox>
      </Form.Item>

      <Form.Item style={{ marginTop: '16px' }}>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Zaloguj się
        </Button>
      </Form.Item>
    </Form>
  );
};
