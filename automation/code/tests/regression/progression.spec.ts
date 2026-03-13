import { test, expect } from '../fixtures/shared-page';

/**
 * Consolidated Progression Tests
 *
 * 2026-03-12_2215: Structural patterns (pricing-grid, advisory classes, overview)
 * 2026-03-13_1830: Arcade expansion (51 POIs, per-day counts, new POI names, budget)
 */

// --- Per-day POI expectations (from 2026-03-13_1830) ---
const EXPECTED_POI_COUNTS: Record<number, number> = {
  0: 1, 1: 5, 2: 5, 3: 5, 4: 5, 5: 5,
  6: 4, 7: 4, 8: 4, 9: 6, 10: 5, 11: 2,
};

// New POIs added in 2026-03-13_1830 release
const NEW_POIS: { day: number; search: string; label: string }[] = [
  { day: 1, search: 'SuperFly', label: 'SuperFly' },
  { day: 2, search: 'Gamerland', label: 'Gamerland' },
  { day: 3, search: 'Elevenpark', label: 'Elevenpark' },
  { day: 4, search: 'Gameroom', label: 'Gameroom' },
  { day: 5, search: 'Labirintus', label: 'Labyrinth' },
  { day: 6, search: 'CyberJump', label: 'CyberJump' },
  { day: 7, search: 'Flipper', label: 'Flippermúzeum' },
  { day: 8, search: 'Játékterem', label: 'Játékterem' },
  { day: 9, search: 'VR', label: 'VR Vidámpark' },
  { day: 10, search: 'Arcade', label: "Let's Go Arcade" },
];

// Legacy POIs that must still be present
const LEGACY_POIS: { day: number; search: string; label: string }[] = [
  { day: 10, search: 'Gelarto', label: 'Gelarto Rosa' },
  { day: 9, search: 'Hősök', label: 'Hősök tere' },
  { day: 8, search: 'Spray', label: 'Aqua Spray Park' },
];

test.describe('Progression — Structural Patterns (per-day)', () => {
  for (let day = 1; day <= 10; day++) {
    test(`Day ${day} should use pricing-grid and advisory--info`, async ({ sharedPage }) => {
      // Pricing grid (not itinerary-table) for costs
      const pricingGrids = sharedPage.locator(`#day-${day} .pricing-grid`);
      expect.soft(await pricingGrids.count(), `Day ${day}: pricing-grid count`).toBeGreaterThanOrEqual(1);

      const pricingCells = sharedPage.locator(`#day-${day} .pricing-grid .pricing-cell`);
      expect.soft(await pricingCells.count(), `Day ${day}: pricing-cell count`).toBeGreaterThanOrEqual(1);

      // Plan B rendered as advisory--info
      const planB = sharedPage.locator(`#day-${day} .advisory.advisory--info`);
      expect.soft(await planB.count(), `Day ${day}: advisory--info count`).toBeGreaterThanOrEqual(1);
    });
  }
});

test.describe('Progression — Global Sections', () => {
  test('holiday advisory should be advisory--warning mentioning St. Stephen', async ({ tripPage }) => {
    await expect.soft(tripPage.holidayAdvisory, 'advisory visible').toBeAttached();
    await expect.soft(tripPage.holidayAdvisory, 'mentions Иштван').toContainText('Иштван');
  });

  test('budget section should contain Итого', async ({ sharedPage }) => {
    const budget = sharedPage.locator('#budget');
    await expect.soft(budget, 'budget attached').toBeAttached();
    await expect.soft(budget, 'contains Итого').toContainText('Итого');
  });

  test('overview should be standalone with itinerary-table', async ({ sharedPage }) => {
    const overview = sharedPage.locator('#overview');
    await expect.soft(overview, 'overview attached').toBeAttached();
    await expect.soft(sharedPage.locator('#overview .day-card'), 'not in day-card').toHaveCount(0);
    await expect.soft(sharedPage.locator('#overview .itinerary-table'), 'has itinerary-table').toBeAttached();
  });
});

test.describe('Progression — 51 POI Cards & Distribution', () => {
  test('should have exactly 51 POI cards total', async ({ tripPage }) => {
    await expect(tripPage.poiCards).toHaveCount(51);
  });

  test('each day should have the expected POI card count', async ({ tripPage }) => {
    for (let day = 0; day <= 11; day++) {
      const actual = await tripPage.getDayPoiCards(day).count();
      expect.soft(actual, `Day ${day}: expected ${EXPECTED_POI_COUNTS[day]} POIs`).toBe(EXPECTED_POI_COUNTS[day]);
    }
  });

  test('budget should contain 1 854 EUR and 703 640 HUF', async ({ tripPage }) => {
    await expect.soft(tripPage.budgetSection, 'EUR total').toContainText('1 854');
    await expect.soft(tripPage.budgetSection, 'HUF total').toContainText('703 640');
  });
});

test.describe('Progression — New & Legacy POI Presence', () => {
  test('all new arcade/indoor POIs should be present', async ({ tripPage }) => {
    for (const poi of NEW_POIS) {
      const pois = tripPage.getDayPoiCards(poi.day);
      const count = await pois.count();
      let found = false;
      for (let i = 0; i < count; i++) {
        const name = await tripPage.getPoiCardName(pois.nth(i)).textContent();
        if (name && name.includes(poi.search)) { found = true; break; }
      }
      expect.soft(found, `Day ${poi.day}: ${poi.label} not found`).toBe(true);
    }
  });

  test('legacy POIs should still be present', async ({ tripPage }) => {
    for (const poi of LEGACY_POIS) {
      const pois = tripPage.getDayPoiCards(poi.day);
      const count = await pois.count();
      let found = false;
      for (let i = 0; i < count; i++) {
        const name = await tripPage.getPoiCardName(pois.nth(i)).textContent();
        if (name && name.includes(poi.search)) { found = true; break; }
      }
      expect.soft(found, `Day ${poi.day}: ${poi.label} not found`).toBe(true);
    }
  });
});
