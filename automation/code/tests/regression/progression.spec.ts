import { test, expect } from '../fixtures/shared-page';

/**
 * Consolidated Progression Tests
 *
 * 2026-03-14_1745: Full regeneration — 86 POIs, 12 days, 627 550 HUF / 1 626 EUR
 *   New itinerary with Bear Farm, Children's Railway, expanded POI coverage,
 *   grocery stores, along-the-way stops, and Plan B alternatives.
 */

// --- Per-day POI expectations (from 2026-03-14_1745) ---
// Counting: all ### sections that are NOT Расписание/Стоимость/🅱️ heading
// Including: main POIs, restaurants, grocery stores, along-the-way stops, Plan B POIs
const EXPECTED_POI_COUNTS: Record<number, number> = {
  0: 3, 1: 8, 2: 8, 3: 10, 4: 7, 5: 9,
  6: 7, 7: 8, 8: 8, 9: 7, 10: 7, 11: 4,
};

// Notable POIs in 2026-03-14_1745 release
const NOTABLE_POIS: { day: number; search: string; label: string }[] = [
  { day: 1, search: 'Palatinus', label: 'Palatinus Strand' },
  { day: 2, search: 'Állat', label: 'Будапештский зоопарк' },
  { day: 3, search: 'Halászbástya', label: 'Рыбацкий бастион' },
  { day: 3, search: 'Ruszwurm', label: 'Кондитерская Русвурм' },
  { day: 4, search: 'Aquaworld', label: 'Aquaworld Budapest' },
  { day: 5, search: 'Gyermekvasút', label: 'Детская железная дорога' },
  { day: 5, search: 'Budakeszi', label: 'Будакеси Вадашпарк' },
  { day: 6, search: 'Medveotthon', label: 'Медвежья ферма' },
  { day: 7, search: 'Nagycirkusz', label: 'Столичный цирк' },
  { day: 7, search: 'Miniversum', label: 'Миниверсум' },
  { day: 8, search: 'Nagyvásárcsarnok', label: 'Центральный рынок' },
  { day: 9, search: 'Vasúttörténeti', label: 'Ж/д музей' },
  { day: 9, search: 'Tropicarium', label: 'Тропикариум' },
  { day: 10, search: 'Csodák', label: 'Дворец чудес' },
  { day: 10, search: 'Premier', label: 'Premier Outlet' },
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
    await expect.soft(budget, 'contains Итого').toContainText('ИТОГО');
  });

  test('overview should be standalone with itinerary-table', async ({ sharedPage }) => {
    const overview = sharedPage.locator('#overview');
    await expect.soft(overview, 'overview attached').toBeAttached();
    await expect.soft(sharedPage.locator('#overview .day-card'), 'not in day-card').toHaveCount(0);
    await expect.soft(sharedPage.locator('#overview .itinerary-table'), 'has itinerary-table').toBeAttached();
  });
});

test.describe('Progression — 86 POI Cards & Distribution', () => {
  test('should have at least 80 POI cards total', async ({ tripPage }) => {
    const count = await tripPage.poiCards.count();
    expect(count).toBeGreaterThanOrEqual(80);
  });

  test('each day should have the expected POI card count', async ({ tripPage }) => {
    for (let day = 0; day <= 11; day++) {
      const actual = await tripPage.getDayPoiCards(day).count();
      expect.soft(actual, `Day ${day}: expected ${EXPECTED_POI_COUNTS[day]} POIs`).toBe(EXPECTED_POI_COUNTS[day]);
    }
  });

  test('budget should contain 1 626 EUR and 627 550 HUF', async ({ tripPage }) => {
    await expect.soft(tripPage.budgetSection, 'EUR total').toContainText('1 626');
    await expect.soft(tripPage.budgetSection, 'HUF total').toContainText('627 550');
  });
});

test.describe('Progression — Notable POI Presence', () => {
  test('all notable POIs should be present', async ({ tripPage }) => {
    for (const poi of NOTABLE_POIS) {
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
