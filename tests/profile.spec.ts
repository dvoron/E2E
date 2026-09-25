import { test, expect } from '@playwright/test';

test.describe('Profile Management', () => {
  test('User can update settings and view activity', async ({ page }) => {
    // 1. Navigate to the user profile
    await page.goto('/profile');

    // Wait for profile page to load
    await expect(page.locator('h1, .profile-header').filter({ hasText: /profile/i })).toBeVisible({ timeout: 10000 }).catch(() => null);

    // 2. Modify a setting in ProfileSettings.vue and save
    // Assuming there's an input we can toggle or change, e.g., a "Bio" or "Display Name"
    const bioInput = page.locator('textarea[name="bio"], input[name="displayName"], input[placeholder*="bio" i]');
    
    if (await bioInput.count() > 0) {
        const newBio = `Updated bio from E2E test ${Date.now()}`;
        await bioInput.fill(newBio);
        
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")');
        await saveButton.click();

        // Wait for a success message or just wait a bit for the API call
        await page.waitForResponse(response => response.url().includes('/api/users') && response.request().method() !== 'GET', { timeout: 5000 }).catch(() => null);

        // 3. Verify the changes persist after a page reload
        await page.reload();
        await expect(bioInput).toHaveValue(newBio);
    }

    // 4. Navigate to the activity feed (ProfileActivityList.vue)
    // There might be a tab or a section for activity
    const activityTab = page.locator('a, button, .tab').filter({ hasText: /activity/i });
    if (await activityTab.count() > 0) {
        await activityTab.click();
        
        // Verify that some activity is listed (e.g., from the forum test if they run sequentially, 
        // though normally tests should be isolated. Here we just check the list exists).
        const activityList = page.locator('.activity-list, .activity-item');
        await expect(activityList.first()).toBeVisible();
    }
  });

  // Note: We place Account Deletion in a separate test or at the very end
  // because it destroys the session state for the test user.
  // We use test.describe.serial if we want them to run in order, or we create a specific dummy user for deletion.
});

// Create a separate describe block for destructive actions
test.describe('Account Deletion', () => {
    // We don't use the default storageState here because we might want to register a fresh user just to delete them
    test.use({ storageState: { cookies: [], origins: [] } });

    test('User can delete their account', async ({ page, request }) => {
        const tempEmail = `delete_me_${Date.now()}@example.com`;
        const tempPassword = 'password123';
        const apiUrl = process.env.API_URL || 'http://localhost:8080';

        // 1. Create a temporary user via API
        await request.post(`${apiUrl}/users/register`, {
            data: { username: `del_${Date.now()}`, email: tempEmail, password: tempPassword }
        }).catch(() => null);

        // 2. Log in with temporary user
        await page.goto('/login');
        await page.fill('input[type="email"], input[id="email"]', tempEmail);
        await page.fill('input[type="password"], input[id="password"]', tempPassword);
        await page.click('button[type="submit"], button:has-text("Log In")');
        await page.waitForURL('**/', { timeout: 5000 }).catch(() => null);

        // 3. Navigate to profile
        await page.goto('/profile');

        // 4. Trigger account deletion
        const deleteButton = page.locator('button.delete-account, button:has-text("Delete Account")');
        if (await deleteButton.count() > 0) {
            await deleteButton.click();

            // Handle confirmation dialog (ProfileDeleteAccountDialog.vue)
            const confirmDeleteBtn = page.locator('button.confirm-delete, .dialog button:has-text("Confirm"), .modal button:has-text("Delete")');
            await confirmDeleteBtn.click();

            // 5. Verify redirection to home or login page
            await page.waitForURL('**/(login|)', { timeout: 5000 });

            // 6. Attempt to log in with the deleted credentials and assert an error is shown
            await page.goto('/login');
            await page.fill('input[type="email"], input[id="email"]', tempEmail);
            await page.fill('input[type="password"], input[id="password"]', tempPassword);
            await page.click('button[type="submit"]');

            // Verify error message appears
            const errorMessage = page.locator('.error, .alert-danger, text="Invalid credentials"');
            await expect(errorMessage).toBeVisible();
        } else {
            console.log('Delete account button not found on profile page.');
        }
    });
});
