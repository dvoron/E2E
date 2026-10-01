# E2E Testing Project

This project contains the End-to-End (E2E) automated test suite built with [Playwright](https://playwright.dev/).

## Prerequisites

- **Node.js** must be installed on your system.

### Installing Node.js and npm

**Windows / macOS:**
Download the LTS installer from the [Node.js website](https://nodejs.org/). 
Alternatively, on Windows you can use `winget`:
```cmd
winget install OpenJS.NodeJS.LTS
```
On macOS with Homebrew:
```bash
brew install node
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Using NVM (Node Version Manager) - Recommended:**
NVM allows you to easily manage multiple Node.js versions.
- Linux/macOS: Install [nvm](https://github.com/nvm-sh/nvm)
- Windows: Install [nvm-windows](https://github.com/coreybutler/nvm-windows)

Once NVM is installed, you can install and use the latest LTS version:
```bash
nvm install --lts
nvm use --lts
```

**Verify Installation:**
```bash
node -v
npm -v
```

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dvoron/E2E.git
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