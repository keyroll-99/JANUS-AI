import {
  StrategyResponseDto,
  StrategyRequestDto,
} from '../types/strategy.types';
import { apiClient } from './client';

/**
 * Pobieranie strategii użytkownika
 * @returns Promise z danymi strategii
 * @throws Error w przypadku błędu (404 - brak strategii, 401, 500)
 */
export const getStrategy = async (): Promise<StrategyResponseDto> => {
  return apiClient<StrategyResponseDto>('/v1/strategy', {
    method: 'GET',
  });
};

/**
 * Tworzenie nowej strategii użytkownika
 * @param data - dane strategii
 * @returns Promise z utworzoną strategią
 * @throws Error w przypadku błędu (400, 409, 500)
 */
export const createStrategy = async (
  data: StrategyRequestDto
): Promise<StrategyResponseDto> => {
  return apiClient<StrategyResponseDto>('/v1/strategy', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Aktualizacja istniejącej strategii użytkownika
 * @param data - dane strategii do aktualizacji
 * @returns Promise z zaktualizowaną strategią
 * @throws Error w przypadku błędu (400, 404, 409, 500)
 */
export const updateStrategy = async (
  data: StrategyRequestDto
): Promise<StrategyResponseDto> => {
  return apiClient<StrategyResponseDto>('/v1/strategy', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};
