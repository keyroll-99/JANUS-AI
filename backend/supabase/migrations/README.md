# Migracje Bazy Danych - Janus AI

Kompletny zestaw migracji PostgreSQL dla systemu Janus AI, zarządzany przez Supabase CLI.

## 📋 Spis Migracji

| Timestamp | Plik | Opis |
|-----------|------|------|
| 20251019120000 | `enable_extensions.sql` | Włączenie rozszerzeń PostgreSQL (uuid-ossp, unaccent) |
| 20251019120100 | `create_reference_tables.sql` | Tabele referencyjne (account_types, transaction_types) |
| 20251019120200 | `create_investment_strategies.sql` | Tabela strategii inwestycyjnych użytkowników |
| 20251019120300 | `create_user_rate_limits.sql` | Tabela limitów użycia AI dla użytkowników |
| 20251019120400 | `create_transactions.sql` | Główna tabela transakcji finansowych |
| 20251019120500 | `create_ai_analyses.sql` | Tabela historii analiz AI portfeli |
| 20251019120600 | `create_ai_recommendations.sql` | Tabela rekomendacji AI dla aktywów |
| 20251019120700 | `create_portfolio_snapshots.sql` | Tabela snapshotów wartości portfela |
| 20251019120800 | `create_triggers_and_functions.sql` | Funkcje pomocnicze i triggery |
| 20251019120900 | `create_fulltext_indexes.sql` | Indeksy full-text search (opcjonalne) |
| 20251019121000 | `create_materialized_views.sql` | Materialized views dla wydajności (opcjonalne) |

## 🚀 Uruchomienie Migracji

### Lokalne Środowisko

```powershell
# Uruchom wszystkie migracje
supabase db push

# Lub zastosuj konkretną migrację
supabase db push --file backend/supabase/migrations/20251019120000_enable_extensions.sql
```

### Środowisko Produkcyjne

```powershell
# Połącz się z projektem produkcyjnym
supabase link --project-ref <your-project-ref>

# Zastosuj migracje
supabase db push
```

## 📊 Struktura Bazy Danych

### Tabele Główne

#### 1. **account_types** (Referencja)
- Typy kont inwestycyjnych: MAIN, IKE, IKZE
- RLS: Publiczny odczyt dla wszystkich użytkowników

#### 2. **transaction_types** (Referencja)
- Typy transakcji: BUY, SELL, DIVIDEND, DEPOSIT, WITHDRAWAL, FEE
- RLS: Publiczny odczyt dla wszystkich użytkowników

#### 3. **investment_strategies**
- Strategia inwestycyjna użytkownika (1:1 z auth.users)
- Zawiera: horyzont czasowy, poziom ryzyka, cele inwestycyjne
- RLS: Użytkownik widzi tylko swoją strategię

#### 4. **user_rate_limits**
- Limity użycia funkcji AI (1:1 z auth.users)
- Automatyczne resetowanie dziennych limitów przez trigger
- RLS: Użytkownik widzi tylko swoje limity

#### 5. **transactions** ⭐ (Główna tabela)
- Wszystkie operacje finansowe użytkowników
- Obsługa importu z plików XTB (import_batch_id)
- Walidacja danych przez trigger
- RLS: Użytkownik widzi tylko swoje transakcje

#### 6. **ai_analyses**
- Historia analiz AI portfeli
- Tracking kosztów (tokeny, koszt USD)
- RLS: Użytkownik widzi tylko swoje analizy

#### 7. **ai_recommendations**
- Konkretne rekomendacje AI dla aktywów (child of ai_analyses)
- Akcje: BUY, SELL, HOLD, REDUCE, INCREASE
- RLS: Użytkownik widzi rekomendacje ze swoich analiz

#### 8. **portfolio_snapshots**
- Dzienne snapshoty wartości portfela
- Unique constraint: jeden snapshot na użytkownika dziennie
- RLS: Użytkownik widzi tylko swoje snapshoty

### Materialized Views (Opcjonalne)

#### **user_portfolio_positions**
- Pre-kalkulowane aktualne pozycje w portfelach
- Wymaga okresowego odświeżania: `REFRESH MATERIALIZED VIEW CONCURRENTLY user_portfolio_positions;`
- Znacznie przyspiesza zapytania o aktualne portfolio

## 🔐 Row-Level Security (RLS)

Wszystkie tabele mają włączony RLS:

- **Tabele użytkownika**: Użytkownik ma dostęp tylko do swoich danych (sprawdzanie `auth.uid() = user_id`)
- **Tabele referencyjne**: Publiczny dostęp tylko do odczytu
- **Rekomendacje AI**: Dostęp przez relację z `ai_analyses` (subquery)

### Przykład Polityki RLS

```sql
-- Użytkownik widzi tylko swoje transakcje
CREATE POLICY transactions_select_policy ON transactions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
```

## 🔧 Funkcje i Triggery

### 1. **update_updated_at_column()**
Automatycznie aktualizuje `updated_at` przed każdym UPDATE.

**Używane przez:**
- `transactions`
- `investment_strategies`
- `user_rate_limits`

### 2. **validate_transaction()**
Waliduje kompletność danych transakcji:
- Wymaga `ticker`, `quantity`, `price` dla BUY/SELL/DIVIDEND
- Auto-kalkuluje `total_amount` jeśli brak

### 3. **reset_daily_analysis_count()**
Automatyczne zarządzanie licznikami analiz AI:
- Resetuje `daily_analyses_count` gdy `last_analysis_date != CURRENT_DATE`
- Inkrementuje liczniki miesięczne i całkowite

## 📈 Indeksy Wydajnościowe

### Composite Indexes (Najważniejsze)
```sql
-- Filtrowanie transakcji użytkownika po dacie
idx_transactions_user_date (user_id, transaction_date DESC)

-- Analiza dywersyfikacji portfela
idx_transactions_ticker (ticker) WHERE ticker IS NOT NULL

-- Rekomendacje AI w ramach analizy
idx_ai_recommendations_analysis_action (analysis_id, action)

-- Snapshoty portfela do wykresów
idx_portfolio_snapshots_user_date (user_id, snapshot_date DESC)
```

### Full-Text Search Indexes (Opcjonalne)
```sql
-- Wyszukiwanie w notatkach transakcji (simple - uniwersalne)
idx_transactions_notes_fts USING gin(to_tsvector('simple', notes))

-- Wyszukiwanie w uzasadnieniach AI (simple - uniwersalne)
idx_ai_recommendations_reasoning_fts USING gin(to_tsvector('simple', reasoning))
```

**Uwaga:** Używamy konfiguracji `simple` zamiast `polish`, ponieważ wymaga to dodatkowych rozszerzeń PostgreSQL. Jeśli potrzebujesz zaawansowanego wsparcia dla języka polskiego, możesz później doinstalować i skonfigurować `pg_trgm` lub stworzyć własną konfigurację.

## 🔄 Proces Importu Danych z XTB

1. Użytkownik przesyła plik Excel z XTB
2. Backend parsuje plik i generuje unikalny `import_batch_id` (UUID)
3. Wszystkie transakcje mają:
   - `imported_from_file = TRUE`
   - Ten sam `import_batch_id`
4. Pozwala to na grupowanie i bulk delete transakcji z jednego importu

### Przykładowe Zapytanie

```sql
-- Wszystkie transakcje z konkretnego importu
SELECT * FROM transactions 
WHERE import_batch_id = '550e8400-e29b-41d4-a716-446655440000';

-- Usunięcie całego importu
DELETE FROM transactions 
WHERE import_batch_id = '550e8400-e29b-41d4-a716-446655440000';
```

## ⚡ Optymalizacja Wydajności

### Partycjonowanie (Przyszłość)
Tabela `transactions` może być partycjonowana po `transaction_date` gdy baza urośnie:

```sql
-- Partycje miesięczne dla starszych danych
CREATE TABLE transactions_2024_01 PARTITION OF transactions
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Archiwizacja Snapshotów
Snapshoty starsze niż 2 lata mogą być agregowane (tygodniowe zamiast dziennych):

```sql
-- Przykład: agregacja do tygodniowych snapshotów
SELECT 
    user_id,
    date_trunc('week', snapshot_date) as week,
    avg(total_value) as avg_value
FROM portfolio_snapshots
WHERE snapshot_date < now() - interval '2 years'
GROUP BY user_id, week;
```

### Odświeżanie Materialized Views

```sql
-- Ręczne odświeżanie
REFRESH MATERIALIZED VIEW CONCURRENTLY user_portfolio_positions;

-- Lub przez scheduled job (cron)
SELECT cron.schedule(
    'refresh-portfolio-positions',
    '0 1 * * *', -- Codziennie o 1:00
    $$REFRESH MATERIALIZED VIEW CONCURRENTLY user_portfolio_positions$$
);
```

## 📏 Estymacja Rozmiaru Bazy Danych

**Dla 100 użytkowników przez 1 rok:**

| Tabela | Rozmiar |
|--------|---------|
| transactions | ~10 MB |
| ai_analyses | ~5 MB |
| ai_recommendations | ~30 MB |
| portfolio_snapshots | ~5.5 MB |
| Inne tabele | ~100 KB |
| **RAZEM** | **~50-60 MB** |

**Projekcje wzrostu:**
- 1,000 użytkowników: ~500 MB/rok
- 10,000 użytkowników: ~5 GB/rok

## 🛠️ Konserwacja

### Regularne Zadania

1. **Odświeżanie materialized views** (jeśli używane)
   ```sql
   REFRESH MATERIALIZED VIEW CONCURRENTLY user_portfolio_positions;
   ```

2. **Vacuum analyze** (PostgreSQL maintenance)
   ```sql
   VACUUM ANALYZE transactions;
   VACUUM ANALYZE portfolio_snapshots;
   ```

3. **Monitoring rozmiaru tabel**
   ```sql
   SELECT 
       schemaname,
       tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

## 🔍 Diagnostyka

### Sprawdzenie statusu RLS

```sql
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Lista wszystkich polityk RLS

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Sprawdzenie triggerów

```sql
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

## 🐛 Troubleshooting

### Problem: Trigger nie resetuje daily_analyses_count

**Rozwiązanie:** Upewnij się, że aktualizujesz `daily_analyses_count` jawnie:

```sql
UPDATE user_rate_limits 
SET daily_analyses_count = daily_analyses_count + 1
WHERE user_id = 'user-uuid';
```

### Problem: Materialized view jest nieaktualna

**Rozwiązanie:** Odśwież view:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY user_portfolio_positions;
```

### Problem: RLS blokuje dostęp

**Rozwiązanie:** Sprawdź czy `auth.uid()` zwraca prawidłową wartość:

```sql
SELECT auth.uid(); -- Powinno zwrócić UUID zalogowanego użytkownika
```

## 📚 Dodatkowe Zasoby

- [Supabase Database Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)

---

**Wersja:** 1.0  
**Data utworzenia:** 2025-10-19  
**Autor:** GitHub Copilot  
**Status:** ✅ Gotowe do produkcji
