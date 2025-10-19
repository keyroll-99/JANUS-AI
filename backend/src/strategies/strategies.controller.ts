import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../shared/middlewares/requireAuth';
import { strategyService } from './strategies.service';
import { StrategyDto } from './strategies.types';

/**
 * StrategyController handles HTTP requests for investment strategy endpoints
 * Delegates business logic to StrategyService
 */
export class StrategyController {
  /**
   * GET /api/v1/strategy
   * Get user's investment strategy
   */
  async getStrategy(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const strategy = await strategyService.getStrategy(userId);

      res.status(200).json(strategy);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/strategy
   * Create a new investment strategy for user
   */
  async createStrategy(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const strategyData = req.body as StrategyDto;

      const strategy = await strategyService.createStrategy(userId, strategyData);

      res.status(201).json(strategy);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/strategy
   * Update existing investment strategy for user
   */
  async updateStrategy(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const strategyData = req.body as StrategyDto;

      const strategy = await strategyService.updateStrategy(userId, strategyData);

      res.status(200).json(strategy);
    } catch (error) {
      next(error);
    }
  }
}

export const strategyController = new StrategyController();
