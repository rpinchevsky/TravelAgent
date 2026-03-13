import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

test.describe('Overview Table', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have overview table with 12 data rows (arrival + 10 days + departure)', async () => {
    await expect(tripPage.overviewTableRows).toHaveCount(12);
  });

  test('overview table should contain arrival row', async () => {
    await expect(tripPage.overviewTableRows.first()).toContainText('20.08');
  });

  test('overview table should contain all day rows (0-11)', async () => {
    for (let i = 0; i <= 11; i++) {
      const cell = tripPage.overviewTable.locator(`td`).filter({ hasText: new RegExp(`^${i}$`) });
      await expect(cell).toBeAttached();
    }
  });

  test('all overview rows should have Plan B column', async () => {
    const count = await tripPage.overviewTableRows.count();
    expect(count).toBeGreaterThanOrEqual(12);
  });
});

test.describe('Budget Section', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have budget section visible', async () => {
    await expect(tripPage.budgetSection).toBeAttached();
  });

  test('budget table should contain total row with EUR amount', async () => {
    await expect(tripPage.budgetSection).toContainText('1 572');
  });

  test('budget table should contain EUR currency marker', async () => {
    await expect(tripPage.budgetSection).toContainText('EUR');
  });
});

test.describe('Holiday Advisory', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should display holiday advisory warning', async () => {
    await expect(tripPage.holidayAdvisory).toBeVisible();
  });

  test('advisory should mention St. Stephen Day', async () => {
    await expect(tripPage.holidayAdvisoryTitle).toContainText('Иштвана');
  });

  test('advisory should mention closures', async () => {
    await expect(tripPage.holidayAdvisory).toContainText('Закрытия');
  });
});
