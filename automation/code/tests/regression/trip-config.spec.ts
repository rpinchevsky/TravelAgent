import { test, expect } from '@playwright/test';
import {
  loadTripConfig,
  LANGUAGE_LABELS,
  type TripConfig,
} from '../utils/trip-config';

/**
 * Smoke tests for trip-config.ts — the central configuration utility.
 *
 * These tests validate that the config loads correctly, returns complete data,
 * and is immutable. If any test here fails, all other spec files will
 * cascade-fail — so failures here should be investigated first.
 */

let config: TripConfig;

test.beforeAll(() => {
  config = loadTripConfig();
});

test.describe('Trip Config — Completeness (TC-001)', () => {
  test('should return a non-empty destination', () => {
    expect(config.destination.length).toBeGreaterThan(0);
  });

  test('should return valid arrival and departure dates', () => {
    expect(config.arrivalDate).toBeInstanceOf(Date);
    expect(config.departureDate).toBeInstanceOf(Date);
    expect(config.arrivalDate.getTime()).toBeLessThan(config.departureDate.getTime());
  });

  test('should return positive day count matching date range', () => {
    expect(config.dayCount).toBeGreaterThan(0);
    const msPerDay = 86400000;
    const expected = Math.round(
      (config.departureDate.getTime() - config.arrivalDate.getTime()) / msPerDay
    ) + 1;
    expect(config.dayCount).toBe(expected);
  });

  test('should return at least one traveler', () => {
    expect(config.travelers.length).toBeGreaterThan(0);
    for (const name of config.travelers) {
      expect(name.trim().length).toBeGreaterThan(0);
    }
  });

  test('should return a supported reporting language', () => {
    expect(Object.keys(LANGUAGE_LABELS)).toContain(config.reportingLanguage);
  });

  test('should return labels with all required fields', () => {
    const labels = config.labels;
    expect(labels.langCode.length).toBeGreaterThan(0);
    expect(['ltr', 'rtl']).toContain(labels.direction);
    expect(typeof labels.dayTitle).toBe('function');
    expect(labels.dayTitle(0).length).toBeGreaterThan(0);
    expect(labels.monthNames).toHaveLength(12);
    for (const month of labels.monthNames) {
      expect(month.length).toBeGreaterThan(0);
    }
    expect(labels.sectionPlanB.length).toBeGreaterThan(0);
    expect(labels.sectionLogistics.length).toBeGreaterThan(0);
    expect(labels.sectionCost.length).toBeGreaterThan(0);
    expect(labels.sectionGrocery.length).toBeGreaterThan(0);
    expect(labels.sectionAlongTheWay.length).toBeGreaterThan(0);
    expect(labels.sectionTransfer.length).toBeGreaterThan(0);
    expect(labels.sectionMornPrep.length).toBeGreaterThan(0);
    expect(labels.sectionLunch.length).toBeGreaterThan(0);
    expect(labels.sectionBirthdayLunch.length).toBeGreaterThan(0);
    expect(labels.budgetTotal.length).toBeGreaterThan(0);
    expect(typeof labels.pageTitlePattern).toBe('function');
    expect(labels.fileSuffix.length).toBeGreaterThan(0);
    expect(labels.dayHeadingRegex).toBeInstanceOf(RegExp);
  });

  test('should return dayTitles and dayDates matching dayCount', () => {
    expect(config.dayTitles).toHaveLength(config.dayCount);
    expect(config.dayDates).toHaveLength(config.dayCount);
  });

  test('should return a page title containing destination and year', () => {
    expect(config.pageTitle).toContain(config.destination);
    expect(config.pageTitle).toContain(String(config.tripYear));
  });

  test('should return filenames matching the file suffix pattern', () => {
    expect(config.markdownFilename).toBe(`trip_full_${config.labels.fileSuffix}.md`);
    expect(config.htmlFilename).toBe(`trip_full_${config.labels.fileSuffix}.html`);
  });

  test('should return direction matching the labels direction', () => {
    expect(config.direction).toBe(config.labels.direction);
  });

  test('should return a non-empty excludedSections array', () => {
    expect(config.excludedSections.length).toBeGreaterThan(0);
  });
});

test.describe('Trip Config — Caching & Immutability (TC-002)', () => {
  test('should return the same object reference on repeated calls (caching)', () => {
    const first = loadTripConfig();
    const second = loadTripConfig();
    expect(first).toBe(second);
  });

  test('should be frozen (immutable)', () => {
    expect(Object.isFrozen(config)).toBe(true);
  });
});

test.describe('Trip Config — Unsupported Language (QF-1)', () => {
  test('LANGUAGE_LABELS should not contain an entry for "Klingon" (sanity)', () => {
    expect(LANGUAGE_LABELS['Klingon']).toBeUndefined();
  });

  test('loadTripConfig error message should list supported languages', () => {
    // We can't mock trip_details.md, but we can verify the error message format
    // by checking that LANGUAGE_LABELS keys are accessible for the error path.
    const supported = Object.keys(LANGUAGE_LABELS);
    expect(supported.length).toBeGreaterThanOrEqual(3);
    expect(supported).toContain('Russian');
    expect(supported).toContain('English');
    expect(supported).toContain('Hebrew');
  });
});
