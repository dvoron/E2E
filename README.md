# E2E Testing Project

This project contains the End-to-End (E2E) automated test suite built with [Playwright](https://playwright.dev/).

## Prerequisites

- **Node.js** version `>= 26.10.0` must be installed.
- **npm** version `>= 12.2.0` must be installed.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright Browsers:**
   Before attempting to conduct any tests, you must install the necessary browsers for Playwright:
   ```bash
   npx playwright install
   ```

## Environment Configuration

By default, the tests will run against `http://localhost:5173`. 

## Running Tests

To execute the Playwright test suite, run:
```bash
npx playwright test
```

## Related Projects

- **[Frontend Project](https://github.com/dvoron/frontend)** - The Vue.js user interface.
- **[Backend Project](https://github.com/dvoron/backend)** - The Spring Boot backend service.