# Plan implementacji widoku Szczegółów Analizy

## 1. Przegląd

Widok Szczegółów Analizy prezentuje kompleksowe informacje o pojedynczej analizie AI portfela, w tym podsumowanie, rekomendacje i użyty prompt. Umożliwia nawigację powrotną do listy analiz.

## 2. Routing widoku

**Ścieżka**: `/analyses/:id`

**Typ trasy**: Chroniona (wymaga uwierzytelnienia)

**Params**:
- `id` (uuid analizy)

**Nawigacja**:
- Breadcrumb "Historia analiz" → `/analyses`
- Button "Powrót do listy" → `/analyses`

## 3. Struktura komponentów

```
AnalysisDetailsPage
├── Breadcrumb
│   └── Item ("Historia analiz" → /analyses)
│   └── Item ("Szczegóły analizy")
├── PageHeader
│   ├── Typography.Title ("Analiza z [data]")
│   └── Button ("Powrót do listy", icon=<ArrowLeftOutlined />)
├── Card (Metadane)
│   └── Descriptions
│       ├── Item (Data analizy)
│       ├── Item (Model AI)
│       ├── Item (Wartość portfela)
│       └── Item (ID analizy)
├── Card (Podsumowanie)
│   ├── Title ("Podsumowanie analizy")
│   └── Paragraph (analysisSummary - formatted text)
├── Card (Rekomendacje)
│   ├── Title ("Rekomendacje inwestycyjne")
│   └── Table
│       ├── Column (Ticker)
│       ├── Column (Akcja - Tag colored)
│       ├── Column (Uzasadnienie)
│       └── Column (Pewność - Progress bar)
└── Collapse (Prompt - opcjonalnie)
    └── Panel ("Zobacz użyty prompt")
        └── Typography.Paragraph (analysisPrompt - code style)
```

## 4. Szczegóły komponentów

### AnalysisDetailsPage

- **Opis**: Główny widok szczegółów analizy
- **Elementy**: Breadcrumb, PageHeader, 3-4 Cards
- **Zdarzenia**:
  - Fetch analizy przy montowaniu
  - Navigate back to list
- **Typy**: `AnalysisDetailsDto`

### AnalysisMetadataCard

- **Opis**: Card z metadanymi (data, model, wartość, ID)
- **Elementy**: Descriptions z 4 items
- **Propsy**: `analysis: AnalysisDetailsDto`

### AnalysisSummaryCard

- **Opis**: Card z tekstowym podsumowaniem analizy
- **Elementy**: Typography.Paragraph z formatowaniem (bold, lists)
- **Propsy**: `summary: string`
- **Formatowanie**: Podział na akapity, bold keywords

### RecommendationsTable

- **Opis**: Tabela z rekomendacjami spółek
- **Elementy**: Ant Design Table z 4 kolumnami
- **Kolumny**:
  1. **Ticker** (fixed width: 80px)
  2. **Akcja** (Tag: BUY=green, SELL=red, HOLD=blue)
  3. **Uzasadnienie** (ellipsis, expandable)
  4. **Pewność** (Progress bar: HIGH=green, MEDIUM=orange, LOW=red)
- **Propsy**: `recommendations: RecommendationDto[]`

### PromptCollapse

- **Opis**: Opcjonalny Collapse z użytym promptem
- **Elementy**: Collapse.Panel z Typography.Text (code)
- **Propsy**: `prompt?: string`
- **Wyświetlanie**: Tylko jeśli `analysisPrompt` istnieje

## 5. Typy

```typescript
// Reużycie z backend/src/ai-analysis/analysis.types.ts

export interface RecommendationDto {
  id: string;
  ticker: string;
  action: string; // 'BUY' | 'SELL' | 'HOLD'
  reasoning: string;
  confidence: string | null; // 'HIGH' | 'MEDIUM' | 'LOW' | null
}

export interface AnalysisDetailsDto {
  id: string;
  analysisDate: string;
  portfolioValue: number;
  aiModel: string;
  analysisSummary: string;
  analysisPrompt?: string;
  recommendations: RecommendationDto[];
}
```

## 6. Zarządzanie stanem

### Custom hook: useAnalysisDetails

```typescript
interface UseAnalysisDetailsReturn {
  analysis: AnalysisDetailsDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const useAnalysisDetails = (id: string): UseAnalysisDetailsReturn => {
  const { accessToken } = useAuth();
  const [analysis, setAnalysis] = useState<AnalysisDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalysisDetails(id, accessToken);
      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Błąd ładowania analizy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchAnalysis();
    }
  }, [id]);

  return { analysis, loading, error, refetch: fetchAnalysis };
};
```

## 7. Integracja API

### GET /analyses/:id

**Request**:
```typescript
GET /api/v1/analyses/:id
Headers: { Authorization: `Bearer ${accessToken}` }
```

**Response (200)**:
```typescript
{
  id: "uuid",
  analysisDate: "2025-01-20T10:30:00Z",
  portfolioValue: 125000.50,
  aiModel: "claude-3.5-sonnet",
  analysisSummary: "Twój portfel...",
  analysisPrompt: "Jesteś doświadczonym analitykiem...", // optional
  recommendations: [
    {
      id: "rec-1",
      ticker: "AAPL",
      action: "BUY",
      reasoning: "Strong fundamentals...",
      confidence: "HIGH"
    },
    ...
  ]
}
```

**Error (404)**: Analiza nie istnieje
**Error (403)**: Analiza należy do innego użytkownika

## 8. Interakcje użytkownika

### Ładowanie analizy

1. Widok ładuje się → pokazuje Skeleton w każdej sekcji
2. Fetch analizy z API
3. Po sukcesie: renderuje wszystkie sekcje
4. Błąd 404: Result component z "Analiza nie znaleziona"

### Ekspansja uzasadnienia

1. Kolumna "Uzasadnienie" ma ellipsis (max 100 chars)
2. Kliknięcie → rozwija pełny tekst w Tooltip lub Modal

### Ekspansja promptu

1. Collapse domyślnie collapsed
2. Kliknięcie "Zobacz użyty prompt" → rozwinięcie
3. Tekst w stylu `<code>` z możliwością kopiowania

### Nawigacja

1. Breadcrumb "Historia analiz" → `/analyses`
2. Button "Powrót do listy" → `/analyses`
3. Browser back button → działa poprawnie

## 9. Warunki i walidacja

### Sprawdzenie dostępu

- Backend sprawdza, czy analiza należy do zalogowanego użytkownika
- Jeśli nie: 403 Forbidden

### Walidacja ID

- Jeśli `id` nie jest valid UUID → 400 Bad Request lub 404

## 10. Obsługa błędów

### 404 Not Found

```tsx
<Result
  status="404"
  title="Analiza nie znaleziona"
  subTitle="Ta analiza nie istnieje lub została usunięta."
  extra={
    <Button type="primary" onClick={() => navigate('/analyses')}>
      Powrót do listy
    </Button>
  }
/>
```

### 403 Forbidden

```tsx
<Result
  status="403"
  title="Brak dostępu"
  subTitle="Nie masz uprawnień do tej analizy."
  extra={
    <Button type="primary" onClick={() => navigate('/analyses')}>
      Powrót do listy
    </Button>
  }
/>
```

### 500 Server Error

Alert z retry button.

### Przypadki brzegowe

1. **Brak rekomendacji**: Empty component w tabeli
2. **Brak promptu**: Collapse nie renderuje się
3. **Bardzo długie uzasadnienie**: Ellipsis + Tooltip

## 11. Kroki implementacji

### Krok 1: API function

**Lokalizacja**: `frontend/src/shared/api/analyses.api.ts`

```typescript
export const getAnalysisDetails = async (
  id: string,
  accessToken: string
): Promise<AnalysisDetailsDto> => {
  const response = await fetch(`/api/v1/analyses/${id}`, {
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
```

### Krok 2: Custom hook useAnalysisDetails

(Kod jak w sekcji 6)

### Krok 3: Komponent RecommendationsTable

**Lokalizacja**: `frontend/src/components/analyses/RecommendationsTable.tsx`

```typescript
import { Table, Tag, Progress, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { RecommendationDto } from '../../shared/types/analysis.types';
import './RecommendationsTable.scss';

interface Props {
  recommendations: RecommendationDto[];
}

const getActionColor = (action: string) => {
  switch (action.toUpperCase()) {
    case 'BUY':
      return 'green';
    case 'SELL':
      return 'red';
    case 'HOLD':
      return 'blue';
    default:
      return 'default';
  }
};

const getConfidencePercent = (confidence: string | null) => {
  if (!confidence) return 50;
  switch (confidence.toUpperCase()) {
    case 'HIGH':
      return 90;
    case 'MEDIUM':
      return 60;
    case 'LOW':
      return 30;
    default:
      return 50;
  }
};

const getConfidenceColor = (confidence: string | null) => {
  if (!confidence) return 'orange';
  switch (confidence.toUpperCase()) {
    case 'HIGH':
      return 'green';
    case 'MEDIUM':
      return 'orange';
    case 'LOW':
      return 'red';
    default:
      return 'orange';
  }
};

export const RecommendationsTable = ({ recommendations }: Props) => {
  const columns: ColumnsType<RecommendationDto> = [
    {
      title: 'Ticker',
      dataIndex: 'ticker',
      key: 'ticker',
      width: 100,
      fixed: 'left',
      render: (ticker: string) => <strong>{ticker}</strong>,
    },
    {
      title: 'Akcja',
      dataIndex: 'action',
      key: 'action',
      width: 120,
      render: (action: string) => (
        <Tag color={getActionColor(action)}>{action.toUpperCase()}</Tag>
      ),
    },
    {
      title: 'Uzasadnienie',
      dataIndex: 'reasoning',
      key: 'reasoning',
      ellipsis: {
        showTitle: false,
      },
      render: (reasoning: string) => (
        <Tooltip placement="topLeft" title={reasoning}>
          {reasoning}
        </Tooltip>
      ),
    },
    {
      title: 'Pewność',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 150,
      render: (confidence: string | null) => (
        <Progress
          percent={getConfidencePercent(confidence)}
          strokeColor={getConfidenceColor(confidence)}
          showInfo={false}
          size="small"
        />
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={recommendations}
      rowKey="id"
      pagination={false}
      scroll={{ x: 800 }}
    />
  );
};
```

### Krok 4: Komponent AnalysisDetailsPage

**Lokalizacja**: `frontend/src/pages/analyses/AnalysisDetailsPage.tsx`

```typescript
import { Layout, Breadcrumb, Typography, Button, Card, Descriptions, Skeleton, Alert, Collapse, Result } from 'antd';
import { ArrowLeftOutlined, HomeOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useAnalysisDetails } from '../../shared/hooks/useAnalysisDetails';
import { RecommendationsTable } from '../../components/analyses/RecommendationsTable';
import './AnalysisDetailsPage.scss';

const { Content } = Layout;
const { Title, Paragraph, Text } = Typography;
const { Panel } = Collapse;

export const AnalysisDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { analysis, loading, error } = useAnalysisDetails(id!);

  if (loading) {
    return (
      <Content style={{ padding: '24px' }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </Content>
    );
  }

  if (error || !analysis) {
    return (
      <Content style={{ padding: '24px' }}>
        <Result
          status="404"
          title="Analiza nie znaleziona"
          subTitle="Ta analiza nie istnieje lub została usunięta."
          extra={
            <Button type="primary" onClick={() => navigate('/analyses')}>
              Powrót do listy
            </Button>
          }
        />
      </Content>
    );
  }

  return (
    <Content className="analysis-details-page">
      <Breadcrumb style={{ marginBottom: 16 }}>
        <Breadcrumb.Item href="/">
          <HomeOutlined />
        </Breadcrumb.Item>
        <Breadcrumb.Item href="/analyses">Historia analiz</Breadcrumb.Item>
        <Breadcrumb.Item>Szczegóły analizy</Breadcrumb.Item>
      </Breadcrumb>

      <div className="analysis-details-page__header">
        <Title level={2}>
          Analiza z {new Date(analysis.analysisDate).toLocaleDateString('pl-PL')}
        </Title>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/analyses')}
        >
          Powrót do listy
        </Button>
      </div>

      {error && (
        <Alert
          message="Błąd"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 24 }}
        />
      )}

      <Card title="Metadane analizy" style={{ marginBottom: 16 }}>
        <Descriptions column={2}>
          <Descriptions.Item label="Data analizy">
            {new Date(analysis.analysisDate).toLocaleString('pl-PL')}
          </Descriptions.Item>
          <Descriptions.Item label="Model AI">{analysis.aiModel}</Descriptions.Item>
          <Descriptions.Item label="Wartość portfela">
            {analysis.portfolioValue.toLocaleString('pl-PL', {
              style: 'currency',
              currency: 'PLN',
            })}
          </Descriptions.Item>
          <Descriptions.Item label="ID analizy">{analysis.id}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Podsumowanie analizy" style={{ marginBottom: 16 }}>
        <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
          {analysis.analysisSummary}
        </Paragraph>
      </Card>

      <Card title="Rekomendacje inwestycyjne" style={{ marginBottom: 16 }}>
        <RecommendationsTable recommendations={analysis.recommendations} />
      </Card>

      {analysis.analysisPrompt && (
        <Collapse style={{ marginBottom: 16 }}>
          <Panel header="Zobacz użyty prompt" key="1">
            <Text code style={{ whiteSpace: 'pre-wrap', display: 'block' }}>
              {analysis.analysisPrompt}
            </Text>
          </Panel>
        </Collapse>
      )}
    </Content>
  );
};
```

### Krok 5: Styling SCSS

**Lokalizacja**: `frontend/src/pages/analyses/AnalysisDetailsPage.scss`

```scss
.analysis-details-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;

    h2 {
      margin-bottom: 0;
    }
  }

  @media (max-width: 768px) {
    padding: 16px;

    &__header {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }
}
```

### Krok 6: Routing

```typescript
<Route element={<PrivateRoute />}>
  <Route path="/analyses/:id" element={<AnalysisDetailsPage />} />
</Route>
```

### Krok 7: Testowanie

1. **Unit tests**:
   - useAnalysisDetails hook
   - RecommendationsTable component

2. **Integration tests**:
   - Fetch analysis details
   - Error handling (404, 403)

3. **E2E**:
   - Nawigacja z listy → szczegóły
   - Breadcrumb navigation
   - Ekspansja promptu

## 12. Optymalizacje

- **Copy buttons**: Kopiowanie tickerów, promptu
- **Export**: Przycisk "Eksportuj rekomendacje" (CSV/PDF)
- **Share**: Link do udostępnienia analizy (read-only)
- **Compare**: Porównanie z poprzednią analizą
- **Chart**: Wizualizacja rekomendacji (pie chart: BUY/SELL/HOLD distribution)
