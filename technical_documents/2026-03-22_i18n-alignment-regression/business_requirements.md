# Business Requirements Document

**Change:** Fix DOB i18n placeholder bugs + add invariant-based regression tests
**Date:** 2026-03-22
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

Two bugs were discovered in `trip_intake.html` Step 1 (traveler cards) that slipped past the existing regression suite:

1. **DOB year/day placeholder keys leak in non-English UI.** When the user switches the UI language (e.g., to Russian or Hebrew), the DOB month dropdown placeholder is correctly re-rendered via the `languagechange` handler (line 3272), but the year and day dropdowns are *not* re-rendered. Their `<option>` placeholder text still shows the raw i18n key (e.g., `s1_dob_year`, `s1_dob_day`) instead of the translated label. This violates the **Language Consistency Rule** in `trip_intake_rules.md` §i18n: *"Every screen the user sees during trip customization must display entirely in the selected UI language. Mixed-language screens are a bug."*

2. **DOB field row is vertically misaligned with Name and Gender fields.** The `.dob-cell__label` sub-labels (Year / Month / Day) inside the DOB column push the dropdown elements lower than the Name `<input>` and Gender `<select>` in the same `.row--3` grid row. This creates a ragged baseline that degrades visual quality on Step 1.

The regression suite missed both issues because:
- TC-066 only validates month dropdown translation, not year or day.
- No generic test exists that scans all visible text for raw i18n key patterns — element-specific tests check one element at a time, so new UI additions can leak keys undetected.
- No structural test checks vertical alignment of form field rows on Step 1.

The user requests both code fixes *and* two new invariant-based regression tests that catch these categories of bugs generically, preventing future recurrence regardless of which element is affected.

## 2. Scope

**In scope:**
- Fix the `languagechange` event handler to re-render year and day dropdown placeholders (code bug)
- Fix the DOB field vertical alignment within `.row--3` so all three fields share a common baseline (code bug / CSS fix)
- Add a generic i18n key leak scanner test that checks ALL visible text on the page for raw key patterns
- Add a structural alignment test that validates form field rows in Step 1 share consistent vertical positioning

**Out of scope:**
- Refactoring the `setLanguage()` / `t()` function internals
- Adding new i18n keys or new language catalogs
- Changing the DOB field layout (3-column Year/Month/Day) or its data model
- Modifying any other steps (2-7) beyond what the generic scanner naturally covers
- Visual regression screenshots (these are supplement tests, not replacements for structural checks)

**Affected rule files:**
- `trip_intake_rules.md` — §i18n Language Consistency Rule (the rule being violated by Bug 1)
- `trip_intake_design.md` — Step 1 layout specification (the spec being violated by Bug 2)
- `automation/code/automation_rules.md` — §6.2 (shared-page fixture), §6.3 (batch assertions), §7 (language independence)

## 3. Requirements

### REQ-001: Fix DOB year/day `languagechange` handler

**Description:** The `languagechange` event handler in `trip_intake.html` currently re-renders only the month dropdown placeholder (`s1_dob_month`) with the translated value from `t()`. It must also re-render the year dropdown placeholder (`s1_dob_year`) and the day dropdown placeholder (`s1_dob_day`) for every `.traveler-card` on the page. The fix must preserve the user's currently selected year/day values (same pattern used for month: save value, rebuild `innerHTML`, restore value). This applies to both pre-rendered parent cards and dynamically added parent/child cards.

**Acceptance Criteria:**
- [ ] AC-1: After switching UI language to any non-English language, the year dropdown placeholder displays the translated `s1_dob_year` value (not the raw key).
- [ ] AC-2: After switching UI language to any non-English language, the day dropdown placeholder displays the translated `s1_dob_day` value (not the raw key).
- [ ] AC-3: Previously selected year/day values are preserved after a language switch (not reset to placeholder).
- [ ] AC-4: The fix applies to all traveler cards on the page — pre-rendered first parent, dynamically added parents, and dynamically added children.

**Priority:** Must-have
**Affected components:** `trip_intake.html` — `languagechange` event handler (currently at line 3261)

---

### REQ-002: Fix DOB field vertical alignment in Step 1

**Description:** The DOB column in `.row--3` (Name | Gender | DOB) contains `.dob-cell__label` sub-labels above each dropdown, which push the dropdowns lower than the adjacent Name input and Gender select. The CSS must be adjusted so that all three fields in the row share a visually consistent top alignment — the input/select controls should sit at the same vertical position. The fix must not remove the sub-labels (they are needed for UX clarity) but must compensate for their height so the row appears aligned.

**Acceptance Criteria:**
- [ ] AC-1: The top edge of the DOB year dropdown is within 5px of the top edge of the Name input and Gender select in the same `.row--3` grid row.
- [ ] AC-2: The fix works for both parent and child traveler cards.
- [ ] AC-3: The fix works in both LTR and RTL layouts (Hebrew, Arabic).
- [ ] AC-4: The `.dob-cell__label` sub-labels (Year, Month, Day) remain visible and readable.

**Priority:** Must-have
**Affected components:** `trip_intake.html` — CSS for `.row--3`, `.field`, `.dob-cell__label`

---

### REQ-003: Generic i18n key leak scanner test

**Description:** Add an invariant-based regression test that scans ALL visible text content on the intake page for raw i18n key patterns. The i18n key convention in this codebase is: strings matching the pattern `/^[a-z]\d+_[a-z]/` (e.g., `s1_dob_year`, `s3_title`, `s0_destination`). When `t()` cannot find a key in the loaded catalog, it returns the raw key as fallback — this is the leak mechanism. The test must detect ANY such leak across the entire page, not just specific elements. This is an invariant test: it tests the rule ("no raw keys visible") rather than specific elements.

**Acceptance Criteria:**
- [ ] AC-1: The test loads the intake page with a non-English language (any language other than English, since English keys and values may coincidentally match).
- [ ] AC-2: The test collects `textContent` from all visible elements on the page and checks for strings matching the i18n key pattern `/[a-z]\d+_[a-z]/`.
- [ ] AC-3: If any raw key is found in visible text, the test fails with a message identifying which element(s) contain the leaked key(s).
- [ ] AC-4: The test uses the shared-page fixture (`tests/fixtures/shared-page.ts`) since it is read-only DOM inspection (per automation_rules.md §6.2).
- [ ] AC-5: The test is language-agnostic — it does not assert on any specific translated string, only on the absence of raw key patterns (per automation_rules.md §7).
- [ ] AC-6: The test covers all steps/sections of the intake page that are present in the DOM (including hidden steps), not just the currently visible step.

**Priority:** Must-have
**Affected components:** New test file in `automation/code/tests/intake/`

---

### REQ-004: Form field alignment test for Step 1

**Description:** Add a structural regression test that validates vertical alignment of form fields within `.row--3` grid rows in Step 1 traveler cards. The test checks that the top edges of input/select controls within the same row are vertically consistent (within a tolerance). This is an invariant test: it tests the structural rule ("fields in the same row must be aligned") rather than a specific pixel value.

**Acceptance Criteria:**
- [ ] AC-1: The test locates all `.row--3` elements within Step 1 traveler cards.
- [ ] AC-2: For each `.row--3`, the test gets the bounding box top position of each `input` and `select` control within the row.
- [ ] AC-3: The test asserts that the maximum vertical difference between any two controls in the same row is no greater than 5px.
- [ ] AC-4: The test uses the shared-page fixture (`tests/fixtures/shared-page.ts`) since it is read-only DOM inspection (per automation_rules.md §6.2).
- [ ] AC-5: The test is language-agnostic — it makes no text-content assertions (per automation_rules.md §7).
- [ ] AC-6: The test uses `expect.soft()` with descriptive messages per row (per automation_rules.md §6.3).

**Priority:** Must-have
**Affected components:** New test file in `automation/code/tests/intake/`

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| REQ-003 depends on REQ-001 being fixed first — otherwise the scanner test will fail immediately on the known DOB key leak | Implement REQ-001 before running REQ-003 validation |
| REQ-004 depends on REQ-002 being fixed first — otherwise the alignment test will fail immediately on the known misalignment | Implement REQ-002 before running REQ-004 validation |
| The i18n key pattern `/[a-z]\d+_[a-z]/` must not produce false positives on legitimate visible text (e.g., CSS class names rendered as text, code snippets) | Pattern is scoped to `textContent` of visible elements only; CSS classes are not in `textContent`. The pattern `s1_dob_year` style is unique to this codebase's i18n keys |
| DOB year dropdown rebuild must regenerate the full year range (1940-current for parents, last 18 years for children) correctly | Year rebuild logic already exists in `populateDOBYear()` (line ~3650); the `languagechange` handler should call the same rebuild function |
| Alignment fix must not break RTL layout | AC explicitly requires RTL validation; test should cover both directions if feasible |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-22 | Approved |
