import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Middleware factory for validating request body against Zod schemas
 * Provides clear validation error messages to clients
 * 
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export const validateDto = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the request body
      // This will throw ZodError if validation fails
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors for client consumption
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));

        res.status(400).json({
          message: 'Validation failed',
          errors: formattedErrors,
        });
        return;
      }

      // Pass unexpected errors to global error handler
      next(error);
    }
  };
};
