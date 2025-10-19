# API Endpoint Implementation Plan: `Auth` Resource

## 1. Przegląd punktu końcowego
Ten dokument opisuje plan wdrożenia zasobu `Auth` (`/api/v1/auth`), który jest kluczowym elementem systemu uwierzytelniania i autoryzacji w aplikacji Janus AI. Implementacja opiera się na wzorcu Backend-for-Frontend (BFF), gdzie serwer Express.js działa jako bezpieczny pośrednik między aplikacją kliencką a usługą Supabase Auth.

Zasób obejmuje następujące punkty końcowe:
-   `POST /auth/register`: Rejestracja nowego użytkownika.
-   `POST /auth/login`: Uwierzytelnianie istniejącego użytkownika.
-   `POST /auth/refresh`: Odświeżanie wygasłego `accessToken` przy użyciu `refreshToken`.
-   `POST /auth/logout`: Bezpieczne wylogowanie użytkownika.

## 2. Szczegóły żądania
-   **Metoda HTTP**: `POST`
-   **Struktura URL**:
    -   `/api/v1/auth/register`
    -   `/api/v1/auth/login`
    -   `/api/v1/auth/refresh`
    -   `/api/v1/auth/logout`
-   **Parametry**:
    -   Wymagane:
        -   Dla `/register` i `/login`: `email` i `password` w ciele żądania (JSON).
        -   Dla `/refresh` i `/logout`: `refreshToken` przesyłany w `httpOnly` cookie.
    -   Opcjonalne: Brak.
-   **Request Body**:
    -   Dla `/register` i `/login`:
        ```json
        {
          "email": "user@example.com",
          "password": "strongpassword123"
        }
        ```
    -   Dla `/refresh` i `/logout`: Puste ciało żądania.

## 3. Wykorzystywane typy
-   **DTO (Data Transfer Objects)**:
    -   `RegisterUserDto`: Schemat `zod` do walidacji danych rejestracji.
        ```typescript
        // backend/src/auth/auth.dto.ts
        import { z } from 'zod';

        export const RegisterUserSchema = z.object({
          email: z.string().email('Invalid email format.'),
          password: z.string().min(8, 'Password must be at least 8 characters long.'),
        });
        export type RegisterUserDto = z.infer<typeof RegisterUserSchema>;
        ```
    -   `LoginUserDto`: Schemat `zod` do walidacji danych logowania.
        ```typescript
        // backend/src/auth/auth.dto.ts
        import { z } from 'zod';

        export const LoginUserSchema = z.object({
          email: z.string().email(),
          password: z.string().min(1),
        });
        export type LoginUserDto = z.infer<typeof LoginUserSchema>;
        ```
-   **Modele odpowiedzi**:
    -   `AuthResponse`: `{ accessToken: string; user: { id: string; email: string; } }`
    -   `RefreshResponse`: `{ accessToken: string }`

## 4. Szczegóły odpowiedzi
-   **`POST /auth/register` (201 Created)**:
    -   Ustawia `refreshToken` w `httpOnly`, `secure`, `SameSite=Strict` cookie.
    -   Zwraca `accessToken` i dane użytkownika w ciele odpowiedzi.
-   **`POST /auth/login` (200 OK)**:
    -   Ustawia `refreshToken` w `httpOnly`, `secure`, `SameSite=Strict` cookie.
    -   Zwraca `accessToken` i dane użytkownika w ciele odpowiedzi.
-   **`POST /auth/refresh` (200 OK)**:
    -   Ustawia nowy `refreshToken` w cookie.
    -   Zwraca nowy `accessToken` w ciele odpowiedzi.
-   **`POST /auth/logout` (204 No Content)**:
    -   Czyści cookie z `refreshToken`.
    -   Nie zwraca treści.

## 5. Przepływ danych
1.  **Żądanie**: Klient wysyła żądanie `POST` do jednego z punktów końcowych `Auth`.
2.  **Middleware**: Żądanie przechodzi przez globalne middleware (np. `cors`, `helmet`).
3.  **Routing**: Express kieruje żądanie do odpowiedniej metody w `AuthController`.
4.  **Walidacja**: Middleware `validateDto` (używające `zod`) sprawdza poprawność ciała żądania dla `/register` i `/login`. W przypadku błędu zwraca `400 Bad Request`.
5.  **Kontroler**: `AuthController` wywołuje odpowiednią metodę w `AuthService`, przekazując dane z DTO lub `refreshToken` z cookie.
6.  **Serwis**: `AuthService` komunikuje się z Supabase Auth, wykonując operacje `signUp`, `signInWithPassword`, `refreshSession` lub `signOut`.
7.  **Supabase**: Supabase Auth przetwarza żądanie i zwraca sesję (z tokenami) lub błąd.
8.  **Obsługa odpowiedzi w serwisie**: `AuthService` przetwarza odpowiedź z Supabase. W przypadku błędu rzuca wyjątek, który jest mapowany na odpowiedni kod HTTP.
9.  **Odpowiedź do klienta**: `AuthController` otrzymuje dane z serwisu, ustawia `refreshToken` w cookie i wysyła odpowiedź (`accessToken`, dane użytkownika) do klienta z odpowiednim kodem statusu.

## 6. Względy bezpieczeństwa
-   **Ochrona przed CSRF**: Cookie z `refreshToken` będzie miał flagę `SameSite=Strict`, co stanowi główną ochronę przed atakami CSRF.
-   **Ochrona przed Brute-Force**: Na endpointy `/register` i `/login` zostanie nałożony `rate-limiter` (`express-rate-limit`), ograniczający liczbę żądań z jednego adresu IP.
-   **Przechowywanie tokenów**:
    -   `refreshToken` będzie przechowywany w `httpOnly`, `secure` cookie, co uniemożliwia dostęp do niego przez JavaScript.
    -   `accessToken` będzie przechowywany w pamięci po stronie klienta, co minimalizuje ryzyko kradzieży przez ataki XSS.
-   **Walidacja danych**: Wszystkie dane wejściowe będą walidowane za pomocą `zod`, aby zapobiec atakom typu injection.
-   **Bezpieczne nagłówki**: Middleware `helmet` zostanie użyte do ustawienia bezpiecznych nagłówków HTTP.

## 7. Obsługa błędów
-   **Błędy walidacji (400 Bad Request)**: Zwracane przez middleware `validateDto` z jasnym opisem błędu.
-   **Błędy uwierzytelniania (401 Unauthorized)**: Zwracane w przypadku nieprawidłowych danych logowania lub nieważnego `refreshToken`.
-   **Konflikt (409 Conflict)**: Zwracany, gdy próba rejestracji dotyczy istniejącego adresu email.
-   **Błędy serwera (500 Internal Server Error)**: Globalny `errorHandler` będzie przechwytywał wszystkie nieobsłużone wyjątki, logował je i zwracał generyczną odpowiedź błędu.

## 8. Rozważania dotyczące wydajności
-   Operacje uwierzytelniania są z natury operacjami I/O (komunikacja sieciowa z Supabase). Czas odpowiedzi będzie głównie zależał od czasu odpowiedzi Supabase Auth.
-   Nie przewiduje się znaczących wąskich gardeł wydajnościowych, ponieważ operacje te nie są intensywne obliczeniowo.
-   Połączenie z Supabase będzie zarządzane przez `SupabaseClient`, który powinien efektywnie zarządzać połączeniami.

## 9. Etapy wdrożenia
1.  **Struktura plików**: Utworzenie katalogów i plików:
    -   `backend/src/auth/auth.routes.ts`
    -   `backend/src/auth/auth.controller.ts`
    -   `backend/src/auth/auth.service.ts`
    -   `backend/src/auth/auth.dto.ts`
2.  **Definicje DTO**: Zaimplementowanie schematów walidacji `RegisterUserSchema` i `LoginUserSchema` w `auth.dto.ts` przy użyciu `zod`.
3.  **Konfiguracja Supabase**: Upewnienie się, że `SupabaseClient` jest poprawnie skonfigurowany i dostępny w aplikacji (zgodnie z `backend/src/shared/config/supabase.ts`).
4.  **Implementacja `AuthService`**:
    -   Stworzenie metod `register`, `login`, `refresh`, `logout`.
    -   Implementacja logiki komunikacji z `supabase.auth` w każdej z metod.
    -   Dodanie obsługi błędów zwracanych przez Supabase.
5.  **Implementacja `AuthController`**:
    -   Stworzenie metod obsługujących żądania HTTP.
    -   Implementacja logiki wywoływania metod z `AuthService`.
    -   Dodanie logiki ustawiania i czyszczenia `refreshToken` w `httpOnly` cookies.
6.  **Implementacja `auth.routes.ts`**:
    -   Zdefiniowanie tras dla wszystkich czterech endpointów.
    -   Dodanie middleware walidującego DTO do tras `/register` i `/login`.
    -   Dodanie middleware `rate-limiter`.
7.  **Integracja z `app.ts`**: Zarejestrowanie `authRouter` w głównej aplikacji Express.
8.  **Zmienne środowiskowe**: Dodanie ewentualnych nowych zmiennych (np. `COOKIE_SECRET`) do `.env.example` i konfiguracji.
9.  **Testy jednostkowe i integracyjne**:
    -   Napisanie testów jednostkowych dla `AuthService` z mockowaniem `SupabaseClient`.
    -   Napisanie testów integracyjnych dla endpointów API przy użyciu `supertest`.
10. **Dokumentacja**: Aktualizacja dokumentacji API (np. w Postman lub Swagger), jeśli jest używana.
