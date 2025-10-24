import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../shared/middlewares/requireAuth';
import { portfolioService } from './portfolios.service';

/**
 * PortfolioController handles HTTP requests for portfolio/dashboard endpoints
 * Delegates business logic to PortfolioService
 */
export class PortfolioController {
  /**
   * GET /api/v1/dashboard
   * Get complete dashboard data for authenticated user
   */
  async getDashboard(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const supabaseClient = req.supabaseClient;

      const dashboardData = await portfolioService.getDashboardData(supabaseClient, userId);

      res.status(200).json(dashboardData);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
export const portfolioController = new PortfolioController();
