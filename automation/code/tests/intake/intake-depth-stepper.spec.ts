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
    expect.soft(visibleStepsAt10, 'depth 10: fewer visible stepper steps than total 8').toBeLessThan(8);

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

    // At depth 10, Step 2 should have 2 quiz dots (setting, culture)
    // Navigate to Step 2 to check dots
    const step2Dots = intake.subStepDots(2);
    const dotCount = await step2Dots.count();
    expect.soft(dotCount, 'Step 2 at depth 10: should have 2 sub-step dots').toBe(2);

    // Verify at depth 20 for comparison — Step 2 still has 2 (setting, culture; evening removed)
    await intake.goto();
    await intake.completePrerequisiteSteps();
    await intake.selectDepthAndConfirm(20);

    const step2DotsAt20 = intake.subStepDots(2);
    const dotCountAt20 = await step2DotsAt20.count();
    expect.soft(dotCountAt20, 'Step 2 at depth 20: sub-step dots').toBe(2);
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

        // Step 7 is the review step — it has the preview, not questions
        if (currentStep === 7) break;

        // Steps 0 and 1 have their own form elements (not data-question-key)
        if (currentStep >= 2 && currentStep <= 6) {
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

  // TC-014: Step merging at depth 10 — Step 5 (diet) merges into Step 4
  test('TC-014: step 5 merges into step 4 at depth 10', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // Navigate to Step 4
    let currentStep = await intake.getCurrentStepNumber();
    while (currentStep < 4) {
      await intake.continueButton().click();
      currentStep = await intake.getCurrentStepNumber();
      if (currentStep >= 7) break; // safety
    }

    // Diet question (originally Step 5) should be present within Step 4's DOM
    const dietInStep4 = await page.evaluate(() => {
      const step4 = document.querySelector('section.step[data-step="4"]');
      if (!step4) return false;
      const dietQ = step4.querySelector('[data-question-key="diet"]');
      return dietQ !== null;
    });
    expect.soft(dietInStep4, 'diet question is relocated into Step 4 at depth 10').toBe(true);

    // A step divider should precede the merged question
    const dividerInStep4 = await page.evaluate(() => {
      const step4 = document.querySelector('section.step[data-step="4"]');
      if (!step4) return false;
      return step4.querySelector('.step-divider') !== null;
    });
    expect.soft(dividerInStep4, 'step divider present in Step 4 at depth 10').toBe(true);

    // Step 5 should not be in the stepper (hidden)
    const step5Stepper = intake.stepperStep(5);
    const step5Visible = await page.evaluate(() => {
      const s = document.querySelector('.stepper__step[data-step="5"]');
      if (!s) return false;
      const style = window.getComputedStyle(s as HTMLElement);
      return style.display !== 'none' && !(s as HTMLElement).hidden;
    });
    expect.soft(step5Visible, 'Step 5 stepper circle is hidden at depth 10').toBe(false);
  });

  // TC-015: Step merging at depth 15 — Step 5 (diet) merges into Step 4
  test('TC-015: step 5 merges into step 4 at depth 15', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(15);

    // Navigate to Step 4
    let currentStep = await intake.getCurrentStepNumber();
    while (currentStep < 4) {
      await intake.continueButton().click();
      currentStep = await intake.getCurrentStepNumber();
      if (currentStep >= 7) break;
    }

    // Diet question should be merged into Step 4
    const dietInStep4 = await page.evaluate(() => {
      const step4 = document.querySelector('section.step[data-step="4"]');
      if (!step4) return false;
      return step4.querySelector('[data-question-key="diet"]') !== null;
    });
    expect.soft(dietInStep4, 'diet question is merged into Step 4 at depth 15').toBe(true);
  });
});
