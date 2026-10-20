# E2E Testing Project

This project contains the End-to-End (E2E) automated test suite built with [Playwright](https://playwright.dev/).

## Prerequisites

- **Node.js** version `>= 26.10.0` must be installed.
- **npm** version `>= 12.2.0` must be installed.

## Setup Instructions

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Install Playwright Browsers:**
   Before attempting to conduct any tests, you must install the necessary browsers for Playwright:
   ```bash
   npx playwright install
   ```

## Environment Configuration

By default, the tests will run against `http://localhost:5173` (the frontend) and `http://localhost:8080` (the backend). 

**Important:** The backend must be running on port `:8080` for the token refresh and API calls to succeed.

You can configure environments using `.env` files. The configuration automatically loads `.env` and `.env.${ENV_NAME}`.
To run tests against a different environment, set the `ENV_NAME` variable (e.g., `ENV_NAME=staging npx playwright test`).

## Running Tests

**Warning:** This test suite is destructive. It automatically creates unique user accounts to perform tests and then deletes those accounts during the teardown phase. Do not run this suite against a production environment.

To execute the Playwright test suite, run:
```bash
npx playwright test
```

## Related Projects

- **[Frontend Project](https://github.com/dvoron/frontend)** - The Vue.js user interface.
- **[Backend Project](https://github.com/dvoron/backend)** - The Spring Boot backend service.