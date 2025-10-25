/**
 * Typy dla strategii inwestycyjnej
 * Zgodne z backend/src/strategies/strategies.types.ts
 */

/**
 * Request DTO dla tworzenia/aktualizacji strategii
 */
export interface StrategyRequestDto {
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
}

/**
 * Response DTO dla strategii z serwera
 */
export interface StrategyResponseDto {
  id: string;
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
  updatedAt: string;
}
