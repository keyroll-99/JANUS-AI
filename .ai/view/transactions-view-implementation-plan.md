# Plan implementacji widoku Transakcji

## 1. Przegląd

Widok Transakcji to najbardziej złożony widok w aplikacji, umożliwiający przeglądanie, filtrowanie, dodawanie, edytowanie i usuwanie transakcji. Zawiera tabelę z paginacją po stronie serwera, zaawansowane filtrowanie, modalne formularze oraz funkcję importu plików XTB. Jest to kluczowy punkt zarządzania danymi portfela.

## 2. Routing widoku

**Ścieżka**: `/transactions`

**Query parameters**:
- `page` - numer strony (default: 1)
- `ticker` - filtr po tickerze
- `type` - filtr po typie transakcji
- `account` - filtr po typie konta

**Typ trasy**: Chroniona (wymaga uwierzytelnienia)

## 3. Struktura komponentów

```
TransactionsPage
├── PageHeader
│   ├── Typography.Title ("Transakcje")
│   └── Space (przyciski akcji)
│       ├── Button ("Importuj z XTB")
│       └── Button ("Dodaj transakcję", type="primary")
├── Card (Filtry)
│   └── Form (inline layout)
│       ├── Form.Item (Ticker)
│       │   └── Input (search)
│       ├── Form.Item (Typ transakcji)
│       │   └── Select
│       ├── Form.Item (Typ konta)
│       │   └── Select
│       └── Button ("Wyczyść filtry")
├── Card (Tabela)
│   ├── Table (Ant Design)
│   │   ├── Column (Data transakcji)
│   │   ├── Column (Typ)
│   │   ├── Column (Konto)
│   │   ├── Column (Ticker)
│   │   ├── Column (Ilość)
│   │   ├── Column (Cena)
│   │   ├── Column (Wartość)
│   │   ├── Column (Prowizja)
│   │   └── Column (Akcje) - Edit/Delete buttons
│   └── Pagination (kontrolki paginacji)
├── ImportModal
│   ├── Upload.Dragger
│   ├── Alert (feedback)
│   └── Space (przyciski)
├── TransactionFormModal
│   ├── Form
│   │   ├── Form.Item (Data)
│   │   │   └── DatePicker
│   │   ├── Form.Item (Typ transakcji)
│   │   │   └── Select
│   │   ├── Form.Item (Typ konta)
│   │   │   └── Select
│   │   ├── Form.Item (Ticker)
│   │   │   └── Input
│   │   ├── Form.Item (Ilość)
│   │   │   └── InputNumber
│   │   ├── Form.Item (Cena)
│   │   │   └── InputNumber
│   │   ├── Form.Item (Prowizja)
│   │   │   └── InputNumber
│   │   └── Form.Item (Notatki)
│   │       └── TextArea
│   └── Space (przyciski modala)
└── DeleteConfirmModal
    └── Modal.confirm (Ant Design)
```

## 4. Szczegóły komponentów

### TransactionsPage

- **Opis komponentu**: Główny kontener widoku. Zarządza stanem transakcji, filtrami, paginacją, modalami i operacjami CRUD.
- **Główne elementy**: PageHeader, Filtry, Tabela, Modały
- **Obsługiwane zdarzenia**:
  - Fetch transakcji z API
  - Dodawanie nowej transakcji
  - Edycja istniejącej transakcji
  - Usuwanie transakcji
  - Import z pliku
  - Zmiana filtrów i paginacji
- **Warunki walidacji**: Brak (delegowane do formularzy)
- **Typy**: `TransactionDto`, `PaginatedTransactionsDto`, `GetTransactionsQueryDto`
- **Propsy**: Brak (główny widok)

### TransactionsTable

- **Opis komponentu**: Tabela Ant Design z transakcjami. Wspiera sortowanie, paginację i akcje na wierszach.
- **Główne elementy**:
  - `Table` z kolumnami
  - `Tag` dla typów transakcji (kolorowe)
  - `Button` (Edit/Delete) w kolumnie akcji
  - `Skeleton` podczas ładowania
  - `Empty` gdy brak danych
- **Obsługiwane interakcje**:
  - `onEdit` - otwiera modal edycji
  - `onDelete` - otwiera modal potwierdzenia usunięcia
  - `onChange` - zmiana sortowania/paginacji
- **Obsługiwana walidacja**: Brak
- **Typy**: `TransactionDto[]`, `PaginationDto`
- **Propsy**:
  - `data: TransactionDto[]`
  - `loading: boolean`
  - `pagination: PaginationDto`
  - `onEdit: (transaction: TransactionDto) => void`
  - `onDelete: (id: string) => void`
  - `onPaginationChange: (page: number, pageSize: number) => void`

### TransactionFilters

- **Opis komponentu**: Formularz filtrowania transakcji (inline layout). Automatycznie aktualizuje query params i triggeruje refetch.
- **Główne elementy**:
  - `Form` z `layout="inline"`
  - `Input` z ikoną search dla tickera
  - `Select` dla typu transakcji
  - `Select` dla typu konta
  - `Button` "Wyczyść filtry"
- **Obsługiwane interakcje**:
  - `onValuesChange` - automatyczne filtrowanie
  - `onReset` - czyszczenie filtrów
- **Obsługiwana walidacja**: Brak (filtry opcjonalne)
- **Typy**: `FilterFormValues`
- **Propsy**:
  - `initialValues?: FilterFormValues`
  - `onChange: (values: FilterFormValues) => void`

### TransactionFormModal

- **Opis komponentu**: Modal z formularzem dodawania/edycji transakcji. Wspiera oba tryby (create/update) w zależności od propsów.
- **Główne elementy**:
  - `Modal` z formularzem
  - Pola: DatePicker, Select (typ transakcji), Select (konto), Input (ticker), InputNumber (ilość, cena, prowizja), TextArea (notatki)
  - Footer z przyciskami "Anuluj" / "Zapisz"
- **Obsługiwane interakcje**:
  - `onFinish` - wysłanie formularza
  - `onCancel` - zamknięcie modala
  - `afterClose` - reset formularza
- **Obsługiwana walidacja**:
  - Data: wymagana, nie w przyszłości
  - Typ transakcji: wymagany
  - Typ konta: wymagany
  - Ticker: wymagany dla BUY/SELL, format [A-Z]{1,5}
  - Ilość: wymagana dla BUY/SELL, > 0
  - Cena: wymagana dla BUY/SELL, > 0
  - Prowizja: >= 0
  - Notatki: max 500 znaków
- **Typy**: `TransactionFormValues`, `CreateTransactionDto`, `UpdateTransactionDto`
- **Propsy**:
  - `open: boolean`
  - `mode: 'create' | 'edit'`
  - `initialValues?: TransactionDto`
  - `onSubmit: (values: TransactionFormValues) => Promise<void>`
  - `onCancel: () => void`
  - `loading: boolean`

### ImportModal

- **Opis komponentu**: Modal do importu transakcji z pliku XTB. Podobny do ImportStep z Onboarding, ale jako modal.
- **Główne elementy**:
  - `Modal`
  - `Upload.Dragger`
  - `Alert` z feedbackiem
  - Progress bar (opcjonalnie)
- **Obsługiwane interakcje**:
  - `beforeUpload` - walidacja pliku
  - `onUpload` - wysłanie pliku do API
  - `onCancel` - zamknięcie modala
- **Obsługiwana walidacja**:
  - Typ pliku: .xlsx, .xls
  - Rozmiar: max 5MB
- **Typy**: `ImportResult`
- **Propsy**:
  - `open: boolean`
  - `onSuccess: (result: ImportResult) => void`
  - `onCancel: () => void`

## 5. Typy

### TransactionDto

```typescript
/**
 * Pojedyncza transakcja zwracana z API
 */
interface TransactionDto {
  id: string;
  userId: string;
  transactionDate: string; // ISO 8601
  transactionType: string; // 'BUY', 'SELL', 'DIVIDEND', etc.
  accountType: string; // 'STANDARD', 'IKE', 'IKZE'
  ticker: string | null;
  quantity: number | null;
  price: number | null;
  totalAmount: number;
  commission: number;
  notes: string | null;
  importedFromFile: boolean;
  importBatchId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

### PaginatedTransactionsDto

```typescript
/**
 * Odpowiedź API z paginacją
 */
interface PaginatedTransactionsDto {
  data: TransactionDto[];
  pagination: PaginationDto;
}

interface PaginationDto {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}
```

### TransactionFormValues

```typescript
/**
 * Wartości formularza transakcji (frontend)
 */
interface TransactionFormValues {
  transactionDate: string; // ISO format
  transactionTypeId: number;
  accountTypeId: number;
  ticker?: string | null;
  quantity?: number | null;
  price?: number | null;
  commission: number;
  notes?: string | null;
}
```

### FilterFormValues

```typescript
/**
 * Wartości formularza filtrów
 */
interface FilterFormValues {
  ticker?: string;
  type?: string;
  account?: string;
}
```

### GetTransactionsQueryDto

```typescript
/**
 * Query parameters dla GET /transactions
 */
interface GetTransactionsQueryDto {
  page: number;
  limit: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  type?: string;
  ticker?: string;
}
```

## 6. Zarządzanie stanem

### Stan lokalny

- `transactions: TransactionDto[]` - lista transakcji
- `pagination: PaginationDto` - informacje o paginacji
- `loading: boolean` - stan ładowania
- `filters: FilterFormValues` - aktywne filtry
- `selectedTransaction: TransactionDto | null` - transakcja do edycji
- `modalState` - stan modali (create/edit/import/delete)

### Custom hook: useTransactions

```typescript
interface UseTransactionsReturn {
  transactions: TransactionDto[];
  pagination: PaginationDto;
  loading: boolean;
  error: string | null;
  filters: FilterFormValues;
  fetchTransactions: (query: GetTransactionsQueryDto) => Promise<void>;
  createTransaction: (data: CreateTransactionDto) => Promise<void>;
  updateTransaction: (id: string, data: UpdateTransactionDto) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  importTransactions: (file: File) => Promise<ImportResult>;
  setFilters: (filters: FilterFormValues) => void;
  clearFilters: () => void;
}
```

## 7. Integracja API

### GET /transactions

**Request**:
```typescript
Query params: {
  page: 1,
  limit: 20,
  sortBy: 'transaction_date',
  order: 'desc',
  type?: 'BUY',
  ticker?: 'AAPL'
}
```

**Response (200)**:
```typescript
{
  data: TransactionDto[],
  pagination: PaginationDto
}
```

### POST /transactions

**Request**:
```typescript
Body: CreateTransactionDto
```

**Response (201)**: `TransactionDto`

### PUT /transactions/:id

**Request**:
```typescript
Params: { id: string }
Body: UpdateTransactionDto
```

**Response (200)**: `TransactionDto`

### DELETE /transactions/:id

**Response (204)**: No content

### POST /transactions/import-xtb

**Request**: multipart/form-data with file

**Response (201)**:
```typescript
{
  message: string,
  importedCount: number,
  importBatchId: string
}
```

## 8. Interakcje użytkownika

### Przeglądanie transakcji

1. Widok ładuje się z domyślną stroną 1, sortowaniem po dacie (desc)
2. Tabela wyświetla transakcje z kolorowymi tagami dla typów
3. Użytkownik może:
   - Przewijać strony
   - Zmieniać liczbę wyników na stronę
   - Sortować po kolumnach

### Filtrowanie

1. Użytkownik wprowadza ticker → automatyczny refetch po 500ms debounce
2. Użytkownik wybiera typ transakcji → natychmiastowy refetch
3. Użytkownik wybiera typ konta → natychmiastowy refetch
4. "Wyczyść filtry" → reset do domyślnych wartości

### Dodawanie transakcji

1. Kliknięcie "Dodaj transakcję" → otwiera modal
2. Wypełnienie formularza z walidacją
3. Submit → API call → sukces → zamknięcie modala + refetch + notification
4. Błąd → Alert w modalu

### Edycja transakcji

1. Kliknięcie ikony edycji w wierszu → otwiera modal z danymi
2. Modyfikacja pól
3. Submit → API call → sukces → zamknięcie + refetch + notification

### Usuwanie transakcji

1. Kliknięcie ikony delete → Modal potwierdzający
2. Potwierdzenie → API call → sukces → refetch + notification
3. Anulowanie → zamknięcie modala

### Import z XTB

1. Kliknięcie "Importuj z XTB" → otwiera ImportModal
2. Wybór pliku (drag & drop lub browse)
3. Kliknięcie "Importuj" → upload z progress bar
4. Sukces → Alert z liczbą zaimportowanych → refetch → auto-close po 3s
5. Błąd → Alert z komunikatem → możliwość retry

## 9. Warunki i walidacja

### Walidacja formularza transakcji

| Pole | Warunki | Komunikat |
|------|---------|-----------|
| transactionDate | Wymagane, nie w przyszłości | "Data jest wymagana" / "Data nie może być w przyszłości" |
| transactionTypeId | Wymagane | "Wybierz typ transakcji" |
| accountTypeId | Wymagane | "Wybierz typ konta" |
| ticker | Wymagane dla BUY/SELL, [A-Z]{1,5} | "Ticker jest wymagany" / "Nieprawidłowy format tickera" |
| quantity | Wymagane dla BUY/SELL, > 0 | "Ilość musi być większa od 0" |
| price | Wymagane dla BUY/SELL, > 0 | "Cena musi być większa od 0" |
| commission | >= 0 | "Prowizja nie może być ujemna" |
| notes | Max 500 znaków | "Notatki mogą mieć max 500 znaków" |

### Dynamiczna walidacja

Pola ticker, quantity, price są:
- **Wymagane** gdy typ = BUY lub SELL
- **Opcjonalne** dla DIVIDEND, DEPOSIT, WITHDRAWAL

Implementacja:
```typescript
({ getFieldValue }) => ({
  validator(_, value) {
    const type = getFieldValue('transactionTypeId');
    const isBuyOrSell = type === BUY_ID || type === SELL_ID;
    
    if (isBuyOrSell && !value) {
      return Promise.reject('To pole jest wymagane dla transakcji BUY/SELL');
    }
    return Promise.resolve();
  },
})
```

## 10. Obsługa błędów

### Błędy API

#### 400 Bad Request
- Walidacja nie powiodła się
- Wyświetlenie Alert w modalu z konkretnymi błędami pól

#### 404 Not Found
- Transakcja nie istnieje (próba edycji/usunięcia usuniętej)
- message.error + refetch listy

#### 422 Unprocessable Entity (Import)
- Błąd parsowania pliku
- Alert w ImportModal z sugestią sprawdzenia formatu

### Przypadki brzegowe

1. **Pusta lista**: EmptyState z CTA "Dodaj pierwszą transakcję"
2. **Błąd sieci**: Retry button + offline indicator
3. **Concurrent edits**: Optimistic updates z rollback przy błędzie
4. **Bardzo duża liczba transakcji**: Virtual scrolling (opcjonalnie)
5. **Nieprawidłowa strona w URL**: Redirect do strony 1

## 11. Kroki implementacji

### Krok 1-3: Typy, API, constants (podobnie jak wcześniejsze widoki)

### Krok 4: Custom hook useTransactions

**Lokalizacja**: `frontend/src/shared/hooks/useTransactions.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import {
  TransactionDto,
  PaginatedTransactionsDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  GetTransactionsQueryDto,
  FilterFormValues,
  ImportResult
} from '../types/transactions.types';
import * as transactionsApi from '../api/transactions.api';

export const useTransactions = () => {
  const { accessToken } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDto>({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterFormValues>({
    ticker: searchParams.get('ticker') || undefined,
    type: searchParams.get('type') || undefined,
    account: searchParams.get('account') || undefined,
  });

  const fetchTransactions = useCallback(async (query: GetTransactionsQueryDto) => {
    if (!accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await transactionsApi.getTransactions(query, accessToken);
      setTransactions(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.message || 'Nie udało się pobrać transakcji');
      message.error('Nie udało się pobrać transakcji');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const query: GetTransactionsQueryDto = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: 20,
      sortBy: 'transaction_date',
      order: 'desc',
      ...filters,
    };
    
    fetchTransactions(query);
  }, [searchParams, filters, fetchTransactions]);

  const createTransaction = async (data: CreateTransactionDto) => {
    if (!accessToken) return;
    
    try {
      await transactionsApi.createTransaction(data, accessToken);
      message.success('Transakcja została dodana');
      await fetchTransactions({ page: 1, limit: 20, ...filters });
    } catch (err: any) {
      message.error(err.message || 'Nie udało się dodać transakcji');
      throw err;
    }
  };

  const updateTransaction = async (id: string, data: UpdateTransactionDto) => {
    if (!accessToken) return;
    
    try {
      await transactionsApi.updateTransaction(id, data, accessToken);
      message.success('Transakcja została zaktualizowana');
      await fetchTransactions({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      });
    } catch (err: any) {
      message.error(err.message || 'Nie udało się zaktualizować transakcji');
      throw err;
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!accessToken) return;
    
    try {
      await transactionsApi.deleteTransaction(id, accessToken);
      message.success('Transakcja została usunięta');
      await fetchTransactions({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...filters
      });
    } catch (err: any) {
      message.error(err.message || 'Nie udało się usunąć transakcji');
      throw err;
    }
  };

  const importTransactions = async (file: File): Promise<ImportResult> => {
    if (!accessToken) throw new Error('Unauthorized');
    
    const result = await transactionsApi.importTransactionsFile(file, accessToken);
    message.success(`Zaimportowano ${result.importedCount} transakcji`);
    await fetchTransactions({ page: 1, limit: 20, ...filters });
    return result;
  };

  const updateFilters = (newFilters: FilterFormValues) => {
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    if (newFilters.ticker) params.set('ticker', newFilters.ticker);
    if (newFilters.type) params.set('type', newFilters.type);
    if (newFilters.account) params.set('account', newFilters.account);
    params.set('page', '1'); // Reset to page 1 when filtering
    
    setSearchParams(params);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchParams({ page: '1' });
  };

  return {
    transactions,
    pagination,
    loading,
    error,
    filters,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    updateFilters,
    clearFilters,
  };
};
```

### Kroki 5-12: Komponenty podobnie jak w poprzednich widokach

- TransactionFilters
- TransactionsTable  
- TransactionFormModal
- ImportModal
- TransactionsPage
- Styling
- Routing
- Testowanie

**Uwaga**: Ze względu na złożoność, każdy komponent wymaga szczegółowej implementacji z obsługą edge cases.

## 12. Optymalizacja

- Debounce dla filtru tickera (500ms)
- Optimistic updates dla delete
- Virtual scrolling dla dużych list (opcjonalnie)
- Cache API responses (stale-while-revalidate)
- Skeleton rows w tabeli podczas ładowania
