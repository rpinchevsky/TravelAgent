import * as fs from 'fs';
import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';
import { getExpectedPoiCountsFromMarkdown } from '../utils/markdown-pois';
import { getManifestPath } from '../utils/trip-folder';

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
  test('should have POI cards matching markdown count', async ({ tripPage }) => {
    const expected = getExpectedPoiCountsFromMarkdown();
    const expectedTotal = Object.values(expected).reduce((sum, d) => sum + d.count, 0);
    const count = await tripPage.poiCards.count();
    // HTML may include extra tagged cards (🛒 grocery, 🎯 along-the-way) beyond markdown POI sections
    expect(count).toBeGreaterThanOrEqual(expectedTotal);
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
      // Split on "/" to get all language portions, strip emoji from each
      const segments = data.names[0].split('/').map(s =>
        s.trim().replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}\uFE0F\u200D\s]+/u, '').trim()
      ).filter(s => s.length > 0);
      if (segments.length === 0) continue;

      const dayCards = tripPage.getDayPoiCards(day);
      const count = await dayCards.count();
      let found = false;
      for (let i = 0; i < count; i++) {
        const name = await tripPage.getPoiCardName(dayCards.nth(i)).textContent();
        if (name && segments.some(seg => name.includes(seg))) {
          found = true;
          break;
        }
      }
      expect.soft(found, `Day ${day}: first POI "${segments.join(' / ')}" not found in rendered cards`).toBe(true);
    }
  });
});

test.describe('Progression — POI Uniqueness (TC-004)', () => {
  test('no duplicate POI names across different days', async () => {
    const expected = getExpectedPoiCountsFromMarkdown();
    const stripEmoji = (s: string) =>
      s.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}\uFE0F\u200D\s]+/u, '').trim();

    // Collect all POI names with their day number
    const seen = new Map<string, number>();
    const duplicates: string[] = [];

    for (const [dayStr, data] of Object.entries(expected)) {
      const day = parseInt(dayStr, 10);
      for (const rawName of data.names) {
        const cleaned = stripEmoji(rawName.split('/')[0].trim());
        if (cleaned.length === 0) continue;
        if (seen.has(cleaned)) {
          duplicates.push(`"${cleaned}" appears in Day ${seen.get(cleaned)} and Day ${day}`);
        } else {
          seen.set(cleaned, day);
        }
      }
    }

    expect(duplicates, `Duplicate POIs found: ${duplicates.join('; ')}`).toHaveLength(0);
  });
});

test.describe('Progression — Manifest Integrity (TC-005/TC-006)', () => {
  test('all days should have status complete and non-null last_modified', async () => {
    const tripConfig = loadTripConfig();
    const manifestPath = getManifestPath();
    const raw = fs.readFileSync(manifestPath, 'utf-8');

    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(raw);
    } catch {
      throw new Error(`Failed to parse manifest.json at ${manifestPath}: invalid JSON`);
    }

    // Navigate to languages.LANG.days
    const languages = manifest['languages'] as Record<string, Record<string, unknown>> | undefined;
    expect(languages, 'manifest should have "languages" key').toBeTruthy();

    const langKey = tripConfig.labels.langCode;
    const langEntry = languages![langKey] as Record<string, unknown> | undefined;
    expect(langEntry, `manifest should have language entry for "${langKey}"`).toBeTruthy();

    const days = langEntry!['days'] as Record<string, Record<string, unknown>> | undefined;
    expect(days, `manifest.languages.${langKey} should have "days" key`).toBeTruthy();

    for (let i = 0; i < tripConfig.dayCount; i++) {
      const dayKey = `day_${String(i).padStart(2, '0')}`;
      const dayEntry = days![dayKey] || days![`day_${i}`];
      expect.soft(dayEntry, `Day ${i}: entry missing in manifest`).toBeTruthy();
      if (!dayEntry) continue;

      expect.soft(
        dayEntry['status'],
        `Day ${i}: status should be "complete", got "${dayEntry['status']}"`
      ).toBe('complete');

      const lastModified = dayEntry['last_modified'];
      expect.soft(
        lastModified && typeof lastModified === 'string' && lastModified.length > 0,
        `Day ${i}: last_modified should be a non-empty string, got "${lastModified}"`
      ).toBe(true);
    }
  });

  test('manifest should contain trip_details_file field', async () => {
    const manifestPath = getManifestPath();
    const raw = fs.readFileSync(manifestPath, 'utf-8');

    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(raw);
    } catch {
      throw new Error(`Failed to parse manifest.json at ${manifestPath}: invalid JSON`);
    }

    // Hard assert: trip_details_file must exist and be a non-empty string (QF-2)
    // This test assumes the latest trip was generated after the DD changes.
    // If running against a stale manifest, regenerate the trip first.
    const tripDetailsFile = manifest['trip_details_file'];
    expect(
      tripDetailsFile,
      'manifest should have "trip_details_file" field — regenerate trip if missing'
    ).toBeDefined();
    expect(
      typeof tripDetailsFile === 'string' && tripDetailsFile.length > 0,
      `trip_details_file should be a non-empty string, got "${tripDetailsFile}"`
    ).toBe(true);

    // QF-1: Also validate destination is present (REQ-005 AC-2)
    const destination = manifest['destination'];
    expect.soft(
      destination && typeof destination === 'string' && (destination as string).length > 0,
      `manifest "destination" should be a non-empty string, got "${destination}"`
    ).toBe(true);
  });
});

test.describe('Progression — POI Phone, Rating & Accessibility (Google Places)', () => {
  test('TC-153: at least one POI card has a phone link', async ({ tripPage }) => {
    // Structural presence check — at least one tel: link should exist across all POI cards
    const phoneLinks = tripPage.page.locator('.poi-card .poi-card__link[href^="tel:"]');
    const count = await phoneLinks.count();
    expect.soft(count, 'at least one POI card should have a phone link').toBeGreaterThanOrEqual(1);
  });

  test('TC-154: at least one POI card has a rating element', async ({ tripPage }) => {
    // Structural presence check — at least one .poi-card__rating should exist
    const count = await tripPage.poiCardRatings.count();
    expect.soft(count, 'at least one POI card should have a rating element').toBeGreaterThanOrEqual(1);
  });

  test('TC-152: accessible badges, if present, have correct class', async ({ tripPage }) => {
    // If the trip uses wheelchair accessibility, badges should be in card body
    const badges = tripPage.page.locator('.poi-card__accessible');
    const count = await badges.count();
    if (count === 0) return; // No badges — wheelchair may not be active for this trip
    for (let i = 0; i < count; i++) {
      const inBody = await badges.nth(i).evaluate(
        (el) => !!el.closest('.poi-card__body')
      );
      expect.soft(inBody, `Accessible badge ${i}: should be inside .poi-card__body`).toBe(true);
    }
  });
});

test.describe('Progression — Themed Container Contrast Gate (TC-007)', () => {
  test('banner title should have explicit color declaration in inlined style', async ({ tripPage }) => {
    const styleContent = await tripPage.inlineStyle.textContent();
    expect(styleContent, 'inlined <style> block should exist and have content').toBeTruthy();

    // Verify .day-card__banner-title has an explicit color: declaration in CSS
    const titleColorRegex = /\.day-card__banner-title\s*\{[^}]*color\s*:/;
    expect.soft(
      titleColorRegex.test(styleContent!),
      '.day-card__banner-title should have explicit color: in inlined <style>'
    ).toBe(true);

    // Verify .day-card__banner-date has an explicit color: declaration in CSS.
    // If the element is a <span> inheriting from .day-card__banner, this regex
    // may not match — that is acceptable per SA FB-1 option (b). The runtime
    // banner-contrast.spec.ts validates the actual computed color regardless.
    const dateColorRegex = /\.day-card__banner-date\s*\{[^}]*color\s*:/;
    expect.soft(
      dateColorRegex.test(styleContent!),
      '.day-card__banner-date should have explicit color: in inlined <style> (may be exempt if <span> inherits from parent)'
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Accommodation Integration (TC-200 through TC-216)
// ---------------------------------------------------------------------------

/**
 * Manifest accommodation stay reader — inline per QF-7 recommendation.
 * Reads manifest.json → accommodation.stays[] and parses anchor day numbers.
 */
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

test.describe('Progression — Accommodation Integration', () => {
  const stays = getAccommodationStays();
  const anchorDays = stays
    .filter((s) => s.discovery_source !== 'skipped')
    .map((s) => s.anchor_day_number)
    .filter((n) => n >= 0);
  const anchorDaySet = new Set(anchorDays);

  // ---- Test Block 1: Section & Card Structure (TC-200/201/202/203/205/213/214/215/216) ----

  test('TC-200+201: accommodation section present on anchor days, absent on non-anchor days', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    // Anchor days: section must be present
    for (const day of anchorDays) {
      const section = tripPage.getDayAccommodationSection(day);
      expect.soft(await section.count(), `Day ${day}: accommodation section should be present on anchor day`).toBe(1);
    }

    // Non-anchor days: section must be absent
    for (let day = 0; day < tripConfig.dayCount; day++) {
      if (anchorDaySet.has(day)) continue;
      const section = tripPage.getDayAccommodationSection(day);
      expect.soft(await section.count(), `Day ${day}: non-anchor day should have no accommodation section`).toBe(0);
    }
  });

  test('TC-202+203+205+213+214+215+216: card count, structure, tags, grid, pro-tips, intro, visual distinction', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    for (const stay of stays) {
      const day = stay.anchor_day_number;
      if (day < 0 || stay.discovery_source === 'skipped') continue;

      // TC-202: Card count 2-3, cross-validated with manifest options_count (QF-6)
      const cards = tripPage.getDayAccommodationCards(day);
      const cardCount = await cards.count();
      expect.soft(cardCount, `Day ${day}: accommodation card count should be >= 2`).toBeGreaterThanOrEqual(2);
      expect.soft(cardCount, `Day ${day}: accommodation card count should be <= 3`).toBeLessThanOrEqual(3);
      if (stay.options_count > 0) {
        expect.soft(cardCount, `Day ${day}: DOM card count should match manifest options_count (${stay.options_count})`).toBe(stay.options_count);
      }

      // TC-214: Grid wrapper
      const grid = tripPage.getDayAccommodationSection(day).locator('.accommodation-grid');
      expect.soft(await grid.count(), `Day ${day}: accommodation-grid wrapper should exist`).toBe(1);

      // TC-216: Intro paragraph
      const intro = tripPage.getDayAccommodationSection(day).locator('.accommodation-section__intro');
      expect.soft(await intro.count(), `Day ${day}: accommodation-section__intro should exist`).toBeGreaterThanOrEqual(1);
      if (await intro.count() > 0) {
        const introText = await intro.first().textContent();
        expect.soft(introText && introText.trim().length > 0, `Day ${day}: intro paragraph should have non-empty text`).toBe(true);
      }

      // QF-3: Section heading contains hotel emoji
      const sectionHeading = tripPage.getDayAccommodationSection(day).locator('h2, .section-title').first();
      if (await sectionHeading.count() > 0) {
        const headingText = await sectionHeading.textContent();
        expect.soft(headingText?.includes('🏨'), `Day ${day}: section heading should contain 🏨 emoji`).toBe(true);
      }

      // Per-card assertions
      for (let c = 0; c < cardCount; c++) {
        const card = cards.nth(c);
        const label = `Day ${day}, Card ${c}`;

        // TC-203: Structure completeness
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

        // Maps link
        const mapsLink = card.locator('.accommodation-card__link[href*="google.com/maps"], .accommodation-card__link[href*="maps.google"]');
        expect.soft(await mapsLink.count(), `${label}: should have a Google Maps link`).toBeGreaterThanOrEqual(1);

        // Booking CTA
        const cta = tripPage.getAccommodationCardBookingCta(card);
        expect.soft(await cta.count(), `${label}: should have .booking-cta`).toBeGreaterThanOrEqual(1);

        // TC-213: Tag with hotel emoji
        const tag = tripPage.getAccommodationCardTag(card);
        expect.soft(await tag.count(), `${label}: should have .accommodation-card__tag`).toBeGreaterThanOrEqual(1);
        if (await tag.count() > 0) {
          const tagText = await tag.first().textContent();
          expect.soft(tagText?.includes('🏨'), `${label}: tag should contain 🏨 emoji`).toBe(true);
        }

        // TC-215: Pro-tip
        const proTip = tripPage.getAccommodationCardProTip(card);
        expect.soft(await proTip.count(), `${label}: should have .pro-tip`).toBeGreaterThanOrEqual(1);
        if (await proTip.count() > 0) {
          const tipText = await proTip.first().textContent();
          expect.soft(tipText && tipText.trim().length > 0, `${label}: pro-tip should have non-empty text`).toBe(true);
        }

        // TC-205: Visual distinction — no .poi-card class
        const hasPoi = await card.evaluate((el) => el.classList.contains('poi-card'));
        expect.soft(hasPoi, `${label}: accommodation card should NOT have .poi-card class`).toBe(false);
      }
    }
  });

  // ---- Test Block 2: Booking Links (TC-204/206) ----

  test('TC-204+206: booking CTA link structure and URL parameters', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    for (const stay of stays) {
      const day = stay.anchor_day_number;
      if (day < 0 || stay.discovery_source === 'skipped') continue;

      const cards = tripPage.getDayAccommodationCards(day);
      const cardCount = await cards.count();

      for (let c = 0; c < cardCount; c++) {
        const card = cards.nth(c);
        const label = `Day ${day}, Card ${c}`;
        const cta = tripPage.getAccommodationCardBookingCta(card);
        if (await cta.count() === 0) continue;

        const ctaEl = cta.first();

        // TC-206: Semantic link checks
        const tagName = await ctaEl.evaluate((el) => el.tagName.toLowerCase());
        expect.soft(tagName, `${label}: booking CTA should be an <a> element`).toBe('a');

        const target = await ctaEl.getAttribute('target');
        expect.soft(target, `${label}: booking CTA should have target="_blank"`).toBe('_blank');

        const rel = await ctaEl.getAttribute('rel');
        expect.soft(rel?.includes('noopener'), `${label}: booking CTA should have rel containing "noopener"`).toBe(true);

        // TC-204: URL parameter validation
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

        // Cross-validate dates with manifest stay block
        if (checkin && stay.checkin) {
          expect.soft(checkin, `${label}: checkin should match manifest stay checkin (${stay.checkin})`).toBe(stay.checkin);
        }
        if (checkout && stay.checkout) {
          expect.soft(checkout, `${label}: checkout should match manifest stay checkout (${stay.checkout})`).toBe(stay.checkout);
        }

        const groupAdults = url.searchParams.get('group_adults');
        expect.soft(groupAdults && parseInt(groupAdults, 10) > 0, `${label}: group_adults should be a positive integer`).toBe(true);

        const groupChildren = url.searchParams.get('group_children');
        expect.soft(groupChildren !== null, `${label}: group_children parameter should be present`).toBe(true);

        // If children > 0, verify age parameters
        const childCount = parseInt(groupChildren ?? '0', 10);
        if (childCount > 0) {
          const ageParams = url.searchParams.getAll('age');
          expect.soft(ageParams.length, `${label}: age parameter count should equal group_children (${childCount})`).toBe(childCount);
        }
      }
    }
  });

  // ---- Test Block 3: Price Level & Ordering (TC-207/208) ----

  test('TC-207+208: price level pip structure and ascending order', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    for (const stay of stays) {
      const day = stay.anchor_day_number;
      if (day < 0 || stay.discovery_source === 'skipped') continue;

      const cards = tripPage.getDayAccommodationCards(day);
      const cardCount = await cards.count();
      const priceLevels: number[] = [];

      for (let c = 0; c < cardCount; c++) {
        const card = cards.nth(c);
        const label = `Day ${day}, Card ${c}`;
        const priceLevel = tripPage.getAccommodationCardPriceLevel(card);

        if (await priceLevel.count() === 0) continue;

        // TC-207: Pip structure
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

      // TC-208: Ascending order
      for (let i = 1; i < priceLevels.length; i++) {
        expect.soft(
          priceLevels[i] >= priceLevels[i - 1],
          `Day ${day}: cards should be ordered by price level ascending (position ${i - 1}=${priceLevels[i - 1]}, position ${i}=${priceLevels[i]})`
        ).toBe(true);
      }
    }
  });

  // ---- Test Block 4: Budget Integration (TC-209/210) ----

  test('TC-209+210: accommodation line in anchor day pricing grid and aggregate budget', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    // TC-209: Anchor day pricing grid has accommodation line item
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

    // TC-210: Aggregate budget section has accommodation category
    const budgetText = await tripPage.budgetSection.textContent();
    expect.soft(
      budgetText?.includes('🏨'),
      'Aggregate budget should have accommodation category (🏨 marker)'
    ).toBe(true);
  });

  // ---- Test Block 5: Manifest Schema (TC-211) ----

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

      // id
      const id = s['id'];
      expect.soft(typeof id === 'string' && stayIdRegex.test(id), `${label}: id should match stay_N pattern, got "${id}"`).toBe(true);

      // checkin
      const checkin = String(s['checkin'] ?? '');
      expect.soft(dateRegex.test(checkin), `${label}: checkin should be YYYY-MM-DD, got "${checkin}"`).toBe(true);

      // checkout
      const checkout = String(s['checkout'] ?? '');
      expect.soft(dateRegex.test(checkout), `${label}: checkout should be YYYY-MM-DD, got "${checkout}"`).toBe(true);

      // checkout > checkin
      if (dateRegex.test(checkin) && dateRegex.test(checkout)) {
        expect.soft(checkout > checkin, `${label}: checkout (${checkout}) should be after checkin (${checkin})`).toBe(true);
      }

      // nights cross-validation
      if (typeof s['nights'] === 'number' && dateRegex.test(checkin) && dateRegex.test(checkout)) {
        const expectedNights = Math.round((new Date(checkout).getTime() - new Date(checkin).getTime()) / 86400000);
        expect.soft(s['nights'], `${label}: nights should equal checkout - checkin (${expectedNights})`).toBe(expectedNights);
      }

      // area
      const area = s['area'];
      expect.soft(typeof area === 'string' && (area as string).length > 0, `${label}: area should be a non-empty string`).toBe(true);

      // anchor_day
      const anchorDay = s['anchor_day'];
      expect.soft(typeof anchorDay === 'string' && anchorDayRegex.test(anchorDay as string), `${label}: anchor_day should match day_N, got "${anchorDay}"`).toBe(true);

      // options_count
      const optionsCount = s['options_count'];
      expect.soft(typeof optionsCount === 'number' && Number.isInteger(optionsCount) && (optionsCount as number) >= 0, `${label}: options_count should be integer >= 0, got ${optionsCount}`).toBe(true);

      // discovery_source
      const source = s['discovery_source'];
      expect.soft(typeof source === 'string' && validSources.includes(source as string), `${label}: discovery_source should be one of ${validSources.join(', ')}, got "${source}"`).toBe(true);
    }

    // Non-overlapping dates (REQ-008 AC-5)
    if (manifestStays.length > 1) {
      const sorted = [...manifestStays].sort((a, b) => String(a['checkin'] ?? '').localeCompare(String(b['checkin'] ?? '')));
      for (let i = 1; i < sorted.length; i++) {
        const prevCheckout = String(sorted[i - 1]['checkout'] ?? '');
        const currCheckin = String(sorted[i]['checkin'] ?? '');
        expect.soft(
          currCheckin >= prevCheckout,
          `Stay ${i - 1} checkout (${prevCheckout}) should not overlap with Stay ${i} checkin (${currCheckin})`
        ).toBe(true);

        // QF-1: Contiguous night coverage — no gaps between stays
        expect.soft(
          currCheckin === prevCheckout,
          `Stay ${i - 1} checkout (${prevCheckout}) should be contiguous with Stay ${i} checkin (${currCheckin}) — no gap allowed`
        ).toBe(true);
      }
    }
  });

  // ---- Test Block 6: POI Parity Exclusion (TC-212) ----

  test('TC-212: accommodation cards not counted in POI totals', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    // QF-2: Class exclusion already covered by TC-205 in Test Block 1.
    // This test focuses solely on POI count parity (its unique value).
    const expected = getExpectedPoiCountsFromMarkdown();

    for (const day of anchorDays) {
      if (!expected[day]) continue;

      const poiCount = await tripPage.getDayPoiCards(day).count();
      const accommodationCount = await tripPage.getDayAccommodationCards(day).count();

      // Accommodation cards should be separate from POI cards
      expect.soft(accommodationCount, `Day ${day}: should have accommodation cards on anchor day`).toBeGreaterThan(0);

      // POI count from markdown (which now excludes 🏨 headings) should match rendered .poi-card count
      // HTML may include extra tagged cards (grocery, along-the-way), so >= is the correct check
      expect.soft(
        poiCount,
        `Day ${day}: POI card count (${poiCount}) should be >= markdown POI count (${expected[day].count})`
      ).toBeGreaterThanOrEqual(expected[day].count);
    }
  });

  // ---- Test Block 7: Responsive Grid (TC-214 structural) ----
  // Note: TC-214 grid wrapper check is included in Test Block 1 above.
  // This block validates that all cards within a section are children of the grid.

  test('TC-214: all accommodation cards are children of accommodation-grid', async ({ tripPage }) => {
    test.skip(stays.length === 0, 'No accommodation.stays in manifest — trip may predate accommodation feature');

    for (const day of anchorDays) {
      const section = tripPage.getDayAccommodationSection(day);
      if (await section.count() === 0) continue;

      const cardsInGrid = section.locator('.accommodation-grid .accommodation-card');
      const cardsInSection = section.locator('.accommodation-card');
      const gridCount = await cardsInGrid.count();
      const sectionCount = await cardsInSection.count();

      expect.soft(
        gridCount,
        `Day ${day}: all ${sectionCount} accommodation cards should be inside .accommodation-grid (found ${gridCount} in grid)`
      ).toBe(sectionCount);
    }
  });
});
