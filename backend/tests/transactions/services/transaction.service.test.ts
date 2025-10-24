// @ts-nocheck
import { TransactionService } from '../../../src/transactions/transaction.service';
import { supabase } from '../../../src/shared/config/supabase';
import { GetTransactionsQueryDto } from '../../../src/transactions/transaction.types';

// Mock Supabase client
jest.mock('../../../src/shared/config/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('TransactionService', () => {
  let transactionService: TransactionService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    transactionService = new TransactionService();
    jest.clearAllMocks();
  });

  describe('getTransactions', () => {
    it('should successfully fetch paginated transactions', async () => {
      const mockTransactions = [
        {
          id: 'transaction-1',
          user_id: mockUserId,
          transaction_date: '2025-01-15T10:00:00Z',
          transaction_types: { id: 1, name: 'BUY' },
          account_types: { id: 1, name: 'MAIN' },
          ticker: 'AAPL',
          quantity: '10',
          price: '150.50',
          total_amount: '1505.00',
          commission: '5.00',
          notes: null,
          imported_from_file: false,
          import_batch_id: null,
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ];

      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: mockTransactions,
          error: null,
          count: 1,
        }),
      };

      const mockSelect = jest.fn().mockReturnValue(mockChain);
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const query: GetTransactionsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'transaction_date',
        order: 'desc',
      };

  const result = await transactionService.getTransactions(supabase as any, mockUserId, query);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'transaction-1',
        userId: mockUserId,
        transactionType: 'BUY',
        accountType: 'MAIN',
        ticker: 'AAPL',
        quantity: 10,
        price: 150.50,
        totalAmount: 1505.00,
        commission: 5.00,
      });

      expect(result.pagination).toEqual({
        totalItems: 1,
        totalPages: 1,
        currentPage: 1,
        limit: 20,
      });

      expect(supabase.from).toHaveBeenCalledWith('transactions');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should apply filters correctly', async () => {
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: [],
          error: null,
          count: 0,
        }),
      };

      const mockSelect = jest.fn().mockReturnValue(mockChain);
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const query: GetTransactionsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'transaction_date',
        order: 'desc',
        type: 'BUY',
        ticker: 'AAPL',
        account: 'MAIN',
      };

  await transactionService.getTransactions(supabase as any, mockUserId, query);

      expect(mockChain.eq).toHaveBeenCalledWith('user_id', mockUserId);
      expect(mockChain.eq).toHaveBeenCalledWith('transaction_types.name', 'BUY');
      expect(mockChain.eq).toHaveBeenCalledWith('ticker', 'AAPL');
      expect(mockChain.eq).toHaveBeenCalledWith('account_types.name', 'MAIN');
    });

    it('should throw error when database query fails', async () => {
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
          count: null,
        }),
      };

      const mockSelect = jest.fn().mockReturnValue(mockChain);
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const query: GetTransactionsQueryDto = {
        page: 1,
        limit: 20,
        sortBy: 'transaction_date',
        order: 'desc',
      };

      await expect(
  transactionService.getTransactions(supabase as any, mockUserId, query)
      ).rejects.toThrow('Failed to fetch transactions: Database error');
    });
  });

  describe('getTransactionById', () => {
    it('should successfully fetch a single transaction', async () => {
      const mockTransaction = {
        id: 'transaction-1',
        user_id: mockUserId,
        transaction_date: '2025-01-15T10:00:00Z',
        transaction_types: { id: 1, name: 'BUY' },
        account_types: { id: 1, name: 'MAIN' },
        ticker: 'AAPL',
        quantity: '10',
        price: '150.50',
        total_amount: '1505.00',
        commission: '5.00',
        notes: 'Test note',
        imported_from_file: false,
        import_batch_id: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockTransaction,
          error: null,
        }),
      };

      const mockSelect = jest.fn().mockReturnValue(mockChain);
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      const result = await transactionService.getTransactionById(
        supabase as any,
        mockUserId,
        'transaction-1'
      );

      expect(result).toMatchObject({
        id: 'transaction-1',
        userId: mockUserId,
        transactionType: 'BUY',
        accountType: 'MAIN',
        ticker: 'AAPL',
        quantity: 10,
        price: 150.50,
        totalAmount: 1505.00,
        commission: 5.00,
        notes: 'Test note',
      });

      expect(mockChain.eq).toHaveBeenCalledWith('id', 'transaction-1');
      expect(mockChain.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should throw 404 error when transaction not found', async () => {
      const mockChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      const mockSelect = jest.fn().mockReturnValue(mockChain);
      (supabase.from as jest.Mock).mockReturnValue({ select: mockSelect });

      await expect(
  transactionService.getTransactionById(supabase as any, mockUserId, 'non-existent')
      ).rejects.toThrow('Transaction not found');

      try {
    await transactionService.getTransactionById(supabase as any, mockUserId, 'non-existent');
      } catch (error: any) {
        expect(error.status).toBe(404);
      }
    });
  });

  describe('createTransaction', () => {
    it('should successfully create a new transaction', async () => {
      const mockCreatedTransaction = {
        id: 'transaction-new',
        user_id: mockUserId,
        transaction_date: '2025-01-20T10:00:00Z',
        transaction_types: { id: 1, name: 'BUY' },
        account_types: { id: 1, name: 'MAIN' },
        ticker: 'TSLA',
        quantity: '5',
        price: '200.00',
        total_amount: '1000.00',
        commission: '3.00',
        notes: null,
        imported_from_file: false,
        import_batch_id: null,
        created_at: '2025-01-20T10:00:00Z',
        updated_at: '2025-01-20T10:00:00Z',
      };

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockCreatedTransaction,
          error: null,
        }),
      };

      const mockInsert = jest.fn().mockReturnValue(mockChain);
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const createDto = {
        transactionDate: '2025-01-20T10:00:00Z',
        transactionTypeId: 1,
        accountTypeId: 1,
        ticker: 'tsla',
        quantity: 5,
        price: 200.0,
        totalAmount: 1000.0,
        commission: 3.0,
      };

  const result = await transactionService.createTransaction(supabase as any, mockUserId, createDto);

      expect(result).toMatchObject({
        id: 'transaction-new',
        userId: mockUserId,
        transactionType: 'BUY',
        accountType: 'MAIN',
        ticker: 'TSLA',
        quantity: 5,
        price: 200.0,
        totalAmount: 1000.0,
        commission: 3.0,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUserId,
          ticker: 'TSLA', // Should be uppercased
          imported_from_file: false,
        })
      );
    });

    it('should throw error when database insert fails', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Insert failed' },
        }),
      };

      const mockInsert = jest.fn().mockReturnValue(mockChain);
      (supabase.from as jest.Mock).mockReturnValue({ insert: mockInsert });

      const createDto = {
        transactionDate: '2025-01-20T10:00:00Z',
        transactionTypeId: 1,
        accountTypeId: 1,
        totalAmount: 1000.0,
        commission: 3.0,
      };

      await expect(
  transactionService.createTransaction(supabase as any, mockUserId, createDto)
      ).rejects.toThrow('Failed to create transaction: Insert failed');
    });
  });

  describe('updateTransaction', () => {
    it('should successfully update a transaction', async () => {
      const mockExistingTransaction = {
        id: 'transaction-1',
        user_id: mockUserId,
        transaction_date: '2025-01-15T10:00:00Z',
        transaction_types: { id: 1, name: 'BUY' },
        account_types: { id: 1, name: 'MAIN' },
        ticker: 'AAPL',
        quantity: '10',
        price: '150.50',
        total_amount: '1505.00',
        commission: '5.00',
        notes: null,
        imported_from_file: false,
        import_batch_id: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      const mockUpdatedTransaction = {
        ...mockExistingTransaction,
        notes: 'Updated note',
        commission: '10.00',
        updated_at: '2025-01-20T10:00:00Z',
      };

      // Mock getTransactionById (ownership verification)
      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockExistingTransaction,
          error: null,
        }),
      };

      // Mock update
      const mockUpdateChain = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockUpdatedTransaction,
          error: null,
        }),
      };

      const mockFrom = jest.fn()
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockSelectChain) }) // getTransactionById
        .mockReturnValueOnce({ update: jest.fn().mockReturnValue(mockUpdateChain) }); // update

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const updateDto = {
        notes: 'Updated note',
        commission: 10.0,
      };

      const result = await transactionService.updateTransaction(
        supabase as any,
        mockUserId,
        'transaction-1',
        updateDto
      );

      expect(result).toMatchObject({
        id: 'transaction-1',
        notes: 'Updated note',
        commission: 10.0,
      });

      expect(mockFrom).toHaveBeenCalledWith('transactions');
      expect(mockUpdateChain.eq).toHaveBeenCalledWith('id', 'transaction-1');
      expect(mockUpdateChain.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should throw 404 error when updating non-existent transaction', async () => {
      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      });

      const updateDto = {
        notes: 'Updated note',
      };

      await expect(
  transactionService.updateTransaction(supabase as any, mockUserId, 'non-existent', updateDto)
      ).rejects.toThrow('Transaction not found');

      try {
    await transactionService.updateTransaction(supabase as any, mockUserId, 'non-existent', updateDto);
      } catch (error: any) {
        expect(error.status).toBe(404);
      }
    });

    it('should perform partial update with only provided fields', async () => {
      const mockExistingTransaction = {
        id: 'transaction-1',
        user_id: mockUserId,
        transaction_date: '2025-01-15T10:00:00Z',
        transaction_types: { id: 1, name: 'BUY' },
        account_types: { id: 1, name: 'MAIN' },
        ticker: 'AAPL',
        quantity: '10',
        price: '150.50',
        total_amount: '1505.00',
        commission: '5.00',
        notes: null,
        imported_from_file: false,
        import_batch_id: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockExistingTransaction,
          error: null,
        }),
      };

      const mockUpdateChain = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { ...mockExistingTransaction, ticker: 'MSFT' },
          error: null,
        }),
      };

      const mockUpdate = jest.fn().mockReturnValue(mockUpdateChain);
      const mockFrom = jest.fn()
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockSelectChain) })
        .mockReturnValueOnce({ update: mockUpdate });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const updateDto = {
        ticker: 'msft', // Should be uppercased
      };

  await transactionService.updateTransaction(supabase as any, mockUserId, 'transaction-1', updateDto);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ticker: 'MSFT',
          updated_at: expect.any(String),
        })
      );
    });

    it('should throw error when database update fails', async () => {
      const mockExistingTransaction = {
        id: 'transaction-1',
        user_id: mockUserId,
        transaction_date: '2025-01-15T10:00:00Z',
        transaction_types: { id: 1, name: 'BUY' },
        account_types: { id: 1, name: 'MAIN' },
        ticker: 'AAPL',
        quantity: '10',
        price: '150.50',
        total_amount: '1505.00',
        commission: '5.00',
        notes: null,
        imported_from_file: false,
        import_batch_id: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockExistingTransaction,
          error: null,
        }),
      };

      const mockUpdateChain = {
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Update failed' },
        }),
      };

      const mockFrom = jest.fn()
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockSelectChain) })
        .mockReturnValueOnce({ update: jest.fn().mockReturnValue(mockUpdateChain) });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      const updateDto = {
        notes: 'Updated note',
      };

      await expect(
  transactionService.updateTransaction(supabase as any, mockUserId, 'transaction-1', updateDto)
      ).rejects.toThrow('Failed to update transaction: Update failed');
    });
  });

  describe('deleteTransaction', () => {
    it('should successfully delete a transaction', async () => {
      const mockExistingTransaction = {
        id: 'transaction-1',
        user_id: mockUserId,
        transaction_date: '2025-01-15T10:00:00Z',
        transaction_types: { id: 1, name: 'BUY' },
        account_types: { id: 1, name: 'MAIN' },
        ticker: 'AAPL',
        quantity: '10',
        price: '150.50',
        total_amount: '1505.00',
        commission: '5.00',
        notes: null,
        imported_from_file: false,
        import_batch_id: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      // Mock getTransactionById (ownership verification)
      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockExistingTransaction,
          error: null,
        }),
      };

      // Mock delete with proper chaining
      const mockDeleteChain = {
        eq: jest.fn().mockReturnThis(),
      };
      // Last eq() in chain returns the result
      (mockDeleteChain.eq as jest.Mock).mockReturnValueOnce(mockDeleteChain).mockResolvedValueOnce({
        error: null,
      });

      const mockFrom = jest.fn()
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockSelectChain) }) // getTransactionById
        .mockReturnValueOnce({ delete: jest.fn().mockReturnValue(mockDeleteChain) }); // delete

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

  await transactionService.deleteTransaction(supabase as any, mockUserId, 'transaction-1');

      expect(mockFrom).toHaveBeenCalledWith('transactions');
      expect(mockDeleteChain.eq).toHaveBeenCalledWith('id', 'transaction-1');
      expect(mockDeleteChain.eq).toHaveBeenCalledWith('user_id', mockUserId);
    });

    it('should throw 404 error when deleting non-existent transaction', async () => {
      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Not found' },
        }),
      };

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue(mockSelectChain),
      });

      await expect(
  transactionService.deleteTransaction(supabase as any, mockUserId, 'non-existent')
      ).rejects.toThrow('Transaction not found');

      try {
    await transactionService.deleteTransaction(supabase as any, mockUserId, 'non-existent');
      } catch (error: any) {
        expect(error.status).toBe(404);
      }
    });

    it('should throw error when database delete fails', async () => {
      const mockExistingTransaction = {
        id: 'transaction-1',
        user_id: mockUserId,
        transaction_date: '2025-01-15T10:00:00Z',
        transaction_types: { id: 1, name: 'BUY' },
        account_types: { id: 1, name: 'MAIN' },
        ticker: 'AAPL',
        quantity: '10',
        price: '150.50',
        total_amount: '1505.00',
        commission: '5.00',
        notes: null,
        imported_from_file: false,
        import_batch_id: null,
        created_at: '2025-01-15T10:00:00Z',
        updated_at: '2025-01-15T10:00:00Z',
      };

      const mockSelectChain = {
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: mockExistingTransaction,
          error: null,
        }),
      };

      // Mock delete with error
      const mockDeleteChain = {
        eq: jest.fn().mockReturnThis(),
      };
      // Last eq() in chain returns error
      (mockDeleteChain.eq as jest.Mock).mockReturnValueOnce(mockDeleteChain).mockResolvedValueOnce({
        error: { message: 'Delete failed' },
      });

      const mockFrom = jest.fn()
        .mockReturnValueOnce({ select: jest.fn().mockReturnValue(mockSelectChain) })
        .mockReturnValueOnce({ delete: jest.fn().mockReturnValue(mockDeleteChain) });

      (supabase.from as jest.Mock).mockImplementation(mockFrom);

      await expect(
  transactionService.deleteTransaction(supabase as any, mockUserId, 'transaction-1')
      ).rejects.toThrow('Failed to delete transaction: Delete failed');
    });
  });
});
