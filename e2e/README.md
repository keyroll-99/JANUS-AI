# E2E Tests - Janus AI

## Przegląd

Testy E2E (End-to-End) dla aplikacji Janus AI zaimplementowane przy użyciu Playwright. Testy pokrywają kluczowe ścieżki użytkownika (user journeys) zgodnie z planem testów.

## Struktura

```
e2e/
├── fixtures.ts                      # Pomocnicze narzędzia i Page Object Models
├── journey-1-onboarding.spec.ts     # Rejestracja i onboarding nowego użytkownika
├── journey-2-transactions.spec.ts   # Zarządzanie transakcjami
├── journey-3-ai-analysis.spec.ts    # Przepływ analiz AI
└── journey-4-token-refresh.spec.ts  # Autentykacja i odświeżanie tokenów
```

## Wymagania

- Node.js >= 18
- Backend serwer uruchomiony na `http://localhost:5000`
- Frontend serwer uruchomiony na `http://localhost:5173`
- Supabase (local lub cloud) skonfigurowany
- Zmienne środowiskowe ustawione w `.env` (backend i frontend)

## Instalacja

```bash
# Z głównego katalogu projektu
npm install

# Zainstaluj przeglądarki Playwright
npx playwright install chromium
```

## Uruchamianie testów

### Wszystkie testy (automatycznie startuje serwery)

```bash
npm run test:e2e
```

### Testy w trybie UI (interaktywny)

```bash
npm run test:e2e:ui
```

### Testy z widoczną przeglądarką

```bash
npm run test:e2e:headed
```

### Debugowanie testów

```bash
npm run test:e2e:debug
```

### Konkretny plik testowy

```bash
npx playwright test journey-1-onboarding.spec.ts
```

### Z verbose output

```bash
npx playwright test --reporter=list
```

## Fixtures i Page Object Models

### Fixtures

**`test`** - rozszerzony test Playwright z custom fixtures:
- `authenticatedPage` - automatycznie rejestruje użytkownika i loguje przed testem
- `apiUrl` - URL backendu (domyślnie `http://localhost:5000`)

### Page Object Models

- **LoginPage** - strona logowania
- **RegisterPage** - strona rejestracji  
- **DashboardPage** - główny dashboard
- **TransactionsPage** - zarządzanie transakcjami
- **StrategyPage** - tworzenie strategii inwestycyjnej
- **AnalysisPage** - analizy AI
- **OnboardingPage** - proces onboardingu

## Przykład użycia

```typescript
import { test, expect, RegisterPage, DashboardPage } from './fixtures';

test('should register and view dashboard', async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const dashboardPage = new DashboardPage(page);

  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  await registerPage.goto();
  await registerPage.register(testEmail, testPassword);
  await registerPage.waitForNavigation();

  await dashboardPage.goto();
  await dashboardPage.waitForLoad();
  
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## Testy z uwierzytelnieniem

Użyj `authenticatedPage` fixture dla testów wymagających zalogowanego użytkownika:

```typescript
test('authenticated user can view transactions', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/transactions');
  await expect(authenticatedPage.locator('h1')).toContainText('Transakcje');
});
```

## Raporty

### HTML Report

Po uruchomieniu testów, raport HTML jest generowany automatycznie:

```bash
npm run test:e2e:report
```

### Trace Viewer

W przypadku błędów, trace jest zapisywany automatycznie:

```bash
npx playwright show-trace trace.zip
```

## CI/CD

Testy są automatycznie uruchamiane w GitHub Actions przy każdym push/PR. Konfiguracja w `.github/workflows/test.yml`.

## Troubleshooting

### Backend nie odpowiada

Sprawdź czy backend działa:
```bash
curl http://localhost:5000/health
```

### Frontend nie odpowiada

Sprawdź czy frontend działa:
```bash
curl http://localhost:5173
```

### Testy timeout

Zwiększ timeout w `playwright.config.ts`:
```typescript
timeout: 60 * 1000, // 60s
```

### RLS errors w Supabase

Upewnij się że polityki RLS są poprawnie skonfigurowane:
```bash
cd backend
npx supabase db reset --local
```

## Best Practices

1. **Unikalne dane testowe** - używaj `Date.now()` dla unikalnych emaili
2. **Explicit waits** - zawsze czekaj na ładowanie (`waitForLoadState`, `waitForSelector`)
3. **Page Object Pattern** - używaj POM dla lepszej czytelności
4. **Test steps** - grupuj akcje w `test.step()` dla lepszych raportów
5. **Cleanup** - fixture `authenticatedPage` automatycznie tworzy nowego użytkownika dla każdego testu

## Zgodność z Test Plan

Testy są zgodne z dokumentem `test-plan.md`:

- ✅ Journey 1: Complete Onboarding (TC-AUTH-001, TC-AUTH-002)
- ✅ Journey 2: Transaction Management (TC-TRANS-*)
- ✅ Journey 3: AI Analysis Flow (TC-AI-*)
- ✅ Journey 4: Token Refresh (TC-AUTH-004)

## Następne kroki

- [ ] Dodać testy importu XTB (wymaga fixtures z plikami Excel)
- [ ] Dodać testy rate limiting (TC-RATE-*)
- [ ] Dodać testy security (TC-SEC-*)
- [ ] Dodać visual regression testing
