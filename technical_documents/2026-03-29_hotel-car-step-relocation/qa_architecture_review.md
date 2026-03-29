# QA Architecture Review

**Change:** Relocate Hotel & Car Rental Assistance to a New Dedicated Step 2
**Date:** 2026-03-29
**Reviewer:** QA Architect
**Documents Reviewed:** `business_requirements.md` (BRD), `test_plan.md` (TP), `automation_rules.md`, `IntakePage.ts` (POM)
**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is comprehensive and well-structured. It covers all 12 BRD requirements with 54 test cases across a balanced mix of progression and regression tests. The coverage matrix is thorough — every acceptance criterion maps to at least one test case. Fixture usage is mostly correct, assertion strategies follow best practices, and the plan properly leverages existing test logic with updated navigation targets.

Three items require attention before implementation: one potential duplicate test, one fixture misclassification, and one inherited flakiness pattern that should be explicitly acknowledged with a mitigation path. None are blocking.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 12 requirements and all acceptance criteria covered. REQ-011 correctly excluded from automation (documentation review). REQ-009 AC-2 (auto-advance between questions) is mapped to TC-337 but the test steps only check dot rendering and count — see QF-1. |
| No duplicate tests | Pass (minor concern) | TC-306 (Step 2 always visible in stepper) and TC-345 (hotel/car visible at all depths in Step 2) overlap on "Step 2 visibility at each depth" — see QF-2. |
| Correct fixture usage | Pass (minor concern) | Shared-page correctly used for read-only DOM checks (TC-317, TC-318, TC-320, TC-323, TC-324, TC-347). Standard fixture correctly used for mutation tests. TC-302 (stepper icon) claims shared-page but precondition says "Navigate to intake page" — needs clarification on whether depth selection is needed first — see QF-3. |
| POM compliance | Pass | All locators reference `IntakePage.ts` properties. No inline selectors proposed in test steps. Plan correctly identifies POM changes needed (review step locator, method rename). |
| Assertion best practices | Pass | Proper use of `expect.soft()` for batched assertions (TC-309, TC-314, TC-318, TC-325, TC-337, TC-343). Hard asserts used for structural gatekeeping (TC-301, TC-307, TC-312, TC-317). Descriptive messages noted for soft asserts. |
| Performance impact | Pass | Estimated +8-12 seconds is reasonable. No new spec files — all tests added to existing files. Shared-page fixture used where appropriate to avoid redundant page loads. |
| Reliability | Pass (inherited concern) | TC-338 relies on `waitForTimeout(500)` for auto-advance — this is an inherited pattern acknowledged in the risk table. No new flaky patterns introduced — see QF-4. |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: Step 2 exists in DOM | TC-301 | None |
| REQ-001 | AC-2: Stepper icon for Step 2 | TC-302 | None |
| REQ-001 | AC-3: Title data-i18n attribute | TC-303 | None |
| REQ-001 | AC-4: Description data-i18n attribute | TC-304 | None |
| REQ-001 | AC-5: 12 locale files with new keys | TC-305 | None |
| REQ-001 | AC-6: Step 2 always visible (not depth-gated) | TC-306 | None |
| REQ-002 | AC-1: Hotel section is child of Step 2 | TC-307 | None |
| REQ-002 | AC-2: Hotel toggle renders in Step 2 | TC-308 | None |
| REQ-002 | AC-3: Hotel toggle expands sub-questions | TC-308 | None |
| REQ-002 | AC-4: All 7 hotel sub-questions present | TC-309 | None |
| REQ-002 | AC-5: Collapse resets hotel selections | TC-310 | None |
| REQ-002 | AC-6: Hotel i18n keys render in Step 2 | TC-311 | None |
| REQ-003 | AC-1: Car section is child of Step 2 | TC-312 | None |
| REQ-003 | AC-2: Car toggle renders in Step 2 | TC-313 | None |
| REQ-003 | AC-3: Car toggle expands sub-questions | TC-313 | None |
| REQ-003 | AC-4: All 6 car sub-questions present | TC-314 | None |
| REQ-003 | AC-5: Collapse resets car selections | TC-315 | None |
| REQ-003 | AC-6: Car i18n keys render in Step 2 | TC-316 | None |
| REQ-004 | AC-1: Exactly 9 step elements (0-8) | TC-317 | None |
| REQ-004 | AC-2: Step 3 = questionnaire | TC-318 | None |
| REQ-004 | AC-3: Step 4 = interests | TC-318 | None |
| REQ-004 | AC-4: Step 5 = avoids | TC-318 | None |
| REQ-004 | AC-5: Step 6 = food | TC-318 | None |
| REQ-004 | AC-6: Step 7 = language (no hotel/car) | TC-318, TC-324 | None |
| REQ-004 | AC-7: Step 8 = review | TC-318 | None |
| REQ-004 | AC-8: All data-step values correct | TC-317 | None |
| REQ-005 | AC-1: 9 stepper circles | TC-319 | None |
| REQ-005 | AC-2: Hotel emoji at index 2 | TC-320 | None |
| REQ-005 | AC-3: Stepper fill 100% on Step 8 | TC-321 | None |
| REQ-005 | AC-4: Progress bar 100% on Step 8 | TC-321 | None |
| REQ-005 | AC-5: Circle state transitions | TC-322 | None |
| REQ-005 | AC-6: Stepper labels correct | TC-323 | None |
| REQ-006 | AC-1: No hotel in Step 7 | TC-324 | None |
| REQ-006 | AC-2: No car in Step 7 | TC-324 | None |
| REQ-006 | AC-3: Report language in Step 7 | TC-325 | None |
| REQ-006 | AC-4: Additional notes in Step 7 | TC-325 | None |
| REQ-006 | AC-5: Photography in Step 7 | TC-325 | None |
| REQ-006 | AC-6: Accessibility in Step 7 | TC-325 | None |
| REQ-006 | AC-7: Wheelchair in Step 7 | TC-325 | None |
| REQ-007 | AC-1: Both "Yes" markdown output | TC-326 | None |
| REQ-007 | AC-2: Both "No" markdown omission | TC-327 | None |
| REQ-007 | AC-3: Markdown section order | TC-326 | None |
| REQ-007 | AC-4: Field values from relocated DOM | TC-326, TC-346 | None |
| REQ-007 | AC-5: Filename format unchanged | TC-328 | None |
| REQ-008 | AC-1: Depth overlay on Step 1 Continue | TC-329 | None |
| REQ-008 | AC-2: After depth → lands on Step 2 | TC-329 | None |
| REQ-008 | AC-3: Step 2 Continue → Step 3 | TC-330 | None |
| REQ-008 | AC-4: Back Step 3 → Step 2 | TC-331 | None |
| REQ-008 | AC-5: Back Step 2 → Step 1 | TC-332 | None |
| REQ-008 | AC-6: Full forward 0→8 | TC-333 | None |
| REQ-008 | AC-7: Full backward 8→0 | TC-334 | None |
| REQ-008 | AC-8: Step 0 validation blocks | TC-335 | None |
| REQ-008 | AC-9: Step 1 validation blocks | TC-336 | None |
| REQ-009 | AC-1: Sub-dots in Step 3 | TC-337 | None |
| REQ-009 | AC-2: Auto-advance between questions | TC-337 | Minor — see QF-1 |
| REQ-009 | AC-3: Last question → Step 4 | TC-338 | None |
| REQ-009 | AC-4: Dot count = visible question count | TC-337 | None |
| REQ-009 | AC-5: Back Step 4 → Step 3 | TC-339 | None |
| REQ-010 | AC-1: Leaving Step 3 clears selections | TC-340 | None |
| REQ-010 | AC-2: Steps 4-5-6 preserve selections | TC-341 | None |
| REQ-010 | AC-3: Step 2→3 does not clear | TC-342 | None |
| REQ-011 | AC-1 through AC-9: Rule file updates | Not automated (correct) | None — documentation review |
| REQ-012 | AC-1: Correct step numbers in tests | TC-344 (implicit) | None |
| REQ-012 | AC-2: Hotel/car tests target Step 2 | TC-307, TC-312 | None |
| REQ-012 | AC-3: Step 7 tests exclude hotel/car | TC-324 | None |
| REQ-012 | AC-4: Stepper expects 9 steps | TC-319 | None |
| REQ-012 | AC-5: All tests pass | TC-344 (full suite) | None |

## 4. Feedback Items

### QF-1: REQ-009 AC-2 Coverage Weak in TC-337

**Severity:** Recommendation
**Section:** TC-337 (Sub-step Dots Render in Step 3)
**Issue:** The coverage matrix maps REQ-009 AC-2 ("Selecting an answer auto-advances to the next question after the 400ms delay") to TC-337, but TC-337's steps only verify dot rendering and dot count. The actual auto-advance-between-questions behavior (click answer, next question slides in) is not explicitly tested in TC-337. TC-338 tests the final auto-advance to Step 4 but not the intermediate question-to-question auto-advance within Step 3.
**Suggestion:** Either (a) add a step to TC-337 that clicks an answer on the first visible question and asserts the second question becomes visible, or (b) create a lightweight additional test or extend TC-338 to cover one intermediate auto-advance. Alternatively, update the coverage matrix to map AC-2 to TC-338 if the auto-advance mechanism is considered sufficiently tested by the last-question-to-Step-4 transition. Given this is a regression behavior (unchanged logic, just renumbered step), the risk is low — this is a recommendation, not a blocker.

---

### QF-2: Overlap Between TC-306 and TC-345

**Severity:** Observation
**Section:** TC-306 (Step 2 Always Visible in Stepper) and TC-345 (Hotel/Car Visible at All Depths)
**Issue:** Both tests iterate over all depth levels (10, 20, 30) and navigate to Step 2. TC-306 checks the stepper circle visibility; TC-345 checks hotel/car section visibility. While they assert different things, the cost is 3 extra full navigation sequences (setup + depth selection per depth level). They could be combined into a single parameterized test that checks both stepper visibility and section visibility per depth, saving ~3-6 seconds of runtime.
**Suggestion:** Consider merging TC-306 and TC-345 into a single data-driven test that asserts stepper circle visibility + hotel/car section visibility per depth level using `expect.soft()`. This is an optimization suggestion, not a requirement — the separate tests are not incorrect.

---

### QF-3: TC-302 Fixture Clarification

**Severity:** Recommendation
**Section:** TC-302 (Step 2 Stepper Icon)
**Issue:** TC-302 claims shared-page fixture (read-only DOM check), with precondition "Navigate to intake page." The stepper is rendered on page load regardless of depth selection, so shared-page is correct. However, the note should clarify that the stepper emoji is present in the DOM at load time (before any depth selection or navigation) to justify shared-page. If the stepper only renders step 2's circle after depth selection, shared-page would be incorrect.
**Suggestion:** Verify during implementation that the 9 stepper circles (including Step 2) are present in the initial DOM before depth selection. If they are, shared-page is correct and the note should be explicit about this. If the stepper circle for Step 2 is added dynamically, switch to standard fixture.

---

### QF-4: Inherited waitForTimeout in Auto-Advance Tests

**Severity:** Observation
**Section:** TC-338 (Auto-advance After Last Question) and risk table
**Issue:** The test plan correctly acknowledges the inherited `waitForTimeout(500)` pattern for auto-advance timing. This violates the zero-flakiness policy (automation_rules.md Section 3: "No Hard Sleeps"). The plan notes this is inherited, not newly introduced, which is acceptable. However, there is no mitigation path documented for eventually replacing this with a web-first assertion.
**Suggestion:** Add a note in the implementation notes for TC-338 suggesting a future improvement: replace `waitForTimeout(500)` with `await expect(intake.stepSection(4)).toBeVisible()` (or equivalent web-first assertion that waits for the step transition to complete). This can be done as a separate follow-up cleanup, not as part of this change. No action required now — this is for the engineering backlog.

---

### QF-5: TC-326 Uses English Field Labels in Markdown Assertions

**Severity:** Observation
**Section:** TC-326 (Markdown Output — Both Toggles "Yes")
**Issue:** The implementation notes for TC-326 state "Markdown assertions use English field labels (intentional exception per existing pattern)." This is noted as an existing pattern, but automation_rules.md Section 7.1 states "No hardcoded natural language text." The test plan should clarify why this is an acceptable exception — presumably because the markdown heading `## Hotel Assistance` is a structural marker used by downstream consumers and is always English regardless of UI language.
**Suggestion:** Add a brief rationale in the TC-326 implementation notes: "Markdown section headers (`## Hotel Assistance`, `## Car Rental Assistance`) are always English regardless of UI language — they are structural markers, not localized content. This is consistent with the existing test pattern and does not violate language independence for user-facing text."

---

### QF-6: TC-344 Is Not a Standalone Test

**Severity:** Recommendation
**Section:** TC-344 (Automation POM Uses Correct Step Numbers)
**Issue:** TC-344 is described as "verified by running all test specs — not a standalone test." This is appropriate for REQ-012 AC-5 ("all tests pass"), but the coverage matrix also maps REQ-012 AC-1 ("all tests use correct step numbers") to TC-344. AC-1 is not directly testable by running the suite — it is a code review concern. The test plan should acknowledge this.
**Suggestion:** Update the coverage matrix note for REQ-012 AC-1 to say "Verified by code review + implicit full suite pass" rather than just TC-344. This makes the coverage claim more honest.

---

## 5. Best Practice Recommendations

1. **Consolidation opportunity for TC-303/TC-304:** The plan already notes these can be combined into a single test with `expect.soft()`. Ensure the implementation follows through on this — there should be one `test()` block, not two, for the title and description i18n attributes.

2. **POM method rename safety:** The plan identifies `skipStep2SubSteps` → `skipStep3SubSteps` as a rename. Use TypeScript's compiler (build step) after the rename to catch all callers. Do not rely solely on grep — TypeScript type checking will catch any missed reference as a compile error.

3. **Review step locator in POM:** The existing `IntakePage.ts` has `reviewStep = page.locator('section.step[data-step="7"]')` (line 194). This must be updated to `data-step="8"`. The `getReviewContent()` method (line 397) uses `stepSection(7)` which also needs updating. Both are called out in the test plan's risk table — good.

4. **POM comment updates:** The `IntakePage.ts` comments reference "Step 6" for hotel/car locators (lines 77-91) and "Step 7" for review (line 93). These comments should be updated to "Step 2" and "Step 8" respectively during POM modifications to prevent future confusion.

5. **Test count accounting:** The plan states 54 total test cases and 12 new progression tests, but the list of "new" test IDs in Section 7 contains more than 12 entries. During implementation, reconcile the actual count. This does not affect quality — it is a bookkeeping note.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-29 | Approved with Changes |

**Conditions for approval (if "Approved with Changes"):**
- [ ] QF-1: Clarify REQ-009 AC-2 coverage — either add an intermediate auto-advance assertion to TC-337/TC-338 or update the coverage matrix mapping with a rationale
- [ ] QF-3: Verify shared-page fixture correctness for TC-302 during implementation (confirm stepper circles exist pre-depth-selection)
- [ ] QF-6: Update REQ-012 AC-1 coverage note to include "code review" alongside implicit suite pass
