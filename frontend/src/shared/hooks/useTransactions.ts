import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { message } from 'antd';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_TRANSACTIONS_PAGE,
  DEFAULT_TRANSACTIONS_PAGE_SIZE,
  DEFAULT_TRANSACTIONS_SORT_FIELD,
  DEFAULT_TRANSACTIONS_SORT_ORDER,
  MAX_TRANSACTIONS_PAGE_SIZE,
  TRANSACTION_SORT_OPTIONS,
} from '../constants/transactions';
import {
  CreateTransactionDto,
  FilterFormValues,
  GetTransactionsQueryDto,
  ImportResult,
  PaginatedTransactionsDto,
  PaginationDto,
  TransactionDto,
  TransactionSortField,
  UpdateTransactionDto,
} from '../types';
import {
  createTransaction as createTransactionRequest,
  deleteTransaction as deleteTransactionRequest,
  getTransactions as getTransactionsRequest,
  importTransactionsFile,
  updateTransaction as updateTransactionRequest,
} from '../api/transactions.api';
import { useAuth } from '../contexts/AuthContext';

type SortOrder = 'asc' | 'desc';

interface QueryState {
  page: number;
  limit: number;
  sortBy: TransactionSortField;
  order: SortOrder;
  filters: FilterFormValues;
}

export interface UseTransactionsReturn {
  transactions: TransactionDto[];
  pagination: PaginationDto;
  loading: boolean;
  error: string | null;
  sortBy: TransactionSortField;
  order: SortOrder;
  filters: FilterFormValues;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSort: (sortBy: TransactionSortField, order: SortOrder) => void;
  updateFilters: (filters: FilterFormValues) => void;
  clearFilters: () => void;
  refresh: () => Promise<void>;
  createTransaction: (payload: CreateTransactionDto) => Promise<TransactionDto>;
  updateTransaction: (id: string, payload: UpdateTransactionDto) => Promise<TransactionDto>;
  deleteTransaction: (id: string) => Promise<void>;
  importTransactions: (file: File, accountTypeId?: number) => Promise<ImportResult>;
  saving: boolean;
  deletingId: string | null;
  importing: boolean;
}

const DEFAULT_QUERY_STATE: QueryState = {
  page: DEFAULT_TRANSACTIONS_PAGE,
  limit: DEFAULT_TRANSACTIONS_PAGE_SIZE,
  sortBy: DEFAULT_TRANSACTIONS_SORT_FIELD,
  order: DEFAULT_TRANSACTIONS_SORT_ORDER,
  filters: {},
};

const allowedSortFields = new Set<TransactionSortField>(
  TRANSACTION_SORT_OPTIONS.map((option) => option.value)
);

const parseNumberParam = (
  value: string | null,
  fallback: number,
  min: number,
  max: number
): number => {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  if (parsed < min) return min;
  if (parsed > max) return max;
  return parsed;
};

const parseSortField = (value: string | null): TransactionSortField => {
  if (value && allowedSortFields.has(value as TransactionSortField)) {
    return value as TransactionSortField;
  }
  return DEFAULT_QUERY_STATE.sortBy;
};

const parseSortOrder = (value: string | null): SortOrder => {
  if (value === 'asc' || value === 'desc') {
    return value;
  }
  return DEFAULT_QUERY_STATE.order;
};

const parseFilters = (params: URLSearchParams): FilterFormValues => {
  const ticker = params.get('ticker') || undefined;
  const type = params.get('type') || undefined;
  const account = params.get('account') || undefined;

  return {
    ticker,
    type,
    account,
  };
};

const normalizeFilters = (filters: FilterFormValues): FilterFormValues => {
  const ticker = filters.ticker?.trim() || undefined;
  return {
    ticker: ticker ? ticker.toUpperCase() : undefined,
    type: filters.type || undefined,
    account: filters.account || undefined,
  };
};

const areFiltersEqual = (a: FilterFormValues, b: FilterFormValues): boolean =>
  (a.ticker || undefined) === (b.ticker || undefined) &&
  (a.type || undefined) === (b.type || undefined) &&
  (a.account || undefined) === (b.account || undefined);

const areQueryStatesEqual = (a: QueryState, b: QueryState): boolean =>
  a.page === b.page &&
  a.limit === b.limit &&
  a.sortBy === b.sortBy &&
  a.order === b.order &&
  areFiltersEqual(a.filters, b.filters);

const queryStateToSearchParams = (state: QueryState): URLSearchParams => {
  const params = new URLSearchParams();
  params.set('page', String(state.page));
  params.set('limit', String(state.limit));

  if (state.sortBy !== DEFAULT_QUERY_STATE.sortBy) {
    params.set('sortBy', state.sortBy);
  }

  if (state.order !== DEFAULT_QUERY_STATE.order) {
    params.set('order', state.order);
  }

  if (state.filters.type) {
    params.set('type', state.filters.type);
  }

  if (state.filters.ticker) {
    params.set('ticker', state.filters.ticker);
  }

  if (state.filters.account) {
    params.set('account', state.filters.account);
  }

  return params;
};

const buildQueryStateFromParams = (params: URLSearchParams): QueryState => {
  const page = parseNumberParam(
    params.get('page'),
    DEFAULT_QUERY_STATE.page,
    1,
    Number.MAX_SAFE_INTEGER
  );
  const limit = parseNumberParam(
    params.get('limit'),
    DEFAULT_QUERY_STATE.limit,
    1,
    MAX_TRANSACTIONS_PAGE_SIZE
  );
  const sortBy = parseSortField(params.get('sortBy'));
  const order = parseSortOrder(params.get('order'));
  const filters = normalizeFilters(parseFilters(params));

  return {
    page,
    limit,
    sortBy,
    order,
    filters,
  };
};

const defaultPagination: PaginationDto = {
  totalItems: 0,
  totalPages: 0,
  currentPage: DEFAULT_TRANSACTIONS_PAGE,
  limit: DEFAULT_TRANSACTIONS_PAGE_SIZE,
};

export const useTransactions = (): UseTransactionsReturn => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryState = useMemo(() => buildQueryStateFromParams(searchParams), [searchParams]);
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDto>(defaultPagination);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const lastQueryRef = useRef<QueryState>(DEFAULT_QUERY_STATE);

  const applyQueryState = useCallback(
    (next: QueryState) => {
      if (areQueryStatesEqual(next, queryState)) {
        return;
      }
      setSearchParams(queryStateToSearchParams(next), { replace: true });
    },
    [queryState, setSearchParams]
  );

  const fetchTransactions = useCallback(
    async (override?: Partial<QueryState>, options?: { force?: boolean }) => {
      if (!isAuthenticated) {
        setTransactions([]);
        setPagination(defaultPagination);
        setLoading(false);
        return;
      }

      const effectiveState: QueryState = {
        ...queryState,
        ...override,
        filters: {
          ...queryState.filters,
          ...(override?.filters ?? {}),
        },
      };

      const forceFetch = options?.force ?? false;
      if (!forceFetch && areQueryStatesEqual(effectiveState, lastQueryRef.current) && override) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const apiQuery: GetTransactionsQueryDto = {
          page: effectiveState.page,
          limit: effectiveState.limit,
          sortBy: effectiveState.sortBy,
          order: effectiveState.order,
          type: effectiveState.filters.type,
          ticker: effectiveState.filters.ticker,
          account: effectiveState.filters.account,
        };

        const response: PaginatedTransactionsDto = await getTransactionsRequest(apiQuery);
        setTransactions(response.data);
        setPagination(response.pagination);
        lastQueryRef.current = effectiveState;
      } catch (err) {
        const messageText = err instanceof Error ? err.message : 'Nie udało się pobrać transakcji.';
        setError(messageText);
        message.error(messageText);
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, queryState]
  );

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const refresh = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  const setPage = useCallback(
    (page: number) => {
      const nextState: QueryState = { ...queryState, page: Math.max(1, page) };
      applyQueryState(nextState);
    },
    [applyQueryState, queryState]
  );

  const setPageSize = useCallback(
    (pageSize: number) => {
      const validSize = Math.min(Math.max(1, pageSize), MAX_TRANSACTIONS_PAGE_SIZE);
      const nextState: QueryState = {
        ...queryState,
        page: DEFAULT_TRANSACTIONS_PAGE,
        limit: validSize,
      };
      applyQueryState(nextState);
    },
    [applyQueryState, queryState]
  );

  const setSort = useCallback(
    (sortBy: TransactionSortField, order: SortOrder) => {
      const nextState: QueryState = {
        ...queryState,
        sortBy,
        order,
        page: DEFAULT_TRANSACTIONS_PAGE,
      };
      applyQueryState(nextState);
    },
    [applyQueryState, queryState]
  );

  const updateFilters = useCallback(
    (filters: FilterFormValues) => {
      const normalized = normalizeFilters(filters);
      const nextState: QueryState = {
        ...queryState,
        page: DEFAULT_TRANSACTIONS_PAGE,
        filters: normalized,
      };
      applyQueryState(nextState);
    },
    [applyQueryState, queryState]
  );

  const clearFilters = useCallback(() => {
    const nextState: QueryState = {
      ...queryState,
      page: DEFAULT_TRANSACTIONS_PAGE,
      filters: {},
    };
    applyQueryState(nextState);
  }, [applyQueryState, queryState]);

  const createTransaction = useCallback(
    async (payload: CreateTransactionDto) => {
      setSaving(true);
      try {
        const response = await createTransactionRequest(payload);
        message.success('Transakcja została dodana');
        await fetchTransactions();
        return response;
      } catch (err) {
        const messageText = err instanceof Error ? err.message : 'Nie udało się dodać transakcji.';
        message.error(messageText);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchTransactions]
  );

  const updateTransaction = useCallback(
    async (id: string, payload: UpdateTransactionDto) => {
      setSaving(true);
      try {
        const response = await updateTransactionRequest(id, payload);
        message.success('Transakcja została zaktualizowana');
        await fetchTransactions();
        return response;
      } catch (err) {
        const messageText = err instanceof Error ? err.message : 'Nie udało się zaktualizować transakcji.';
        message.error(messageText);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [fetchTransactions]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        await deleteTransactionRequest(id);
        message.success('Transakcja została usunięta');
        await fetchTransactions();
      } catch (err) {
        const messageText = err instanceof Error ? err.message : 'Nie udało się usunąć transakcji.';
        message.error(messageText);
        throw err;
      } finally {
        setDeletingId(null);
      }
    },
    [fetchTransactions]
  );

  const importTransactions = useCallback(
    async (file: File, accountTypeId?: number) => {
      setImporting(true);
      try {
        const result = await importTransactionsFile(file, accountTypeId);
        message.success(`Zaimportowano ${result.importedCount} transakcji`);
        await fetchTransactions({ page: DEFAULT_TRANSACTIONS_PAGE }, { force: true });
        return result;
      } catch (err) {
        const messageText = err instanceof Error ? err.message : 'Nie udało się zaimportować transakcji.';
        message.error(messageText);
        throw err;
      } finally {
        setImporting(false);
      }
    },
    [fetchTransactions]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setTransactions([]);
      setPagination(defaultPagination);
    }
  }, [isAuthenticated]);

  return {
    transactions,
    pagination: {
      ...pagination,
      currentPage: queryState.page,
      limit: queryState.limit,
    },
    loading,
    error,
    sortBy: queryState.sortBy,
    order: queryState.order,
    filters: queryState.filters,
    setPage,
    setPageSize,
    setSort,
    updateFilters,
    clearFilters,
    refresh,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    saving,
    deletingId,
    importing,
  };
};
