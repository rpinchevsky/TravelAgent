import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { IntakePage } from '../pages/IntakePage';

/**
 * Mix/All Option Cards — Progression Tests
 *
 * Validates the addition of "Mix of All" option cards to three categorical
 * quiz questions: diningstyle, mealpriority, and transport.
 * Covers DOM structure, card selection, i18n keys, markdown label maps,
 * scoreFoodItem logic, and rule documentation.
 *
 * Test cases: TC-134 through TC-141
 * Spec file: intake-mix-options.spec.ts (8 test cases)
 */

const SUPPORTED_LANGUAGES = [
  'en', 'ru', 'he', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar',
] as const;

// Project root is four levels up from automation/code/tests/intake/
const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
const localesDir = path.join(projectRoot, 'locales');
const intakeHtmlPath = path.join(projectRoot, 'trip_intake.html');
const rulesPath = path.join(projectRoot, 'trip_intake_rules.md');

// --- Data-driven config for TC-134/135/136 (DOM structure tests) ---
const CARD_STRUCTURE_TESTS = [
  {
    tcId: 'TC-134',
    questionKey: 'diningstyle',
    newValue: 'mix',
    titleI18n: 'q_dine_mix',
    descI18n: 'q_dine_mix_desc',
    expectedCardCount: 4,
  },
  {
    tcId: 'TC-135',
    questionKey: 'mealpriority',
    newValue: 'all',
    titleI18n: 'q_meal_all',
    descI18n: 'q_meal_all_desc',
    expectedCardCount: 4,
  },
  {
    tcId: 'TC-136',
    questionKey: 'transport',
    newValue: 'mix',
    titleI18n: 'q_transport_mix',
    descI18n: 'q_transport_mix_desc',
    expectedCardCount: 4,
  },
] as const;

// --- Data-driven config for TC-137 (selection behavior) ---
const SELECTION_TESTS = [
  { questionKey: 'diningstyle', newValue: 'mix' },
  { questionKey: 'mealpriority', newValue: 'all' },
  { questionKey: 'transport', newValue: 'mix' },
] as const;

// --- Required i18n keys for TC-138 ---
const REQUIRED_I18N_KEYS = [
  'q_dine_mix',
  'q_dine_mix_desc',
  'q_meal_all',
  'q_meal_all_desc',
  'q_transport_mix',
  'q_transport_mix_desc',
] as const;

test.describe('Mix/All Option Cards — DOM Structure (TC-134/135/136)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    // Depth 30 ensures all three questions (T1, T2, T3) are visible
    await intake.setupWithDepth(30);
    await intake.waitForI18nReady();
  });

  test('TC-134/135/136: Questions have correct card count and mix/all card attributes', async ({ page }) => {
    // REQ-001 -> AC-1..AC-5, REQ-002 -> AC-1..AC-5, REQ-003 -> AC-1..AC-5
    // Batch all DOM queries into a single page.evaluate() call for performance
    const results = await page.evaluate((configs) => {
      return configs.map(cfg => {
        const slide = document.querySelector(`[data-question-key="${cfg.questionKey}"]`);
        if (!slide) return { found: false, questionKey: cfg.questionKey } as const;

        const cards = slide.querySelectorAll('.q-card');
        const cardCount = cards.length;

        const mixCard = slide.querySelector(`.q-card[data-value="${cfg.newValue}"]`);
        const mixCardExists = !!mixCard;

        let titleI18n = '';
        let descI18n = '';
        let iconText = '';

        if (mixCard) {
          const titleEl = mixCard.querySelector('.q-card__title');
          const descEl = mixCard.querySelector('.q-card__desc');
          const iconEl = mixCard.querySelector('.q-card__icon');
          titleI18n = titleEl?.getAttribute('data-i18n') || '';
          descI18n = descEl?.getAttribute('data-i18n') || '';
          iconText = (iconEl?.textContent || '').trim();
        }

        return {
          found: true,
          questionKey: cfg.questionKey,
          cardCount,
          mixCardExists,
          titleI18n,
          descI18n,
          iconText,
        };
      });
    }, CARD_STRUCTURE_TESTS.map(c => ({
      questionKey: c.questionKey,
      newValue: c.newValue,
    })));

    for (let i = 0; i < CARD_STRUCTURE_TESTS.length; i++) {
      const cfg = CARD_STRUCTURE_TESTS[i];
      const r = results[i];
      const q = cfg.questionKey;

      expect.soft(r.found, `${q}: question slide found`).toBe(true);
      if (!r.found) continue;

      expect.soft(r.cardCount, `${q}: ${cfg.expectedCardCount} cards`).toBe(cfg.expectedCardCount);
      expect.soft(r.mixCardExists, `${q}: ${cfg.newValue} card exists`).toBe(true);
      expect.soft(r.titleI18n, `${q}: title i18n key`).toBe(cfg.titleI18n);
      expect.soft(r.descI18n, `${q}: desc i18n key`).toBe(cfg.descI18n);
      expect.soft(r.iconText.length, `${q}: icon has content`).toBeGreaterThan(0);
    }
  });
});

test.describe('Mix/All Option Cards — Selection Behavior (TC-137)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    // Depth 30 ensures all three questions visible
    await intake.setupWithDepth(30);
    await intake.waitForI18nReady();
  });

  test('TC-137: Selecting mix/all card applies is-selected and deselects siblings', async ({ page }) => {
    // REQ-001 -> AC-6, REQ-002 -> AC-6, REQ-003 -> AC-6
    for (const cfg of SELECTION_TESTS) {
      const questionSlide = intake.questionByKey(cfg.questionKey);

      // Get the first existing card (not the new mix/all card)
      const firstCard = questionSlide.locator(`.q-card:not([data-value="${cfg.newValue}"])`).first();
      await firstCard.waitFor({ state: 'attached' });

      // Click the first card via evaluate to avoid animation timing issues
      await page.evaluate(
        ({ key }) => {
          const slide = document.querySelector(`[data-question-key="${key}"]`);
          const card = slide?.querySelector(`.q-card:not([data-value="${key === 'mealpriority' ? 'all' : 'mix'}"])`);
          if (card) (card as HTMLElement).click();
        },
        { key: cfg.questionKey }
      );

      // Verify first card is selected
      await expect(firstCard).toHaveClass(/is-selected/);

      // Now click the new mix/all card
      const mixCard = questionSlide.locator(`.q-card[data-value="${cfg.newValue}"]`);
      await mixCard.click();

      // Verify mix/all card is now selected (auto-wait)
      await expect(mixCard).toHaveClass(/is-selected/);

      // Verify exactly 1 card is selected in this question
      const selectedCount = await questionSlide.locator('.q-card.is-selected').count();
      expect.soft(selectedCount, `${cfg.questionKey}: exactly 1 selected`).toBe(1);

      // Verify the selected card is the mix/all card
      const selectedValue = await questionSlide.locator('.q-card.is-selected').getAttribute('data-value');
      expect.soft(selectedValue, `${cfg.questionKey}: selected card is ${cfg.newValue}`).toBe(cfg.newValue);
    }
  });
});

test.describe('Mix/All Option Cards — i18n Keys (TC-138)', () => {
  test('TC-138: New i18n keys present in all 12 locale files', async () => {
    // REQ-004 -> AC-1, AC-2, AC-3
    for (const lang of SUPPORTED_LANGUAGES) {
      const filePath = path.join(localesDir, `ui_${lang}.json`);

      // Verify file exists and is valid JSON
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

test.describe('Mix/All Option Cards — Markdown Label Maps (TC-139)', () => {
  test('TC-139: Label maps include new option values', async () => {
    // REQ-005 -> AC-1, AC-2, AC-3, AC-4
    // Option A: Parse HTML source and verify label map keys via regex.
    // This is a static source analysis test — faster and deterministic.
    // If the regex fails to match due to code refactoring, the test should fail clearly —
    // that failure is the correct signal to update the regex pattern, not to fall back
    // to runtime evaluation.
    const htmlSource = fs.readFileSync(intakeHtmlPath, 'utf-8');

    // diningStyleLabels must contain 'mix' key
    const diningPattern = /diningStyleLabels\s*=\s*\{[^}]*mix\s*:/;
    expect.soft(
      diningPattern.test(htmlSource),
      'diningStyleLabels.mix is present in source'
    ).toBe(true);

    // mealLabels must contain 'all' key
    const mealPattern = /mealLabels\s*=\s*\{[^}]*all\s*:/;
    expect.soft(
      mealPattern.test(htmlSource),
      'mealLabels.all is present in source'
    ).toBe(true);

    // transportLabels must contain 'mix' key
    const transportPattern = /transportLabels\s*=\s*\{[^}]*mix\s*:/;
    expect.soft(
      transportPattern.test(htmlSource),
      'transportLabels.mix is present in source'
    ).toBe(true);
  });
});

test.describe('Mix/All Option Cards — scoreFoodItem Logic (TC-140)', () => {
  test('TC-140: scoreFoodItem handles diningstyle mix correctly', async () => {
    // REQ-006 -> AC-1, AC-2, AC-3
    // Static source analysis of the scoreFoodItem function.
    // Runtime testing is deferred because the function depends on closure variables
    // and DOM state that are complex to mock in page.evaluate().
    const htmlSource = fs.readFileSync(intakeHtmlPath, 'utf-8');

    // Extract the scoreFoodItem function body
    const fnMatch = htmlSource.match(/function\s+scoreFoodItem\s*\([^)]*\)\s*\{([\s\S]*?)^\s{4}\}/m);
    expect(fnMatch, 'scoreFoodItem function found in source').toBeTruthy();
    if (!fnMatch) return;

    const fnBody = fnMatch[1];

    // AC-1 & AC-2: Verify a branch exists for style === 'mix' that assigns score >= 1
    // Pattern: if (style === 'mix') s += N  where N >= 1
    const mixBranchPattern = /if\s*\(\s*style\s*===?\s*['"]mix['"]\s*\)\s*s\s*\+=\s*(\d+)/;
    const mixMatch = fnBody.match(mixBranchPattern);
    expect(mixMatch, 'scoreFoodItem has mix style branch').toBeTruthy();

    if (mixMatch) {
      const mixScore = parseInt(mixMatch[1], 10);
      expect(mixScore, 'mix branch score >= 1').toBeGreaterThanOrEqual(1);
    }

    // AC-3: Verify original style matching branch is preserved
    // Pattern: if (item.style === style) s += 3
    const originalBranchPattern = /item\.style\s*===?\s*style\s*\)\s*s\s*\+=\s*3/;
    expect(originalBranchPattern.test(fnBody), 'original style matching branch preserved').toBe(true);
  });
});

test.describe('Mix/All Option Cards — Rule Documentation (TC-141)', () => {
  test('TC-141: Rule documentation lists new allowed values', async () => {
    // REQ-007 -> AC-1, AC-2, AC-3
    const rulesContent = fs.readFileSync(rulesPath, 'utf-8');

    // Find the Dining style line and verify it contains 'mix'
    const diningLine = rulesContent.split('\n').find(
      line => /dining style/i.test(line) && /street|casual|upscale/i.test(line)
    ) || '';
    expect.soft(diningLine, 'rules: diningstyle line found').toBeTruthy();
    expect.soft(diningLine, 'rules: diningstyle includes mix').toMatch(/mix/i);

    // Find the Meal priority line and verify it contains 'all' or 'every meal'
    const mealLine = rulesContent.split('\n').find(
      line => /meal priority/i.test(line) && /breakfast|lunch|dinner/i.test(line)
    ) || '';
    expect.soft(mealLine, 'rules: mealpriority line found').toBeTruthy();
    expect.soft(mealLine, 'rules: mealpriority includes all').toMatch(/every meal|all/i);

    // Find the Transport preference line and verify it contains 'mix'
    const transportLine = rulesContent.split('\n').find(
      line => /transport/i.test(line) && /walking|transit|taxi/i.test(line)
    ) || '';
    expect.soft(transportLine, 'rules: transport line found').toBeTruthy();
    expect.soft(transportLine, 'rules: transport includes mix').toMatch(/mix/i);
  });
});
