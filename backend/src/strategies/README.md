# Strategies Module

Moduł zarządzający strategią inwestycyjną użytkownika.

## Przegląd

Strategies module implementuje endpoint `/api/v1/strategy` pozwalający użytkownikom na:
- Utworzenie strategii inwestycyjnej (horyzont czasowy, poziom ryzyka, cele)
- Odczytanie swojej strategii
- Aktualizację istniejącej strategii

## Struktura

```
strategies/
├── strategies.types.ts      # Typy i schematy walidacji (Zod)
├── strategies.service.ts    # Logika biznesowa + komunikacja z Supabase
├── strategies.controller.ts # Obsługa HTTP requests
├── strategies.routes.ts     # Definicja tras i middleware
└── README.md               # Ten plik
```

## API Endpoints

### GET /api/v1/strategy
Pobiera strategię inwestycyjną zalogowanego użytkownika.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response 200:**
```json
{
  "id": "uuid",
  "timeHorizon": "LONG",
  "riskLevel": "MEDIUM",
  "investmentGoals": "Długoterminowy wzrost i dochód z dywidend.",
  "updatedAt": "2025-10-19T10:00:00Z"
}
```

**Response 404:**
```json
{
  "message": "Strategia inwestycyjna nie została znaleziona"
}
```

### POST /api/v1/strategy
Tworzy nową strategię inwestycyjną dla zalogowanego użytkownika.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "timeHorizon": "LONG",
  "riskLevel": "MEDIUM",
  "investmentGoals": "Długoterminowy wzrost i dochód z dywidend."
}
```

**Validation:**
- `timeHorizon`: enum ['SHORT', 'MEDIUM', 'LONG']
- `riskLevel`: enum ['LOW', 'MEDIUM', 'HIGH']
- `investmentGoals`: string (10-500 znaków)

**Response 201:**
```json
{
  "id": "uuid",
  "timeHorizon": "LONG",
  "riskLevel": "MEDIUM",
  "investmentGoals": "Długoterminowy wzrost i dochód z dywidend.",
  "updatedAt": "2025-10-19T10:00:00Z"
}
```

**Response 409:**
```json
{
  "message": "Strategia inwestycyjna już istnieje dla tego użytkownika"
}
```

### PUT /api/v1/strategy
Aktualizuje istniejącą strategię inwestycyjną zalogowanego użytkownika.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Request Body:**
```json
{
  "timeHorizon": "MEDIUM",
  "riskLevel": "HIGH",
  "investmentGoals": "Agresywny wzrost z akceptacją wyższego ryzyka."
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "timeHorizon": "MEDIUM",
  "riskLevel": "HIGH",
  "investmentGoals": "Agresywny wzrost z akceptacją wyższego ryzyka.",
  "updatedAt": "2025-10-19T10:30:00Z"
}
```

**Response 404:**
```json
{
  "message": "Strategia inwestycyjna nie została znaleziona"
}
```

## Bezpieczeństwo

- Wszystkie endpointy wymagają uwierzytelnienia JWT (`requireAuth` middleware)
- Każde zapytanie do bazy zawiera klauzulę `WHERE user_id = :userId`
- Użytkownik ma dostęp tylko do własnej strategii
- Walidacja danych wejściowych za pomocą Zod

## Tabela w bazie danych

```sql
investment_strategies (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  time_horizon TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  investment_goals TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Użycie w kodzie

```typescript
import { strategyService } from './strategies/strategies.service';

// Get strategy
const strategy = await strategyService.getStrategy(userId);

// Create strategy
const newStrategy = await strategyService.createStrategy(userId, {
  timeHorizon: 'LONG',
  riskLevel: 'MEDIUM',
  investmentGoals: 'Growth and dividends'
});

// Update strategy
const updatedStrategy = await strategyService.updateStrategy(userId, {
  timeHorizon: 'SHORT',
  riskLevel: 'LOW',
  investmentGoals: 'Capital preservation'
});
```

## Error Handling

Moduł używa `AppError` do rzucania błędów z kodami HTTP:
- `404`: Strategia nie została znaleziona
- `409`: Strategia już istnieje (przy tworzeniu)
- `400`: Błąd walidacji danych wejściowych
- `401`: Brak uwierzytelnienia

Wszystkie błędy są obsługiwane przez globalny `errorHandler` middleware.
