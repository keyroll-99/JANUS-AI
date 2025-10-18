# Janus Frontend

Frontend aplikacji Janus - asystent zarządzania portfelem inwestycyjnym.

## Technologie

- **React 18** - biblioteka UI z funkcjonalnymi komponentami i hookami
- **TypeScript** - statyczne typowanie
- **Vite** - szybki bundler i dev server
- **React Router v6** - routing z lazy loading
- **Native Fetch API** - HTTP requests z custom hooks
- **SCSS** - preprocesator CSS
- **Jest** - testowanie jednostkowe
- **Testing Library** - testowanie komponentów React
- **ESLint + Prettier** - linting i formatowanie kodu

## Struktura projektu

```
frontend/
├── src/
│   ├── components/          # Komponenty React
│   │   ├── layouts/         # Layout components (Header, RootLayout)
│   │   └── shared/          # Współdzielone komponenty (ErrorBoundary)
│   ├── pages/               # Komponenty stron (lazy loaded)
│   │   ├── auth/            # Strony autoryzacji
│   │   └── analysis/        # Strony analiz
│   ├── features/            # Feature-based modules (future)
│   ├── shared/              # Współdzielone zasoby
│   │   ├── api/             # Fetch API client wrapper
│   │   ├── config/          # Konfiguracja aplikacji
│   │   ├── hooks/           # Custom hooks (useFetch, useMutation)
│   │   ├── styles/          # Globalne style SCSS
│   │   └── types/           # Typy TypeScript
│   ├── App.tsx              # Główny komponent z routingiem
│   ├── main.tsx             # Entry point aplikacji
│   └── setupTests.ts        # Konfiguracja testów
├── public/                  # Statyczne pliki
├── .env.example             # Przykładowy plik środowiskowy
├── vite.config.ts           # Konfiguracja Vite
├── tsconfig.json            # Konfiguracja TypeScript
├── jest.config.js           # Konfiguracja Jest
├── eslint.config.js         # Konfiguracja ESLint
└── .prettierrc              # Konfiguracja Prettier
```

## Instalacja

```bash
# Instalacja zależności
npm install

# Skopiuj plik środowiskowy
cp .env.example .env
```

## Dostępne skrypty

```bash
# Uruchomienie dev servera (port 3000)
npm run dev

# Build produkcyjny
npm run build

# Preview buildu produkcyjnego
npm run preview

# Testy jednostkowe
npm test

# Testy w trybie watch
npm run test:watch

# Testy z pokryciem kodu
npm run test:coverage

# Linting
npm run lint

# Automatyczne poprawianie błędów lintingu
npm run lint:fix

# Formatowanie kodu
npm run format

# Sprawdzenie formatowania
npm run format:check
```

## Zmienne środowiskowe

Utwórz plik `.env` na podstawie `.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_PROVIDER=claude
```

## Routing

Aplikacja używa React Router v6 z `createBrowserRouter` i lazy loading:

- `/` - Dashboard
- `/login` - Logowanie
- `/register` - Rejestracja
- `/onboarding` - Onboarding dla nowych użytkowników
- `/transactions` - Lista transakcji
- `/strategy` - Definicja strategii
- `/analysis` - Historia analiz
- `/analysis/:id` - Szczegóły analizy

## Data Fetching

Aplikacja używa natywnego Fetch API z custom hooks zamiast React Query dla prostoty MVP:

### API Client

```typescript
import { api } from '@/shared/api/client';

// GET request
const users = await api.get<User[]>('/users');

// POST request
const newUser = await api.post<User>('/users', { name: 'John', email: 'john@example.com' });

// PUT request
await api.put<User>(`/users/${id}`, userData);

// DELETE request
await api.delete(`/users/${id}`);
```

### Custom Hooks

```typescript
import { useFetch, useMutation } from '@/shared/hooks';

// Fetch data with loading and error states
function UsersList() {
  const { data, loading, error, refetch } = useFetch(
    () => api.get<User[]>('/users'),
    [], // dependencies
    { onSuccess: (data) => console.log('Loaded:', data) }
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data?.map(user => <div key={user.id}>{user.name}</div>)}</div>;
}

// Mutations (POST, PUT, DELETE)
function CreateUser() {
  const { mutate, loading, error } = useMutation(
    (userData: CreateUserDto) => api.post('/users', userData),
    { 
      onSuccess: () => {
        alert('User created!');
        refetchUsers(); // Refetch list
      }
    }
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate({ name: 'John', email: 'john@example.com' });
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**Dlaczego bez React Query?**
- MVP wymaga tylko prostych operacji CRUD
- Brak potrzeby zaawansowanego cache'owania
- Szybsze dostarczenie MVP
- Możliwość dodania React Query w przyszłości gdy będzie potrzeba

## Stylowanie

Projekt używa SCSS z następującą strukturą:

- `_variables.scss` - zmienne (kolory, typografia, spacing)
- `_reset.scss` - reset stylów CSS
- `_typography.scss` - style typograficzne
- `index.scss` - główny plik stylów

## Testing

Framework testowy oparty na Jest i Testing Library:

- Testy jednostkowe dla logiki biznesowej
- Testy komponentów z Testing Library
- Cel pokrycia kodu: 70% (branches, functions, lines, statements)

## Lint i formatowanie

- **ESLint**: sprawdzanie jakości kodu zgodnie z najlepszymi praktykami React i TypeScript
- **Prettier**: automatyczne formatowanie kodu
- Integracja ESLint + Prettier zapobiega konfliktom

## Najlepsze praktyki

### React

- Funkcjonalne komponenty z hookami
- `React.memo()` dla optymalizacji
- `React.lazy()` i `Suspense` dla code-splitting
- `useCallback` i `useMemo` dla optymalizacji wydajności

### TypeScript

- Strict mode włączony
- Path aliases dla czystszych importów (`@/`, `@/components`, etc.)
- Typy dla wszystkich komponentów i funkcji

### Architektura

- Domain-driven structure w folderze `features/` (future)
- Współdzielone zasoby w `shared/`
- Lazy loading dla stron
- Centralizacja klienta API z interceptorami

## Rozwój

1. Stwórz feature branch: `git checkout -b feature/nazwa-funkcji`
2. Commituj zmiany: `git commit -m "feat: opis zmiany"`
3. Upewnij się, że testy przechodzą: `npm test`
4. Sprawdź linting: `npm run lint`
5. Sformatuj kod: `npm run format`
6. Push i stwórz Pull Request

## Konwencje commitów

Projekt używa conventional commits:

- `feat:` - nowa funkcjonalność
- `fix:` - naprawa błędu
- `docs:` - zmiany w dokumentacji
- `style:` - formatowanie, brakujące średniki, etc.
- `refactor:` - refaktoryzacja kodu
- `test:` - dodanie lub poprawienie testów
- `chore:` - zmiany w buildu, zależnościach, etc.
