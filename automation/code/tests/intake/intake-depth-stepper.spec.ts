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
  // TC-010: Progress stepper hides skipped steps
  test('TC-010: stepper hides skipped steps at depth 10 vs depth 20', async ({ page }) => {
    const intake = new IntakePage(page);

    // Test at depth 10 (has fewer active steps)
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

    // At depth 10, some steps should be hidden (fewer than 8 total steps)
    expect.soft(visibleStepsAt10, 'depth 10: fewer visible stepper steps than total 9').toBeLessThan(9);

    // Now test at depth 20 (baseline — all quiz steps visible)
    await intake.goto();
    await intake.completePrerequisiteSteps();
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

    // Depth 20 should have more visible steps than depth 10
    expect(visibleStepsAt20, 'depth 20 has more visible stepper steps than depth 10')
      .toBeGreaterThanOrEqual(visibleStepsAt10);
  });

  // TC-011: Quiz sub-step dots reflect visible questions only
  test('TC-011: sub-step dots match visible question count per quiz step', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // At depth 10, Step 3 should have 2 quiz dots (setting, culture)
    // Navigate to Step 3 to check dots
    const step3Dots = intake.subStepDots(3);
    const dotCount = await step3Dots.count();
    expect.soft(dotCount, 'Step 3 at depth 10: should have 2 sub-step dots').toBe(2);

    // Verify at depth 20 for comparison — Step 3 still has 2 (setting, culture; evening removed)
    await intake.goto();
    await intake.completePrerequisiteSteps();
    await intake.selectDepthAndConfirm(20);

    const step3DotsAt20 = intake.subStepDots(3);
    const dotCountAt20 = await step3DotsAt20.count();
    expect.soft(dotCountAt20, 'Step 3 at depth 20: sub-step dots').toBe(2);
  });

  // TC-012: Progress bar percentage adapts to depth
  test('TC-012: progress bar percentage reflects active steps, not total 8', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // Read initial progress bar value
    const initialValue = await intake.progressBar.getAttribute('aria-valuenow');
    expect.soft(initialValue, 'progress bar has aria-valuenow').not.toBeNull();

    // Navigate one step forward
    await intake.continueButton().click();

    // Progress bar should advance
    const afterOneStep = await intake.progressBar.getAttribute('aria-valuenow');
    expect.soft(
      parseInt(afterOneStep ?? '0', 10),
      'progress bar advances after navigating one step'
    ).toBeGreaterThan(parseInt(initialValue ?? '0', 10));

    // At depth 10 with fewer active steps, each step should represent a larger
    // percentage increment than at depth 20
    const incrementAt10 = parseInt(afterOneStep ?? '0', 10) - parseInt(initialValue ?? '0', 10);

    // Repeat for depth 20
    await intake.goto();
    await intake.completePrerequisiteSteps();
    await intake.selectDepthAndConfirm(20);

    const initialAt20 = await intake.progressBar.getAttribute('aria-valuenow');
    await intake.continueButton().click();
    const afterOneStepAt20 = await intake.progressBar.getAttribute('aria-valuenow');
    const incrementAt20 = parseInt(afterOneStepAt20 ?? '0', 10) - parseInt(initialAt20 ?? '0', 10);

    // Depth 10 increment should be >= depth 20 increment (fewer steps = bigger jumps)
    expect.soft(
      incrementAt10,
      'depth 10 progress increment >= depth 20 increment'
    ).toBeGreaterThanOrEqual(incrementAt20);
  });

  // TC-013: No empty steps or visual glitches at any depth
  for (const depth of DEPTH_LEVELS) {
    test(`TC-013: no empty steps at depth ${depth}`, async ({ page }) => {
      const intake = new IntakePage(page);
      await intake.setupWithDepth(depth);

      // Navigate through every active step and verify at least 1 visible question or form element
      const maxSteps = 10;
      for (let i = 0; i < maxSteps; i++) {
        const currentStep = await intake.getCurrentStepNumber();

        // Step 8 is the review step — it has the preview, not questions
        if (currentStep === 8) break;

        // Steps 0 and 1 have their own form elements (not data-question-key)
        if (currentStep >= 2 && currentStep <= 7) {
          const visibleInStep = await page.evaluate((stepNum) => {
            const step = document.querySelector(`section.step[data-step="${stepNum}"]`);
            if (!step) return 0;
            const questions = step.querySelectorAll('[data-question-key]');
            let count = 0;
            for (const q of questions) {
              const el = q as HTMLElement;
              const style = window.getComputedStyle(el);
              if (style.display !== 'none' && style.visibility !== 'hidden') count++;
            }
            return count;
          }, currentStep);

          expect.soft(
            visibleInStep,
            `depth ${depth}, step ${currentStep}: has at least 1 visible question`
          ).toBeGreaterThanOrEqual(1);
        }

        // Try to navigate forward
        const continueBtn = intake.continueButton();
        if (await continueBtn.count() === 0 || !await continueBtn.isVisible()) break;
        await continueBtn.click();
      }
    });
  }

  // TC-014: Step merging at depth 10 — Step 6 (diet) merges into Step 5
  test('TC-014: step 6 merges into step 5 at depth 10', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // Navigate to Step 5
    let currentStep = await intake.getCurrentStepNumber();
    while (currentStep < 5) {
      await intake.continueButton().click();
      currentStep = await intake.getCurrentStepNumber();
      if (currentStep >= 8) break; // safety
    }

    // Diet question (originally Step 6) should be present within Step 5's DOM
    const dietInStep5 = await page.evaluate(() => {
      const step5 = document.querySelector('section.step[data-step="5"]');
      if (!step5) return false;
      const dietQ = step5.querySelector('[data-question-key="diet"]');
      return dietQ !== null;
    });
    expect.soft(dietInStep5, 'diet question is relocated into Step 5 at depth 10').toBe(true);

    // A step divider should precede the merged question
    const dividerInStep5 = await page.evaluate(() => {
      const step5 = document.querySelector('section.step[data-step="5"]');
      if (!step5) return false;
      return step5.querySelector('.step-divider') !== null;
    });
    expect.soft(dividerInStep5, 'step divider present in Step 5 at depth 10').toBe(true);

    // Step 6 should not be in the stepper (hidden)
    const step6Stepper = intake.stepperStep(6);
    const step6Visible = await page.evaluate(() => {
      const s = document.querySelector('.stepper__step[data-step="6"]');
      if (!s) return false;
      const style = window.getComputedStyle(s as HTMLElement);
      return style.display !== 'none' && !(s as HTMLElement).hidden;
    });
    expect.soft(step6Visible, 'Step 6 stepper circle is hidden at depth 10').toBe(false);
  });

  // TC-015: Step merging at depth 15 — Step 6 (diet) merges into Step 5
  test('TC-015: step 6 merges into step 5 at depth 15', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(15);

    // Navigate to Step 5
    let currentStep = await intake.getCurrentStepNumber();
    while (currentStep < 5) {
      await intake.continueButton().click();
      currentStep = await intake.getCurrentStepNumber();
      if (currentStep >= 8) break;
    }

    // Diet question should be merged into Step 5
    const dietInStep5 = await page.evaluate(() => {
      const step5 = document.querySelector('section.step[data-step="5"]');
      if (!step5) return false;
      return step5.querySelector('[data-question-key="diet"]') !== null;
    });
    expect.soft(dietInStep5, 'diet question is merged into Step 5 at depth 15').toBe(true);
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

    // On Step 2 after depth selection
    const step2Active = await page.locator('.stepper__step[data-step="2"]').evaluate(
      el => el.classList.contains('is-active')
    );
    expect.soft(step2Active, 'Step 2 is active after depth selection').toBe(true);

    const step0Done = await page.locator('.stepper__step[data-step="0"]').evaluate(
      el => el.classList.contains('is-done')
    );
    expect.soft(step0Done, 'Step 0 is done').toBe(true);

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
