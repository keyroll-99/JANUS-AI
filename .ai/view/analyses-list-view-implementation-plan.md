# Plan implementacji widoku Listy Analiz

## 1. Przegląd

Widok Listy Analiz wyświetla historię wszystkich wykonanych analiz AI portfela użytkownika. Umożliwia przeglądanie paginowanej listy, inicjowanie nowej analizy oraz nawigację do szczegółów każdej analizy.

## 2. Routing widoku

**Ścieżka**: `/analyses`

**Typ trasy**: Chroniona (wymaga uwierzytelnienia)

**Query params**:
- `page` (number, default: 1)
- `limit` (number, default: 10)

**Nawigacja**:
- Kliknięcie analizy → `/analyses/:id`
- Button "Nowa analiza" → POST /analyses → sukces → `/analyses/:id`

## 3. Struktura komponentów

```
AnalysesListPage
├── PageHeader
│   ├── Typography.Title ("Historia analiz")
│   ├── Space (stats)
│   │   ├── Statistic (Liczba analiz)
│   │   └── Statistic (Ostatnia analiza)
│   └── Button ("Nowa analiza AI", type="primary", icon=<ThunderboltOutlined />)
├── Card
│   ├── List (analyses)
│   │   └── List.Item (dla każdej analizy)
│   │       ├── List.Item.Meta
│   │       │   ├── Avatar (icon z modelu AI)
│   │       │   ├── Title (data + model)
│   │       │   └── Description (wartość portfela)
│   │       └── Button ("Zobacz szczegóły", type="link")
│   └── Pagination
└── EmptyState (gdy brak analiz)
    ├── Empty
    └── Button ("Wykonaj pierwszą analizę")
```

## 4. Szczegóły komponentów

### AnalysesListPage

- **Opis**: Główny widok z listą analiz
- **Elementy**: PageHeader ze stats, Card z listą, Pagination
- **Zdarzenia**:
  - Fetch analiz przy montowaniu i zmianie page
  - Inicjowanie nowej analizy
  - Nawigacja do szczegółów
- **Typy**: `PaginatedAnalysesDto`, `AnalysisListItemDto`

### AnalysisListItem

- **Opis**: Pojedynczy element listy z metadanymi analizy
- **Elementy**: Avatar, Meta (date + model), Value (portfolio), Button
- **Propsy**:
  - `analysis: AnalysisListItemDto`
  - `onClick: (id: string) => void`

### NewAnalysisButton

- **Opis**: Przycisk inicjujący nową analizę z modalem potwierdzenia
- **Elementy**: Button, Modal (confirm)
- **Zdarzenia**:
  - Click → pokazuje modal z informacją o czasie oczekiwania (~30-60s)
  - Confirm → POST /analyses → navigate do `/analyses/:id`
- **States**: loading (podczas tworzenia analizy)

## 5. Typy

```typescript
// Reużycie z backend/src/ai-analysis/analysis.types.ts

export interface AnalysisListItemDto {
  id: string;
  analysisDate: string;
  portfolioValue: number;
  aiModel: string;
}

export interface PaginationDetails {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedAnalysesDto {
  data: AnalysisListItemDto[];
  pagination: PaginationDetails;
}

export interface AnalysisInitiatedDto {
  message: string;
  analysisId: string;
}
```

## 6. Zarządzanie stanem

### Custom hook: useAnalyses

```typescript
interface UseAnalysesReturn {
  analyses: AnalysisListItemDto[];
  pagination: PaginationDetails | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
  fetchAnalyses: (page: number, limit: number) => Promise<void>;
  createAnalysis: () => Promise<string>; // Returns analysisId
}

const useAnalyses = (): UseAnalysesReturn => {
  const { accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  const [analyses, setAnalyses] = useState<AnalysisListItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyses = async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalyses(page, limit, accessToken);
      setAnalyses(data.data);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || 'Błąd ładowania analiz');
    } finally {
      setLoading(false);
    }
  };

  const createAnalysis = async (): Promise<string> => {
    setCreating(true);
    try {
      const result = await initiateAnalysis(accessToken);
      message.success('Analiza została uruchomiona');
      return result.analysisId;
    } catch (err: any) {
      message.error(err.message || 'Błąd tworzenia analizy');
      throw err;
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    fetchAnalyses(page, limit);
  }, [page, limit]);

  return {
    analyses,
    pagination,
    loading,
    creating,
    error,
    fetchAnalyses,
    createAnalysis,
  };
};
```

## 7. Integracja API

### GET /analyses

**Request**:
```typescript
GET /api/v1/analyses?page=1&limit=10
Headers: { Authorization: `Bearer ${accessToken}` }
```

**Response (200)**:
```typescript
{
  data: [
    {
      id: "uuid-1",
      analysisDate: "2025-01-20T10:30:00Z",
      portfolioValue: 125000.50,
      aiModel: "claude-3.5-sonnet"
    },
    ...
  ],
  pagination: {
    currentPage: 1,
    totalPages: 5,
    totalItems: 47,
    itemsPerPage: 10
  }
}
```

### POST /analyses

**Request**:
```typescript
POST /api/v1/analyses
Headers: { Authorization: `Bearer ${accessToken}` }
Body: {} // Empty body
```

**Response (201)**:
```typescript
{
  message: "Analysis initiated successfully",
  analysisId: "uuid-new"
}
```

**Error (400)**: `{ message: "No transactions found" }` - portfolio pusty

## 8. Interakcje użytkownika

### Ładowanie listy

1. Widok ładuje się → pokazuje List.Item ze Skeleton (5 items)
2. Fetch analiz z API
3. Po sukcesie: renderuje listę + pagination
4. Jeśli data pusty: EmptyState "Nie masz jeszcze analiz"

### Paginacja

1. Użytkownik klika numer strony w Pagination
2. Aktualizacja URL: `/analyses?page=2`
3. useAnalyses wykrywa zmianę → fetch nowej strony
4. Lista się odświeża

### Inicjowanie nowej analizy

1. Kliknięcie "Nowa analiza AI"
2. Modal z informacją:
   - "Analiza potrwa 30-60 sekund"
   - "Portfel musi mieć transakcje"
3. Confirm → POST /analyses
4. Sukces:
   - Message: "Analiza została uruchomiona"
   - Navigate: `/analyses/${analysisId}`
5. Błąd (400 - brak transakcji):
   - Modal.error: "Dodaj transakcje przed analizą"
   - CTA: "Przejdź do transakcji"

### Nawigacja do szczegółów

1. Kliknięcie "Zobacz szczegóły" lub całej pozycji List.Item
2. Navigate `/analyses/${id}`

## 9. Warunki i walidacja

### Przed inicjowaniem analizy

- **Warunek**: Portfolio musi mieć co najmniej 1 transakcję
- **Sprawdzenie**: Backend zwraca 400 jeśli brak transakcji
- **Feedback**: Modal z informacją + przekierowanie do `/transactions`

### Paginacja

- **page**: >= 1, <= totalPages
- **limit**: 5, 10, 20, 50 (select w UI)

## 10. Obsługa błędów

### 400 Bad Request (No transactions)

```typescript
Modal.error({
  title: 'Brak transakcji',
  content: 'Aby wykonać analizę, musisz najpierw dodać transakcje do portfela.',
  okText: 'Przejdź do transakcji',
  onOk: () => navigate('/transactions'),
});
```

### 404 Not Found (Pusta lista)

EmptyState z CTA.

### 500 Server Error

Alert nad listą z retry button.

### Przypadki brzegowe

1. **Równoczesne analizy**: Backend limituje (1 analiza na 5 min) → 429 Too Many Requests
2. **Stara analiza**: Jeśli `analysisDate` > 30 dni → Tag "Nieaktualna"
3. **Analiza w trakcie**: Status "processing" → Skeleton + Button disabled

## 11. Kroki implementacji

### Krok 1: API functions

**Lokalizacja**: `frontend/src/shared/api/analyses.api.ts`

```typescript
export const getAnalyses = async (
  page: number,
  limit: number,
  accessToken: string
): Promise<PaginatedAnalysesDto> => {
  const response = await fetch(`/api/v1/analyses?page=${page}&limit=${limit}`, {
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

export const initiateAnalysis = async (
  accessToken: string
): Promise<AnalysisInitiatedDto> => {
  const response = await fetch('/api/v1/analyses', {
    method: 'POST',
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

### Krok 2: Custom hook useAnalyses

(Kod jak w sekcji 6)

### Krok 3: Komponent AnalysisListItem

**Lokalizacja**: `frontend/src/components/analyses/AnalysisListItem.tsx`

```typescript
import { List, Avatar, Typography, Button, Tag } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { AnalysisListItemDto } from '../../shared/types/analysis.types';
import './AnalysisListItem.scss';

const { Text } = Typography;

interface Props {
  analysis: AnalysisListItemDto;
  onClick: (id: string) => void;
}

const getModelIcon = (model: string) => {
  if (model.includes('claude')) return '🧠';
  if (model.includes('gemini')) return '💎';
  return '🤖';
};

export const AnalysisListItem = ({ analysis, onClick }: Props) => {
  const isOld = new Date().getTime() - new Date(analysis.analysisDate).getTime() > 30 * 24 * 60 * 60 * 1000;

  return (
    <List.Item
      className="analysis-list-item"
      onClick={() => onClick(analysis.id)}
      actions={[
        <Button type="link" key="details">
          Zobacz szczegóły
        </Button>,
      ]}
    >
      <List.Item.Meta
        avatar={<Avatar size="large">{getModelIcon(analysis.aiModel)}</Avatar>}
        title={
          <div>
            {new Date(analysis.analysisDate).toLocaleString('pl-PL')}
            {isOld && <Tag color="orange" style={{ marginLeft: 8 }}>Nieaktualna</Tag>}
          </div>
        }
        description={
          <>
            <Text type="secondary">Model: {analysis.aiModel}</Text>
            <br />
            <Text strong>Wartość portfela: {analysis.portfolioValue.toLocaleString('pl-PL', { style: 'currency', currency: 'PLN' })}</Text>
          </>
        }
      />
    </List.Item>
  );
};
```

### Krok 4: Komponent AnalysesListPage

**Lokalizacja**: `frontend/src/pages/analyses/AnalysesListPage.tsx`

```typescript
import { useState } from 'react';
import { Layout, Card, Typography, List, Pagination, Statistic, Space, Button, Empty, Modal, message } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAnalyses } from '../../shared/hooks/useAnalyses';
import { AnalysisListItem } from '../../components/analyses/AnalysisListItem';
import './AnalysesListPage.scss';

const { Content } = Layout;
const { Title } = Typography;

export const AnalysesListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { analyses, pagination, loading, creating, error, createAnalysis } = useAnalyses();

  const page = Number(searchParams.get('page')) || 1;

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: String(newPage) });
  };

  const handleNewAnalysis = () => {
    Modal.confirm({
      title: 'Nowa analiza AI',
      content: 'Analiza Twojego portfela potrwa 30-60 sekund. Czy chcesz kontynuować?',
      okText: 'Tak, rozpocznij',
      cancelText: 'Anuluj',
      onOk: async () => {
        try {
          const analysisId = await createAnalysis();
          navigate(`/analyses/${analysisId}`);
        } catch (err: any) {
          if (err.statusCode === 400) {
            Modal.error({
              title: 'Brak transakcji',
              content: 'Aby wykonać analizę, musisz najpierw dodać transakcje do portfela.',
              okText: 'Przejdź do transakcji',
              onOk: () => navigate('/transactions'),
            });
          }
        }
      },
    });
  };

  if (loading && analyses.length === 0) {
    return (
      <Content style={{ padding: '24px' }}>
        <Card>
          <List
            itemLayout="horizontal"
            dataSource={[1, 2, 3, 4, 5]}
            renderItem={() => <List.Item loading />}
          />
        </Card>
      </Content>
    );
  }

  if (analyses.length === 0) {
    return (
      <Content className="analyses-list-page">
        <div className="analyses-list-page__header">
          <Title level={2}>Historia analiz</Title>
        </div>
        <Card>
          <Empty
            description="Nie masz jeszcze żadnych analiz portfela"
            image={<ThunderboltOutlined style={{ fontSize: 64 }} />}
          >
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleNewAnalysis}
              loading={creating}
            >
              Wykonaj pierwszą analizę
            </Button>
          </Empty>
        </Card>
      </Content>
    );
  }

  const lastAnalysis = analyses[0];

  return (
    <Content className="analyses-list-page">
      <div className="analyses-list-page__header">
        <Title level={2}>Historia analiz</Title>
        <Space size="large" style={{ marginTop: 16 }}>
          <Statistic title="Liczba analiz" value={pagination?.totalItems || 0} />
          <Statistic
            title="Ostatnia analiza"
            value={new Date(lastAnalysis.analysisDate).toLocaleDateString('pl-PL')}
          />
        </Space>
        <Button
          type="primary"
          icon={<ThunderboltOutlined />}
          onClick={handleNewAnalysis}
          loading={creating}
          style={{ marginTop: 16 }}
        >
          Nowa analiza AI
        </Button>
      </div>

      <Card>
        <List
          itemLayout="horizontal"
          dataSource={analyses}
          renderItem={(analysis) => (
            <AnalysisListItem
              analysis={analysis}
              onClick={(id) => navigate(`/analyses/${id}`)}
            />
          )}
        />
        {pagination && pagination.totalPages > 1 && (
          <Pagination
            current={page}
            total={pagination.totalItems}
            pageSize={pagination.itemsPerPage}
            onChange={handlePageChange}
            showSizeChanger={false}
            style={{ marginTop: 24, textAlign: 'center' }}
          />
        )}
      </Card>
    </Content>
  );
};
```

### Krok 5: Styling SCSS

**Lokalizacja**: `frontend/src/pages/analyses/AnalysesListPage.scss`

```scss
.analyses-list-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  &__header {
    margin-bottom: 24px;

    h2 {
      margin-bottom: 0;
    }
  }

  @media (max-width: 768px) {
    padding: 16px;
  }
}

.analysis-list-item {
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #f5f5f5;
  }
}
```

### Krok 6: Routing

```typescript
<Route element={<PrivateRoute />}>
  <Route path="/analyses" element={<AnalysesListPage />} />
</Route>
```

### Krok 7: Testowanie

1. **Unit tests**:
   - useAnalyses hook
   - AnalysisListItem component

2. **Integration tests**:
   - Pagination flow
   - Create analysis flow

3. **E2E**:
   - Pusta lista → create first analysis
   - Lista z danymi → navigate to details
   - Paginacja

## 12. Optymalizacje

- **Polling**: Auto-refresh co 30s jeśli ostatnia analiza ma status "processing"
- **Infinite scroll**: Zamiast paginacji (opcjonalnie)
- **Search**: Filtrowanie po modelu AI, dacie
- **Export**: Przycisk "Eksportuj historię" (CSV)
