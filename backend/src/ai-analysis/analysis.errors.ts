/**
 * Domain-specific errors for AI Analysis
 */

import { AppError } from '../shared/errors/AppError';

/**
 * Thrown when user exceeds the daily analysis rate limit
 * HTTP Status: 429 Too Many Requests
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Daily analysis limit exceeded. Please try again tomorrow.') {
    super(message, 429);
    this.name = 'TooManyRequestsError';
  }
}

/**
 * Thrown when user hasn't defined an investment strategy yet
 * HTTP Status: 402 Payment Required (precondition failed)
 */
export class PreconditionFailedError extends AppError {
  constructor(message: string = 'Investment strategy must be defined before requesting an analysis.') {
    super(message, 402);
    this.name = 'PreconditionFailedError';
  }
}

/**
 * Thrown when requested analysis is not found or doesn't belong to the user
 * HTTP Status: 404 Not Found
 */
export class AnalysisNotFoundError extends AppError {
  constructor(message: string = 'Analysis not found or access denied.') {
    super(message, 404);
    this.name = 'AnalysisNotFoundError';
  }
}
