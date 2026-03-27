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
