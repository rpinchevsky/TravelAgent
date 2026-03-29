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

  // --- Step 2 (hotel & car assistance) ---
  readonly hotelAssistanceSection: Locator;
  readonly hotelToggle: Locator;
  readonly hotelSubQuestions: Locator;
  readonly hotelTypeGrid: Locator;
  readonly hotelAmenitiesChips: Locator;
  readonly hotelBudgetSlider: Locator;

  readonly carAssistanceSection: Locator;
  readonly carToggle: Locator;
  readonly carSubQuestions: Locator;
  readonly carCategoryGrid: Locator;
  readonly carExtrasChips: Locator;
  readonly carBudgetSlider: Locator;

  // --- Step 2: Multi-select grids & hints ---
  readonly multiSelectGrids: Locator;
  readonly multiSelectHints: Locator;

  // --- Step 4 (interests) ---
  readonly interestCards: Locator;
  readonly interestSections: Locator;

  // --- Step 5 (avoid & pace) ---
  readonly avoidCards: Locator;
  readonly avoidSections: Locator;
  readonly paceCards: Locator;

  // --- Step 6 (food) ---
  readonly foodExperienceCards: Locator;
  readonly vibeCards: Locator;

  // --- Step 7 (extras) ---
  readonly depthExtraQuestions: Locator;
  readonly reportLang: Locator;
  readonly wheelchairQuestion: Locator;

  // --- Step 8 (review) ---
  readonly reviewStep: Locator;
  readonly previewContent: Locator;
  readonly previewTabLabel: Locator;

  // --- Step divider (merge indicator) ---
  readonly stepDivider: Locator;

  // --- Search bar ---
  readonly searchBar: Locator;
  readonly destinationInput: Locator;
  readonly datesDropdown: Locator;
  readonly travelersDropdown: Locator;

  // --- Language selector ---
  readonly langSelector: Locator;
  readonly langDropdown: Locator;

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

    // Step 2: Hotel Assistance
    this.hotelAssistanceSection = page.locator('#hotelAssistanceSection');
    this.hotelToggle = page.locator('[data-question-key="hotelAssistToggle"]');
    this.hotelSubQuestions = page.locator('#hotelSubQuestions');
    this.hotelTypeGrid = page.locator('[data-question-key="hotelType"] .option-grid');
    this.hotelAmenitiesChips = page.locator('#hotelAmenitiesChips');
    this.hotelBudgetSlider = page.locator('#hotelBudgetSlider');

    // Step 2: Car Rental Assistance
    this.carAssistanceSection = page.locator('#carAssistanceSection');
    this.carToggle = page.locator('[data-question-key="carAssistToggle"]');
    this.carSubQuestions = page.locator('#carSubQuestions');
    this.carCategoryGrid = page.locator('[data-question-key="carCategory"] .option-grid');
    this.carExtrasChips = page.locator('#carExtrasChips');
    this.carBudgetSlider = page.locator('#carBudgetSlider');

    // Step 2: Multi-select grids & hints
    this.multiSelectGrids = page.locator('.option-grid[data-multi-select]');
    this.multiSelectHints = page.locator('.option-grid__hint');

    // Step 4
    this.interestCards = page.locator('#interestsSections .interest-card');
    this.interestSections = page.locator('#interestsSections .chip-section');

    // Step 5
    this.avoidCards = page.locator('#avoidSections .avoid-card');
    this.avoidSections = page.locator('#avoidSections .chip-section');
    this.paceCards = page.locator('.pace-card');

    // Step 6
    this.foodExperienceCards = page.locator('#foodExperienceCards .interest-card');
    this.vibeCards = page.locator('#vibeGroup .avoid-card');

    // Step 7
    this.depthExtraQuestions = page.locator('.depth-extra-question');
    this.reportLang = page.locator('#reportLang');
    this.wheelchairQuestion = page.locator('.depth-extra-question[data-question-key="wheelchairAccessible"]');

    // Step 8
    this.reviewStep = page.locator('section.step[data-step="8"]');
    this.previewContent = page.locator('#previewContent');
    this.previewTabLabel = page.locator('#previewTabLabel');

    // Step divider
    this.stepDivider = page.locator('.step-divider');

    // Search bar
    this.searchBar = page.locator('#searchBar');
    this.destinationInput = page.locator('#destination');
    this.datesDropdown = page.locator('#sbDatesDropdown');
    this.travelersDropdown = page.locator('#sbTravelersDropdown');

    // Language selector
    this.langSelector = page.locator('#langSelector');
    this.langDropdown = page.locator('#langDropdown');
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
    return this.stepSection(step).locator('.sub-dot');
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
    return this.visibleStep.locator('.btn-prev');
  }

  // --- Navigation Helpers ---

  async goto() {
    // Navigate to trip_intake.html — baseURL should point to it
    await this.page.goto('');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Complete Step 0 by filling required fields (destination + dates) and clicking Continue.
   */
  async completeStep0() {
    // Fill destination (required)
    await this.destinationInput.fill('Test City');
    // Fill arrival and departure dates (required) — use hidden input values directly
    await this.page.evaluate(() => {
      const arrival = document.getElementById('arrival') as HTMLInputElement;
      const departure = document.getElementById('departure') as HTMLInputElement;
      if (arrival) arrival.value = '2026-08-01T10:00';
      if (departure) departure.value = '2026-08-05T18:00';
    });
    await this.continueButton().click();
  }

  /**
   * Complete Step 1 with minimal valid data (1 parent with name + birth year).
   * Clicks Continue to advance past Step 1.
   */
  async completeStep1() {
    // Fill first parent's name (required)
    await this.page.locator('#parentsContainer .parent-name').first().fill('Test Parent');
    // Select first parent's birth year (required)
    await this.page.locator('#parentsContainer .dob-year').first().selectOption('1990');
    await this.continueButton().click();
  }

  /**
   * Complete prerequisite steps (Step 0 and Step 1) to reach Step 2.
   * After calling this, the wizard is on Step 2 (hotel/car assistance).
   * Note: depth overlay no longer fires after Step 1 — it fires after Step 2.
   */
  async completePrerequisiteSteps() {
    await this.completeStep0();
    await this.completeStep1();
  }

  /**
   * Complete Step 2 by clicking Continue to trigger the depth overlay.
   * After calling this, the depth selector overlay should be visible.
   */
  async completeStep2() {
    await this.continueButton().click();
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
   * Full setup: navigate, complete Steps 0, 1, and 2, select depth, confirm.
   * After calling this, the wizard is on Step 3 (questionnaire).
   */
  async setupWithDepth(depth: number) {
    await this.goto();
    await this.completePrerequisiteSteps();
    await this.completeStep2();
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
    // During animations, the visible step may temporarily not be found
    const count = await step.count();
    if (count === 0) return -1;
    const dataStep = await step.first().getAttribute('data-step');
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
   * Get all depth-active question keys (tiered questions not hidden by the depth system).
   * Only counts elements with data-tier attribute that are not hidden by applyDepth.
   * Non-tiered questions (interests, avoidChips, hotel/car, etc.) are excluded
   * because they are not depth-gated.
   */
  async getVisibleQuestionKeys(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const questions = document.querySelectorAll('[data-question-key][data-tier]');
      const keys: string[] = [];
      for (const q of questions) {
        const el = q as HTMLElement;
        const key = el.getAttribute('data-question-key');
        if (!key) continue;
        // Check if hidden by depth system (data-depth-hidden attribute set by applyDepth)
        if (el.hasAttribute('data-depth-hidden')) continue;
        keys.push(key);
      }
      return keys;
    });
  }

  /**
   * Get the markdown/preview content from Step 8 (Review).
   */
  async getReviewContent(): Promise<string> {
    // The review step should contain a preview element (textarea, pre, or .markdown-preview)
    const reviewStep = this.stepSection(8);
    const preview = reviewStep.locator('textarea, pre, .markdown-preview, .review-content');
    if (await preview.count() > 0) {
      return (await preview.first().textContent()) ?? '';
    }
    return (await reviewStep.textContent()) ?? '';
  }

  /**
   * Get the raw markdown from the preview data attribute (used for copy/download).
   */
  async getRawMarkdown(): Promise<string> {
    return await this.page.evaluate(() => {
      const el = document.getElementById('previewContent');
      return el?.dataset?.rawMd ?? el?.textContent ?? '';
    });
  }

  /**
   * Navigate to a specific step by clicking Continue/Back as needed.
   * Starts from whatever step we're currently on.
   */
  async navigateToStep(targetStep: number) {
    let current = await this.getCurrentStepNumber();
    const maxAttempts = 20;
    let attempts = 0;
    while (current !== targetStep && attempts < maxAttempts) {
      attempts++;
      if (current < targetStep) {
        // Step 3 has no Continue button — it uses auto-advance via card clicks.
        // Click the already-selected card on each visible sub-step to trigger auto-advance.
        if (current === 3) {
          await this.skipStep3SubSteps();
          current = await this.getCurrentStepNumber();
          continue;
        }
        const btn = this.continueButton();
        // Use force click to bypass stability check during step transition animations
        if (await btn.count() > 0) await btn.click({ force: true });
      } else {
        // Step 3 (questionnaire) has animating slides that make the back button unstable.
        // Use force click to bypass the stability check.
        const btn = this.backButton();
        if (await btn.count() > 0) await btn.click({ force: true });
      }
      // Handle depth overlay if it appears (Step 2 Continue triggers it)
      try {
        await this.depthOverlay.waitFor({ state: 'visible', timeout: 1500 });
        // Overlay appeared — select depth 20 if not already selected, then confirm
        const hasSelected = await this.page.locator('.depth-card.is-selected').count();
        if (hasSelected === 0) {
          await this.depthCard(20).click();
        }
        await this.depthConfirmBtn.click();
        await this.depthOverlay.waitFor({ state: 'hidden', timeout: 5000 });
        // Wait for step transition to complete after overlay closes
        const prevStep = current;
        await this.page.waitForFunction(
          (prev) => {
            const active = document.querySelector('section.step.is-active');
            const stepNum = active ? parseInt(active.getAttribute('data-step') || '0', 10) : -1;
            return stepNum !== prev;
          },
          prevStep,
          { timeout: 5000 }
        );
      } catch {
        // Overlay didn't appear — normal step transition
      }
      current = await this.getCurrentStepNumber();
    }
  }

  /**
   * Skip through all Step 3 sub-step questions by clicking the default-selected card
   * on each visible slide. Step 3 auto-advances after each card click (400ms delay).
   * After the last sub-step, it auto-navigates to Step 4.
   */
  async skipStep3SubSteps() {
    const maxSubs = 35;
    for (let i = 0; i < maxSubs; i++) {
      const currentStepNum = await this.getCurrentStepNumber();
      if (currentStepNum !== 3) break;

      // Click the selected or first card on the visible question slide via JS
      const clicked = await this.page.evaluate(() => {
        const slide = document.querySelector('.question-slide.is-visible');
        if (!slide) return false;
        const card = slide.querySelector('.q-card.is-selected') || slide.querySelector('.q-card');
        if (!card) return false;
        (card as HTMLElement).click();
        return true;
      });
      if (!clicked) break;

      // Wait for auto-advance animation (400ms delay + transition)
      await this.page.waitForTimeout(450);
    }
  }

  /**
   * Get an assistance section by key ('hotel' or 'car').
   */
  assistanceSectionByKey(key: 'hotel' | 'car'): Locator {
    return key === 'hotel' ? this.hotelAssistanceSection : this.carAssistanceSection;
  }

  /**
   * Get a slider handle element by slider ID and handle type.
   */
  sliderHandle(sliderId: string, handleType: 'min' | 'max'): Locator {
    return this.page.locator(`#${sliderId} [data-handle="${handleType}"]`);
  }

  /**
   * Get a sub-question container within a section by question key.
   */
  getSubQuestionByKey(sectionId: string, questionKey: string): Locator {
    return this.page.locator(`#${sectionId} [data-question-key="${questionKey}"]`);
  }

  /**
   * Get computed CSS property for an element.
   */
  async getComputedStyle(locator: Locator, property: string): Promise<string> {
    return await locator.evaluate((el, prop) => {
      return window.getComputedStyle(el).getPropertyValue(prop);
    }, property);
  }

  /**
   * Switch language by clicking the language selector.
   */
  async switchLanguage(langCode: string) {
    await this.page.locator('#langBtn').click();
    await this.page.locator(`.lang-selector__item[data-lang="${langCode}"]`).click();
  }

  /**
   * Wait for i18n catalogs to finish loading.
   * Resolves once the `i18n-loading` class is removed from `<body>`.
   * Must be called after every `goto()` or `page.reload()` on the intake page.
   */
  async waitForI18nReady() {
    await this.page.waitForFunction(
      () => !document.body.classList.contains('i18n-loading')
    );
  }

  /**
   * Get card CSS properties for visual comparison.
   * Returns an object with key style properties for a card element.
   */
  async getCardStyles(selector: string): Promise<Record<string, string>> {
    return await this.page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return {} as Record<string, string>;
      const cs = window.getComputedStyle(el);
      return {
        padding: cs.padding,
        borderRadius: cs.borderRadius,
        borderWidth: cs.borderWidth,
        textAlign: cs.textAlign,
        flexDirection: cs.flexDirection,
        alignItems: cs.alignItems,
        justifyContent: cs.justifyContent,
      };
    }, selector);
  }
}
