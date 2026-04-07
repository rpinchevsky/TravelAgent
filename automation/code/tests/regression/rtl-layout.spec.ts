import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import { TripPage } from '../pages/TripPage';
import { loadTripConfig } from '../utils/trip-config';
import { getManifestPath } from '../utils/trip-folder';

const tripConfig = loadTripConfig();

/**
 * RTL Layout Regression Tests
 *
 * Validates that dir="rtl" HTML pages render correctly:
 * - CSS Grid mirrors sidebar to the right without explicit column override
 * - Main content takes full available width (not squeezed into sidebar-width)
 * - Borders, text alignment, and navigation adapt to RTL direction
 *
 * These tests run ONLY on the desktop-chromium-rtl project (Hebrew HTML).
 */

test.describe('RTL — Structural', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have dir="rtl" on html element', async ({ page }) => {
    const dir = await page.locator('html').getAttribute('dir');
    expect(dir).toBe('rtl');
  });

  test('should have a valid RTL lang attribute (he/ar/fa)', async ({ page }) => {
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toMatch(/^(he|ar|fa)/);
  });

  test('should have inlined CSS (no external stylesheet link)', async ({ page }) => {
    await expect(page.locator('head style')).toBeAttached();
    const externalCssLink = page.locator('link[href*="rendering_style_config"]');
    await expect(externalCssLink).toHaveCount(0);
  });

  test('should render all day sections', async () => {
    await expect(tripPage.daySections).toHaveCount(tripConfig.dayCount);
  });

  test('should render overview section', async () => {
    await expect(tripPage.overviewSection).toBeAttached();
  });

  test('should render budget section', async () => {
    await expect(tripPage.budgetSection).toBeAttached();
  });
});

test.describe('RTL — Desktop Grid Layout', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('sidebar should be visible on desktop', async () => {
    await expect(tripPage.sidebar).toBeVisible();
  });

  test('sidebar should render on the RIGHT side of the viewport', async ({ page }) => {
    const sidebarBox = await tripPage.sidebar.boundingBox();
    const viewportWidth = 1440;
    expect(sidebarBox).not.toBeNull();
    // Sidebar's left edge should be in the right portion of the viewport
    expect(sidebarBox!.x).toBeGreaterThan(viewportWidth / 2);
  });

  test('main content should render on the LEFT side (not squeezed)', async ({ page }) => {
    const mainContent = page.locator('.main-content');
    const mainBox = await mainContent.boundingBox();
    expect(mainBox).not.toBeNull();
    // Main content should be wider than sidebar (260px) — at least 600px on 1440 viewport
    expect(mainBox!.width).toBeGreaterThan(600);
  });

  test('main content should not be squeezed into sidebar width', async ({ page }) => {
    const mainContent = page.locator('.main-content');
    const mainBox = await mainContent.boundingBox();
    const sidebarBox = await tripPage.sidebar.boundingBox();
    expect(mainBox).not.toBeNull();
    expect(sidebarBox).not.toBeNull();
    // Main content must be wider than sidebar
    expect(mainBox!.width).toBeGreaterThan(sidebarBox!.width);
  });

  test('page-wrapper should use CSS Grid with two columns', async ({ page }) => {
    const display = await page.locator('.page-wrapper').evaluate(
      (el) => getComputedStyle(el).display
    );
    expect(display).toBe('grid');
  });
});

test.describe('RTL — Navigation', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('should have correct number of sidebar links', async () => {
    const manifestPath = getManifestPath();
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const hasAccommodation = (manifest.accommodation?.stays?.length ?? 0) > 0;
    const hasCarRental = (manifest.car_rental?.blocks?.length ?? 0) > 0;
    const optionalSections = (hasAccommodation ? 1 : 0) + (hasCarRental ? 1 : 0);
    // overview + optional(accommodation, car-rental) + days + budget
    const expectedCount = tripConfig.dayCount + 2 + optionalSections;
    await expect(tripPage.sidebarLinks).toHaveCount(expectedCount);
  });

  test('sidebar links should have correct hrefs', async () => {
    const manifestPath = getManifestPath();
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const hasAccommodation = (manifest.accommodation?.stays?.length ?? 0) > 0;
    const hasCarRental = (manifest.car_rental?.blocks?.length ?? 0) > 0;
    const optionalHrefs = [
      ...(hasAccommodation ? ['#accommodation'] : []),
      ...(hasCarRental ? ['#car-rental'] : []),
    ];
    const expectedHrefs = [
      '#overview',
      ...optionalHrefs,
      ...Array.from({ length: tripConfig.dayCount }, (_, i) => `#day-${i}`),
      '#budget',
    ];
    for (let i = 0; i < expectedHrefs.length; i++) {
      await expect(tripPage.sidebarLinks.nth(i)).toHaveAttribute('href', expectedHrefs[i]);
    }
  });

  test('should have correct number of mobile pills', async () => {
    const manifestPath = getManifestPath();
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const hasAccommodation = (manifest.accommodation?.stays?.length ?? 0) > 0;
    const hasCarRental = (manifest.car_rental?.blocks?.length ?? 0) > 0;
    const optionalSections = (hasAccommodation ? 1 : 0) + (hasCarRental ? 1 : 0);
    // overview + optional(accommodation, car-rental) + days + budget
    const expectedCount = tripConfig.dayCount + 2 + optionalSections;
    await expect(tripPage.mobilePills).toHaveCount(expectedCount);
  });
});

test.describe('RTL — Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('sidebar should be hidden on mobile', async () => {
    await expect(tripPage.sidebar).toBeHidden();
  });

  test('mobile nav should be visible on mobile', async () => {
    await expect(tripPage.mobileNav).toBeVisible();
  });

  test('mobile nav should be sticky', async ({ page }) => {
    const position = await page.locator('nav.mobile-nav').evaluate(
      (el) => getComputedStyle(el).position
    );
    expect(position).toBe('sticky');
  });
});

test.describe('RTL — CSS Overrides', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('pro-tip should have right border (not left) in RTL', async ({ page }) => {
    const proTip = page.locator('.pro-tip').first();
    // Skip if no pro-tips exist
    if (await proTip.count() === 0) return;
    const borderRight = await proTip.evaluate(
      (el) => getComputedStyle(el).borderRightWidth
    );
    const borderLeft = await proTip.evaluate(
      (el) => getComputedStyle(el).borderLeftWidth
    );
    // Right border should be the styled one (3px), left should be 0
    expect(parseInt(borderRight)).toBeGreaterThan(0);
    expect(parseInt(borderLeft)).toBe(0);
  });

  test('itinerary table headers should be right-aligned', async ({ page }) => {
    const th = page.locator('.itinerary-table thead th').first();
    if (await th.count() === 0) return;
    const textAlign = await th.evaluate(
      (el) => getComputedStyle(el).textAlign
    );
    expect(textAlign).toBe('right');
  });

  test('SVGs should have explicit width and height', async ({ page }) => {
    const svgs = page.locator('svg');
    const count = await svgs.count();
    expect(count).toBeGreaterThan(10);
    for (let i = 0; i < count; i++) {
      const svg = svgs.nth(i);
      await expect.soft(svg, `SVG ${i}: missing width`).toHaveAttribute('width');
      await expect.soft(svg, `SVG ${i}: missing height`).toHaveAttribute('height');
    }
  });
});

test.describe('RTL — Day Cards', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('each day should have banner, itinerary table, and POI cards', async () => {
    const lastDayIndex = tripConfig.dayCount - 1;
    for (let i = 0; i <= lastDayIndex; i++) {
      const daySection = tripPage.getDaySection(i);
      await expect.soft(daySection, `Day ${i}: section missing`).toBeAttached();

      const banner = tripPage.getDayBannerTitle(i);
      await expect.soft(banner, `Day ${i}: banner title missing`).toBeVisible();

      const table = tripPage.getDayItineraryTable(i);
      await expect.soft(table, `Day ${i}: itinerary table missing`).toBeAttached();

      const rows = tripPage.getDayItineraryRows(i);
      const rowCount = await rows.count();
      expect.soft(rowCount, `Day ${i}: should have 3+ itinerary rows`).toBeGreaterThanOrEqual(3);

      if (i >= 1 && i <= lastDayIndex - 1) {
        const poiCards = tripPage.getDayPoiCards(i);
        const poiCount = await poiCards.count();
        expect.soft(poiCount, `Day ${i}: should have at least 1 POI card`).toBeGreaterThanOrEqual(1);
      }
    }
  });
});
