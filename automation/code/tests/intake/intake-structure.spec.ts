import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * HTML Structure & Syntax Tests (QA Test Plan Category 3)
 *
 * Validates DOM correctness: properly closed tags, no orphaned
 * classes, interactive elements use proper semantic elements.
 */

test.describe('HTML Structure & Syntax', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.goto();
  });

  test('TC-051: avoid-quiz container is properly closed (no DOM corruption)', async () => {
    const result = await intake.page.evaluate(() => {
      const quiz = document.getElementById('avoidQuiz');
      if (!quiz) return { exists: false, tagName: '', childCount: 0 };
      return {
        exists: true,
        tagName: quiz.tagName,
        childCount: quiz.children.length,
        hasSubDots: !!quiz.querySelector('.sub-dots'),
      };
    });
    expect.soft(result.exists, 'avoidQuiz element exists').toBe(true);
    expect.soft(result.tagName, 'avoidQuiz is a DIV').toBe('DIV');
    expect.soft(result.childCount, 'avoidQuiz has child elements').toBeGreaterThan(0);
    expect.soft(result.hasSubDots, 'avoidQuiz contains sub-dots (proper nesting)').toBe(true);
  });

  test('TC-052: food-quiz container is properly closed (no DOM corruption)', async () => {
    const result = await intake.page.evaluate(() => {
      const quiz = document.getElementById('foodQuiz');
      if (!quiz) return { exists: false, tagName: '', childCount: 0 };
      return {
        exists: true,
        tagName: quiz.tagName,
        childCount: quiz.children.length,
        hasSubDots: !!quiz.querySelector('.sub-dots'),
      };
    });
    expect.soft(result.exists, 'foodQuiz element exists').toBe(true);
    expect.soft(result.tagName, 'foodQuiz is a DIV').toBe('DIV');
    expect.soft(result.childCount, 'foodQuiz has child elements').toBeGreaterThan(0);
    expect.soft(result.hasSubDots, 'foodQuiz contains sub-dots (proper nesting)').toBe(true);
  });

  test('TC-053: all interactive card elements have role="button" or are <button>', async () => {
    await intake.completePrerequisiteSteps();
    await intake.selectDepthAndConfirm(20);
    const issues = await intake.page.evaluate(() => {
      const problems: string[] = [];
      const selectors = ['.q-card', '.interest-card', '.pace-card', '.depth-card'];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach((el, i) => {
          const tag = el.tagName;
          const role = el.getAttribute('role');
          const tabindex = el.getAttribute('tabindex');
          if (tag !== 'BUTTON' && role !== 'button' && role !== 'radio') {
            problems.push(`${sel}[${i}]: tag=${tag}, role=${role}, no button semantics`);
          }
          if (tag !== 'BUTTON' && tabindex === null) {
            problems.push(`${sel}[${i}]: tag=${tag}, missing tabindex for keyboard access`);
          }
        });
      });
      return problems;
    });
    for (const issue of issues) {
      expect.soft(false, issue).toBe(true);
    }
    expect(issues.length, `${issues.length} cards without button semantics`).toBe(0);
  });

  test('TC-054: depth pill uses <button> element (not <span>)', async () => {
    const tagName = await intake.page.evaluate(() => {
      return document.getElementById('depthPill')?.tagName ?? 'UNKNOWN';
    });
    expect(tagName, 'Depth pill should be a BUTTON').toBe('BUTTON');
  });

  test('TC-055: hidden quiz containers have display:none and do not affect visible layout', async () => {
    const result = await intake.page.evaluate(() => {
      const avoidQuiz = document.getElementById('avoidQuiz');
      const foodQuiz = document.getElementById('foodQuiz');
      return {
        avoidHidden: avoidQuiz ? window.getComputedStyle(avoidQuiz).display === 'none' : false,
        foodHidden: foodQuiz ? window.getComputedStyle(foodQuiz).display === 'none' : false,
      };
    });
    expect.soft(result.avoidHidden, 'avoidQuiz is display:none').toBe(true);
    expect.soft(result.foodHidden, 'foodQuiz is display:none').toBe(true);
  });
});
