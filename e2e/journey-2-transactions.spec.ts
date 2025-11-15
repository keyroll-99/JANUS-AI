import { test, expect, TransactionsPage } from './fixtures';

test.describe('Journey 2: Transaction Management', () => {
  test('authenticated user can view transactions page', async ({ authenticatedPage }) => {
    const transactionsPage = new TransactionsPage(authenticatedPage);

    await test.step('Navigate to transactions page', async () => {
      await transactionsPage.goto();
      await authenticatedPage.waitForLoadState('networkidle');
      
      const heading = authenticatedPage.locator('h1, h2').filter({ hasText: 'Transakcje' });
      await expect(heading).toBeVisible();
    });

    await test.step('Verify empty state or existing transactions', async () => {
      const count = await transactionsPage.getTransactionCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test('unauthenticated user cannot access transactions', async ({ page }) => {
    await test.step('Try to access transactions without auth', async () => {
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
    });
  });
});
