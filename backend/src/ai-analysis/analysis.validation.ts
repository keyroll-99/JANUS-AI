/**
 * Zod validation schemas for AI Analysis endpoints
 */

import { z } from 'zod';

/**
 * Validates the analysis ID parameter for GET /analyses/:id
 */
export const GetAnalysisParams = z.object({
  id: z.string().uuid({ message: 'Analysis ID must be a valid UUID.' }),
});

/**
 * Validates query parameters for GET /analyses (paginated list)
 */
export const GetAnalysesQuery = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});
