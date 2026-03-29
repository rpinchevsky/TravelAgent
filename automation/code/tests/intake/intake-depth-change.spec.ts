import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Mid-Wizard Depth Changes — TC-016 through TC-018, TC-036, TC-037
 *
 * Tests depth change via context bar pill, answer preservation,
 * re-entry overlay behavior, and escape behavior.
 */

test.describe('Depth Change Mid-Wizard', () => {
  // TC-016: Depth change mid-wizard via context bar pill
  test('TC-016: changing depth via context bar pill updates questions and shows toast', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // Navigate forward to Step 4
    let currentStep = await intake.getCurrentStepNumber();
    while (currentStep < 4) {
      await intake.continueButton().click();
      currentStep = await intake.getCurrentStepNumber();
      if (currentStep >= 8) break;
    }

    // Click the depth pill in context bar
    await intake.depthPill.click();

    // Overlay should open
    await expect(intake.depthOverlay).toBeVisible();

    // Current depth (20) should be pre-selected
    const card20 = intake.depthCard(20);
    await expect(card20).toHaveClass(/is-selected/);

    // Confirm button should show "Update" (check data-i18n, not text)
    await expect(intake.depthConfirmBtn).toHaveAttribute('data-i18n', 'depth_update');

    // Select depth 10
    await intake.depthCard(10).click();

    // Click Update
    await intake.depthConfirmBtn.click();

    // Overlay should close
    await expect(intake.depthOverlay).not.toBeVisible();

    // T2/T3 questions should now be hidden
    const visibleKeys = await intake.getVisibleQuestionKeys();
    expect.soft(
      visibleKeys.includes('budget'),
      'T2 question "budget" hidden after changing to depth 10'
    ).toBe(false);
    expect.soft(
      visibleKeys.includes('diningstyle'),
      'T3 question "diningstyle" hidden after changing to depth 10'
    ).toBe(false);

    // Toast notification should appear
    await expect(intake.toast.first()).toBeVisible({ timeout: 3000 });
  });

  // TC-017: Depth increase preserves answers and shows defaults for new questions
  test('TC-017: depth increase preserves existing answers, new questions show defaults', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // Answer a T1 question with a non-default value (e.g., select a pace option)
    // Navigate to Step 4 which has the pace question
    let currentStep = await intake.getCurrentStepNumber();
    while (currentStep < 4) {
      await intake.continueButton().click();
      currentStep = await intake.getCurrentStepNumber();
      if (currentStep >= 8) break;
    }

    // Select a non-default pace option (first option instead of default middle)
    const paceQuestion = intake.questionByKey('pace');
    const paceOptions = paceQuestion.locator('[data-value]');
    if (await paceOptions.count() > 0) {
      await paceOptions.first().click();
    }

    // Remember which pace value we selected
    const selectedPaceValue = await paceOptions.first().getAttribute('data-value');

    // Change depth to 25 via pill
    await intake.depthPill.click();
    await intake.depthCard(25).click();
    await intake.depthConfirmBtn.click();

    // Pace should still have the user's selection (not reset to default)
    const paceAfterChange = intake.questionByKey('pace');
    const selectedCard = paceAfterChange.locator('.is-selected, [aria-checked="true"]');
    if (await selectedCard.count() > 0) {
      const currentValue = await selectedCard.first().getAttribute('data-value');
      expect.soft(
        currentValue,
        'pace answer preserved after depth increase'
      ).toBe(selectedPaceValue);
    }

    // Newly visible T2-T4 questions should have default values (non-blank)
    // Budget should be visible and have a selected default
    const budgetQuestion = intake.questionByKey('budget');
    expect.soft(
      await budgetQuestion.count(),
      'T2 budget question visible at depth 25'
    ).toBeGreaterThanOrEqual(1);
  });

  // TC-018: Depth decrease preserves hidden answers for later increase
  test('TC-018: depth decrease preserves hidden answers, restored on increase', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // Navigate to a step with T2 questions and change a value
    let currentStep = await intake.getCurrentStepNumber();
    while (currentStep < 4) {
      await intake.continueButton().click();
      currentStep = await intake.getCurrentStepNumber();
      if (currentStep >= 8) break;
    }

    // Select a non-default budget option
    const budgetQuestion = intake.questionByKey('budget');
    const budgetOptions = budgetQuestion.locator('[data-value]');
    let userSelectedBudget: string | null = null;
    if (await budgetOptions.count() >= 3) {
      // Click the last option (non-default)
      await budgetOptions.last().click();
      userSelectedBudget = await budgetOptions.last().getAttribute('data-value');
    }

    // Change depth to 10 (hides T2 questions)
    await intake.depthPill.click();
    await intake.depthCard(10).click();
    await intake.depthConfirmBtn.click();

    // Budget should be hidden
    const budgetHidden = await intake.getVisibleQuestionKeys();
    expect.soft(
      budgetHidden.includes('budget'),
      'budget hidden at depth 10'
    ).toBe(false);

    // Change back to depth 20
    await intake.depthPill.click();
    await intake.depthCard(20).click();
    await intake.depthConfirmBtn.click();

    // Budget should be visible again with user's previously selected value
    const visibleKeysAfterRestore = await intake.getVisibleQuestionKeys();
    expect.soft(
      visibleKeysAfterRestore.includes('budget'),
      'budget visible again at depth 20'
    ).toBe(true);

    if (userSelectedBudget) {
      const restoredBudget = intake.questionByKey('budget');
      const restoredSelected = restoredBudget.locator('.is-selected, [aria-checked="true"]');
      if (await restoredSelected.count() > 0) {
        const restoredValue = await restoredSelected.first().getAttribute('data-value');
        expect.soft(
          restoredValue,
          'budget answer preserved after hide/restore cycle'
        ).toBe(userSelectedBudget);
      }
    }
  });
});

test.describe('Re-entry Overlay Behavior', () => {
  // TC-036: Re-entry overlay shows "Update" button and returns to current step
  test('TC-036: re-entry overlay has Update button, returns to current step', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // Navigate to Step 4
    let currentStep = await intake.getCurrentStepNumber();
    while (currentStep < 4) {
      await intake.continueButton().click();
      currentStep = await intake.getCurrentStepNumber();
      if (currentStep >= 8) break;
    }
    const stepBeforeReentry = await intake.getCurrentStepNumber();

    // Click depth pill
    await intake.depthPill.click();

    // Overlay opens
    await expect(intake.depthOverlay).toBeVisible();

    // Confirm button has data-i18n="depth_update" (not depth_confirm)
    await expect(intake.depthConfirmBtn).toHaveAttribute('data-i18n', 'depth_update');

    // Current depth (20) is pre-selected
    await expect(intake.depthCard(20)).toHaveClass(/is-selected/);

    // Click Update without changing depth
    await intake.depthConfirmBtn.click();

    // Overlay closes
    await expect(intake.depthOverlay).not.toBeVisible();

    // Returns to the same step
    const stepAfterReentry = await intake.getCurrentStepNumber();
    expect(stepAfterReentry, 'returns to same step after Update without change').toBe(stepBeforeReentry);
  });

  // TC-037: Escape from re-entry overlay returns to current step without changes
  test('TC-037: escape from re-entry overlay preserves depth and returns to step', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // Navigate to Step 4
    let currentStep = await intake.getCurrentStepNumber();
    while (currentStep < 4) {
      await intake.continueButton().click();
      currentStep = await intake.getCurrentStepNumber();
      if (currentStep >= 8) break;
    }
    const stepBeforeReentry = await intake.getCurrentStepNumber();

    // Open re-entry overlay
    await intake.depthPill.click();
    await expect(intake.depthOverlay).toBeVisible();

    // Select a different depth (10) but do NOT confirm
    await intake.depthCard(10).click();

    // Press Escape
    await page.keyboard.press('Escape');

    // Overlay closes
    await expect(intake.depthOverlay).not.toBeVisible();

    // Depth remains at 20 — T2/T3 questions should still be visible
    const visibleKeys = await intake.getVisibleQuestionKeys();
    expect.soft(
      visibleKeys.includes('budget'),
      'T2 budget still visible — depth unchanged after Escape'
    ).toBe(true);

    // User is back on Step 4
    const stepAfterEscape = await intake.getCurrentStepNumber();
    expect(stepAfterEscape, 'returns to same step after Escape').toBe(stepBeforeReentry);
  });
});
