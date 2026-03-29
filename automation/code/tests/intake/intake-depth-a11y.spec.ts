import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Accessibility — TC-027 through TC-030
 *
 * Tests keyboard navigation, ARIA attributes, and focus management
 * on the depth selector overlay.
 */

test.describe('Depth Selector Accessibility', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.goto();
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    // Overlay should now be visible
  });

  // TC-027: Keyboard navigation — arrow keys move between depth cards
  test('TC-027: arrow keys navigate between depth cards, Enter confirms', async ({ page }) => {
    await expect(intake.depthOverlay).toBeVisible();

    // Wait for focus to land on the pre-selected card (20)
    await expect(page.locator('.depth-card:focus')).toBeVisible();

    // Focus should be on the pre-selected card (20) — press ArrowRight to move
    await page.keyboard.press('ArrowRight');

    // After pressing ArrowRight from card 20, focus should be on card 25
    const focusedAfterRight = page.locator('.depth-card:focus');
    expect.soft(
      await focusedAfterRight.getAttribute('data-depth'),
      'ArrowRight moves focus to next card'
    ).toBe('25');

    // Press ArrowRight again — should move to 30
    await page.keyboard.press('ArrowRight');
    const focusedAfterRight2 = page.locator('.depth-card:focus');
    expect.soft(
      await focusedAfterRight2.getAttribute('data-depth'),
      'second ArrowRight moves to card 30'
    ).toBe('30');

    // Press ArrowLeft — should move back to 25
    await page.keyboard.press('ArrowLeft');
    const focusedAfterLeft = page.locator('.depth-card:focus');
    expect.soft(
      await focusedAfterLeft.getAttribute('data-depth'),
      'ArrowLeft moves focus back'
    ).toBe('25');

    // Arrow keys both focus and select (click) the card — verify card 25 is selected
    const card25 = intake.depthCard(25);
    await expect.soft(card25, 'ArrowLeft selects the focused card').toHaveClass(/is-selected/);
    expect.soft(
      await card25.getAttribute('aria-checked'),
      'selected card has aria-checked=true'
    ).toBe('true');

    // Tab should move focus to the confirm button
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    const focusedId = await focusedElement.getAttribute('id');
    expect.soft(focusedId, 'Tab moves focus to confirm button').toBe('depthConfirmBtn');

    // Press Enter on confirm button — overlay closes and wizard advances
    await page.keyboard.press('Enter');
    await expect(intake.depthOverlay).not.toBeVisible();
  });

  // TC-028: Escape key dismisses overlay without selecting
  test('TC-028: Escape closes overlay without advancing wizard', async ({ page }) => {
    await expect(intake.depthOverlay).toBeVisible();

    // Wait for focus to land on a depth card inside the overlay
    await expect(page.locator('.depth-card:focus')).toBeVisible();

    // Press Escape
    await page.keyboard.press('Escape');

    // Overlay should close
    await expect(intake.depthOverlay).not.toBeVisible();

    // User should remain on Step 2 (not advanced)
    const currentStep = await intake.getCurrentStepNumber();
    expect(currentStep, 'user remains on Step 2 after Escape').toBe(2);
  });

  // TC-029: ARIA roles and attributes on depth selector
  test('TC-029: overlay has correct ARIA roles and attributes', async ({ page }) => {
    await expect(intake.depthOverlay).toBeVisible();

    // Overlay has role="dialog" and aria-modal="true"
    await expect.soft(intake.depthOverlay).toHaveAttribute('role', 'dialog');
    await expect.soft(intake.depthOverlay).toHaveAttribute('aria-modal', 'true');

    // Overlay has aria-label
    const overlayAriaLabel = await intake.depthOverlay.getAttribute('aria-label');
    expect.soft(overlayAriaLabel, 'overlay has aria-label').not.toBeNull();

    // Options container has role="radiogroup" with aria-label
    await expect.soft(intake.depthOptionsGroup).toHaveAttribute('role', 'radiogroup');
    const groupAriaLabel = await intake.depthOptionsGroup.getAttribute('aria-label');
    expect.soft(groupAriaLabel, 'radiogroup has aria-label').not.toBeNull();

    // Each card has role="radio" with aria-checked
    const cards = intake.depthCards;
    const cardCount = await cards.count();
    for (let i = 0; i < cardCount; i++) {
      const card = cards.nth(i);
      await expect.soft(card, `card ${i}: has role=radio`).toHaveAttribute('role', 'radio');
      const ariaChecked = await card.getAttribute('aria-checked');
      expect.soft(
        ariaChecked === 'true' || ariaChecked === 'false',
        `card ${i}: aria-checked is boolean string`
      ).toBe(true);
    }

    // Only one card has aria-checked="true"
    const selectedCards = page.locator('.depth-card[aria-checked="true"]');
    await expect.soft(selectedCards, 'exactly one card has aria-checked=true').toHaveCount(1);
  });

  // TC-030: Focus management — initial open focuses pre-selected card
  test('TC-030: overlay open focuses the pre-selected depth card (20)', async ({ page }) => {
    await expect(intake.depthOverlay).toBeVisible();

    // Wait for focus to land on the pre-selected card
    await expect(page.locator('.depth-card:focus')).toBeVisible();

    // The focused element should be the card with data-depth="20"
    const focusedElement = page.locator(':focus');
    const focusedDepth = await focusedElement.getAttribute('data-depth');
    expect(focusedDepth, 'focus is on the pre-selected card (depth 20)').toBe('20');
  });
});
