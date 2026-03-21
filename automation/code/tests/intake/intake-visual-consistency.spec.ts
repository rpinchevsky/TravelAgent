import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Cross-Step Visual Consistency Tests (QA Test Plan Categories 1-2)
 *
 * Verifies that all card components across Steps 3-5 share the same
 * visual dimensions, layout, and interaction patterns. This is the
 * #1 lesson learned from the QA review: visual consistency across
 * screens must be tested property-by-property.
 */

const CARD_STEPS = [3, 4, 5] as const;

test.describe('Cross-Step Visual Consistency', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
  });

  test('TC-038: interest cards (Step 3) use centered vertical layout', async () => {
    await intake.navigateToStep(3);
    const styles = await intake.getCardStyles('#interestsSections .interest-card');
    expect.soft(styles.flexDirection, 'Interest card flex-direction').toBe('column');
    expect.soft(styles.textAlign, 'Interest card text-align').toBe('center');
    expect.soft(styles.alignItems, 'Interest card align-items').toBe('center');
  });

  test('TC-039: avoid cards (Step 4) match interest card layout direction', async () => {
    await intake.navigateToStep(4);
    const styles = await intake.getCardStyles('#avoidSections .avoid-card');
    expect.soft(styles.flexDirection, 'Avoid card flex-direction').toBe('column');
    expect.soft(styles.textAlign, 'Avoid card text-align').toBe('center');
    expect.soft(styles.alignItems, 'Avoid card align-items').toBe('center');
  });

  test('TC-040: food experience cards (Step 5) match interest card layout direction', async () => {
    await intake.navigateToStep(5);
    const styles = await intake.getCardStyles('#foodExperienceCards .interest-card');
    expect.soft(styles.flexDirection, 'Food card flex-direction').toBe('column');
    expect.soft(styles.textAlign, 'Food card text-align').toBe('center');
    expect.soft(styles.alignItems, 'Food card align-items').toBe('center');
  });

  test('TC-041: vibe cards (Step 5) match interest card layout direction', async () => {
    await intake.navigateToStep(5);
    const styles = await intake.getCardStyles('#vibeGroup .avoid-card');
    expect.soft(styles.flexDirection, 'Vibe card flex-direction').toBe('column');
    expect.soft(styles.textAlign, 'Vibe card text-align').toBe('center');
    expect.soft(styles.alignItems, 'Vibe card align-items').toBe('center');
  });

  test('TC-042: avoid card border-radius matches interest card border-radius', async () => {
    const interestStyles = await intake.page.evaluate(() => {
      const interestCard = document.querySelector('#interestsSections .interest-card');
      const avoidCard = document.querySelector('#avoidSections .avoid-card');
      if (!interestCard || !avoidCard) return { match: false, interest: '', avoid: '' };
      const ics = window.getComputedStyle(interestCard);
      const acs = window.getComputedStyle(avoidCard);
      return {
        match: ics.borderRadius === acs.borderRadius,
        interest: ics.borderRadius,
        avoid: acs.borderRadius,
      };
    });
    expect(interestStyles.match, `Interest (${interestStyles.interest}) vs Avoid (${interestStyles.avoid})`).toBe(true);
  });

  test('TC-043: avoid card padding matches interest card padding', async () => {
    const result = await intake.page.evaluate(() => {
      const interestCard = document.querySelector('#interestsSections .interest-card');
      const avoidCard = document.querySelector('#avoidSections .avoid-card');
      if (!interestCard || !avoidCard) return { match: false, interest: '', avoid: '' };
      const ics = window.getComputedStyle(interestCard);
      const acs = window.getComputedStyle(avoidCard);
      return {
        match: ics.padding === acs.padding,
        interest: ics.padding,
        avoid: acs.padding,
      };
    });
    expect(result.match, `Interest (${result.interest}) vs Avoid (${result.avoid})`).toBe(true);
  });

  test('TC-044: avoid card emoji size matches interest card emoji size', async () => {
    const result = await intake.page.evaluate(() => {
      const interestEmoji = document.querySelector('#interestsSections .interest-card__emoji');
      const avoidIcon = document.querySelector('#avoidSections .avoid-card__icon');
      if (!interestEmoji || !avoidIcon) return { match: false, interest: '', avoid: '' };
      const ifs = window.getComputedStyle(interestEmoji).fontSize;
      const afs = window.getComputedStyle(avoidIcon).fontSize;
      return { match: ifs === afs, interest: ifs, avoid: afs };
    });
    expect(result.match, `Interest emoji (${result.interest}) vs Avoid icon (${result.avoid})`).toBe(true);
  });

  test('TC-045: avoid card name font-size matches interest card name font-size', async () => {
    const result = await intake.page.evaluate(() => {
      const interestName = document.querySelector('#interestsSections .interest-card__name');
      const avoidName = document.querySelector('#avoidSections .avoid-card__name');
      if (!interestName || !avoidName) return { match: false, interest: '', avoid: '' };
      const ifs = window.getComputedStyle(interestName).fontSize;
      const afs = window.getComputedStyle(avoidName).fontSize;
      return { match: ifs === afs, interest: ifs, avoid: afs };
    });
    expect(result.match, `Interest name (${result.interest}) vs Avoid name (${result.avoid})`).toBe(true);
  });

  test('TC-046: all grid layouts use same column count at desktop width', async () => {
    const result = await intake.page.evaluate(() => {
      const grids = [
        document.querySelector('#interestsSections .interest-grid'),
        document.querySelector('#avoidSections .avoid-grid'),
        document.querySelector('#foodExperienceCards .interest-grid'),
        document.querySelector('#vibeGroup .avoid-grid'),
      ].filter(Boolean);
      const cols = grids.map(g => window.getComputedStyle(g!).gridTemplateColumns);
      const allMatch = cols.every(c => c === cols[0]);
      return { allMatch, cols };
    });
    expect(result.allMatch, `Grid columns: ${JSON.stringify(result.cols)}`).toBe(true);
  });

  test('TC-047: vibe cards use avoid-card--vibe CSS modifier (no inline style overrides)', async () => {
    await intake.navigateToStep(5);
    const result = await intake.page.evaluate(() => {
      const vibeCards = document.querySelectorAll('#vibeGroup .avoid-card');
      const issues: string[] = [];
      vibeCards.forEach((card, i) => {
        if (!card.classList.contains('avoid-card--vibe')) {
          issues.push(`Card ${i} missing avoid-card--vibe class`);
        }
        const el = card as HTMLElement;
        if (el.style.borderColor || el.style.background) {
          issues.push(`Card ${i} has inline style overrides: border=${el.style.borderColor}, bg=${el.style.background}`);
        }
      });
      return issues;
    });
    for (const issue of result) {
      expect.soft(false, issue).toBe(true);
    }
    expect(result.length, `${result.length} vibe card issues found`).toBe(0);
  });

  test('TC-048: every step has step__title with accent bar and step__desc', async () => {
    for (const step of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const section = intake.stepSection(step);
      const title = section.locator('.step__title');
      const desc = section.locator('.step__desc');
      expect.soft(await title.count(), `Step ${step} missing .step__title`).toBeGreaterThan(0);
      expect.soft(await desc.count(), `Step ${step} missing .step__desc`).toBeGreaterThan(0);
    }
  });

  test('TC-049: Steps 3-5 sub-sections use chip-section__title + chip-section__desc consistently', async () => {
    const result = await intake.page.evaluate(() => {
      const issues: string[] = [];
      for (const step of [3, 4, 5]) {
        const section = document.querySelector(`section.step[data-step="${step}"]`);
        if (!section) { issues.push(`Step ${step} section not found`); continue; }
        const titles = section.querySelectorAll('.chip-section__title');
        titles.forEach((t, i) => {
          const next = t.nextElementSibling;
          // Check that a .chip-section__desc follows (or a grid directly follows for implicit desc)
          if (next && !next.classList.contains('chip-section__desc') &&
              !next.classList.contains('interest-grid') &&
              !next.classList.contains('avoid-grid') &&
              !next.classList.contains('pace-options')) {
            // Allow inline style desc as fallback check
            if (next.tagName !== 'P' || !next.getAttribute('style')?.includes('font-size')) {
              issues.push(`Step ${step}, section ${i}: element after chip-section__title is not chip-section__desc (is: ${next.tagName}.${next.className})`);
            }
          }
        });
      }
      return issues;
    });
    for (const issue of result) {
      expect.soft(false, issue).toBe(true);
    }
    expect(result.length, `${result.length} sub-section header issues`).toBe(0);
  });

  test('TC-050: every step has btn-bar with consistent layout', async () => {
    for (const step of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const section = intake.stepSection(step);
      const btnBar = section.locator('.btn-bar');
      expect.soft(await btnBar.count(), `Step ${step} missing .btn-bar`).toBeGreaterThan(0);
    }
  });
});
