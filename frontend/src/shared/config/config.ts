export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  aiProvider: import.meta.env.VITE_AI_PROVIDER || 'claude',
} as const;
