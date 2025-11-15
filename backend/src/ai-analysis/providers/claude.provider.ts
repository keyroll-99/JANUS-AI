import axios, { AxiosInstance } from 'axios';
import {
  PortfolioData,
  AIAnalysisResult,
} from './ai-provider.interface';
import { BaseAIProvider } from './base-ai-provider';
import config from '../../shared/config/config';

/**
 * Claude AI Provider
 * Implementation for Anthropic's Claude API
 */
export class ClaudeProvider extends BaseAIProvider {
  readonly name = 'claude';
  readonly model: string;
  private client: AxiosInstance;

  constructor(
    apiKey?: string,
    model?: string,
    baseUrl?: string
  ) {
    super(
      apiKey || config.ai?.claude?.apiKey || '',
      baseUrl || config.ai?.claude?.baseUrl || ''
    );
    this.model = model || config.ai?.claude?.model || 'claude-3-haiku-20240307';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      timeout: 60000, // 60 seconds
    });
  }

  /**
   * Analyze portfolio using Claude API
   */
  async analyze(
    prompt: string,
    _portfolioData: PortfolioData
  ): Promise<AIAnalysisResult> {
    if (!this.isConfigured()) {
      throw new Error('Claude API key is not configured');
    }

    return this.withRetry(async () => {
      try {
        const response = await this.client.post('/messages', {
          model: this.model,
          max_tokens: 4096,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
        });

        const content = response.data.content[0];
        if (!content || content.type !== 'text') {
          throw new Error('Invalid response format from Claude API');
        }

        const analysisText = content.text;
        const result = this.parseResponse(analysisText);

        return this.validateResponse(result);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.error?.message || error.message;

          if (status === 401) {
            throw new Error('Invalid Claude API key');
          } else if (status === 429) {
            throw new Error('Claude API rate limit exceeded');
          } else if (status === 400) {
            throw new Error(`Claude API request error: ${message}`);
          }

          throw new Error(`Claude API error (${status}): ${message}`);
        }

        throw error;
      }
    });
  }

  /**
   * Parse Claude response text to extract JSON
   */
  private parseResponse(text: string): unknown {
    try {
      // Try to find JSON in the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Claude response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[ClaudeProvider] Failed to parse response:', text);
      throw new Error('Failed to parse Claude response as JSON');
    }
  }
}
