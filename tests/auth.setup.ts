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
        await page.getByPlaceholder('Username').fill(testUser.username);
        await page.getByPlaceholder('Email').fill(testUser.email);
        await page.getByPlaceholder('Password').fill(testUser.password);
        await page.getByRole('button', { name: 'Create Account' }).click();

        // Wait for either success (redirect to home) or error message
        const errorLocator = page.locator('.text-red-600');
        
        await Promise.race([
            page.waitForURL('**/home', { timeout: 5000 }),
            errorLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null)
        ]).catch(() => null);
    });

    const currentUrl = page.url();

    if (currentUrl.endsWith('/home')) {
        await setup.step('Handle successful registration', async () => {
            // Verify we actually landed on home and a logged-in element is visible
            await expect(page.getByText('Welcome back!')).toBeVisible();
            await expect(page.getByText('You are logged in.')).toBeVisible();
            await page.context().storageState({ path: authFile });
        });
    } else {
        await setup.step('Handle existing account / Login fallback', async () => {
            const errorText = await page.locator('.text-red-600').first().textContent().catch(() => '');
            if (errorText?.includes('taken') || errorText?.includes('already')) {
                await page.goto('/home/login');

                await page.getByPlaceholder('Enter username or email').fill(testUser.email);
                await page.getByPlaceholder('Enter password').fill(testUser.password);
                await page.getByRole('button', { name: 'Sign In' }).click();

                await page.waitForURL('**/home', { timeout: 5000 });
                await expect(page.getByText('Welcome back!')).toBeVisible();
                await expect(page.getByText('You are logged in.')).toBeVisible();
                await page.context().storageState({ path: authFile });
            } else {
                throw new Error('Registration failed for unknown reason: ' + errorText);
            }
        });
    }
});
