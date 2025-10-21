# Architektura UI dla Janus AI

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika (UI) dla aplikacji Janus AI została zaprojektowana w oparciu o bibliotekę React i system komponentów Ant Design, aby zapewnić spójność, szybkość rozwoju i profesjonalny wygląd aplikacji finansowej. Struktura jest zorientowana na zadania, prowadząc użytkownika od onboardingu, przez codzienne zarządzanie portfelem, aż po zaawansowaną analizę AI.

Główny układ aplikacji opiera się na komponencie `Layout` z Ant Design, który zawiera zwijane menu boczne (`Sider`) do nawigacji na desktopie oraz wysuwane menu na urządzeniach mobilnych. Centralna część interfejsu dynamicznie renderuje widoki w oparciu o routing (React Router). Zarządzanie stanem globalnym, takim jak dane uwierzytelniające i informacje o użytkowniku, będzie realizowane za pomocą React Context. Zaimplementowany zostanie również interceptor zapytań `fetch`, który będzie automatycznie zarządzał odświeżaniem tokenów JWT i obsługiwał wygaśnięcie sesji, przekierowując użytkownika do strony logowania.

Architektura kładzie nacisk na responsywność (RWD), obsługę stanów pustych (np. brak transakcji), ładowania danych oraz błędów, zapewniając płynne i intuicyjne doświadczenie użytkownika (UX).

## 2. Lista widoków

### Widok: Rejestracja
- **Ścieżka widoku**: `/register`
- **Główny cel**: Umożliwienie nowym użytkownikom założenia konta.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na e-mail, hasło i powtórzenie hasła.
- **Kluczowe komponenty widoku**: `Form`, `Input.Password`, `Button`, `Alert` (dla komunikatów o błędach).
- **UX, dostępność i względy bezpieczeństwa**: Walidacja pól w czasie rzeczywistym. Jasne komunikaty o błędach (np. "Hasła nie są zgodne", "Użytkownik o tym e-mailu już istnieje"). Zgodność z WCAG, etykiety dla pól formularza.

### Widok: Logowanie
- **Ścieżka widoku**: `/login`
- **Główny cel**: Uwierzytelnienie istniejących użytkowników.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami na e-mail i hasło.
- **Kluczowe komponenty widoku**: `Form`, `Input.Password`, `Button`, `Checkbox` ("Zapamiętaj mnie"), `Alert`.
- **UX, dostępność i względy bezpieczeństwa**: Link do odzyskiwania hasła (w przyszłości). Obsługa błędu `401 Unauthorized` z API i wyświetlenie komunikatu "Nieprawidłowy e-mail lub hasło".

### Widok: Onboarding
- **Ścieżka widoku**: `/onboarding` (dostępny po pierwszym logowaniu)
- **Główny cel**: Przeprowadzenie nowego użytkownika przez początkową konfigurację konta.
- **Kluczowe informacje do wyświetlenia**: Kroki procesu: 1. Import danych (opcjonalny), 2. Definicja strategii.
- **Kluczowe komponenty widoku**: `Steps`, `Upload`, `Button`, `Form` (dla strategii).
- **UX, dostępność i względy bezpieczeństwa**: Umożliwienie pominięcia kroku importu. Jasne instrukcje na każdym etapie.

### Widok: Dashboard
- **Ścieżka widoku**: `/dashboard`
- **Główny cel**: Prezentacja kluczowych metryk portfela w jednym miejscu.
- **Kluczowe informacje do wyświetlenia**: Łączna wartość portfela, zmiana dzienna/procentowa, historyczny wykres wartości portfela, wykres dywersyfikacji (wg aktywów/sektorów).
- **Kluczowe komponenty widoku**: `Statistic`, `Area` chart (@ant-design/charts), `Pie` chart (@ant-design/charts), `Button` ("Odśwież", "Analizuj portfel"), `Skeleton` (podczas ładowania danych).
- **UX, dostępność i względy bezpieczeństwa**: Interaktywne wykresy z tooltipami. Obsługa pustego stanu (gdy brak transakcji) za pomocą komponentu `Empty` z wezwaniem do działania (CTA) "Zaimportuj swoje pierwsze transakcje".

### Widok: Transakcje
- **Ścieżka widoku**: `/transactions`
- **Główny cel**: Przeglądanie, dodawanie, edytowanie i importowanie transakcji.
- **Kluczowe informacje do wyświetlenia**: Tabela transakcji zagregowanych po tickerze, z możliwością rozwinięcia wiersza w celu zobaczenia szczegółów.
- **Kluczowe komponenty widoku**: `Table` (z `expandable`), `Button` ("Dodaj transakcję", "Importuj plik XTB"), `Modal` (dla formularzy dodawania/edycji i importu), `Select` (do filtrowania po koncie: IKE, IKZE), `Tag` (dla typu transakcji).
- **UX, dostępność i względy bezpieczeństwa**: Paginacja po stronie serwera. Formularze w modalach z walidacją. Wizualizacja procesu importu za pomocą `Spin` lub `Progress`.

### Widok: Strategia
- **Ścieżka widoku**: `/strategy`
- **Główny cel**: Definiowanie i aktualizacja strategii inwestycyjnej użytkownika.
- **Kluczowe informacje do wyświetlenia**: Formularz z aktualnie zapisaną strategią.
- **Kluczowe komponenty widoku**: `Form`, `Select` (horyzont czasowy, poziom ryzyka), `Input.TextArea` (cele inwestycyjne), `Button` ("Zapisz").
- **UX, dostępność i względy bezpieczeństwa**: Formularz pobiera i wypełnia istniejące dane. Po zapisaniu wyświetlana jest notyfikacja o sukcesie.

### Widok: Analizy AI
- **Ścieżka widoku**: `/analyses`
- **Główny cel**: Przeglądanie historii wygenerowanych analiz AI.
- **Kluczowe informacje do wyświetlenia**: Lista poprzednich analiz z datą, modelem AI i wartością portfela w momencie analizy.
- **Kluczowe komponenty widoku**: `List`, `Button` ("Zobacz szczegóły").
- **UX, dostępność i względy bezpieczeństwa**: Sortowanie od najnowszej analizy. Kliknięcie w element listy przenosi do widoku szczegółowego.

### Widok: Szczegóły Analizy AI
- **Ścieżka widoku**: `/analyses/:id`
- **Główny cel**: Prezentacja wyników pojedynczej, szczegółowej analizy AI.
- **Kluczowe informacje do wyświetlenia**: Podsumowanie analizy, rekomendacje (ticker, akcja, uzasadnienie, pewność).
- **Kluczowe komponenty widoku**: `Card`, `Descriptions`, `Table` (dla rekomendacji), `Tag` (dla akcji `BUY`/`SELL`/`HOLD`).
- **UX, dostępność i względy bezpieczeństwa**: Czytelne oddzielenie podsumowania od rekomendacji. Użycie kolorów do wizualizacji akcji (np. zielony dla `BUY`, czerwony dla `SELL`).

## 3. Mapa podróży użytkownika

1.  **Rejestracja i Onboarding**:
    -   Nowy użytkownik trafia na stronę `/register`, tworzy konto i jest automatycznie logowany.
    -   Następuje przekierowanie do `/onboarding`.
    -   Krok 1: Użytkownik widzi opcję importu pliku XTB. Może przesłać plik lub pominąć ten krok.
    -   Krok 2: Użytkownik definiuje swoją strategię inwestycyjną w prostym formularzu.
    -   Po zakończeniu onboardingu użytkownik jest przekierowywany na główny Dashboard (`/`).

2.  **Codzienne zarządzanie i analiza**:
    -   Zalogowany użytkownik ląduje na `/dashboard`, gdzie widzi ogólny stan swojego portfela.
    -   Może przejść do `/transactions`, aby przejrzeć szczegóły, dodać ręcznie nową transakcję lub zaimportować kolejny plik.
    -   W dowolnym momencie może przejść do `/strategy`, aby zaktualizować swoje cele.
    -   Gdy jest gotowy, klika przycisk "Analizuj portfel" na Dashboardzie.
    -   Analiza jest zlecana w tle. Po jej zakończeniu użytkownik otrzymuje trwałą notyfikację (`Notification`) z linkiem do wyników.
    -   Kliknięcie w notyfikację lub nawigacja do `/analyses/:id` przenosi go do szczegółowego widoku z rekomendacjami.
    -   Użytkownik może w dowolnym momencie wylogować się, co czyści stan sesji i przekierowuje go na `/login`.

## 4. Układ i struktura nawigacji

-   **Główny układ**: Aplikacja wykorzystuje `Layout` z Ant Design.
    -   **Nawigacja boczna (`Sider`)**: Na urządzeniach desktopowych, po lewej stronie znajduje się zwijane menu z linkami do głównych widoków. Na urządzeniach mobilnych menu jest domyślnie schowane i wysuwane.
    -   **Główne linki w nawigacji**:
        -   Dashboard (`/dashboard`)
        -   Transakcje (`/transactions`)
        -   Strategia (`/strategy`)
        -   Analizy (`/analyses`)
    -   **Nagłówek (`Header`)**: Zawiera nazwę aplikacji, a po prawej stronie awatar użytkownika z menu podręcznym (`Dropdown`) zawierającym linki do profilu (w przyszłości) i opcję "Wyloguj".
    -   **Treść (`Content`)**: Centralna część, w której renderowane są poszczególne widoki (`<Outlet />` z React Router).
    -   **Stopka (`Footer`)**: Zawiera podstawowe informacje, takie jak rok i nazwa aplikacji.

-   **Routing**: Wykorzystanie `react-router-dom` do zarządzania ścieżkami. Zabezpieczone trasy (`<PrivateRoute />`) będą sprawdzać stan uwierzytelnienia w globalnym kontekście i przekierowywać niezalogowanych użytkowników do `/login`.

## 5. Kluczowe komponenty

Poniższe komponenty Ant Design będą szeroko wykorzystywane w całej aplikacji w celu zapewnienia spójności:

-   **`Layout`, `Sider`, `Header`, `Content`, `Footer`**: Podstawowa struktura aplikacji.
-   **`Menu`**: Główna nawigacja w `Sider`.
-   **`Form`, `Input`, `InputNumber`, `Select`, `DatePicker`, `Button`**: Budowa wszystkich formularzy w aplikacji (logowanie, rejestracja, transakcje, strategia).
-   **`Table`**: Wyświetlanie danych tabelarycznych (transakcje, rekomendacje AI).
-   **`Modal`**: Wyświetlanie formularzy (dodawanie/edycja transakcji, import) bez opuszczania bieżącego widoku.
-   **`Notification`**: Informowanie o operacjach asynchronicznych (zakończenie analizy AI) i ważnych zdarzeniach.
-   **`Statistic`**: Prezentacja kluczowych danych liczbowych na Dashboardzie.
-   **`@ant-design/charts`**: Wizualizacja danych (wykresy historyczne i dywersyfikacji).
-   **`Empty`**: Obsługa pustych stanów (np. brak transakcji na start).
-   **`Skeleton`**: Wskazywanie stanu ładowania danych, poprawiając postrzeganą wydajność.
-   **`Tag`**: Oznaczanie kategorii, takich jak typ transakcji (`BUY`/`SELL`) lub akcja rekomendacji.
-   **`Alert`**: Wyświetlanie błędów formularzy i innych komunikatów kontekstowych.
