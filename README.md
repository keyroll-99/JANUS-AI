# Janus AI - Inteligentny Asystent Portfela Inwestycyjnego

![GitHub issues](https://img.shields.io/github/issues/your-username/janus-ai)
![GitHub forks](https://img.shields.io/github/forks/your-username/janus-ai)
![GitHub stars](https://img.shields.io/github/stars/your-username/janus-ai)
![Licencja](https://img.shields.io/badge/license-MIT-blue.svg)

Janus to aplikacja webowa (z widokiem mobilnym) typu open-source, zaprojektowana w celu uproszczenia zarządzania osobistym portfelem inwestycyjnym. Umożliwia import danych z XTB, analizę portfela przez AI i dostosowane rekomendacje.

---

## 🎯 Problem

Zarządzanie portfelem inwestycyjnym, często rozproszonym między różne konta (główny portfel, IKE, IKZE), jest skomplikowane i nieporęczne. Inwestorzy, zwłaszcza początkujący, mają trudności z oceną, kiedy sprzedać lub kupić aktywa oraz jak utrzymać spójność ze swoją strategią. Brakuje im prostego narzędzia, które agreguje dane i dostarcza spersonalizowanych rekomendacji.

## ✨ Kluczowe Funkcjonalności

- **Import Danych**: Szybkie zasilanie aplikacji przez import historii transakcji z plików Excel generowanych przez XTB.
- **Zarządzanie Transakcjami**: Możliwość ręcznego dodawania i edytowania transakcji.
- **Definicja Strategii**: Prosty formularz do zdefiniowania celów inwestycyjnych, horyzontu czasowego i poziomu ryzyka.
- **Analiza AI**: Uruchamiana jednym przyciskiem analiza portfela przez Claude/Gemini, generująca podsumowanie i rekomendacje "kup/sprzedaj".
- **Dashboard**: Przejrzysty pulpit z łączną wartością portfela, wykresem historycznym i wizualizacją dywersyfikacji aktywów.
- **Historia Analiz**: Archiwum wszystkich przeprowadzonych analiz do śledzenia zmian w rekomendacjach.

## 🛠️ Stos Technologiczny

### Backend
- **Framework**: Express.js
- **Baza Danych**: PostgreSQL
- **Język**: TypeScript
- **Kluczowe Biblioteki**: Passport-JWT (auth), Multer (file upload), Zod (walidacja), @anthropic-ai/sdk

### Frontend
- **Framework**: React 19
- **Routing**: React Router v7
- **Styling**: SCSS
- **Build Tool**: Vite
- **Kluczowe Biblioteki**: React Hook Form (formularze), Recharts (wykresy)

### DevOps
- **Konteneryzacja**: Docker
- **CI/CD**: GitHub Actions

## 🏗️ Architektura Projektu

Projekt jest zorganizowany jako monorepo z wyraźnym podziałem na backend i frontend.

```
janus-ai/
├── backend/
│   ├── src/
│   │   ├── domains/          # Logika biznesowa (DDD)
│   │   ├── shared/           # Współdzielone moduły
│   │   ├── app.ts            # Główna aplikacja Express
│   │   └── server.ts         # Inicjalizacja serwera
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Komponenty UI
│   │   ├── pages/            # Widoki aplikacji
│   │   ├── shared/           # Współdzielone hooki, API, typy
│   │   ├── App.tsx           # Główny komponent aplikacji
│   │   └── main.tsx          # Punkt wejścia
│   └── package.json
│
└── .github/
    └── workflows/            # Automatyzacja CI/CD
```

## � Jak zacząć?

### Wymagania
- Node.js (zalecana wersja z `.nvmrc`)
- Docker i Docker Compose
- Dostęp do instancji PostgreSQL

### 1. Klonowanie Repozytorium
```bash
git clone https://github.com/your-username/janus-ai.git
cd janus-ai
```

### 2. Konfiguracja Backendu
```bash
cd backend

# Skopiuj plik .env.example i uzupełnij zmienne
cp .env.example .env

# Zainstaluj zależności
npm install

# Uruchom serwer deweloperski
npm run dev
```
Serwer backendu będzie dostępny pod adresem `http://localhost:3000`.

### 3. Konfiguracja Frontendu
```bash
cd ../frontend

# Zainstaluj zależności
npm install

# Uruchom serwer deweloperski
npm run dev
```
Aplikacja frontendowa będzie dostępna pod adresem `http://localhost:5173`.

## 🤝 Kontrybucja

Projekt jest open-source i zapraszamy do kontrybucji! Jeśli chcesz pomóc, zapoznaj się z otwartymi `Issues` i naszymi wytycznymi dotyczącymi kontrybucji (wkrótce).

## � Licencja

Projekt jest udostępniany na licencji MIT. Zobacz plik [LICENSE](LICENSE.md) po więcej szczegółów.
