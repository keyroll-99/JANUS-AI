import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

/**
 * Type of request data to validate
 */
type ValidationType = 'body' | 'query' | 'params';

/**
 * Middleware factory for validating request data against Zod schemas
 * Provides clear validation error messages to clients
 * 
 * @param schema Zod schema to validate against
 * @param type Type of request data to validate (defaults to 'body')
 * @returns Express middleware function
 */
export const validateDto = (schema: z.ZodSchema, type: ValidationType = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Parse and validate the specified request data
      // This will throw ZodError if validation fails
      const dataToValidate = req[type];
      const validatedData = schema.parse(dataToValidate);
      
      // Store validated data in a custom property to avoid read-only issues
      // For body/params we can update directly, but query is read-only
      if (type === 'query') {
        (req as any).validatedQuery = validatedData;
      } else if (type === 'params') {
        (req as any).validatedParams = validatedData;
      } else {
        (req as any)[type] = validatedData;
      }
      
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
