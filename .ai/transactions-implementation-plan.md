# API Endpoint Implementation Plan: /transactions

## 1. Przegląd punktu końcowego
Ten plan opisuje implementację punktów końcowych REST API dla zasobu `transactions`. Obejmuje on pełne operacje CRUD (Create, Read, Update, Delete) oraz funkcjonalność importu transakcji z plików Excel generowanych przez XTB. Wszystkie operacje wymagają uwierzytelnienia użytkownika.

## 2. Szczegóły żądania
- **Metody HTTP**: `GET`, `POST`, `PUT`, `DELETE`
- **Struktura URL**: `/api/v1/transactions`, `/api/v1/transactions/:id`, `/api/v1/transactions/import-xtb`
- **Parametry**:
  - **Path**:
    - `id` (UUID): Wymagany dla `GET /:id`, `PUT /:id`, `DELETE /:id`.
  - **Query** (`GET /transactions`):
    - Wymagane: Brak.
    - Opcjonalne:
      - `page` (number, default: 1): Numer strony do paginacji.
      - `limit` (number, default: 20): Liczba wyników na stronę.
      - `sortBy` (string, default: 'transaction_date'): Pole do sortowania.
      - `order` (string, default: 'desc'): Kierunek sortowania ('asc' lub 'desc').
      - `type` (string): Filtrowanie po typie transakcji (np. 'BUY').
      - `ticker` (string): Filtrowanie po symbolu giełdowym.
- **Request Body**:
  - `POST /transactions`: Wymaga obiektu `CreateTransactionDto`.
  - `PUT /transactions/:id`: Wymaga obiektu `UpdateTransactionDto` (wszystkie pola opcjonalne).
  - `POST /transactions/import-xtb`: Wymaga `multipart/form-data` z polem `file`.

## 3. Wykorzystywane typy
- **DTOs (Data Transfer Objects)**:
  - `TransactionDto`: Obiekt reprezentujący pojedynczą transakcję zwracany do klienta. Zawiera pola przyjazne dla frontendu (np. `transactionType: 'BUY'`).
  - `PaginationDto`: Obiekt zawierający metadane paginacji (`totalItems`, `totalPages`, `currentPage`, `limit`).
  - `PaginatedTransactionsDto`: Obiekt odpowiedzi dla `GET /transactions`, składający się z `data: TransactionDto[]` i `pagination: PaginationDto`.
- **Command Models / Input DTOs (z walidacją Zod)**:
  - `GetTransactionsQuerySchema`: Schemat Zod do walidacji parametrów query dla `GET /transactions`.
  - `CreateTransactionDtoSchema`: Schemat Zod do walidacji ciała żądania `POST /transactions`.
  - `UpdateTransactionDtoSchema`: Schemat Zod do walidacji ciała żądania `PUT /transactions/:id`.

## 4. Szczegóły odpowiedzi
- **`GET /transactions` (200 OK)**: Zwraca obiekt `PaginatedTransactionsDto`.
- **`POST /transactions` (201 Created)**: Zwraca nowo utworzony obiekt `TransactionDto`.
- **`POST /transactions/import-xtb` (201 Created)**: Zwraca obiekt z podsumowaniem importu: `{ message, importedCount, importBatchId }`.
- **`GET /transactions/:id` (200 OK)**: Zwraca pojedynczy obiekt `TransactionDto`.
- **`PUT /transactions/:id` (200 OK)**: Zwraca zaktualizowany obiekt `TransactionDto`.
- **`DELETE /transactions/:id` (204 No Content)**: Zwraca pustą odpowiedź.

## 5. Przepływ danych
1.  Żądanie od klienta (np. przeglądarki) trafia do `TransactionController`, zawierając w nagłówku `Authorization: Bearer <token>` token JWT uzyskany wcześniej bezpośrednio z Supabase Auth.
2.  Middleware uwierzytelniający (`passport-jwt`) przechwytuje żądanie:
    -   Weryfikuje sygnaturę tokenu JWT przy użyciu sekretu JWT z Supabase.
    -   Jeśli token jest prawidłowy, wyodrębnia z niego `user_id` (z pola `sub`) i dołącza do obiektu `request` (np. `req.user`).
    -   W przypadku niepowodzenia walidacji, zwraca błąd `401 Unauthorized`.
3.  Middleware walidacyjny (oparty na Zod) sprawdza poprawność parametrów żądania (query, path, body).
4.  Kontroler wywołuje odpowiednią metodę w `TransactionService`, przekazując zweryfikowane dane oraz `user.id` z obiektu `req.user`.
5.  `TransactionService` wykonuje logikę biznesową:
    -   Sprawdza uprawnienia, upewniając się, że `user_id` w zapytaniach do bazy danych odpowiada `user.id` z tokenu.
    -   Komunikuje się z bazą danych (Supabase) w celu wykonania operacji CRUD.
    -   W przypadku importu, parsuje plik Excel, waliduje jego zawartość i wykonuje transakcję bazodanową.
    -   Mapuje wyniki z bazy danych na obiekty DTO.
6.  `TransactionService` zwraca DTO do kontrolera.
7.  Kontroler wysyła odpowiedź HTTP z odpowiednim kodem statusu i ciałem odpowiedzi.

## 6. Względy bezpieczeństwa
-   **Autoryzacja i Uwierzytelnianie**: Backend musi być skonfigurowany do walidacji tokenów JWT wydanych przez Supabase. Każda operacja w `TransactionService` musi filtrować dane po `user_id` pochodzącym z zweryfikowanego tokenu, aby zapobiec wyciekom danych i atakom IDOR.
-   **Walidacja danych wejściowych**: Rygorystyczna walidacja za pomocą Zod na poziomie kontrolera chroni przed błędami przetwarzania i atakami typu injection.
-   **Ograniczenie importu plików**: Endpoint `POST /transactions/import-xtb` musi mieć nałożone limity na rozmiar przesyłanego pliku oraz weryfikować jego typ (`mime-type`), aby zapobiec atakom DoS.
-   **Ochrona przed Mass Assignment**: Schematy Zod (`CreateTransactionDtoSchema`, `UpdateTransactionDtoSchema`) muszą jawnie definiować, które pola są dozwolone do zapisu/aktualizacji.
-   **Zarządzanie sekretami**: Klucz `SUPABASE_JWT_SECRET` oraz klucze API do Supabase muszą być zarządzane przez zmienne środowiskowe (`dotenv`) i nie mogą być umieszczane w kodzie źródłowym.

## 7. Obsługa błędów
Błędy będą przechwytywane przez globalny `errorHandler` middleware.
-   **400 Bad Request**: Zwracany w przypadku niepowodzenia walidacji Zod. Odpowiedź będzie zawierać szczegóły błędów walidacji.
-   **401 Unauthorized**: Zwracany przez middleware uwierzytelniający w przypadku braku lub nieprawidłowego tokenu JWT.
-   **403 Forbidden**: Zwracany przez `TransactionService`, gdy użytkownik próbuje uzyskać dostęp do cudzego zasobu.
-   **404 Not Found**: Zwracany, gdy transakcja o podanym `id` nie istnieje w bazie danych lub nie należy do użytkownika.
-   **422 Unprocessable Entity**: Zwracany przez `POST /transactions/import-xtb`, jeśli format pliku jest nieprawidłowy lub dane wewnątrz pliku nie przechodzą walidacji.
-   **500 Internal Server Error**: Zwracany w przypadku nieoczekiwanych błędów serwera (np. problem z połączeniem z bazą danych). Błąd zostanie zarejestrowany z pełnym stack trace.

## 8. Rozważania dotyczące wydajności
-   **Paginacja**: `GET /transactions` musi zawsze używać paginacji (`LIMIT` i `OFFSET` w zapytaniach SQL), aby uniknąć pobierania dużych zbiorów danych.
-   **Indeksy bazodanowe**: Należy upewnić się, że kolumny `user_id`, `transaction_date` i `ticker` w tabeli `transactions` są zindeksowane, aby przyspieszyć operacje filtrowania i sortowania.
-   **Import transakcyjny**: Proces importu wielu transakcji z pliku powinien być opakowany w pojedynczą transakcję bazodanową, aby zapewnić spójność danych i poprawić wydajność.

## 9. Etapy wdrożenia
1.  **Struktura plików**: Utworzenie folderu `backend/src/transactions` z plikami: `transaction.routes.ts`, `transaction.controller.ts`, `transaction.service.ts`, `transaction.validation.ts`, `transaction.types.ts`.
2.  **Typy i walidacja**: Zdefiniowanie typów DTO i Command Models w `transaction.types.ts`. Implementacja schematów walidacji Zod w `transaction.validation.ts`.
3.  **Routing**: Zdefiniowanie wszystkich tras w `transaction.routes.ts` i podłączenie ich do głównej aplikacji w `app.ts`.
4.  **Controller**: Implementacja `TransactionController` z metodami obsługującymi żądania HTTP, walidacją i wywołaniami serwisu.
5.  **Service**: Implementacja `TransactionService` z całą logiką biznesową, w tym:
    -   Metody CRUD interagujące z Supabase.
    -   Logika sprawdzania uprawnień (własności zasobu).
    -   Implementacja logiki importu z pliku Excel przy użyciu biblioteki `exceljs`.
6.  **Integracja z `errorHandler`**: Upewnienie się, że wszystkie błędy są poprawnie przechwytywane i obsługiwane przez globalny `errorHandler`.
7.  **Testy jednostkowe**: Utworzenie testów jednostkowych dla `TransactionService` z mockowaniem zależności (np. Supabase client).
8.  **Testy integracyjne/API**: Utworzenie testów dla `TransactionController` przy użyciu `supertest`, aby zweryfikować całościowe działanie punktów końcowych, włączając w to walidację i obsługę błędów.
9.  **Dokumentacja**: Zaktualizowanie dokumentacji API (np. w formacie OpenAPI/Swagger), jeśli jest używana w projekcie.
