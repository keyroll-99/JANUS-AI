import { supabase } from '../shared/config/supabase';
import { Tables } from '../shared/config/database.types';
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

type TransactionRow = Tables<'transactions'>;
type AccountTypeRow = Tables<'account_types'>;
type TransactionTypeRow = Tables<'transaction_types'>;

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
    userId: string,
    query: GetTransactionsQueryDto
  ): Promise<PaginatedTransactionsDto> {
    const { page, limit, sortBy, order, type, ticker } = query;
    const offset = (page - 1) * limit;

    // Build base query with joins to get human-readable names
    let queryBuilder = supabase
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

    // Apply sorting
    queryBuilder = queryBuilder.order(sortBy, { ascending: order === 'asc' });

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data, error, count } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    // Map database rows to DTOs
    const transactions: TransactionDto[] = (data || []).map((row: any) =>
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
  async getTransactionById(userId: string, transactionId: string): Promise<TransactionDto> {
    const { data, error } = await supabase
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
      const notFoundError = new Error('Transaction not found') as any;
      notFoundError.status = 404;
      throw notFoundError;
    }

    return this.mapToDto(data);
  }

  /**
   * Map database row to TransactionDto
   * @private
   */
  private mapToDto(row: any): TransactionDto {
    return {
      id: row.id,
      userId: row.user_id,
      transactionDate: row.transaction_date,
      transactionType: row.transaction_types.name,
      accountType: row.account_types.name,
      ticker: row.ticker,
      quantity: row.quantity ? parseFloat(row.quantity) : null,
      price: row.price ? parseFloat(row.price) : null,
      totalAmount: parseFloat(row.total_amount),
      commission: parseFloat(row.commission),
      notes: row.notes,
      importedFromFile: row.imported_from_file,
      importBatchId: row.import_batch_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Create a new transaction
   * @throws {Error} When database insert fails
   */
  async createTransaction(userId: string, dto: CreateTransactionDto): Promise<TransactionDto> {
    const { data, error } = await supabase
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
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto
  ): Promise<TransactionDto> {
    // First verify ownership
    await this.getTransactionById(userId, transactionId);

    // Build update object with only provided fields
    const updateData: any = {};
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

    const { data, error } = await supabase
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
  async deleteTransaction(userId: string, transactionId: string): Promise<void> {
    // First verify ownership
    await this.getTransactionById(userId, transactionId);

    const { error } = await supabase
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
    userId: string,
    file: Express.Multer.File
  ): Promise<ImportTransactionsResponseDto> {
    // Parse Excel file
    const parser = new XtbParser();
    const xtbTransactions = await parser.parseFile(file.buffer);

    // Generate unique batch ID for this import
    const importBatchId = randomUUID();

    // Transform XTB transactions to our format
    const transactionsToInsert = xtbTransactions.map((xtbTx) =>
      this.mapXtbTransaction(userId, xtbTx, importBatchId)
    );

    // Validate all transactions before inserting
    this.validateTransactions(transactionsToInsert);

    // Batch insert all transactions
    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select('id');

    if (error) {
      const validationError = new Error(
        `Failed to import transactions: ${error.message}`
      ) as any;
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
  ): any {
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
  private validateTransactions(transactions: any[]): void {
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
}

export const transactionService = new TransactionService();
