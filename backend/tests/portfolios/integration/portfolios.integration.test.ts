// Mock config BEFORE any other imports
jest.mock('../../../src/shared/config/config', () => ({
  __esModule: true,
  default: {
    port: 3000,
    nodeEnv: 'test',
    supabase: {
      url: 'https://test.supabase.co',
      anonKey: 'test-anon-key',
      serviceRoleKey: 'test-service-role-key',
    },
    cookie: {
      name: 'refreshToken',
      httpOnly: true,
      secure: false,
      sameSite: 'strict' as const,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
    marketData: {
      finnhubApiKey: 'mock-api-key',
      finnhubBaseUrl: 'https://finnhub.io/api/v1',
    },
  },
}));

// Mock Supabase
jest.mock('../../../src/shared/config/supabase');

// Now import app and other dependencies
import request from 'supertest';
import app from '../../../src/app';
import { supabase } from '../../../src/shared/config/supabase';

// Mock fetch globally
global.fetch = jest.fn();

describe('Dashboard Endpoint Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockAccessToken = 'valid-access-token';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock successful auth verification by default
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: mockUserId,
          email: 'test@example.com',
          role: 'authenticated',
        },
      },
      error: null,
    });
  });

  afterAll(async () => {
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  describe('GET /api/v1/dashboard', () => {
    const mockPositions = [
      {
        user_id: mockUserId,
        ticker: 'AAPL',
        account_type_id: 1,
        total_quantity: 10,
        avg_price: 150.0,
        total_cost: 1500.0,
        transaction_count: 2,
        first_transaction_date: '2025-01-01',
        last_transaction_date: '2025-01-15',
      },
      {
        user_id: mockUserId,
        ticker: 'GOOGL',
        account_type_id: 1,
        total_quantity: 5,
        avg_price: 140.0,
        total_cost: 700.0,
        transaction_count: 1,
        first_transaction_date: '2025-01-10',
        last_transaction_date: '2025-01-10',
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

    beforeEach(() => {
      // Mock portfolio positions query
      const positionsChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          data: mockPositions,
          error: null,
        }),
      };

      // Mock snapshots query
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
        if (table === 'user_portfolio_positions') {
          return positionsChain;
        }
        if (table === 'portfolio_snapshots') {
          return snapshotsChain;
        }
        return {};
      });

      // Mock Finnhub API responses
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
        return Promise.resolve({
          ok: false,
          status: 404,
        });
      });
    });

    it('should return dashboard data for authenticated user', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('summary');
      expect(response.body).toHaveProperty('history');
      expect(response.body).toHaveProperty('diversification');
    });

    it('should return valid summary structure', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.summary).toHaveProperty('totalValue');
      expect(response.body.summary).toHaveProperty('currency', 'PLN');
      expect(response.body.summary).toHaveProperty('change');
      expect(response.body.summary.change).toHaveProperty('value');
      expect(response.body.summary.change).toHaveProperty('percentage');

      // Verify types
      expect(typeof response.body.summary.totalValue).toBe('number');
      expect(typeof response.body.summary.change.value).toBe('number');
      expect(typeof response.body.summary.change.percentage).toBe('number');
    });

    it('should return valid history array', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.history)).toBe(true);
      expect(response.body.history.length).toBe(2);

      // Verify structure of history items
      response.body.history.forEach((item: any) => {
        expect(item).toHaveProperty('date');
        expect(item).toHaveProperty('value');
        expect(typeof item.date).toBe('string');
        expect(typeof item.value).toBe('number');
      });
    });

    it('should return valid diversification array', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.diversification)).toBe(true);
      expect(response.body.diversification.length).toBeGreaterThan(0);

      // Verify structure of diversification items
      response.body.diversification.forEach((item: any) => {
        expect(item).toHaveProperty('ticker');
        expect(item).toHaveProperty('value');
        expect(item).toHaveProperty('percentage');
        expect(typeof item.ticker).toBe('string');
        expect(typeof item.value).toBe('number');
        expect(typeof item.percentage).toBe('number');
      });

      // Verify percentages sum to ~100% (allow for rounding errors)
      const totalPercentage = response.body.diversification.reduce(
        (sum: number, item: any) => sum + item.percentage,
        0
      );
      expect(totalPercentage).toBeCloseTo(100, -1); // Allow ±5% for rounding
    });

    it('should return 401 when no authorization header is provided', async () => {
      const response = await request(app).get('/api/v1/dashboard');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 when invalid token is provided', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should return 500 when database query fails', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'user_portfolio_positions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          };
        }
        return {};
      });

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle empty portfolio gracefully', async () => {
      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'user_portfolio_positions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: [], error: null }),
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

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalValue).toBe(0);
      expect(response.body.history).toEqual([]);
      expect(response.body.diversification).toEqual([]);
    });

    it('should work with mock prices when API fails', async () => {
      // Mock API failure
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.summary.totalValue).toBeGreaterThan(0);
      expect(response.body.diversification.length).toBeGreaterThan(0);
    });

    it('should calculate correct total value with cash balance', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      
      // Expected: (10 * 155) + (5 * 145) + 100 (cash) = 2375
      expect(response.body.summary.totalValue).toBeCloseTo(2375, 0);
    });

    it('should sort diversification by value descending', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      
      const diversification = response.body.diversification;
      
      // Verify sorting (excluding "Other" which is always last)
      for (let i = 0; i < diversification.length - 1; i++) {
        if (diversification[i].ticker !== 'Other' && diversification[i + 1].ticker !== 'Other') {
          expect(diversification[i].value).toBeGreaterThanOrEqual(
            diversification[i + 1].value
          );
        }
      }
    });
  });
});
