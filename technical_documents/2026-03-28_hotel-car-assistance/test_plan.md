# Test Plan

**Change:** Hotel Assistance & Car Rental Assistance — Optional Intake Sections
**Date:** 2026-03-28
**Author:** Automation Engineer
**BRD Reference:** business_requirements.md
**DD Reference:** detailed_design.md
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- Hotel Assistance toggle visibility, default state, expand/collapse behavior, and reset on collapse
- Car Rental Assistance toggle visibility, default state, expand/collapse behavior, and reset on collapse
- All 7 hotel sub-question renderings (card grids, q-cards, chips, toggle, range slider)
- All 6 car rental sub-question renderings (card grids, q-cards, chips, range slider)
- Single-select (radio) behavior for card grids and q-cards
- Multi-select behavior for chip toggles
- Dual-handle range slider: handle drag, keyboard arrows, cross-prevention
- Markdown output: conditional Hotel Assistance section presence/absence
- Markdown output: conditional Car Rental Assistance section presence/absence
- Markdown output: field value accuracy (English data-en-name values)
- i18n key presence in all 12 locale files (93 new keys)
- data-i18n attribute presence on all new DOM elements
- Section ordering within Step 6 (Hotel after Wheelchair, Car after Hotel)
- Visibility at all depth levels (supplementary — not tier-gated)

**Out of scope:**
- RTL layout mirroring (covered by existing `intake-rtl.spec.ts` — existing spec will automatically pick up new sections)
- Dark mode rendering (covered by existing `intake-darkmode.spec.ts`)
- Visual regression screenshots (covered by existing `intake-visual-consistency.spec.ts`)
- Responsive breakpoints (covered by existing `intake-design-spec.spec.ts`)
- Trip generation pipeline consumption of new markdown sections (future scope per BRD)
- Actual hotel booking or car rental integrations

**Test type:** Progression (all new functionality)

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Standard `@playwright/test` import (tests mutate page state via clicks)
- **Target:** `http://localhost:3456/trip_intake.html` (intake wizard page, NOT trip HTML)
- **POM:** `IntakePage.ts` (existing, will need new locators added)

## 3. Test Cases

### TC-201: Hotel Assistance section visible on Step 6 at all depth levels

**Traces to:** REQ-001 → AC-1; REQ-011 → AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake page, complete Step 0 and Step 1, select depth, navigate to Step 6

**Steps:**
1. For each depth level [10, 20, 30]: set up with that depth, navigate to Step 6
2. Assert `#hotelAssistanceSection` is visible
3. Assert the section header element with `data-i18n="s6_hotel_header"` is visible

**Expected result:**
- Hotel Assistance section is visible at all three depth levels

**Implementation notes:**
- Data-driven loop over depths. Use `beforeEach` per test since each requires fresh page navigation.

---

### TC-202: Hotel toggle defaults to "No" with sub-questions hidden

**Traces to:** REQ-001 → AC-2, AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 6 at any depth (e.g., 20)

**Steps:**
1. Locate the hotel toggle question (`data-question-key="hotelAssistToggle"`)
2. Assert it contains exactly 2 q-cards
3. Assert the `data-value="no"` card has class `is-selected`
4. Assert the `data-value="yes"` card does NOT have class `is-selected`
5. Assert `#hotelSubQuestions` does NOT have class `is-expanded`

**Expected result:**
- Default toggle is "No", sub-questions body is collapsed

**Implementation notes:**
- Single test with `expect.soft()` for batched assertions.

---

### TC-203: Hotel toggle "Yes" reveals 7 sub-questions with expand animation

**Traces to:** REQ-001 → AC-4; REQ-002 → AC-1
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- On Step 6, hotel toggle is at default ("No")

**Steps:**
1. Click the "Yes" q-card within `hotelAssistToggle`
2. Assert `#hotelSubQuestions` has class `is-expanded`
3. Assert all 7 sub-question containers are present inside `#hotelSubQuestions` by `data-question-key`: `hotelType`, `hotelLocation`, `hotelStars`, `hotelAmenities`, `hotelPets`, `hotelCancellation`, `hotelBudget`

**Expected result:**
- Sub-questions body is expanded, all 7 question containers exist

**Implementation notes:**
- Use `expect.soft()` for each sub-question key check. Use web-first `toBeVisible()` after the click to wait for transition.

---

### TC-204: Hotel toggle "No" collapses and resets all hotel selections

**Traces to:** REQ-001 → AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- On Step 6, hotel toggle set to "Yes", some sub-questions filled

**Steps:**
1. Click hotel "Yes" toggle to expand
2. Select a hotel type card (e.g., first `.option-grid .q-card` in `hotelType`)
3. Select a hotel amenity chip (e.g., first `.chip-toggle` in `#hotelAmenitiesChips`)
4. Click hotel "No" toggle
5. Assert `#hotelSubQuestions` does NOT have class `is-expanded`
6. Assert no `.q-card.is-selected` inside `#hotelSubQuestions` (except hotelPets "No" default)
7. Assert no `.chip-toggle.is-selected` inside `#hotelSubQuestions`
8. Assert hotel budget slider `data-min-val` equals `data-min` and `data-max-val` equals `data-max`

**Expected result:**
- Sub-questions collapsed, all selections cleared to defaults, slider reset to full range, pets toggle reset to "No"

**Implementation notes:**
- Must re-expand and verify cleared state by checking DOM attributes via `page.evaluate()`.

---

### TC-205: Hotel sub-question option counts and UI types

**Traces to:** REQ-002 → AC-2 through AC-8
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 6, hotel toggle set to "Yes"

**Steps:**
1. Count `.option-grid .q-card` inside `hotelType` — expect 12
2. Count `.question-options .q-card` inside `hotelLocation` — expect 5
3. Count `.question-options .q-card` inside `hotelStars` — expect 4
4. Count `.chip-toggle` inside `#hotelAmenitiesChips` — expect 12
5. Count `.question-options .q-card` inside `hotelPets` — expect 2
6. Count `.question-options .q-card` inside `hotelCancellation` — expect 3
7. Assert `#hotelBudgetSlider` exists with `data-min="30"`, `data-max="1000"`, `data-step="10"`, `data-prefix="$"`

**Expected result:**
- All option counts match BRD specification; slider attributes are correct

**Implementation notes:**
- Single test with `expect.soft()` for each assertion. Data-driven approach with array of `{ key, selector, expectedCount }`.

---

### TC-206: Hotel card grid single-select (radio) behavior

**Traces to:** REQ-002 → AC-2
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 6, hotel toggle set to "Yes"

**Steps:**
1. Click the first `.q-card` in `hotelType` `.option-grid`
2. Assert it gains `is-selected` class
3. Click the second `.q-card` in `hotelType` `.option-grid`
4. Assert the second card has `is-selected` and the first does NOT

**Expected result:**
- Only one card selected at a time (radio behavior)

**Implementation notes:**
- Standard Playwright test with clicks and class assertions.

---

### TC-207: Hotel amenities multi-select chip behavior

**Traces to:** REQ-002 → AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 6, hotel toggle set to "Yes"

**Steps:**
1. Click chip 0 in `#hotelAmenitiesChips` — assert `is-selected`
2. Click chip 1 — assert `is-selected` (chip 0 still selected)
3. Click chip 0 again — assert NOT `is-selected` (chip 1 still selected)

**Expected result:**
- Multiple chips can be selected independently; clicking a selected chip deselects it

**Implementation notes:**
- Standard test with sequential clicks.

---

### TC-208: Hotel pets toggle defaults to "No"

**Traces to:** REQ-002 → AC-6
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- On Step 6, hotel toggle set to "Yes"

**Steps:**
1. Locate `hotelPets` question
2. Assert `.q-card[data-value="no"]` has `is-selected`
3. Assert `.q-card[data-value="yes"]` does NOT have `is-selected`

**Expected result:**
- Default pets selection is "No"

**Implementation notes:**
- Combined with TC-205 in implementation via `expect.soft()` in the option counts test. Listed separately for traceability.

---

### TC-209: Hotel budget range slider keyboard interaction

**Traces to:** REQ-005 → AC-6
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 6, hotel toggle set to "Yes"

**Steps:**
1. Focus the min handle of `#hotelBudgetSlider` (`[data-handle="min"]`)
2. Press ArrowRight key 3 times (step=10, so +30)
3. Assert `data-min-val` on slider is now "60" (initial 30 + 30)
4. Focus the max handle (`[data-handle="max"]`)
5. Press ArrowLeft key 2 times (step=10, so -20)
6. Assert `data-max-val` on slider is now "980" (initial 1000 - 20)

**Expected result:**
- Keyboard arrows adjust slider handle values by step increments

**Implementation notes:**
- Use `locator.focus()` then `page.keyboard.press('ArrowRight')`. Read `data-min-val`/`data-max-val` attributes.

---

### TC-210: Range slider handles cannot cross each other

**Traces to:** REQ-005 → AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 6, hotel toggle set to "Yes"

**Steps:**
1. Via `page.evaluate()`, set `#hotelBudgetSlider` `data-min-val` to 990 (near max of 1000)
2. Focus min handle, press ArrowRight 5 times
3. Assert `data-min-val` does not exceed `data-max-val - step` (i.e., max 990 since max is 1000 and step is 10)

**Expected result:**
- Min handle cannot cross or equal the max handle

**Implementation notes:**
- Direct attribute manipulation followed by keyboard interaction. Read final `data-min-val`.

---

### TC-211: Car Rental Assistance section visible on Step 6 at all depth levels

**Traces to:** REQ-003 → AC-1; REQ-011 → AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 6 at each depth level

**Steps:**
1. For each depth level [10, 20, 30]: set up with that depth, navigate to Step 6
2. Assert `#carAssistanceSection` is visible
3. Assert the section header element with `data-i18n="s6_car_header"` is visible

**Expected result:**
- Car Rental Assistance section is visible at all three depth levels

**Implementation notes:**
- Data-driven loop, same pattern as TC-201.

---

### TC-212: Car toggle defaults to "No" with sub-questions hidden

**Traces to:** REQ-003 → AC-2, AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- On Step 6

**Steps:**
1. Locate `data-question-key="carAssistToggle"`
2. Assert `.q-card[data-value="no"]` has `is-selected`
3. Assert `#carSubQuestions` does NOT have class `is-expanded`

**Expected result:**
- Car toggle defaults to "No", sub-questions hidden

**Implementation notes:**
- Batched soft assertions.

---

### TC-213: Car toggle "Yes" reveals 6 sub-questions

**Traces to:** REQ-003 → AC-4; REQ-004 → AC-1
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- On Step 6, car toggle at default

**Steps:**
1. Click "Yes" q-card in `carAssistToggle`
2. Assert `#carSubQuestions` has class `is-expanded`
3. Assert 6 sub-question containers exist by `data-question-key`: `carCategory`, `carTransmission`, `carFuel`, `carPickup`, `carExtras`, `carBudget`

**Expected result:**
- All 6 car sub-questions present and body expanded

**Implementation notes:**
- Soft assertions for each key.

---

### TC-214: Car toggle "No" collapses and resets all car selections

**Traces to:** REQ-003 → AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Car toggle set to "Yes", some selections made

**Steps:**
1. Expand car section, select a car category card and a car extras chip
2. Click car "No" toggle
3. Assert `#carSubQuestions` does NOT have `is-expanded`
4. Assert no `.q-card.is-selected` inside `#carSubQuestions`
5. Assert no `.chip-toggle.is-selected` inside `#carSubQuestions`
6. Assert car budget slider reset to full range

**Expected result:**
- Selections cleared, slider reset, body collapsed

**Implementation notes:**
- Mirror of TC-204 logic.

---

### TC-215: Car sub-question option counts and UI types

**Traces to:** REQ-004 → AC-2 through AC-7
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Car toggle set to "Yes"

**Steps:**
1. Count `.option-grid .q-card` inside `carCategory` — expect 14
2. Count `.question-options .q-card` inside `carTransmission` — expect 3
3. Count `.question-options .q-card` inside `carFuel` — expect 5
4. Count `.question-options .q-card` inside `carPickup` — expect 4
5. Count `.chip-toggle` inside `#carExtrasChips` — expect 7
6. Assert `#carBudgetSlider` exists with `data-min="0"`, `data-max="1000"`, `data-step="10"`, `data-prefix="$"`

**Expected result:**
- All option counts and slider config match BRD

**Implementation notes:**
- Single test with `expect.soft()`.

---

### TC-216: Car card grid single-select behavior

**Traces to:** REQ-004 → AC-2
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Car toggle set to "Yes"

**Steps:**
1. Click first `.q-card` in `carCategory` `.option-grid`
2. Assert `is-selected`
3. Click second `.q-card`
4. Assert only second has `is-selected`

**Expected result:**
- Radio behavior: one card at a time

**Implementation notes:**
- Same pattern as TC-206.

---

### TC-217: Car extras multi-select chip behavior

**Traces to:** REQ-004 → AC-6
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Car toggle set to "Yes"

**Steps:**
1. Click chip 0 in `#carExtrasChips` — assert `is-selected`
2. Click chip 1 — assert both selected
3. Click chip 0 again — assert deselected, chip 1 still selected

**Expected result:**
- Independent multi-select toggle behavior

**Implementation notes:**
- Same pattern as TC-207.

---

### TC-218: Markdown output includes Hotel Assistance when toggle is "Yes"

**Traces to:** REQ-006 → AC-1, AC-3, AC-4, AC-5, AC-6
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- On Step 6, hotel toggle set to "Yes", select some hotel preferences

**Steps:**
1. Expand hotel section
2. Select a hotel type (e.g., first card in `hotelType`)
3. Select a hotel location (e.g., first card in `hotelLocation`)
4. Select two amenity chips
5. Navigate to Step 7
6. Extract raw markdown via `intake.getRawMarkdown()`
7. Assert markdown contains `## Hotel Assistance`
8. Assert markdown contains `- **Accommodation type:**` followed by a non-empty value
9. Assert markdown contains `- **Location priority:**`
10. Assert markdown contains `- **Must-have amenities:**` (not "None" since we selected two)
11. Assert markdown contains `- **Traveling with pets:** No` (default)
12. Assert markdown contains `- **Daily budget per room:** $30 - $1,000` (default range)

**Expected result:**
- Hotel Assistance section present in markdown with correct field labels and values

**Implementation notes:**
- Uses English field labels in markdown assertions. This is intentional — `generateMarkdown()` outputs hard-coded English labels regardless of UI language (same pattern as wheelchair spec, see QF-1 in `intake-wheelchair.spec.ts`). Soft assertions for each field.

---

### TC-219: Markdown output omits Hotel Assistance when toggle is "No"

**Traces to:** REQ-006 → AC-2
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- On Step 6, hotel toggle left at default ("No")

**Steps:**
1. Navigate directly to Step 7 (do not toggle hotel to Yes)
2. Extract raw markdown
3. Assert markdown does NOT contain `## Hotel Assistance`

**Expected result:**
- Hotel section entirely absent from markdown

**Implementation notes:**
- Simple negative assertion.

---

### TC-220: Markdown output includes Car Rental Assistance when toggle is "Yes"

**Traces to:** REQ-007 → AC-1, AC-3, AC-4, AC-5, AC-6
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- On Step 6, car toggle set to "Yes", select some car preferences

**Steps:**
1. Expand car section
2. Select a car category, a transmission option, and one extra chip
3. Navigate to Step 7
4. Extract raw markdown
5. Assert markdown contains `## Car Rental Assistance`
6. Assert markdown contains `- **Car category:**` with a value
7. Assert markdown contains `- **Transmission:**` with a value
8. Assert markdown contains `- **Additional equipment:**` (not "None")
9. Assert markdown contains `- **Daily rental budget:** $0 - $1,000` (default range)

**Expected result:**
- Car Rental Assistance section in markdown with correct structure

**Implementation notes:**
- Soft assertions for each field label.

---

### TC-221: Markdown output omits Car Rental Assistance when toggle is "No"

**Traces to:** REQ-007 → AC-2
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Car toggle left at default ("No")

**Steps:**
1. Navigate to Step 7
2. Assert markdown does NOT contain `## Car Rental Assistance`

**Expected result:**
- Car section absent from markdown

**Implementation notes:**
- Can be combined with TC-219 in a single test if both toggles are default. Listed separately for traceability.

---

### TC-222: Markdown output fields show "Not specified" for unselected single-selects

**Traces to:** REQ-006 → AC-5; REQ-007 → AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Hotel and car toggles set to "Yes" but NO sub-questions filled (except defaults)

**Steps:**
1. Toggle hotel to "Yes" (do not select any hotel options except leave pets at default "No")
2. Toggle car to "Yes" (do not select any car options)
3. Navigate to Step 7
4. Extract raw markdown
5. Assert hotel fields with no selection contain "Not specified" (hotelType, hotelLocation, hotelStars, hotelCancellation)
6. Assert car fields with no selection contain "Not specified" (carCategory, carTransmission, carFuel, carPickup)
7. Assert amenities shows "None", car extras shows "None"

**Expected result:**
- Unselected fields display "Not specified"; empty multi-selects display "None"

**Implementation notes:**
- Soft assertions for each field.

---

### TC-223: i18n keys present in all 12 locale files (93 keys)

**Traces to:** REQ-008 → AC-1 through AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-i18n.spec.ts`
**Priority:** Critical

**Preconditions:**
- All 12 locale files exist on disk

**Steps:**
1. Define the array of 93 required i18n keys (all `s6_hotel_*` and `s6_car_*` keys from DD §1.7)
2. For each of 12 locale files (`ui_en.json` through `ui_ar.json`):
   a. Read and parse JSON
   b. Assert each of the 93 keys exists and has a non-empty string value

**Expected result:**
- All 93 keys present in all 12 files

**Implementation notes:**
- Static file analysis, no browser needed. Single test with `expect.soft()` for each key per locale. Pattern mirrors `intake-wheelchair.spec.ts` TC-152.

---

### TC-224: data-i18n attributes on all hotel section DOM elements

**Traces to:** REQ-008 → AC-1; REQ-002 → AC-9
**Type:** Progression
**Spec file:** `intake-hotel-car-i18n.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 6, hotel toggle set to "Yes"

**Steps:**
1. For each hotel sub-question container, assert the `.field__label` has a `data-i18n` attribute
2. For each q-card within hotel sub-questions, assert `.q-card__title` has a `data-i18n` attribute
3. For each chip-toggle in `#hotelAmenitiesChips`, assert it has a `data-i18n` attribute
4. Assert the hotel section header has `data-i18n="s6_hotel_header"`
5. Assert the hotel toggle label has `data-i18n="s6_hotel_toggle"`

**Expected result:**
- All visible text elements have `data-i18n` attributes

**Implementation notes:**
- Use `page.evaluate()` to batch all attribute checks. Soft assertions for each element.

---

### TC-225: data-i18n attributes on all car section DOM elements

**Traces to:** REQ-008 → AC-1; REQ-004 → AC-8
**Type:** Progression
**Spec file:** `intake-hotel-car-i18n.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 6, car toggle set to "Yes"

**Steps:**
1. For each car sub-question container, assert `.field__label` has `data-i18n`
2. For each q-card within car sub-questions, assert `.q-card__title` has `data-i18n`
3. For each chip-toggle in `#carExtrasChips`, assert it has `data-i18n`
4. Assert car section header has `data-i18n="s6_car_header"`
5. Assert car toggle label has `data-i18n="s6_car_toggle"`

**Expected result:**
- All car section text elements have `data-i18n` attributes

**Implementation notes:**
- Same `page.evaluate()` batching pattern as TC-224.

---

### TC-226: data-en-name attributes on option cards and chips

**Traces to:** REQ-008 → AC-6
**Type:** Progression
**Spec file:** `intake-hotel-car-i18n.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 6, both toggles set to "Yes"

**Steps:**
1. Assert every `.q-card[data-value]` inside `#hotelSubQuestions` has a `data-en-name` attribute
2. Assert every `.chip-toggle` inside `#hotelAmenitiesChips` has a `data-en-name` attribute
3. Assert every `.q-card[data-value]` inside `#carSubQuestions` has a `data-en-name` attribute
4. Assert every `.chip-toggle` inside `#carExtrasChips` has a `data-en-name` attribute

**Expected result:**
- All option elements carry `data-en-name` for language-agnostic markdown generation

**Implementation notes:**
- Batch in single `page.evaluate()`.

---

### TC-227: Step 6 section ordering

**Traces to:** REQ-010 → AC-1, AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 6

**Steps:**
1. Get DOM order of key elements within Step 6: wheelchair question, hotel assistance section, car assistance section
2. Assert wheelchair appears before hotel, hotel appears before car (by comparing `compareDocumentPosition`)

**Expected result:**
- Order is: Wheelchair → Hotel Assistance → Car Rental Assistance

**Implementation notes:**
- Single `page.evaluate()` comparing element positions.

---

### TC-228: Expand animation uses CSS transition

**Traces to:** REQ-009 → AC-1
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- On Step 6

**Steps:**
1. Read computed `transition` property of `#hotelSubQuestions`
2. Assert it includes `max-height` and `opacity` transitions

**Expected result:**
- CSS transition rules are present for smooth expand/collapse

**Implementation notes:**
- Use `page.evaluate()` to read `getComputedStyle().transition`.

---

### TC-229: Hotel and Car sections independent of each other

**Traces to:** REQ-001, REQ-003 (independence)
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 6

**Steps:**
1. Toggle hotel to "Yes" — assert hotel body expanded, car body still collapsed
2. Toggle car to "Yes" — assert both expanded
3. Toggle hotel to "No" — assert hotel collapsed, car still expanded
4. Toggle car to "No" — assert both collapsed

**Expected result:**
- Each section's toggle operates independently

**Implementation notes:**
- Sequential click-assert pattern.

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 (Hotel Toggle) | AC-1: Section visible | TC-201 | Hard |
| REQ-001 | AC-2: Yes/No toggle pattern | TC-202 | Soft |
| REQ-001 | AC-3: Default "No" | TC-202 | Soft |
| REQ-001 | AC-4: "Yes" reveals sub-questions | TC-203 | Hard + Soft |
| REQ-001 | AC-5: "No" collapses and resets | TC-204 | Soft |
| REQ-001 | AC-6: i18n attributes and locale keys | TC-223, TC-224 | Soft |
| REQ-001 | AC-7: RTL layout | Out of scope (existing rtl spec) | — |
| REQ-002 (Hotel Questions) | AC-1: 7 questions in order | TC-203, TC-205 | Soft |
| REQ-002 | AC-2: hotelType 12 cards, radio | TC-205, TC-206 | Soft + Hard |
| REQ-002 | AC-3: hotelLocation 5 options | TC-205 | Soft |
| REQ-002 | AC-4: hotelStars 4 options | TC-205 | Soft |
| REQ-002 | AC-5: hotelAmenities multi-select | TC-205, TC-207 | Soft + Hard |
| REQ-002 | AC-6: hotelPets default "No" | TC-205, TC-208 | Soft |
| REQ-002 | AC-7: hotelCancellation 3 options | TC-205 | Soft |
| REQ-002 | AC-8: hotelBudget slider config | TC-205, TC-209, TC-210 | Soft + Hard |
| REQ-002 | AC-9: data-i18n on all labels | TC-224 | Soft |
| REQ-002 | AC-10: i18n keys in 12 files | TC-223 | Soft |
| REQ-002 | AC-11: Design system compliance | TC-228 | Soft |
| REQ-003 (Car Toggle) | AC-1: Section visible | TC-211 | Hard |
| REQ-003 | AC-2: Yes/No toggle | TC-212 | Soft |
| REQ-003 | AC-3: Default "No" | TC-212 | Soft |
| REQ-003 | AC-4: "Yes" reveals sub-questions | TC-213 | Hard + Soft |
| REQ-003 | AC-5: "No" collapses and resets | TC-214 | Soft |
| REQ-003 | AC-6: i18n attributes and locale keys | TC-223, TC-225 | Soft |
| REQ-003 | AC-7: RTL layout | Out of scope (existing rtl spec) | — |
| REQ-004 (Car Questions) | AC-1: 6 questions in order | TC-213, TC-215 | Soft |
| REQ-004 | AC-2: carCategory 14 cards, radio | TC-215, TC-216 | Soft + Hard |
| REQ-004 | AC-3: carTransmission 3 options | TC-215 | Soft |
| REQ-004 | AC-4: carFuel 5 options | TC-215 | Soft |
| REQ-004 | AC-5: carPickup 4 options | TC-215 | Soft |
| REQ-004 | AC-6: carExtras multi-select | TC-215, TC-217 | Soft + Hard |
| REQ-004 | AC-7: carBudget slider config | TC-215 | Soft |
| REQ-004 | AC-8: data-i18n on labels | TC-225 | Soft |
| REQ-004 | AC-9: i18n keys in 12 files | TC-223 | Soft |
| REQ-004 | AC-10: Design system compliance | TC-228 | Soft |
| REQ-005 (Range Slider) | AC-1: Two draggable handles | TC-209 | Hard |
| REQ-005 | AC-2: Filled range highlight | TC-228 | Soft |
| REQ-005 | AC-3: Handles cannot cross | TC-210 | Hard |
| REQ-005 | AC-4: Label displays range | TC-205 | Soft |
| REQ-005 | AC-5: Touch-friendly (44px) | Out of scope (visual/design spec) | — |
| REQ-005 | AC-6: Keyboard accessible | TC-209 | Hard |
| REQ-005 | AC-7: Step=10 configurable | TC-205, TC-209 | Soft + Hard |
| REQ-005 | AC-8: Min/max configurable | TC-205 | Soft |
| REQ-005 | AC-9: RTL mirroring | Out of scope (existing rtl spec) | — |
| REQ-005 | AC-10: Design system colors | Out of scope (visual spec) | — |
| REQ-005 | AC-11: Desktop + mobile | Out of scope (existing responsive spec) | — |
| REQ-006 (Hotel Markdown) | AC-1: Section present when Yes | TC-218 | Hard |
| REQ-006 | AC-2: Section omitted when No | TC-219 | Hard |
| REQ-006 | AC-3: 7 field format | TC-218 | Soft |
| REQ-006 | AC-4: English values | TC-218 | Soft |
| REQ-006 | AC-5: "Not specified" defaults | TC-222 | Soft |
| REQ-006 | AC-6: Visible in Step 7 preview | TC-218 | Hard |
| REQ-006 | AC-7: Present in downloaded md | TC-218 (raw markdown check) | Hard |
| REQ-007 (Car Markdown) | AC-1: Section present when Yes | TC-220 | Hard |
| REQ-007 | AC-2: Section omitted when No | TC-221 | Hard |
| REQ-007 | AC-3: 6 field format | TC-220 | Soft |
| REQ-007 | AC-4: English values | TC-220 | Soft |
| REQ-007 | AC-5: "Not specified" defaults | TC-222 | Soft |
| REQ-007 | AC-6: Visible in Step 7 preview | TC-220 | Hard |
| REQ-007 | AC-7: Present in downloaded md | TC-220 (raw markdown check) | Hard |
| REQ-008 (i18n) | AC-1: data-i18n attributes | TC-224, TC-225 | Soft |
| REQ-008 | AC-2: Keys in ui_en.json | TC-223 | Soft |
| REQ-008 | AC-3: Keys in ui_ru.json | TC-223 | Soft |
| REQ-008 | AC-4: Keys in ui_he.json | TC-223 | Soft |
| REQ-008 | AC-5: Keys in remaining 9 files | TC-223 | Soft |
| REQ-008 | AC-6: data-en-name attributes | TC-226 | Soft |
| REQ-008 | AC-7: Language switch updates | Out of scope (existing i18n-full spec) | — |
| REQ-009 (Design System) | AC-1: Expand/collapse animation | TC-228 | Soft |
| REQ-009 | AC-2: Responsive grid | Out of scope (existing design-spec) | — |
| REQ-009 | AC-3: q-card compact sizing | Out of scope (existing design-spec) | — |
| REQ-009 | AC-4: Chip selector pattern | TC-207, TC-217 | Hard |
| REQ-009 | AC-5: Toggle Yes/No pattern | TC-202, TC-212 | Soft |
| REQ-009 | AC-6: 44px touch targets | Out of scope (visual spec) | — |
| REQ-009 | AC-7: Responsive widths | Out of scope (existing responsive spec) | — |
| REQ-009 | AC-8: Dark mode | Out of scope (existing darkmode spec) | — |
| REQ-010 (Section Order) | AC-1: Field order | TC-227 | Hard |
| REQ-010 | AC-2: Section headers styled | TC-201, TC-211 | Hard |
| REQ-010 | AC-3: Toggle is visually prominent | TC-202, TC-212 | Soft |
| REQ-010 | AC-4: Smooth animation | TC-228 | Soft |
| REQ-010 | AC-5: Visual separation | TC-227 | Hard |
| REQ-010 | AC-6: No layout jumps | TC-229 | Implicit |
| REQ-011 (Supplementary) | AC-1: Listed in rule file | Out of scope (rule file review, not automatable) | — |
| REQ-011 | AC-2: No tier assignment | TC-201, TC-211 (visible at all depths) | Hard |
| REQ-011 | AC-3: Visible at all depths | TC-201, TC-211 | Hard |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `locales/ui_*.json` (12 files) | 93 new i18n keys | Yes — keys must be added before TC-223 passes |
| `trip_intake.html` | New DOM sections (hotel/car assistance) | Yes — new sections must be implemented before all TCs |
| `IntakePage.ts` (POM) | New locators for hotel/car sections | Yes — POM extensions needed (see §7) |
| Existing intake test fixtures | `setupWithDepth()`, `navigateToStep()`, `getRawMarkdown()` | No — existing helpers are sufficient |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| CSS `max-height: 4000px` transition may cause slow/janky animations in tests | Do not assert animation timing; only check final DOM state (`is-expanded` class presence) after click |
| Range slider pointer-drag tests are inherently flaky | Use keyboard interaction (ArrowRight/ArrowLeft) instead of mouse drag for all slider assertions |
| Large option counts (12 hotel types, 14 car categories) may cause test brittleness if counts change | Assert option counts via `expect.soft()` so a count change in one question doesn't block other assertions |
| Chip toggle `is-selected` class may not update synchronously | Use Playwright web-first assertions (`expect(locator).toHaveClass(...)`) which auto-retry |
| Markdown assertions use English field labels | Documented as intentional — `generateMarkdown()` always outputs English. Annotated with QF-1 justification matching wheelchair spec pattern |
| Tests depend on wizard navigation (Steps 0→1→depth→Step 6) | Use existing `intake.setupWithDepth()` + `intake.navigateToStep(6)` helpers that are battle-tested in 22 existing intake specs |

## 7. Estimated Impact

- **New test count:** 29 test cases across 2 spec files
  - `intake-hotel-car-assistance.spec.ts`: 22 tests (TC-201 through TC-222, TC-227 through TC-229; TC-201 and TC-211 each contain 3 data-driven sub-tests)
  - `intake-hotel-car-i18n.spec.ts`: 4 tests (TC-223 through TC-226; TC-223 contains batched assertions across 12 files x 93 keys)
- **Estimated runtime increase:** ~15-20 seconds (all tests use fast DOM assertions; no visual screenshots or network calls; main cost is repeated `setupWithDepth()` navigation for depth-loop tests)
- **Files added:**
  - `automation/code/tests/intake/intake-hotel-car-assistance.spec.ts` (new)
  - `automation/code/tests/intake/intake-hotel-car-i18n.spec.ts` (new)
- **Files modified:**
  - `automation/code/tests/pages/IntakePage.ts` — add new locators:
    - `hotelAssistanceSection` → `#hotelAssistanceSection`
    - `hotelToggle` → `[data-question-key="hotelAssistToggle"]`
    - `hotelSubQuestions` → `#hotelSubQuestions`
    - `hotelTypeGrid` → `[data-question-key="hotelType"] .option-grid`
    - `hotelAmenitiesChips` → `#hotelAmenitiesChips`
    - `hotelBudgetSlider` → `#hotelBudgetSlider`
    - `carAssistanceSection` → `#carAssistanceSection`
    - `carToggle` → `[data-question-key="carAssistToggle"]`
    - `carSubQuestions` → `#carSubQuestions`
    - `carCategoryGrid` → `[data-question-key="carCategory"] .option-grid`
    - `carExtrasChips` → `#carExtrasChips`
    - `carBudgetSlider` → `#carBudgetSlider`
    - `assistanceSectionByKey(key)` → parameterized locator for either section
    - `sliderHandle(sliderId, handleType)` → parameterized locator for slider handles
