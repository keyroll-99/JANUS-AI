import request from 'supertest';
import app from '../../../src/app';
import { supabaseAdmin } from '../../../src/shared/config/supabase';

// Helper to create properly chained Supabase mock
const createSupabaseMock = (finalValue: any) => {
  const mock: any = {};
  mock.select = jest.fn().mockReturnValue(mock);
  mock.eq = jest.fn().mockReturnValue(mock);
  mock.single = jest.fn().mockResolvedValue(finalValue);
  mock.insert = jest.fn().mockReturnValue(mock);
  mock.update = jest.fn().mockReturnValue(mock);
  mock.order = jest.fn().mockReturnValue(mock);
  mock.range = jest.fn().mockResolvedValue(finalValue);
  return mock;
};

// Mock Supabase
jest.mock('../../../src/shared/config/supabase', () => {
  const mockAuth = {
    getUser: jest.fn(),
  };

  return {
    supabase: {
      auth: mockAuth,
    },
    supabaseAdmin: {
      from: jest.fn(),
      auth: mockAuth,
    },
  };
});

describe('Analysis Endpoints Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockAccessToken = 'valid-access-token';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default auth mock - can be overridden in specific tests
    const mockSupabase = require('../../../src/shared/config/supabase').supabase;
    mockSupabase.auth.getUser.mockResolvedValue({
      data: {
        user: {
          id: mockUserId,
          email: 'user@example.com',
          role: 'authenticated',
        },
      },
      error: null,
    });
  });

  describe('GET /api/v1/analyses/:id', () => {
    const mockAnalysisId = '550e8400-e29b-41d4-a716-446655440000';
    const mockAnalysisData = {
      id: mockAnalysisId,
      analysis_date: '2025-10-19T14:00:00Z',
      portfolio_value: 125000.5,
      ai_model: 'claude-3-haiku-20240307',
      analysis_summary: 'Your portfolio is well-diversified...',
      ai_recommendations: [
        {
          id: 'rec-1',
          ticker: 'AAPL',
          action: 'REDUCE',
          reasoning: 'Position too large',
          confidence: 'HIGH',
        },
      ],
    };

    it('should return analysis details with 200 status', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        createSupabaseMock({ data: mockAnalysisData, error: null })
      );

      const response = await request(app)
        .get(`/api/v1/analyses/${mockAnalysisId}`)
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', mockAnalysisId);
      expect(response.body).toHaveProperty('recommendations');
      expect(response.body.recommendations).toHaveLength(1);
    });

    it('should return 400 for invalid UUID format', async () => {
      const mockSupabase = require('../../../src/shared/config/supabase').supabase;
      mockSupabase.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
              role: 'authenticated',
            },
          },
          error: null,
        }),
      };

      const response = await request(app)
        .get('/api/v1/analyses/invalid-uuid')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app).get(
        `/api/v1/analyses/${mockAnalysisId}`
      );

      expect(response.status).toBe(401);
    });

    it('should return 404 when analysis not found', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        createSupabaseMock({ 
          data: null, 
          error: { code: 'PGRST116', message: 'Not found' } 
        })
      );

      const response = await request(app)
        .get(`/api/v1/analyses/${mockAnalysisId}`)
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/v1/analyses', () => {
    const mockAnalysesList = [
      {
        id: 'analysis-1',
        analysis_date: '2025-10-19T14:00:00Z',
        portfolio_value: 125000.5,
        ai_model: 'claude-3-haiku-20240307',
      },
      {
        id: 'analysis-2',
        analysis_date: '2025-10-18T10:00:00Z',
        portfolio_value: 120000.0,
        ai_model: 'claude-3-haiku-20240307',
      },
    ];

    it('should return paginated analyses with 200 status', async () => {
      const mockDataChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockAnalysesList,
          error: null,
        }),
      };

      const mockCountChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 15,
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockDataChain)
        .mockReturnValueOnce(mockCountChain);

      const mockSupabase = require('../../../src/shared/config/supabase').supabase;
      mockSupabase.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
              role: 'authenticated',
            },
          },
          error: null,
        }),
      };

      const response = await request(app)
        .get('/api/v1/analyses?page=1&limit=10')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toEqual({
        currentPage: 1,
        totalPages: 2,
        totalItems: 15,
        itemsPerPage: 10,
      });
    });

    it('should use default pagination values when not provided', async () => {
      const mockDataChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      };

      const mockCountChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({
          count: 0,
          error: null,
        }),
      };

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(mockDataChain)
        .mockReturnValueOnce(mockCountChain);

      const mockSupabase = require('../../../src/shared/config/supabase').supabase;
      mockSupabase.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
              role: 'authenticated',
            },
          },
          error: null,
        }),
      };

      const response = await request(app)
        .get('/api/v1/analyses')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.itemsPerPage).toBe(10);
    });

    it('should return 400 for limit exceeding maximum', async () => {
      const mockSupabase = require('../../../src/shared/config/supabase').supabase;
      mockSupabase.auth = {
        getUser: jest.fn().mockResolvedValue({
          data: {
            user: {
              id: mockUserId,
              email: 'user@example.com',
              role: 'authenticated',
            },
          },
          error: null,
        }),
      };

      const response = await request(app)
        .get('/api/v1/analyses?limit=150')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app).get('/api/v1/analyses');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/analyses', () => {
    const mockRateLimit = {
      daily_analyses_count: 1,
      daily_limit: 3,
      monthly_analyses_count: 5,
      total_analyses_count: 10,
      last_analysis_date: '2025-10-19',
    };

    const mockStrategy = {
      id: 'strategy-1',
      user_id: mockUserId,
      risk_level: 'MEDIUM',
      time_horizon: 'LONG_TERM',
      investment_goals: 'Growth',
    };

    it('should trigger analysis and return 202 status', async () => {
      const mockAnalysisId = 'new-analysis-123';
      const today = new Date().toISOString().split('T')[0];

      (supabaseAdmin.from as jest.Mock)
        // Rate limit check (.single())
        .mockReturnValueOnce(
          createSupabaseMock({ data: { ...mockRateLimit, last_analysis_date: today }, error: null })
        )
        // Strategy check (.single())
        .mockReturnValueOnce(
          createSupabaseMock({ data: mockStrategy, error: null })
        )
        // Portfolio value
        .mockReturnValueOnce(
          createSupabaseMock({ data: [{ total_cost: 2200.0 }], error: null })
        )
        // Analysis creation
        .mockReturnValueOnce(
          createSupabaseMock({ data: { id: mockAnalysisId }, error: null })
        )
        // Rate limit update
        .mockReturnValueOnce(
          createSupabaseMock({ data: null, error: null })
        );

      const response = await request(app)
        .post('/api/v1/analyses')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('analysisId', mockAnalysisId);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 401 without authentication token', async () => {
      const response = await request(app).post('/api/v1/analyses');

      expect(response.status).toBe(401);
    });

    it('should return 402 when user has no strategy', async () => {
      const today = new Date().toISOString().split('T')[0];

      (supabaseAdmin.from as jest.Mock)
        // Rate limit check passes
        .mockReturnValueOnce(
          createSupabaseMock({ data: { ...mockRateLimit, last_analysis_date: today }, error: null })
        )
        // Strategy check fails - .single() returns null data and error
        .mockReturnValueOnce(
          createSupabaseMock({ data: null, error: { code: 'PGRST116', message: 'Not found' } })
        );

      const response = await request(app)
        .post('/api/v1/analyses')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(402);
    });

    it('should return 429 when daily limit exceeded', async () => {
      const today = new Date().toISOString().split('T')[0];
      const exceededRateLimit = {
        ...mockRateLimit,
        daily_analyses_count: 3,
        daily_limit: 3,
        last_analysis_date: today,
      };

      // Rate limit check returns exceeded limit
      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce(
        createSupabaseMock({ data: exceededRateLimit, error: null })
      );

      const response = await request(app)
        .post('/api/v1/analyses')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(429);
    });
  });
});
