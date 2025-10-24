import { api, apiClient } from './client';
import type {
  CreateTransactionDto,
  GetTransactionsQueryDto,
  ImportTransactionsResponseDto,
  PaginatedTransactionsDto,
  TransactionDto,
  UpdateTransactionDto,
} from '../types';

const buildQueryString = (query: GetTransactionsQueryDto): string => {
  const params = new URLSearchParams();

  params.set('page', String(query.page));
  params.set('limit', String(query.limit));

  if (query.sortBy) {
    params.set('sortBy', query.sortBy);
  }

  if (query.order) {
    params.set('order', query.order);
  }

  if (query.type) {
    params.set('type', query.type);
  }

  if (query.ticker) {
    params.set('ticker', query.ticker);
  }

  if (query.account) {
    params.set('account', query.account);
  }

  return params.toString();
};

export const getTransactions = async (
  query: GetTransactionsQueryDto
): Promise<PaginatedTransactionsDto> => {
  try {
    const queryString = buildQueryString(query);
    const endpoint = queryString ? `/v1/transactions?${queryString}` : '/v1/transactions';

    return await api.get<PaginatedTransactionsDto>(endpoint);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Unauthorized')) {
        throw new Error('Sesja wygasła. Zaloguj się ponownie.');
      }
      throw new Error(error.message || 'Nie udało się pobrać transakcji.');
    }

    throw new Error('Nie udało się pobrać transakcji.');
  }
};

export const createTransaction = async (
  payload: CreateTransactionDto
): Promise<TransactionDto> => {
  try {
    return await api.post<TransactionDto>('/v1/transactions', payload);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Nie udało się dodać transakcji.');
    }

    throw new Error('Nie udało się dodać transakcji.');
  }
};

export const updateTransaction = async (
  id: string,
  payload: UpdateTransactionDto
): Promise<TransactionDto> => {
  try {
    return await api.put<TransactionDto>(`/v1/transactions/${id}`, payload);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Nie udało się zaktualizować transakcji.');
    }

    throw new Error('Nie udało się zaktualizować transakcji.');
  }
};

export const deleteTransaction = async (id: string): Promise<void> => {
  try {
    await api.delete(`/v1/transactions/${id}`);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Nie udało się usunąć transakcji.');
    }

    throw new Error('Nie udało się usunąć transakcji.');
  }
};

export const importTransactionsFile = async (
  file: File,
  accountTypeId?: number
): Promise<ImportTransactionsResponseDto> => {
  const formData = new FormData();
  formData.append('file', file);

  if (typeof accountTypeId === 'number') {
    formData.append('accountTypeId', String(accountTypeId));
  }

  try {
    return await apiClient<ImportTransactionsResponseDto>('/v1/transactions/import-xtb', {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message || 'Nie udało się zaimportować pliku XTB.');
    }

    throw new Error('Nie udało się zaimportować pliku XTB.');
  }
};
