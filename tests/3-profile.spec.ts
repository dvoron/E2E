import { test, expect } from './fixtures/auth.fixture';

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

        // Wait for the comment to appear before navigating away
        await expect(postLocator.locator('.comment').filter({ hasText: 'Profile test comment' }).first()).toBeVisible();

        // Navigate to profile page (user is already authenticated via storageState)
        await page.goto('/profile');

        // Wait for the profile page to load
        await expect(page.locator('h3:has-text("User Profile")')).toBeVisible();

        // Wait for the activity list to finish loading (wait for the badges to appear)
        const postBadge = page.getByText('Post', { exact: true }).first();
        const commentBadge = page.getByText('Comment', { exact: true }).first();

        await expect(postBadge).toBeVisible();
        await expect(commentBadge).toBeVisible();

        // Check if user can see only posts
        await page.getByRole('button', { name: /Posts \(/ }).click();
        await expect(postBadge).toBeVisible();
        await expect(page.getByText('Comment', { exact: true })).toHaveCount(0);

        // Check if user can see only comments
        await page.getByRole('button', { name: /Comments \(/ }).click();
        await expect(commentBadge).toBeVisible();
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
