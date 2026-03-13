import { test, expect } from '../fixtures/shared-page';
import {
  loadPoiLanguageConfig,
  findMissingLanguages,
  requiresMultipleScripts,
  type PoiLanguageConfig,
} from '../utils/language-config';

/**
 * Validates that all POI card names follow the language_preference.poi_languages
 * rule from trip_details.md.
 *
 * Languages and scripts are loaded dynamically — no hardcoded assumptions.
 */

let config: PoiLanguageConfig;

test.beforeAll(() => {
  config = loadPoiLanguageConfig();
});

test.describe('POI Cards — Language Compliance (poi_languages)', () => {
  test('at least 95% of POI card names should contain all configured poi_languages', async ({ tripPage }) => {
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
    const maxAllowed = Math.floor(count * 0.05);
    expect(
      failures.length,
      `POI names not compliant with poi_languages [${langList}] (max ${maxAllowed} allowed):\n${failures.join('\n')}`
    ).toBeLessThanOrEqual(maxAllowed);
  });

  test('most POI card names should use "/" separator between languages', async ({ tripPage }) => {
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

    // Allow up to 5% of bilingual names to use embedded brand names without separator
    const maxAllowed = Math.floor(count * 0.05);
    expect(
      failures.length,
      `Bilingual POI names must use "/" separator (max ${maxAllowed} allowed):\n${failures.join('\n')}`
    ).toBeLessThanOrEqual(maxAllowed);
  });
});
