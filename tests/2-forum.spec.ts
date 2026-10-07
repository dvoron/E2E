import { test, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

// Use the storage state saved by the authentication test (which contains localStorage and cookies)
test.use({ storageState: authFile });

test.describe('Forum', () => {
    test.beforeEach(async ({ page, request }) => {
        // Since Playwright's `request` object doesn't automatically send cookies from the `storageState`,
        // we need to manually read the cookie from the saved state and pass it to the backend.
        const fs = require('fs');
        const path = require('path');
        const authFile = path.resolve(__dirname, '../playwright/.auth/user.json');

        let cookieStr = '';
        if (fs.existsSync(authFile)) {
            const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
            const refreshTokenCookie = authData.cookies.find((c: any) => c.name === 'refreshToken');
            if (refreshTokenCookie) {
                cookieStr = `${refreshTokenCookie.name}=${refreshTokenCookie.value}`;
            }
        }

        // Obtain an access token for the E2E tests using the backend refresh method
        // Note: Using http://localhost:8080 directly to bypass Vite's proxy which might drop cookies
        const response = await request.post('http://localhost:8080/api/auth/refresh', {
            headers: {
                'Cookie': cookieStr
            }
        });

        let data: any = {};
        if (response.ok()) {
            data = await response.json();

            if (data.refreshToken && fs.existsSync(authFile)) {
                const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
                const cookieIndex = authData.cookies.findIndex((c: any) => c.name === 'refreshToken');
                if (cookieIndex !== -1) {
                    authData.cookies[cookieIndex].value = data.refreshToken;
                    fs.writeFileSync(authFile, JSON.stringify(authData, null, 2));
                }
            }
        } else {
            console.log('Failed to refresh token:', await response.text());
            // If refresh fails, we might need to re-authenticate. For now, we'll let the test proceed
            // and fail naturally if it requires authentication.
        }

        // Intercept the frontend's refresh request to provide the obtained token
        await page.route('**/api/auth/refresh', async route => {
            await route.fulfill({
                status: response.ok() ? 200 : 401,
                contentType: 'application/json',
                body: JSON.stringify(data)
            });
        });
    });

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
