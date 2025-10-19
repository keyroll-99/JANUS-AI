# Transactions Module

## Przegląd
Moduł `transactions` obsługuje wszystkie operacje związane z transakcjami inwestycyjnymi użytkownika. Umożliwia tworzenie, odczyt, aktualizację i usuwanie transakcji oraz import danych z plików Excel generowanych przez XTB.

## Struktura plików

```
transactions/
├── transaction.types.ts      # DTOs, typy, schematy walidacji Zod
├── transaction.routes.ts     # Definicje endpointów REST API
├── transaction.controller.ts # Obsługa żądań HTTP
├── transaction.service.ts    # Logika biznesowa i komunikacja z bazą danych
└── README.md                # Ten plik
```

## Endpoints

### GET /api/v1/transactions
Pobiera paginowaną listę transakcji użytkownika z opcjonalnym filtrowaniem i sortowaniem.

**Query Parameters:**
- `page` (number, default: 1) - Numer strony
- `limit` (number, default: 20, max: 100) - Liczba wyników na stronę
- `sortBy` (string, default: 'transaction_date') - Pole sortowania
- `order` (string, default: 'desc') - Kierunek sortowania ('asc' | 'desc')
- `type` (string, optional) - Filtrowanie po typie transakcji
- `ticker` (string, optional) - Filtrowanie po symbolu

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "transactionDate": "2025-01-15T10:30:00Z",
      "transactionType": "BUY",
      "accountType": "STANDARD",
      "ticker": "AAPL",
      "quantity": 10,
      "price": 150.50,
      "totalAmount": 1505.00,
      "commission": 5.00,
      "notes": null,
      "importedFromFile": false,
      "importBatchId": null,
      "createdAt": "2025-01-15T10:30:00Z",
      "updatedAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "totalItems": 100,
    "totalPages": 5,
    "currentPage": 1,
    "limit": 20
  }
}
```

### GET /api/v1/transactions/:id
Pobiera pojedynczą transakcję po ID.

**Response:** `200 OK` - Obiekt `TransactionDto`

**Errors:**
- `404 Not Found` - Transakcja nie istnieje lub nie należy do użytkownika

### POST /api/v1/transactions
Tworzy nową transakcję ręcznie.

**Request Body:**
```json
{
  "transactionDate": "2025-01-15T10:30:00Z",
  "transactionTypeId": 1,
  "accountTypeId": 1,
  "ticker": "AAPL",
  "quantity": 10,
  "price": 150.50,
  "totalAmount": 1505.00,
  "commission": 5.00,
  "notes": "Optional note"
}
```

**Response:** `201 Created` - Nowo utworzony obiekt `TransactionDto`

### PUT /api/v1/transactions/:id
Aktualizuje istniejącą transakcję (wszystkie pola opcjonalne).

**Request Body:** Obiekt `UpdateTransactionDto`

**Response:** `200 OK` - Zaktualizowany obiekt `TransactionDto`

**Errors:**
- `404 Not Found` - Transakcja nie istnieje lub nie należy do użytkownika

### DELETE /api/v1/transactions/:id
Usuwa transakcję.

**Response:** `204 No Content`

**Errors:**
- `404 Not Found` - Transakcja nie istnieje lub nie należy do użytkownika

### POST /api/v1/transactions/import-xtb
Importuje transakcje z pliku Excel wygenerowanego przez XTB.

**Request:** `multipart/form-data` z polem `file`

**Response:** `201 Created`
```json
{
  "message": "Successfully imported X transactions",
  "importedCount": 42,
  "importBatchId": "uuid"
}
```

**Errors:**
- `422 Unprocessable Entity` - Nieprawidłowy format pliku lub błędy walidacji danych

## Bezpieczeństwo

- Wszystkie endpointy wymagają uwierzytelnienia (`requireAuth` middleware)
- Każda operacja filtruje dane po `userId` z zweryfikowanego tokenu JWT
- Walidacja wszystkich danych wejściowych przez schematy Zod
- Ochrona przed IDOR - użytkownicy mogą uzyskać dostęp tylko do swoich transakcji

## Status implementacji

✅ **Zakończone:**
- Struktura plików i folderów
- Typy i DTOs z walidacją Zod
- Routing z middlewarami
- Controller z obsługą wszystkich endpointów
- Integracja z główną aplikacją (`app.ts`)
- Rozszerzenie middleware `validateDto` o obsługę query i params
- **Service layer - metody CRUD:**
  - ✅ `getTransactions()` - paginacja, filtrowanie, sortowanie
  - ✅ `getTransactionById()` - z weryfikacją własności
  - ✅ `createTransaction()` - z walidacją i normalizacją danych
  - ✅ `updateTransaction()` - z weryfikacją własności i partial update
  - ✅ `deleteTransaction()` - z weryfikacją własności
- **Import z XTB Excel:**
  - ✅ Konfiguracja multer dla upload plików (memory storage, 10MB limit)
  - ✅ Parser XTB Excel (`xtb-parser.ts`)
  - ✅ Mapowanie typów transakcji XTB na nasze typy
  - ✅ Mapowanie typów kont (MAIN/IKE/IKZE) z komentarzy
  - ✅ Ekstrakcja quantity i price z komentarzy
  - ✅ Batch insert z walidacją
  - ✅ Generowanie `import_batch_id` dla grupowania transakcji
  - ✅ Implementacja `importFromXtb()` w serwisie
- **Testy jednostkowe (61 testów - wszystkie przechodzą):**
  - ✅ TransactionService (14 testów):
    - getTransactions - happy path, filtrowanie, błędy
    - getTransactionById - happy path, 404 error
    - createTransaction - happy path, błędy
    - updateTransaction - happy path, 404, partial update, błędy
    - deleteTransaction - happy path, 404, błędy
  - ✅ XtbParser (20 testów):
    - mapTransactionType - wszystkie typy XTB
    - mapAccountType - MAIN, IKE, IKZE
    - extractQuantity - różne formaty
    - extractPrice - różne formaty
  - ✅ Auth tests (24 testy)
  - ✅ Config tests (3 testy)

⏳ **Do zaimplementowania (opcjonalne ulepszenia):**
- Testy integracyjne dla endpointa `/import-xtb`
- Obsługa duplikatów przy importie (sprawdzanie czy transakcja już istnieje)
- Parsowanie innych arkuszy z XTB (OPEN POSITIONS, CLOSED POSITIONS)
- Rate limiting dla importu
- Progress tracking dla dużych importów

## Funkcjonalności

### Import z XTB Excel

Endpoint `POST /api/v1/transactions/import-xtb` obsługuje import transakcji z pliku Excel wygenerowanego przez XTB Station.

**Wspierane typy transakcji:**
- Stock purchase → BUY
- Stock sale → SELL
- Dividend → DIVIDEND
- Deposit/BLIK/Transfer in → DEPOSIT
- Withdrawal/Transfer out → WITHDRAWAL
- Fee/Commission → FEE

**Automatyczne wykrywanie typu konta:**
- Domyślnie: MAIN
- Gdy w komentarzu jest "IKE": IKE
- Gdy w komentarzu jest "IKZE": IKZE

**Ekstrakcja danych z komentarzy:**
- Quantity: parsowanie z "OPEN BUY 10 @ 150.50"
- Price: parsowanie z "@ 150.50"
- Wszystkie transakcje z jednego importu są grupowane przez `import_batch_id`

## Następne kroki (opcjonalne)

1. **Testy integracyjne:**
   - Test uploadu pliku Excel
   - Test parsowania i importu
   - Test obsługi błędów (nieprawidłowy format, brak pliku)

2. **Rozszerzenie funkcjonalności:**
   - Deduplikacja transakcji
   - Import z innych źródeł (Freedom24, Revolut)
   - Eksport transakcji do CSV/Excel

3. **Dokumentacja API (OpenAPI/Swagger)** - opcjonalnie
