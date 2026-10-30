import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

type WorkerFixtures = {
  workerStorageState: string;
  testUser: { username: string; email: string; password: string };
};

export const test = base.extend<{}, WorkerFixtures>({
  testUser: [
    async ({}, use, workerInfo) => {
      const id = workerInfo.workerIndex;
      const timestamp = Date.now();
      await use({
        username: `e2e_user_w${id}_${timestamp}`,
        email: `e2e_user_w${id}_${timestamp}@example.com`,
        password: 'Password123!',
      });
    },
    { scope: 'worker' },
  ],

  workerStorageState: [
    async ({ playwright, testUser }, use, workerInfo) => {
      const id = workerInfo.workerIndex;
      const fileName = path.resolve(__dirname, `../../playwright/.auth/user-worker-${id}.json`);
      const authDir = path.dirname(fileName);

      if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
      }

      if (!fs.existsSync(fileName)) {
        const browser = await playwright.chromium.launch();
        const context = await browser.newContext({
          baseURL: process.env.BASE_URL || 'http://localhost:5173',
        });
        const page = await context.newPage();

        // 1. Land on the page
        await page.goto('/');

        // 1.1 Verify user is not logged in by checking if login/register UI buttons are present
        await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Register' })).toBeVisible();

        // Head to register page using the UI
        await page.getByRole('link', { name: 'Register' }).click();

        // Register the account
        await page.locator('#register-username').fill(testUser.username);
        await page.locator('#register-email').fill(testUser.email);
        await page.locator('#register-password').fill(testUser.password);
        await page.getByRole('button', { name: 'Create Account' }).click();

        // Check if user is logged in after registering; if not, head to login page via UI and log in
        let isLoggedIn = false;
        try {
          await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible({ timeout: 5000 });
          isLoggedIn = true;
        } catch {
          isLoggedIn = false;
        }

        if (!isLoggedIn) {
          await page.getByRole('link', { name: 'Login' }).click();
          await page.locator('#login-username').fill(testUser.email);
          await page.locator('#login-password').fill(testUser.password);
          await page.getByRole('button', { name: 'Sign In' }).click();
          await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
        }

        await context.storageState({ path: fileName });
        await browser.close();
      }

      await use(fileName);
    },
    { scope: 'worker' },
  ],

  storageState: async ({ workerStorageState }, use) => {
    await use(workerStorageState);
  },
});

export { expect } from '@playwright/test';
