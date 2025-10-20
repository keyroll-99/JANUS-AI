# Cache Architecture & Race Condition Prevention

## Problem (Before Fix)

### Issue 1: Concurrent API Calls
When multiple simultaneous HTTP requests needed the same ticker price:

```
Time  Request 1          Request 2
-------------------------------------------
T1    Check cache        -
      (AAPL not found)   
T2    Start API call     Check cache
                         (AAPL not found)
T3    -                  Start API call (DUPLICATE!)
T4    Save to cache      -
T5    -                  Save to cache (overwrite)
```

**Result**: Duplicate API calls for the same ticker, wasting API quota.

### Issue 2: Node.js Single-Threaded Nature
While Node.js is single-threaded, async operations can interleave:
- Request A starts fetching AAPL
- Before A completes, Request B also starts fetching AAPL
- Both requests hit the Finnhub API

## Solution: In-Flight Request Deduplication

### Architecture

```typescript
export class PortfolioService {
  // Shared across all requests (singleton)
  private priceCache = new InMemoryCache<MarketPrice>(this.PRICE_CACHE_TTL);
  
  // Tracks ongoing API requests by ticker
  private inflightRequests = new Map<string, Promise<MarketPrice | null>>();
}
```

### How It Works

```
Time  Request 1                Request 2
---------------------------------------------------------------
T1    Check cache              -
      (AAPL not found)         
T2    Check inflightRequests   -
      (AAPL not in-flight)
T3    Start API Promise        -
      Store in inflightRequests
T4    -                        Check cache (not found)
T5    -                        Check inflightRequests
                               (AAPL IS in-flight!)
T6    -                        Reuse existing Promise
T7    Promise resolves         Promise resolves (same!)
T8    Remove from inflight     -
T9    Save to cache            Use cached result
```

### Code Flow

```typescript
// Check if there's already an in-flight request
const existingRequest = this.inflightRequests.get(ticker);
if (existingRequest) {
  console.log(`Reusing in-flight request for ${ticker}`);
  return existingRequest; // Wait for existing Promise
}

// Create new request promise
const requestPromise = this.fetchTickerPrice(ticker, apiKey);

// Store in-flight request (prevents duplicates)
this.inflightRequests.set(ticker, requestPromise);

// Clean up after completion
requestPromise.finally(() => {
  this.inflightRequests.delete(ticker);
});
```

## Why This Works in Node.js

### Single-Threaded Event Loop
Node.js processes one event at a time, so:

1. ✅ **Map access is atomic** - no race conditions on Map reads/writes
2. ✅ **Promises are shared references** - multiple requests can await the same Promise
3. ✅ **finally() ensures cleanup** - even if Promise rejects, we clean up

### Concurrency Without Threads
```javascript
// Request 1
const promise = fetchPrice('AAPL'); // Creates Promise
inflightRequests.set('AAPL', promise);

// Request 2 (interleaved, not parallel)
const existing = inflightRequests.get('AAPL'); // Gets SAME Promise
await existing; // Waits for Request 1's Promise
```

## Benefits

### 1. API Call Reduction
**Before**: N concurrent requests = N API calls  
**After**: N concurrent requests = 1 API call

**Example**:
- 5 users refresh dashboard simultaneously
- All need AAPL price
- **Before**: 5 API calls
- **After**: 1 API call, 4 requests wait

### 2. Cost Savings
- Finnhub free tier: 60 calls/min
- With 100 users, 20 tickers each = 2000 potential calls/min
- **After deduplication**: ~100-200 calls/min (80-90% reduction)

### 3. Faster Response
- Request 2 doesn't wait for network round-trip
- Request 2 waits for Request 1's Promise (already in-progress)
- **Savings**: ~0-500ms depending on when Request 2 arrives

## Cache Layers

### Layer 1: In-Memory Cache (5 min TTL)
```typescript
private priceCache = new InMemoryCache<MarketPrice>(5 * 60 * 1000);
```
- **Purpose**: Avoid API calls for recent data
- **Shared**: All requests see the same cache
- **Persistence**: Lost on server restart (acceptable for MVP)

### Layer 2: In-Flight Request Map
```typescript
private inflightRequests = new Map<string, Promise<MarketPrice | null>>();
```
- **Purpose**: Deduplicate concurrent requests
- **Lifetime**: Only while request is in-flight (~100-500ms)
- **Automatic cleanup**: Removed when Promise settles

### Combined Flow
```
Request for AAPL:
1. Check priceCache → Found? Return immediately ✅
2. Check inflightRequests → In-flight? Wait for Promise ⏳
3. Neither? Start new API call → Cache result → Return ✅
```

## Singleton Pattern

```typescript
// Export singleton instance
export const portfolioService = new PortfolioService();
```

### Why Singleton?
- **Shared state**: All requests use same cache and inflight map
- **Memory efficiency**: One cache instance, not per-request
- **Consistency**: All users see same cached prices

### Memory Implications
- Cache: ~1KB per ticker × 100 tickers = ~100KB
- In-flight: ~500 bytes × 10 concurrent = ~5KB
- **Total**: <200KB for typical usage

## Edge Cases Handled

### 1. API Failure During In-Flight
```typescript
const promise = fetchPrice('AAPL'); // Starts
// ... API fails ...
promise.finally(() => {
  inflightRequests.delete('AAPL'); // Cleanup happens
});
// Next request will try again (not cached)
```

### 2. Timeout/Slow API
- All waiting requests timeout together (shared Promise)
- Subsequent requests start fresh (after cleanup)

### 3. Partial Results
```typescript
// If some tickers succeed, some fail:
if (priceMap.size === 0) {
  return this.getMockMarketPrices(tickers); // Fallback
}
// Otherwise, use what we got
```

## Testing Considerations

### Mocking In-Flight Requests
```typescript
// In tests, we can verify deduplication:
const service = new PortfolioService();

// Mock fetch to track calls
let apiCallCount = 0;
global.fetch = jest.fn(() => {
  apiCallCount++;
  return Promise.resolve({ ok: true, json: () => ({ c: 100 }) });
});

// Make concurrent requests
await Promise.all([
  service.getMarketPrices(['AAPL']),
  service.getMarketPrices(['AAPL']),
  service.getMarketPrices(['AAPL']),
]);

// Should only call API once
expect(apiCallCount).toBe(1);
```

## Performance Metrics

### Cache Hit Rate
```typescript
const hitRate = ((cached / total) * 100).toFixed(1);
console.log(`Cache hit rate: ${hitRate}%`);
```

**Expected rates**:
- First minute: 0-20% (cold start)
- After 5 minutes: 80-95% (steady state)
- Peak usage: 95-99% (many concurrent users)

### Deduplication Rate
```
Concurrent requests for same ticker / Total requests
```

**Expected**:
- Low traffic: 5-10%
- High traffic: 20-40%
- Burst traffic: 60-80%

## Monitoring

### Logs to Watch
```
[PortfolioService] Cache hit rate: 85.7% (6/7)
[PortfolioService] Reusing in-flight request for AAPL
[PortfolioService] Cleaned up 12 expired cache entries
```

### Red Flags
- Cache hit rate <50% → Increase TTL or investigate
- Many "Reusing in-flight" → Good! Deduplication working
- No cache hits → Cache broken or TTL too short

## Future Enhancements

### Phase 2: Redis
```typescript
// Distributed cache for horizontal scaling
private priceCache = new RedisCache<MarketPrice>(redis, TTL);
```

**Benefits**:
- Shared across multiple server instances
- Survives server restarts
- Can handle millions of entries

**Trade-offs**:
- Added dependency (Redis)
- Network latency (~1-5ms)
- More complex deployment

### Phase 3: Circuit Breaker
```typescript
if (apiFailureCount > 5) {
  // Stop hitting API for 1 minute
  return getMockMarketPrices(tickers);
}
```

**Prevents**:
- API rate limit exhaustion
- Cascade failures
- Wasted API quota

## Summary

✅ **Thread-safe** (Node.js single-threaded)  
✅ **No race conditions** (atomic Map operations)  
✅ **Efficient** (deduplicate concurrent requests)  
✅ **Resilient** (automatic cleanup on success/failure)  
✅ **Observable** (logging for monitoring)  

**Key Insight**: Leverage Node.js's async nature - multiple requests can await the same Promise without blocking or duplicating work.
