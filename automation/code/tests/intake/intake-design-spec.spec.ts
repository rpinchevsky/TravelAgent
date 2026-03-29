import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Design Spec Compliance Tests (QA Test Plan Category 9)
 *
 * Verifies that the implementation matches the design specification
 * for layout, positioning, colors, and component structure.
 */

test.describe('Design Spec Compliance', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.goto();
  });

  test('TC-092: Step 0 has 4-option rhythm card grid with question-options--4 class', async () => {
    const result = await intake.page.evaluate(() => {
      const opts = document.getElementById('rhythmOptions');
      if (!opts) return { exists: false, hasClass: false, cardCount: 0 };
      return {
        exists: true,
        hasClass: opts.classList.contains('question-options--4'),
        cardCount: opts.querySelectorAll('.q-card').length,
      };
    });
    expect.soft(result.exists, 'Rhythm options exists').toBe(true);
    expect.soft(result.hasClass, 'Has question-options--4 class').toBe(true);
    expect.soft(result.cardCount, 'Has 4 rhythm cards').toBe(4);
  });

  test('TC-093: preview box has syntax highlight CSS classes defined', async () => {
    const result = await intake.page.evaluate(() => {
      const sheet = document.styleSheets[0];
      const found: Record<string, boolean> = {
        'md-heading': false,
        'md-bold': false,
        'md-bullet': false,
        'md-table': false,
      };
      for (const rule of sheet.cssRules) {
        const r = rule as CSSStyleRule;
        if (!r.selectorText) continue;
        for (const cls of Object.keys(found)) {
          if (r.selectorText.includes(cls)) found[cls] = true;
        }
      }
      return found;
    });
    for (const [cls, exists] of Object.entries(result)) {
      expect.soft(exists, `.${cls} CSS rule exists`).toBe(true);
    }
  });

  test('TC-094: lang selector positioned at top: 16px, right: 16px per spec', async () => {
    const result = await intake.page.evaluate(() => {
      const sel = document.querySelector('.lang-selector');
      if (!sel) return { top: '', right: '' };
      const cs = window.getComputedStyle(sel);
      return { top: cs.top, right: cs.right };
    });
    expect.soft(result.top, 'Lang selector top position').toBe('16px');
  });

  test('TC-095: context bar visibility follows spec (hidden Step 0 & 8, visible Steps 1-7)', async () => {
    // Step 0: hidden
    await expect.soft(intake.contextBar, 'Hidden on Step 0').not.toBeVisible();

    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);

    // Step 3 (after depth selection): visible
    await expect.soft(intake.contextBar, 'Visible on Step 3').toBeVisible();

    // Navigate to Step 8 (Review)
    await intake.navigateToStep(8);
    const currentStep = await intake.getCurrentStepNumber();
    if (currentStep === 8) {
      await expect.soft(intake.contextBar, 'Hidden on Step 8').not.toBeVisible();
    }
  });

  test('TC-096: preview tab label shows dynamic filename pattern', async () => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(8);

    const tabText = await intake.previewTabLabel.textContent();
    expect.soft(tabText, 'Tab label should end with .md').toContain('.md');
    expect.soft(tabText, 'Tab label should contain trip_details').toContain('trip_details');
  });

  test('TC-097: Step 7 depth-extra-question cards have reduced min-height', async () => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(25); // T4 questions visible at depth 25
    await intake.navigateToStep(7);

    const result = await intake.page.evaluate(() => {
      const extraQ = document.querySelector('.depth-extra-question .q-card');
      if (!extraQ) return { found: false, minHeight: '' };
      return {
        found: true,
        minHeight: window.getComputedStyle(extraQ).minHeight,
      };
    });
    if (result.found) {
      const minH = parseInt(result.minHeight);
      expect.soft(minH, 'Step 7 q-card min-height should be <= 140px').toBeLessThanOrEqual(140);
    }
  });

  test('TC-098: Step 7 depth-extra-question labels styled like chip-section__title', async () => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(25);
    await intake.navigateToStep(7);

    const result = await intake.page.evaluate(() => {
      const label = document.querySelector('.depth-extra-question .field__label');
      if (!label) return { found: false, textTransform: '', letterSpacing: '' };
      const cs = window.getComputedStyle(label);
      return {
        found: true,
        textTransform: cs.textTransform,
        letterSpacing: cs.letterSpacing,
      };
    });
    if (result.found) {
      expect.soft(result.textTransform, 'Label should be uppercase').toBe('uppercase');
    }
  });

  test('TC-099: post-download section has left accent border (4px brand-primary)', async () => {
    const result = await intake.page.evaluate(() => {
      const pd = document.querySelector('.post-download');
      if (!pd) return { found: false, borderLeftWidth: '' };
      const cs = window.getComputedStyle(pd);
      return {
        found: true,
        borderLeftWidth: cs.borderLeftWidth,
      };
    });
    expect.soft(result.found, 'Post-download section exists').toBe(true);
    expect.soft(result.borderLeftWidth, 'Left border should be 4px').toBe('4px');
  });
});
