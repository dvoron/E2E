import { test, expect } from './fixtures/auth.fixture';
import * as path from 'path';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

// Use the storage state saved by the authentication test (which contains localStorage and cookies)
test.use({ storageState: authFile });

test.describe('Profile', () => {
    test('View activity and edit profile', async ({ page }) => {
        test.setTimeout(60000);

        // First, create a post and comment so they exist in the profile
        await page.goto('/forum');
        await page.getByRole('button', { name: 'Create Post' }).click();
        const postTitle = `Profile Test Post ${Date.now()}`;
        await page.getByPlaceholder('Title').fill(postTitle);
        await page.getByPlaceholder('Text (optional)').fill('Profile test content');
        await page.getByRole('button', { name: 'Post', exact: true }).click();
        
        const postLocator = page.locator('.post').filter({ hasText: postTitle }).first();
        await expect(postLocator).toBeVisible();
        await postLocator.getByRole('button', { name: /Comments/ }).click();
        await postLocator.getByPlaceholder('What are your thoughts?').fill('Profile test comment');
        await postLocator.getByRole('button', { name: 'Comment', exact: true }).click();

        // Navigate to profile page (user is already authenticated via storageState)
        await page.goto('/profile');

        // Wait for the profile page to load
        await expect(page.locator('h3:has-text("User Profile")')).toBeVisible();

        // Verify user can see post and comments (All activity)
        await expect(page.getByText('Post', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('Comment', { exact: true }).first()).toBeVisible();

        // Check if user can see only posts
        await page.getByRole('button', { name: /Posts \(/ }).click();
        await expect(page.getByText('Post', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('Comment', { exact: true })).toHaveCount(0);

        // Check if user can see only comments
        await page.getByRole('button', { name: /Comments \(/ }).click();
        await expect(page.getByText('Comment', { exact: true }).first()).toBeVisible();
        await expect(page.getByText('Post', { exact: true })).toHaveCount(0);

        // Edit profile functionality
        await page.getByRole('button', { name: 'Edit Profile' }).click();

        // Change username
        const newUsername = `updated_user_${Date.now()}`;
        await page.locator('input[id="username"]').fill(newUsername);

        // Save changes
        await page.getByRole('button', { name: 'Save Changes' }).click();

        // Verify success message
        await expect(page.getByText('Profile updated successfully!')).toBeVisible();
    });
});
