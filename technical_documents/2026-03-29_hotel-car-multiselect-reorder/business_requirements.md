# Business Requirements Document

**Change:** Hotel/Car Multi-Select and Step Reorder
**Date:** 2026-03-29
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

User feedback indicates that travelers often need multiple accommodation types (e.g., hotel for the first half, Airbnb for the second) and multiple car categories (e.g., compact for city driving and SUV for countryside). The current intake wizard forces a single selection for both Accommodation Type (H1) and Car Category (C1), which does not reflect real-world booking behavior.

Additionally, the user expects to answer the hotel/car logistics questions **before** being asked how many preference questions they want (the depth selector overlay). The current flow places the depth selector between Step 1 and Step 2, meaning users commit to a question count before they have provided their stay/travel context. Moving the hotel/car step earlier makes the depth decision more informed.

## 2. Scope

**In scope:**
- Change Accommodation Type (H1) from single-select to multi-select
- Change Car Category (C1) from single-select to multi-select
- Reorder the wizard flow: Step 2 (Hotel/Car) moves before the depth selector overlay
- Update markdown output to emit comma-separated lists for multi-select fields
- Update all affected rule files and design specs to reflect the new behavior

**Out of scope:**
- Changing selection behavior of any other hotel/car sub-questions (H2-H7, C2-C6 remain single-select)
- Adding new accommodation types or car categories
- Changing the depth selector overlay itself (its options, UI, or behavior)
- Changing Step 3 questionnaire content or ordering

**Affected rule files:**
- `trip_intake_rules.md` -- Section "Wizard Flow", Step 2 description, Supplementary Fields table, Output Format (Hotel Assistance / Car Rental Assistance sections)
- `trip_intake_design.md` -- Section "Option Grid", Step 2 design, Assistance Section component
- `trip_intake.html` -- Step 2 DOM (option-grid click behavior), q-card click handler (line ~4957), `generateMarkdown()` output for hotelType and carCategory, depth overlay trigger hook (line ~7315), step transition logic

## 3. Requirements

### REQ-001: Accommodation Type (H1) Multi-Select

**Description:** The Accommodation Type field (`hotelType`) must allow the user to select multiple options simultaneously. Currently it uses radio behavior (selecting one deselects all others). It must switch to toggle behavior where clicking a selected card deselects it, and clicking an unselected card selects it, without affecting other selections.

**Acceptance Criteria:**
- [ ] AC-1: User can select 2 or more accommodation types simultaneously (e.g., Hotel + Airbnb + Resort)
- [ ] AC-2: Clicking an already-selected accommodation type deselects it (toggle off)
- [ ] AC-3: Clicking an unselected accommodation type selects it without clearing other selections
- [ ] AC-4: Visual state (`.is-selected` class, border highlight, background tint) applies independently to each selected card
- [ ] AC-5: All 12 accommodation types can be selected simultaneously (no max limit)
- [ ] AC-6: If no types are selected, the markdown output shows "Not specified"

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` -- q-card click handler, option-grid container for hotelType
- `trip_intake_rules.md` -- Step 2 field table (change "card grid 12" description to indicate multi-select)
- `trip_intake_design.md` -- Option Grid component spec

---

### REQ-002: Car Category (C1) Multi-Select

**Description:** The Car Category field (`carCategory`) must allow the user to select multiple options simultaneously. Same toggle behavior as REQ-001: clicking toggles selection on/off without affecting other cards.

**Acceptance Criteria:**
- [ ] AC-1: User can select 2 or more car categories simultaneously (e.g., Compact + SUV)
- [ ] AC-2: Clicking an already-selected car category deselects it (toggle off)
- [ ] AC-3: Clicking an unselected car category selects it without clearing other selections
- [ ] AC-4: Visual state (`.is-selected` class) applies independently to each selected card
- [ ] AC-5: All 14 car categories can be selected simultaneously (no max limit)
- [ ] AC-6: If no categories are selected, the markdown output shows "Not specified"

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` -- q-card click handler, option-grid container for carCategory
- `trip_intake_rules.md` -- Step 2 field table (change "card grid 14" description to indicate multi-select)
- `trip_intake_design.md` -- Option Grid component spec

---

### REQ-003: Markdown Output for Multi-Select Fields

**Description:** The generated markdown must output comma-separated lists for Accommodation Type and Car Category when multiple values are selected. The current `generateMarkdown()` function uses `querySelector` (single element) for these fields; it must switch to `querySelectorAll` (multiple elements) and join with ", ".

**Acceptance Criteria:**
- [ ] AC-1: When 1 accommodation type is selected, output is: `- **Accommodation type:** Hotel`
- [ ] AC-2: When 2+ accommodation types are selected, output is comma-separated: `- **Accommodation type:** Hotel, Airbnb, Resort`
- [ ] AC-3: When 0 accommodation types are selected, output is: `- **Accommodation type:** Not specified`
- [ ] AC-4: Same comma-separated format applies to Car Category: `- **Car category:** Compact, SUV`
- [ ] AC-5: Order of items in the comma-separated list matches DOM order (left-to-right, top-to-bottom)
- [ ] AC-6: The output uses English `data-en-name` values regardless of UI language

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` -- `generateMarkdown()` function (hotelType and carCategory output blocks)
- `trip_intake_rules.md` -- Output Format section (Hotel Assistance / Car Rental Assistance field descriptions)

---

### REQ-004: Step Reorder -- Hotel/Car Before Depth Selector

**Description:** The wizard flow must be reordered so that Step 2 (Plan Your Stay & Travel) appears **before** the depth selector overlay. The current flow is: Step 0 -> Step 1 -> [depth overlay] -> Step 2 -> Step 3. The new flow must be: Step 0 -> Step 1 -> Step 2 -> [depth overlay] -> Step 3. This means:

1. After Step 1 validation passes, navigate directly to Step 2 (no overlay).
2. After Step 2's "Next" button is clicked, open the depth selector overlay.
3. After the depth overlay is confirmed, proceed to Step 3 (or the next active step per depth logic).

**Acceptance Criteria:**
- [ ] AC-1: Completing Step 1 and clicking "Continue" navigates to Step 2 (hotel/car) without showing the depth overlay
- [ ] AC-2: Clicking "Continue" on Step 2 opens the depth selector overlay
- [ ] AC-3: Confirming the depth overlay proceeds to Step 3 (or the first active step after Step 2)
- [ ] AC-4: The stepper shows the correct step sequence: Step 0, Step 1, Step 2, Step 3, Step 4...
- [ ] AC-5: Navigating backward from Step 3 returns to Step 2 (not the depth overlay)
- [ ] AC-6: Navigating backward from Step 2 returns to Step 1
- [ ] AC-7: The depth selector pill (re-entry) continues to work from any step after the overlay has been shown
- [ ] AC-8: The depth overlay "stepBeforeOverlay" tracks Step 2 (not Step 1) for correct return on re-entry

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` -- depth overlay trigger hook (currently intercepts Step 1 Continue at line ~7315), `goToStep` patching, `stepBeforeOverlay` logic
- `trip_intake_rules.md` -- Wizard Flow section (step ordering description)
- `trip_intake_design.md` -- Step flow documentation

---

### REQ-005: Reset Behavior Preservation for Multi-Select

**Description:** When the hotel or car assistance toggle is set to "No" (collapsed), all sub-question selections must reset, including multi-select fields. The existing reset logic (line ~5010) clears `.q-card.is-selected` within the body, which already handles multi-select. This requirement ensures the reset logic is verified to work correctly with multi-select behavior.

**Acceptance Criteria:**
- [ ] AC-1: Setting hotel toggle to "No" clears all selected accommodation types
- [ ] AC-2: Setting car toggle to "No" clears all selected car categories
- [ ] AC-3: Re-enabling the toggle shows a clean state with no pre-selected types/categories

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` -- assistance toggle reset handler (line ~5000)

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| q-card click handler is global (line ~4957) and applies radio behavior to ALL `.depth-extra-question` containers | Must scope multi-select toggle behavior specifically to `hotelType` and `carCategory` option-grids, leaving all other q-card groups in radio mode |
| Step reorder affects depth overlay's `stepBeforeOverlay` tracking and `findNearestActiveStep` logic | Must update the intercept hook to trigger on Step 2 Continue instead of Step 1 Continue, and verify backward navigation chain |
| Output format change (single value -> comma-separated list) may affect downstream `trip_planning_rules.md` consumers that parse the markdown | Verify that the trip generation pipeline handles comma-separated accommodation/car values gracefully |
| Existing automation tests for hotel/car may assert single-select behavior | Test specs in `intake-hotel-car-assistance.spec.ts` must be updated to validate multi-select |
| i18n: multi-select cards must all display translated names correctly when multiple are selected | No new i18n keys needed -- existing card translations cover this |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-29 | Approved |
