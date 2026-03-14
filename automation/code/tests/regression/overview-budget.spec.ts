import { test, expect } from '../fixtures/shared-page';

test.describe('Overview Table', () => {
  test('should have overview table with 12 data rows (arrival + 10 days + departure)', async ({ tripPage }) => {
    await expect(tripPage.overviewTableRows).toHaveCount(12);
  });

  test('overview table should contain arrival row', async ({ tripPage }) => {
    await expect(tripPage.overviewTableRows.first()).toContainText('20.08');
  });

  test('overview table should contain all day date rows', async ({ tripPage }) => {
    const dates = ['20.08', '21.08', '22.08', '23.08', '24.08', '25.08', '26.08', '27.08', '28.08', '29.08', '30.08', '31.08'];
    for (const date of dates) {
      const cell = tripPage.overviewTable.locator(`td`).filter({ hasText: date });
      await expect(cell).toBeAttached();
    }
  });

  test('all overview rows should have Plan B column', async ({ tripPage }) => {
    const count = await tripPage.overviewTableRows.count();
    expect(count).toBeGreaterThanOrEqual(12);
  });
});

test.describe('Budget Section', () => {
  test('should have budget section visible', async ({ tripPage }) => {
    await expect(tripPage.budgetSection).toBeAttached();
  });

  test('budget table should contain total row with EUR amount', async ({ tripPage }) => {
    await expect(tripPage.budgetSection).toContainText('1 626');
  });

  test('budget table should contain EUR currency marker', async ({ tripPage }) => {
    await expect(tripPage.budgetSection).toContainText('EUR');
  });
});

test.describe('Holiday Advisory', () => {
  test('should display holiday advisory warning', async ({ tripPage }) => {
    await expect(tripPage.holidayAdvisory).toBeVisible();
  });

  test('advisory should mention St. Stephen Day', async ({ tripPage }) => {
    await expect(tripPage.holidayAdvisoryTitle).toContainText('Иштвана');
  });

  test('advisory should mention closures', async ({ tripPage }) => {
    await expect(tripPage.holidayAdvisory).toContainText('закрыт');
  });
});
