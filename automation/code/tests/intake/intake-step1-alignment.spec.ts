import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Step 1 Form Field Alignment — TC-133
 *
 * Structural invariant test: validates that input/select controls within
 * .row--3 grid rows in Step 1 traveler cards are vertically aligned.
 * The Name input, Gender select, and first DOB dropdown (.dob-year)
 * should have their top edges within 5px tolerance.
 *
 * Language-agnostic: no text content assertions, only bounding box checks.
 *
 * Spec file: intake-step1-alignment.spec.ts
 * BRD: REQ-004
 */

/** Maximum allowed vertical difference (px) between control top positions */
const ALIGNMENT_TOLERANCE_PX = 5;

test.describe('Step 1 Form Field Alignment', () => {

  test('TC-133: row--3 controls are vertically aligned within 5px tolerance', async ({ page }) => {
    // REQ-004 -> AC-1 through AC-6
    const intake = new IntakePage(page);

    // Navigate to intake page and fill Step 0 required fields to advance
    await intake.goto();
    await intake.waitForI18nReady();

    // Fill Step 0 required fields (destination + dates) via DOM to bypass UI interactions
    await page.evaluate(() => {
      (document.querySelector('#destination') as HTMLInputElement).value = 'Test City';
      (document.querySelector('#arrival') as HTMLInputElement).value = '2026-08-01';
      (document.querySelector('#departure') as HTMLInputElement).value = '2026-08-05';
    });
    await intake.continueButton().click();

    // Verify we are on Step 1
    const currentStep = await intake.getCurrentStepNumber();
    expect(currentStep, 'Should be on Step 1 after completing Step 0').toBe(1);

    // Find all .row--3 elements within traveler cards (AC-1)
    // Covers both #parentsContainer and #childrenContainer (AC-2)
    const alignmentResults = await page.evaluate((tolerance) => {
      const rows = document.querySelectorAll(
        '#parentsContainer .row--3, #childrenContainer .row--3'
      );

      const results: Array<{
        rowIndex: number;
        container: string;
        nameTop: number | null;
        genderTop: number | null;
        dobYearTop: number | null;
        maxDiff: number;
        aligned: boolean;
      }> = [];

      rows.forEach((row, index) => {
        // Determine which container this row is in
        const container = row.closest('#parentsContainer')
          ? 'parentsContainer'
          : 'childrenContainer';

        // Get the Name input (.input within the first .field)
        const nameInput = row.querySelector('.input');
        // Get the Gender select (.select that is NOT inside .dob-row)
        const genderSelect = row.querySelector('.field > .select');
        // Get the DOB year select (first actual control in the DOB column) (AC-2)
        const dobYearSelect = row.querySelector('.dob-year');

        const nameRect = nameInput?.getBoundingClientRect();
        const genderRect = genderSelect?.getBoundingClientRect();
        const dobYearRect = dobYearSelect?.getBoundingClientRect();

        const tops: number[] = [];
        const nameTop = nameRect?.top ?? null;
        const genderTop = genderRect?.top ?? null;
        const dobYearTop = dobYearRect?.top ?? null;

        if (nameTop !== null) tops.push(nameTop);
        if (genderTop !== null) tops.push(genderTop);
        if (dobYearTop !== null) tops.push(dobYearTop);

        let maxDiff = 0;
        if (tops.length >= 2) {
          const minTop = Math.min(...tops);
          const maxTop = Math.max(...tops);
          maxDiff = maxTop - minTop;
        }

        results.push({
          rowIndex: index,
          container,
          nameTop,
          genderTop,
          dobYearTop,
          maxDiff: Math.round(maxDiff * 100) / 100,
          aligned: maxDiff <= tolerance,
        });
      });

      return results;
    }, ALIGNMENT_TOLERANCE_PX);

    // Ensure we found at least one row to validate (sanity check)
    expect(
      alignmentResults.length,
      'Should find at least one .row--3 in Step 1 traveler cards'
    ).toBeGreaterThan(0);

    // Use expect.soft() with descriptive messages per row (AC-6)
    for (const result of alignmentResults) {
      expect.soft(
        result.aligned,
        `Row ${result.rowIndex} (${result.container}): controls misaligned by ${result.maxDiff}px ` +
        `(tolerance: ${ALIGNMENT_TOLERANCE_PX}px) — ` +
        `Name top: ${result.nameTop}px, Gender top: ${result.genderTop}px, DOB-year top: ${result.dobYearTop}px`
      ).toBe(true);
    }

    // Hard assert: all rows must be aligned (AC-3)
    const misalignedRows = alignmentResults.filter(r => !r.aligned);
    expect(
      misalignedRows.length,
      `${misalignedRows.length} row(s) have controls misaligned by more than ${ALIGNMENT_TOLERANCE_PX}px`
    ).toBe(0);
  });
});
