// Przykład użycia Ant Design z Zod validation

import { Form, Input, Button, Card, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { z } from 'zod';
import { useAntForm } from '../../shared/hooks';

// Zod schema dla walidacji
const loginSchema = z.object({
  email: z.string().email('Nieprawidłowy adres email'),
  password: z.string().min(8, 'Hasło musi mieć minimum 8 znaków'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function Component() {
  const [form] = Form.useForm();
  
  const { loading, error, handleSubmit } = useAntForm<LoginFormData>(
    loginSchema,
    async (data) => {
      // TODO: Wywołanie API
      console.log('Login data:', data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Mock API call
    }
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: '#f0f2f5'
    }}>
      <Card 
        title="Zaloguj się do Janus AI" 
        style={{ width: 400, maxWidth: '100%' }}
      >
        {error && (
          <Alert
            message="Błąd logowania"
            description={error}
            type="error"
            closable
            style={{ marginBottom: 16 }}
          />
        )}
        
        <Form
          form={form}
          name="login"
          onFinish={(values) => handleSubmit(values, form)}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Proszę wprowadzić email!' },
              { type: 'email', message: 'Nieprawidłowy format email!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="email@example.com" 
              size="large"
            />
          </Form.Item>

          <Form.Item
            label="Hasło"
            name="password"
            rules={[
              { required: true, message: 'Proszę wprowadzić hasło!' },
              { min: 8, message: 'Hasło musi mieć minimum 8 znaków!' }
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="••••••••" 
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading} 
              block 
              size="large"
            >
              Zaloguj się
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center' }}>
          <a href="/register">Nie masz konta? Zarejestruj się</a>
        </div>
      </Card>
    </div>
  );
}

Component.displayName = 'LoginPage';
