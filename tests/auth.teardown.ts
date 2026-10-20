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
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    await page.getByRole('button', { name: 'Delete Account' }).click();

    // Enter password to verify
    await page.locator('input[id="deletePassword"]').fill(testUser.password);
    await page.getByRole('button', { name: 'Continue' }).click();

    // Confirm deletion
    await page.getByRole('button', { name: 'Yes, Delete' }).click();

    // Verify redirect to login
    await page.waitForURL('**/login', { timeout: 5000 });

    // Verify by attempting to login that the user does not exist
    await page.getByPlaceholder('Enter username or email').fill(testUser.email);
    await page.getByPlaceholder('Enter password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Check for error message
    await expect(page.getByText('Username or password is incorrect')).toBeVisible();
});
