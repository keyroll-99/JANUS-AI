import { IAIProvider } from './ai-provider.interface';
import config from '../../shared/config/config';

/**
 * AI Provider Factory
 * Factory pattern for creating and managing AI provider instances
 */
export class AIProviderFactory {
  private static providers: Map<string, IAIProvider> = new Map();

  /**
   * Register an AI provider
   * @param name - Provider name (e.g., 'claude', 'gemini')
   * @param provider - Provider instance
   */
  static registerProvider(name: string, provider: IAIProvider): void {
    this.providers.set(name.toLowerCase(), provider);
  }

  /**
   * Get AI provider by name
   * @param name - Provider name (optional, defaults to config default)
   * @returns AI provider instance
   * @throws Error if provider not found or not configured
   */
  static getProvider(name?: string): IAIProvider {
    const providerName = (name || config.ai.defaultProvider).toLowerCase();
    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(
        `AI provider '${providerName}' not found. Available providers: ${Array.from(
          this.providers.keys()
        ).join(', ')}`
      );
    }

    if (!provider.isConfigured()) {
      throw new Error(
        `AI provider '${providerName}' is not properly configured. Please check your API keys.`
      );
    }

    return provider;
  }

  /**
   * Get all registered providers
   * @returns Array of provider names
   */
  static getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Get all configured providers (with valid API keys)
   * @returns Array of configured provider names
   */
  static getConfiguredProviders(): string[] {
    return Array.from(this.providers.entries())
      .filter(([_, provider]) => provider.isConfigured())
      .map(([name]) => name);
  }

  /**
   * Check if a specific provider is available and configured
   * @param name - Provider name
   * @returns true if provider exists and is configured
   */
  static isProviderAvailable(name: string): boolean {
    const provider = this.providers.get(name.toLowerCase());
    return provider ? provider.isConfigured() : false;
  }

  /**
   * Clear all registered providers (useful for testing)
   */
  static clearProviders(): void {
    this.providers.clear();
  }
}
