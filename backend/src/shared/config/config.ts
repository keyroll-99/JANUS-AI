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

export default config;