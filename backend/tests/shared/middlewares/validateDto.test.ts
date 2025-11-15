import { Request, Response, NextFunction } from 'express';
import { validateDto } from '../../../src/shared/middlewares/validateDto';
import { z } from 'zod';

/**
 * TC-RATE-*: Zod schema validation tests
 * Testing validateDto middleware as per test-plan.md
 */
describe('validateDto Middleware - Zod Validation', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  describe('Valid schema validation', () => {
    it('should pass validation for valid data', () => {
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(8),
      });

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should transform data types correctly', () => {
      const schema = z.object({
        quantity: z.number(),
        price: z.number(),
      });

      mockRequest.body = {
        quantity: 10,
        price: 150.5,
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRequest.body.quantity).toBe(10);
      expect(mockRequest.body.price).toBe(150.5);
    });
  });

  describe('Invalid data validation', () => {
    it('should return 400 for invalid email format', () => {
      const schema = z.object({
        email: z.string().email(),
      });

      mockRequest.body = {
        email: 'invalid-email',
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: expect.stringContaining('email'),
          }),
        ]),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 400 for missing required fields', () => {
      const schema = z.object({
        email: z.string(),
        password: z.string(),
      });

      mockRequest.body = {
        email: 'test@example.com',
        // password missing
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation failed',
        })
      );
    });

    it('should return 400 for wrong data types', () => {
      const schema = z.object({
        quantity: z.number(),
        price: z.number(),
      });

      mockRequest.body = {
        quantity: 'not-a-number',
        price: 'also-not-a-number',
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Boundary testing', () => {
    it('should validate minimum string length', () => {
      const schema = z.object({
        password: z.string().min(8),
      });

      mockRequest.body = {
        password: 'short',
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.arrayContaining([
            expect.objectContaining({
              field: 'password',
            }),
          ]),
        })
      );
    });

    it('should validate maximum string length', () => {
      const schema = z.object({
        name: z.string().max(50),
      });

      mockRequest.body = {
        name: 'a'.repeat(100), // Too long
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should validate number ranges', () => {
      const schema = z.object({
        age: z.number().min(18).max(100),
      });

      mockRequest.body = {
        age: 15, // Too young
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should validate positive numbers', () => {
      const schema = z.object({
        quantity: z.number().positive(),
      });

      mockRequest.body = {
        quantity: -5,
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('Transaction-specific validation', () => {
    it('should validate transaction type enum', () => {
      const schema = z.object({
        transactionTypeId: z.number().int().min(1).max(6),
      });

      mockRequest.body = {
        transactionTypeId: 10, // Invalid
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should validate account type enum', () => {
      const schema = z.object({
        accountTypeId: z.number().int().min(1).max(3),
      });

      mockRequest.body = {
        accountTypeId: 5, // Invalid
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should validate date format', () => {
      const schema = z.object({
        transactionDate: z.string().datetime(),
      });

      mockRequest.body = {
        transactionDate: 'invalid-date',
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should accept valid ISO date', () => {
      const schema = z.object({
        transactionDate: z.string().datetime(),
      });

      mockRequest.body = {
        transactionDate: '2024-01-15T10:30:00Z',
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Optional fields', () => {
    it('should accept optional fields when present', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().optional(),
      });

      mockRequest.body = {
        email: 'test@example.com',
        name: 'John Doe',
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should accept optional fields when absent', () => {
      const schema = z.object({
        email: z.string().email(),
        name: z.string().optional(),
      });

      mockRequest.body = {
        email: 'test@example.com',
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Nested objects', () => {
    it('should validate nested object structures', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
          profile: z.object({
            age: z.number().min(18),
          }),
        }),
      });

      mockRequest.body = {
        user: {
          email: 'test@example.com',
          profile: {
            age: 25,
          },
        },
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return errors for nested validation failures', () => {
      const schema = z.object({
        user: z.object({
          email: z.string().email(),
          profile: z.object({
            age: z.number().min(18),
          }),
        }),
      });

      mockRequest.body = {
        user: {
          email: 'invalid-email',
          profile: {
            age: 15,
          },
        },
      };

      const middleware = validateDto(schema);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          errors: expect.any(Array),
        })
      );
    });
  });
});
