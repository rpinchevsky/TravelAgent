# High-Level Design

**Change:** Relocate Hotel & Car Rental Assistance to a New Dedicated Step 2
**Date:** 2026-03-29
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-29_hotel-car-step-relocation/business_requirements.md`
**Status:** Draft

---

## 1. Overview

This change inserts a new wizard Step 2 ("Plan Your Stay & Travel") between Step 1 (Who's Traveling) and the current Step 2 (All Preferences questionnaire). The hotel and car rental assistance sections are relocated from Step 6 to the new Step 2, and all subsequent steps are renumbered (old 2->3, 3->4, 4->5, 5->6, 6->7, 7->8). The total step count increases from 8 (0-7) to 9 (0-8).

This is purely a **relocation and renumbering** change. No new UI components, visual styles, interaction patterns, or data formats are introduced. All existing hotel/car components (`.assistance-section`, `.option-grid`, `.chip-toggle`, `.range-slider`, `.depth-extra-question`) move unchanged. The `generateMarkdown()` output format is preserved because it reads DOM elements by ID/class, not by step position.

The change touches 4 categories:
1. **HTML restructuring** — new Step 2 panel, DOM relocation, step renumbering
2. **JavaScript updates** — navigation logic, step constants, stepper fill, selection reset, depth overlay flow
3. **Rule file updates** — step numbering in `trip_intake_rules.md` and `trip_intake_design.md`
4. **Automation updates** — POM locators, test spec step references
5. **i18n updates** — new keys for Step 2 title/description in 12 locale files

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Wizard step panels (HTML DOM) | `trip_intake.html` | Modified — new Step 2 section inserted, hotel/car sections cut from Step 6, all step `data-step` attributes renumbered |
| Stepper navigation (HTML) | `trip_intake.html` | Modified — new 9th stepper circle added for Step 2 |
| Step navigation (JS) | `trip_intake.html` | Modified — `totalSteps` 8->9, `goToStep()` step references, `stepEmojis` array, `activeSteps` array, depth overlay flow |
| Selection reset logic (JS) | `trip_intake.html` | Modified — step number references in reset triggers (2->3, 3->4, 4->5) |
| Depth overlay navigation (JS) | `trip_intake.html` | Modified — post-overlay advance target, capture-phase intercept step check |
| Context bar (JS) | `trip_intake.html` | Modified — hide condition changes from step 7 to step 8 |
| `generateMarkdown()` (JS) | `trip_intake.html` | Verified — no changes needed (uses IDs/classes, not step numbers) |
| Assistance section JS (JS) | `trip_intake.html` | Verified — no changes needed (uses `toggleKey`/`bodyId`, not step numbers) |
| Rule file — business rules | `trip_intake_rules.md` | Modified — Wizard Flow heading, step descriptions, supplementary fields table, step visibility rules, reset rule, output format note, two-phase description |
| Rule file — design spec | `trip_intake_design.md` | Modified — Step Layouts section, Progress Stepper, Assistance Section location references, Depth Selector focus target, all step number references |
| i18n catalogs | `locales/ui_*.json` (12 files) | Modified — new keys `s2_title`, `s2_desc`, `step_stay` |
| Page Object Model | `automation/code/tests/pages/IntakePage.ts` | Modified — step number comments, `reviewStep` locator, `navigateToStep()` step 2 sub-step handling now targets step 3, context bar hide step reference |
| Test specs (hotel/car) | `automation/code/tests/intake/intake-hotel-car-assistance.spec.ts` | Modified — step navigation targets, step number assertions |
| Test specs (hotel/car i18n) | `automation/code/tests/intake/intake-hotel-car-i18n.spec.ts`, `intake-hotel-car-i18n-keys.spec.ts` | Modified — step navigation if used |
| Test specs (depth stepper) | `automation/code/tests/intake/intake-depth-stepper.spec.ts` | Modified — stepper count assertions (8->9) |
| Test specs (structure) | `automation/code/tests/intake/intake-structure.spec.ts` | Modified — step count assertions |
| Test specs (functional) | `automation/code/tests/intake/intake-functional.spec.ts` | Modified — step references in context bar tests |
| Test specs (depth questions) | `automation/code/tests/intake/intake-depth-questions.spec.ts` | Modified — step references |
| Test specs (wheelchair) | `automation/code/tests/intake/intake-wheelchair.spec.ts` | Modified — step 6->7 references |
| Test specs (design spec) | `automation/code/tests/intake/intake-design-spec.spec.ts` | Modified — step references |
| Test specs (general) | Multiple spec files | Reviewed — any hardcoded step number references updated |

## 3. Data Flow

The wizard data flow does not change structurally. The only difference is the step at which hotel/car data is collected shifts from position 6 to position 2 in the user journey.

```
Step 0 (Where & When)
  |
  v  [destination, dates]
Step 1 (Who's Traveling)
  |
  v  [travelers array]
[Depth Selector Overlay] → sets question depth
  |
  v
Step 2 (Plan Your Stay & Travel)     ← NEW: hotel/car data collected here
  |
  v  [hotel toggle + 7 sub-Qs, car toggle + 6 sub-Qs]
Step 3 (All Preferences questionnaire, formerly Step 2)
  |
  v  [30 preference answers]
Step 4 (Interests cards, formerly Step 3)
  |
  v  [selected interest chips]
Step 5 (Things to Avoid cards, formerly Step 4)
  |
  v  [selected avoid chips]
Step 6 (Food & Dining cards, formerly Step 5)
  |
  v  [food experience + vibe selections]
Step 7 (Language & Extras, formerly Step 6, minus hotel/car)
  |
  v  [report language, notes, accessibility, wheelchair]
Step 8 (Review & Download, formerly Step 7)
  |
  v  [generateMarkdown() → .md file download]
```

**Key data flow facts:**
- `generateMarkdown()` reads hotel/car values by element IDs (`#hotelAssistanceSection`, `#hotelSubQuestions`, `#hotelBudgetSlider`, `#carAssistanceSection`, `#carSubQuestions`, `#carBudgetSlider`, etc.) and by `data-question-key` attribute selectors. These IDs and attributes do not change, so markdown output is unaffected by the DOM relocation.
- The assistance section JS (`initAssistanceSections()`) uses `toggleKey` and `bodyId` parameters, not step numbers. No changes needed.
- Selection reset logic in `goToStep()` references step numbers directly (e.g., `currentStep === 2` to clear interest/avoid selections). These hardcoded numbers must all shift +1.

## 4. Integration Points

| Integration Point | Contract | Impact |
|---|---|---|
| `goToStep(step)` | Step number 0-7 → step panel shown | Now 0-8 — `totalSteps` changes from 8 to 9 |
| `stepEmojis` array | Index = step number, value = emoji HTML | Must grow from 8 to 9 entries, new entry at index 2 |
| `activeSteps` array | Lists all active step numbers | Must include 9 entries [0,1,2,3,4,5,6,7,8] |
| Depth overlay confirm | Advances to first active step after Step 1 | Now advances to Step 2 (logistics), not Step 2 (questionnaire) |
| Capture-phase intercept | Fires depth overlay on Step 1 Continue | Unchanged — still fires when `currentStep === 1` |
| `generateMarkdown()` patch | Reads answers by element ID/class | Unchanged — IDs don't change |
| Context bar visibility | Hides on Step 0 and last step | Last step changes from 7 to 8 |
| Auto-advance after last questionnaire question | `goToStep(3)` | Now must be `goToStep(4)` — advances to Interests step |
| Back button on questionnaire step | Falls through to `goToStep(currentStep - 1)` | Must check `currentStep === 3` instead of `currentStep === 2` |
| Selection reset triggers | `currentStep === 2/3/4` in `goToStep()` | Shift to `currentStep === 3/4/5` |
| `rebuildStyleSubDots()` | Updates `[data-step="2"] .step__desc` | Must update `[data-step="3"] .step__desc` |
| Progress bar fill on Step 7 review | `step === totalSteps - 1` | Now step 8 — formula already uses `totalSteps - 1` so it auto-adjusts with `totalSteps=9` |
| Stepper click navigation | Handled by depth navigation patch | Uses `activeSteps` array — auto-adjusts |

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| User journey | Hotel/car moved from step 6 to step 2 in user flow | No — intentional UX change, not a bug |
| Step numbering | All steps after 1 shift by +1 | No — breaking change to all step references |
| Generated markdown | Identical output format | Yes — no change to markdown structure |
| DOM IDs and classes | All hotel/car element IDs preserved | Yes — IDs don't change |
| CSS | No CSS changes needed | Yes — all classes reused |
| i18n keys for hotel/car | Existing `s6_hotel_*` and `s6_car_*` keys unchanged | Yes — keys are not step-numbered |
| i18n keys for step titles | Existing `s2_title`/`s2_desc` repurposed; old meanings shift | No — `s2_title` was "What's Your Travel Style?" and becomes "Plan Your Stay & Travel". The old Step 2 content moves to `s3_title`/`s3_desc`. |
| Automation tests | All step number references must be updated | No — tests will fail without update |
| Rule files | All step number references must be updated | No — rules will be inaccurate without update |

**i18n key renumbering strategy:** The existing `s2_title` and `s2_desc` keys are repurposed for the new Step 2 content. The old values ("What's Your Travel Style?" / "Quick questions to understand your perfect trip.") move to `s3_title` and `s3_desc`. Similarly, `s3_*` -> `s4_*`, etc. through `s7_*` -> `s8_*`. This requires updating all 12 locale files. Alternatively, the HTML `data-i18n` attributes can be renumbered to match the new step positions without changing the i18n key names — this is the preferred approach to minimize locale file churn (see Detailed Design for the chosen strategy).

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Create New Step 2 | Yes | §2 (HTML panel), §3 (data flow), §4 (stepper entry) |
| REQ-002: Relocate Hotel Assistance | Yes | §2 (DOM relocation), §3 (data flow position) |
| REQ-003: Relocate Car Rental Assistance | Yes | §2 (DOM relocation), §3 (data flow position) |
| REQ-004: Renumber All Subsequent Steps | Yes | §2 (all affected files), §4 (integration points), §5 (backward compat) |
| REQ-005: Update Stepper to 9 Steps | Yes | §2 (stepper HTML), §4 (stepEmojis, activeSteps, fill calc) |
| REQ-006: Remove Hotel & Car from Step 7 | Yes | §2 (DOM relocation removes from old step), §3 (data flow) |
| REQ-007: Preserve Markdown Output | Yes | §3 (generateMarkdown uses IDs), §4 (contract preserved), §5 (backward compat) |
| REQ-008: Navigation Continuity | Yes | §4 (depth overlay, Continue/Back, context bar) |
| REQ-009: Sub-step Auto-advance in Step 3 | Yes | §4 (auto-advance target, back button) |
| REQ-010: Selection Reset Rule Update | Yes | §4 (reset triggers shift +1) |
| REQ-011: Update Rule Files | Yes | §2 (rule files listed as affected) |
| REQ-012: Automation Test Updates | Yes | §2 (all affected test specs listed) |
