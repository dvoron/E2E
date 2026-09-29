import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');
const authDir = path.dirname(authFile);

test.describe('Authentication', () => {
    test('Register or Login', async ({ page }) => {
        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        const testUser = {
            username: 'testuser_e2e',
            email: 'testuser_e2e@example.com',
            password: 'Password123!'
        };

        // Navigate to home page
        await page.goto('/');

        // Navigate to register page
        await page.goto('/home/register');

        // Try to create an account
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

        const currentUrl = page.url();

        if (currentUrl.endsWith('/home')) {
            // Registration successful
            console.log('Registration successful.');
            await page.context().storageState({ path: authFile });
        } else {
            // Registration failed, check if it's due to existing account
            const errorText = await page.locator('.text-red-600').first().textContent().catch(() => '');
            if (errorText?.includes('taken') || errorText?.includes('already')) {
                console.log('Account exists. Navigating to login...');
                await page.goto('/home/login');

                await page.fill('input[placeholder="Enter username or email"]', testUser.email);
                await page.fill('input[placeholder="Enter password"]', testUser.password);
                await page.click('button:has-text("Sign In")');

                await page.waitForURL('**/home', { timeout: 5000 });
                console.log('Login successful.');
                await page.context().storageState({ path: authFile });
                const cookies = await page.context().cookies();

                console.log(
                    cookies.map(c => ({
                        name: c.name,
                        value: c.value.substring(0, 20) + '...',
                        domain: c.domain,
                        path: c.path,
                        secure: c.secure,
                        httpOnly: c.httpOnly,
                        sameSite: c.sameSite,
                    }))
                );
            } else {
                throw new Error('Registration failed for unknown reason: ' + errorText);
            }
        }
    });
});
