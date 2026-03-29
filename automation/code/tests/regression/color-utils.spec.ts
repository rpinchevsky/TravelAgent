import { test, expect } from '@playwright/test';
import { parseRgb, relativeLuminance } from '../utils/color-utils';

/**
 * Unit tests for color-utils.ts — sRGB luminance calculation.
 *
 * Pure-function assertions with no Playwright page dependency.
 * Hard assertions: utility correctness is foundational for banner-contrast.spec.ts.
 *
 * Pre-fix regression reference: #1C1C1E (luminance ~0.012) represents the
 * dark color that the global heading reset would apply inside themed containers.
 * TC-003 step 8 validates this boundary.
 */

test.describe('Color Utils — parseRgb', () => {
  test('should parse rgb(255, 255, 255) to [255, 255, 255]', () => {
    expect(parseRgb('rgb(255, 255, 255)')).toEqual([255, 255, 255]);
  });

  test('should parse rgb(0, 0, 0) to [0, 0, 0]', () => {
    expect(parseRgb('rgb(0, 0, 0)')).toEqual([0, 0, 0]);
  });

  test('should parse rgba(250, 250, 250, 1) to [250, 250, 250]', () => {
    expect(parseRgb('rgba(250, 250, 250, 1)')).toEqual([250, 250, 250]);
  });

  test('should throw on invalid color string', () => {
    expect(() => parseRgb('invalid')).toThrow();
  });
});

test.describe('Color Utils — relativeLuminance', () => {
  test('should return ~1.0 for white (255, 255, 255)', () => {
    expect(relativeLuminance(255, 255, 255)).toBeCloseTo(1.0, 4);
  });

  test('should return 0.0 for black (0, 0, 0)', () => {
    expect(relativeLuminance(0, 0, 0)).toBe(0.0);
  });

  test('should return ~0.95 for #FAFAFA (250, 250, 250)', () => {
    expect(relativeLuminance(250, 250, 250)).toBeCloseTo(0.9547, 2);
  });

  test('should return ~0.012 for #1C1C1E (28, 28, 30)', () => {
    // This is the pre-fix dark color from the global heading reset.
    // Luminance ~0.012 is well below the MIN_LUMINANCE threshold (0.7),
    // confirming the regression test would catch the pre-fix bug.
    expect(relativeLuminance(28, 28, 30)).toBeCloseTo(0.012, 2);
  });
});
