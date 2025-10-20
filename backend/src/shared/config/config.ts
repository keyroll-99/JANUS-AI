import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
  cookie: {
    name: string;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number; // in milliseconds
  };
  marketData: {
    finnhubApiKey: string;
    finnhubBaseUrl: string;
  };
  ai: {
    claude: {
      apiKey: string;
      model: string;
      baseUrl: string;
    };
    gemini: {
      apiKey: string;
      model: string;
      baseUrl: string;
    };
    defaultProvider: 'claude' | 'gemini';
  };
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  cookie: {
    name: 'refreshToken',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
  marketData: {
    finnhubApiKey: process.env.FINNHUB_API_KEY || '',
    finnhubBaseUrl: 'https://finnhub.io/api/v1',
  },
  ai: {
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || '',
      model: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',
      baseUrl: 'https://api.anthropic.com/v1',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
      model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    },
    defaultProvider:
      (process.env.AI_DEFAULT_PROVIDER as 'claude' | 'gemini') || 'claude',
  },
};

// Validate required Supabase configuration
if (!config.supabase.url || !config.supabase.anonKey) {
  throw new Error(
    'Missing required Supabase configuration. Please check your .env file.'
  );
}

// Validate market data configuration (warning only, not blocking)
if (!config.marketData.finnhubApiKey && config.nodeEnv === 'production') {
  console.warn(
    'WARNING: FINNHUB_API_KEY is not set. Market data features will use mock data.'
  );
}

// Validate AI configuration (warning only, not blocking)
if (!config.ai.claude.apiKey && !config.ai.gemini.apiKey) {
  console.warn(
    'WARNING: No AI API keys configured (CLAUDE_API_KEY or GEMINI_API_KEY). AI analysis features will not work.'
  );
}

if (
  config.ai.defaultProvider === 'claude' &&
  !config.ai.claude.apiKey &&
  config.nodeEnv === 'production'
) {
  console.warn(
    'WARNING: Default AI provider is Claude but CLAUDE_API_KEY is not set.'
  );
}

if (
  config.ai.defaultProvider === 'gemini' &&
  !config.ai.gemini.apiKey &&
  config.nodeEnv === 'production'
) {
  console.warn(
    'WARNING: Default AI provider is Gemini but GEMINI_API_KEY is not set.'
  );
}

export default config;