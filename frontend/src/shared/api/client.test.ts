// Mock config to avoid import.meta.env issues in Jest
jest.mock('../config/config', () => ({
  config: {
    apiUrl: 'http://localhost:5000/api',
    aiProvider: 'claude',
  },
}));

import { apiClient, api } from './client';

/**
 * Frontend Unit Tests - API Client
 * Testing API client with 401 handling as per test-plan.md
 */
describe('API Client - 401 Handling', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();

    // Mock fetch
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('Token injection', () => {
    it('should include Authorization header when token exists', async () => {
      localStorage.setItem('accessToken', 'test-token-123');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' }),
      });

      await apiClient('/test-endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer test-token-123');
    });

    it('should not include Authorization header when token is missing', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' }),
      });

      await apiClient('/test-endpoint');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('Authorization')).toBeNull();
    });

    it('should set Content-Type to application/json by default', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' }),
      });

      await apiClient('/test-endpoint');

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('Content-Type')).toBe('application/json');
    });
  });

  describe('401 Unauthorized handling', () => {
    it('should clear tokens and throw error on 401 response', async () => {
      localStorage.setItem('accessToken', 'expired-token');
      localStorage.setItem('user', JSON.stringify({ id: 'user-123' }));

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      await expect(apiClient('/protected-route')).rejects.toThrow('Unauthorized');

      // Verify tokens were cleared
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });

    it('should handle 401 on GET request', async () => {
      localStorage.setItem('accessToken', 'expired-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(api.get('/transactions')).rejects.toThrow('Unauthorized');
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    it('should handle 401 on POST request', async () => {
      localStorage.setItem('accessToken', 'expired-token');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(
        api.post('/transactions', { ticker: 'AAPL' })
      ).rejects.toThrow('Unauthorized');
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should throw error with message from response', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Validation failed' }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Validation failed');
    });

    it('should throw generic error when response has no message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      await expect(apiClient('/test')).rejects.toThrow('HTTP Error: 500');
    });

    it('should handle network errors', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient('/test')).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(apiClient('/test')).rejects.toThrow('HTTP Error: 500');
    });
  });

  describe('Success responses', () => {
    it('should return parsed JSON on success', async () => {
      const mockData = { id: 1, name: 'Test' };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await apiClient('/test');
      expect(result).toEqual(mockData);
    });

    it('should handle 204 No Content responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await apiClient('/delete-resource');
      expect(result).toEqual({});
    });

    it('should handle empty response body', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => null,
      });

      const result = await apiClient('/test');
      expect(result).toBeNull();
    });
  });

  describe('HTTP method convenience functions', () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
    });

    it('should make GET request', async () => {
      await api.get('/endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/endpoint'),
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should make POST request with body', async () => {
      const body = { name: 'Test' };
      await api.post('/endpoint', body);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].body).toBe(JSON.stringify(body));
    });

    it('should make PUT request with body', async () => {
      const body = { name: 'Updated' };
      await api.put('/endpoint', body);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('PUT');
      expect(callArgs[1].body).toBe(JSON.stringify(body));
    });

    it('should make PATCH request with body', async () => {
      const body = { status: 'active' };
      await api.patch('/endpoint', body);

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      expect(callArgs[1].method).toBe('PATCH');
      expect(callArgs[1].body).toBe(JSON.stringify(body));
    });

    it('should make DELETE request', async () => {
      await api.delete('/endpoint');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/endpoint'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('FormData handling', () => {
    it('should not set Content-Type for FormData', async () => {
      const formData = new FormData();
      formData.append('file', new Blob(['test']), 'test.txt');

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });

      await apiClient('/upload', {
        method: 'POST',
        body: formData,
      });

      const callArgs = (global.fetch as jest.Mock).mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      // Content-Type should not be set for FormData (browser sets it with boundary)
      expect(headers.get('Content-Type')).toBeNull();
    });
  });
});
