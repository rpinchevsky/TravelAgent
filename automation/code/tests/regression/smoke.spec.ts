import { test, expect } from '../fixtures/shared-page';
import { test as baseTest, expect as baseExpect } from '@playwright/test';
import * as fs from 'fs';
import { loadTripConfig } from '../utils/trip-config';
import { getManifestPath } from '../utils/trip-folder';

/**
 * Smoke Tests — Critical Structural Validation
 *
 * Fast-pass checks that verify the trip HTML rendered correctly
 * without exhaustive per-POI or per-day validation. Designed to
 * run after trip generation (known flow) where no rules/features
 * changed — catches rendering breakages, not content issues.
 *
 * Full regression (all spec files) runs after feature/rule changes
 * via the dev process pipeline.
 */

const tripConfig = loadTripConfig();

test.describe('Smoke — Page Load & Sections', () => {
  test('page loads with correct title', async ({ sharedPage }) => {
    await expect(sharedPage).toHaveTitle(tripConfig.pageTitle);
  });

  test('all major sections exist (overview, days, budget)', async ({ tripPage }) => {
    await expect.soft(tripPage.overviewSection, 'overview section').toBeAttached();
    await expect.soft(tripPage.budgetSection, 'budget section').toBeAttached();
    await expect.soft(tripPage.daySections, 'day section count').toHaveCount(tripConfig.dayCount);
  });

  test('correct lang attribute on html element', async ({ sharedPage }) => {
    const lang = await sharedPage.locator('html').getAttribute('lang');
    expect(lang).toBe(tripConfig.labels.langCode);
  });

  test('CSS is inlined (no external stylesheet)', async ({ tripPage, sharedPage }) => {
    await expect(tripPage.inlineStyle, 'inline <style> tag').toBeAttached();
    const externalCss = sharedPage.locator('link[href*="rendering_style_config"]');
    await expect(externalCss).toHaveCount(0);
  });
});

test.describe('Smoke — Navigation', () => {
  test('sidebar and mobile nav link counts match section count', async ({ tripPage }) => {
    const manifestPath = getManifestPath();
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const hasAccommodation = (manifest.accommodation?.stays?.length ?? 0) > 0;
    const hasCarRental = (manifest.car_rental?.blocks?.length ?? 0) > 0;
    const optionalSections = (hasAccommodation ? 1 : 0) + (hasCarRental ? 1 : 0);
    const expectedCount = tripConfig.dayCount + 2 + optionalSections; // overview + optional(accommodation, car-rental) + days + budget
    await expect.soft(tripPage.sidebarLinks, 'sidebar link count').toHaveCount(expectedCount);
    await expect.soft(tripPage.mobilePills, 'mobile pill count').toHaveCount(expectedCount);
  });
});

test.describe('Smoke — Day Content (sampled)', () => {
  const sampleDays = [...new Set([0, 1, tripConfig.dayCount - 1])];

  test('sampled days have banner, itinerary table, and POI cards', async ({ tripPage }) => {
    for (const day of sampleDays) {
      const banner = tripPage.getDayBannerTitle(day);
      await expect.soft(banner, `Day ${day}: banner title`).toBeVisible();

      const table = tripPage.getDayItineraryTable(day);
      await expect.soft(table, `Day ${day}: itinerary table`).toBeAttached();

      const pois = tripPage.getDayPoiCards(day);
      expect.soft(await pois.count(), `Day ${day}: POI card count >= 1`).toBeGreaterThanOrEqual(1);
    }
  });
});

test.describe('Smoke — POI Cards (spot-check)', () => {
  test('POI cards exist and have names and links', async ({ tripPage }) => {
    const count = await tripPage.poiCards.count();
    expect(count, 'total POI cards on page').toBeGreaterThan(0);

    // Spot-check first, middle, and last POI card
    const indices = [...new Set([0, Math.floor(count / 2), count - 1])];
    for (const idx of indices) {
      const card = tripPage.poiCards.nth(idx);
      const name = tripPage.getPoiCardName(card);
      await expect.soft(name, `POI ${idx}: name attached`).toBeAttached();
      const nameText = await name.textContent();
      expect.soft(nameText!.trim().length, `POI ${idx}: name non-empty`).toBeGreaterThan(0);

      // data-link-exempt cards (🛒/🎯 structural headers) legitimately have 0 links
      const isExempt = (await card.getAttribute('data-link-exempt')) !== null;
      if (!isExempt) {
        const links = tripPage.getPoiCardLinks(card);
        expect.soft(await links.count(), `POI ${idx}: has links`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});

test.describe('Smoke — Budget', () => {
  test('budget section has total label and currency code', async ({ tripPage }) => {
    await expect(tripPage.budgetSection).toContainText(tripConfig.labels.budgetTotal);
    const text = await tripPage.budgetSection.textContent() ?? '';
    expect(/[A-Z]{3}/.test(text), 'Budget contains a 3-letter currency code').toBe(true);
  });
});

test.describe('Smoke — Assembly Order', () => {
  test('overview precedes day-0, budget follows last day', async ({ sharedPage }) => {
    const lastDayIndex = tripConfig.dayCount - 1;
    const result = await sharedPage.evaluate((lastDay: number) => {
      const overview = document.querySelector('#overview');
      const day0 = document.querySelector('#day-0');
      const dayLast = document.querySelector(`#day-${lastDay}`);
      const budget = document.querySelector('#budget');
      if (!overview || !day0 || !dayLast || !budget) {
        return { overviewBeforeDay0: false, budgetAfterLastDay: false };
      }
      const overviewBeforeDay0 = !!(overview.compareDocumentPosition(day0) & Node.DOCUMENT_POSITION_FOLLOWING);
      const budgetAfterLastDay = !!(dayLast.compareDocumentPosition(budget) & Node.DOCUMENT_POSITION_FOLLOWING);
      return { overviewBeforeDay0, budgetAfterLastDay };
    }, lastDayIndex);
    expect.soft(result.overviewBeforeDay0, '#overview must precede #day-0').toBe(true);
    expect.soft(result.budgetAfterLastDay, `#budget must follow #day-${lastDayIndex}`).toBe(true);
  });
});

test.describe('Smoke — Manifest Integrity', () => {
  baseTest('manifest.json exists with valid structure', () => {
    const manifestPath = getManifestPath();
    baseExpect(fs.existsSync(manifestPath), 'manifest.json exists').toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    baseExpect(manifest.destination, 'manifest has destination').toBeDefined();
    baseExpect(manifest.total_days, 'manifest total_days').toBe(tripConfig.dayCount);

    // Verify at least one language entry with all days complete
    const langKeys = Object.keys(manifest.languages ?? {});
    baseExpect(langKeys.length, 'manifest has at least one language').toBeGreaterThanOrEqual(1);

    const lang = manifest.languages[langKeys[0]];
    const dayKeys = Object.keys(lang.days ?? {});
    baseExpect(dayKeys.length, 'manifest day count').toBe(tripConfig.dayCount);

    for (const [key, day] of Object.entries(lang.days)) {
      baseExpect.soft(
        (day as { status: string }).status,
        `${key} status should be "complete"`
      ).toBe('complete');
    }
  });
});
