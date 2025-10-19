import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../shared/middlewares/requireAuth';
import { validateDto } from '../shared/middlewares/validateDto';
import { uploadConfig } from '../shared/config/multer';
import { transactionController } from './transaction.controller';
import {
  GetTransactionsQuerySchema,
  CreateTransactionDtoSchema,
  UpdateTransactionDtoSchema,
  UuidParamSchema,
} from './transaction.types';

const router = Router();

/**
 * All transaction routes require authentication
 * User can only access their own transactions (enforced in service layer)
 */

/**
 * GET /api/v1/transactions
 * Get paginated list of user's transactions with optional filtering and sorting
 */
router.get(
  '/',
  requireAuth,
  validateDto(GetTransactionsQuerySchema, 'query'),
  (req, res, next) => transactionController.getTransactions(req as AuthenticatedRequest, res, next)
);

/**
 * GET /api/v1/transactions/:id
 * Get a single transaction by ID
 */
router.get(
  '/:id',
  requireAuth,
  validateDto(UuidParamSchema, 'params'),
  (req, res, next) => transactionController.getTransactionById(req as AuthenticatedRequest, res, next)
);

/**
 * POST /api/v1/transactions
 * Create a new transaction manually
 */
router.post(
  '/',
  requireAuth,
  validateDto(CreateTransactionDtoSchema, 'body'),
  (req, res, next) => transactionController.createTransaction(req as AuthenticatedRequest, res, next)
);

/**
 * PUT /api/v1/transactions/:id
 * Update an existing transaction
 */
router.put(
  '/:id',
  requireAuth,
  validateDto(UuidParamSchema, 'params'),
  validateDto(UpdateTransactionDtoSchema, 'body'),
  (req, res, next) => transactionController.updateTransaction(req as AuthenticatedRequest, res, next)
);

/**
 * DELETE /api/v1/transactions/:id
 * Delete a transaction
 */
router.delete(
  '/:id',
  requireAuth,
  validateDto(UuidParamSchema, 'params'),
  (req, res, next) => transactionController.deleteTransaction(req as AuthenticatedRequest, res, next)
);

/**
 * POST /api/v1/transactions/import-xtb
 * Import transactions from XTB Excel file
 * Expects multipart/form-data with 'file' field
 */
router.post(
  '/import-xtb',
  requireAuth,
  uploadConfig.single('file'),
  (req, res, next) => transactionController.importFromXtb(req as AuthenticatedRequest, res, next)
);

export default router;
