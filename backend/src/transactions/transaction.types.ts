import { z } from 'zod';

/**
 * Transaction DTO - represents a single transaction returned to the client
 * Maps database fields to frontend-friendly format
 */
export interface TransactionDto {
  id: string;
  userId: string;
  transactionDate: string; // ISO 8601 date string
  transactionType: string; // e.g., 'BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL'
  accountType: string; // e.g., 'STANDARD', 'IKE', 'IKZE'
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

/**
 * Pagination metadata
 */
export interface PaginationDto {
  totalItems: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

/**
 * Paginated response for GET /transactions
 */
export interface PaginatedTransactionsDto {
  data: TransactionDto[];
  pagination: PaginationDto;
}

/**
 * Response for import endpoint
 */
export interface ImportTransactionsResponseDto {
  message: string;
  importedCount: number;
  importBatchId: string;
}

/**
 * Zod schema for GET /transactions query parameters
 */
export const GetTransactionsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1)),
  limit: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(100)),
  sortBy: z
    .string()
    .optional()
    .default('transaction_date')
    .refine(
      (val) =>
        [
          'transaction_date',
          'created_at',
          'total_amount',
          'ticker',
          'transaction_type_id',
        ].includes(val),
      { message: 'Invalid sortBy field' }
    ),
  order: z
    .string()
    .optional()
    .default('desc')
    .refine((val) => ['asc', 'desc'].includes(val.toLowerCase()), {
      message: 'Order must be either "asc" or "desc"',
    })
    .transform((val) => val.toLowerCase() as 'asc' | 'desc'),
  type: z.string().optional(),
  ticker: z.string().optional(),
});

export type GetTransactionsQueryDto = z.infer<typeof GetTransactionsQuerySchema>;

/**
 * Zod schema for POST /transactions - Create new transaction
 */
export const CreateTransactionDtoSchema = z.object({
  transactionDate: z.string().datetime({ message: 'Invalid datetime format. Expected ISO 8601.' }),
  transactionTypeId: z.number().int().min(1, { message: 'Transaction type ID is required' }),
  accountTypeId: z.number().int().min(1, { message: 'Account type ID is required' }),
  ticker: z.string().min(1).max(20).optional().nullable(),
  quantity: z.number().positive().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  totalAmount: z.number(),
  commission: z.number().nonnegative().default(0),
  notes: z.string().max(500).optional().nullable(),
});

export type CreateTransactionDto = z.infer<typeof CreateTransactionDtoSchema>;

/**
 * Zod schema for PUT /transactions/:id - Update existing transaction
 * All fields are optional
 */
export const UpdateTransactionDtoSchema = z.object({
  transactionDate: z.string().datetime({ message: 'Invalid datetime format. Expected ISO 8601.' }).optional(),
  transactionTypeId: z.number().int().min(1).optional(),
  accountTypeId: z.number().int().min(1).optional(),
  ticker: z.string().min(1).max(20).optional().nullable(),
  quantity: z.number().positive().optional().nullable(),
  price: z.number().positive().optional().nullable(),
  totalAmount: z.number().optional(),
  commission: z.number().nonnegative().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export type UpdateTransactionDto = z.infer<typeof UpdateTransactionDtoSchema>;

/**
 * Zod schema for validating UUID path parameters
 */
export const UuidParamSchema = z.object({
  id: z.string().uuid({ message: 'Invalid UUID format' }),
});

export type UuidParamDto = z.infer<typeof UuidParamSchema>;
