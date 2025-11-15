import { test as base, expect as baseExpect, Page } from '@playwright/test';

interface AuthFixtures {
  authenticatedPage: Page;
  apiUrl: string;
}

export const test = base.extend<AuthFixtures>({
  apiUrl: async ({}, use) => {
    const apiUrl = 'http://localhost:5000';
    await use(apiUrl);
  },

  authenticatedPage: async ({ page, apiUrl }, use) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    const registerResponse = await page.request.post(`${apiUrl}/api/v1/auth/register`, {
      data: { email: testEmail, password: testPassword },
    });

    if (!registerResponse.ok()) {
      throw new Error(`Failed to register: ${registerResponse.statusText()}`);
    }

    const registerData = await registerResponse.json();
    
    // Set refresh token cookie
    await page.context().addCookies([{
      name: 'refreshToken',
      value: registerData.refreshToken || 'mock-refresh-token',
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    }]);

    // Navigate to app and set localStorage for AuthContext
    await page.goto('/');
    await page.evaluate(
      ({ accessToken, user }) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('user', JSON.stringify(user));
      },
      { accessToken: registerData.accessToken, user: registerData.user }
    );

    // Navigate to dashboard - now authenticated
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

export const expect = baseExpect;

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('input#email', email);
    await this.page.fill('input#password', password);
    await this.page.click('button[type="submit"]');
  }

  async waitForNavigation() {
    await this.page.waitForURL((url) => url.pathname !== '/login', { timeout: 10000 });
  }
}

export class RegisterPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/register');
  }

  async register(email: string, password: string) {
    await this.page.fill('input#email', email);
    await this.page.fill('input#password', password);
    await this.page.fill('input#confirmPassword', password);
    await this.page.click('button[type="submit"]');
  }

  async waitForNavigation() {
    await this.page.waitForURL((url) => url.pathname !== '/register', { timeout: 10000 });
  }
}

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/dashboard');
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }
}

export class TransactionsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/transactions');
  }

  async getTransactionCount() {
    const rows = await this.page.locator('table tbody tr:not(:has-text("Brak"))').count();
    return rows;
  }
}
