import { useState, useEffect, useCallback } from 'react';

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface UseFetchOptions {
  skip?: boolean; // Skip initial fetch
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

/**
 * Custom hook for data fetching with loading and error states
 * Replaces React Query for simple CRUD operations
 * 
 * @example
 * const { data, loading, error, refetch } = useFetch<User[]>('/api/users');
 */
export function useFetch<T = unknown>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: UseFetchOptions = {}
) {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: !options.skip,
    error: null,
  });

  const executeFetch = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await fetchFn();
      setState({ data, loading: false, error: null });
      options.onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      setState({ data: null, loading: false, error: err });
      options.onError?.(err);
      throw err;
    }
  }, [fetchFn, options.onSuccess, options.onError]);

  useEffect(() => {
    if (!options.skip) {
      executeFetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...state,
    refetch: executeFetch,
  };
}

/**
 * Custom hook for mutations (POST, PUT, DELETE)
 * 
 * @example
 * const { mutate, loading, error } = useMutation(
 *   (data) => api.post('/api/users', data),
 *   { onSuccess: () => refetchUsers() }
 * );
 */
export function useMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseFetchOptions = {}
) {
  const [state, setState] = useState<UseFetchState<TData>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables: TVariables) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const data = await mutationFn(variables);
        setState({ data, loading: false, error: null });
        options.onSuccess?.(data);
        return data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        setState((prev) => ({ ...prev, loading: false, error: err }));
        options.onError?.(err);
        throw err;
      }
    },
    [mutationFn, options.onSuccess, options.onError]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    mutate,
    reset,
  };
}
