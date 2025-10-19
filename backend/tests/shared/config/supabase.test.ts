import { supabase, supabaseAdmin } from '../../../src/shared/config/supabase';

describe('Supabase Configuration', () => {
  describe('Regular Client', () => {
    it('should be defined', () => {
      expect(supabase).toBeDefined();
    });

    it('should have required methods', () => {
      expect(supabase.from).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.storage).toBeDefined();
    });
  });

  describe('Admin Client', () => {
    it('should be defined', () => {
      expect(supabaseAdmin).toBeDefined();
    });

    it('should have required methods', () => {
      expect(supabaseAdmin.from).toBeDefined();
      expect(supabaseAdmin.auth).toBeDefined();
      expect(supabaseAdmin.storage).toBeDefined();
    });

    it('should be a different instance than regular client', () => {
      expect(supabaseAdmin).not.toBe(supabase);
    });
  });
});
