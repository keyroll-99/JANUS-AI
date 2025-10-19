import { z } from 'zod';

/**
 * Schema walidacji dla strategii inwestycyjnej
 * Używany w POST i PUT /api/v1/strategy
 */
export const strategySchema = z.object({
  timeHorizon: z.enum(['SHORT', 'MEDIUM', 'LONG'], {
    message: 'Horyzont czasowy musi być SHORT, MEDIUM lub LONG',
  }),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    message: 'Poziom ryzyka musi być LOW, MEDIUM lub HIGH',
  }),
  investmentGoals: z
    .string()
    .min(10, 'Cele inwestycyjne muszą zawierać co najmniej 10 znaków')
    .max(500, 'Cele inwestycyjne nie mogą przekraczać 500 znaków')
    .trim(),
});

/**
 * DTO dla danych wejściowych strategii (POST/PUT)
 */
export type StrategyDto = z.infer<typeof strategySchema>;

/**
 * DTO dla odpowiedzi API ze strategią
 */
export type StrategyResponseDto = {
  id: string;
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG';
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  investmentGoals: string;
  updatedAt: string;
};
