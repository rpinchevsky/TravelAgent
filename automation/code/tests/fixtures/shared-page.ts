import { test as base, type Page } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

/**
 * Shared-page fixture for read-only DOM tests.
 *
 * Loads the trip HTML once per worker and reuses the same Page + TripPage
 * instance across all tests in the file. This eliminates redundant page.goto()
 * calls for tests that only read DOM state without mutating it.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/shared-page';
 *
 * IMPORTANT: Only use for tests that do NOT click, scroll, navigate, or
 * otherwise mutate the page. Tests that interact (e.g., click-to-scroll)
 * must continue using the standard Playwright test with beforeEach.
 */

type SharedFixtures = {
  sharedPage: Page;
  tripPage: TripPage;
};

export const test = base.extend<{}, SharedFixtures>({
  sharedPage: [async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const baseURL = base.info().project.use.baseURL;
    if (baseURL) {
      await page.goto(baseURL);
    }
    await use(page);
    await context.close();
  }, { scope: 'worker' }],

  tripPage: [async ({ sharedPage }, use) => {
    const tripPage = new TripPage(sharedPage);
    await use(tripPage);
  }, { scope: 'worker' }],
});

export { expect } from '@playwright/test';
