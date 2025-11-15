import { test, expect, RegisterPage, DashboardPage } from './fixtures';

test.describe('Journey 1: New User Onboarding', () => {
  test('should register new user and view empty dashboard', async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const dashboardPage = new DashboardPage(page);

    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';

    await test.step('Register new user', async () => {
      await registerPage.goto();
      await registerPage.register(testEmail, testPassword);
      await registerPage.waitForNavigation();
    });

    await test.step('Verify redirect to onboarding or dashboard', async () => {
      await page.waitForLoadState('networkidle');
      const currentUrl = page.url();
      expect(currentUrl).toMatch(/\/(onboarding|dashboard)/);
    });

    await test.step('Navigate to dashboard', async () => {
      if (!page.url().includes('/dashboard')) {
        await dashboardPage.goto();
      }
      await dashboardPage.waitForLoad();
      
      const heading = page.locator('h1, h2').filter({ hasText: /dashboard/i });
      await expect(heading).toBeVisible();
    });
  });

  test('should not allow registration with invalid email', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await test.step('Try to register with invalid email', async () => {
      await registerPage.goto();
      
      await page.fill('input[placeholder*="email"]', 'invalid-email');
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.first().fill('TestPassword123!');
      await passwordInputs.last().fill('TestPassword123!');
      await page.click('button[type="submit"]');
      
      const errorMessage = page.locator('.ant-form-item-explain-error');
      await expect(errorMessage).toBeVisible();
    });
  });

  test('should not allow registration with weak password', async ({ page }) => {
    const registerPage = new RegisterPage(page);

    await test.step('Try to register with weak password', async () => {
      await registerPage.goto();
      
      const testEmail = `test-${Date.now()}@example.com`;
      await page.fill('input[placeholder*="email"]', testEmail);
      const passwordInputs = page.locator('input[type="password"]');
      await passwordInputs.first().fill('123');
      await passwordInputs.last().fill('123');
      await page.click('button[type="submit"]');
      
      const errorMessage = page.locator('.ant-form-item-explain-error, .ant-alert-error');
      await expect(errorMessage).toBeVisible();
    });
  });
});
