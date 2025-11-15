import { Request, Response, NextFunction } from 'express';
import { requireAuth, AuthenticatedRequest } from '../../../src/shared/middlewares/requireAuth';
import { supabase } from '../../../src/shared/config/supabase';

// Mock Supabase
jest.mock('../../../src/shared/config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
  createUserSupabaseClient: jest.fn(),
}));

/**
 * TC-AUTH-004, TC-AUTH-005: JWT validation tests
 * Testing requireAuth middleware as per test-plan.md
 */
describe('requireAuth Middleware - JWT Validation', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('TC-AUTH-005: Access without token', () => {
    it('should return 401 when Authorization header is missing', async () => {
      mockRequest.headers = {};

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Access token is required'),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'InvalidToken abc123',
      };

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Access token is required'),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when Bearer token is empty', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ',
      };

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('TC-AUTH-004: Valid token handling', () => {
    it('should attach user to request when token is valid', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'authenticated',
      };

      mockRequest.headers = {
        authorization: 'Bearer valid-token-123',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: mockUser,
        },
        error: null,
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(supabase.auth.getUser).toHaveBeenCalledWith('valid-token-123');
      expect(mockNext).toHaveBeenCalled();
      expect((mockRequest as AuthenticatedRequest).user).toEqual({
        id: 'user-123',
        email: 'test@example.com',
        role: 'authenticated',
      });
      expect((mockRequest as AuthenticatedRequest).accessToken).toBe('valid-token-123');
    });

    it('should return 401 when token is expired', async () => {
      mockRequest.headers = {
        authorization: 'Bearer expired-token',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Token expired',
          status: 401,
        },
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Invalid or expired'),
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when token is malformed', async () => {
      mockRequest.headers = {
        authorization: 'Bearer malformed.token.here',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: {
          message: 'Invalid token',
          status: 401,
        },
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle database connection errors gracefully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (supabase.auth.getUser as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Middleware calls next(error) in catch block to pass to global error handler
      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should handle user without email', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: null, // No email
            role: 'authenticated',
          },
        },
        error: null,
      });

      await requireAuth(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );

      // Should still proceed if user is valid
      expect(mockNext).toHaveBeenCalled();
    });
  });
});
