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
    await page.click('button:has-text("Create Post")');
    const postTitle = `E2E Test Post ${Date.now()}`;
    const postContent = `This is the body text for the E2E test post.`;
    await page.fill('input[placeholder="Title"]', postTitle);
    await page.fill('textarea[placeholder="Text (optional)"]', postContent);
    await page.click('button:has-text("Post")');

    // Verify post is created
    const postLocator = page.locator('.post').filter({ hasText: postTitle }).first();
    await expect(postLocator).toBeVisible();

    // Write a comment in the same post
    await postLocator.locator('button:has-text("Comments")').click();
    const commentContent = `This is an E2E test comment.`;
    await postLocator.locator('textarea[placeholder="What are your thoughts?"]').fill(commentContent);
    await postLocator.locator('button:has-text("Comment")').click();

    // Verify comment is created
    const commentLocator = postLocator.locator('.comment').filter({ hasText: commentContent }).first();
    await expect(commentLocator).toBeVisible();

    // Reply to the comment
    await commentLocator.locator('button:has-text("Reply")').click();
    const replyContent = `This is an E2E test reply.`;
    await commentLocator.locator('textarea[placeholder="Write a reply..."]').fill(replyContent);
    await commentLocator.locator('button:has-text("Submit")').click();

    // Verify reply is created
    const replyLocator = commentLocator.locator('.replies .comment').filter({ hasText: replyContent }).first();
    await expect(replyLocator).toBeVisible();
  });
});
