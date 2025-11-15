import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Tables } from '../shared/config/database.types';
import { AppError } from '../shared/errors/AppError';
import config from '../shared/config/config';
import { InMemoryCache } from '../shared/cache/InMemoryCache';
import {
  GetDashboardResponseDto,
  DashboardSummaryDto,
  PortfolioHistoryPointDto,
  DiversificationItemDto,
  MarketPrice,
} from './portfolios.types';

type PortfolioSnapshot = Tables<'portfolio_snapshots'>;

interface AggregatedPosition {
  ticker: string;
  accountTypeId: number | null;
  totalQuantity: number;
  avgPrice: number | null;
  totalCost: number;
  firstTransactionDate: string | null;
  lastTransactionDate: string | null;
}

/**
 * PortfolioService handles all business logic for portfolio/dashboard data
 * - Aggregates data from portfolio snapshots and current positions
 * - Integrates with external market data API for current prices
 * - Calculates portfolio metrics and diversification
 */
export class PortfolioService {
  private readonly HISTORY_DAYS = 30;
  private readonly DIVERSIFICATION_THRESHOLD = 0.01; // 1% - positions below this are grouped as "Other"
  private readonly DEFAULT_CURRENCY = 'PLN';
  private readonly PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // In-memory cache for market prices
  private priceCache = new InMemoryCache<MarketPrice>(this.PRICE_CACHE_TTL);
  
  // In-flight requests to prevent duplicate API calls
  private inflightRequests = new Map<string, Promise<MarketPrice | null>>();
  
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    // Run cleanup every 10 minutes to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      const removed = this.priceCache.cleanup();
      if (removed > 0) {
        console.log(`[PortfolioService] Cleaned up ${removed} expired cache entries`);
      }
    }, 10 * 60 * 1000);

    // Allow cleanup interval to not block process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Cleanup resources (for graceful shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.priceCache.clear();
    this.inflightRequests.clear();
  }

  /**
   * Get complete dashboard data for a user
   * @param userId - Authenticated user ID
   * @returns Complete dashboard data with summary, history, and diversification
   * @throws {AppError} When data fetching or calculation fails
   */
  async getDashboardData(
    supabaseClient: SupabaseClient<Database>,
    userId: string
  ): Promise<GetDashboardResponseDto> {
    try {
      // Fetch all required data in parallel for better performance
      const [currentPositions, historicalSnapshots] = await Promise.all([
        this.getCurrentPositions(supabaseClient, userId),
        this.getHistoricalSnapshots(supabaseClient, userId),
      ]);

      // Get market prices for current positions
      const tickers = currentPositions
        .map((pos) => pos.ticker)
        .filter((ticker): ticker is string => ticker !== null);

      const marketPrices = await this.getMarketPrices(tickers);

      // Calculate all dashboard components
      const summary = this.calculateSummary(
        currentPositions,
        historicalSnapshots,
        marketPrices
      );
      
      const history = this.formatHistory(historicalSnapshots);
      
      const diversification = this.calculateDiversification(
        currentPositions,
        marketPrices,
        summary.totalValue
      );

      return {
        summary,
        history,
        diversification,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      console.error('[PortfolioService] Failed to fetch dashboard data:', { userId, error });
      throw new AppError('Failed to fetch dashboard data', 500);
    }
  }

  /**
   * Fetch current portfolio positions from materialized view
   * @private
   */
  private async getCurrentPositions(
    supabaseClient: SupabaseClient<Database>,
    userId: string
  ): Promise<AggregatedPosition[]> {
    const { data, error } = await supabaseClient
      .from('transactions')
      .select(
        `
        account_type_id,
        ticker,
        quantity,
        total_amount,
        commission,
        transaction_date,
        transaction_types!inner(name)
      `
      )
      .eq('user_id', userId)
      .not('ticker', 'is', null);

    if (error) {
      console.error('[PortfolioService] Failed to aggregate positions from transactions:', {
        userId,
        error,
      });
      throw new AppError('Failed to fetch current positions', 500);
    }

    if (!data || data.length === 0) {
      return [];
    }

    type PositionAccumulator = {
      ticker: string;
      accountTypeId: number | null;
      totalQuantity: number;
      totalCost: number;
      firstTransactionDate: string | null;
      lastTransactionDate: string | null;
    };

    const positions = new Map<string, PositionAccumulator>();

    data.forEach((row: Record<string, unknown>) => {
      const txTypes = row.transaction_types as { name: string } | undefined;
      const typeName = txTypes?.name;
      if (!typeName || (typeName !== 'BUY' && typeName !== 'SELL')) {
        return;
      }

      const ticker = row.ticker as string | null;
      if (!ticker) {
        return;
      }

      const quantity = typeof row.quantity === 'number' ? row.quantity : Number(row.quantity || 0);
      if (!quantity || quantity <= 0) {
        return;
      }

      const totalAmount =
        typeof row.total_amount === 'number' ? row.total_amount : Number(row.total_amount || 0);
      const commission =
        typeof row.commission === 'number' ? row.commission : Number(row.commission || 0);

      const transactionDate = row.transaction_date as string | null;
      const accountTypeId = row.account_type_id as number | null;

      const key = `${accountTypeId ?? 'default'}|${ticker}`;
      let position = positions.get(key);

      if (!position) {
        position = {
          ticker,
          accountTypeId,
          totalQuantity: 0,
          totalCost: 0,
          firstTransactionDate: transactionDate,
          lastTransactionDate: transactionDate,
        };
        positions.set(key, position);
      }

      if (transactionDate) {
        if (!position.firstTransactionDate || transactionDate < position.firstTransactionDate) {
          position.firstTransactionDate = transactionDate;
        }
        if (!position.lastTransactionDate || transactionDate > position.lastTransactionDate) {
          position.lastTransactionDate = transactionDate;
        }
      }

      if (typeName === 'BUY') {
        position.totalQuantity += quantity;
        position.totalCost += totalAmount + commission;
      } else if (typeName === 'SELL') {
        position.totalQuantity -= quantity;
        position.totalCost -= totalAmount - commission;
      }
    });

    const aggregated: AggregatedPosition[] = [];

    positions.forEach((position) => {
      if (position.totalQuantity > 0) {
        const avgPrice = position.totalCost > 0 ? position.totalCost / position.totalQuantity : null;
        aggregated.push({
          ticker: position.ticker,
          accountTypeId: position.accountTypeId,
          totalQuantity: position.totalQuantity,
          avgPrice,
          totalCost: position.totalCost,
          firstTransactionDate: position.firstTransactionDate,
          lastTransactionDate: position.lastTransactionDate,
        });
      }
    });

    return aggregated;
  }

  /**
   * Fetch historical portfolio snapshots for the last N days
   * @private
   */
  private async getHistoricalSnapshots(
    supabaseClient: SupabaseClient<Database>,
    userId: string
  ): Promise<PortfolioSnapshot[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.HISTORY_DAYS);

    const { data, error } = await supabaseClient
      .from('portfolio_snapshots')
      .select('*')
      .eq('user_id', userId)
      .gte('snapshot_date', startDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) {
      console.error('[PortfolioService] Failed to fetch historical snapshots:', { userId, error });
      throw new AppError('Failed to fetch historical snapshots', 500);
    }

    return data || [];
  }

  /**
   * Map XTB ticker format to Finnhub format
   * XTB uses suffixes like .PL for Polish stocks and .US for US stocks
   * Finnhub uses .WA (Warsaw Stock Exchange) for Polish stocks and no suffix for US stocks
   * @private
   */
  private mapTickerToFinnhub(ticker: string): string {
    // Polish stocks: CDR.PL -> CDR.WA
    if (ticker.endsWith('.PL')) {
      return ticker.replace('.PL', '.WA');
    }

    // US stocks: TSLA.US -> TSLA (remove .US suffix)
    if (ticker.endsWith('.US')) {
      return ticker.replace('.US', '');
    }

    // Other exchanges or already correct format
    return ticker;
  }

  /**
   * Fetch price from Stooq API (free, specializes in Polish stocks)
   * @private
   */
  private async fetchPriceFromStooq(ticker: string): Promise<MarketPrice | null> {
    try {
      // Stooq uses format: cdr for CDR.PL
      const symbol = ticker.replace('.PL', '').toLowerCase();
      const url = `https://stooq.com/q/l/?s=${symbol}&f=sd2t2ohlcv&h&e=json`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(
          `[PortfolioService] Stooq API error for ${ticker}: ${response.status}`
        );
        return null;
      }

      const data = await response.json();

      // Stooq returns array of symbols
      if (data.symbols && data.symbols.length > 0) {
        const symbolData = data.symbols[0];
        const price = parseFloat(symbolData.close);
        
        if (price && price > 0) {
          console.log(`[PortfolioService] ✅ Fetched price for ${ticker} from Stooq: ${price} PLN`);
          return {
            ticker,
            price,
            currency: this.DEFAULT_CURRENCY,
          };
        }
      }

      console.warn(`[PortfolioService] No valid price data from Stooq for ${ticker}`);
      return null;
    } catch (error) {
      console.error(`[PortfolioService] Error fetching price from Stooq for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Fetch price from Alpha Vantage API (for Polish stocks and fallback)
   * Note: Alpha Vantage free tier doesn't support Warsaw Stock Exchange
   * Keeping this for potential future use or paid tier
   * @private
   */
  private async fetchPriceFromAlphaVantage(ticker: string): Promise<MarketPrice | null> {
    const apiKey = config.marketData.alphaVantageApiKey;
    if (!apiKey) {
      return null;
    }

    try {
      // Alpha Vantage uses the original ticker format (e.g., CDR.PL as is, or base symbol)
      // For Polish stocks, try removing the .PL suffix for Alpha Vantage
      const symbol = ticker.replace('.PL', '');
      const url = `${config.marketData.alphaVantageBaseUrl}?function=GLOBAL_QUOTE&symbol=${symbol}.WAR&apikey=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.error(
          `[PortfolioService] Alpha Vantage API error for ${ticker}: ${response.status}`
        );
        return null;
      }

      const data = await response.json();

      // Alpha Vantage returns data in "Global Quote" object
      const quote = data['Global Quote'];
      if (quote && quote['05. price']) {
        const price = parseFloat(quote['05. price']);
        if (price > 0) {
          console.log(`[PortfolioService] ✅ Fetched price for ${ticker} from Alpha Vantage: ${price} PLN`);
          return {
            ticker,
            price,
            currency: this.DEFAULT_CURRENCY,
          };
        }
      }

      console.warn(`[PortfolioService] No valid price data from Alpha Vantage for ${ticker}`);
      return null;
    } catch (error) {
      console.error(`[PortfolioService] Error fetching price from Alpha Vantage for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Fetch price for a single ticker from Finnhub API with Alpha Vantage fallback
   * @private
   */
  private async fetchTickerPrice(ticker: string, apiKey: string): Promise<MarketPrice | null> {
    try {
      // Map ticker to Finnhub format
      const finnhubTicker = this.mapTickerToFinnhub(ticker);
      
      const url = `${config.marketData.finnhubBaseUrl}/quote?symbol=${finnhubTicker}&token=${apiKey}`;
      const response = await fetch(url);

      if (!response.ok) {
        // 403 typically means the symbol is not available in the subscription tier
        if (response.status === 403) {
          console.warn(
            `[PortfolioService] Access forbidden for ${ticker} (as ${finnhubTicker}). ` +
            `Trying fallback APIs...`
          );
          
          // Try Stooq for Polish stocks (free, no API key needed)
          if (ticker.endsWith('.PL')) {
            const stooqPrice = await this.fetchPriceFromStooq(ticker);
            if (stooqPrice) {
              return stooqPrice;
            }
            
            // Fallback to Alpha Vantage if Stooq fails
            return await this.fetchPriceFromAlphaVantage(ticker);
          }
        } else {
          console.error(
            `[PortfolioService] Finnhub API error for ${ticker} (as ${finnhubTicker}): ${response.status}`
          );
        }
        return null;
      }

      const data = await response.json();

      // Finnhub returns 'c' for current price
      if (data.c && data.c > 0) {
        return {
          ticker, // Return original ticker from database, not Finnhub format
          price: data.c,
          currency: this.DEFAULT_CURRENCY,
        };
      }

      console.warn(`[PortfolioService] No valid price data for ${ticker} (tried as ${finnhubTicker})`);
      return null;
    } catch (error) {
      console.error(`[PortfolioService] Error fetching price for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Get current market prices for given tickers from Finnhub API
   * Uses in-memory cache to reduce API calls (TTL: 5 minutes)
   * Falls back to mock data if API key is not configured
   * @private
   */
  private async getMarketPrices(tickers: string[]): Promise<Map<string, MarketPrice>> {
    const priceMap = new Map<string, MarketPrice>();

    if (tickers.length === 0) {
      return priceMap;
    }

    // Check if Finnhub API key is configured
    const apiKey = config.marketData?.finnhubApiKey;
    if (!apiKey) {
      console.warn(
        '[PortfolioService] Finnhub API key not configured. Using mock prices.'
      );
      return this.getMockMarketPrices(tickers);
    }

    try {
      // Separate tickers into cached and uncached
      const uncachedTickers: string[] = [];
      
      tickers.forEach((ticker) => {
        const cached = this.priceCache.get(ticker);
        if (cached) {
          priceMap.set(ticker, cached);
        } else {
          uncachedTickers.push(ticker);
        }
      });

      // Log cache hit rate
      if (tickers.length > 0) {
        const hitRate = ((tickers.length - uncachedTickers.length) / tickers.length) * 100;
        console.log(
          `[PortfolioService] Cache hit rate: ${hitRate.toFixed(1)}% (${tickers.length - uncachedTickers.length}/${tickers.length})`
        );
      }

      // Fetch prices only for uncached tickers
      if (uncachedTickers.length > 0) {
        const promises = uncachedTickers.map(async (ticker) => {
          // Check if there's already an in-flight request for this ticker
          const existingRequest = this.inflightRequests.get(ticker);
          if (existingRequest) {
            console.log(`[PortfolioService] Reusing in-flight request for ${ticker}`);
            return existingRequest;
          }

          // Create new request promise
          const requestPromise = this.fetchTickerPrice(ticker, apiKey);
          
          // Store in-flight request
          this.inflightRequests.set(ticker, requestPromise);
          
          // Clean up after completion
          requestPromise.finally(() => {
            this.inflightRequests.delete(ticker);
          });

          return requestPromise;
        });

        const results = await Promise.all(promises);

        // Add valid results to map and cache
        results.forEach((result: MarketPrice | null) => {
          if (result) {
            priceMap.set(result.ticker, result);
            this.priceCache.set(result.ticker, result);
          }
        });
      }

      // If no prices were fetched (all failed), fall back to mock data
      if (priceMap.size === 0) {
        console.warn('[PortfolioService] No prices fetched from API. Using mock data.');
        return this.getMockMarketPrices(tickers);
      }

      return priceMap;
    } catch (error) {
      console.error('[PortfolioService] Market data API error:', error);
      // Fall back to mock data on error
      return this.getMockMarketPrices(tickers);
    }
  }

  /**
   * Generate mock market prices for development/testing
   * @private
   */
  private getMockMarketPrices(tickers: string[]): Map<string, MarketPrice> {
    const priceMap = new Map<string, MarketPrice>();

    tickers.forEach((ticker) => {
      priceMap.set(ticker, {
        ticker,
        price: 100 + Math.random() * 50, // Mock price between 100-150
        currency: this.DEFAULT_CURRENCY,
      });
    });

    return priceMap;
  }

  /**
   * Calculate portfolio summary with total value and changes
   * @private
   */
  private calculateSummary(
    positions: AggregatedPosition[],
    snapshots: PortfolioSnapshot[],
    marketPrices: Map<string, MarketPrice>
  ): DashboardSummaryDto {
    // Calculate current total value from positions
    let investedValue = 0;
    
    positions.forEach((position) => {
      if (!position.ticker || !position.totalQuantity) {
        return;
      }

      const marketPrice = marketPrices.get(position.ticker);
      if (marketPrice) {
        investedValue += position.totalQuantity * marketPrice.price;
      }
    });

    // Get cash balance from most recent snapshot
    const latestSnapshot = snapshots[snapshots.length - 1];
    const cashBalance = latestSnapshot?.cash_balance || 0;
    const totalValue = investedValue + cashBalance;

    // Calculate change from previous day
    const change = { value: 0, percentage: 0 };
    
    if (snapshots.length >= 2) {
      const previousSnapshot = snapshots[snapshots.length - 2];
      const previousValue = previousSnapshot.total_value;
      
      change.value = totalValue - previousValue;
      change.percentage = previousValue > 0 
        ? (change.value / previousValue) * 100 
        : 0;
    }

    return {
      totalValue: Math.round(totalValue * 100) / 100,
      currency: this.DEFAULT_CURRENCY,
      change: {
        value: Math.round(change.value * 100) / 100,
        percentage: Math.round(change.percentage * 100) / 100,
      },
    };
  }

  /**
   * Format historical snapshots for chart display
   * @private
   */
  private formatHistory(
    snapshots: PortfolioSnapshot[]
  ): PortfolioHistoryPointDto[] {
    return snapshots.map((snapshot) => ({
      date: snapshot.snapshot_date,
      value: Math.round(snapshot.total_value * 100) / 100,
    }));
  }

  /**
   * Calculate portfolio diversification by ticker
   * Groups small positions (<1%) into "Other" category
   * @private
   */
  private calculateDiversification(
    positions: AggregatedPosition[],
    marketPrices: Map<string, MarketPrice>,
    totalValue: number
  ): DiversificationItemDto[] {
    if (totalValue === 0) {
      return [];
    }

    const items: DiversificationItemDto[] = [];
    let otherValue = 0;

    positions.forEach((position) => {
      if (!position.ticker || !position.totalQuantity) {
        return;
      }

      const marketPrice = marketPrices.get(position.ticker);
      if (!marketPrice) {
        return;
      }

      const value = position.totalQuantity * marketPrice.price;
      const percentage = (value / totalValue) * 100;

      // Group small positions into "Other"
      if (percentage < this.DIVERSIFICATION_THRESHOLD * 100) {
        otherValue += value;
      } else {
        items.push({
          ticker: position.ticker,
          value: Math.round(value * 100) / 100,
          percentage: Math.round(percentage * 100) / 100,
        });
      }
    });

    // Sort by value descending
    items.sort((a, b) => b.value - a.value);

    // Add "Other" category if there are grouped positions
    if (otherValue > 0) {
      items.push({
        ticker: 'Other',
        value: Math.round(otherValue * 100) / 100,
        percentage: Math.round((otherValue / totalValue) * 100 * 100) / 100,
      });
    }

    return items;
  }
}

// Export singleton instance
export const portfolioService = new PortfolioService();
