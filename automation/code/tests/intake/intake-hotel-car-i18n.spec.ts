import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Hotel & Car Rental Assistance — i18n DOM Attribute Validation
 *
 * TC-224: data-i18n attributes on all hotel section DOM elements
 * TC-225: data-i18n attributes on all car section DOM elements
 * TC-226: data-en-name attributes on option cards and chips
 *
 * These tests require a browser to inspect DOM attributes on the live page.
 * The static i18n key file validation (TC-223) is in a separate spec file
 * (intake-hotel-car-i18n-keys.spec.ts) per QF-1.
 */

test.describe('Hotel i18n DOM Attributes (TC-224)', () => {
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

  test('TC-224: all hotel section text elements have data-i18n attributes', async ({ page }) => {
    const results = await page.evaluate(() => {
      const section = document.getElementById('hotelAssistanceSection');
      if (!section) return null;

      const issues: string[] = [];

      // Header
      const header = section.querySelector('.assistance-section__header');
      if (!header?.getAttribute('data-i18n')) issues.push('hotel header missing data-i18n');

      // Toggle label
      const toggleQ = section.querySelector('[data-question-key="hotelAssistToggle"]');
      const toggleLabel = toggleQ?.querySelector('.field__label');
      if (!toggleLabel?.getAttribute('data-i18n')) issues.push('hotel toggle label missing data-i18n');

      // Toggle card titles
      const toggleCards = toggleQ?.querySelectorAll('.q-card__title') ?? [];
      toggleCards.forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) issues.push(`hotel toggle card title[${i}] missing data-i18n`);
      });

      // Sub-question field labels
      const subQ = document.getElementById('hotelSubQuestions');
      if (!subQ) { issues.push('hotelSubQuestions not found'); return { issues }; }

      const labels = subQ.querySelectorAll('.field__label');
      labels.forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) issues.push(`hotel sub-question label[${i}] missing data-i18n`);
      });

      // Q-card titles within sub-questions
      const cardTitles = subQ.querySelectorAll('.q-card__title');
      cardTitles.forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) issues.push(`hotel q-card title[${i}] missing data-i18n`);
      });

      // Chip toggles in amenities
      const chips = document.querySelectorAll('#hotelAmenitiesChips .chip-toggle');
      chips.forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) issues.push(`hotel amenity chip[${i}] missing data-i18n`);
      });

      return {
        issues,
        headerI18n: header?.getAttribute('data-i18n'),
        toggleLabelI18n: toggleLabel?.getAttribute('data-i18n'),
        labelCount: labels.length,
        cardTitleCount: cardTitles.length,
        chipCount: chips.length,
      };
    });

    expect(results, 'hotel section found in DOM').not.toBeNull();
    if (!results) return;

    expect.soft(results.headerI18n, 'hotel header data-i18n').toBe('s6_hotel_header');
    expect.soft(results.toggleLabelI18n, 'hotel toggle label data-i18n').toBe('s6_hotel_toggle');
    expect.soft(results.labelCount, 'hotel sub-question labels count').toBeGreaterThanOrEqual(7);
    expect.soft(results.cardTitleCount, 'hotel q-card titles with data-i18n').toBeGreaterThan(0);
    expect.soft(results.chipCount, 'hotel amenity chips count').toBe(12);

    // Report all issues as soft failures
    for (const issue of results.issues) {
      expect.soft(false, issue).toBe(true);
    }
  });
});

test.describe('Car i18n DOM Attributes (TC-225)', () => {
  let intake: IntakePage;

  test.beforeEach(async ({ page }) => {
    intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);
    // Expand car section
    await intake.carToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.carSubQuestions).toHaveClass(/is-expanded/);
  });

  test('TC-225: all car section text elements have data-i18n attributes', async ({ page }) => {
    const results = await page.evaluate(() => {
      const section = document.getElementById('carAssistanceSection');
      if (!section) return null;

      const issues: string[] = [];

      // Header
      const header = section.querySelector('.assistance-section__header');
      if (!header?.getAttribute('data-i18n')) issues.push('car header missing data-i18n');

      // Toggle label
      const toggleQ = section.querySelector('[data-question-key="carAssistToggle"]');
      const toggleLabel = toggleQ?.querySelector('.field__label');
      if (!toggleLabel?.getAttribute('data-i18n')) issues.push('car toggle label missing data-i18n');

      // Toggle card titles
      const toggleCards = toggleQ?.querySelectorAll('.q-card__title') ?? [];
      toggleCards.forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) issues.push(`car toggle card title[${i}] missing data-i18n`);
      });

      // Sub-question field labels
      const subQ = document.getElementById('carSubQuestions');
      if (!subQ) { issues.push('carSubQuestions not found'); return { issues }; }

      const labels = subQ.querySelectorAll('.field__label');
      labels.forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) issues.push(`car sub-question label[${i}] missing data-i18n`);
      });

      // Q-card titles within sub-questions
      const cardTitles = subQ.querySelectorAll('.q-card__title');
      cardTitles.forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) issues.push(`car q-card title[${i}] missing data-i18n`);
      });

      // Chip toggles in extras
      const chips = document.querySelectorAll('#carExtrasChips .chip-toggle');
      chips.forEach((el, i) => {
        if (!el.getAttribute('data-i18n')) issues.push(`car extra chip[${i}] missing data-i18n`);
      });

      return {
        issues,
        headerI18n: header?.getAttribute('data-i18n'),
        toggleLabelI18n: toggleLabel?.getAttribute('data-i18n'),
        labelCount: labels.length,
        cardTitleCount: cardTitles.length,
        chipCount: chips.length,
      };
    });

    expect(results, 'car section found in DOM').not.toBeNull();
    if (!results) return;

    expect.soft(results.headerI18n, 'car header data-i18n').toBe('s6_car_header');
    expect.soft(results.toggleLabelI18n, 'car toggle label data-i18n').toBe('s6_car_toggle');
    expect.soft(results.labelCount, 'car sub-question labels count').toBeGreaterThanOrEqual(6);
    expect.soft(results.cardTitleCount, 'car q-card titles with data-i18n').toBeGreaterThan(0);
    expect.soft(results.chipCount, 'car extra chips count').toBe(7);

    for (const issue of results.issues) {
      expect.soft(false, issue).toBe(true);
    }
  });
});

test.describe('data-en-name Attributes (TC-226)', () => {
  test('TC-226: all option cards and chips have data-en-name attributes', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);
    await intake.waitForI18nReady();
    await intake.navigateToStep(2);

    // Expand both sections
    await intake.hotelToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.hotelSubQuestions).toHaveClass(/is-expanded/);
    await intake.carToggle.locator('.q-card[data-value="yes"]').click();
    await expect(intake.carSubQuestions).toHaveClass(/is-expanded/);

    const results = await page.evaluate(() => {
      const issues: string[] = [];

      // Hotel q-cards with data-value (option cards, not toggle cards)
      const hotelSub = document.getElementById('hotelSubQuestions');
      if (hotelSub) {
        const hotelCards = hotelSub.querySelectorAll('.q-card[data-value]');
        hotelCards.forEach((el, i) => {
          if (!el.getAttribute('data-en-name')) {
            const val = el.getAttribute('data-value');
            issues.push(`hotel q-card[data-value="${val}"] (index ${i}) missing data-en-name`);
          }
        });
      }

      // Hotel amenity chips
      const hotelChips = document.querySelectorAll('#hotelAmenitiesChips .chip-toggle');
      hotelChips.forEach((el, i) => {
        if (!el.getAttribute('data-en-name')) {
          issues.push(`hotel amenity chip[${i}] missing data-en-name`);
        }
      });

      // Car q-cards with data-value
      const carSub = document.getElementById('carSubQuestions');
      if (carSub) {
        const carCards = carSub.querySelectorAll('.q-card[data-value]');
        carCards.forEach((el, i) => {
          if (!el.getAttribute('data-en-name')) {
            const val = el.getAttribute('data-value');
            issues.push(`car q-card[data-value="${val}"] (index ${i}) missing data-en-name`);
          }
        });
      }

      // Car extras chips
      const carChips = document.querySelectorAll('#carExtrasChips .chip-toggle');
      carChips.forEach((el, i) => {
        if (!el.getAttribute('data-en-name')) {
          issues.push(`car extra chip[${i}] missing data-en-name`);
        }
      });

      return {
        issues,
        hotelCardCount: hotelSub?.querySelectorAll('.q-card[data-value]').length ?? 0,
        hotelChipCount: hotelChips.length,
        carCardCount: carSub?.querySelectorAll('.q-card[data-value]').length ?? 0,
        carChipCount: carChips.length,
      };
    });

    expect.soft(results.hotelCardCount, 'hotel option cards found').toBeGreaterThan(0);
    expect.soft(results.hotelChipCount, 'hotel amenity chips found').toBe(12);
    expect.soft(results.carCardCount, 'car option cards found').toBeGreaterThan(0);
    expect.soft(results.carChipCount, 'car extra chips found').toBe(7);

    // Report all issues as soft failures
    for (const issue of results.issues) {
      expect.soft(false, issue).toBe(true);
    }

    expect.soft(results.issues.length, 'total data-en-name issues').toBe(0);
  });
});
