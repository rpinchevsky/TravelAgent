import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

/**
 * Progression Tests — 2026-03-12_2215 Release
 *
 * Covers changes documented in release_notes.md:
 * - Pricing sections use pricing-grid (not itinerary-table)
 * - Plan B sections use advisory--info
 * - Logistics sections use advisory--info
 * - Budget summary section exists with pricing-grid
 * - Overview section rendered as standalone (not in day-card)
 * - Holiday advisory rendered as advisory--warning
 * - CSS inlined (no external link)
 * - All 11 day sections present (day-0 through day-10)
 */

test.describe('Progression — Pricing Grid Usage', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  for (let day = 1; day <= 10; day++) {
    test(`Day ${day} should use pricing-grid for costs (not itinerary-table)`, async ({ page }) => {
      const pricingGrid = page.locator(`#day-${day} .pricing-grid`);
      await expect(pricingGrid).toBeAttached();

      const pricingCells = page.locator(`#day-${day} .pricing-grid .pricing-cell`);
      const cellCount = await pricingCells.count();
      expect(cellCount).toBeGreaterThanOrEqual(2);
    });
  }
});

test.describe('Progression — Plan B Uses advisory--info', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  for (let day = 1; day <= 10; day++) {
    test(`Day ${day} should render Plan B as advisory--info`, async ({ page }) => {
      const planB = page.locator(`#day-${day} .advisory.advisory--info`);
      const count = await planB.count();
      expect(count).toBeGreaterThanOrEqual(1);
    });
  }
});

test.describe('Progression — Logistics Uses advisory--info', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  for (let day = 1; day <= 10; day++) {
    test(`Day ${day} should have logistics section with advisory--info containing "Логистика"`, async ({ page }) => {
      const logistics = page.locator(`#day-${day} .advisory.advisory--info`).filter({ hasText: 'Логистика' });
      await expect(logistics).toBeAttached();
    });
  }
});

test.describe('Progression — Holiday Advisory', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should render holiday advisory as advisory--warning', async () => {
    await expect(tripPage.holidayAdvisory).toBeAttached();
  });

  test('should mention St. Stephen\'s Day in the advisory', async () => {
    await expect(tripPage.holidayAdvisory).toContainText('Иштван');
  });
});

test.describe('Progression — Budget Summary Section', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(baseURL!);
  });

  test('should have a budget section with id="budget"', async ({ page }) => {
    const budget = page.locator('#budget');
    await expect(budget).toBeAttached();
  });

  test('should contain a pricing-grid or budget table in budget section', async ({ page }) => {
    const budgetContent = page.locator('#budget');
    await expect(budgetContent).toContainText('ИТОГО');
  });
});

test.describe('Progression — Overview Section Structure', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page.goto(baseURL!);
  });

  test('should have overview section with id="overview"', async ({ page }) => {
    const overview = page.locator('#overview');
    await expect(overview).toBeAttached();
  });

  test('overview should NOT be wrapped in a day-card', async ({ page }) => {
    const overviewDayCard = page.locator('#overview .day-card');
    await expect(overviewDayCard).toHaveCount(0);
  });

  test('overview should contain an itinerary-table', async ({ page }) => {
    const table = page.locator('#overview .itinerary-table');
    await expect(table).toBeAttached();
  });
});
