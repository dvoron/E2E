import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');
const authDir = path.dirname(authFile);


test.describe('Authentication', () => {
    test('Register or Login', async ({ page }) => {
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
            username: 'testuser_e2e',
            email: 'testuser_e2e@example.com',
            password: 'Password123!'
        };

        await test.step('Navigate to register page', async () => {
            await page.goto('/');
            await page.goto('/home/register');
        });

        await test.step('Attempt registration', async () => {
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
            await test.step('Handle successful registration', async () => {
                await page.context().storageState({ path: authFile });
            });
        } else {
            await test.step('Handle existing account / Login fallback', async () => {
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
});
