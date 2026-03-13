import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

/**
 * Progression Tests — 2026-03-13_1557 Release
 *
 * Covers changes documented in release_notes.md:
 * - Full trip regeneration with expanded itinerary
 * - 41 POI cards total (was 28)
 * - Budget total ~1 572 EUR / ~596 140 HUF (was ~1 527 EUR)
 * - POI distribution: Day 0:1, 1:4, 2:4, 3:4, 4:4, 5:4, 6:3, 7:3, 8:3, 9:5, 10:4, 11:2
 * - All 12 days now have POI cards (Day 0 and Day 11 now included)
 * - New POIs: Campona, Aqua Spray Park, Gelarto Rosa, Aran Bakery, Hősök tere, etc.
 * - 12 day sections (unchanged), 14 navigation items (unchanged)
 */

test.describe('Progression — 41 POI Cards Total', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have exactly 41 POI cards total', async () => {
    await expect(tripPage.poiCards).toHaveCount(41);
  });

  test('Day 0 should have 1 POI card (Airport)', async () => {
    await expect(tripPage.getDayPoiCards(0)).toHaveCount(1);
  });

  test('Day 1 should have 4 POI cards (Palatinus, Mini Zoo, Playground, Lunch)', async () => {
    await expect(tripPage.getDayPoiCards(1)).toHaveCount(4);
  });

  test('Day 2 should have 4 POI cards (Zoo, Circus, Vajdahunyad, Cafe)', async () => {
    await expect(tripPage.getDayPoiCards(2)).toHaveCount(4);
  });

  test('Day 3 should have 4 POI cards (Gyermekvasut, Libego, Normafa, VakVarju)', async () => {
    await expect(tripPage.getDayPoiCards(3)).toHaveCount(4);
  });

  test('Day 4 should have 4 POI cards (Miniversum, Market, Arcade, extra)', async () => {
    await expect(tripPage.getDayPoiCards(4)).toHaveCount(4);
  });

  test('Day 5 should have 4 POI cards (Halaszbastya, Varnegyed, Cruise, extra)', async () => {
    await expect(tripPage.getDayPoiCards(5)).toHaveCount(4);
  });

  test('Day 6 should have 3 POI cards (Tropicarium, Campona, extra)', async () => {
    await expect(tripPage.getDayPoiCards(6)).toHaveCount(3);
  });

  test('Day 7 should have 3 POI cards (Csodak Palotaja, Railway Museum, extra)', async () => {
    await expect(tripPage.getDayPoiCards(7)).toHaveCount(3);
  });

  test('Day 8 should have 3 POI cards (Aquaworld, Aqua Spray, extra)', async () => {
    await expect(tripPage.getDayPoiCards(8)).toHaveCount(3);
  });

  test('Day 9 should have 5 POI cards (Playground, Lake, Andrassy, Heroes Square, extra)', async () => {
    await expect(tripPage.getDayPoiCards(9)).toHaveCount(5);
  });

  test('Day 10 should have 4 POI cards (Palatinus, Riso, Mini Zoo, Gelarto)', async () => {
    await expect(tripPage.getDayPoiCards(10)).toHaveCount(4);
  });

  test('Day 11 should have 2 POI cards (Airport, Aran Bakery)', async () => {
    await expect(tripPage.getDayPoiCards(11)).toHaveCount(2);
  });
});

test.describe('Progression — Updated Budget 1 572 EUR', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('budget should contain updated total of ~1 572 EUR', async () => {
    await expect(tripPage.budgetSection).toContainText('1 572');
  });

  test('budget should contain HUF total of 596 140', async () => {
    await expect(tripPage.budgetSection).toContainText('596 140');
  });
});

test.describe('Progression — Day 0 and Day 11 Now Have POI Cards', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 0 should contain Airport POI card', async () => {
    const day0Pois = tripPage.getDayPoiCards(0);
    const count = await day0Pois.count();
    expect(count).toBeGreaterThanOrEqual(1);
    const name = await tripPage.getPoiCardName(day0Pois.first()).textContent();
    expect(name).toContain('Repülőtér');
  });

  test('Day 11 should contain Airport departure POI card', async () => {
    const day11Pois = tripPage.getDayPoiCards(11);
    const count = await day11Pois.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

test.describe('Progression — New POI: Gelarto Rosa on Day 10', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 10 should contain Gelarto Rosa POI card', async () => {
    const day10Pois = tripPage.getDayPoiCards(10);
    const count = await day10Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day10Pois.nth(i)).textContent();
      if (name && name.includes('Gelarto')) found = true;
    }
    expect(found).toBe(true);
  });
});

test.describe('Progression — New POI: Hősök tere on Day 9', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 9 should contain Hősök tere (Heroes Square) POI card', async () => {
    const day9Pois = tripPage.getDayPoiCards(9);
    const count = await day9Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day9Pois.nth(i)).textContent();
      if (name && name.includes('Hősök')) found = true;
    }
    expect(found).toBe(true);
  });
});

test.describe('Progression — New POI: Aqua Spray Park on Day 8', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 8 should contain Aqua Spray Park POI card', async () => {
    const day8Pois = tripPage.getDayPoiCards(8);
    const count = await day8Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day8Pois.nth(i)).textContent();
      if (name && name.includes('Spray')) found = true;
    }
    expect(found).toBe(true);
  });
});

test.describe('Progression — Campona on Day 6', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 6 should contain Campona POI card', async () => {
    const day6Pois = tripPage.getDayPoiCards(6);
    const count = await day6Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day6Pois.nth(i)).textContent();
      if (name && name.includes('Campona')) found = true;
    }
    expect(found).toBe(true);
  });
});
