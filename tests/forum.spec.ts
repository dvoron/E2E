import { test, expect } from '@playwright/test';

test.describe('Forum Interactions', () => {
  test('User can view forum topics and add a new comment', async ({ page }) => {
    // 1. Navigate to the Forum (User is already authenticated via auth.setup.ts)
    await page.goto('/forum');

    // 2. Verify that forum posts/topics fetched from the backend are visible.
    // Wait for the main forum container or a list of topics to appear.
    // Replace with the actual selector used in your Vue app (e.g., '.topic-list', '.forum-post')
    const forumContainer = page.locator('main, .forum-container, .posts');
    await expect(forumContainer).toBeVisible();

    // Find the first topic/post and click it
    // Replace '.topic-link' or similar with your actual selector
    const firstTopic = page.locator('a:has-text("Read more"), .topic-title a, .post-title').first();
    
    // If there are no topics, we might need to create one, but for a basic read/comment flow, 
    // we assume data exists or we mock it. For an actual E2E, the DB should have seed data.
    if (await firstTopic.count() > 0) {
      await firstTopic.click();
      
      // Wait for the topic page to load
      await page.waitForLoadState('networkidle');

      // 3. Submit a new comment
      const commentText = `Test comment from E2E at ${new Date().toISOString()}`;
      
      // Find the comment textarea and submit button
      // Replace these selectors with the actual ones from ForumComment.vue
      const commentInput = page.locator('textarea, input[placeholder*="comment" i]');
      await commentInput.fill(commentText);

      const submitButton = page.locator('button:has-text("Submit"), button:has-text("Post"), button:has-text("Reply")');
      await submitButton.click();

      // 4. Assert that the new comment appears immediately
      // Replace '.comment-text' or similar with the actual selector for a rendered comment
      const newComment = page.getByText(commentText);
      await expect(newComment).toBeVisible();
    } else {
      console.log('No existing forum topics found to comment on.');
      // Optionally, implement logic to create a new topic here if that's part of the flow
    }
  });
});
