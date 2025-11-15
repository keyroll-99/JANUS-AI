import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../shared/config/database.types';
import { randomUUID } from 'crypto';
import {
  TransactionDto,
  PaginatedTransactionsDto,
  CreateTransactionDto,
  UpdateTransactionDto,
  GetTransactionsQueryDto,
  ImportTransactionsResponseDto,
} from './transaction.types';
import { XtbParser, XtbTransactionRow } from './xtb-parser';

// Type for transaction insert payload
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];

/**
 * TransactionService handles all business logic for transactions
 * Communicates with Supabase database and enforces authorization
 */
export class TransactionService {
  /**
   * Get paginated list of user's transactions with optional filtering and sorting
   * @throws {Error} When database query fails
   */
  async getTransactions(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
    query: GetTransactionsQueryDto
  ): Promise<PaginatedTransactionsDto> {
    const { page, limit, sortBy, order, type, ticker, account } = query;
    const offset = (page - 1) * limit;

    // Build base query with joins to get human-readable names
    let queryBuilder = supabaseClient
      .from('transactions')
      .select(
        `
        *,
        account_types!inner(id, name),
        transaction_types!inner(id, name)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId);

    // Apply filters
    if (type) {
      queryBuilder = queryBuilder.eq('transaction_types.name', type);
    }

    if (ticker) {
      queryBuilder = queryBuilder.eq('ticker', ticker.toUpperCase());
    }

    if (account) {
      queryBuilder = queryBuilder.eq('account_types.name', account);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(sortBy, { ascending: order === 'asc' });

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    // Map database rows to DTOs
    const transactions: TransactionDto[] = (data || []).map((row: Record<string, unknown>) =>
      this.mapToDto(row)
    );

    return {
      data: transactions,
      pagination: {
        totalItems: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Get a single transaction by ID
   * @throws {Error} 404 when transaction not found or doesn't belong to user
   */
  async getTransactionById(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
    transactionId: string
  ): Promise<TransactionDto> {
    const { data, error } = await supabaseClient
      .from('transactions')
      .select(
        `
        *,
        account_types!inner(id, name),
        transaction_types!inner(id, name)
      `
      )
      .eq('id', transactionId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      const notFoundError = new Error('Transaction not found') as Error & { status: number };
      notFoundError.status = 404;
      throw notFoundError;
    }

    return this.mapToDto(data);
  }

  /**
   * Map database row to TransactionDto
   * @private
   */
  private mapToDto(row: Record<string, unknown>): TransactionDto {
    const transactionTypes = row.transaction_types as { name: string };
    const accountTypes = row.account_types as { name: string };
    return {
      id: row.id as string,
      userId: row.user_id as string,
      transactionDate: row.transaction_date as string,
      transactionType: transactionTypes.name,
      accountType: accountTypes.name,
      ticker: row.ticker as string | null,
      quantity: row.quantity ? parseFloat(row.quantity as string) : null,
      price: row.price ? parseFloat(row.price as string) : null,
      totalAmount: parseFloat(row.total_amount as string),
      commission: parseFloat(row.commission as string),
      notes: row.notes as string | null,
      importedFromFile: row.imported_from_file as boolean,
      importBatchId: row.import_batch_id as string | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    };
  }

  /**
   * Create a new transaction
   * @throws {Error} When database insert fails
   */
  async createTransaction(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
    dto: CreateTransactionDto
  ): Promise<TransactionDto> {
    const { data, error } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        transaction_date: dto.transactionDate,
        transaction_type_id: dto.transactionTypeId,
        account_type_id: dto.accountTypeId,
        ticker: dto.ticker?.toUpperCase() || null,
        quantity: dto.quantity || null,
        price: dto.price || null,
        total_amount: dto.totalAmount,
        commission: dto.commission || 0,
        notes: dto.notes || null,
        imported_from_file: false,
      })
      .select(
        `
        *,
        account_types!inner(id, name),
        transaction_types!inner(id, name)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return this.mapToDto(data);
  }

  /**
   * Update an existing transaction
   * @throws {Error} 404 when transaction not found or doesn't belong to user
   */
  async updateTransaction(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto
  ): Promise<TransactionDto> {
    // First verify ownership
    await this.getTransactionById(supabaseClient, userId, transactionId);

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (dto.transactionDate !== undefined) updateData.transaction_date = dto.transactionDate;
    if (dto.transactionTypeId !== undefined)
      updateData.transaction_type_id = dto.transactionTypeId;
    if (dto.accountTypeId !== undefined) updateData.account_type_id = dto.accountTypeId;
    if (dto.ticker !== undefined) updateData.ticker = dto.ticker?.toUpperCase() || null;
    if (dto.quantity !== undefined) updateData.quantity = dto.quantity || null;
    if (dto.price !== undefined) updateData.price = dto.price || null;
    if (dto.totalAmount !== undefined) updateData.total_amount = dto.totalAmount;
    if (dto.commission !== undefined) updateData.commission = dto.commission;
    if (dto.notes !== undefined) updateData.notes = dto.notes || null;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from('transactions')
      .update(updateData)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select(
        `
        *,
        account_types!inner(id, name),
        transaction_types!inner(id, name)
      `
      )
      .single();

    if (error) {
      throw new Error(`Failed to update transaction: ${error.message}`);
    }

    return this.mapToDto(data);
  }

  /**
   * Delete a transaction
   * @throws {Error} 404 when transaction not found or doesn't belong to user
   */
  async deleteTransaction(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
    transactionId: string
  ): Promise<void> {
    // First verify ownership
    await this.getTransactionById(supabaseClient, userId, transactionId);

    const { error } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete transaction: ${error.message}`);
    }
  }

  /**
   * Import transactions from XTB Excel file
   * @throws {Error} 422 when file format is invalid or data validation fails
   */
  async importFromXtb(
    supabaseClient: SupabaseClient<Database>,
    userId: string,
    file: Express.Multer.File,
    overrideAccountTypeId?: number
  ): Promise<ImportTransactionsResponseDto> {
    // Parse Excel file
    const parser = new XtbParser();
    const xtbTransactions = await parser.parseFile(file.buffer);

    // Generate unique batch ID for this import
    const importBatchId = randomUUID();

    let manualAccountTypeId: number | undefined;
    if (typeof overrideAccountTypeId === 'number') {
      manualAccountTypeId = await this.validateAccountTypeId(supabaseClient, overrideAccountTypeId);
    }

    // Transform XTB transactions to our format
    const transactionsToInsert: TransactionInsert[] = xtbTransactions.map((xtbTx) => {
      const mapped = this.mapXtbTransaction(userId, xtbTx, importBatchId);
      if (manualAccountTypeId) {
        mapped.account_type_id = manualAccountTypeId;
      }
      return mapped;
    });

    // Validate all transactions before inserting
    this.validateTransactions(transactionsToInsert);

    // Batch insert all transactions
    const { data, error } = await supabaseClient
      .from('transactions')
      .insert(transactionsToInsert)
      .select('id');

    if (error) {
      const validationError = new Error(
        `Failed to import transactions: ${error.message}`
      ) as Error & { status: number };
      validationError.status = 422;
      throw validationError;
    }

    return {
      message: `Successfully imported ${data?.length || 0} transactions`,
      importedCount: data?.length || 0,
      importBatchId,
    };
  }

  /**
   * Map XTB transaction to our database format
   * @private
   */
  private mapXtbTransaction(
    userId: string,
    xtbTx: XtbTransactionRow,
    importBatchId: string
  ): TransactionInsert {
    const transactionTypeId = XtbParser.mapTransactionType(xtbTx.type);
    const accountTypeId = XtbParser.mapAccountType(xtbTx.comment);

    // Extract quantity and price for stock transactions
    let quantity: number | null = null;
    let price: number | null = null;

    if (xtbTx.symbol && (transactionTypeId === 1 || transactionTypeId === 2)) {
      // BUY or SELL
      quantity = XtbParser.extractQuantity(xtbTx.comment);
      price = XtbParser.extractPrice(xtbTx.comment);
    }

    return {
      user_id: userId,
      transaction_date: xtbTx.time.toISOString(),
      transaction_type_id: transactionTypeId,
      account_type_id: accountTypeId,
      ticker: xtbTx.symbol,
      quantity,
      price,
      total_amount: Math.abs(xtbTx.amount), // Use absolute value
      commission: 0, // XTB doesn't separate commission in this report
      notes: xtbTx.comment,
      imported_from_file: true,
      import_batch_id: importBatchId,
    };
  }

  /**
   * Validate transactions before batch insert
   * @private
   * @throws Error if validation fails
   */
  private validateTransactions(transactions: TransactionInsert[]): void {
    if (transactions.length === 0) {
      throw new Error('No transactions to import');
    }

    // Check for duplicate XTB IDs within the batch
    const comments = transactions.map((t) => t.notes);
    const uniqueComments = new Set(comments);

    if (comments.length !== uniqueComments.size) {
      console.warn('Warning: Duplicate transactions detected in import batch');
    }

    // Validate required fields
    transactions.forEach((tx, index) => {
      if (!tx.user_id) {
        throw new Error(`Transaction ${index + 1}: Missing user_id`);
      }
      if (!tx.transaction_date) {
        throw new Error(`Transaction ${index + 1}: Missing transaction_date`);
      }
      if (!tx.transaction_type_id) {
        throw new Error(`Transaction ${index + 1}: Missing transaction_type_id`);
      }
      if (!tx.account_type_id) {
        throw new Error(`Transaction ${index + 1}: Missing account_type_id`);
      }
      if (tx.total_amount === undefined || tx.total_amount === null) {
        throw new Error(`Transaction ${index + 1}: Missing total_amount`);
      }
    });
  }

  /**
   * Ensure provided account type exists before overriding import data
   * @throws {Error} When account type is invalid
   */
  private async validateAccountTypeId(
    supabaseClient: SupabaseClient<Database>,
    accountTypeId: number
  ): Promise<number> {
    const { data, error } = await supabaseClient
      .from('account_types')
      .select('id')
      .eq('id', accountTypeId)
      .single();

    if (error || !data) {
      const validationError = new Error('Invalid account type selected for import') as Error & { status: number };
      validationError.status = 400;
      throw validationError;
    }

    return data.id;
  }
}

export const transactionService = new TransactionService();
