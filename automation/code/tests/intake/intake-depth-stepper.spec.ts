import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';
import { STEPS, STEP_COUNT, STEPPER_LABEL_KEYS, STEPPER_EMOJIS } from './utils/step-registry';

/**
 * Stepper & Progress Adaptation — TC-010 through TC-015
 *
 * Tests progress stepper, sub-step dots, progress bar percentage,
 * empty step prevention, and step merging behavior.
 */

const DEPTH_LEVELS = [10, 15, 20, 25, 30] as const;

test.describe('Stepper Adaptation', () => {
  // TC-010: Progress stepper shows all steps at every depth level
  test(`TC-010: stepper shows all ${STEP_COUNT} steps at depth 10 and depth 20`, async ({ page }) => {
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

    // All steps are always visible in the stepper
    expect.soft(visibleStepsAt10, `depth 10: all ${STEP_COUNT} stepper steps visible`).toBe(STEP_COUNT);

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

    expect(visibleStepsAt20, `depth 20: all ${STEP_COUNT} stepper steps visible`).toBe(STEP_COUNT);
  });

  // TC-011: Quiz sub-step dots reflect visible questions per depth
  test('TC-011: sub-step dots match visible question count per quiz step', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // At depth 10, questionnaire step should have 10 T1 quiz dots
    const step3Dots = intake.subStepDots(STEPS.questionnaire);
    const dotCount = await step3Dots.count();
    expect.soft(dotCount, `Step ${STEPS.questionnaire} at depth 10: should have 10 sub-step dots`).toBe(10);

    // At depth 20, questionnaire step has 20 quiz dots (T1+T2+T3)
    await intake.goto();
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);

    const step3DotsAt20 = intake.subStepDots(STEPS.questionnaire);
    const dotCountAt20 = await step3DotsAt20.count();
    expect.soft(dotCountAt20, `Step ${STEPS.questionnaire} at depth 20: sub-step dots`).toBe(20);
  });

  // TC-012: Progress bar percentage advances with each step
  test('TC-012: progress bar percentage advances when navigating steps', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // Read initial progress bar value on questionnaire step
    const initialValue = await intake.progressBar.getAttribute('aria-valuenow');
    expect.soft(initialValue, 'progress bar has aria-valuenow').not.toBeNull();

    // Navigate to interests step
    await intake.navigateToStep(STEPS.interests);

    // Progress bar should advance
    const afterInterests = await intake.progressBar.getAttribute('aria-valuenow');
    expect.soft(
      parseInt(afterInterests ?? '0', 10),
      `progress bar advances after navigating to Step ${STEPS.interests}`
    ).toBeGreaterThan(parseInt(initialValue ?? '0', 10));

    // Navigate to avoids step
    await intake.navigateToStep(STEPS.avoids);
    const afterAvoids = await intake.progressBar.getAttribute('aria-valuenow');
    expect(
      parseInt(afterAvoids ?? '0', 10),
      'progress bar continues to advance'
    ).toBeGreaterThan(parseInt(afterInterests ?? '0', 10));
  });

  // TC-013: No empty steps or visual glitches at any depth
  for (const depth of DEPTH_LEVELS) {
    test(`TC-013: no empty steps at depth ${depth}`, async ({ page }) => {
      const intake = new IntakePage(page);
      await intake.setupWithDepth(depth);

      // Navigate through every active step and verify at least 1 visible question or form element
      // Use navigateToStep to handle questionnaire auto-advance properly
      for (let stepNum = STEPS.questionnaire; stepNum <= STEPS.details; stepNum++) {
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

  // TC-014: Diet question is in questionnaire step at depth 10
  test(`TC-014: diet question is a question-slide in Step ${STEPS.questionnaire} at depth 10`, async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // Diet question should be in the questionnaire step as a question-slide
    const dietInQuestionnaire = await page.evaluate((stepNum) => {
      const step = document.querySelector(`section.step[data-step="${stepNum}"]`);
      if (!step) return false;
      const dietQ = step.querySelector('[data-question-key="diet"]');
      return dietQ !== null;
    }, STEPS.questionnaire);
    expect.soft(dietInQuestionnaire, `diet question is in Step ${STEPS.questionnaire} questionnaire at depth 10`).toBe(true);

    // Diet is T1, should be visible (not depth-hidden) at depth 10
    const dietVisible = await page.evaluate(() => {
      const dietQ = document.querySelector('[data-question-key="diet"]');
      return dietQ !== null && !dietQ.hasAttribute('data-depth-hidden');
    });
    expect.soft(dietVisible, 'diet question is depth-active at depth 10').toBe(true);
  });

  // TC-015: Diet question is in questionnaire step at depth 15
  test(`TC-015: diet question is a question-slide in Step ${STEPS.questionnaire} at depth 15`, async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(15);

    // Diet question should be in the questionnaire step as a question-slide
    const dietInQuestionnaire = await page.evaluate((stepNum) => {
      const step = document.querySelector(`section.step[data-step="${stepNum}"]`);
      if (!step) return false;
      return step.querySelector('[data-question-key="diet"]') !== null;
    }, STEPS.questionnaire);
    expect.soft(dietInQuestionnaire, `diet question is in Step ${STEPS.questionnaire} questionnaire at depth 15`).toBe(true);
  });

  // TC-320: Hotel emoji at stay step, target emoji at questionnaire step
  test('TC-320: stepper emoji at stay step is hotel, questionnaire step is target', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    const step2Emoji = await page.locator(`.stepper__step[data-step="${STEPS.stay}"] .stepper__circle span`).textContent();
    const step3Emoji = await page.locator(`.stepper__step[data-step="${STEPS.questionnaire}"] .stepper__circle span`).textContent();
    expect.soft(step2Emoji?.trim(), 'Step 2 emoji is hotel').toContain(STEPPER_EMOJIS[STEPS.stay]);
    expect.soft(step3Emoji?.trim(), 'Step 3 emoji is target').toContain(STEPPER_EMOJIS[STEPS.questionnaire]);
  });

  // TC-321: Stepper fill 100% on review step
  test('TC-321: stepper fill and progress bar at 100% on review step', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.navigateToStep(STEPS.review);
    const stepperFillWidth = await page.evaluate(() => {
      const fill = document.getElementById('stepperFill');
      return fill ? fill.style.width : '';
    });
    const progressFillWidth = await page.evaluate(() => {
      const fill = document.getElementById('progressBarFill');
      return fill ? fill.style.width : '';
    });
    expect(stepperFillWidth, `stepper fill 100% on Step ${STEPS.review}`).toBe('100%');
    expect(progressFillWidth, `progress bar fill 100% on Step ${STEPS.review}`).toBe('100%');
  });

  // TC-322: Stepper circle state transitions (pending -> active -> done)
  test(`TC-322: stepper circle state transitions with ${STEP_COUNT} steps`, async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // On questionnaire step after depth selection (depth overlay fires after stay step)
    const questionnaireActive = await page.locator(`.stepper__step[data-step="${STEPS.questionnaire}"]`).evaluate(
      el => el.classList.contains('is-active')
    );
    expect.soft(questionnaireActive, `Step ${STEPS.questionnaire} is active after depth selection`).toBe(true);

    const tripDone = await page.locator(`.stepper__step[data-step="${STEPS.trip}"]`).evaluate(
      el => el.classList.contains('is-done')
    );
    expect.soft(tripDone, `Step ${STEPS.trip} is done`).toBe(true);

    const stayDone = await page.locator(`.stepper__step[data-step="${STEPS.stay}"]`).evaluate(
      el => el.classList.contains('is-done')
    );
    expect.soft(stayDone, `Step ${STEPS.stay} is done after depth selection`).toBe(true);

    // Navigate to interests step
    await intake.navigateToStep(STEPS.interests);
    for (const s of [STEPS.trip, STEPS.travelers, STEPS.stay, STEPS.questionnaire]) {
      const isDone = await page.locator(`.stepper__step[data-step="${s}"]`).evaluate(
        el => el.classList.contains('is-done')
      );
      expect.soft(isDone, `Step ${s} is done when on Step ${STEPS.interests}`).toBe(true);
    }
    const interestsActive = await page.locator(`.stepper__step[data-step="${STEPS.interests}"]`).evaluate(
      el => el.classList.contains('is-active')
    );
    expect.soft(interestsActive, `Step ${STEPS.interests} is active`).toBe(true);
  });

  // TC-323: Stepper labels correct for all steps
  test(`TC-323: stepper labels have correct i18n keys for ${STEP_COUNT} steps`, async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    for (let i = 0; i < STEPPER_LABEL_KEYS.length; i++) {
      const label = page.locator(`.stepper__step[data-step="${i}"] .stepper__label`);
      const i18nKey = await label.getAttribute('data-i18n');
      expect.soft(i18nKey, `Step ${i} label i18n key`).toBe(STEPPER_LABEL_KEYS[i]);
    }
  });
});
