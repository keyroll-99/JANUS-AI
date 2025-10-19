import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../shared/middlewares/requireAuth';

const router = Router();

/**
 * GET /api/v1/profile/me
 * Get current user profile
 * Requires authentication
 */
router.get(
  '/me',
  requireAuth,
  (req, res) => {
    const authReq = req as AuthenticatedRequest;
    
    res.status(200).json({
      user: {
        id: authReq.user.id,
        email: authReq.user.email,
        role: authReq.user.role,
      },
    });
  }
);

export default router;
