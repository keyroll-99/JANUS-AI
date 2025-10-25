/**
 * AnalysisService handles all business logic for AI portfolio analysis
 * - Fetches historical analyses with recommendations
 * - Manages analysis initiation with rate limiting
 * - Performs background AI analysis
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '../shared/config/supabase';
import { Tables, Database } from '../shared/config/database.types';
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
import { PromptBuilder } from './prompt-builder';

type AIRecommendation = Tables<'ai_recommendations'>;

export class AnalysisService {
  /**
   * Get detailed information about a specific analysis
   * @param supabaseClient - User's Supabase client (respects RLS)
   * @param userId - Authenticated user ID
   * @param analysisId - UUID of the analysis to retrieve
   * @returns Detailed analysis with recommendations
   * @throws {AnalysisNotFoundError} When analysis doesn't exist or doesn't belong to user
   */
  async getAnalysisDetails(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
    analysisId: string
  ): Promise<AnalysisDetailsDto> {
    // Fetch analysis with its recommendations in a single query
    const { data: analysis, error: analysisError } = await supabaseClient
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
   * @param supabaseClient - User's Supabase client (respects RLS)
   * @param userId - Authenticated user ID
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (max 100)
   * @returns Paginated list of analyses
   */
  async getAnalyses(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
    page: number,
    limit: number
  ): Promise<PaginatedAnalysesDto> {
    const offset = (page - 1) * limit;

    // Execute both queries in parallel for better performance
    const [{ data: analyses, error: dataError }, { count, error: countError }] =
      await Promise.all([
        supabaseClient
          .from('ai_analyses')
          .select('id, analysis_date, portfolio_value, ai_model')
          .eq('user_id', userId)
          .order('analysis_date', { ascending: false })
          .range(offset, offset + limit - 1),
        supabaseClient
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
   * @param supabaseClient - User's Supabase client (respects RLS)
   * @param userId - Authenticated user ID
   * @returns Analysis initiation confirmation with ID
   * @throws {TooManyRequestsError} When user exceeds rate limit
   * @throws {PreconditionFailedError} When user has no investment strategy
   */
  async triggerAnalysis(
    supabaseClient: SupabaseClient<Database>,
    userId: string
  ): Promise<AnalysisInitiatedDto> {
    // Check rate limit
    await this.checkRateLimit(supabaseClient, userId);

    // Check if user has an investment strategy
    await this.checkInvestmentStrategy(supabaseClient, userId);

    // Create initial analysis record
    const analysisId = await this.initializeAnalysis(supabaseClient, userId);

    // Trigger background analysis (non-blocking)
    // Note: Background process uses supabaseAdmin for performance
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
  private async checkRateLimit(
    supabaseClient: SupabaseClient<Database>,
    userId: string
  ): Promise<void> {
    const { data: rateLimit, error } = await supabaseClient
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
      await supabaseClient.from('user_rate_limits').insert({
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
      await supabaseClient
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
  private async checkInvestmentStrategy(
    supabaseClient: SupabaseClient<Database>,
    userId: string
  ): Promise<void> {
    const { data: strategy, error } = await supabaseClient
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
  private async initializeAnalysis(
    supabaseClient: SupabaseClient<Database>,
    userId: string
  ): Promise<string> {
    // Get current portfolio value
    const portfolioValue = await this.getCurrentPortfolioValue(
      supabaseClient,
      userId
    );

    const { data: analysis, error } = await supabaseClient
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
    const { data: currentLimit } = await supabaseClient
      .from('user_rate_limits')
      .select('daily_analyses_count, monthly_analyses_count, total_analyses_count')
      .eq('user_id', userId)
      .single();

    if (currentLimit) {
      await supabaseClient
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
  private async getCurrentPortfolioValue(
    supabaseClient: SupabaseClient<Database>,
    userId: string
  ): Promise<number> {
    const { data: positions } = await supabaseClient
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

      // 3. Build comprehensive analysis prompt using PromptBuilder
      const prompt = PromptBuilder.buildAnalysisPrompt(portfolioData);

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
   * Uses supabaseAdmin to calculate positions from transactions in real-time
   * This ensures fresh data without relying on materialized view refresh
   */
  private async gatherPortfolioData(userId: string): Promise<PortfolioData> {
    // Get all user's transactions with transaction types
    const { data: transactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select(`
        *,
        transaction_types!inner(name)
      `)
      .eq('user_id', userId)
      .order('transaction_date', { ascending: true });

    if (txError) {
      console.error('[AnalysisService] Failed to fetch transactions:', txError);
      throw new Error('Failed to fetch portfolio transactions');
    }

    console.log(`[AnalysisService] Fetched ${transactions?.length || 0} transactions for user ${userId}`);

    // Get strategy
    const { data: strategy } = await supabaseAdmin
      .from('investment_strategies')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!strategy) {
      throw new Error('Investment strategy not found');
    }

    // Calculate positions from transactions
    const positionsMap = new Map<string, {
      ticker: string;
      quantity: number;
      totalCost: number;
      transactions: number;
    }>();

    transactions?.forEach((tx) => {
      const txType = (tx.transaction_types as any)?.name;
      if (!tx.ticker || !['BUY', 'SELL'].includes(txType)) {
        return; // Skip non-stock transactions
      }

      const existing = positionsMap.get(tx.ticker) || {
        ticker: tx.ticker,
        quantity: 0,
        totalCost: 0,
        transactions: 0,
      };

      if (txType === 'BUY') {
        existing.quantity += tx.quantity || 0;
        existing.totalCost += (tx.total_amount || 0) + (tx.commission || 0);
        console.log(`[AnalysisService] BUY ${tx.ticker}: +${tx.quantity} @ ${tx.price}, totalCost now: ${existing.totalCost}`);
      } else if (txType === 'SELL') {
        existing.quantity -= tx.quantity || 0;
        existing.totalCost -= (tx.total_amount || 0) - (tx.commission || 0);
        console.log(`[AnalysisService] SELL ${tx.ticker}: -${tx.quantity} @ ${tx.price}, totalCost now: ${existing.totalCost}`);
      }

      existing.transactions++;
      positionsMap.set(tx.ticker, existing);
    });

    // Filter out closed positions (quantity <= 0) and calculate metrics
    const openPositions = Array.from(positionsMap.values())
      .filter(pos => pos.quantity > 0);

    console.log(`[AnalysisService] Found ${openPositions.length} open positions from ${positionsMap.size} unique tickers`);
    
    if (openPositions.length === 0) {
      console.warn(`[AnalysisService] No open positions found for user ${userId}`);
    }

    // Calculate portfolio positions with current prices
    const portfolioPositions: Position[] = openPositions.map((pos) => {
      const averagePrice = pos.quantity > 0 ? pos.totalCost / pos.quantity : 0;
      // TODO: Fetch current prices from market data API
      // For now, use average price as current price (no profit/loss calculation)
      const currentPrice = averagePrice;
      const currentValue = currentPrice * pos.quantity;

      console.log(`[AnalysisService] ${pos.ticker}: qty=${pos.quantity}, avgPrice=${averagePrice.toFixed(2)}, currentValue=${currentValue.toFixed(2)}`);

      return {
        ticker: pos.ticker,
        quantity: pos.quantity,
        averagePrice,
        currentPrice,
        totalValue: currentValue, // Use current value, not cost
        percentageOfPortfolio: 0, // Will be calculated after totalValue
        profitLoss: currentValue - pos.totalCost,
        profitLossPercentage: pos.totalCost > 0 ? ((currentValue - pos.totalCost) / pos.totalCost) * 100 : 0,
      };
    });

    // Calculate total portfolio value (sum of current values)
    const totalValue = portfolioPositions.reduce((sum, pos) => sum + pos.totalValue, 0);

    // Update percentage of portfolio for each position
    portfolioPositions.forEach((pos) => {
      pos.percentageOfPortfolio = totalValue > 0 ? (pos.totalValue / totalValue) * 100 : 0;
    });

    console.log(`[AnalysisService] Calculated ${portfolioPositions.length} positions from ${transactions?.length || 0} transactions for user ${userId}`);
    console.log(`[AnalysisService] Total portfolio value: $${totalValue.toFixed(2)}`);

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
}
