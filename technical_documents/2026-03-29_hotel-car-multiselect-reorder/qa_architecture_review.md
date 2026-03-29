# QA Architecture Review

**Change:** Hotel/Car Multi-Select and Step Reorder
**Date:** 2026-03-29
**Reviewer:** QA Architect
**Documents Reviewed:** `business_requirements.md`, `test_plan.md`, `ux_design.md`, `detailed_design.md`, `automation_rules.md`, `IntakePage.ts`
**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is thorough and well-structured, covering all 5 BRD requirements and all 26 acceptance criteria without gaps. The coverage matrix is complete, traceability is clear, and the plan correctly identifies impacted existing tests (TC-206, TC-216, TC-329, etc.) for replacement or augmentation. The plan demonstrates strong awareness of scoping concerns (TC-377 guards multi-select leakage, TC-381/TC-382 guard single-select preservation).

There are 4 feedback items to address before implementation: one blocking issue (hard sleep violating zero-flakiness policy), two recommendations for deduplication and fixture correctness, and one observation about POM locator planning. Total test count (35 new cases) and estimated runtime increase (~25s) are reasonable for the scope of this change.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 26 ACs across 5 REQs are mapped to at least one test case. No gaps found. |
| No duplicate tests | Pass (with note) | TC-354 and TC-379 both assert visual/ARIA state per card for hotelType (see QF-2), but they test different attributes (.is-selected vs aria-pressed). Acceptable as separate tests, but could be consolidated. |
| Correct fixture usage | Pass (with note) | TC-371 correctly uses shared-page fixture for read-only. All mutation tests correctly specify standard fixture. One concern on TC-383 (see QF-1). |
| POM compliance | Pass | All new locators are planned for IntakePage.ts (Section 8). No inline selectors appear in test case descriptions. Existing locators (`hotelTypeGrid`, `carCategoryGrid`) may need updating to match new `[data-multi-select]` selectors (see QF-4). |
| Assertion best practices | Pass | Soft assertions used appropriately for batched per-card checks (TC-354, TC-358, TC-373, TC-374). Hard assertions used for critical single-point validations. |
| Performance impact | Pass | 35 tests with ~25s increase is within acceptable bounds. Shared preconditions (Step 0+1 setup) are reused via POM helpers. |
| Reliability | Fail | TC-383 uses `page.waitForTimeout(600)` which violates Section 3 of automation_rules.md (Zero-Flakiness Policy: "No Hard Sleeps"). See QF-1. |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: Select 2+ accommodation types | TC-351 | None |
| REQ-001 | AC-2: Toggle off selected type | TC-352 | None |
| REQ-001 | AC-3: Select without clearing siblings | TC-351 | None |
| REQ-001 | AC-4: Independent `.is-selected` visual state | TC-354, TC-379, TC-380 | None |
| REQ-001 | AC-5: All 12 selectable | TC-353 | None |
| REQ-001 | AC-6: "Not specified" when none selected | TC-361 | None |
| REQ-002 | AC-1: Select 2+ car categories | TC-355 | None |
| REQ-002 | AC-2: Toggle off selected category | TC-356 | None |
| REQ-002 | AC-3: Select without clearing siblings | TC-355 | None |
| REQ-002 | AC-4: Independent `.is-selected` state | TC-358, TC-379 | None |
| REQ-002 | AC-5: All 14 selectable | TC-357 | None |
| REQ-002 | AC-6: "Not specified" when none selected | TC-363 | None |
| REQ-003 | AC-1: Single selection output | TC-359 | None |
| REQ-003 | AC-2: Multi selection comma-separated | TC-360 | None |
| REQ-003 | AC-3: Zero selection "Not specified" | TC-361, TC-363 | None |
| REQ-003 | AC-4: Same format for car category | TC-362 | None |
| REQ-003 | AC-5: DOM order preserved | TC-360 | None |
| REQ-003 | AC-6: English `data-en-name` values | TC-364 | None |
| REQ-004 | AC-1: Step 1 -> Step 2, no overlay | TC-365 | None |
| REQ-004 | AC-2: Step 2 -> depth overlay | TC-366 | None |
| REQ-004 | AC-3: Depth confirm -> Step 3 | TC-367 | None |
| REQ-004 | AC-4: Stepper correct sequence | TC-371 | None |
| REQ-004 | AC-5: Back from Step 3 -> Step 2 | TC-368 | None |
| REQ-004 | AC-6: Back from Step 2 -> Step 1 | TC-369 | None |
| REQ-004 | AC-7: Depth pill re-entry works | TC-370 | None |
| REQ-004 | AC-8: stepBeforeOverlay tracks Step 2 | TC-372 | None |
| REQ-005 | AC-1: Hotel toggle "No" clears all types | TC-373 | None |
| REQ-005 | AC-2: Car toggle "No" clears all categories | TC-374 | None |
| REQ-005 | AC-3: Re-enable shows clean state | TC-373, TC-374 | None |

## 4. Feedback Items

### QF-1: TC-383 uses prohibited `page.waitForTimeout()`

**Severity:** Blocking
**Section:** Test Cases, TC-383
**Issue:** TC-383 ("No auto-advance on multi-select card click") uses `page.waitForTimeout(600)` to wait for the auto-advance timer. This directly violates `automation_rules.md` Section 3 (Zero-Flakiness Policy): "The use of `page.waitForTimeout()` or `sleep()` is strictly prohibited." The plan acknowledges the timeout but rationalizes it as acceptable for a timing-sensitive negative assertion. The policy makes no exceptions.
**Suggestion:** Replace the hard sleep with a web-first assertion pattern. After clicking the multi-select card, assert that the step number remains 2 using `expect(intake.visibleStep).toHaveAttribute('data-step', '2')` with a custom timeout that exceeds the auto-advance window (e.g., `{ timeout: 1000 }`). This auto-retries and is deterministic. Alternatively, use `page.waitForFunction(() => { /* check internal autoAdvanceTimer state */ })` if the auto-advance timer is accessible. The test logic is valid and important -- only the wait mechanism must change.

---

### QF-2: TC-354 and TC-379 partially overlap on hotelType per-card state

**Severity:** Recommendation
**Section:** Test Cases, TC-354 and TC-379
**Issue:** TC-354 asserts `.is-selected` class presence per card index for hotelType. TC-379 asserts `aria-pressed` toggles per card for hotelType. Both test per-card independent state on the same grid, but via different DOM attributes. While they are not exact duplicates (one checks class, one checks ARIA attribute), they follow the same select/verify pattern on the same grid. This adds test count without proportional coverage gain, since the implementation couples `.is-selected` and `aria-pressed` toggling in the same click handler.
**Suggestion:** Consolidate TC-354 and TC-379 into a single test case that asserts BOTH `.is-selected` AND `aria-pressed` per card in one pass using `expect.soft()`. This reduces test count by 1 and makes the coupling explicit. For example: select cards 0 and 2, then soft-assert both `classList.contains('is-selected')` and `getAttribute('aria-pressed') === 'true'` for each card in a loop.

---

### QF-3: TC-385 overlaps with TC-365 through TC-369 navigation chain

**Severity:** Recommendation
**Section:** Test Cases, TC-385
**Issue:** TC-385 ("IntakePage navigation helpers updated for new step order") performs a full forward navigation (Step 0 -> Step 8) asserting the same step transitions already covered by TC-365 (Step 1 -> Step 2), TC-366 (Step 2 -> overlay), TC-367 (overlay -> Step 3), TC-368 (back Step 3 -> Step 2), and TC-369 (back Step 2 -> Step 1). The stated purpose is to test POM helper method correctness, but POM helpers are implementation details -- what matters is that navigation works, which the dedicated TC-365 through TC-369 tests already validate. Running the same navigation chain twice wastes ~5s of test runtime.
**Suggestion:** Remove TC-385 as a standalone test. Instead, ensure that TC-365 through TC-369 internally use the POM helper methods (`completeStep0()`, `completeStep1()`, `completeStep2()`, `setupWithDepth()`) in their precondition setup. If those helpers are broken, the dedicated tests will fail anyway. If there is a concern about `completePrerequisiteSteps()` specifically, add a brief assertion inside TC-365's precondition setup rather than a separate full-chain test.

---

### QF-4: Existing POM locators `hotelTypeGrid` and `carCategoryGrid` may conflict with new multi-select locators

**Severity:** Observation
**Section:** POM Changes Required, Section 8
**Issue:** The test plan proposes three new locators (`hotelTypeMultiSelectGrid`, `carCategoryMultiSelectGrid`, `multiSelectHints`) but does not mention whether the existing `hotelTypeGrid` and `carCategoryGrid` locators in IntakePage.ts (lines 162-170) will be updated or deprecated. The existing `hotelTypeGrid` uses `[data-question-key="hotelType"] .option-grid` which will still match the same element even after `data-multi-select` is added. Having both `hotelTypeGrid` and `hotelTypeMultiSelectGrid` pointing to the same DOM element creates locator ambiguity.
**Suggestion:** Clarify the locator strategy during implementation. Recommended approach: update the existing `hotelTypeGrid` and `carCategoryGrid` locators to include the `[data-multi-select]` attribute selector, and do NOT add separate `hotelTypeMultiSelectGrid` / `carCategoryMultiSelectGrid` locators. This avoids having two locators for the same element. If other tests need to target the grid without the multi-select qualifier, keep the existing locator and document why both exist.

---

## 5. Best Practice Recommendations

1. **Consolidate select + toggle-off tests:** TC-351 + TC-352 (hotelType select + toggle-off) are noted as candidates for combining into a single test body. The same applies to TC-355 + TC-356 (carCategory). This is good practice -- implement it to reduce total test count from 35 to 33.

2. **Use `data-en-name` extraction pattern consistently:** TC-359, TC-360, TC-362, and TC-364 all read `data-en-name` from cards before navigating to the review step. Extract this into a reusable POM helper method (e.g., `getSelectedEnNames(gridLocator): Promise<string[]>`) to avoid duplicating the `page.evaluate` pattern across four tests.

3. **Guard markdown assertion specificity:** TC-359 through TC-363 assert markdown output lines. Ensure assertions match the exact line format (`- **Accommodation type:** ...`) using a regex or string match that includes the bold markers, not just the value. This prevents false positives if a similar phrase appears elsewhere in the markdown.

4. **Document TC-206/TC-216/TC-329 replacement clearly in code:** When replacing these existing tests, add a code comment referencing the old TC number and the reason for replacement. This helps future reviewers understand why the test body changed. Example: `// Replaces TC-206 (was single-select radio; now multi-select toggle per BRD REQ-001)`.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-29 | Approved with Changes |

**Conditions for approval (if "Approved with Changes"):**
- [ ] QF-1 (Blocking): Remove `page.waitForTimeout(600)` from TC-383 and replace with a web-first assertion or `waitForFunction` approach that satisfies the Zero-Flakiness Policy
- [ ] QF-2 (Recommendation): Consolidate TC-354 and TC-379 into one test, or document why both are needed with distinct assertion rationale
- [ ] QF-3 (Recommendation): Remove TC-385 or justify its distinct value vs. TC-365 through TC-369
