import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Depth Selector Overlay — TC-001, TC-002, TC-003
 *
 * Tests the depth selector overlay rendering, default selection,
 * and interactive card selection behavior.
 */

const DEPTH_LEVELS = [10, 15, 20, 25, 30] as const;

test.describe('Depth Selector Overlay', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.goto();
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
  });

  // TC-001: Depth selector overlay renders with 5 options after Step 2 Continue
  test('TC-001: overlay renders with 5 depth cards after completing Step 1', async () => {
    // Overlay should be visible after Step 1 completion
    await expect(intake.depthOverlay).toBeVisible();

    // Exactly 5 depth cards
    await expect(intake.depthCards).toHaveCount(5);

    // Each card has correct data-depth attribute
    for (const depth of DEPTH_LEVELS) {
      const card = intake.depthCard(depth);
      await expect.soft(card, `depth card ${depth} exists`).toBeVisible();
    }

    // Each card has required child elements (structure only, no text)
    for (const depth of DEPTH_LEVELS) {
      const card = intake.depthCard(depth);
      expect.soft(
        await card.locator('.depth-card__number').count(),
        `depth ${depth}: has number element`
      ).toBe(1);
      expect.soft(
        await card.locator('.depth-card__label').count(),
        `depth ${depth}: has label element`
      ).toBe(1);
      expect.soft(
        await card.locator('.depth-card__time').count(),
        `depth ${depth}: has time element`
      ).toBe(1);
    }
  });

  // TC-002: Default depth is 20 (Standard) pre-selected
  test('TC-002: depth 20 is pre-selected by default with recommended badge', async () => {
    // Card 20 should have is-selected class
    const card20 = intake.depthCard(20);
    await expect(card20).toHaveClass(/is-selected/);
    await expect(card20).toHaveAttribute('aria-checked', 'true');

    // All other cards should NOT be selected
    for (const depth of [10, 15, 25, 30]) {
      const card = intake.depthCard(depth);
      expect.soft(
        await card.getAttribute('aria-checked'),
        `depth ${depth}: aria-checked should be false`
      ).toBe('false');
    }

    // Recommended badge on card 20
    const badge = card20.locator('.depth-card__badge');
    await expect(badge).toBeVisible();
  });

  // TC-003: Selecting each depth level updates card state
  test('TC-003: clicking each depth card updates selection state', async () => {
    for (const depth of [10, 15, 25, 30]) {
      const card = intake.depthCard(depth);
      await card.click();

      // Clicked card should be selected
      expect.soft(
        await card.getAttribute('aria-checked'),
        `depth ${depth}: should be selected after click`
      ).toBe('true');
      await expect.soft(card, `depth ${depth}: has is-selected class`).toHaveClass(/is-selected/);

      // Only one card should be selected at a time
      await expect.soft(
        intake.selectedDepthCard,
        `only one card selected after clicking ${depth}`
      ).toHaveCount(1);
    }
  });
});
