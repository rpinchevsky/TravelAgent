import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Generic i18n Key Leak Scanner — TC-132
 *
 * Invariant test: after loading the page in a non-English language,
 * scans ALL visible text content and select option text for raw i18n
 * key patterns. When t() cannot resolve a key, it returns the key
 * itself (e.g., "s1_dob_year"). This test detects ANY such leak
 * across the entire page, not just specific elements.
 *
 * Pattern: /\b[a-z]\d+_[a-z]\w*\b/ — matches keys like s1_dob_year,
 * s3_title, s0_destination, etc.
 *
 * Language-agnostic: asserts absence of raw key patterns, not
 * presence of specific translations.
 *
 * Spec file: intake-i18n-key-leak.spec.ts
 * BRD: REQ-003
 */

/** Regex pattern matching i18n keys: letter, digit(s), underscore, letter, word chars */
const I18N_KEY_PATTERN = /\b[a-z]\d+_[a-z]\w*\b/;

test.describe('i18n Key Leak Scanner', () => {

  test('TC-132: no raw i18n keys visible in non-English UI', async ({ page }) => {
    // REQ-003 -> AC-1 through AC-6
    const intake = new IntakePage(page);

    // Navigate to intake page
    await intake.goto();
    await intake.waitForI18nReady();

    // Switch to a non-English language (Russian) so raw keys are distinguishable
    // from legitimate English text (AC-1)
    await intake.switchLanguage('ru');
    await intake.waitForI18nReady();

    // Complete Step 0 to advance to Step 1 where DOB fields are rendered (AC-6)
    await intake.completeStep0();

    // Collect all text content from visible elements AND all select option text.
    // Select options are in the DOM but may not be "visible" in the traditional
    // sense — we explicitly scan them (the bug was in placeholder options).
    const leakedKeys = await page.evaluate((patternSource) => {
      const pattern = new RegExp(patternSource, 'g');
      const results: Array<{ key: string; element: string; context: string }> = [];
      const seen = new Set<string>();

      /**
       * Check a text string for i18n key leaks and record any matches.
       */
      function checkText(text: string, elementDesc: string, contextText: string) {
        if (!text) return;
        const matches = text.match(pattern);
        if (matches) {
          for (const m of matches) {
            const id = `${m}|${elementDesc}`;
            if (!seen.has(id)) {
              seen.add(id);
              results.push({
                key: m,
                element: elementDesc,
                context: contextText.slice(0, 80),
              });
            }
          }
        }
      }

      // 1. Scan all elements' textContent (covers visible text across all steps,
      //    including hidden steps that are in the DOM) — AC-6
      const allElements = document.querySelectorAll('body *');
      for (const el of allElements) {
        // Skip script, style, and template elements
        const tag = el.tagName.toLowerCase();
        if (tag === 'script' || tag === 'style' || tag === 'template') continue;

        // For non-select elements, check direct text nodes only (avoid double-counting
        // parent textContent that includes child text)
        if (tag !== 'select' && tag !== 'option') {
          for (const node of el.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent) {
              const text = node.textContent.trim();
              if (text) {
                const desc = `<${tag}${el.id ? '#' + el.id : ''}${el.className ? '.' + String(el.className).split(' ')[0] : ''}>`;
                checkText(text, desc, text);
              }
            }
          }
        }
      }

      // 2. Explicitly scan ALL <select> option text — the bug was in placeholder
      //    options of DOB dropdowns (AC-2, AC-6)
      const selects = document.querySelectorAll('select');
      for (const sel of selects) {
        const selDesc = `<select${sel.className ? '.' + sel.className.split(' ')[0] : ''}${sel.closest('.traveler-card') ? ' in traveler-card' : ''}>`;
        for (const opt of sel.options) {
          const text = opt.textContent?.trim();
          if (text) {
            checkText(text, `${selDesc} > <option value="${opt.value}">`, text);
          }
        }
      }

      // 3. Scan placeholder attributes on inputs
      const inputs = document.querySelectorAll('input[placeholder], textarea[placeholder]');
      for (const inp of inputs) {
        const placeholder = (inp as HTMLInputElement).placeholder;
        if (placeholder) {
          const desc = `<${inp.tagName.toLowerCase()}${inp.id ? '#' + inp.id : ''}> placeholder`;
          checkText(placeholder, desc, placeholder);
        }
      }

      return results;
    }, I18N_KEY_PATTERN.source);

    // Use expect.soft() to report ALL leaked keys, not just the first one (AC-3)
    for (const leak of leakedKeys) {
      expect.soft(
        null,
        `Raw i18n key "${leak.key}" found in ${leak.element} — context: "${leak.context}"`
      ).toBeNull();
    }

    // Hard assert: no leaked keys at all
    expect(
      leakedKeys.length,
      `Found ${leakedKeys.length} raw i18n key(s) leaked in non-English UI: ${leakedKeys.map(l => l.key).join(', ')}`
    ).toBe(0);
  });
});
