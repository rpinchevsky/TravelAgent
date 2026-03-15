import { test, expect } from '../fixtures/shared-page';
import {
  loadPoiLanguageConfig,
  findMissingLanguages,
  requiresMultipleScripts,
  type PoiLanguageConfig,
} from '../utils/language-config';

/**
 * Validates that activity labels in itinerary tables follow the
 * language_preference.poi_languages rule from trip_details.md.
 *
 * Rule: When an activity label references a specific POI (attraction,
 * restaurant, park, landmark), the name MUST include all poi_languages.
 *
 * Generic actions (transport, generic meal categories, walks) are exempt
 * and remain in reporting_language only.
 *
 * Language-independent: POI vs generic distinction is structural —
 * <a class="activity-label"> = POI reference, <span> = generic action.
 * No text parsing or language-specific prefix lists needed.
 */

let config: PoiLanguageConfig;

test.beforeAll(() => {
  config = loadPoiLanguageConfig();
});

test.describe('Activity Labels — Language Compliance (poi_languages)', () => {
  test('POI-referencing activity labels should contain all configured poi_languages', async ({ tripPage }) => {
    // Only check <a> activity labels (POI references) — skip <span> (generic actions).
    // The rendering pipeline encodes this distinction via element type.
    const poiLabels = tripPage.clickableActivityLabels;
    const count = await poiLabels.count();
    expect(count).toBeGreaterThan(0);

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await poiLabels.nth(i).textContent()) ?? '';
      const missing = findMissingLanguages(text, config.poiLanguages);
      if (missing.length > 0) {
        failures.push(`Label #${i + 1}: "${text}" — missing ${missing.join(', ')}`);
      }
    }

    const langList = config.poiLanguages.map(v => v.language).join(', ');
    expect(
      failures,
      `Activity labels referencing POIs must include all poi_languages [${langList}]:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });

  test('POI-referencing activity labels should use "/" separator between languages', async ({ tripPage }) => {
    test.skip(
      !requiresMultipleScripts(config.poiLanguages),
      'All poi_languages use the same script — separator check not applicable'
    );

    const poiLabels = tripPage.clickableActivityLabels;
    const count = await poiLabels.count();
    expect(count).toBeGreaterThan(0);

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await poiLabels.nth(i).textContent()) ?? '';
      const missing = findMissingLanguages(text, config.poiLanguages);
      if (missing.length === 0 && !text.includes('/')) {
        failures.push(`Label #${i + 1}: "${text}" — has all scripts but missing "/" separator`);
      }
    }

    expect(
      failures,
      `Bilingual activity labels must use "/" separator:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });

  test('generic action labels should exist (sanity check)', async ({ tripPage }) => {
    // Generic actions are <span> elements; POI references are <a> elements.
    const allCount = await tripPage.activityLabels.count();
    const clickableCount = await tripPage.clickableActivityLabels.count();
    const genericCount = allCount - clickableCount;
    expect(allCount).toBeGreaterThan(0);
    expect(genericCount).toBeGreaterThan(0);
  });
});
