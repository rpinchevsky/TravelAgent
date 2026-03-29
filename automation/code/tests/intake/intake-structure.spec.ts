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
    await intake.completeStep2();
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

  test('TC-317: wizard contains exactly 9 step elements (data-step 0-8)', async () => {
    const result = await intake.page.evaluate(() => {
      const steps = document.querySelectorAll('section.step[data-step]');
      const values = Array.from(steps).map(s => s.getAttribute('data-step'));
      return { count: steps.length, values };
    });

    expect(result.count, '9 step sections exist').toBe(9);
    for (let i = 0; i <= 8; i++) {
      expect.soft(
        result.values.includes(String(i)),
        `data-step="${i}" exists`
      ).toBe(true);
    }
  });

  test('TC-318: step content correct after renumbering (Step 3=questionnaire, 4=interests, 5=avoids, 6=food, 7=extras, 8=review)', async () => {
    const result = await intake.page.evaluate(() => {
      const step3 = document.querySelector('section.step[data-step="3"]');
      const step4 = document.querySelector('section.step[data-step="4"]');
      const step5 = document.querySelector('section.step[data-step="5"]');
      const step6 = document.querySelector('section.step[data-step="6"]');
      const step7 = document.querySelector('section.step[data-step="7"]');
      const step8 = document.querySelector('section.step[data-step="8"]');
      return {
        step3HasQuestionSlides: step3 ? step3.querySelectorAll('.question-slide').length > 0 : false,
        step4HasInterests: step4 ? step4.querySelector('#interestsSections') !== null : false,
        step5HasAvoids: step5 ? step5.querySelector('#avoidSections') !== null : false,
        step6HasFood: step6 ? step6.querySelector('#foodExperienceCards') !== null : false,
        step7HasReportLang: step7 ? step7.querySelector('#reportLang') !== null : false,
        step7NoHotel: step7 ? step7.querySelector('#hotelAssistanceSection') === null : false,
        step7NoCar: step7 ? step7.querySelector('#carAssistanceSection') === null : false,
        step8HasPreview: step8 ? step8.querySelector('#previewContent') !== null : false,
      };
    });

    expect.soft(result.step3HasQuestionSlides, 'Step 3: has question slides (questionnaire)').toBe(true);
    expect.soft(result.step4HasInterests, 'Step 4: has #interestsSections').toBe(true);
    expect.soft(result.step5HasAvoids, 'Step 5: has #avoidSections').toBe(true);
    expect.soft(result.step6HasFood, 'Step 6: has #foodExperienceCards').toBe(true);
    expect.soft(result.step7HasReportLang, 'Step 7: has #reportLang').toBe(true);
    expect.soft(result.step7NoHotel, 'Step 7: no hotel section').toBe(true);
    expect.soft(result.step7NoCar, 'Step 7: no car section').toBe(true);
    expect.soft(result.step8HasPreview, 'Step 8: has #previewContent (review)').toBe(true);
  });
});
