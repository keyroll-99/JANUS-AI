import request from 'supertest';
import app from '../../../src/app';
import { supabase } from '../../../src/shared/config/supabase';

// Mock Supabase
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

jest.mock('../../../src/shared/config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
  createUserSupabaseClient: jest.fn(() => mockSupabaseClient),
}));

describe('Strategy Endpoints Integration Tests', () => {
  const mockUserId = 'user-123';
  const mockAccessToken = 'valid-access-token';

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock auth verification for requireAuth middleware
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: {
        user: {
          id: mockUserId,
          email: 'test@example.com',
        },
      },
      error: null,
    });
  });

  describe('GET /api/v1/strategy', () => {
    it('should return user strategy when it exists', async () => {
      const mockStrategy = {
        id: 'strategy-123',
        time_horizon: 'LONG',
        risk_level: 'MEDIUM',
        investment_goals: 'Długoterminowy wzrost i dochód z dywidend.',
        updated_at: '2025-10-19T10:00:00Z',
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockStrategy,
          error: null,
        }),
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue(mockChain);

      const response = await request(app)
        .get('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'strategy-123',
        timeHorizon: 'LONG',
        riskLevel: 'MEDIUM',
        investmentGoals: 'Długoterminowy wzrost i dochód z dywidend.',
        updatedAt: '2025-10-19T10:00:00Z',
      });
    });

    it('should return 404 when strategy does not exist', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue(mockChain);

      const response = await request(app)
        .get('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('nie została znaleziona');
    });

    it('should return 401 without authorization token', async () => {
      const response = await request(app).get('/api/v1/strategy');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/strategy', () => {
    const validStrategyData = {
      timeHorizon: 'LONG',
      riskLevel: 'MEDIUM',
      investmentGoals: 'Długoterminowy wzrost i dochód z dywidend.',
    };

    it('should create a new strategy with valid data', async () => {
      const mockCreatedStrategy = {
        id: 'strategy-123',
        time_horizon: 'LONG',
        risk_level: 'MEDIUM',
        investment_goals: 'Długoterminowy wzrost i dochód z dywidend.',
        updated_at: '2025-10-19T10:00:00Z',
      };

      // Mock check for existing strategy (returns null)
      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      // Mock insert operation
      const mockInsertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCreatedStrategy,
          error: null,
        }),
      };

      (mockSupabaseClient.from as jest.Mock)
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockInsertChain);

      const response = await request(app)
        .post('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`)
        .send(validStrategyData);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: 'strategy-123',
        timeHorizon: 'LONG',
        riskLevel: 'MEDIUM',
        investmentGoals: 'Długoterminowy wzrost i dochód z dywidend.',
        updatedAt: '2025-10-19T10:00:00Z',
      });
    });

    it('should return 409 when strategy already exists', async () => {
      const mockExistingStrategy = {
        id: 'existing-strategy-123',
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockExistingStrategy,
          error: null,
        }),
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue(mockChain);

      const response = await request(app)
        .post('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`)
        .send(validStrategyData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('już istnieje');
    });

    it('should return 400 for invalid timeHorizon', async () => {
      const response = await request(app)
        .post('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`)
        .send({
          timeHorizon: 'INVALID',
          riskLevel: 'MEDIUM',
          investmentGoals: 'Test goals for validation',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return 400 for invalid riskLevel', async () => {
      const response = await request(app)
        .post('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`)
        .send({
          timeHorizon: 'LONG',
          riskLevel: 'INVALID',
          investmentGoals: 'Test goals for validation',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return 400 for too short investmentGoals', async () => {
      const response = await request(app)
        .post('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`)
        .send({
          timeHorizon: 'LONG',
          riskLevel: 'MEDIUM',
          investmentGoals: 'Short',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return 400 for too long investmentGoals', async () => {
      const response = await request(app)
        .post('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`)
        .send({
          timeHorizon: 'LONG',
          riskLevel: 'MEDIUM',
          investmentGoals: 'a'.repeat(501),
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return 401 without authorization token', async () => {
      const response = await request(app).post('/api/v1/strategy').send(validStrategyData);

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/strategy', () => {
    const updateStrategyData = {
      timeHorizon: 'SHORT',
      riskLevel: 'LOW',
      investmentGoals: 'Bezpieczne inwestycje z zachowaniem kapitału.',
    };

    it('should update existing strategy with valid data', async () => {
      const mockUpdatedStrategy = {
        id: 'strategy-123',
        time_horizon: 'SHORT',
        risk_level: 'LOW',
        investment_goals: 'Bezpieczne inwestycje z zachowaniem kapitału.',
        updated_at: '2025-10-19T12:00:00Z',
      };

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUpdatedStrategy,
          error: null,
        }),
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue(mockChain);

      const response = await request(app)
        .put('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`)
        .send(updateStrategyData);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: 'strategy-123',
        timeHorizon: 'SHORT',
        riskLevel: 'LOW',
        investmentGoals: 'Bezpieczne inwestycje z zachowaniem kapitału.',
        updatedAt: '2025-10-19T12:00:00Z',
      });
    });

    it('should return 404 when strategy does not exist', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };

      (mockSupabaseClient.from as jest.Mock).mockReturnValue(mockChain);

      const response = await request(app)
        .put('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`)
        .send(updateStrategyData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('nie została znaleziona');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .put('/api/v1/strategy')
        .set('Authorization', `Bearer ${mockAccessToken}`)
        .send({
          timeHorizon: 'INVALID',
          riskLevel: 'LOW',
          investmentGoals: 'Test goals',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });

    it('should return 401 without authorization token', async () => {
      const response = await request(app).put('/api/v1/strategy').send(updateStrategyData);

      expect(response.status).toBe(401);
    });
  });
});
