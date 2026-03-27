import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { IntakePage } from '../pages/IntakePage';

/**
 * Wheelchair Accessibility Question — Progression Tests
 *
 * Validates the wheelchair accessibility question on Step 6 of the intake wizard:
 * visibility across depths, option card structure, default selection state,
 * toggle behavior, markdown output, i18n key presence, and DOM i18n attributes.
 *
 * Test cases: TC-147 through TC-153
 * Spec file: intake-wheelchair.spec.ts (7 test cases)
 *
 * QF-1 resolution: generateMarkdown() uses hard-coded English labels for all
 * field keys (e.g., "Accessibility needs", "Wheelchair accessible"), regardless
 * of UI language. This matches the existing pattern — markdown assertions using
 * English text are intentional exceptions to the language-independence rule.
 */

const SUPPORTED_LANGUAGES = [
  'en', 'ru', 'he', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar',
] as const;

// Project root is four levels up from automation/code/tests/intake/
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
const localesDir = path.join(projectRoot, 'locales');

// --- Required i18n keys for TC-152 ---
const REQUIRED_I18N_KEYS = [
  's6_wheelchair',
  's6_wheelchair_no',
  's6_wheelchair_no_desc',
  's6_wheelchair_yes',
  's6_wheelchair_yes_desc',
] as const;

test.describe('Wheelchair Question — Visibility (TC-147)', () => {
  // TC-147: Wheelchair question visible on Step 6 at all depth levels
  // REQ-010 -> AC-1; REQ-006 -> AC-1, AC-2
  // Data-driven loop over all three depth levels
  for (const depth of [10, 20, 30] as const) {
    test(`TC-147: wheelchair question visible on Step 6 at depth ${depth}`, async ({ page }) => {
      const intake = new IntakePage(page);
      await intake.setupWithDepth(depth);
      await intake.waitForI18nReady();
      await intake.navigateToStep(6);

      // Assert wheelchair question is visible
      await expect(intake.wheelchairQuestion).toBeVisible();

      // Assert exactly 2 option cards within the wheelchair question
      const cards = intake.wheelchairQuestion.locator('.q-card');
      await expect(cards).toHaveCount(2);
    });
  }
});

test.describe('Wheelchair Question — Default & Toggle (TC-148/TC-149)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(6);
  });

  test('TC-148: wheelchair question defaults to "No Requirement" selected', async () => {
    // REQ-006 -> AC-3; REQ-010 -> AC-3
    const selectedCards = intake.wheelchairQuestion.locator('.q-card.is-selected');
    await expect(selectedCards).toHaveCount(1);

    const selectedValue = await selectedCards.first().getAttribute('data-value');
    expect(selectedValue, 'default selection should be "no"').toBe('no');
  });

  test('TC-149: selecting wheelchair "yes" deselects "no" and vice versa', async () => {
    // REQ-006 -> AC-3; REQ-010 -> AC-3
    const yesCard = intake.wheelchairQuestion.locator('.q-card[data-value="yes"]');
    const noCard = intake.wheelchairQuestion.locator('.q-card[data-value="no"]');

    // Click "yes" card
    await yesCard.click();
    await expect(yesCard).toHaveClass(/is-selected/);
    const selectedAfterYes = intake.wheelchairQuestion.locator('.q-card.is-selected');
    await expect(selectedAfterYes).toHaveCount(1);

    // Click "no" card to toggle back
    await noCard.click();
    await expect(noCard).toHaveClass(/is-selected/);
    const selectedAfterNo = intake.wheelchairQuestion.locator('.q-card.is-selected');
    await expect(selectedAfterNo).toHaveCount(1);
  });
});

test.describe('Wheelchair Question — Markdown Output (TC-150/TC-151)', () => {
  test('TC-150: selecting wheelchair "yes" produces field in markdown output', async ({ page }) => {
    // REQ-010 -> AC-2; REQ-006 -> AC-4
    // QF-1: generateMarkdown() uses English-only labels — "Wheelchair accessible"
    // is a hard-coded English key in the output, matching the existing pattern
    // for "Accessibility needs" and other fields. This is intentional.
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);
    await intake.waitForI18nReady();
    await intake.navigateToStep(6);

    // Select wheelchair "yes"
    const yesCard = intake.wheelchairQuestion.locator('.q-card[data-value="yes"]');
    await yesCard.click();
    await expect(yesCard).toHaveClass(/is-selected/);

    // Navigate to Step 7 (Review)
    await intake.navigateToStep(7);

    // Extract raw markdown
    const rawMd = await intake.getRawMarkdown();
    expect(rawMd, 'markdown should contain Wheelchair accessible').toContain('Wheelchair accessible');
    expect(rawMd, 'markdown wheelchair value should be yes').toMatch(/Wheelchair accessible.*\byes\b/);
  });

  test('TC-151: wheelchair "no" (default) produces field in markdown output', async ({ page }) => {
    // REQ-010 -> AC-2; REQ-006 -> AC-4
    // QF-1: same justification as TC-150
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);
    await intake.waitForI18nReady();

    // Navigate directly to Step 7 without changing default wheelchair selection
    await intake.navigateToStep(7);

    // Extract raw markdown
    const rawMd = await intake.getRawMarkdown();
    expect(rawMd, 'markdown should contain Wheelchair accessible').toContain('Wheelchair accessible');
    expect(rawMd, 'markdown wheelchair value should be no').toMatch(/Wheelchair accessible.*\bno\b/);
  });
});

test.describe('Wheelchair Question — i18n Keys (TC-152)', () => {
  test('TC-152: wheelchair i18n keys present in all 12 locale files', async () => {
    // REQ-006 -> AC-5
    // Static file analysis — no browser needed
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

      for (const key of REQUIRED_I18N_KEYS) {
        const value = catalog[key];
        expect.soft(
          typeof value === 'string' && value.length > 0,
          `ui_${lang}.json: ${key} exists and non-empty`
        ).toBe(true);
      }
    }
  });
});

test.describe('Wheelchair Question — i18n DOM Attributes (TC-153)', () => {
  test('TC-153: wheelchair question has correct data-i18n attributes', async ({ page }) => {
    // REQ-006 -> AC-5
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(6);

    // Batch all DOM attribute queries in a single evaluate call
    const attrs = await page.evaluate(() => {
      const q = document.querySelector('[data-question-key="wheelchairAccessible"]');
      if (!q) return null;

      const label = q.querySelector('.field__label, .question__label, [data-i18n="s6_wheelchair"]');
      const noTitle = q.querySelector('.q-card[data-value="no"] .q-card__title');
      const noDesc = q.querySelector('.q-card[data-value="no"] .q-card__desc');
      const yesTitle = q.querySelector('.q-card[data-value="yes"] .q-card__title');
      const yesDesc = q.querySelector('.q-card[data-value="yes"] .q-card__desc');

      return {
        labelI18n: label?.getAttribute('data-i18n') ?? null,
        noTitleI18n: noTitle?.getAttribute('data-i18n') ?? null,
        noDescI18n: noDesc?.getAttribute('data-i18n') ?? null,
        yesTitleI18n: yesTitle?.getAttribute('data-i18n') ?? null,
        yesDescI18n: yesDesc?.getAttribute('data-i18n') ?? null,
      };
    });

    expect(attrs, 'wheelchair question found in DOM').not.toBeNull();
    if (!attrs) return;

    expect.soft(attrs.labelI18n, 'label i18n key').toBe('s6_wheelchair');
    expect.soft(attrs.noTitleI18n, 'no card title i18n key').toBe('s6_wheelchair_no');
    expect.soft(attrs.noDescI18n, 'no card desc i18n key').toBe('s6_wheelchair_no_desc');
    expect.soft(attrs.yesTitleI18n, 'yes card title i18n key').toBe('s6_wheelchair_yes');
    expect.soft(attrs.yesDescI18n, 'yes card desc i18n key').toBe('s6_wheelchair_yes_desc');
  });
});
