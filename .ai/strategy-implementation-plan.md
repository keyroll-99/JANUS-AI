# API Endpoint Implementation Plan: /strategy

## 1. Przegląd punktu końcowego
Ten dokument opisuje plan wdrożenia dla punktu końcowego `/api/v1/strategy`. Endpoint ten zarządza strategią inwestycyjną użytkownika, umożliwiając jej tworzenie, odczytywanie i aktualizowanie. Wszystkie operacje wymagają uwierzytelnienia i są ograniczone do danych zalogowanego użytkownika.

## 2. Szczegóły żądania
-   **Metody HTTP**: `GET`, `POST`, `PUT`
-   **Struktura URL**: `/api/v1/strategy`
-   **Uwierzytelnienie**: Wymagany `Bearer <JWT>` w nagłówku `Authorization`.

### GET /strategy
-   **Opis**: Pobiera strategię inwestycyjną zalogowanego użytkownika.
-   **Parametry**: Brak.
-   **Ciało żądania**: Brak.

### POST /strategy
-   **Opis**: Tworzy nową strategię inwestycyjną dla zalogowanego użytkownika.
-   **Parametry**: Brak.
-   **Ciało żądania**:
    ```json
    {
      "timeHorizon": "LONG",
      "riskLevel": "MEDIUM",
      "investmentGoals": "Długoterminowy wzrost i dochód z dywidend."
    }
    ```

### PUT /strategy
-   **Opis**: Aktualizuje istniejącą strategię inwestycyjną zalogowanego użytkownika.
-   **Parametry**: Brak.
-   **Ciało żądania**: Struktura identyczna jak w `POST /strategy`.

## 3. Wykorzystywane typy
Zostaną zdefiniowane następujące typy DTO w pliku `backend/src/strategies/strategies.types.ts`:

-   **`StrategyDto`**: Używany do walidacji danych przychodzących z `POST` i `PUT`.
    ```typescript
    import { z } from 'zod';

    export const strategySchema = z.object({
      timeHorizon: z.enum(['SHORT', 'MEDIUM', 'LONG']),
      riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']),
      investmentGoals: z.string().min(10).max(500),
    });

    export type StrategyDto = z.infer<typeof strategySchema>;
    ```

-   **`StrategyResponseDto`**: Używany do formatowania danych wychodzących.
    ```typescript
    export type StrategyResponseDto = {
      id: string;
      timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
      riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
      investmentGoals: string;
      updatedAt: string;
    };
    ```

## 4. Szczegóły odpowiedzi
-   **`GET /strategy`**:
    -   **`200 OK`**: Zwraca obiekt `StrategyResponseDto`.
    -   **`404 Not Found`**: Jeśli użytkownik nie ma strategii.
-   **`POST /strategy`**:
    -   **`201 Created`**: Zwraca nowo utworzony obiekt `StrategyResponseDto`.
    -   **`409 Conflict`**: Jeśli strategia dla użytkownika już istnieje.
-   **`PUT /strategy`**:
    -   **`200 OK`**: Zwraca zaktualizowany obiekt `StrategyResponseDto`.
    -   **`404 Not Found`**: Jeśli strategia do aktualizacji nie istnieje.
-   **Wszystkie metody**:
    -   **`400 Bad Request`**: Błąd walidacji danych wejściowych.
    -   **`401 Unauthorized`**: Brak lub nieprawidłowy token JWT.
    -   **`500 Internal Server Error`**: Wewnętrzny błąd serwera.

## 5. Przepływ danych
1.  Żądanie trafia na serwer Express.js.
2.  **Middleware `authMiddleware`**: Weryfikuje token JWT i dołącza obiekt `user` (zawierający `id`) do obiektu `req`.
3.  **Middleware `validationMiddleware`** (dla `POST`/`PUT`): Waliduje ciało żądania przy użyciu `strategySchema` z Zod.
4.  **`StrategyController`**: Odbiera żądanie. Wywołuje odpowiednią metodę w `StrategyService`, przekazując `user.id` oraz `StrategyDto`.
5.  **`StrategyService`**:
    -   Implementuje logikę biznesową (np. sprawdza, czy strategia już istnieje przed utworzeniem).
    -   Wywołuje metody z `StrategyRepository` w celu interakcji z bazą danych.
    -   Mapuje wynik z repozytorium na `StrategyResponseDto`.
6.  **`StrategyRepository`**: Wykonuje operacje CRUD na tabeli `investment_strategies` w bazie Supabase, zawsze filtrując po `user_id`.
7.  Odpowiedź jest zwracana przez łańcuch wywołań do klienta. Błędy są przechwytywane przez globalny `errorHandler`.

## 6. Względy bezpieczeństwa
-   **Uwierzytelnianie**: Każde żądanie do `/strategy` musi przejść przez `authMiddleware`, aby zapewnić, że użytkownik jest zalogowany.
-   **Autoryzacja**: Wszystkie operacje w `StrategyRepository` muszą zawierać klauzulę `WHERE user_id = :userId`, aby uniemożliwić dostęp do danych innych użytkowników. `userId` musi pochodzić z zaufanego źródła (tokena JWT).
-   **Walidacja danych**: Rygorystyczna walidacja za pomocą Zod chroni przed nieprawidłowymi danymi i potencjalnymi atakami (np. XSS w `investmentGoals`).

## 7. Rozważania dotyczące wydajności
-   Operacje na tym endpoincie są proste (CRUD) i nie powinny stanowić wąskiego gardła wydajnościowego.
-   Zapytania do bazy danych muszą mieć założony indeks na kolumnie `user_id` w tabeli `investment_strategies`, aby zapewnić szybkie wyszukiwanie.
-   Liczba zapytań do bazy danych na jedno żądanie jest zminimalizowana do jednego lub dwóch (np. `POST` może najpierw sprawdzić istnienie, a potem wstawić).

## 8. Etapy wdrożenia
1.  **Struktura plików**: Utworzyć folder `backend/src/strategies` z plikami: `strategies.routes.ts`, `strategies.controller.ts`, `strategies.service.ts`, `strategies.repository.ts`, `strategies.types.ts`.
2.  **Typy i walidacja**: Zdefiniować `StrategyDto`, `StrategyResponseDto` oraz `strategySchema` w `strategies.types.ts`.
3.  **Repozytorium (`StrategyRepository`)**: Zaimplementować metody do interakcji z tabelą `investment_strategies` w Supabase:
    -   `findByUserId(userId: string)`
    -   `create(userId: string, data: StrategyDto)`
    -   `update(userId: string, data: StrategyDto)`
4.  **Serwis (`StrategyService`)**: Zaimplementować logikę biznesową:
    -   `getStrategy(userId: string)`: Pobiera strategię, rzuca `AppError(404)`, jeśli nie znaleziono.
    -   `createStrategy(userId: string, data: StrategyDto)`: Sprawdza istnienie strategii (rzuca `AppError(409)`), a następnie tworzy nową.
    -   `updateStrategy(userId: string, data: StrategyDto)`: Sprawdza istnienie strategii (rzuca `AppError(404)`), a następnie ją aktualizuje.
5.  **Kontroler (`StrategyController`)**: Zaimplementować metody obsługujące żądania HTTP, wywołujące serwis i wysyłające odpowiedzi.
6.  **Routing (`strategies.routes.ts`)**: Zdefiniować trasy `GET /`, `POST /`, `PUT /` i podpiąć odpowiednie middleware (`authMiddleware`, `validationMiddleware`) oraz metody kontrolera.
7.  **Integracja**: Zarejestrować `strategyRouter` w głównym pliku aplikacji (`app.ts`) pod ścieżką `/api/v1/strategy`.
8.  **Testy**: Napisać testy jednostkowe dla `StrategyService` i testy integracyjne dla endpointów API, aby zweryfikować poprawność działania, obsługę błędów i bezpieczeństwo.
