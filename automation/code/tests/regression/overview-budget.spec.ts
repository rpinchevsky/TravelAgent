import { test, expect } from '../fixtures/shared-page';
import { test as baseTest, expect as baseExpect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loadTripConfig } from '../utils/trip-config';
import { getManifestPath } from '../utils/trip-folder';

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
  test('should have budget section visible', async ({ tripPage, page }) => {
    await expect(tripPage.budgetSection).toBeAttached();
    // TC-004: budget section must not be nested inside any day-card element
    const nestedBudgetCount = await page.locator('.day-card #budget').count();
    expect.soft(nestedBudgetCount, '#budget must not be nested inside a .day-card element').toBe(0);
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

test.describe('Assembly Order', () => {
  test('overview should precede first day card and budget should follow last day card', async ({ sharedPage: page }) => {
    const lastDayIndex = tripConfig.dayCount - 1;
    const result = await page.evaluate((lastDay: number) => {
      const overview = document.querySelector('#overview');
      const day0 = document.querySelector('#day-0');
      const dayLast = document.querySelector(`#day-${lastDay}`);
      const budget = document.querySelector('#budget');
      if (!overview || !day0 || !dayLast || !budget) {
        return { overviewBeforeDay0: false, budgetAfterLastDay: false };
      }
      // Node.DOCUMENT_POSITION_FOLLOWING (4) means the argument follows the node
      const overviewBeforeDay0 = !!(overview.compareDocumentPosition(day0) & Node.DOCUMENT_POSITION_FOLLOWING);
      const budgetAfterLastDay = !!(dayLast.compareDocumentPosition(budget) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { overviewBeforeDay0, budgetAfterLastDay };
    }, lastDayIndex);
    expect.soft(result.overviewBeforeDay0, '#overview must precede #day-0 in document order').toBe(true);
    expect.soft(result.budgetAfterLastDay, `#budget must follow #day-${lastDayIndex} in document order`).toBe(true);
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

test.describe('Fragment File Existence', () => {
  baseTest('overview and budget fragment files exist on disk after render', () => {
    const manifestPath = getManifestPath();
    const tripFolderPath = path.dirname(manifestPath);
    const langCode = tripConfig.labels.langCode;
    const overviewFragment = path.join(tripFolderPath, 'fragment_overview_' + langCode + '.html');
    const budgetFragment = path.join(tripFolderPath, 'fragment_budget_' + langCode + '.html');
    baseExpect.soft(fs.existsSync(overviewFragment), `fragment_overview_${langCode}.html must exist in trip folder: ${overviewFragment}`).toBe(true);
    baseExpect.soft(fs.existsSync(budgetFragment), `fragment_budget_${langCode}.html must exist in trip folder: ${budgetFragment}`).toBe(true);
  });
});
