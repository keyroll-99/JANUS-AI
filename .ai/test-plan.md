# Plan Testów - Janus AI

**Wersja dokumentu:** 1.0  
**Data:** 15 listopada 2025  
**Projekt:** Janus AI - Inteligentny Asystent Portfela Inwestycyjnego  
**Autor:** Zespół QA

---

## 1. Wprowadzenie i cele

### 1.1 Cel dokumentu

Plan testów definiuje strategię, zakres, harmonogram i zasoby niezbędne do zapewnienia jakości aplikacji Janus AI - platformy zarządzania portfelem inwestycyjnym z integracją AI.

### 1.2 Cele testowania

1. **Bezpieczeństwo**: Zapewnienie ochrony danych finansowych użytkowników zgodnie z GDPR
2. **Dokładność finansowa**: Weryfikacja poprawności kalkulacji wartości portfela, zysków/strat i dywersyfikacji
3. **Niezawodność**: Stabilne działanie importu transakcji z XTB oraz integracji z AI (Claude/Gemini)
4. **Użyteczność**: Intuicyjny UX dla zarządzania transakcjami, strategiami i analizami AI
5. **Wydajność**: Optymalne czasy odpowiedzi dla użytkowników z dużymi portfelami (1000+ transakcji)
6. **Compliance**: Weryfikacja rate limiting (3 analizy/dzień) i zarządzania kosztami API

### 1.3 Zakres zastosowania

Dokument dotyczy testowania wersji MVP aplikacji Janus AI obejmującej:
- Backend (Express.js + PostgreSQL/Supabase)
- Frontend (React 19 + Ant Design)
- Integrację z zewnętrznymi API (Claude, Gemini, Alpha Vantage, Stooq)

---

## 2. Zakres testowania

### 2.1 Moduły w zakresie testów

#### **Backend Modules**

| Moduł | Komponent | Priorytet |
|-------|-----------|-----------|
| **Autentykacja** | Rejestracja, Login, JWT Tokens, Refresh Flow | 🔴 Krytyczny |
| **Transakcje** | CRUD, XTB Parser, Paginacja, Filtrowanie | 🔴 Krytyczny |
| **Portfel** | Agregacja, Kalkulacje, Historia, Cache cen | 🔴 Krytyczny |
| **Analizy AI** | Claude/Gemini Integration, Output Parsing, Prompt Builder | 🔴 Krytyczny |
| **Strategie** | CRUD strategii inwestycyjnych | 🟠 Wysoki |
| **Rate Limiting** | DB-based (3/day), Express limiter | 🟠 Wysoki |
| **Middleware** | requireAuth, errorHandler, validateDto | 🟠 Wysoki |

#### **Frontend Modules**

| Moduł | Komponent | Priorytet |
|-------|-----------|-----------|
| **Auth Pages** | Login, Register Forms | 🔴 Krytyczny |
| **Dashboard** | Portfolio Summary, Charts, Diversification | 🔴 Krytyczny |
| **Transactions** | List, Create/Edit Modal, Import | 🔴 Krytyczny |
| **Analyses** | History, Details, Recommendations | 🟠 Wysoki |
| **Strategy** | Form, CRUD Operations | 🟠 Wysoki |
| **Navigation** | Routing, Protected Routes, Error Boundaries | 🟡 Średni |
| **Responsiveness** | Mobile/Tablet Views | 🟢 Niski |

#### **Database**

| Obszar | Zakres | Priorytet |
|--------|--------|-----------|
| **Row Level Security** | Polityki RLS dla wszystkich tabel użytkowników | 🔴 Krytyczny |
| **Data Integrity** | Foreign keys, Constraints, Triggers | 🔴 Krytyczny |
| **Migracje** | Testowanie na staging, Rollback scripts | 🟠 Wysoki |
| **Performance** | Indeksy, Query optimization | 🟡 Średni |

### 2.2 Wyłączenia z zakresu

- Integracja z brokerami (XTB/Freedom API) - zaplanowane na przyszłość
- WebSockets dla real-time updates - nie w MVP
- System powiadomień email/push
- Integracja z Stripe (płatności)
- Internationalization (i18n) - MVP tylko PL
- Testy na przeglądarkach starszych niż 2 lata

---

## 3. Typy testów

### 3.1 Testy jednostkowe (Unit Tests)

**Narzędzia**: Jest 30, ts-jest  
**Pokrycie**: Minimum 80% coverage dla critical paths  
**Odpowiedzialny**: Backend/Frontend Developers

#### **Backend Unit Tests**

```typescript
// Przykładowe obszary:
- Services: AuthService, TransactionService, AnalysisService, PortfolioService
- Parsers: XtbParser (mapowanie typów, ekstrakcja danych)
- Validators: Zod schemas
- Utils: Kalkulacje finansowe, Date formatting
- Middleware: requireAuth, validateDto
- Cache: InMemoryCache (TTL, cleanup, race conditions)
```

**Priorytetowe scenariusze:**
- ✅ XTB Parser: wszystkie typy transakcji (buy, sell, dividend, deposit, commission)
- ✅ Portfolio calculations: agregacja wartości, średnie ceny, P/L
- ✅ Rate limiting: sprawdzanie limitów, reset logic
- ✅ JWT validation: token expiration, malformed tokens
- ✅ Zod validation: boundary testing, invalid inputs

#### **Frontend Unit Tests**

```typescript
// Przykładowe obszary:
- Components: Forms, Tables, Charts
- Hooks: useAuth, useApi custom hooks
- Utils: Data formatting, Date utilities
- Context: AuthContext state management
- API Client: fetch wrapper, token injection, error handling
```

**Priorytetowe scenariusze:**
- ✅ AuthContext: login/logout flow, token refresh
- ✅ Form validation: client-side Zod schemas
- ✅ Error boundaries: error catching and display
- ✅ API client: 401 handling, retry logic

### 3.2 Testy integracyjne (Integration Tests)

**Narzędzia**: Jest + Supertest + Supabase Local  
**Środowisko**: Izolowana test database  
**Odpowiedzialny**: QA Engineers

#### **Backend Integration Tests**

**Obszary:**
1. **API Endpoints** (Supertest)
   - Auth: `/api/v1/auth/*` (register, login, logout, refresh)
   - Transactions: `/api/v1/transactions/*` (CRUD + import)
   - Portfolio: `/api/v1/dashboard`
   - Analyses: `/api/v1/analyses/*`
   - Strategies: `/api/v1/strategy/*`

2. **Database Integration**
   - Supabase RLS policies (users see only their data)
   - Transaction rollbacks on errors
   - Cascade deletes
   - Triggers (updated_at)

3. **External APIs**
   - Claude/Gemini mock responses (contract testing)
   - Alpha Vantage/Stooq fallback scenarios
   - Rate limiting errors

**Przykładowy test flow:**
```
1. Register user → Verify JWT tokens returned
2. Login → Verify access token works
3. Create transaction → Verify saved in DB with correct user_id
4. Get transactions → Verify only user's data returned (RLS)
5. Delete transaction → Verify cascade to related records
```

### 3.3 Testy E2E (End-to-End Tests)

**Narzędzia**: Playwright  
**Środowisko**: Staging environment  
**Przeglądarka**: Chromium (Desktop + Mobile viewport)  
**Odpowiedzialny**: QA Engineers

#### **Krytyczne User Journey**

**Journey 1: Nowy użytkownik - Complete Onboarding**
```
1. Register → Email + Password validation
2. Login → Redirect to Onboarding
3. Create Strategy → Save investment goals
4. Import XTB file → Upload Excel, verify transactions list
5. View Dashboard → Verify portfolio value, charts render
6. Initiate AI Analysis → Wait for processing, view recommendations
```

**Journey 2: Zarządzanie transakcjami**
```
1. Login → Dashboard
2. Navigate to Transactions
3. Filter by ticker/account type
4. Edit transaction → Update quantity/price
5. Delete transaction → Confirm deletion
6. Verify Dashboard updated (portfolio value recalculated)
```

**Journey 3: AI Analysis Flow**
```
1. Login → Navigate to Analysis page
2. Click "New Analysis" → Rate limit check (3/day)
3. AI processing → Loading state display
4. View Results → Recommendations (buy/sell/hold)
5. View Analysis History → Previous analyses list
```

**Journey 4: Token Refresh**
```
1. Login → Store access token
2. Wait for token expiration (mock short TTL)
3. Make API call → Auto refresh in background
4. Continue using app → Seamless experience
```

### 3.4 Testy bezpieczeństwa (Security Tests)

**Narzędzia**: OWASP ZAP, Manual Testing, Custom Scripts  
**Odpowiedzialny**: Security Engineer + QA Lead

#### **Scenariusze testowe:**

1. **Authentication & Authorization**
   - ❌ Access protected endpoints without token → 401
   - ❌ Access other user's data with valid token → 403
   - ❌ Use expired/invalid JWT → 401
   - ✅ Refresh token rotation (one-time use)
   - ❌ Session fixation attacks
   - ❌ Brute force login (rate limiter)

2. **Injection Attacks**
   - ❌ SQL injection via transaction filters
   - ❌ XSS via transaction notes/strategy description
   - ❌ NoSQL injection via JSON payloads

3. **RLS Policy Testing**
   - ✅ User A cannot SELECT User B's transactions
   - ✅ User A cannot UPDATE User B's strategy
   - ✅ User A cannot DELETE User B's analyses
   - ❌ Admin bypass attempts

4. **File Upload Security**
   - ❌ Upload non-Excel file (e.g., .exe, .sh)
   - ❌ Upload file > 5MB (Multer limit)
   - ❌ Excel with malicious macros
   - ❌ Path traversal via filename

5. **CORS & CSP**
   - ❌ Cross-origin requests from unauthorized domains
   - ✅ CORS headers correctly set
   - ✅ Helmet security headers present

### 3.5 Testy wydajnościowe (Performance Tests)

**Narzędzia**: k6, Lighthouse (Frontend)  
**Odpowiedzialny**: Performance Engineer

#### **Backend Load Testing**

**Scenariusze:**
1. **Dashboard endpoint** (`GET /api/v1/dashboard`)
   - 100 concurrent users
   - Target: <500ms response time (p95)
   - Rate: 60 req/min per user (limit)

2. **Transactions list** (`GET /api/v1/transactions`)
   - User with 10,000 transactions
   - Pagination: 50 items/page
   - Target: <300ms response time

3. **Import XTB file**
   - File with 1,000 transactions (~500KB)
   - Target: <10s processing time
   - Memory: No leaks, stable heap

4. **AI Analysis**
   - Concurrent analysis requests (rate limit test)
   - Target: Prevent >3 analyses/day/user
   - Database transaction locking

#### **Frontend Performance**

**Metrics (Lighthouse):**
- First Contentful Paint: <1.8s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.8s
- Cumulative Layout Shift: <0.1
- Total Bundle Size: <1MB (Ant Design optimized)

**Scenariusze:**
1. Dashboard load with 100 transactions
2. Charts rendering (30-day history)
3. Transactions table pagination (1000+ rows)
4. Mobile viewport performance

### 3.6 Testy akceptacyjne użytkownika (UAT)

**Uczestnicy**: 5-10 beta testerów (inwestorzy indywidualni)  
**Środowisko**: Staging  
**Okres**: 1-2 tygodnie przed release

**Scenariusze:**
1. Realistyczne portfolio (mieszanka ETF, akcji, obligacji)
2. Import rzeczywistych plików XTB
3. Ocena użyteczności AI recommendations
4. Feedback na UX/UI (Ant Design components)

### 3.7 Testy regresji (Regression Tests)

**Trigger**: Każdy merge do `master` (GitHub Actions)  
**Zakres**: Pełna suite unit + integration + krytyczne E2E  
**Czas wykonania**: <15 minut (CI)

---

## 4. Scenariusze testowe

### 4.1 Bezpieczeństwo Autentykacji (🔴 Krytyczny)

#### **TC-AUTH-001: Rejestracja nowego użytkownika**

| ID | TC-AUTH-001 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Auth |
| **Prekondycje** | Aplikacja uruchomiona, email nie istnieje w bazie |
| **Kroki** | 1. POST `/api/v1/auth/register` z `{email, password}`<br>2. Sprawdź response status<br>3. Weryfikuj tokeny w response<br>4. Sprawdź user w DB |
| **Oczekiwany rezultat** | - Status 201<br>- accessToken i refreshToken zwrócone<br>- refreshToken w httpOnly cookie<br>- User zapisany w `auth.users` |
| **Dane testowe** | Email: `test@example.com`, Password: `SecurePass123!` |

#### **TC-AUTH-002: Login z poprawnymi danymi**

| ID | TC-AUTH-002 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Auth |
| **Prekondycje** | User zarejestrowany |
| **Kroki** | 1. POST `/api/v1/auth/login` z `{email, password}`<br>2. Sprawdź tokens<br>3. Użyj accessToken do protected endpoint |
| **Oczekiwany rezultat** | - Status 200<br>- Valid JWT tokens<br>- Protected endpoint returns 200 |

#### **TC-AUTH-003: Login z błędnym hasłem**

| ID | TC-AUTH-003 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Auth |
| **Prekondycje** | User zarejestrowany |
| **Kroki** | 1. POST `/api/v1/auth/login` z błędnym hasłem<br>2. Sprawdź response |
| **Oczekiwany rezultat** | - Status 401<br>- Error message: "Invalid credentials" |

#### **TC-AUTH-004: Refresh token flow**

| ID | TC-AUTH-004 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Auth |
| **Prekondycje** | User zalogowany, refreshToken w cookie |
| **Kroki** | 1. POST `/api/v1/auth/refresh` (cookie auto-sent)<br>2. Sprawdź nowy accessToken<br>3. Użyj nowego tokena |
| **Oczekiwany rezultat** | - Status 200<br>- New accessToken<br>- Old accessToken invalidated |

#### **TC-AUTH-005: Access bez tokena**

| ID | TC-AUTH-005 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Auth |
| **Prekondycje** | Brak tokena w headers |
| **Kroki** | 1. GET `/api/v1/transactions` bez Authorization header |
| **Oczekiwany rezultat** | - Status 401<br>- Error: "Access token required" |

#### **TC-AUTH-006: Rate limiting - brute force protection**

| ID | TC-AUTH-006 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Auth + Rate Limiting |
| **Prekondycje** | Limit: 10 req/15min |
| **Kroki** | 1. Send 11 login requests w ciągu 1 minuty<br>2. Sprawdź 11. request |
| **Oczekiwany rezultat** | - Pierwsze 10: normalnie<br>- 11. request: Status 429 "Too Many Requests" |

### 4.2 Import transakcji XTB (🔴 Krytyczny)

#### **TC-TRANS-001: Import poprawnego pliku XTB**

| ID | TC-TRANS-001 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Transactions - XTB Parser |
| **Prekondycje** | User zalogowany, plik Excel z XTB (100 transakcji) |
| **Kroki** | 1. POST `/api/v1/transactions/import` z plikiem<br>2. Sprawdź response<br>3. Weryfikuj transakcje w DB |
| **Oczekiwany rezultat** | - Status 201<br>- `{imported: 100, failed: 0, duplicates: 0}`<br>- Wszystkie transakcje w `transactions` table<br>- Poprawne mapowanie typów (buy/sell/dividend) |
| **Dane testowe** | Plik: `test-data/xtb-sample-100.xlsx` |

#### **TC-TRANS-002: Import z duplikatami**

| ID | TC-TRANS-002 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Transactions - XTB Parser |
| **Prekondycje** | 50 transakcji już w DB |
| **Kroki** | 1. Import pliku z 100 transakcjami (50 duplikatów) |
| **Oczekiwany rezultat** | - `{imported: 50, failed: 0, duplicates: 50}`<br>- Duplikaty nie zapisane ponownie |

#### **TC-TRANS-003: Import uszkodzonego pliku**

| ID | TC-TRANS-003 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Transactions - XTB Parser |
| **Prekondycje** | Plik Excel z brakującymi kolumnami |
| **Kroki** | 1. Upload corrupted file<br>2. Sprawdź error handling |
| **Oczekiwany rezultat** | - Status 400<br>- Error: "Invalid file format"<br>- Żadne transakcje nie zapisane (rollback) |

#### **TC-TRANS-004: Import dużego pliku (1000+ transakcji)**

| ID | TC-TRANS-004 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny (Performance) |
| **Moduł** | Transactions - XTB Parser |
| **Prekondycje** | Plik 1000 transakcji (~500KB) |
| **Kroki** | 1. Upload file<br>2. Mierz czas przetwarzania<br>3. Monitor memory usage |
| **Oczekiwany rezultat** | - Processing time: <10s<br>- Memory: No leaks<br>- Server stable |

#### **TC-TRANS-005: Upload niewłaściwego typu pliku**

| ID | TC-TRANS-005 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki (Security) |
| **Moduł** | Transactions - File Upload |
| **Prekondycje** | Plik .exe lub .txt |
| **Kroki** | 1. Upload non-Excel file |
| **Oczekiwany rezultat** | - Status 400<br>- Error: "Only Excel files allowed" |

### 4.3 Kalkulacje finansowe (🔴 Krytyczny)

#### **TC-CALC-001: Wartość portfela - agregacja**

| ID | TC-CALC-001 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Portfolio Service |
| **Prekondycje** | User z transakcjami:<br>- 10 AAPL @ $150 (buy)<br>- 5 GOOGL @ $2800 (buy) |
| **Kroki** | 1. GET `/api/v1/dashboard`<br>2. Sprawdź `totalValue` |
| **Oczekiwany rezultat** | - Current prices fetched (Alpha Vantage)<br>- `totalValue` = (10 × current_AAPL) + (5 × current_GOOGL) |
| **Dane testowe** | Mock API: AAPL=$155, GOOGL=$2850 → Expected: $15,750 |

#### **TC-CALC-002: Średnia cena zakupu**

| ID | TC-CALC-002 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Portfolio Service |
| **Prekondycje** | Transakcje AAPL:<br>- Buy 10 @ $150<br>- Buy 5 @ $160 |
| **Kroki** | 1. Calculate avg price<br>2. Verify in dashboard |
| **Oczekiwany rezultat** | - avgPrice = ((10×150) + (5×160)) / 15 = $153.33 |

#### **TC-CALC-003: Profit/Loss calculation**

| ID | TC-CALC-003 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Portfolio Service |
| **Prekondycje** | AAPL: bought 10 @ $150, current price $155 |
| **Kroki** | 1. Calculate P/L |
| **Oczekiwany rezultat** | - P/L = (155 - 150) × 10 = +$50<br>- P/L% = 3.33% |

#### **TC-CALC-004: Dywersyfikacja procentowa**

| ID | TC-CALC-004 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Portfolio Service |
| **Prekondycje** | Portfolio:<br>- AAPL: $10,000<br>- GOOGL: $5,000<br>- TSLA: $5,000 |
| **Kroki** | 1. GET diversification data |
| **Oczekiwany rezultat** | - AAPL: 50%<br>- GOOGL: 25%<br>- TSLA: 25% |

### 4.4 AI Analiza - Output Parsing (🔴 Krytyczny)

#### **TC-AI-001: Successful AI analysis**

| ID | TC-AI-001 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | AI Analysis |
| **Prekondycje** | User z strategią i transakcjami, rate limit OK (0/3 today) |
| **Kroki** | 1. POST `/api/v1/analyses` → initiate<br>2. Mock Claude response (valid JSON)<br>3. Check saved analysis in DB |
| **Oczekiwany rezultat** | - Status 201<br>- Analysis saved with status "completed"<br>- Recommendations parsed and saved<br>- Rate limit incremented (1/3) |
| **Dane testowe** | Mock response: `recommendations-valid.json` |

#### **TC-AI-002: Malformed AI response**

| ID | TC-AI-002 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | AI Analysis - Error Handling |
| **Prekondycje** | User initiates analysis |
| **Kroki** | 1. Mock AI returns invalid JSON<br>2. Check error handling |
| **Oczekiwany rezultat** | - Analysis status: "failed"<br>- Error logged<br>- User notified: "Analysis failed, try again"<br>- Rate limit NOT incremented (retry possible) |

#### **TC-AI-003: AI timeout**

| ID | TC-AI-003 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | AI Analysis |
| **Prekondycje** | User initiates analysis |
| **Kroki** | 1. Mock AI timeout (60s)<br>2. Check handling |
| **Oczekiwany rezultat** | - Retry attempt (exponential backoff)<br>- If all retries fail: status "failed"<br>- Rate limit NOT incremented |

#### **TC-AI-004: AI rate limit exceeded (Claude API)**

| ID | TC-AI-004 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki |
| **Moduł** | AI Analysis |
| **Prekondycje** | Claude returns 429 |
| **Kroki** | 1. Mock Claude 429 response<br>2. Check fallback |
| **Oczekiwany rezultat** | - Fallback to Gemini provider<br>- OR error message: "AI service unavailable" |

### 4.5 Rate Limiting (🟠 Wysoki)

#### **TC-RATE-001: Database rate limiting - 3 analyses/day**

| ID | TC-RATE-001 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki |
| **Moduł** | AI Analysis + Rate Limiting |
| **Prekondycje** | User: 0 analyses today |
| **Kroki** | 1. Initiate 3 analyses (successful)<br>2. Attempt 4th analysis |
| **Oczekiwany rezultat** | - First 3: Success<br>- 4th: Status 429 "Daily limit exceeded (3/3)" |

#### **TC-RATE-002: Concurrent rate limit requests**

| ID | TC-RATE-002 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki (Race Condition) |
| **Moduł** | Rate Limiting |
| **Prekondycje** | User: 2/3 analyses today |
| **Kroki** | 1. Send 2 concurrent analysis requests<br>2. Check DB transactions |
| **Oczekiwany rezultat** | - Only 1 should succeed (3/3)<br>- Other fails with 429<br>- No race condition (DB locking) |

#### **TC-RATE-003: Daily reset logic**

| ID | TC-RATE-003 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki |
| **Moduł** | Rate Limiting |
| **Prekondycje** | User: 3/3 analyses yesterday |
| **Kroki** | 1. Mock new day (date change)<br>2. Attempt analysis |
| **Oczekiwany rezultat** | - Counter reset to 0/3<br>- Analysis succeeds |

#### **TC-RATE-004: Express rate limiter - Dashboard**

| ID | TC-RATE-004 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki |
| **Moduł** | Rate Limiting - Express |
| **Prekondycje** | Dashboard limit: 60 req/min |
| **Kroki** | 1. Send 61 dashboard requests w ciągu 1 min |
| **Oczekiwany rezultat** | - First 60: Success<br>- 61st: 429 with retry-after header |

### 4.6 Cache cen rynkowych (🟠 Wysoki)

#### **TC-CACHE-001: TTL expiration**

| ID | TC-CACHE-001 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki |
| **Moduł** | Portfolio - Price Cache |
| **Prekondycje** | Cache TTL: 5 min |
| **Kroki** | 1. Fetch AAPL price (API call)<br>2. Fetch again immediately (cache hit)<br>3. Wait 6 min<br>4. Fetch again (cache miss) |
| **Oczekiwany rezultat** | - 1st call: API hit, cached<br>- 2nd call: Cache hit (no API)<br>- 3rd call: API hit (TTL expired) |
| **Tooling** | Jest fake timers |

#### **TC-CACHE-002: Concurrent request deduplication**

| ID | TC-CACHE-002 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki |
| **Moduł** | Portfolio - Price Cache |
| **Prekondycje** | 10 concurrent dashboard requests for same ticker |
| **Kroki** | 1. Send 10 concurrent requests<br>2. Monitor API calls |
| **Oczekiwany rezultat** | - Only 1 API call made<br>- All 10 requests get same result<br>- In-flight request handling |

#### **TC-CACHE-003: External API failure fallback**

| ID | TC-CACHE-003 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki |
| **Moduł** | Portfolio - Price Cache |
| **Prekondycje** | Alpha Vantage down |
| **Kroki** | 1. Mock API failure<br>2. Check fallback to Stooq<br>3. If both fail, check graceful degradation |
| **Oczekiwany rezultat** | - Try Alpha Vantage → fail<br>- Fallback to Stooq → success<br>- If both fail: Show last known price (from cache) |

### 4.7 RLS Security (🔴 Krytyczny)

#### **TC-SEC-001: User A cannot access User B's transactions**

| ID | TC-SEC-001 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Database - RLS |
| **Prekondycje** | User A logged in, User B has 10 transactions |
| **Kroki** | 1. User A: GET `/api/v1/transactions`<br>2. Check returned data |
| **Oczekiwany rezultat** | - Only User A's transactions returned<br>- User B's data not visible |

#### **TC-SEC-002: Direct DB query RLS test**

| ID | TC-SEC-002 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Database - RLS |
| **Prekondycje** | Test database with RLS enabled |
| **Kroki** | 1. Execute SQL: `SELECT * FROM transactions WHERE user_id != <current_user>`<br>2. Check result |
| **Oczekiwany rezultat** | - 0 rows returned<br>- RLS policy blocks access |

#### **TC-SEC-003: User cannot UPDATE other user's strategy**

| ID | TC-SEC-003 |
|----|-------------|
| **Priorytet** | 🔴 Krytyczny |
| **Moduł** | Database - RLS |
| **Prekondycje** | User A logged in, User B has strategy |
| **Kroki** | 1. User A attempts: PUT `/api/v1/strategy` with User B's strategy_id |
| **Oczekiwany rezultat** | - Status 404 or 403<br>- Strategy not updated |

### 4.8 Frontend - Token Refresh (🟠 Wysoki)

#### **TC-FE-001: Automatic token refresh on 401**

| ID | TC-FE-001 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki |
| **Moduł** | Frontend - API Client |
| **Prekondycje** | User logged in, access token expired |
| **Kroki** | 1. Make API call (e.g., GET transactions)<br>2. Server returns 401<br>3. Check automatic refresh<br>4. Retry original request |
| **Oczekiwany rezultat** | - apiClient detects 401<br>- Calls `/auth/refresh`<br>- Gets new token<br>- Retries original request → Success<br>- User unaware of refresh |

#### **TC-FE-002: Refresh token expired - logout**

| ID | TC-FE-002 |
|----|-------------|
| **Priorytet** | 🟠 Wysoki |
| **Moduł** | Frontend - Auth Flow |
| **Prekondycje** | Refresh token expired |
| **Kroki** | 1. API call with expired access token<br>2. Refresh attempt fails (401) |
| **Oczekiwany rezultat** | - User logged out<br>- Redirected to /login<br>- Clear localStorage |

### 4.9 Performance - Dashboard (🟡 Średni)

#### **TC-PERF-001: Dashboard load time - 100 transactions**

| ID | TC-PERF-001 |
|----|-------------|
| **Priorytet** | 🟡 Średni |
| **Moduł** | Frontend - Dashboard |
| **Prekondycje** | User with 100 transactions |
| **Kroki** | 1. Navigate to /dashboard<br>2. Measure Lighthouse metrics |
| **Oczekiwany rezultat** | - LCP: <2.5s<br>- FCP: <1.8s<br>- TTI: <3.8s |

#### **TC-PERF-002: Backend response time - Dashboard API**

| ID | TC-PERF-002 |
|----|-------------|
| **Priorytet** | 🟡 Średni |
| **Moduł** | Backend - Portfolio Service |
| **Prekondycje** | 100 concurrent users |
| **Kroki** | 1. k6 load test: GET `/api/v1/dashboard`<br>2. Measure p95 response time |
| **Oczekiwany rezultat** | - p95: <500ms<br>- Error rate: <1% |

---

## 5. Środowisko testowe

### 5.1 Środowiska

| Środowisko | Cel | URL | Deployment |
|------------|-----|-----|------------|
| **Local** | Development testing | `localhost:5173` (FE)<br>`localhost:3000` (BE) | Manual |
| **Test/CI** | Automated tests (CI/CD) | N/A | GitHub Actions |
| **Staging** | Integration + E2E + UAT | `https://staging.janus-ai.app` | Auto (on merge to `develop`) |
| **Production** | Live app | `https://janus-ai.app` | Manual approval |

### 5.2 Konfiguracja środowiska testowego

#### **Backend (Local/Test)**

```yaml
Database: Supabase Local (Docker)
  - URL: http://localhost:54321
  - Isolated test schema
  - RLS enabled
  - Seed data: test users, transactions, strategies

External APIs:
  - Claude: Mock provider (test fixtures)
  - Gemini: Mock provider
  - Alpha Vantage: Mock responses (avoid quota)
  - Stooq: Mock responses

Environment Variables:
  - NODE_ENV=test
  - DATABASE_URL=postgresql://postgres:postgres@localhost:54322/test_db
  - JWT_SECRET=test_secret
  - CLAUDE_API_KEY=mock_key
```

#### **Frontend (Local/Test)**

```yaml
Backend URL: http://localhost:3000/api/v1
Mock Service Worker (MSW): 
  - Mock API responses for unit tests
  - Simulate loading states, errors
  
Browsers (E2E):
  - Chromium (Desktop: 1920×1080)
  - Chromium (Mobile: 375×667)
```

### 5.3 Dane testowe

#### **Test Users**

```typescript
// Seed data dla środowisk test/staging
const TEST_USERS = [
  {
    email: 'user1@test.com',
    password: 'Test1234!',
    transactions: 10,
    analyses: 0, // Fresh user
  },
  {
    email: 'user2@test.com',
    password: 'Test1234!',
    transactions: 100,
    analyses: 2, // Close to limit
  },
  {
    email: 'power-user@test.com',
    password: 'Test1234!',
    transactions: 1000,
    analyses: 3, // At limit
  },
];
```

#### **Test Files**

```
test-data/
├── xtb-samples/
│   ├── valid-100-transactions.xlsx
│   ├── valid-1000-transactions.xlsx
│   ├── corrupted-missing-columns.xlsx
│   ├── corrupted-invalid-types.xlsx
│   └── large-file-5mb.xlsx
├── ai-responses/
│   ├── recommendations-valid.json
│   ├── recommendations-malformed.json
│   └── recommendations-incomplete.json
└── mock-api-responses/
    ├── alpha-vantage-aapl.json
    ├── alpha-vantage-error-quota.json
    └── stooq-fallback.json
```

---

## 6. Narzędzia testowe

### 6.1 Backend Testing

| Narzędzie | Wersja | Zastosowanie |
|-----------|--------|--------------|
| **Jest** | 30.x | Unit tests, Integration tests |
| **ts-jest** | 29.x | TypeScript support |
| **Supertest** | 7.x | API endpoint testing |
| **Supabase CLI** | Latest | Local database, migrations |
| **faker-js** | 8.x | Test data generation |

### 6.2 Frontend Testing

| Narzędzie | Wersja | Zastosowanie |
|-----------|--------|--------------|
| **Jest** | 30.x | Unit tests |
| **Testing Library** | 16.x | Component testing |
| **jsdom** | 30.x | DOM simulation |
| **MSW** | 2.x | Mock Service Worker (API mocking) |
| **Playwright** | Latest | E2E tests |

### 6.3 Performance & Security

| Narzędzie | Zastosowanie |
|-----------|--------------|
| **k6** | Load testing (backend) |
| **Lighthouse CI** | Frontend performance |
| **OWASP ZAP** | Security scanning |
| **Supabase Logs** | RLS policy testing |

### 6.4 CI/CD

| Narzędzie | Zastosowanie |
|-----------|--------------|
| **GitHub Actions** | CI/CD pipelines |
| **Docker Compose** | Test environments |
| **Codecov** | Coverage reporting |

### 6.5 GitHub Actions Workflows

```yaml
# .github/workflows/test.yml

name: Test Suite

on: [pull_request, push]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node 22.x
      - Run ESLint (backend + frontend)
      - Run Prettier check

  unit-tests-backend:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node 22.x
      - Start Supabase local
      - Run: npm test
      - Upload coverage to Codecov

  unit-tests-frontend:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node 22.x
      - Run: npm test
      - Upload coverage to Codecov

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15
    steps:
      - Run integration suite
      - Seed test data

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - Install Playwright
      - Start backend + frontend
      - Run: npx playwright test
      - Upload test artifacts
```

---

## 7. Harmonogram testów

### 7.1 Faza 1: Przygotowanie (Tydzień 1)

| Zadanie | Czas | Odpowiedzialny |
|---------|------|----------------|
| Setup środowiska testowego | 2 dni | DevOps |
| Przygotowanie test data (XTB files, mock responses) | 2 dni | QA Engineers |
| Konfiguracja CI/CD pipelines | 1 dzień | DevOps |
| Dokumentacja test cases (100 scenariuszy) | 2 dni | QA Lead |

### 7.2 Faza 2: Testy Unit + Integration (Tydzień 2-3)

| Moduł | Czas | Testerzy |
|-------|------|----------|
| Backend Unit Tests | 3 dni | Backend Devs |
| Frontend Unit Tests | 3 dni | Frontend Devs |
| Integration Tests (API + DB) | 4 dni | QA Engineers (2 osoby) |
| Security Tests (RLS, Auth) | 2 dni | Security Engineer |

### 7.3 Faza 3: Testy E2E (Tydzień 4)

| User Journey | Czas | Testerzy |
|--------------|------|----------|
| Onboarding flow | 1 dzień | QA Engineer |
| Transaction management | 1 dzień | QA Engineer |
| AI Analysis flow | 2 dni | QA Engineer + AI Specialist |
| Dashboard + Charts | 1 dzień | QA Engineer |

### 7.4 Faza 4: Performance + Load Testing (Tydzień 5)

| Test Type | Czas | Testerzy |
|-----------|------|----------|
| Backend load tests (k6) | 2 dni | Performance Engineer |
| Frontend performance (Lighthouse) | 1 dzień | Frontend Dev |
| Stress testing (concurrent users) | 1 dzień | Performance Engineer |
| Memory leak detection | 1 dzień | Backend Dev |

### 7.5 Faza 5: UAT + Regression (Tydzień 6)

| Zadanie | Czas | Testerzy |
|---------|------|----------|
| UAT z beta testerami (5-10 osób) | 1 tydzień | Product Owner + QA Lead |
| Regression suite (automated) | Ciągłe | CI/CD |
| Bug fixing + retesting | Na bieżąco | Dev Team |

### 7.6 Release Checklist

**Pre-Release (1 dzień przed):**
- ✅ Wszystkie critical/high bugs resolved
- ✅ Regression suite: 100% pass rate
- ✅ E2E tests: 100% pass rate
- ✅ Performance benchmarks met
- ✅ Security scan: No critical vulnerabilities
- ✅ Staging environment stable (24h uptime)

**Release Day:**
- ✅ Production deployment (Blue-Green)
- ✅ Smoke tests na produkcji
- ✅ Monitoring alerts configured
- ✅ Rollback plan ready

---

## 8. Kryteria akceptacji

### 8.1 Kryteria wyjścia (Exit Criteria)

**Projekt może przejść do produkcji jeśli:**

#### **Pokrycie testowe:**
- ✅ Unit tests: ≥80% code coverage (critical paths: 100%)
- ✅ Integration tests: Wszystkie API endpoints covered
- ✅ E2E tests: Top 10 user journeys automated

#### **Defekty:**
- ✅ 0 critical bugs open
- ✅ 0 high priority bugs open
- ✅ Medium/Low bugs: Accepted as technical debt lub fixed

#### **Performance:**
- ✅ Dashboard load time (p95): <500ms
- ✅ Frontend LCP: <2.5s
- ✅ Import 1000 transactions: <10s
- ✅ No memory leaks detected

#### **Security:**
- ✅ All RLS policies tested and passing
- ✅ OWASP ZAP scan: No critical/high vulnerabilities
- ✅ JWT token flow validated
- ✅ Rate limiting functional

#### **Functional:**
- ✅ XTB import: 100% success rate (valid files)
- ✅ AI analysis: ≥95% success rate (valid responses parsed)
- ✅ Financial calculations: 100% accuracy (verified with known datasets)
- ✅ Rate limiting: 3/day enforced, no bypass

#### **UAT:**
- ✅ ≥80% user satisfaction score
- ✅ No critical usability issues reported
- ✅ AI recommendations deemed "useful" by ≥70% testers

### 8.2 Kryteria sukcesu post-release (1 tydzień)

- ✅ Production uptime: ≥99.5%
- ✅ Error rate: <0.1%
- ✅ No critical bugs reported by users
- ✅ AI analysis success rate: ≥90%
- ✅ Average dashboard load time: <1s

---

## 9. Role i odpowiedzialności

### 9.1 Zespół testowy

| Rola | Osoba | Odpowiedzialności |
|------|-------|-------------------|
| **QA Lead** | [Imię] | - Planowanie testów<br>- Koordinacja zespołu<br>- Raportowanie do Product Owner<br>- Sign-off na release |
| **QA Engineer #1** | [Imię] | - Integration tests (Backend)<br>- E2E tests (Auth + Transactions)<br>- Security testing (RLS) |
| **QA Engineer #2** | [Imię] | - E2E tests (Dashboard + Analysis)<br>- Frontend component tests<br>- UAT coordination |
| **Performance Engineer** | [Imię] | - Load testing (k6)<br>- Frontend performance (Lighthouse)<br>- Memory profiling |
| **Security Engineer** | [Imię] | - Security scanning (OWASP ZAP)<br>- RLS policy validation<br>- Penetration testing |
| **Backend Developers** | Team | - Unit tests (Services, Utils)<br>- Integration tests support<br>- Bug fixing |
| **Frontend Developers** | Team | - Unit tests (Components, Hooks)<br>- E2E test scripts (Playwright)<br>- Bug fixing |
| **DevOps Engineer** | [Imię] | - CI/CD pipelines<br>- Test environments<br>- Monitoring setup |

### 9.2 Proces zatwierdzania

**Test Plan Approval:**
1. QA Lead → Draft plan
2. Tech Lead → Review technical approach
3. Product Owner → Approve scope & priorities
4. Stakeholders → Final sign-off

**Release Approval:**
1. QA Lead → Verify exit criteria
2. Tech Lead → Code review + security check
3. Product Owner → Business approval
4. DevOps → Production deployment

---

## 10. Procedury raportowania błędów

### 10.1 Narzędzie do trackingu

**GitHub Issues** z custom labels:

```
Labels:
- bug
- critical / high / medium / low
- backend / frontend / database / security
- regression
- performance
- uat-feedback
```

### 10.2 Szablon zgłoszenia błędu

```markdown
## 🐛 Bug Report

**ID:** BUG-001
**Priorytet:** 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low
**Moduł:** [Auth / Transactions / Portfolio / AI Analysis / etc.]
**Środowisko:** [Local / Test / Staging / Production]
**Wersja:** v1.0.0

### Opis
[Krótki opis problemu]

### Kroki reprodukcji
1. [Krok 1]
2. [Krok 2]
3. [Krok 3]

### Oczekiwany rezultat
[Co powinno się stać]

### Aktualny rezultat
[Co faktycznie się dzieje]

### Screenshots / Logs
[Załącz screenshot lub logi]

### Informacje techniczne
- Browser: Chrome 120
- OS: Windows 11
- User: test@example.com
- API Response: [jeśli applicable]

### Dodatkowe informacje
[Inne istotne szczegóły]
```

### 10.3 Priorytety błędów

| Priorytet | Definicja | Przykłady | SLA Fix |
|-----------|-----------|-----------|---------|
| 🔴 **Critical** | Blokuje core functionality, data loss, security breach | - Login nie działa<br>- RLS leak (cudze dane widoczne)<br>- Server crash<br>- Błędne kalkulacje finansowe | **Natychmiast** (same day) |
| 🟠 **High** | Poważny wpływ na użytkownika, workaround możliwy | - XTB import fails czasami<br>- AI analysis timeout<br>- Dashboard load >5s | **1-3 dni** |
| 🟡 **Medium** | Średni wpływ, nie blokuje kluczowych funkcji | - Pagination bug<br>- Chart rendering issue<br>- Form validation error | **1 tydzień** |
| 🟢 **Low** | Kosmetyczny, minor inconvenience | - Typo w UI<br>- Color inconsistency<br>- Tooltip missing | **Backlog** (next sprint) |

### 10.4 Workflow zgłoszenia

```mermaid
QA Engineer → [Create GitHub Issue]
                ↓
        QA Lead → [Triage + Priority]
                ↓
        Tech Lead → [Assign to Dev]
                ↓
        Developer → [Fix + PR]
                ↓
        QA Engineer → [Verify Fix]
                ↓
        [Close Issue] or [Reopen if not fixed]
```

### 10.5 Raportowanie statusu testów

**Daily Standups:**
- Bugs found (by priority)
- Tests executed vs. planned
- Blockers

**Weekly Reports:**
```markdown
## Testing Status Report - Week X

### Summary
- Test cases executed: 120/150 (80%)
- Pass rate: 95%
- Bugs found: 15 (2 critical, 5 high, 8 medium)
- Bugs fixed: 12
- Open critical bugs: 0

### Critical Issues
[List any critical bugs]

### Risks
[Any risks to release timeline]

### Next Week Plan
[What will be tested next]
```

### 10.6 Regression tracking

**Automated Regression Suite:**
- Runs on every commit to `master`
- Results posted to Slack channel: `#qa-alerts`
- Email alert for failures (QA Lead + Tech Lead)

**Manual Regression:**
- Before each release
- Checklist: Top 20 user scenarios
- Sign-off required by QA Lead

---

## 11. Załączniki

### 11.1 Dokumenty powiązane

- [Tech Stack Documentation](.ai/tech-stack.md)
- [Project Analysis - QA Perspective](.ai/analiza-qa.md)
- [API Documentation](backend/README.md)
- [Frontend Component Library](frontend/README.md)

### 11.2 Test Data Repository

**Location:** `backend/test-data/` oraz `frontend/src/__tests__/__fixtures__/`

**Contents:**
- XTB Excel samples (valid, corrupted, large)
- Mock AI responses (valid JSON, malformed, incomplete)
- Mock API responses (Alpha Vantage, Stooq)
- Seed data scripts (test users, transactions, strategies)

### 11.3 CI/CD Pipeline Documentation

**GitHub Actions workflows:**
- `.github/workflows/backend-tests.yml`
- `.github/workflows/frontend-tests.yml`
- `.github/workflows/e2e-tests.yml`
- `.github/workflows/security-scan.yml`

### 11.4 Monitoring & Alerts

**Production Monitoring:**
- Sentry: Error tracking (backend + frontend)
- Supabase Logs: Database queries, RLS violations
- Uptime monitoring: Pingdom / UptimeRobot
- API health checks: `/health` endpoint

**Alerts configured for:**
- Server errors (5xx) > 1%
- API response time > 2s (p95)
- Database connection failures
- AI API failures > 10% rate
- Rate limit violations spike

---

## 12. Wnioski i rekomendacje

### 12.1 Kluczowe obszary uwagi

1. **Bezpieczeństwo jest priorytetem #1**
   - RLS policies muszą być dokładnie przetestowane
   - Regular security audits (quarterly)
   - Penetration testing przed każdym major release

2. **AI integration wymaga szczególnej opieki**
   - Robust error handling dla nieprzewidywalnych odpowiedzi
   - Monitoring success rate analiz w produkcji
   - Fallback scenarios dla failures

3. **XTB Parser jest krytyczny dla MVP**
   - Test library z real-world files
   - Plan B jeśli XTB zmieni format

4. **Performance monitoring od Day 1**
   - Dashboard load time
   - Large portfolio handling
   - Cache effectiveness

### 12.2 Continuous Improvement

**Post-release:**
- Analyze production bugs → Improve test coverage
- User feedback → UAT scenarios update
- Performance metrics → Load test benchmarks update

**Quarterly reviews:**
- Test strategy effectiveness
- Tool evaluation (czy Playwright spełnia oczekiwania?)
- Test automation ROI

---

**Zatwierdzone przez:**

| Rola | Imię | Podpis | Data |
|------|------|--------|------|
| QA Lead | [Imię] | ______ | ______ |
| Tech Lead | [Imię] | ______ | ______ |
| Product Owner | [Imię] | ______ | ______ |

---

**Historia zmian:**

| Wersja | Data | Autor | Zmiany |
|--------|------|-------|--------|
| 1.0 | 2025-11-15 | QA Team | Initial version |

