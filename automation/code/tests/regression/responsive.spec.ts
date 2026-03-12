import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

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
