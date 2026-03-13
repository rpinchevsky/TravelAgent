import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';
import {
  loadPoiLanguageConfig,
  findMissingLanguages,
  requiresMultipleScripts,
  type PoiLanguageConfig,
} from '../utils/language-config';

/**
 * Validates that all POI card names follow the language_preference.poi_languages
 * rule from trip_details.json.
 *
 * Languages and scripts are loaded dynamically — no hardcoded assumptions.
 */

let config: PoiLanguageConfig;

test.beforeAll(() => {
  config = loadPoiLanguageConfig();
});

test.describe('POI Cards — Language Compliance (poi_languages)', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('every POI card name should contain all configured poi_languages', async () => {
    const count = await tripPage.poiCards.count();
    expect(count).toBeGreaterThan(0);

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const nameLocator = tripPage.getPoiCardName(tripPage.poiCards.nth(i));
      const text = await nameLocator.textContent();
      if (!text) {
        failures.push(`POI #${i + 1}: (empty name)`);
        continue;
      }

      const missing = findMissingLanguages(text, config.poiLanguages);
      if (missing.length > 0) {
        failures.push(`POI #${i + 1}: "${text}" — missing ${missing.join(', ')}`);
      }
    }

    const langList = config.poiLanguages.map(v => v.language).join(', ');
    expect(
      failures,
      `POI names not compliant with poi_languages [${langList}]:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });

  test('every POI card name should use "/" separator between languages', async () => {
    // Only meaningful when multiple distinct scripts are configured
    test.skip(
      !requiresMultipleScripts(config.poiLanguages),
      'All poi_languages use the same script — separator check not applicable'
    );

    const count = await tripPage.poiCards.count();
    expect(count).toBeGreaterThan(0);

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const nameLocator = tripPage.getPoiCardName(tripPage.poiCards.nth(i));
      const text = await nameLocator.textContent();
      if (!text) continue;

      const missing = findMissingLanguages(text, config.poiLanguages);
      // Only check separator if all languages are present
      if (missing.length === 0 && !text.includes('/')) {
        failures.push(`POI #${i + 1}: "${text}" — has all scripts but missing "/" separator`);
      }
    }

    expect(
      failures,
      `Bilingual POI names must use "/" separator:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });
});
