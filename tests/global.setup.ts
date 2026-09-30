import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  // Global setup logic here, e.g., preparing test databases,
  // or setting up generic environment things before tests run.
  console.log(`Running tests against: ${process.env.BASE_URL}`);
}
export default globalSetup;
