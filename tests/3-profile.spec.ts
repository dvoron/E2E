import { test, expect } from './fixtures/auth.fixture';

test.describe('Profile & Account Deletion', () => {
  test('View activity, edit profile, delete account, and verify deleted author in forum', async ({ page, testUser }) => {
    // Land on home page
    await page.goto('/');

    // 3.1 User should head to the Profile page using the UI
    await page.getByRole('link', { name: 'Profile' }).click();
    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByRole('heading', { name: 'User Profile' })).toBeVisible();

    // Verify user can see posts/comments made by them
    const activitySection = page.locator('div').filter({ has: page.getByRole('heading', { name: 'My Activity' }) });
    let postBadge = activitySection.getByText('Post', { exact: true }).first();
    let commentBadge = activitySection.getByText('Comment', { exact: true }).first();

    // If activity is not yet created (e.g. standalone test run), create post and comment via UI first
    const hasActivity = (await postBadge.isVisible().catch(() => false)) || (await commentBadge.isVisible().catch(() => false));
    if (!hasActivity) {
      const postsResponsePromise = page.waitForResponse(response => 
        response.url().includes('/api/forum/posts') && response.request().method() === 'GET'
      );
      await page.getByRole('link', { name: 'Forum' }).click();
      await expect(page).toHaveURL(/\/forum$/);
      await postsResponsePromise;

      await page.getByRole('button', { name: 'Create Post' }).click();
      const setupPostTitle = `Profile Test Post ${Date.now()}`;
      await page.getByRole('textbox', { name: 'Post Title' }).fill(setupPostTitle);
      await page.getByRole('textbox', { name: 'Post Content' }).fill('Profile test content');
      
      const createPostPromise = page.waitForResponse(response => 
        response.url().includes('/api/forum/posts') && response.request().method() === 'POST'
      );
      await page.getByRole('button', { name: 'Post', exact: true }).click();
      await createPostPromise;

      const postLocator = page.locator('.post').filter({ hasText: setupPostTitle }).first();
      await expect(postLocator).toBeVisible();

      await postLocator.getByRole('button', { name: /Comments/ }).click();
      await postLocator.getByRole('textbox', { name: 'Write a comment' }).fill('Profile test comment');
      
      const createCommentPromise = page.waitForResponse(response => 
        response.url().includes('/api/forum/comments') && response.request().method() === 'POST'
      );
      await postLocator.getByRole('button', { name: 'Comment', exact: true }).click();
      await createCommentPromise;

      // Wait for comment to be created and visible before navigating away
      const commentLocator = postLocator.locator('.comment').filter({ hasText: 'Profile test comment' }).first();
      await expect(commentLocator).toBeVisible();

      // Navigate back to profile via UI
      await page.getByRole('link', { name: 'Profile' }).click();
      await expect(page).toHaveURL(/\/profile$/);
    }

    // Verify posts/comments are visible in user activity
    await expect(activitySection.getByText('Post', { exact: true }).first()).toBeVisible();

    // 3.2 Check profile editing functionality
    await page.getByRole('button', { name: 'Edit Profile' }).click();

    const newUsername = `updated_w_${Date.now()}`;
    await page.locator('#username').fill(newUsername);
    await page.getByRole('button', { name: 'Save Changes' }).click();

    // Confirm changes and check if profile shows new username
    await expect(page.getByText('Profile updated successfully!')).toBeVisible();
    await expect(page.locator('dd').filter({ hasText: newUsername })).toBeVisible();

    // 3.3 Test user account deletion functionality
    await page.getByRole('button', { name: 'Edit Profile' }).click();
    await page.getByRole('button', { name: 'Delete Account' }).click();

    await page.locator('#deletePassword').fill(testUser.password);
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: 'Yes, Delete' }).click();

    // Verify user is logged out (Login/Register buttons visible)
    await expect(page.getByRole('link', { name: 'Login', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Register', exact: true })).toBeVisible();

    // Attempt to log back in (to verify account is indeed deleted)
    await page.getByRole('link', { name: 'Login', exact: true }).click();
    await page.locator('#login-username').fill(testUser.email);
    await page.locator('#login-password').fill(testUser.password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page.getByText('Username or password is incorrect')).toBeVisible();

    // 3.4 Navigate back to forum page using the UI to check deleted account text
    const forumResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/forum/posts') && response.request().method() === 'GET'
    );
    await page.getByRole('link', { name: 'Forum' }).click();
    await expect(page).toHaveURL(/\/forum$/);
    await forumResponsePromise;

    // Check if post/comments are correctly marked with deleted account text '[deleted user]'
    await expect(page.getByText('[deleted user]').first()).toBeVisible();
  });
});
