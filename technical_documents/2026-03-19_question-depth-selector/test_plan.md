# Test Plan

**Change:** Question Depth Selector — User-Controlled Wizard Length
**Date:** 2026-03-19
**Author:** Automation Engineer
**BRD Reference:** business_requirements.md
**DD Reference:** detailed_design.md
**Status:** Draft

---

## 1. Test Scope

### In Scope
- Depth selector overlay rendering, interaction, and dismissal
- Question visibility at all 5 depth levels (10, 15, 20, 25, 30)
- Default value injection for skipped questions in generated markdown output
- Progress bar and stepper dynamic adaptation to depth level
- Quiz sub-step dot recalculation per depth
- Step merging behavior (depth 10/15: Step 5 merges into Step 4)
- Depth change mid-wizard via context bar pill (re-entry mode)
- Toast notification on depth selection
- Context bar depth pill display
- Keyboard accessibility (arrow keys, Enter, Space, Escape, Tab)
- ARIA roles and attributes on depth selector
- i18n key presence for all 12 supported languages
- New T4/T5 question rendering at depth 25/30
- Output markdown structural completeness at every depth level

### Out of Scope
- Visual regression screenshots (trip output page tests handle those, not intake page)
- Analytics or tracking
- Trip generation pipeline consuming the "Additional Preferences" subsection (follow-up feature)
- Correctness of specific translation text (language-independence rule)

### Test Target
- **File under test:** `trip_intake.html` (standalone HTML form page opened via `file://` or local server)
- **Test type:** Standard Playwright (`@playwright/test` import) — all tests mutate the page (clicks, selections, navigation)
- **NOT using shared-page fixture** — every test involves interaction/mutation

---

## 2. Test Environment

- **Framework:** Playwright + TypeScript
- **Browser:** Desktop Chromium only (single-project rule per automation_rules.md §6.1)
- **Page Object:** New `IntakePage` POM class (see §New POM Locators below) — separate from `TripPage` which targets trip output HTML
- **Base URL:** Local file path or dev server serving `trip_intake.html`
- **Config:** New Playwright project entry or baseURL override for intake page

---

## 3. Test Cases

### TC-001: Depth selector overlay renders with 5 options after Step 1
**Traces to:** REQ-001 → AC-1, AC-2, AC-4
**Type:** Progression
**Spec file:** intake-depth-selector.spec.ts
**Priority:** Critical

**Preconditions:** Page loaded, Step 0 (destination/dates) completed, Step 1 (travelers) completed.
**Steps:**
1. Complete Step 0 with valid destination and dates
2. Complete Step 1 with at least one traveler
3. Click Continue on Step 1
4. Assert depth selector overlay becomes visible

**Expected result:**
- Overlay (`.depth-selector-overlay`) is visible
- Exactly 5 depth cards (`.depth-card`) are present
- Each card has `data-depth` attribute with values 10, 15, 20, 25, 30
- Each card contains `.depth-card__number`, `.depth-card__label`, `.depth-card__time` elements
- Cards use pill/card-style UI (visual structure check only — no text matching)

**Implementation notes:** Use `toHaveCount(5)` for card count. Verify `data-depth` values via attribute selectors.

---

### TC-002: Default depth is 20 (Standard) pre-selected
**Traces to:** REQ-001 → AC-3
**Type:** Progression
**Spec file:** intake-depth-selector.spec.ts
**Priority:** Critical

**Preconditions:** Depth selector overlay is visible (post-Step 1).
**Steps:**
1. Open depth selector overlay
2. Check which card has `is-selected` class

**Expected result:**
- The card with `data-depth="20"` has class `is-selected`
- The card with `data-depth="20"` has `aria-checked="true"`
- All other cards have `aria-checked="false"`
- The "Recommended" badge (`.depth-card__badge`) is present on the 20 card

**Implementation notes:** Can be combined with TC-001 in implementation using `expect.soft()`.

---

### TC-003: Selecting each depth level updates card state
**Traces to:** REQ-001 → AC-1, AC-3
**Type:** Progression
**Spec file:** intake-depth-selector.spec.ts
**Priority:** High

**Preconditions:** Depth selector overlay is visible.
**Steps:**
1. For each depth value [10, 15, 25, 30]:
   a. Click the corresponding depth card
   b. Assert clicked card has `is-selected` class and `aria-checked="true"`
   c. Assert previously selected card no longer has `is-selected`

**Expected result:** Only one card is selected at a time. Selection follows clicks accurately.

**Implementation notes:** Use a loop with `expect.soft()` per depth.

---

### TC-004: Depth 10 shows exactly T1 questions (10 questions)
**Traces to:** REQ-002 → AC-2, AC-3; REQ-003 → AC-1
**Type:** Progression
**Spec file:** intake-depth-questions.spec.ts
**Priority:** Critical

**Preconditions:** Depth selector confirmed at depth 10.
**Steps:**
1. Select depth 10 and confirm
2. Navigate through all active steps
3. Count visible question elements

**Expected result:**
- Exactly 10 questions are visible across all steps
- T1 questions visible: rhythm, setting, culture, interests, noise, foodadventure, pace, diet, reportLang, extraNotes
- T2-T5 questions are hidden (`display: none` or not in DOM)
- Steps 0, 1, and 7 are fully present

**Implementation notes:** Use `data-question-key` or equivalent attribute selectors. Verify visibility with `toBeVisible()` / `toBeHidden()`.

---

### TC-005: Depth 15 shows T1+T2 questions (15 questions)
**Traces to:** REQ-002 → AC-2; REQ-003 → AC-1
**Type:** Progression
**Spec file:** intake-depth-questions.spec.ts
**Priority:** Critical

**Preconditions:** Depth selector confirmed at depth 15.
**Steps:**
1. Select depth 15 and confirm
2. Navigate through all active steps
3. Count visible question elements

**Expected result:**
- 15 questions visible
- T2 additions: budget, flexibility, customInterests, avoidChips, customAvoid
- T3-T5 questions hidden

**Implementation notes:** Data-driven test alongside TC-004, TC-006, TC-007, TC-008.

---

### TC-006: Depth 20 shows T1+T2+T3 questions (20 questions)
**Traces to:** REQ-002 → AC-2; REQ-003 → AC-1
**Type:** Progression
**Spec file:** intake-depth-questions.spec.ts
**Priority:** Critical

**Preconditions:** Depth selector confirmed at depth 20.
**Steps:**
1. Select depth 20 and confirm
2. Navigate through all active steps
3. Count visible question elements

**Expected result:**
- 20 questions visible
- T3 additions: diningstyle, kidsfood, mealpriority, localfood, poiLangs
- T4-T5 questions hidden

---

### TC-007: Depth 25 shows T1-T4 questions (25 questions)
**Traces to:** REQ-002 → AC-2; REQ-003 → AC-1
**Type:** Progression
**Spec file:** intake-depth-questions.spec.ts
**Priority:** Critical

**Preconditions:** Depth selector confirmed at depth 25.
**Steps:**
1. Select depth 25 and confirm
2. Navigate through all active steps
3. Count visible question elements

**Expected result:**
- 25 questions visible
- T4 additions: foodExperience, diningVibe, foodNotes, transport, morningPreference
- T5 questions hidden

---

### TC-008: Depth 30 shows all questions (30 questions)
**Traces to:** REQ-002 → AC-2; REQ-003 → AC-1
**Type:** Progression
**Spec file:** intake-depth-questions.spec.ts
**Priority:** Critical

**Preconditions:** Depth selector confirmed at depth 30.
**Steps:**
1. Select depth 30 and confirm
2. Navigate through all active steps
3. Count visible question elements

**Expected result:**
- 30 questions visible
- T5 additions: snacking, photography, visitDuration, shopping, accessibility
- No questions hidden

---

### TC-009: Steps 0, 1, and 7 always present regardless of depth
**Traces to:** REQ-002 → AC-4
**Type:** Progression
**Spec file:** intake-depth-questions.spec.ts
**Priority:** Critical

**Preconditions:** None.
**Steps:**
1. For each depth [10, 15, 20, 25, 30]:
   a. Select depth and confirm
   b. Verify Step 0 section is visible
   c. Verify Step 1 section is visible
   d. Navigate to the end and verify Step 7 (Review) is reachable

**Expected result:** Steps 0, 1, and 7 are always present in the stepper and navigable at every depth.

**Implementation notes:** Can be merged with TC-004 through TC-008 in implementation.

---

### TC-010: Progress stepper hides skipped steps
**Traces to:** REQ-003 → AC-3
**Type:** Progression
**Spec file:** intake-depth-stepper.spec.ts
**Priority:** High

**Preconditions:** Depth selector confirmed.
**Steps:**
1. Select depth 10 and confirm
2. Count visible stepper circles

**Expected result:**
- Stepper circles for auto-skipped steps are hidden
- Only active steps have visible stepper circles
- Stepper line fill recalculates based on active steps

**Implementation notes:** Test at depth 10 and 20 minimum (10 has merged/skipped steps, 20 is the baseline).

---

### TC-011: Quiz sub-step dots reflect visible questions only
**Traces to:** REQ-003 → AC-2
**Type:** Progression
**Spec file:** intake-depth-stepper.spec.ts
**Priority:** High

**Preconditions:** Depth selector confirmed.
**Steps:**
1. At depth 10, navigate to Step 2 (quiz step)
2. Count sub-step dot indicators

**Expected result:**
- Step 2 at depth 10: 2 dots (setting, culture) — not 3 (evening is removed)
- Step 4 at depth 10: dots match 3 visible quiz questions (noise, foodadventure, pace) + merged diet
- At depth 20: dots match full visible question set per step

**Implementation notes:** Compare dot count against expected visible question count per step per depth.

---

### TC-012: Progress bar percentage adapts to depth
**Traces to:** REQ-003 → AC-4; REQ-005 → AC-2
**Type:** Progression
**Spec file:** intake-depth-stepper.spec.ts
**Priority:** High

**Preconditions:** Depth selected and confirmed.
**Steps:**
1. At depth 10, navigate step by step
2. At each step, read the progress bar fill percentage (width or aria-valuenow)
3. Verify the percentage matches: `currentActiveIndex / (activeSteps.length - 1) * 100`

**Expected result:** Progress bar accurately reflects completion relative to active steps, not total 8 steps.

**Implementation notes:** Extract progress bar value via CSS `width` style or `aria-valuenow`. Test at depth 10 (fewer steps) and depth 20 (baseline).

---

### TC-013: No empty steps or visual glitches at any depth
**Traces to:** REQ-003 → AC-5
**Type:** Progression
**Spec file:** intake-depth-stepper.spec.ts
**Priority:** High

**Preconditions:** Depth selected and confirmed.
**Steps:**
1. For each depth [10, 15, 20, 25, 30]:
   a. Navigate through every active step
   b. At each step, verify at least 1 question element is visible

**Expected result:** No step is shown empty. Every navigable step has at least one visible question or form element.

**Implementation notes:** Data-driven loop per depth.

---

### TC-014: Step merging at depth 10 — Step 5 (diet) merges into Step 4
**Traces to:** REQ-003 → AC-5; DD §8
**Type:** Progression
**Spec file:** intake-depth-stepper.spec.ts
**Priority:** High

**Preconditions:** Depth 10 selected and confirmed.
**Steps:**
1. Navigate to Step 4
2. Verify diet question is present within Step 4's content area
3. Verify a separator (`.step-divider`) precedes the merged question
4. Verify Step 5 is not in the stepper and not navigable

**Expected result:** Diet question is DOM-relocated into Step 4. Step 5 is hidden.

---

### TC-015: Step merging at depth 15 — Step 5 (diet) merges into Step 4
**Traces to:** REQ-003 → AC-5; DD §8
**Type:** Progression
**Spec file:** intake-depth-stepper.spec.ts
**Priority:** Medium

**Preconditions:** Depth 15 selected and confirmed.
**Steps:**
1. Navigate to Step 4
2. Verify diet question is present within Step 4

**Expected result:** Same merging behavior as depth 10 for Step 5.

---

### TC-016: Depth change mid-wizard via context bar pill
**Traces to:** REQ-001 → AC-5; REQ-003 → AC-6
**Type:** Progression
**Spec file:** intake-depth-change.spec.ts
**Priority:** Critical

**Preconditions:** Depth 20 selected, wizard advanced to Step 4.
**Steps:**
1. Click the depth pill in the context bar (`.context-bar__pill--depth`)
2. Verify overlay opens with depth 20 pre-selected
3. Verify confirm button shows "Update" label (not "Let's Go") — check `data-i18n` attribute, not text
4. Select depth 10
5. Click "Update"
6. Verify overlay closes

**Expected result:**
- Overlay reopens in re-entry mode
- After changing to depth 10, T2/T3 questions become hidden
- User returns to their previous step (or nearest active step if Step 4 is still active at depth 10)
- Toast notification appears

**Implementation notes:** Verify return step via active step indicator.

---

### TC-017: Depth increase mid-wizard preserves answers and shows defaults for new questions
**Traces to:** REQ-003 → AC-6
**Type:** Progression
**Spec file:** intake-depth-change.spec.ts
**Priority:** High

**Preconditions:** Depth 10 selected, some T1 questions answered, wizard at Step 3.
**Steps:**
1. Answer some T1 questions explicitly (e.g., select a non-default pace)
2. Change depth to 25 via pill
3. Navigate to previously hidden questions (T2, T3, T4)

**Expected result:**
- Previously answered T1 questions retain user's selections
- Newly visible T2-T4 questions show their default values (not blank)

---

### TC-018: Depth decrease mid-wizard preserves hidden answers for later increase
**Traces to:** REQ-003 → AC-6
**Type:** Progression
**Spec file:** intake-depth-change.spec.ts
**Priority:** High

**Preconditions:** Depth 20 selected, T2 questions answered with non-default values.
**Steps:**
1. Answer T2 questions (e.g., budget, flexibility) with non-default values
2. Change depth to 10 (hides T2 questions)
3. Change depth back to 20

**Expected result:**
- After returning to depth 20, the T2 questions show the user's previously entered values (not defaults)
- Answers are preserved in memory even when questions are hidden

---

### TC-019: Output markdown complete at depth 10 with defaults
**Traces to:** REQ-004 → AC-1, AC-2, AC-3
**Type:** Progression
**Spec file:** intake-depth-output.spec.ts
**Priority:** Critical

**Preconditions:** Depth 10 selected, all visible T1 questions answered with defaults.
**Steps:**
1. Select depth 10, proceed through all active steps with default selections
2. Reach Step 7 (Review), trigger markdown generation
3. Extract the generated markdown content

**Expected result:**
- Markdown is structurally complete: all sections present (Travel Rhythm, Setting, Culture, Interests, Noise, Food Adventure, Pace, Diet, Report Language, etc.)
- Skipped T2-T5 fields use default values (e.g., budget = "Worth the Spend", flexibility = "Loose Framework")
- "Additional Preferences" subsection is present with T4/T5 default values
- No blank/missing fields

**Implementation notes:** Parse markdown structure — check for section headers and non-empty values. Do NOT match specific language text.

---

### TC-020: Output markdown complete at depth 20 matches baseline
**Traces to:** REQ-004 → AC-3
**Type:** Progression
**Spec file:** intake-depth-output.spec.ts
**Priority:** Critical

**Preconditions:** Depth 20, all questions answered.
**Steps:**
1. Complete wizard at depth 20 with all visible questions answered
2. Extract generated markdown

**Expected result:**
- Output is structurally identical to depth 10 output (same sections, same fields)
- T1+T2+T3 fields reflect user answers
- T4+T5 fields use defaults
- "Additional Preferences" subsection present

---

### TC-021: Output markdown complete at depth 30 with all user answers
**Traces to:** REQ-004 → AC-3
**Type:** Progression
**Spec file:** intake-depth-output.spec.ts
**Priority:** Critical

**Preconditions:** Depth 30, all 30 questions answered.
**Steps:**
1. Complete wizard at depth 30 answering all questions
2. Extract generated markdown

**Expected result:**
- All sections present with user-provided values
- "Additional Preferences" subsection includes all T4/T5 fields with user answers
- Structural format identical to depth 10 and depth 20 outputs

---

### TC-022: Review step shows complete output including defaults
**Traces to:** REQ-004 → AC-5
**Type:** Progression
**Spec file:** intake-depth-output.spec.ts
**Priority:** High

**Preconditions:** Depth 10, wizard completed to Step 7.
**Steps:**
1. Navigate to Step 7 (Review)
2. Examine the preview content

**Expected result:**
- Preview shows the complete markdown output
- No visual indication of which values are defaults vs. explicit answers
- All sections populated

---

### TC-023: Pre-selection scoring works with default quiz answers at depth 10
**Traces to:** REQ-004 → AC-4
**Type:** Progression
**Spec file:** intake-depth-output.spec.ts
**Priority:** High

**Preconditions:** Depth 10 selected.
**Steps:**
1. Accept all defaults through the wizard
2. Navigate to the interests chip selection step (T1, always visible)
3. Check pre-selected chips

**Expected result:**
- Interest chips have meaningful pre-selections (not empty)
- The scoring engine uses default quiz answers (setting=both, culture=both, etc.) to produce chip pre-selections

**Implementation notes:** Verify at least 1 chip is pre-selected. Do not assert specific chip names (language-independence).

---

### TC-024: Context bar shows depth pill after selection
**Traces to:** REQ-005 → AC-1
**Type:** Progression
**Spec file:** intake-depth-feedback.spec.ts
**Priority:** High

**Preconditions:** Depth selected and confirmed.
**Steps:**
1. Select depth 15 and confirm
2. Check context bar

**Expected result:**
- Depth pill (`.context-bar__pill--depth`) is visible
- Pill contains `data-i18n="depth_pill"` attribute
- Pill is clickable (re-opens overlay)

---

### TC-025: Toast notification on depth selection
**Traces to:** REQ-005 → AC-4
**Type:** Progression
**Spec file:** intake-depth-feedback.spec.ts
**Priority:** Medium

**Preconditions:** Depth selector overlay visible.
**Steps:**
1. Select depth 10 and click confirm
2. Watch for toast notification

**Expected result:**
- An info toast appears after depth confirmation
- Toast auto-dismisses after timeout

**Implementation notes:** Assert toast element visibility. Do not match toast text (language-independence).

---

### TC-026: Smooth transition to Step 7 at low depth
**Traces to:** REQ-005 → AC-3
**Type:** Progression
**Spec file:** intake-depth-feedback.spec.ts
**Priority:** Medium

**Preconditions:** Depth 10 selected.
**Steps:**
1. Navigate through all active steps at depth 10
2. After the last content step, click Continue

**Expected result:**
- Transition to Step 7 (Review) is seamless — no empty intermediary step shown
- No jarring visual jump

**Implementation notes:** Verify that the step immediately after the last content step is Step 7, with no blank step in between.

---

### TC-027: Keyboard navigation — arrow keys move between depth cards
**Traces to:** REQ-001 → AC-7
**Type:** Progression
**Spec file:** intake-depth-a11y.spec.ts
**Priority:** High

**Preconditions:** Depth selector overlay visible, focus on a depth card.
**Steps:**
1. Press ArrowRight — verify focus moves to next card
2. Press ArrowRight again — verify focus moves further
3. Press ArrowLeft — verify focus moves back
4. Press Enter — verify card is selected

**Expected result:**
- Arrow keys cycle through depth cards
- Enter/Space selects the focused card (`is-selected` class and `aria-checked="true"`)
- Tab moves focus to the confirm button

---

### TC-028: Escape key dismisses overlay without selecting
**Traces to:** REQ-001 → AC-7; DD §4 keyboard nav
**Type:** Progression
**Spec file:** intake-depth-a11y.spec.ts
**Priority:** High

**Preconditions:** Depth selector overlay visible (initial entry after Step 1).
**Steps:**
1. Press Escape

**Expected result:**
- Overlay closes
- No depth is selected (or default remains but wizard does not advance)
- Focus returns to Step 1 Continue button
- User remains on Step 1

---

### TC-029: ARIA roles and attributes on depth selector
**Traces to:** REQ-001 → AC-7
**Type:** Progression
**Spec file:** intake-depth-a11y.spec.ts
**Priority:** High

**Preconditions:** Depth selector overlay visible.
**Steps:**
1. Inspect overlay attributes

**Expected result:**
- Overlay has `role="dialog"`, `aria-modal="true"`, `aria-label` attribute
- Options container has `role="radiogroup"` with `aria-label`
- Each card has `role="radio"` with `aria-checked` attribute
- Selected card has `aria-checked="true"`, others `"false"`

---

### TC-030: Focus management — initial open focuses pre-selected card
**Traces to:** REQ-001 → AC-7; DD §4 focus management
**Type:** Progression
**Spec file:** intake-depth-a11y.spec.ts
**Priority:** Medium

**Preconditions:** Step 1 completed.
**Steps:**
1. Click Continue on Step 1 to trigger overlay
2. Check which element has focus

**Expected result:**
- Focus is on the card with `data-depth="20"` (pre-selected default)

**Implementation notes:** Use `page.locator(':focus')` to verify focused element.

---

### TC-031: i18n keys exist for depth selector in all 12 languages
**Traces to:** REQ-001 → AC-6
**Type:** Progression
**Spec file:** intake-depth-i18n.spec.ts
**Priority:** High

**Preconditions:** Page loaded.
**Steps:**
1. Extract the TRANSLATIONS object from the page (via `page.evaluate()`)
2. For each of the 12 languages (en, ru, he, es, fr, de, it, pt, zh, ja, ko, ar):
   a. Verify key existence for: `depth_title`, `depth_desc`, `depth_confirm`, `depth_update`, `depth_10`, `depth_15`, `depth_20`, `depth_25`, `depth_30`, `depth_10_time`, `depth_15_time`, `depth_20_time`, `depth_25_time`, `depth_30_time`, `depth_recommended`, `depth_pill`, `depth_toast_10` through `depth_toast_30`

**Expected result:**
- All depth-related i18n keys exist in all 12 language blocks
- No key returns `undefined`

**Implementation notes:** Use `page.evaluate()` to access TRANSLATIONS. Assert key presence, not value content (language-independence).

---

### TC-032: i18n keys exist for new T4/T5 questions in all 12 languages
**Traces to:** REQ-001 → AC-6 (new question labels)
**Type:** Progression
**Spec file:** intake-depth-i18n.spec.ts
**Priority:** High

**Preconditions:** Page loaded.
**Steps:**
1. For each of the 7 new questions (transport, morningPreference, snacking, photography, visitDuration, shopping, accessibility):
   a. Verify label keys exist in all 12 languages
   b. Verify option keys exist in all 12 languages (3 options each)

**Expected result:** All new question i18n keys are present in all 12 languages.

---

### TC-033: Quiz auto-advance works correctly with reduced question set
**Traces to:** REQ-003 → AC-7
**Type:** Progression
**Spec file:** intake-depth-questions.spec.ts
**Priority:** High

**Preconditions:** Depth 10 selected, navigated to a quiz step.
**Steps:**
1. At depth 10, enter Step 2 (quiz: setting, culture — 2 visible questions)
2. Answer the first question (setting) — verify auto-advance to culture
3. Answer the second question (culture) — verify auto-advance to next step (not to a hidden third question)

**Expected result:**
- After answering the last visible sub-question, the wizard advances to the next step
- No attempt to show a hidden question slide

---

### TC-034: New T4 questions render at depth 25
**Traces to:** REQ-002 → AC-2 (T4 questions)
**Type:** Progression
**Spec file:** intake-depth-questions.spec.ts
**Priority:** High

**Preconditions:** Depth 25 selected and confirmed.
**Steps:**
1. Navigate to steps containing T4 questions
2. Verify transport, morningPreference (Step 4) and foodExperience, diningVibe, foodNotes (Step 5) are visible

**Expected result:** All 5 T4 questions are visible and interactable.

---

### TC-035: New T5 questions render at depth 30
**Traces to:** REQ-002 → AC-2 (T5 questions)
**Type:** Progression
**Spec file:** intake-depth-questions.spec.ts
**Priority:** High

**Preconditions:** Depth 30 selected and confirmed.
**Steps:**
1. Navigate to steps containing T5 questions
2. Verify snacking (Step 5), photography, accessibility (Step 6), visitDuration, shopping (Step 4) are visible

**Expected result:** All 5 T5 questions are visible and interactable.

---

### TC-036: Re-entry overlay shows "Update" button and returns to current step
**Traces to:** REQ-001 → AC-5; DD §4 re-entry behavior
**Type:** Progression
**Spec file:** intake-depth-change.spec.ts
**Priority:** High

**Preconditions:** Depth 20 confirmed, wizard on Step 4.
**Steps:**
1. Click depth pill in context bar
2. Verify overlay opens
3. Verify confirm button has `data-i18n="depth_update"` (not `depth_confirm`)
4. Verify current depth (20) is pre-selected
5. Click Update without changing depth
6. Verify user returns to Step 4

**Expected result:** Re-entry mode works correctly — button label changes, current depth highlighted, returns to prior step.

---

### TC-037: Escape from re-entry overlay returns to current step without changes
**Traces to:** DD §4 re-entry behavior
**Type:** Progression
**Spec file:** intake-depth-change.spec.ts
**Priority:** Medium

**Preconditions:** Depth 20 confirmed, wizard on Step 4, depth pill clicked.
**Steps:**
1. Overlay opens in re-entry mode
2. Select a different depth (10) but do NOT confirm
3. Press Escape

**Expected result:**
- Overlay closes
- Depth remains at 20 (no change applied)
- User is back on Step 4
- No questions hidden/shown

---

## 4. Coverage Matrix

| REQ | AC | Test Cases | Coverage |
|-----|-----|------------|----------|
| REQ-001 | AC-1 | TC-001, TC-003 | Full |
| REQ-001 | AC-2 | TC-001 | Full |
| REQ-001 | AC-3 | TC-002 | Full |
| REQ-001 | AC-4 | TC-001 | Full |
| REQ-001 | AC-5 | TC-016, TC-036 | Full |
| REQ-001 | AC-6 | TC-031, TC-032 | Full |
| REQ-001 | AC-7 | TC-027, TC-028, TC-029, TC-030 | Full |
| REQ-002 | AC-1 | TC-004–TC-008 | Full |
| REQ-002 | AC-2 | TC-004–TC-008 | Full |
| REQ-002 | AC-3 | TC-004 | Full |
| REQ-002 | AC-4 | TC-009 | Full |
| REQ-002 | AC-5 | — (rule file documentation, not testable via UI) | N/A |
| REQ-003 | AC-1 | TC-004–TC-008 | Full |
| REQ-003 | AC-2 | TC-011 | Full |
| REQ-003 | AC-3 | TC-010 | Full |
| REQ-003 | AC-4 | TC-012 | Full |
| REQ-003 | AC-5 | TC-013, TC-014, TC-015 | Full |
| REQ-003 | AC-6 | TC-016, TC-017, TC-018 | Full |
| REQ-003 | AC-7 | TC-033 | Full |
| REQ-004 | AC-1 | TC-019 | Full |
| REQ-004 | AC-2 | TC-019 | Full |
| REQ-004 | AC-3 | TC-019, TC-020, TC-021 | Full |
| REQ-004 | AC-4 | TC-023 | Full |
| REQ-004 | AC-5 | TC-022 | Full |
| REQ-005 | AC-1 | TC-024 | Full |
| REQ-005 | AC-2 | TC-012 | Full |
| REQ-005 | AC-3 | TC-026 | Full |
| REQ-005 | AC-4 | TC-025 | Full |

**Total: 37 test cases covering all 25 acceptance criteria (24 testable via UI, 1 N/A).**

---

## 5. Test Data Dependencies

| Dependency | Source | Notes |
|------------|--------|-------|
| Valid destination/date for Step 0 | Hardcoded test fixture | Any valid city + date range |
| Traveler data for Step 1 | Hardcoded test fixture | Minimum 1 adult |
| Question tier mapping | `QUESTION_TIERS` constant in `trip_intake.html` | Used to verify correct visibility per depth |
| Default values | `QUESTION_DEFAULTS` constant in `trip_intake.html` | Used to verify output markdown defaults |
| i18n language list | `TRANSLATIONS` object in `trip_intake.html` | 12 languages: en, ru, he, es, fr, de, it, pt, zh, ja, ko, ar |
| Depth levels | `DEPTH_LEVELS` array in `trip_intake.html` | [10, 15, 20, 25, 30] |

**No external API or network dependencies.** All tests run against a local HTML file.

---

## 6. Risk & Mitigation

| Risk | Severity | Mitigation |
|------|----------|------------|
| `trip_intake.html` is a standalone file — Playwright config may need a new baseURL or project | Medium | Add a new Playwright project for intake tests or use `test.use({ baseURL })` in spec files |
| No existing POM for intake page — all locators are new | Medium | Create `IntakePage.ts` POM before writing specs; define all selectors upfront |
| Step 0/1 completion requires interaction (form fills) — each test needs this setup | Medium | Create a helper function `completePrerequisiteSteps()` in IntakePage POM to streamline setup |
| Question visibility selectors depend on implementation (`data-tier`, `data-question-key`, or class-based) | Medium | Document required `data-testid` / `data-*` attributes in qa_2_dev_requirements; align with DD |
| Markdown output extraction method unknown (clipboard, textarea, DOM element) | Low | Coordinate with dev — likely from a `<textarea>` or `<pre>` element in Step 7 |
| Test execution time may be high due to many multi-step wizard interactions | Medium | Reuse browser context where possible; parallelize independent depth-level tests across workers |

---

## 7. Estimated Impact

### New POM: `IntakePage.ts`

A new Page Object Model file is required since `TripPage.ts` targets the trip output HTML, not the intake wizard.

**New locators needed:**

| Locator Name | Selector | Purpose |
|---|---|---|
| `depthOverlay` | `.depth-selector-overlay` | Depth selector overlay container |
| `depthCards` | `.depth-card` | All depth option cards |
| `depthCard(n)` | `.depth-card[data-depth="${n}"]` | Specific depth card by value |
| `selectedDepthCard` | `.depth-card.is-selected` | Currently selected depth card |
| `depthConfirmBtn` | `#depthConfirmBtn` | Confirm/Update button |
| `depthCardBadge` | `.depth-card__badge` | Recommended badge on card |
| `depthPill` | `.context-bar__pill--depth` | Context bar depth pill |
| `contextBar` | `.context-bar` | Context bar container |
| `progressBar` | `.progress-bar` (or equivalent) | Top progress bar |
| `stepperCircles` | `.stepper__circle` (or equivalent) | Stepper step indicators |
| `activeStepperCircles` | `.stepper__circle:not([hidden])` | Visible stepper circles |
| `subStepDots` | `.quiz-dots__dot` (or equivalent) | Quiz sub-step dots |
| `toastNotification` | `.toast` (or equivalent) | Toast notification element |
| `questionByKey(key)` | `[data-question-key="${key}"]` | Question element by key |
| `visibleQuestions` | `[data-question-key]:visible` | All visible question elements |
| `stepSection(n)` | `[data-step="${n}"]` (or equivalent) | Step container by number |
| `stepDivider` | `.step-divider` | Merge separator element |
| `reviewPreview` | Step 7 markdown preview element | Review/output content |
| `step0Form` | Step 0 destination/date form | For prerequisite completion |
| `step1Form` | Step 1 traveler form | For prerequisite completion |

**Dev requirements for `qa_2_dev_requirements.txt`:**
- `data-question-key` attribute on every question container element (maps to question keys in the inventory)
- `data-tier` attribute on question containers (for direct tier verification)
- `data-step` attribute on step sections
- Accessible `aria-valuenow` on progress bar for percentage verification

### New Spec Files

| File | Test Count | Est. Runtime |
|------|------------|-------------|
| `intake-depth-selector.spec.ts` | 3 (TC-001, TC-002, TC-003) | ~15s |
| `intake-depth-questions.spec.ts` | 8 (TC-004–TC-009, TC-033, TC-034, TC-035) | ~60s |
| `intake-depth-stepper.spec.ts` | 6 (TC-010–TC-015) | ~40s |
| `intake-depth-change.spec.ts` | 5 (TC-016–TC-018, TC-036, TC-037) | ~45s |
| `intake-depth-output.spec.ts` | 4 (TC-019–TC-022) | ~35s |
| `intake-depth-feedback.spec.ts` | 3 (TC-024–TC-026) | ~15s |
| `intake-depth-a11y.spec.ts` | 4 (TC-027–TC-030) | ~20s |
| `intake-depth-i18n.spec.ts` | 2 (TC-031, TC-032) | ~10s |
| **Total** | **37 tests** | **~240s (4 min)** |

### Summary

- **37 test cases** covering all 25 BRD acceptance criteria
- **20 new POM locators** in new `IntakePage.ts`
- **8 new spec files** in `tests/regression/` (or new `tests/intake/` directory)
- **4 dev requirements** for testability (`data-question-key`, `data-tier`, `data-step`, `aria-valuenow`)
- **Estimated runtime:** ~4 minutes (sequential), ~1.5 minutes (parallel workers)
- **All tests are progression** (new behavior, no regression overlap with existing trip output tests)
