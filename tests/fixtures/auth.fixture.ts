import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

type TestFixtures = {
  testUser: { username: string; email: string; password: string };
};

export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    await use({
      username: `user_${unique}`,
      email: `user_${unique}@example.com`,
      password: 'Password123!',
    });
  },

  storageState: async ({ playwright, testUser }, use, testInfo) => {
    const unique = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const fileName = path.resolve(__dirname, `../../playwright/.auth/user-${testInfo.workerIndex}-${unique}.json`);
    const authDir = path.dirname(fileName);

    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    const browserType = playwright[testInfo.project.name as 'chromium' | 'firefox' | 'webkit'] || playwright.chromium;
    const browser = await browserType.launch();
    const context = await browser.newContext({
      baseURL: process.env.BASE_URL || 'http://localhost:5173',
    });

    await context.route('**/api/**', async (route) => {
      const response = await route.fetch();
      const headers = response.headers();
      if (headers['set-cookie']) {
        headers['set-cookie'] = headers['set-cookie'].replace(/;\s*secure/gi, '');
      }
      await route.fulfill({ response, headers });
    });

    const page = await context.newPage();

    // 1. Land on the page
    await page.goto('/');

    // 1.1 Verify user is not logged in by checking if login/register UI buttons are present
    await expect(page.getByRole('link', { name: 'Login', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register', exact: true })).toBeVisible();

    // Head to register page using the UI
    await page.getByRole('link', { name: 'Register', exact: true }).click();

    // Register the account
    await page.locator('#register-username').fill(testUser.username);
    await page.locator('#register-email').fill(testUser.email);
    await page.locator('#register-password').fill(testUser.password);
    await page.getByRole('button', { name: 'Create Account' }).click();

    // Check if user is logged in after registering; if not, head to login page via UI and log in
    let isLoggedIn = false;
    try {
      await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
      isLoggedIn = true;
    } catch {
      isLoggedIn = false;
    }

    if (!isLoggedIn) {
      await page.getByRole('link', { name: 'Login', exact: true }).click();
      await page.locator('#login-username').fill(testUser.email);
      await page.locator('#login-password').fill(testUser.password);
      await page.getByRole('button', { name: 'Sign In' }).click();
      await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 10000 });
    }

    await context.storageState({ path: fileName });
    await browser.close();

    // Ensure secure flag is false in storageState so WebKit allows http://localhost cookies
    if (fs.existsSync(fileName)) {
      try {
        const stateStr = fs.readFileSync(fileName, 'utf-8');
        const stateObj = JSON.parse(stateStr);
        if (Array.isArray(stateObj.cookies)) {
          stateObj.cookies.forEach((c: any) => {
            if (c.secure) c.secure = false;
          });
          fs.writeFileSync(fileName, JSON.stringify(stateObj, null, 2));
        }
      } catch {
        // ignore parse/write errors
      }
    }

    await use(fileName);

    if (fs.existsSync(fileName)) {
      try {
        fs.unlinkSync(fileName);
      } catch {
        // ignore cleanup errors
      }
    }
  },

  context: async ({ context }, use) => {
    await context.route('**/api/**', async (route) => {
      const response = await route.fetch();
      const headers = response.headers();
      if (headers['set-cookie']) {
        headers['set-cookie'] = headers['set-cookie'].replace(/;\s*secure/gi, '');
      }
      await route.fulfill({ response, headers });
    });
    await use(context);
  },
});

export { expect } from '@playwright/test';
