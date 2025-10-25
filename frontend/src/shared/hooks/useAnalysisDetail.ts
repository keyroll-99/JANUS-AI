/**
 * Custom hook for fetching single analysis details
 * Handles loading a specific analysis with recommendations
 */

import { useState, useEffect } from 'react';
import { message } from 'antd';
import { getAnalysisById } from '../api/analysis.api';
import { AnalysisDetailsDto } from '../types/analysis.types';

interface UseAnalysisDetailReturn {
  analysis: AnalysisDetailsDto | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook do pobierania szczegółów pojedynczej analizy
 * @param analysisId - UUID analizy do pobrania
 */
export const useAnalysisDetail = (analysisId: string): UseAnalysisDetailReturn => {
  const [analysis, setAnalysis] = useState<AnalysisDetailsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pobiera szczegóły analizy z API
   */
  const fetchAnalysis = async () => {
    if (!analysisId) {
      setError('Brak ID analizy');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getAnalysisById(analysisId);
      setAnalysis(data);
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Nie udało się załadować analizy';
      
      // Obsługa specyficznych błędów
      if (error.message.includes('404') || error.message.includes('not found')) {
        setError('Analiza nie została znaleziona');
        message.error('Analiza nie istnieje lub została usunięta');
      } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        setError('Brak dostępu do tej analizy');
        message.error('Nie masz uprawnień do przeglądania tej analizy');
      } else {
        setError(errorMessage);
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Automatyczne pobieranie analizy przy montowaniu lub zmianie ID
   */
  useEffect(() => {
    fetchAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysisId]);

  return {
    analysis,
    loading,
    error,
    refetch: fetchAnalysis,
  };
};
