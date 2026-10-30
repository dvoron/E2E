import { test as base, expect, type Route } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

type WorkerFixtures = {
    workerStorageState: string;
    workerAccessToken: string;
};

export const test = base.extend<any, WorkerFixtures>({
    workerStorageState: [async ({ browser }, use, workerInfo) => {
        const id = workerInfo.workerIndex;
        const fileName = path.resolve(__dirname, `../../playwright/.auth/user-${id}.json`);
        const authDir = path.dirname(fileName);

        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        const baseURL = workerInfo.project.use.baseURL || process.env.BASE_URL || 'http://localhost:5173';
        const page = await browser.newPage({ baseURL });
        
        const testUser = {
            username: `testuser_${Date.now()}_${id}`,
            email: `testuser_${Date.now()}_${id}@example.com`,
            password: 'Password123!'
        };

        await page.goto('/home/register');
        await page.getByPlaceholder('Username').fill(testUser.username);
        await page.getByPlaceholder('Email').fill(testUser.email);
        await page.getByPlaceholder('Password').fill(testUser.password);
        await page.getByRole('button', { name: 'Create Account' }).click();

        await page.waitForURL('**/home');
        await expect(page.getByText('Welcome back!')).toBeVisible();
        await expect(page.getByText('You are logged in.')).toBeVisible();
        
        await page.context().storageState({ path: fileName });
        await page.close();
        
        await use(fileName);

        // Teardown
        const teardownPage = await browser.newPage({ baseURL });
        await teardownPage.goto('/home/login');
        await teardownPage.getByPlaceholder('Enter username or email').fill(testUser.email);
        await teardownPage.getByPlaceholder('Enter password').fill(testUser.password);
        await teardownPage.getByRole('button', { name: 'Sign In' }).click();
        
        await teardownPage.waitForURL('**/home');
        await teardownPage.getByRole('link', { name: 'Profile' }).click();
        await expect(teardownPage.locator('h3:has-text("User Profile")')).toBeVisible();

        await teardownPage.getByRole('button', { name: 'Edit Profile' }).click();
        await teardownPage.getByRole('button', { name: 'Delete Account' }).click();
        await teardownPage.locator('input[id="deletePassword"]').fill(testUser.password);
        await teardownPage.getByRole('button', { name: 'Continue' }).click();
        await teardownPage.getByRole('button', { name: 'Yes, Delete' }).click();
        await teardownPage.waitForURL('**/login');

        await teardownPage.close();

        if (fs.existsSync(fileName)) {
            fs.unlinkSync(fileName);
        }
    }, { scope: 'worker' }],

    workerAccessToken: [async ({ workerStorageState, playwright }, use) => {
        const authData = JSON.parse(fs.readFileSync(workerStorageState, 'utf-8'));
        const refreshTokenCookie = authData.cookies.find((c: any) => c.name === 'refreshToken');
        let cookieStr = '';
        if (refreshTokenCookie) {
            cookieStr = `${refreshTokenCookie.name}=${refreshTokenCookie.value}`;
        }
        
        const apiUrl = process.env.API_URL || 'http://localhost:8080';
        const requestContext = await playwright.request.newContext();
        const response = await requestContext.post(`${apiUrl}/api/auth/refresh`, {
            headers: { 'Cookie': cookieStr }
        });
        
        let accessToken = '';
        if (response.ok()) {
            const data = await response.json();
            accessToken = data.accessToken;
        } else {
            throw new Error(`Worker failed to get access token: ${response.status} ${await response.text()}`);
        }
        
        await requestContext.dispose();
        await use(accessToken);
    }, { scope: 'worker' }],

    storageState: async ({ workerStorageState }, use) => {
        await use(workerStorageState);
    },
    
    page: async ({ page, workerAccessToken }, use) => {
        await page.route('**/api/auth/refresh', async (route: Route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ accessToken: workerAccessToken })
            });
        });
        await use(page);
    }
});

export { expect } from '@playwright/test';
