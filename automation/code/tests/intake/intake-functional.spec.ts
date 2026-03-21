import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Functional Correctness Tests (QA Test Plan Category 4)
 *
 * Tests context bar visibility, slide animations, preview rendering,
 * markdown output correctness, and datetime handling.
 */

test.describe('Functional Correctness', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.goto();
  });

  test('TC-056: context bar hidden on Step 0', async () => {
    const step = await intake.getCurrentStepNumber();
    expect.soft(step, 'Should start on Step 0').toBe(0);
    await expect(intake.contextBar).not.toBeVisible();
  });

  test('TC-057: context bar visible on Steps 1-6', async () => {
    await intake.completePrerequisiteSteps();
    await intake.selectDepthAndConfirm(20);

    // Step 2
    await expect.soft(intake.contextBar, 'Context bar visible on Step 2').toBeVisible();

    // Navigate through steps 3-6
    for (const step of [3, 4, 5, 6]) {
      await intake.navigateToStep(step);
      const current = await intake.getCurrentStepNumber();
      if (current === step) {
        const visible = await intake.contextBar.isVisible();
        expect.soft(visible, `Context bar visible on Step ${step}`).toBe(true);
      }
    }
  });

  test('TC-058: context bar hidden on Step 7 (Review)', async () => {
    await intake.completePrerequisiteSteps();
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(7);
    const current = await intake.getCurrentStepNumber();
    if (current === 7) {
      await expect(intake.contextBar, 'Context bar hidden on Step 7').not.toBeVisible();
    }
  });

  test('TC-059: step slide animation uses correct direction classes', async () => {
    await intake.completePrerequisiteSteps();
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
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(7);

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
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(5);

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
    await intake.navigateToStep(5);

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
    await intake.selectDepthAndConfirm(20);
    await intake.navigateToStep(7);

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
