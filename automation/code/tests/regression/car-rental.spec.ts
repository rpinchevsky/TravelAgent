import * as fs from 'fs';
import { test, expect } from '../fixtures/shared-page';
import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { loadTripConfig } from '../utils/trip-config';
import { getExpectedPoiCountsFromMarkdown } from '../utils/markdown-pois';
import { getManifestPath } from '../utils/trip-folder';

/**
 * Car Rental Integration Tests (TC-300 through TC-311)
 *
 * Grouped by concern:
 *   1. Section presence (TC-300)
 *   2. Category structure (TC-301)
 *   3. Comparison table rows (TC-302)
 *   4. Booking links (TC-303)
 *   5. Budget integration (TC-304+305)
 *   6. POI parity & visual distinction (TC-306+311 consolidated per QF-1)
 *   7. Manifest schema (TC-307)
 *   8. Markdown POI exclusion (TC-308)
 *   9. Overview clean (TC-309)
 *  10. Non-anchor day budget (TC-310)
 *
 * All assertions are language-agnostic: CSS classes, data attributes, emoji markers only.
 */

const tripConfig = loadTripConfig();

interface ManifestCarRentalBlock {
  id: string;
  pickup_date: string;
  return_date: string;
  days: number;
  pickup_location: string;
  anchor_day: string;
  anchor_day_number: number;
  categories_compared: string[];
  companies_per_category: number;
  discovery_source: string;
}

function getCarRentalBlocks(): ManifestCarRentalBlock[] {
  const manifestPath = getManifestPath();
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw);
  const carRental = manifest['car_rental'];
  if (!carRental) return [];
  const blocks = carRental['blocks'];
  if (!Array.isArray(blocks) || blocks.length === 0) return [];
  return blocks.map((b: Record<string, unknown>) => {
    const anchorDay = String(b['anchor_day'] ?? '');
    const match = anchorDay.match(/day_(\d+)/);
    return {
      id: String(b['id'] ?? ''),
      pickup_date: String(b['pickup_date'] ?? ''),
      return_date: String(b['return_date'] ?? ''),
      days: typeof b['days'] === 'number' ? b['days'] : 0,
      pickup_location: String(b['pickup_location'] ?? ''),
      anchor_day: anchorDay,
      anchor_day_number: match ? parseInt(match[1], 10) : -1,
      categories_compared: Array.isArray(b['categories_compared']) ? b['categories_compared'].map(String) : [],
      companies_per_category: typeof b['companies_per_category'] === 'number' ? b['companies_per_category'] : 0,
      discovery_source: String(b['discovery_source'] ?? ''),
    };
  });
}

const blocks = getCarRentalBlocks();
const anchorDays = blocks
  .filter((b) => b.discovery_source !== 'skipped')
  .map((b) => b.anchor_day_number)
  .filter((n) => n >= 0);
const anchorDaySet = new Set(anchorDays);

// ---- Test Block 1: Section Presence (TC-300) ----

test.describe('Car Rental — Section Presence', () => {
  test('TC-300: car rental section present on anchor days, absent on non-anchor days', async ({ tripPage }) => {
    test.skip(blocks.length === 0, 'No car_rental.blocks in manifest — trip may not have car rental days');

    for (const day of anchorDays) {
      const section = tripPage.getDayCarRentalSection(day);
      expect.soft(await section.count(), `Day ${day}: car rental section should be present on anchor day`).toBe(1);
    }

    for (let day = 0; day < tripConfig.dayCount; day++) {
      if (anchorDaySet.has(day)) continue;
      const section = tripPage.getDayCarRentalSection(day);
      expect.soft(await section.count(), `Day ${day}: non-anchor day should have no car rental section`).toBe(0);
    }
  });
});

// ---- Test Block 2: Category Structure (TC-301) ----

test.describe('Car Rental — Category Structure', () => {
  test('TC-301: categories, tables, intros, estimates, recommendations, pro-tips', async ({ tripPage }) => {
    test.skip(blocks.length === 0, 'No car_rental.blocks in manifest');

    for (const block of blocks) {
      const day = block.anchor_day_number;
      if (day < 0 || block.discovery_source === 'skipped') continue;

      const categories = tripPage.getDayCarRentalCategories(day);
      const catCount = await categories.count();
      expect.soft(catCount, `Day ${day}: category count should be >= 1`).toBeGreaterThanOrEqual(1);
      expect.soft(catCount, `Day ${day}: category count should be <= 3`).toBeLessThanOrEqual(3);

      if (block.categories_compared.length > 0) {
        expect.soft(catCount, `Day ${day}: DOM category count should match manifest categories_compared (${block.categories_compared.length})`).toBe(block.categories_compared.length);
      }

      for (let c = 0; c < catCount; c++) {
        const cat = categories.nth(c);
        const label = `Day ${day}, Category ${c}`;

        const title = tripPage.getCarRentalCategoryTitle(cat);
        expect.soft(await title.count(), `${label}: should have .car-rental-category__title`).toBeGreaterThanOrEqual(1);
        if (await title.count() > 0) {
          const titleText = await title.first().textContent();
          expect.soft(titleText && titleText.trim().length > 0, `${label}: title should have non-empty text`).toBe(true);
        }

        const table = tripPage.getCarRentalCategoryTable(cat);
        expect.soft(await table.count(), `${label}: should have .car-rental-table`).toBe(1);
        if (await table.count() > 0) {
          await expect.soft(table.first(), `${label}: table should be visible`).toBeVisible();

          const headerCells = tripPage.getCarRentalTableHeaderCells(table.first());
          expect.soft(await headerCells.count(), `${label}: table should have 4 header cells`).toBe(4);
        }

        const estimate = tripPage.getCarRentalCategoryEstimate(cat);
        expect.soft(await estimate.count(), `${label}: should have .car-rental-category__estimate`).toBeGreaterThanOrEqual(1);

        const recommendation = tripPage.getCarRentalCategoryRecommendation(cat);
        expect.soft(await recommendation.count(), `${label}: should have .car-rental-category__recommendation`).toBeGreaterThanOrEqual(1);
        if (await recommendation.count() > 0) {
          const recText = await recommendation.first().textContent();
          expect.soft(recText && recText.trim().length > 0, `${label}: recommendation should have non-empty text`).toBe(true);
        }
      }

      // Section intro
      const section = tripPage.getDayCarRentalSection(day);
      const intro = section.locator('.car-rental-section__intro');
      expect.soft(await intro.count(), `Day ${day}: car-rental-section__intro should exist`).toBeGreaterThanOrEqual(1);
      if (await intro.count() > 0) {
        const introText = await intro.first().textContent();
        expect.soft(introText && introText.trim().length > 0, `Day ${day}: intro paragraph should have non-empty text`).toBe(true);
      }

      // Section heading contains 🚗 emoji
      const sectionHeading = section.locator('h2, .section-title').first();
      if (await sectionHeading.count() > 0) {
        const headingText = await sectionHeading.textContent();
        expect.soft(headingText?.includes('🚗'), `Day ${day}: section heading should contain 🚗 emoji`).toBe(true);
      }

      // Pro-tip in section
      const proTip = tripPage.getCarRentalProTip(section);
      expect.soft(await proTip.count(), `Day ${day}: car rental section should have .pro-tip`).toBeGreaterThanOrEqual(1);
    }
  });
});

// ---- Test Block 3: Comparison Table Rows (TC-302) ----

test.describe('Car Rental — Comparison Table Rows', () => {
  test('TC-302: row count and rental CTA per row', async ({ tripPage }) => {
    test.skip(blocks.length === 0, 'No car_rental.blocks in manifest');

    for (const block of blocks) {
      const day = block.anchor_day_number;
      if (day < 0 || block.discovery_source === 'skipped') continue;

      const categories = tripPage.getDayCarRentalCategories(day);
      const catCount = await categories.count();

      for (let c = 0; c < catCount; c++) {
        const cat = categories.nth(c);
        const table = tripPage.getCarRentalCategoryTable(cat);
        if (await table.count() === 0) continue;

        const rows = tripPage.getCarRentalTableRows(table.first());
        const rowCount = await rows.count();
        const label = `Day ${day}, Category ${c}`;

        expect.soft(rowCount, `${label}: table rows should be >= 2`).toBeGreaterThanOrEqual(2);
        expect.soft(rowCount, `${label}: table rows should be <= 3`).toBeLessThanOrEqual(3);

        if (block.companies_per_category > 0) {
          expect.soft(rowCount, `${label}: row count should match manifest companies_per_category (${block.companies_per_category})`).toBe(block.companies_per_category);
        }

        for (let r = 0; r < rowCount; r++) {
          const row = rows.nth(r);
          const cta = row.locator('.rental-cta');
          expect.soft(await cta.count(), `${label}, Row ${r}: should have .rental-cta`).toBeGreaterThanOrEqual(1);
          if (await cta.count() > 0) {
            await expect.soft(cta.first(), `${label}, Row ${r}: rental CTA should be visible`).toBeVisible();
          }
        }
      }
    }
  });
});

// ---- Test Block 4: Booking Links (TC-303) ----

test.describe('Car Rental — Booking Links', () => {
  test('TC-303: rental CTA link structure and attributes', async ({ tripPage }) => {
    test.skip(blocks.length === 0, 'No car_rental.blocks in manifest');

    for (const day of anchorDays) {
      const ctas = tripPage.getDayRentalCtas(day);
      const ctaCount = await ctas.count();
      expect.soft(ctaCount, `Day ${day}: should have at least 2 rental CTAs`).toBeGreaterThanOrEqual(2);

      for (let i = 0; i < ctaCount; i++) {
        const cta = ctas.nth(i);
        const label = `Day ${day}, CTA ${i}`;

        const tagName = await cta.evaluate((el) => el.tagName.toLowerCase());
        expect.soft(tagName, `${label}: rental CTA should be an <a> element`).toBe('a');

        const linkType = await cta.getAttribute('data-link-type');
        expect.soft(linkType, `${label}: data-link-type should be "rental-booking"`).toBe('rental-booking');

        const target = await cta.getAttribute('target');
        expect.soft(target, `${label}: target should be "_blank"`).toBe('_blank');

        const rel = await cta.getAttribute('rel');
        expect.soft(rel?.includes('noopener'), `${label}: rel should contain "noopener"`).toBe(true);

        const href = await cta.getAttribute('href');
        expect.soft(href, `${label}: should have an href`).toBeTruthy();
        if (href) {
          expect.soft(/^https?:\/\//.test(href), `${label}: href should match URL pattern (got "${href}")`).toBe(true);
        }
      }
    }
  });
});

// ---- Test Block 5: Budget Integration (TC-304+305) ----

test.describe('Car Rental — Budget Integration', () => {
  test('TC-304+305: car rental line in anchor day pricing grid and aggregate budget', async ({ tripPage }) => {
    test.skip(blocks.length === 0, 'No car_rental.blocks in manifest');

    for (const day of anchorDays) {
      const pricingGrid = tripPage.getDayPricingTable(day);
      const gridCount = await pricingGrid.count();
      if (gridCount === 0) {
        expect.soft(false, `Day ${day}: pricing grid should exist on anchor day`).toBe(true);
        continue;
      }
      const gridText = await pricingGrid.textContent();
      expect.soft(
        gridText?.includes('🚗'),
        `Day ${day}: pricing grid should have car rental line item (🚗 marker)`
      ).toBe(true);
    }

    const budgetText = await tripPage.budgetSection.textContent();
    expect.soft(
      budgetText?.includes('🚗'),
      'Aggregate budget should have car rental category (🚗 marker)'
    ).toBe(true);
  });
});

// ---- Test Block 6: POI Parity & Visual Distinction (TC-306+311 consolidated per QF-1) ----

test.describe('Car Rental — POI Parity Exclusion & Visual Distinction', () => {
  test('TC-306+311: car rental elements are class-separated from POI and accommodation', async ({ tripPage }) => {
    test.skip(blocks.length === 0, 'No car_rental.blocks in manifest');

    for (const day of anchorDays) {
      const dayLabel = `Day ${day}`;

      // Verify car rental categories exist on anchor days
      const carCategories = tripPage.getDayCarRentalCategories(day);
      const carCatCount = await carCategories.count();
      expect.soft(carCatCount, `${dayLabel}: should have car rental categories on anchor day`).toBeGreaterThan(0);

      // TC-306: POI cards do NOT have .car-rental-category class
      const poiCards = tripPage.getDayPoiCards(day);
      const poiCount = await poiCards.count();
      for (let i = 0; i < poiCount; i++) {
        const hasCar = await poiCards.nth(i).evaluate((el) => el.classList.contains('car-rental-category'));
        expect.soft(hasCar, `${dayLabel}, POI ${i}: .poi-card should NOT have .car-rental-category class`).toBe(false);
      }

      // TC-306: car rental categories do NOT have .poi-card class
      for (let i = 0; i < carCatCount; i++) {
        const hasPoi = await carCategories.nth(i).evaluate((el) => el.classList.contains('poi-card'));
        expect.soft(hasPoi, `${dayLabel}, CarCat ${i}: .car-rental-category should NOT have .poi-card class`).toBe(false);
      }

      // TC-311: car rental sections do NOT have .poi-card or .accommodation-section class
      const carSections = tripPage.getDayCarRentalSection(day);
      const sectionCount = await carSections.count();
      for (let i = 0; i < sectionCount; i++) {
        const hasPoiClass = await carSections.nth(i).evaluate((el) => el.classList.contains('poi-card'));
        expect.soft(hasPoiClass, `${dayLabel}, Section ${i}: .car-rental-section should NOT have .poi-card class`).toBe(false);

        const hasAccomClass = await carSections.nth(i).evaluate((el) => el.classList.contains('accommodation-section'));
        expect.soft(hasAccomClass, `${dayLabel}, Section ${i}: .car-rental-section should NOT have .accommodation-section class`).toBe(false);
      }

      // TC-311: car rental categories do NOT have .accommodation-card class
      for (let i = 0; i < carCatCount; i++) {
        const hasAccom = await carCategories.nth(i).evaluate((el) => el.classList.contains('accommodation-card'));
        expect.soft(hasAccom, `${dayLabel}, CarCat ${i}: .car-rental-category should NOT have .accommodation-card class`).toBe(false);
      }

      // TC-311: rental CTAs do NOT have .booking-cta class
      const rentalCtas = tripPage.getDayRentalCtas(day);
      const ctaCount = await rentalCtas.count();
      for (let i = 0; i < ctaCount; i++) {
        const hasBooking = await rentalCtas.nth(i).evaluate((el) => el.classList.contains('booking-cta'));
        expect.soft(hasBooking, `${dayLabel}, RentalCTA ${i}: .rental-cta should NOT have .booking-cta class`).toBe(false);
      }
    }
  });
});

// ---- Test Block 7: Manifest Schema (TC-307) ----

test.describe('Car Rental — Manifest Schema', () => {
  baseTest('TC-307: manifest car_rental schema validation', async () => {
    const manifestPath = getManifestPath();
    const raw = fs.readFileSync(manifestPath, 'utf-8');
    let manifest: Record<string, unknown>;
    try {
      manifest = JSON.parse(raw);
    } catch {
      baseExpect(false, `Failed to parse manifest.json at ${manifestPath}`).toBe(true);
      return;
    }

    const carRental = manifest['car_rental'] as Record<string, unknown> | undefined;
    baseExpect(carRental, 'manifest should have "car_rental" key').toBeTruthy();
    if (!carRental) return;

    const manifestBlocks = carRental['blocks'] as Record<string, unknown>[] | undefined;
    baseExpect(Array.isArray(manifestBlocks), 'car_rental.blocks should be an array').toBe(true);
    if (!Array.isArray(manifestBlocks)) return;

    // If no car days, blocks should be empty array — still valid
    if (manifestBlocks.length === 0) return;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const blockIdRegex = /^rental_\d+$/;
    const anchorDayRegex = /^day_\d+$/;
    const validSources = ['web_search', 'aggregator_fallback', 'skipped', 'pending'];

    for (let i = 0; i < manifestBlocks.length; i++) {
      const b = manifestBlocks[i];
      const label = `Block ${i}`;

      const id = b['id'];
      baseExpect.soft(typeof id === 'string' && blockIdRegex.test(id as string), `${label}: id should match rental_N pattern, got "${id}"`).toBe(true);

      const pickupDate = String(b['pickup_date'] ?? '');
      baseExpect.soft(dateRegex.test(pickupDate), `${label}: pickup_date should be YYYY-MM-DD, got "${pickupDate}"`).toBe(true);

      const returnDate = String(b['return_date'] ?? '');
      baseExpect.soft(dateRegex.test(returnDate), `${label}: return_date should be YYYY-MM-DD, got "${returnDate}"`).toBe(true);

      if (dateRegex.test(pickupDate) && dateRegex.test(returnDate)) {
        baseExpect.soft(returnDate >= pickupDate, `${label}: return_date (${returnDate}) should be >= pickup_date (${pickupDate})`).toBe(true);
      }

      const days = b['days'];
      baseExpect.soft(typeof days === 'number' && Number.isInteger(days) && (days as number) > 0, `${label}: days should be a positive integer, got ${days}`).toBe(true);

      if (typeof days === 'number' && dateRegex.test(pickupDate) && dateRegex.test(returnDate)) {
        const expectedDays = Math.round((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / 86400000) + 1;
        baseExpect.soft(days, `${label}: days should equal return_date - pickup_date + 1 (${expectedDays})`).toBe(expectedDays);
      }

      const pickupLocation = b['pickup_location'];
      baseExpect.soft(typeof pickupLocation === 'string' && (pickupLocation as string).length > 0, `${label}: pickup_location should be a non-empty string`).toBe(true);

      const anchorDay = b['anchor_day'];
      baseExpect.soft(typeof anchorDay === 'string' && anchorDayRegex.test(anchorDay as string), `${label}: anchor_day should match day_N, got "${anchorDay}"`).toBe(true);

      const categoriesCompared = b['categories_compared'];
      baseExpect.soft(Array.isArray(categoriesCompared), `${label}: categories_compared should be an array`).toBe(true);

      const companiesPerCategory = b['companies_per_category'];
      baseExpect.soft(typeof companiesPerCategory === 'number' && Number.isInteger(companiesPerCategory) && (companiesPerCategory as number) >= 0, `${label}: companies_per_category should be integer >= 0, got ${companiesPerCategory}`).toBe(true);

      const source = b['discovery_source'];
      baseExpect.soft(typeof source === 'string' && validSources.includes(source as string), `${label}: discovery_source should be one of ${validSources.join(', ')}, got "${source}"`).toBe(true);
    }
  });
});

// ---- Test Block 8: Markdown POI Exclusion (TC-308) ----

test.describe('Car Rental — Markdown POI Exclusion', () => {
  baseTest('TC-308: ### 🚗 headings not counted by getExpectedPoiCountsFromMarkdown()', async () => {
    const tripConfig = loadTripConfig();

    // Read markdown file to find ### 🚗 headings
    const { getLatestTripFolderPath } = await import('../utils/trip-folder');
    const path = await import('path');
    const tripFolder = getLatestTripFolderPath(tripConfig.markdownFilename);
    const fullMdPath = path.join(tripFolder, tripConfig.markdownFilename);
    const mdContent = fs.readFileSync(fullMdPath, 'utf-8');
    const lines = mdContent.split('\n');

    // Find all ### 🚗 lines and which day they belong to
    let currentDay: number | null = null;
    const carHeadingsPerDay: Record<number, number> = {};
    const allH3PerDay: Record<number, number> = {};

    for (const line of lines) {
      const anchorMatch = line.match(/<a\s+id="day-(\d+)"/);
      const headingMatch = line.match(tripConfig.labels.dayHeadingRegex);
      if (anchorMatch || headingMatch) {
        currentDay = parseInt((anchorMatch || headingMatch)![1], 10);
        if (!carHeadingsPerDay[currentDay]) carHeadingsPerDay[currentDay] = 0;
        if (!allH3PerDay[currentDay]) allH3PerDay[currentDay] = 0;
        continue;
      }

      if (currentDay !== null && line.startsWith('### ')) {
        allH3PerDay[currentDay] = (allH3PerDay[currentDay] || 0) + 1;
        if (line.includes('🚗')) {
          carHeadingsPerDay[currentDay] = (carHeadingsPerDay[currentDay] || 0) + 1;
        }
      }
    }

    // Get the POI counts from the utility
    const poiCounts = getExpectedPoiCountsFromMarkdown();

    // For days with 🚗 headings, verify they are excluded from the count
    for (const [dayStr, carCount] of Object.entries(carHeadingsPerDay)) {
      const day = parseInt(dayStr, 10);
      if (carCount === 0) continue;

      const totalH3 = allH3PerDay[day] || 0;
      const returnedCount = poiCounts[day]?.count ?? 0;

      // The returned count should NOT include 🚗 headings
      // Count how many other headings are also excluded (non-car exclusions)
      const nonCarExcludedCount = totalH3 - carCount - returnedCount;
      baseExpect.soft(
        nonCarExcludedCount >= 0,
        `Day ${day}: returned POI count (${returnedCount}) + car headings (${carCount}) + other excluded should equal total ### headings (${totalH3})`
      ).toBe(true);

      // The key assertion: if 🚗 headings were counted, the POI count would be higher
      baseExpect.soft(
        returnedCount <= totalH3 - carCount,
        `Day ${day}: POI count (${returnedCount}) should not exceed total ### headings (${totalH3}) minus car headings (${carCount})`
      ).toBe(true);
    }
  });
});

// ---- Test Block 9: Overview Clean (TC-309) ----

test.describe('Car Rental — Overview Clean', () => {
  test('TC-309: overview does not contain detailed car rental elements', async ({ tripPage }) => {
    const overview = tripPage.overviewSection;

    const overviewCarRental = overview.locator('.car-rental-section');
    expect.soft(await overviewCarRental.count(), 'overview should not have .car-rental-section').toBe(0);

    const overviewTable = overview.locator('.car-rental-table');
    expect.soft(await overviewTable.count(), 'overview should not have .car-rental-table').toBe(0);

    const overviewCta = overview.locator('.rental-cta');
    expect.soft(await overviewCta.count(), 'overview should not have .rental-cta').toBe(0);
  });
});

// ---- Test Block 10: Non-Anchor Day Budget (TC-310) ----

test.describe('Car Rental — Non-Anchor Day Budget', () => {
  test('TC-310: non-anchor car days do not duplicate rental cost in budget', async ({ tripPage }) => {
    test.skip(blocks.length === 0, 'No car_rental.blocks in manifest');

    // Identify non-anchor car days from manifest blocks
    const nonAnchorCarDays: number[] = [];
    for (const block of blocks) {
      if (block.discovery_source === 'skipped') continue;
      const pickupMs = new Date(block.pickup_date).getTime();
      const returnMs = new Date(block.return_date).getTime();
      const arrivalMs = tripConfig.arrivalDate.getTime();
      const msPerDay = 86400000;

      for (let d = 0; d <= (returnMs - pickupMs) / msPerDay; d++) {
        const dateMs = pickupMs + d * msPerDay;
        const dayNumber = Math.round((dateMs - arrivalMs) / msPerDay);
        if (dayNumber >= 0 && dayNumber < tripConfig.dayCount && !anchorDaySet.has(dayNumber)) {
          nonAnchorCarDays.push(dayNumber);
        }
      }
    }

    if (nonAnchorCarDays.length === 0) {
      test.skip(true, 'No non-anchor car days found — single-day rental blocks only');
      return;
    }

    // Check that non-anchor car days do not have the rental block cost marker
    // Note: fuel costs may legitimately use 🚗 on non-anchor days.
    // Use structural differentiator (.pricing-cell__badge--estimate) if available.
    for (const day of nonAnchorCarDays) {
      const pricingGrid = tripPage.getDayPricingTable(day);
      if (await pricingGrid.count() === 0) continue;

      // Try structural check: look for estimate badge within a 🚗-marked pricing cell
      const estimateBadge = pricingGrid.locator('.pricing-cell__badge--estimate');
      const badgeCount = await estimateBadge.count();

      if (badgeCount > 0) {
        // Structural differentiator exists — check that no estimate badge
        // is associated with a car rental cost on non-anchor days
        let carEstimateBadges = 0;
        for (let b = 0; b < badgeCount; b++) {
          const parentCell = estimateBadge.nth(b).locator('..');
          const cellText = await parentCell.textContent();
          if (cellText?.includes('🚗')) {
            carEstimateBadges++;
          }
        }
        expect.soft(carEstimateBadges, `Day ${day}: non-anchor car day should not have car rental estimate badge`).toBe(0);
      } else {
        // No structural differentiator available — cannot reliably distinguish
        // rental block cost from fuel cost. Mark for future implementation.
        test.fixme(true, `Day ${day}: no .pricing-cell__badge--estimate found — cannot distinguish rental vs fuel cost`);
        return;
      }
    }
  });
});
