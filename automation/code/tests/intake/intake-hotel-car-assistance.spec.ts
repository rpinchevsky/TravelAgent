import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Hotel & Car Rental Assistance — Progression Tests
 *
 * Validates the hotel assistance and car rental assistance optional sections
 * on Step 2 of the intake wizard: toggle visibility at all depths, default
 * state, expand/collapse behavior, sub-question rendering (card grids,
 * q-cards, chips, range sliders), selection behavior, markdown output,
 * section ordering, CSS transitions, and section independence.
 *
 * Test cases: TC-201 through TC-222, TC-227 through TC-229, TC-301 through TC-325, TC-342, TC-345-349
 * Spec file: intake-hotel-car-assistance.spec.ts
 *
 * QF-2 applied: TC-201+TC-211 merged (hotel+car visibility in one page load),
 *               TC-202+TC-212 merged (hotel+car default state in one page load).
 * QF-3 applied: Markdown section ordering assertion added in TC-218/TC-220 combined test.
 *
 * Markdown assertions use English field labels — intentional exception.
 * generateMarkdown() uses hard-coded English labels for all field keys,
 * matching the existing wheelchair spec pattern (QF-1 confirmed).
 */

// --- Hotel sub-question keys (7 questions) ---
const HOTEL_SUB_QUESTION_KEYS = [
  'hotelType', 'hotelLocation', 'hotelStars',
  'hotelAmenities', 'hotelPets', 'hotelCancellation', 'hotelBudget',
] as const;

// --- Car sub-question keys (6 questions) ---
const CAR_SUB_QUESTION_KEYS = [
  'carCategory', 'carTransmission', 'carFuel',
  'carPickup', 'carExtras', 'carBudget',
] as const;

// --- Hotel option counts for TC-205 ---
const HOTEL_OPTION_COUNTS = [
  { key: 'hotelType', selector: '.option-grid .q-card', expected: 12 },
  { key: 'hotelLocation', selector: '.question-options .q-card', expected: 5 },
  { key: 'hotelStars', selector: '.question-options .q-card', expected: 4 },
  { key: 'hotelAmenities', selector: '#hotelAmenitiesChips .chip-toggle', expected: 12, isChips: true },
  { key: 'hotelPets', selector: '.question-options .q-card', expected: 2 },
  { key: 'hotelCancellation', selector: '.question-options .q-card', expected: 3 },
] as const;

// --- Car option counts for TC-215 ---
const CAR_OPTION_COUNTS = [
  { key: 'carCategory', selector: '.option-grid .q-card', expected: 14 },
  { key: 'carTransmission', selector: '.question-options .q-card', expected: 3 },
  { key: 'carFuel', selector: '.question-options .q-card', expected: 5 },
  { key: 'carPickup', selector: '.question-options .q-card', expected: 4 },
  { key: 'carExtras', selector: '#carExtrasChips .chip-toggle', expected: 7, isChips: true },
] as const;

// ============================================================================
// TC-301: New Step 2 Panel Exists in DOM
// TC-302: Step 2 Stepper Icon
// TC-303 + TC-304: Step 2 Title and Description i18n Attributes
// ============================================================================
test.describe('Step 2 Panel — Structural Tests (TC-301, TC-302, TC-303, TC-304)', () => {
  test('TC-301: Step 2 panel exists in DOM', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    const step2 = intake.stepSection(2);
    await expect(step2).toBeAttached();
    expect(await step2.getAttribute('data-step')).toBe('2');
  });

  test('TC-302: Step 2 stepper icon is hotel emoji', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();
    const stepperCircle = page.locator('.stepper__step[data-step="2"] .stepper__circle span');
    const emojiText = await stepperCircle.textContent();
    expect.soft(emojiText?.trim(), 'Step 2 stepper emoji is hotel building').toContain('🏨');
  });

  test('TC-303+304: Step 2 title and description have correct data-i18n', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    const step2 = intake.stepSection(2);
    const title = step2.locator('.step__title');
    const desc = step2.locator('.step__desc');
    expect(await title.getAttribute('data-i18n'), 'Step 2 title data-i18n').toBe('s2_title');
    expect.soft(await desc.getAttribute('data-i18n'), 'Step 2 desc data-i18n').toBe('s2_desc');
  });
});

// ============================================================================
// TC-306: Step 2 Always Visible in Stepper (Not Depth-Gated)
// ============================================================================
test.describe('Step 2 Always Visible (TC-306)', () => {
  for (const depth of [10, 20, 30] as const) {
    test(`TC-306: Step 2 stepper circle visible at depth ${depth}`, async ({ page }) => {
      const intake = new IntakePage(page);
      await intake.setupWithDepth(depth);
      const step2Stepper = page.locator('.stepper__step[data-step="2"]');
      const isHidden = await page.evaluate(() => {
        const s = document.querySelector('.stepper__step[data-step="2"]');
        if (!s) return true;
        const style = window.getComputedStyle(s as HTMLElement);
        return style.display === 'none' || (s as HTMLElement).hidden;
      });
      expect.soft(isHidden, `depth ${depth}: Step 2 stepper is NOT hidden`).toBe(false);
    });
  }
});

// ============================================================================
// TC-307 + TC-312: Hotel and Car Sections Are Children of Step 2
// ============================================================================
test.describe('Hotel & Car in Step 2 (TC-307, TC-312)', () => {
  test('TC-307+312: hotel and car sections are children of Step 2, not Step 7', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    const result = await page.evaluate(() => {
      const hotel = document.getElementById('hotelAssistanceSection');
      const car = document.getElementById('carAssistanceSection');
      if (!hotel || !car) return null;
      const hotelParentStep = hotel.closest('section.step')?.getAttribute('data-step');
      const carParentStep = car.closest('section.step')?.getAttribute('data-step');
      // Also check they are NOT in Step 7
      const step7 = document.querySelector('section.step[data-step="7"]');
      const hotelInStep7 = step7 ? step7.contains(hotel) : false;
      const carInStep7 = step7 ? step7.contains(car) : false;
      return { hotelParentStep, carParentStep, hotelInStep7, carInStep7 };
    });

    expect(result, 'hotel and car sections found').not.toBeNull();
    expect(result?.hotelParentStep, 'hotel is in Step 2').toBe('2');
    expect(result?.carParentStep, 'car is in Step 2').toBe('2');
    expect(result?.hotelInStep7, 'hotel NOT in Step 7').toBe(false);
    expect(result?.carInStep7, 'car NOT in Step 7').toBe(false);
  });
});

// ============================================================================
// TC-324: Step 7 Does Not Contain Hotel or Car Sections
// TC-325: Step 7 Retains Language, Notes, Photo, Accessibility, Wheelchair
// ============================================================================
test.describe('Step 7 Content Validation (TC-324, TC-325)', () => {
  test('TC-324: Step 7 has no hotel or car sections', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.goto();

    const result = await page.evaluate(() => {
      const step7 = document.querySelector('section.step[data-step="7"]');
      if (!step7) return null;
      return {
        hasHotel: step7.querySelector('#hotelAssistanceSection') !== null,
        hasCar: step7.querySelector('#carAssistanceSection') !== null,
      };
    });

    expect(result, 'Step 7 found in DOM').not.toBeNull();
    expect(result?.hasHotel, 'Step 7 has no hotelAssistanceSection').toBe(false);
    expect(result?.hasCar, 'Step 7 has no carAssistanceSection').toBe(false);
  });

  test('TC-325: Step 7 retains reportLang, notes, and wheelchair', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.navigateToStep(7);

    const result = await page.evaluate(() => {
      const step7 = document.querySelector('section.step[data-step="7"]');
      if (!step7) return null;
      return {
        hasReportLang: step7.querySelector('#reportLang') !== null,
        hasNotes: step7.querySelector('[data-question-key="extraNotes"]') !== null,
        hasWheelchair: step7.querySelector('[data-question-key="wheelchairAccessible"]') !== null,
      };
    });

    expect(result, 'Step 7 found').not.toBeNull();
    expect.soft(result?.hasReportLang, 'Step 7: reportLang present').toBe(true);
    expect.soft(result?.hasNotes, 'Step 7: extraNotes present').toBe(true);
    expect.soft(result?.hasWheelchair, 'Step 7: wheelchair present').toBe(true);
  });
});

// ============================================================================
// TC-201 + TC-211 (merged per QF-2): Section visibility at all depth levels
// ============================================================================
test.describe('Hotel & Car Sections — Visibility (TC-201 + TC-211)', () => {
  for (const depth of [10, 20, 30] as const) {
    test(`TC-201+211: hotel and car sections visible on Step 2 at depth ${depth}`, async ({ page }) => {
      const intake = new IntakePage(page);
      await intake.setupWithDepth(depth);
      await intake.waitForI18nReady();
      await intake.navigateToStep(2);

      // Hotel section visible with header
      await expect(intake.hotelAssistanceSection).toBeVisible();
      expect.soft(
        await intake.hotelAssistanceSection.locator('[data-i18n="s6_hotel_header"]').count(),
        `depth ${depth}: hotel header has data-i18n`
      ).toBe(1);

      // Car section visible with header
      await expect(intake.carAssistanceSection).toBeVisible();
      expect.soft(
        await intake.carAssistanceSection.locator('[data-i18n="s6_car_header"]').count(),
        `depth ${depth}: car header has data-i18n`
      ).toBe(1);
    });
  }
});

// ============================================================================
// TC-202 + TC-212 (merged per QF-2): Default toggle state
// ============================================================================
test.describe('Hotel & Car Sections — Default State (TC-202 + TC-212)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);
  });

  test('TC-202+212: both toggles default to "No" with sub-questions hidden', async () => {
    // Hotel toggle
    const hotelToggle = intake.hotelToggle;
    expect.soft(
      await hotelToggle.locator('.q-card').count(),
      'hotel toggle: 2 q-cards'
    ).toBe(2);
    await expect(hotelToggle.locator('.q-card[data-value="no"]')).toHaveClass(/is-selected/);
    expect.soft(
      await hotelToggle.locator('.q-card[data-value="yes"]').evaluate(
        el => el.classList.contains('is-selected')
      ),
      'hotel toggle: yes is NOT selected'
    ).toBe(false);
    expect.soft(
      await intake.hotelSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'hotel sub-questions: NOT expanded'
    ).toBe(false);

    // Car toggle
    const carToggle = intake.carToggle;
    expect.soft(
      await carToggle.locator('.q-card').count(),
      'car toggle: 2 q-cards'
    ).toBe(2);
    await expect(carToggle.locator('.q-card[data-value="no"]')).toHaveClass(/is-selected/);
    expect.soft(
      await carToggle.locator('.q-card[data-value="yes"]').evaluate(
        el => el.classList.contains('is-selected')
      ),
      'car toggle: yes is NOT selected'
    ).toBe(false);
    expect.soft(
      await intake.carSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'car sub-questions: NOT expanded'
    ).toBe(false);
  });
});

// ============================================================================
// TC-203: Hotel toggle "Yes" reveals 7 sub-questions
// ============================================================================
test.describe('Hotel Section — Expand/Collapse (TC-203, TC-204)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);
  });

  test('TC-203: hotel toggle "Yes" reveals 7 sub-questions', async () => {
    // Click "Yes" to expand
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);

    // Assert all 7 sub-question containers exist
    for (const key of HOTEL_SUB_QUESTION_KEYS) {
      expect.soft(
        await intake.hotelSubQuestions.locator(`[data-question-key="${key}"]`).count(),
        `hotel sub-question "${key}" present`
      ).toBe(1);
    }
  });

  test('TC-204: hotel toggle "No" collapses and resets all selections', async ({ page }) => {
    // Expand hotel section
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);

    // Select a hotel type card
    await intake.hotelTypeGrid.locator('.q-card').first().click();
    // Select an amenity chip
    await intake.hotelAmenitiesChips.locator('.chip-toggle').first().click();

    // Collapse by clicking "No"
    await intake.hotelToggle.locator('.q-card[data-value="no"]').click();

    // Assert collapsed
    expect.soft(
      await intake.hotelSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'hotel sub-questions: collapsed after "No"'
    ).toBe(false);

    // Re-expand to verify reset state
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);

    // Verify no selected q-cards in sub-questions (except hotelPets "no" default)
    const selectedCards = await page.evaluate(() => {
      const container = document.getElementById('hotelSubQuestions');
      if (!container) return { qCards: 0, chips: 0, petsDefault: false };
      const qCards = container.querySelectorAll('.q-card.is-selected');
      const chips = container.querySelectorAll('.chip-toggle.is-selected');
      // hotelPets "no" is the default — should be the only selected card
      const petsNo = container.querySelector('[data-question-key="hotelPets"] .q-card[data-value="no"]');
      const petsDefault = petsNo?.classList.contains('is-selected') ?? false;
      // Count selected q-cards excluding hotelPets "no"
      let nonPetsSelected = 0;
      qCards.forEach(card => {
        const parent = card.closest('[data-question-key]');
        if (parent?.getAttribute('data-question-key') !== 'hotelPets' || card.getAttribute('data-value') !== 'no') {
          nonPetsSelected++;
        }
      });
      return { qCards: nonPetsSelected, chips: chips.length, petsDefault };
    });

    expect.soft(selectedCards.qCards, 'no selected q-cards after reset (except pets default)').toBe(0);
    expect.soft(selectedCards.chips, 'no selected chips after reset').toBe(0);
    expect.soft(selectedCards.petsDefault, 'hotelPets defaults back to "no"').toBe(true);

    // Verify slider reset to full range
    const sliderState = await page.evaluate(() => {
      const slider = document.getElementById('hotelBudgetSlider');
      if (!slider) return null;
      return {
        minVal: slider.getAttribute('data-min-val'),
        maxVal: slider.getAttribute('data-max-val'),
        min: slider.getAttribute('data-min'),
        max: slider.getAttribute('data-max'),
      };
    });
    expect.soft(sliderState?.minVal, 'hotel slider min-val reset').toBe(sliderState?.min);
    expect.soft(sliderState?.maxVal, 'hotel slider max-val reset').toBe(sliderState?.max);
  });
});

// ============================================================================
// TC-205: Hotel sub-question option counts + TC-208: hotelPets default
// ============================================================================
test.describe('Hotel Sub-Questions — Option Counts (TC-205, TC-208)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);
    // Expand hotel section
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);
  });

  test('TC-205: hotel sub-question option counts and slider config', async ({ page }) => {
    const results = await page.evaluate((configs) => {
      const container = document.getElementById('hotelSubQuestions');
      if (!container) return null;
      return configs.map(cfg => {
        const question = container.querySelector(`[data-question-key="${cfg.key}"]`);
        if (!question && !cfg.isChips) return { key: cfg.key, found: false, count: 0 };
        // For chips, use the chip container directly
        const elements = cfg.isChips
          ? document.querySelectorAll(cfg.selector)
          : question!.querySelectorAll(cfg.selector);
        return { key: cfg.key, found: true, count: elements.length };
      });
    }, HOTEL_OPTION_COUNTS.map(c => ({ key: c.key, selector: c.selector, isChips: 'isChips' in c })));

    expect(results, 'hotel sub-questions container found').not.toBeNull();
    if (!results) return;

    for (let i = 0; i < HOTEL_OPTION_COUNTS.length; i++) {
      const cfg = HOTEL_OPTION_COUNTS[i];
      const r = results[i];
      expect.soft(r.found, `${cfg.key}: question found`).toBe(true);
      expect.soft(r.count, `${cfg.key}: ${cfg.expected} options`).toBe(cfg.expected);
    }

    // Hotel budget slider config
    const sliderAttrs = await page.evaluate(() => {
      const slider = document.getElementById('hotelBudgetSlider');
      if (!slider) return null;
      return {
        min: slider.getAttribute('data-min'),
        max: slider.getAttribute('data-max'),
        step: slider.getAttribute('data-step'),
        prefix: slider.getAttribute('data-prefix'),
      };
    });
    expect.soft(sliderAttrs, 'hotel budget slider found').not.toBeNull();
    expect.soft(sliderAttrs?.min, 'hotel slider data-min').toBe('30');
    expect.soft(sliderAttrs?.max, 'hotel slider data-max').toBe('1000');
    expect.soft(sliderAttrs?.step, 'hotel slider data-step').toBe('10');
    expect.soft(sliderAttrs?.prefix, 'hotel slider data-prefix').toBe('$');

    // TC-208: hotelPets defaults to "No" (traceability alias within TC-205)
    const petsDefault = await page.evaluate(() => {
      const petsQ = document.querySelector('[data-question-key="hotelPets"]');
      if (!petsQ) return null;
      const noCard = petsQ.querySelector('.q-card[data-value="no"]');
      const yesCard = petsQ.querySelector('.q-card[data-value="yes"]');
      return {
        noSelected: noCard?.classList.contains('is-selected') ?? false,
        yesSelected: yesCard?.classList.contains('is-selected') ?? false,
      };
    });
    expect.soft(petsDefault?.noSelected, 'TC-208: hotelPets "no" is default selected').toBe(true);
    expect.soft(petsDefault?.yesSelected, 'TC-208: hotelPets "yes" is NOT selected').toBe(false);
  });
});

// ============================================================================
// TC-206: Hotel card grid single-select (radio) behavior
// ============================================================================
test.describe('Hotel Section — Selection Behavior (TC-206, TC-207)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);
  });

  test('TC-206: hotel type card grid single-select (radio) behavior', async () => {
    const firstCard = intake.hotelTypeGrid.locator('.q-card').nth(0);
    const secondCard = intake.hotelTypeGrid.locator('.q-card').nth(1);

    await firstCard.click();
    await expect(firstCard).toHaveClass(/is-selected/);

    await secondCard.click();
    await expect(secondCard).toHaveClass(/is-selected/);
    expect.soft(
      await firstCard.evaluate(el => el.classList.contains('is-selected')),
      'first card deselected after selecting second'
    ).toBe(false);
  });

  test('TC-207: hotel amenities multi-select chip behavior', async () => {
    const chip0 = intake.hotelAmenitiesChips.locator('.chip-toggle').nth(0);
    const chip1 = intake.hotelAmenitiesChips.locator('.chip-toggle').nth(1);

    // Select chip 0
    await chip0.click();
    await expect(chip0).toHaveClass(/is-selected/);

    // Select chip 1 — chip 0 stays selected
    await chip1.click();
    await expect(chip1).toHaveClass(/is-selected/);
    expect.soft(
      await chip0.evaluate(el => el.classList.contains('is-selected')),
      'chip 0 still selected after selecting chip 1'
    ).toBe(true);

    // Deselect chip 0
    await chip0.click();
    expect.soft(
      await chip0.evaluate(el => el.classList.contains('is-selected')),
      'chip 0 deselected after toggle'
    ).toBe(false);
    expect.soft(
      await chip1.evaluate(el => el.classList.contains('is-selected')),
      'chip 1 still selected'
    ).toBe(true);
  });
});

// ============================================================================
// TC-209: Hotel budget range slider keyboard interaction
// TC-210: Range slider handles cannot cross
// ============================================================================
test.describe('Hotel Budget Slider — Keyboard (TC-209, TC-210)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);
  });

  test('TC-209: keyboard arrows adjust slider handle values', async ({ page }) => {
    const minHandle = intake.sliderHandle('hotelBudgetSlider', 'min');
    const maxHandle = intake.sliderHandle('hotelBudgetSlider', 'max');

    // Focus min handle and press ArrowRight 3 times (step=10, +30)
    await minHandle.focus();
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('ArrowRight');
    }
    const minVal = await page.evaluate(() =>
      document.getElementById('hotelBudgetSlider')?.getAttribute('data-min-val')
    );
    expect(minVal, 'min handle moved right by 30 (30 + 30 = 60)').toBe('60');

    // Focus max handle and press ArrowLeft 2 times (step=10, -20)
    await maxHandle.focus();
    for (let i = 0; i < 2; i++) {
      await page.keyboard.press('ArrowLeft');
    }
    const maxVal = await page.evaluate(() =>
      document.getElementById('hotelBudgetSlider')?.getAttribute('data-max-val')
    );
    expect(maxVal, 'max handle moved left by 20 (1000 - 20 = 980)').toBe('980');
  });

  test('TC-210: range slider handles cannot cross each other', async ({ page }) => {
    // Set min handle near max via evaluate
    await page.evaluate(() => {
      const slider = document.getElementById('hotelBudgetSlider');
      if (slider) {
        slider.setAttribute('data-min-val', '990');
        // Dispatch event to sync UI if needed
        slider.dispatchEvent(new Event('input'));
      }
    });

    const minHandle = intake.sliderHandle('hotelBudgetSlider', 'min');
    await minHandle.focus();

    // Press ArrowRight 5 times — should not exceed max-step
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight');
    }

    const result = await page.evaluate(() => {
      const slider = document.getElementById('hotelBudgetSlider');
      if (!slider) return null;
      return {
        minVal: parseInt(slider.getAttribute('data-min-val') ?? '0', 10),
        maxVal: parseInt(slider.getAttribute('data-max-val') ?? '0', 10),
        step: parseInt(slider.getAttribute('data-step') ?? '0', 10),
      };
    });

    expect(result, 'slider element found').not.toBeNull();
    if (result) {
      expect(
        result.minVal,
        'min handle does not exceed max - step'
      ).toBeLessThanOrEqual(result.maxVal - result.step);
    }
  });
});

// ============================================================================
// TC-213: Car toggle "Yes" reveals 6 sub-questions
// TC-214: Car toggle "No" collapses and resets
// ============================================================================
test.describe('Car Section — Expand/Collapse (TC-213, TC-214)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);
  });

  test('TC-213: car toggle "Yes" reveals 6 sub-questions', async () => {
    await intake.carToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.carSubQuestions).toHaveClass(/is-expanded/);

    for (const key of CAR_SUB_QUESTION_KEYS) {
      expect.soft(
        await intake.carSubQuestions.locator(`[data-question-key="${key}"]`).count(),
        `car sub-question "${key}" present`
      ).toBe(1);
    }
  });

  test('TC-214: car toggle "No" collapses and resets all selections', async ({ page }) => {
    // Expand car section
    await intake.carToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.carSubQuestions).toHaveClass(/is-expanded/);

    // Select a car category card and an extras chip
    await intake.carCategoryGrid.locator('.q-card').first().click();
    await intake.carExtrasChips.locator('.chip-toggle').first().click();

    // Collapse
    await intake.carToggle.locator('.q-card[data-value="no"]').click();
    expect.soft(
      await intake.carSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'car sub-questions: collapsed after "No"'
    ).toBe(false);

    // Re-expand to verify reset
    await intake.carToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.carSubQuestions).toHaveClass(/is-expanded/);

    const resetState = await page.evaluate(() => {
      const container = document.getElementById('carSubQuestions');
      if (!container) return null;
      const selectedCards = container.querySelectorAll('.q-card.is-selected').length;
      const selectedChips = container.querySelectorAll('.chip-toggle.is-selected').length;
      const slider = document.getElementById('carBudgetSlider');
      return {
        selectedCards,
        selectedChips,
        sliderMinVal: slider?.getAttribute('data-min-val'),
        sliderMin: slider?.getAttribute('data-min'),
        sliderMaxVal: slider?.getAttribute('data-max-val'),
        sliderMax: slider?.getAttribute('data-max'),
      };
    });

    expect.soft(resetState?.selectedCards, 'no selected q-cards after reset').toBe(0);
    expect.soft(resetState?.selectedChips, 'no selected chips after reset').toBe(0);
    expect.soft(resetState?.sliderMinVal, 'car slider min-val reset').toBe(resetState?.sliderMin);
    expect.soft(resetState?.sliderMaxVal, 'car slider max-val reset').toBe(resetState?.sliderMax);
  });
});

// ============================================================================
// TC-215: Car sub-question option counts
// ============================================================================
test.describe('Car Sub-Questions — Option Counts (TC-215)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);
    await intake.carToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.carSubQuestions).toHaveClass(/is-expanded/);
  });

  test('TC-215: car sub-question option counts and slider config', async ({ page }) => {
    const results = await page.evaluate((configs) => {
      const container = document.getElementById('carSubQuestions');
      if (!container) return null;
      return configs.map(cfg => {
        const question = container.querySelector(`[data-question-key="${cfg.key}"]`);
        if (!question && !cfg.isChips) return { key: cfg.key, found: false, count: 0 };
        const elements = cfg.isChips
          ? document.querySelectorAll(cfg.selector)
          : question!.querySelectorAll(cfg.selector);
        return { key: cfg.key, found: true, count: elements.length };
      });
    }, CAR_OPTION_COUNTS.map(c => ({ key: c.key, selector: c.selector, isChips: 'isChips' in c })));

    expect(results, 'car sub-questions container found').not.toBeNull();
    if (!results) return;

    for (let i = 0; i < CAR_OPTION_COUNTS.length; i++) {
      const cfg = CAR_OPTION_COUNTS[i];
      const r = results[i];
      expect.soft(r.found, `${cfg.key}: question found`).toBe(true);
      expect.soft(r.count, `${cfg.key}: ${cfg.expected} options`).toBe(cfg.expected);
    }

    // Car budget slider config
    const sliderAttrs = await page.evaluate(() => {
      const slider = document.getElementById('carBudgetSlider');
      if (!slider) return null;
      return {
        min: slider.getAttribute('data-min'),
        max: slider.getAttribute('data-max'),
        step: slider.getAttribute('data-step'),
        prefix: slider.getAttribute('data-prefix'),
      };
    });
    expect.soft(sliderAttrs, 'car budget slider found').not.toBeNull();
    expect.soft(sliderAttrs?.min, 'car slider data-min').toBe('0');
    expect.soft(sliderAttrs?.max, 'car slider data-max').toBe('1000');
    expect.soft(sliderAttrs?.step, 'car slider data-step').toBe('10');
    expect.soft(sliderAttrs?.prefix, 'car slider data-prefix').toBe('$');
  });
});

// ============================================================================
// TC-216: Car card grid single-select behavior
// TC-217: Car extras multi-select chip behavior
// ============================================================================
test.describe('Car Section — Selection Behavior (TC-216, TC-217)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);
    await intake.carToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.carSubQuestions).toHaveClass(/is-expanded/);
  });

  test('TC-216: car category card grid single-select (radio) behavior', async () => {
    const firstCard = intake.carCategoryGrid.locator('.q-card').nth(0);
    const secondCard = intake.carCategoryGrid.locator('.q-card').nth(1);

    await firstCard.click();
    await expect(firstCard).toHaveClass(/is-selected/);

    await secondCard.click();
    await expect(secondCard).toHaveClass(/is-selected/);
    expect.soft(
      await firstCard.evaluate(el => el.classList.contains('is-selected')),
      'first card deselected after selecting second'
    ).toBe(false);
  });

  test('TC-217: car extras multi-select chip behavior', async () => {
    const chip0 = intake.carExtrasChips.locator('.chip-toggle').nth(0);
    const chip1 = intake.carExtrasChips.locator('.chip-toggle').nth(1);

    await chip0.click();
    await expect(chip0).toHaveClass(/is-selected/);

    await chip1.click();
    await expect(chip1).toHaveClass(/is-selected/);
    expect.soft(
      await chip0.evaluate(el => el.classList.contains('is-selected')),
      'chip 0 still selected after selecting chip 1'
    ).toBe(true);

    await chip0.click();
    expect.soft(
      await chip0.evaluate(el => el.classList.contains('is-selected')),
      'chip 0 deselected after toggle'
    ).toBe(false);
    expect.soft(
      await chip1.evaluate(el => el.classList.contains('is-selected')),
      'chip 1 still selected'
    ).toBe(true);
  });
});

// ============================================================================
// TC-218: Hotel markdown when "Yes" + TC-220: Car markdown when "Yes"
// + QF-3: Section ordering assertion (Hotel before Car in markdown)
// ============================================================================
test.describe('Markdown Output — Sections Present (TC-218, TC-220, QF-3)', () => {
  test('TC-218+220: hotel and car sections in markdown with correct fields; hotel before car (QF-3)', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);

    // Expand hotel section and make selections
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);
    // Select first hotel type
    await intake.hotelTypeGrid.locator('.q-card').first().click();
    // Select first hotel location
    await intake.page.locator('[data-question-key="hotelLocation"] .question-options .q-card').first().click();
    // Select two amenity chips
    await intake.hotelAmenitiesChips.locator('.chip-toggle').nth(0).click();
    await intake.hotelAmenitiesChips.locator('.chip-toggle').nth(1).click();

    // Expand car section and make selections
    await intake.carToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.carSubQuestions).toHaveClass(/is-expanded/);
    // Select first car category
    await intake.carCategoryGrid.locator('.q-card').first().click();
    // Select first transmission
    await intake.page.locator('[data-question-key="carTransmission"] .question-options .q-card').first().click();
    // Select one extras chip
    await intake.carExtrasChips.locator('.chip-toggle').first().click();

    // Navigate to Step 7
    await intake.navigateToStep(8);
    const rawMd = await intake.getRawMarkdown();

    // TC-218: Hotel section assertions
    expect(rawMd, 'markdown contains Hotel Assistance header').toContain('## Hotel Assistance');
    expect.soft(rawMd, 'hotel: Accommodation type field').toMatch(/- \*\*Accommodation type:\*\*\s+\S/);
    expect.soft(rawMd, 'hotel: Location priority field').toMatch(/- \*\*Location priority:\*\*/);
    expect.soft(rawMd, 'hotel: Must-have amenities field').toMatch(/- \*\*Must-have amenities:\*\*/);
    expect.soft(rawMd, 'hotel: Traveling with pets field').toMatch(/- \*\*Traveling with pets:\*\* No/);
    expect.soft(rawMd, 'hotel: Daily budget per room field').toMatch(/- \*\*Daily budget per room:\*\* \$30 - \$1000/);

    // TC-220: Car section assertions
    expect(rawMd, 'markdown contains Car Rental Assistance header').toContain('## Car Rental Assistance');
    expect.soft(rawMd, 'car: Car category field').toMatch(/- \*\*Car category:\*\*\s+\S/);
    expect.soft(rawMd, 'car: Transmission field').toMatch(/- \*\*Transmission:\*\*\s+\S/);
    expect.soft(rawMd, 'car: Additional equipment field').toMatch(/- \*\*Additional equipment:\*\*/);
    expect.soft(rawMd, 'car: Daily rental budget field').toMatch(/- \*\*Daily rental budget:\*\* \$0 - \$1000/);

    // QF-3: Section ordering — Hotel before Car in markdown
    const hotelIdx = rawMd.indexOf('## Hotel Assistance');
    const carIdx = rawMd.indexOf('## Car Rental Assistance');
    expect.soft(
      hotelIdx < carIdx,
      'QF-3: Hotel Assistance section appears before Car Rental Assistance in markdown'
    ).toBe(true);
  });
});

// ============================================================================
// TC-219: Hotel markdown omitted when "No"
// TC-221: Car markdown omitted when "No"
// ============================================================================
test.describe('Markdown Output — Sections Omitted (TC-219, TC-221)', () => {
  test('TC-219+221: hotel and car sections omitted from markdown when toggles are "No"', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);
    await intake.waitForI18nReady();
    // Navigate directly to Step 7 without toggling
    await intake.navigateToStep(8);
    const rawMd = await intake.getRawMarkdown();

    expect(rawMd, 'TC-219: markdown does NOT contain Hotel Assistance').not.toContain('## Hotel Assistance');
    expect(rawMd, 'TC-221: markdown does NOT contain Car Rental Assistance').not.toContain('## Car Rental Assistance');
  });
});

// ============================================================================
// TC-222: "Not specified" for unselected single-selects
// ============================================================================
test.describe('Markdown Output — Default Values (TC-222)', () => {
  test('TC-222: unselected fields show "Not specified" and empty multi-selects show "None"', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);

    // Toggle both to "Yes" but do NOT fill any sub-questions
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);
    await intake.carToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.carSubQuestions).toHaveClass(/is-expanded/);

    // Navigate to Step 7
    await intake.navigateToStep(8);
    const rawMd = await intake.getRawMarkdown();

    // Hotel "Not specified" fields
    expect.soft(rawMd, 'hotel: accommodation type default').toMatch(/- \*\*Accommodation type:\*\* Not specified/);
    expect.soft(rawMd, 'hotel: location priority default').toMatch(/- \*\*Location priority:\*\* Not specified/);
    expect.soft(rawMd, 'hotel: quality level default').toMatch(/- \*\*Quality level:\*\* Not specified/);
    expect.soft(rawMd, 'hotel: cancellation default').toMatch(/- \*\*Cancellation preference:\*\* Not specified/);
    // Hotel "None" for empty multi-select
    expect.soft(rawMd, 'hotel: amenities default "None"').toMatch(/- \*\*Must-have amenities:\*\* None/);

    // Car "Not specified" fields
    expect.soft(rawMd, 'car: category default').toMatch(/- \*\*Car category:\*\* Not specified/);
    expect.soft(rawMd, 'car: transmission default').toMatch(/- \*\*Transmission:\*\* Not specified/);
    expect.soft(rawMd, 'car: fuel type default').toMatch(/- \*\*Fuel type:\*\* Not specified/);
    expect.soft(rawMd, 'car: pickup default').toMatch(/- \*\*Pickup & return:\*\* Not specified/);
    // Car "None" for empty multi-select
    expect.soft(rawMd, 'car: extras default "None"').toMatch(/- \*\*Additional equipment:\*\* None/);
  });
});

// ============================================================================
// TC-227 / TC-347: Step 2 section ordering — hotel before car (DOM order)
// ============================================================================
test.describe('Step 2 — Section Ordering (TC-227, TC-347)', () => {
  test('TC-227+347: hotel before car in Step 2 DOM order', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);

    const ordering = await page.evaluate(() => {
      const hotel = document.getElementById('hotelAssistanceSection');
      const car = document.getElementById('carAssistanceSection');
      if (!hotel || !car) return null;
      // DOCUMENT_POSITION_FOLLOWING = 4 means the second node follows the first
      const hotelBeforeCar = !!(hotel.compareDocumentPosition(car) & 4);
      // Verify both are children of Step 2
      const hotelStep = hotel.closest('section.step')?.getAttribute('data-step');
      const carStep = car.closest('section.step')?.getAttribute('data-step');
      return { hotelBeforeCar, hotelStep, carStep };
    });

    expect(ordering, 'hotel and car sections found in DOM').not.toBeNull();
    expect.soft(ordering?.hotelBeforeCar, 'hotel before car').toBe(true);
    expect.soft(ordering?.hotelStep, 'hotel is in Step 2').toBe('2');
    expect.soft(ordering?.carStep, 'car is in Step 2').toBe('2');
  });
});

// ============================================================================
// TC-228: Expand animation CSS transition
// ============================================================================
test.describe('Design System — CSS Transition (TC-228)', () => {
  test('TC-228: expand animation uses CSS transition on sub-question bodies', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);

    const transitions = await page.evaluate(() => {
      const hotelBody = document.getElementById('hotelSubQuestions');
      const carBody = document.getElementById('carSubQuestions');
      const results: Record<string, string> = {};
      if (hotelBody) {
        results.hotel = window.getComputedStyle(hotelBody).transition;
      }
      if (carBody) {
        results.car = window.getComputedStyle(carBody).transition;
      }
      return results;
    });

    expect.soft(transitions.hotel, 'hotel body: transition includes max-height').toMatch(/max-height/);
    expect.soft(transitions.hotel, 'hotel body: transition includes opacity').toMatch(/opacity/);
    expect.soft(transitions.car, 'car body: transition includes max-height').toMatch(/max-height/);
    expect.soft(transitions.car, 'car body: transition includes opacity').toMatch(/opacity/);
  });
});

// ============================================================================
// TC-229: Hotel and Car sections independent of each other
// ============================================================================
test.describe('Section Independence (TC-229)', () => {
  test('TC-229: hotel and car toggles operate independently', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);

    // Step 1: Toggle hotel to "Yes" — hotel expanded, car still collapsed
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);
    expect.soft(
      await intake.carSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'car still collapsed after hotel expanded'
    ).toBe(false);

    // Step 2: Toggle car to "Yes" — both expanded
    await intake.carToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.carSubQuestions).toHaveClass(/is-expanded/);
    expect.soft(
      await intake.hotelSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'hotel still expanded after car expanded'
    ).toBe(true);

    // Step 3: Toggle hotel to "No" — hotel collapsed, car still expanded
    await intake.hotelToggle.locator('.q-card[data-value="no"]').click();
    expect.soft(
      await intake.hotelSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'hotel collapsed after toggling "No"'
    ).toBe(false);
    expect.soft(
      await intake.carSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'car still expanded after hotel collapsed'
    ).toBe(true);

    // Step 4: Toggle car to "No" — both collapsed
    await intake.carToggle.locator('.q-card[data-value="no"]').click();
    expect.soft(
      await intake.hotelSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'hotel still collapsed'
    ).toBe(false);
    expect.soft(
      await intake.carSubQuestions.evaluate(el => el.classList.contains('is-expanded')),
      'car collapsed after toggling "No"'
    ).toBe(false);
  });
});
