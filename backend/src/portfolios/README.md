# Portfolios Module

This module handles portfolio dashboard data aggregation and market price integration.

## Overview

The portfolios module provides a comprehensive dashboard endpoint that aggregates:
- Portfolio summary (total value, changes)
- Historical portfolio performance
- Current diversification by ticker

## Endpoint

### `GET /api/v1/dashboard`

Returns complete dashboard data for authenticated user.

**Authentication**: Required (JWT Bearer token)

**Response**:
```json
{
  "summary": {
    "totalValue": 125000.50,
    "currency": "PLN",
    "change": {
      "value": 1200.75,
      "percentage": 0.97
    }
  },
  "history": [
    { "date": "2025-09-01", "value": 118000.00 },
    { "date": "2025-10-19", "value": 125000.50 }
  ],
  "diversification": [
    { "ticker": "AAPL", "value": 25000.00, "percentage": 20.0 },
    { "ticker": "GOOGL", "value": 20000.00, "percentage": 16.0 },
    { "ticker": "Other", "value": 65000.50, "percentage": 52.0 }
  ]
}
```

## Files

- `portfolios.routes.ts` - Express routes with authentication
- `portfolios.controller.ts` - HTTP request handler
- `portfolios.service.ts` - Business logic and data aggregation
- `portfolios.types.ts` - TypeScript type definitions

## Features

### Market Data Integration

The module integrates with **Finnhub API** for real-time market prices.

**Configuration**: Set `FINNHUB_API_KEY` in `.env` file.

**Fallback**: If API key is not configured or API fails, the service falls back to mock prices for development.

### In-Memory Caching

Market prices are cached in-memory to reduce external API calls and improve performance.

- **TTL**: 5 minutes
- **Automatic cleanup**: Every 10 minutes
- **Cache hit logging**: Logs cache hit rate for monitoring

**Benefits**:
- Reduces API calls to Finnhub (free tier: 60 calls/min)
- Faster response times for repeated requests
- Lower costs if using paid tier

### Rate Limiting

Dashboard endpoint is protected with rate limiting to prevent abuse.

- **Limit**: 60 requests per minute per user
- **Key**: User ID (from JWT)
- **Response**: `429 Too Many Requests` when limit exceeded

This aligns with Finnhub's free tier limit of 60 API calls per minute.

### Data Sources

1. **Current Positions**: `user_portfolio_positions` materialized view
2. **Historical Data**: `portfolio_snapshots` table (last 30 days)
3. **Market Prices**: Finnhub API (or mock data as fallback)

### Calculations

- **Total Value**: Sum of (quantity × current price) for all positions + cash balance
- **Change**: Comparison with previous day's snapshot
- **Diversification**: Positions sorted by value, small positions (<1%) grouped as "Other"

## Error Handling

All errors are handled gracefully:
- Database errors → `500 Internal Server Error`
- Invalid auth → `401 Unauthorized` (handled by middleware)
- API failures → Fallback to mock data with warning log

## Testing

Comprehensive test suite with **22 tests** covering:

### Unit Tests (11 tests)
- ✅ Successful data fetching
- ✅ Value calculations
- ✅ Change percentage calculations
- ✅ History formatting
- ✅ Diversification calculations
- ✅ Empty portfolio handling
- ✅ Database error handling
- ✅ API fallback scenarios
- ✅ Small position grouping

### Integration Tests (11 tests)
- ✅ Complete dashboard endpoint flow
- ✅ Authentication verification
- ✅ Response structure validation
- ✅ Rate limiting (429 response)
- ✅ Error handling (401, 500)
- ✅ Empty portfolio handling
- ✅ Mock price fallback
- ✅ Diversification sorting
- ✅ Percentage calculations

**Run tests**:
```bash
# All portfolio tests
npm test -- portfolios

# Unit tests only
npm test -- portfolios.service.test

# Integration tests only
npm test -- portfolios.integration.test
```

## Future Improvements

- [ ] Support multiple currencies with exchange rates
- [ ] Add historical performance metrics (YTD, 1Y, 5Y returns)
- [ ] Implement WebSocket for real-time price updates
- [ ] Add performance analytics (Sharpe ratio, alpha, beta)
- [ ] Add sector/industry diversification breakdown
- [ ] Implement Redis for distributed caching (when scaling horizontally)
