import * as fs from 'fs';
import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';
import { getExpectedPoiCountsFromMarkdown } from '../utils/markdown-pois';
import { getManifestPath } from '../utils/trip-folder';

/**
 * Progression Tests — Unique validations only
 *
 * Tests that exist ONLY here (not duplicated in other spec files):
 * - Per-day structural patterns (pricing-grid, advisory) — sampled
 * - Dynamic POI presence from markdown (FB-7)
 * - POI uniqueness across days (TC-004)
 * - Manifest integrity (TC-005/TC-006)
 * - Themed container contrast CSS gate (TC-007)
 *
 * Removed duplicates (canonical home in parentheses):
 * - POI count vs markdown → poi-parity.spec.ts
 * - Budget total/currency → overview-budget.spec.ts
 * - Holiday advisory → overview-budget.spec.ts
 * - Overview standalone → structure.spec.ts
 * - Phone/rating/accessibility presence → poi-cards.spec.ts
 * - Accommodation integration → accommodation.spec.ts
 */

const tripConfig = loadTripConfig();

test.describe('Progression — Structural Patterns (sampled days)', () => {
  const firstActiveDay = 1;
  const lastActiveDay = tripConfig.dayCount - 2;
  const midActiveDay = Math.floor((firstActiveDay + lastActiveDay) / 2);
  // Sample first, middle, last active day — systemic issues appear on any day
  const sampleDays = [...new Set([firstActiveDay, midActiveDay, lastActiveDay])];

  for (const day of sampleDays) {
    test(`Day ${day} should use pricing-grid and advisory--info`, async ({ sharedPage }) => {
      const pricingGrids = sharedPage.locator(`#day-${day} .pricing-grid`);
      expect.soft(await pricingGrids.count(), `Day ${day}: pricing-grid count`).toBeGreaterThanOrEqual(1);

      const pricingCells = sharedPage.locator(`#day-${day} .pricing-grid .pricing-cell`);
      expect.soft(await pricingCells.count(), `Day ${day}: pricing-cell count`).toBeGreaterThanOrEqual(1);

      const planB = sharedPage.locator(`#day-${day} .advisory.advisory--info`);
      expect.soft(await planB.count(), `Day ${day}: advisory--info count`).toBeGreaterThanOrEqual(1);
    });
  }
});

test.describe('Progression — Dynamic POI Presence (FB-7)', () => {
  test('each day should have its first POI from markdown rendered as a card', async ({ tripPage }) => {
    const expected = getExpectedPoiCountsFromMarkdown();
    for (const [dayStr, data] of Object.entries(expected)) {
      const day = parseInt(dayStr, 10);
      if (data.names.length === 0) continue;
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

    const tripDetailsFile = manifest['trip_details_file'];
    expect(
      tripDetailsFile,
      'manifest should have "trip_details_file" field — regenerate trip if missing'
    ).toBeDefined();
    expect(
      typeof tripDetailsFile === 'string' && tripDetailsFile.length > 0,
      `trip_details_file should be a non-empty string, got "${tripDetailsFile}"`
    ).toBe(true);

    const destination = manifest['destination'];
    expect.soft(
      destination && typeof destination === 'string' && (destination as string).length > 0,
      `manifest "destination" should be a non-empty string, got "${destination}"`
    ).toBe(true);
  });
});

test.describe('Progression — Themed Container Contrast Gate (TC-007)', () => {
  test('banner title should have explicit color declaration in inlined style', async ({ tripPage }) => {
    const styleContent = await tripPage.inlineStyle.textContent();
    expect(styleContent, 'inlined <style> block should exist and have content').toBeTruthy();

    const titleColorRegex = /\.day-card__banner-title\s*\{[^}]*color\s*:/;
    expect.soft(
      titleColorRegex.test(styleContent!),
      '.day-card__banner-title should have explicit color: in inlined <style>'
    ).toBe(true);

    const dateColorRegex = /\.day-card__banner-date\s*\{[^}]*color\s*:/;
    expect.soft(
      dateColorRegex.test(styleContent!),
      '.day-card__banner-date should have explicit color: in inlined <style> (may be exempt if <span> inherits from parent)'
    ).toBe(true);
  });
});
