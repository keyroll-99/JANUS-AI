# Dokument wymagań produktu (PRD) - Janus

## 1. Przegląd produktu
Janus to aplikacja webowa (z widokiem mobilnym) typu open-source, zaprojektowana w celu uproszczenia zarządzania osobistym portfelem inwestycyjnym. Aplikacja umożliwia użytkownikom importowanie historii transakcji z plików Excel generowanych przez XTB, ręczne zarządzanie danymi oraz definiowanie indywidualnych strategii inwestycyjnych. Kluczową funkcją jest integracja z modelem AI (Claude/Gemini), który na żądanie analizuje portfel użytkownika, dostarczając podsumowanie i rekomendacje "kup/sprzedaj" dostosowane do jego celów. Główny dashboard prezentuje kluczowe metryki, takie jak łączna wartość portfela, historyczne zmiany wartości oraz dywersyfikację aktywów.

## 2. Problem użytkownika
Zarządzanie portfelem inwestycyjnym, który jest często rozproszony między różne konta (np. główny portfel, IKE, IKZE), jest skomplikowane i nieporęczne, zwłaszcza dla początkujących i średnio-zaawansowanych inwestorów. Użytkownicy mają trudności z oceną, kiedy sprzedać lub kupić aktywa, oraz jak utrzymać spójność ze swoją strategią inwestycyjną. Brakuje im prostego narzędzia, które agregowałoby dane z różnych źródeł i dostarczało spersonalizowanych, opartych na danych rekomendacji, pomagających w podejmowaniu świadomych decyzji.

## 3. Wymagania funkcjonalne
- 3.1. Uwierzytelnianie: Prosty system logowania i rejestracji oparty na loginie (adres e-mail) i haśle.
- 3.2. Zarządzanie danymi:
  - 3.2.1. Import historii transakcji z pliku Excel w formacie XTB.
  - 3.2.2. Możliwość ręcznego dodawania i edytowania transakcji (data, ticker, ilość, cena, typ: kupno/sprzedaż).
- 3.3. Definicja strategii: Formularz pozwalający użytkownikowi zdefiniować swoje cele inwestycyjne, horyzont czasowy (krótki, średni, długi) i akceptowany poziom ryzyka (niski, średni, wysoki).
- 3.4. Analiza AI:
  - 3.4.1. Uruchamiana jednym przyciskiem analiza całego portfela.
  - 3.4.2. Generowanie ogólnego podsumowania stanu portfela.
  - 3.4.3. Generowanie konkretnych rekomendacji "kup/sprzedaj" na podstawie zdefiniowanych celów użytkownika i analizy rynku.
  - 3.4.4. Przechowywanie historii wygenerowanych analiz wraz z datą ich wykonania.
- 3.5. Dashboard:
  - 3.5.1. Prezentacja łącznej wartości portfela w PLN.
  - 3.5.2. Wykres historyczny wartości portfela.
  - 3.5.3. Wizualizacja dywersyfikacji portfela (np. wykres kołowy według spółek lub sektorów).
- 3.6. Architektura:
  - 3.6.1. Aplikacja webowa z responsywnym widokiem mobilnym.
  - 3.6.2. Projekt rozwijany jako open-source.
  - 3.6.3. Dokumentacja projektu zawarta w pliku README.md.

## 4. Granice produktu
W ramach pierwszej wersji produktu (MVP) następujące funkcjonalności NIE będą realizowane:
- Bezpośrednia integracja z API brokerów (np. XTB, Freedom24).
- Zaawansowane ankiety profilujące użytkownika w celu automatycznego dostrojenia strategii AI.
- Możliwość automatycznego wykonywania transakcji na podstawie rekomendacji AI.
- Powiadomienia (e-mail, push) o istotnych zmianach w portfelu lub nowych rekomendacjach.

## 5. Historyjki użytkowników

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do jej funkcjonalności.
- Kryteria akceptacji:
  - 1. Formularz rejestracji zawiera pola na adres e-mail, hasło i powtórzenie hasła.
  - 2. System waliduje, czy podany adres e-mail ma poprawny format.
  - 3. System sprawdza, czy hasła w obu polach są identyczne.
  - 4. System sprawdza, czy użytkownik o podanym adresie e-mail już nie istnieje.
  - 5. Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany do strony onboardingu.

- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do mojego portfela.
- Kryteria akceptacji:
  - 1. Formularz logowania zawiera pola na adres e-mail i hasło.
  - 2. Po poprawnym uwierzytelnieniu użytkownik jest przekierowany na główny dashboard.
  - 3. W przypadku podania błędnych danych, wyświetlany jest stosowny komunikat o błędzie.

- ID: US-003
- Tytuł: Import danych z pliku XTB
- Opis: Jako nowy użytkownik, po pierwszym zalogowaniu, chcę zaimportować historię moich transakcji z pliku Excel wygenerowanego przez XTB, aby szybko zasilić aplikację moimi danymi.
- Kryteria akceptacji:
  - 1. Na stronie onboardingu/ustawień znajduje się opcja "Importuj plik XTB".
  - 2. Użytkownik może wybrać i przesłać plik .xlsx lub .xls ze swojego komputera.
  - 3. System poprawnie parsuje dane z pliku (data, ticker, ilość, cena, typ transakcji).
  - 4. Po pomyślnym imporcie transakcje są widoczne w systemie, a dashboard zaktualizowany.
  - 5. W przypadku błędu formatu pliku lub danych, użytkownik otrzymuje czytelny komunikat o błędzie.

- ID: US-004
- Tytuł: Definiowanie strategii inwestycyjnej
- Opis: Jako nowy użytkownik, chcę wypełnić prosty formularz definiujący moje cele inwestycyjne, horyzont czasowy i poziom ryzyka, aby AI mogło generować dla mnie spersonalizowane porady.
- Kryteria akceptacji:
  - 1. Formularz zawiera pola wyboru dla horyzontu czasowego (krótki, średni, długi) i poziomu ryzyka (niski, średni, wysoki).
  - 2. Formularz zawiera pole tekstowe do opisania celów inwestycyjnych.
  - 3. Zapisane ustawienia strategii są widoczne i możliwe do edycji w profilu użytkownika.

- ID: US-005
- Tytuł: Ręczne dodawanie transakcji
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania nowej transakcji, aby moje dane w aplikacji były zawsze aktualne.
- Kryteria akceptacji:
  - 1. Dostępny jest formularz z polami: data transakcji, ticker, ilość, cena, typ (kupno/sprzedaż).
  - 2. Formularz posiada walidację (np. data nie może być z przyszłości, ilość i cena muszą być liczbami dodatnimi).
  - 3. Po dodaniu transakcji, dane na dashboardzie (wartość portfela, dywersyfikacja) są natychmiast aktualizowane.

- ID: US-006
- Tytuł: Edycja istniejącej transakcji
- Opis: Jako użytkownik, chcę mieć możliwość edycji wcześniej dodanej transakcji, aby poprawić ewentualne błędy.
- Kryteria akceptacji:
  - 1. Na liście transakcji każda pozycja ma opcję "Edytuj".
  - 2. Po kliknięciu "Edytuj" pojawia się formularz wypełniony danymi wybranej transakcji.
  - 3. Po zapisaniu zmian, dane na dashboardzie są przeliczane i aktualizowane.

- ID: US-007
- Tytuł: Przeglądanie dashboardu
- Opis: Jako użytkownik, po zalogowaniu chcę zobaczyć na pulpicie kluczowe informacje o moim portfelu, aby szybko ocenić jego stan.
- Kryteria akceptacji:
  - 1. Dashboard wyświetla łączną wartość portfela w PLN.
  - 2. Dashboard zawiera wykres liniowy pokazujący historyczną zmianę wartości portfela w czasie.
  - 3. Dashboard zawiera wykres kołowy pokazujący dywersyfikację portfela (np. procentowy udział poszczególnych spółek w całości).

- ID: US-008
- Tytuł: Uruchomienie analizy AI
- Opis: Jako użytkownik, chcę uruchomić analizę AI jednym przyciskiem, aby otrzymać spersonalizowane rekomendacje dotyczące mojego portfela.
- Kryteria akceptacji:
  - 1. Na dashboardzie lub w dedykowanej sekcji znajduje się przycisk "Analizuj portfel".
  - 2. Po kliknięciu przycisku system wysyła dane o portfelu i strategii użytkownika do zewnętrznego API (Claude/Gemini).
  - 3. W trakcie analizy wyświetlany jest wskaźnik ładowania.
  - 4. Po zakończeniu analizy jej wyniki (podsumowanie i rekomendacje) są wyświetlane na ekranie.

- ID: US-009
- Tytuł: Przeglądanie wyników analizy AI
- Opis: Jako użytkownik, po zakończeniu analizy AI, chcę zobaczyć jej wyniki w przejrzystej formie, aby podjąć świadome decyzje inwestycyjne.
- Kryteria akceptacji:
  - 1. Wynik analizy jest podzielony na sekcje: ogólne podsumowanie i konkretne rekomendacje.
  - 2. Rekomendacje zawierają ticker spółki, sugerowaną akcję (kup/sprzedaj/trzymaj) oraz krótkie uzasadnienie.
  - 3. Wygenerowana analiza jest automatycznie zapisywana w historii.

- ID: US-010
- Tytuł: Przeglądanie historii analiz
- Opis: Jako użytkownik, chcę mieć dostęp do historii wszystkich wygenerowanych dla mnie analiz, aby móc śledzić zmiany w rekomendacjach w czasie.
- Kryteria akceptacji:
  - 1. Dostępna jest sekcja "Historia analiz".
  - 2. Lista analiz jest posortowana od najnowszej do najstarszej.
  - 3. Każdy element na liście zawiera datę analizy i pozwala na wyświetlenie jej pełnej treści.

## 6. Metryki sukcesu
- 6.1. Jakość rekomendacji: Sukces mierzony będzie subiektywną oceną użytkownika co do trafności i użyteczności porad generowanych przez model. Będzie to śledzone poprzez analizę historii interakcji użytkownika z rekomendacjami (czy postępował zgodnie z nimi) oraz ewolucję wartości jego portfela w czasie.
- 6.2. Regularność użycia (User Retention): Mierzenie częstotliwości powrotów użytkowników do aplikacji (np. logowanie przynajmniej raz w miesiącu) w celu analizy portfela. Wysoka regularność będzie wskaźnikiem użyteczności i wartości, jaką aplikacja dostarcza.
- 6.3. Kompletność i poprawność danych: Kluczowym wskaźnikiem sukcesu jest niski wskaźnik błędów podczas importu danych z plików XTB. Celem jest zapewnienie bezbłędnego przetwarzania co najmniej 99% poprawnie sformatowanych plików.
