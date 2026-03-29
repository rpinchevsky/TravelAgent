import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Depth Indicator & User Feedback — TC-024 through TC-026
 *
 * Tests context bar depth pill, toast notifications, and smooth
 * transitions at low depth levels.
 */

test.describe('Context Bar & Toast Feedback', () => {
  // TC-024: Context bar shows depth pill after selection
  test('TC-024: depth pill visible in context bar after depth selection', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(15);

    // Depth pill should be visible in context bar
    await expect(intake.depthPill).toBeVisible();

    // Pill should have correct i18n attribute
    const pillI18n = intake.depthPill.locator('[data-i18n="depth_pill"]');
    expect.soft(
      await pillI18n.count(),
      'depth pill contains data-i18n="depth_pill" element'
    ).toBeGreaterThanOrEqual(1);

    // Pill should be clickable (reopens overlay)
    await intake.depthPill.click();
    await expect(intake.depthOverlay).toBeVisible();
  });

  // TC-025: Toast notification on depth selection
  test('TC-025: toast appears after depth selection and auto-dismisses', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();

    // Select depth 10 and confirm
    await intake.depthCard(10).click();
    await intake.depthConfirmBtn.click();

    // Toast should appear
    await expect(intake.toast.first()).toBeVisible({ timeout: 3000 });

    // Toast should auto-dismiss (wait for it to disappear)
    await expect(intake.toast.first()).not.toBeVisible({ timeout: 10000 });
  });

  // TC-026: Smooth transition to Step 8 at low depth
  test('TC-026: no empty intermediary step between last content step and Step 8', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // Navigate through all active steps at depth 10 using navigateToStep
    // which properly handles Step 3 auto-advance
    await intake.navigateToStep(8);
    const currentStep = await intake.getCurrentStepNumber();

    // The last content step should transition directly to Step 8
    // No blank/empty step should appear in between
    expect.soft(currentStep, 'reached Step 8 (Review)').toBe(8);
  });
});
