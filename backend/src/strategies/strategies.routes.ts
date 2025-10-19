import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../shared/middlewares/requireAuth';
import { validateDto } from '../shared/middlewares/validateDto';
import { strategyController } from './strategies.controller';
import { strategySchema } from './strategies.types';

const router = Router();

/**
 * All strategy routes require authentication
 * User can only access their own strategy (enforced in service layer)
 */

/**
 * GET /api/v1/strategy
 * Get user's investment strategy
 */
router.get(
  '/',
  requireAuth,
  (req, res, next) => strategyController.getStrategy(req as AuthenticatedRequest, res, next)
);

/**
 * POST /api/v1/strategy
 * Create a new investment strategy for user
 */
router.post(
  '/',
  requireAuth,
  validateDto(strategySchema, 'body'),
  (req, res, next) => strategyController.createStrategy(req as AuthenticatedRequest, res, next)
);

/**
 * PUT /api/v1/strategy
 * Update existing investment strategy for user
 */
router.put(
  '/',
  requireAuth,
  validateDto(strategySchema, 'body'),
  (req, res, next) => strategyController.updateStrategy(req as AuthenticatedRequest, res, next)
);

export default router;
