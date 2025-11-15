/**
 * Custom hook for managing AI analyses
 * Handles fetching paginated analyses list and creating new analyses
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { message, Modal } from 'antd';
import {
  getAnalyses,
  initiateAnalysis,
} from '../api/analysis.api';
import {
  AnalysisListItemDto,
  PaginationDetails,
} from '../types/analysis.types';

interface UseAnalysesReturn {
  analyses: AnalysisListItemDto[];
  pagination: PaginationDetails | null;
  loading: boolean;
  creating: boolean;
  error: string | null;
  fetchAnalyses: (page: number, limit: number) => Promise<void>;
  createAnalysis: () => Promise<string>; // Returns analysisId
}

/**
 * Hook do zarządzania listą analiz AI
 * Obsługuje paginację poprzez URL query params
 */
export const useAnalyses = (): UseAnalysesReturn => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const page = Number(searchParams.get('page')) || 1;
  const limit = Number(searchParams.get('limit')) || 10;

  const [analyses, setAnalyses] = useState<AnalysisListItemDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pobiera paginowaną listę analiz
   */
  const fetchAnalyses = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalyses(page, limit);
      setAnalyses(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Błąd ładowania analiz');
      message.error(error.message || 'Nie udało się załadować analiz');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Inicjuje nową analizę AI
   * @returns analysisId nowej analizy
   * @throws Error w przypadku błędu API
   */
  const createAnalysis = async (): Promise<string> => {
    console.log('[useAnalyses] createAnalysis called');
    setCreating(true);
    try {
      console.log('[useAnalyses] Calling initiateAnalysis API...');
      const result = await initiateAnalysis();
      console.log('[useAnalyses] API response:', result);
      message.success('Analiza została uruchomiona');
      return result.analysisId;
    } catch (err) {
      const error = err as Error;
      console.error('[useAnalyses] Error:', error);
      
      // Obsługa specyficznych błędów
      if (error.message.includes('No transactions')) {
        Modal.error({
          title: 'Brak transakcji',
          content: 'Aby wykonać analizę, musisz najpierw dodać transakcje do portfela.',
          okText: 'Przejdź do transakcji',
          onOk: () => navigate('/transactions'),
        });
      } else if (error.message.includes('rate limit') || error.message.includes('429')) {
        message.error('Przekroczono limit analiz. Spróbuj ponownie później.');
      } else if (error.message.includes('strategy') || error.message.includes('402')) {
        Modal.error({
          title: 'Brak strategii inwestycyjnej',
          content: 'Musisz najpierw zdefiniować swoją strategię inwestycyjną.',
          okText: 'Przejdź do strategii',
          onOk: () => navigate('/strategy'),
        });
      } else {
        message.error(error.message || 'Błąd podczas tworzenia analizy');
      }
      
      throw error;
    } finally {
      setCreating(false);
    }
  };

  /**
   * Automatyczne pobieranie analiz przy zmianie parametrów paginacji
   */
  useEffect(() => {
    fetchAnalyses(page, limit);
  }, [page, limit, fetchAnalyses]);

  return {
    analyses,
    pagination,
    loading,
    creating,
    error,
    fetchAnalyses,
    createAnalysis,
  };
};
