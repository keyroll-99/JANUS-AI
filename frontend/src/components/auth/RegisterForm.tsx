import { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import {
  RegisterFormValues,
  RegisterResponse,
  ApiError,
} from '../../shared/types/auth.types';
import { registerUser } from '../../shared/api/auth.api';

interface RegisterFormProps {
  onSuccess: (response: RegisterResponse) => void;
  onError?: (error: ApiError) => void;
}

/**
 * Formularz rejestracji użytkownika
 * Zawiera pola: email, password, confirmPassword z walidacją
 */
export const RegisterForm = ({ onSuccess, onError }: RegisterFormProps) => {
  const [form] = Form.useForm<RegisterFormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obsługa wysłania formularza po pomyślnej walidacji
   */
  const handleFinish = async (values: RegisterFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await registerUser({
        email: values.email.toLowerCase().trim(),
        password: values.password,
      });
      onSuccess(response);
    } catch (err: unknown) {
      let errorMessage = 'Wystąpił nieoczekiwany błąd.';

      if (err instanceof TypeError && err.message === 'Failed to fetch') {
        errorMessage =
          'Brak połączenia z internetem. Sprawdź swoje połączenie i spróbuj ponownie.';
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }

      // Specjalna obsługa dla błędu 409 (duplikat użytkownika)
      if (err && typeof err === 'object' && 'statusCode' in err && err.statusCode === 409) {
        errorMessage =
          'Użytkownik o tym adresie e-mail już istnieje. Jeśli posiadasz już konto, zaloguj się.';
      }

      setError(errorMessage);
      if (onError && err && typeof err === 'object') {
        onError(err as ApiError);
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
        rules={[
          { required: true, message: 'Hasło jest wymagane' },
          { min: 8, message: 'Hasło musi mieć co najmniej 8 znaków' },
          { max: 72, message: 'Hasło nie może przekraczać 72 znaków' },
        ]}
      >
        <Input.Password placeholder="••••••••" />
      </Form.Item>

      <Form.Item
        label="Powtórz hasło"
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: 'Potwierdzenie hasła jest wymagane' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('Hasła muszą być identyczne'));
            },
          }),
        ]}
      >
        <Input.Password placeholder="••••••••" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Zarejestruj się
        </Button>
      </Form.Item>
    </Form>
  );
};
