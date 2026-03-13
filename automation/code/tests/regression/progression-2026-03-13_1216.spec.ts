import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

/**
 * Progression Tests — 2026-03-13_1216 Release
 *
 * Covers changes documented in release_notes.md:
 * - Full trip regeneration with revised itinerary
 * - 28 POI cards total (was 34)
 * - Budget total ~1 527 EUR (was ~1 463)
 * - POI distribution: Day 0:0, 1:3, 2:4, 3:4, 4:5, 5:2, 6:2, 7:2, 8:1, 9:2, 10:3, 11:0
 * - New POIs: House of Houdini, Riso Ristorante, Zugligeti Libego, Anna-reti Jatszóter
 * - Removed POIs from previous release: Zenelo szokokut (moved to Margitsziget variant),
 *   Varosligeti Nagyjatszóter, Szimpla Kert, Ruszwurm, Fogaskereku, Normafa Delikat, etc.
 * - 12 day sections (unchanged), 14 navigation items (unchanged)
 */

test.describe('Progression — 28 POI Cards Total', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have exactly 28 POI cards total', async () => {
    await expect(tripPage.poiCards).toHaveCount(28);
  });

  test('Day 1 should have 3 POI cards (Palatinus, Szokokut, Jatszóter)', async () => {
    await expect(tripPage.getDayPoiCards(1)).toHaveCount(3);
  });

  test('Day 2 should have 4 POI cards (Allatkert, VakVarju, Nagycirkusz, Vajdahunyad)', async () => {
    await expect(tripPage.getDayPoiCards(2)).toHaveCount(4);
  });

  test('Day 3 should have 4 POI cards (Halaszbastya, Houdini, Riso, Dunai Hajo)', async () => {
    await expect(tripPage.getDayPoiCards(3)).toHaveCount(4);
  });

  test('Day 4 should have 5 POI cards (Libego, Gyermekvasut, Normafa, Anna-reti, IDE)', async () => {
    await expect(tripPage.getDayPoiCards(4)).toHaveCount(5);
  });

  test('Day 5 should have 2 POI cards (Medveotthon, Pastrami)', async () => {
    await expect(tripPage.getDayPoiCards(5)).toHaveCount(2);
  });

  test('Day 6 should have 2 POI cards (Tropicarium, Flippermuzeum)', async () => {
    await expect(tripPage.getDayPoiCards(6)).toHaveCount(2);
  });

  test('Day 7 should have 2 POI cards (Vasarcsarnok, Miniversum)', async () => {
    await expect(tripPage.getDayPoiCards(7)).toHaveCount(2);
  });

  test('Day 8 should have 1 POI card (Aquaworld)', async () => {
    await expect(tripPage.getDayPoiCards(8)).toHaveCount(1);
  });

  test('Day 9 should have 2 POI cards (Kolodko, Shopping)', async () => {
    await expect(tripPage.getDayPoiCards(9)).toHaveCount(2);
  });

  test('Day 10 should have 3 POI cards (Arcade, VakVarju Buda, Allatkert revisit)', async () => {
    await expect(tripPage.getDayPoiCards(10)).toHaveCount(3);
  });

  test('Day 0 and Day 11 should have 0 POI cards', async () => {
    await expect(tripPage.getDayPoiCards(0)).toHaveCount(0);
    await expect(tripPage.getDayPoiCards(11)).toHaveCount(0);
  });
});

test.describe('Progression — Updated Budget 1 527 EUR', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('budget should contain updated total of ~1 527 EUR', async () => {
    await expect(tripPage.budgetSection).toContainText('1 527');
  });

  test('budget should contain HUF amounts', async () => {
    await expect(tripPage.budgetSection).toContainText('607 200');
  });
});

test.describe('Progression — New POI: House of Houdini', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 3 should contain House of Houdini POI card', async () => {
    const day3Pois = tripPage.getDayPoiCards(3);
    const count = await day3Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day3Pois.nth(i)).textContent();
      if (name && name.includes('Houdini')) found = true;
    }
    expect(found).toBe(true);
  });
});

test.describe('Progression — New POI: Zugligeti Libego on Day 4', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 4 should contain Zugligeti Libego POI card', async () => {
    const day4Pois = tripPage.getDayPoiCards(4);
    const count = await day4Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day4Pois.nth(i)).textContent();
      if (name && name.includes('Libeg')) found = true;
    }
    expect(found).toBe(true);
  });
});

test.describe('Progression — Medveotthon (Bear Sanctuary) on Day 5', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 5 should contain Medveotthon POI card', async () => {
    const day5Pois = tripPage.getDayPoiCards(5);
    const count = await day5Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day5Pois.nth(i)).textContent();
      if (name && name.includes('Medveotthon')) found = true;
    }
    expect(found).toBe(true);
  });
});

test.describe('Progression — Let\'s Go Arcade on Day 10', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 10 should contain Let\'s Go Arcade POI card', async () => {
    const day10Pois = tripPage.getDayPoiCards(10);
    const count = await day10Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day10Pois.nth(i)).textContent();
      if (name && name.includes('Arcade')) found = true;
    }
    expect(found).toBe(true);
  });
});
