import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

export const test = base.extend({
    // Override page fixture to automatically inject the refresh token handling
    page: async ({ page, request }, use) => {
        const authFile = path.resolve(__dirname, '../../playwright/.auth/user.json');
        let cookieStr = '';

        if (fs.existsSync(authFile)) {
            const authData = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
            const refreshTokenCookie = authData.cookies.find((c: any) => c.name === 'refreshToken');
            if (refreshTokenCookie) {
                cookieStr = `${refreshTokenCookie.name}=${refreshTokenCookie.value}`;
            }
        }

        const apiUrl = process.env.API_URL || 'http://localhost:8080';
        const response = await request.post(`${apiUrl}/api/auth/refresh`, {
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
            const errorText = await response.text();
            console.log('Failed to refresh token:', errorText);
            // Fail straight away if the token refresh fails
            throw new Error(`Token refresh failed: ${errorText}`);
        }

        // Intercept the frontend's refresh request to provide the obtained token
        // Note: Mocking /api/auth/refresh bypasses the app's real refresh flow.
        // Every later refresh returns this same cached token, so a long test could 
        // theoretically run past the access token's expiry.
        await page.route('**/api/auth/refresh', async route => {
            await route.fulfill({
                status: response.ok() ? 200 : 401,
                contentType: 'application/json',
                body: JSON.stringify(data)
            });
        });

        await use(page);
    }
});

export { expect } from '@playwright/test';
