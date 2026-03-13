import { test, expect } from '../fixtures/shared-page';

test.describe('SVG Integrity', () => {
  test('all inline SVGs should have explicit width attribute', async ({ sharedPage }) => {
    const svgsWithoutWidth = await sharedPage.locator('svg:not([width])').count();
    expect(svgsWithoutWidth).toBe(0);
  });

  test('all inline SVGs should have explicit height attribute', async ({ sharedPage }) => {
    const svgsWithoutHeight = await sharedPage.locator('svg:not([height])').count();
    expect(svgsWithoutHeight).toBe(0);
  });

  test('should have SVGs in the page (sanity check)', async ({ tripPage }) => {
    const totalSvgs = await tripPage.getAllSvgs().count();
    expect(totalSvgs).toBeGreaterThanOrEqual(14);
  });
});
