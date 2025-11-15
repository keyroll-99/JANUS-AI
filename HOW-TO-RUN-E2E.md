# INSTRUKCJA: Jak uruchomić testy E2E

## Najprostszy sposób (3 terminale)

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```
Poczekaj aż zobaczysz: `Server running on port 5000`

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```
Poczekaj aż zobaczysz: `Local: http://localhost:5173`

### Terminal 3 - Testy
```bash
npm run test:e2e
```

---

## Lub użyj automatycznego skryptu

```powershell
.\run-e2e-tests.ps1
```

Ten skrypt automatycznie:
1. Sprawdzi Supabase
2. Uruchomi backend
3. Uruchomi frontend
4. Uruchomi testy
5. Zatrzyma serwery

---

## Troubleshooting

### Błąd: Backend nie startuje
```bash
cd backend
cat .env  # Sprawdź czy masz prawidłowe SUPABASE_URL
npx supabase start  # Uruchom lokalny Supabase jeśli nie działa
```

### Błąd: "ECONNREFUSED 127.0.0.1:5000"
Backend nie działa. Uruchom w osobnym terminalu:
```bash
cd backend
npm run dev
```

### Błąd: "ECONNREFUSED 127.0.0.1:5173"
Frontend nie działa. Uruchom w osobnym terminalu:
```bash
cd frontend
npm run dev
```

### Testy przechodzą za wolno
Użyj UI mode - lepszy do developmentu:
```bash
npm run test:e2e:ui
```

---

## Wyniki testów

Po testach zobacz raport:
```bash
npm run test:e2e:report
```

Pliki logów:
- `playwright-report/` - HTML raport
- `test-results/` - Screenshots i traces

---

## Więcej info

Zobacz: `e2e/QUICKSTART.md`
