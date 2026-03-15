import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';
import { getExpectedPoiCountsFromMarkdown } from '../utils/markdown-pois';

/**
 * Consolidated Progression Tests
 *
 * Language-independent: all labels from trip-config.ts,
 * POI data extracted dynamically from markdown.
 */

const tripConfig = loadTripConfig();

test.describe('Progression — Structural Patterns (per-day)', () => {
  // Active days (skip arrival day 0 and departure day last)
  const firstActiveDay = 1;
  const lastActiveDay = tripConfig.dayCount - 2;

  for (let day = firstActiveDay; day <= lastActiveDay; day++) {
    test(`Day ${day} should use pricing-grid and advisory--info`, async ({ sharedPage }) => {
      const pricingGrids = sharedPage.locator(`#day-${day} .pricing-grid`);
      expect.soft(await pricingGrids.count(), `Day ${day}: pricing-grid count`).toBeGreaterThanOrEqual(1);

      const pricingCells = sharedPage.locator(`#day-${day} .pricing-grid .pricing-cell`);
      expect.soft(await pricingCells.count(), `Day ${day}: pricing-cell count`).toBeGreaterThanOrEqual(1);

      // Plan B rendered as advisory--info (config-driven text filter)
      const planB = sharedPage.locator(`#day-${day} .advisory.advisory--info`);
      expect.soft(await planB.count(), `Day ${day}: advisory--info count`).toBeGreaterThanOrEqual(1);
    });
  }
});

test.describe('Progression — Global Sections', () => {
  test('holiday advisory should be present with content', async ({ tripPage }) => {
    await expect.soft(tripPage.holidayAdvisory, 'advisory visible').toBeAttached();
    const text = await tripPage.holidayAdvisory.textContent();
    expect.soft(text!.trim().length, 'advisory has text').toBeGreaterThan(0);
  });

  test('budget section should contain total label', async ({ sharedPage }) => {
    const budget = sharedPage.locator('#budget');
    await expect.soft(budget, 'budget attached').toBeAttached();
    await expect.soft(budget, 'contains total label').toContainText(tripConfig.labels.budgetTotal);
  });

  test('overview should be standalone with itinerary-table', async ({ sharedPage }) => {
    const overview = sharedPage.locator('#overview');
    await expect.soft(overview, 'overview attached').toBeAttached();
    await expect.soft(sharedPage.locator('#overview .day-card'), 'not in day-card').toHaveCount(0);
    await expect.soft(sharedPage.locator('#overview .itinerary-table'), 'has itinerary-table').toBeAttached();
  });
});

test.describe('Progression — POI Cards & Distribution', () => {
  test('should have at least 60 POI cards total', async ({ tripPage }) => {
    const count = await tripPage.poiCards.count();
    expect(count).toBeGreaterThanOrEqual(60);
  });

  test('budget should contain a recognized currency code', async ({ tripPage }) => {
    const text = await tripPage.budgetSection.textContent() ?? '';
    expect.soft(/[A-Z]{3}/.test(text), 'has currency code').toBe(true);
  });
});

test.describe('Progression — Dynamic POI Presence (FB-7)', () => {
  test('each day should have its first POI from markdown rendered as a card', async ({ tripPage }) => {
    const expected = getExpectedPoiCountsFromMarkdown();
    for (const [dayStr, data] of Object.entries(expected)) {
      const day = parseInt(dayStr, 10);
      if (data.names.length === 0) continue;
      // Take first POI name; split on "/" to get first-language portion
      const firstPoiName = data.names[0].split('/')[0].trim();
      // Strip leading emoji
      const cleaned = firstPoiName.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}\uFE0F\u200D\s]+/u, '');
      if (cleaned.length === 0) continue;

      const dayCards = tripPage.getDayPoiCards(day);
      const count = await dayCards.count();
      let found = false;
      for (let i = 0; i < count; i++) {
        const name = await tripPage.getPoiCardName(dayCards.nth(i)).textContent();
        if (name && name.includes(cleaned)) {
          found = true;
          break;
        }
      }
      expect.soft(found, `Day ${day}: first POI "${cleaned}" not found in rendered cards`).toBe(true);
    }
  });
});
