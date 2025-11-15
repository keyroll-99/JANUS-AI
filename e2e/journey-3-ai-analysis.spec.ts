import { test, expect } from './fixtures';

test.describe('Journey 3: AI Analysis', () => {
  test('authenticated user can view analysis page', async ({ authenticatedPage, apiUrl }) => {
    await test.step('Navigate to analysis page', async () => {
      await authenticatedPage.goto('/analysis');
      await authenticatedPage.waitForLoadState('networkidle');
      
      const heading = authenticatedPage.locator('h1, h2').filter({ hasText: 'Historia analiz' });
      await expect(heading).toBeVisible();
    });
  });

  test('unauthenticated user cannot access analysis', async ({ page }) => {
    await test.step('Try to access analysis without auth', async () => {
      await page.goto('/analysis');
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
    });
  });
});
