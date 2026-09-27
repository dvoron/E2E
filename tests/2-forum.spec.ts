import { test, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

// Use the storage state saved by the authentication test (which contains localStorage and cookies)
test.use({ storageState: authFile });

test.describe('Forum', () => {
  test('Create post, comment, and reply', async ({ page }) => {
    // Navigate to forums page (user is already authenticated via storageState)
    await page.goto('/forum');

    // Create a post
    await page.getByRole('button', { name: 'Create Post' }).click();
    const postTitle = `E2E Test Post ${Date.now()}`;
    const postContent = `This is the body text for the E2E test post.`;
    await page.getByPlaceholder('Title').fill(postTitle);
    await page.getByPlaceholder('Text (optional)').fill(postContent);
    await page.getByRole('button', { name: 'Post', exact: true }).click();

    // Verify post is created
    const postLocator = page.locator('.post').filter({ hasText: postTitle }).first();
    await expect(postLocator).toBeVisible();

    // Write a comment in the same post
    await postLocator.getByRole('button', { name: /Comments/ }).click();
    const commentContent = `This is an E2E test comment.`;
    await postLocator.getByPlaceholder('What are your thoughts?').fill(commentContent);
    await postLocator.getByRole('button', { name: 'Comment', exact: true }).click();

    // Verify comment is created
    const commentLocator = postLocator.locator('.comment').filter({ hasText: commentContent }).first();
    await expect(commentLocator).toBeVisible();

    // Reply to the comment
    await commentLocator.getByRole('button', { name: 'Reply', exact: true }).click();
    const replyContent = `This is an E2E test reply.`;
    await commentLocator.getByPlaceholder('Write a reply...').fill(replyContent);
    await commentLocator.getByRole('button', { name: 'Submit', exact: true }).click();

    // Verify reply is created
    const replyLocator = commentLocator.locator('.replies .comment').filter({ hasText: replyContent }).first();
    await expect(replyLocator).toBeVisible();
  });
});
