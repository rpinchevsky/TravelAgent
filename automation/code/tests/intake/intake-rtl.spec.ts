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

  test('TC-072: avoid card X badge position flips in RTL', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Check the CSS rule for RTL avoid-card__x
      const sheet = document.styleSheets[0];
      for (const rule of sheet.cssRules) {
        const r = rule as CSSStyleRule;
        if (r.selectorText?.includes('rtl') && r.selectorText?.includes('avoid-card__x')) {
          return { hasRtlRule: true, left: r.style.left };
        }
      }
      return { hasRtlRule: false, left: '' };
    });
    expect(result.hasRtlRule, 'RTL override exists for avoid-card__x').toBe(true);
  });

  test('TC-073: button bar direction reverses in RTL', async ({ page }) => {
    const result = await page.evaluate(() => {
      const btnBar = document.querySelector('.btn-bar');
      if (!btnBar) return '';
      return window.getComputedStyle(btnBar).flexDirection;
    });
    expect(result, 'Button bar should reverse in RTL').toBe('row-reverse');
  });

  test('TC-074: validation icons flip to left side in RTL', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Check CSS rules for RTL validation icon positioning
      const sheet = document.styleSheets[0];
      for (const rule of sheet.cssRules) {
        const r = rule as CSSStyleRule;
        if (r.selectorText?.includes('rtl') && r.selectorText?.includes('field--valid::after')) {
          return { hasRtlRule: true, left: r.style.left };
        }
      }
      return { hasRtlRule: false, left: '' };
    });
    expect(result.hasRtlRule, 'RTL override exists for validation icons').toBe(true);
  });

  test('TC-075: interest card check badge flips to left in RTL', async ({ page }) => {
    const result = await page.evaluate(() => {
      const sheet = document.styleSheets[0];
      for (const rule of sheet.cssRules) {
        const r = rule as CSSStyleRule;
        if (r.selectorText?.includes('rtl') && r.selectorText?.includes('interest-card__check')) {
          return { hasRtlRule: true };
        }
      }
      return { hasRtlRule: false };
    });
    expect(result.hasRtlRule, 'RTL override exists for interest-card__check').toBe(true);
  });

  test('TC-076: context bar inner reverses direction in RTL', async ({ page }) => {
    const result = await page.evaluate(() => {
      const sheet = document.styleSheets[0];
      for (const rule of sheet.cssRules) {
        const r = rule as CSSStyleRule;
        if (r.selectorText?.includes('rtl') && r.selectorText?.includes('context-bar__inner')) {
          return { hasRtlRule: true };
        }
      }
      return { hasRtlRule: false };
    });
    expect(result.hasRtlRule, 'RTL override exists for context-bar__inner').toBe(true);
  });
});
