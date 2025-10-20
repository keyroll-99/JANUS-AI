import {
  IAIProvider,
  PortfolioData,
  AIAnalysisResult,
} from './ai-provider.interface';

/**
 * Base AI Provider
 * Abstract base class with common functionality for all AI providers
 */
export abstract class BaseAIProvider implements IAIProvider {
  abstract readonly name: string;
  abstract readonly model: string;

  protected readonly apiKey: string;
  protected readonly baseUrl: string;

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  abstract analyze(
    prompt: string,
    portfolioData: PortfolioData
  ): Promise<AIAnalysisResult>;

  isConfigured(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Validate AI response structure
   */
  protected validateResponse(response: any): AIAnalysisResult {
    if (!response.summary || typeof response.summary !== 'string') {
      throw new Error('Invalid AI response: missing or invalid summary');
    }

    if (!Array.isArray(response.recommendations)) {
      throw new Error('Invalid AI response: recommendations must be an array');
    }

    // Validate each recommendation
    for (const rec of response.recommendations) {
      if (!rec.ticker || typeof rec.ticker !== 'string') {
        throw new Error('Invalid recommendation: missing ticker');
      }

      const validActions = ['BUY', 'SELL', 'HOLD', 'REDUCE', 'INCREASE'];
      if (!validActions.includes(rec.action)) {
        throw new Error(`Invalid recommendation action: ${rec.action}`);
      }

      if (!rec.reasoning || typeof rec.reasoning !== 'string') {
        throw new Error('Invalid recommendation: missing reasoning');
      }

      const validConfidence = ['LOW', 'MEDIUM', 'HIGH'];
      if (!validConfidence.includes(rec.confidence)) {
        throw new Error(`Invalid recommendation confidence: ${rec.confidence}`);
      }
    }

    return response as AIAnalysisResult;
  }

  /**
   * Handle API errors with retry logic
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        console.error(
          `[${this.name}] Attempt ${attempt}/${maxRetries} failed:`,
          error
        );

        if (attempt < maxRetries) {
          await this.sleep(delayMs * attempt); // Exponential backoff
        }
      }
    }

    throw new Error(
      `${this.name} API failed after ${maxRetries} attempts: ${lastError?.message}`
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
