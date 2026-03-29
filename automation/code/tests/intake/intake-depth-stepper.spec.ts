import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Stepper & Progress Adaptation — TC-010 through TC-015
 *
 * Tests progress stepper, sub-step dots, progress bar percentage,
 * empty step prevention, and step merging behavior.
 */

const DEPTH_LEVELS = [10, 15, 20, 25, 30] as const;

test.describe('Stepper Adaptation', () => {
  // TC-010: Progress stepper shows all 9 steps at every depth level
  test('TC-010: stepper shows all 9 steps at depth 10 and depth 20', async ({ page }) => {
    const intake = new IntakePage(page);

    // Test at depth 10
    await intake.setupWithDepth(10);

    const visibleStepsAt10 = await page.evaluate(() => {
      const steps = document.querySelectorAll('.stepper__step');
      let count = 0;
      for (const s of steps) {
        const el = s as HTMLElement;
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && !el.hidden) count++;
      }
      return count;
    });

    // All 9 steps are always visible in the stepper (Steps 0-8)
    expect.soft(visibleStepsAt10, 'depth 10: all 9 stepper steps visible').toBe(9);

    // Test at depth 20
    await intake.goto();
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);

    const visibleStepsAt20 = await page.evaluate(() => {
      const steps = document.querySelectorAll('.stepper__step');
      let count = 0;
      for (const s of steps) {
        const el = s as HTMLElement;
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && !el.hidden) count++;
      }
      return count;
    });

    expect(visibleStepsAt20, 'depth 20: all 9 stepper steps visible').toBe(9);
  });

  // TC-011: Quiz sub-step dots reflect visible questions per depth
  test('TC-011: sub-step dots match visible question count per quiz step', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // At depth 10, Step 3 should have 10 T1 quiz dots
    const step3Dots = intake.subStepDots(3);
    const dotCount = await step3Dots.count();
    expect.soft(dotCount, 'Step 3 at depth 10: should have 10 sub-step dots').toBe(10);

    // At depth 20, Step 3 has 20 quiz dots (T1+T2+T3)
    await intake.goto();
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);

    const step3DotsAt20 = intake.subStepDots(3);
    const dotCountAt20 = await step3DotsAt20.count();
    expect.soft(dotCountAt20, 'Step 3 at depth 20: sub-step dots').toBe(20);
  });

  // TC-012: Progress bar percentage advances with each step
  test('TC-012: progress bar percentage advances when navigating steps', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // Read initial progress bar value on Step 3
    const initialValue = await intake.progressBar.getAttribute('aria-valuenow');
    expect.soft(initialValue, 'progress bar has aria-valuenow').not.toBeNull();

    // Navigate to Step 4
    await intake.navigateToStep(4);

    // Progress bar should advance
    const afterStep4 = await intake.progressBar.getAttribute('aria-valuenow');
    expect.soft(
      parseInt(afterStep4 ?? '0', 10),
      'progress bar advances after navigating to Step 4'
    ).toBeGreaterThan(parseInt(initialValue ?? '0', 10));

    // Navigate to Step 5
    await intake.navigateToStep(5);
    const afterStep5 = await intake.progressBar.getAttribute('aria-valuenow');
    expect(
      parseInt(afterStep5 ?? '0', 10),
      'progress bar continues to advance'
    ).toBeGreaterThan(parseInt(afterStep4 ?? '0', 10));
  });

  // TC-013: No empty steps or visual glitches at any depth
  for (const depth of DEPTH_LEVELS) {
    test(`TC-013: no empty steps at depth ${depth}`, async ({ page }) => {
      const intake = new IntakePage(page);
      await intake.setupWithDepth(depth);

      // Navigate through every active step and verify at least 1 visible question or form element
      // Use navigateToStep to handle Step 3 auto-advance properly
      for (let stepNum = 3; stepNum <= 7; stepNum++) {
        await intake.navigateToStep(stepNum);
        const currentStep = await intake.getCurrentStepNumber();

        // If the step was skipped (e.g., merged at low depth), skip the check
        if (currentStep !== stepNum) continue;

        const visibleInStep = await page.evaluate((sn) => {
          const step = document.querySelector(`section.step[data-step="${sn}"]`);
          if (!step) return 0;
          const questions = step.querySelectorAll('[data-question-key]');
          let count = 0;
          for (const q of questions) {
            const el = q as HTMLElement;
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden') count++;
          }
          return count;
        }, stepNum);

        expect.soft(
          visibleInStep,
          `depth ${depth}, step ${stepNum}: has at least 1 visible question`
        ).toBeGreaterThanOrEqual(1);
      }
    });
  }

  // TC-014: Diet question is in Step 3 questionnaire at depth 10
  test('TC-014: diet question is a question-slide in Step 3 at depth 10', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // Diet question should be in Step 3 as a question-slide
    const dietInStep3 = await page.evaluate(() => {
      const step3 = document.querySelector('section.step[data-step="3"]');
      if (!step3) return false;
      const dietQ = step3.querySelector('[data-question-key="diet"]');
      return dietQ !== null;
    });
    expect.soft(dietInStep3, 'diet question is in Step 3 questionnaire at depth 10').toBe(true);

    // Diet is T1, should be visible (not depth-hidden) at depth 10
    const dietVisible = await page.evaluate(() => {
      const dietQ = document.querySelector('[data-question-key="diet"]');
      return dietQ !== null && !dietQ.hasAttribute('data-depth-hidden');
    });
    expect.soft(dietVisible, 'diet question is depth-active at depth 10').toBe(true);
  });

  // TC-015: Diet question is in Step 3 questionnaire at depth 15
  test('TC-015: diet question is a question-slide in Step 3 at depth 15', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(15);

    // Diet question should be in Step 3 as a question-slide
    const dietInStep3 = await page.evaluate(() => {
      const step3 = document.querySelector('section.step[data-step="3"]');
      if (!step3) return false;
      return step3.querySelector('[data-question-key="diet"]') !== null;
    });
    expect.soft(dietInStep3, 'diet question is in Step 3 questionnaire at depth 15').toBe(true);
  });

  // TC-319: Stepper renders 9 circles
  test('TC-319: stepper renders 9 circles at depth 20', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    const stepperSteps = await page.locator('.stepper__step').count();
    expect(stepperSteps, '9 stepper circles rendered').toBe(9);
  });

  // TC-320: Hotel emoji at index 2, target emoji at index 3
  test('TC-320: stepper emoji at Step 2 is hotel, Step 3 is target', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    const step2Emoji = await page.locator('.stepper__step[data-step="2"] .stepper__circle span').textContent();
    const step3Emoji = await page.locator('.stepper__step[data-step="3"] .stepper__circle span').textContent();
    expect.soft(step2Emoji?.trim(), 'Step 2 emoji is hotel').toContain('🏨');
    expect.soft(step3Emoji?.trim(), 'Step 3 emoji is target').toContain('🎯');
  });

  // TC-321: Stepper fill 100% on Step 8
  test('TC-321: stepper fill and progress bar at 100% on Step 8', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.navigateToStep(8);
    const stepperFillWidth = await page.evaluate(() => {
      const fill = document.getElementById('stepperFill');
      return fill ? fill.style.width : '';
    });
    const progressFillWidth = await page.evaluate(() => {
      const fill = document.getElementById('progressBarFill');
      return fill ? fill.style.width : '';
    });
    expect(stepperFillWidth, 'stepper fill 100% on Step 8').toBe('100%');
    expect(progressFillWidth, 'progress bar fill 100% on Step 8').toBe('100%');
  });

  // TC-322: Stepper circle state transitions (pending → active → done)
  test('TC-322: stepper circle state transitions with 9 steps', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // On Step 3 after depth selection (depth overlay fires after Step 2)
    const step3Active = await page.locator('.stepper__step[data-step="3"]').evaluate(
      el => el.classList.contains('is-active')
    );
    expect.soft(step3Active, 'Step 3 is active after depth selection').toBe(true);

    const step0Done = await page.locator('.stepper__step[data-step="0"]').evaluate(
      el => el.classList.contains('is-done')
    );
    expect.soft(step0Done, 'Step 0 is done').toBe(true);

    const step2Done = await page.locator('.stepper__step[data-step="2"]').evaluate(
      el => el.classList.contains('is-done')
    );
    expect.soft(step2Done, 'Step 2 is done after depth selection').toBe(true);

    // Navigate to Step 4
    await intake.navigateToStep(4);
    for (const s of [0, 1, 2, 3]) {
      const isDone = await page.locator(`.stepper__step[data-step="${s}"]`).evaluate(
        el => el.classList.contains('is-done')
      );
      expect.soft(isDone, `Step ${s} is done when on Step 4`).toBe(true);
    }
    const step4Active = await page.locator('.stepper__step[data-step="4"]').evaluate(
      el => el.classList.contains('is-active')
    );
    expect.soft(step4Active, 'Step 4 is active').toBe(true);
  });

  // TC-323: Stepper labels correct for all 9 steps
  test('TC-323: stepper labels have correct i18n keys for 9 steps', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    const expectedLabels = [
      'step_trip', 'step_travelers', 'step_stay', 'step_style',
      'step_interests', 'step_avoid', 'step_food', 'step_details', 'step_review',
    ];

    for (let i = 0; i < expectedLabels.length; i++) {
      const label = page.locator(`.stepper__step[data-step="${i}"] .stepper__label`);
      const i18nKey = await label.getAttribute('data-i18n');
      expect.soft(i18nKey, `Step ${i} label i18n key`).toBe(expectedLabels[i]);
    }
  });
});
