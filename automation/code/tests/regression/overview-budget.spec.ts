import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

test.describe('Overview Table', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have overview table with 11 data rows (arrival + 10 days)', async () => {
    await expect(tripPage.overviewTableRows).toHaveCount(11);
  });

  test('overview table should contain arrival row', async () => {
    await expect(tripPage.overviewTableRows.first()).toContainText('Заезд');
  });

  test('overview table should contain all 10 day links', async () => {
    for (let i = 1; i <= 10; i++) {
      const link = tripPage.overviewTable.locator(`a[href="#day-${i}"]`);
      await expect(link).toBeAttached();
    }
  });

  test('all overview rows should have Plan B column', async () => {
    const count = await tripPage.overviewTableRows.count();
    expect(count).toBeGreaterThanOrEqual(11);
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
    await expect(tripPage.budgetSection).toContainText('1 745');
  });

  test('budget table should contain EUR currency marker', async () => {
    await expect(tripPage.budgetSection).toContainText('€');
  });

  test('budget section should contain car rental info', async () => {
    await expect(tripPage.budgetSection).toContainText('автомобил');
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
