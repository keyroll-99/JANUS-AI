/**
 * Portfolio DTOs for Dashboard API
 * 
 * Defines data transfer objects for portfolio summary, history, and diversification
 */

/**
 * Summary of portfolio value and recent changes
 */
export interface DashboardSummaryDto {
  /** Total portfolio value including all assets and cash */
  totalValue: number;
  /** Currency code (e.g., 'PLN', 'USD') */
  currency: string;
  /** Change in portfolio value */
  change: {
    /** Absolute change in value */
    value: number;
    /** Percentage change */
    percentage: number;
  };
}

/**
 * Single point in portfolio history
 */
export interface PortfolioHistoryPointDto {
  /** Date in YYYY-MM-DD format */
  date: string;
  /** Portfolio value on that date */
  value: number;
}

/**
 * Single diversification item (position)
 */
export interface DiversificationItemDto {
  /** Stock ticker symbol or 'Other' for grouped positions */
  ticker: string;
  /** Current market value of the position */
  value: number;
  /** Percentage of total portfolio value */
  percentage: number;
}

/**
 * Complete dashboard data response
 */
export interface GetDashboardResponseDto {
  /** Portfolio summary with current value and changes */
  summary: DashboardSummaryDto;
  /** Historical portfolio values */
  history: PortfolioHistoryPointDto[];
  /** Current portfolio diversification by ticker */
  diversification: DiversificationItemDto[];
}

/**
 * Internal type for portfolio position with market data
 */
export interface PortfolioPosition {
  ticker: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  marketValue: number;
  accountTypeId: number;
}

/**
 * Market price data from external API
 */
export interface MarketPrice {
  ticker: string;
  price: number;
  currency: string;
}
