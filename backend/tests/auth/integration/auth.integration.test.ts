import request from 'supertest';
import app from '../../../src/app';
import { supabase } from '../../../src/shared/config/supabase';

// Mock Supabase
jest.mock('../../../src/shared/config/supabase');

describe('Auth Endpoints Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Wait a bit to allow rate limiter to reset
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'newuser@example.com',
        role: 'authenticated',
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
      };

      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('newuser@example.com');
      
      // Check if refresh token cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('refreshToken');
      expect(cookies[0]).toContain('HttpOnly');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.errors[0].field).toBe('email');
    });

    it('should return 400 for short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'short',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Validation failed');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'authenticated',
      };

      const mockSession = {
        access_token: 'access-token-123',
        refresh_token: 'refresh-token-123',
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      
      // Check cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies[0]).toContain('refreshToken');
    });

    it('should return 401 for invalid credentials', async () => {
      const mockError = {
        message: 'Invalid login credentials',
        name: 'AuthApiError',
        status: 400,
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'user@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      const mockSession = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', ['refreshToken=old-refresh-token']);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken', 'new-access-token');
      
      // Check if new refresh token cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies[0]).toContain('refreshToken');
    });

    it('should return 401 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Refresh token not found');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout user and clear cookie', async () => {
      (supabase.auth.setSession as jest.Mock).mockResolvedValue({
        data: {},
        error: null,
      });

      (supabase.auth.signOut as jest.Mock).mockResolvedValue({
        error: null,
      });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Cookie', ['refreshToken=some-token']);

      expect(response.status).toBe(204);
      
      // Check if cookie is cleared
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        expect(cookies[0]).toContain('refreshToken=;');
      }
    });

    it('should return 204 even without refresh token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expect(response.status).toBe(204);
    });
  });

  describe('GET /api/v1/profile/me (Protected Route)', () => {
    it('should return user profile with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        role: 'authenticated',
      };

      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', 'Bearer valid-access-token');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        role: 'authenticated',
      });
    });

    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/profile/me');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Access token is required');
    });

    it('should return 401 with invalid token', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const response = await request(app)
        .get('/api/v1/profile/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid or expired access token');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});
