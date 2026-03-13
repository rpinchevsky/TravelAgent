import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

/**
 * Progression Tests — 2026-03-13_0109 Release
 *
 * Covers changes documented in release_notes.md:
 * - Full trip regeneration with enhanced itinerary
 * - 34 POI cards total (was 23)
 * - Budget total ~1 463 EUR (was ~1 334)
 * - New POIs: Szimpla Kert market, Városligeti Nagyjátszótér, VakVarjú, Magyar Zene Háza,
 *   Fogaskerekű, Libegő, Normafa Delikat, Menza, Ruszwurm, Daubner, Zenélő szökőkút
 * - 12 day sections (unchanged), 14 navigation items (unchanged)
 */

test.describe('Progression — 34 POI Cards Total', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have exactly 34 POI cards total', async () => {
    await expect(tripPage.poiCards).toHaveCount(34);
  });

  test('Day 1 should have 4 POI cards (Palatinus, Kisállatkert, Japánkert, Zenélő szökőkút)', async () => {
    await expect(tripPage.getDayPoiCards(1)).toHaveCount(4);
  });

  test('Day 2 should have 5 POI cards (Állatkert, VakVarjú, Nagycirkusz, Nagyjátszótér, Vajdahunyad)', async () => {
    await expect(tripPage.getDayPoiCards(2)).toHaveCount(5);
  });

  test('Day 3 should have 5 POI cards (Szimpla, Budai Vár, Halászbástya, Labirintus, Ruszwurm)', async () => {
    await expect(tripPage.getDayPoiCards(3)).toHaveCount(5);
  });

  test('Day 6 should have 5 POI cards (Fogaskerekű, Gyermekvasút, Libegő, Normafa, Budakeszi)', async () => {
    await expect(tripPage.getDayPoiCards(6)).toHaveCount(5);
  });

  test('Day 8 should have 4 POI cards (Vasúttörténeti, Miniversum, Zene Háza, Menza)', async () => {
    await expect(tripPage.getDayPoiCards(8)).toHaveCount(4);
  });

  test('Day 10 should have 3 POI cards (Vasmacska, VakVarjú, Daubner)', async () => {
    await expect(tripPage.getDayPoiCards(10)).toHaveCount(3);
  });
});

test.describe('Progression — Updated Budget 1 463 EUR', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('budget should contain updated total of ~1 463 EUR', async () => {
    await expect(tripPage.budgetSection).toContainText('1 463');
  });

  test('budget should NOT contain car rental info', async () => {
    const text = await tripPage.budgetSection.textContent();
    expect(text).not.toContain('автомобил');
  });
});

test.describe('Progression — New POI: Magyar Zene Háza', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 8 should contain Magyar Zene Háza POI card', async () => {
    const day8Pois = tripPage.getDayPoiCards(8);
    const count = await day8Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day8Pois.nth(i)).textContent();
      if (name && name.includes('Zene')) found = true;
    }
    expect(found).toBe(true);
  });
});

test.describe('Progression — New POI: Szimpla Kert Market', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 3 should contain Szimpla Kert POI card', async () => {
    const day3Pois = tripPage.getDayPoiCards(3);
    const count = await day3Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day3Pois.nth(i)).textContent();
      if (name && name.includes('Szimpla')) found = true;
    }
    expect(found).toBe(true);
  });
});

test.describe('Progression — New POI: Fogaskerekű + Libegő', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('Day 6 should contain Fogaskerekű POI card', async () => {
    const day6Pois = tripPage.getDayPoiCards(6);
    const count = await day6Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day6Pois.nth(i)).textContent();
      if (name && name.includes('Fogaskerekű')) found = true;
    }
    expect(found).toBe(true);
  });

  test('Day 6 should contain Libegő POI card', async () => {
    const day6Pois = tripPage.getDayPoiCards(6);
    const count = await day6Pois.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(day6Pois.nth(i)).textContent();
      if (name && name.includes('Libegő')) found = true;
    }
    expect(found).toBe(true);
  });
});
