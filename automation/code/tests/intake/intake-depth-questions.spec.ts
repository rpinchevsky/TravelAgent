import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Question Visibility per Depth — TC-004 through TC-009, TC-033, TC-034, TC-035
 *
 * Data-driven tests verifying correct question visibility at each depth level.
 * Consolidated per QA feedback (QF-2): one parameterized test for visibility,
 * with Steps 0/1/7 presence check folded in.
 */

const DEPTH_LEVELS = [10, 15, 20, 25, 30] as const;

/** Question keys by tier (matching data-tier in HTML question-slides) */
const T1_KEYS = [
  'rhythm', 'setting', 'culture', 'pace',
  'noise', 'foodadventure', 'budget', 'flexibility',
  'diet', 'diningstyle',
];
const T2_KEYS = ['kidsfood', 'mealpriority', 'localfood', 'walkingTolerance', 'weatherSensitivity'];
const T3_KEYS = ['culturalImmersion', 'nightlife', 'transport', 'morningPreference', 'crowdTolerance'];
const T4_KEYS = ['groupSplitting', 'souvenirShopping', 'relaxationTime', 'snacking', 'photography'];
const T5_KEYS = ['socialInteraction', 'surpriseOpenness', 'visitDuration', 'shopping', 'accessibility'];

/** Expected visible keys and count per depth */
const DEPTH_EXPECTATIONS: Record<number, { count: number; visible: string[]; hidden: string[] }> = {
  10: {
    count: 10,
    visible: T1_KEYS,
    hidden: [...T2_KEYS, ...T3_KEYS, ...T4_KEYS, ...T5_KEYS],
  },
  15: {
    count: 15,
    visible: [...T1_KEYS, ...T2_KEYS],
    hidden: [...T3_KEYS, ...T4_KEYS, ...T5_KEYS],
  },
  20: {
    count: 20,
    visible: [...T1_KEYS, ...T2_KEYS, ...T3_KEYS],
    hidden: [...T4_KEYS, ...T5_KEYS],
  },
  25: {
    count: 25,
    visible: [...T1_KEYS, ...T2_KEYS, ...T3_KEYS, ...T4_KEYS],
    hidden: [...T5_KEYS],
  },
  30: {
    count: 30,
    visible: [...T1_KEYS, ...T2_KEYS, ...T3_KEYS, ...T4_KEYS, ...T5_KEYS],
    hidden: [],
  },
};

test.describe('Question Visibility per Depth Level', () => {
  // TC-004 through TC-008 (consolidated data-driven) + TC-009 (Steps 0/1/8 always present)
  for (const depth of DEPTH_LEVELS) {
    test(`TC-004..008+009: depth ${depth} shows exactly ${DEPTH_EXPECTATIONS[depth].count} questions, Steps 0/1/8 present`, async ({ page }) => {
      const intake = new IntakePage(page);
      await intake.setupWithDepth(depth);

      // TC-009: Steps 0, 1, and 8 are always present in the DOM
      for (const stepNum of [0, 1, 8]) {
        const step = intake.stepSection(stepNum);
        expect.soft(
          await step.count(),
          `Step ${stepNum} should be in DOM at depth ${depth}`
        ).toBe(1);
      }

      // Verify visible question keys
      const visibleKeys = await intake.getVisibleQuestionKeys();
      const expected = DEPTH_EXPECTATIONS[depth];

      // Check expected visible questions are present
      for (const key of expected.visible) {
        expect.soft(
          visibleKeys.includes(key),
          `depth ${depth}: question "${key}" should be visible`
        ).toBe(true);
      }

      // Check expected hidden questions are NOT visible
      for (const key of expected.hidden) {
        expect.soft(
          visibleKeys.includes(key),
          `depth ${depth}: question "${key}" should be hidden`
        ).toBe(false);
      }

      // Verify total count
      expect.soft(
        visibleKeys.length,
        `depth ${depth}: total visible question count`
      ).toBe(expected.count);
    });
  }
});

test.describe('Quiz Auto-Advance with Reduced Question Set', () => {
  // TC-033: Quiz auto-advance works correctly — at depth 10, all T1 slides visible
  test('TC-033: at depth 10, quiz step auto-advances to Step 4 after last T1 question', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // After depth selection, we land on Step 3 (quiz).
    const currentStep = await intake.getCurrentStepNumber();
    expect.soft(currentStep, 'should be on Step 3 (quiz step)').toBe(3);

    // At depth 10, Step 3 has 10 T1 quiz questions.
    // Use skipStep3SubSteps to auto-advance through all of them.
    await intake.skipStep3SubSteps();

    // After answering the last visible sub-question, the wizard should
    // advance to Step 4 (interests)
    const nextStep = await intake.getCurrentStepNumber();
    expect(nextStep, 'should advance to Step 4 after last visible quiz question').toBe(4);
  });
});

test.describe('New T4/T5 Question Rendering', () => {
  // TC-034: New T4 questions render at depth 25
  test('TC-034: T4 questions visible at depth 25', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(25);

    for (const key of T4_KEYS) {
      const question = intake.questionByKey(key);
      expect.soft(
        await question.count(),
        `T4 question "${key}" should exist in DOM at depth 25`
      ).toBeGreaterThanOrEqual(1);
    }
  });

  // TC-035: New T5 questions render at depth 30
  test('TC-035: T5 questions visible at depth 30', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(30);

    for (const key of T5_KEYS) {
      const question = intake.questionByKey(key);
      expect.soft(
        await question.count(),
        `T5 question "${key}" should exist in DOM at depth 30`
      ).toBeGreaterThanOrEqual(1);
    }
  });
});

// ============================================================================
// TC-337: Sub-step Dots Render in Step 3
// TC-339: Back from Step 4 Returns to Step 3
// ============================================================================
test.describe('Step 3 Quiz Navigation (TC-337, TC-339)', () => {
  test('TC-337: sub-step dots render in Step 3 and count matches visible questions', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.navigateToStep(3);

    const dots = intake.subStepDots(3);
    const dotCount = await dots.count();
    expect(dotCount, 'Step 3 has sub-step dots').toBeGreaterThan(0);

    // Dot count should match depth-active question slide count in Step 3
    const activeSlideCount = await page.evaluate(() => {
      const step3 = document.querySelector('section.step[data-step="3"]');
      if (!step3) return 0;
      return step3.querySelectorAll('.question-slide:not([data-depth-hidden])').length;
    });
    expect.soft(dotCount, 'dot count matches depth-active question slides').toBe(activeSlideCount);
  });

  test('TC-339: back from Step 4 returns to Step 3', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.navigateToStep(4);
    await intake.backButton().click();
    expect(await intake.getCurrentStepNumber(), 'back from Step 4 goes to Step 3').toBe(3);
  });
});
