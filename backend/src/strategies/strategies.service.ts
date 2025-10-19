import { StrategyDto, StrategyResponseDto } from './strategies.types';
import { supabase } from '../shared/config/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../shared/config/database.types';
import { AppError } from '../shared/errors/AppError';

type InvestmentStrategy = Tables<'investment_strategies'>;

/**
 * StrategyService handles all business logic for investment strategies
 * Communicates with Supabase database and enforces authorization
 */
export class StrategyService {
  private readonly tableName = 'investment_strategies';

  /**
   * Get user's investment strategy
   * @throws {AppError} When strategy is not found (404)
   */
  async getStrategy(userId: string): Promise<StrategyResponseDto> {
    const { data, error } = await supabase
      .from(this.tableName)
      .select('id, time_horizon, risk_level, investment_goals, updated_at')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Strategia inwestycyjna nie została znaleziona', 404);
      }
      throw error;
    }

    return this.mapToResponseDto(data);
  }

  /**
   * Create new investment strategy for user
   * @throws {AppError} When strategy already exists (409)
   */
  async createStrategy(userId: string, strategyData: StrategyDto): Promise<StrategyResponseDto> {
    // Check if strategy already exists
    const { data: existingStrategy } = await supabase
      .from(this.tableName)
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingStrategy) {
      throw new AppError('Strategia inwestycyjna już istnieje dla tego użytkownika', 409);
    }

    // Create new strategy
    const insertData: TablesInsert<'investment_strategies'> = {
      user_id: userId,
      time_horizon: strategyData.timeHorizon,
      risk_level: strategyData.riskLevel,
      investment_goals: strategyData.investmentGoals,
    };

    const { data, error } = await supabase
      .from(this.tableName)
      .insert(insertData)
      .select('id, time_horizon, risk_level, investment_goals, updated_at')
      .single();

    if (error) {
      throw error;
    }

    return this.mapToResponseDto(data);
  }

  /**
   * Update existing investment strategy for user
   * @throws {AppError} When strategy is not found (404)
   */
  async updateStrategy(userId: string, strategyData: StrategyDto): Promise<StrategyResponseDto> {
    const updateData: TablesUpdate<'investment_strategies'> = {
      time_horizon: strategyData.timeHorizon,
      risk_level: strategyData.riskLevel,
      investment_goals: strategyData.investmentGoals,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from(this.tableName)
      .update(updateData)
      .eq('user_id', userId)
      .select('id, time_horizon, risk_level, investment_goals, updated_at')
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError('Strategia inwestycyjna nie została znaleziona', 404);
      }
      throw error;
    }

    return this.mapToResponseDto(data);
  }

  /**
   * Map database row to response DTO (snake_case -> camelCase)
   */
  private mapToResponseDto(data: {
    id: string;
    time_horizon: string;
    risk_level: string;
    investment_goals: string;
    updated_at: string;
  }): StrategyResponseDto {
    return {
      id: data.id,
      timeHorizon: data.time_horizon as 'SHORT' | 'MEDIUM' | 'LONG',
      riskLevel: data.risk_level as 'LOW' | 'MEDIUM' | 'HIGH',
      investmentGoals: data.investment_goals,
      updatedAt: data.updated_at,
    };
  }
}

export const strategyService = new StrategyService();
