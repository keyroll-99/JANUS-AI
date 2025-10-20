/**
 * AnalysisController handles HTTP requests for AI analysis endpoints
 * Delegates business logic to AnalysisService
 */

import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../shared/middlewares/requireAuth';
import { AnalysisService } from './analysis.service';

export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  /**
   * GET /api/v1/analyses/:id
   * Get detailed information about a specific analysis
   */
  async getAnalysisById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const analysis = await this.analysisService.getAnalysisDetails(
        userId,
        id
      );

      res.status(200).json(analysis);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/analyses
   * Get paginated list of user's analyses
   */
  async getAnalyses(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const analyses = await this.analysisService.getAnalyses(
        userId,
        page,
        limit
      );

      res.status(200).json(analyses);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/analyses
   * Trigger a new portfolio analysis
   */
  async triggerNewAnalysis(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user.id;

      const result = await this.analysisService.triggerAnalysis(userId);

      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }
}

// Export singleton instance
const analysisService = new AnalysisService();
export const analysisController = new AnalysisController(analysisService);
