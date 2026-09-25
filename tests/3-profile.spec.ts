import { test, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

// Use the storage state saved by the authentication test (which contains localStorage and cookies)
test.use({ storageState: authFile });

test.describe('Profile', () => {
  test('View activity, edit profile, and delete account', async ({ page }) => {
    const testUser = {
      email: 'testuser_e2e@example.com',
      password: 'Password123!'
    };

    // Navigate to profile page (user is already authenticated via storageState)
    await page.goto('/profile');

    // Wait for the profile page to load
    await expect(page.locator('h3:has-text("User Profile")')).toBeVisible();

    // Verify user can see post and comments (All activity)
    await expect(page.locator('span:has-text("Post")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Comment")').first()).toBeVisible();

    // Check if user can see only posts
    await page.click('button:has-text("Posts (")');
    await expect(page.locator('span:has-text("Post")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Comment")')).toHaveCount(0);

    // Check if user can see only comments
    await page.click('button:has-text("Comments (")');
    await expect(page.locator('span:has-text("Comment")').first()).toBeVisible();
    await expect(page.locator('span:has-text("Post")')).toHaveCount(0);

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
    await expect(page.locator('text="Username or password is incorrect"')).toBeVisible();
  });
});
