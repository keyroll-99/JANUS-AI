import { api } from './client';
import type { GetDashboardResponseDto } from '../types';

/**
 * Fetches dashboard data including summary, history, and diversification
 * @returns Promise with dashboard data
 * @throws Error if request fails or user is unauthorized
 */
export const getDashboardData = async (): Promise<GetDashboardResponseDto> => {
  try {
    return await api.get<GetDashboardResponseDto>('/v1/dashboard');
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        throw new Error('Session expired. Please log in again.');
      }
      throw new Error(error.message || 'Failed to fetch dashboard data.');
    }
    throw new Error('Failed to fetch dashboard data.');
  }
};
