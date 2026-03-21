import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Dark Mode Tests (QA Test Plan Category 8)
 *
 * Tests that dark mode CSS variables are defined and that
 * no hardcoded colors become invisible against dark backgrounds.
 */

test.describe('Dark Mode', () => {

  test('TC-088: core dark mode CSS variables are defined', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();

    // Emulate dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    const result = await page.evaluate(() => {
      const root = document.documentElement;
      const cs = window.getComputedStyle(root);
      const vars = [
        '--color-bg', '--color-surface', '--color-surface-raised',
        '--color-text-primary', '--color-text-secondary', '--color-text-muted',
        '--color-border', '--color-border-strong',
      ];
      const values: Record<string, string> = {};
      const missing: string[] = [];
      for (const v of vars) {
        const val = cs.getPropertyValue(v).trim();
        values[v] = val;
        if (!val) missing.push(v);
      }
      return { values, missing };
    });
    for (const m of result.missing) {
      expect.soft(false, `Dark mode variable ${m} is empty`).toBe(true);
    }
    expect(result.missing.length, 'All core dark mode variables defined').toBe(0);
  });

  test('TC-089: dark mode background differs from light mode', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();

    // Get light mode bg
    const lightBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    // Switch to dark mode
    await page.emulateMedia({ colorScheme: 'dark' });

    const darkBg = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });

    expect(lightBg !== darkBg, `Light (${lightBg}) should differ from dark (${darkBg})`).toBe(true);
  });

  test('TC-090: selected card states have dark mode overrides', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    await page.emulateMedia({ colorScheme: 'dark' });

    const result = await page.evaluate(() => {
      const sheet = document.styleSheets[0];
      const darkRules: string[] = [];
      for (const rule of sheet.cssRules) {
        if (rule instanceof CSSMediaRule && rule.conditionText?.includes('dark')) {
          for (const inner of rule.cssRules) {
            darkRules.push((inner as CSSStyleRule).selectorText ?? '');
          }
        }
      }
      return {
        hasQCardDark: darkRules.some(r => r.includes('q-card') && r.includes('is-selected')),
        hasAvoidCardDark: darkRules.some(r => r.includes('avoid-card') && r.includes('is-selected')),
        hasDepthCardDark: darkRules.some(r => r.includes('depth-card') && r.includes('is-selected')),
      };
    });
    expect.soft(result.hasQCardDark, 'q-card.is-selected has dark mode override').toBe(true);
    expect.soft(result.hasAvoidCardDark, 'avoid-card.is-selected has dark mode override').toBe(true);
    expect.soft(result.hasDepthCardDark, 'depth-card.is-selected has dark mode override').toBe(true);
  });

  test('TC-091: post-download title uses defined CSS variable (not undefined --color-text)', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();

    const result = await page.evaluate(() => {
      const sheet = document.styleSheets[0];
      for (const rule of sheet.cssRules) {
        const r = rule as CSSStyleRule;
        if (r.selectorText?.includes('post-download__title')) {
          return {
            found: true,
            colorValue: r.style.color,
            usesUndefinedVar: r.style.color?.includes('--color-text)'),
          };
        }
      }
      return { found: false, colorValue: '', usesUndefinedVar: false };
    });
    expect.soft(result.usesUndefinedVar, 'Should not use undefined --color-text variable').toBe(false);
  });
});
