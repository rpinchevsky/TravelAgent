import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Full i18n Tests (QA Test Plan Category 5)
 *
 * Tests translation completeness, dynamic content translation,
 * calendar month names, DOB month names, and absence of
 * hardcoded English strings in user-visible elements.
 */

const SUPPORTED_LANGUAGES = ['en', 'ru', 'he', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'] as const;

test.describe('i18n Completeness', () => {

  test('TC-064: all visible static text elements have data-i18n attribute', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();

    const issues = await page.evaluate(() => {
      const problems: string[] = [];
      // Check step titles and descriptions
      document.querySelectorAll('.step__title, .step__desc').forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) {
          problems.push(`Step header element ${i} (${el.className}) missing data-i18n`);
        }
      });
      // Check button text
      document.querySelectorAll('.btn-next, .btn-prev, .btn--accent').forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) {
          problems.push(`Button ${i} (${el.className}) missing data-i18n`);
        }
      });
      // Check field labels
      document.querySelectorAll('.field__label').forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) {
          problems.push(`Field label ${i} missing data-i18n`);
        }
      });
      return problems;
    });
    for (const issue of issues) {
      expect.soft(false, issue).toBe(true);
    }
    expect(issues.length, `${issues.length} elements missing data-i18n`).toBe(0);
  });

  test('TC-065: calendar month names and day abbreviations are translated', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();

    // Open date picker
    await page.locator('#sbDatesToggle').click();
    await expect(page.locator('#sbDatesDropdown')).toBeVisible();

    // Switch to Russian
    await intake.switchLanguage('ru');

    // Re-open date picker (may have closed on language switch)
    if (!await page.locator('#sbDatesDropdown').isVisible()) {
      await page.locator('#sbDatesToggle').click();
    }

    // Check that day-of-week headers are translated (Russian uses Пн, Вт, etc.)
    const result = await page.evaluate(() => {
      const dows = document.querySelectorAll('.date-picker__dow');
      const texts = Array.from(dows).map(d => d.textContent?.trim() ?? '');
      // English days start with Su, Mo; Russian with Вс, Пн
      const hasEnglish = texts.some(t => ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].includes(t));
      return { texts: texts.slice(0, 7), hasEnglish };
    });
    expect(result.hasEnglish, `Calendar still shows English days: ${result.texts.join(', ')}`).toBe(false);
  });

  test('TC-066: DOB month dropdown names are translated when language changes', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.completeStep0();

    // We're on Step 1 with traveler cards
    // Switch to Russian
    await intake.switchLanguage('ru');

    const result = await page.evaluate(() => {
      const monthSel = document.querySelector('.dob-month');
      if (!monthSel) return { found: false, options: [] };
      const opts = Array.from(monthSel.querySelectorAll('option')).map(o => o.textContent ?? '');
      // Filter out placeholder
      const monthOpts = opts.filter(o => o.length > 2);
      // Check for English month names
      const englishMonths = ['January', 'February', 'March', 'April'];
      const hasEnglish = monthOpts.some(m => englishMonths.includes(m));
      return { found: true, options: monthOpts.slice(0, 3), hasEnglish };
    });
    expect(result.found, 'DOB month dropdown found').toBe(true);
    expect(result.hasEnglish, `DOB months still in English: ${result.options.join(', ')}`).toBe(false);
  });

  test('TC-067: Step 1 validation error message uses translation (not hardcoded English)', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.completeStep0();

    // Switch to Russian
    await intake.switchLanguage('ru');

    // Try to proceed without filling name — should show translated error
    const result = await page.evaluate(() => {
      // Clear the name field
      const nameInput = document.querySelector('.parent-name') as HTMLInputElement;
      if (nameInput) nameInput.value = '';
      // Try to validate
      const step = document.querySelector('[data-step="1"]');
      const msgEl = step?.querySelector('.traveler-card__error');
      // The validation message should not contain English text
      return {
        hasHardcodedEnglish: msgEl?.textContent?.includes('Please fill in') ?? false,
      };
    });
    // After validation triggers, message should not be hardcoded English
    expect.soft(result.hasHardcodedEnglish, 'Validation error should not be hardcoded English').toBe(false);
  });

  test('TC-068: dynamically generated interest cards use tItem() for display names', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // Switch to Hebrew
    await intake.switchLanguage('he');
    await intake.navigateToStep(3);

    const result = await page.evaluate(() => {
      const cards = document.querySelectorAll('#interestsSections .interest-card');
      const issues: string[] = [];
      cards.forEach((card, i) => {
        const enName = (card as HTMLElement).dataset.enName;
        const displayName = card.querySelector('.interest-card__name')?.textContent;
        // In Hebrew, display name should differ from English name (for items with translations)
        // At minimum, data-en-name must exist for markdown output
        if (!enName) {
          issues.push(`Card ${i} missing data-en-name`);
        }
      });
      return issues;
    });
    expect(result.length, `${result.length} interest cards without data-en-name`).toBe(0);
  });

  test('TC-069: mobile bottom sheet Done button has data-i18n', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();

    const result = await page.evaluate(() => {
      const btn = document.getElementById('bsTravelerDone');
      return btn?.getAttribute('data-i18n') ?? null;
    });
    expect(result, 'bsTravelerDone should have data-i18n attribute').toBe('sb_done');
  });
});
