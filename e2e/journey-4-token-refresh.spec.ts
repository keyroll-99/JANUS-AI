import { test, expect, LoginPage } from './fixtures';

test.describe('Journey 4: Token Refresh', () => {
  test('user can login and access protected routes', async ({ page }) => {
    const loginPage = new LoginPage(page);

    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    await test.step('Register user via API', async () => {
      const response = await page.request.post('http://localhost:5000/api/v1/auth/register', {
        data: { email: testEmail, password: testPassword },
      });
      expect(response.ok()).toBeTruthy();
    });

    await test.step('Login with credentials', async () => {
      await loginPage.goto();
      await loginPage.login(testEmail, testPassword);
      await loginPage.waitForNavigation();
    });

    await test.step('Verify access to dashboard', async () => {
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      expect(currentUrl).toContain('/dashboard');
    });

    await test.step('Verify access to transactions', async () => {
      await page.goto('/transactions');
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      expect(currentUrl).toContain('/transactions');
    });
  });
});
