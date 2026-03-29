# QA Architecture Review

**Change:** Themed Container Contrast Rule & Regression Test
**Date:** 2026-03-28
**Reviewer:** QA Architect
**Documents Reviewed:** `business_requirements.md` (BRD), `test_plan.md`, `automation_rules.md`, `TripPage.ts`
**Verdict:** Approved

---

## 1. Review Summary

The test plan is comprehensive, well-structured, and demonstrates strong alignment with both the BRD acceptance criteria and the project's automation standards. All 15 acceptance criteria across three requirements are accounted for in the coverage matrix with appropriate test strategies (runtime Playwright assertions, existing lint guard delegation, code review checks, and grep-based gate validation). The plan correctly identifies REQ-001 as documentation-only and excludes it from automated testing. SA feedback items (FB-1 through FB-4) are thoughtfully addressed with clear branching logic for implementation-time decisions. No blocking issues found.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 15 acceptance criteria across REQ-001, REQ-002, REQ-003 are mapped to test cases or explicitly marked as documentation-only (human review). No gaps. |
| No duplicate tests | Pass | TC-001 and TC-002 are distinct (title vs. date elements with different CSS inheritance behavior). TC-003 tests utility correctness, not DOM contrast. TC-004 through TC-006 are structural/code-review checks, each validating a different quality attribute. No overlapping assertions. |
| Correct fixture usage | Pass | TC-001/TC-002 correctly specify `shared-page` fixture for read-only `evaluate()` calls. TC-003 correctly notes pure-function assertions need no Playwright page. TC-007 is a grep operation outside the Playwright runtime. |
| POM compliance | Pass | Plan explicitly requires all DOM access via `tripPage.getDayBannerTitle(i)` and `tripPage.getDayBannerDate(i)`. TC-005 is a dedicated review gate to enforce zero raw CSS selectors in the spec. SA FB-3 (lean POM) is correctly addressed: `getDayBanner(n)` only added if actually used. |
| Assertion best practices | Pass | TC-001/TC-002 use `expect.soft()` with descriptive messages including day index and actual luminance value. TC-003 correctly uses hard assertions for utility correctness (foundational). Pattern matches `automation_rules.md` Section 6.3. |
| Performance impact | Pass | Estimated < 2 seconds for all new tests. Uses `shared-page` fixture (no per-test navigation). Each test performs only 2 `evaluate()` calls with in-memory math. Aligns with Section 6 optimization goals. |
| Reliability | Pass | No hard sleeps, no race conditions. `shared-page` fixture ensures full page load before tests run. `getComputedStyle` is synchronous within `evaluate()`. `parseRgb` throws on unrecognized formats rather than silently producing wrong results. |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: rendering-config.md themed container subsection | N/A (documentation -- human review) | None |
| REQ-001 | AC-2: coding_standards.md Section 4.4 rule | N/A (documentation -- human review) | None |
| REQ-001 | AC-3: Language-agnostic rule text | N/A (documentation -- human review) | None |
| REQ-002 | AC-1: New spec iterates over every `.day-card__banner` | TC-001, TC-002 | None |
| REQ-002 | AC-2: Luminance > 0.7 for title and date | TC-001, TC-002 | None |
| REQ-002 | AC-3: Standard sRGB luminance formula | TC-003 | None |
| REQ-002 | AC-4: `expect.soft()` with day context messages | TC-001, TC-002 | None |
| REQ-002 | AC-5: shared-page fixture import | TC-006 | None |
| REQ-002 | AC-6: No hardcoded language strings | TC-004 | None |
| REQ-002 | AC-7: All selectors in TripPage.ts POM | TC-005 | None |
| REQ-002 | AC-8: Passes on fixed HTML, fails on pre-fix | TC-001 (implicit) | None -- see QF-1 |
| REQ-003 | AC-1: New checklist item 12 | TC-007 | None |
| REQ-003 | AC-2: Grep/regex based check | TC-007 | None |
| REQ-003 | AC-3: Extensibility guidance | TC-007 | None |

## 4. Feedback Items

### QF-1: AC-8 coverage is implicit, not explicit

**Severity:** Recommendation
**Section:** TC-001 coverage of REQ-002 AC-8
**Issue:** AC-8 requires the test to "pass on the current (fixed) HTML and would have failed on the pre-fix HTML." The test plan marks this as implicitly covered by TC-001's expected result section (luminance ~0.95 passes, luminance ~0.012 fails). However, there is no explicit test or documented verification step that confirms the pre-fix failure scenario. The coverage matrix marks it as "TC-001 (implicit)."
**Suggestion:** This is acceptable as-is because: (a) the luminance math is deterministic -- if `#1C1C1E` yields luminance 0.012, it will always be < 0.7, and (b) TC-003 explicitly validates the luminance formula against `#1C1C1E` (step 8: expect ~0.012). Together, TC-001 + TC-003 provide sufficient confidence that the pre-fix scenario would fail. No action needed, but the implementation phase should include a comment in the spec noting the pre-fix expected failure for future readers.

---

### QF-2: TC-001/TC-002 combined test structure needs clarity on test count

**Severity:** Observation
**Section:** TC-002 implementation notes
**Issue:** TC-002 states it is "Combined with TC-001 inside the same `test()` per day (two soft assertions per test body: one for title, one for date)." This is the correct approach per `automation_rules.md` Section 6.3 (batch per-day assertions). However, the test plan presents them as separate test cases (TC-001 and TC-002) while noting they share a single `test()` block. This could cause confusion during implementation about whether they should be separate `test()` calls or combined.
**Suggestion:** No structural change needed -- the implementation notes are clear enough. The AE should follow the combined pattern: one `test()` per day containing two `expect.soft()` calls (title luminance + date luminance). This yields `dayCount` tests, not `2 * dayCount`.

---

### QF-3: TC-003 implementation decision should be resolved before coding

**Severity:** Recommendation
**Section:** TC-003 implementation notes
**Issue:** The test plan defers the decision of whether to create a separate `color-utils.spec.ts` or embed the utility validation inline in `banner-contrast.spec.ts`. The SA Architecture Review best-practice #2 recommends a dedicated unit test file. The deferred decision could lead to inconsistency if the AE chooses inline validation, which mixes unit-level assertions (pure functions) with integration-level assertions (DOM computed styles) in the same spec file.
**Suggestion:** Create a dedicated `color-utils.spec.ts` in `tests/utils/` or `tests/regression/`. This keeps the `banner-contrast.spec.ts` focused on DOM contrast validation (its single responsibility), and the utility tests can run without the `shared-page` fixture overhead. The utility tests are pure-function tests that import directly from `@playwright/test`, not from the shared-page fixture. This aligns with separation of concerns and makes test failures more diagnostic.

---

### QF-4: `parseRgb` error message language should be verified proactively

**Severity:** Observation
**Section:** TC-004, Risk section (SA FB-2)
**Issue:** The plan correctly identifies the risk that English error messages in `color-utils.ts` could trigger the language-independence lint guard. The mitigation is to verify during implementation and add an exemption if needed. This is adequate.
**Suggestion:** No change needed. The AE should document the lint guard result as part of the implementation PR. If an exemption is added, it should be noted in the test run report.

## 5. Best Practice Recommendations

1. **Named constant for luminance threshold.** The plan correctly identifies `MIN_LUMINANCE = 0.7` as a named constant. Ensure this is defined once at the top of the spec file (or in `color-utils.ts`) and imported, not duplicated across test cases.

2. **Separate utility spec file.** Per QF-3, create `color-utils.spec.ts` as a standalone unit test file. This keeps test responsibilities clean and avoids mixing pure-function validation with DOM-based assertions in the same spec.

3. **Skip guard for missing elements.** The plan specifies "If the element exists (count > 0)" before evaluating computed style. This is good defensive programming. Ensure the skip is logged with a soft assertion message (e.g., `expect.soft(count, 'Day ${i}: banner title element should exist').toBeGreaterThan(0)`) so that a missing element is still flagged as a test concern rather than silently skipped.

4. **Pre-fix regression comment.** Per QF-1, include a comment in the spec file documenting that `#1C1C1E` (luminance ~0.012) represents the pre-fix regression case and that TC-003 validates this boundary.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-28 | Approved |

**Conditions for approval:** None -- the plan is approved without conditions. The feedback items (QF-1 through QF-4) are recommendations and observations that improve implementation quality but do not block the test plan from proceeding to the implementation phase.
