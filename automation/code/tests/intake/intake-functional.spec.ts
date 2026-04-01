import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Functional Correctness Tests (QA Test Plan Category 4)
 *
 * Tests slide animations, preview rendering,
 * markdown output correctness, and datetime handling.
 */

test.describe('Functional Correctness', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.goto();
  });

  test('TC-059: step slide animation uses correct direction classes', async () => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);

    // Forward navigation should apply slide-right class
    const forwardClass = await intake.page.evaluate(() => {
      const visible = document.querySelector('.step.is-visible');
      return visible?.classList.contains('slide-right') || visible?.classList.contains('slide-left')
        ? (visible.classList.contains('slide-right') ? 'slide-right' : 'slide-left')
        : 'none';
    });
    // After forward nav, should have slide-right
    expect.soft(forwardClass, 'Forward navigation uses slide-right').toBe('slide-right');
  });

  test('TC-060: preview content has syntax highlighting spans', async () => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(8);

    const result = await intake.page.evaluate(() => {
      const preview = document.getElementById('previewContent');
      if (!preview) return { exists: false, hasHeading: false, hasBold: false, hasBullet: false };
      return {
        exists: true,
        hasHeading: !!preview.querySelector('.md-heading'),
        hasBold: !!preview.querySelector('.md-bold'),
        hasBullet: !!preview.querySelector('.md-bullet'),
        hasRawMd: !!preview.dataset.rawMd,
      };
    });
    expect.soft(result.exists, 'Preview content exists').toBe(true);
    expect.soft(result.hasHeading, 'Preview has .md-heading spans').toBe(true);
    expect.soft(result.hasBold, 'Preview has .md-bold spans').toBe(true);
    expect.soft(result.hasBullet, 'Preview has .md-bullet spans').toBe(true);
    expect.soft(result.hasRawMd, 'Preview has data-rawMd for copy').toBe(true);
  });

  test('TC-061: food experience names use data-en-name for markdown output', async () => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(6);

    const result = await intake.page.evaluate(() => {
      const cards = document.querySelectorAll('#foodExperienceCards .interest-card');
      const missing: number[] = [];
      cards.forEach((c, i) => {
        if (!(c as HTMLElement).dataset.enName) missing.push(i);
      });
      return { total: cards.length, missingEnName: missing };
    });
    expect(result.missingEnName.length, `${result.missingEnName.length} food cards without data-en-name`).toBe(0);
  });

  test('TC-062: vibe card names use data-en-name for markdown output', async () => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(6);

    const result = await intake.page.evaluate(() => {
      const cards = document.querySelectorAll('#vibeGroup .avoid-card');
      const missing: number[] = [];
      cards.forEach((c, i) => {
        if (!(c as HTMLElement).dataset.enName) missing.push(i);
      });
      return { total: cards.length, missingEnName: missing };
    });
    expect(result.missingEnName.length, `${result.missingEnName.length} vibe cards without data-en-name`).toBe(0);
  });

  test('TC-063: arrival/departure values use local datetime format (no UTC shift)', async () => {
    await intake.completePrerequisiteSteps();
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(8);

    const result = await intake.page.evaluate(() => {
      const arrival = (document.getElementById('arrival') as HTMLInputElement)?.value ?? '';
      const departure = (document.getElementById('departure') as HTMLInputElement)?.value ?? '';
      // Local datetime-local values should NOT contain 'Z' or timezone offset
      return {
        arrival,
        departure,
        arrivalHasZ: arrival.includes('Z'),
        departureHasZ: departure.includes('Z'),
      };
    });
    expect.soft(result.arrivalHasZ, 'Arrival should not have Z (UTC marker)').toBe(false);
    expect.soft(result.departureHasZ, 'Departure should not have Z (UTC marker)').toBe(false);
  });
});

// ============================================================================
// Navigation Progression Tests (TC-333–TC-336, TC-342, TC-370–TC-372)
// TC-056–TC-058 removed: covered by TC-095 in design-spec
// TC-329 replaced by TC-365 (removed): covered by TC-333 full forward
// TC-365–TC-369 removed: covered by TC-333/TC-334 full forward/backward + TC-370/TC-372
// ============================================================================
test.describe('Step Reorder Navigation (TC-370 through TC-372)', () => {
  test('TC-370: depth pill re-entry works from later steps', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    // Navigate to Step 4
    await intake.navigateToStep(4);
    const beforeStep = await intake.getCurrentStepNumber();
    expect(beforeStep, 'on Step 4').toBe(4);

    // Click depth pill to re-open overlay
    await intake.depthPill.click();
    await expect(intake.depthOverlay).toBeVisible();

    // Change depth and confirm
    await intake.selectDepthAndConfirm(30);

    // Should return to the step user was on
    const afterStep = await intake.getCurrentStepNumber();
    expect(afterStep, 'returned to Step 4 after depth re-entry').toBe(beforeStep);
  });

  test('TC-371: stepper shows correct step sequence', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    const stepSequence = await page.evaluate(() => {
      const steps = document.querySelectorAll('.stepper__step');
      return Array.from(steps)
        .filter(s => {
          const el = s as HTMLElement;
          return !el.hidden && window.getComputedStyle(el).display !== 'none';
        })
        .map(s => parseInt(s.getAttribute('data-step') ?? '-1', 10))
        .filter(n => n >= 0);
    });

    // Verify steps 0, 1, 2, 3 exist in order
    for (const expected of [0, 1, 2, 3]) {
      expect.soft(stepSequence.includes(expected), `stepper includes step ${expected}`).toBe(true);
    }
    // Verify ascending order
    for (let i = 1; i < stepSequence.length; i++) {
      expect.soft(
        stepSequence[i] > stepSequence[i - 1],
        `step ${stepSequence[i]} follows step ${stepSequence[i - 1]}`
      ).toBe(true);
    }
  });

  test('TC-372: depth overlay opens from Step 2, not Step 1', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.completeStep0();
    await intake.completeStep1();
    // Should be on Step 2 now, no overlay yet
    expect(await intake.getCurrentStepNumber(), 'on Step 2 after Step 1').toBe(2);
    const overlayBeforeStep2 = await page.locator('#depthOverlay').evaluate(
      el => el.classList.contains('is-visible')
    );
    expect(overlayBeforeStep2, 'overlay NOT visible on Step 2').toBe(false);

    // Click Continue on Step 2 — should open depth overlay
    await intake.continueButton().click();
    await expect(page.locator('#depthOverlay')).toHaveClass(/is-open/);
  });
});

test.describe('Step 2 Navigation — Existing Tests (TC-333 through TC-336, TC-342)', () => {
  test('TC-333: full forward navigation 0→8', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.completeStep0();
    await intake.completeStep1();
    // Now on Step 2
    await intake.completeStep2();
    await intake.selectDepthAndConfirm(20);
    // Now on Step 3
    await intake.navigateToStep(8);
    expect(await intake.getCurrentStepNumber(), 'reached Step 8 (review)').toBe(8);
  });

  test('TC-334: full backward navigation 8→0', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.navigateToStep(8);

    const stepsVisited: number[] = [8];
    for (let i = 0; i < 10; i++) {
      const backBtn = intake.backButton();
      if (await backBtn.count() === 0 || !await backBtn.isVisible()) break;
      await backBtn.click({ force: true });
      const current = await intake.getCurrentStepNumber();
      stepsVisited.push(current);
      if (current === 0) break;
    }

    expect.soft(stepsVisited[stepsVisited.length - 1], 'reached Step 0').toBe(0);
    // Verify we visited intermediate steps
    expect.soft(stepsVisited.length, 'visited 9 steps (8→0)').toBeGreaterThanOrEqual(9);
  });

  test('TC-335: Step 0 validation blocks forward navigation', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    // Do not fill required fields, just click Continue
    await intake.continueButton().click();
    expect(await intake.getCurrentStepNumber(), 'still on Step 0').toBe(0);
  });

  test('TC-336: Step 1 validation blocks forward navigation', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    await intake.completeStep0();
    // On Step 1, clear the name field
    await page.locator('#parentsContainer .parent-name').first().fill('');
    await intake.continueButton().click();
    expect(await intake.getCurrentStepNumber(), 'still on Step 1').toBe(1);
  });

  test('TC-342: Step 2→3 navigation does NOT clear hotel/car selections', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    // setupWithDepth lands on Step 3; navigate back to Step 2
    await intake.navigateToStep(2);
    // On Step 2 — toggle hotel to "Yes" and select a hotel type
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);
    await intake.hotelTypeGrid.locator('.q-card').first().click();

    // Navigate to Step 3 — Continue on Step 2 triggers depth overlay
    await intake.continueButton().click();
    // Depth overlay appears; confirm to proceed
    const depthOverlay = page.locator('#depthOverlay');
    await expect(depthOverlay).toHaveClass(/is-open/);
    await page.locator('#depthConfirmBtn').click();
    await expect(depthOverlay).not.toHaveClass(/is-open/);

    // Navigate back to Step 2
    await intake.backButton().click();
    expect(await intake.getCurrentStepNumber(), 'back on Step 2').toBe(2);

    // Verify hotel toggle still "Yes" and sub-questions still expanded
    expect.soft(
      await intake.hotelSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'hotel sub-questions still expanded after returning to Step 2'
    ).toBe(true);

    // Verify hotel type selection preserved
    const selectedCount = await intake.hotelTypeGrid.locator('.q-card.is-selected').count();
    expect.soft(selectedCount, 'hotel type selection preserved').toBeGreaterThanOrEqual(1);
  });
});
