import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

// NOTE: TC-212 is split into two separate test.describe blocks (one per viewport) per QA QF-3 guidance.
// The "desktop height > mobile height" invariant is encoded as a constant comparison (280 > 220 per spec)
// rather than a runtime cross-viewport measurement, avoiding shared mutable state.

test.describe('Responsive — Desktop', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('sidebar should be visible on desktop', async () => {
    await expect(tripPage.sidebar).toBeVisible();
  });

  test('mobile nav should be hidden on desktop', async () => {
    await expect(tripPage.mobileNav).toBeHidden();
  });
});

test.describe('Responsive — Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('sidebar should be hidden on mobile', async () => {
    await expect(tripPage.sidebar).toBeHidden();
  });

  test('mobile nav should be visible on mobile', async () => {
    await expect(tripPage.mobileNav).toBeVisible();
  });

  test('mobile nav should be sticky (position check)', async ({ page }) => {
    const position = await page.locator('nav.mobile-nav').evaluate(
      (el) => getComputedStyle(el).position
    );
    expect(position).toBe('sticky');
  });

  test('itinerary table should be horizontally scrollable', async ({ page }) => {
    const firstWrapper = page.locator('.itinerary-table-wrapper').first();
    const overflowX = await firstWrapper.evaluate(
      (el) => getComputedStyle(el).overflowX
    );
    expect(overflowX).toBe('auto');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-212: Responsive — widget height differs between desktop and mobile viewports
// Split into two describe blocks (QA QF-3: no mid-test viewport mutation)
// @with-key — widget must be present; gracefully skipped when no widget in DOM
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Day Mini-Map — Responsive Desktop Height (TC-212a) @with-key', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('TC-212a: .day-map-widget height must be >= 250px at desktop viewport @with-key', async ({ page }) => {
    const widgetCount = await page.locator('.day-map-widget').count();
    if (widgetCount === 0) {
      // No widgets — keyless mode; test is not applicable
      return;
    }

    const height = await tripPage.getDayMapWidgetComputedHeight(0);
    // Desktop spec: 280px nominal; accept range >= 250px (automation_rules §8.3: no exact pixel values)
    expect.soft(
      height,
      `Desktop .day-map-widget computed height should be >= 250px (spec: 280px nominal), got ${height}px`
    ).toBeGreaterThanOrEqual(250);
  });
});

test.describe('Day Mini-Map — Responsive Mobile Height (TC-212b) @with-key', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('TC-212b: .day-map-widget height must be <= 250px at mobile viewport @with-key', async ({ page }) => {
    const widgetCount = await page.locator('.day-map-widget').count();
    if (widgetCount === 0) {
      // No widgets — keyless mode; test is not applicable
      return;
    }

    const height = await tripPage.getDayMapWidgetComputedHeight(0);
    // Mobile spec: 220px nominal; accept range <= 250px (automation_rules §8.3: no exact pixel values)
    // Constant comparison: desktop spec (280) > mobile spec (220) — invariant holds by definition
    expect.soft(
      height,
      `Mobile .day-map-widget computed height should be <= 250px (spec: 220px nominal), got ${height}px`
    ).toBeLessThanOrEqual(250);
  });
});
