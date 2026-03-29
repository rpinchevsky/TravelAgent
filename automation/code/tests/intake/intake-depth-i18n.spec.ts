import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { IntakePage } from '../pages/IntakePage';

/**
 * i18n Translation Key Verification — TC-031, TC-032
 *
 * Verifies that all depth-related and new question i18n keys
 * exist in all 12 supported languages. Checks key presence only,
 * not value content (language-independence rule).
 */

const SUPPORTED_LANGUAGES = ['en', 'ru', 'he', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'] as const;

// Project root is four levels up from automation/code/tests/intake/
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
const localesDir = path.join(projectRoot, 'locales');

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
  test('TC-031: depth selector i18n keys present in all 12 languages', async () => {
    // Static file analysis — check locale JSON files on disk
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(localesDir, `ui_${lang}.json`);

      let catalog: Record<string, unknown> | null = null;
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        catalog = JSON.parse(content);
      } catch {
        expect.soft(false, `ui_${lang}.json: valid JSON parse`).toBe(true);
        continue;
      }

      expect.soft(catalog, `ui_${lang}.json: parsed successfully`).not.toBeNull();
      if (!catalog) continue;

      for (const key of DEPTH_I18N_KEYS) {
        const value = catalog[key];
        expect.soft(
          typeof value === 'string' && value.length > 0,
          `ui_${lang}.json: ${key} exists and non-empty`
        ).toBe(true);
      }
    }
  });

  // TC-032: i18n keys exist for new T4/T5 questions in all 12 languages
  test('TC-032: new question i18n keys present in all 12 languages', async () => {
    // Static file analysis — check locale JSON files on disk
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(localesDir, `ui_${lang}.json`);

      let catalog: Record<string, unknown> | null = null;
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        catalog = JSON.parse(content);
      } catch {
        expect.soft(false, `ui_${lang}.json: valid JSON parse`).toBe(true);
        continue;
      }

      expect.soft(catalog, `ui_${lang}.json: parsed successfully`).not.toBeNull();
      if (!catalog) continue;

      for (const qKey of NEW_QUESTION_KEYS) {
        // Check question label key — common patterns
        const labelPatterns = [
          `q_${qKey}`, `s_${qKey}`, qKey,
          `q_${qKey}_label`, `${qKey}_label`,
        ];
        const hasLabel = labelPatterns.some(k =>
          typeof catalog![k] === 'string' && (catalog![k] as string).length > 0
        );
        expect.soft(
          hasLabel,
          `ui_${lang}.json: label for "${qKey}" (tried: ${labelPatterns.join(', ')})`
        ).toBe(true);

        // Check at least one option key exists for this question
        // Some questions use abbreviated prefixes (e.g., "accessibility" -> "access_")
        const qKeyLower = qKey.toLowerCase();
        const qKeyShort = qKeyLower.substring(0, Math.min(6, qKeyLower.length));
        const optionKeys = Object.keys(catalog).filter(
          k => k.includes(qKeyLower) || k.includes(`q_${qKeyShort}`)
        );
        expect.soft(
          optionKeys.length >= 2,
          `ui_${lang}.json: at least 2 option keys for "${qKey}" (found: ${optionKeys.length})`
        ).toBe(true);
      }
    }
  });
});
