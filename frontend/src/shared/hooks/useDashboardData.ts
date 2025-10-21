import { useState, useEffect, useCallback } from 'react';
import { getDashboardData } from '../api/dashboard';
import { useAuth } from '../contexts/AuthContext';
import type { GetDashboardResponseDto } from '../types';

export interface UseDashboardDataReturn {
  data: GetDashboardResponseDto | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => Promise<void>;
}

/**
 * Custom hook for managing dashboard data fetching and state
 * Automatically fetches data on mount and provides refresh functionality
 * @returns Dashboard data, loading states, error state, and refresh function
 */
export const useDashboardData = (): UseDashboardDataReturn => {
  const [data, setData] = useState<GetDashboardResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchData = useCallback(async (isRefresh = false) => {
    // Nie pobieraj danych jeśli użytkownik nie jest zalogowany
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await getDashboardData();
      setData(response);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'Nie udało się pobrać danych dashboard.';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refreshing, refresh };
};
