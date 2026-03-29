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
    await intake.navigateToStep(4);

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

    // T2/T3 questions should now be hidden (depth 10 = T1 only)
    const visibleKeys = await intake.getVisibleQuestionKeys();
    expect.soft(
      visibleKeys.includes('kidsfood'),
      'T2 question "kidsfood" hidden after changing to depth 10'
    ).toBe(false);
    expect.soft(
      visibleKeys.includes('nightlife'),
      'T3 question "nightlife" hidden after changing to depth 10'
    ).toBe(false);

    // Toast notification should appear
    await expect(intake.toast.first()).toBeVisible({ timeout: 3000 });
  });

  // TC-017: Depth increase reveals new tiered questions
  test('TC-017: depth increase makes T2/T3/T4 questions visible', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // At depth 10, only T1 questions visible
    const keysAt10 = await intake.getVisibleQuestionKeys();
    expect.soft(keysAt10.includes('kidsfood'), 'T2 kidsfood hidden at depth 10').toBe(false);
    expect.soft(keysAt10.includes('nightlife'), 'T3 nightlife hidden at depth 10').toBe(false);

    // Change depth to 25 via pill
    await intake.depthPill.click();
    await intake.depthCard(25).click();
    await intake.depthConfirmBtn.click();

    // T2, T3, T4 questions should now be visible
    const keysAt25 = await intake.getVisibleQuestionKeys();
    expect.soft(keysAt25.includes('kidsfood'), 'T2 kidsfood visible at depth 25').toBe(true);
    expect.soft(keysAt25.includes('nightlife'), 'T3 nightlife visible at depth 25').toBe(true);
    expect.soft(keysAt25.includes('snacking'), 'T4 snacking visible at depth 25').toBe(true);
    expect.soft(keysAt25.includes('shopping'), 'T5 shopping hidden at depth 25').toBe(false);
  });

  // TC-018: Depth decrease hides T2 questions, increase restores them
  test('TC-018: depth decrease hides T2 questions, restored on increase', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // At depth 20, T2 questions (kidsfood, mealpriority, etc.) should be visible
    const keysAtDepth20 = await intake.getVisibleQuestionKeys();
    expect.soft(
      keysAtDepth20.includes('kidsfood'),
      'T2 kidsfood visible at depth 20'
    ).toBe(true);

    // Change depth to 10 (hides T2 questions)
    await intake.depthPill.click();
    await intake.depthCard(10).click();
    await intake.depthConfirmBtn.click();

    // T2 questions should be hidden at depth 10
    const keysAtDepth10 = await intake.getVisibleQuestionKeys();
    expect.soft(
      keysAtDepth10.includes('kidsfood'),
      'T2 kidsfood hidden at depth 10'
    ).toBe(false);

    // Change back to depth 20
    await intake.depthPill.click();
    await intake.depthCard(20).click();
    await intake.depthConfirmBtn.click();

    // T2 questions should be visible again
    const keysAfterRestore = await intake.getVisibleQuestionKeys();
    expect.soft(
      keysAfterRestore.includes('kidsfood'),
      'T2 kidsfood visible again at depth 20'
    ).toBe(true);
  });
});

test.describe('Re-entry Overlay Behavior', () => {
  // TC-036: Re-entry overlay shows "Update" button and returns to current step
  test('TC-036: re-entry overlay has Update button, returns to current step', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // Navigate to Step 4
    await intake.navigateToStep(4);
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
    await intake.navigateToStep(4);
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

    // User is back on Step 4
    const stepAfterEscape = await intake.getCurrentStepNumber();
    expect(stepAfterEscape, 'returns to same step after Escape').toBe(stepBeforeReentry);

    // Depth remains at 20 — verify T2 questions are still active (would be hidden at depth 10)
    const visibleKeys = await intake.getVisibleQuestionKeys();
    expect.soft(
      visibleKeys.includes('kidsfood'),
      'T2 kidsfood still visible — depth unchanged after Escape'
    ).toBe(true);
  });
});
