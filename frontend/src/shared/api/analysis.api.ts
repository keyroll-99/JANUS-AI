/**
 * API functions for AI Analysis endpoints
 */

import { api } from './client';
import {
  AnalysisDetailsDto,
  AnalysisInitiatedDto,
  PaginatedAnalysesDto,
} from '../types/analysis.types';

/**
 * Get paginated list of user's analyses
 * @param page - Page number (1-indexed)
 * @param limit - Items per page (max 100)
 * @returns Promise with paginated analyses
 * @throws Error on API failure
 */
export const getAnalyses = async (
  page: number = 1,
  limit: number = 10
): Promise<PaginatedAnalysesDto> => {
  return api.get<PaginatedAnalysesDto>(
    `/v1/analyses?page=${page}&limit=${limit}`
  );
};

/**
 * Get detailed information about a specific analysis
 * @param analysisId - UUID of the analysis
 * @returns Promise with analysis details including recommendations
 * @throws Error on API failure (404 if not found or not authorized)
 */
export const getAnalysisById = async (
  analysisId: string
): Promise<AnalysisDetailsDto> => {
  return api.get<AnalysisDetailsDto>(`/v1/analyses/${analysisId}`);
};

/**
 * Initiate a new AI portfolio analysis
 * @returns Promise with analysis initiation confirmation
 * @throws Error on API failure (400 if no transactions, 429 if rate limited, 402 if no strategy)
 */
export const initiateAnalysis = async (): Promise<AnalysisInitiatedDto> => {
  console.log('[analysis.api] Initiating analysis - calling POST /v1/analyses');
  const result = await api.post<AnalysisInitiatedDto>('/v1/analyses');
  console.log('[analysis.api] Result:', result);
  return result;
};
