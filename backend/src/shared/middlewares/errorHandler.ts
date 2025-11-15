import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';

/**
 * Global error handler middleware
 * Handles both AppError (with statusCode) and AuthError (with status)
 */
export const errorHandler = (
  err: Error | AppError | unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error(err);

  // Determine status code from various error types
  let statusCode = 500;
  let message = 'Internal Server Error';
  
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err && typeof err === 'object' && 'status' in err && typeof err.status === 'number') {
    // Handle Supabase AuthError and similar errors with 'status' property
    statusCode = err.status;
    message = 'message' in err && typeof err.message === 'string' ? err.message : message;
  } else if (err instanceof Error) {
    message = err.message;
  }

  res.status(statusCode).json({
    message,
  });
};
