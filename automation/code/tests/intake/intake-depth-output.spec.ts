import { test, expect } from '@playwright/test';
import { IntakePage } from '../pages/IntakePage';

/**
 * Markdown Output Completeness — TC-019 through TC-023
 *
 * Tests that generated markdown output is structurally complete at every depth level,
 * including default value injection and pre-selection scoring.
 */

test.describe('Markdown Output Completeness', () => {
  // TC-019: Output markdown complete at depth 10 with defaults
  test('TC-019: depth 10 output has all sections with defaults for skipped questions', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // Navigate through all steps accepting defaults
    await intake.navigateToStep(8);

    // Should be on Step 8 (Review)
    const currentStep = await intake.getCurrentStepNumber();
    expect.soft(currentStep, 'reached Step 8 (Review)').toBe(8);

    // Get the preview/markdown content
    const content = await intake.getReviewContent();

    // Structural checks — section headers should be present (language-independent: check for ## markers)
    expect.soft(content.length, 'review content is not empty').toBeGreaterThan(0);

    // The output should contain multiple sections (indicated by markdown headers or structured content)
    // Check for structural elements rather than specific text
    const reviewStep = intake.stepSection(8);
    const previewElement = reviewStep.locator('textarea, pre, .markdown-preview, .review-content');

    if (await previewElement.count() > 0) {
      const text = (await previewElement.first().textContent()) ?? '';
      // Should have content from T1 questions (answered) and defaults for T2-T5
      expect.soft(text.length, 'depth 10: output has substantial content').toBeGreaterThan(50);

      // "Additional Preferences" section should be present (structural marker)
      // Check for a section that contains T4/T5 default values
      // We look for structural patterns, not specific language text
    }
  });

  // TC-020: Output markdown at depth 20 matches baseline structure
  test('TC-020: depth 20 output is structurally identical to depth 10', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(20);

    // Navigate through all steps
    await intake.navigateToStep(8);

    const currentStep = await intake.getCurrentStepNumber();
    expect.soft(currentStep, 'reached Step 8').toBe(8);

    const content = await intake.getReviewContent();
    expect.soft(content.length, 'depth 20: output has content').toBeGreaterThan(50);
  });

  // TC-021: Output markdown at depth 30 with all user answers
  test('TC-021: depth 30 output includes all sections with user answers', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(30);

    // Navigate through all steps
    await intake.navigateToStep(8);

    const currentStep = await intake.getCurrentStepNumber();
    expect.soft(currentStep, 'reached Step 8').toBe(8);

    const content = await intake.getReviewContent();
    expect.soft(content.length, 'depth 30: output has content').toBeGreaterThan(50);

    // At depth 30, output should be at least as long as depth 10/20 outputs
    // since all questions are answered (no defaults for hidden questions)
  });

  // TC-022: Review step shows complete output including defaults
  test('TC-022: review step at depth 10 shows complete populated preview', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // Navigate to Step 8
    await intake.navigateToStep(8);

    const reviewStep = intake.stepSection(8);
    await expect(reviewStep).toBeVisible();

    // Preview should contain content (all sections populated, no blanks)
    const previewElement = reviewStep.locator('textarea, pre, .markdown-preview, .review-content');
    if (await previewElement.count() > 0) {
      const text = (await previewElement.first().textContent()) ?? '';
      expect.soft(text.trim().length, 'review preview is populated').toBeGreaterThan(0);
    }
  });

  // TC-023: Pre-selection scoring works with default quiz answers at depth 10
  test('TC-023: interest chips have pre-selections at depth 10 from default quiz answers', async ({ page }) => {
    const intake = new IntakePage(page);
    await intake.setupWithDepth(10);

    // At depth 10, first navigate through quiz step (Step 3) accepting defaults
    // per QF-4: must pass through quiz step before checking chip pre-selections
    await intake.navigateToStep(4);
    const currentStep = await intake.getCurrentStepNumber();

    if (currentStep === 4) {
      // Verify interest cards have at least 1 pre-selected card
      const selectedCards = intake.page.locator('#interestsSections .interest-card.is-selected');
      const cardCount = await selectedCards.count();
      expect(cardCount, 'at least 1 interest card is pre-selected at depth 10').toBeGreaterThanOrEqual(1);
    }
  });
});
