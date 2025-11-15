# E2E Tests - Quick Start Guide

## Prerequisites

Przed uruchomieniem testów E2E upewnij się, że:

1. **Backend i Frontend działają** - testy wymagają działających serwerów
2. **Baza danych jest skonfigurowana** - Supabase local lub remote
3. **Zmienne środowiskowe są ustawione** - `.env` w backend i frontend

## Setup (Jednorazowo)

```bash
# 1. Zainstaluj zależności
npm install
npx playwright install chromium

# 2. Skonfiguruj backend
cd backend
cp .env.example .env
# Edytuj .env i ustaw SUPABASE_URL, SUPABASE_ANON_KEY, etc.

# 3. Skonfiguruj frontend
cd ../frontend
cp .env.example .env
# Edytuj .env i ustaw VITE_API_URL
```

## Uruchamianie testów

### Opcja 1: Ręczne uruchomienie serwerów (ZALECANE dla developerów)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev

# Terminal 3: Testy E2E
npm run test:e2e
```

### Opcja 2: Szybkie komendy

```bash
# Uruchom backend w osobnym terminalu
npm run dev:backend

# Uruchom frontend w osobnym terminalu
npm run dev:frontend

# Uruchom testy
npm run test:e2e
```

### Opcja 3: UI Mode (interaktywny, najlepszy do developmentu)

```bash
# Upewnij się, że backend i frontend działają, potem:
npm run test:e2e:ui
```

## Tryby uruchamiania testów

```bash
# Standardowy run (headless)
npm run test:e2e

# UI mode - interaktywny z debuggerem
npm run test:e2e:ui

# Headed - widoczna przeglądarka
npm run test:e2e:headed

# Debug - krok po kroku
npm run test:e2e:debug

# Pojedynczy test
npx playwright test journey-1-onboarding.spec.ts

# Pojedynczy test w trybie debug
npx playwright test journey-1-onboarding.spec.ts --debug
```

## Sprawdzanie czy serwery działają

```bash
# Backend (powinno zwrócić JSON z status: "ok")
curl http://localhost:5000/health

# Frontend (powinno zwrócić HTML)
curl http://localhost:5173
```

## Troubleshooting

### Problem: "Error: connect ECONNREFUSED 127.0.0.1:5000"

**Rozwiązanie:** Backend nie działa. Uruchom:
```bash
cd backend
npm run dev
```

### Problem: "Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173"

**Rozwiązanie:** Frontend nie działa. Uruchom:
```bash
cd frontend
npm run dev
```

### Problem: "Cannot find name 'process'"

**Rozwiązanie:** Zainstaluj typy Node:
```bash
npm install --save-dev @types/node
```

### Problem: Testy wiszą i nic się nie dzieje

**Przyczyna:** Playwright próbuje uruchomić serwery automatycznie, ale nie ma `.env` w backendzie.

**Rozwiązanie:** 
1. Uruchom backend i frontend ręcznie (patrz wyżej)
2. Potem uruchom testy

### Problem: "Registration failed" w testach

**Przyczyna:** Backend nie może połączyć się z Supabase.

**Rozwiązanie:** Sprawdź `.env` w backendzie:
```bash
cd backend
cat .env | grep SUPABASE
```

## Struktura testów

```
e2e/
├── fixtures.ts                      # Page Objects i fixtures
├── journey-1-onboarding.spec.ts    # 3 testy - rejestracja, walidacja
├── journey-2-transactions.spec.ts   # 2 testy - dostęp do transakcji
├── journey-3-ai-analysis.spec.ts   # 2 testy - dostęp do analiz
├── journey-4-token-refresh.spec.ts # 1 test - logowanie
└── fixtures/                        # Pliki testowe (XTB, mock data)
```

## Wyniki testów

```bash
# Po testach, zobacz raport HTML
npm run test:e2e:report

# Logi testów są w:
playwright-report/
test-results/
```

## Tips dla developerów

1. **Użyj UI mode** podczas pisania testów: `npm run test:e2e:ui`
2. **Debuguj pojedyncze testy**: `npx playwright test journey-1 --debug`
3. **Obejrzyj trace** po błędzie: `npx playwright show-trace trace.zip`
4. **Unikaj timeout'ów**: Upewnij się że backend odpowiada szybko
5. **Każdy test tworzy nowego użytkownika**: Nie musisz czyścić bazy

## CI/CD

W CI (GitHub Actions) testy automatycznie:
- Uruchamiają backend i frontend
- Wykonują wszystkie testy
- Generują raport HTML
- Uploadują trace przy błędach

Lokalnie wystarczy uruchomić serwery ręcznie.
