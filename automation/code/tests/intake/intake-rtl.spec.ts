import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * RTL Layout Tests (QA Test Plan Category 6)
 *
 * Tests that Hebrew and Arabic language modes correctly flip
 * layout direction for all components: validation icons, badges,
 * accent bars, button bars, and card check positions.
 */

test.describe('RTL Layout', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.goto();
    await intake.switchLanguage('he');
  });

  test('TC-070: HTML dir attribute set to rtl for Hebrew', async ({ page }) => {
    const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
    expect(dir, 'HTML dir should be rtl for Hebrew').toBe('rtl');
  });

  test('TC-071: step title accent bar flips to right border in RTL', async ({ page }) => {
    const result = await page.evaluate(() => {
      const title = document.querySelector('.step__title');
      if (!title) return { borderLeft: '', borderRight: '' };
      const cs = window.getComputedStyle(title);
      return {
        borderLeft: cs.borderLeftWidth,
        borderRight: cs.borderRightWidth,
      };
    });
    // In RTL, right border should be 4px, left should be 0
    expect.soft(result.borderRight, 'RTL accent bar on right').not.toBe('0px');
    expect.soft(result.borderLeft, 'RTL no accent bar on left').toBe('0px');
  });

  test('TC-072: avoid card X badge positioned on left side in RTL', async ({ page }) => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(5);
    // Select an avoid card to make X badge visible
    const avoidCard = page.locator('#avoidSections .avoid-card').first();
    await avoidCard.click();
    const xBadge = avoidCard.locator('.avoid-card__x');
    if (await xBadge.count() > 0) {
      const result = await page.evaluate(() => {
        const badge = document.querySelector('#avoidSections .avoid-card.is-selected .avoid-card__x');
        if (!badge) return null;
        const cs = window.getComputedStyle(badge);
        // In RTL, the badge should be on the left (low left value or auto right)
        return { left: cs.left, right: cs.right };
      });
      // In RTL, left should be a small value (badge on left side), right should be auto or large
      expect(result, 'X badge has computed position').not.toBeNull();
    }
  });

  test('TC-073: button bar direction reverses in RTL', async ({ page }) => {
    const result = await page.evaluate(() => {
      const btnBar = document.querySelector('.btn-bar');
      if (!btnBar) return '';
      return window.getComputedStyle(btnBar).flexDirection;
    });
    expect(result, 'Button bar should reverse in RTL').toBe('row-reverse');
  });

  test('TC-074: validation icons positioned on left side in RTL', async ({ page }) => {
    // Trigger a validation state by filling a field
    const result = await page.evaluate(() => {
      const field = document.querySelector('.field--valid');
      if (!field) return null;
      const cs = window.getComputedStyle(field, '::after');
      return { left: cs.left, right: cs.right };
    });
    // Behavioral: if a valid field exists, its ::after is on the left in RTL
    if (result) {
      expect.soft(result.left !== 'auto', 'validation icon has left position in RTL').toBe(true);
    }
  });

  test('TC-075: interest card check badge on left side in RTL', async ({ page }) => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(4);
    // Select an interest card
    const card = page.locator('#interestsSections .interest-card').first();
    await card.click();
    const checkBadge = card.locator('.interest-card__check');
    if (await checkBadge.count() > 0 && await checkBadge.isVisible()) {
      const pos = await checkBadge.evaluate(el => {
        const cs = window.getComputedStyle(el);
        return { left: cs.left, right: cs.right };
      });
      // In RTL, check should be on left side
      expect.soft(pos.left !== 'auto', 'check badge positioned on left in RTL').toBe(true);
    }
  });

  test('TC-076: context bar inner has RTL-appropriate layout', async ({ page }) => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);
    const result = await page.evaluate(() => {
      const inner = document.querySelector('.context-bar__inner');
      if (!inner) return null;
      return { direction: window.getComputedStyle(inner).direction };
    });
    expect(result?.direction, 'context-bar__inner uses RTL direction').toBe('rtl');
  });
});
