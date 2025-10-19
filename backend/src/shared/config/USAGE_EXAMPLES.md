# Przykłady użycia Supabase Client

## Import klienta

```typescript
import { supabase, supabaseAdmin } from '@/shared/config/supabase';
import type { Database } from '@/shared/config/database.types';
```

## Podstawowe operacje CRUD

### SELECT - Odczyt danych

```typescript
// Pobierz wszystkie portfele użytkownika
const { data: portfolios, error } = await supabase
  .from('portfolios')
  .select('*')
  .eq('user_id', userId);

// Pobierz z relacjami (join)
const { data: portfolio, error } = await supabase
  .from('portfolios')
  .select(`
    *,
    account_type:account_types(name),
    transactions(*)
  `)
  .eq('id', portfolioId)
  .single();
```

### INSERT - Dodawanie danych

```typescript
// Dodaj nowy portfel
const { data: newPortfolio, error } = await supabase
  .from('portfolios')
  .insert({
    user_id: userId,
    account_type_id: accountTypeId,
    name: 'Mój IKE',
    currency: 'PLN',
  })
  .select()
  .single();
```

### UPDATE - Aktualizacja danych

```typescript
// Zaktualizuj portfel
const { data: updatedPortfolio, error } = await supabase
  .from('portfolios')
  .update({ name: 'Nowa nazwa' })
  .eq('id', portfolioId)
  .select()
  .single();
```

### DELETE - Usuwanie danych

```typescript
// Usuń portfel
const { error } = await supabase
  .from('portfolios')
  .delete()
  .eq('id', portfolioId);
```

## Zaawansowane zapytania

### Filtrowanie

```typescript
// Filtrowanie z wieloma warunkami
const { data, error } = await supabase
  .from('transactions')
  .select('*')
  .eq('portfolio_id', portfolioId)
  .gte('transaction_date', '2024-01-01')
  .lte('transaction_date', '2024-12-31')
  .order('transaction_date', { ascending: false });
```

### Paginacja

```typescript
const page = 1;
const pageSize = 10;
const from = (page - 1) * pageSize;
const to = from + pageSize - 1;

const { data, error, count } = await supabase
  .from('transactions')
  .select('*', { count: 'exact' })
  .range(from, to);
```

### Full-text search

```typescript
// Wyszukiwanie pełnotekstowe w analiz AI
const { data, error } = await supabase
  .from('ai_analyses')
  .select('*')
  .textSearch('analysis_summary', 'portfel wzrost');
```

## Funkcje RPC (Remote Procedure Call)

```typescript
// Wywołanie funkcji bazodanowej
const { data, error } = await supabase
  .rpc('calculate_portfolio_value', {
    p_portfolio_id: portfolioId,
  });
```

## Używanie Admin Client

```typescript
// Operacje administracyjne (bypass RLS)
const { data: allUsers, error } = await supabaseAdmin
  .from('users')
  .select('*');

// UWAGA: Używaj tylko w zaufanych operacjach server-side!
```

## Obsługa błędów

```typescript
const { data, error } = await supabase
  .from('portfolios')
  .select('*');

if (error) {
  console.error('Błąd podczas pobierania danych:', error.message);
  throw new Error('Nie udało się pobrać portfeli');
}

// Bezpieczne użycie data
console.log(data);
```

## Transakcje (przez funkcje RPC)

```typescript
// Transakcje należy obsługiwać przez funkcje PostgreSQL
const { data, error } = await supabase
  .rpc('create_transaction_with_update', {
    p_portfolio_id: portfolioId,
    p_transaction_type: 'BUY',
    p_amount: 1000,
    // ... inne parametry
  });
```

## Real-time subscriptions

```typescript
// Nasłuchiwanie zmian w czasie rzeczywistym
const channel = supabase
  .channel('portfolio-changes')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'portfolios',
      filter: `user_id=eq.${userId}`,
    },
    (payload) => {
      console.log('Zmiana w portfelu:', payload);
    }
  )
  .subscribe();

// Odsubskrybowanie
channel.unsubscribe();
```

## TypeScript - typy pomocnicze

```typescript
// Typy dla tabel
type Portfolio = Database['public']['Tables']['portfolios']['Row'];
type PortfolioInsert = Database['public']['Tables']['portfolios']['Insert'];
type PortfolioUpdate = Database['public']['Tables']['portfolios']['Update'];

// Użycie
const createPortfolio = async (
  portfolio: PortfolioInsert
): Promise<Portfolio> => {
  const { data, error } = await supabase
    .from('portfolios')
    .insert(portfolio)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```
