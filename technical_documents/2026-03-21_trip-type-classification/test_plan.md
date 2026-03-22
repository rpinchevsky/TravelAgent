# Test Plan

**Change:** Trip Type Classification & Type-Aware Question Bank
**Date:** 2026-03-21
**Author:** Automation Engineer
**BRD Reference:** business_requirements.md
**DD Reference:** detailed_design.md
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- Trip type detection logic for all 6 types (Solo, Couple, Young, Adults, Family, Multi-generational)
- Priority-order edge cases (Couple vs. Young ambiguity, Solo senior override)
- Re-detection when travelers change
- Age-at-arrival-date calculation (not current date)
- Family balance computation (kid-focused, balanced, teen-friendly)
- Trip type UI indicator: context bar pill visibility, icon, click-to-Step-1 behavior
- Trip type toast notification after detection
- Expanded question bank structure (~72 questions, 8 categories A-H)
- Type-aware question filtering: only applicable questions shown per trip type
- Depth selector adaptation: trip-type-aware counts, "(max)" badge, recommended badge relocation
- Category-based question ordering (A-H, then tier within category)
- Sub-step dots reflecting filtered question count
- Type-aware pre-selection scoring on Steps 3-5
- Generated markdown output: Trip Type field, Family Balance sub-field
- Preview in Step 7 showing trip type field
- Hidden (non-applicable) questions defaulting correctly in markdown

**Out of scope:**
- Step 0 (destination/dates) — unchanged
- Bridge server and trip generation pipeline — not intake wizard
- i18n translation correctness for all 12 languages (covered by existing `intake-i18n-full.spec.ts`)
- RTL layout of trip type pill (covered by existing `intake-rtl.spec.ts`)
- Dark mode styling (covered by existing `intake-darkmode.spec.ts`)
- Accessibility of new elements (will extend existing `intake-a11y-full.spec.ts` in a separate plan)
- Visual screenshot regression (will extend existing `intake-visual-consistency.spec.ts` in a separate plan)
- `trip_planning_rules.md` changes (REQ-008) — rule file content, not testable via intake UI

**Test type:** Progression (new feature) + Regression (existing depth selector, context bar, markdown output)

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Standard `@playwright/test` (mutation tests — wizard interaction with clicks, typing, navigation)
- **Target file:** `trip_intake.html`
- **POM:** `IntakePage.ts`

## 3. Test Cases

### Spec File: `intake-trip-type-detection.spec.ts`

Tests trip type classification logic (REQ-001) by setting up various traveler compositions on Step 1 and asserting the detected trip type via the context bar pill and/or exposed DOM attribute.

---

#### TC-100: Solo detection — 1 adult, 0 children

**Traces to:** REQ-001 → AC-1
**Type:** Progression
**Spec file:** `intake-trip-type-detection.spec.ts`
**Priority:** Critical

**Preconditions:**
- Page loaded, Step 0 completed with a future arrival date
- On Step 1

**Steps:**
1. Default traveler setup: 1 adult. Set adult birth year to yield age 25 at arrival date.
2. Click Continue to advance past Step 1.

**Expected result:**
- Trip type pill is visible in context bar with `data-trip-type="Solo"` (or equivalent attribute).
- Toast notification appears (`.toast` element is visible).

**Implementation notes:**
- Use `expect.soft()` for pill visibility and data attribute.
- Set birth year via `.dob-year` select on the traveler card.
- Assert on `data-trip-type` attribute (language-independent), NOT on pill text content.

---

#### TC-101: Couple detection — 2 adults, 0 children

**Traces to:** REQ-001 → AC-2
**Type:** Progression
**Spec file:** `intake-trip-type-detection.spec.ts`
**Priority:** Critical

**Preconditions:**
- Step 0 completed
- On Step 1

**Steps:**
1. Click adult "+" to add a second adult (total 2).
2. Set adult 1 birth year → age 30 at arrival. Set adult 2 birth year → age 28 at arrival.
3. Fill required name fields for both adults.
4. Click Continue.

**Expected result:**
- Trip type pill shows `data-trip-type="Couple"`.

**Implementation notes:**
- Verify no children present (`#childCount` text is "0").

---

#### TC-102: Young detection — 3+ adults all 18-30, 0 children

**Traces to:** REQ-001 → AC-3
**Type:** Progression
**Spec file:** `intake-trip-type-detection.spec.ts`
**Priority:** Critical

**Preconditions:**
- Step 0 completed
- On Step 1

**Steps:**
1. Add 3 adults via "+" button (total 3).
2. Set all birth years to yield ages 22, 25, 29 at arrival date.
3. Fill required name fields for all 3.
4. Click Continue.

**Expected result:**
- Trip type pill shows `data-trip-type="Young"`.

**Implementation notes:**
- Young requires 3+ adults per DD clarification (2 adults 18-30 = Couple).

---

#### TC-103: Family detection — adults + children, no seniors

**Traces to:** REQ-001 → AC-4
**Type:** Progression
**Spec file:** `intake-trip-type-detection.spec.ts`
**Priority:** Critical

**Preconditions:**
- Step 0 completed
- On Step 1

**Steps:**
1. Set 2 adults (ages 35 and 33 at arrival).
2. Add 1 child via child "+" button. Set child birth year → age 5 at arrival.
3. Fill required name fields.
4. Click Continue.

**Expected result:**
- Trip type pill shows `data-trip-type="Family"`.

---

#### TC-104: Multi-generational detection — senior 65+ AND child

**Traces to:** REQ-001 → AC-5
**Type:** Progression
**Spec file:** `intake-trip-type-detection.spec.ts`
**Priority:** Critical

**Preconditions:**
- Step 0 completed
- On Step 1

**Steps:**
1. Set up 3 adults (ages 68, 65, 35 at arrival) and 1 child (age 8 at arrival).
2. Fill name fields.
3. Click Continue.

**Expected result:**
- Trip type pill shows `data-trip-type="Multi-generational"`.

---

#### TC-105: Adults detection — all adults 18+, 0 children (catch-all)

**Traces to:** REQ-001 → AC-6
**Type:** Progression
**Spec file:** `intake-trip-type-detection.spec.ts`
**Priority:** Critical

**Preconditions:**
- Step 0 completed
- On Step 1

**Steps:**
1. Set 4 adults (ages 40, 45, 50, 55 at arrival).
2. Fill name fields.
3. Click Continue.

**Expected result:**
- Trip type pill shows `data-trip-type="Adults"`.

---

#### TC-106: Couple priority over Young — 2 adults aged 18-30

**Traces to:** REQ-001 → AC-7
**Type:** Progression
**Spec file:** `intake-trip-type-detection.spec.ts`
**Priority:** High

**Preconditions:**
- Step 0 completed
- On Step 1

**Steps:**
1. Set 2 adults (ages 28 and 29 at arrival). 0 children.
2. Fill name fields.
3. Click Continue.

**Expected result:**
- Trip type pill shows `data-trip-type="Couple"` (NOT "Young").

**Implementation notes:**
- This is the key priority-order edge case: Couple (Priority 2) matches before Young (Priority 3).

---

#### TC-107: Re-detection on traveler change

**Traces to:** REQ-001 → AC-8
**Type:** Progression
**Spec file:** `intake-trip-type-detection.spec.ts`
**Priority:** High

**Preconditions:**
- Complete Steps 0-1 with 1 adult (Solo detected).
- Depth overlay visible.

**Steps:**
1. Navigate back to Step 1 (click Back or click travelers context pill).
2. Add a second adult. Set birth year to yield age 30 at arrival.
3. Fill name field.
4. Click Continue again.

**Expected result:**
- Trip type pill updates from `data-trip-type="Solo"` to `data-trip-type="Couple"`.

---

#### TC-108: Age calculated at arrival date, not current date

**Traces to:** REQ-001 → AC-9
**Type:** Progression
**Spec file:** `intake-trip-type-detection.spec.ts`
**Priority:** High

**Preconditions:**
- Step 0: set arrival date to a specific future date where a traveler crosses an age boundary.

**Steps:**
1. Set arrival date such that a traveler born in a specific year will be 17 at arrival (child) vs. 18 (adult).
2. Add that traveler as an adult. (System computes age from DOB at arrival date.)
3. Add 1 parent adult aged 35.
4. If traveler is 17 at arrival → Family. If 18 → Couple or Adults.
5. Click Continue.

**Expected result:**
- Trip type reflects the age at arrival date. E.g., if the second traveler turns 18 after the arrival date, system treats them as 17 → Family detection, not Couple.

**Implementation notes:**
- Choose dates carefully to make the boundary unambiguous. E.g., arrival = 2026-06-01, traveler DOB = 2008-07-15 → age 17 at arrival.

---

#### TC-109: Solo with senior — 1 adult aged 70, 0 children → Solo

**Traces to:** REQ-001 → AC-10
**Type:** Progression
**Spec file:** `intake-trip-type-detection.spec.ts`
**Priority:** High

**Preconditions:**
- Step 0 completed
- On Step 1

**Steps:**
1. Set 1 adult with birth year → age 70 at arrival. 0 children.
2. Click Continue.

**Expected result:**
- Trip type pill shows `data-trip-type="Solo"` (Solo overrides Adults even with senior age).

---

### Spec File: `intake-trip-type-ui.spec.ts`

Tests the trip type UI indicator (REQ-002): context bar pill, toast notification, pill interactivity.

---

#### TC-110: Trip type indicator displayed after Step 1 completion

**Traces to:** REQ-002 → AC-1
**Type:** Progression
**Spec file:** `intake-trip-type-ui.spec.ts`
**Priority:** Critical

**Preconditions:**
- Page loaded, Step 0 completed

**Steps:**
1. Complete Step 1 with 1 valid adult (name + DOB).
2. Observe the page after Step 1 completion.

**Expected result:**
- A toast notification (`.toast`) is visible, containing the trip type icon element.
- The trip type pill (`#tripTypePill` or `.context-bar__pill--triptype`) becomes visible.

**Implementation notes:**
- Toast may auto-dismiss; use `expect(toast).toBeVisible()` with Playwright auto-wait.
- Do not assert toast text (language-dependent). Assert structural presence only.

---

#### TC-111: Context bar trip type pill with icon

**Traces to:** REQ-002 → AC-2
**Type:** Progression
**Spec file:** `intake-trip-type-ui.spec.ts`
**Priority:** Critical

**Preconditions:**
- Completed Step 1, depth overlay visible or dismissed

**Steps:**
1. Complete Step 1 with 2 adults (Couple detection).
2. Select depth and confirm.
3. Inspect context bar on Step 2.

**Expected result:**
- Trip type pill (`.context-bar__pill--triptype`) is visible.
- Pill contains an icon element (`#tripTypeIcon` or `.context-bar__pill-icon`).
- Pill contains a text span (`#tripTypePillText`).
- Pill has `data-trip-type` attribute matching the detected type.

---

#### TC-112: Trip type pill updates on traveler change

**Traces to:** REQ-002 → AC-3
**Type:** Progression
**Spec file:** `intake-trip-type-ui.spec.ts`
**Priority:** High

**Preconditions:**
- Wizard at Step 2+ with Solo detected

**Steps:**
1. Navigate back to Step 1 (click trip type pill or back button).
2. Add a second adult, fill name/DOB.
3. Click Continue.

**Expected result:**
- Trip type pill `data-trip-type` value changes from "Solo" to "Couple".

---

#### TC-113: Trip type pill click navigates to Step 1

**Traces to:** REQ-002 → AC-5
**Type:** Progression
**Spec file:** `intake-trip-type-ui.spec.ts`
**Priority:** Medium

**Preconditions:**
- Wizard at Step 2 or later with trip type pill visible

**Steps:**
1. Click the trip type pill in the context bar.

**Expected result:**
- Wizard navigates to Step 1 (`.step[data-step="1"]` becomes visible).

---

### Spec File: `intake-question-bank.spec.ts`

Tests the expanded question bank structure (REQ-003) and category-based ordering (REQ-010).

---

#### TC-120: Question bank contains 65-75 questions total

**Traces to:** REQ-003 → AC-1
**Type:** Progression
**Spec file:** `intake-question-bank.spec.ts`
**Priority:** Critical

**Preconditions:**
- Page loaded

**Steps:**
1. Evaluate DOM: count all elements with `[data-question-key]` attribute (regardless of visibility).

**Expected result:**
- Count is between 65 and 75 (inclusive).

**Implementation notes:**
- Use `page.evaluate()` to count all `[data-question-key]` elements in the DOM.
- This is a structural assertion, not dependent on trip type or depth.

---

#### TC-121: All 30 existing questions preserved

**Traces to:** REQ-003 → AC-2
**Type:** Regression
**Spec file:** `intake-question-bank.spec.ts`
**Priority:** Critical

**Preconditions:**
- Page loaded

**Steps:**
1. Define an array of all 30 existing question keys (from DD: rhythm, pace, morningPreference, walkingTolerance, budget, flexibility, transport, weatherSensitivity, setting, culture, culturalImmersion, visitDuration, foodadventure, diet, diningstyle, kidsfood, mealpriority, localfood, snacking, groupSplitting, socialInteraction, surpriseOpenness, noise, nightlife, relaxationTime, crowdTolerance, photography, souvenirShopping, shopping, accessibility).
2. For each key, check that `[data-question-key="${key}"]` exists in the DOM.

**Expected result:**
- All 30 elements exist (soft assertion per key with descriptive message).

**Implementation notes:**
- Use `expect.soft()` in a loop with message `'Existing question ${key} preserved'`.
- The key list is derived from the DD, not from hardcoded text.

---

#### TC-122: Each question has category, tier, and options

**Traces to:** REQ-003 → AC-3
**Type:** Progression
**Spec file:** `intake-question-bank.spec.ts`
**Priority:** High

**Preconditions:**
- Page loaded

**Steps:**
1. For each `[data-question-key]` element, verify:
   - `data-tier` attribute exists and is a number 1-5.
   - Element contains `.question-options` with 3-4 `.q-card` children.

**Expected result:**
- All questions pass both checks (soft assertions).

**Implementation notes:**
- Category membership is in JS (`QUESTION_META`), not directly in DOM. Verify category via `data-category` attribute if added, or skip category DOM assertion and verify via ordering test (TC-140).

---

#### TC-123: Every trip type has at least 15 applicable questions

**Traces to:** REQ-003 → AC-4
**Type:** Progression
**Spec file:** `intake-question-bank.spec.ts`
**Priority:** High

**Preconditions:**
- Page loaded. Set up 6 different traveler compositions (one per trip type).

**Steps:**
1. For each trip type, configure travelers, advance past Step 1 to trigger detection, then count visible questions at maximum depth (30).
2. Alternatively, use `page.evaluate()` to call the exposed `getTypeFilteredQuestions(type)` function if accessible, or inspect `QUESTION_META` from JS context.

**Expected result:**
- Each trip type has >= 15 applicable questions.

**Implementation notes:**
- Prefer JS evaluation over full wizard navigation for performance.
- If `QUESTION_META` is accessible: `Object.values(QUESTION_META).filter(m => m.appliesTo.includes(type)).length >= 15`.
- Use data-driven pattern: array of trip types, one `expect.soft()` per type.

---

#### TC-124: Category H has at least 7 questions, all new

**Traces to:** REQ-003 → AC-5
**Type:** Progression
**Spec file:** `intake-question-bank.spec.ts`
**Priority:** Medium

**Preconditions:**
- Page loaded

**Steps:**
1. Evaluate JS: filter `QUESTION_META` entries where `category === 'H'`.
2. Count them.
3. Verify known H-category keys (specialOccasion, romanticMoments, celebrationStyle, photoOpPriority, localConnections, petFriendly, sustainableTravel) are present.

**Expected result:**
- At least 7 questions in category H.
- All H-category keys are new (not in the original 30).

---

#### TC-125: New questions follow 3-4 option format

**Traces to:** REQ-003 → AC-6
**Type:** Progression
**Spec file:** `intake-question-bank.spec.ts`
**Priority:** Medium

**Preconditions:**
- Page loaded

**Steps:**
1. For each `[data-question-key]` element, count `.q-card` children within `.question-options`.

**Expected result:**
- Every question has 3 or 4 `.q-card` options.

**Implementation notes:**
- Combined with TC-122 if desired; separate for traceability.

---

#### TC-126: QUESTION_DEFAULTS includes defaults for all questions

**Traces to:** REQ-003 → AC-7
**Type:** Progression
**Spec file:** `intake-question-bank.spec.ts`
**Priority:** Medium

**Preconditions:**
- Page loaded

**Steps:**
1. Evaluate JS: get all keys from `QUESTION_META` (or all `data-question-key` values from DOM).
2. For each key, verify `QUESTION_DEFAULTS[key]` is defined and non-empty.

**Expected result:**
- Every question key has a default value.

---

### Spec File: `intake-type-filtering.spec.ts`

Tests type-aware question filtering (REQ-004) and depth selector adaptation (REQ-009).

---

#### TC-130: Solo trip at depth 20 shows only Solo-applicable questions

**Traces to:** REQ-004 → AC-1
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** Critical

**Preconditions:**
- Set up Solo traveler (1 adult, age 25)

**Steps:**
1. Complete Step 0 and Step 1 with Solo traveler.
2. Select depth 20 and confirm.
3. Count visible questions on Step 2 (use `getVisibleQuestionKeys()`).
4. Evaluate JS: get list of question keys where `QUESTION_META[key].appliesTo` does NOT include "Solo".

**Expected result:**
- No visible question has a key that is not in the Solo-applicable set.
- All visible questions have `appliesTo` including "Solo".

**Implementation notes:**
- Use `page.evaluate()` to get the Solo-applicable key set from `QUESTION_META`, then compare with `getVisibleQuestionKeys()`.

---

#### TC-131: Family trip at depth 20 shows only Family-applicable questions

**Traces to:** REQ-004 → AC-2
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** Critical

**Preconditions:**
- Set up Family traveler composition (2 adults ages 35, 33 + 1 child age 5)

**Steps:**
1. Complete Step 0 and Step 1 with Family composition.
2. Select depth 20 and confirm.
3. Get visible question keys.

**Expected result:**
- All visible questions have `appliesTo` including "Family".
- No non-Family question is visible.

---

#### TC-132: Non-applicable questions never shown

**Traces to:** REQ-004 → AC-3
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** Critical

**Preconditions:**
- Set up Couple traveler (2 adults, no children)

**Steps:**
1. Complete through depth selector at depth 30 (maximum).
2. Get all visible question keys.
3. Get the full Couple-applicable set from `QUESTION_META`.

**Expected result:**
- Every visible question key is in the Couple-applicable set.
- Questions like `kidsfood`, `napSchedule`, `kidActivityStyle` (which apply only to Family/Multi-gen) are NOT visible.

**Implementation notes:**
- Depth 30 shows maximum questions, so any non-applicable question would be visible if filtering fails.

---

#### TC-133: Hidden questions use default values in markdown

**Traces to:** REQ-004 → AC-4
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** High

**Preconditions:**
- Set up Solo traveler, select depth 10 (minimal questions)

**Steps:**
1. Navigate through all steps to Step 7 (review).
2. Get raw markdown output.
3. Identify a question key that is hidden for Solo (e.g., `kidsfood`).
4. Check if the markdown contains the default value for that key.

**Expected result:**
- Hidden questions' default values are present in the generated markdown (or the question is omitted entirely if that is the design decision).

**Implementation notes:**
- Use `getRawMarkdown()` from IntakePage POM.
- Assert structurally: check for presence of the default value string in the markdown section for that question dimension.

---

#### TC-134: Depth selector shows available question count for trip type

**Traces to:** REQ-004 → AC-5, REQ-009 → AC-2
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** High

**Preconditions:**
- Set up Solo traveler, reach depth overlay

**Steps:**
1. Complete Step 1 with Solo traveler.
2. Depth overlay opens. Inspect each depth card's `.depth-card__count` element.

**Expected result:**
- Each depth card displays a number representing the count of Solo-applicable questions at that tier level.
- The count is a positive integer (not zero, not NaN).

**Implementation notes:**
- Compare displayed count against computed expected count from `QUESTION_META` if accessible.

---

#### TC-135: Depth selector handles filtered pool smaller than max depth

**Traces to:** REQ-004 → AC-6, REQ-009 → AC-3
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** High

**Preconditions:**
- Set up a trip type where the filtered pool at max tier is < 30 (per DD, all types have 46+ questions, so this edge case may only manifest if pool < depth number at a specific tier)

**Steps:**
1. Complete Step 1 with a trip type.
2. On depth overlay, check if any depth card shows a "(max)" badge (`.depth-card__max` element).
3. Select the highest depth and confirm.
4. Count visible questions.

**Expected result:**
- No error or crash occurs.
- If the filtered pool at the selected tier has fewer questions than the depth number, all available questions are shown.
- The UI shows "(max)" indicator if applicable.

---

#### TC-136: Tier ordering preserved within filtered set

**Traces to:** REQ-004 → AC-7
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** Medium

**Preconditions:**
- Set up any trip type, select depth 30

**Steps:**
1. Navigate to Step 2.
2. Get all visible question keys in presentation order.
3. For each consecutive pair of questions within the same category, verify the tier of the first <= tier of the second.

**Expected result:**
- Within each category group, questions are ordered by tier (T1 before T2 before T3, etc.).

**Implementation notes:**
- Use `page.evaluate()` to read `data-tier` and `data-category` (or determine category from `QUESTION_META`) for each visible question in DOM order.

---

#### TC-137: Sub-step dots reflect filtered question count

**Traces to:** REQ-004 → AC-8
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** Medium

**Preconditions:**
- Set up Solo traveler, select depth 20

**Steps:**
1. Navigate to Step 2.
2. Count sub-step dots (`.quiz-dots__dot` within the Step 2 section).
3. Count visible questions.

**Expected result:**
- Number of sub-step dots equals number of visible questions in Step 2.

---

#### TC-138: Changing trip type resets Step 2 questions

**Traces to:** REQ-004 → AC-9
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** High

**Preconditions:**
- Set up Solo traveler, reach Step 2

**Steps:**
1. Complete wizard through to Step 2 with Solo trip type.
2. Record visible question keys.
3. Navigate back to Step 1.
4. Change travelers to Family composition (add child).
5. Click Continue, re-select depth, confirm.
6. Record new visible question keys.

**Expected result:**
- The question set changes: Family-specific questions (e.g., `kidsfood`, `napSchedule`) now visible.
- Solo-only questions that don't apply to Family may be hidden.
- Sub-step dots updated to reflect new count.

---

#### TC-139: Depth overlay shows trip type name

**Traces to:** REQ-009 → AC-1
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** Medium

**Preconditions:**
- Set up Couple traveler

**Steps:**
1. Complete Step 1 with Couple composition.
2. Depth overlay opens.
3. Check for subtitle element (`.depth-overlay__subtitle`) in the overlay.

**Expected result:**
- Subtitle element exists and is not empty.
- Subtitle contains the trip type identifier (verify via `data-trip-type` attribute on overlay or via structural presence, NOT by matching language-specific text).

**Implementation notes:**
- If the subtitle text is i18n-translated, assert on element presence and non-empty textContent rather than specific text.

---

#### TC-141: Recommended badge adjusts for trip type

**Traces to:** REQ-009 → AC-4
**Type:** Progression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** Medium

**Preconditions:**
- Reach depth overlay

**Steps:**
1. Complete Step 1 with any trip type.
2. On depth overlay, find the depth card with `.is-recommended` class.

**Expected result:**
- Exactly one depth card has `.is-recommended`.
- If the type's available count at depth 20 >= 20, the recommended badge is on depth card 20.
- (If pool is smaller — which is unlikely per DD — badge moves to an appropriate card.)

---

#### TC-142: Keyboard navigation works on adapted depth cards

**Traces to:** REQ-009 → AC-6
**Type:** Regression
**Spec file:** `intake-type-filtering.spec.ts`
**Priority:** Medium

**Preconditions:**
- Depth overlay visible after Step 1

**Steps:**
1. Focus the first depth card.
2. Press ArrowRight/ArrowDown to navigate between cards.
3. Press Enter/Space to select.

**Expected result:**
- Focus moves between depth cards via keyboard.
- Selected card changes on Enter/Space.
- Confirm button is keyboard-accessible.

---

### Spec File: `intake-question-ordering.spec.ts`

Tests category-based question organization (REQ-010).

---

#### TC-140: Questions grouped by category A-H in order

**Traces to:** REQ-010 → AC-1, AC-2
**Type:** Progression
**Spec file:** `intake-question-ordering.spec.ts`
**Priority:** Medium

**Preconditions:**
- Set up any trip type, select depth 30

**Steps:**
1. Navigate to Step 2.
2. Get all visible question keys in presentation order.
3. Map each key to its category (via `page.evaluate()` reading `QUESTION_META`).
4. Verify categories appear in non-decreasing alphabetical order (A before B before C ... before H).

**Expected result:**
- No category reversal: once category B starts, no category A question follows, etc.

---

#### TC-143: Within-category tier ordering

**Traces to:** REQ-010 → AC-3
**Type:** Progression
**Spec file:** `intake-question-ordering.spec.ts`
**Priority:** Medium

**Preconditions:**
- Same as TC-140

**Steps:**
1. For each category group, verify tier values are non-decreasing.

**Expected result:**
- T1 questions before T2, T2 before T3, etc. within each category.

**Implementation notes:**
- Combine with TC-136 or keep separate for clear traceability.

---

#### TC-144: Ordering consistent across trip types

**Traces to:** REQ-010 → AC-4
**Type:** Progression
**Spec file:** `intake-question-ordering.spec.ts`
**Priority:** Low

**Preconditions:**
- Two different trip types

**Steps:**
1. Set up Solo traveler, depth 30. Get visible question keys in order.
2. Set up Family traveler, depth 30. Get visible question keys in order.
3. Find the intersection (questions common to both).
4. Verify the relative order of common questions is the same in both sets.

**Expected result:**
- Common questions maintain consistent relative order regardless of trip type.

---

### Spec File: `intake-family-balance.spec.ts`

Tests family balance computation (REQ-005).

---

#### TC-150: Family with toddler → kid-focused balance

**Traces to:** REQ-005 → AC-1
**Type:** Progression
**Spec file:** `intake-family-balance.spec.ts`
**Priority:** High

**Preconditions:**
- Step 0 completed

**Steps:**
1. Set up 2 adults (ages 35, 33) and 1 child (age 2 at arrival — toddler).
2. Complete Step 1.

**Expected result:**
- Trip type is "Family".
- Family balance is "kid-focused" (verifiable via markdown output or DOM attribute `data-family-balance`).

**Implementation notes:**
- Navigate to Step 7 and check markdown output for `Family Balance: kid-focused`, OR check a DOM data attribute on the trip type pill.

---

#### TC-151: Family with toddler + teen → balanced

**Traces to:** REQ-005 → AC-2
**Type:** Progression
**Spec file:** `intake-family-balance.spec.ts`
**Priority:** High

**Preconditions:**
- Step 0 completed

**Steps:**
1. Set up 2 adults and 2 children: 1 toddler (age 2) + 1 teen (age 15).
2. Complete Step 1.

**Expected result:**
- Family balance is "balanced".

---

#### TC-152: Family with teen → teen-friendly balance

**Traces to:** REQ-005 → AC-1 (inverse)
**Type:** Progression
**Spec file:** `intake-family-balance.spec.ts`
**Priority:** High

**Preconditions:**
- Step 0 completed

**Steps:**
1. Set up 2 adults and 1 child (age 15 — teen).
2. Complete Step 1.

**Expected result:**
- Family balance is "teen-friendly".

---

#### TC-153: Family balance within filtered pool only

**Traces to:** REQ-005 → AC-3
**Type:** Progression
**Spec file:** `intake-family-balance.spec.ts`
**Priority:** Medium

**Preconditions:**
- Set up Family with toddler (kid-focused balance), depth 30

**Steps:**
1. Navigate to Step 2.
2. Verify all visible questions have `appliesTo` including "Family".
3. Verify that the question ordering reflects family balance (kid-safety tagged questions appear earlier for kid-focused).

**Expected result:**
- No non-Family questions visible.
- Kid-safety questions (`napSchedule`, `energyManagement`, `kidActivityStyle`) appear in the first half of their respective categories.

**Implementation notes:**
- This is a soft assertion on ordering patterns, not a strict positional check.

---

#### TC-154: Family balance in markdown output

**Traces to:** REQ-005 → AC-4
**Type:** Progression
**Spec file:** `intake-family-balance.spec.ts`
**Priority:** High

**Preconditions:**
- Set up Family trip with toddler

**Steps:**
1. Navigate through wizard to Step 7.
2. Get raw markdown.

**Expected result:**
- Markdown contains `**Family Balance:**` followed by one of: `kid-focused`, `balanced`, `teen-friendly`.

---

### Spec File: `intake-preselection-scoring.spec.ts`

Tests type-aware pre-selection scoring on Steps 3-5 (REQ-006).

---

#### TC-160: Couple trip pre-selects romantic interest cards

**Traces to:** REQ-006 → AC-2
**Type:** Progression
**Spec file:** `intake-preselection-scoring.spec.ts`
**Priority:** High

**Preconditions:**
- Set up Couple trip (2 adults), select depth 20

**Steps:**
1. Navigate to Step 3 (Interests).
2. Count pre-selected interest cards (`.interest-card` with `.is-selected` or `[aria-checked="true"]`).
3. Identify cards that are tagged as romantic (via `data-card-id` or similar attribute matching `TRIP_TYPE_SCORING.Couple.interestBonus` keys).

**Expected result:**
- At least 2 romantic-tagged interest cards are pre-selected.
- Total pre-selected count is within 8-15 range.

**Implementation notes:**
- To avoid language-dependent assertions, identify romantic cards by data attribute or by checking against the scoring table keys via `page.evaluate()`.

---

#### TC-161: Multi-generational pre-selects accessibility avoid cards

**Traces to:** REQ-006 → AC-3
**Type:** Progression
**Spec file:** `intake-preselection-scoring.spec.ts`
**Priority:** High

**Preconditions:**
- Set up Multi-generational trip (2 seniors + 1 adult + 1 child)

**Steps:**
1. Navigate to Step 4 (Avoids).
2. Identify pre-selected avoid cards.
3. Check for accessibility-related avoids (from `TRIP_TYPE_SCORING['Multi-generational'].avoidBonus`).

**Expected result:**
- At least 1 accessibility-related avoid card is pre-selected.

---

#### TC-162: Solo pre-selects safety/comfort interest cards

**Traces to:** REQ-006 → AC-4
**Type:** Progression
**Spec file:** `intake-preselection-scoring.spec.ts`
**Priority:** High

**Preconditions:**
- Set up Solo trip (1 adult)

**Steps:**
1. Navigate to Step 3 (Interests).
2. Check pre-selected cards for safety/social-comfort tags.

**Expected result:**
- At least 1 safety or social-comfort interest card is pre-selected.

---

#### TC-163: Pre-selection count stays within 8-15 chip range

**Traces to:** REQ-006 → AC-5
**Type:** Progression
**Spec file:** `intake-preselection-scoring.spec.ts`
**Priority:** High

**Preconditions:**
- Set up each trip type, select depth 20

**Steps:**
1. For each trip type, navigate to Step 3 and count pre-selected interest cards.
2. Navigate to Step 4 and count pre-selected avoid cards.

**Expected result:**
- Interest pre-selections: between 8 and 15 (inclusive).
- Avoid pre-selections: reasonable count (no explosion due to type bonuses).

**Implementation notes:**
- Data-driven: loop over trip types with `expect.soft()`.

---

#### TC-164: analyzeGroup() flags still work alongside trip type

**Traces to:** REQ-006 → AC-6
**Type:** Regression
**Spec file:** `intake-preselection-scoring.spec.ts`
**Priority:** Medium

**Preconditions:**
- Set up Family trip (triggers both `analyzeGroup()` flags and trip type scoring)

**Steps:**
1. Navigate to Step 3.
2. Verify that pre-selection reflects both group profile flags (e.g., `hasChildren` flag effects) AND trip type bonus.

**Expected result:**
- Pre-selected cards include both flag-influenced and type-bonus-influenced selections.

**Implementation notes:**
- Compare pre-selection set against expected items from both scoring mechanisms.

---

### Spec File: `intake-trip-type-output.spec.ts`

Tests trip type in generated markdown output (REQ-007).

---

#### TC-170: Markdown contains Trip Type field

**Traces to:** REQ-007 → AC-1, AC-2
**Type:** Progression
**Spec file:** `intake-trip-type-output.spec.ts`
**Priority:** Critical

**Preconditions:**
- Complete wizard for Solo trip type

**Steps:**
1. Navigate to Step 7 (review/preview).
2. Get raw markdown via `getRawMarkdown()`.

**Expected result:**
- Markdown contains the string `**Trip Type:** Solo`.
- The field appears in the `## Trip Context` section (after `**Departure:**`).

**Implementation notes:**
- Use regex: `/\*\*Trip Type:\*\*\s*(Solo|Couple|Young|Adults|Family|Multi-generational)/`.
- Trip type value is always in English (language-independent assertion).

---

#### TC-171: Family trip includes Family Balance sub-field

**Traces to:** REQ-007 → AC-3
**Type:** Progression
**Spec file:** `intake-trip-type-output.spec.ts`
**Priority:** High

**Preconditions:**
- Complete wizard for Family trip with toddler

**Steps:**
1. Navigate to Step 7.
2. Get raw markdown.

**Expected result:**
- Markdown contains `**Trip Type:** Family`.
- Markdown contains `**Family Balance:** kid-focused` (or `balanced` or `teen-friendly` depending on composition).

---

#### TC-172: Non-family trip does NOT include Family Balance

**Traces to:** REQ-007 → AC-4
**Type:** Progression
**Spec file:** `intake-trip-type-output.spec.ts`
**Priority:** High

**Preconditions:**
- Complete wizard for Solo trip

**Steps:**
1. Navigate to Step 7.
2. Get raw markdown.

**Expected result:**
- Markdown contains `**Trip Type:** Solo`.
- Markdown does NOT contain `**Family Balance:**`.

---

#### TC-173: Trip type value is always in English

**Traces to:** REQ-007 → AC-5
**Type:** Progression
**Spec file:** `intake-trip-type-output.spec.ts`
**Priority:** High

**Preconditions:**
- Switch UI language to Russian (or Hebrew) before starting wizard

**Steps:**
1. Switch language via `switchLanguage('ru')`.
2. Complete wizard for Couple trip.
3. Navigate to Step 7.
4. Get raw markdown.

**Expected result:**
- Markdown contains `**Trip Type:** Couple` (English value, not translated).

**Implementation notes:**
- This confirms the trip type identifier is language-independent in the output.

---

#### TC-174: Preview in Step 7 shows trip type field

**Traces to:** REQ-007 → AC-6
**Type:** Progression
**Spec file:** `intake-trip-type-output.spec.ts`
**Priority:** Medium

**Preconditions:**
- Complete wizard for any trip type

**Steps:**
1. Navigate to Step 7.
2. Inspect the preview content element (`#previewContent`).

**Expected result:**
- Preview content contains the trip type field text.

---

#### TC-175: All 6 trip types produce valid Trip Type values in markdown

**Traces to:** REQ-007 → AC-1 (comprehensive)
**Type:** Progression
**Spec file:** `intake-trip-type-output.spec.ts`
**Priority:** High

**Preconditions:**
- 6 test iterations, one per trip type

**Steps:**
1. For each trip type composition: set up travelers, complete wizard, get markdown.
2. Verify `**Trip Type:**` matches the expected value.

**Expected result:**
- Each trip type name appears correctly: Solo, Couple, Young, Adults, Family, Multi-generational.

**Implementation notes:**
- Data-driven test with parameterized traveler setups.
- Use `test.describe` with `for...of` loop or `test.each()`.
- This is a long-running test (6 full wizard completions). Consider marking as `@slow`.

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 AC-1 | Solo: 1 adult → Solo | TC-100 | `data-trip-type` attribute |
| REQ-001 AC-2 | Couple: 2 adults → Couple | TC-101 | `data-trip-type` attribute |
| REQ-001 AC-3 | Young: 3 adults 18-30 → Young | TC-102 | `data-trip-type` attribute |
| REQ-001 AC-4 | Family: adults + child → Family | TC-103 | `data-trip-type` attribute |
| REQ-001 AC-5 | Multi-gen: senior + child → Multi-gen | TC-104 | `data-trip-type` attribute |
| REQ-001 AC-6 | Adults: 4 adults 40-55 → Adults | TC-105 | `data-trip-type` attribute |
| REQ-001 AC-7 | 2 adults 18-30 → Couple (not Young) | TC-106 | `data-trip-type` attribute |
| REQ-001 AC-8 | Re-detection on traveler change | TC-107 | Pill attribute change |
| REQ-001 AC-9 | Age at arrival date | TC-108 | Detection uses DOB + arrival |
| REQ-001 AC-10 | 1 senior → Solo | TC-109 | `data-trip-type` attribute |
| REQ-002 AC-1 | Indicator displayed after Step 1 | TC-110 | Toast + pill visible |
| REQ-002 AC-2 | Context bar pill with icon + name | TC-111 | Pill structure |
| REQ-002 AC-3 | Pill updates on traveler change | TC-112 | Attribute change |
| REQ-002 AC-4 | i18n for 12 languages | Out of scope (existing i18n specs) | — |
| REQ-002 AC-5 | Pill click → Step 1 | TC-113 | Navigation assertion |
| REQ-002 AC-6 | RTL layout | Out of scope (existing RTL specs) | — |
| REQ-003 AC-1 | 65-75 questions total | TC-120 | DOM element count |
| REQ-003 AC-2 | All 30 existing preserved | TC-121 | Per-key DOM presence |
| REQ-003 AC-3 | Category, tier, options per question | TC-122 | Attribute + child count |
| REQ-003 AC-4 | >= 15 questions per type | TC-123 | JS evaluation count |
| REQ-003 AC-5 | Category H >= 7, all new | TC-124 | JS evaluation |
| REQ-003 AC-6 | 3-4 option format | TC-125 | Child element count |
| REQ-003 AC-7 | QUESTION_DEFAULTS for all | TC-126 | JS evaluation |
| REQ-004 AC-1 | Solo filtering | TC-130 | Visible key set |
| REQ-004 AC-2 | Family filtering | TC-131 | Visible key set |
| REQ-004 AC-3 | Non-applicable never shown | TC-132 | Key set exclusion |
| REQ-004 AC-4 | Hidden questions use defaults | TC-133 | Markdown content |
| REQ-004 AC-5 | Depth overlay shows count | TC-134 | Element text |
| REQ-004 AC-6 | Pool < depth → show all | TC-135 | No error + count |
| REQ-004 AC-7 | Tier ordering | TC-136 | Sequential tier check |
| REQ-004 AC-8 | Sub-dots reflect filtered count | TC-137 | Dot count = question count |
| REQ-004 AC-9 | Trip type change resets Step 2 | TC-138 | Question set change |
| REQ-005 AC-1 | Toddler → more kid-safety | TC-150 | Balance value |
| REQ-005 AC-2 | Toddler + teen → balanced | TC-151 | Balance value |
| REQ-005 AC-3 | Balance within Family pool | TC-153 | Ordering pattern |
| REQ-005 AC-4 | Markdown includes Family Balance | TC-154 | Markdown field |
| REQ-006 AC-1 | Scoring bonus/penalty by type | TC-160, TC-161, TC-162 | Pre-selected cards |
| REQ-006 AC-2 | Couple >= 2 romantic cards | TC-160 | Card count |
| REQ-006 AC-3 | Multi-gen accessibility avoid | TC-161 | Card presence |
| REQ-006 AC-4 | Solo safety/comfort card | TC-162 | Card presence |
| REQ-006 AC-5 | Pre-selection 8-15 range | TC-163 | Count range |
| REQ-006 AC-6 | analyzeGroup() still works | TC-164 | Dual-source pre-selection |
| REQ-007 AC-1 | Trip Type in markdown | TC-170 | Regex match |
| REQ-007 AC-2 | Field in ## Trip Context | TC-170 | Section position |
| REQ-007 AC-3 | Family Balance sub-field | TC-171 | Markdown field |
| REQ-007 AC-4 | Non-family omits Family Balance | TC-172 | Absence check |
| REQ-007 AC-5 | Value always English | TC-173 | Regex match after lang switch |
| REQ-007 AC-6 | Preview shows trip type | TC-174 | Preview element content |
| REQ-008 AC-1..5 | Planning pipeline reads trip type | Out of scope | Rule file, not UI |
| REQ-009 AC-1 | Depth overlay shows type name | TC-139 | Element presence |
| REQ-009 AC-2 | Depth cards show actual count | TC-134 | Element text |
| REQ-009 AC-3 | Pool < 30 → "(max)" badge | TC-135 | Badge element |
| REQ-009 AC-4 | Recommended badge adjusts | TC-141 | `.is-recommended` class |
| REQ-009 AC-5 | Depth text translated | Out of scope (existing i18n specs) | — |
| REQ-009 AC-6 | Keyboard navigation | TC-142 | Focus + selection |
| REQ-010 AC-1 | Same-category grouped | TC-140 | Category sequence |
| REQ-010 AC-2 | Categories A-H order | TC-140 | Alphabetical check |
| REQ-010 AC-3 | Lower tier first in category | TC-143 | Tier sequence |
| REQ-010 AC-4 | Consistent across types | TC-144 | Relative order match |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `trip_intake.html` DOM | `data-question-key`, `data-tier`, `data-trip-type`, `data-family-balance`, `.context-bar__pill--triptype`, `#tripTypePill`, `#tripTypeIcon`, `#tripTypePillText`, `.depth-card__count`, `.depth-card__max`, `.depth-overlay__subtitle` | **Yes** — new DOM elements must be added by Dev before tests can run |
| `IntakePage.ts` POM | Existing locators + new locators needed (see Section 8) | **Yes** — POM must be extended |
| `QUESTION_META` JS constant | Category, tier, appliesTo per question | Accessed via `page.evaluate()` — no file dependency, but constant must exist in HTML |
| `QUESTION_DEFAULTS` JS constant | Default values per question | Accessed via `page.evaluate()` |
| `TRIP_TYPE_SCORING` JS constant | Interest/avoid bonus keys per type | Accessed via `page.evaluate()` for validation |
| Traveler compositions | Hard-coded in test setup (birth years computed relative to arrival date) | No external file dependency |

## 6. New IntakePage.ts Locators & Methods Needed

### New Locators

```typescript
// --- Trip Type Pill ---
readonly tripTypePill: Locator;       // #tripTypePill or .context-bar__pill--triptype
readonly tripTypeIcon: Locator;       // #tripTypeIcon
readonly tripTypePillText: Locator;   // #tripTypePillText

// --- Depth Overlay (type-aware additions) ---
readonly depthOverlaySubtitle: Locator; // .depth-overlay__subtitle
readonly depthCardCount: Locator;     // generic: .depth-card__count (parameterized per card)
readonly depthCardMaxBadge: Locator;  // .depth-card__max
```

### New Parameterized Locators

```typescript
depthCardCount(depth: number): Locator {
  return this.depthCard(depth).locator('.depth-card__count');
}

depthCardMaxBadge(depth: number): Locator {
  return this.depthCard(depth).locator('.depth-card__max');
}

questionsByCategory(category: string): Locator {
  return this.page.locator(`[data-category="${category}"]`);
}
```

### New Helper Methods

```typescript
/** Get the detected trip type from the pill's data attribute */
async getDetectedTripType(): Promise<string | null> {
  return await this.tripTypePill.getAttribute('data-trip-type');
}

/** Get the family balance value from DOM attribute */
async getFamilyBalance(): Promise<string | null> {
  return await this.tripTypePill.getAttribute('data-family-balance');
}

/** Set up travelers on Step 1 with specified adult ages and child ages (at arrival date).
 *  Handles adding adults/children, setting DOB fields, and name fields. */
async setupTravelers(adultAges: number[], childAges: number[], arrivalDate: Date): Promise<void> {
  // Implementation: compute birth years from ages + arrival date,
  // click +/- buttons to set adult/child count,
  // fill DOB selects and name fields for each card.
}

/** Complete Step 1 with a specific trip type composition */
async completeStep1WithTripType(
  tripType: 'Solo' | 'Couple' | 'Young' | 'Adults' | 'Family' | 'Multi-generational'
): Promise<void> {
  // Predefined traveler compositions per trip type
}

/** Get all pre-selected cards on a given step */
async getPreSelectedCards(step: number): Promise<string[]> {
  // Returns data-card-id or similar for each .is-selected card
}
```

## 7. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| **Trip type pill DOM not yet implemented** — tests depend on `data-trip-type` attribute, `#tripTypePill`, etc. that don't exist yet | Document exact attribute names in `qa_2_dev_requirements.txt`. Tests will fail clearly if attributes are missing. Coordinate with Dev on attribute contract before implementation. |
| **`QUESTION_META` not accessible via `page.evaluate()`** — if wrapped in a closure, tests can't read it | Request Dev expose `QUESTION_META`, `QUESTION_DEFAULTS`, and `TRIP_TYPE_SCORING` on `window` (or via a debug API) for test access. Add to `qa_2_dev_requirements.txt`. |
| **DOB select population timing** — year/month/day selects may populate asynchronously, causing flaky interactions | Use `expect(select).not.toBeEmpty()` before selecting a value. All interactions use Playwright auto-wait. |
| **Toast auto-dismiss timing** — toast may disappear before assertion | Assert toast visibility immediately after triggering action. Playwright's `toBeVisible()` auto-waits for appearance. If toast is too fast, assert on toast container having had a child (use `page.waitForSelector('.toast')`). |
| **Traveler setup complexity** — adding 4 adults + children requires many interactions, increasing test time and fragility | Create a robust `setupTravelers()` helper in IntakePage that encapsulates all the setup logic. Reuse across all trip type tests. |
| **Pre-selection assertions depend on scoring thresholds** — threshold tuning could break TC-160..TC-163 | Assert on minimum counts (">= 2 romantic") rather than exact sets. Use soft assertions so individual card changes don't fail the whole test. |
| **Category ordering relies on `data-category` attribute** — if not added to DOM, ordering tests need JS evaluation fallback | Request `data-category` attribute on question slides. Fallback: use `page.evaluate()` to read from `QUESTION_META`. |
| **Full wizard traversal for markdown output tests is slow** — TC-175 runs 6 full wizard completions | Mark as `@slow`. Consider parallelizing across workers if runtime exceeds 60s. |

## 8. Estimated Impact

- **New test count:** 38 test cases across 7 new spec files
- **Estimated runtime increase:** ~45-60 seconds (most tests require wizard navigation through Step 1; markdown output tests require full wizard traversal)
- **Files added:**
  - `automation/code/tests/intake/intake-trip-type-detection.spec.ts` (10 tests)
  - `automation/code/tests/intake/intake-trip-type-ui.spec.ts` (4 tests)
  - `automation/code/tests/intake/intake-question-bank.spec.ts` (7 tests)
  - `automation/code/tests/intake/intake-type-filtering.spec.ts` (10 tests)
  - `automation/code/tests/intake/intake-question-ordering.spec.ts` (3 tests)
  - `automation/code/tests/intake/intake-family-balance.spec.ts` (5 tests — includes TC-152 for teen-friendly)
  - `automation/code/tests/intake/intake-preselection-scoring.spec.ts` (5 tests)
  - `automation/code/tests/intake/intake-trip-type-output.spec.ts` (6 tests — includes TC-175 data-driven)
- **Files modified:**
  - `automation/code/tests/pages/IntakePage.ts` — add ~3 locators, ~3 parameterized locators, ~4 helper methods

## 9. Dev Requirements (qa_2_dev_requirements.txt)

The following `data-*` attributes and exposed APIs are required for testability:

1. **`data-trip-type`** attribute on `#tripTypePill` (or `.context-bar__pill--triptype`) — value: one of `Solo|Couple|Young|Adults|Family|Multi-generational`.
2. **`data-family-balance`** attribute on `#tripTypePill` — value: `kid-focused|balanced|teen-friendly|null`.
3. **`data-category`** attribute on each `.question-slide` element — value: A-H letter.
4. **`QUESTION_META`** accessible via `window.QUESTION_META` or similar global for test evaluation (can be behind a `?testmode=true` URL param).
5. **`QUESTION_DEFAULTS`** accessible similarly.
6. **`TRIP_TYPE_SCORING`** accessible similarly.
7. **`.depth-card__count`** element within each `.depth-card` showing the type-filtered question count.
8. **`.depth-card__max`** badge element when available count < depth number.
9. **`.depth-overlay__subtitle`** element showing trip-type-aware message.
