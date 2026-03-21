import { type Page, type Locator } from '@playwright/test';

/**
 * Page Object Model for the Trip Intake wizard page (trip_intake.html).
 * Covers: depth selector, wizard steps, questions, stepper, progress bar,
 * context bar, toast notifications, and review/markdown output.
 *
 * Language-independent: all selectors use CSS classes, IDs, or data attributes.
 * No text-based filtering in any language.
 */
export class IntakePage {
  readonly page: Page;

  // --- Depth Selector Overlay ---
  readonly depthOverlay: Locator;
  readonly depthSelector: Locator;
  readonly depthCards: Locator;
  readonly selectedDepthCard: Locator;
  readonly depthConfirmBtn: Locator;
  readonly depthCardBadge: Locator;
  readonly depthOptionsGroup: Locator;

  // --- Context Bar ---
  readonly contextBar: Locator;
  readonly depthPill: Locator;
  readonly ctxDest: Locator;
  readonly ctxDates: Locator;
  readonly ctxTravelers: Locator;

  // --- Progress Bar ---
  readonly progressBar: Locator;
  readonly progressBarFill: Locator;

  // --- Stepper ---
  readonly stepper: Locator;
  readonly stepperSteps: Locator;
  readonly stepperCircles: Locator;
  readonly stepperFill: Locator;

  // --- Steps ---
  readonly stepContainer: Locator;
  readonly visibleStep: Locator;

  // --- Toast ---
  readonly toastContainer: Locator;
  readonly toast: Locator;

  // --- Form ---
  readonly tripForm: Locator;

  // --- Step 0 (destination/rhythm) ---
  readonly rhythmOptions: Locator;

  // --- Step 1 (travelers) ---
  readonly adultCount: Locator;
  readonly adultPlus: Locator;
  readonly adultMinus: Locator;

  // --- Step 7 (review) ---
  readonly reviewStep: Locator;

  // --- Step divider (merge indicator) ---
  readonly stepDivider: Locator;

  constructor(page: Page) {
    this.page = page;

    // Depth Selector Overlay
    this.depthOverlay = page.locator('.depth-selector-overlay');
    this.depthSelector = page.locator('.depth-selector');
    this.depthCards = page.locator('.depth-card');
    this.selectedDepthCard = page.locator('.depth-card.is-selected');
    this.depthConfirmBtn = page.locator('#depthConfirmBtn');
    this.depthCardBadge = page.locator('.depth-card__badge');
    this.depthOptionsGroup = page.locator('.depth-selector__options');

    // Context Bar
    this.contextBar = page.locator('.context-bar');
    this.depthPill = page.locator('.context-bar__pill--depth');
    this.ctxDest = page.locator('#ctxDest');
    this.ctxDates = page.locator('#ctxDates');
    this.ctxTravelers = page.locator('#ctxTravelers');

    // Progress Bar
    this.progressBar = page.locator('.progress-bar');
    this.progressBarFill = page.locator('#progressBarFill');

    // Stepper
    this.stepper = page.locator('#stepper');
    this.stepperSteps = page.locator('.stepper__step');
    this.stepperCircles = page.locator('.stepper__circle');
    this.stepperFill = page.locator('#stepperFill');

    // Steps
    this.stepContainer = page.locator('.step-container');
    this.visibleStep = page.locator('.step.is-visible');

    // Toast
    this.toastContainer = page.locator('.toast-container');
    this.toast = page.locator('.toast');

    // Form
    this.tripForm = page.locator('#tripForm');

    // Step 0
    this.rhythmOptions = page.locator('#rhythmOptions');

    // Step 1
    this.adultCount = page.locator('#adultCount');
    this.adultPlus = page.locator('#adultPlus');
    this.adultMinus = page.locator('#adultMinus');

    // Step 7
    this.reviewStep = page.locator('section.step[data-step="7"]');

    // Step divider
    this.stepDivider = page.locator('.step-divider');
  }

  // --- Parameterized Locators ---

  depthCard(depth: number): Locator {
    return this.page.locator(`.depth-card[data-depth="${depth}"]`);
  }

  stepSection(step: number): Locator {
    return this.page.locator(`section.step[data-step="${step}"]`);
  }

  stepperStep(step: number): Locator {
    return this.page.locator(`.stepper__step[data-step="${step}"]`);
  }

  questionByKey(key: string): Locator {
    return this.page.locator(`[data-question-key="${key}"]`);
  }

  questionsByTier(tier: number): Locator {
    return this.page.locator(`[data-tier="${tier}"]`);
  }

  visibleQuestions(): Locator {
    return this.page.locator('[data-question-key]:visible');
  }

  subStepDots(step: number): Locator {
    return this.stepSection(step).locator('.quiz-dots__dot');
  }

  /** All visible stepper steps (not hidden) */
  visibleStepperSteps(): Locator {
    return this.page.locator('.stepper__step:not([hidden]):not([style*="display: none"])');
  }

  /** The Continue/Next button within the currently visible step */
  continueButton(): Locator {
    return this.visibleStep.locator('.btn-next');
  }

  /** The Back button within the currently visible step */
  backButton(): Locator {
    return this.visibleStep.locator('.btn-back');
  }

  // --- Navigation Helpers ---

  async goto() {
    // Navigate to trip_intake.html — baseURL should point to it
    await this.page.goto('');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Complete Step 0 with default rhythm selection (balanced is pre-selected).
   * Clicks Continue to advance past Step 0.
   */
  async completeStep0() {
    // Step 0 should be visible on load with balanced pre-selected
    await this.continueButton().click();
  }

  /**
   * Complete Step 1 with minimal valid data (1 adult, default values).
   * Clicks Continue to advance past Step 1.
   */
  async completeStep1() {
    // Step 1: 1 adult is the default, just click Continue
    await this.continueButton().click();
  }

  /**
   * Complete prerequisite steps (Step 0 and Step 1) to reach the depth selector overlay.
   * After calling this, the depth selector overlay should be visible.
   */
  async completePrerequisiteSteps() {
    await this.completeStep0();
    await this.completeStep1();
  }

  /**
   * Select a depth level and confirm.
   * Assumes the depth overlay is already visible.
   */
  async selectDepthAndConfirm(depth: number) {
    await this.depthCard(depth).click();
    await this.depthConfirmBtn.click();
  }

  /**
   * Full setup: navigate, complete Step 0 and Step 1, select depth, confirm.
   * After calling this, the wizard is on Step 2 (or first active content step).
   */
  async setupWithDepth(depth: number) {
    await this.goto();
    await this.completePrerequisiteSteps();
    await this.selectDepthAndConfirm(depth);
  }

  /**
   * Navigate forward through all active steps by clicking Continue.
   * Returns the count of steps visited (including the starting step).
   */
  async navigateForwardThroughAllSteps(): Promise<number> {
    let stepCount = 0;
    const maxSteps = 10; // safety limit
    while (stepCount < maxSteps) {
      stepCount++;
      const continueBtn = this.continueButton();
      if (await continueBtn.count() === 0) break;
      if (!await continueBtn.isVisible()) break;
      await continueBtn.click();
    }
    return stepCount;
  }

  /**
   * Get the current step number from the visible step section.
   */
  async getCurrentStepNumber(): Promise<number> {
    const step = this.visibleStep;
    const dataStep = await step.getAttribute('data-step');
    return parseInt(dataStep ?? '-1', 10);
  }

  /**
   * Count all visible questions across all steps by evaluating the DOM.
   * Uses the data-question-key attribute to identify questions.
   */
  async countAllVisibleQuestions(): Promise<number> {
    return await this.page.evaluate(() => {
      const questions = document.querySelectorAll('[data-question-key]');
      let count = 0;
      for (const q of questions) {
        const el = q as HTMLElement;
        if (el.offsetParent !== null || el.style.display !== 'none') {
          // Additional check: parent step may be hidden
          const step = el.closest('.step');
          if (step) {
            const style = window.getComputedStyle(el);
            if (style.display !== 'none' && style.visibility !== 'hidden') {
              count++;
            }
          }
        }
      }
      return count;
    });
  }

  /**
   * Get all visible question keys across all steps.
   */
  async getVisibleQuestionKeys(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const questions = document.querySelectorAll('[data-question-key]');
      const keys: string[] = [];
      for (const q of questions) {
        const el = q as HTMLElement;
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          const key = el.getAttribute('data-question-key');
          if (key) keys.push(key);
        }
      }
      return keys;
    });
  }

  /**
   * Get the markdown/preview content from Step 7 (Review).
   */
  async getReviewContent(): Promise<string> {
    // The review step should contain a preview element (textarea, pre, or .markdown-preview)
    const reviewStep = this.stepSection(7);
    const preview = reviewStep.locator('textarea, pre, .markdown-preview, .review-content');
    if (await preview.count() > 0) {
      return (await preview.first().textContent()) ?? '';
    }
    return (await reviewStep.textContent()) ?? '';
  }
}
