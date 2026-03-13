import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

/**
 * Validates the structural linking between activity labels in itinerary tables
 * and their corresponding POI cards within the same day section.
 *
 * Contract:
 * - Every POI card MUST have id="poi-day-{D}-{N}" (D = day, N = 1-based index)
 * - POI-referencing activity labels MUST be <a class="activity-label" href="#poi-day-{D}-{N}">
 * - Generic actions (transport, walks) remain as <span class="activity-label">
 * - Clicking a linked activity label scrolls to the target POI card
 */

const POI_ID_PATTERN = /^poi-day-(\d+)-(\d+)$/;

test.describe('Activity Label → POI Card Linking', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('every POI card should have a valid anchor ID matching poi-day-{D}-{N} pattern', async () => {
    const count = await tripPage.poiCards.count();
    expect(count).toBeGreaterThan(0);

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const id = await tripPage.poiCards.nth(i).getAttribute('id');
      if (!id) {
        const name = await tripPage.getPoiCardName(tripPage.poiCards.nth(i)).textContent();
        failures.push(`POI #${i + 1} ("${name?.trim()}") — missing id attribute`);
      } else if (!POI_ID_PATTERN.test(id)) {
        failures.push(`POI #${i + 1} — id="${id}" does not match pattern poi-day-{D}-{N}`);
      }
    }

    expect(
      failures,
      `POI cards with invalid or missing anchor IDs:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });

  test('POI card IDs should be unique', async () => {
    const count = await tripPage.poiCards.count();
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const id = await tripPage.poiCards.nth(i).getAttribute('id');
      if (id) ids.push(id);
    }

    const duplicates = ids.filter((id, idx) => ids.indexOf(id) !== idx);
    expect(
      duplicates,
      `Duplicate POI card IDs found: ${duplicates.join(', ')}`
    ).toHaveLength(0);
  });

  test('POI card IDs within each day should be sequentially numbered starting at 1', async () => {
    const dayCount = await tripPage.daySections.count();
    const failures: string[] = [];

    for (let d = 0; d <= dayCount; d++) {
      const dayPoiCards = tripPage.getDayPoiCards(d);
      const poiCount = await dayPoiCards.count();
      if (poiCount === 0) continue;

      for (let n = 0; n < poiCount; n++) {
        const expectedId = `poi-day-${d}-${n + 1}`;
        const actualId = await dayPoiCards.nth(n).getAttribute('id');
        if (actualId !== expectedId) {
          failures.push(`Day ${d}, POI #${n + 1}: expected id="${expectedId}", got id="${actualId}"`);
        }
      }
    }

    expect(
      failures,
      `POI card IDs not sequentially numbered:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });

  test('clickable activity labels should exist', async () => {
    const count = await tripPage.clickableActivityLabels.count();
    expect(count).toBeGreaterThan(0);
  });

  test('every clickable activity label href should point to an existing POI card', async ({ page }) => {
    const count = await tripPage.clickableActivityLabels.count();
    expect(count).toBeGreaterThan(0);

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const href = await tripPage.clickableActivityLabels.nth(i).getAttribute('href');
      if (!href || !href.startsWith('#')) {
        const text = await tripPage.clickableActivityLabels.nth(i).textContent();
        failures.push(`Label #${i + 1} ("${text?.trim()}") — invalid href="${href}"`);
        continue;
      }

      const targetId = href.substring(1);
      const target = page.locator(`#${targetId}`);
      const targetCount = await target.count();
      if (targetCount === 0) {
        const text = await tripPage.clickableActivityLabels.nth(i).textContent();
        failures.push(`Label #${i + 1} ("${text?.trim()}") — href="${href}" has no matching element`);
      }
    }

    expect(
      failures,
      `Clickable activity labels with broken links:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });

  test('clickable activity labels should be <a> elements, not <span>', async () => {
    const count = await tripPage.clickableActivityLabels.count();
    for (let i = 0; i < count; i++) {
      const tagName = await tripPage.clickableActivityLabels.nth(i).evaluate(el => el.tagName);
      expect(tagName).toBe('A');
    }
  });

  test('generic activity labels should remain as <span> elements', async ({ page }) => {
    const allLabels = await tripPage.activityLabels.count();
    const clickableLabels = await tripPage.clickableActivityLabels.count();

    // There must be some non-clickable (generic) labels
    const genericCount = allLabels - clickableLabels;
    expect(genericCount).toBeGreaterThan(0);

    // Verify generic labels are spans
    const spans = page.locator('span.activity-label');
    const spanCount = await spans.count();
    expect(spanCount).toBe(genericCount);
  });

  test('clicking a linked activity label should scroll to its POI card', async ({ page }) => {
    // Pick the first clickable label for the scroll test
    const firstLink = tripPage.clickableActivityLabels.first();
    await expect(firstLink).toBeAttached();

    const href = await firstLink.getAttribute('href');
    const targetId = href!.substring(1);
    const targetCard = page.locator(`#${targetId}`);

    await expect(targetCard).toBeAttached();

    // Click the activity label
    await firstLink.click();

    // The target POI card should be visible in the viewport
    await expect(targetCard).toBeInViewport({ timeout: 3000 });
  });

  test('each day with POI cards should have at least one clickable activity label', async () => {
    const failures: string[] = [];

    for (let d = 0; d <= 11; d++) {
      const dayPoiCards = tripPage.getDayPoiCards(d);
      const poiCount = await dayPoiCards.count();
      if (poiCount === 0) continue;

      const dayClickableLabels = tripPage.getDayClickableActivityLabels(d);
      const labelCount = await dayClickableLabels.count();
      if (labelCount === 0) {
        failures.push(`Day ${d}: has ${poiCount} POI cards but no clickable activity labels`);
      }
    }

    expect(
      failures,
      `Days with POI cards but no clickable labels:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });
});
