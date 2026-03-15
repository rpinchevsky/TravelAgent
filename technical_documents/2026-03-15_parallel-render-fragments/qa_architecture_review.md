# QA Architecture Review

**Change:** Parallelize per-day HTML fragment generation in the render pipeline
**Date:** 2026-03-15
**Reviewer:** QA Architect
**Documents Reviewed:** `business_requirements.md` (BRD), `test_plan.md`, `automation_rules.md`, `TripPage.ts`
**Verdict:** Approved

---

## 1. Review Summary

The test plan is well-reasoned and strategically sound. The core insight — that this change modifies *how* fragments are generated (parallel vs sequential) but not *what* the HTML output contains — is correct. The decision to rely on the existing regression suite as the primary validation gate, rather than introducing new tests for untestable workflow orchestration, demonstrates mature test engineering judgment. The coverage matrix is thorough, the traceability is clear, and the plan correctly identifies which BRD acceptance criteria are workflow rules outside the reach of HTML-based assertions. No new POM locators are needed since no new HTML structure is introduced.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | Every AC that manifests in HTML output is mapped to at least one test case. Workflow-only ACs (REQ-002 AC-1/AC-4, REQ-004 AC-2/AC-3/AC-4, REQ-007 AC-1/AC-2) are correctly marked as not HTML-testable. |
| No duplicate tests | Pass | Each TC targets a distinct structural concern (day count/order, internal structure, POI linking, overview/budget, navigation, CSS/SVG, visual). No overlap in assertion scope. |
| Correct fixture usage | Pass | All tests use shared-page fixture (read-only DOM inspection). No mutations required. Consistent with §6.2. |
| POM compliance | Pass | All referenced locators exist in `TripPage.ts`. No inline selectors proposed. No new locators needed since HTML structure is unchanged. |
| Assertion best practices | Pass | Plan references `expect.soft()` for batched per-day assertions (TC-002) with descriptive messages. Consistent with §6.3. |
| Performance impact | Pass | Zero new tests, zero runtime increase. Ideal outcome for a refactoring change. |
| Reliability | Pass | No new flaky patterns introduced. All assertions are web-first DOM reads. No hard sleeps or race conditions. |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: Batch count follows table | TC-001 | None — correct day count in output proves all batches executed |
| REQ-001 | AC-2: Chronological batch order | TC-001 | None — day IDs verified in sequential order |
| REQ-001 | AC-3: No gaps, no overlaps | TC-001 | None — all day IDs 0..N present exactly once |
| REQ-001 | AC-4: Last batch may have fewer days | TC-001 | None — all days present regardless of remainder |
| REQ-002 | AC-1: Parallel execution | — | N/A — workflow orchestration rule, not testable via HTML |
| REQ-002 | AC-2: Each subagent generates only its days | TC-001, TC-002 | None — structure validated per day |
| REQ-002 | AC-3: Predictable output location | — | N/A — validated implicitly by successful assembly |
| REQ-002 | AC-4: Wall-clock time reduction | — | N/A — empirical observation, not automatable |
| REQ-003 | AC-1: 9 mandatory items in prompt | TC-002, TC-003, TC-006 | None — correct HTML structure proves contract compliance |
| REQ-003 | AC-2: Only assigned batch day files | TC-002 | None — each day's content validated individually |
| REQ-003 | AC-3: Shell context read-only | TC-004, TC-005 | None — shell/overview/budget sections intact |
| REQ-003 | AC-4: Explicit day number list | TC-001 | None — all days generated |
| REQ-004 | AC-1: Verify all fragments exist | TC-001 | None — complete HTML proves all fragments present |
| REQ-004 | AC-2: Single retry per failed batch | — | N/A — workflow rule |
| REQ-004 | AC-3: Stop if still missing | — | N/A — workflow rule (no HTML produced to test) |
| REQ-004 | AC-4: Existence check only | — | N/A — workflow rule |
| REQ-005 | AC-1: One fragment file per day | TC-001, TC-002 | None — each day section present and complete |
| REQ-005 | AC-2: Fragment contains only day-card div | TC-006 | None — single `<style>` tag validates no wrapper leakage |
| REQ-005 | AC-3: Read in chronological order | TC-001 | None — day order 0..N verified |
| REQ-005 | AC-4: Retained for incremental rebuild | — | N/A — file management rule |
| REQ-006 | AC-1: Shell fragments before day fragments | TC-005 | None — navigation elements correct |
| REQ-006 | AC-2: Overview/budget sequential | TC-004 | None — both sections present |
| REQ-006 | AC-3: Assembly after verification | TC-001 | None — complete HTML proves post-verification assembly |
| REQ-006 | AC-4: Pre-regression unchanged | All TCs | None — this plan is the pre-regression gate |
| REQ-006 | AC-5: Output structurally identical | TC-007 | None — visual regression covers pixel-level identity |
| REQ-007 | AC-1: Incremental mode sequential | — | N/A — workflow rule |
| REQ-007 | AC-2: Full mode uses parallel batches | — | N/A — workflow rule |

## 4. Feedback Items

### QF-1: Visual regression baseline management procedure

**Severity:** Recommendation
**Section:** TC-007 (§3), §5 (Test Data Dependencies)
**Issue:** The test plan correctly identifies that visual regression baselines may need attention (TC-007 action item, §5 table). However, the procedure is described loosely: "generate baseline screenshots from the current sequential pipeline" and "if baselines need updating, it indicates an unintended output change." It would benefit from an explicit step-by-step procedure to prevent accidental baseline overwrites.
**Suggestion:** Add a concrete pre/post workflow to the action items: (1) Run `npx playwright test --update-snapshots` against the current sequential HTML to ensure baselines are fresh. (2) Regenerate HTML with parallel pipeline. (3) Run visual tests WITHOUT `--update-snapshots`. (4) Only if all visual tests pass, the change is validated. If any fail, investigate before accepting new baselines. This makes the "investigate before updating" guidance actionable.

---

### QF-2: Clarify "visual.spec.ts" existence

**Severity:** Observation
**Section:** TC-007 (§3)
**Issue:** TC-007 references `visual.spec.ts` as an existing spec file with `toHaveScreenshot()`. If this file does not yet exist or has limited coverage, TC-007's coverage claim for REQ-006 AC-5 would be weaker than presented. The coverage matrix assigns this as the sole "Hard" assertion for structural identity.
**Suggestion:** Confirm that `visual.spec.ts` exists and covers day cards and itinerary tables as stated. If it does not yet exist, note it as a precondition rather than an existing test. This does not change the verdict since TC-001 through TC-006 collectively provide strong structural coverage for AC-5 even without visual regression.

---

### QF-3: Cross-batch boundary scenario is only implicitly tested

**Severity:** Observation
**Section:** TC-003 (§3)
**Issue:** The plan correctly notes that cross-batch boundary scenarios (e.g., activity labels linking to POIs in the same day, where adjacent days straddle a batch boundary) are "inherently tested because the final HTML is assembled from all batches." This is true, but the coverage is implicit — no test explicitly validates a day near a batch boundary. Since batch boundaries vary by trip length, this is acceptable for regression but worth documenting as a known limitation.
**Suggestion:** No action needed. The implicit coverage via full-document link resolution (TC-003) is sufficient. This observation is recorded for traceability.

## 5. Best Practice Recommendations

1. **Zero-new-test strategy is correct for refactoring changes.** The automation rules (§6) emphasize minimizing test count and runtime. Adding tests that duplicate existing assertions would violate this principle. The plan's approach of relying on the existing suite is the textbook correct strategy for a parallelization refactor where the output contract is unchanged.

2. **Shared-page fixture alignment.** All referenced spec files use the shared-page fixture for read-only DOM inspection. This is consistent with §6.2 and ensures the parallelization change does not introduce unnecessary test infrastructure.

3. **Soft assertion pattern.** The per-day structural checks in TC-002 using `expect.soft()` with descriptive messages (§6.3) will provide granular failure diagnostics if any batch produces malformed output — pinpointing the exact day and component without masking subsequent failures.

4. **Run the full suite, not a subset.** The action items correctly call for `npx playwright test` (full suite) rather than cherry-picking spec files. This ensures the `code-quality/language-independence.spec.ts` lint guard and any other cross-cutting tests also pass.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-15 | Approved |

**Conditions for approval:** None — approved unconditionally. The two recommendations (QF-1, QF-2) are non-blocking improvements that can be addressed during execution.
