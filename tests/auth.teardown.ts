import { test as teardown, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');
const credentialsFile = path.resolve(__dirname, '../playwright/.auth/credentials.json');

teardown.use({ storageState: authFile });

teardown('delete account', async ({ page }) => {
    if (!fs.existsSync(credentialsFile)) {
        console.log('No credentials file found, skipping teardown.');
        return;
    }
    const testUser = JSON.parse(fs.readFileSync(credentialsFile, 'utf-8'));

    await page.goto('/profile');
    
    // Wait for the profile page to load
    await expect(page.locator('h3:has-text("User Profile")')).toBeVisible();

    // Delete the profile
    await page.click('button:has-text("Edit Profile")');
    await page.click('button:has-text("Delete Account")');

    // Enter password to verify
    await page.fill('input[id="deletePassword"]', testUser.password);
    await page.click('button:has-text("Continue")');

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
