# Tech Stack - Janus AI

## Przegląd
Janus AI to monorepo zawierające aplikację webową z responsywnym widokiem mobilnym. Projekt jest rozwijany jako open-source.

---

## Backend

### Core Framework
- **Express.js** - Minimalistyczny framework Node.js do budowy REST API
  - Szybki start dla MVP
  - Duża elastyczność i ekosystem middleware
  - Łatwa separacja na microservices w przyszłości

### Baza danych
- **PostgreSQL** - Relacyjna baza danych
  - Obsługa ACID dla transakcji finansowych
  - Świetna skalowalność
  - Mature security features
  - Uzycie supabase

### Kluczowe biblioteki

#### Autentykacja & Bezpieczeństwo
- **passport-jwt** - JWT-based authentication
- **bcrypt** - Hashowanie haseł
- **helmet** - Security headers
- **cors** - CORS configuration
- **express-rate-limit** - Rate limiting dla ochrony AI API calls

#### File Processing
- **multer** - Handling upload plików Excel
- **xlsx** lub **exceljs** - Parsing plików Excel z XTB

#### AI Integration
- **@anthropic-ai/sdk** - Integracja z Claude API
- **@google/generative-ai** - (opcjonalnie) Integracja z Gemini API

#### Walidacja & Utilities
- **zod** - Runtime validation
- **date-fns** - Manipulacja datami transakcji
- **dotenv** - Zarządzanie zmiennymi środowiskowymi

#### Development
- **typescript** - Type safety
- **ts-node-dev** - Development server z hot reload
- **jest** - Unit testing
- **supertest** - API testing

---

## Frontend

### Core Framework
- **React 19.2** - UI library
  - Komponentowa architektura
  - Nowe features: `use()` hook, `useOptimistic()`, Actions
  - Duża społeczność i ekosystem
  - Łatwa rozbudowa

### Routing
- **React Router v7.9** - Client-side routing
  - Type-safe routing
  - Loader functions dla data fetching
  - Error boundaries
  - Nested routes

### Styling
- **SCSS** - CSS preprocessor
  - Variables i mixins dla consistency
  - Nested selectors
  - Zgodność z project guidelines
  - Customizacja Ant Design theme

### Kluczowe biblioteki

#### UI Component Library
- **Ant Design (antd)** - Enterprise UI component library
  - Gotowe komponenty dla aplikacji finansowych (Tables, Forms, Cards, Statistics)
  - Doskonałe wsparcie TypeScript
  - Spójny design system
  - Optymalizacja: tree-shaking i targeted imports
- **@ant-design/icons** - Ikony zintegrowane z Ant Design

#### Data Fetching
- **Native Fetch API** - Proste fetchowanie danych
  - Wystarczające dla MVP (CRUD operations)
  - Custom hooks dla reusability
  - _Bez React Query - overengineering dla aktualnych wymagań_

#### Forms & Validation
- **Ant Design Form** - Zintegrowany system formularzy z antd
- **zod** - Schema validation (współdzielona z backendem)
  - Integracja z Ant Design Forms

#### Charts & Visualization
- **@ant-design/charts** - Biblioteka wykresów oparta na G2Plot
  - Lepsza integracja z Ant Design niż recharts
  - Line chart (historia wartości portfela)
  - Pie chart (dywersyfikacja)
  - Area chart dla wizualizacji zmian wartości
  - Specjalistyczne wykresy finansowe (candlestick, stock charts)
  - Responsive i customizable

#### UI Components
- **react-error-boundary** - Error handling
- **date-fns** - Date formatting (spójne z backendem)

#### Development
- **Vite 7.1** - Build tool i dev server (latest)
- **TypeScript 5.9** - Type safety
- **ESLint 9** - Linting (flat config)
- **Prettier 3.6** - Code formatting
- **Jest 30 + Testing Library** - Unit testing
- **Playwright** - E2E testing (future)

---

## DevOps & Infrastructure

### Containerization
- **Docker** - Konteneryzacja aplikacji
  - Multi-stage builds dla optymalizacji
  - Docker Compose dla local development

### CI/CD
- **GitHub Actions** - Automatyzacja
  - Linting i testy na PR
  - Automated deployments
  - Conventional commits enforcement

### Hosting Options (do wyboru)
- **Backend**: Railway, Render, lub VPS
- **Frontend**: Vercel, Netlify, lub Cloudflare Pages
- **Database**: Supabase, Neon, lub Railway

---

## Zarządzanie kosztami AI

### Rate Limiting
- **3 analizy/dzień/użytkownik** - Ochrona przed nadużyciami
- **Express-rate-limit** - Implementacja na poziomie API

### Caching
- **Redis** (opcjonalnie dla przyszłości) - Cache wyników analiz
  - Ta sama strategia + podobny portfel = cached response
  - Redukcja kosztów API o ~60-70%

### Model Selection
- **Claude Haiku** (start) - Tańszy model (~$0.01/request)
- **Claude Opus** (przyszłość) - Dla premium users

---

## Architektura projektu

```
janus-ai/
├── backend/
│   ├── src/
│   │   ├── domains/          # Domain-driven design
│   │   │   ├── auth/         # Autentykacja
│   │   │   ├── transactions/ # Transakcje
│   │   │   ├── portfolio/    # Portfolio logic
│   │   │   ├── strategy/     # Strategie użytkownika
│   │   │   └── analysis/     # AI Analysis
│   │   ├── shared/           # Shared utilities
│   │   │   ├── config/
│   │   │   ├── middlewares/
│   │   │   ├── types/
│   │   │   └── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layouts/
│   │   │   └── shared/
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── transactions/
│   │   │   ├── strategy/
│   │   │   └── analysis/
│   │   ├── shared/
│   │   │   ├── api/          # API client
│   │   │   ├── hooks/        # Custom hooks
│   │   │   ├── types/
│   │   │   ├── utils/
│   │   │   └── styles/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
└── .github/
    └── workflows/            # CI/CD pipelines
```

---

## Decyzje techniczne

### ✅ Zatwierdzone
1. **Express.js** - Wystarczająco prosty, wystarczająco mocny
2. **PostgreSQL** - Idealny dla finansowych danych transakcyjnych
3. **React + React Router** - Sprawdzona kombinacja
4. **Ant Design + Ant Design Charts** - Enterprise UI library idealna dla aplikacji finansowych
   - Przyspiesza development MVP (gotowe komponenty)
   - Spójny design system
   - Doskonałe wsparcie dla tabel danych i formularzy
   - Specjalistyczne wykresy finansowe
5. **SCSS** - Zgodne z project guidelines + customizacja Ant Design theme
6. **TypeScript** - Type safety dla całego stacku

### ❌ Odrzucone
1. **React Query** - Overengineering dla MVP
   - Proste CRUD operacje nie wymagają zaawansowanego cache
   - Native fetch + custom hooks wystarczą
   - Można dodać w przyszłości jeśli będzie potrzeba

2. **Next.js** - Za duży vendor lock-in
   - Chcemy zachować separację BE/FE
   - Open-source friendly approach
   - Łatwiejszy self-hosting

3. **recharts** - Zastąpiony przez @ant-design/charts
   - Lepsza integracja z Ant Design
   - Więcej opcji dla wizualizacji finansowych
   - Spójność w całym UI

4. **react-hook-form** - Zastąpiony przez Ant Design Form
   - Natywna integracja z komponentami Ant Design
   - Mniej dependencies
   - Nadal używamy Zod do walidacji

### 🔮 Do rozważenia w przyszłości
1. **Redis** - Cache dla analiz AI (redukcja kosztów)
2. **WebSockets** - Real-time updates cen akcji
3. **Bull/BullMQ** - Queue dla batch processing analiz
4. **Stripe** - Jeśli wprowadzicie płatne plany

---

## Bezpieczeństwo

### Backend
- JWT tokens z refresh mechanism
- Bcrypt do hashowania haseł (cost factor: 12)
- Helmet.js dla security headers
- CORS configuration
- Rate limiting na wrażliwe endpointy
- Input validation z Zod
- SQL injection protection (Parametrized queries)

### Frontend
- CSRF token handling
- XSS protection (React escaping + DOMPurify jeśli render HTML)
- Secure token storage (httpOnly cookies preferowane)
- Input sanitization

### Database
- Row-level security policies
- Encrypted connections (SSL)
- Regular backups
- Principle of least privilege dla DB users

---

## Monitoring & Obserwability (przyszłość)

- **Sentry** - Error tracking
- **PostHog** lub **Plausible** - Privacy-friendly analytics
- **Pino** - Structured logging
- **PostgreSQL pg_stat_statements** - Query performance monitoring

---

## Podsumowanie

Stack jest zoptymalizowany pod:
- ✅ Szybkie dostarczenie MVP (3-4 tygodnie) - Ant Design przyspiesza rozwój UI
- ✅ Niskie koszty utrzymania (głównie AI API)
- ✅ Open-source friendly
- ✅ Skalowalność na przyszłość
- ✅ Bezpieczeństwo finansowych danych
- ✅ Developer experience (TypeScript, hot reload, testing)
- ✅ Profesjonalny wygląd aplikacji finansowej out-of-the-box

**Uwagi dotyczące Ant Design:**
- Targeted imports (`import { Table, Form } from 'antd'`) dla optymalizacji bundle size
- Konfiguracja theme na początku projektu
- Bundle size: ~800KB+ (akceptowalne dla MVP aplikacji finansowej)
- Excellent TypeScript support

**Całkowity koszt miesięczny (szacunki dla 100 aktywnych użytkowników):**
- Hosting Backend: $10-20
- Hosting Frontend: $0 (Vercel free tier)
- Database: $0-20 (Neon/Supabase free tier lub paid)
- AI API (Claude Haiku): $10-30
- **Total: $20-70/mc**
