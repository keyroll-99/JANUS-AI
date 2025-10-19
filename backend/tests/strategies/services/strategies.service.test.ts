import { StrategyService } from '../../../src/strategies/strategies.service';
import { supabase } from '../../../src/shared/config/supabase';
import { AppError } from '../../../src/shared/errors/AppError';
import { StrategyDto } from '../../../src/strategies/strategies.types';

// Mock Supabase client
jest.mock('../../../src/shared/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('StrategyService', () => {
  let strategyService: StrategyService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    strategyService = new StrategyService();
    jest.clearAllMocks();
  });

  describe('getStrategy', () => {
    it('should successfully fetch user strategy', async () => {
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

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await strategyService.getStrategy(mockUserId);

      expect(supabase.from).toHaveBeenCalledWith('investment_strategies');
      expect(mockChain.select).toHaveBeenCalledWith(
        'id, time_horizon, risk_level, investment_goals, updated_at'
      );
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockChain.single).toHaveBeenCalled();

      expect(result).toEqual({
        id: 'strategy-123',
        timeHorizon: 'LONG',
        riskLevel: 'MEDIUM',
        investmentGoals: 'Długoterminowy wzrost i dochód z dywidend.',
        updatedAt: '2025-10-19T10:00:00Z',
      });
    });

    it('should throw AppError with 404 when strategy not found', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(strategyService.getStrategy(mockUserId)).rejects.toThrow(AppError);
      await expect(strategyService.getStrategy(mockUserId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Strategia inwestycyjna nie została znaleziona',
      });
    });

    it('should throw generic error when database error occurs', async () => {
      const mockError = new Error('Database connection error');

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(strategyService.getStrategy(mockUserId)).rejects.toThrow(
        'Database connection error'
      );
    });
  });

  describe('createStrategy', () => {
    const strategyData: StrategyDto = {
      timeHorizon: 'LONG',
      riskLevel: 'MEDIUM',
      investmentGoals: 'Długoterminowy wzrost i dochód z dywidend.',
    };

    it('should successfully create a new strategy', async () => {
      const mockCreatedStrategy = {
        id: 'strategy-123',
        time_horizon: 'LONG',
        risk_level: 'MEDIUM',
        investment_goals: 'Długoterminowy wzrost i dochód z dywidend.',
        updated_at: '2025-10-19T10:00:00Z',
      };

      // Mock check for existing strategy (returns null - no existing strategy)
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

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockInsertChain);

      const result = await strategyService.createStrategy(mockUserId, strategyData);

      expect(result).toEqual({
        id: 'strategy-123',
        timeHorizon: 'LONG',
        riskLevel: 'MEDIUM',
        investmentGoals: 'Długoterminowy wzrost i dochód z dywidend.',
        updatedAt: '2025-10-19T10:00:00Z',
      });

      expect(mockInsertChain.insert).toHaveBeenCalledWith({
        user_id: mockUserId,
        time_horizon: 'LONG',
        risk_level: 'MEDIUM',
        investment_goals: 'Długoterminowy wzrost i dochód z dywidend.',
      });
    });

    it('should throw AppError with 409 when strategy already exists', async () => {
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

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(strategyService.createStrategy(mockUserId, strategyData)).rejects.toThrow(
        AppError
      );
      await expect(strategyService.createStrategy(mockUserId, strategyData)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Strategia inwestycyjna już istnieje dla tego użytkownika',
      });
    });

    it('should throw error when insert fails', async () => {
      const mockError = new Error('Insert failed');

      // Mock check for existing strategy (returns null)
      const mockSelectChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' },
        }),
      };

      // Mock insert operation (fails)
      const mockInsertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      (supabase.from as jest.Mock)
        .mockReturnValueOnce(mockSelectChain)
        .mockReturnValueOnce(mockInsertChain);

      await expect(strategyService.createStrategy(mockUserId, strategyData)).rejects.toThrow(
        'Insert failed'
      );
    });
  });

  describe('updateStrategy', () => {
    const strategyData: StrategyDto = {
      timeHorizon: 'SHORT',
      riskLevel: 'LOW',
      investmentGoals: 'Bezpieczne inwestycje z zachowaniem kapitału.',
    };

    it('should successfully update existing strategy', async () => {
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

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await strategyService.updateStrategy(mockUserId, strategyData);

      expect(result).toEqual({
        id: 'strategy-123',
        timeHorizon: 'SHORT',
        riskLevel: 'LOW',
        investmentGoals: 'Bezpieczne inwestycje z zachowaniem kapitału.',
        updatedAt: '2025-10-19T12:00:00Z',
      });

      expect(mockChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          time_horizon: 'SHORT',
          risk_level: 'LOW',
          investment_goals: 'Bezpieczne inwestycje z zachowaniem kapitału.',
        })
      );
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should throw AppError with 404 when strategy not found', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'No rows found' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(strategyService.updateStrategy(mockUserId, strategyData)).rejects.toThrow(
        AppError
      );
      await expect(strategyService.updateStrategy(mockUserId, strategyData)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Strategia inwestycyjna nie została znaleziona',
      });
    });

    it('should throw generic error when database error occurs', async () => {
      const mockError = new Error('Update failed');

      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(strategyService.updateStrategy(mockUserId, strategyData)).rejects.toThrow(
        'Update failed'
      );
    });
  });
});
