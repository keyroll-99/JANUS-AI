import axios, { AxiosInstance } from 'axios';
import {
  PortfolioData,
  AIAnalysisResult,
} from './ai-provider.interface';
import { BaseAIProvider } from './base-ai-provider';
import config from '../../shared/config/config';

/**
 * Gemini AI Provider
 * Implementation for Google's Gemini API
 */
export class GeminiProvider extends BaseAIProvider {
  readonly name = 'gemini';
  readonly model: string;
  private client: AxiosInstance;

  constructor(
    apiKey?: string,
    model?: string,
    baseUrl?: string
  ) {
    super(
      apiKey || config.ai?.gemini?.apiKey || '',
      baseUrl || config.ai?.gemini?.baseUrl || ''
    );
    this.model = model || config.ai?.gemini?.model || 'gemini-1.5-flash';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 60000, // 60 seconds
    });
  }

  /**
   * Analyze portfolio using Gemini API
   */
  async analyze(
    prompt: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    portfolioData: PortfolioData
  ): Promise<AIAnalysisResult> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key is not configured');
    }

    return this.withRetry(async () => {
      try {
        const response = await this.client.post(
          `/models/${this.model}:generateContent?key=${this.apiKey}`,
          {
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096,
            },
          }
        );

        const candidate = response.data.candidates?.[0];
        if (!candidate || !candidate.content?.parts?.[0]?.text) {
          throw new Error('Invalid response format from Gemini API');
        }

        const analysisText = candidate.content.parts[0].text;
        const result = this.parseResponse(analysisText);

        return this.validateResponse(result);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const status = error.response?.status;
          const message = error.response?.data?.error?.message || error.message;

          if (status === 400) {
            if (message.includes('API key')) {
              throw new Error('Invalid Gemini API key');
            }
            throw new Error(`Gemini API request error: ${message}`);
          } else if (status === 429) {
            throw new Error('Gemini API rate limit exceeded');
          } else if (status === 403) {
            throw new Error('Gemini API access denied. Check your API key and billing.');
          }

          throw new Error(`Gemini API error (${status}): ${message}`);
        }

        throw error;
      }
    });
  }

  /**
   * Parse Gemini response text to extract JSON
   */
  private parseResponse(text: string): unknown {
    try {
      // Remove markdown code blocks if present
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```$/, '');
      }

      // Try to find JSON in the response
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[GeminiProvider] Failed to parse response:', text);
      throw new Error('Failed to parse Gemini response as JSON');
    }
  }
}
