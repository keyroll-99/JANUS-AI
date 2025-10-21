# Plan implementacji widoku Dashboard

## 1. Przegląd

Widok Dashboard jest głównym ekranem aplikacji po zalogowaniu. Prezentuje użytkownikowi kluczowe metryki jego portfela inwestycyjnego w jednym miejscu: łączną wartość portfela, zmiany dzienne, historyczny wykres wartości oraz dywersyfikację aktywów. Dashboard wykorzystuje komponenty Ant Design oraz wykresy z @ant-design/charts dla profesjonalnej wizualizacji danych finansowych.

## 2. Routing widoku

**Ścieżka**: `/dashboard`

**Typ trasy**: Chroniona (wymaga uwierzytelnienia)

**Przekierowanie**: 
- Jeśli użytkownik nie jest zalogowany → `/login`
- Domyślna trasa po zalogowaniu

## 3. Struktura komponentów

```
DashboardPage
├── Layout (Ant Design)
│   ├── Sider (nawigacja boczna)
│   ├── Header (nagłówek z awatarem)
│   └── Content
│       ├── PageHeader
│       │   ├── Typography.Title ("Dashboard")
│       │   └── Button ("Odśwież")
│       ├── Row (Ant Design Grid)
│       │   ├── Col (span: 24, lg: 12)
│       │   │   └── PortfolioSummaryCard
│       │   │       ├── Statistic (Całkowita wartość)
│       │   │       ├── Statistic (Zmiana dzienna PLN)
│       │   │       └── Statistic (Zmiana dzienna %)
│       │   └── Col (span: 24, lg: 12)
│       │       └── QuickActionsCard
│       │           └── Button ("Analizuj portfel")
│       ├── Row
│       │   └── Col (span: 24)
│       │       └── PortfolioHistoryCard
│       │           └── Area Chart (historyczne zmiany)
│       ├── Row
│       │   └── Col (span: 24, lg: 16)
│       │       └── DiversificationCard
│       │           └── Pie Chart (dywersyfikacja)
│       └── EmptyState (gdy brak transakcji)
│           ├── Empty
│           ├── Typography.Text
│           └── Button ("Zaimportuj transakcje")
```

## 4. Szczegóły komponentów

### DashboardPage

- **Opis komponentu**: Główny kontener widoku Dashboard. Odpowiada za pobieranie danych z API, zarządzanie stanem ładowania i błędów, oraz renderowanie wszystkich podkomponentów.
- **Główne elementy**: 
  - `Layout` z `Sider`, `Header`, `Content`
  - Wielokolumnowy układ `Row`/`Col` (Ant Design Grid)
  - Warunkowe renderowanie: `EmptyState` jeśli brak transakcji, lub pełny dashboard z danymi
  - `Skeleton` dla stanów ładowania
- **Obsługiwane zdarzenia**:
  - Ładowanie danych przy montowaniu komponentu (`useEffect`)
  - `onRefresh` - ręczne odświeżenie danych
  - `onAnalyzePortfolio` - przekierowanie do analizy AI
  - `onImportTransactions` - przekierowanie do importu
- **Warunki walidacji**: Brak (widok prezentacyjny)
- **Typy**: `GetDashboardResponseDto`, `DashboardSummaryDto`, `PortfolioHistoryPointDto`, `DiversificationItemDto`
- **Propsy**: Brak (główny widok)

### PortfolioSummaryCard

- **Opis komponentu**: Karta prezentująca podsumowanie wartości portfela z trzema kluczowymi metrykami w formie komponentów `Statistic`.
- **Główne elementy**:
  - `Card` z tytułem "Podsumowanie portfela"
  - `Row` z trzema `Col` (responsywny układ)
  - `Statistic` dla całkowitej wartości (value, prefix "PLN", valueStyle dla koloru)
  - `Statistic` dla zmiany bezwzględnej (value, prefix "+/-", suffix "PLN")
  - `Statistic` dla zmiany procentowej (value, suffix "%", valueStyle dla koloru)
  - Ikona trendu (ArrowUpOutlined/ArrowDownOutlined) z Ant Design Icons
- **Obsługiwane interakcje**: Brak (tylko prezentacja)
- **Obsługiwana walidacja**: Brak
- **Typy**: `DashboardSummaryDto`
- **Propsy**:
  - `summary: DashboardSummaryDto` - dane podsumowania
  - `loading?: boolean` - stan ładowania (pokazuje Skeleton)

### QuickActionsCard

- **Opis komponentu**: Karta z szybkimi akcjami dla użytkownika. W MVP zawiera głównie przycisk "Analizuj portfel".
- **Główne elementy**:
  - `Card` z tytułem "Szybkie akcje"
  - `Space` direction="vertical" z przyciskami
  - `Button` type="primary" ("Analizuj portfel")
  - Opcjonalnie: `Button` ("Zobacz transakcje"), `Button` ("Edytuj strategię")
- **Obsługiwane interakcje**:
  - `onAnalyzeClick` - przekierowanie do `/analyses` z triggerem analizy
  - `onTransactionsClick` - przekierowanie do `/transactions`
  - `onStrategyClick` - przekierowanie do `/strategy`
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak (tylko akcje nawigacyjne)
- **Propsy**:
  - `onAnalyzeClick: () => void`
  - `onTransactionsClick?: () => void`
  - `onStrategyClick?: () => void`
  - `disabled?: boolean` - wyłączenie przycisków podczas ładowania

### PortfolioHistoryCard

- **Opis komponentu**: Karta z wykresem liniowym/obszarowym pokazującym historyczne zmiany wartości portfela.
- **Główne elementy**:
  - `Card` z tytułem "Historia wartości portfela"
  - `Area` chart z @ant-design/charts
  - Tooltip z datą i wartością
  - Gradient fill pod linią
  - Oś X: data (format: DD.MM), Oś Y: wartość (format: PLN)
- **Obsługiwane interakcje**:
  - Hover na wykresie pokazuje tooltip z dokładną wartością
  - Opcjonalnie: zoom i pan (dla dużych zakresów dat)
- **Obsługiwana walidacja**: Brak
- **Typy**: `PortfolioHistoryPointDto[]`
- **Propsy**:
  - `history: PortfolioHistoryPointDto[]` - dane historyczne
  - `loading?: boolean` - pokazuje Skeleton podczas ładowania

### DiversificationCard

- **Opis komponentu**: Karta z wykresem kołowym prezentującym dywersyfikację portfela według tickerów.
- **Główne elementy**:
  - `Card` z tytułem "Dywersyfikacja portfela"
  - `Pie` chart z @ant-design/charts
  - Legenda z tickerami i procentami
  - Tooltip z wartością i procentem
  - Kolory dostosowane do liczby pozycji (color palette)
- **Obsługiwane interakcje**:
  - Hover na segmencie pokazuje tooltip
  - Kliknięcie segmentu (opcjonalnie) filtruje transakcje po tickerze
- **Obsługiwana walidacja**: Brak
- **Typy**: `DiversificationItemDto[]`
- **Propsy**:
  - `diversification: DiversificationItemDto[]` - dane dywersyfikacji
  - `loading?: boolean` - pokazuje Skeleton podczas ładowania
  - `onTickerClick?: (ticker: string) => void` - opcjonalna akcja po kliknięciu

### EmptyState

- **Opis komponentu**: Komponent wyświetlany gdy użytkownik nie ma jeszcze żadnych transakcji w systemie.
- **Główne elementy**:
  - `Empty` z Ant Design (z custom image)
  - `Typography.Title` level={4} ("Brak danych portfela")
  - `Typography.Text` ("Zacznij od zaimportowania swoich transakcji...")
  - `Button` type="primary" ("Zaimportuj transakcje")
  - Link do dokumentacji/helpa
- **Obsługiwane interakcje**:
  - `onImportClick` - przekierowanie do `/transactions` z aktywnym modalem importu
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**:
  - `onImportClick: () => void`

## 5. Typy

### GetDashboardResponseDto

```typescript
/**
 * Pełna odpowiedź z API dla endpointu GET /dashboard
 */
interface GetDashboardResponseDto {
  summary: DashboardSummaryDto;
  history: PortfolioHistoryPointDto[];
  diversification: DiversificationItemDto[];
}
```

### DashboardSummaryDto

```typescript
/**
 * Podsumowanie wartości portfela i zmian
 */
interface DashboardSummaryDto {
  totalValue: number; // Całkowita wartość portfela
  currency: string; // Kod waluty, np. "PLN"
  change: {
    value: number; // Zmiana bezwzględna (może być ujemna)
    percentage: number; // Zmiana procentowa (może być ujemna)
  };
}
```

### PortfolioHistoryPointDto

```typescript
/**
 * Pojedynczy punkt w historii portfela
 */
interface PortfolioHistoryPointDto {
  date: string; // Format: YYYY-MM-DD
  value: number; // Wartość portfela w tym dniu
}
```

### DiversificationItemDto

```typescript
/**
 * Pojedyncza pozycja w dywersyfikacji portfela
 */
interface DiversificationItemDto {
  ticker: string; // Symbol tickera lub "Other"
  value: number; // Wartość rynkowa pozycji
  percentage: number; // Procent całkowitego portfela
}
```

### DashboardState (ViewModel)

```typescript
/**
 * Stan lokalny widoku Dashboard
 */
interface DashboardState {
  data: GetDashboardResponseDto | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
}
```

## 6. Zarządzanie stanem

### Stan lokalny (useState)

- `data: GetDashboardResponseDto | null` - dane dashboard pobrane z API
- `loading: boolean` - stan ładowania początkowego
- `refreshing: boolean` - stan odświeżania (dla przycisku "Odśwież")
- `error: string | null` - komunikat błędu (jeśli wystąpił)

### Custom hook

**useDashboardData** - dedykowany hook do zarządzania danymi dashboard:

```typescript
interface UseDashboardDataReturn {
  data: GetDashboardResponseDto | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

const useDashboardData = (): UseDashboardDataReturn => {
  const [data, setData] = useState<GetDashboardResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getDashboardData();
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać danych dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refresh = () => fetchData(true);

  return { data, loading, error, refreshing, refresh };
};
```

### Kontekst globalny

- **AuthContext**: Dostęp do `accessToken` dla autoryzowanych zapytań API
- Opcjonalnie: Cache API responses w kontekście (dla optymalizacji)

## 7. Integracja API

### Endpoint

**GET** `/api/v1/dashboard`

### Request

**Query Parameters**: Brak

**Headers**:
```typescript
{
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

### Response

**Success (200 OK)**: `GetDashboardResponseDto`

```typescript
{
  summary: {
    totalValue: 125000.50,
    currency: "PLN",
    change: {
      value: 1200.75,
      percentage: 0.97
    }
  },
  history: [
    { date: "2025-09-01", value: 118000.00 },
    { date: "2025-09-02", value: 119500.00 },
    // ... more data points
    { date: "2025-10-19", value: 125000.50 }
  ],
  diversification: [
    { ticker: "AAPL", value: 25000.00, percentage: 20.0 },
    { ticker: "GOOGL", value: 20000.00, percentage: 16.0 },
    { ticker: "MSFT", value: 15000.00, percentage: 12.0 },
    { ticker: "Other", value: 65000.50, percentage: 52.0 }
  ]
}
```

**Error responses**:
- `401 Unauthorized`: Nieprawidłowy lub wygasły token
  ```typescript
  {
    message: "Unauthorized",
    statusCode: 401
  }
  ```
- `500 Internal Server Error`: Błąd serwera

### Implementacja wywołania

```typescript
const getDashboardData = async (): Promise<GetDashboardResponseDto> => {
  const accessToken = // pobierz z AuthContext
  
  const response = await fetch('/api/v1/dashboard', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Trigger token refresh
      throw new Error('Session expired. Please log in again.');
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch dashboard data.');
  }

  return response.json();
};
```

## 8. Interakcje użytkownika

### Ładowanie początkowe

1. Użytkownik wchodzi na `/dashboard` po zalogowaniu
   - Widoczny jest `Skeleton` dla wszystkich kart
   - Wysyłane jest zapytanie `GET /dashboard`

2. Po pobraniu danych:
   - `Skeleton` zamienia się na rzeczywiste komponenty
   - Animacja fade-in dla płynnego przejścia
   - Wykresy są renderowane z danymi

3. W przypadku błędu:
   - Wyświetlenie `Alert` typu "error" na górze strony
   - Przycisk "Spróbuj ponownie" do ponownego fetchowania

### Odświeżanie danych

1. Użytkownik klika przycisk "Odśwież" w PageHeader
   - Przycisk pokazuje spinner (icon + loading state)
   - Dane są pobierane ponownie bez ukrywania obecnych
   - Po zakończeniu spinner znika, dane są aktualizowane

2. W przypadku błędu odświeżania:
   - `message.error("Nie udało się odświeżyć danych")`
   - Obecne dane pozostają na ekranie

### Pusty stan (brak transakcji)

1. Jeśli `data.summary.totalValue === 0` lub brak danych history:
   - Zamiast kart z danymi renderowany jest `EmptyState`
   - Komunikat: "Wygląda na to, że nie masz jeszcze żadnych transakcji"
   - Przycisk CTA: "Zaimportuj transakcje"

2. Użytkownik klika "Zaimportuj transakcje":
   - Przekierowanie na `/transactions`
   - Opcjonalnie: automatyczne otwarcie modala importu

### Analiza portfela

1. Użytkownik klika "Analizuj portfel" w `QuickActionsCard`
   - Przekierowanie na `/analyses`
   - Automatyczne triggerowanie nowej analizy (POST /analyses)
   - Wyświetlenie komunikatu o rozpoczęciu analizy

### Interakcja z wykresami

**Portfolio History Chart:**
- Hover pokazuje tooltip z dokładną datą i wartością
- Smooth animations przy renderowaniu

**Diversification Pie Chart:**
- Hover na segmencie wyróżnia go i pokazuje tooltip
- Opcjonalnie: kliknięcie przenosi do `/transactions?ticker={symbol}`

## 9. Warunki i walidacja

Dashboard jest widokiem prezentacyjnym i nie zawiera formularzy wymagających walidacji. Jednak weryfikowane są następujące warunki:

### Warunki stanu danych

| Warunek | Weryfikacja | Wpływ na interfejs |
|---------|-------------|-------------------|
| Brak danych (empty) | `data === null || data.summary.totalValue === 0` | Renderowanie `EmptyState` |
| Ładowanie | `loading === true` | Renderowanie `Skeleton` |
| Błąd | `error !== null` | Renderowanie `Alert` z komunikatem błędu |
| Odświeżanie | `refreshing === true` | Przycisk "Odśwież" z spinnerem |

### Warunki danych API

- **Total value**: Musi być liczbą nieujemną (`totalValue >= 0`)
- **Change values**: Mogą być ujemne (spadek wartości)
- **History data**: Minimum 2 punkty dla sensownego wykresu (w przeciwnym razie komunikat "Za mało danych")
- **Diversification**: Suma `percentage` powinna wynosić ~100% (tolerancja ±1% z powodu zaokrągleń)

### Wpływ na UI

- **Brak danych historycznych** (< 2 punkty): Wykres zastąpiony komunikatem "Zbyt mało danych do wyświetlenia wykresu"
- **Brak dywersyfikacji**: Pie chart zastąpiony komunikatem "Brak aktywów w portfelu"
- **Wartości ujemne**: Czerwony kolor dla zmian spadkowych, ikona ArrowDownOutlined

## 10. Obsługa błędów

### Błędy API

#### 401 Unauthorized (Token wygasł)

**Obsługa**:
1. Automatyczne odświeżenie tokenu (interceptor)
2. Ponowne wywołanie żądania
3. Jeśli refresh nie powiedzie się → przekierowanie na `/login`

#### 500 Internal Server Error

**Obsługa**:
```typescript
setError('Wystąpił błąd serwera. Spróbuj odświeżyć stronę.');
```

Wyświetlenie `Result` z Ant Design:
- Status: "500"
- Title: "Błąd serwera"
- Subtitle: Komunikat błędu
- Extra: Przycisk "Spróbuj ponownie"

### Błędy sieciowe

**Przypadek**: Brak połączenia z internetem

**Obsługa**:
```typescript
if (error instanceof TypeError && error.message === 'Failed to fetch') {
  setError('Brak połączenia z internetem. Sprawdź swoje połączenie.');
}
```

Wyświetlenie `Alert` z ikoną ostrzeżenia i przyciskiem "Spróbuj ponownie".

### Błędy renderowania wykresów

**Przypadek**: Nieprawidłowe dane dla wykresów (np. brak pola `date` lub `value`)

**Obsługa**:
```typescript
try {
  <Area data={history} xField="date" yField="value" />
} catch (error) {
  <Empty description="Nie udało się wyrenderować wykresu" />
}
```

### Przypadki brzegowe

1. **Bardzo duże liczby** (> 1M): Formatowanie z separatorami tysięcy (`125 000,50 PLN`)
2. **Bardzo małe liczby** (< 1): Pokazanie z odpowiednią precyzją (2 miejsca po przecinku)
3. **Zero transakcji**: Renderowanie `EmptyState`
4. **Tylko 1 punkt danych w historii**: Komunikat "Za mało danych dla wykresu historycznego"
5. **Wszystkie zmiany = 0**: Wyświetlenie "0 PLN" i "0%" bez ikony trendu

## 11. Kroki implementacji

### Krok 1: Utworzenie typów

**Lokalizacja**: `frontend/src/shared/types/dashboard.types.ts`

```typescript
export interface GetDashboardResponseDto {
  summary: DashboardSummaryDto;
  history: PortfolioHistoryPointDto[];
  diversification: DiversificationItemDto[];
}

export interface DashboardSummaryDto {
  totalValue: number;
  currency: string;
  change: {
    value: number;
    percentage: number;
  };
}

export interface PortfolioHistoryPointDto {
  date: string;
  value: number;
}

export interface DiversificationItemDto {
  ticker: string;
  value: number;
  percentage: number;
}
```

### Krok 2: Utworzenie API client function

**Lokalizacja**: `frontend/src/shared/api/dashboard.api.ts`

```typescript
import { GetDashboardResponseDto } from '../types/dashboard.types';

export const getDashboardData = async (accessToken: string): Promise<GetDashboardResponseDto> => {
  const response = await fetch('/api/v1/dashboard', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch dashboard data.');
  }

  return response.json();
};
```

### Krok 3: Utworzenie custom hook useDashboardData

**Lokalizacja**: `frontend/src/shared/hooks/useDashboardData.ts`

```typescript
import { useState, useEffect } from 'react';
import { GetDashboardResponseDto } from '../types/dashboard.types';
import { getDashboardData } from '../api/dashboard.api';
import { useAuth } from '../contexts/AuthContext';

interface UseDashboardDataReturn {
  data: GetDashboardResponseDto | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

export const useDashboardData = (): UseDashboardDataReturn => {
  const { accessToken } = useAuth();
  const [data, setData] = useState<GetDashboardResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (isRefresh = false) => {
    if (!accessToken) {
      setError('Unauthorized');
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getDashboardData(accessToken);
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać danych dashboard.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const refresh = () => fetchData(true);

  return { data, loading, error, refreshing, refresh };
};
```

### Krok 4: Utworzenie komponentu PortfolioSummaryCard

**Lokalizacja**: `frontend/src/components/dashboard/PortfolioSummaryCard.tsx`

```typescript
import { Card, Statistic, Row, Col, Skeleton } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { DashboardSummaryDto } from '../../shared/types/dashboard.types';

interface PortfolioSummaryCardProps {
  summary: DashboardSummaryDto;
  loading?: boolean;
}

export const PortfolioSummaryCard = ({ summary, loading }: PortfolioSummaryCardProps) => {
  if (loading) {
    return (
      <Card title="Podsumowanie portfela">
        <Skeleton active paragraph={{ rows: 3 }} />
      </Card>
    );
  }

  const isPositiveChange = summary.change.value >= 0;
  const changeColor = isPositiveChange ? '#3f8600' : '#cf1322';
  const TrendIcon = isPositiveChange ? ArrowUpOutlined : ArrowDownOutlined;

  return (
    <Card title="Podsumowanie portfela">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Statistic
            title="Całkowita wartość"
            value={summary.totalValue}
            precision={2}
            suffix={summary.currency}
            valueStyle={{ fontSize: '28px', fontWeight: 'bold' }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Zmiana dzienna"
            value={Math.abs(summary.change.value)}
            precision={2}
            prefix={isPositiveChange ? '+' : '-'}
            suffix={summary.currency}
            valueStyle={{ color: changeColor }}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Zmiana %"
            value={Math.abs(summary.change.percentage)}
            precision={2}
            prefix={<TrendIcon />}
            suffix="%"
            valueStyle={{ color: changeColor }}
          />
        </Col>
      </Row>
    </Card>
  );
};
```

### Krok 5: Utworzenie komponentu PortfolioHistoryCard

**Lokalizacja**: `frontend/src/components/dashboard/PortfolioHistoryCard.tsx`

```typescript
import { Card, Empty, Skeleton } from 'antd';
import { Area } from '@ant-design/charts';
import { PortfolioHistoryPointDto } from '../../shared/types/dashboard.types';

interface PortfolioHistoryCardProps {
  history: PortfolioHistoryPointDto[];
  loading?: boolean;
}

export const PortfolioHistoryCard = ({ history, loading }: PortfolioHistoryCardProps) => {
  if (loading) {
    return (
      <Card title="Historia wartości portfela">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!history || history.length < 2) {
    return (
      <Card title="Historia wartości portfela">
        <Empty description="Za mało danych do wyświetlenia wykresu" />
      </Card>
    );
  }

  const config = {
    data: history,
    xField: 'date',
    yField: 'value',
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
    xAxis: {
      type: 'time',
      tickCount: 8,
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${parseFloat(v).toLocaleString('pl-PL')} PLN`,
      },
    },
    tooltip: {
      formatter: (datum: PortfolioHistoryPointDto) => ({
        name: 'Wartość',
        value: `${datum.value.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN`,
      }),
    },
  };

  return (
    <Card title="Historia wartości portfela">
      <Area {...config} />
    </Card>
  );
};
```

### Krok 6: Utworzenie komponentu DiversificationCard

**Lokalizacja**: `frontend/src/components/dashboard/DiversificationCard.tsx`

```typescript
import { Card, Empty, Skeleton } from 'antd';
import { Pie } from '@ant-design/charts';
import { DiversificationItemDto } from '../../shared/types/dashboard.types';

interface DiversificationCardProps {
  diversification: DiversificationItemDto[];
  loading?: boolean;
  onTickerClick?: (ticker: string) => void;
}

export const DiversificationCard = ({ diversification, loading, onTickerClick }: DiversificationCardProps) => {
  if (loading) {
    return (
      <Card title="Dywersyfikacja portfela">
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!diversification || diversification.length === 0) {
    return (
      <Card title="Dywersyfikacja portfela">
        <Empty description="Brak aktywów w portfelu" />
      </Card>
    );
  }

  const config = {
    data: diversification,
    angleField: 'value',
    colorField: 'ticker',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name} {percentage}',
    },
    interactions: [
      {
        type: 'element-active',
      },
    ],
    legend: {
      position: 'bottom',
    },
    tooltip: {
      formatter: (datum: DiversificationItemDto) => ({
        name: datum.ticker,
        value: `${datum.value.toLocaleString('pl-PL', { minimumFractionDigits: 2 })} PLN (${datum.percentage.toFixed(2)}%)`,
      }),
    },
    onReady: (plot: any) => {
      if (onTickerClick) {
        plot.on('element:click', (evt: any) => {
          const ticker = evt.data?.data?.ticker;
          if (ticker) {
            onTickerClick(ticker);
          }
        });
      }
    },
  };

  return (
    <Card title="Dywersyfikacja portfela">
      <Pie {...config} />
    </Card>
  );
};
```

### Krok 7: Utworzenie komponentu EmptyState

**Lokalizacja**: `frontend/src/components/dashboard/EmptyState.tsx`

```typescript
import { Empty, Button, Typography } from 'antd';
import { InboxOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface EmptyStateProps {
  onImportClick: () => void;
}

export const EmptyState = ({ onImportClick }: EmptyStateProps) => {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <Empty
        image={<InboxOutlined style={{ fontSize: '64px', color: '#bfbfbf' }} />}
        description={
          <>
            <Title level={4}>Brak danych portfela</Title>
            <Text type="secondary">
              Wygląda na to, że nie masz jeszcze żadnych transakcji.<br />
              Zacznij od zaimportowania swoich transakcji z pliku XTB.
            </Text>
          </>
        }
      >
        <Button type="primary" size="large" onClick={onImportClick}>
          Zaimportuj transakcje
        </Button>
      </Empty>
    </div>
  );
};
```

### Krok 8: Utworzenie głównej strony DashboardPage

**Lokalizacja**: `frontend/src/pages/dashboard/DashboardPage.tsx`

```typescript
import { useNavigate } from 'react-router-dom';
import { Layout, Row, Col, Button, Alert, message } from 'antd';
import { ReloadOutlined, LineChartOutlined } from '@ant-design/icons';
import { useDashboardData } from '../../shared/hooks/useDashboardData';
import { PortfolioSummaryCard } from '../../components/dashboard/PortfolioSummaryCard';
import { PortfolioHistoryCard } from '../../components/dashboard/PortfolioHistoryCard';
import { DiversificationCard } from '../../components/dashboard/DiversificationCard';
import { EmptyState } from '../../components/dashboard/EmptyState';
import './DashboardPage.scss';

const { Content } = Layout;

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { data, loading, error, refreshing, refresh } = useDashboardData();

  const handleImportClick = () => {
    navigate('/transactions');
  };

  const handleAnalyzeClick = () => {
    navigate('/analyses');
  };

  const handleTickerClick = (ticker: string) => {
    navigate(`/transactions?ticker=${ticker}`);
  };

  const handleRefresh = async () => {
    await refresh();
    message.success('Dane zostały odświeżone');
  };

  const isEmpty = !loading && (!data || data.summary.totalValue === 0);

  return (
    <Content className="dashboard-page">
      <div className="dashboard-page__header">
        <h1>Dashboard</h1>
        <Button
          icon={<ReloadOutlined />}
          onClick={handleRefresh}
          loading={refreshing}
          disabled={loading}
        >
          Odśwież
        </Button>
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

      {isEmpty ? (
        <EmptyState onImportClick={handleImportClick} />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <PortfolioSummaryCard summary={data!.summary} loading={loading} />
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Szybkie akcje">
                <Button
                  type="primary"
                  icon={<LineChartOutlined />}
                  onClick={handleAnalyzeClick}
                  block
                  size="large"
                >
                  Analizuj portfel
                </Button>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col span={24}>
              <PortfolioHistoryCard history={data!.history} loading={loading} />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col xs={24} lg={16}>
              <DiversificationCard
                diversification={data!.diversification}
                loading={loading}
                onTickerClick={handleTickerClick}
              />
            </Col>
          </Row>
        </>
      )}
    </Content>
  );
};
```

### Krok 9: Utworzenie stylów SCSS

**Lokalizacja**: `frontend/src/pages/dashboard/DashboardPage.scss`

```scss
.dashboard-page {
  padding: 24px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
  }

  @media (max-width: 768px) {
    padding: 16px;

    &__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;

      button {
        width: 100%;
      }
    }
  }
}
```

### Krok 10: Dodanie PrivateRoute i routing

**Lokalizacja**: `frontend/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/contexts/AuthContext';
import { PrivateRoute } from './shared/components/PrivateRoute';
import { DashboardPage } from './pages/dashboard/DashboardPage';
// ... inne importy

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            {/* ... inne chronione trasy */}
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Krok 11: Testowanie

1. **Testy jednostkowe**:
   - `PortfolioSummaryCard.test.tsx` - formatowanie wartości, kolory trendów
   - `PortfolioHistoryCard.test.tsx` - renderowanie wykresu, obsługa pustych danych
   - `DiversificationCard.test.tsx` - renderowanie pie chart, kliknięcia
   - `useDashboardData.test.ts` - hook logic, error handling

2. **Testy integracyjne**:
   - Pełny flow ładowania danych
   - Obsługa błędów API
   - Odświeżanie danych
   - Empty state rendering

3. **Testy E2E** (Playwright):
   - Nawigacja do dashboard po zalogowaniu
   - Interakcja z wykresami
   - Responsive design (mobile/tablet/desktop)
   - Accessibility checks

### Krok 12: Optymalizacja i polishing

- Dodanie animacji fade-in dla kart
- Implementacja progressive loading (najpierw summary, potem wykresy)
- Dodanie pull-to-refresh na mobile
- Implementacja cache API responses (stale-while-revalidate)
- Dodanie export do PDF/PNG dla wykresów (opcjonalne)
- Analytics tracking dla interakcji użytkownika
