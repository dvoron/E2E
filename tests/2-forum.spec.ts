import { test, expect } from './fixtures/auth.fixture';

test.describe('Forum Functionality', () => {
  test('Create post, comment, and reply via UI navigation', async ({ page }) => {
    // 2.1 User goes to the forum page using the UI
    await page.goto('/');
    const postsResponsePromise = page.waitForResponse(response => 
      response.url().includes('/api/forum/posts') && response.request().method() === 'GET'
    );
    await page.getByRole('link', { name: 'Forum' }).click();
    await expect(page).toHaveURL(/\/forum$/);
    await postsResponsePromise;

    // User makes a post
    await page.getByRole('button', { name: 'Create Post' }).click();

    const postTitle = `E2E Forum Post ${Date.now()}`;
    const postContent = `E2E Forum post body content ${Date.now()}`;

    await page.getByRole('textbox', { name: 'Post Title' }).fill(postTitle);
    await page.getByRole('textbox', { name: 'Post Content' }).fill(postContent);
    
    const createPostPromise = page.waitForResponse(response => 
      response.url().includes('/api/forum/posts') && response.request().method() === 'POST'
    );
    await page.getByRole('button', { name: 'Post', exact: true }).click();
    await createPostPromise;

    // Verify post is created and visible
    const postLocator = page.locator('.post').filter({ hasText: postTitle }).first();
    await expect(postLocator).toBeVisible();

    // User writes a comment after successfully making a post
    await postLocator.getByRole('button', { name: /Comments/ }).click();

    const commentContent = `E2E Forum comment content ${Date.now()}`;
    await postLocator.getByRole('textbox', { name: 'Write a comment' }).fill(commentContent);
    
    const createCommentPromise = page.waitForResponse(response => 
      response.url().includes('/api/forum/comments') && response.request().method() === 'POST'
    );
    await postLocator.getByRole('button', { name: 'Comment', exact: true }).click();
    await createCommentPromise;

    // Verify comment is created and visible
    const commentLocator = postLocator.locator('.comment').filter({ hasText: commentContent }).first();
    await expect(commentLocator).toBeVisible();

    // User writes a reply after successfully writing the comment
    await commentLocator.getByRole('button', { name: 'Reply', exact: true }).click();

    const replyContent = `E2E Forum reply content ${Date.now()}`;
    await commentLocator.getByRole('textbox', { name: 'Write a reply' }).fill(replyContent);
    
    const createReplyPromise = page.waitForResponse(response => 
      response.url().includes('/api/forum/comments') && response.request().method() === 'POST'
    );
    await commentLocator.getByRole('button', { name: 'Submit', exact: true }).click();
    await createReplyPromise;

    // Verify reply is written (await for it to be visible)
    const replyLocator = commentLocator.locator('.replies .comment').filter({ hasText: replyContent }).first();
    await expect(replyLocator).toBeVisible();
  });
});
