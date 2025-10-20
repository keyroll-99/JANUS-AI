import { AIProviderFactory } from './ai-provider.factory';
import { ClaudeProvider } from './claude.provider';
import { GeminiProvider } from './gemini.provider';

/**
 * Initialize and register all AI providers
 * Should be called during application startup
 */
export function initializeAIProviders(): void {
  // Register Claude provider
  const claudeProvider = new ClaudeProvider();
  AIProviderFactory.registerProvider('claude', claudeProvider);

  // Register Gemini provider
  const geminiProvider = new GeminiProvider();
  AIProviderFactory.registerProvider('gemini', geminiProvider);

  console.log(
    '[AI Providers] Initialized:',
    AIProviderFactory.getAvailableProviders().join(', ')
  );
  console.log(
    '[AI Providers] Configured:',
    AIProviderFactory.getConfiguredProviders().join(', ') || 'none'
  );
}
