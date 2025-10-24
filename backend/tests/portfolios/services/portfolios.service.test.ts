// @ts-nocheck
import { PortfolioService } from '../../../src/portfolios/portfolios.service';
import { supabase } from '../../../src/shared/config/supabase';
import config from '../../../src/shared/config/config';
import { AppError } from '../../../src/shared/errors/AppError';

// Mock Supabase client
jest.mock('../../../src/shared/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock config with proper structure
jest.mock('../../../src/shared/config/config', () => {
  return {
    __esModule: true,
    default: {
      marketData: {
        finnhubApiKey: 'mock-api-key',
        finnhubBaseUrl: 'https://finnhub.io/api/v1',
      },
    },
  };
});

// Mock fetch globally
global.fetch = jest.fn();

describe('PortfolioService', () => {
  let portfolioService: PortfolioService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    portfolioService = new PortfolioService();
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    const mockTransactions = [
      {
        user_id: mockUserId,
        account_type_id: 1,
        ticker: 'AAPL',
        quantity: 10,
        total_amount: 1500.0,
        commission: 0,
        transaction_date: '2025-01-01',
        transaction_types: { name: 'BUY' },
      },
      {
        user_id: mockUserId,
        account_type_id: 1,
        ticker: 'GOOGL',
        quantity: 5,
        total_amount: 700.0,
        commission: 0,
        transaction_date: '2025-01-10',
        transaction_types: { name: 'BUY' },
      },
    ];

    const mockSnapshots = [
      {
        id: 'snapshot-1',
        user_id: mockUserId,
        snapshot_date: '2025-10-18',
        total_value: 2300.0,
        invested_value: 2200.0,
        cash_balance: 100.0,
        unrealized_profit_loss: 50.0,
        realized_profit_loss: 0.0,
        created_at: '2025-10-18T10:00:00Z',
      },
      {
        id: 'snapshot-2',
        user_id: mockUserId,
        snapshot_date: '2025-10-19',
        total_value: 2350.0,
        invested_value: 2250.0,
        cash_balance: 100.0,
        unrealized_profit_loss: 75.0,
        realized_profit_loss: 0.0,
        created_at: '2025-10-19T10:00:00Z',
      },
    ];

    const mockMarketPrices = {
      AAPL: { c: 155.0 },
      GOOGL: { c: 145.0 },
    };

    beforeEach(() => {
      // Mock transactions aggregation query
      const transactionsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        not: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
        }),
      };

      // Mock portfolio_snapshots query
      const snapshotsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({
          data: mockSnapshots,
          error: null,
        }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'transactions') {
          return transactionsChain;
        }
        if (table === 'portfolio_snapshots') {
          return snapshotsChain;
        }
        return {};
      });

      // Mock fetch for market prices
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('AAPL')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockMarketPrices.AAPL),
          });
        }
        if (url.includes('GOOGL')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockMarketPrices.GOOGL),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        });
      });
    });

    it('should successfully fetch complete dashboard data', async () => {
      const result = await portfolioService.getDashboardData(mockUserId);

      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('history');
      expect(result).toHaveProperty('diversification');

      // Verify summary structure
      expect(result.summary).toHaveProperty('totalValue');
      expect(result.summary).toHaveProperty('currency', 'PLN');
      expect(result.summary).toHaveProperty('change');
      expect(result.summary.change).toHaveProperty('value');
      expect(result.summary.change).toHaveProperty('percentage');

      // Verify history is an array
      expect(Array.isArray(result.history)).toBe(true);
      expect(result.history.length).toBe(2);

      // Verify diversification is an array
      expect(Array.isArray(result.diversification)).toBe(true);
      expect(result.diversification.length).toBeGreaterThan(0);
    });

    it('should calculate total value correctly from positions and cash', async () => {
      const result = await portfolioService.getDashboardData(mockUserId);

      // Expected: (10 * 155) + (5 * 145) + 100 (cash) = 1550 + 725 + 100 = 2375
      expect(result.summary.totalValue).toBeCloseTo(2375, 0);
    });

    it('should calculate change from previous snapshot', async () => {
      const result = await portfolioService.getDashboardData(mockUserId);

      // Current value: (10 * 155) + (5 * 145) + 100 = 2375
      // Previous snapshot: 2350
      // Change: 2375 - 2300 (from snapshots[1]) = 75
      // Percentage: (75 / 2300) * 100 ≈ 3.26%
      expect(result.summary.change.value).toBeCloseTo(75, 0);
      expect(result.summary.change.percentage).toBeCloseTo(3.26, 1);
    });

    it('should format history correctly', async () => {
      const result = await portfolioService.getDashboardData(mockUserId);

      expect(result.history).toHaveLength(2);
      expect(result.history[0]).toEqual({
        date: '2025-10-18',
        value: 2300.0,
      });
      expect(result.history[1]).toEqual({
        date: '2025-10-19',
        value: 2350.0,
      });
    });

    it('should calculate diversification with correct percentages', async () => {
      const result = await portfolioService.getDashboardData(mockUserId);

      const aaplItem = result.diversification.find((d) => d.ticker === 'AAPL');
      const googlItem = result.diversification.find((d) => d.ticker === 'GOOGL');

      expect(aaplItem).toBeDefined();
      expect(googlItem).toBeDefined();

      // AAPL: 10 * 155 = 1550 / 2375 ≈ 65.26%
      expect(aaplItem!.value).toBeCloseTo(1550, 0);
      expect(aaplItem!.percentage).toBeCloseTo(65.26, 1);

      // GOOGL: 5 * 145 = 725 / 2375 ≈ 30.53%
      expect(googlItem!.value).toBeCloseTo(725, 0);
      expect(googlItem!.percentage).toBeCloseTo(30.53, 1);
    });

    it('should handle empty portfolio gracefully', async () => {
      // Mock empty data
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'transactions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        if (table === 'portfolio_snapshots') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({ data: [], error: null }),
          };
        }
        return {};
      });

      const result = await portfolioService.getDashboardData(mockUserId);

      expect(result.summary.totalValue).toBe(0);
      expect(result.history).toEqual([]);
      expect(result.diversification).toEqual([]);
    });

    it('should handle database error when fetching positions', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'transactions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          };
        }
        return {};
      });

      await expect(portfolioService.getDashboardData(mockUserId)).rejects.toThrow(AppError);
    });

    it('should handle database error when fetching snapshots', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'transactions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({
              data: mockTransactions,
              error: null,
            }),
          };
        }
        if (table === 'portfolio_snapshots') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          };
        }
        return {};
      });

      await expect(portfolioService.getDashboardData(mockUserId)).rejects.toThrow(AppError);
    });

    it('should fall back to mock prices when API key is missing', async () => {
      // Override config for this test
      const configModule = require('../../../src/shared/config/config');
      const originalKey = configModule.default.marketData.finnhubApiKey;
      configModule.default.marketData.finnhubApiKey = '';

      const result = await portfolioService.getDashboardData(mockUserId);

      // Should still return valid data with mock prices
      expect(result.summary.totalValue).toBeGreaterThan(0);
      expect(result.diversification.length).toBeGreaterThan(0);

      // Restore
      configModule.default.marketData.finnhubApiKey = originalKey;
    });

    it('should fall back to mock prices when API fails', async () => {
      // Mock API failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const result = await portfolioService.getDashboardData(mockUserId);

      // Should still return valid data with mock prices
      expect(result.summary.totalValue).toBeGreaterThan(0);
      expect(result.diversification.length).toBeGreaterThan(0);
    });

    it('should group small positions into "Other" category', async () => {
      const mockTransactionsWithSmall = [
        ...mockTransactions,
        {
          user_id: mockUserId,
          account_type_id: 1,
          ticker: 'TINY',
          quantity: 1,
          total_amount: 5.0,
          commission: 0,
          transaction_date: '2025-01-20',
          transaction_types: { name: 'BUY' },
        },
      ];

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'transactions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            not: jest.fn().mockResolvedValue({
              data: mockTransactionsWithSmall,
              error: null,
            }),
          };
        }
        if (table === 'portfolio_snapshots') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            gte: jest.fn().mockReturnThis(),
            order: jest.fn().mockResolvedValue({
              data: mockSnapshots,
              error: null,
            }),
          };
        }
        return {};
      });

      // Mock market price for TINY
      (global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (url.includes('AAPL')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ c: 155.0 }),
          });
        }
        if (url.includes('GOOGL')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ c: 145.0 }),
          });
        }
        if (url.includes('TINY')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ c: 5.0 }),
          });
        }
        return Promise.resolve({
          ok: false,
          status: 404,
        });
      });

      const result = await portfolioService.getDashboardData(mockUserId);

      // TINY should be grouped into "Other" (5 / 2380 ≈ 0.21% < 1%)
      const otherItem = result.diversification.find((d) => d.ticker === 'Other');
      expect(otherItem).toBeDefined();
      expect(otherItem!.percentage).toBeLessThan(1);
    });
  });
});
