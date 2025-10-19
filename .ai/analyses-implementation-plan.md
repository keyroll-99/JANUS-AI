# API Endpoint Implementation Plan: GET /analyses/:id

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest umożliwienie uwierzytelnionym użytkownikom pobierania szczegółowych informacji o konkretnej, historycznej analizie AI ich portfela. Odpowiedź zawiera ogólne podsumowanie analizy oraz listę konkretnych rekomendacji (np. kup, sprzedaj, trzymaj) wygenerowanych przez model AI. Dostęp jest ograniczony tylko do analiz należących do zalogowanego użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/v1/analyses/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki): Unikalny identyfikator (UUID) analizy, która ma zostać pobrana.
  - **Opcjonalne**: Brak.
- **Request Body**: Brak (nie dotyczy dla metody GET).
- **Nagłówki**:
  - `Authorization`: `Bearer <token>` - Wymagany token JWT do uwierzytelnienia użytkownika.

## 3. Wykorzystywane typy
- **DTO (Data Transfer Objects)**:
  - `AnalysisDetailsDto`: Główny obiekt odpowiedzi, zawierający wszystkie szczegóły analizy i listę rekomendacji.
    ```typescript
    interface RecommendationDto {
      id: string;
      ticker: string;
      action: string;
      reasoning: string;
      confidence: string | null;
    }

    interface AnalysisDetailsDto {
      id: string;
      analysisDate: string;
      portfolioValue: number;
      aiModel: string;
      analysisSummary: string;
      recommendations: RecommendationDto[];
    }
    ```
- **Modele walidacji (Zod)**:
  - `GetAnalysisParams`: Schemat do walidacji parametru `id` ze ścieżki URL.
    ```typescript
    import { z } from 'zod';

    export const GetAnalysisParams = z.object({
      id: z.string().uuid({ message: 'Analysis ID must be a valid UUID.' }),
    });
    ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  - Zwraca obiekt `AnalysisDetailsDto` w ciele odpowiedzi.
  ```json
  {
    "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "analysisDate": "2025-10-19T14:00:00Z",
    "portfolioValue": 125000.50,
    "aiModel": "claude-3-haiku-20240307",
    "analysisSummary": "Your portfolio is well-diversified but slightly over-exposed to the tech sector...",
    "recommendations": [
      {
        "id": "r1r2r3r4-e5f6-7890-1234-567890abcdef",
        "ticker": "AAPL",
        "action": "REDUCE",
        "reasoning": "The position has grown to be too large a percentage of your portfolio.",
        "confidence": "HIGH"
      }
    ]
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Jeśli `id` w URL nie jest poprawnym UUID.
  - `401 Unauthorized`: Jeśli token JWT jest nieprawidłowy lub go brakuje.
  - `404 Not Found`: Jeśli analiza o podanym `id` nie istnieje lub nie należy do użytkownika.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych
1. Użytkownik wysyła żądanie `GET` na adres `/api/v1/analyses/:id` z poprawnym tokenem JWT.
2. **Routing (Express.js)**: Żądanie jest kierowane do kontrolera obsługującego ten endpoint.
3. **Middleware uwierzytelniające**: Sprawdza ważność tokena JWT i dołącza dane użytkownika (w tym `userId`) do obiektu `req`.
4. **Middleware walidujące**: Używa schematu `GetAnalysisParams` (zod) do weryfikacji, czy `:id` jest poprawnym UUID.
5. **Kontroler**: Wywołuje metodę `getAnalysisDetails(userId, analysisId)` z `AnalysisService`.
6. **Serwis (`AnalysisService`)**:
   a. Buduje zapytanie do bazy danych Supabase, aby pobrać dane z tabeli `ai_analyses` wraz z powiązanymi rekordami z `ai_recommendations`.
   b. Zapytanie **musi** zawierać klauzulę `WHERE id = :analysisId AND user_id = :userId`, aby zapewnić izolację danych.
   c. Jeśli zapytanie nie zwróci wyników, serwis rzuca błąd `NotFoundError`.
   d. Mapuje wyniki z bazy na `AnalysisDetailsDto`, konwertując nazwy pól (np. `analysis_date` -> `analysisDate`).
   e. Zwraca DTO do kontrolera.
7. **Kontroler**: Otrzymuje DTO z serwisu i wysyła je jako odpowiedź JSON z kodem statusu `200 OK`.
8. **Obsługa błędów**: Jeśli na którymkolwiek etapie wystąpi błąd, jest on przechwytywany przez globalny `errorHandler`, który formatuje odpowiedź błędu i wysyła ją z odpowiednim kodem statusu.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Każde żądanie musi być uwierzytelnione za pomocą ważnego tokena JWT.
- **Autoryzacja**: Logika serwisu musi bezwzględnie weryfikować, czy zasób (`ai_analyses`) należy do użytkownika, którego `id` znajduje się w tokenie. Zapobiega to atakom typu Insecure Direct Object Reference (IDOR).
- **Walidacja danych wejściowych**: Parametr `id` jest walidowany jako UUID, co zapobiega potencjalnym atakom (np. SQL Injection, chociaż ORM/Query Builder w dużej mierze to ogranicza).

## 7. Rozważania dotyczące wydajności
- **Zapytania do bazy danych**: Należy zoptymalizować zapytanie do bazy danych, aby pobrać analizę i jej rekomendacje w jednym zapytaniu (np. używając `JOIN` lub zagnieżdżonych selekcji, które oferuje klient Supabase). Pozwoli to uniknąć problemu N+1 zapytań.
- **Indeksy**: Kolumny `id` i `user_id` w tabeli `ai_analyses` oraz `analysis_id` w `ai_recommendations` muszą być zindeksowane, aby zapewnić szybkie wyszukiwanie. Zgodnie z `db-plan.md`, są to klucze główne lub obce, więc domyślnie powinny mieć indeksy.

## 8. Etapy wdrożenia
1. **Struktura plików**: Utworzyć folder `backend/src/ai-analysis`, jeśli nie istnieje. W nim pliki: `analysis.router.ts`, `analysis.controller.ts`, `analysis.service.ts`, `analysis.validation.ts`.
2. **Typy i DTO**: Zdefiniować typy `AnalysisDetailsDto` i `RecommendationDto` w pliku `backend/src/ai-analysis/analysis.types.ts`.
3. **Walidacja (Zod)**: W pliku `analysis.validation.ts` zdefiniować schemat `GetAnalysisParams`.
4. **Serwis (`AnalysisService`)**:
   - Zaimplementować metodę `getAnalysisDetails(userId: string, analysisId: string)`.
   - Użyć klienta Supabase do wykonania zapytania pobierającego analizę i rekomendacje.
   - Zaimplementować logikę sprawdzania własności zasobu (`user_id`).
   - Dodać obsługę błędu `NotFoundError`.
   - Zmapować wyniki na `AnalysisDetailsDto`.
5. **Kontroler (`AnalysisController`)**:
   - Stworzyć metodę `getAnalysisById`.
   - Wywołać metodę serwisu, przekazując `id` użytkownika z `req.user` i `id` analizy z `req.params`.
   - Wysłać odpowiedź `200 OK` z danymi lub przekazać błąd do `errorHandler`.
6. **Router (`analysis.router.ts`)**:
   - Zdefiniować trasę `GET /:id`.
   - Zastosować middleware uwierzytelniający, middleware walidujący (dla `req.params`) oraz metodę kontrolera.
7. **Integracja z aplikacją**: Zarejestrować `analysis.router.ts` w głównym pliku aplikacji (`app.ts`) pod ścieżką `/api/v1/analyses`.
8. **Testy jednostkowe**:
   - Napisać testy dla `AnalysisService`, mockując klienta Supabase. Sprawdzić poprawność pobierania danych, weryfikację `userId` oraz obsługę błędu `NotFoundError`.
9. **Testy integracyjne (API)**:
   - Napisać testy dla endpointu przy użyciu `supertest`.
   - Przetestować scenariusz sukcesu (200 OK), błędu autoryzacji (401), próby dostępu do cudzych danych (404) oraz nieprawidłowego ID (400).

---

# API Endpoint Implementation Plan: POST /analyses

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest zainicjowanie nowej, asynchronicznej analizy AI portfela inwestycyjnego użytkownika. Endpoint najpierw weryfikuje, czy użytkownik spełnia warunki (posiada strategię inwestycyjną, nie przekroczył limitu analiz), a następnie uruchamia proces analizy w tle. Natychmiast zwraca odpowiedź `202 Accepted`, informując, że zadanie zostało przyjęte do realizacji.

## 2. Szczegóły żądania
- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/v1/analyses`
- **Parametry**: Brak.
- **Request Body**: Puste (`{}`).
- **Nagłówki**:
  - `Authorization`: `Bearer <token>` - Wymagany token JWT do uwierzytelnienia.

## 3. Wykorzystywane typy
- **DTO (Data Transfer Objects)**:
  - `AnalysisInitiatedDto`: Obiekt odpowiedzi po pomyślnym zainicjowaniu analizy.
    ```typescript
    interface AnalysisInitiatedDto {
      message: string;
      analysisId: string;
    }
    ```
- **Modele walidacji (Zod)**: Nie dotyczy, ponieważ ciało żądania jest puste.

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (202 Accepted)**:
  - Zwraca obiekt `AnalysisInitiatedDto`, potwierdzający przyjęcie zadania.
  ```json
  {
    "message": "Portfolio analysis has been initiated. The result will be available shortly.",
    "analysisId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  }
  ```
- **Odpowiedzi błędów**:
  - `401 Unauthorized`: Jeśli token JWT jest nieprawidłowy lub go brakuje.
  - `402 Payment Required`: Jeśli użytkownik nie zdefiniował jeszcze swojej strategii inwestycyjnej.
  - `429 Too Many Requests`: Jeśli użytkownik przekroczył dzienny limit analiz.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych
1.  Użytkownik wysyła żądanie `POST` na adres `/api/v1/analyses` z tokenem JWT.
2.  **Routing (Express.js)**: Żądanie trafia do kontrolera `AnalysisController`.
3.  **Middleware uwierzytelniające**: Weryfikuje token i dołącza `userId` do obiektu `req`.
4.  **Kontroler**: Wywołuje metodę `triggerAnalysis(userId)` z `AnalysisService`.
5.  **Serwis (`AnalysisService`) - Faza synchroniczna**:
    a. **Sprawdzenie limitu zapytań**: Wywołuje logikę (np. z `RateLimitService`) weryfikującą dane w tabeli `user_rate_limits`. Jeśli limit został przekroczony, rzuca błąd `TooManyRequestsError`.
    b. **Sprawdzenie strategii**: Sprawdza w tabeli `investment_strategies`, czy istnieje strategia dla danego `userId`. Jeśli nie, rzuca błąd `PreconditionFailedError` (mapowany na status 402).
    c. **Inicjalizacja analizy**: Tworzy wstępny rekord w tabeli `ai_analyses` z danymi użytkownika i wartością portfela (obliczoną w tym momencie). Zapisuje `analysisId`.
    d. **Uruchomienie zadania w tle**: Wywołuje asynchroniczną funkcję `performBackgroundAnalysis(userId, analysisId)`, nie czekając na jej zakończenie.
    e. Zwraca `analysisId` do kontrolera.
6.  **Kontroler**: Otrzymuje `analysisId`, tworzy obiekt `AnalysisInitiatedDto` i wysyła odpowiedź `202 Accepted`.
7.  **Serwis (`AnalysisService`) - Faza asynchroniczna (`performBackgroundAnalysis`)**:
    a. **Gromadzenie danych**: Pobiera wszystkie niezbędne dane do analizy: pozycje w portfelu (`user_portfolio_positions`), historię transakcji (`transactions`) i strategię inwestycyjną użytkownika (`investment_strategies`).
    b. **Generowanie promptu**: Tworzy szczegółowy prompt dla modelu AI (np. Claude Haiku), zawierający zebrane dane i instrukcje.
    c. **Komunikacja z AI**: Wysyła prompt do zewnętrznego API AI.
    d. **Przetwarzanie odpowiedzi**: Parsuje odpowiedź z AI, aby wyodrębnić podsumowanie i rekomendacje.
    e. **Aktualizacja bazy danych**: Aktualizuje rekord w `ai_analyses` o podsumowanie, dane o tokenach i koszcie. Tworzy nowe rekordy w `ai_recommendations` dla każdej rekomendacji. Aktualizuje `user_rate_limits`.
    f. **Obsługa błędów w tle**: W przypadku błędu (np. API AI jest niedostępne), loguje błąd i ewentualnie oznacza analizę jako `FAILED` w bazie danych (wymagałoby to dodania kolumny `status`).

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp jest chroniony przez middleware sprawdzający token JWT.
- **Rate Limiting**: Kluczowy mechanizm chroniący przed nadużyciami i niekontrolowanymi kosztami API AI. Logika musi poprawnie implementować sprawdzanie i inkrementację liczników w tabeli `user_rate_limits`.
- **Bezpieczeństwo danych**: Należy upewnić się, że żadne wrażliwe dane osobowe (PII) nie są wysyłane do zewnętrznego API AI.
- **Zarządzanie sekretami**: Klucze API do usług AI muszą być przechowywane bezpiecznie jako zmienne środowiskowe i nigdy nie mogą być umieszczane w kodzie źródłowym.

## 7. Rozważania dotyczące wydajności
- **Asynchroniczność**: Kluczowe jest, aby proces analizy był w pełni asynchroniczny i nie blokował pętli zdarzeń Node.js. Czas odpowiedzi endpointu powinien być bardzo krótki.
- **System kolejek**: Dla bardziej zaawansowanego rozwiązania (poza MVP), proces analizy w tle powinien być zarządzany przez system kolejek (np. BullMQ z Redisem), co zapewni większą niezawodność i skalowalność.
- **Zapytania do bazy danych**: Gromadzenie danych do analizy powinno być zoptymalizowane, aby zminimalizować liczbę zapytań do bazy danych.

## 8. Etapy wdrożenia
1.  **Struktura plików**: Utworzyć pliki `analysis.router.ts`, `analysis.controller.ts`, `analysis.service.ts` w `backend/src/ai-analysis`, jeśli nie istnieją.
2.  **Typy i DTO**: Zdefiniować `AnalysisInitiatedDto` w `analysis.types.ts`.
3.  **Serwis (`AnalysisService`)**:
    -   Zaimplementować logikę sprawdzania limitów i strategii.
    -   Stworzyć metodę `triggerAnalysis`, która zarządza przepływem synchronicznym.
    -   Stworzyć prywatną, asynchroniczną metodę `performBackgroundAnalysis` do logiki w tle.
4.  **Kontroler (`AnalysisController`)**:
    -   Stworzyć metodę `triggerNewAnalysis`.
    -   Wywołać serwis i zwrócić odpowiedź `202 Accepted`.
5.  **Router (`analysis.router.ts`)**:
    -   Zdefiniować trasę `POST /`.
    -   Zastosować middleware uwierzytelniający i metodę kontrolera.
6.  **Integracja z aplikacją**: Zarejestrować router w `app.ts`.
7.  **Obsługa błędów**: Zdefiniować niestandardowe klasy błędów (np. `TooManyRequestsError`, `PreconditionFailedError`) i zaktualizować globalny `errorHandler`, aby je obsługiwał.
8.  **Testy jednostkowe**:
    -   Napisać testy dla `AnalysisService`, mockując zależności (baza danych, API AI). Sprawdzić logikę walidacji warunków wstępnych.
9.  **Testy integracyjne (API)**:
    -   Napisać testy dla endpointu przy użyciu `supertest`.
    -   Przetestować scenariusz sukcesu (202), błędu braku strategii (402), przekroczenia limitu (429) i braku autoryzacji (401).

---

# API Endpoint Implementation Plan: GET /analyses

## 1. Przegląd punktu końcowego
Celem tego punktu końcowego jest umożliwienie uwierzytelnionym użytkownikom pobierania paginowanej listy ich historycznych analiz AI. Endpoint wspiera paginację za pomocą parametrów `page` i `limit`, co pozwala na efektywne przeglądanie dużej liczby wyników. Każdy element na liście zawiera kluczowe podsumowanie analizy.

## 2. Szczegóły żądania
- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/v1/analyses`
- **Parametry**:
  - **Wymagane**: Brak.
  - **Opcjonalne (Query Params)**:
    - `page` (number): Numer strony do pobrania. Domyślnie `1`.
    - `limit` (number): Liczba wyników na stronie. Domyślnie `10`, maksymalnie `100`.
- **Request Body**: Brak.
- **Nagłówki**:
  - `Authorization`: `Bearer <token>` - Wymagany token JWT do uwierzytelnienia.

## 3. Wykorzystywane typy
- **DTO (Data Transfer Objects)**:
  - `AnalysisListItemDto`: Reprezentuje pojedynczą analizę na liście.
    ```typescript
    interface AnalysisListItemDto {
      id: string;
      analysisDate: string;
      portfolioValue: number;
      aiModel: string;
    }
    ```
  - `PaginatedAnalysesDto`: Główny obiekt odpowiedzi zawierający dane i informacje o paginacji.
    ```typescript
    interface PaginationDetails {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    }

    interface PaginatedAnalysesDto {
      data: AnalysisListItemDto[];
      pagination: PaginationDetails;
    }
    ```
- **Modele walidacji (Zod)**:
  - `GetAnalysesQuery`: Schemat do walidacji parametrów `page` i `limit`.
    ```typescript
    import { z } from 'zod';

    export const GetAnalysesQuery = z.object({
      page: z.coerce.number().int().positive().optional().default(1),
      limit: z.coerce.number().int().positive().max(100).optional().default(10),
    });
    ```

## 4. Szczegóły odpowiedzi
- **Odpowiedź sukcesu (200 OK)**:
  - Zwraca obiekt `PaginatedAnalysesDto`. Jeśli użytkownik nie ma żadnych analiz, `data` będzie pustą tablicą.
  ```json
  {
    "data": [
      {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "analysisDate": "2025-10-19T14:00:00Z",
        "portfolioValue": 125000.50,
        "aiModel": "claude-3-haiku-20240307"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "itemsPerPage": 10
    }
  }
  ```
- **Odpowiedzi błędów**:
  - `400 Bad Request`: Jeśli `page` lub `limit` są nieprawidłowe (np. nie są liczbami, są ujemne).
  - `401 Unauthorized`: Jeśli token JWT jest nieprawidłowy lub go brakuje.
  - `500 Internal Server Error`: W przypadku nieoczekiwanych błędów serwera.

## 5. Przepływ danych
1. Użytkownik wysyła żądanie `GET` na adres `/api/v1/analyses` z tokenem JWT.
2. **Routing (Express.js)**: Żądanie trafia do kontrolera `AnalysisController`.
3. **Middleware uwierzytelniające**: Weryfikuje token i dołącza `userId` do obiektu `req`.
4. **Middleware walidujące**: Używa schematu `GetAnalysesQuery` do walidacji i normalizacji `req.query.page` i `req.query.limit`.
5. **Kontroler**: Wywołuje metodę `getAnalyses(userId, page, limit)` z `AnalysisService`.
6. **Serwis (`AnalysisService`)**:
   a. Oblicza `offset` dla paginacji: `(page - 1) * limit`.
   b. Wykonuje dwa równoległe zapytania do Supabase, oba filtrowane po `userId`:
      i. Pobranie listy analiz z tabeli `ai_analyses` z użyciem `limit` i `offset`, sortując wyniki od najnowszych (`ORDER BY analysis_date DESC`).
      ii. Zliczenie wszystkich rekordów w `ai_analyses` dla danego `userId` (`COUNT`).
   c. Na podstawie wyników zliczenia oblicza `totalPages`.
   d. Mapuje pobrane rekordy na tablicę `AnalysisListItemDto[]`.
   e. Konstruuje i zwraca obiekt `PaginatedAnalysesDto`.
7. **Kontroler**: Otrzymuje DTO i wysyła je jako odpowiedź JSON z kodem statusu `200 OK`.
8. **Obsługa błędów**: Globalny `errorHandler` przechwytuje błędy i wysyła odpowiednie odpowiedzi.

## 6. Względy bezpieczeństwa
- **Uwierzytelnianie**: Dostęp jest chroniony przez middleware sprawdzający token JWT.
- **Autoryzacja**: Wszystkie zapytania do bazy danych muszą być filtrowane po `userId` z tokena, aby zapobiec dostępowi do danych innych użytkowników.
- **Ograniczenie zasobów (Rate Limiting)**: Chociaż nie jest to wymagane w specyfikacji dla tego endpointu, można rozważyć dodanie ogólnego rate limitera dla API, aby chronić przed atakami DoS.
- **Walidacja wejścia**: Ograniczenie `limit` do maksymalnej wartości `100` zapobiega nadmiernemu obciążeniu bazy danych przez żądanie zbyt dużej liczby wyników naraz.

## 7. Rozważania dotyczące wydajności
- **Paginacja**: Paginacja po stronie serwera jest kluczowa dla wydajności i skalowalności.
- **Indeksy**: Kolumna `user_id` w tabeli `ai_analyses` musi być zindeksowana, aby przyspieszyć filtrowanie. Indeks na `analysis_date` przyspieszy sortowanie.
- **Równoległe zapytania**: Wykonywanie zapytań o dane i o liczbę wszystkich elementów (`COUNT`) równolegle (np. przez `Promise.all`) skróci całkowity czas odpowiedzi.

## 8. Etapy wdrożenia
1. **Typy i DTO**: Zdefiniować typy `AnalysisListItemDto`, `PaginationDetails` i `PaginatedAnalysesDto` w `backend/src/ai-analysis/analysis.types.ts`.
2. **Walidacja (Zod)**: W pliku `analysis.validation.ts` zdefiniować schemat `GetAnalysesQuery` z ograniczeniem `max(100)` dla `limit`.
3. **Serwis (`AnalysisService`)**:
   - Zaimplementować metodę `getAnalyses(userId: string, page: number, limit: number)`.
   - Dodać logikę do równoległego pobierania danych i zliczania rekordów z Supabase.
   - Zaimplementować mapowanie wyników na DTO i konstruowanie obiektu `PaginatedAnalysesDto`.
4. **Kontroler (`AnalysisController`)**:
   - Stworzyć metodę `getAnalyses`.
   - Wywołać metodę serwisu, przekazując `id` użytkownika oraz `page` i `limit` z walidowanego `req.query`.
   - Wysłać odpowiedź `200 OK` z danymi.
5. **Router (`analysis.router.ts`)**:
   - Zdefiniować trasę `GET /`.
   - Zastosować middleware uwierzytelniający, walidujący (dla `req.query`) oraz metodę kontrolera.
6. **Testy jednostkowe**:
   - Napisać testy dla `AnalysisService`, mockując klienta Supabase. Sprawdzić poprawność obliczeń paginacji, filtrowanie po `userId` i mapowanie DTO.
7. **Testy integracyjne (API)**:
   - Napisać testy dla endpointu przy użyciu `supertest`.
   - Przetestować scenariusz domyślnej paginacji, paginacji z parametrami, obsługę pustej listy, błędy walidacji (np. `limit > 100`) oraz błąd autoryzacji.
