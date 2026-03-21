# QA Architecture Review

**Change:** Question Depth Selector — User-Controlled Wizard Length
**Date:** 2026-03-19
**Reviewer:** QA Architect
**Documents Reviewed:** test_plan.md, business_requirements.md
**Verdict:** Approved with Minor Feedback

---

## 1. Review Summary

The test plan is thorough and well-structured. It provides 37 test cases covering all 25 BRD acceptance criteria (24 testable via UI, 1 correctly marked N/A). The plan correctly identifies that this is an intake page feature requiring a new `IntakePage.ts` POM separate from `TripPage.ts`, and correctly uses the standard `@playwright/test` import (all tests involve mutation). The coverage matrix is complete and traceable. The plan includes thoughtful dev requirements for testability (`data-question-key`, `data-tier`, `data-step`, `aria-valuenow`).

A few minor items need attention around test consolidation and spec file organization, but nothing blocks approval.

---

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 25 ACs covered. REQ-002 AC-5 correctly N/A (documentation). Coverage matrix is complete. |
| No duplicate tests | Pass | TC-014/TC-015 test same merging at different depths — valid, not duplicate. |
| Correct fixture usage | Pass | Standard `@playwright/test` used throughout (all tests mutate). Shared-page fixture correctly excluded. |
| POM compliance | Pass | New `IntakePage.ts` POM proposed with 20 well-defined locators. Separate from `TripPage.ts`. |
| Assertion best practices | Pass | `expect.soft()` used where appropriate. Language-independence maintained — no text matching. |
| Performance impact | Pass (with feedback) | 37 tests at ~4 min sequential is reasonable. See QF-2 for consolidation opportunity. |
| Reliability | Pass | No hard sleeps. Web-first assertions used. Atomic test design. |

---

## 3. Coverage Analysis

### REQ-001: Question Depth Selector UI — Full Coverage
- AC-1 through AC-7 all have dedicated test cases
- Accessibility (AC-7) is well-covered with 4 tests: keyboard nav, escape, ARIA roles, focus management
- i18n (AC-6) covered by TC-031 and TC-032 checking key presence across all 12 languages

### REQ-002: Question Inventory with Priority Tiers — Full Coverage
- AC-1/AC-2 covered by TC-004 through TC-008 (one per depth level)
- AC-3 (T1 minimum set) verified in TC-004
- AC-4 (Steps 0/1/7 always present) verified in TC-009
- AC-5 (documentation) correctly marked N/A

### REQ-003: Dynamic Wizard Adaptation — Full Coverage
- AC-1 (tier-based visibility) verified per depth level in TC-004–TC-008
- AC-2 (sub-step dots) in TC-011
- AC-3 (stepper adaptation) in TC-010
- AC-4 (progress bar) in TC-012
- AC-5 (no empty steps) in TC-013, TC-014, TC-015
- AC-6 (depth change re-adaptation) in TC-016, TC-017, TC-018
- AC-7 (auto-advance) in TC-033

### REQ-004: Sensible Defaults for Skipped Questions — Full Coverage
- AC-1/AC-2 (defaults documented and balanced) in TC-019
- AC-3 (output structural identity) across TC-019, TC-020, TC-021
- AC-4 (pre-selection scoring) in TC-023
- AC-5 (review step completeness) in TC-022

### REQ-005: Depth Indicator and User Feedback — Full Coverage
- AC-1 (depth pill) in TC-024
- AC-2 (progress bar accuracy) shared with TC-012
- AC-3 (smooth transition) in TC-026
- AC-4 (toast notification) in TC-025

---

## 4. Feedback Items

### QF-1: Spec File Organization Needs Commitment (Severity: Low)

The test plan mentions specs may go in `tests/regression/` or `tests/intake/` but does not commit to a location. Since these tests target a completely different page (`trip_intake.html`) than the existing regression suite (`trip_full_*.html`), a separate directory is warranted. Recommendation: use `tests/intake/` to maintain clear separation.

**Action:** Finalize spec file location as `tests/intake/` in the test plan before implementation.

### QF-2: Data-Driven Consolidation Opportunity (Severity: Low)

TC-004 through TC-008 (question visibility per depth) are listed as 5 separate test cases but the implementation notes acknowledge they should be data-driven. Per automation_rules §6.4, data-driven patterns should be used rather than one test per item. In implementation, these 5 TCs should become a single parameterized test with `expect.soft()` per depth level, yielding clearer failure messages and fewer test functions.

Similarly, TC-009 (Steps 0/1/7 always present) can be folded into the depth visibility loop.

**Action:** During implementation, consolidate TC-004–TC-009 into 1-2 data-driven tests. The test plan as a document can retain separate TC numbers for traceability.

### QF-3: Progression File Strategy (Severity: Low)

Automation_rules §6.4 states "Keep one progression.spec.ts file — never split by release date." The test plan proposes 8 new spec files. This is acceptable because the intake page is an entirely separate test target from the trip output page (different POM, different baseURL, different page lifecycle). However, the test plan should explicitly state that these are intake-specific spec files and that the single-progression-file rule applies within the intake test suite: do not split intake specs by release date in the future.

**Action:** Add a note in the test plan clarifying that intake specs follow their own progression consolidation, separate from trip output progression.

### QF-4: TC-023 Step Ordering Assumption (Severity: Medium)

TC-023 tests that pre-selection scoring works with default quiz answers at depth 10. The test navigates to the interest chip selection step and checks for pre-selected chips. However, the test must account for wizard step ordering: at depth 10, the quiz questions (setting, culture) come in Step 2 while interest chips are in Step 3. The pre-selection engine fires when entering the chip step, using quiz answers collected so far. The test should explicitly verify the sequence: answer quiz defaults first (or accept them via auto-advance), then check chip pre-selections.

**Action:** Clarify in TC-023 that the test must first pass through the quiz step (accepting defaults) before checking chip pre-selections, to ensure the scoring engine has input data.

### QF-5: Missing Edge Case — Depth Change After Answering Step 7 Fields (Severity: Low)

The BRD states depth can be changed "at any point before Step 7" (REQ-001 AC-5). The test plan covers depth change mid-wizard at Step 4 (TC-016) but does not test the boundary: what happens if the user is on Step 6 (the last content step) and changes depth? Or attempts to change on Step 7 (should be blocked per BRD)?

**Action:** Consider adding a test case verifying that the depth pill is disabled or hidden on Step 7, and one test for depth change from the last content step.

---

## 5. Best Practice Recommendations

1. **Helper function for wizard prerequisites:** The plan correctly identifies `completePrerequisiteSteps()` as needed in IntakePage. Implement this as a POM method that fills Step 0 and Step 1 with minimal valid data, keeping test setup DRY.

2. **Data attributes in dev requirements:** The 4 requested `data-*` attributes (`data-question-key`, `data-tier`, `data-step`, `aria-valuenow`) are well-chosen. Ensure these are communicated to dev via `qa_2_dev_requirements.txt` before implementation begins.

3. **Playwright project configuration:** A new Playwright project entry for intake tests is the cleanest approach (separate baseURL, separate test directory). This keeps intake and trip output test runs independent and parallelizable.

4. **No language text assertions:** The test plan consistently avoids text matching and checks `data-i18n` attributes instead. This is correct and should be maintained throughout implementation.

---

## 6. Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| QA Architect | QA-A | 2026-03-19 | **Approved with Minor Feedback** |

**Conditions for full approval:** Address QF-4 (TC-023 step ordering clarification) before implementation. QF-1, QF-2, QF-3, and QF-5 are recommendations that can be addressed during implementation phase.
