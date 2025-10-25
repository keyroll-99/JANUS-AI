import { useState, useEffect } from 'react';
import { message } from 'antd';
import {
  getStrategy,
  updateStrategy as updateStrategyApi,
  createStrategy as createStrategyApi,
} from '../api/strategy.api';
import {
  StrategyResponseDto,
  StrategyRequestDto,
} from '../types/strategy.types';

interface UseStrategyReturn {
  strategy: StrategyResponseDto | null;
  loading: boolean;
  updating: boolean;
  error: string | null;
  fetchStrategy: () => Promise<void>;
  updateStrategy: (data: StrategyRequestDto) => Promise<void>;
  createStrategy: (data: StrategyRequestDto) => Promise<void>;
}

/**
 * Custom hook do zarządzania strategią inwestycyjną użytkownika
 * Obsługuje pobieranie, tworzenie i aktualizację strategii
 */
export const useStrategy = (): UseStrategyReturn => {
  const [strategy, setStrategy] = useState<StrategyResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Pobiera strategię użytkownika z API
   */
  const fetchStrategy = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getStrategy();
      setStrategy(data);
    } catch (err) {
      const error = err as Error;
      if (error.message.includes('404') || error.message.includes('not found')) {
        // Brak strategii to nie błąd - użytkownik może ją utworzyć
        setStrategy(null);
        setError(null);
      } else {
        setError(error.message || 'Nie udało się pobrać strategii');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Tworzy nową strategię użytkownika
   */
  const createStrategy = async (data: StrategyRequestDto) => {
    try {
      setUpdating(true);
      setError(null);
      const createdStrategy = await createStrategyApi(data);
      setStrategy(createdStrategy);
      message.success('Strategia została utworzona');
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Nie udało się utworzyć strategii';
      setError(errorMessage);
      message.error(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Aktualizuje istniejącą strategię użytkownika
   */
  const updateStrategy = async (data: StrategyRequestDto) => {
    try {
      setUpdating(true);
      setError(null);
      const updatedStrategy = await updateStrategyApi(data);
      setStrategy(updatedStrategy);
      message.success('Strategia została zaktualizowana');
    } catch (err) {
      const error = err as Error;
      const errorMessage = error.message || 'Nie udało się zaktualizować strategii';
      setError(errorMessage);
      message.error(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  };

  // Fetch strategii przy montowaniu komponentu
  useEffect(() => {
    fetchStrategy();
  }, []);

  return {
    strategy,
    loading,
    updating,
    error,
    fetchStrategy,
    updateStrategy,
    createStrategy,
  };
};
