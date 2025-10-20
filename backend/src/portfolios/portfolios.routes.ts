import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { requireAuth, AuthenticatedRequest } from '../shared/middlewares/requireAuth';
import { portfolioController } from './portfolios.controller';

const router = Router();

/**
 * Rate limiter for dashboard endpoint
 * Allows 60 requests per minute per user to prevent API abuse
 * This aligns with Finnhub free tier (60 calls/min)
 */
const dashboardLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  limit: 60, // 60 requests per minute
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    error: 'Too many requests to dashboard. Please try again in a minute.',
  },
  // Use user ID as key for authenticated requests
  // Skip IP-based key to avoid IPv6 issues
  keyGenerator: (req) => {
    const authReq = req as AuthenticatedRequest;
    // Always use user ID for authenticated requests
    // For unauthenticated, use a fixed key (auth middleware will reject anyway)
    return authReq.user?.id || 'unauthenticated';
  },
  // Skip successful requests from rate limit count
  skipSuccessfulRequests: false,
  // Skip failed requests from rate limit count
  skipFailedRequests: false,
});

/**
 * All portfolio routes require authentication
 * User can only access their own portfolio data (enforced in service layer)
 */

/**
 * GET /api/v1/dashboard
 * Get complete dashboard data including:
 * - Portfolio summary (total value, change)
 * - Historical portfolio values (last 30 days)
 * - Current diversification by ticker
 * 
 * Rate limit: 60 requests per minute per user
 * 
 * @returns {GetDashboardResponseDto} Dashboard data
 * @throws {401} Unauthorized - Invalid or missing JWT token
 * @throws {429} Too Many Requests - Rate limit exceeded
 * @throws {500} Internal Server Error - Database or external API error
 */
router.get(
  '/',
  requireAuth,
  dashboardLimiter,
  (req, res, next) => portfolioController.getDashboard(req as AuthenticatedRequest, res, next)
);

export default router;
