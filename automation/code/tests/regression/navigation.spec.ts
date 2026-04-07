import * as fs from 'fs';
import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';
import { getManifestPath } from '../utils/trip-folder';

const tripConfig = loadTripConfig();

// Build expected hrefs dynamically: overview, [accommodation], [car-rental], days, budget
function buildExpectedHrefs(): string[] {
  const hrefs: string[] = ['#overview'];

  try {
    const manifest = JSON.parse(fs.readFileSync(getManifestPath(), 'utf-8'));
    const stays = manifest?.accommodation?.stays ?? [];
    const blocks = manifest?.car_rental?.blocks ?? [];
    if (stays.length > 0 && stays.some((s: Record<string, unknown>) => s['discovery_source'] !== 'skipped')) {
      hrefs.push('#accommodation');
    }
    if (blocks.length > 0 && blocks.some((b: Record<string, unknown>) => b['discovery_source'] !== 'skipped')) {
      hrefs.push('#car-rental');
    }
  } catch {
    // No manifest or parse error — assume no accommodation/car-rental sections
  }

  for (let i = 0; i < tripConfig.dayCount; i++) {
    hrefs.push(`#day-${i}`);
  }
  hrefs.push('#budget');
  return hrefs;
}

const expectedHrefs = buildExpectedHrefs();
const expectedLinkCount = expectedHrefs.length;

test.describe('Navigation — Desktop Sidebar', () => {
  test(`should have exactly ${expectedLinkCount} sidebar links`, async ({ tripPage }) => {
    await expect(tripPage.sidebarLinks).toHaveCount(expectedLinkCount);
  });

  test('should have first sidebar link as active with aria-current', async ({ tripPage }) => {
    // Scroll to top to ensure IntersectionObserver highlights #overview
    await tripPage.page.evaluate(() => window.scrollTo(0, 0));
    await tripPage.page.waitForTimeout(300);
    await expect(tripPage.sidebarActiveLink).toHaveCount(1);
    await expect(tripPage.sidebarActiveLink).toHaveAttribute('aria-current', 'page');
    await expect(tripPage.sidebarActiveLink).toHaveAttribute('href', '#overview');
  });

  test('should have correct sidebar link hrefs', async ({ tripPage }) => {
    for (let i = 0; i < expectedHrefs.length; i++) {
      await expect(tripPage.sidebarLinks.nth(i)).toHaveAttribute('href', expectedHrefs[i]);
    }
  });

  test('should have SVG icon in each sidebar link', async ({ tripPage }) => {
    const count = await tripPage.sidebarLinks.count();
    for (let i = 0; i < count; i++) {
      const svg = tripPage.sidebarLinks.nth(i).locator('svg');
      await expect(svg).toBeAttached();
    }
  });
});

test.describe('Navigation — Mobile Pills', () => {
  test(`should have exactly ${expectedLinkCount} mobile pills`, async ({ tripPage }) => {
    await expect(tripPage.mobilePills).toHaveCount(expectedLinkCount);
  });

  test('should have first pill as active', async ({ tripPage }) => {
    await tripPage.page.evaluate(() => window.scrollTo(0, 0));
    await tripPage.page.waitForTimeout(300);
    await expect(tripPage.mobileActivePill).toHaveCount(1);
    await expect(tripPage.mobileActivePill).toHaveAttribute('href', '#overview');
  });

  test('should have correct pill hrefs', async ({ tripPage }) => {
    for (let i = 0; i < expectedHrefs.length; i++) {
      await expect(tripPage.mobilePills.nth(i)).toHaveAttribute('href', expectedHrefs[i]);
    }
  });
});
