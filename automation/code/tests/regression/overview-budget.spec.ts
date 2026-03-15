import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';

const tripConfig = loadTripConfig();

/** Generate date strings in DD.MM format from trip dates. */
function getOverviewDates(): string[] {
  const dates: string[] = [];
  const msPerDay = 86400000;
  for (let i = 0; i < tripConfig.dayCount; i++) {
    const d = new Date(tripConfig.arrivalDate.getTime() + i * msPerDay);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    dates.push(`${dd}.${mm}`);
  }
  return dates;
}

test.describe('Overview Table', () => {
  test('should have overview table with correct number of data rows', async ({ tripPage }) => {
    await expect(tripPage.overviewTableRows).toHaveCount(tripConfig.dayCount);
  });

  test('overview table should contain arrival row', async ({ tripPage }) => {
    const dates = getOverviewDates();
    await expect(tripPage.overviewTableRows.first()).toContainText(dates[0]);
  });

  test('overview table should contain all day date rows', async ({ tripPage }) => {
    const dates = getOverviewDates();
    for (const date of dates) {
      const cell = tripPage.overviewTable.locator('td').filter({ hasText: date });
      await expect(cell).toBeAttached();
    }
  });

  test('all overview rows should have Plan B column', async ({ tripPage }) => {
    const count = await tripPage.overviewTableRows.count();
    expect(count).toBeGreaterThanOrEqual(tripConfig.dayCount);
  });
});

test.describe('Budget Section', () => {
  test('should have budget section visible', async ({ tripPage }) => {
    await expect(tripPage.budgetSection).toBeAttached();
  });

  test('budget table should contain total label', async ({ tripPage }) => {
    await expect(tripPage.budgetSection).toContainText(tripConfig.labels.budgetTotal);
  });

  test('budget table should contain a recognized currency code', async ({ tripPage }) => {
    const text = await tripPage.budgetSection.textContent() ?? '';
    const hasCurrency = /[A-Z]{3}/.test(text);
    expect(hasCurrency, 'Budget section should contain a 3-letter currency code (e.g., EUR, HUF, USD)').toBe(true);
  });
});

test.describe('Holiday Advisory', () => {
  test('should display holiday advisory warning', async ({ tripPage }) => {
    await expect(tripPage.holidayAdvisory).toBeVisible();
  });

  test('advisory should have a non-empty title', async ({ tripPage }) => {
    await expect(tripPage.holidayAdvisoryTitle).toBeVisible();
    const text = await tripPage.holidayAdvisoryTitle.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('advisory should have body content', async ({ tripPage }) => {
    const body = tripPage.holidayAdvisory.locator('.advisory__body');
    await expect(body).toBeVisible();
    const text = await body.textContent();
    expect(text!.trim().length).toBeGreaterThan(0);
  });
});
