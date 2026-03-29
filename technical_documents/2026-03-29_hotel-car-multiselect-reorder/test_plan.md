# Test Plan

**Change:** Hotel/Car Multi-Select and Step Reorder
**Date:** 2026-03-29
**Author:** Automation Engineer
**BRD Reference:** `technical_documents/2026-03-29_hotel-car-multiselect-reorder/business_requirements.md`
**DD Reference:** `technical_documents/2026-03-29_hotel-car-multiselect-reorder/detailed_design.md`
**UX Reference:** `technical_documents/2026-03-29_hotel-car-multiselect-reorder/ux_design.md`
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- Multi-select toggle behavior for hotelType (H1) and carCategory (C1) option grids
- Multi-select visual indicators: `data-multi-select` attribute, `aria-pressed` attribute, checkmark badge pseudo-element
- Hint label (`.option-grid__hint`) presence and i18n key for multi-select grids
- Markdown output: comma-separated values for multi-select fields, "Not specified" for zero selection, DOM-order preservation
- Step reorder: depth overlay triggers after Step 2 (not Step 1), correct forward/backward navigation chain
- Reset behavior: assistance toggle "No" clears all multi-select cards and resets `aria-pressed`
- Single-select (radio) behavior preserved for all OTHER q-card groups (hotelLocation, hotelStars, carTransmission, etc.)
- i18n key `s6_multiselect_hint` present in all 12 locale files
- Accessibility: `role="group"`, `aria-label`, `aria-pressed` on multi-select grids

**Out of scope:**
- H2-H7 / C2-C6 sub-question behavior (unchanged, already covered by TC-205 through TC-217)
- Depth overlay internal behavior (options, animation, card styles — unchanged)
- Step 3 questionnaire content (unchanged)
- Trip generation pipeline consuming comma-separated values (not an intake test)
- Visual screenshot regression (separate visual spec, not part of this plan)

**Test type:** Progression (new behavior) + Regression (existing tests modified)

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Target file:** `trip_intake.html` (served via Playwright baseURL)
- **POM:** `IntakePage.ts`

## 3. Test Cases

### TC-351: hotelType multi-select — select multiple cards simultaneously

**Traces to:** REQ-001 → AC-1, AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts` (replaces TC-206)
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand hotel section (toggle "Yes")

**Steps:**
1. Click hotelType card at index 0
2. Assert card 0 has `.is-selected`
3. Click hotelType card at index 1
4. Assert card 1 has `.is-selected`
5. Assert card 0 STILL has `.is-selected`
6. Click hotelType card at index 2
7. Assert all three cards (0, 1, 2) have `.is-selected`

**Expected result:**
- All three clicked cards are simultaneously in `.is-selected` state
- No card is deselected when a sibling is clicked

**Implementation notes:**
- Standard fixture (mutations via clicks). Replaces TC-206 which tested single-select radio behavior on hotelType. The old TC-206 test body is invalidated by this change.

---

### TC-352: hotelType multi-select — toggle off deselects individual card

**Traces to:** REQ-001 → AC-2
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand hotel section, select cards at index 0 and 1

**Steps:**
1. Click card 0 again (toggle off)
2. Assert card 0 does NOT have `.is-selected`
3. Assert card 1 STILL has `.is-selected`

**Expected result:**
- Clicking a selected card deselects only that card
- Sibling selections are unaffected

**Implementation notes:**
- Can be combined with TC-351 in a single test body using `expect.soft` for efficiency. Standard fixture.

---

### TC-353: hotelType multi-select — all 12 cards selectable

**Traces to:** REQ-001 → AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand hotel section

**Steps:**
1. Use `page.evaluate` to click all 12 `.q-card` elements inside the hotelType `.option-grid[data-multi-select]`
2. Count `.q-card.is-selected` inside the grid

**Expected result:**
- All 12 cards have `.is-selected` class
- No maximum limit enforced

**Implementation notes:**
- Use `page.evaluate` loop for speed (avoids 12 sequential Playwright clicks). Assert count equals 12. Standard fixture.

---

### TC-354: hotelType multi-select — `.is-selected` visual state per card

**Traces to:** REQ-001 → AC-4
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand hotel section, select cards at index 0 and 2 (not 1)

**Steps:**
1. Evaluate DOM: for each of the 12 cards, read `classList.contains('is-selected')`
2. Assert card 0: true, card 1: false, card 2: true, cards 3-11: false

**Expected result:**
- `.is-selected` class applies independently to each card — only clicked cards show selected state

**Implementation notes:**
- Soft assertions per card index. Standard fixture.

---

### TC-355: carCategory multi-select — select multiple cards simultaneously

**Traces to:** REQ-002 → AC-1, AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts` (replaces TC-216)
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand car section (toggle "Yes")

**Steps:**
1. Click carCategory card at index 0
2. Click carCategory card at index 1
3. Assert both cards have `.is-selected`
4. Click carCategory card at index 2
5. Assert all three cards have `.is-selected`

**Expected result:**
- Multiple car category cards can be selected simultaneously

**Implementation notes:**
- Standard fixture. Replaces TC-216 which tested single-select radio behavior on carCategory.

---

### TC-356: carCategory multi-select — toggle off deselects individual card

**Traces to:** REQ-002 → AC-2
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand car section, select cards at index 0 and 1

**Steps:**
1. Click card 0 again
2. Assert card 0 NOT `.is-selected`
3. Assert card 1 STILL `.is-selected`

**Expected result:**
- Individual toggle-off without affecting siblings

**Implementation notes:**
- Standard fixture.

---

### TC-357: carCategory multi-select — all 14 cards selectable

**Traces to:** REQ-002 → AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand car section

**Steps:**
1. Use `page.evaluate` to click all 14 `.q-card` elements inside carCategory `.option-grid[data-multi-select]`
2. Count `.q-card.is-selected`

**Expected result:**
- All 14 cards selected simultaneously

**Implementation notes:**
- Standard fixture.

---

### TC-358: carCategory multi-select — independent `.is-selected` state

**Traces to:** REQ-002 → AC-4
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand car section, select specific cards

**Steps:**
1. Select cards at index 0, 3, 5
2. Assert only those three have `.is-selected`, remaining 11 do not

**Expected result:**
- Visual state applied independently per card

**Implementation notes:**
- Soft assertions. Standard fixture.

---

### TC-359: Markdown output — single hotel type selected

**Traces to:** REQ-003 → AC-1
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts` (modifies TC-218)
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand hotel, select exactly 1 hotel type card

**Steps:**
1. Click first hotelType card (captures its `data-en-name`)
2. Navigate to Step 8 (Review)
3. Read raw markdown via `getRawMarkdown()`
4. Assert `- **Accommodation type:** {single-value}` contains exactly the clicked card's `data-en-name`, no commas

**Expected result:**
- Single value output with no trailing comma

**Implementation notes:**
- Read `data-en-name` from clicked card before navigating to review. Assert the markdown line matches `- **Accommodation type:** {name}` where `{name}` has no comma. Standard fixture.

---

### TC-360: Markdown output — multiple hotel types selected (comma-separated)

**Traces to:** REQ-003 → AC-2, AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand hotel, select 3 hotel type cards

**Steps:**
1. Click cards at index 0, 1, 2 — capture their `data-en-name` values
2. Navigate to Step 8
3. Read raw markdown
4. Extract the `Accommodation type:` value
5. Assert it contains all 3 names separated by `, `
6. Assert the order matches DOM order (index 0, 1, 2 left-to-right)

**Expected result:**
- Output: `- **Accommodation type:** {name0}, {name1}, {name2}`
- Order matches card DOM order

**Implementation notes:**
- Capture `data-en-name` values before navigating. Build expected string by joining with `, `. Match against raw markdown. Standard fixture.

---

### TC-361: Markdown output — zero hotel types selected ("Not specified")

**Traces to:** REQ-001 → AC-6, REQ-003 → AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts` (modifies TC-222)
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand hotel (toggle "Yes"), do NOT click any hotel type card

**Steps:**
1. Navigate to Step 8
2. Read raw markdown
3. Assert `Accommodation type:` line contains "Not specified"

**Expected result:**
- `- **Accommodation type:** Not specified`

**Implementation notes:**
- TC-222 already covers this for the old single-select. This test validates the same behavior under the new multi-select logic. Can be folded into TC-222 update. Standard fixture.

---

### TC-362: Markdown output — multiple car categories selected (comma-separated)

**Traces to:** REQ-003 → AC-4, AC-5
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand car, select 2 car category cards

**Steps:**
1. Click cards at index 0 and 1 — capture `data-en-name` values
2. Navigate to Step 8
3. Read raw markdown
4. Assert `Car category:` value is `{name0}, {name1}`

**Expected result:**
- Comma-separated car category names in DOM order

**Implementation notes:**
- Standard fixture.

---

### TC-363: Markdown output — zero car categories selected ("Not specified")

**Traces to:** REQ-002 → AC-6, REQ-003 → AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand car (toggle "Yes"), no car category clicked

**Steps:**
1. Navigate to Step 8
2. Read raw markdown
3. Assert `Car category:` line contains "Not specified"

**Expected result:**
- `- **Car category:** Not specified`

**Implementation notes:**
- Can be folded into TC-222 update. Standard fixture.

---

### TC-364: Markdown output — uses `data-en-name` regardless of UI language

**Traces to:** REQ-003 → AC-6
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to intake page, switch language to a non-English locale (e.g., `ru`)
- Complete Steps 0-1, navigate to Step 2

**Steps:**
1. Expand hotel, select first hotelType card — capture its `data-en-name` (should be English)
2. Navigate to Step 8
3. Read raw markdown
4. Assert the `Accommodation type:` value matches the English `data-en-name`, not a translated string

**Expected result:**
- Markdown output uses English names from `data-en-name` even when UI is in another language

**Implementation notes:**
- Use `intake.switchLanguage('ru')` before starting the flow. Read `data-en-name` attribute (not visible text) after card click. Standard fixture.

---

### TC-365: Step reorder — Step 1 Continue navigates to Step 2 (no overlay)

**Traces to:** REQ-004 → AC-1
**Type:** Progression
**Spec file:** `intake-functional.spec.ts` (modifies TC-329)
**Priority:** Critical

**Preconditions:**
- Navigate to intake page, complete Step 0, complete Step 1

**Steps:**
1. After Step 1 Continue click, check: is the depth overlay visible?
2. Check: what is the current step number?

**Expected result:**
- Depth overlay is NOT visible
- Current step is 2 (hotel/car)

**Implementation notes:**
- This REPLACES TC-329 which currently asserts the depth overlay fires between Step 1 and Step 3. The new TC-329/365 asserts it does NOT fire after Step 1. Standard fixture.

---

### TC-366: Step reorder — Step 2 Continue opens depth overlay

**Traces to:** REQ-004 → AC-2
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2 (complete Steps 0 and 1, land on Step 2)

**Steps:**
1. Click Continue on Step 2
2. Assert depth overlay is visible

**Expected result:**
- Depth selector overlay appears after Step 2 Continue

**Implementation notes:**
- Standard fixture.

---

### TC-367: Step reorder — depth confirm proceeds to Step 3

**Traces to:** REQ-004 → AC-3
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, click Continue to open depth overlay

**Steps:**
1. Select a depth card (e.g., depth 20)
2. Click confirm
3. Check current step number

**Expected result:**
- Current step is 3 (questionnaire)

**Implementation notes:**
- Standard fixture.

---

### TC-368: Step reorder — backward from Step 3 returns to Step 2

**Traces to:** REQ-004 → AC-5
**Type:** Progression
**Spec file:** `intake-functional.spec.ts` (covers TC-331 regression)
**Priority:** High

**Preconditions:**
- Complete full setup through depth overlay, land on Step 3

**Steps:**
1. Click Back button on Step 3
2. Check current step number

**Expected result:**
- Current step is 2 (not the depth overlay)

**Implementation notes:**
- TC-331 already tests this. Retained as regression. Standard fixture.

---

### TC-369: Step reorder — backward from Step 2 returns to Step 1

**Traces to:** REQ-004 → AC-6
**Type:** Progression
**Spec file:** `intake-functional.spec.ts` (covers TC-332 regression)
**Priority:** High

**Preconditions:**
- On Step 2 after full navigation

**Steps:**
1. Click Back button on Step 2
2. Check current step number

**Expected result:**
- Current step is 1

**Implementation notes:**
- TC-332 already tests this. Retained as regression. Standard fixture.

---

### TC-370: Step reorder — depth pill re-entry works from later steps

**Traces to:** REQ-004 → AC-7
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** High

**Preconditions:**
- Complete full setup through depth overlay, navigate to Step 4 or later

**Steps:**
1. Click the depth pill in the context bar
2. Assert depth overlay appears
3. Change depth selection
4. Confirm
5. Assert wizard returns to the step the user was on before opening the pill

**Expected result:**
- Depth overlay opens on re-entry
- After confirmation, wizard returns to the step user was on (not Step 2)

**Implementation notes:**
- Standard fixture. Uses `intake.depthPill.click()`.

---

### TC-371: Step reorder — stepper shows correct step sequence

**Traces to:** REQ-004 → AC-4
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** Medium

**Preconditions:**
- Complete setup with depth 20

**Steps:**
1. Read all visible stepper step `data-step` attributes
2. Assert the sequence includes 0, 1, 2, 3 in order

**Expected result:**
- Stepper shows steps in numerical order: 0, 1, 2, 3, 4...
- No step is missing or out of order

**Implementation notes:**
- Shared-page fixture (read-only after setup). Evaluate stepper DOM.

---

### TC-372: Step reorder — `stepBeforeOverlay` tracks Step 2

**Traces to:** REQ-004 → AC-8
**Type:** Progression
**Spec file:** `intake-functional.spec.ts`
**Priority:** High

**Preconditions:**
- Complete Steps 0 and 1, arrive on Step 2

**Steps:**
1. Click Continue on Step 2 to open depth overlay
2. Read `window._depthState.stepBeforeOverlay` via `page.evaluate`
3. Assert it equals 2

**Expected result:**
- `stepBeforeOverlay` is 2, not 1

**Implementation notes:**
- Standard fixture. Accesses internal state via evaluate.

---

### TC-373: Reset — hotel toggle "No" clears all multi-select types

**Traces to:** REQ-005 → AC-1, AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts` (augments TC-204)
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand hotel, select 3 hotel type cards

**Steps:**
1. Click hotel toggle "No" to collapse
2. Click hotel toggle "Yes" to re-expand
3. Count `.q-card.is-selected` inside hotelType grid
4. Check `aria-pressed` values on all cards

**Expected result:**
- Zero selected cards in hotelType grid after reset
- All `aria-pressed` attributes are `"false"`

**Implementation notes:**
- This augments TC-204 which already tests reset. The new assertions verify multi-select + aria-pressed cleanup. Standard fixture.

---

### TC-374: Reset — car toggle "No" clears all multi-select categories

**Traces to:** REQ-005 → AC-2, AC-3
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts` (augments TC-214)
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand car, select 3 car category cards

**Steps:**
1. Click car toggle "No" to collapse
2. Click car toggle "Yes" to re-expand
3. Count `.q-card.is-selected` inside carCategory grid
4. Check `aria-pressed` values on all cards

**Expected result:**
- Zero selected cards in carCategory grid after reset
- All `aria-pressed` attributes are `"false"`

**Implementation notes:**
- Standard fixture.

---

### TC-375: Multi-select hint label — hotelType grid has hint element

**Traces to:** REQ-001 (UX spec S5.1)
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand hotel section

**Steps:**
1. Locate `.option-grid__hint` element preceding the hotelType `.option-grid[data-multi-select]`
2. Assert it exists and is visible
3. Assert it has `data-i18n="s6_multiselect_hint"`
4. Assert it has non-empty text content

**Expected result:**
- Hint label visible with correct i18n key

**Implementation notes:**
- Standard fixture. Language-agnostic: checks attribute not text value.

---

### TC-376: Multi-select hint label — carCategory grid has hint element

**Traces to:** REQ-002 (UX spec S5.1)
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand car section

**Steps:**
1. Locate `.option-grid__hint` element preceding the carCategory `.option-grid[data-multi-select]`
2. Assert it exists and is visible
3. Assert `data-i18n="s6_multiselect_hint"`

**Expected result:**
- Hint label visible with correct i18n key

**Implementation notes:**
- Standard fixture.

---

### TC-377: Multi-select `data-multi-select` attribute — present on hotelType and carCategory grids ONLY

**Traces to:** REQ-001, REQ-002 (scoping)
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand both hotel and car sections

**Steps:**
1. Count all `.option-grid[data-multi-select]` elements in the entire page
2. Assert count is exactly 2
3. Assert the two elements are inside `[data-question-key="hotelType"]` and `[data-question-key="carCategory"]`

**Expected result:**
- Exactly 2 multi-select grids in the DOM
- Located only within hotelType and carCategory question containers

**Implementation notes:**
- Standard fixture. Critical for ensuring multi-select does NOT leak to other option grids.

---

### TC-378: Multi-select ARIA — `role="group"` and `aria-label` on grids

**Traces to:** REQ-001, REQ-002 (UX spec S8)
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to Step 2, expand both sections

**Steps:**
1. Check hotelType `.option-grid[data-multi-select]` has `role="group"` and non-empty `aria-label`
2. Check carCategory `.option-grid[data-multi-select]` has `role="group"` and non-empty `aria-label`

**Expected result:**
- Both grids have `role="group"` and `aria-label` attributes

**Implementation notes:**
- Standard fixture. Language-agnostic: checks attribute presence, not value.

---

### TC-379: Multi-select ARIA — `aria-pressed` toggles on click

**Traces to:** REQ-001 → AC-4, REQ-002 → AC-4 (UX spec S8)
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** High

**Preconditions:**
- Navigate to Step 2, expand hotel section

**Steps:**
1. Assert all hotelType cards have `aria-pressed="false"` initially
2. Click card 0
3. Assert card 0 has `aria-pressed="true"`
4. Assert card 1 still has `aria-pressed="false"`
5. Click card 0 again (toggle off)
6. Assert card 0 has `aria-pressed="false"`

**Expected result:**
- `aria-pressed` attribute toggles in sync with `.is-selected` class

**Implementation notes:**
- Standard fixture.

---

### TC-380: Multi-select checkmark badge — CSS pseudo-element present on selected cards

**Traces to:** REQ-001 → AC-4, REQ-002 → AC-4 (UX spec S5.2)
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to Step 2, expand hotel section, select card 0

**Steps:**
1. Evaluate `getComputedStyle(card0, '::after')` for:
   - `content`: should contain checkmark character
   - `transform`: should not be `scale(0)` (should be `scale(1)` or `matrix` equivalent)
2. Evaluate `getComputedStyle(card1, '::after')` (unselected):
   - `transform`: should be `scale(0)` or `matrix(0, ...)` (hidden)

**Expected result:**
- Selected cards show checkmark badge via `::after` pseudo-element
- Unselected cards have hidden badge (scale 0)

**Implementation notes:**
- Uses `page.evaluate` with `getComputedStyle(el, '::after')`. Standard fixture.

---

### TC-381: Single-select preserved — hotelLocation still uses radio behavior

**Traces to:** BRD scope: "Out of scope — other hotel/car sub-questions remain single-select"
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand hotel section

**Steps:**
1. Click hotelLocation card at index 0 — assert `.is-selected`
2. Click hotelLocation card at index 1 — assert `.is-selected`
3. Assert card 0 does NOT have `.is-selected` (radio clear)

**Expected result:**
- hotelLocation retains single-select radio behavior — selecting one deselects the previous

**Implementation notes:**
- Critical regression guard: ensures the multi-select branch in the click handler only activates for `data-multi-select` grids. Standard fixture.

---

### TC-382: Single-select preserved — carTransmission still uses radio behavior

**Traces to:** BRD scope: "Out of scope — other sub-questions remain single-select"
**Type:** Regression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to Step 2, expand car section

**Steps:**
1. Click carTransmission card at index 0 — assert `.is-selected`
2. Click carTransmission card at index 1 — assert `.is-selected`
3. Assert card 0 does NOT have `.is-selected`

**Expected result:**
- carTransmission retains single-select radio behavior

**Implementation notes:**
- Standard fixture.

---

### TC-383: No auto-advance on multi-select card click

**Traces to:** REQ-001, REQ-002 (DD §1.4 — `return` prevents auto-advance)
**Type:** Progression
**Spec file:** `intake-hotel-car-assistance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Navigate to Step 2, expand hotel section

**Steps:**
1. Note current step number (should be 2)
2. Click a hotelType card
3. Wait 600ms (auto-advance timeout is 400ms + buffer)
4. Assert current step is still 2

**Expected result:**
- Clicking a multi-select card does NOT trigger auto-advance to the next step

**Implementation notes:**
- Uses `page.waitForTimeout(600)` — acceptable here as we are testing a timing-sensitive negative assertion. Standard fixture.

---

### TC-384: i18n key `s6_multiselect_hint` present in all 12 locale files

**Traces to:** DD §1.12 (i18n key addition)
**Type:** Progression
**Spec file:** `intake-hotel-car-i18n-keys.spec.ts`
**Priority:** High

**Preconditions:**
- None (static file analysis, no browser interaction)

**Steps:**
1. For each of the 12 supported languages, read `locales/ui_{lang}.json`
2. Parse JSON
3. Assert key `s6_multiselect_hint` exists and has a non-empty string value

**Expected result:**
- All 12 locale files contain the key with a non-empty translation

**Implementation notes:**
- Static file test — no browser context. Follows the pattern of TC-223 and TC-305 in the same spec file. Appends to the `REQUIRED_I18N_KEYS` or creates a new `test.describe` block.

---

### TC-385: IntakePage navigation helpers updated for new step order

**Traces to:** REQ-004 (step reorder impact on POM)
**Type:** Regression
**Spec file:** `intake-functional.spec.ts`
**Priority:** Critical

**Preconditions:**
- Navigate to intake page

**Steps:**
1. Call `completeStep0()` → assert Step 1
2. Call `completeStep1()` → assert Step 2 (was: depth overlay)
3. Click Continue on Step 2 → assert depth overlay visible
4. Confirm depth → assert Step 3
5. Navigate forward to Step 8 → assert Review step reached

**Expected result:**
- Full forward navigation 0→8 works with the new step order
- `completePrerequisiteSteps()` and `setupWithDepth()` still function correctly after being updated to the new flow

**Implementation notes:**
- This is a regression test on the POM itself. The `completePrerequisiteSteps()` method must be updated: after `completeStep1()`, the wizard now lands on Step 2 (not depth overlay). The depth overlay appears after Step 2 Continue. `setupWithDepth()` must navigate Step 2 before selecting depth. Standard fixture. Overlaps with TC-333 but focuses on POM method correctness.

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 | AC-1: Select 2+ accommodation types | TC-351 | Hard |
| REQ-001 | AC-2: Toggle off selected type | TC-352 | Soft |
| REQ-001 | AC-3: Select without clearing siblings | TC-351 | Soft |
| REQ-001 | AC-4: Independent `.is-selected` visual state | TC-354, TC-379, TC-380 | Soft |
| REQ-001 | AC-5: All 12 selectable | TC-353 | Hard |
| REQ-001 | AC-6: "Not specified" when none selected | TC-361 | Soft |
| REQ-002 | AC-1: Select 2+ car categories | TC-355 | Hard |
| REQ-002 | AC-2: Toggle off selected category | TC-356 | Soft |
| REQ-002 | AC-3: Select without clearing siblings | TC-355 | Soft |
| REQ-002 | AC-4: Independent `.is-selected` state | TC-358, TC-379 | Soft |
| REQ-002 | AC-5: All 14 selectable | TC-357 | Hard |
| REQ-002 | AC-6: "Not specified" when none selected | TC-363 | Soft |
| REQ-003 | AC-1: Single selection output | TC-359 | Hard |
| REQ-003 | AC-2: Multi selection comma-separated | TC-360, TC-362 | Hard |
| REQ-003 | AC-3: Zero selection "Not specified" | TC-361, TC-363 | Soft |
| REQ-003 | AC-4: Same format for car category | TC-362 | Hard |
| REQ-003 | AC-5: DOM order preserved | TC-360 | Soft |
| REQ-003 | AC-6: English `data-en-name` values | TC-364 | Hard |
| REQ-004 | AC-1: Step 1 → Step 2, no overlay | TC-365 | Hard |
| REQ-004 | AC-2: Step 2 → depth overlay | TC-366 | Hard |
| REQ-004 | AC-3: Depth confirm → Step 3 | TC-367 | Hard |
| REQ-004 | AC-4: Stepper correct sequence | TC-371 | Soft |
| REQ-004 | AC-5: Back from Step 3 → Step 2 | TC-368 | Hard |
| REQ-004 | AC-6: Back from Step 2 → Step 1 | TC-369 | Hard |
| REQ-004 | AC-7: Depth pill re-entry works | TC-370 | Hard |
| REQ-004 | AC-8: stepBeforeOverlay tracks Step 2 | TC-372 | Hard |
| REQ-005 | AC-1: Hotel toggle "No" clears all types | TC-373 | Hard |
| REQ-005 | AC-2: Car toggle "No" clears all categories | TC-374 | Hard |
| REQ-005 | AC-3: Re-enable shows clean state | TC-373, TC-374 | Soft |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `trip_intake.html` | Step 2 DOM: option grids, q-cards, data attributes | Yes — after implementation |
| `locales/ui_*.json` | i18n key `s6_multiselect_hint` | Yes — key must be added to all 12 files |
| `IntakePage.ts` | Navigation helpers: `completePrerequisiteSteps()`, `setupWithDepth()` | Yes — must update for new step order |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| TC-206 and TC-216 (existing single-select radio tests) will fail after multi-select implementation | Replace TC-206 with TC-351/352 and TC-216 with TC-355/356 in the same `test.describe` block |
| TC-329 asserts depth overlay fires after Step 1 — will fail after step reorder | Replace TC-329 with TC-365 (overlay does NOT fire after Step 1) |
| `IntakePage.completePrerequisiteSteps()` assumes depth overlay after Step 1 | Update POM: `completePrerequisiteSteps()` navigates Steps 0+1, then Step 2 Continue triggers overlay. `setupWithDepth()` calls `completePrerequisiteSteps()` then navigates Step 2 before depth. |
| TC-204 and TC-214 (reset tests) check for zero `.is-selected` but don't check `aria-pressed` | Augment TC-204/TC-214 with `aria-pressed` assertions (TC-373/TC-374) |
| Multi-select click handler may accidentally fire auto-advance on Step 2 | TC-383 specifically guards against this race condition |
| Multi-select behavior may leak to non-multi-select option grids | TC-377 counts `data-multi-select` grids (must be exactly 2); TC-381/TC-382 verify radio behavior on other grids |
| `page.waitForTimeout` in TC-383 may cause flakiness | 600ms buffer over 400ms auto-advance timer is conservative; if flaky, increase to 800ms |

## 7. Estimated Impact

- **New test count:** 35 new test cases (TC-351 through TC-385)
- **Modified existing tests:** TC-206 (replaced), TC-216 (replaced), TC-329 (replaced), TC-204 (augmented), TC-214 (augmented), TC-218 (augmented), TC-222 (augmented)
- **Estimated runtime increase:** ~25 seconds (most tests share beforeEach setup; multi-select click tests are fast; markdown tests require full navigation to Step 8)
- **Files added/modified:**
  - Modified: `automation/code/tests/intake/intake-hotel-car-assistance.spec.ts` (bulk of new tests + TC-206/TC-216 replacement)
  - Modified: `automation/code/tests/intake/intake-functional.spec.ts` (TC-329 replacement + new navigation tests TC-365-TC-372, TC-385)
  - Modified: `automation/code/tests/intake/intake-hotel-car-i18n-keys.spec.ts` (TC-384: new i18n key validation)
  - Modified: `automation/code/tests/pages/IntakePage.ts` (new locators + updated navigation helpers)

## 8. POM Changes Required (IntakePage.ts)

### New Locators Needed

| Locator Name | Selector | Purpose |
|---|---|---|
| `hotelTypeMultiSelectGrid` | `[data-question-key="hotelType"] .option-grid[data-multi-select]` | Target the multi-select grid specifically |
| `carCategoryMultiSelectGrid` | `[data-question-key="carCategory"] .option-grid[data-multi-select]` | Target the multi-select grid specifically |
| `multiSelectHints` | `.option-grid__hint` | All multi-select hint labels |

### Navigation Helper Updates

| Method | Current Behavior | New Behavior |
|---|---|---|
| `completePrerequisiteSteps()` | Calls `completeStep0()` + `completeStep1()` — depth overlay appears | Calls `completeStep0()` + `completeStep1()` — lands on Step 2 (no overlay). Add `completeStep2()` method. |
| `setupWithDepth(depth)` | Calls `completePrerequisiteSteps()` then `selectDepthAndConfirm(depth)` | Must click Continue on Step 2 to trigger depth overlay, then `selectDepthAndConfirm(depth)`. Lands on Step 3. |
| NEW: `completeStep2()` | N/A | Clicks Continue on Step 2 to trigger depth overlay. |
