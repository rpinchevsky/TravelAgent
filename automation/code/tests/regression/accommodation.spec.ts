import * as fs from 'fs';
import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';
import { getManifestPath } from '../utils/trip-folder';

/**
 * Accommodation Integration Tests (TC-200 through TC-216)
 *
 * Accommodation is rendered as a standalone top-level section (#accommodation)
 * placed before day cards in the report.
 *
 * Grouped by concern:
 *   1. Section & card structure (TC-200/201/202/203/205/213/214/215/216)
 *   2. Booking links (TC-204/206)
 *   3. Price level & ordering (TC-207/208)
 *   4. Budget integration (TC-209/210)
 *   5. Manifest schema (TC-211)
 *   6. POI parity exclusion (TC-212)
 *   7. Grid containment (TC-214)
 */

const tripConfig = loadTripConfig();

interface ManifestStay {
  id: string;
  checkin: string;
  checkout: string;
  nights?: number;
  area: string;
  anchor_day: string;
  anchor_day_number: number;
  options_count: number;
  discovery_source: string;
}

function getAccommodationStays(): ManifestStay[] {
  const manifestPath = getManifestPath();
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(raw);
  } catch {
    return [];
  }
  const accommodation = manifest['accommodation'] as Record<string, unknown> | undefined;
  if (!accommodation) return [];
  const stays = accommodation['stays'] as Record<string, unknown>[] | undefined;
  if (!Array.isArray(stays) || stays.length === 0) return [];

  return stays.map((s) => {
    const anchorDay = String(s['anchor_day'] ?? '');
    const match = anchorDay.match(/day_(\d+)/);
    return {
      id: String(s['id'] ?? ''),
      checkin: String(s['checkin'] ?? ''),
      checkout: String(s['checkout'] ?? ''),
      nights: typeof s['nights'] === 'number' ? s['nights'] : undefined,
      area: String(s['area'] ?? ''),
      anchor_day: anchorDay,
      anchor_day_number: match ? parseInt(match[1], 10) : -1,
      options_count: typeof s['options_count'] === 'number' ? s['options_count'] : 0,
      discovery_source: String(s['discovery_source'] ?? ''),
    };
  });
}

const stays = getAccommodationStays();
const activeStays = stays.filter((s) => s.discovery_source !== 'skipped');
const anchorDays = activeStays
  .map((s) => s.anchor_day_number)
  .filter((n) => n >= 0);

// ---- Test Block 1: Section & Card Structure (TC-200/201/202/203/205/213/214/215/216) ----

test.describe('Accommodation — Section & Card Structure', () => {
  test('TC-200+201: accommodation section is a top-level section before day cards', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    const section = tripPage.getAccommodationSection();
    expect.soft(await section.count(), 'Top-level #accommodation section should exist').toBe(1);

    // Verify it is NOT inside any day-card
    const insideDayCard = tripPage.page.locator('.day-card #accommodation');
    expect.soft(await insideDayCard.count(), '#accommodation should NOT be inside a .day-card').toBe(0);

    // Verify no accommodation sections exist inside day cards
    for (let day = 0; day < tripConfig.dayCount; day++) {
      const dayAccom = tripPage.page.locator(`#day-${day} .accommodation-section`);
      expect.soft(await dayAccom.count(), `Day ${day}: should have no accommodation section inside day card`).toBe(0);
    }
  });

  test('TC-202+203+205+213+214+215+216: card count, structure, tags, grid, pro-tips, intro, visual distinction', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    const cards = tripPage.getAccommodationCards();
    const cardCount = await cards.count();

    // Total cards should match sum of all stay options
    const expectedTotal = activeStays.reduce((sum, s) => sum + (s.options_count > 0 ? s.options_count : 0), 0);
    if (expectedTotal > 0) {
      expect.soft(cardCount, `Total accommodation cards (${cardCount}) should match manifest total (${expectedTotal})`).toBe(expectedTotal);
    }
    expect.soft(cardCount, 'Should have at least 2 accommodation cards').toBeGreaterThanOrEqual(2);

    const section = tripPage.getAccommodationSection();

    const grid = section.locator('.accommodation-grid');
    expect.soft(await grid.count(), 'accommodation-grid wrapper should exist').toBeGreaterThanOrEqual(1);

    const intro = section.locator('.accommodation-section__intro');
    expect.soft(await intro.count(), 'accommodation-section__intro should exist').toBeGreaterThanOrEqual(1);
    if (await intro.count() > 0) {
      const introText = await intro.first().textContent();
      expect.soft(introText && introText.trim().length > 0, 'intro paragraph should have non-empty text').toBe(true);
    }

    const sectionHeading = section.locator('h2, .section-title').first();
    if (await sectionHeading.count() > 0) {
      const headingText = await sectionHeading.textContent();
      expect.soft(headingText?.includes('🏨'), 'section heading should contain 🏨 emoji').toBe(true);
    }

    for (let c = 0; c < cardCount; c++) {
      const card = cards.nth(c);
      const label = `Card ${c}`;

      const name = tripPage.getAccommodationCardName(card);
      expect.soft(await name.count(), `${label}: should have .accommodation-card__name`).toBeGreaterThanOrEqual(1);
      if (await name.count() > 0) {
        const nameText = await name.first().textContent();
        expect.soft(nameText && nameText.trim().length > 0, `${label}: name should have non-empty text`).toBe(true);
      }

      const rating = tripPage.getAccommodationCardRating(card);
      expect.soft(await rating.count(), `${label}: should have .accommodation-card__rating`).toBeGreaterThanOrEqual(1);

      const links = tripPage.getAccommodationCardLinks(card);
      expect.soft(await links.count(), `${label}: should have at least one .accommodation-card__link`).toBeGreaterThanOrEqual(1);

      const mapsLink = card.locator('.accommodation-card__link[href*="google.com/maps"], .accommodation-card__link[href*="maps.google"]');
      expect.soft(await mapsLink.count(), `${label}: should have a Google Maps link`).toBeGreaterThanOrEqual(1);

      const cta = tripPage.getAccommodationCardBookingCta(card);
      expect.soft(await cta.count(), `${label}: should have .booking-cta`).toBeGreaterThanOrEqual(1);

      const tag = tripPage.getAccommodationCardTag(card);
      expect.soft(await tag.count(), `${label}: should have .accommodation-card__tag`).toBeGreaterThanOrEqual(1);
      if (await tag.count() > 0) {
        const tagText = await tag.first().textContent();
        expect.soft(tagText?.includes('🏨'), `${label}: tag should contain 🏨 emoji`).toBe(true);
      }

      const proTip = tripPage.getAccommodationCardProTip(card);
      expect.soft(await proTip.count(), `${label}: should have .pro-tip`).toBeGreaterThanOrEqual(1);
      if (await proTip.count() > 0) {
        const tipText = await proTip.first().textContent();
        expect.soft(tipText && tipText.trim().length > 0, `${label}: pro-tip should have non-empty text`).toBe(true);
      }

      const hasPoi = await card.evaluate((el) => el.classList.contains('poi-card'));
      expect.soft(hasPoi, `${label}: accommodation card should NOT have .poi-card class`).toBe(false);
    }
  });
});

// ---- Test Block 2: Booking Links (TC-204/206) ----

test.describe('Accommodation — Booking Links', () => {
  test('TC-204+206: booking CTA link structure and URL parameters', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const cards = tripPage.getAccommodationCards();
    const cardCount = await cards.count();

    for (let c = 0; c < cardCount; c++) {
      const card = cards.nth(c);
      const label = `Card ${c}`;
      const cta = tripPage.getAccommodationCardBookingCta(card);
      if (await cta.count() === 0) continue;

      const ctaEl = cta.first();

      const tagName = await ctaEl.evaluate((el) => el.tagName.toLowerCase());
      expect.soft(tagName, `${label}: booking CTA should be an <a> element`).toBe('a');

      const target = await ctaEl.getAttribute('target');
      expect.soft(target, `${label}: booking CTA should have target="_blank"`).toBe('_blank');

      const rel = await ctaEl.getAttribute('rel');
      expect.soft(rel?.includes('noopener'), `${label}: booking CTA should have rel containing "noopener"`).toBe(true);

      const href = await ctaEl.getAttribute('href');
      expect.soft(href, `${label}: booking CTA should have an href`).toBeTruthy();
      if (!href) continue;

      let url: URL;
      try {
        url = new URL(href);
      } catch {
        expect.soft(false, `${label}: booking CTA href is not a valid URL: ${href}`).toBe(true);
        continue;
      }

      expect.soft(url.hostname, `${label}: domain should be www.booking.com`).toBe('www.booking.com');
      expect.soft(url.pathname.startsWith('/searchresults'), `${label}: path should start with /searchresults`).toBe(true);

      const ss = url.searchParams.get('ss');
      expect.soft(ss && ss.length > 0, `${label}: ss parameter should be non-empty`).toBe(true);

      const checkin = url.searchParams.get('checkin');
      expect.soft(checkin && dateRegex.test(checkin), `${label}: checkin should match YYYY-MM-DD`).toBe(true);

      const checkout = url.searchParams.get('checkout');
      expect.soft(checkout && dateRegex.test(checkout), `${label}: checkout should match YYYY-MM-DD`).toBe(true);

      const groupAdults = url.searchParams.get('group_adults');
      expect.soft(groupAdults && parseInt(groupAdults, 10) > 0, `${label}: group_adults should be a positive integer`).toBe(true);

      const groupChildren = url.searchParams.get('group_children');
      expect.soft(groupChildren !== null, `${label}: group_children parameter should be present`).toBe(true);

      const childCount = parseInt(groupChildren ?? '0', 10);
      if (childCount > 0) {
        const ageParams = url.searchParams.getAll('age');
        expect.soft(ageParams.length, `${label}: age parameter count should equal group_children (${childCount})`).toBe(childCount);
      }
    }
  });
});

// ---- Test Block 3: Price Level & Ordering (TC-207/208) ----

test.describe('Accommodation — Price Level & Ordering', () => {
  test('TC-207+208: price level pip structure and ascending order', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    const cards = tripPage.getAccommodationCards();
    const cardCount = await cards.count();
    const priceLevels: number[] = [];

    for (let c = 0; c < cardCount; c++) {
      const card = cards.nth(c);
      const label = `Card ${c}`;
      const priceLevel = tripPage.getAccommodationCardPriceLevel(card);

      if (await priceLevel.count() === 0) continue;

      const filledPips = priceLevel.locator('.price-pip--filled');
      const emptyPips = priceLevel.locator('.price-pip--empty');
      const filledCount = await filledPips.count();
      const emptyCount = await emptyPips.count();
      const totalPips = filledCount + emptyCount;

      expect.soft(totalPips, `${label}: total pip count should be 4`).toBe(4);
      expect.soft(filledCount, `${label}: filled pip count should be >= 1`).toBeGreaterThanOrEqual(1);
      expect.soft(filledCount, `${label}: filled pip count should be <= 4`).toBeLessThanOrEqual(4);

      priceLevels.push(filledCount);
    }

    for (let i = 1; i < priceLevels.length; i++) {
      expect.soft(
        priceLevels[i] >= priceLevels[i - 1],
        `Cards should be ordered by price level ascending (position ${i - 1}=${priceLevels[i - 1]}, position ${i}=${priceLevels[i]})`
      ).toBe(true);
    }
  });
});

// ---- Test Block 4: Budget Integration (TC-209/210) ----

test.describe('Accommodation — Budget Integration', () => {
  test('TC-209+210: accommodation line in anchor day pricing grid and aggregate budget', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    // Anchor day budget tables still include accommodation cost line items
    for (const day of anchorDays) {
      const pricingGrid = tripPage.getDayPricingTable(day);
      const gridCount = await pricingGrid.count();
      if (gridCount === 0) {
        expect.soft(false, `Day ${day}: pricing grid should exist on anchor day`).toBe(true);
        continue;
      }
      const gridText = await pricingGrid.textContent();
      expect.soft(
        gridText?.includes('🏨'),
        `Day ${day}: pricing grid should have accommodation line item (🏨 marker)`
      ).toBe(true);
    }

    const budgetText = await tripPage.budgetSection.textContent();
    expect.soft(
      budgetText?.includes('🏨'),
      'Aggregate budget should have accommodation category (🏨 marker)'
    ).toBe(true);
  });
});

// ---- Test Block 5: Manifest Schema (TC-211) ----

test.describe('Accommodation — Manifest Schema', () => {
  test('TC-211: manifest accommodation schema validation', async () => {
    const manifestPath = getManifestPath();
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(raw);
    } catch {
      expect(false, `Failed to parse manifest.json at ${manifestPath}`).toBe(true);
      return;
    }

    const accommodation = manifest['accommodation'] as Record<string, unknown> | undefined;
    expect(accommodation, 'manifest should have "accommodation" key').toBeTruthy();
    if (!accommodation) return;

    const manifestStays = accommodation['stays'] as Record<string, unknown>[] | undefined;
    expect(Array.isArray(manifestStays) && manifestStays.length > 0, 'accommodation.stays should be a non-empty array').toBe(true);
    if (!Array.isArray(manifestStays) || manifestStays.length === 0) return;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const stayIdRegex = /^stay_\d+$/;
    const anchorDayRegex = /^day_\d+$/;
    const validSources = ['google_places', 'manual', 'skipped', 'pending'];

    for (let i = 0; i < manifestStays.length; i++) {
      const s = manifestStays[i];
      const label = `Stay ${i}`;

      const id = s['id'];
      expect.soft(typeof id === 'string' && stayIdRegex.test(id), `${label}: id should match stay_N pattern, got "${id}"`).toBe(true);

      const checkin = String(s['checkin'] ?? '');
      expect.soft(dateRegex.test(checkin), `${label}: checkin should be YYYY-MM-DD, got "${checkin}"`).toBe(true);

      const checkout = String(s['checkout'] ?? '');
      expect.soft(dateRegex.test(checkout), `${label}: checkout should be YYYY-MM-DD, got "${checkout}"`).toBe(true);

      if (dateRegex.test(checkin) && dateRegex.test(checkout)) {
        expect.soft(checkout > checkin, `${label}: checkout (${checkout}) should be after checkin (${checkin})`).toBe(true);
      }

      if (typeof s['nights'] === 'number' && dateRegex.test(checkin) && dateRegex.test(checkout)) {
        const expectedNights = Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000);
        expect.soft(s['nights'], `${label}: nights should equal checkout - checkin (${expectedNights})`).toBe(expectedNights);
      }

      const area = s['area'];
      expect.soft(typeof area === 'string' && (area as string).length > 0, `${label}: area should be a non-empty string`).toBe(true);

      const anchorDay = s['anchor_day'];
      expect.soft(typeof anchorDay === 'string' && anchorDayRegex.test(anchorDay as string), `${label}: anchor_day should match day_N, got "${anchorDay}"`).toBe(true);

      const optionsCount = s['options_count'];
      expect.soft(typeof optionsCount === 'number' && Number.isInteger(optionsCount) && (optionsCount as number) >= 0, `${label}: options_count should be integer >= 0, got ${optionsCount}`).toBe(true);

      const source = s['discovery_source'];
      expect.soft(typeof source === 'string' && validSources.includes(source as string), `${label}: discovery_source should be one of ${validSources.join(', ')}, got "${source}"`).toBe(true);
    }

    if (manifestStays.length > 1) {
      const sorted = [...manifestStays].sort((a, b) => String(a['checkin'] ?? '').localeCompare(String(b['checkin'] ?? '')));
      for (let i = 1; i < sorted.length; i++) {
        const prevCheckout = String(sorted[i - 1]['checkout'] ?? '');
        const currCheckin = String(sorted[i]['checkin'] ?? '');
        expect.soft(
          currCheckin >= prevCheckout,
          `Stay ${i - 1} checkout (${prevCheckout}) should not overlap with Stay ${i} checkin (${currCheckin})`
        ).toBe(true);

        expect.soft(
          currCheckin === prevCheckout,
          `Stay ${i - 1} checkout (${prevCheckout}) should be contiguous with Stay ${i} checkin (${currCheckin}) — no gap allowed`
        ).toBe(true);
      }
    }
  });
});

// ---- Test Block 6: POI Parity Exclusion (TC-212) ----

test.describe('Accommodation — POI Parity Exclusion', () => {
  test('TC-212: accommodation cards not counted in POI totals', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    // Accommodation cards are in #accommodation section, completely separate from day cards
    const accommodationCards = tripPage.getAccommodationCards();
    const accomCount = await accommodationCards.count();
    expect.soft(accomCount, 'Should have accommodation cards').toBeGreaterThan(0);

    // Verify no accommodation cards exist inside any day card
    const accomInDays = tripPage.page.locator('.day-card .accommodation-card');
    expect.soft(await accomInDays.count(), 'No accommodation cards should exist inside day cards').toBe(0);
  });
});

// ---- Test Block 7: Grid Containment (TC-214) ----

test.describe('Accommodation — Grid Containment', () => {
  test('TC-214: all accommodation cards are children of accommodation-grid', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    const section = tripPage.getAccommodationSection();
    if (await section.count() === 0) return;

    const cardsInGrid = section.locator('.accommodation-grid .accommodation-card');
    const cardsInSection = section.locator('.accommodation-card');
    const gridCount = await cardsInGrid.count();
    const sectionCount = await cardsInSection.count();

    expect.soft(
      gridCount,
      `All ${sectionCount} accommodation cards should be inside .accommodation-grid (found ${gridCount} in grid)`
    ).toBe(sectionCount);
  });
});
