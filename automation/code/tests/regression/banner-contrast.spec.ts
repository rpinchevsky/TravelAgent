import { test, expect } from '../fixtures/shared-page';
import { loadTripConfig } from '../utils/trip-config';
import { parseRgb, relativeLuminance } from '../utils/color-utils';

const tripConfig = loadTripConfig();

/**
 * Banner Contrast — Themed Container Validation
 *
 * Validates that .day-card__banner-title and .day-card__banner-date have
 * light (high-luminance) computed text color on every day banner.
 *
 * Uses the sRGB relative luminance formula from color-utils.ts.
 * Threshold: luminance > 0.7 ensures text is visibly light/white on the
 * dark gradient background.
 *
 * On the current fixed CSS, color: var(--color-text-inverse) resolves to
 * #FAFAFA (luminance ~0.95) — passes. On the pre-fix CSS, the global
 * heading reset to #1C1C1E (luminance ~0.012) would fail this check.
 */

/**
 * Minimum relative luminance threshold for banner text elements.
 * Value 0.7 ensures text is visibly light/white on the dark gradient background.
 * White (#FAFAFA) has luminance ~0.95; the global reset dark color (#1C1C1E) has ~0.012.
 * If future themes need a different threshold, only this constant changes.
 */
const MIN_LUMINANCE = 0.7;

test.describe('Banner Contrast — Themed Container Validation (sampled)', () => {
  // Sample first, middle, last day — contrast is set by CSS, not per-day content.
  // A systemic contrast regression appears on any day.
  const sampleDays = [...new Set([0, Math.floor(tripConfig.dayCount / 2), tripConfig.dayCount - 1])];

  for (const i of sampleDays) {
    test(`Day ${i} banner text should have light color (luminance > ${MIN_LUMINANCE})`, async ({ tripPage }) => {
      // QF-2: Existence-check soft assertion per QA feedback — flag missing
      // elements as a test concern rather than silently skipping
      const titleElement = tripPage.getDayBannerTitle(i);
      const titleCount = await titleElement.count();
      expect.soft(
        titleCount,
        `Day ${i}: banner title element should exist`
      ).toBeGreaterThan(0);

      if (titleCount > 0) {
        const titleColor = await titleElement.evaluate(
          (el) => getComputedStyle(el).color
        );
        const [tr, tg, tb] = parseRgb(titleColor);
        const titleLuminance = relativeLuminance(tr, tg, tb);
        expect.soft(
          titleLuminance,
          `Day ${i}: banner title color ${titleColor} luminance should be > ${MIN_LUMINANCE}`
        ).toBeGreaterThan(MIN_LUMINANCE);
      }

      // Validate banner date computed color (TC-002)
      const dateElement = tripPage.getDayBannerDate(i);
      const dateCount = await dateElement.count();
      expect.soft(
        dateCount,
        `Day ${i}: banner date element should exist`
      ).toBeGreaterThan(0);

      if (dateCount > 0) {
        const dateColor = await dateElement.evaluate(
          (el) => getComputedStyle(el).color
        );
        const [dr, dg, db] = parseRgb(dateColor);
        const dateLuminance = relativeLuminance(dr, dg, db);
        expect.soft(
          dateLuminance,
          `Day ${i}: banner date color ${dateColor} luminance should be > ${MIN_LUMINANCE}`
        ).toBeGreaterThan(MIN_LUMINANCE);
      }
    });
  }
});
