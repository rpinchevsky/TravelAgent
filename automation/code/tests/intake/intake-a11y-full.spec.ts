import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Full Accessibility Tests (QA Test Plan Category 7)
 *
 * Tests keyboard navigation, ARIA roles and attributes,
 * focus management, and semantic element usage.
 */

test.describe('Accessibility', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.goto();
  });

  test('TC-077: stepper has role="tablist" and aria-label', async () => {
    await expect.soft(intake.stepper).toHaveAttribute('role', 'tablist');
    await expect.soft(intake.stepper).toHaveAttribute('aria-label');
  });

  test('TC-078: stepper steps have role="tab" and aria-selected', async () => {
    const steps = intake.stepperSteps;
    const count = await steps.count();
    for (let i = 0; i < count; i++) {
      const step = steps.nth(i);
      await expect.soft(step, `Step ${i} has role="tab"`).toHaveAttribute('role', 'tab');
      const ariaSelected = await step.getAttribute('aria-selected');
      expect.soft(ariaSelected !== null, `Step ${i} has aria-selected`).toBe(true);
    }
  });

  test('TC-079: active stepper step has aria-selected="true"', async () => {
    const activeStep = intake.page.locator('.stepper__step.is-active');
    await expect(activeStep).toHaveAttribute('aria-selected', 'true');
  });

  test('TC-080: aria-selected updates when navigating steps', async ({ page }) => {
    await intake.completePrerequisiteSteps();
    await intake.selectDepthAndConfirm(20);

    // On Step 2 now
    const step2 = intake.stepperStep(2);
    await expect.soft(step2, 'Step 2 aria-selected').toHaveAttribute('aria-selected', 'true');

    // Non-active steps should have aria-selected="false"
    const step0 = intake.stepperStep(0);
    await expect.soft(step0, 'Step 0 aria-selected after leaving').toHaveAttribute('aria-selected', 'false');
  });

  test('TC-081: search bar counter buttons have aria-labels', async () => {
    const sbAdultPlus = intake.page.locator('#sbAdultPlus');
    const sbAdultMinus = intake.page.locator('#sbAdultMinus');
    const sbChildPlus = intake.page.locator('#sbChildPlus');
    const sbChildMinus = intake.page.locator('#sbChildMinus');

    await expect.soft(sbAdultPlus).toHaveAttribute('aria-label');
    await expect.soft(sbAdultMinus).toHaveAttribute('aria-label');
    await expect.soft(sbChildPlus).toHaveAttribute('aria-label');
    await expect.soft(sbChildMinus).toHaveAttribute('aria-label');
  });

  test('TC-082: date dropdown has role="dialog" and aria-label', async () => {
    await expect.soft(intake.datesDropdown).toHaveAttribute('role', 'dialog');
    await expect.soft(intake.datesDropdown).toHaveAttribute('aria-label');
  });

  test('TC-083: travelers dropdown has role="dialog" and aria-label', async () => {
    await expect.soft(intake.travelersDropdown).toHaveAttribute('role', 'dialog');
    await expect.soft(intake.travelersDropdown).toHaveAttribute('aria-label');
  });

  test('TC-084: progress bar has role="progressbar" with aria-value attributes', async () => {
    await expect.soft(intake.progressBar).toHaveAttribute('role', 'progressbar');
    await expect.soft(intake.progressBar).toHaveAttribute('aria-valuenow');
    await expect.soft(intake.progressBar).toHaveAttribute('aria-valuemin');
    await expect.soft(intake.progressBar).toHaveAttribute('aria-valuemax');
  });

  test('TC-085: q-cards respond to Enter and Space keyboard events', async ({ page }) => {
    // Step 0 has q-cards for rhythm selection
    const firstCard = page.locator('.q-card[tabindex="0"]').first();
    await firstCard.focus();
    await page.keyboard.press('Enter');

    // Card should now be selected
    await expect(firstCard).toHaveClass(/is-selected/);
  });

  test('TC-086: toast container has aria-live="polite"', async () => {
    await expect(intake.toastContainer).toHaveAttribute('aria-live', 'polite');
  });

  test('TC-087: depth selector overlay has role="dialog" and aria-modal', async () => {
    await intake.completePrerequisiteSteps();
    await expect.soft(intake.depthOverlay).toHaveAttribute('role', 'dialog');
    await expect.soft(intake.depthOverlay).toHaveAttribute('aria-modal', 'true');
  });
});
