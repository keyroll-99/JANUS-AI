# AI Analysis Module

## Overview
The AI Analysis module handles all functionality related to AI-powered portfolio analysis. It allows users to request portfolio analyses, view historical analyses, and receive AI-generated recommendations for their investment portfolios.

## Features
- **Request Portfolio Analysis**: Trigger a new AI analysis of user's portfolio (with rate limiting)
- **View Analysis Details**: Retrieve detailed information about a specific analysis including recommendations
- **List Historical Analyses**: Browse paginated list of past analyses

## API Endpoints

### POST /api/v1/analyses
Initiates a new AI portfolio analysis (asynchronous process).

**Authentication**: Required (JWT Bearer token)

**Response**: `202 Accepted`
```json
{
  "message": "Portfolio analysis has been initiated. The result will be available shortly.",
  "analysisId": "uuid"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication token
- `402 Payment Required`: User hasn't defined an investment strategy
- `429 Too Many Requests`: Daily analysis limit exceeded (default: 3 per day)

**Preconditions**:
1. User must have defined an investment strategy
2. User must not have exceeded their daily analysis limit

---

### GET /api/v1/analyses/:id
Retrieves detailed information about a specific analysis.

**Authentication**: Required (JWT Bearer token)

**Parameters**:
- `id` (path): UUID of the analysis

**Response**: `200 OK`
```json
{
  "id": "uuid",
  "analysisDate": "2025-10-19T14:00:00Z",
  "portfolioValue": 125000.50,
  "aiModel": "claude-3-haiku-20240307",
  "analysisSummary": "Your portfolio is well-diversified...",
  "recommendations": [
    {
      "id": "uuid",
      "ticker": "AAPL",
      "action": "REDUCE",
      "reasoning": "Position too large",
      "confidence": "HIGH"
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Analysis doesn't exist or doesn't belong to user

---

### GET /api/v1/analyses
Retrieves a paginated list of user's historical analyses.

**Authentication**: Required (JWT Bearer token)

**Query Parameters**:
- `page` (optional): Page number (default: 1, min: 1)
- `limit` (optional): Items per page (default: 10, max: 100)

**Response**: `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "analysisDate": "2025-10-19T14:00:00Z",
      "portfolioValue": 125000.50,
      "aiModel": "claude-3-haiku-20240307"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid pagination parameters (e.g., limit > 100)
- `401 Unauthorized`: Missing or invalid authentication token

## Architecture

### Structure
```
ai-analysis/
├── analysis.controller.ts    # HTTP request handlers
├── analysis.service.ts        # Business logic
├── analysis.routes.ts         # Route definitions
├── analysis.types.ts          # TypeScript interfaces/DTOs
├── analysis.validation.ts     # Zod validation schemas
├── analysis.errors.ts         # Custom error classes
└── index.ts                   # Barrel export
```

### Components

#### AnalysisService
Handles all business logic:
- **Rate limiting**: Checks and enforces daily analysis limits
- **Precondition validation**: Verifies user has investment strategy
- **Data fetching**: Retrieves analyses and recommendations from database
- **Background processing**: Initiates asynchronous AI analysis

#### AnalysisController
Manages HTTP requests and responses:
- Extracts authenticated user ID from request
- Calls appropriate service methods
- Formats responses
- Delegates error handling to global error handler

#### Analysis Router
Defines API routes with middleware:
- Authentication middleware (`requireAuth`)
- Validation middleware (`validateDto`)
- Route handlers from controller

### Data Flow

#### Triggering New Analysis (POST)
1. User sends POST request with JWT token
2. Authentication middleware verifies token
3. Controller extracts user ID
4. Service checks rate limit (throws `TooManyRequestsError` if exceeded)
5. Service verifies investment strategy exists (throws `PreconditionFailedError` if missing)
6. Service creates initial analysis record in database
7. Service triggers background AI analysis (non-blocking)
8. Service updates rate limit counters
9. Controller returns 202 Accepted with analysis ID

#### Background Analysis Process (Future Implementation)
1. Gather portfolio positions
2. Gather transaction history
3. Fetch investment strategy
4. Generate AI prompt
5. Call AI API (Claude Haiku)
6. Parse AI response
7. Update analysis record with summary
8. Create recommendation records
9. Log completion/errors

## Database Schema

### Tables Used
- `ai_analyses`: Stores analysis metadata and summary
- `ai_recommendations`: Stores individual recommendations per analysis
- `user_rate_limits`: Tracks analysis usage per user
- `investment_strategies`: User's investment strategy (prerequisite)
- `user_portfolio_positions`: Current portfolio positions (for analysis input)

## Error Handling

### Custom Errors
- **AnalysisNotFoundError** (404): Analysis doesn't exist or doesn't belong to user
- **TooManyRequestsError** (429): User exceeded daily analysis limit
- **PreconditionFailedError** (402): User hasn't defined investment strategy

All errors are caught by the global error handler and returned with appropriate HTTP status codes and messages.

## Rate Limiting

### Limits
- **Daily limit**: 3 analyses per day (default)
- **Reset**: Automatically resets at midnight (based on `last_analysis_date`)

### Implementation
Rate limits are stored in `user_rate_limits` table:
- `daily_analyses_count`: Current day's count
- `monthly_analyses_count`: Current month's count
- `total_analyses_count`: All-time count
- `daily_limit`: Configurable limit (default: 3)
- `last_analysis_date`: Date of last analysis

## Security

### Authentication
All endpoints require valid JWT token in Authorization header:
```
Authorization: Bearer <token>
```

### Authorization
- Users can only access their own analyses
- Service layer enforces user_id filtering on all database queries
- Prevents IDOR (Insecure Direct Object Reference) attacks

### Data Isolation
- All database queries filter by authenticated user's ID
- No cross-user data leakage
- Rate limiting prevents abuse

## Testing

### Unit Tests
Located in `tests/ai-analysis/services/`
- `analysis.service.test.ts`: Tests for AnalysisService methods
- Mocks Supabase client
- Tests all business logic scenarios

### Integration Tests
Located in `tests/ai-analysis/integration/`
- `analysis.integration.test.ts`: End-to-end API tests
- Tests all HTTP endpoints
- Validates request/response formats
- Tests authentication and authorization

### Running Tests
```bash
# Run all tests
npm test

# Run tests for specific module
npm test -- ai-analysis

# Run with coverage
npm test -- --coverage
```

## Future Enhancements

### Phase 1 (Current MVP)
- ✅ Basic analysis CRUD operations
- ✅ Rate limiting
- ✅ Authentication/Authorization
- ⏳ Background AI analysis implementation

### Phase 2 (Post-MVP)
- [ ] Implement actual AI analysis logic
- [ ] Integration with Claude/Gemini API
- [ ] Prompt engineering for portfolio analysis
- [ ] Advanced recommendation algorithms

### Phase 3 (Future)
- [ ] Queue system for background jobs (BullMQ + Redis)
- [ ] Websocket notifications for analysis completion
- [ ] Analysis scheduling (periodic portfolio reviews)
- [ ] Comparison with previous analyses
- [ ] Performance tracking vs recommendations

## Dependencies
- `express`: Web framework
- `zod`: Schema validation
- `@supabase/supabase-js`: Database client
- `express-rate-limit`: General API rate limiting
- Jest/Supertest: Testing

## Environment Variables
No module-specific environment variables. Uses shared Supabase configuration.

## Contributing
Follow the project's coding guidelines (see `.github/copilot-instructions.md`):
- Use conventional commits
- Write tests for new features
- Follow TypeScript best practices
- Document public APIs
