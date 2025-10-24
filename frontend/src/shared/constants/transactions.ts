import type { TransactionSortField } from '../types';

export interface TransactionTypeDefinition {
  id: number;
  code: string;
  label: string;
  requiresInstrument: boolean;
}

export interface AccountTypeDefinition {
  id: number;
  code: string;
  label: string;
}

export const TRANSACTION_TYPES: TransactionTypeDefinition[] = [
  { id: 1, code: 'BUY', label: 'Kupno (BUY)', requiresInstrument: true },
  { id: 2, code: 'SELL', label: 'Sprzedaż (SELL)', requiresInstrument: true },
  { id: 3, code: 'DIVIDEND', label: 'Dywidenda', requiresInstrument: false },
  { id: 4, code: 'DEPOSIT', label: 'Wpłata', requiresInstrument: false },
  { id: 5, code: 'WITHDRAWAL', label: 'Wypłata', requiresInstrument: false },
  { id: 6, code: 'FEE', label: 'Opłata/fee', requiresInstrument: false },
];

export const ACCOUNT_TYPES: AccountTypeDefinition[] = [
  { id: 1, code: 'MAIN', label: 'Główne konto (MAIN)' },
  { id: 2, code: 'IKE', label: 'IKE' },
  { id: 3, code: 'IKZE', label: 'IKZE' },
];

export const TRANSACTION_TYPE_CODE_TO_ID: Record<string, number> = TRANSACTION_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.code]: type.id }),
  {} as Record<string, number>
);

export const TRANSACTION_TYPE_ID_TO_CODE: Record<number, string> = TRANSACTION_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.id]: type.code }),
  {} as Record<number, string>
);

export const ACCOUNT_TYPE_CODE_TO_ID: Record<string, number> = ACCOUNT_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.code]: type.id }),
  {} as Record<string, number>
);

export const ACCOUNT_TYPE_ID_TO_CODE: Record<number, string> = ACCOUNT_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.id]: type.code }),
  {} as Record<number, string>
);

export const TRANSACTION_TYPES_FORM_OPTIONS = TRANSACTION_TYPES.map((type) => ({
  value: type.id,
  label: type.label,
  code: type.code,
}));

export const TRANSACTION_TYPES_FILTER_OPTIONS = TRANSACTION_TYPES.map((type) => ({
  value: type.code,
  label: type.code,
}));

export const ACCOUNT_TYPES_FORM_OPTIONS = ACCOUNT_TYPES.map((type) => ({
  value: type.id,
  label: type.label,
  code: type.code,
}));

export const ACCOUNT_TYPES_FILTER_OPTIONS = ACCOUNT_TYPES.map((type) => ({
  value: type.code,
  label: type.code,
}));

export const TRANSACTION_TYPES_REQUIRING_INSTRUMENT = new Set<number>(
  TRANSACTION_TYPES.filter((type) => type.requiresInstrument).map((type) => type.id)
);

export const DEFAULT_TRANSACTIONS_PAGE = 1;
export const DEFAULT_TRANSACTIONS_PAGE_SIZE = 20;
export const MAX_TRANSACTIONS_PAGE_SIZE = 100;
export const TRANSACTIONS_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
export const TRANSACTIONS_TICKER_DEBOUNCE_MS = 500;
export const TRANSACTION_NOTES_MAX_LENGTH = 500;
export const TRANSACTION_IMPORT_MAX_SIZE_MB = 5;
export const TRANSACTION_IMPORT_ALLOWED_TYPES = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
export const DEFAULT_TRANSACTIONS_SORT_FIELD: TransactionSortField = 'transaction_date';
export const DEFAULT_TRANSACTIONS_SORT_ORDER: 'asc' | 'desc' = 'desc';
export const TICKER_REGEX = /^[A-Z0-9]{1,5}(?:[._-][A-Z0-9]{1,4})?$/;

export const TRANSACTION_SORT_OPTIONS: Array<{
  label: string;
  value: TransactionSortField;
}> = [
  { label: 'Data transakcji', value: 'transaction_date' },
  { label: 'Data utworzenia', value: 'created_at' },
  { label: 'Wartość transakcji', value: 'total_amount' },
  { label: 'Ticker', value: 'ticker' },
  { label: 'Typ transakcji', value: 'transaction_type_id' },
];

export const TRANSACTION_TYPE_TAG_COLORS: Record<string, string> = {
  BUY: 'green',
  SELL: 'volcano',
  DIVIDEND: 'blue',
  DEPOSIT: 'cyan',
  WITHDRAWAL: 'purple',
  FEE: 'orange',
};

export const ACCOUNT_TYPE_TAG_COLORS: Record<string, string> = {
  STANDARD: 'default',
  MAIN: 'default',
  IKE: 'geekblue',
  IKZE: 'gold',
};
