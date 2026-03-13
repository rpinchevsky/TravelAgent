import { test, expect } from '@playwright/test';
import { TripPage } from '../pages/TripPage';
import {
  loadPoiLanguageConfig,
  findMissingLanguages,
  requiresMultipleScripts,
  type PoiLanguageConfig,
} from '../utils/language-config';

/**
 * Validates that activity labels in itinerary tables follow the
 * language_preference.poi_languages rule from trip_details.json.
 *
 * Rule: When an activity label references a specific POI (attraction,
 * restaurant, park, landmark), the name MUST include all poi_languages.
 *
 * Generic actions (transport, generic meal categories, walks) are exempt
 * and remain in reporting_language only.
 *
 * Languages and scripts are loaded dynamically — no hardcoded assumptions.
 */

/**
 * Generic action prefixes that do NOT require bilingual naming on their own.
 * These are purely logistical actions (transport, meals as category, walks).
 * When followed by "—" and a specific venue name, the venue part IS a POI.
 */
const GENERIC_PREFIXES = [
  'Выезд', 'Обед', 'Переезд', 'Ужин', 'Возвращение', 'Шоппинг',
  'Прогулка', 'Отдых', 'Завтрак', 'Посадка', 'Прибытие', 'Заселение',
  'Катание', 'Вылет', 'Перелёт', 'Трансфер', 'Свободное время',
  'Смена караула', 'Отъезд', 'Дунайкорзо', 'Мороженое', 'Детская площадка',
  'Переход', 'Продолжение', 'Утренний сюрприз', 'Вечер', 'Сборы', 'Аэропорт',
  'Прилёт', 'Пикник', 'Спуск', 'Набережная', 'Утренние подарки', 'Подъём',
];

function stripEmoji(text: string): string {
  return text.replace(/^[\p{Emoji}\p{Emoji_Presentation}\p{Emoji_Modifier_Base}\p{Emoji_Component}\uFE0F\u200D\s]+/u, '');
}

/**
 * Determines if a label references a specific POI that requires multilingual naming.
 *
 * - "🚗 Выезд к Маргит-острову" → generic (transport, no POI name)
 * - "🍽️ Обед — Robinson Étterem" → POI (restaurant name after "—")
 * - "🏛️ Halászbástya / Рыбацкий бастион" → POI (attraction name)
 * - "💦 Palatinus Strand" → POI (attraction, missing second language)
 * - "🏛️ Прогулка по острову" → generic (descriptive walk)
 */
function referencesPoi(text: string): boolean {
  const stripped = stripEmoji(text);

  const startsWithGeneric = GENERIC_PREFIXES.some(prefix =>
    stripped.startsWith(prefix)
  );

  if (startsWithGeneric) {
    const dashIndex = stripped.indexOf('—');
    if (dashIndex !== -1) {
      const afterDash = stripped.substring(dashIndex + 1).trim();
      return afterDash.length > 0;
    }
    return false;
  }

  return true;
}

function isGenericAction(text: string): boolean {
  return !referencesPoi(text);
}

let config: PoiLanguageConfig;

test.beforeAll(() => {
  config = loadPoiLanguageConfig();
});

test.describe('Activity Labels — Language Compliance (poi_languages)', () => {
  let tripPage: TripPage;

  test.beforeEach(async ({ page, baseURL }) => {
    tripPage = new TripPage(page);
    await page.goto(baseURL!);
  });

  test('POI-referencing activity labels should contain all configured poi_languages', async () => {
    const count = await tripPage.activityLabels.count();
    expect(count).toBeGreaterThan(0);

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const label = tripPage.activityLabels.nth(i);
      const text = (await label.textContent()) ?? '';
      if (!referencesPoi(text)) continue;

      // Skip clickable labels — they link to bilingual POI cards
      // (bilingual naming is validated by poi-languages.spec.ts on the card itself)
      const tagName = await label.evaluate(el => el.tagName);
      if (tagName === 'A') continue;

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

  test('POI-referencing activity labels should use "/" separator between languages', async () => {
    test.skip(
      !requiresMultipleScripts(config.poiLanguages),
      'All poi_languages use the same script — separator check not applicable'
    );

    const count = await tripPage.activityLabels.count();
    expect(count).toBeGreaterThan(0);

    const failures: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = (await tripPage.activityLabels.nth(i).textContent()) ?? '';
      if (!referencesPoi(text)) continue;

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

  test('generic action labels should not be flagged (sanity check)', async () => {
    const count = await tripPage.activityLabels.count();
    expect(count).toBeGreaterThan(0);

    let genericCount = 0;
    for (let i = 0; i < count; i++) {
      const text = (await tripPage.activityLabels.nth(i).textContent()) ?? '';
      if (isGenericAction(text)) {
        genericCount++;
      }
    }
    expect(genericCount).toBeGreaterThan(0);
  });
});
