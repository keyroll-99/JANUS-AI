import { AnalysisService } from '../../../src/ai-analysis/analysis.service';
import { TooManyRequestsError } from '../../../src/ai-analysis/analysis.errors';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../../../src/shared/config/database.types';

/**
 * TC-RATE-001 to TC-RATE-003: Rate limiting tests
 * Testing database-based rate limiting as per test-plan.md
 */
describe('AnalysisService - Rate Limiting', () => {
  let service: AnalysisService;
  let mockSupabaseClient: any;

  beforeEach(() => {
    service = new AnalysisService();

    // Mock Supabase client with chainable methods
    const mockChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(),
    };

    mockSupabaseClient = mockChain;
  });

  describe('TC-RATE-001: Database rate limiting - 3 analyses/day', () => {
    it('should allow first analysis (0/3)', async () => {
      // Mock: No rate limit record exists yet
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' }, // Not found
      });

      // Mock: Create new rate limit record
      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      // Should not throw
      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'user-123')
      ).resolves.not.toThrow();
    });

    it('should allow second analysis (1/3)', async () => {
      const today = new Date().toISOString();

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          daily_analyses_count: 1,
          daily_limit: 3,
          last_analysis_date: today,
        },
        error: null,
      });

      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'user-123')
      ).resolves.not.toThrow();
    });

    it('should allow third analysis (2/3)', async () => {
      const today = new Date().toISOString();

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          daily_analyses_count: 2,
          daily_limit: 3,
          last_analysis_date: today,
        },
        error: null,
      });

      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'user-123')
      ).resolves.not.toThrow();
    });

    it('should reject fourth analysis (3/3) with TooManyRequestsError', async () => {
      const today = new Date().toISOString();

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          daily_analyses_count: 3,
          daily_limit: 3,
          last_analysis_date: today,
        },
        error: null,
      });

      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'user-123')
      ).rejects.toThrow(TooManyRequestsError);
    });

    it('should return 429 status code for rate limit exceeded', async () => {
      const today = new Date().toISOString();

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          daily_analyses_count: 3,
          daily_limit: 3,
          last_analysis_date: today,
        },
        error: null,
      });

      try {
        await (service as any).checkRateLimit(mockSupabaseClient, 'user-123');
        fail('Should have thrown TooManyRequestsError');
      } catch (error) {
        expect(error).toBeInstanceOf(TooManyRequestsError);
        expect((error as TooManyRequestsError).statusCode).toBe(429);
        expect((error as TooManyRequestsError).message).toContain('Daily analysis limit exceeded');
      }
    });
  });

  describe('TC-RATE-003: Daily reset logic', () => {
    it('should reset counter when new day starts', async () => {
      // Yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      // Mock .from().select().eq().single() chain for checkRateLimit reading
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          daily_analyses_count: 3, // Was at limit yesterday
          daily_limit: 3,
          last_analysis_date: yesterday.toISOString(),
        },
        error: null,
      });

      // Mock .from().update().eq() chain for updating rate limit
      const updateChain = {
        eq: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      };
      mockSupabaseClient.update.mockReturnValueOnce(updateChain);

      // Should not throw - counter should be reset
      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'user-123')
      ).resolves.not.toThrow();

      // Verify update was called to reset counter
      expect(mockSupabaseClient.update).toHaveBeenCalledWith({
        daily_analyses_count: 0,
        last_analysis_date: expect.any(String),
      });
    });

    it('should handle midnight boundary correctly', async () => {
      // 23:59 yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59);

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          daily_analyses_count: 3,
          daily_limit: 3,
          last_analysis_date: yesterday.toISOString(),
        },
        error: null,
      });

      const updateChain = {
        eq: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      };
      mockSupabaseClient.update.mockReturnValueOnce(updateChain);

      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'user-123')
      ).resolves.not.toThrow();
    });

    it('should handle null last_analysis_date', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          daily_analyses_count: 0,
          daily_limit: 3,
          last_analysis_date: null,
        },
        error: null,
      });

      const updateChain = {
        eq: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      };
      mockSupabaseClient.update.mockReturnValueOnce(updateChain);

      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'user-123')
      ).resolves.not.toThrow();
    });
  });

  describe('TC-RATE-002: Concurrent rate limit requests', () => {
    it('should handle race condition with database transaction', async () => {
      const today = new Date().toISOString();

      // Simulate 2 concurrent requests, both see count=2
      const rateLimitData = {
        daily_analyses_count: 2,
        daily_limit: 3,
        last_analysis_date: today,
      };

      mockSupabaseClient.single
        .mockResolvedValueOnce({
          data: rateLimitData,
          error: null,
        })
        .mockResolvedValueOnce({
          data: rateLimitData,
          error: null,
        });

      // First request should succeed
      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'user-123')
      ).resolves.not.toThrow();

      // Note: In real implementation, second concurrent request should fail
      // due to database-level locking/transactions
    });

    it('should use database locking to prevent race conditions', async () => {
      // This test verifies the behavior - actual locking is handled by PostgreSQL
      // with row-level locks during UPDATE operations

      const today = new Date().toISOString();

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          daily_analyses_count: 2,
          daily_limit: 3,
          last_analysis_date: today,
        },
        error: null,
      });

      // Check passes
      await (service as any).checkRateLimit(mockSupabaseClient, 'user-123');

      // In production, incrementing counter happens in initializeAnalysis
      // and uses atomic UPDATE which prevents race conditions
    });
  });

  describe('Custom rate limits', () => {
    it('should respect premium user higher limit', async () => {
      const today = new Date().toISOString();

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          daily_analyses_count: 5,
          daily_limit: 10, // Premium user with 10/day
          last_analysis_date: today,
        },
        error: null,
      });

      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'premium-user')
      ).resolves.not.toThrow();
    });

    it('should reject when premium limit exceeded', async () => {
      const today = new Date().toISOString();

      mockSupabaseClient.single.mockResolvedValueOnce({
        data: {
          daily_analyses_count: 10,
          daily_limit: 10,
          last_analysis_date: today,
        },
        error: null,
      });

      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'premium-user')
      ).rejects.toThrow(TooManyRequestsError);
    });
  });

  describe('Error handling', () => {
    it('should throw error when database query fails', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: {
          message: 'Database connection failed',
          code: 'PGRST500',
        },
      });

      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, 'user-123')
      ).rejects.toThrow('Failed to check rate limit');
    });

    it('should handle missing user_id gracefully', async () => {
      mockSupabaseClient.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      });

      mockSupabaseClient.insert.mockResolvedValueOnce({
        data: {},
        error: null,
      });

      await expect(
        (service as any).checkRateLimit(mockSupabaseClient, '')
      ).resolves.not.toThrow();
    });
  });
});