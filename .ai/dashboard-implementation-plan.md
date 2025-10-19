# API Endpoint Implementation Plan: GET /dashboard

## 1. Przegląd punktu końcowego
Ten punkt końcowy (`GET /api/v1/dashboard`) dostarcza skonsolidowany zestaw danych wymaganych do renderowania głównego pulpitu nawigacyjnego użytkownika. Agreguje on kluczowe wskaźniki, takie jak bieżąca wartość portfela, historyczna wydajność i dywersyfikacja aktywów, w ramach jednego wywołania API w celu zapewnienia wydajności. Dostęp jest ograniczony do uwierzytelnionych użytkowników.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/v1/dashboard`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak.
- **Nagłówki**:
  - `Authorization: Bearer <JWT>` (Wymagane) - Token dostępu JWT do uwierzytelniania użytkownika.

## 3. Wykorzystywane typy

### DTO (Data Transfer Objects)
```typescript
// DTO dla odpowiedzi
interface DashboardSummaryDto {
  totalValue: number;
  currency: string;
  change: {
    value: number;
    percentage: number;
  };
}

interface PortfolioHistoryPointDto {
  date: string; // format YYYY-MM-DD
  value: number;
}

interface DiversificationItemDto {
  ticker: string;
  value: number;
  percentage: number;
}

interface GetDashboardResponseDto {
  summary: DashboardSummaryDto;
  history: PortfolioHistoryPointDto[];
  diversification: DiversificationItemDto[];
}
```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**: Zwraca obiekt `GetDashboardResponseDto` z danymi pulpitu.
  ```json
  {
    "summary": {
      "totalValue": 125000.50,
      "currency": "PLN",
      "change": {
        "value": 1200.75,
        "percentage": 0.97
      }
    },
    "history": [
      { "date": "2025-09-01", "value": 118000.00 },
      { "date": "2025-10-19", "value": 125000.50 }
    ],
    "diversification": [
      { "ticker": "AAPL", "value": 25000.00, "percentage": 20.0 },
      { "ticker": "GOOGL", "value": 20000.00, "percentage": 16.0 },
      { "name": "Other", "value": 65000.50, "percentage": 52.0 }
    ]
  }
  ```
- **Odpowiedzi błędów**:
  - `401 Unauthorized`: Gdy token JWT jest nieprawidłowy, wygasł lub go brakuje.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera (np. błąd bazy danych, błąd API zewnętrznego).

## 5. Przepływ danych
1.  Frontend wysyła żądanie `GET` do `/api/v1/dashboard` z prawidłowym tokenem JWT w nagłówku `Authorization`.
2.  Middleware `auth` weryfikuje token JWT, wyodrębnia `userId` i dołącza go do obiektu żądania.
3.  `DashboardController` odbiera żądanie i wywołuje metodę `getDashboardData(userId)` z `DashboardService`.
4.  `DashboardService` wykonuje następujące operacje w celu zebrania danych:
    a.  **Pobieranie pozycji i historii**:
        -   Pobiera aktualne pozycje portfela użytkownika, korzystając z widoku `user_portfolio_positions`.
        -   Pobiera historyczne migawki wartości portfela z tabeli `portfolio_snapshots` dla danego `userId` (np. z ostatnich 30 dni).
    b.  **Pobieranie cen rynkowych**:
        -   Zbiera unikalne tickery z aktualnych pozycji.
        -   Wywołuje zewnętrzną usługę (np. Finnhub, IEX Cloud) w celu uzyskania aktualnych cen rynkowych dla tych tickerów.
    c.  **Agregacja i obliczenia**:
        -   **Summary**: Oblicza `totalValue` (suma wartości rynkowej wszystkich akcji + saldo gotówkowe z `portfolio_snapshots`). Oblicza `change` porównując `totalValue` z wartością z poprzedniego dnia z `portfolio_snapshots`.
        -   **History**: Mapuje dane z `portfolio_snapshots` do formatu `PortfolioHistoryPointDto`.
        -   **Diversification**: Oblicza wartość rynkową każdej pozycji i jej procentowy udział w `totalValue`. Pozycje o niewielkim udziale (<1%) są grupowane w kategorię "Other".
5.  `DashboardService` zwraca zagregowane dane w formacie `GetDashboardResponseDto` do `DashboardController`.
6.  `DashboardController` wysyła odpowiedź JSON z kodem statusu `200 OK`.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Punkt końcowy jest chroniony przez middleware `auth`, który zapewnia, że tylko zalogowani użytkownicy mogą uzyskać dostęp do swoich danych.
- **Autoryzacja**: Wszystkie zapytania do bazy danych (np. do `portfolio_snapshots`, `user_portfolio_positions`) muszą być ściśle filtrowane przez `userId` uzyskany z tokenu JWT. Zapobiega to dostępowi jednego użytkownika do danych innego.
- **Zewnętrzne API**: Klucze API do usług danych rynkowych muszą być bezpiecznie przechowywane jako zmienne środowiskowe i nigdy nie mogą być ujawniane po stronie klienta.

## 7. Obsługa błędów
- **Brak tokenu/nieprawidłowy token**: Middleware `auth` automatycznie zwróci odpowiedź `401 Unauthorized`.
- **Błąd bazy danych**: Każde niepowodzenie zapytania do bazy danych zostanie przechwycone przez globalny `errorHandler` i zwróci odpowiedź `500 Internal Server Error`.
- **Błąd zewnętrznego API**: Jeśli API danych rynkowych nie odpowie lub zwróci błąd, system powinien to obsłużyć w sposób bezpieczny (np. logując błąd i zwracając `500 Internal Server Error` lub, w przyszłości, używając danych z pamięci podręcznej).
- **Brak danych**: Jeśli użytkownik nie ma żadnych transakcji ani migawek, punkt końcowy powinien zwrócić strukturę `GetDashboardResponseDto` z wartościami zerowymi lub pustymi tablicami, a nie błąd.

## 8. Rozważania dotyczące wydajności
- **Pojedyncze wywołanie**: Projekt punktu końcowego, który zwraca wszystkie dane za jednym razem, jest z natury wydajny dla frontendu.
- **Zewnętrzne API**: Główne wąskie gardło wydajnościowe to zależność od zewnętrznego API do pobierania cen. Czas odpowiedzi tego API wpłynie bezpośrednio na czas odpowiedzi naszego punktu końcowego.
- **Caching**: W przyszłości można zaimplementować mechanizm buforowania (np. za pomocą Redis) dla cen akcji, aby zmniejszyć liczbę wywołań zewnętrznego API i poprawić czas odpowiedzi. Ceny mogą być buforowane na krótki okres (np. 1-5 minut).
- **Optymalizacja zapytań**: Zapytania do `portfolio_snapshots` i `user_portfolio_positions` powinny być zoptymalizowane pod kątem wydajności, z odpowiednimi indeksami na kolumnach `user_id` i `snapshot_date`.

## 9. Etapy wdrożenia
1.  **Struktura plików**: Utwórz nowe pliki w katalogu `backend/src`:
    -   `portfolios/portfolios.routes.ts` (lub `dashboard/dashboard.routes.ts`)
    -   `portfolios/portfolios.controller.ts`
    -   `portfolios/portfolios.service.ts`
    -   `portfolios/portfolios.types.ts` (dla DTO)
2.  **Definicje typów**: Zdefiniuj wszystkie DTO (`DashboardSummaryDto`, `PortfolioHistoryPointDto`, `DiversificationItemDto`, `GetDashboardResponseDto`) w pliku `portfolios.types.ts`.
3.  **Routing**: W `portfolios.routes.ts` zdefiniuj trasę `GET /` i powiąż ją z metodą kontrolera. Zabezpiecz trasę za pomocą middleware `auth`. Zarejestruj router w głównym pliku aplikacji (`app.ts`).
4.  **Kontroler**: W `portfolios.controller.ts` utwórz metodę `getDashboard`, która pobiera `userId` z żądania, wywołuje `DashboardService` i zwraca wynik.
5.  **Serwis (logika biznesowa)**: W `portfolios.service.ts` zaimplementuj metodę `getDashboardData(userId)`.
    -   Zintegruj klienta Supabase, aby pobrać dane z `portfolio_snapshots` i `user_portfolio_positions`.
    -   Zintegruj klienta HTTP (np. `axios` lub `node-fetch`) do komunikacji z zewnętrznym API danych rynkowych.
    -   Zaimplementuj logikę obliczeniową dla `summary`, `history` i `diversification`.
6.  **Obsługa błędów**: Upewnij się, że wszystkie operacje asynchroniczne (zapytania do bazy danych, wywołania API) są opakowane w bloki `try...catch` lub używają `express-async-errors` do przekazywania błędów do globalnego `errorHandler`.
7.  **Zmienne środowiskowe**: Dodaj klucz API dla usługi danych rynkowych do pliku `.env.example` i skonfiguruj jego ładowanie w `config.ts`.
8.  **Testy jednostkowe**: Utwórz testy jednostkowe dla `DashboardService`, mockując zapytania do bazy danych i wywołania zewnętrznego API, aby zweryfikować poprawność obliczeń.
9.  **Testy integracyjne**: Utwórz testy integracyjne dla punktu końcowego `GET /dashboard`, aby zweryfikować cały przepływ, w tym uwierzytelnianie i odpowiedź.
