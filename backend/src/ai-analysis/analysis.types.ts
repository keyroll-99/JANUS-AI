/**
 * Types and DTOs for AI Analysis domain
 */

export interface RecommendationDto {
  id: string;
  ticker: string;
  action: string;
  reasoning: string;
  confidence: string | null;
}

export interface AnalysisDetailsDto {
  id: string;
  analysisDate: string;
  portfolioValue: number;
  aiModel: string;
  analysisSummary: string;
  analysisPrompt?: string; // Optional - prompt used for this analysis
  recommendations: RecommendationDto[];
}

export interface AnalysisInitiatedDto {
  message: string;
  analysisId: string;
}

export interface AnalysisListItemDto {
  id: string;
  analysisDate: string;
  portfolioValue: number;
  aiModel: string;
}

export interface PaginationDetails {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface PaginatedAnalysesDto {
  data: AnalysisListItemDto[];
  pagination: PaginationDetails;
}
