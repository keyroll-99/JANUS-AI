# Plan implementacji widoku Rejestracji

## 1. Przegląd

Widok rejestracji umożliwia nowym użytkownikom założenie konta w aplikacji Janus AI przy użyciu adresu e-mail i hasła. Po pomyślnej rejestracji użytkownik jest automatycznie logowany i przekierowywany do strony onboardingu.

## 2. Routing widoku

**Ścieżka**: `/register`

**Typ trasy**: Publiczna (dostępna dla niezalogowanych użytkowników)

**Przekierowanie**: Po pomyślnej rejestracji użytkownik zostaje automatycznie przekierowany na `/onboarding`

## 3. Struktura komponentów

```
RegisterPage
├── Layout (Ant Design)
│   └── Content
│       ├── Card
│       │   ├── Typography.Title (Nagłówek "Rejestracja")
│       │   ├── RegisterForm
│       │   │   ├── Form.Item (Email)
│       │   │   │   └── Input
│       │   │   ├── Form.Item (Hasło)
│       │   │   │   └── Input.Password
│       │   │   ├── Form.Item (Powtórz hasło)
│       │   │   │   └── Input.Password
│       │   │   ├── Alert (komunikaty błędów)
│       │   │   └── Button (Zarejestruj się)
│       │   └── Link (do strony logowania)
```

## 4. Szczegóły komponentów

### RegisterPage

- **Opis komponentu**: Główny komponent strony rejestracji, odpowiedzialny za renderowanie formularza i obsługę procesu rejestracji.
- **Główne elementy**: 
  - `Layout` z wycentrowanym `Content`
  - `Card` jako kontener dla formularza (max-width: 400px)
  - `Typography.Title` z tekstem "Rejestracja"
  - `RegisterForm` - zagnieżdżony komponent formularza
  - `Typography.Text` z linkiem do strony logowania
- **Obsługiwane zdarzenia**:
  - `onRegisterSuccess` - obsługa pomyślnej rejestracji i przekierowanie
  - `onRegisterError` - obsługa błędów rejestracji
- **Warunki walidacji**: Brak (delegowane do `RegisterForm`)
- **Typy**: `RegisterFormValues`, `RegisterResponse`, `ApiError`
- **Propsy**: Brak (główny widok)

### RegisterForm

- **Opis komponentu**: Formularz Ant Design zawierający pola do wprowadzenia danych rejestracyjnych. Obsługuje walidację, komunikaty błędów i wysyłanie danych do API.
- **Główne elementy**:
  - `Form` z `layout="vertical"`
  - `Form.Item` dla pola email z `Input`
  - `Form.Item` dla pola hasła z `Input.Password` (showPassword toggle)
  - `Form.Item` dla potwierdzenia hasła z `Input.Password`
  - `Alert` warunkowy (wyświetlany przy błędach API)
  - `Button` typu "primary" z `htmlType="submit"` i stanem `loading`
- **Obsługiwane zdarzenia**:
  - `onFinish` - wysłanie formularza po pomyślnej walidacji
  - `onValuesChange` - czyszczenie komunikatów błędów podczas edycji
- **Obsługiwana walidacja**:
  - **Email**:
    - Pole wymagane: "Adres e-mail jest wymagany"
    - Format email: "Wprowadź poprawny adres e-mail"
    - Transform: trim + toLowerCase
  - **Hasło**:
    - Pole wymagane: "Hasło jest wymagane"
    - Min. 8 znaków: "Hasło musi mieć co najmniej 8 znaków"
    - Max. 72 znaki: "Hasło nie może przekraczać 72 znaków"
  - **Powtórz hasło**:
    - Pole wymagane: "Potwierdzenie hasła jest wymagane"
    - Zgodność z hasłem: "Hasła muszą być identyczne" (validator porównujący z polem password)
- **Typy**: `RegisterFormValues`, `RegisterResponse`, `ApiError`
- **Propsy**:
  - `onSuccess: (response: RegisterResponse) => void` - callback po pomyślnej rejestracji
  - `onError?: (error: ApiError) => void` - opcjonalny callback po błędzie

## 5. Typy

### RegisterFormValues

```typescript
/**
 * Wartości formularza rejestracji (frontend)
 */
interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}
```

### RegisterRequestDto

```typescript
/**
 * DTO wysyłane do API (zgodne z backend)
 */
interface RegisterRequestDto {
  email: string;
  password: string;
}
```

### RegisterResponse

```typescript
/**
 * Odpowiedź z API po pomyślnej rejestracji
 */
interface RegisterResponse {
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

Po pomyślnej rejestracji należy zaktualizować globalny stan uwierzytelnienia:
- Zapisać `accessToken` w kontekście
- Zapisać dane użytkownika (`user.id`, `user.email`)
- `refreshToken` jest automatycznie zapisywany w httpOnly cookie przez backend

### Custom hook

**useAuth** - hook zwracający:
- `login(accessToken, user)` - funkcja do ustawienia stanu uwierzytelnienia
- `isAuthenticated: boolean` - status uwierzytelnienia
- Używany po pomyślnej rejestracji do zapisania tokenów

## 7. Integracja API

### Endpoint

**POST** `/api/v1/auth/register`

### Request

**Typ żądania**: `RegisterRequestDto`

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

**Success (201 Created)**: `RegisterResponse`

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
- `400 Bad Request`: Nieprawidłowy format email lub słabe hasło
  ```typescript
  {
    message: "Invalid email format.",
    statusCode: 400
  }
  ```
- `409 Conflict`: Użytkownik o tym e-mailu już istnieje
  ```typescript
  {
    message: "User with this email already exists.",
    statusCode: 409
  }
  ```

### Implementacja wywołania

```typescript
const registerUser = async (data: RegisterRequestDto): Promise<RegisterResponse> => {
  const response = await fetch('/api/v1/auth/register', {
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

2. Użytkownik wprowadza hasło
   - Toggle "pokaż/ukryj hasło" dla lepszego UX
   - Walidacja długości hasła w czasie rzeczywistym
   - Wskaźnik siły hasła (optional, nice-to-have)

3. Użytkownik powtarza hasło
   - Walidacja zgodności z pierwszym hasłem w czasie rzeczywistym
   - Komunikat "Hasła muszą być identyczne" jeśli niezgodne

### Wysyłanie formularza

1. Użytkownik klika "Zarejestruj się"
   - Przycisk zmienia się w stan `loading` (spinner + disabled)
   - Formularz blokuje edycję (disabled)

2. W przypadku sukcesu:
   - Wywołanie `useAuth().login(accessToken, user)`
   - Przekierowanie na `/onboarding` za pomocą `useNavigate()`
   - Opcjonalnie: wyświetlenie toast notification "Witamy w Janus AI!"

3. W przypadku błędu:
   - Wyświetlenie `Alert` typu "error" nad formularzem
   - Przycisk wraca do normalnego stanu
   - Użytkownik może poprawić dane i spróbować ponownie

### Nawigacja do logowania

- Link "Masz już konto? Zaloguj się" pod formularzem
- Przekierowanie na `/login` za pomocą React Router `Link`

## 9. Warunki i walidacja

### Walidacja po stronie frontendu

Wszystkie warunki są weryfikowane przez Ant Design Form przed wysłaniem żądania:

| Pole | Warunek | Komunikat | Komponent |
|------|---------|-----------|-----------|
| Email | Pole wymagane | "Adres e-mail jest wymagany" | RegisterForm |
| Email | Format email | "Wprowadź poprawny adres e-mail" | RegisterForm |
| Password | Pole wymagane | "Hasło jest wymagane" | RegisterForm |
| Password | Min. 8 znaków | "Hasło musi mieć co najmniej 8 znaków" | RegisterForm |
| Password | Max. 72 znaki | "Hasło nie może przekraczać 72 znaków" | RegisterForm |
| ConfirmPassword | Pole wymagane | "Potwierdzenie hasła jest wymagane" | RegisterForm |
| ConfirmPassword | Zgodność | "Hasła muszą być identyczne" | RegisterForm |

### Walidacja po stronie backendu

Backend przeprowadza dodatkową walidację (zgodnie z `RegisterUserSchema`):
- Format email (RFC 5322)
- Długość hasła (8-72 znaków)
- Unikalność email w bazie danych

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

#### 400 Bad Request (Walidacja)

```typescript
{
  message: "Invalid email format.",
  statusCode: 400
}
```

**Obsługa**: Wyświetlenie `Alert` typu "error" nad formularzem z tekstem z `message`

#### 409 Conflict (Duplikat użytkownika)

```typescript
{
  message: "User with this email already exists.",
  statusCode: 409
}
```

**Obsługa**: 
- Wyświetlenie `Alert` z komunikatem "Użytkownik o tym adresie e-mail już istnieje."
- Dodatkowo: podkreślenie pola email jako błędnego
- Sugestia: "Jeśli posiadasz już konto, [zaloguj się](/login)"

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
  const response = await registerUser(data);
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
3. **Bardzo długie hasło**: Walidacja max 72 znaki (limit bcrypt)
4. **Hasło zawierające tylko spacje**: Backend odrzuci, frontend może dodać custom validator
5. **Wielokrotne kliknięcie przycisku**: Przycisk disabled podczas `loading`

## 11. Kroki implementacji

### Krok 1: Utworzenie typów i DTOs

**Lokalizacja**: `frontend/src/shared/types/auth.types.ts`

```typescript
export interface RegisterFormValues {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
}

export interface RegisterResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### Krok 2: Utworzenie API client function

**Lokalizacja**: `frontend/src/shared/api/auth.api.ts`

```typescript
import { RegisterRequestDto, RegisterResponse } from '../types/auth.types';

export const registerUser = async (data: RegisterRequestDto): Promise<RegisterResponse> => {
  const response = await fetch('/api/v1/auth/register', {
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

### Krok 3: Utworzenie AuthContext

**Lokalizacja**: `frontend/src/shared/contexts/AuthContext.tsx`

```typescript
import { createContext, useContext, useState, ReactNode } from 'react';

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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = (token: string, user: User) => {
    setAccessToken(token);
    setUser(user);
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated: !!accessToken,
      user,
      accessToken,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Krok 4: Utworzenie komponentu RegisterForm

**Lokalizacja**: `frontend/src/components/auth/RegisterForm.tsx`

```typescript
import { useState } from 'react';
import { Form, Input, Button, Alert } from 'antd';
import { RegisterFormValues, RegisterResponse, ApiError } from '../../shared/types/auth.types';
import { registerUser } from '../../shared/api/auth.api';

interface RegisterFormProps {
  onSuccess: (response: RegisterResponse) => void;
  onError?: (error: ApiError) => void;
}

export const RegisterForm = ({ onSuccess, onError }: RegisterFormProps) => {
  const [form] = Form.useForm<RegisterFormValues>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async (values: RegisterFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await registerUser({
        email: values.email.toLowerCase().trim(),
        password: values.password,
      });
      onSuccess(response);
    } catch (err: any) {
      const errorMessage = err.message || 'Wystąpił nieoczekiwany błąd.';
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
          { min: 8, message: 'Hasło musi mieć co najmniej 8 znaków' },
          { max: 72, message: 'Hasło nie może przekraczać 72 znaków' },
        ]}
      >
        <Input.Password placeholder="••••••••" size="large" />
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
        <Input.Password placeholder="••••••••" size="large" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block size="large">
          Zarejestruj się
        </Button>
      </Form.Item>
    </Form>
  );
};
```

### Krok 5: Utworzenie strony RegisterPage

**Lokalizacja**: `frontend/src/pages/auth/RegisterPage.tsx`

```typescript
import { useNavigate, Link } from 'react-router-dom';
import { Layout, Card, Typography, Space, message } from 'antd';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { useAuth } from '../../shared/contexts/AuthContext';
import { RegisterResponse } from '../../shared/types/auth.types';
import './RegisterPage.scss';

const { Content } = Layout;
const { Title, Text } = Typography;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

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
```

### Krok 6: Utworzenie stylów SCSS

**Lokalizacja**: `frontend/src/pages/auth/RegisterPage.scss`

```scss
.register-page {
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

  &__login-link {
    display: block;
    text-align: center;
  }
}
```

### Krok 7: Dodanie routing w App.tsx

**Lokalizacja**: `frontend/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './shared/contexts/AuthContext';
import { RegisterPage } from './pages/auth/RegisterPage';
// ... inne importy

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          {/* ... inne trasy */}
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Krok 8: Testowanie

1. **Testy jednostkowe** (`RegisterForm.test.tsx`):
   - Walidacja pól formularza
   - Obsługa submit
   - Wyświetlanie błędów

2. **Testy integracyjne**:
   - Pomyślna rejestracja i przekierowanie
   - Obsługa błędów API (400, 409, 500)
   - Obsługa błędów sieciowych

3. **Testy E2E** (Playwright):
   - Pełny flow rejestracji
   - Walidacja responsywności (mobile/desktop)
   - Accessibility (WCAG)

### Krok 9: Optymalizacja i polishing

- Dodanie animacji przejść (fade-in dla Alert)
- Implementacja wskaźnika siły hasła (optional)
- Dodanie tooltipów z wymaganiami dla hasła
- Implementacja "Remember me" (opcjonalne)
- Dodanie analytics tracking (optional)
