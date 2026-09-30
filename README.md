# E2E Testing Project

This project contains the End-to-End (E2E) automated test suite built with [Playwright](https://playwright.dev/).

## Prerequisites

- **Node.js** must be installed on your system.

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dvoron/E2E.git
   cd E2E
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```
   *(This step will also install the necessary Playwright browsers.)*

## Environment Configuration

By default, the tests will run against `http://localhost:5173`. 

If you need to change the target URL or configure other settings, you can set environment variables directly before running the tests:

```bash
# Linux/macOS
BASE_URL=http://localhost:3000 npx playwright test

# Windows (PowerShell)
$env:BASE_URL="http://localhost:3000"; npx playwright test
```

## Running Tests

To execute the Playwright test suite, run:
```bash
npx playwright test
```

## Related Projects

- **[Frontend Project](https://github.com/dvoron/frontend)** - The Vue.js user interface.
- **[Backend Project](https://github.com/dvoron/backend)** - The Spring Boot backend service.