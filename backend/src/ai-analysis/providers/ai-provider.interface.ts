/**
 * AI Provider Interface
 * Defines the contract that all AI providers (Claude, Gemini, etc.) must implement
 */

/**
 * Portfolio data structure for AI analysis
 */
export interface PortfolioData {
  userId: string;
  totalValue: number;
  positions: Position[];
  strategy: InvestmentStrategy;
}

export interface Position {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  percentageOfPortfolio: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface InvestmentStrategy {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: 'SHORT_TERM' | 'MEDIUM_TERM' | 'LONG_TERM';
  investmentGoals: string;
  preferredSectors?: string[];
  avoidedSectors?: string[];
}

/**
 * AI analysis result structure
 */
export interface AIAnalysisResult {
  summary: string;
  recommendations: AIRecommendation[];
  overallScore?: number;
  riskAssessment?: string;
}

export interface AIRecommendation {
  ticker: string;
  action: 'BUY' | 'SELL' | 'HOLD' | 'REDUCE' | 'INCREASE';
  reasoning: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  targetAllocation?: number;
  currentAllocation?: number;
}

/**
 * AI Provider Interface
 * All AI providers must implement this interface
 */
export interface IAIProvider {
  /**
   * Provider name (e.g., 'claude', 'gemini')
   */
  readonly name: string;

  /**
   * Provider model (e.g., 'claude-3-haiku-20240307', 'gemini-1.5-flash')
   */
  readonly model: string;

  /**
   * Analyze portfolio and generate recommendations
   * @param prompt - The analysis prompt (prepared by the service)
   * @param portfolioData - Portfolio data to analyze
   * @returns AI analysis result with recommendations
   * @throws Error if API call fails or response is invalid
   */
  analyze(
    prompt: string,
    portfolioData: PortfolioData
  ): Promise<AIAnalysisResult>;

  /**
   * Health check - verify provider is configured and accessible
   * @returns true if provider is ready to use
   */
  isConfigured(): boolean;
}
