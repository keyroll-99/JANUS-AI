# 🏛️ Janus AI

> Inteligentny asystent zarządzania portfelem inwestycyjnym

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7.1-646CFF)](https://vite.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-green)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://www.postgresql.org/)

## 📋 O projekcie

Janus to open-source'owa aplikacja webowa zaprojektowana w celu uproszczenia zarządzania osobistym portfelem inwestycyjnym. Umożliwia import historii transakcji z plików Excel (XTB), ręczne zarządzanie danymi oraz wykorzystanie AI (Claude/Gemini) do analizy portfela i generowania spersonalizowanych rekomendacji.

### Główne funkcje

- 📊 **Dashboard** z kluczowymi metrykami portfela
- 📁 **Import danych** z plików Excel (format XTB)
- ✏️ **Ręczne zarządzanie** transakcjami
- 🎯 **Definicja strategii** inwestycyjnej
- 🤖 **Analiza AI** z rekomendacjami kup/sprzedaj
- 📈 **Historia analiz** i śledzenie zmian

## 🏗️ Architektura

Projekt to **monorepo** składające się z:

```
janus-ai/
├── backend/       # Express.js REST API
├── frontend/      # React SPA
└── .github/       # CI/CD workflows
```

## 🛠️ Tech Stack

### Backend
- **Express.js** - REST API framework
- **PostgreSQL** - relacyjna baza danych
- **TypeScript** - type safety
- **JWT** - autentykacja
- **Claude/Gemini API** - AI analysis

### Frontend
- **React 19.2** - UI library (latest with new features)
- **React Router v7.9** - routing (type-safe)
- **TypeScript 5.9** - type safety
- **SCSS 1.93** - styling
- **Vite 7.1** - build tool (latest)
- **Native Fetch API** - HTTP client

### DevOps
- **Docker** - konteneryzacja
- **GitHub Actions** - CI/CD
- **Jest 30** - unit testing
- **Playwright** - E2E testing

Szczegóły: [📄 Tech Stack Documentation](.ai/tech-stack.md)

## 🚀 Quick Start

### Wymagania

- Node.js >= 20.x
- PostgreSQL >= 16.x
- npm >= 10.x

### Instalacja

```bash
# Klonowanie repozytorium
git clone https://github.com/your-org/janus-ai.git
cd janus-ai

# Instalacja zależności backend
cd backend
npm install
cp .env.example .env
# Edytuj .env i uzupełnij zmienne

# Instalacja zależności frontend
cd ../frontend
npm install
cp .env.example .env
# Edytuj .env i uzupełnij zmienne

# Wróć do głównego katalogu
cd ..
```

### Uruchomienie

```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm run dev
```

Aplikacja dostępna pod: http://localhost:3000

### Docker (opcjonalnie)

```bash
# Build i uruchomienie wszystkich serwisów
docker-compose up --build

# W tle
docker-compose up -d
```

## 📖 Dokumentacja

- [📋 Product Requirements Document (PRD)](.ai/prd.md)
- [🛠️ Tech Stack Details](.ai/tech-stack.md)
- [🎨 Frontend README](frontend/README.md)
- [⚙️ Backend README](backend/README.md)

## 🧪 Testowanie

```bash
# Backend tests
cd backend
npm test
npm run test:coverage

# Frontend tests
cd frontend
npm test
npm run test:coverage

# E2E tests (Playwright)
cd frontend
npm run test:e2e
```

## 📦 Build produkcyjny

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

## 🤝 Contributing

Projekt jest open-source! Zachęcamy do współpracy:

1. Fork projektu
2. Stwórz feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit zmian (`git commit -m 'feat: Add AmazingFeature'`)
4. Push do brancha (`git push origin feature/AmazingFeature`)
5. Otwórz Pull Request

### Konwencje commitów

Używamy [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - nowa funkcjonalność
- `fix:` - naprawa błędu
- `docs:` - dokumentacja
- `style:` - formatowanie
- `refactor:` - refaktoryzacja
- `test:` - testy
- `chore:` - maintenance

## 📄 Licencja

MIT License - see [LICENSE](LICENSE) file for details

## 🎯 Roadmap

### MVP (v0.1.0)
- [x] Podstawowa architektura monorepo
- [ ] System autentykacji (login/register)
- [ ] Import plików Excel z XTB
- [ ] Dashboard z metrykami
- [ ] CRUD transakcji
- [ ] Definicja strategii
- [ ] Integracja z Claude/Gemini
- [ ] Historia analiz AI

### Przyszłe wersje
- [ ] Integracja z API brokerów (XTB, Freedom24)
- [ ] Real-time aktualizacja cen
- [ ] Powiadomienia email/push
- [ ] Aplikacja mobilna
- [ ] Zaawansowane wykresy i raporty
- [ ] Multi-language support

## 💰 Koszty (szacunki dla 100 użytkowników/mc)

- **Hosting Backend**: $10-20/mc
- **Hosting Frontend**: $0 (Vercel free tier)
- **Database**: $0-20/mc (Neon/Supabase free/paid)
- **AI API**: $10-30/mc (Claude Haiku)
- **Total**: ~$20-70/mc

## 🙏 Podziękowania

- [XTB](https://www.xtb.com/) za inspirację formatem Excel
- [Anthropic](https://www.anthropic.com/) za Claude API
- [Google](https://ai.google.dev/) za Gemini API
- Społeczność open-source za niesamowite narzędzia

## 📞 Kontakt

- Issues: [GitHub Issues](https://github.com/your-org/janus-ai/issues)
- Discussions: [GitHub Discussions](https://github.com/your-org/janus-ai/discussions)

---

**Made with ❤️ by the Janus team**
