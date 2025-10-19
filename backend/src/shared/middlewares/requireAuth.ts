import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

/**
 * Extended Express Request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Middleware to verify JWT access token and attach user to request
 * Extracts token from Authorization header: "Bearer <token>"
 * 
 * @example
 * router.get('/protected', requireAuth, (req: AuthenticatedRequest, res) => {
 *   console.log(req.user.id); // User is authenticated
 * });
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        message: 'Access token is required. Please provide a valid Bearer token.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      res.status(401).json({
        message: 'Access token is missing.',
      });
      return;
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      res.status(401).json({
        message: 'Invalid or expired access token. Please log in again.',
      });
      return;
    }

    // Attach user to request object
    (req as AuthenticatedRequest).user = {
      id: data.user.id,
      email: data.user.email || '',
      role: data.user.role || 'authenticated',
    };

    next();
  } catch (error) {
    // Pass unexpected errors to global error handler
    next(error);
  }
};

/**
 * Optional authentication middleware - does not throw error if no token
 * Useful for endpoints that work differently for authenticated users
 * 
 * @example
 * router.get('/public', optionalAuth, (req: AuthenticatedRequest, res) => {
 *   if (req.user) {
 *     // User is authenticated
 *   } else {
 *     // Anonymous access
 *   }
 * });
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      next();
      return;
    }

    const token = authHeader.substring(7);

    if (!token) {
      next();
      return;
    }

    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(token);

    if (!error && data.user) {
      // Attach user to request object if token is valid
      (req as AuthenticatedRequest).user = {
        id: data.user.id,
        email: data.user.email || '',
        role: data.user.role || 'authenticated',
      };
    }

    // Continue regardless of token validity
    next();
  } catch (error) {
    // Log error but don't block request
    console.error('Optional auth error:', error);
    next();
  }
};
