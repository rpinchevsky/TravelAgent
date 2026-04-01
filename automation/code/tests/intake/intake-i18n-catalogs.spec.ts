import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * i18n External Catalog — Filesystem Validation Tests
 *
 * Validates JSON catalog file existence, structure, data integrity,
 * cross-catalog consistency, and rule file documentation updates.
 * These are filesystem-only tests (no browser needed) except TC-106 and TC-131.
 *
 * Test cases: TC-100 through TC-107, TC-125, TC-126, TC-127, TC-131, TC-350
 * Spec file: intake-i18n-catalogs.spec.ts (11 tests)
 */

const SUPPORTED_LANGUAGES = [
  'en', 'ru', 'he', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar',
] as const;

const FULLY_TRANSLATED = ['en', 'ru', 'he'] as const;

const FALLBACK_LANGUAGES = [
  'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar',
] as const;

// Special keys that are not flat key-value strings
const SPECIAL_KEYS = ['_items', 'months', 'days_short'] as const;

// Base language used as reference catalog for cross-language comparisons
const BASE_LANG =
  'en';

// Project root is four levels up from automation/code/tests/intake/
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
const localesDir = path.join(projectRoot, 'locales');

/** Load and parse a locale file. Returns null on failure. */
function loadLocale(lang: string): Record<string, unknown> | null {
  const filePath = path.join(localesDir, `ui_${lang}.json`);
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/** Extract non-special top-level keys from a catalog */
function getUiKeys(catalog: Record<string, unknown>): string[] {
  return Object.keys(catalog).filter(
    (k) => !(SPECIAL_KEYS as readonly string[]).includes(k)
  );
}

test.describe('i18n Catalog Files — Filesystem Validation', () => {
  test('TC-100: JSON catalog files exist with correct naming', async () => {
    // REQ-001 -> AC-1, AC-2, AC-3
    expect(fs.existsSync(localesDir), 'locales/ directory exists').toBe(true);

    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(localesDir, `ui_${lang}.json`);
      expect.soft(
        fs.existsSync(filePath),
        `ui_${lang}.json exists`
      ).toBe(true);
    }

    // Verify no separate items_i18n.json (DD v2 merged into per-lang _items)
    const separateItems = path.join(localesDir, 'items_i18n.json');
    expect(
      fs.existsSync(separateItems),
      'No separate items_i18n.json file'
    ).toBe(false);
  });

  test('TC-101: JSON catalog files are valid JSON with correct structure', async () => {
    // REQ-001 -> AC-4, AC-6
    for (const lang of SUPPORTED_LANGUAGES) {
      const catalog = loadLocale(lang);
      expect.soft(catalog, `ui_${lang}.json parses as valid JSON`).not.toBeNull();
      if (!catalog) continue;

      expect.soft(
        typeof catalog === 'object' && !Array.isArray(catalog),
        `ui_${lang}.json is a non-null object`
      ).toBe(true);

      // Verify flat key-value for non-special keys
      const uiKeys = getUiKeys(catalog);
      for (const key of uiKeys) {
        expect.soft(
          typeof catalog[key],
          `ui_${lang}.json key "${key}" has string value`
        ).toBe('string');
      }

      // Verify months is array of 12 strings
      const months = catalog['months'];
      expect.soft(Array.isArray(months), `ui_${lang}.json months is array`).toBe(true);
      if (Array.isArray(months)) {
        expect.soft(months.length, `ui_${lang}.json months has 12 entries`).toBe(12);
        for (const m of months) {
          expect.soft(typeof m, `ui_${lang}.json month entry is string`).toBe('string');
        }
      }

      // Verify days_short is array of 7 strings
      const days = catalog['days_short'];
      expect.soft(Array.isArray(days), `ui_${lang}.json days_short is array`).toBe(true);
      if (Array.isArray(days)) {
        expect.soft(days.length, `ui_${lang}.json days_short has 7 entries`).toBe(7);
        for (const d of days) {
          expect.soft(typeof d, `ui_${lang}.json day entry is string`).toBe('string');
        }
      }
    }
  });

  test('TC-102: Each catalog contains _items key with correct structure', async () => {
    // REQ-001 -> AC-5; REQ-003 -> AC-1
    const itemCounts: number[] = [];

    for (const lang of SUPPORTED_LANGUAGES) {
      const catalog = loadLocale(lang);
      if (!catalog) continue;

      const items = catalog['_items'] as Record<string, string> | undefined;
      expect.soft(
        items !== undefined && items !== null && typeof items === 'object',
        `ui_${lang}.json has _items object`
      ).toBe(true);

      if (!items || typeof items !== 'object') continue;

      const entryCount = Object.keys(items).length;
      expect.soft(
        entryCount,
        `ui_${lang}.json _items has 100+ entries (found ${entryCount})`
      ).toBeGreaterThan(100);

      // Verify all values are non-empty strings
      for (const [key, val] of Object.entries(items)) {
        expect.soft(
          typeof val === 'string' && val.length > 0,
          `ui_${lang}.json _items["${key}"] is non-empty string`
        ).toBe(true);
      }

      itemCounts.push(entryCount);
    }

    // Verify consistent counts across all files
    if (itemCounts.length > 1) {
      const first = itemCounts[0];
      for (let i = 1; i < itemCounts.length; i++) {
        expect.soft(
          itemCounts[i],
          `_items count in file ${i} matches first file`
        ).toBe(first);
      }
    }
  });

  test('TC-103: Key counts match across catalogs (no keys lost)', async () => {
    // REQ-001 -> AC-7; REQ-007 -> AC-1, AC-2, AC-3
    const enCatalog = loadLocale('en');
    expect(enCatalog, 'English catalog loads').not.toBeNull();
    if (!enCatalog) return;

    const enUiKeys = getUiKeys(enCatalog);
    expect(
      enUiKeys.length,
      `English catalog has 350+ UI keys (found ${enUiKeys.length})`
    ).toBeGreaterThan(350);

    for (const lang of SUPPORTED_LANGUAGES) {
      if (lang === BASE_LANG) continue;
      const catalog = loadLocale(lang);
      if (!catalog) continue;

      const langUiKeys = getUiKeys(catalog);
      expect.soft(
        langUiKeys.length,
        `ui_${lang}.json UI key count matches English (${enUiKeys.length})`
      ).toBe(enUiKeys.length);
    }
  });

  test('TC-104: _items entries match across EN, RU, HE catalogs', async () => {
    // REQ-007 -> AC-4
    const enCatalog = loadLocale('en');
    const ruCatalog = loadLocale('ru');
    const heCatalog = loadLocale('he');
    expect(enCatalog, 'EN catalog loads').not.toBeNull();
    expect(ruCatalog, 'RU catalog loads').not.toBeNull();
    expect(heCatalog, 'HE catalog loads').not.toBeNull();
    if (!enCatalog || !ruCatalog || !heCatalog) return;

    const enItems = enCatalog['_items'] as Record<string, string>;
    const ruItems = ruCatalog['_items'] as Record<string, string>;
    const heItems = heCatalog['_items'] as Record<string, string>;

    const enKeys = Object.keys(enItems).sort();
    const ruKeys = Object.keys(ruItems).sort();
    const heKeys = Object.keys(heItems).sort();

    // Identical key sets
    expect(ruKeys, 'RU _items keys match EN').toEqual(enKeys);
    expect(heKeys, 'HE _items keys match EN').toEqual(enKeys);

    // EN has identity mappings (value === key)
    let enIdentityCount = 0;
    for (const key of enKeys) {
      if (enItems[key] === key) enIdentityCount++;
    }
    expect(
      enIdentityCount,
      `EN _items are identity mappings (${enIdentityCount}/${enKeys.length})`
    ).toBe(enKeys.length);

    // RU has actual translations (at least 50% differ from key)
    let ruTranslated = 0;
    for (const key of enKeys) {
      if (ruItems[key] !== key) ruTranslated++;
    }
    const ruPct = (ruTranslated / enKeys.length) * 100;
    expect(
      ruPct,
      `RU _items has 50%+ real translations (${ruPct.toFixed(1)}%)`
    ).toBeGreaterThanOrEqual(50);

    // HE has actual translations (at least 50% differ from key)
    let heTranslated = 0;
    for (const key of enKeys) {
      if (heItems[key] !== key) heTranslated++;
    }
    const hePct = (heTranslated / enKeys.length) * 100;
    expect(
      hePct,
      `HE _items has 50%+ real translations (${hePct.toFixed(1)}%)`
    ).toBeGreaterThanOrEqual(50);
  });

  test('TC-105: Fallback language files are copies of English', async () => {
    // REQ-001 -> AC-4, AC-7
    const enCatalog = loadLocale('en');
    expect(enCatalog, 'EN catalog loads').not.toBeNull();
    if (!enCatalog) return;

    const enUiKeys = getUiKeys(enCatalog);
    const enItems = enCatalog['_items'] as Record<string, string>;
    const enItemKeys = Object.keys(enItems).sort();

    for (const lang of FALLBACK_LANGUAGES) {
      const catalog = loadLocale(lang);
      if (!catalog) continue;

      // Keys must match English
      const langUiKeys = getUiKeys(catalog);
      expect.soft(
        langUiKeys.sort(),
        `ui_${lang}.json UI keys match English`
      ).toEqual(enUiKeys.sort());

      // _items keys must match English
      const items = catalog['_items'] as Record<string, string>;
      if (items) {
        const itemKeys = Object.keys(items).sort();
        expect.soft(itemKeys, `ui_${lang}.json _items keys match English`).toEqual(enItemKeys);

        // _items values should be identity (English names)
        for (const key of itemKeys) {
          expect.soft(
            items[key],
            `ui_${lang}.json _items["${key}"] is identity mapping`
          ).toBe(key);
        }
      }
    }
  });

  test('TC-107: TRANSLATIONS and ITEM_I18N consts removed from HTML', async () => {
    // REQ-002 -> AC-9; REQ-003 -> AC-6
    const htmlPath = path.join(projectRoot, 'trip_intake.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // Old consts must not exist
    expect(
      /(?:const|var|let)\s+TRANSLATIONS\b/.test(htmlContent),
      'No TRANSLATIONS declaration found'
    ).toBe(false);
    expect(
      /(?:const|var|let)\s+ITEM_I18N\b/.test(htmlContent),
      'No ITEM_I18N declaration found'
    ).toBe(false);

    // New infrastructure must exist
    expect(
      /_uiCache/.test(htmlContent),
      '_uiCache variable present in HTML'
    ).toBe(true);
    expect(
      /_EMERGENCY_CATALOG/.test(htmlContent),
      '_EMERGENCY_CATALOG variable present in HTML'
    ).toBe(true);
    expect(
      /fetchUiCatalog/.test(htmlContent),
      'fetchUiCatalog function present in HTML'
    ).toBe(true);
  });

  test('TC-125: No build step required — catalogs are raw JSON', async () => {
    // REQ-004 -> AC-3
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(localesDir, `ui_${lang}.json`);
      if (!fs.existsSync(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf-8');

      // Must be plain JSON (no import/export/require statements)
      expect.soft(
        /^\s*(import|export|require)\b/m.test(content),
        `ui_${lang}.json has no module syntax`
      ).toBe(false);
    }

    // trip_intake.html must not reference bundler output
    const htmlPath = path.join(projectRoot, 'trip_intake.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
    expect(
      /\.bundle\.js|dist\/|build\//i.test(htmlContent),
      'No bundler output references in HTML'
    ).toBe(false);
  });

  test('TC-126: Rule file updates — trip_intake_rules.md', async () => {
    // REQ-006 -> AC-1, AC-2, AC-3, AC-4, AC-7
    const rulesPath = path.join(projectRoot, 'trip_intake_rules.md');
    const content = fs.readFileSync(rulesPath, 'utf-8');

    // AC-1: Documents locales/ folder structure
    expect.soft(
      /locales\//i.test(content),
      'Rules mention locales/ folder'
    ).toBe(true);

    // AC-2: Documents setLanguage fetching external JSON
    expect.soft(
      /setLanguage/i.test(content) || /fetch/i.test(content),
      'Rules document async fetch mechanism'
    ).toBe(true);

    // AC-3: How to Modify — adding UI text to ui_{lang}.json
    expect.soft(
      /ui_\{?lang\}?\.json|ui_[a-z]{2}\.json/i.test(content),
      'Rules document UI text modification in locale files'
    ).toBe(true);

    // AC-4: How to Modify — adding items to _items
    expect.soft(
      /_items/i.test(content),
      'Rules document _items modification'
    ).toBe(true);

    // AC-7: Existing rules retained (RTL, data-i18n convention)
    expect.soft(
      /data-i18n/i.test(content),
      'Existing data-i18n rules retained'
    ).toBe(true);
    expect.soft(
      /rtl/i.test(content),
      'Existing RTL rules retained'
    ).toBe(true);
  });

  test('TC-127: Rule file updates — trip_intake_design.md', async () => {
    // REQ-006 -> AC-5, AC-6, AC-7
    const designPath = path.join(projectRoot, 'trip_intake_design.md');
    const content = fs.readFileSync(designPath, 'utf-8');

    // AC-5: Documents fetch/cache/fallback
    expect.soft(
      /fetch/i.test(content),
      'Design doc mentions fetch mechanism'
    ).toBe(true);
    expect.soft(
      /cache|_uiCache/i.test(content),
      'Design doc mentions caching'
    ).toBe(true);

    // AC-6: Documents HTTP requirement
    expect.soft(
      /http|file:\/\//i.test(content),
      'Design doc documents HTTP serving requirement'
    ).toBe(true);

    // AC-7: Existing rules retained
    expect.soft(
      /data-i18n/i.test(content),
      'Existing data-i18n rules retained in design doc'
    ).toBe(true);
    expect.soft(
      /setLanguage/i.test(content),
      'Existing setLanguage documentation retained'
    ).toBe(true);
  });

  test('TC-350: no Unicode replacement characters (U+FFFD) in any locale file', async () => {
    // Catches encoding corruption where valid characters are mangled into U+FFFD (�).
    // Language-agnostic: checks encoding integrity, not specific translations.
    const corrupted: Array<{ lang: string; key: string; snippet: string }> = [];

    for (const lang of SUPPORTED_LANGUAGES) {
      const catalog = loadLocale(lang);
      if (!catalog) continue;

      function scanValue(val: unknown, keyPath: string) {
        if (typeof val === 'string') {
          if (val.includes('\uFFFD')) {
            corrupted.push({
              lang,
              key: keyPath,
              snippet: val.slice(0, 80),
            });
          }
        } else if (Array.isArray(val)) {
          for (let i = 0; i < val.length; i++) {
            scanValue(val[i], `${keyPath}[${i}]`);
          }
        } else if (typeof val === 'object' && val !== null) {
          for (const [k, v] of Object.entries(val)) {
            scanValue(v, `${keyPath}.${k}`);
          }
        }
      }

      for (const [key, value] of Object.entries(catalog)) {
        scanValue(value, key);
      }
    }

    for (const entry of corrupted) {
      expect.soft(
        null,
        `ui_${entry.lang}.json key "${entry.key}" contains U+FFFD: "${entry.snippet}"`
      ).toBeNull();
    }

    expect(
      corrupted.length,
      `Found ${corrupted.length} corrupted value(s): ${corrupted.map(e => `ui_${e.lang}.json → ${e.key}`).join(', ')}`
    ).toBe(0);
  });
});

