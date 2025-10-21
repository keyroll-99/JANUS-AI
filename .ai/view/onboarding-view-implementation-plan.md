# Plan implementacji widoku Onboarding

## 1. Przegląd

Widok Onboarding przeprowadza nowego użytkownika przez początkową konfigurację konta w aplikacji Janus AI. Jest to wielokrokowy proces składający się z dwóch głównych etapów: opcjonalnego importu danych z pliku XTB oraz obowiązkowej definicji strategii inwestycyjnej. Po zakończeniu onboardingu użytkownik jest przekierowywany na główny Dashboard.

## 2. Routing widoku

**Ścieżka**: `/onboarding`

**Typ trasy**: Chroniona (wymaga uwierzytelnienia, ale tylko dla nowych użytkowników)

**Przekierowanie**: 
- Po zakończeniu onboardingu → `/dashboard`
- Jeśli użytkownik już ma strategię → automatyczne przekierowanie na `/dashboard`
- Jeśli użytkownik nie jest zalogowany → `/login`

## 3. Struktura komponentów

```
OnboardingPage
├── Layout (Ant Design)
│   └── Content
│       ├── Card
│       │   ├── Steps (Ant Design)
│       │   │   ├── Step ("Import danych")
│       │   │   └── Step ("Strategia inwestycyjna")
│       │   ├── StepContent (warunkowe renderowanie)
│       │   │   ├── ImportStep (gdy current === 0)
│       │   │   │   ├── Typography.Title
│       │   │   │   ├── Typography.Paragraph (instrukcje)
│       │   │   │   ├── Upload.Dragger
│       │   │   │   ├── Alert (feedback)
│       │   │   │   └── Space (przyciski)
│       │   │   │       ├── Button ("Pomiń")
│       │   │   │       └── Button ("Dalej", disabled gdy nie ma pliku)
│       │   │   └── StrategyStep (gdy current === 1)
│       │   │       ├── Typography.Title
│       │   │       ├── Typography.Paragraph (wyjaśnienie)
│       │   │       ├── StrategyForm
│       │   │       │   ├── Form.Item (Horyzont czasowy)
│       │   │       │   │   └── Select
│       │   │       │   ├── Form.Item (Poziom ryzyka)
│       │   │       │   │   └── Select
│       │   │       │   ├── Form.Item (Cele inwestycyjne)
│       │   │       │   │   └── Input.TextArea
│       │   │       │   └── Space (przyciski)
│       │   │       │       ├── Button ("Wstecz")
│       │   │       │       └── Button ("Zakończ", type="primary")
```

## 4. Szczegóły komponentów

### OnboardingPage

- **Opis komponentu**: Główny kontener wielokrokowego procesu onboardingu. Zarządza stanem aktualnego kroku, przechowuje dane pośrednie i koordynuje nawigację między krokami.
- **Główne elementy**: 
  - `Layout` z wycentrowanym `Content`
  - `Card` jako główny kontener (max-width: 800px)
  - `Steps` component pokazujący postęp (2 kroki)
  - Warunkowe renderowanie `ImportStep` lub `StrategyStep`
- **Obsługiwane zdarzenia**:
  - `onStepChange` - zmiana aktualnego kroku
  - `onImportComplete` - zakończenie importu (lub pominięcie)
  - `onStrategyComplete` - zakończenie onboardingu
  - `onSkipImport` - pominięcie kroku importu
- **Warunki walidacji**: Sprawdzenie czy użytkownik już ma strategię (redirect do dashboard)
- **Typy**: `OnboardingState`, `ImportResult`, `StrategyFormValues`
- **Propsy**: Brak (główny widok)

### ImportStep

- **Opis komponentu**: Pierwszy krok onboardingu umożliwiający import transakcji z pliku Excel XTB. Krok jest opcjonalny - użytkownik może go pominąć.
- **Główne elementy**:
  - `Typography.Title` level={3} ("Import transakcji z XTB")
  - `Typography.Paragraph` z instrukcjami (jak wygenerować plik w XTB)
  - `Upload.Dragger` z obsługą drag & drop
  - `Alert` pokazujący status importu (sukces/błąd)
  - `List` z podsumowaniem zaimportowanych transakcji (po sukcesie)
  - `Space` z przyciskami nawigacyjnymi
- **Obsługiwane zdarzenia**:
  - `onChange` - wybór pliku przez użytkownika
  - `beforeUpload` - walidacja pliku przed wysłaniem
  - `onSuccess` - obsługa pomyślnego importu
  - `onError` - obsługa błędów importu
  - `onSkip` - pominięcie kroku
  - `onNext` - przejście do następnego kroku
- **Obsługiwana walidacja**:
  - Typ pliku: tylko `.xlsx` lub `.xls`
  - Rozmiar pliku: max 5MB
  - Format zawartości: zgodny z XTB export
- **Typy**: `ImportResult`, `UploadFile`
- **Propsy**:
  - `onComplete: (result: ImportResult | null) => void` - callback po zakończeniu kroku
  - `onNext: () => void` - przejście do następnego kroku

### StrategyStep

- **Opis komponentu**: Drugi (obowiązkowy) krok onboardingu do zdefiniowania strategii inwestycyjnej użytkownika.
- **Główne elementy**:
  - `Typography.Title` level={3} ("Zdefiniuj swoją strategię")
  - `Typography.Paragraph` z wyjaśnieniem znaczenia strategii dla analiz AI
  - `StrategyForm` (zagnieżdżony formularz)
  - `Space` z przyciskami nawigacyjnymi
- **Obsługiwane zdarzenia**:
  - `onBack` - powrót do poprzedniego kroku
  - `onFinish` - zakończenie onboardingu
- **Obsługiwana walidacja**: Delegowana do `StrategyForm`
- **Typy**: `StrategyFormValues`
- **Propsy**:
  - `onComplete: (strategy: StrategyFormValues) => void` - callback po zakończeniu
  - `onBack: () => void` - powrót do poprzedniego kroku

### StrategyForm

- **Opis komponentu**: Formularz Ant Design do wprowadzenia strategii inwestycyjnej. Zawiera wybór horyzontu czasowego, poziomu ryzyka i opis celów.
- **Główne elementy**:
  - `Form` z `layout="vertical"`
  - `Form.Item` z `Select` dla horyzontu czasowego (SHORT, MEDIUM, LONG)
  - `Form.Item` z `Select` dla poziomu ryzyka (LOW, MEDIUM, HIGH)
  - `Form.Item` z `Input.TextArea` dla celów inwestycyjnych
  - `Alert` warunkowy dla błędów API
- **Obsługiwane zdarzenia**:
  - `onFinish` - wysłanie formularza po walidacji
  - `onValuesChange` - czyszczenie błędów podczas edycji
- **Obsługiwana walidacja**:
  - **Horyzont czasowy**: Wymagane, jedna z opcji [SHORT, MEDIUM, LONG]
  - **Poziom ryzyka**: Wymagane, jedna z opcji [LOW, MEDIUM, HIGH]
  - **Cele inwestycyjne**: 
    - Wymagane
    - Min. 10 znaków: "Cele muszą zawierać co najmniej 10 znaków"
    - Max. 500 znaków: "Cele nie mogą przekraczać 500 znaków"
- **Typy**: `StrategyFormValues`, `StrategyResponse`
- **Propsy**:
  - `onSuccess: (response: StrategyResponse) => void` - callback po pomyślnym zapisie
  - `loading?: boolean` - stan ładowania
  - `error?: string | null` - komunikat błędu

## 5. Typy

### OnboardingState

```typescript
/**
 * Stan widoku Onboarding
 */
interface OnboardingState {
  currentStep: number; // 0 = Import, 1 = Strategy
  importResult: ImportResult | null;
  strategyData: StrategyFormValues | null;
  loading: boolean;
  error: string | null;
}
```

### ImportResult

```typescript
/**
 * Wynik procesu importu transakcji
 */
interface ImportResult {
  importedCount: number;
  importBatchId: string;
  message: string;
}
```

### StrategyFormValues

```typescript
/**
 * Wartości formularza strategii (frontend)
 */
interface StrategyFormValues {
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
}
```

### StrategyRequestDto

```typescript
/**
 * DTO wysyłane do API (zgodne z backend)
 */
interface StrategyRequestDto {
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
}
```

### StrategyResponse

```typescript
/**
 * Odpowiedź z API po utworzeniu strategii
 */
interface StrategyResponse {
  id: string;
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
  updatedAt: string;
}
```

### TimeHorizonOption & RiskLevelOption

```typescript
/**
 * Opcje dla Select w formularzu strategii
 */
interface TimeHorizonOption {
  value: 'SHORT' | 'MEDIUM' | 'LONG';
  label: string;
  description: string;
}

interface RiskLevelOption {
  value: 'LOW' | 'MEDIUM' | 'HIGH';
  label: string;
  description: string;
}
```

## 6. Zarządzanie stanem

### Stan lokalny (useState)

- `currentStep: number` - aktualny krok (0 = Import, 1 = Strategy)
- `importResult: ImportResult | null` - wynik importu (jeśli wykonano)
- `strategyData: StrategyFormValues | null` - dane strategii (do wysłania)
- `loading: boolean` - stan ładowania podczas API calls
- `error: string | null` - komunikat błędu

### Custom hook

**useOnboarding** - hook zarządzający logiką onboardingu:

```typescript
interface UseOnboardingReturn {
  currentStep: number;
  importResult: ImportResult | null;
  loading: boolean;
  error: string | null;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  handleImportComplete: (result: ImportResult | null) => void;
  handleStrategyComplete: (strategy: StrategyFormValues) => Promise<void>;
}

const useOnboarding = (): UseOnboardingReturn => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToNextStep = () => setCurrentStep((prev) => prev + 1);
  const goToPreviousStep = () => setCurrentStep((prev) => prev - 1);

  const handleImportComplete = (result: ImportResult | null) => {
    setImportResult(result);
    goToNextStep();
  };

  const handleStrategyComplete = async (strategy: StrategyFormValues) => {
    setLoading(true);
    setError(null);

    try {
      await createStrategy(strategy, accessToken!);
      message.success('Onboarding zakończony pomyślnie!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Nie udało się zapisać strategii.');
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStep,
    importResult,
    loading,
    error,
    goToNextStep,
    goToPreviousStep,
    handleImportComplete,
    handleStrategyComplete,
  };
};
```

## 7. Integracja API

### Endpoint 1: Import transakcji

**POST** `/api/v1/transactions/import-xtb`

#### Request

**Content-Type**: `multipart/form-data`

**Body**:
```typescript
{
  file: File; // Plik .xlsx lub .xls
}
```

**Headers**:
```typescript
{
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'multipart/form-data'
}
```

#### Response

**Success (201 Created)**: `ImportResult`

```typescript
{
  message: "File imported successfully.",
  importedCount: 50,
  importBatchId: "uuid-string"
}
```

**Error responses**:
- `400 Bad Request`: Brak pliku lub nieprawidłowy format
- `422 Unprocessable Entity`: Błąd parsowania danych
- `401 Unauthorized`: Nieprawidłowy token

### Endpoint 2: Tworzenie strategii

**POST** `/api/v1/strategy`

#### Request

**Typ żądania**: `StrategyRequestDto`

```typescript
{
  timeHorizon: "LONG",
  riskLevel: "MEDIUM",
  investmentGoals: "Long-term growth and dividend income."
}
```

**Headers**:
```typescript
{
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json'
}
```

#### Response

**Success (201 Created)**: `StrategyResponse`

```typescript
{
  id: "uuid-string",
  timeHorizon: "LONG",
  riskLevel: "MEDIUM",
  investmentGoals: "Long-term growth and dividend income.",
  updatedAt: "2025-10-21T10:00:00Z"
}
```

**Error responses**:
- `400 Bad Request`: Walidacja nie powiodła się
- `409 Conflict`: Użytkownik już ma strategię
- `401 Unauthorized`: Nieprawidłowy token

### Implementacja wywołań

```typescript
// Import transactions
const importTransactions = async (file: File, accessToken: string): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/v1/transactions/import-xtb', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Import failed');
  }

  return response.json();
};

// Create strategy
const createStrategy = async (data: StrategyRequestDto, accessToken: string): Promise<StrategyResponse> => {
  const response = await fetch('/api/v1/strategy', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create strategy');
  }

  return response.json();
};
```

## 8. Interakcje użytkownika

### Krok 1: Import danych (opcjonalny)

**Scenariusz A: Użytkownik importuje plik**

1. Użytkownik przeciąga plik do obszaru Upload.Dragger lub klika "Wybierz plik"
   - Walidacja typu pliku (tylko .xlsx, .xls)
   - Walidacja rozmiaru (max 5MB)
   - Wyświetlenie nazwy pliku i ikony

2. Użytkownik klika "Dalej"
   - Przycisk pokazuje stan `loading`
   - Wysyłane jest żądanie POST /transactions/import-xtb
   - Upload progress bar (opcjonalnie)

3. Po sukcesie:
   - Wyświetlenie `Alert` typu "success" z liczbą zaimportowanych transakcji
   - `List` z podsumowaniem (np. "Zaimportowano 50 transakcji")
   - Automatyczne przejście do kroku 2 po 2 sekundach (lub natychmiastowe po kliknięciu "Dalej")

4. W przypadku błędu:
   - Wyświetlenie `Alert` typu "error" z komunikatem
   - Przycisk "Spróbuj ponownie" do ponownego wyboru pliku
   - Przycisk "Pomiń" nadal aktywny

**Scenariusz B: Użytkownik pomija import**

1. Użytkownik klika "Pomiń"
   - Modal potwierdzający: "Czy na pewno chcesz pominąć import? Możesz to zrobić później."
   - Przyciski: "Wróć" / "Pomiń i kontynuuj"

2. Po potwierdzeniu:
   - Natychmiastowe przejście do kroku 2 (Strategy)
   - `importResult` pozostaje `null`

### Krok 2: Definicja strategii (obowiązkowy)

1. Użytkownik wybiera horyzont czasowy z dropdown
   - Opcje z opisami (tooltip):
     - "Krótki (< 2 lata)" → SHORT
     - "Średni (2-5 lat)" → MEDIUM
     - "Długi (> 5 lat)" → LONG

2. Użytkownik wybiera poziom ryzyka
   - Opcje z opisami:
     - "Niskie - Stabilne obligacje i fundusze" → LOW
     - "Średnie - Zbalansowany portfel" → MEDIUM
     - "Wysokie - Agresywny wzrost" → HIGH

3. Użytkownik wprowadza cele inwestycyjne
   - Placeholder: "Np. Oszczędzanie na emeryturę, zakup mieszkania, budowanie kapitału..."
   - Counter: "10 / 500 znaków"
   - Walidacja w czasie rzeczywistym

4. Użytkownik klika "Zakończ"
   - Przycisk pokazuje stan `loading`
   - Wysyłane jest żądanie POST /strategy

5. Po sukcesie:
   - `message.success("Onboarding zakończony!")`
   - Przekierowanie na `/dashboard`

6. W przypadku błędu:
   - Wyświetlenie `Alert` nad formularzem
   - Użytkownik może poprawić dane i spróbować ponownie

### Nawigacja między krokami

- **Wstecz** (z kroku 2): Powrót do kroku 1, zachowanie danych importu
- **Dalej** (z kroku 1): Tylko jeśli import się powiódł lub został pominięty
- **Progress bar**: Steps component pokazuje aktualny krok (highlight)

## 9. Warunki i walidacja

### Walidacja po stronie frontendu

#### Krok 1: Import

| Warunek | Komunikat | Realizacja |
|---------|-----------|------------|
| Typ pliku | "Obsługiwane formaty: .xlsx, .xls" | beforeUpload hook |
| Rozmiar pliku | "Plik nie może być większy niż 5MB" | beforeUpload hook |
| Plik wymagany dla "Dalej" | Przycisk disabled jeśli nie wybrano pliku | disabled prop |

#### Krok 2: Strategia

| Pole | Warunek | Komunikat |
|------|---------|-----------|
| Time Horizon | Wymagane | "Wybierz horyzont czasowy" |
| Risk Level | Wymagane | "Wybierz poziom ryzyka" |
| Investment Goals | Wymagane | "Cele inwestycyjne są wymagane" |
| Investment Goals | Min. 10 znaków | "Cele muszą zawierać co najmniej 10 znaków" |
| Investment Goals | Max. 500 znaków | "Cele nie mogą przekraczać 500 znaków" |

### Walidacja po stronie backendu

Backend przeprowadza dodatkową walidację:
- **Import**: Format pliku Excel, poprawność struktury danych
- **Strategia**: Zgodność z enum values, długość tekstu

## 10. Obsługa błędów

### Błędy importu transakcji

#### 400 Bad Request (Brak pliku)

```typescript
{
  message: "No file provided.",
  statusCode: 400
}
```

**Obsługa**: Alert "Wybierz plik do zaimportowania"

#### 422 Unprocessable Entity (Błąd parsowania)

```typescript
{
  message: "File format is incorrect or data parsing failed.",
  statusCode: 422
}
```

**Obsługa**: 
```
Alert typu "error":
"Nie udało się odczytać pliku. Upewnij się, że używasz właściwego formatu eksportu z XTB."

Extra: Link do dokumentacji "Jak wygenerować plik w XTB?"
```

### Błędy tworzenia strategii

#### 409 Conflict (Użytkownik już ma strategię)

**Obsługa**: 
```typescript
// Automatyczne przekierowanie na /dashboard
navigate('/dashboard', { 
  state: { 
    message: 'Masz już zdefiniowaną strategię. Możesz ją edytować w ustawieniach.' 
  } 
});
```

#### 400 Bad Request (Walidacja)

**Obsługa**: Wyświetlenie Alert z konkretnym błędem walidacji

### Przypadki brzegowe

1. **Użytkownik wraca przyciskiem "Wstecz" po imporcie**: Dane importu są zachowane, ale użytkownik nie może ponownie importować (komunikat "Import już wykonano")

2. **Plik > 5MB**: Upload.beforeUpload zwraca `false`, wyświetla Alert

3. **Utrata połączenia podczas importu**: Obsługa timeout, możliwość retry

4. **Użytkownik opuszcza stronę w trakcie**: Prompt potwierdzający "Czy na pewno chcesz opuścić? Postęp zostanie utracony."

5. **Dwukrotne wysłanie formularza strategii**: Przycisk disabled podczas loading

## 11. Kroki implementacji

### Krok 1: Utworzenie typów

**Lokalizacja**: `frontend/src/shared/types/onboarding.types.ts`

```typescript
export interface OnboardingState {
  currentStep: number;
  importResult: ImportResult | null;
  strategyData: StrategyFormValues | null;
  loading: boolean;
  error: string | null;
}

export interface ImportResult {
  importedCount: number;
  importBatchId: string;
  message: string;
}

export interface StrategyFormValues {
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
}

export interface StrategyRequestDto {
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
}

export interface StrategyResponse {
  id: string;
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
  updatedAt: string;
}

export interface TimeHorizonOption {
  value: 'SHORT' | 'MEDIUM' | 'LONG';
  label: string;
  description: string;
}

export interface RiskLevelOption {
  value: 'LOW' | 'MEDIUM' | 'HIGH';
  label: string;
  description: string;
}
```

### Krok 2: Utworzenie API client functions

**Lokalizacja**: `frontend/src/shared/api/onboarding.api.ts`

```typescript
import { ImportResult, StrategyRequestDto, StrategyResponse } from '../types/onboarding.types';

export const importTransactions = async (file: File, accessToken: string): Promise<ImportResult> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/v1/transactions/import-xtb', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Import failed');
  }

  return response.json();
};

export const createStrategy = async (data: StrategyRequestDto, accessToken: string): Promise<StrategyResponse> => {
  const response = await fetch('/api/v1/strategy', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create strategy');
  }

  return response.json();
};
```

### Krok 3: Utworzenie stałych dla opcji

**Lokalizacja**: `frontend/src/shared/constants/strategy.constants.ts`

```typescript
import { TimeHorizonOption, RiskLevelOption } from '../types/onboarding.types';

export const TIME_HORIZON_OPTIONS: TimeHorizonOption[] = [
  {
    value: 'SHORT',
    label: 'Krótki (< 2 lata)',
    description: 'Inwestycje krótkoterminowe, szybki dostęp do kapitału',
  },
  {
    value: 'MEDIUM',
    label: 'Średni (2-5 lat)',
    description: 'Zbalansowane podejście, umiarkowany wzrost',
  },
  {
    value: 'LONG',
    label: 'Długi (> 5 lat)',
    description: 'Inwestycje długoterminowe, maksymalizacja zwrotu',
  },
];

export const RISK_LEVEL_OPTIONS: RiskLevelOption[] = [
  {
    value: 'LOW',
    label: 'Niskie',
    description: 'Stabilne obligacje i fundusze, minimalne ryzyko',
  },
  {
    value: 'MEDIUM',
    label: 'Średnie',
    description: 'Zbalansowany portfel, umiarkowane wahania',
  },
  {
    value: 'HIGH',
    label: 'Wysokie',
    description: 'Agresywny wzrost, wyższe potencjalne zyski i straty',
  },
];
```

### Krok 4: Utworzenie custom hook useOnboarding

**Lokalizacja**: `frontend/src/shared/hooks/useOnboarding.ts`

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { ImportResult, StrategyFormValues } from '../types/onboarding.types';
import { createStrategy } from '../api/onboarding.api';

interface UseOnboardingReturn {
  currentStep: number;
  importResult: ImportResult | null;
  loading: boolean;
  error: string | null;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  handleImportComplete: (result: ImportResult | null) => void;
  handleStrategyComplete: (strategy: StrategyFormValues) => Promise<void>;
}

export const useOnboarding = (): UseOnboardingReturn => {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToNextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 1));
  const goToPreviousStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleImportComplete = (result: ImportResult | null) => {
    setImportResult(result);
    goToNextStep();
  };

  const handleStrategyComplete = async (strategy: StrategyFormValues) => {
    if (!accessToken) {
      setError('Unauthorized');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createStrategy(strategy, accessToken);
      message.success('Onboarding zakończony pomyślnie!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Nie udało się zapisać strategii.');
    } finally {
      setLoading(false);
    }
  };

  return {
    currentStep,
    importResult,
    loading,
    error,
    goToNextStep,
    goToPreviousStep,
    handleImportComplete,
    handleStrategyComplete,
  };
};
```

### Krok 5: Utworzenie komponentu ImportStep

**Lokalizacja**: `frontend/src/components/onboarding/ImportStep.tsx`

```typescript
import { useState } from 'react';
import { Typography, Upload, Button, Space, Alert, List, message } from 'antd';
import { InboxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useAuth } from '../../shared/contexts/AuthContext';
import { importTransactions } from '../../shared/api/onboarding.api';
import { ImportResult } from '../../shared/types/onboarding.types';

const { Title, Paragraph } = Typography;
const { Dragger } = Upload;

interface ImportStepProps {
  onComplete: (result: ImportResult | null) => void;
}

export const ImportStep = ({ onComplete }: ImportStepProps) => {
  const { accessToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: (file) => {
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                      file.type === 'application/vnd.ms-excel';
      if (!isExcel) {
        message.error('Można przesłać tylko pliki .xlsx lub .xls!');
        return Upload.LIST_IGNORE;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Plik nie może być większy niż 5MB!');
        return Upload.LIST_IGNORE;
      }
      setFile(file);
      setError(null);
      return false; // Prevent automatic upload
    },
    onRemove: () => {
      setFile(null);
      setResult(null);
      setError(null);
    },
  };

  const handleUpload = async () => {
    if (!file || !accessToken) return;

    setUploading(true);
    setError(null);

    try {
      const importResult = await importTransactions(file, accessToken);
      setResult(importResult);
      message.success(`Zaimportowano ${importResult.importedCount} transakcji!`);
    } catch (err: any) {
      setError(err.message || 'Nie udało się zaimportować pliku.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = () => {
    onComplete(null);
  };

  const handleNext = () => {
    onComplete(result);
  };

  return (
    <div>
      <Title level={3}>Import transakcji z XTB</Title>
      <Paragraph>
        Zaimportuj plik Excel z historią transakcji wygenerowany przez XTB Station.
        Ten krok jest opcjonalny - możesz dodać transakcje później ręcznie.
      </Paragraph>

      {!result && (
        <Dragger {...uploadProps} style={{ marginBottom: '16px' }}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Kliknij lub przeciągnij plik tutaj</p>
          <p className="ant-upload-hint">Obsługiwane formaty: .xlsx, .xls (max 5MB)</p>
        </Dragger>
      )}

      {error && (
        <Alert
          message="Błąd importu"
          description={error}
          type="error"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '16px' }}
        />
      )}

      {result && (
        <Alert
          message="Import zakończony pomyślnie!"
          description={`Zaimportowano ${result.importedCount} transakcji.`}
          type="success"
          icon={<CheckCircleOutlined />}
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      <Space>
        <Button onClick={handleSkip}>Pomiń</Button>
        {file && !result && (
          <Button type="primary" onClick={handleUpload} loading={uploading}>
            Importuj
          </Button>
        )}
        {result && (
          <Button type="primary" onClick={handleNext}>
            Dalej
          </Button>
        )}
      </Space>
    </div>
  );
};
```

### Krok 6: Utworzenie komponentu StrategyForm

**Lokalizacja**: `frontend/src/components/onboarding/StrategyForm.tsx`

```typescript
import { Form, Select, Input, Alert } from 'antd';
import { StrategyFormValues } from '../../shared/types/onboarding.types';
import { TIME_HORIZON_OPTIONS, RISK_LEVEL_OPTIONS } from '../../shared/constants/strategy.constants';

const { TextArea } = Input;

interface StrategyFormProps {
  onFinish: (values: StrategyFormValues) => void;
  loading?: boolean;
  error?: string | null;
}

export const StrategyForm = ({ onFinish, loading, error }: StrategyFormProps) => {
  const [form] = Form.useForm<StrategyFormValues>();

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      disabled={loading}
    >
      {error && (
        <Form.Item>
          <Alert message={error} type="error" showIcon closable />
        </Form.Item>
      )}

      <Form.Item
        label="Horyzont czasowy"
        name="timeHorizon"
        rules={[{ required: true, message: 'Wybierz horyzont czasowy' }]}
      >
        <Select
          placeholder="Wybierz horyzont czasowy"
          size="large"
          options={TIME_HORIZON_OPTIONS.map(opt => ({
            value: opt.value,
            label: (
              <div>
                <div>{opt.label}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{opt.description}</div>
              </div>
            ),
          }))}
        />
      </Form.Item>

      <Form.Item
        label="Poziom ryzyka"
        name="riskLevel"
        rules={[{ required: true, message: 'Wybierz poziom ryzyka' }]}
      >
        <Select
          placeholder="Wybierz poziom ryzyka"
          size="large"
          options={RISK_LEVEL_OPTIONS.map(opt => ({
            value: opt.value,
            label: (
              <div>
                <div>{opt.label}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{opt.description}</div>
              </div>
            ),
          }))}
        />
      </Form.Item>

      <Form.Item
        label="Cele inwestycyjne"
        name="investmentGoals"
        rules={[
          { required: true, message: 'Cele inwestycyjne są wymagane' },
          { min: 10, message: 'Cele muszą zawierać co najmniej 10 znaków' },
          { max: 500, message: 'Cele nie mogą przekraczać 500 znaków' },
        ]}
      >
        <TextArea
          rows={4}
          placeholder="Np. Oszczędzanie na emeryturę, zakup mieszkania, budowanie kapitału..."
          showCount
          maxLength={500}
        />
      </Form.Item>
    </Form>
  );
};
```

### Krok 7: Utworzenie komponentu StrategyStep

**Lokalizacja**: `frontend/src/components/onboarding/StrategyStep.tsx`

```typescript
import { Typography, Button, Space } from 'antd';
import { StrategyForm } from './StrategyForm';
import { StrategyFormValues } from '../../shared/types/onboarding.types';

const { Title, Paragraph } = Typography;

interface StrategyStepProps {
  onComplete: (strategy: StrategyFormValues) => void;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
}

export const StrategyStep = ({ onComplete, onBack, loading, error }: StrategyStepProps) => {
  return (
    <div>
      <Title level={3}>Zdefiniuj swoją strategię inwestycyjną</Title>
      <Paragraph>
        Twoja strategia pomoże AI w generowaniu spersonalizowanych rekomendacji.
        Możesz ją później edytować w ustawieniach konta.
      </Paragraph>

      <StrategyForm onFinish={onComplete} loading={loading} error={error} />

      <Space style={{ marginTop: '16px' }}>
        <Button onClick={onBack} disabled={loading}>
          Wstecz
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          Zakończ
        </Button>
      </Space>
    </div>
  );
};
```

### Krok 8: Utworzenie głównej strony OnboardingPage

**Lokalizacja**: `frontend/src/pages/onboarding/OnboardingPage.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Card, Steps, Alert } from 'antd';
import { useOnboarding } from '../../shared/hooks/useOnboarding';
import { ImportStep } from '../../components/onboarding/ImportStep';
import { StrategyStep } from '../../components/onboarding/StrategyStep';
import './OnboardingPage.scss';

const { Content } = Layout;
const { Step } = Steps;

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const {
    currentStep,
    importResult,
    loading,
    error,
    handleImportComplete,
    handleStrategyComplete,
    goToPreviousStep,
  } = useOnboarding();

  // TODO: Check if user already has strategy and redirect to dashboard

  const steps = [
    {
      title: 'Import danych',
      description: 'Opcjonalny',
    },
    {
      title: 'Strategia',
      description: 'Wymagane',
    },
  ];

  return (
    <Layout className="onboarding-page">
      <Content className="onboarding-page__content">
        <Card className="onboarding-page__card">
          <Steps current={currentStep} items={steps} style={{ marginBottom: '32px' }} />

          {error && (
            <Alert
              message="Wystąpił błąd"
              description={error}
              type="error"
              showIcon
              closable
              style={{ marginBottom: '24px' }}
            />
          )}

          {currentStep === 0 && <ImportStep onComplete={handleImportComplete} />}
          {currentStep === 1 && (
            <StrategyStep
              onComplete={handleStrategyComplete}
              onBack={goToPreviousStep}
              loading={loading}
              error={error}
            />
          )}
        </Card>
      </Content>
    </Layout>
  );
};
```

### Krok 9: Utworzenie stylów SCSS

**Lokalizacja**: `frontend/src/pages/onboarding/OnboardingPage.scss`

```scss
.onboarding-page {
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
    width: 100%;
  }

  &__card {
    width: 100%;
    max-width: 800px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    &__content {
      padding: 16px;
    }

    &__card {
      max-width: 100%;
    }
  }
}
```

### Krok 10: Dodanie routing

**Lokalizacja**: `frontend/src/App.tsx`

```typescript
import { OnboardingPage } from './pages/onboarding/OnboardingPage';

// W Routes:
<Route element={<PrivateRoute />}>
  <Route path="/onboarding" element={<OnboardingPage />} />
  {/* ... inne chronione trasy */}
</Route>
```

### Krok 11: Testowanie

1. **Testy jednostkowe**:
   - `ImportStep.test.tsx` - upload, walidacja, skip
   - `StrategyForm.test.tsx` - walidacja formularza
   - `useOnboarding.test.ts` - hook logic

2. **Testy integracyjne**:
   - Pełny flow onboardingu (import + strategia)
   - Skip import scenario
   - Error handling

3. **Testy E2E** (Playwright):
   - Kompletny onboarding po rejestracji
   - Responsywność

### Krok 12: Optymalizacja

- Dodanie progress indicator dla uploadu
- Auto-save draft strategii w localStorage
- Animacje przejść między krokami
- Tooltips z dodatkowymi informacjami
