import { AnalysisService } from '../../../src/ai-analysis/analysis.service';
import { supabaseAdmin } from '../../../src/shared/config/supabase';
import {
  AnalysisNotFoundError,
  PreconditionFailedError,
  TooManyRequestsError,
} from '../../../src/ai-analysis/analysis.errors';

// Mock Supabase admin client
jest.mock('../../../src/shared/config/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}));

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

describe('AnalysisService', () => {
  let analysisService: AnalysisService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    analysisService = new AnalysisService();
    jest.clearAllMocks();
  });

  describe('getAnalysisDetails', () => {
    const mockAnalysisId = 'analysis-456';
    const mockAnalysis = {
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
        {
          id: 'rec-2',
          ticker: 'GOOGL',
          action: 'HOLD',
          reasoning: 'Good position size',
          confidence: 'MEDIUM',
        },
      ],
    };

    it('should return analysis details with recommendations', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        createSupabaseMock({ data: mockAnalysis, error: null })
      );

      const result = await analysisService.getAnalysisDetails(
        mockUserId,
        mockAnalysisId
      );

      expect(result).toEqual({
        id: mockAnalysisId,
        analysisDate: '2025-10-19T14:00:00Z',
        portfolioValue: 125000.5,
        aiModel: 'claude-3-haiku-20240307',
        analysisSummary: 'Your portfolio is well-diversified...',
        recommendations: [
          {
            id: 'rec-1',
            ticker: 'AAPL',
            action: 'REDUCE',
            reasoning: 'Position too large',
            confidence: 'HIGH',
          },
          {
            id: 'rec-2',
            ticker: 'GOOGL',
            action: 'HOLD',
            reasoning: 'Good position size',
            confidence: 'MEDIUM',
          },
        ],
      });
    });

    it('should throw AnalysisNotFoundError when analysis does not exist', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        createSupabaseMock({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' },
        })
      );

      await expect(
        analysisService.getAnalysisDetails(mockUserId, mockAnalysisId)
      ).rejects.toThrow(AnalysisNotFoundError);
    });

    it('should throw AnalysisNotFoundError when analysis belongs to different user', async () => {
      (supabaseAdmin.from as jest.Mock).mockReturnValue(
        createSupabaseMock({ data: null, error: null })
      );

      await expect(
        analysisService.getAnalysisDetails(mockUserId, mockAnalysisId)
      ).rejects.toThrow(AnalysisNotFoundError);
    });
  });

  describe('getAnalyses', () => {
    const mockAnalyses = [
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

    it('should return paginated analyses with correct pagination details', async () => {
      const dataMock = createSupabaseMock({ data: mockAnalyses, error: null });
      const countMock = createSupabaseMock({ count: 15, error: null });
      
      // Override eq for count query to return count property
      countMock.eq = jest.fn().mockResolvedValue({ count: 15, error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(dataMock)
        .mockReturnValueOnce(countMock);

      const result = await analysisService.getAnalyses(mockUserId, 1, 10);

      expect(result).toEqual({
        data: [
          {
            id: 'analysis-1',
            analysisDate: '2025-10-19T14:00:00Z',
            portfolioValue: 125000.5,
            aiModel: 'claude-3-haiku-20240307',
          },
          {
            id: 'analysis-2',
            analysisDate: '2025-10-18T10:00:00Z',
            portfolioValue: 120000.0,
            aiModel: 'claude-3-haiku-20240307',
          },
        ],
        pagination: {
          currentPage: 1,
          totalPages: 2,
          totalItems: 15,
          itemsPerPage: 10,
        },
      });
    });

    it('should handle empty results', async () => {
      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(createSupabaseMock({ data: [], error: null }))
        .mockReturnValueOnce(createSupabaseMock({ count: 0, error: null }));

      const result = await analysisService.getAnalyses(mockUserId, 1, 10);

      expect(result).toEqual({
        data: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
        },
      });
    });

    it('should calculate correct pagination for page 2', async () => {
      const dataMock = createSupabaseMock({ data: mockAnalyses, error: null });
      const countMock = createSupabaseMock({ count: 25, error: null });
      
      // Override eq for count query to return count property
      countMock.eq = jest.fn().mockResolvedValue({ count: 25, error: null });

      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(dataMock)
        .mockReturnValueOnce(countMock);

      const result = await analysisService.getAnalyses(mockUserId, 2, 10);

      expect(result.pagination).toEqual({
        currentPage: 2,
        totalPages: 3,
        totalItems: 25,
        itemsPerPage: 10,
      });
    });
  });

  describe('triggerAnalysis', () => {
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

    const mockPositions = [
      { total_cost: 1500.0 },
      { total_cost: 700.0 },
    ];

    beforeEach(() => {
      // Mock console.error to avoid noise in test output
      jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should successfully trigger analysis when all preconditions are met', async () => {
      const mockAnalysisId = 'new-analysis-123';
      const today = new Date().toISOString().split('T')[0];

      (supabaseAdmin.from as jest.Mock)
        // Check rate limit
        .mockReturnValueOnce(
          createSupabaseMock({
            data: { ...mockRateLimit, last_analysis_date: today },
            error: null,
          })
        )
        // Check strategy
        .mockReturnValueOnce(
          createSupabaseMock({ data: mockStrategy, error: null })
        )
        // Get portfolio value
        .mockReturnValueOnce(
          createSupabaseMock({ data: mockPositions, error: null })
        )
        // Insert analysis
        .mockReturnValueOnce(
          createSupabaseMock({ data: { id: mockAnalysisId }, error: null })
        )
        // Get current rate limit for update
        .mockReturnValueOnce(
          createSupabaseMock({ data: mockRateLimit, error: null })
        )
        // Update rate limit
        .mockReturnValueOnce(createSupabaseMock({ data: null, error: null }));

      const result = await analysisService.triggerAnalysis(mockUserId);

      expect(result).toEqual({
        message:
          'Portfolio analysis has been initiated. The result will be available shortly.',
        analysisId: mockAnalysisId,
      });
    });

    it('should throw TooManyRequestsError when daily limit exceeded', async () => {
      const today = new Date().toISOString().split('T')[0];
      const exceededRateLimit = {
        ...mockRateLimit,
        daily_analyses_count: 3,
        daily_limit: 3,
        last_analysis_date: today, // Same day - no reset should occur
      };

      // Mock .single() to return data directly (not in array)
      const rateLimitMock = createSupabaseMock({ data: exceededRateLimit, error: null });
      
      // Override .single() specifically to return the unwrapped value
      rateLimitMock.single = jest.fn().mockResolvedValue({ 
        data: exceededRateLimit, 
        error: null 
      });

      (supabaseAdmin.from as jest.Mock).mockReturnValueOnce(rateLimitMock);

      await expect(
        analysisService.triggerAnalysis(mockUserId)
      ).rejects.toThrow(TooManyRequestsError);
    });

    it('should throw PreconditionFailedError when user has no strategy', async () => {
      // First call: rate limit check passes (returns array with rate limit)
      (supabaseAdmin.from as jest.Mock)
        .mockReturnValueOnce(
          createSupabaseMock({ data: [mockRateLimit], error: null })
        )
        // Second call: strategy check fails (returns empty array, no strategy found)
        .mockReturnValueOnce(
          createSupabaseMock({ data: [], error: null })
        );

      await expect(
        analysisService.triggerAnalysis(mockUserId)
      ).rejects.toThrow(PreconditionFailedError);
    });

    it('should create rate limit record if it does not exist', async () => {
      (supabaseAdmin.from as jest.Mock)
        // Check rate limit - not found
        .mockReturnValueOnce(
          createSupabaseMock({
            data: null,
            error: { code: 'PGRST116', message: 'Not found' },
          })
        )
        // Insert rate limit
        .mockReturnValueOnce(createSupabaseMock({ data: null, error: null }))
        // Check strategy
        .mockReturnValueOnce(
          createSupabaseMock({ data: mockStrategy, error: null })
        )
        // Get portfolio value
        .mockReturnValueOnce(
          createSupabaseMock({ data: mockPositions, error: null })
        )
        // Insert analysis
        .mockReturnValueOnce(
          createSupabaseMock({ data: { id: 'analysis-123' }, error: null })
        )
        // Get current rate limit for update
        .mockReturnValueOnce(
          createSupabaseMock({
            data: {
              daily_analyses_count: 0,
              monthly_analyses_count: 0,
              total_analyses_count: 0,
            },
            error: null,
          })
        )
        // Update rate limit
        .mockReturnValueOnce(createSupabaseMock({ data: null, error: null }));

      const result = await analysisService.triggerAnalysis(mockUserId);

      expect(result.analysisId).toBe('analysis-123');
    });

    it('should reset daily counter for new day', async () => {
      const oldDateRateLimit = {
        ...mockRateLimit,
        last_analysis_date: '2025-10-18', // Yesterday
        daily_analyses_count: 2,
      };

      (supabaseAdmin.from as jest.Mock)
        // Check rate limit - old date
        .mockReturnValueOnce(
          createSupabaseMock({ data: oldDateRateLimit, error: null })
        )
        // Reset daily counter
        .mockReturnValueOnce(createSupabaseMock({ data: null, error: null }))
        // Check strategy
        .mockReturnValueOnce(
          createSupabaseMock({ data: mockStrategy, error: null })
        )
        // Get portfolio value
        .mockReturnValueOnce(
          createSupabaseMock({ data: mockPositions, error: null })
        )
        // Insert analysis
        .mockReturnValueOnce(
          createSupabaseMock({ data: { id: 'analysis-123' }, error: null })
        )
        // Get current rate limit for update
        .mockReturnValueOnce(
          createSupabaseMock({ data: mockRateLimit, error: null })
        )
        // Update rate limit
        .mockReturnValueOnce(createSupabaseMock({ data: null, error: null }));

      const result = await analysisService.triggerAnalysis(mockUserId);

      expect(result.analysisId).toBe('analysis-123');
    });
  });
});
