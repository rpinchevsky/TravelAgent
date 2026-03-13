import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

test.describe('SVG Integrity', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('all inline SVGs should have explicit width attribute', async ({ page }) => {
    const svgsWithoutWidth = await page.locator('svg:not([width])').count();
    expect(svgsWithoutWidth).toBe(0);
  });

  test('all inline SVGs should have explicit height attribute', async ({ page }) => {
    const svgsWithoutHeight = await page.locator('svg:not([height])').count();
    expect(svgsWithoutHeight).toBe(0);
  });

  test('should have SVGs in the page (sanity check)', async () => {
    const totalSvgs = await tripPage.getAllSvgs().count();
    expect(totalSvgs).toBeGreaterThanOrEqual(14);
  });
});
