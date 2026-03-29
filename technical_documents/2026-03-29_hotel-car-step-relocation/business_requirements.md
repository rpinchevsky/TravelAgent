# Business Requirements Document

**Change:** Relocate Hotel & Car Rental Assistance to a New Dedicated Step 2
**Date:** 2026-03-29
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

Hotel and car rental assistance features are currently buried in Step 6 ("Language & Extras"), a grab-bag step that mixes logistics decisions with supplementary preferences. Users think about accommodation and transport early in the planning process — right after defining where/when (Step 0) and who (Step 1). Placing hotel and car selections alongside language choice, extra notes, and accessibility creates a discoverability problem and violates the natural planning sequence.

Moving these features into a dedicated Step 2 ("Plan Your Stay & Travel") creates a clear logistics cluster (Steps 0-1-2) before the preference/interest phases begin. A dedicated step with its own stepper icon ensures users notice and engage with these options.

## 2. Scope

**In scope:**
- New Step 2 with dedicated stepper icon and title
- Relocation of Hotel Assistance and Car Rental Assistance sections (toggle + all sub-questions) from current Step 6 to new Step 2
- Renumbering of all subsequent steps (current 2->3, 3->4, 4->5, 5->6, 6->7, 7->8)
- Stepper navigation updated to 9 steps (0-8)
- All i18n keys for the new step title/description
- Rule file updates to reflect new step numbering
- Automation test step reference updates

**Out of scope:**
- Changing the visual design or behavior of the Hotel/Car assistance components themselves (toggles, sub-questions, option grids, chip selects, range sliders, collapsible sections)
- Changing the markdown output format (hotel/car sections still appear in the same position and format in generated markdown)
- Adding new hotel/car sub-questions or options
- Changing the depth tier system (hotel/car remain supplementary, not depth-gated)
- Changing the two-phase design principle (Data & Questions vs. Card Selection) — the new Step 2 is a logistics step that fits within the Data & Questions phase

**Affected rule files:**
- `trip_intake_rules.md` — Wizard Flow section (step numbering, step descriptions, supplementary fields table, step visibility rules, output format conditional note)
- `trip_intake_design.md` — Step Layouts section, Progress Stepper, Assistance Section, Wheelchair Accessibility, Depth Extra Questions, Context Bar, progress bar calculation, step-related references throughout
- `locales/ui_*.json` (12 files) — new i18n keys for Step 2 title and description

## 3. Requirements

### REQ-001: Create New Step 2 — "Plan Your Stay & Travel"

**Description:** Insert a new wizard step at position 2 (between current Step 1 "Who's Traveling" and current Step 2 "All Preferences"). The step must have a dedicated stepper icon, a translatable title, and a translatable description.

**Acceptance Criteria:**
- [ ] AC-1: A step element with `data-step="2"` exists in the DOM with the class `wizard-step` (or equivalent step container class)
- [ ] AC-2: The stepper displays a dedicated icon for Step 2 (hotel/travel-themed emoji, e.g., a building/hotel emoji)
- [ ] AC-3: The step title element contains a `data-i18n` attribute with a key for "Plan Your Stay & Travel" (or equivalent)
- [ ] AC-4: The step description element contains a `data-i18n` attribute with a key explaining the step's purpose
- [ ] AC-5: All 12 `locales/ui_{lang}.json` files contain the new i18n keys with appropriate translations (en, ru, he translated; other 9 with English fallback)
- [ ] AC-6: The step is always visible in the stepper regardless of depth selection (supplementary step, not depth-gated)

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — DOM structure, stepper configuration
- `locales/ui_*.json` — 12 locale files
- `trip_intake_rules.md` — Wizard Flow section
- `trip_intake_design.md` — Step Layouts section

---

### REQ-002: Relocate Hotel Assistance Section to Step 2

**Description:** Move the entire Hotel Assistance section (toggle card + 7 sub-questions: hotelType, hotelLocation, hotelStars, hotelAmenities, hotelPets, hotelCancellation, hotelBudget) from its current position in Step 6 to the new Step 2. All functionality must be preserved identically.

**Acceptance Criteria:**
- [ ] AC-1: The `#hotelAssistanceSection` element is a child of the new Step 2 container (not Step 7, the former Step 6)
- [ ] AC-2: The hotel assistance toggle (2-option card) renders and toggles correctly in Step 2
- [ ] AC-3: Toggling "Yes" on hotel assistance expands the sub-question body (`.assistance-section__body.is-expanded`) within Step 2
- [ ] AC-4: All 7 hotel sub-questions are present and interactive: hotelType (card grid 12), hotelLocation (q-card 5), hotelStars (q-card 4), hotelAmenities (chips 12), hotelPets (toggle 2), hotelCancellation (q-card 3), hotelBudget (range slider)
- [ ] AC-5: Collapsing (toggling "No") resets all hotel child selections to defaults
- [ ] AC-6: All hotel-related i18n keys render correctly in all 12 languages when the step is active

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — DOM relocation of hotel section
- `trip_intake_rules.md` — Step 6 field table, Supplementary Fields table

---

### REQ-003: Relocate Car Rental Assistance Section to Step 2

**Description:** Move the entire Car Rental Assistance section (toggle card + 6 sub-questions: carCategory, carTransmission, carFuel, carPickup, carExtras, carBudget) from its current position in Step 6 to the new Step 2. All functionality must be preserved identically.

**Acceptance Criteria:**
- [ ] AC-1: The `#carAssistanceSection` element is a child of the new Step 2 container (not Step 7, the former Step 6)
- [ ] AC-2: The car rental toggle (2-option card) renders and toggles correctly in Step 2
- [ ] AC-3: Toggling "Yes" on car rental expands the sub-question body (`.assistance-section__body.is-expanded`) within Step 2
- [ ] AC-4: All 6 car sub-questions are present and interactive: carCategory (card grid 14), carTransmission (q-card 3), carFuel (q-card 5), carPickup (q-card 4), carExtras (chips 7), carBudget (range slider)
- [ ] AC-5: Collapsing (toggling "No") resets all car child selections to defaults
- [ ] AC-6: All car-related i18n keys render correctly in all 12 languages when the step is active

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — DOM relocation of car section
- `trip_intake_rules.md` — Step 6 field table, Supplementary Fields table

---

### REQ-004: Renumber All Subsequent Steps (2->3 through 7->8)

**Description:** All steps after the new Step 2 must be renumbered. The current Step 2 (All Preferences) becomes Step 3, current Step 3 (Interests) becomes Step 4, current Step 4 (Avoids) becomes Step 5, current Step 5 (Food & Dining) becomes Step 6, current Step 6 (Language & Extras) becomes Step 7, and current Step 7 (Review & Download) becomes Step 8.

**Acceptance Criteria:**
- [ ] AC-1: The wizard contains exactly 9 step elements with `data-step` values 0 through 8
- [ ] AC-2: Step 3 contains the one-by-one questionnaire (formerly Step 2) with sub-step dots and auto-advance
- [ ] AC-3: Step 4 contains the Interests card selection grid (formerly Step 3)
- [ ] AC-4: Step 5 contains the Things to Avoid card selection grid (formerly Step 4)
- [ ] AC-5: Step 6 contains the Food & Dining card selection grid (formerly Step 5)
- [ ] AC-6: Step 7 contains Language, Extra Notes, Photography, Accessibility, and Wheelchair fields (formerly Step 6) — but NOT hotel or car sections
- [ ] AC-7: Step 8 contains the Review & Download panel (formerly Step 7)
- [ ] AC-8: All `data-step` attributes in the DOM are correctly renumbered

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — all step containers, all step references in JS
- `trip_intake_rules.md` — entire Wizard Flow section, all step references
- `trip_intake_design.md` — all step references throughout

---

### REQ-005: Update Stepper Navigation to 9 Steps

**Description:** The progress stepper must display 9 step circles (Steps 0-8) instead of the current 8 (Steps 0-7). The `stepEmojis` array must include the new Step 2 icon. The stepper fill calculation, step circle states, and line width must account for the additional step.

**Acceptance Criteria:**
- [ ] AC-1: The stepper renders exactly 9 circle elements (`.stepper__step`) when all steps are visible
- [ ] AC-2: The `stepEmojis` array contains 9 entries with the new Step 2 emoji at index 2
- [ ] AC-3: The stepper fill percentage reaches 100% on Step 8 (the final step)
- [ ] AC-4: The progress bar (`progress-bar__fill`) reaches 100% on Step 8
- [ ] AC-5: Each stepper circle transitions correctly through pending -> active -> done states
- [ ] AC-6: Step labels on the stepper are correct for all 9 steps

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — stepper DOM, `stepEmojis` array, `goToStep()` function, progress bar calculation
- `trip_intake_design.md` — Progress Stepper section

---

### REQ-006: Remove Hotel & Car Sections from Step 7 (Formerly Step 6)

**Description:** After relocation, the former Step 6 (now Step 7, "Language & Extras") must retain only: Report Language, POI Languages, Additional Notes, Photography, Accessibility, Wheelchair Accessible. The Hotel Assistance and Car Rental Assistance sections must be completely absent from this step.

**Acceptance Criteria:**
- [ ] AC-1: Step 7 does NOT contain any element with id `hotelAssistanceSection`
- [ ] AC-2: Step 7 does NOT contain any element with id `carAssistanceSection`
- [ ] AC-3: Step 7 contains the Report Language dropdown (`reportLang` or equivalent)
- [ ] AC-4: Step 7 contains the Additional Notes textarea
- [ ] AC-5: Step 7 contains the Photography question (3-option card)
- [ ] AC-6: Step 7 contains the Accessibility question (3-option card)
- [ ] AC-7: Step 7 contains the Wheelchair Accessible question (2-option card)

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — DOM removal from step 7
- `trip_intake_rules.md` — Step 6 field table

---

### REQ-007: Preserve Markdown Output Format

**Description:** The `generateMarkdown()` function must continue to produce identical output regardless of the DOM relocation. The `## Hotel Assistance` and `## Car Rental Assistance` sections must appear in the same position and format in the generated markdown. The conditional logic (only include if toggle is "Yes") must still work.

**Acceptance Criteria:**
- [ ] AC-1: When hotel toggle is "Yes" and car toggle is "Yes", the generated markdown contains both `## Hotel Assistance` and `## Car Rental Assistance` sections with all sub-fields
- [ ] AC-2: When hotel toggle is "No" and car toggle is "No", the generated markdown omits both sections entirely
- [ ] AC-3: The markdown section order is unchanged: Trip Details > Travelers > Language > Additional Notes > Additional Preferences > Hotel Assistance > Car Rental Assistance
- [ ] AC-4: All hotel/car sub-field values are correctly read from the relocated DOM elements
- [ ] AC-5: The downloaded filename format is unchanged (`{name}_trip_details_{date}.md`)

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — `generateMarkdown()` function (verify selectors still work after DOM move)

---

### REQ-008: Navigation Continuity (Continue/Back)

**Description:** The Continue and Back buttons must navigate correctly through the full 9-step sequence (0->1->2->3->...->8 and reverse). Validation gates must trigger at the correct steps. The depth selector overlay must still appear between Step 1 and Step 3 (the questionnaire, formerly Step 2).

**Acceptance Criteria:**
- [ ] AC-1: Clicking Continue on Step 1 triggers the depth selector overlay (before proceeding to Step 3)
- [ ] AC-2: After depth selection, the wizard advances to Step 3 (the questionnaire)
- [ ] AC-3: Clicking Continue on Step 2 advances to Step 3 (no validation gate on Step 2 — hotel/car are optional)
- [ ] AC-4: Clicking Back on Step 3 returns to Step 2 (not to the depth selector)
- [ ] AC-5: Clicking Back on Step 2 returns to Step 1
- [ ] AC-6: The full forward sequence 0->1->depth->2->3->4->5->6->7->8 is navigable
- [ ] AC-7: The full backward sequence 8->7->6->5->4->3->2->1->0 is navigable
- [ ] AC-8: Step 0 validation (destination + dates) still blocks forward navigation
- [ ] AC-9: Step 1 validation (name + birth year) still blocks forward navigation

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — navigation logic, Continue/Back handlers, depth overlay trigger, `goToStep()` step routing

---

### REQ-009: Sub-step Auto-advance in Step 3 (Formerly Step 2)

**Description:** The one-by-one questionnaire with sub-step dots and auto-advance must function correctly at its new position (Step 3). Sub-step dot navigation, question slide animations, and the auto-advance to Step 4 (card selection) after the last question must all work.

**Acceptance Criteria:**
- [ ] AC-1: Sub-step dots (`.sub-dots`) render correctly within Step 3
- [ ] AC-2: Selecting an answer auto-advances to the next question after the 400ms delay
- [ ] AC-3: After answering the last visible question, the wizard auto-advances to Step 4 (Interests)
- [ ] AC-4: Sub-step dot count matches the number of visible questions at the selected depth
- [ ] AC-5: Navigating back from Step 4 returns to Step 3 and shows the last answered question

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — sub-step logic, auto-advance target step references

---

### REQ-010: Selection Reset Rule Update

**Description:** The existing reset rule states: "When the user leaves the questionnaire step (Step 2), all saved interest/avoid selections are cleared." This must now reference Step 3. Manual selections preserved when navigating between the card selection steps (now Steps 4-5-6) must also reference the new numbers.

**Acceptance Criteria:**
- [ ] AC-1: Leaving Step 3 (questionnaire) clears saved interest/avoid selections
- [ ] AC-2: Navigating between Steps 4, 5, and 6 preserves manual card selections
- [ ] AC-3: Returning from Step 3 to Step 2 does NOT clear selections (Step 2 is logistics, not questionnaire)

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — selection reset logic referencing step numbers
- `trip_intake_rules.md` — Reset rule text

---

### REQ-011: Update Rule Files with New Step Numbering

**Description:** Both `trip_intake_rules.md` and `trip_intake_design.md` must be updated to reflect the new 9-step wizard structure. All step number references, step descriptions, field-to-step mappings, and supplementary fields tables must be accurate.

**Acceptance Criteria:**
- [ ] AC-1: `trip_intake_rules.md` "Wizard Flow (8 Steps)" heading updated to "Wizard Flow (9 Steps)"
- [ ] AC-2: `trip_intake_rules.md` step list shows Steps 0-8 with correct descriptions
- [ ] AC-3: `trip_intake_rules.md` Step 2 section describes "Plan Your Stay & Travel" with hotel and car assistance fields
- [ ] AC-4: `trip_intake_rules.md` Step 7 section describes "Language & Extras" WITHOUT hotel/car fields
- [ ] AC-5: `trip_intake_rules.md` Supplementary Fields table maps hotel/car fields to Step 2 (not Step 6)
- [ ] AC-6: `trip_intake_rules.md` Step Visibility Rules reference Step 3 for the questionnaire auto-skip logic
- [ ] AC-7: `trip_intake_design.md` all step references updated (Step Layouts, Progress Stepper, Context Bar, etc.)
- [ ] AC-8: `trip_intake_rules.md` conditional note about hotel/car output references Step 2 toggle (not Step 6)
- [ ] AC-9: Two-phase design description updated: Phase 1 (Data & Questions) covers Steps 0-3, Phase 2 (Card Selection) covers Steps 4-6

**Priority:** Must-have

**Affected components:**
- `trip_intake_rules.md` — Wizard Flow, Step descriptions, Supplementary Fields, Step Visibility, Output Format
- `trip_intake_design.md` — Step Layouts, Progress Stepper, Assistance Section, Context Bar, all step references

---

### REQ-012: Automation Test Step Reference Updates

**Description:** All existing automation tests that reference step numbers must be updated to reflect the new numbering. Tests must pass with the new 9-step structure.

**Acceptance Criteria:**
- [ ] AC-1: All automation tests that navigate to specific steps use the correct new step numbers
- [ ] AC-2: Tests that assert hotel/car sections exist reference Step 2 (not Step 6/7)
- [ ] AC-3: Tests that assert Step 7 (Language & Extras) content do NOT expect hotel/car sections
- [ ] AC-4: Tests that validate the stepper expect 9 steps (0-8)
- [ ] AC-5: All existing automation tests pass after the update

**Priority:** Must-have

**Affected components:**
- Automation test files (Playwright specs, `TripPage.ts` page object)

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Hotel/car JS event handlers may reference parent step number for toggle/collapse logic | Dev must audit all event delegation and ensure handlers work regardless of parent step container |
| `generateMarkdown()` may use step-relative DOM traversal to find hotel/car elements | Dev must verify all selectors use IDs or classes, not step-positional queries |
| Depth selector overlay trigger is currently tied to "leaving Step 1" — inserting Step 2 between Step 1 and the questionnaire may break the trigger | Dev must ensure depth overlay fires between Step 1 and Step 3 (the questionnaire), with Step 2 navigable without triggering the overlay |
| Context bar pills may reference step numbers for scroll-back navigation | Dev must update context bar step references |
| Progress bar fill calculation uses `totalSteps` — must account for 9 steps | Dev must update `goToStep()` and progress bar formula |
| Large DOM relocation may break CSS selectors that assume hotel/car are inside a specific step's scope | SA will review CSS selector isolation in architecture review |
| Reset logic for card selections references "leaving Step 2" — must now reference Step 3 | Dev must update all step-number constants in reset logic |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-29 | Approved |
