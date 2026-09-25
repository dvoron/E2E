import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const authFile = 'playwright/.auth/user.json';

setup('authenticate', async ({ page, request }) => {
  const email = process.env.TEST_USER_EMAIL!;
  const password = process.env.TEST_USER_PASSWORD!;
  const apiUrl = process.env.API_URL || 'http://localhost:8080';

  // 1. Create a user if they don't exist yet via API (Optional but recommended for robust setup)
  // This helps if the DB was wiped between test runs
  try {
    const registerResponse = await request.post(`${apiUrl}/api/auth/register`, {
      data: {
        username: email.split('@')[0],
        email: email,
        password: password,

      },
      failOnStatusCode: false // Don't fail if user already exists
    });
    
    // Log if creation failed for reasons other than "already exists"
    if (registerResponse.status() === 409) {
      console.warn(`User creation API returned status: ${registerResponse.status()} ${await registerResponse.body()}`);
    }
    // if (!registerResponse.ok() && registerResponse.status() === 409 && registerResponse.status() !== 400) {
    //   console.warn(`User creation API returned status: ${registerResponse.status()}`);
    // }
  } catch (error) {
    console.log('Skipping API user creation, falling back to UI registration if needed.', error);
    // await page.goto('/home/register')
    // await page.fill('input[placeholder*="username" i]', email.split('@')[0])
    // await page.fill('input[type="email"], input[id="email"], input[placeholder*="email" i]', email);
    // await page.fill('input[type="password"], input[id="password"]', password);
    // await page.click('button[type="submit"], button:has-text("Log In"), button:has-text("Login")');
  }

  // 2. Try to log in via UI
  // if ()
  await page.goto('/home/login');
  
  // Fill the login form
  await page.fill('input[type="email"], input[id="email"], input[placeholder*="email" i]', email);
  await page.fill('input[type="password"], input[id="password"]', password);
  
  // Submit the form
  await page.click('button[type="submit"], button:has-text("Log In"), button:has-text("Login")');

  // Wait for navigation or successful login indicator (e.g., redirect to home/profile or a specific element appearing)
  // We're being somewhat generic here. You might need to adjust the exact selector based on your Vue app's structure.
  await page.waitForURL('/home', { timeout: 5000 }).catch(async () => {
    // If login failed, it might be because the user wasn't actually created. Let's register via UI.
    console.log('Login failed (maybe user missing). Attempting UI Registration...');
    await page.goto('/register');
    await page.fill('input[type="email"], input[id="email"], input[placeholder*="email" i]', email);
    await page.fill('input[type="text"], input[id="username"], input[placeholder*="user" i]', email.split('@')[0]);
    await page.fill('input[type="password"], input[id="password"]', password);
    await page.click('button[type="submit"], button:has-text("Register"), button:has-text("Sign Up")');
    
    // Should redirect to login after successful register
    await page.waitForURL('**/login', { timeout: 5000 });
    
    // Attempt login again
    await page.fill('input[type="email"], input[id="email"], input[placeholder*="email" i]', email);
    await page.fill('input[type="password"], input[id="password"]', password);
    await page.click('button[type="submit"], button:has-text("Log In"), button:has-text("Login")');
    await page.waitForURL('**/'); // Wait for redirect to home
  });

  // Wait for the auth state to settle (e.g., token saved to localStorage/cookie)
  // Adjust this based on how your Vue app indicates a loaded authenticated state
  await page.waitForLoadState('networkidle');

  // Ensure the directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // End of authentication steps.
  await page.context().storageState({ path: authFile });
});
