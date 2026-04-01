import { test, expect } from '@playwright/test';
import {
  SUPPORTED_LANGUAGES,
  I18N_KEY_GROUPS,
  ALL_REQUIRED_I18N_KEYS,
  loadLocale,
} from './utils/i18n-required-keys';

/**
 * Master i18n Key Validation — Single Generic Test
 *
 * Replaces: TC-031, TC-032 (depth-i18n), TC-138 (mix-options), TC-152 (wheelchair),
 * TC-223, TC-305, TC-343, TC-384 (hotel-car-i18n-keys).
 *
 * One test validates ALL required i18n keys across all 12 locale files.
 * Key groups are reported separately for traceability.
 *
 * No browser needed — pure filesystem validation.
 */

test.describe('Master i18n Key Validation', () => {
  test('all required i18n keys present and non-empty in all 12 locale files', async () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      const catalog = loadLocale(lang);
      expect.soft(catalog, `ui_${lang}.json: parses as valid JSON`).not.toBeNull();
      if (!catalog) continue;

      // Validate by group for traceability
      for (const group of I18N_KEY_GROUPS) {
        for (const key of group.keys) {
          const value = catalog[key];
          expect.soft(
            typeof value === 'string' && value.length > 0,
            `ui_${lang}.json [${group.name}]: ${key} exists and non-empty`
          ).toBe(true);
        }
      }
    }
  });
});
