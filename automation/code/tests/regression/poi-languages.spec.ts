import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';

/**
 * Validates that all POI card names follow the language_preference.poi_languages
 * rule from trip_details.json: ["Hungarian", "Russian"].
 *
 * Every POI name must contain both:
 *   - Hungarian text (Latin script)
 *   - Russian text (Cyrillic script)
 *
 * Expected format examples:
 *   "Halászbástya / Рыбацкий бастион"
 *   "Budavári Palota / Будайская крепость"
 */

const CYRILLIC_REGEX = /[\u0400-\u04FF]/;
const LATIN_REGEX = /[A-Za-zÀ-ÖØ-öø-ÿŐőŰű]/;

test.describe('POI Cards — Language Compliance (poi_languages)', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('every POI card name should contain Hungarian text (Latin script)', async () => {
    const count = await tripPage.poiCards.count();
    expect(count).toBeGreaterThan(0);

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const nameLocator = tripPage.getPoiCardName(tripPage.poiCards.nth(i));
      const text = await nameLocator.textContent();
      if (!text || !LATIN_REGEX.test(text)) {
        failures.push(`POI #${i + 1}: "${text ?? '(empty)'}"`);
      }
    }
    expect(failures, `POI names missing Hungarian (Latin) text:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('every POI card name should contain Russian text (Cyrillic script)', async () => {
    const count = await tripPage.poiCards.count();
    expect(count).toBeGreaterThan(0);

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const nameLocator = tripPage.getPoiCardName(tripPage.poiCards.nth(i));
      const text = await nameLocator.textContent();
      if (!text || !CYRILLIC_REGEX.test(text)) {
        failures.push(`POI #${i + 1}: "${text ?? '(empty)'}"`);
      }
    }
    expect(failures, `POI names missing Russian (Cyrillic) text:\n${failures.join('\n')}`).toHaveLength(0);
  });

  test('every POI card name should contain both languages with a separator', async () => {
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

      const hasLatin = LATIN_REGEX.test(text);
      const hasCyrillic = CYRILLIC_REGEX.test(text);

      if (!hasLatin || !hasCyrillic) {
        const missing = !hasLatin ? 'Hungarian' : 'Russian';
        failures.push(`POI #${i + 1}: "${text}" — missing ${missing}`);
      }
    }
    expect(
      failures,
      `POI names not compliant with poi_languages ["Hungarian", "Russian"]:\n${failures.join('\n')}`
    ).toHaveLength(0);
  });
});
