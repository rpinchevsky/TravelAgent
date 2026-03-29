# Test Plan

**Change:** Relocate Hotel & Car Rental Assistance to a New Dedicated Step 2
**Date:** 2026-03-29
**Author:** Automation Engineer
**BRD Reference:** `technical_documents/2026-03-29_hotel-car-step-relocation/business_requirements.md`
**DD Reference:** `technical_documents/2026-03-29_hotel-car-step-relocation/detailed_design.md`
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- New Step 2 panel existence, structure, title, description, and stepper icon
- Hotel and car assistance sections present and functional in Step 2
- Hotel and car assistance sections absent from Step 7 (formerly Step 6)
- 9-step wizard structure (data-step 0-8) with correct content per step
- Stepper displays 9 circles with correct emojis and labels
- Progress bar and stepper fill reach 100% on Step 8
- Full forward navigation (0→1→depth→2→3→4→5→6→7→8)
- Full backward navigation (8→7→6→5→4→3→2→1→0)
- Depth overlay fires between Step 1 and Step 3 (not before Step 2)
- Sub-step auto-advance in Step 3 (formerly Step 2) targets Step 4
- Selection reset on leaving Step 3 (formerly Step 2)
- Markdown output format unchanged (hotel/car sections conditional on toggle state)
- i18n keys for new Step 2 title/description in all 12 locale files
- Renumbered step i18n keys (s2→s3 through s7→s8) in all 12 locale files
- All existing hotel/car functionality (toggle, expand/collapse, sub-questions, reset) at new Step 2 position
- POM (`IntakePage.ts`) step reference updates
- All existing spec file step reference updates

**Out of scope:**
- Visual regression screenshots (will be handled separately post-implementation)
- Hotel/car component behavioral changes (none introduced — pure relocation)
- Markdown output format changes (none introduced)
- New hotel/car sub-questions or options (none introduced)
- Mobile/tablet responsive testing beyond stepper overflow (inherited behavior unchanged)

**Test type:** Both (Regression + Progression)

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Mixed — shared-page for read-only DOM checks, standard for mutation/navigation tests
- **Target file:** `trip_intake.html` (served via local dev server)

## 3. Test Cases

### TC-301: New Step 2 Panel Exists in DOM

**Traces to:** REQ-001 → AC-1
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake page, complete Steps 0-1, confirm depth selector

**Steps:**
1. Query DOM for `section.step[data-step="2"]`
2. Assert element exists and has class `step`

**Expected result:**
- A `<section class="step" data-step="2">` element exists in the DOM

**Implementation notes:**
- Standard fixture (navigation required to reach Step 2)
- Hard assert — if Step 2 doesn't exist, all subsequent tests are invalid

---

### TC-302: Step 2 Stepper Icon

**Traces to:** REQ-001 → AC-2, REQ-005 → AC-2
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to intake page

**Steps:**
1. Query `.stepper__step[data-step="2"] .stepper__circle span`
2. Assert innerHTML contains hotel emoji entity `&#127976;` or its rendered character (🏨)

**Expected result:**
- Stepper circle at index 2 displays the hotel/building emoji

**Implementation notes:**
- Shared-page fixture (read-only DOM check)
- Soft assert — non-blocking if emoji renders differently across platforms
- Use `textContent` to check for rendered emoji character rather than HTML entity

---

### TC-303: Step 2 Title Has data-i18n Attribute

**Traces to:** REQ-001 → AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to intake page, reach Step 2

**Steps:**
1. Query `section.step[data-step="2"] .step__title`
2. Assert `data-i18n` attribute equals `s2_title`

**Expected result:**
- Step 2 title element has `data-i18n="s2_title"`

**Implementation notes:**
- Standard fixture (navigation required)
- Hard assert — i18n key must match exactly

---

### TC-304: Step 2 Description Has data-i18n Attribute

**Traces to:** REQ-001 → AC-4
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to intake page, reach Step 2

**Steps:**
1. Query `section.step[data-step="2"] .step__desc`
2. Assert `data-i18n` attribute equals `s2_desc`

**Expected result:**
- Step 2 description element has `data-i18n="s2_desc"`

**Implementation notes:**
- Combine with TC-303 in a single test using `expect.soft()` for both assertions
- Standard fixture

---

### TC-305: New i18n Keys in All 12 Locale Files

**Traces to:** REQ-001 → AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-i18n-keys.spec.ts`
**Priority:** Critical

**Preconditions:**
- Locale files accessible on disk

**Steps:**
1. Read all 12 `locales/ui_{lang}.json` files
2. Assert each contains `step_stay`, `s2_title`, and `s2_desc` keys
3. Assert each value is a non-empty string
4. For en, ru, he: assert values are properly translated (non-English for ru/he)

**Expected result:**
- All 12 locale files contain the 3 new keys with non-empty values

**Implementation notes:**
- No browser needed — static file analysis
- Batch assertions with `expect.soft()` per lang+key combination
- Append to existing TC-223 test or add as new test block in `intake-hotel-car-i18n-keys.spec.ts`

---

### TC-306: Step 2 Always Visible in Stepper (Not Depth-Gated)

**Traces to:** REQ-001 → AC-6
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- None

**Steps:**
1. For each depth level (10, 20, 30):
   a. Setup with depth
   b. Check `.stepper__step[data-step="2"]` is not hidden (`display !== 'none'`)

**Expected result:**
- Step 2 stepper circle is visible at all depth levels

**Implementation notes:**
- Standard fixture (navigates per depth)
- Soft assertions per depth level
- Can be combined with the visibility test (TC-307)

---

### TC-307: Hotel Section Is Child of Step 2

**Traces to:** REQ-002 → AC-1
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2

**Steps:**
1. Query `#hotelAssistanceSection`
2. Assert it is a descendant of `section.step[data-step="2"]`
3. Assert it is NOT a descendant of `section.step[data-step="7"]`

**Expected result:**
- `#hotelAssistanceSection` is inside Step 2, not Step 7

**Implementation notes:**
- Standard fixture
- Hard assert — structural correctness is fundamental
- Use `page.evaluate()` with `element.closest()` to verify parent step

---

### TC-308: Hotel Toggle Renders and Toggles in Step 2

**Traces to:** REQ-002 → AC-2, REQ-002 → AC-3
**Type:** Regression (behavior unchanged, location changed)
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2

**Steps:**
1. Assert hotel toggle (2-option card) is visible
2. Click "Yes" on hotel toggle
3. Assert `.assistance-section__body.is-expanded` is present within Step 2

**Expected result:**
- Hotel toggle renders with 2 cards ("No"/"Yes")
- Clicking "Yes" expands the sub-question body

**Implementation notes:**
- Standard fixture (mutation: click)
- Hard assert on toggle visibility and expand behavior
- This replaces the existing TC-201/TC-202/TC-203 tests that navigated to Step 6; those tests now navigate to Step 2

---

### TC-309: All 7 Hotel Sub-Questions Present and Interactive

**Traces to:** REQ-002 → AC-4
**Type:** Regression (unchanged behavior, new location)
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand hotel section

**Steps:**
1. Assert all 7 sub-questions present by `data-question-key`: hotelType (card grid 12), hotelLocation (q-card 5), hotelStars (q-card 4), hotelAmenities (chips 12), hotelPets (toggle 2), hotelCancellation (q-card 3), hotelBudget (range slider)

**Expected result:**
- All 7 hotel sub-questions exist with correct option counts

**Implementation notes:**
- Standard fixture
- Batched `expect.soft()` assertions per sub-question
- Existing TC-205 logic reused with updated step navigation (Step 2 instead of Step 6)

---

### TC-310: Hotel Collapse Resets All Selections

**Traces to:** REQ-002 → AC-5
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand hotel, make selections

**Steps:**
1. Toggle hotel to "Yes", select hotel type and amenities
2. Toggle hotel to "No" (collapse)
3. Re-expand and verify all selections reset to defaults

**Expected result:**
- All q-card and chip selections cleared, slider reset to full range, hotelPets defaults to "No"

**Implementation notes:**
- Standard fixture (mutation)
- Existing TC-204 logic reused with Step 2 navigation

---

### TC-311: Hotel i18n Keys Render in Step 2

**Traces to:** REQ-002 → AC-6
**Type:** Regression
**Spec file:** `intake-hotel-car-i18n.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand hotel section, i18n catalogs loaded

**Steps:**
1. Assert all hotel text elements have `data-i18n` attributes
2. Assert header data-i18n = `s6_hotel_header` (feature-scoped, not renamed)
3. Assert toggle label data-i18n = `s6_hotel_toggle`

**Expected result:**
- All hotel i18n attributes present and using correct keys

**Implementation notes:**
- Standard fixture
- Existing TC-224 logic reused with Step 2 navigation (was `navigateToStep(6)`, now `navigateToStep(2)`)

---

### TC-312: Car Section Is Child of Step 2

**Traces to:** REQ-003 → AC-1
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2

**Steps:**
1. Query `#carAssistanceSection`
2. Assert it is a descendant of `section.step[data-step="2"]`
3. Assert it is NOT a descendant of `section.step[data-step="7"]`

**Expected result:**
- `#carAssistanceSection` is inside Step 2, not Step 7

**Implementation notes:**
- Combine with TC-307 in a single test — both hotel and car parent step checks
- Use `page.evaluate()` with `element.closest()`

---

### TC-313: Car Toggle Renders and Toggles in Step 2

**Traces to:** REQ-003 → AC-2, REQ-003 → AC-3
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2

**Steps:**
1. Assert car toggle is visible with 2 cards
2. Click "Yes" to expand
3. Assert `.assistance-section__body.is-expanded` present

**Expected result:**
- Car toggle renders and expands correctly in Step 2

**Implementation notes:**
- Standard fixture
- Existing TC-211/TC-213 logic, updated navigation target

---

### TC-314: All 6 Car Sub-Questions Present and Interactive

**Traces to:** REQ-003 → AC-4
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand car section

**Steps:**
1. Assert all 6 sub-questions by key: carCategory (14), carTransmission (3), carFuel (5), carPickup (4), carExtras (chips 7), carBudget (range slider)

**Expected result:**
- All 6 car sub-questions exist with correct option counts

**Implementation notes:**
- Existing TC-215 logic, updated navigation

---

### TC-315: Car Collapse Resets All Selections

**Traces to:** REQ-003 → AC-5
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand car, make selections

**Steps:**
1. Toggle car to "Yes", select category and extras
2. Toggle car to "No" (collapse)
3. Re-expand and verify reset

**Expected result:**
- All car selections cleared, slider reset

**Implementation notes:**
- Existing TC-214 logic, updated navigation

---

### TC-316: Car i18n Keys Render in Step 2

**Traces to:** REQ-003 → AC-6
**Type:** Regression
**Spec file:** `intake-hotel-car-i18n.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand car section

**Steps:**
1. Assert all car text elements have `data-i18n` attributes
2. Assert header = `s6_car_header`, toggle = `s6_car_toggle`

**Expected result:**
- All car i18n attributes present and correct

**Implementation notes:**
- Existing TC-225 logic, updated navigation

---

### TC-317: Wizard Contains Exactly 9 Step Elements (0-8)

**Traces to:** REQ-004 → AC-1, REQ-004 → AC-8
**Type:** Progression
**Spec file:** `intake-structure.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake page

**Steps:**
1. Query all `section.step[data-step]` elements
2. Assert exactly 9 elements exist
3. Assert `data-step` values are 0, 1, 2, 3, 4, 5, 6, 7, 8

**Expected result:**
- 9 step sections with sequential data-step values 0-8

**Implementation notes:**
- Shared-page fixture (read-only DOM)
- Hard assert on count, soft asserts per step value
- Updates existing step count assertion (was 8)

---

### TC-318: Step Content Correct After Renumbering

**Traces to:** REQ-004 → AC-2 through AC-7
**Type:** Progression
**Spec file:** `intake-structure.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake page

**Steps:**
1. Assert Step 3 contains `.question-slide` elements (questionnaire)
2. Assert Step 4 contains `#interestsSections` (interests)
3. Assert Step 5 contains `#avoidSections` (avoids)
4. Assert Step 6 contains `#foodExperienceCards` (food)
5. Assert Step 7 contains `#reportLang` and does NOT contain `#hotelAssistanceSection` or `#carAssistanceSection`
6. Assert Step 8 contains `#previewContent` (review)

**Expected result:**
- Each step contains its expected content at the new step number

**Implementation notes:**
- Shared-page fixture
- Batched `expect.soft()` assertions per step
- Single test with 6 step content checks

---

### TC-319: Stepper Renders 9 Circles

**Traces to:** REQ-005 → AC-1
**Type:** Progression
**Spec file:** `intake-depth-stepper.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake page, complete depth selection at depth 20

**Steps:**
1. Count `.stepper__step` elements
2. Assert exactly 9

**Expected result:**
- 9 stepper circles rendered

**Implementation notes:**
- Standard fixture
- Hard assert
- Updates existing stepper count check (was 8)

---

### TC-320: StepEmojis Array Has 9 Entries with Hotel at Index 2

**Traces to:** REQ-005 → AC-2
**Type:** Progression
**Spec file:** `intake-depth-stepper.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to intake page

**Steps:**
1. Check stepper circle at data-step="2" contains hotel emoji (🏨)
2. Check stepper circle at data-step="3" contains target emoji (🎯, formerly at index 2)

**Expected result:**
- Emoji at position 2 is hotel building, emoji at position 3 is target

**Implementation notes:**
- Shared-page fixture
- Soft asserts per emoji position

---

### TC-321: Stepper Fill 100% on Step 8

**Traces to:** REQ-005 → AC-3, REQ-005 → AC-4
**Type:** Progression
**Spec file:** `intake-depth-stepper.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate through all steps to Step 8

**Steps:**
1. Navigate to Step 8 (review)
2. Check `#stepperFill` width style is `100%`
3. Check `#progressBarFill` width style is `100%`

**Expected result:**
- Both stepper fill and progress bar show 100% on final step

**Implementation notes:**
- Standard fixture (full navigation required)
- Hard asserts on fill percentage

---

### TC-322: Stepper Circle States (Pending → Active → Done)

**Traces to:** REQ-005 → AC-5
**Type:** Regression
**Spec file:** `intake-depth-stepper.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to intake page

**Steps:**
1. On Step 0, assert Step 0 stepper circle has `is-active` class
2. Navigate to Step 2 and verify Step 0 has `is-done`, Step 2 has `is-active`
3. Navigate to Step 4 and verify Steps 0-3 have `is-done`, Step 4 has `is-active`

**Expected result:**
- Stepper circles transition through states correctly with 9 steps

**Implementation notes:**
- Standard fixture (navigation required)
- Soft asserts per step state

---

### TC-323: Stepper Labels Correct for All 9 Steps

**Traces to:** REQ-005 → AC-6
**Type:** Progression
**Spec file:** `intake-depth-stepper.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to intake page at depth 20

**Steps:**
1. For each stepper step (0-8), read `.stepper__label` `data-i18n` attribute
2. Assert the sequence: `step_trip`, `step_travelers`, `step_stay`, `step_style`, `step_interests`, `step_avoid`, `step_food`, `step_details`, `step_review`

**Expected result:**
- All 9 stepper labels have correct i18n keys in correct order

**Implementation notes:**
- Shared-page fixture (read-only)
- Data-driven assertion: array of expected keys compared to DOM order
- Soft asserts per step

---

### TC-324: Step 7 Does Not Contain Hotel or Car Sections

**Traces to:** REQ-006 → AC-1, REQ-006 → AC-2
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake page

**Steps:**
1. Query `section.step[data-step="7"]`
2. Assert no descendant with id `hotelAssistanceSection`
3. Assert no descendant with id `carAssistanceSection`

**Expected result:**
- Step 7 has zero hotel/car section elements

**Implementation notes:**
- Shared-page fixture (read-only DOM check)
- Hard asserts — structural correctness

---

### TC-325: Step 7 Retains Language, Notes, Photo, Accessibility, Wheelchair

**Traces to:** REQ-006 → AC-3 through AC-7
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 7

**Steps:**
1. Assert Step 7 contains `#reportLang` (report language)
2. Assert Step 7 contains additional notes textarea
3. Assert Step 7 contains photography question (3-option card with `data-question-key`)
4. Assert Step 7 contains accessibility question
5. Assert Step 7 contains wheelchair question (`data-question-key="wheelchairAccessible"`)

**Expected result:**
- All 5 field groups present in Step 7

**Implementation notes:**
- Standard fixture (navigation required)
- Batched `expect.soft()` per field
- Updates existing Step 6 content assertions to reference Step 7

---

### TC-326: Markdown Output — Both Toggles "Yes"

**Traces to:** REQ-007 → AC-1, REQ-007 → AC-3, REQ-007 → AC-4
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, toggle both hotel and car to "Yes", make selections, navigate to review step

**Steps:**
1. Get raw markdown from review step
2. Assert contains `## Hotel Assistance` with sub-fields
3. Assert contains `## Car Rental Assistance` with sub-fields
4. Assert section order: Trip Details > Travelers > ... > Hotel Assistance > Car Rental Assistance

**Expected result:**
- Both sections present in markdown with correct ordering and field values

**Implementation notes:**
- Standard fixture (full wizard navigation + mutations)
- Existing TC-218/TC-220 logic — only navigation path changes (hotel/car toggles on Step 2 instead of Step 6)
- Markdown assertions use English field labels (intentional exception per existing pattern)
- Review step is now Step 8 (was Step 7): `navigateToStep(8)` instead of `navigateToStep(7)`

---

### TC-327: Markdown Output — Both Toggles "No"

**Traces to:** REQ-007 → AC-2
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate directly to review step without toggling hotel/car

**Steps:**
1. Get raw markdown from review step (Step 8)
2. Assert does NOT contain `## Hotel Assistance`
3. Assert does NOT contain `## Car Rental Assistance`

**Expected result:**
- Both sections omitted from markdown when toggles remain "No"

**Implementation notes:**
- Standard fixture
- Existing TC-219/TC-221 logic, updated review step number (8)

---

### TC-328: Markdown Filename Format Unchanged

**Traces to:** REQ-007 → AC-5
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to review step

**Steps:**
1. Check the download filename element or preview tab label
2. Assert format matches `{name}_trip_details_{date}.md` pattern

**Expected result:**
- Filename format unchanged

**Implementation notes:**
- Standard fixture
- Soft assert on filename pattern

---

### TC-329: Depth Overlay Fires Between Step 1 and Step 3

**Traces to:** REQ-008 → AC-1, REQ-008 → AC-2
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake, complete Step 0 and Step 1

**Steps:**
1. Click Continue on Step 1
2. Assert depth overlay becomes visible
3. Select depth and confirm
4. Assert current step is Step 2 (not Step 3)

**Expected result:**
- Depth overlay appears after Step 1 Continue
- After depth confirmation, wizard lands on Step 2 (logistics)

**Implementation notes:**
- Standard fixture (navigation + clicks)
- Hard assert on depth overlay visibility and landing step

---

### TC-330: Continue on Step 2 Advances to Step 3

**Traces to:** REQ-008 → AC-3
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** Critical

**Preconditions:**
- On Step 2 (both toggles defaulting to "No")

**Steps:**
1. Click Continue on Step 2
2. Assert current step is 3

**Expected result:**
- Step 2 has no validation gate; Continue advances directly to Step 3

**Implementation notes:**
- Standard fixture
- Hard assert on step number

---

### TC-331: Back on Step 3 Returns to Step 2

**Traces to:** REQ-008 → AC-4
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** Critical

**Preconditions:**
- On Step 3

**Steps:**
1. Click Back on Step 3
2. Assert current step is 2

**Expected result:**
- Back navigates to Step 2, not to depth selector

**Implementation notes:**
- Standard fixture
- Hard assert

---

### TC-332: Back on Step 2 Returns to Step 1

**Traces to:** REQ-008 → AC-5
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 2

**Steps:**
1. Click Back on Step 2
2. Assert current step is 1

**Expected result:**
- Back navigates to Step 1

**Implementation notes:**
- Standard fixture
- Hard assert

---

### TC-333: Full Forward Navigation Sequence (0→8)

**Traces to:** REQ-008 → AC-6
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake page

**Steps:**
1. Complete Step 0 → Continue
2. Complete Step 1 → Continue → Depth overlay → Confirm
3. Step 2 → Continue
4. Step 3 (skip sub-steps) → auto-advance to Step 4
5. Step 4 → Continue
6. Step 5 → Continue
7. Step 6 → Continue
8. Step 7 → Continue
9. Assert on Step 8 (review)

**Expected result:**
- Full forward navigation completes, landing on Step 8

**Implementation notes:**
- Standard fixture (full navigation)
- Hard assert on final step number
- Uses `navigateToStep(8)` or manual step-by-step navigation

---

### TC-334: Full Backward Navigation Sequence (8→0)

**Traces to:** REQ-008 → AC-7
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 8

**Steps:**
1. Click Back through each step: 8→7→6→5→4→3→2→1→0
2. Assert each intermediate step number is correct

**Expected result:**
- Back navigation visits each step in sequence, ending at Step 0

**Implementation notes:**
- Standard fixture
- Soft asserts per intermediate step (collect all, report at end)
- Note: Step 3→2 must not re-trigger depth overlay

---

### TC-335: Step 0 Validation Blocks Forward Navigation

**Traces to:** REQ-008 → AC-8
**Type:** Regression
**Spec file:** `intake-functional.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 0 without filling required fields

**Steps:**
1. Click Continue without filling destination/dates
2. Assert still on Step 0

**Expected result:**
- Validation prevents leaving Step 0 without required data

**Implementation notes:**
- Standard fixture
- Hard assert — no step change

---

### TC-336: Step 1 Validation Blocks Forward Navigation

**Traces to:** REQ-008 → AC-9
**Type:** Regression
**Spec file:** `intake-functional.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 1 without filling name/birth year

**Steps:**
1. Navigate to Step 1 (complete Step 0 first)
2. Clear parent name field
3. Click Continue
4. Assert still on Step 1

**Expected result:**
- Validation prevents leaving Step 1 without required traveler data

**Implementation notes:**
- Standard fixture

---

### TC-337: Sub-step Dots Render in Step 3

**Traces to:** REQ-009 → AC-1, REQ-009 → AC-4
**Type:** Regression
**Spec file:** `intake-depth-questions.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 3 at depth 20

**Steps:**
1. Assert `.sub-dots` or `.quiz-dots__dot` elements exist within Step 3
2. Assert dot count matches number of visible questions at selected depth

**Expected result:**
- Sub-step dots render correctly in the renumbered Step 3

**Implementation notes:**
- Standard fixture
- Existing sub-dot tests updated to check Step 3 instead of Step 2
- Uses `intake.subStepDots(3)` instead of `intake.subStepDots(2)`

---

### TC-338: Auto-advance After Last Question Goes to Step 4

**Traces to:** REQ-009 → AC-3
**Type:** Progression
**Spec file:** `intake-depth-questions.spec.ts`
**Priority:** Critical

**Preconditions:**
- On Step 3, at the last visible question

**Steps:**
1. Answer the last visible question (click a card)
2. Wait for auto-advance (400ms + transition)
3. Assert current step is 4 (Interests)

**Expected result:**
- After last question, wizard advances to Step 4

**Implementation notes:**
- Standard fixture
- Hard assert on step number
- Must wait for auto-advance delay

---

### TC-339: Back from Step 4 Returns to Step 3

**Traces to:** REQ-009 → AC-5
**Type:** Regression
**Spec file:** `intake-depth-questions.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 4 (interests)

**Steps:**
1. Click Back
2. Assert current step is 3
3. Assert the last answered question is displayed (not first question)

**Expected result:**
- Back returns to Step 3 with last answered question visible

**Implementation notes:**
- Standard fixture

---

### TC-340: Leaving Step 3 Clears Saved Selections

**Traces to:** REQ-010 → AC-1
**Type:** Regression
**Spec file:** `intake-depth-change.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 3, answer questions, navigate forward

**Steps:**
1. Complete Step 3 questionnaire (auto-advances to Step 4)
2. Select some interest cards in Step 4
3. Navigate back to Step 3
4. Navigate forward again (re-trigger questionnaire)
5. Assert interest selections were cleared

**Expected result:**
- Returning to Step 3 clears previously saved interest/avoid selections

**Implementation notes:**
- Standard fixture
- Existing reset logic tests updated to reference Step 3

---

### TC-341: Navigating Steps 4-5-6 Preserves Manual Selections

**Traces to:** REQ-010 → AC-2
**Type:** Regression
**Spec file:** `intake-depth-change.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 4 with manual card selections

**Steps:**
1. Select interest cards in Step 4
2. Navigate to Step 5
3. Navigate back to Step 4
4. Assert interest selections preserved

**Expected result:**
- Manual card selections survive navigation between Steps 4, 5, 6

**Implementation notes:**
- Standard fixture
- Existing test logic, updated step numbers (was 3-4-5, now 4-5-6)

---

### TC-342: Step 2 to Step 3 Does NOT Clear Selections

**Traces to:** REQ-010 → AC-3
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** High

**Preconditions:**
- On Step 2 with hotel/car selections

**Steps:**
1. Toggle hotel to "Yes" in Step 2, make a hotel type selection
2. Navigate to Step 3 (Continue)
3. Navigate back to Step 2 (Back)
4. Assert hotel toggle still "Yes" and hotel type selection preserved

**Expected result:**
- Navigating from Step 2 to Step 3 and back preserves Step 2 selections

**Implementation notes:**
- Standard fixture
- Progression test — verifies Step 2 has no reset behavior

---

### TC-343: Renumbered i18n Keys in Locale Files

**Traces to:** REQ-011 → AC-1 through AC-9 (partial — i18n key renumbering)
**Type:** Progression
**Spec file:** `intake-hotel-car-i18n-keys.spec.ts`
**Priority:** Critical

**Preconditions:**
- Locale files accessible on disk

**Steps:**
1. Read all 12 locale files
2. Assert renumbered keys exist: `s3_title`, `s3_desc` (was s2), `s4_title`, `s4_desc` (was s3), through `s8_title`, `s8_desc` (was s7)
3. Assert renumbered button keys: `s7_next` (was s6), `s8_edit`, `s8_copy`, `s8_download`, etc.
4. Assert old keys (`s2_title` with old "style" value) no longer exist with the old meaning — `s2_title` now holds "Plan Your Stay & Travel" (or translated equivalent)
5. Assert `s6_hotel_*` and `s6_car_*` keys still exist (NOT renamed)

**Expected result:**
- All renumbered keys present and non-empty; hotel/car feature keys unchanged

**Implementation notes:**
- Static file analysis, no browser
- Batch `expect.soft()` per lang+key
- Add as new test block in existing `intake-hotel-car-i18n-keys.spec.ts`

---

### TC-344: Automation POM Uses Correct Step Numbers

**Traces to:** REQ-012 → AC-1 through AC-5
**Type:** Progression
**Spec file:** (verified by running all test specs — not a standalone test)
**Priority:** Critical

**Preconditions:**
- All implementation changes applied

**Steps:**
1. Run full intake test suite
2. Assert all tests pass

**Expected result:**
- Zero failures across all intake specs

**Implementation notes:**
- This is the integration verification — not a standalone test case
- POM changes (review step locator `data-step="8"`, `skipStep3SubSteps`, etc.) validated implicitly by all tests passing

---

### TC-345: Hotel and Car Sections Visible at All Depth Levels in Step 2

**Traces to:** REQ-002 → AC-2, REQ-003 → AC-2 (combined with REQ-001 → AC-6)
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- None

**Steps:**
1. For each depth (10, 20, 30):
   a. Setup with depth, navigate to Step 2
   b. Assert `#hotelAssistanceSection` visible
   c. Assert `#carAssistanceSection` visible

**Expected result:**
- Hotel and car sections visible on Step 2 at all depths

**Implementation notes:**
- Standard fixture
- Existing TC-201+TC-211 logic, updated to navigate to Step 2
- Soft asserts per depth

---

### TC-346: Hotel and Car Markdown Default Values

**Traces to:** REQ-007 → AC-4
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Toggle both to "Yes" without filling sub-questions, navigate to review

**Steps:**
1. Navigate to Step 2, toggle both to "Yes" (leave defaults)
2. Navigate to Step 8 (review)
3. Assert "Not specified" for unselected single-selects
4. Assert "None" for empty multi-selects

**Expected result:**
- Default values render correctly in markdown

**Implementation notes:**
- Existing TC-222 logic, updated navigation (Step 2 for toggles, Step 8 for review)

---

### TC-347: Step 2 DOM Ordering — Hotel Before Car

**Traces to:** REQ-002, REQ-003 (UX design §4.1: hotel appears first)
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to Step 2

**Steps:**
1. Compare DOM positions of `#hotelAssistanceSection` and `#carAssistanceSection`
2. Assert hotel precedes car in DOM order

**Expected result:**
- Hotel section appears before car section in Step 2

**Implementation notes:**
- Shared-page fixture
- Existing TC-227 logic, updated from Step 6 ordering check to Step 2 (wheelchair no longer adjacent)

---

### TC-348: Expand/Collapse CSS Transitions

**Traces to:** REQ-002 → AC-3, REQ-003 → AC-3 (UX §6 interaction table)
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Low

**Preconditions:**
- Navigate to Step 2

**Steps:**
1. Check computed transition on `#hotelSubQuestions` and `#carSubQuestions`
2. Assert transitions include `max-height` and `opacity`

**Expected result:**
- CSS transitions preserved after DOM relocation

**Implementation notes:**
- Existing TC-228 logic, updated navigation

---

### TC-349: Hotel and Car Toggles Operate Independently

**Traces to:** REQ-002, REQ-003 (independence)
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to Step 2

**Steps:**
1. Toggle hotel "Yes" → assert hotel expanded, car collapsed
2. Toggle car "Yes" → assert both expanded
3. Toggle hotel "No" → assert hotel collapsed, car still expanded
4. Toggle car "No" → assert both collapsed

**Expected result:**
- Toggles do not interfere with each other

**Implementation notes:**
- Existing TC-229 logic, updated navigation

---

### TC-350: data-en-name Attributes on Hotel/Car Options

**Traces to:** REQ-002 → AC-4, REQ-003 → AC-4 (sub-question integrity)
**Type:** Regression
**Spec file:** `intake-hotel-car-i18n.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to Step 2, expand both sections

**Steps:**
1. Assert all q-cards with `data-value` have `data-en-name` attribute
2. Assert all chip toggles have `data-en-name` attribute

**Expected result:**
- All option elements retain `data-en-name` attributes after relocation

**Implementation notes:**
- Existing TC-226 logic, updated navigation to Step 2

---

### TC-351: Hotel Selection Behavior (Single-Select Radio)

**Traces to:** REQ-002 → AC-4 (interactivity)
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to Step 2, expand hotel

**Steps:**
1. Click first hotel type card → assert selected
2. Click second card → assert second selected, first deselected

**Expected result:**
- Single-select radio behavior preserved

**Implementation notes:**
- Existing TC-206 logic, updated navigation

---

### TC-352: Hotel Amenities Multi-Select Behavior

**Traces to:** REQ-002 → AC-4 (interactivity)
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to Step 2, expand hotel

**Steps:**
1. Click chip 0 → selected
2. Click chip 1 → both selected
3. Click chip 0 → deselected, chip 1 still selected

**Expected result:**
- Multi-select chip behavior preserved

**Implementation notes:**
- Existing TC-207 logic, updated navigation

---

### TC-353: Hotel Budget Slider Keyboard Interaction

**Traces to:** REQ-002 → AC-4 (interactivity)
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to Step 2, expand hotel

**Steps:**
1. Focus min handle, press ArrowRight 3 times → min = 60
2. Focus max handle, press ArrowLeft 2 times → max = 980

**Expected result:**
- Keyboard arrows adjust slider values correctly

**Implementation notes:**
- Existing TC-209 logic, updated navigation

---

### TC-354: Car Selection and Slider Behavior

**Traces to:** REQ-003 → AC-4 (interactivity)
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to Step 2, expand car

**Steps:**
1. Car category single-select radio behavior
2. Car extras multi-select chip behavior

**Expected result:**
- Single-select and multi-select behaviors preserved

**Implementation notes:**
- Existing TC-216/TC-217 logic, updated navigation

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 | AC-1: Step 2 exists | TC-301 | Hard |
| REQ-001 | AC-2: Stepper icon | TC-302 | Soft |
| REQ-001 | AC-3: Title data-i18n | TC-303 | Hard |
| REQ-001 | AC-4: Desc data-i18n | TC-304 | Soft (batched with TC-303) |
| REQ-001 | AC-5: 12 locale files | TC-305 | Soft (batched per lang+key) |
| REQ-001 | AC-6: Always visible | TC-306 | Soft (per depth) |
| REQ-002 | AC-1: Hotel in Step 2 | TC-307 | Hard |
| REQ-002 | AC-2: Toggle renders | TC-308 | Hard |
| REQ-002 | AC-3: Toggle expands | TC-308 | Hard |
| REQ-002 | AC-4: 7 sub-questions | TC-309 | Soft (batched) |
| REQ-002 | AC-5: Collapse resets | TC-310 | Soft (batched) |
| REQ-002 | AC-6: i18n correct | TC-311 | Soft |
| REQ-003 | AC-1: Car in Step 2 | TC-312 | Hard |
| REQ-003 | AC-2: Toggle renders | TC-313 | Hard |
| REQ-003 | AC-3: Toggle expands | TC-313 | Hard |
| REQ-003 | AC-4: 6 sub-questions | TC-314 | Soft (batched) |
| REQ-003 | AC-5: Collapse resets | TC-315 | Soft (batched) |
| REQ-003 | AC-6: i18n correct | TC-316 | Soft |
| REQ-004 | AC-1: 9 step elements | TC-317 | Hard |
| REQ-004 | AC-2: Step 3 = questionnaire | TC-318 | Soft |
| REQ-004 | AC-3: Step 4 = interests | TC-318 | Soft |
| REQ-004 | AC-4: Step 5 = avoids | TC-318 | Soft |
| REQ-004 | AC-5: Step 6 = food | TC-318 | Soft |
| REQ-004 | AC-6: Step 7 = language (no hotel/car) | TC-318, TC-324 | Soft + Hard |
| REQ-004 | AC-7: Step 8 = review | TC-318 | Soft |
| REQ-004 | AC-8: All data-step correct | TC-317 | Hard |
| REQ-005 | AC-1: 9 stepper circles | TC-319 | Hard |
| REQ-005 | AC-2: Hotel emoji at index 2 | TC-320 | Soft |
| REQ-005 | AC-3: Fill 100% on Step 8 | TC-321 | Hard |
| REQ-005 | AC-4: Progress bar 100% on Step 8 | TC-321 | Hard |
| REQ-005 | AC-5: Circle state transitions | TC-322 | Soft |
| REQ-005 | AC-6: Labels correct | TC-323 | Soft (per step) |
| REQ-006 | AC-1: No hotel in Step 7 | TC-324 | Hard |
| REQ-006 | AC-2: No car in Step 7 | TC-324 | Hard |
| REQ-006 | AC-3: Report language | TC-325 | Soft |
| REQ-006 | AC-4: Additional notes | TC-325 | Soft |
| REQ-006 | AC-5: Photography | TC-325 | Soft |
| REQ-006 | AC-6: Accessibility | TC-325 | Soft |
| REQ-006 | AC-7: Wheelchair | TC-325 | Soft |
| REQ-007 | AC-1: Both "Yes" markdown | TC-326 | Hard |
| REQ-007 | AC-2: Both "No" markdown | TC-327 | Hard |
| REQ-007 | AC-3: Section order | TC-326 | Soft |
| REQ-007 | AC-4: Field values read from DOM | TC-326, TC-346 | Soft |
| REQ-007 | AC-5: Filename format | TC-328 | Soft |
| REQ-008 | AC-1: Depth overlay on Step 1 | TC-329 | Hard |
| REQ-008 | AC-2: Depth → Step 2 | TC-329 | Hard |
| REQ-008 | AC-3: Step 2 → Step 3 | TC-330 | Hard |
| REQ-008 | AC-4: Back Step 3 → Step 2 | TC-331 | Hard |
| REQ-008 | AC-5: Back Step 2 → Step 1 | TC-332 | Hard |
| REQ-008 | AC-6: Full forward 0→8 | TC-333 | Hard |
| REQ-008 | AC-7: Full backward 8→0 | TC-334 | Soft (per step) |
| REQ-008 | AC-8: Step 0 validation | TC-335 | Hard |
| REQ-008 | AC-9: Step 1 validation | TC-336 | Hard |
| REQ-009 | AC-1: Sub-dots in Step 3 | TC-337 | Hard |
| REQ-009 | AC-2: Auto-advance between questions | TC-337 | Soft |
| REQ-009 | AC-3: Last Q → Step 4 | TC-338 | Hard |
| REQ-009 | AC-4: Dot count = question count | TC-337 | Soft |
| REQ-009 | AC-5: Back Step 4 → Step 3 | TC-339 | Hard |
| REQ-010 | AC-1: Leaving Step 3 clears | TC-340 | Hard |
| REQ-010 | AC-2: Steps 4-5-6 preserve | TC-341 | Hard |
| REQ-010 | AC-3: Step 2→3 no reset | TC-342 | Hard |
| REQ-011 | AC-1-9: Rule files updated | Not automated (documentation review) | — |
| REQ-012 | AC-1: Correct step numbers | TC-344 (implicit) | — |
| REQ-012 | AC-2: Hotel/car at Step 2 | TC-307, TC-312 | Hard |
| REQ-012 | AC-3: Step 7 no hotel/car | TC-324 | Hard |
| REQ-012 | AC-4: Stepper expects 9 | TC-319 | Hard |
| REQ-012 | AC-5: All tests pass | TC-344 (full suite run) | — |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `trip_intake.html` | DOM structure, step panels, stepper, JS logic | Yes — all step changes per DD |
| `locales/ui_*.json` (12 files) | i18n keys for Step 2 title/desc + renumbered keys | Yes — 3 new keys + renumbered keys |
| `IntakePage.ts` | POM locators and navigation helpers | Yes — step number references, method rename |
| Existing spec files (25 files) | Step navigation targets, step assertions | Yes — audit all `navigateToStep()` calls and step number assertions |
| `trip_intake_rules.md` | Rule documentation | Yes — step numbering (not tested by automation, verified by review) |
| `trip_intake_design.md` | Design documentation | Yes — step numbering (not tested by automation) |

## 6. Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `navigateToStep()` breaks because POM `skipStep2SubSteps()` renamed but callers not updated | Medium | High | Grep all callers of `skipStep2SubSteps` and update to `skipStep3SubSteps`; use TypeScript compiler to catch missing renames |
| Depth overlay fires before Step 2 instead of before Step 3 | Medium | High | TC-329 explicitly verifies depth overlay timing; test runs early in suite |
| `getReviewContent()` POM method targets wrong step after renumber | Medium | High | Update `stepSection(7)` → `stepSection(8)` in POM; TC-326/TC-327 catch regression immediately |
| Hotel/car event handlers break due to DOM relocation (parent step container change) | Low | Critical | TC-308/TC-309/TC-313/TC-314 verify full interactivity at new location |
| `generateMarkdown()` fails to find hotel/car elements at new DOM position | Low | Critical | TC-326/TC-327 verify markdown output; `generateMarkdown()` uses IDs, not step queries |
| Test flakiness from auto-advance timing (Step 3 sub-steps 400ms delay) | Medium | Medium | Existing tests already handle this with `waitForTimeout(500)` — note: this violates the zero-flakiness policy but is inherited from existing implementation |
| Stepper overflow at narrow viewport with 9 steps | Low | Low | Not tested in this plan (desktop viewport only); existing CSS `overflow-x: auto` handles overflow |
| i18n key collision — `s2_title` repurposed for new Step 2 content but old translations cached | Low | Medium | TC-305 verifies new key values; TC-343 verifies renumbered keys |

## 7. Estimated Impact

- **New test count:** 12 new progression tests (TC-301 through TC-306, TC-307/TC-312, TC-317, TC-318, TC-329-334, TC-338, TC-342, TC-343, TC-347)
- **Updated (regression) test count:** 22 existing tests updated with new step navigation targets (TC-308-316, TC-319-328, TC-335-337, TC-339-341, TC-345-354)
- **Total test cases in plan:** 54
- **Estimated runtime increase:** ~8-12 seconds (new navigation tests add page loads; most existing tests just change navigation target with negligible time impact)
- **Files added:** 0 (all tests added to existing spec files)
- **Files modified:**
  - `automation/code/tests/pages/IntakePage.ts` — POM step number updates, method rename
  - `automation/code/tests/intake/intake-hotel-car-assistance.spec.ts` — all `navigateToStep(6)` → `navigateToStep(2)`, `navigateToStep(7)` → `navigateToStep(8)`, new structural tests
  - `automation/code/tests/intake/intake-hotel-car-i18n.spec.ts` — navigation updates
  - `automation/code/tests/intake/intake-hotel-car-i18n-keys.spec.ts` — new i18n key checks, renumbered key validation
  - `automation/code/tests/intake/intake-structure.spec.ts` — step count 8→9, content verification
  - `automation/code/tests/intake/intake-depth-stepper.spec.ts` — stepper count 8→9, emoji positions, labels
  - `automation/code/tests/intake/intake-depth-questions.spec.ts` — sub-dot step reference, auto-advance target
  - `automation/code/tests/intake/intake-depth-change.spec.ts` — selection reset step references
  - `automation/code/tests/intake/intake-depth-output.spec.ts` — review step 7→8
  - `automation/code/tests/intake/intake-functional.spec.ts` — navigation sequence, context bar, new nav tests
  - `automation/code/tests/intake/intake-visual-consistency.spec.ts` — card steps [3,4,5]→[4,5,6]
  - `automation/code/tests/intake/intake-wheelchair.spec.ts` — `navigateToStep(6)` → `navigateToStep(7)`
  - `automation/code/tests/intake/intake-design-spec.spec.ts` — step references
  - `automation/code/tests/intake/intake-i18n-full.spec.ts` — step references if any
  - `automation/code/tests/intake/intake-a11y-full.spec.ts` — step references if any
  - `automation/code/tests/intake/intake-darkmode.spec.ts` — step references if any
  - `automation/code/tests/intake/intake-rtl.spec.ts` — step references if any

**New POM locators needed:** None — all existing locators use element IDs and CSS classes, not step-positional queries. The only POM changes are step number constants and the method rename (`skipStep2SubSteps` → `skipStep3SubSteps`).
