import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Global error handler middleware
 * Handles both AppError (with statusCode) and AuthError (with status)
 */
export const errorHandler = (
  err: Error | AppError | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  // Determine status code from various error types
  let statusCode = 500;
  if (err instanceof AppError) {
    statusCode = err.statusCode;
  } else if ('status' in err && typeof err.status === 'number') {
    // Handle Supabase AuthError and similar errors with 'status' property
    statusCode = err.status;
  }

  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    message,
  });
};
