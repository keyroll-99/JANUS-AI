import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authController } from './auth.controller';
import { validateDto } from '../shared/middlewares/validateDto';
import { LoginUserSchema, RegisterUserSchema } from './auth.dto';

const router = Router();

/**
 * Rate limiter for auth endpoints to prevent brute-force attacks
 * Allows 5 requests per 15 minutes per IP address
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5, // Limit each IP to 5 requests per window
  standardHeaders: 'draft-8', // Use draft-8 RateLimit header
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.',
  },
  // Skip rate limiting for successful requests (only count failed attempts)
  skipSuccessfulRequests: true,
});

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
router.post(
  '/register',
  authLimiter,
  validateDto(RegisterUserSchema),
  (req, res, next) => authController.register(req, res, next)
);

/**
 * POST /api/v1/auth/login
 * Authenticate an existing user
 */
router.post(
  '/login',
  authLimiter,
  validateDto(LoginUserSchema),
  (req, res, next) => authController.login(req, res, next)
);

/**
 * POST /api/v1/auth/refresh
 * Refresh an expired access token using refresh token from cookie
 */
router.post(
  '/refresh',
  (req, res, next) => authController.refresh(req, res, next)
);

/**
 * POST /api/v1/auth/logout
 * Logout user and clear refresh token cookie
 */
router.post(
  '/logout',
  (req, res, next) => authController.logout(req, res, next)
);

export default router;
