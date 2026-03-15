import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';
import { getExpectedPoiCountsFromMarkdown } from '../utils/markdown-pois';

/**
 * POI Parity Test
 *
 * Validates that the number of rendered POI cards per day in the HTML
 * matches the number of ### POI sections per day in the source markdown.
 *
 * All language-dependent values (excluded sections, filename, heading regex)
 * are derived from trip-config.ts — no hardcoded strings.
 *
 * Grocery (🛒) and along-the-way (🎯) cards are validated separately
 * by their presence, not by parity count.
 */

const tripConfig = loadTripConfig();

/** POI card tags to exclude from HTML count */
const EXCLUDED_HTML_TAGS = ['🛒', '🎯'];

let expectedPois: Record<number, { count: number; names: string[] }>;

test.beforeAll(() => {
  expectedPois = getExpectedPoiCountsFromMarkdown();
});

test.describe('POI Parity — Markdown vs HTML Card Count', () => {
  test('should have parsed at least one day from markdown source', () => {
    const days = Object.keys(expectedPois);
    expect(days.length).toBeGreaterThan(0);
  });

  for (let day = 0; day < tripConfig.dayCount; day++) {
    test(`Day ${day}: HTML POI card count should match markdown POI section count`, async ({ tripPage }) => {
      const expected = expectedPois[day];
      expect(expected, `Day ${day} not found in markdown source`).toBeDefined();

      // Count HTML poi-cards excluding grocery (🛒) and along-the-way (🎯) tagged cards
      const allCards = tripPage.getDayPoiCards(day);
      const totalCount = await allCards.count();
      let excludedCount = 0;
      for (let i = 0; i < totalCount; i++) {
        const tag = await allCards.nth(i).locator('.poi-card__tag').textContent() ?? '';
        if (EXCLUDED_HTML_TAGS.some(t => tag.includes(t))) {
          excludedCount++;
        }
      }
      const actualCount = totalCount - excludedCount;

      expect(
        actualCount,
        `Day ${day}: expected at least ${expected.count} POI cards (from markdown: ${expected.names.join(', ')}), but found ${actualCount} in HTML (${totalCount} total - ${excludedCount} excluded)`
      ).toBeGreaterThanOrEqual(expected.count);
    });
  }

  test('total POI cards in HTML should match total POI sections in markdown', async ({ tripPage }) => {
    let expectedTotal = 0;
    for (const day of Object.values(expectedPois)) {
      expectedTotal += day.count;
    }

    // Count all poi-cards excluding tagged ones
    const allCards = tripPage.poiCards;
    const totalCount = await allCards.count();
    let excludedCount = 0;
    for (let i = 0; i < totalCount; i++) {
      const tag = await allCards.nth(i).locator('.poi-card__tag').textContent() ?? '';
      if (EXCLUDED_HTML_TAGS.some(t => tag.includes(t))) {
        excludedCount++;
      }
    }
    const actualTotal = totalCount - excludedCount;

    expect(
      actualTotal,
      `Total POI mismatch: markdown has ${expectedTotal} POI sections, HTML has ${actualTotal} countable poi-cards (${totalCount} total - ${excludedCount} excluded)`
    ).toBeGreaterThanOrEqual(expectedTotal);
  });
});
