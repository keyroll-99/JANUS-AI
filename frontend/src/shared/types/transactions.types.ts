export interface TransactionDto {
  id: string;
  userId: string;
  transactionDate: string;
  transactionType: string;
  accountType: string;
  ticker: string | null;
  quantity: number | null;
  price: number | null;
  totalAmount: number;
  commission: number;
  notes: string | null;
  importedFromFile: boolean;
  importBatchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationDto {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export interface PaginatedTransactionsDto {
  data: TransactionDto[];
  pagination: PaginationDto;
}

export type TransactionSortField =
  | 'transaction_date'
  | 'created_at'
  | 'total_amount'
  | 'ticker'
  | 'transaction_type_id';

export interface GetTransactionsQueryDto {
  page: number;
  limit: number;
  sortBy?: TransactionSortField;
  order?: 'asc' | 'desc';
  type?: string;
  ticker?: string;
  account?: string;
}

export interface ImportTransactionsResponseDto {
  message: string;
  importedCount: number;
  importBatchId: string;
}

export type ImportResult = ImportTransactionsResponseDto;

export interface CreateTransactionDto {
  transactionDate: string;
  transactionTypeId: number;
  accountTypeId: number;
  ticker?: string | null;
  quantity?: number | null;
  price?: number | null;
  totalAmount: number;
  commission: number;
  notes?: string | null;
}

export interface UpdateTransactionDto {
  transactionDate?: string;
  transactionTypeId?: number;
  accountTypeId?: number;
  ticker?: string | null;
  quantity?: number | null;
  price?: number | null;
  totalAmount?: number;
  commission?: number;
  notes?: string | null;
}

export interface TransactionFormValues {
  transactionDate: string;
  transactionTypeId: number;
  accountTypeId: number;
  ticker?: string | null;
  quantity?: number | null;
  price?: number | null;
  totalAmount: number;
  commission: number;
  notes?: string | null;
}

export interface FilterFormValues {
  ticker?: string;
  type?: string;
  account?: string;
}
