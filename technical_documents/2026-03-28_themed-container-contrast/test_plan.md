# Test Plan

**Change:** Themed Container Contrast Rule & Regression Test
**Date:** 2026-03-28
**Author:** Automation Engineer
**BRD Reference:** `technical_documents/2026-03-28_themed-container-contrast/business_requirements.md`
**DD Reference:** `technical_documents/2026-03-28_themed-container-contrast/detailed_design.md`
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- Runtime contrast validation of `.day-card__banner-title` and `.day-card__banner-date` computed CSS `color` across all day banners (REQ-002)
- Luminance utility correctness: `parseRgb` parsing and `relativeLuminance` formula (REQ-002 AC-3)
- Language-independence compliance of new spec and utility files (REQ-002 AC-6)
- Static pre-regression gate validation: confirm themed-container child classes have explicit `color:` in inlined `<style>` (REQ-003)
- SA review feedback item FB-1: ensure `.day-card__banner-date` contrast is validated consistently regardless of whether an explicit `color` declaration is added to CSS

**Out of scope:**
- Functional verification of the rule text in `rendering-config.md` and `coding_standards.md` (REQ-001) — these are documentation changes with no runtime behavior; verified by human review during PM sign-off
- Full WCAG AA contrast-ratio audit between foreground and background colors (future scope)
- Dark-mode luminance thresholds (documented as future enhancement in BRD Section 4)
- Contrast validation for themed containers other than `.day-card__banner` (future scope per BRD)

**Test type:** Both (Progression + Regression)

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Shared-page (read-only) for banner contrast spec; N/A for unit-level utility tests
- **Target file:** `trip_full_{LANG}.html`

## 3. Test Cases

### TC-001: Banner title computed color has light luminance on every day

**Traces to:** REQ-002 → AC-1, AC-2, AC-5, AC-7
**Type:** Regression
**Spec file:** `banner-contrast.spec.ts`
**Priority:** Critical

**Preconditions:**
- Generated trip HTML (`trip_full_{LANG}.html`) is loaded via `shared-page` fixture
- `tripConfig.dayCount` is available from `trip-config.ts`

**Steps:**
1. For each day index `i` from `0` to `tripConfig.dayCount - 1`:
   a. Locate `.day-card__banner-title` via POM method `tripPage.getDayBannerTitle(i)`
   b. If the element exists (count > 0), evaluate `getComputedStyle(el).color` in the browser context
   c. Parse the returned `rgb(R, G, B)` string using `parseRgb()` from `color-utils.ts`
   d. Compute relative luminance using `relativeLuminance(r, g, b)` from `color-utils.ts`
   e. Assert luminance > 0.7

**Expected result:**
- Every `.day-card__banner-title` element has computed color with relative luminance > 0.7 (light/white text)
- On the current fixed CSS (`color: var(--color-text-inverse)` resolving to `#FAFAFA`), luminance is approximately 0.95 — passes
- On pre-fix CSS (global heading reset to `#1C1C1E`), luminance would be approximately 0.012 — fails

**Implementation notes:**
- Fixture: `shared-page` (read-only DOM inspection via `evaluate`)
- Assertion: `expect.soft(titleLuminance, 'Day ${i}: banner title color ${titleColor} luminance should be > ${MIN_LUMINANCE}').toBeGreaterThan(MIN_LUMINANCE)`
- Batching: One `test()` per day, soft assertions within each test. This follows the Section 6.3 pattern from `automation_rules.md` — one test per day with `expect.soft()` for each sub-assertion
- All selectors via POM: `getDayBannerTitle(i)`

---

### TC-002: Banner date computed color has light luminance on every day

**Traces to:** REQ-002 → AC-1, AC-2, AC-5, AC-7; SA feedback FB-1
**Type:** Regression
**Spec file:** `banner-contrast.spec.ts`
**Priority:** Critical

**Preconditions:**
- Same as TC-001

**Steps:**
1. For each day index `i` from `0` to `tripConfig.dayCount - 1`:
   a. Locate `.day-card__banner-date` via POM method `tripPage.getDayBannerDate(i)`
   b. If the element exists (count > 0), evaluate `getComputedStyle(el).color` in the browser context
   c. Parse the returned `rgb(R, G, B)` string using `parseRgb()`
   d. Compute relative luminance using `relativeLuminance(r, g, b)`
   e. Assert luminance > 0.7

**Expected result:**
- Every `.day-card__banner-date` element has computed color with relative luminance > 0.7
- Currently `.day-card__banner-date` is a `<span>` that inherits `color: var(--color-text-inverse)` from `.day-card__banner` — this resolves to `#FAFAFA` (luminance ~0.95), so the test passes
- Per SA feedback FB-1: if the CSS is updated to add an explicit `color` on `.day-card__banner-date` (option a, preferred), the test still passes. If the tag is later changed to a semantic element without an explicit `color`, the test catches the regression

**Implementation notes:**
- Combined with TC-001 inside the same `test()` per day (two soft assertions per test body: one for title, one for date)
- Fixture: `shared-page`
- All selectors via POM: `getDayBannerDate(i)`

---

### TC-003: Luminance utility correctly computes sRGB relative luminance

**Traces to:** REQ-002 → AC-3
**Type:** Progression
**Spec file:** `banner-contrast.spec.ts` (inline validation) or separate `color-utils.spec.ts` if SA best-practice recommendation is adopted
**Priority:** High

**Preconditions:**
- `color-utils.ts` module is available in `tests/utils/`

**Steps:**
1. Call `parseRgb('rgb(255, 255, 255)')` — expect `[255, 255, 255]`
2. Call `parseRgb('rgb(0, 0, 0)')` — expect `[0, 0, 0]`
3. Call `parseRgb('rgba(250, 250, 250, 1)')` — expect `[250, 250, 250]`
4. Call `parseRgb('invalid')` — expect thrown error
5. Call `relativeLuminance(255, 255, 255)` — expect result approximately 1.0
6. Call `relativeLuminance(0, 0, 0)` — expect result 0.0
7. Call `relativeLuminance(250, 250, 250)` — expect result approximately 0.95 (matching `#FAFAFA` luminance)
8. Call `relativeLuminance(28, 28, 30)` — expect result approximately 0.012 (matching `#1C1C1E` luminance)

**Expected result:**
- `parseRgb` correctly extracts R, G, B integers from both `rgb()` and `rgba()` format strings
- `parseRgb` throws on malformed input
- `relativeLuminance` returns values matching the WCAG 2.1 sRGB formula: `L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin`
- White (255,255,255) yields luminance 1.0; Black (0,0,0) yields 0.0

**Implementation notes:**
- SA Architecture Review best-practice #2 recommends a dedicated `color-utils.spec.ts` unit test. Decision deferred to implementation phase; if omitted, the banner-contrast spec implicitly validates the utility on every run
- These are pure-function assertions — no Playwright page needed. Could use standard `@playwright/test` import without `shared-page` fixture
- Hard assertions appropriate here (utility correctness is foundational)

---

### TC-004: Banner contrast spec contains no hardcoded natural language strings

**Traces to:** REQ-002 → AC-6
**Type:** Regression (covered by existing lint guard)
**Spec file:** `code-quality/language-independence.spec.ts` (existing)
**Priority:** High

**Preconditions:**
- `banner-contrast.spec.ts` exists in `tests/regression/`
- `color-utils.ts` exists in `tests/utils/`

**Steps:**
1. The existing `language-independence.spec.ts` lint guard automatically scans all files under `tests/` for Cyrillic literals, hardcoded filenames, and `hasText` filters with string constants
2. Verify that `banner-contrast.spec.ts` passes the lint guard (no Cyrillic, no `hasText`, no hardcoded language strings)
3. Verify that `color-utils.ts` error messages (English developer-facing diagnostics) do not trigger false positives (SA feedback FB-2)

**Expected result:**
- `banner-contrast.spec.ts` passes the language-independence lint guard with zero violations
- `color-utils.ts` either passes cleanly (current guard targets Cyrillic/Hebrew/Arabic, not English diagnostics) or is added to the guard's allowed-files list

**Implementation notes:**
- No new test code needed — the existing lint guard provides this coverage automatically
- Per SA FB-2: during implementation, run the lint guard explicitly against `color-utils.ts` and document the result
- If the guard flags `color-utils.ts`, add it to the exemption list

---

### TC-005: All DOM selectors are defined in TripPage.ts POM

**Traces to:** REQ-002 → AC-7
**Type:** Regression (code review verification)
**Spec file:** N/A — structural review during QA-A phase
**Priority:** High

**Preconditions:**
- `banner-contrast.spec.ts` implementation is complete

**Steps:**
1. Review `banner-contrast.spec.ts` source code
2. Verify that no CSS selectors (`.day-card__banner-title`, `.day-card__banner-date`, `.day-card__banner`) appear as raw strings in the spec file
3. Confirm all element access goes through POM methods: `tripPage.getDayBannerTitle(i)`, `tripPage.getDayBannerDate(i)`
4. Per SA FB-3: verify whether `getDayBanner(dayNumber)` is actually used by the spec; omit it from TripPage.ts if not needed

**Expected result:**
- Zero raw CSS selectors in `banner-contrast.spec.ts`
- All DOM access through `TripPage` methods
- POM stays lean: no unused methods added

**Implementation notes:**
- This is a static code review check, not a runtime test
- Enforced during QA-A review phase (Phase 4b)

---

### TC-006: Banner contrast spec uses shared-page fixture

**Traces to:** REQ-002 → AC-5
**Type:** Regression (code review verification)
**Spec file:** N/A — structural review during QA-A phase
**Priority:** Medium

**Preconditions:**
- `banner-contrast.spec.ts` implementation is complete

**Steps:**
1. Verify import statement: `import { test, expect } from '../fixtures/shared-page'`
2. Confirm no `page.goto()`, `page.click()`, `page.type()`, or other mutation calls in the spec

**Expected result:**
- Spec imports from `shared-page` fixture, not from `@playwright/test`
- No page mutations — read-only DOM inspection via `evaluate()`

**Implementation notes:**
- Static code review check
- Consistent with existing read-only specs (`day-cards.spec.ts`, `structure.spec.ts`)

---

### TC-007: Pre-regression gate item 12 validates themed container color declarations

**Traces to:** REQ-003 → AC-1, AC-2, AC-3; SA feedback FB-4
**Type:** Progression
**Spec file:** N/A — manual/scripted grep validation (not a Playwright spec)
**Priority:** Medium

**Preconditions:**
- Generated `trip_full_{LANG}.html` with inlined `<style>` block
- Item 12 added to `development_rules.md` Section 3

**Steps:**
1. Extract the `<style>` block content from the generated HTML
2. Run regex: `\.day-card__banner-title\s*\{[^}]*color\s*:` — expect match (explicit `color` on banner title)
3. For `.day-card__banner-date`: behavior depends on resolution of SA FB-1/FB-4:
   - If explicit `color` was added to CSS (FB-1 option a): run regex `\.day-card__banner-date\s*\{[^}]*color\s*:` — expect match
   - If inheritance is kept for `<span>` elements (FB-1 option b): skip this regex or note exemption for non-semantic-tag children

**Expected result:**
- `.day-card__banner-title` always has an explicit `color:` in its CSS rule block
- `.day-card__banner-date` either has explicit `color:` (option a) or is documented as exempt (option b)
- The gate check text includes guidance on extending for future themed containers

**Implementation notes:**
- This is a grep/regex operation on the HTML file, not a Playwright runtime check
- Executed as part of the pre-regression validation gate (before the test suite runs)
- The implementation must align the gate regex with the actual CSS state per SA FB-1/FB-4

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 | AC-1: rendering-config.md themed container subsection | N/A (documentation — human review) | N/A |
| REQ-001 | AC-2: coding_standards.md Section 4.4 rule | N/A (documentation — human review) | N/A |
| REQ-001 | AC-3: Language-agnostic rule text | N/A (documentation — human review) | N/A |
| REQ-002 | AC-1: New spec iterates over every `.day-card__banner` | TC-001, TC-002 | Soft |
| REQ-002 | AC-2: Luminance > 0.7 for title and date | TC-001, TC-002 | Soft |
| REQ-002 | AC-3: Standard sRGB luminance formula | TC-003 | Hard |
| REQ-002 | AC-4: `expect.soft()` with day context messages | TC-001, TC-002 | Soft (by definition) |
| REQ-002 | AC-5: shared-page fixture import | TC-006 | Code review |
| REQ-002 | AC-6: No hardcoded language strings | TC-004 | Hard (lint guard) |
| REQ-002 | AC-7: All selectors in TripPage.ts | TC-005 | Code review |
| REQ-002 | AC-8: Passes on fixed HTML, fails on pre-fix | TC-001 (implicit) | Soft |
| REQ-003 | AC-1: New checklist item 12 | TC-007 | Grep/regex |
| REQ-003 | AC-2: Grep/regex based check | TC-007 | Grep/regex |
| REQ-003 | AC-3: Extensibility guidance | TC-007 | Code review |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `trip-config.ts` → `tripConfig.dayCount` | Number of days to iterate over in TC-001/TC-002 | No — dynamically read at runtime |
| Generated `trip_full_{LANG}.html` | Rendered DOM with computed styles | Yes — must be generated before test run; any re-render updates it automatically |
| `rendering_style_config.css` (inlined in HTML) | CSS rules for `.day-card__banner-title`, `.day-card__banner-date` | Depends on FB-1 resolution: if explicit `color` is added to `.day-card__banner-date`, CSS file updates |
| `TripPage.ts` POM | `getDayBannerTitle(n)`, `getDayBannerDate(n)` methods | No — already exist. `getDayBanner(n)` only added if spec uses it (per SA FB-3) |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| **Luminance threshold sensitivity:** 0.7 is a heuristic, not a WCAG-defined boundary. Future themes with intentionally medium-brightness banner text (e.g., light gray on dark gradient) could false-fail | Document 0.7 as a named constant `MIN_LUMINANCE` at the top of the spec with a comment explaining the rationale. If future themes need adjustment, only one constant changes |
| **`.day-card__banner-date` inheritance fragility (SA FB-1):** Currently a `<span>` inheriting color from parent; if tag changes to `<p>` or `<h4>`, test fails | This is the desired behavior — the test is explicitly designed to catch this class of bug. The test passing or failing on `.day-card__banner-date` correctly signals whether the contrast is safe |
| **`getComputedStyle` timing:** `evaluate(el => getComputedStyle(el).color)` could return an intermediate value if styles haven't fully applied | Mitigated by `shared-page` fixture: page is fully loaded before any test runs. The `page.goto()` in the fixture awaits `load` event. No additional waits needed |
| **`rgb()` format assumption:** `parseRgb` expects `rgb(R, G, B)` or `rgba(R, G, B, A)` format. Some browsers may return other formats (e.g., `color(srgb ...)`) | Mitigated: Playwright uses Chromium, which consistently returns `rgb(R, G, B)` from `getComputedStyle().color`. The `parseRgb` function throws on unrecognized formats, producing a clear failure message rather than a silent wrong result |
| **Language-independence lint guard false positive on `color-utils.ts` (SA FB-2):** English error messages in the utility could be flagged | Verify during implementation by running the lint guard. If flagged, add `color-utils.ts` to the guard's allowed-files list. Document the verification result |
| **Pre-regression gate regex false negative for `.day-card__banner-date` (SA FB-4):** If no explicit `color` exists in CSS for this class, the regex check fails despite the banner text being visually correct | Align gate regex with actual CSS state. If FB-1 option (a) is chosen (add explicit `color`), regex works as-is. If option (b), gate item exempts `<span>` children from the regex check |

## 7. Estimated Impact

- **New test count:** 1 new spec file (`banner-contrast.spec.ts`) producing `dayCount` tests (e.g., 12 tests for a 12-day trip). Optionally 1 additional unit spec (`color-utils.spec.ts`) with approximately 4-6 tests if SA best-practice #2 is adopted.
- **Estimated runtime increase:** Less than 2 seconds total. Each per-day test performs 2 `evaluate()` calls (title + date computed style) with in-memory luminance math — no navigation, no screenshots, no network. The `shared-page` fixture eliminates page-load overhead.
- **Files added/modified:**
  - **Added:** `automation/code/tests/regression/banner-contrast.spec.ts`, `automation/code/tests/utils/color-utils.ts`
  - **Modified:** `automation/code/tests/pages/TripPage.ts` (only if `getDayBanner(n)` is needed — per SA FB-3, likely no change)
  - **Not modified:** `automation_rules.md` (tests comply with existing rules; no rule changes needed)
- **New POM locators needed:** None. `getDayBannerTitle(n)` and `getDayBannerDate(n)` already exist in `TripPage.ts` (lines 112-118). The `dayBanners` property (line 85) is also available if needed for generic iteration. Per SA FB-3, the proposed `getDayBanner(n)` method is likely unnecessary since the spec does not use it.

## 8. SA Review Feedback Addressal

| SA Item | How Addressed in Test Plan |
|---|---|
| FB-1: `.day-card__banner-date` consistency | TC-002 validates `.day-card__banner-date` luminance regardless of whether explicit `color` is added to CSS. The test catches the regression either way. Implementation phase must resolve which CSS approach (explicit vs. inherited) is used, and the test works for both. |
| FB-2: `color-utils.ts` lint guard exemption | TC-004 includes explicit verification step: run the language-independence lint guard against `color-utils.ts` during implementation and document the result. |
| FB-3: Unnecessary `getDayBanner(n)` POM method | TC-005 review step explicitly checks whether the spec uses `getDayBanner(n)`. If not used, omit the method to keep POM lean. |
| FB-4: Pre-regression gate regex for `.day-card__banner-date` | TC-007 documents both possible outcomes (option a: regex matches explicit color; option b: class exempted as `<span>`). Implementation must align with FB-1 resolution. |
