export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  date: string;
  ticker: string;
  quantity: number;
  price: number;
  type: 'buy' | 'sell';
  userId: string;
}

export interface Strategy {
  id: string;
  userId: string;
  timeHorizon: 'short' | 'medium' | 'long';
  riskLevel: 'low' | 'medium' | 'high';
  investmentGoals: string;
  updatedAt: string;
}

export interface Analysis {
  id: string;
  userId: string;
  summary: string;
  recommendations: Recommendation[];
  createdAt: string;
}

export interface Recommendation {
  ticker: string;
  action: 'buy' | 'sell' | 'hold';
  rationale: string;
}

export interface Portfolio {
  totalValue: number;
  positions: Position[];
  diversification: Diversification[];
}

export interface Position {
  ticker: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  value: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface Diversification {
  ticker: string;
  percentage: number;
}
