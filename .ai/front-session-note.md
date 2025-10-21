
<conversation_summary>
<decisions>
1.  Analiza AI będzie sygnalizowana za pomocą trwałej notyfikacji (Ant Design `Notification`), która nie zniknie automatycznie i opcjonalnie wyemituje dźwięk, jeśli użytkownik jest na innej karcie.
2.  Widok transakcji zostanie zaimplementowany przy użyciu rozwijanej tabeli (Ant Design `Table` z `expandable`), która domyślnie agreguje dane po tickerze.
3.  Operacje bez tickera (np. wpłaty) będą grupowane w osobnej kategorii w tabeli transakcji.
4.  Odświeżanie danych na dashboardzie będzie inicjowane ręcznie przez użytkownika (np. przyciskiem "Odśwież"), a nie automatycznie po każdej operacji.
5.  Wykresy na dashboardzie będą interaktywne, z tooltipami pokazującymi szczegółowe dane po najechaniu myszką.
6.  Proces importu pliku XTB będzie wizualizowany za pomocą loadera, a po zakończeniu wyświetli statystyki importu (np. liczbę dodanych transakcji).
7.  Puste stany w aplikacji (np. brak transakcji) będą obsługiwane przez komponent `Empty` z wezwaniem do działania (CTA).
8.  Filtrowanie transakcji według typu konta (IKE, IKZE itp.) zostanie zaimplementowane za pomocą komponentu `Select`.
9.  W przypadku wygaśnięcia sesji (nieprawidłowy `refreshToken`), użytkownik zostanie automatycznie przekierowany na stronę logowania.
10. Onboarding dla nowych użytkowników będzie procesem wieloetapowym, obejmującym import danych i definicję strategii.
</decisions>
<matched_recommendations>
1.  **Obsługa analizy AI:** Po uruchomieniu analizy, interfejs nie będzie blokowany. Zamiast tego, po zakończeniu przetwarzania, zostanie wyświetlona trwała notyfikacja (Ant Design `Notification`) z linkiem do wyników, co pozwoli użytkownikowi kontynuować pracę bez przerw.
2.  **Tabela transakcji:** Zostanie użyty komponent `Table` z Ant Design z funkcją `expandable`. Główny widok będzie agregował transakcje po tickerze, a po rozwinięciu wiersza użytkownik zobaczy szczegółową historię operacji dla danego waloru.
3.  **Zarządzanie stanem dashboardu:** Dane dla dashboardu będą pobierane raz i przechowywane w globalnym kontekście React. Zostanie zaimplementowana funkcja ręcznego odświeżania danych, wywoływana przez użytkownika, aby zaktualizować widok.
4.  **Proces importu:** Interfejs importu pliku XTB będzie wykorzystywał komponent `Upload` wewnątrz modala. W trakcie przetwarzania wyświetlany będzie loader, a po pomyślnym imporcie użytkownik otrzyma notyfikację z podsumowaniem (liczbą zaimportowanych transakcji).
5.  **Zarządzanie sesją:** Zostanie zaimplementowany interceptor dla zapytań `fetch`, który w przypadku błędu `401 Unauthorized` spróbuje odświeżyć token. Jeśli odświeżenie się nie powiedzie, aplikacja wyczyści stan uwierzytelnienia i przekieruje użytkownika na stronę logowania.
6.  **Onboarding:** Zostanie zaimplementowany wieloetapowy proces onboardingu (Ant Design `Steps`), który przeprowadzi nowego użytkownika przez kroki importu danych (opcjonalny) i definicji strategii inwestycyjnej.
7.  **Nawigacja:** Główna nawigacja aplikacji będzie oparta na komponencie `Layout` z Ant Design, z bocznym, zwijanym menu (`Sider`) na desktopie i wysuwanym menu na urządzeniach mobilnych.
8.  **Obsługa błędów formularzy:** Błędy walidacji zwracane przez API będą mapowane i wyświetlane bezpośrednio pod odpowiednimi polami w formularzach Ant Design, zapewniając natychmiastową i czytelną informację zwrotną dla użytkownika.
</matched_recommendations>
<ui_architecture_planning_summary>
Na podstawie przeprowadzonej analizy i dyskusji, architektura UI dla MVP aplikacji Janus zostanie zbudowana w oparciu o bibliotekę React i Ant Design, co zapewni spójność wizualną i przyspieszy rozwój.

**Kluczowe widoki i przepływy użytkownika:**
-   **Uwierzytelnianie:** Osobne widoki dla logowania (`/login`) i rejestracji (`/register`).
-   **Onboarding:** Wieloetapowy proces po pierwszym logowaniu, prowadzący przez import danych i definicję strategii.
-   **Dashboard (`/dashboard`):** Główny ekran po zalogowaniu, prezentujący kluczowe metryki (wartość portfela, wykres historii, dywersyfikacja) za pomocą komponentów `Statistic` i `@ant-design/charts`.
-   **Transakcje (`/transactions`):** Widok z rozwijaną tabelą agregującą transakcje po tickerze, z możliwością filtrowania po koncie i ręcznego dodawania/importowania transakcji.
-   **Strategia (`/strategy`):** Formularz do definiowania i edycji strategii inwestycyjnej użytkownika.
-   **Analizy (`/analyses`):** Widok z historią wygenerowanych analiz AI oraz widok szczegółowy pojedynczej analizy.

**Integracja z API i zarządzanie stanem:**
-   Stan uwierzytelnienia (`accessToken`, dane użytkownika) będzie zarządzany globalnie za pomocą React Context.
-   Zostanie zaimplementowany interceptor `fetch` do automatycznego odświeżania tokenów i obsługi wygaśnięcia sesji.
-   Dane dla dashboardu również będą przechowywane w dedykowanym kontekście, z funkcją ręcznego odświeżania.
-   Asynchroniczna natura analizy AI będzie obsługiwana po stronie UI poprzez nieblokujące notyfikacje.
-   Błędy walidacji z API będą bezpośrednio integrowane z formularzami Ant Design.

**Responsywność i Dostępność:**
-   Aplikacja będzie w pełni responsywna dzięki wykorzystaniu systemu siatki (Grid) i responsywnych komponentów Ant Design, takich jak zwijane boczne menu nawigacyjne.
-   Należy zadbać o standardy dostępności, stosując odpowiednie atrybuty ARIA i semantyczny HTML.

**Bezpieczeństwo:**
-   Po stronie UI, głównym mechanizmem bezpieczeństwa będzie zarządzanie cyklem życia tokena JWT (przechowywanie, odświeżanie) oraz obsługa wylogowania po wygaśnięciu sesji.
</ui_architecture_planning_summary>
<unresolved_issues>
-   Należy doprecyzować, w jaki sposób API będzie obsługiwać filtrowanie transakcji po typie konta (np. czy będzie to dodatkowy parametr w `GET /transactions`). Plan API nie uwzględnia tej funkcjonalności.
-   Należy rozważyć mechanizm powiadamiania dźwiękowego na nieaktywnej karcie przeglądarki i jego techniczną implementację (np. za pomocą `Audio` API).
</unresolved_issues>
</conversation_summary>
