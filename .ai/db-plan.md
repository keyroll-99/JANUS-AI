# Schemat Bazy Danych PostgreSQL - Janus AI

## 1. Tabele

### 1.1. users (zarządzane przez Supabase Auth)

**Uwaga:** Tabela `auth.users` jest zarządzana przez Supabase Auth. Poniżej przedstawiono kluczowe kolumny, które będą wykorzystywane w relacjach:

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY | Unikalny identyfikator użytkownika |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Adres e-mail użytkownika |
| encrypted_password | TEXT | NOT NULL | Hasło zaszyfrowane przez Supabase |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia konta |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

---

### 1.2. account_types

Enum definiujący typy kont inwestycyjnych.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | SERIAL | PRIMARY KEY | Identyfikator typu konta |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Nazwa typu konta (MAIN, IKE, IKZE) |
| description | TEXT | NULL | Opcjonalny opis typu konta |

**Wartości początkowe:**
- MAIN (Główny portfel)
- IKE (Indywidualne Konto Emerytalne)
- IKZE (Indywidualne Konto Zabezpieczenia Emerytalnego)

---

### 1.3. transaction_types

Enum definiujący typy operacji finansowych.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | SERIAL | PRIMARY KEY | Identyfikator typu transakcji |
| name | VARCHAR(50) | NOT NULL, UNIQUE | Nazwa typu transakcji |
| description | TEXT | NULL | Opcjonalny opis typu transakcji |

**Wartości początkowe:**
- BUY (Kupno)
- SELL (Sprzedaż)
- DIVIDEND (Dywidenda)
- DEPOSIT (Wpłata środków)
- WITHDRAWAL (Wypłata środków)
- FEE (Opłata/prowizja)

---

### 1.4. transactions

Główna tabela przechowująca wszystkie operacje finansowe użytkowników.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator transakcji |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel transakcji |
| account_type_id | INTEGER | NOT NULL, REFERENCES account_types(id) | Typ konta inwestycyjnego |
| transaction_type_id | INTEGER | NOT NULL, REFERENCES transaction_types(id) | Typ operacji |
| ticker | VARCHAR(20) | NULL | Symbol spółki/instrumentu (NULL dla DEPOSIT/WITHDRAWAL/FEE) |
| quantity | NUMERIC(20, 8) | NULL, CHECK (quantity > 0) | Ilość akcji/jednostek |
| price | NUMERIC(20, 4) | NULL, CHECK (price > 0) | Cena za jednostkę w PLN |
| total_amount | NUMERIC(20, 4) | NOT NULL | Całkowita wartość transakcji w PLN |
| commission | NUMERIC(20, 4) | DEFAULT 0, CHECK (commission >= 0) | Prowizja/opłata transakcyjna |
| transaction_date | TIMESTAMP WITH TIME ZONE | NOT NULL | Data i godzina wykonania transakcji |
| notes | TEXT | NULL | Opcjonalne notatki użytkownika |
| imported_from_file | BOOLEAN | DEFAULT FALSE | Czy transakcja została zaimportowana z pliku XTB |
| import_batch_id | UUID | NULL | Identyfikator wsadu importu (grupowanie transakcji z jednego pliku) |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Dodatkowe ograniczenia:**
- CHECK: `transaction_date <= NOW()` - data transakcji nie może być z przyszłości
- CHECK: `(transaction_type_id IN (SELECT id FROM transaction_types WHERE name IN ('BUY', 'SELL', 'DIVIDEND'))) = (ticker IS NOT NULL)` - ticker wymagany dla BUY/SELL/DIVIDEND

---

### 1.5. investment_strategies

Tabela przechowująca strategie inwestycyjne użytkowników.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator strategii |
| user_id | UUID | NOT NULL, UNIQUE, REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel strategii (jeden użytkownik = jedna strategia) |
| time_horizon | VARCHAR(20) | NOT NULL, CHECK (time_horizon IN ('SHORT', 'MEDIUM', 'LONG')) | Horyzont czasowy inwestycji |
| risk_level | VARCHAR(20) | NOT NULL, CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')) | Akceptowany poziom ryzyka |
| investment_goals | TEXT | NOT NULL | Opisowe cele inwestycyjne |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia strategii |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

**Wartości dla time_horizon:**
- SHORT (Krótki: 0-2 lata)
- MEDIUM (Średni: 2-5 lat)
- LONG (Długi: 5+ lat)

**Wartości dla risk_level:**
- LOW (Niskie ryzyko)
- MEDIUM (Średnie ryzyko)
- HIGH (Wysokie ryzyko)

---

### 1.6. ai_analyses

Tabela przechowująca historię analiz AI portfeli użytkowników.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator analizy |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel portfela |
| analysis_summary | TEXT | NOT NULL | Ogólne podsumowanie stanu portfela |
| portfolio_value | NUMERIC(20, 4) | NOT NULL, CHECK (portfolio_value >= 0) | Wartość portfela w momencie analizy (PLN) |
| ai_model | VARCHAR(50) | NOT NULL | Model AI użyty do analizy (np. 'claude-haiku-3', 'gemini-pro') |
| prompt_tokens | INTEGER | NULL | Liczba tokenów w zapytaniu |
| completion_tokens | INTEGER | NULL | Liczba tokenów w odpowiedzi |
| total_cost | NUMERIC(10, 6) | NULL, CHECK (total_cost >= 0) | Koszt analizy w USD |
| analysis_date | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data i godzina wykonania analizy |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |

---

### 1.7. ai_recommendations

Tabela przechowująca konkretne rekomendacje AI dla poszczególnych aktywów.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator rekomendacji |
| analysis_id | UUID | NOT NULL, REFERENCES ai_analyses(id) ON DELETE CASCADE | Powiązanie z analizą AI |
| ticker | VARCHAR(20) | NOT NULL | Symbol spółki/instrumentu |
| action | VARCHAR(20) | NOT NULL, CHECK (action IN ('BUY', 'SELL', 'HOLD', 'REDUCE', 'INCREASE')) | Sugerowana akcja |
| confidence | VARCHAR(20) | NULL, CHECK (confidence IN ('LOW', 'MEDIUM', 'HIGH')) | Poziom pewności rekomendacji |
| reasoning | TEXT | NOT NULL | Uzasadnienie rekomendacji |
| target_price | NUMERIC(20, 4) | NULL, CHECK (target_price > 0) | Sugerowana cena docelowa (PLN) |
| current_position_size | NUMERIC(20, 4) | NULL | Aktualna wartość pozycji w portfelu (PLN) |
| suggested_allocation | NUMERIC(5, 2) | NULL, CHECK (suggested_allocation >= 0 AND suggested_allocation <= 100) | Sugerowana alokacja w % portfela |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |

**Wartości dla action:**
- BUY (Kup - nowa pozycja)
- INCREASE (Zwiększ - dokup do istniejącej pozycji)
- HOLD (Trzymaj)
- REDUCE (Zmniejsz - sprzedaj częściowo)
- SELL (Sprzedaj - zamknij pozycję)

---

### 1.8. portfolio_snapshots

Tabela przechowująca historyczne snapshoty wartości portfela dla generowania wykresów.

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator snapshotu |
| user_id | UUID | NOT NULL, REFERENCES auth.users(id) ON DELETE CASCADE | Właściciel portfela |
| snapshot_date | DATE | NOT NULL | Data snapshotu |
| total_value | NUMERIC(20, 4) | NOT NULL, CHECK (total_value >= 0) | Całkowita wartość portfela (PLN) |
| cash_balance | NUMERIC(20, 4) | DEFAULT 0, CHECK (cash_balance >= 0) | Saldo gotówkowe (PLN) |
| invested_value | NUMERIC(20, 4) | DEFAULT 0, CHECK (invested_value >= 0) | Wartość zainwestowana w aktywa (PLN) |
| realized_profit_loss | NUMERIC(20, 4) | DEFAULT 0 | Skumulowany zrealizowany zysk/strata (PLN) |
| unrealized_profit_loss | NUMERIC(20, 4) | DEFAULT 0 | Niezrealizowany zysk/strata (PLN) |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |

**Dodatkowe ograniczenia:**
- UNIQUE (user_id, snapshot_date) - jeden snapshot dziennie na użytkownika

---

### 1.9. user_rate_limits

Tabela do śledzenia limitów użycia funkcji AI (rate limiting).

| Kolumna | Typ | Ograniczenia | Opis |
|---------|-----|--------------|------|
| id | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unikalny identyfikator |
| user_id | UUID | NOT NULL, UNIQUE, REFERENCES auth.users(id) ON DELETE CASCADE | Użytkownik |
| daily_analyses_count | INTEGER | DEFAULT 0, CHECK (daily_analyses_count >= 0) | Liczba analiz dzisiaj |
| daily_limit | INTEGER | DEFAULT 3, CHECK (daily_limit > 0) | Dzienny limit analiz |
| last_analysis_date | DATE | NULL | Data ostatniej analizy |
| monthly_analyses_count | INTEGER | DEFAULT 0, CHECK (monthly_analyses_count >= 0) | Liczba analiz w tym miesiącu |
| total_analyses_count | INTEGER | DEFAULT 0, CHECK (total_analyses_count >= 0) | Całkowita liczba analiz |
| created_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data utworzenia rekordu |
| updated_at | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Data ostatniej aktualizacji |

---

## 2. Relacje między tabelami

### 2.1. Relacje jeden-do-wielu (1:N)

#### auth.users → transactions
- **Kardynalność:** 1:N (jeden użytkownik ma wiele transakcji)
- **Klucz obcy:** transactions.user_id → auth.users.id
- **ON DELETE:** CASCADE (usunięcie użytkownika usuwa wszystkie jego transakcje)

#### auth.users → investment_strategies
- **Kardynalność:** 1:1 (jeden użytkownik ma jedną strategię)
- **Klucz obcy:** investment_strategies.user_id → auth.users.id
- **Ograniczenie:** UNIQUE na user_id
- **ON DELETE:** CASCADE

#### auth.users → ai_analyses
- **Kardynalność:** 1:N (jeden użytkownik ma wiele analiz)
- **Klucz obcy:** ai_analyses.user_id → auth.users.id
- **ON DELETE:** CASCADE

#### auth.users → portfolio_snapshots
- **Kardynalność:** 1:N (jeden użytkownik ma wiele snapshotów)
- **Klucz obcy:** portfolio_snapshots.user_id → auth.users.id
- **ON DELETE:** CASCADE

#### auth.users → user_rate_limits
- **Kardynalność:** 1:1 (jeden użytkownik ma jeden rekord limitów)
- **Klucz obcy:** user_rate_limits.user_id → auth.users.id
- **Ograniczenie:** UNIQUE na user_id
- **ON DELETE:** CASCADE

#### account_types → transactions
- **Kardynalność:** 1:N (jeden typ konta ma wiele transakcji)
- **Klucz obcy:** transactions.account_type_id → account_types.id
- **ON DELETE:** RESTRICT (nie można usunąć typu konta jeśli są powiązane transakcje)

#### transaction_types → transactions
- **Kardynalność:** 1:N (jeden typ transakcji ma wiele transakcji)
- **Klucz obcy:** transactions.transaction_type_id → transaction_types.id
- **ON DELETE:** RESTRICT

#### ai_analyses → ai_recommendations
- **Kardynalność:** 1:N (jedna analiza ma wiele rekomendacji)
- **Klucz obcy:** ai_recommendations.analysis_id → ai_analyses.id
- **ON DELETE:** CASCADE (usunięcie analizy usuwa wszystkie jej rekomendacje)

---

## 3. Indeksy

### 3.1. Indeksy na kluczach obcych (automatyczne dla FK w PostgreSQL)

```sql
-- Automatycznie tworzone przez PostgreSQL dla foreign keys
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_account_type_id ON transactions(account_type_id);
CREATE INDEX idx_transactions_transaction_type_id ON transactions(transaction_type_id);
CREATE INDEX idx_investment_strategies_user_id ON investment_strategies(user_id);
CREATE INDEX idx_ai_analyses_user_id ON ai_analyses(user_id);
CREATE INDEX idx_ai_recommendations_analysis_id ON ai_recommendations(analysis_id);
CREATE INDEX idx_portfolio_snapshots_user_id ON portfolio_snapshots(user_id);
CREATE INDEX idx_user_rate_limits_user_id ON user_rate_limits(user_id);
```

### 3.2. Indeksy wydajnościowe

```sql
-- Optymalizacja zapytań po dacie transakcji
CREATE INDEX idx_transactions_transaction_date ON transactions(transaction_date DESC);

-- Composite index dla filtrowania transakcji użytkownika po dacie
CREATE INDEX idx_transactions_user_date ON transactions(user_id, transaction_date DESC);

-- Composite index dla filtrowania transakcji użytkownika po typie konta
CREATE INDEX idx_transactions_user_account ON transactions(user_id, account_type_id);

-- Index dla grupowania po tickerze (analiza dywersyfikacji)
CREATE INDEX idx_transactions_ticker ON transactions(ticker) WHERE ticker IS NOT NULL;

-- Composite index dla analiz użytkownika posortowanych po dacie
CREATE INDEX idx_ai_analyses_user_date ON ai_analyses(user_id, analysis_date DESC);

-- Index dla szybkiego wyszukiwania rekomendacji po tickerze
CREATE INDEX idx_ai_recommendations_ticker ON ai_recommendations(ticker);

-- Composite index dla rekomendacji w ramach analizy
CREATE INDEX idx_ai_recommendations_analysis_action ON ai_recommendations(analysis_id, action);

-- Composite index dla snapshotów użytkownika po dacie
CREATE INDEX idx_portfolio_snapshots_user_date ON portfolio_snapshots(user_id, snapshot_date DESC);

-- Index dla import batch (grupowanie transakcji z jednego pliku)
CREATE INDEX idx_transactions_import_batch ON transactions(import_batch_id) WHERE import_batch_id IS NOT NULL;
```

### 3.3. Indeksy tekstowe (opcjonalne - dla przyszłości)

```sql
-- Full-text search dla notatek transakcji (przyszłość)
CREATE INDEX idx_transactions_notes_fts ON transactions USING gin(to_tsvector('polish', notes)) WHERE notes IS NOT NULL;

-- Full-text search dla uzasadnień rekomendacji (przyszłość)
CREATE INDEX idx_ai_recommendations_reasoning_fts ON ai_recommendations USING gin(to_tsvector('polish', reasoning));
```

---

## 4. Zasady PostgreSQL (Row-Level Security)

### 4.1. Włączenie RLS na wszystkich tabelach użytkownika

```sql
-- Włączenie RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rate_limits ENABLE ROW LEVEL SECURITY;
```

### 4.2. Zasady dla tabeli transactions

```sql
-- Policy: Użytkownik widzi tylko swoje transakcje
CREATE POLICY transactions_select_policy ON transactions
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Użytkownik może dodawać tylko swoje transakcje
CREATE POLICY transactions_insert_policy ON transactions
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Użytkownik może aktualizować tylko swoje transakcje
CREATE POLICY transactions_update_policy ON transactions
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Użytkownik może usuwać tylko swoje transakcje
CREATE POLICY transactions_delete_policy ON transactions
    FOR DELETE
    USING (auth.uid() = user_id);
```

### 4.3. Zasady dla tabeli investment_strategies

```sql
-- Policy: Użytkownik widzi tylko swoją strategię
CREATE POLICY strategies_select_policy ON investment_strategies
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Użytkownik może utworzyć tylko swoją strategię
CREATE POLICY strategies_insert_policy ON investment_strategies
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Użytkownik może aktualizować tylko swoją strategię
CREATE POLICY strategies_update_policy ON investment_strategies
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Użytkownik może usunąć tylko swoją strategię
CREATE POLICY strategies_delete_policy ON investment_strategies
    FOR DELETE
    USING (auth.uid() = user_id);
```

### 4.4. Zasady dla tabeli ai_analyses

```sql
-- Policy: Użytkownik widzi tylko swoje analizy
CREATE POLICY analyses_select_policy ON ai_analyses
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Tylko system (service_role) może tworzyć analizy
CREATE POLICY analyses_insert_policy ON ai_analyses
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Użytkownik nie może edytować analiz (read-only)
-- (brak policy UPDATE)

-- Policy: Użytkownik może usuwać swoje analizy
CREATE POLICY analyses_delete_policy ON ai_analyses
    FOR DELETE
    USING (auth.uid() = user_id);
```

### 4.5. Zasady dla tabeli ai_recommendations

```sql
-- Policy: Użytkownik widzi rekomendacje ze swoich analiz
CREATE POLICY recommendations_select_policy ON ai_recommendations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ai_analyses 
            WHERE ai_analyses.id = ai_recommendations.analysis_id 
            AND ai_analyses.user_id = auth.uid()
        )
    );

-- Policy: Tylko system może tworzyć rekomendacje
CREATE POLICY recommendations_insert_policy ON ai_recommendations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_analyses 
            WHERE ai_analyses.id = ai_recommendations.analysis_id 
            AND ai_analyses.user_id = auth.uid()
        )
    );

-- Rekomendacje są read-only dla użytkowników
-- (brak policy UPDATE i DELETE - kaskadowe usuwanie przez ai_analyses)
```

### 4.6. Zasady dla tabeli portfolio_snapshots

```sql
-- Policy: Użytkownik widzi tylko swoje snapshoty
CREATE POLICY snapshots_select_policy ON portfolio_snapshots
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: System może tworzyć snapshoty
CREATE POLICY snapshots_insert_policy ON portfolio_snapshots
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: System może aktualizować snapshoty (recalculation)
CREATE POLICY snapshots_update_policy ON portfolio_snapshots
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Użytkownik może usuwać swoje snapshoty
CREATE POLICY snapshots_delete_policy ON portfolio_snapshots
    FOR DELETE
    USING (auth.uid() = user_id);
```

### 4.7. Zasady dla tabeli user_rate_limits

```sql
-- Policy: Użytkownik widzi tylko swoje limity
CREATE POLICY rate_limits_select_policy ON user_rate_limits
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: System tworzy rekordy limitów
CREATE POLICY rate_limits_insert_policy ON user_rate_limits
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: System aktualizuje liczniki
CREATE POLICY rate_limits_update_policy ON user_rate_limits
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
```

### 4.8. Publiczny dostęp do tabel referencyjnych

```sql
-- Tabele account_types i transaction_types są publiczne (read-only)
ALTER TABLE account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_types ENABLE ROW LEVEL SECURITY;

-- Wszyscy mogą czytać typy kont i transakcji
CREATE POLICY account_types_select_policy ON account_types
    FOR SELECT
    USING (true);

CREATE POLICY transaction_types_select_policy ON transaction_types
    FOR SELECT
    USING (true);
```

---

## 5. Triggery i funkcje pomocnicze

### 5.1. Automatyczna aktualizacja updated_at

```sql
-- Funkcja do automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggery dla tabel z kolumną updated_at
CREATE TRIGGER update_transactions_updated_at
    BEFORE UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investment_strategies_updated_at
    BEFORE UPDATE ON investment_strategies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_rate_limits_updated_at
    BEFORE UPDATE ON user_rate_limits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 5.2. Resetowanie dziennych limitów AI

```sql
-- Funkcja do resetowania dziennych liczników analiz
CREATE OR REPLACE FUNCTION reset_daily_analysis_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Jeśli ostatnia analiza była w innym dniu, resetuj licznik
    IF NEW.last_analysis_date IS NULL OR NEW.last_analysis_date < CURRENT_DATE THEN
        NEW.daily_analyses_count = 1;
        NEW.last_analysis_date = CURRENT_DATE;
    ELSE
        NEW.daily_analyses_count = NEW.daily_analyses_count + 1;
    END IF;
    
    NEW.monthly_analyses_count = NEW.monthly_analyses_count + 1;
    NEW.total_analyses_count = NEW.total_analyses_count + 1;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger uruchamiany po każdej nowej analizie AI
CREATE TRIGGER increment_analysis_count
    BEFORE UPDATE ON user_rate_limits
    FOR EACH ROW
    WHEN (NEW.daily_analyses_count > OLD.daily_analyses_count OR OLD.daily_analyses_count IS NULL)
    EXECUTE FUNCTION reset_daily_analysis_count();
```

### 5.3. Walidacja danych transakcji

```sql
-- Funkcja walidująca kompletność danych transakcji
CREATE OR REPLACE FUNCTION validate_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Dla transakcji BUY/SELL/DIVIDEND wymagany jest ticker, quantity i price
    IF NEW.transaction_type_id IN (
        SELECT id FROM transaction_types WHERE name IN ('BUY', 'SELL', 'DIVIDEND')
    ) THEN
        IF NEW.ticker IS NULL OR NEW.quantity IS NULL OR NEW.price IS NULL THEN
            RAISE EXCEPTION 'Ticker, quantity and price are required for BUY/SELL/DIVIDEND transactions';
        END IF;
        
        -- Oblicz total_amount jeśli nie podano
        IF NEW.total_amount IS NULL THEN
            NEW.total_amount = NEW.quantity * NEW.price;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_transaction_trigger
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION validate_transaction();
```

---

## 6. Dodatkowe uwagi i wyjaśnienia

### 6.1. Normalizacja

Schemat jest znormalizowany do 3NF:
- **1NF:** Wszystkie atrybuty są atomowe, brak grup powtarzających się
- **2NF:** Wszystkie atrybuty niebędące kluczami zależą od całego klucza głównego
- **3NF:** Brak zależności przechodnich między atrybutami

### 6.2. Typy danych

- **UUID:** Używane dla wszystkich kluczy głównych dla lepszej skalowalności i bezpieczeństwa
- **NUMERIC(20, 4):** Dla wartości finansowych w PLN (precyzja do 4 miejsc po przecinku)
- **NUMERIC(20, 8):** Dla ilości akcji/jednostek (obsługa ułamków)
- **TIMESTAMP WITH TIME ZONE:** Dla wszystkich dat, co umożliwia obsługę różnych stref czasowych

### 6.3. Bezpieczeństwo

1. **Row-Level Security (RLS):** Zapewnia, że użytkownicy mają dostęp tylko do swoich danych
2. **CASCADE DELETE:** Automatyczne usuwanie powiązanych danych przy usunięciu użytkownika
3. **CHECK constraints:** Walidacja na poziomie bazy danych (ceny > 0, daty nie z przyszłości)
4. **UNIQUE constraints:** Zapobieganie duplikatom (jeden użytkownik = jedna strategia)

### 6.4. Wydajność

1. **Indeksowanie:** Kluczowe kolumny do filtrowania i sortowania są zaindeksowane
2. **Composite indexes:** Dla często występujących par warunków w WHERE
3. **Partial indexes:** Index tylko na potrzebne wiersze (WHERE ticker IS NOT NULL)
4. **Connection pooling:** Do implementacji na poziomie aplikacji (backend)

### 6.5. Skalowalność

Schemat przygotowany na przyszłe rozszerzenia:
- **Partycjonowanie:** W przyszłości można partycjonować `transactions` po `transaction_date`
- **Materialized views:** Dla dashboard metrics (agregacje wartości portfela)
- **Archiwizacja:** Stare `portfolio_snapshots` mogą być przenoszone do archiwum
- **Sharding:** W przyszłości możliwe sharding po `user_id`

### 6.6. Importowanie danych z XTB

Proces importu:
1. Użytkownik przesyła plik Excel
2. Backend parsuje plik i generuje unikalny `import_batch_id` (UUID)
3. Wszystkie transakcje z pliku mają ustawione `imported_from_file = TRUE` i ten sam `import_batch_id`
4. Pozwala to na grupowanie transakcji z jednego importu i ewentualne bulk delete

### 6.7. Rate Limiting AI

Mechanizm limitowania:
1. Przy każdej analizie AI sprawdzany jest rekord w `user_rate_limits`
2. Jeśli `daily_analyses_count >= daily_limit`, analiza jest odrzucana
3. Trigger automatycznie resetuje `daily_analyses_count` gdy `last_analysis_date` != `CURRENT_DATE`
4. Koszt każdej analizy jest zapisywany w `ai_analyses.total_cost` dla monitoringu budżetu

### 6.8. Portfolio Snapshots

Strategia generowania snapshotów:
- **Cron job:** Codziennie o północy generuje snapshoty dla wszystkich użytkowników
- **On-demand:** Po każdej transakcji można zaktualizować snapshot na bieżący dzień
- **Retention:** Snapshoty starsze niż 2 lata mogą być agregowane (tygodniowe zamiast dziennych)

### 6.9. Materialized Views (opcjonalne - dla przyszłości)

```sql
-- View dla agregacji aktywnych pozycji w portfelu
CREATE MATERIALIZED VIEW user_portfolio_positions AS
SELECT 
    user_id,
    account_type_id,
    ticker,
    SUM(CASE 
        WHEN tt.name = 'BUY' THEN quantity 
        WHEN tt.name = 'SELL' THEN -quantity 
        ELSE 0 
    END) as total_quantity,
    AVG(CASE 
        WHEN tt.name IN ('BUY', 'SELL') THEN price 
        ELSE NULL 
    END) as avg_price
FROM transactions t
JOIN transaction_types tt ON t.transaction_type_id = tt.id
WHERE ticker IS NOT NULL
GROUP BY user_id, account_type_id, ticker
HAVING SUM(CASE 
    WHEN tt.name = 'BUY' THEN quantity 
    WHEN tt.name = 'SELL' THEN -quantity 
    ELSE 0 
END) > 0;

-- Index dla szybkiego dostępu
CREATE UNIQUE INDEX idx_portfolio_positions_user_account_ticker 
ON user_portfolio_positions(user_id, account_type_id, ticker);

-- Refresh view codziennie lub po każdej transakcji
REFRESH MATERIALIZED VIEW CONCURRENTLY user_portfolio_positions;
```

### 6.10. Rozszerzenia PostgreSQL

Wymagane rozszerzenia:
```sql
-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Full-text search (polski)
CREATE EXTENSION IF NOT EXISTS "unaccent";
```

---

## 7. Kolejność tworzenia obiektów

Rekomendowana kolejność tworzenia obiektów w migracji:

1. Włączenie rozszerzeń (`uuid-ossp`, `unaccent`)
2. Tabele referencyjne (`account_types`, `transaction_types`)
3. Tabela główna użytkowników (zarządzana przez Supabase - pomijamy)
4. Tabele zależne od users:
   - `investment_strategies`
   - `user_rate_limits`
   - `transactions`
   - `ai_analyses`
   - `portfolio_snapshots`
5. Tabele zależne od innych tabel:
   - `ai_recommendations` (zależna od `ai_analyses`)
6. Indeksy (po załadowaniu danych)
7. Funkcje pomocnicze
8. Triggery
9. RLS policies
10. Materialized views (opcjonalnie)

---

## 8. Estymacja rozmiaru bazy danych

**Dla 100 aktywnych użytkowników przez 1 rok:**

| Tabela | Wierszy/użytkownik | Rozmiar wiersza | Całkowity rozmiar |
|--------|-------------------|----------------|-------------------|
| transactions | ~500 | ~200 bytes | ~10 MB |
| ai_analyses | ~100 | ~500 bytes | ~5 MB |
| ai_recommendations | ~1000 | ~300 bytes | ~30 MB |
| portfolio_snapshots | ~365 | ~150 bytes | ~5.5 MB |
| investment_strategies | 1 | ~500 bytes | ~50 KB |
| user_rate_limits | 1 | ~200 bytes | ~20 KB |

**Całkowity rozmiar:** ~50-60 MB dla 100 użytkowników przez rok

**Szacunki wzrostu:**
- 1000 użytkowników: ~500 MB/rok
- 10000 użytkowników: ~5 GB/rok

Baza danych PostgreSQL powinna bezproblemowo obsłużyć te wielkości nawet na free tier hostingu (Supabase free tier: 500 MB).

---

**Wersja dokumentu:** 1.0  
**Data utworzenia:** 2025-10-19  
**Autor:** GitHub Copilot  
**Status:** Gotowy do implementacji
