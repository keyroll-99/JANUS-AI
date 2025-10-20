/**
 * AnalysisService handles all business logic for AI portfolio analysis
 * - Fetches historical analyses with recommendations
 * - Manages analysis initiation with rate limiting
 * - Performs background AI analysis
 */

import { supabaseAdmin } from '../shared/config/supabase';
import { Tables } from '../shared/config/database.types';
import { AIProviderFactory, PortfolioData, Position } from './providers';
import {
  AnalysisDetailsDto,
  AnalysisInitiatedDto,
  AnalysisListItemDto,
  PaginatedAnalysesDto,
  RecommendationDto,
} from './analysis.types';
import {
  AnalysisNotFoundError,
  PreconditionFailedError,
  TooManyRequestsError,
} from './analysis.errors';

type AIRecommendation = Tables<'ai_recommendations'>;

export class AnalysisService {
  /**
   * Get detailed information about a specific analysis
   * @param userId - Authenticated user ID
   * @param analysisId - UUID of the analysis to retrieve
   * @returns Detailed analysis with recommendations
   * @throws {AnalysisNotFoundError} When analysis doesn't exist or doesn't belong to user
   */
  async getAnalysisDetails(
    userId: string,
    analysisId: string
  ): Promise<AnalysisDetailsDto> {
    // Fetch analysis with its recommendations in a single query
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from('ai_analyses')
      .select(
        `
        id,
        analysis_date,
        portfolio_value,
        ai_model,
        analysis_summary,
        analysis_prompt,
        ai_recommendations (
          id,
          ticker,
          action,
          reasoning,
          confidence
        )
      `
      )
      .eq('id', analysisId)
      .eq('user_id', userId)
      .single();

    if (analysisError || !analysis) {
      throw new AnalysisNotFoundError();
    }

    // Map database results to DTO
    return {
      id: analysis.id,
      analysisDate: analysis.analysis_date,
      portfolioValue: analysis.portfolio_value,
      aiModel: analysis.ai_model,
      analysisSummary: analysis.analysis_summary,
      analysisPrompt: analysis.analysis_prompt || undefined,
      recommendations: (analysis.ai_recommendations as AIRecommendation[]).map(
        (rec) => ({
          id: rec.id,
          ticker: rec.ticker,
          action: rec.action,
          reasoning: rec.reasoning,
          confidence: rec.confidence,
        })
      ),
    };
  }

  /**
   * Get paginated list of user's analyses
   * @param userId - Authenticated user ID
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (max 100)
   * @returns Paginated list of analyses
   */
  async getAnalyses(
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedAnalysesDto> {
    const offset = (page - 1) * limit;

    // Execute both queries in parallel for better performance
    const [{ data: analyses, error: dataError }, { count, error: countError }] =
      await Promise.all([
        supabaseAdmin
          .from('ai_analyses')
          .select('id, analysis_date, portfolio_value, ai_model')
          .eq('user_id', userId)
          .order('analysis_date', { ascending: false })
          .range(offset, offset + limit - 1),
        supabaseAdmin
          .from('ai_analyses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
      ]);

    if (dataError || countError) {
      throw new Error('Failed to fetch analyses');
    }

    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);

    // Map database results to DTOs
    const data: AnalysisListItemDto[] = (analyses || []).map((analysis) => ({
      id: analysis.id,
      analysisDate: analysis.analysis_date,
      portfolioValue: analysis.portfolio_value,
      aiModel: analysis.ai_model,
    }));

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
      },
    };
  }

  /**
   * Trigger a new portfolio analysis (synchronous phase)
   * @param userId - Authenticated user ID
   * @returns Analysis initiation confirmation with ID
   * @throws {TooManyRequestsError} When user exceeds rate limit
   * @throws {PreconditionFailedError} When user has no investment strategy
   */
  async triggerAnalysis(userId: string): Promise<AnalysisInitiatedDto> {
    // Check rate limit
    await this.checkRateLimit(userId);

    // Check if user has an investment strategy
    await this.checkInvestmentStrategy(userId);

    // Create initial analysis record
    const analysisId = await this.initializeAnalysis(userId);

    // Trigger background analysis (non-blocking)
    this.performBackgroundAnalysis(userId, analysisId).catch((error) => {
      console.error(
        `[AnalysisService] Background analysis failed for user ${userId}:`,
        error
      );
      // TODO: Mark analysis as failed in database
    });

    return {
      message:
        'Portfolio analysis has been initiated. The result will be available shortly.',
      analysisId,
    };
  }

  /**
   * Check if user has exceeded their daily analysis limit
   * @private
   */
  private async checkRateLimit(userId: string): Promise<void> {
    const { data: rateLimit, error } = await supabaseAdmin
      .from('user_rate_limits')
      .select('daily_analyses_count, daily_limit, last_analysis_date')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found
      throw new Error('Failed to check rate limit');
    }

    // Create rate limit record if it doesn't exist
    if (!rateLimit) {
      await supabaseAdmin.from('user_rate_limits').insert({
        user_id: userId,
        daily_analyses_count: 0,
        daily_limit: 3, // Default limit
      });
      return;
    }

    // Check if we need to reset daily counter
    const today = new Date().toISOString().split('T')[0];
    const lastAnalysisDate = rateLimit.last_analysis_date
      ? new Date(rateLimit.last_analysis_date).toISOString().split('T')[0]
      : null;

    if (lastAnalysisDate !== today) {
      // Reset counter for new day
      await supabaseAdmin
        .from('user_rate_limits')
        .update({
          daily_analyses_count: 0,
          last_analysis_date: new Date().toISOString(),
        })
        .eq('user_id', userId);
      return;
    }

    // Check if limit exceeded
    if (rateLimit.daily_analyses_count >= rateLimit.daily_limit) {
      throw new TooManyRequestsError();
    }
  }

  /**
   * Check if user has defined an investment strategy
   * @private
   */
  private async checkInvestmentStrategy(userId: string): Promise<void> {
    const { data: strategy, error } = await supabaseAdmin
      .from('investment_strategies')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (error || !strategy) {
      throw new PreconditionFailedError();
    }
  }

  /**
   * Initialize analysis record in database
   * @private
   */
  private async initializeAnalysis(userId: string): Promise<string> {
    // Get current portfolio value
    const portfolioValue = await this.getCurrentPortfolioValue(userId);

    const { data: analysis, error } = await supabaseAdmin
      .from('ai_analyses')
      .insert({
        user_id: userId,
        portfolio_value: portfolioValue,
        ai_model: 'claude-3-haiku-20240307',
        analysis_summary: 'Analysis in progress...',
      })
      .select('id')
      .single();

    if (error || !analysis) {
      throw new Error('Failed to initialize analysis');
    }

    // Increment rate limit counter
    const { data: currentLimit } = await supabaseAdmin
      .from('user_rate_limits')
      .select('daily_analyses_count, monthly_analyses_count, total_analyses_count')
      .eq('user_id', userId)
      .single();

    if (currentLimit) {
      await supabaseAdmin
        .from('user_rate_limits')
        .update({
          daily_analyses_count: currentLimit.daily_analyses_count + 1,
          monthly_analyses_count: currentLimit.monthly_analyses_count + 1,
          total_analyses_count: currentLimit.total_analyses_count + 1,
          last_analysis_date: new Date().toISOString(),
        })
        .eq('user_id', userId);
    }

    return analysis.id;
  }

  /**
   * Calculate current portfolio value
   * @private
   */
  private async getCurrentPortfolioValue(userId: string): Promise<number> {
    const { data: positions } = await supabaseAdmin
      .from('user_portfolio_positions')
      .select('total_cost')
      .eq('user_id', userId);

    return (
      positions?.reduce((sum, pos) => sum + (pos.total_cost || 0), 0) || 0
    );
  }

  /**
   * Perform AI analysis in background (async)
   * @private
   */
  private async performBackgroundAnalysis(
    userId: string,
    analysisId: string
  ): Promise<void> {
    try {
      console.log(
        `[AnalysisService] Starting analysis for user ${userId}, analysis ${analysisId}`
      );

      // 1. Gather portfolio data
      const portfolioData = await this.gatherPortfolioData(userId);

      // 2. Get AI provider
      const provider = AIProviderFactory.getProvider();

      // 3. TODO: Get custom prompt from database or use default
      // For now, using a simple default prompt - YOU will customize this later
      const prompt = this.buildSimplePrompt(portfolioData);

      // 4. Call AI API
      console.log(`[AnalysisService] Calling AI provider: ${provider.name}`);
      const result = await provider.analyze(prompt, portfolioData);

      // 5. Save analysis summary and prompt
      await supabaseAdmin
        .from('ai_analyses')
        .update({
          analysis_summary: result.summary,
          ai_model: provider.model,
          analysis_prompt: prompt,
        })
        .eq('id', analysisId);

      // 6. Save recommendations
      if (result.recommendations && result.recommendations.length > 0) {
        const recommendations = result.recommendations.map((rec) => ({
          analysis_id: analysisId,
          ticker: rec.ticker,
          action: rec.action,
          reasoning: rec.reasoning,
          confidence_level: rec.confidence,
          target_allocation: rec.targetAllocation || null,
          current_allocation: rec.currentAllocation || null,
        }));

        await supabaseAdmin
          .from('ai_recommendations')
          .insert(recommendations);
      }

      console.log(
        `[AnalysisService] Analysis completed successfully for ${analysisId}`
      );
    } catch (error) {
      console.error(
        `[AnalysisService] Analysis failed for ${analysisId}:`,
        error
      );

      // Mark analysis as failed
      await supabaseAdmin
        .from('ai_analyses')
        .update({
          analysis_summary: `Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        })
        .eq('id', analysisId);
    }
  }

  /**
   * Gather all portfolio data for analysis
   */
  private async gatherPortfolioData(userId: string): Promise<PortfolioData> {
    // Get positions
    const { data: positions } = await supabaseAdmin
      .from('user_portfolio_positions')
      .select('*')
      .eq('user_id', userId);

    // Get strategy
    const { data: strategy } = await supabaseAdmin
      .from('investment_strategies')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!strategy) {
      throw new Error('Investment strategy not found');
    }

    const totalValue =
      positions?.reduce((sum, pos) => sum + (pos.total_cost || 0), 0) || 0;

    const portfolioPositions: Position[] =
      positions?.map((pos) => {
        const quantity = pos.total_quantity || 0;
        const averagePrice = pos.avg_price || 0;
        const totalCost = pos.total_cost || 0;
        // TODO: Fetch current prices from market data API
        // For now, use average price as current price (no profit/loss calculation)
        const currentPrice = averagePrice;
        const currentValue = currentPrice * quantity;

        return {
          ticker: pos.ticker || '',
          quantity,
          averagePrice,
          currentPrice,
          totalValue: totalCost,
          percentageOfPortfolio: totalValue > 0 ? (totalCost / totalValue) * 100 : 0,
          profitLoss: currentValue - totalCost,
          profitLossPercentage: totalCost > 0 ? ((currentValue - totalCost) / totalCost) * 100 : 0,
        };
      }) || [];

    return {
      userId,
      totalValue,
      positions: portfolioPositions,
      strategy: {
        riskLevel: strategy.risk_level as 'LOW' | 'MEDIUM' | 'HIGH',
        timeHorizon: strategy.time_horizon as
          | 'SHORT_TERM'
          | 'MEDIUM_TERM'
          | 'LONG_TERM',
        investmentGoals: strategy.investment_goals || '',
      },
    };
  }

  /**
   * Build a simple default prompt
   * TODO: You will customize this prompt based on your needs
   */
  private buildSimplePrompt(portfolioData: PortfolioData): string {
    const { totalValue, positions, strategy } = portfolioData;

    const positionsList = positions
      .map((p) => `${p.ticker}: $${p.totalValue.toFixed(2)} (${p.percentageOfPortfolio.toFixed(1)}%)`)
      .join(', ');

    return `Analyze this investment portfolio and provide recommendations in JSON format.

Portfolio Value: $${totalValue.toFixed(2)}
Risk Level: ${strategy.riskLevel}
Time Horizon: ${strategy.timeHorizon}
Goals: ${strategy.investmentGoals}
Positions: ${positionsList}

Respond with JSON: {"summary": "...", "recommendations": [{"ticker": "...", "action": "BUY|SELL|HOLD|REDUCE|INCREASE", "reasoning": "...", "confidence": "LOW|MEDIUM|HIGH"}]}`;
  }
}
