import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * i18n Translation Key Verification — TC-031, TC-032
 *
 * Verifies that all depth-related and new question i18n keys
 * exist in all 12 supported languages. Checks key presence only,
 * not value content (language-independence rule).
 */

const SUPPORTED_LANGUAGES = ['en', 'ru', 'he', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'] as const;

/** Depth selector i18n keys that must exist in all languages */
const DEPTH_I18N_KEYS = [
  'depth_title', 'depth_desc', 'depth_confirm', 'depth_update',
  'depth_10', 'depth_15', 'depth_20', 'depth_25', 'depth_30',
  'depth_10_time', 'depth_15_time', 'depth_20_time', 'depth_25_time', 'depth_30_time',
  'depth_recommended', 'depth_pill',
  'depth_toast_10', 'depth_toast_15', 'depth_toast_20', 'depth_toast_25', 'depth_toast_30',
];

/** New T4/T5 question keys (label key per question) */
const NEW_QUESTION_KEYS = [
  'transport', 'morningPreference', 'snacking', 'photography',
  'visitDuration', 'shopping', 'accessibility',
];

test.describe('i18n Key Verification', () => {
  // TC-031: i18n keys exist for depth selector in all 12 languages
  test('TC-031: depth selector i18n keys present in all 12 languages', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();

    // Extract TRANSLATIONS object from the page
    const missingKeys = await page.evaluate(
      ({ languages, keys }) => {
        const translations = (window as any).TRANSLATIONS;
        if (!translations) return ['TRANSLATIONS object not found on window'];

        const missing: string[] = [];
        for (const lang of languages) {
          if (!translations[lang]) {
            missing.push(`Language "${lang}" missing entirely`);
            continue;
          }
          for (const key of keys) {
            if (translations[lang][key] === undefined) {
              missing.push(`${lang}.${key}`);
            }
          }
        }
        return missing;
      },
      { languages: SUPPORTED_LANGUAGES as unknown as string[], keys: DEPTH_I18N_KEYS }
    );

    // Assert no missing keys
    for (const key of missingKeys) {
      expect.soft(true, `Missing i18n key: ${key}`).toBe(key === '' ? true : false);
    }
    expect(missingKeys.length, `${missingKeys.length} depth i18n keys missing`).toBe(0);
  });

  // TC-032: i18n keys exist for new T4/T5 questions in all 12 languages
  test('TC-032: new question i18n keys present in all 12 languages', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();

    // For each new question, check label key and option keys exist
    const missingKeys = await page.evaluate(
      ({ languages, questionKeys }) => {
        const translations = (window as any).TRANSLATIONS;
        if (!translations) return ['TRANSLATIONS object not found on window'];

        const missing: string[] = [];
        for (const lang of languages) {
          if (!translations[lang]) {
            missing.push(`Language "${lang}" missing entirely`);
            continue;
          }
          for (const qKey of questionKeys) {
            // Check question label key (e.g., "q_transport", "s4_transport", etc.)
            // The exact key format depends on implementation — check common patterns
            const labelPatterns = [
              `q_${qKey}`, `s_${qKey}`, qKey,
              `q_${qKey}_label`, `${qKey}_label`,
            ];
            const hasLabel = labelPatterns.some(k => translations[lang][k] !== undefined);
            if (!hasLabel) {
              missing.push(`${lang}: label for "${qKey}" (tried: ${labelPatterns.join(', ')})`);
            }

            // Check at least one option key exists for this question
            // Options typically use patterns like "q_transport_walk", "q_transport_transit", etc.
            const optionKeys = Object.keys(translations[lang]).filter(
              k => k.includes(qKey.toLowerCase())
            );
            if (optionKeys.length < 2) {
              missing.push(`${lang}: fewer than 2 option keys for "${qKey}" (found: ${optionKeys.length})`);
            }
          }
        }
        return missing;
      },
      { languages: SUPPORTED_LANGUAGES as unknown as string[], questionKeys: NEW_QUESTION_KEYS }
    );

    for (const key of missingKeys) {
      expect.soft(true, `Missing i18n key: ${key}`).toBe(key === '' ? true : false);
    }
    expect(missingKeys.length, `${missingKeys.length} question i18n keys missing`).toBe(0);
  });
});
