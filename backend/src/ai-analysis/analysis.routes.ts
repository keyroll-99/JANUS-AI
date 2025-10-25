/**
 * Routes for AI Analysis endpoints
 * All routes require authentication
 */

import { Router } from 'express';
import { requireAuth } from '../shared/middlewares/requireAuth';
import { validateDto } from '../shared/middlewares/validateDto';
import { analysisController } from './analysis.controller';
import { GetAnalysisParams, GetAnalysesQuery } from './analysis.validation';

const router = Router();

/**
 * All analysis routes require authentication
 * Users can only access their own analyses (enforced in service layer)
 */

/**
 * GET /api/v1/analyses/:id
 * Get detailed information about a specific analysis including recommendations
 * 
 * @param {string} id - UUID of the analysis
 * @returns {AnalysisDetailsDto} Analysis details with recommendations
 * @throws {400} Bad Request - Invalid UUID format
 * @throws {401} Unauthorized - Invalid or missing JWT token
 * @throws {404} Not Found - Analysis doesn't exist or doesn't belong to user
 */
router.get(
  '/:id',
  requireAuth,
  validateDto(GetAnalysisParams, 'params'),
  (req, res, next) =>
    analysisController.getAnalysisById(req as any, res, next)
);

/**
 * GET /api/v1/analyses
 * Get paginated list of user's historical analyses
 * 
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 10, max: 100)
 * @returns {PaginatedAnalysesDto} Paginated list of analyses
 * @throws {400} Bad Request - Invalid pagination parameters
 * @throws {401} Unauthorized - Invalid or missing JWT token
 */
router.get(
  '/',
  requireAuth,
  validateDto(GetAnalysesQuery, 'query'),
  (req, res, next) =>
    analysisController.getAnalyses(req as any, res, next)
);

/**
 * POST /api/v1/analyses
 * Trigger a new AI portfolio analysis (asynchronous)
 * 
 * @returns {AnalysisInitiatedDto} Confirmation with analysis ID (202 Accepted)
 * @throws {401} Unauthorized - Invalid or missing JWT token
 * @throws {402} Payment Required - User hasn't defined investment strategy
 * @throws {429} Too Many Requests - Daily analysis limit exceeded
 */
router.post(
  '/',
  requireAuth,
  (req, res, next) =>
    analysisController.triggerAnalysis(req as any, res, next)
);

export default router;
