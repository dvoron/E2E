import { test as setup, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');
const authDir = path.dirname(authFile);

setup('authenticate', async ({ page }) => {
    // Intercept and log browser console errors
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error(`Browser console error: ${msg.text()}`);
        }
    });

    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    const testUser = {
        username: `testuser_${Date.now()}`,
        email: `testuser_${Date.now()}@example.com`,
        password: 'Password123!'
    };

    // Save user credentials so teardown can use them
    fs.writeFileSync(path.resolve(__dirname, '../playwright/.auth/credentials.json'), JSON.stringify(testUser));

    await setup.step('Navigate to register page', async () => {
        await page.goto('/');
        await page.goto('/home/register');
    });

    await setup.step('Attempt registration', async () => {
        await page.fill('input[placeholder="Username"]', testUser.username);
        await page.fill('input[placeholder="Email"]', testUser.email);
        await page.fill('input[placeholder="Password"]', testUser.password);
        await page.click('button:has-text("Create Account")');

        // Wait for either success (redirect to home) or error message
        await Promise.race([
            page.waitForURL('**/home', { timeout: 5000 }),
            page.waitForSelector('text="Email is already taken"', { timeout: 5000 }).catch(() => null),
            page.waitForSelector('text="Username is already taken"', { timeout: 5000 }).catch(() => null),
            page.waitForSelector('.text-red-600', { timeout: 5000 }).catch(() => null)
        ]).catch(() => null);
    });

    const currentUrl = page.url();

    if (currentUrl.endsWith('/home')) {
        await setup.step('Handle successful registration', async () => {
            await page.context().storageState({ path: authFile });
        });
    } else {
        await setup.step('Handle existing account / Login fallback', async () => {
            const errorText = await page.locator('.text-red-600').first().textContent().catch(() => '');
            if (errorText?.includes('taken') || errorText?.includes('already')) {
                await page.goto('/home/login');

                await page.fill('input[placeholder="Enter username or email"]', testUser.email);
                await page.fill('input[placeholder="Enter password"]', testUser.password);
                await page.click('button:has-text("Sign In")');

                await page.waitForURL('**/home', { timeout: 5000 });
                await page.context().storageState({ path: authFile });
            } else {
                throw new Error('Registration failed for unknown reason: ' + errorText);
            }
        });
    }
});
