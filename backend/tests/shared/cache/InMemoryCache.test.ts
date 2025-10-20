import { InMemoryCache } from '../../../src/shared/cache/InMemoryCache';

describe('InMemoryCache', () => {
  let cache: InMemoryCache<string>;

  beforeEach(() => {
    cache = new InMemoryCache<string>(1000); // 1 second TTL for tests
  });

  afterEach(() => {
    cache.clear();
  });

  describe('set and get', () => {
    it('should store and retrieve a value', () => {
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for non-existent key', () => {
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should overwrite existing value', () => {
      cache.set('key1', 'value1');
      cache.set('key1', 'value2');
      expect(cache.get('key1')).toBe('value2');
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired entries', async () => {
      cache.set('key1', 'value1', 100); // 100ms TTL

      // Should be available immediately
      expect(cache.get('key1')).toBe('value1');

      // Wait for expiration
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Should be expired now
      expect(cache.get('key1')).toBeNull();
    });

    it('should use custom TTL over default', async () => {
      const shortCache = new InMemoryCache<string>(5000); // 5 seconds default
      shortCache.set('key1', 'value1', 100); // Override with 100ms

      await new Promise((resolve) => setTimeout(resolve, 150));

      expect(shortCache.get('key1')).toBeNull();
      shortCache.clear();
    });

    it('should use default TTL when not specified', async () => {
      cache.set('key1', 'value1'); // Use default 1000ms

      // Should be available after 500ms
      await new Promise((resolve) => setTimeout(resolve, 500));
      expect(cache.get('key1')).toBe('value1');

      // Should be expired after 1100ms total
      await new Promise((resolve) => setTimeout(resolve, 700));
      expect(cache.get('key1')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing non-expired key', () => {
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', async () => {
      cache.set('key1', 'value1', 100);
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(cache.has('key1')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.get('key1')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      expect(cache.delete('nonexistent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all entries', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.set('key3', 'value3');

      cache.clear();

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBeNull();
      expect(cache.get('key3')).toBeNull();
      expect(cache.size()).toBe(0);
    });
  });

  describe('size', () => {
    it('should return correct count of entries', () => {
      expect(cache.size()).toBe(0);

      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);

      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);

      cache.delete('key1');
      expect(cache.size()).toBe(1);
    });

    it('should include expired entries until cleanup', async () => {
      cache.set('key1', 'value1', 100);
      expect(cache.size()).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 150));

      // Size still shows 1 until cleanup or get
      expect(cache.size()).toBe(1);

      // Accessing expired key removes it
      cache.get('key1');
      expect(cache.size()).toBe(0);
    });
  });

  describe('cleanup', () => {
    it('should remove all expired entries', async () => {
      cache.set('key1', 'value1', 100); // Expires quickly
      cache.set('key2', 'value2', 5000); // Stays valid
      cache.set('key3', 'value3', 100); // Expires quickly

      await new Promise((resolve) => setTimeout(resolve, 150));

      const removed = cache.cleanup();

      expect(removed).toBe(2); // key1 and key3
      expect(cache.get('key2')).toBe('value2');
      expect(cache.size()).toBe(1);
    });

    it('should return 0 when no entries expired', () => {
      cache.set('key1', 'value1', 5000);
      cache.set('key2', 'value2', 5000);

      const removed = cache.cleanup();

      expect(removed).toBe(0);
      expect(cache.size()).toBe(2);
    });

    it('should handle empty cache', () => {
      const removed = cache.cleanup();
      expect(removed).toBe(0);
    });
  });

  describe('complex types', () => {
    it('should work with objects', () => {
      interface User {
        id: string;
        name: string;
      }

      const userCache = new InMemoryCache<User>(1000);
      const user: User = { id: '123', name: 'John' };

      userCache.set('user1', user);
      expect(userCache.get('user1')).toEqual(user);

      userCache.clear();
    });

    it('should work with arrays', () => {
      const arrayCache = new InMemoryCache<number[]>(1000);
      const numbers = [1, 2, 3, 4, 5];

      arrayCache.set('numbers', numbers);
      expect(arrayCache.get('numbers')).toEqual(numbers);

      arrayCache.clear();
    });
  });
});
