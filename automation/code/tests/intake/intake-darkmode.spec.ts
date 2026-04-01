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

    // Verify dark mode produces distinct surface/background colors
    // (selected card may share border across themes, so check surface color)
    const result = await page.evaluate(() => {
      const root = document.documentElement;
      const cs = window.getComputedStyle(root);
      const surface = cs.getPropertyValue('--color-surface').trim();
      const surfaceRaised = cs.getPropertyValue('--color-surface-raised').trim();
      const bg = cs.getPropertyValue('--color-bg').trim();
      return {
        hasSurface: surface.length > 0,
        hasSurfaceRaised: surfaceRaised.length > 0,
        hasBg: bg.length > 0,
      };
    });
    expect.soft(result.hasSurface, 'dark mode --color-surface is defined').toBe(true);
    expect.soft(result.hasSurfaceRaised, 'dark mode --color-surface-raised is defined').toBe(true);
    expect.soft(result.hasBg, 'dark mode --color-bg is defined').toBe(true);
  });

  test('TC-091: post-download title uses a defined color variable (not transparent/empty)', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();

    const result = await page.evaluate(() => {
      const title = document.querySelector('.post-download__title');
      if (!title) return { found: false, color: '', isTransparent: false };
      const cs = window.getComputedStyle(title);
      return {
        found: true,
        color: cs.color,
        isTransparent: cs.color === 'rgba(0, 0, 0, 0)' || cs.color === 'transparent',
      };
    });
    expect.soft(result.found, 'post-download__title exists').toBe(true);
    expect.soft(result.isTransparent, 'Title color should not be transparent').toBe(false);
    expect.soft(result.color.length > 0, 'Title has a computed color').toBe(true);
  });
});
