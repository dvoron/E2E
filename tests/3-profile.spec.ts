import { test, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

// Use the storage state saved by the authentication test (which contains localStorage and cookies)
test.use({ storageState: authFile });

test.describe('Profile', () => {
    test.beforeEach(async ({ page, request }) => {
        // Since Playwright's `request` object doesn't automatically send cookies from the `storageState`,
        // we need to manually read the cookie from the saved state and pass it to the backend.
        const fs = require('fs');
        const path = require('path');
        const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

        let cookieStr = '';
        if (fs.existsSync(authFile)) {
            const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
            const refreshTokenCookie = authData.cookies.find((c: any) => c.name === 'refreshToken');
            if (refreshTokenCookie) {
                cookieStr = `${refreshTokenCookie.name}=${refreshTokenCookie.value}`;
            }
        }

        // Obtain an access token for the E2E tests using the backend refresh method
        // Note: Using http://localhost:8080 directly to bypass Vite's proxy which might drop cookies
        const response = await request.post('http://localhost:8080/api/auth/refresh', {
            headers: {
                'Cookie': cookieStr
            }
        });

        let data: any = {};
        if (response.ok()) {
            data = await response.json();

            if (data.refreshToken && fs.existsSync(authFile)) {
                const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
                const cookieIndex = authData.cookies.findIndex((c: any) => c.name === 'refreshToken');
                if (cookieIndex !== -1) {
                    authData.cookies[cookieIndex].value = data.refreshToken;
                    fs.writeFileSync(authFile, JSON.stringify(authData, null, 2));
                }
            }
        } else {
            console.log('Failed to refresh token:', await response.text());
            // If refresh fails, we might need to re-authenticate. For now, we'll let the test proceed
            // and fail naturally if it requires authentication.
        }

        // Intercept the frontend's refresh request to provide the obtained token
        await page.route('**/api/auth/refresh', async route => {
            await route.fulfill({
                status: response.ok() ? 200 : 401,
                contentType: 'application/json',
                body: JSON.stringify(data)
            });
        });
    });

    test('View activity, edit profile, and delete account', async ({ page }) => {
        test.setTimeout(60000);
        const testUser = {
            email: 'testuser_e2e@example.com',
            password: 'Password123!'
        };

        // Navigate to profile page (user is already authenticated via storageState)
        await page.goto('/profile');

        // Wait for the profile page to load
        await expect(page.locator('h3:has-text("User Profile")')).toBeVisible();

        // Verify user can see post and comments (All activity)
        await expect(page.locator('span.bg-blue-100').filter({ hasText: 'Post' }).first()).toBeVisible();
        await expect(page.locator('span.bg-purple-100').filter({ hasText: 'Comment' }).first()).toBeVisible();

        // Check if user can see only posts
        await page.click('button:has-text("Posts (")');
        await expect(page.locator('span.bg-blue-100').filter({ hasText: 'Post' }).first()).toBeVisible();
        await expect(page.locator('span.bg-purple-100').filter({ hasText: 'Comment' })).toHaveCount(0);

        // Check if user can see only comments
        await page.click('button:has-text("Comments (")');
        await expect(page.locator('span.bg-purple-100').filter({ hasText: 'Comment' }).first()).toBeVisible();
        await expect(page.locator('span.bg-blue-100').filter({ hasText: 'Post' })).toHaveCount(0);

        // Edit profile functionality
        await page.click('button:has-text("Edit Profile")');

        // Change username
        const newUsername = `updated_user_${Date.now()}`;
        await page.fill('input[id="username"]', newUsername);

        // Save changes
        await page.click('button:has-text("Save Changes")');

        // Verify success message
        await expect(page.locator('text="Profile updated successfully!"')).toBeVisible();

        // Delete the profile
        await page.click('button:has-text("Edit Profile")');
        await page.click('button:has-text("Delete Account")');

        // Enter password to verify
        await page.fill('input[id="deletePassword"]', testUser.password);
        await page.click('button:has-text("Verify")');

        // Confirm deletion
        await page.click('button:has-text("Yes, Delete")');

        // Verify redirect to login
        await page.waitForURL('**/login', { timeout: 5000 });

        // Verify by attempting to login that the user does not exist
        await page.fill('input[placeholder="Enter username or email"]', testUser.email);
        await page.fill('input[placeholder="Enter password"]', testUser.password);
        await page.click('button:has-text("Sign In")');

        // Check for error message
        await expect(page.getByText('Username or password is incorrect')).toBeVisible();
    });
});
