import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../shared/middlewares/requireAuth';
import { transactionService } from './transaction.service';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  GetTransactionsQueryDto,
  UuidParamDto,
} from './transaction.types';

/**
 * TransactionController handles HTTP requests for transaction endpoints
 * Delegates business logic to TransactionService
 */
export class TransactionController {
  /**
   * GET /api/v1/transactions
   * Get paginated list of user's transactions with optional filtering and sorting
   */
  async getTransactions(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      // Use validatedQuery from validateDto middleware
      const query = (req as any).validatedQuery as GetTransactionsQueryDto;

      const result = await transactionService.getTransactions(userId, query);

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/transactions/:id
   * Get a single transaction by ID
   */
  async getTransactionById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      // Use validatedParams from validateDto middleware
      const { id } = (req as any).validatedParams as UuidParamDto;

      const transaction = await transactionService.getTransactionById(userId, id);

      res.status(200).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/transactions
   * Create a new transaction manually
   */
  async createTransaction(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const dto = req.body as CreateTransactionDto;

      const transaction = await transactionService.createTransaction(userId, dto);

      res.status(201).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/transactions/:id
   * Update an existing transaction
   */
  async updateTransaction(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      // Use validatedParams from validateDto middleware
      const { id } = (req as any).validatedParams as UuidParamDto;
      const dto = req.body as UpdateTransactionDto;

      const transaction = await transactionService.updateTransaction(userId, id, dto);

      res.status(200).json(transaction);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/transactions/:id
   * Delete a transaction
   */
  async deleteTransaction(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      // Use validatedParams from validateDto middleware
      const { id } = (req as any).validatedParams as UuidParamDto;

      await transactionService.deleteTransaction(userId, id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/transactions/import-xtb
   * Import transactions from XTB Excel file
   */
  async importFromXtb(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          message: 'No file uploaded. Please provide an Excel file.',
        });
        return;
      }

      const result = await transactionService.importFromXtb(userId, file);

      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
