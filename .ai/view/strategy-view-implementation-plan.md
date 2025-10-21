# Plan implementacji widoku Strategii

## 1. Przegląd

Widok Strategii umożliwia użytkownikowi przeglądanie i edycję swojej strategii inwestycyjnej. Jest to prosty widok z formularzem, który pobiera istniejące dane i umożliwia ich aktualizację. Strategia jest kluczowa dla analiz AI.

## 2. Routing widoku

**Ścieżka**: `/strategy`

**Typ trasy**: Chroniona (wymaga uwierzytelnienia)

**Przekierowanie**: Jeśli użytkownik nie ma strategii → opcjonalne przekierowanie na `/onboarding`

## 3. Struktura komponentów

```
StrategyPage
├── PageHeader
│   ├── Typography.Title ("Strategia inwestycyjna")
│   └── Typography.Paragraph (opis znaczenia strategii)
├── Card
│   └── StrategyForm
│       ├── Form.Item (Horyzont czasowy)
│       │   └── Select
│       ├── Form.Item (Poziom ryzyka)
│       │   └── Select
│       ├── Form.Item (Cele inwestycyjne)
│       │   └── TextArea
│       └── Space (przyciski)
│           └── Button ("Zapisz zmiany", type="primary")
└── Card (Statystyki - opcjonalne)
    └── Descriptions (data ostatniej aktualizacji, liczba analiz)
```

## 4. Szczegóły komponentów

### StrategyPage

- **Opis**: Główny widok z formularzem strategii
- **Elementy**: PageHeader, Card z formularzem, opcjonalnie statystyki
- **Zdarzenia**:
  - Fetch strategii przy montowaniu
  - Update strategii
- **Typy**: `StrategyResponseDto`, `StrategyRequestDto`

### StrategyForm

- **Opis**: Formularz edycji strategii (reużycie z Onboarding)
- **Elementy**: Select (horyzont), Select (ryzyko), TextArea (cele), Button
- **Walidacja**:
  - Horyzont: wymagane, enum [SHORT, MEDIUM, LONG]
  - Ryzyko: wymagane, enum [LOW, MEDIUM, HIGH]
  - Cele: wymagane, 10-500 znaków
- **Propsy**:
  - `initialValues?: StrategyResponseDto`
  - `onSubmit: (values: StrategyRequestDto) => Promise<void>`
  - `loading: boolean`

## 5. Typy

```typescript
// Reużycie typów z onboarding.types.ts
export interface StrategyResponseDto {
  id: string;
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
  updatedAt: string;
}

export interface StrategyRequestDto {
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
}
```

## 6. Zarządzanie stanem

### Custom hook: useStrategy

```typescript
interface UseStrategyReturn {
  strategy: StrategyResponseDto | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
  fetchStrategy: () => Promise<void>;
  updateStrategy: (data: StrategyRequestDto) => Promise<void>;
}

const useStrategy = (): UseStrategyReturn => {
  const { accessToken } = useAuth();
  const [strategy, setStrategy] = useState<StrategyResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStrategy = async () => {
    // GET /api/v1/strategy
  };

  const updateStrategy = async (data: StrategyRequestDto) => {
    // PUT /api/v1/strategy
    message.success('Strategia została zaktualizowana');
  };

  useEffect(() => {
    fetchStrategy();
  }, []);

  return { strategy, loading, updating, error, fetchStrategy, updateStrategy };
};
```

## 7. Integracja API

### GET /strategy

**Request**:
```typescript
Headers: { Authorization: `Bearer ${accessToken}` }
```

**Response (200)**:
```typescript
{
  id: "uuid",
  timeHorizon: "LONG",
  riskLevel: "MEDIUM",
  investmentGoals: "Long-term growth...",
  updatedAt: "2025-10-21T10:00:00Z"
}
```

**Error (404)**: Brak strategii → redirect na `/onboarding` lub pokazanie EmptyState

### PUT /strategy

**Request**:
```typescript
Body: StrategyRequestDto
```

**Response (200)**: `StrategyResponseDto`

## 8. Interakcje użytkownika

### Ładowanie danych

1. Widok ładuje się → pokazuje Skeleton
2. Fetch strategii z API
3. Po sukcesie: wypełnienie formularza aktualnymi wartościami
4. Błąd 404: EmptyState "Nie masz jeszcze strategii" z CTA "Utwórz strategię"

### Edycja strategii

1. Użytkownik modyfikuje pola formularza
2. Przycisk "Zapisz zmiany" staje się aktywny (disabled jeśli brak zmian)
3. Kliknięcie "Zapisz" → PUT request
4. Sukces: message.success + aktualizacja danych w formularzu
5. Błąd: Alert nad formularzem

### Wizualizacja zmian

- Opcjonalnie: porównanie "Poprzednia strategia" vs "Nowa strategia" w modaluprzed zapisem
- Tag "Zmieniono" z datą ostatniej aktualizacji

## 9. Warunki i walidacja

Identyczne jak w StrategyStep z Onboarding:

| Pole | Warunki | Komunikat |
|------|---------|-----------|
| timeHorizon | Wymagane, enum | "Wybierz horyzont czasowy" |
| riskLevel | Wymagane, enum | "Wybierz poziom ryzyka" |
| investmentGoals | Wymagane, 10-500 znaków | "Cele muszą mieć 10-500 znaków" |

## 10. Obsługa błędów

### 404 Not Found (Brak strategii)

**Opcja A**: Redirect na `/onboarding`
```typescript
if (error?.statusCode === 404) {
  navigate('/onboarding');
}
```

**Opcja B**: EmptyState w widoku
```tsx
<Empty
  description="Nie masz jeszcze strategii"
  image={<BarChartOutlined style={{ fontSize: 64 }} />}
>
  <Button type="primary" onClick={() => setMode('create')}>
    Utwórz strategię
  </Button>
</Empty>
```

### 400 Bad Request (Walidacja)

Alert nad formularzem z konkretnymi błędami.

### Przypadki brzegowe

1. **Brak zmian**: Przycisk "Zapisz" disabled
2. **Równoczesna edycja**: Conflict 409 → reload strategii i powiadomienie
3. **Utrata połączenia**: Retry button

## 11. Kroki implementacji

### Krok 1: API functions

**Lokalizacja**: `frontend/src/shared/api/strategy.api.ts`

```typescript
export const getStrategy = async (accessToken: string): Promise<StrategyResponseDto> => {
  const response = await fetch('/api/v1/strategy', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw error;
  }

  return response.json();
};

export const updateStrategy = async (data: StrategyRequestDto, accessToken: string): Promise<StrategyResponseDto> => {
  const response = await fetch('/api/v1/strategy', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
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

### Krok 2: Custom hook useStrategy

(Kod jak w sekcji 6)

### Krok 3: Komponent StrategyPage

**Lokalizacja**: `frontend/src/pages/strategy/StrategyPage.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Layout, Card, Typography, Skeleton, Alert, Descriptions, message } from 'antd';
import { useStrategy } from '../../shared/hooks/useStrategy';
import { StrategyForm } from '../../components/strategy/StrategyForm';
import { StrategyRequestDto } from '../../shared/types/strategy.types';
import './StrategyPage.scss';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

export const StrategyPage = () => {
  const { strategy, loading, updating, error, updateStrategy } = useStrategy();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSubmit = async (values: StrategyRequestDto) => {
    try {
      await updateStrategy(values);
      setHasChanges(false);
    } catch (err) {
      // Error handled in hook
    }
  };

  if (loading) {
    return (
      <Content style={{ padding: '24px' }}>
        <Card>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </Content>
    );
  }

  return (
    <Content className="strategy-page">
      <div className="strategy-page__header">
        <Title level={2}>Strategia inwestycyjna</Title>
        <Paragraph>
          Twoja strategia pomaga AI w generowaniu spersonalizowanych rekomendacji.
          Pamiętaj, aby aktualizować ją wraz ze zmianą Twoich celów.
        </Paragraph>
      </div>

      {error && (
        <Alert
          message="Błąd"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: '24px' }}
        />
      )}

      <Card>
        <StrategyForm
          initialValues={strategy || undefined}
          onSubmit={handleSubmit}
          loading={updating}
          onValuesChange={() => setHasChanges(true)}
        />
      </Card>

      {strategy && (
        <Card title="Informacje" style={{ marginTop: '16px' }}>
          <Descriptions column={1}>
            <Descriptions.Item label="Ostatnia aktualizacja">
              {new Date(strategy.updatedAt).toLocaleString('pl-PL')}
            </Descriptions.Item>
            <Descriptions.Item label="ID strategii">
              {strategy.id}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Content>
  );
};
```

### Krok 4: Reużycie StrategyForm z Onboarding

Komponent `StrategyForm` już istnieje w `components/onboarding/StrategyForm.tsx`. Można go przenieść do `components/shared/` lub `components/strategy/` i reużyć.

### Krok 5: Styling SCSS

**Lokalizacja**: `frontend/src/pages/strategy/StrategyPage.scss`

```scss
.strategy-page {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;

  &__header {
    margin-bottom: 24px;

    h2 {
      margin-bottom: 8px;
    }
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
}
```

### Krok 6: Routing

```typescript
<Route element={<PrivateRoute />}>
  <Route path="/strategy" element={<StrategyPage />} />
</Route>
```

### Krok 7: Testowanie

1. **Unit tests**:
   - useStrategy hook
   - StrategyForm validation

2. **Integration tests**:
   - Fetch i update flow
   - Error handling (404, 400)

3. **E2E**:
   - Edycja strategii end-to-end
   - Brak strategii → create flow

## 12. Optymalizacja

- Dirty form detection (unsaved changes warning)
- Auto-save draft w localStorage
- Porównanie przed/po (preview modal)
- Integracja z AI: "Sugerowana strategia na podstawie portfela"
