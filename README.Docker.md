# 🐋 Docker Setup dla JANUS AI

Kompletna konfiguracja Docker dla aplikacji JANUS AI z wieloetapowym budowaniem obrazów, bezpieczeństwem i optymalizacją.

## 📋 Wymagania

- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM
- Minimum 10GB wolnego miejsca na dysku

## 🚀 Szybki start

### Produkcja

```bash
# 1. Skopiuj i skonfiguruj zmienne środowiskowe
cp .env.example .env
# Edytuj .env i wypełnij wszystkie wymagane wartości

# 2. Zbuduj i uruchom wszystkie kontenery
docker-compose up -d

# 3. Sprawdź status
docker-compose ps

# 4. Zobacz logi
docker-compose logs -f
```

Aplikacja będzie dostępna pod:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

### Development (z hot reload)

```bash
# 1. Uruchom development environment
docker-compose -f docker-compose.dev.yml up -d

# 2. Zobacz logi w czasie rzeczywistym
docker-compose -f docker-compose.dev.yml logs -f

# 3. Zatrzymaj
docker-compose -f docker-compose.dev.yml down
```

Development będzie dostępny pod:
- Frontend: http://localhost:5173 (Vite dev server)
- Backend: http://localhost:5000 (hot reload)
- PostgreSQL: localhost:5432

## 📦 Struktura obrazów Docker

### Backend (Node.js + Express)
- **Multi-stage build**: Builder stage + Production stage
- **Base image**: `node:20-alpine` (mały, bezpieczny)
- **Security**: Non-root user (nodejs:1001)
- **Signal handling**: dumb-init
- **Health check**: `/health` endpoint
- **Size**: ~150MB (produkcja)

### Frontend (React + Nginx)
- **Multi-stage build**: Builder stage + Nginx stage
- **Base image**: `nginx:alpine` (mały, szybki)
- **Security**: Non-root user (nginx-app:1001)
- **Compression**: Gzip włączony
- **Caching**: Optymalne nagłówki cache
- **SPA routing**: Obsługa React Router
- **Size**: ~50MB (produkcja)

### PostgreSQL
- **Base image**: `postgres:16-alpine`
- **Persistence**: Named volume `postgres_data`
- **Health check**: `pg_isready`

## 🔧 Komendy Docker Compose

### Podstawowe operacje

```bash
# Uruchom wszystkie serwisy
docker-compose up -d

# Zatrzymaj wszystkie serwisy
docker-compose down

# Zatrzymaj i usuń volumes (UWAGA: usunie dane!)
docker-compose down -v

# Przebuduj obrazy
docker-compose build

# Przebuduj bez cache
docker-compose build --no-cache

# Restart pojedynczego serwisu
docker-compose restart backend
```

### Logi i monitoring

```bash
# Zobacz logi wszystkich serwisów
docker-compose logs -f

# Zobacz logi konkretnego serwisu
docker-compose logs -f backend

# Zobacz ostatnie 100 linii logów
docker-compose logs --tail=100 backend

# Sprawdź status health checks
docker-compose ps
```

### Development

```bash
# Uruchom shell w kontenerze
docker-compose exec backend sh
docker-compose exec frontend sh

# Uruchom komendy npm w kontenerze
docker-compose exec backend npm run test
docker-compose exec frontend npm run lint

# Zobacz użycie zasobów
docker stats
```

## 🔒 Bezpieczeństwo

### Zaimplementowane praktyki:

1. **Non-root users** - Wszystkie kontenery używają użytkowników bez uprawnień root
2. **Multi-stage builds** - Zmniejszenie powierzchni ataku
3. **Alpine base images** - Minimalna powierzchnia ataku
4. **Health checks** - Automatyczne sprawdzanie stanu aplikacji
5. **Signal handling** - Graceful shutdown z dumb-init
6. **Security headers** - Helmet w backend, nagłówki w Nginx
7. **.dockerignore** - Wykluczenie wrażliwych plików

### Zmienne środowiskowe:

**NIGDY** nie commituj pliku `.env` do repozytorium!

Wymagane zmienne (z `.env.example`):
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# AI Providers
CLAUDE_API_KEY=your-claude-key
GEMINI_API_KEY=your-gemini-key

# Market Data
FINNHUB_API_KEY=your-finnhub-key
```

## 🎯 Optymalizacja

### Layer caching
- Dependencies są instalowane przed kopiowaniem kodu źródłowego
- Zmiana kodu nie wymusza reinstalacji dependencies

### Image size
- Backend production: ~150MB (vs ~1GB bez multi-stage)
- Frontend production: ~50MB (vs ~500MB bez multi-stage)

### Volumes w development
- Kod jest montowany jako volume (zmiany od razu widoczne)
- node_modules są w osobnym volume (szybsze)

## 🧪 Testowanie

```bash
# Build i test backendu
docker-compose exec backend npm run test

# Build i test frontendu
docker-compose exec frontend npm run test

# E2E testy (lokalnie, nie w kontenerze)
npm run test:e2e
```

## 🐛 Troubleshooting

### Kontenery nie startują

```bash
# Sprawdź logi
docker-compose logs

# Sprawdź health check
docker-compose ps

# Restart z czystym stanem
docker-compose down -v
docker-compose up -d
```

### Port zajęty

```bash
# Zobacz co używa portu
# Windows PowerShell
netstat -ano | findstr :5000

# Zmień port w docker-compose.yml
ports:
  - "5001:5000"  # host:container
```

### Brak miejsca na dysku

```bash
# Usuń nieużywane obrazy
docker image prune -a

# Usuń wszystko nieużywane
docker system prune -a --volumes
```

### Problem z permissions

```bash
# Sprawdź czy user ma odpowiednie uprawnienia
docker-compose exec backend id
# Powinno pokazać: uid=1001(nodejs) gid=1001(nodejs)
```

## 📊 Monitoring produkcyjny

### Health checks

Każdy serwis ma endpoint `/health`:
```bash
# Backend
curl http://localhost:5000/health

# Frontend
curl http://localhost:3000/health
```

### Metryki

```bash
# Użycie zasobów
docker stats

# Zajętość dysków
docker system df
```

## 🚢 Deployment produkcyjny

### Docker Hub

```bash
# Tag obrazu
docker tag janus-ai-backend:latest yourusername/janus-backend:1.0.0

# Push do registry
docker push yourusername/janus-backend:1.0.0
```

### Aktualizacja produkcji

```bash
# Pull najnowsze obrazy
docker-compose pull

# Restart z nowymi obrazami (zero downtime)
docker-compose up -d

# Zobacz co się dzieje
docker-compose logs -f
```

## 📝 Best practices

1. **Zawsze używaj named volumes** dla danych persistentnych
2. **Ustawiaj memory limits** w produkcji
3. **Używaj health checks** dla wszystkich serwisów
4. **Regularnie aktualizuj base images** (security patches)
5. **Monitoruj logi** i metryki
6. **Testuj lokalne przed deployment**
7. **Backup volumes** przed upgrade

## 🔗 Przydatne linki

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Compose File Reference](https://docs.docker.com/compose/compose-file/)
- [Multi-stage builds](https://docs.docker.com/build/building/multi-stage/)
