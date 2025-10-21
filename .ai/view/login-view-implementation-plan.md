# Plan implementacji widoku Logowania

## 1. Przegląd

Widok logowania umożliwia istniejącym użytkownikom uwierzytelnienie się w aplikacji Janus AI przy użyciu adresu e-mail i hasła. Po pomyślnym zalogowaniu użytkownik jest przekierowywany na główny Dashboard.

## 2. Routing widoku

**Ścieżka**: `/login`

**Typ trasy**: Publiczna (dostępna dla niezalogowanych użytkowników)

**Przekierowanie**: 
- Po pomyślnym logowaniu → `/dashboard`
- Jeśli użytkownik jest już zalogowany → automatyczne przekierowanie na `/dashboard`

## 3. Struktura komponentów

```
LoginPage
├── Layout (Ant Design)
│   └── Content
│       ├── Card
│       │   ├── Typography.Title (Nagłówek "Logowanie")
│       │   ├── LoginForm
│       │   │   ├── Form.Item (Email)
│       │   │   │   └── Input
│       │   │   ├── Form.Item (Hasło)
│       │   │   │   └── Input.Password
│       │   │   ├── Form.Item (Checkbox "Zapamiętaj mnie")
│       │   │   │   └── Checkbox
│       │   │   ├── Alert (komunikaty błędów)
│       │   │   └── Button (Zaloguj się)
│       │   └── Link (do strony rejestracji)
```

## 4. Szczegóły komponentów

### LoginPage

- **Opis komponentu**: Główny komponent strony logowania, odpowiedzialny za renderowanie formularza i obsługę procesu uwierzytelniania.
- **Główne elementy**: 
  - `Layout` z wycentrowanym `Content`
  - `Card` jako kontener dla formularza (max-width: 400px)
  - `Typography.Title` z tekstem "Logowanie"
  - `LoginForm` - zagnieżdżony komponent formularza
  - `Typography.Text` z linkiem do strony rejestracji
- **Obsługiwane zdarzenia**:
  - `onLoginSuccess` - obsługa pomyślnego logowania i przekierowanie
  - `onLoginError` - obsługa błędów logowania
- **Warunki walidacji**: Brak (delegowane do `LoginForm`)
- **Typy**: `LoginFormValues`, `LoginResponse`, `ApiError`
- **Propsy**: Brak (główny widok)

### LoginForm

- **Opis komponentu**: Formularz Ant Design zawierający pola do wprowadzenia danych logowania. Obsługuje walidację, komunikaty błędów i wysyłanie danych do API.
- **Główne elementy**:
  - `Form` z `layout="vertical"`
  - `Form.Item` dla pola email z `Input`
  - `Form.Item` dla pola hasła z `Input.Password` (showPassword toggle)
  - `Form.Item` dla checkboxa "Zapamiętaj mnie" (opcjonalne dla MVP)
  - `Alert` warunkowy (wyświetlany przy błędach API)
  - `Button` typu "primary" z `htmlType="submit"` i stanem `loading`
- **Obsługiwane zdarzenia**:
  - `onFinish` - wysłanie formularza po pomyślnej walidacji
  - `onValuesChange` - czyszczenie komunikatów błędów podczas edycji
- **Obsługiwana walidacja**:
  - **Email**:
    - Pole wymagane: "Adres e-mail jest wymagany"
    - Format email: "Wprowadź poprawny adres e-mail"
  - **Hasło**:
    - Pole wymagane: "Hasło jest wymagane"
  - **Remember me**: Brak walidacji (opcjonalne pole)
- **Typy**: `LoginFormValues`, `LoginResponse`, `ApiError`
- **Propsy**:
  - `onSuccess: (response: LoginResponse) => void` - callback po pomyślnym logowaniu
  - `onError?: (error: ApiError) => void` - opcjonalny callback po błędzie

## 5. Typy

### LoginFormValues

```typescript
/**
 * Wartości formularza logowania (frontend)
 */
interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean; // Opcjonalne dla MVP
}
```

### LoginRequestDto

```typescript
/**
 * DTO wysyłane do API (zgodne z backend)
 */
interface LoginRequestDto {
  email: string;
  password: string;
}
```

### LoginResponse

```typescript
/**
 * Odpowiedź z API po pomyślnym logowaniu
 */
interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}
```

### ApiError

```typescript
/**
 * Struktura błędu zwracanego przez API
 */
interface ApiError {
  message: string;
  statusCode: number;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

## 6. Zarządzanie stanem

### Stan lokalny (useState)

- `loading: boolean` - stan ładowania podczas wysyłania żądania (blokuje przycisk)
- `error: string | null` - komunikat błędu z API do wyświetlenia w `Alert`

### Kontekst globalny (AuthContext)

Po pomyślnym logowaniu należy zaktualizować globalny stan uwierzytelnienia:
- Zapisać `accessToken` w kontekście
- Zapisać dane użytkownika (`user.id`, `user.email`)
- `refreshToken` jest automatycznie zapisywany w httpOnly cookie przez backend

### Custom hook

**useAuth** - hook zwracający:
- `login(accessToken, user)` - funkcja do ustawienia stanu uwierzytelnienia
- `isAuthenticated: boolean` - status uwierzytelnienia
- Używany po pomyślnym logowaniu do zapisania tokenów

## 7. Integracja API

### Endpoint

**POST** `/api/v1/auth/login`

### Request

**Typ żądania**: `LoginRequestDto`

```typescript
{
  email: string; // lowercase, trimmed
  password: string;
}
```

**Headers**:
```typescript
{
  'Content-Type': 'application/json'
}
```

### Response

**Success (200 OK)**: `LoginResponse`

```typescript
{
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}
```

**Uwaga**: `refreshToken` jest automatycznie ustawiany w httpOnly cookie przez backend.

**Error responses**:
- `400 Bad Request`: Brak email lub hasła
  ```typescript
  {
    message: "Missing email or password.",
    statusCode: 400
  }
  ```
- `401 Unauthorized`: Nieprawidłowe dane logowania
  ```typescript
  {
    message: "Invalid credentials.",
    statusCode: 401
  }
  ```

### Implementacja wywołania

```typescript
const loginUser = async (data: LoginRequestDto): Promise<LoginResponse> => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include', // Ważne dla httpOnly cookies
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
};
```

## 8. Interakcje użytkownika

### Wypełnianie formularza

1. Użytkownik wprowadza adres e-mail
   - Walidacja formatu email w czasie rzeczywistym (po onBlur)
   - Automatyczne czyszczenie komunikatu błędu z API
   - Transform do lowercase i trim

2. Użytkownik wprowadza hasło
   - Toggle "pokaż/ukryj hasło" dla lepszego UX
   - Brak walidacji złożoności (tylko wymagane pole)

3. Użytkownik opcjonalnie zaznacza "Zapamiętaj mnie"
   - Funkcjonalność do implementacji w przyszłości
   - Może przedłużyć ważność sesji

### Wysyłanie formularza

1. Użytkownik klika "Zaloguj się"
   - Przycisk zmienia się w stan `loading` (spinner + disabled)
   - Formularz blokuje edycję (disabled)

2. W przypadku sukcesu:
   - Wywołanie `useAuth().login(accessToken, user)`
   - Przekierowanie na `/dashboard` za pomocą `useNavigate()`
   - Opcjonalnie: wyświetlenie toast notification "Witamy z powrotem!"

3. W przypadku błędu:
   - Wyświetlenie `Alert` typu "error" nad formularzem
   - Przycisk wraca do normalnego stanu
   - Użytkownik może poprawić dane i spróbować ponownie

### Nawigacja do rejestracji

- Link "Nie masz konta? Zarejestruj się" pod formularzem
- Przekierowanie na `/register` za pomocą React Router `Link`

### Link do odzyskiwania hasła (przyszłość)

- Placeholder: "Zapomniałeś hasła?" (nieaktywny w MVP)
- Do implementacji w przyszłych wersjach

## 9. Warunki i walidacja

### Walidacja po stronie frontendu

Wszystkie warunki są weryfikowane przez Ant Design Form przed wysłaniem żądania:

| Pole | Warunek | Komunikat | Komponent |
|------|---------|-----------|-----------|
| Email | Pole wymagane | "Adres e-mail jest wymagany" | LoginForm |
| Email | Format email | "Wprowadź poprawny adres e-mail" | LoginForm |
| Password | Pole wymagane | "Hasło jest wymagane" | LoginForm |

### Walidacja po stronie backendu

Backend przeprowadza walidację (zgodnie z `LoginUserSchema`):
- Email jest wymagany
- Password jest wymagany
- Weryfikacja danych w bazie (email + hashed password)

### Wpływ na stan interfejsu

- **Przed walidacją**: Formularz jest aktywny, przycisk enabled
- **Podczas walidacji**: Ant Design pokazuje czerwone obramowanie i komunikaty pod polami
- **Po niepowodzeniu walidacji**: Fokus na pierwszym błędnym polu
- **Po błędzie API**: `Alert` z komunikatem, formularz odblokowany do poprawy

## 10. Obsługa błędów

### Błędy walidacji frontendu

- **Realizacja**: Ant Design Form automatycznie wyświetla błędy pod polami
- **Styl**: Czerwone obramowanie, ikona ostrzeżenia, tekst pomocniczy
- **Fokus**: Automatyczne przeniesienie fokusa na pierwsze pole z błędem

### Błędy API

#### 400 Bad Request (Brak danych)

```typescript
{
  message: "Missing email or password.",
  statusCode: 400
}
```

**Obsługa**: Wyświetlenie `Alert` typu "error" nad formularzem z tekstem z `message`

#### 401 Unauthorized (Nieprawidłowe dane)

```typescript
{
  message: "Invalid credentials.",
  statusCode: 401
}
```

**Obsługa**: 
- Wyświetlenie `Alert` z przyjaznym komunikatem: "Nieprawidłowy adres e-mail lub hasło."
- Podkreślenie obu pól jako błędnych (opcjonalne)
- Sugestia: "Sprawdź swoje dane lub [zarejestruj się](/register), jeśli nie masz konta."

#### 500 Internal Server Error

**Obsługa**: Wyświetlenie generycznego komunikatu w `Alert`:
```
"Wystąpił błąd serwera. Spróbuj ponownie później."
```

### Błędy sieciowe

**Przypadek**: Brak połączenia z internetem lub timeout

**Obsługa**:
```typescript
try {
  const response = await loginUser(data);
  // ...
} catch (error) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    setError('Brak połączenia z internetem. Sprawdź swoje połączenie i spróbuj ponownie.');
  } else {
    setError(error.message || 'Wystąpił nieoczekiwany błąd.');
  }
}
```

### Przypadki brzegowe

1. **Email z dużymi literami**: Transform do lowercase przed wysłaniem
2. **Spacje w email**: Automatyczne trimowanie
3. **Puste pole hasła**: Walidacja na froncie "Hasło jest wymagane"
4. **Wielokrotne kliknięcie przycisku**: Przycisk disabled podczas `loading`
5. **Próba logowania przez zalogowanego użytkownika**: Automatyczne przekierowanie na `/dashboard`

## 11. Kroki implementacji

### Krok 1: Rozszerzenie typów auth (jeśli nie istnieją)

**Lokalizacja**: `frontend/src/shared/types/auth.types.ts`

```typescript
export interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean;
}

export interface LoginRequestDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

// ApiError już zdefiniowany w pliku register
```

### Krok 2: Dodanie funkcji API dla logowania

**Lokalizacja**: `frontend/src/shared/api/auth.api.ts`

```typescript
import { LoginRequestDto, LoginResponse } from '../types/auth.types';

export const loginUser = async (data: LoginRequestDto): Promise<LoginResponse> => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
};
```

### Krok 3: Utworzenie komponentu LoginForm

**Lokalizacja**: `frontend/src/components/auth/LoginForm.tsx`

```typescript
import { useState } from 'react';
import { Form, Input, Button, Alert, Checkbox } from 'antd';
import { LoginFormValues, LoginResponse, ApiError } from '../../shared/types/auth.types';
import { loginUser } from '../../shared/api/auth.api';

interface LoginFormProps {
  onSuccess: (response: LoginResponse) => void;
  onError?: (error: ApiError) => void;
}

export const LoginForm = ({ onSuccess, onError }: LoginFormProps) => {
  const [form] = Form.useForm<LoginFormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      
      if (err.statusCode === 401) {
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
    >
      {error && (
        <Form.Item>
          <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
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
        <Input placeholder="twoj@email.com" size="large" />
      </Form.Item>

      <Form.Item
        label="Hasło"
        name="password"
        rules={[
          { required: true, message: 'Hasło jest wymagane' },
        ]}
      >
        <Input.Password placeholder="••••••••" size="large" />
      </Form.Item>

      <Form.Item name="remember" valuePropName="checked" noStyle>
        <Checkbox>Zapamiętaj mnie</Checkbox>
      </Form.Item>

      <Form.Item style={{ marginTop: '16px' }}>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Zaloguj się
        </Button>
      </Form.Item>
    </Form>
  );
};
```

### Krok 4: Utworzenie strony LoginPage

**Lokalizacja**: `frontend/src/pages/auth/LoginPage.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Card, Typography, Space, message } from 'antd';
import { LoginForm } from '../../components/auth/LoginForm';
import { useAuth } from '../../shared/contexts/AuthContext';
import { LoginResponse } from '../../shared/types/auth.types';
import './LoginPage.scss';

const { Content } = Layout;
const { Title, Text } = Typography;

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Przekierowanie jeśli użytkownik jest już zalogowany
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

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

            <Text className="login-page__register-link">
              Nie masz konta? <Link to="/register">Zarejestruj się</Link>
            </Text>
          </Space>
        </Card>
      </Content>
    </Layout>
  );
};
```

### Krok 5: Utworzenie stylów SCSS

**Lokalizacja**: `frontend/src/pages/auth/LoginPage.scss`

```scss
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

  &__content {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  &__card {
    width: 100%;
    max-width: 400px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  }

  &__title {
    text-align: center;
    margin-bottom: 0;
  }

  &__register-link {
    display: block;
    text-align: center;
  }
}
```

### Krok 6: Dodanie routing w App.tsx

**Lokalizacja**: `frontend/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './shared/contexts/AuthContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
// ... inne importy

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* ... inne trasy */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Krok 7: Testowanie

1. **Testy jednostkowe** (`LoginForm.test.tsx`):
   - Walidacja pól formularza
   - Obsługa submit
   - Wyświetlanie błędów

2. **Testy integracyjne**:
   - Pomyślne logowanie i przekierowanie
   - Obsługa błędów API (400, 401, 500)
   - Obsługa błędów sieciowych
   - Przekierowanie zalogowanego użytkownika

3. **Testy E2E** (Playwright):
   - Pełny flow logowania
   - Walidacja responsywności (mobile/desktop)
   - Accessibility (WCAG)
   - Integracja z remember me

### Krok 8: Optymalizacja i polishing

- Dodanie animacji przejść (fade-in dla Alert)
- Implementacja "Forgot password" (w przyszłości)
- Dodanie analytics tracking (optional)
- Obsługa "Remember me" (przechowywanie preferencji)
- Rate limiting UI feedback (po wielokrotnych nieudanych próbach)
