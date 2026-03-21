# QA Architecture Review

**Change:** Dynamic Trip Details Filename Support
**Date:** 2026-03-21
**Reviewer:** QA Architect
**Documents Reviewed:** `technical_documents/2026-03-21_dynamic-trip-details-filename/business_requirements.md`, `technical_documents/2026-03-21_dynamic-trip-details-filename/test_plan.md`
**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is well-structured and demonstrates strong understanding of the automation rules, particularly the language-independence principle and the dual-run strategy for env-var-dependent tests. Coverage of automatable acceptance criteria is comprehensive (14 of 26 ACs mapped; the remaining 12 are rule-file documentation changes correctly scoped out of automation). The plan correctly avoids creating new spec files (zero files added), reuses existing language/trip-agnostic tests for Maryan.md validation, and keeps runtime impact minimal (< 1 second for 2 new tests).

Three non-blocking feedback items were identified, all at "Recommendation" severity. No blocking issues found. The plan is ready for implementation after addressing the recommendations.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 26 ACs are mapped in the coverage matrix. 14 have automated tests; 12 are rule-file changes correctly marked as human-review only. No gaps. |
| No duplicate tests | Pass | TC-001 through TC-011 each assert a distinct concern. TC-007 is explicitly identified as implicitly covered by TC-001/TC-004 with no new code, avoiding duplication. |
| Correct fixture usage | Pass | TC-001/TC-003/TC-005 use standard `@playwright/test` (unit-level, no browser). TC-006 is placed in `progression.spec.ts` which uses `shared-page` fixture — correct since manifest reading is read-only. TC-008/TC-009 use standard import in `language-independence.spec.ts` — correct for file-system scanning. |
| POM compliance | Pass | No new POM locators are needed. All new tests are file-level (manifest JSON, source code scanning), not DOM-level. No inline locators introduced. |
| Assertion best practices | Pass | TC-008 correctly specifies `expect.soft()` for batched file scanning. TC-006 uses hard assert on field presence (appropriate since downstream consumers depend on it). TC-009 uses clear regex patterns with descriptive failure messages. |
| Performance impact | Pass | 2 new tests adding < 1 second total runtime. No browser interaction required for any new test. Existing test count unchanged. |
| Reliability | Pass | No hard sleeps, no race conditions. All new tests are deterministic file-system reads. The dual-run strategy for env var tests avoids mid-process env var manipulation, which is the correct approach. |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: trip_planning_rules.md no hardcoded filename | N/A — human review | None (correctly out of automation scope) |
| REQ-001 | AC-2: content_format_rules.md no hardcoded filename | N/A — human review | None |
| REQ-001 | AC-3: rendering-config.md no hardcoded filename | N/A — human review | None |
| REQ-001 | AC-4: render SKILL.md no hardcoded filename | N/A — human review | None |
| REQ-001 | AC-5: CLAUDE.md accepts filename parameter | N/A — human review | None |
| REQ-002 | AC-1: trip-config.ts uses env var | TC-003, TC-009 | None |
| REQ-002 | AC-2: language-config.ts uses env var | TC-005, TC-009 | None |
| REQ-002 | AC-3: Default fallback to trip_details.md | TC-001, TC-004, TC-010 | None |
| REQ-002 | AC-4: Maryan.md parses correctly in loadTripConfig | TC-003 | None |
| REQ-002 | AC-5: Maryan.md parses correctly in loadPoiLanguageConfig | TC-005 | None |
| REQ-002 | AC-6: Env var documented in code comments | TC-008 | None |
| REQ-003 | AC-1: manifest.json schema includes trip_details_file | TC-006 | None |
| REQ-003 | AC-2: Field defaults to trip_details.md | TC-007 (implicit via TC-001) | None |
| REQ-003 | AC-3: Phase A writes trip_details_file | TC-006 | None |
| REQ-003 | AC-4: Rendering reads filename from manifest | N/A — human review | None |
| REQ-004 | AC-1: Phase B Generation Context parameterized | N/A — human review | None |
| REQ-004 | AC-2: Phase B Subagent Execution parameterized | N/A — human review | None |
| REQ-004 | AC-3: Agent Prompt Contract parameterized | N/A — human review | None |
| REQ-004 | AC-4: Maryan.md trip uses Moldova data | N/A — pipeline validation | None |
| REQ-005 | AC-1: Pipeline with Maryan.md produces Moldova trip | N/A — pipeline execution | None |
| REQ-005 | AC-2: Manifest contains trip_details_file + destination | TC-006 | See QF-1 |
| REQ-005 | AC-3: Hebrew reporting language used | TC-003, TC-005 | None |
| REQ-005 | AC-4: Tests with TRIP_DETAILS_FILE=Maryan.md pass | TC-003, TC-005 (env var run) | None |
| REQ-005 | AC-5: Default pipeline still produces Budapest trip | TC-010 | None |
| REQ-006 | AC-1: trip_intake_rules.md allows custom filename | N/A — human review | None |
| REQ-006 | AC-2: Any compliant file is valid pipeline input | N/A — human review | None |

## 4. Feedback Items

### QF-1: TC-006 manifest field assertion should also validate `destination` when running with Maryan.md

**Severity:** Recommendation
**Section:** Test Cases — TC-006
**Issue:** REQ-005 AC-2 specifies that the manifest should contain both `"trip_details_file": "Maryan.md"` and `"destination": "Moldova"`. TC-006 only asserts the `trip_details_file` field is a non-empty string. While the test plan correctly avoids hardcoding trip-specific values, the `destination` field validation is not covered by any automated test when running with `TRIP_DETAILS_FILE=Maryan.md`.
**Suggestion:** In TC-006's implementation notes, clarify that the existing `progression.spec.ts` Manifest Integrity tests already validate structural completeness (day statuses, languages key). The `destination` field in the manifest is validated by the broader trip-config tests (TC-003 checks `config.destination` is non-empty). If explicit manifest-level destination validation is desired, add a soft assert for `manifest['destination']` being a non-empty string alongside the `trip_details_file` check — this remains trip-agnostic.

---

### QF-2: TC-006 conditional logic may mask regressions

**Severity:** Recommendation
**Section:** Risk & Mitigation — TC-006 note
**Issue:** The risk mitigation for TC-006 states: "if field exists, assert non-empty string; if absent, that is also acceptable for older manifests." This conditional logic means that if the implementation fails to write the `trip_details_file` field, TC-006 passes silently (treating it as an "older manifest"). After the DD changes are deployed and a new trip is generated, the field should always be present.
**Suggestion:** Remove the conditional logic. After implementation, TC-006 should hard-assert that `trip_details_file` exists and is a non-empty string. If testing against a pre-change manifest (before regeneration), the test will fail, which is the correct signal — it means the manifest needs regeneration. Add an implementation note: "This test assumes the latest trip was generated after the DD changes. If running against a stale manifest, regenerate the trip first."

---

### QF-3: TC-009 regex should be documented in the test plan with exact pattern

**Severity:** Recommendation
**Section:** Test Cases — TC-009
**Issue:** TC-009 describes the regex conceptually ("target `resolve(...)` calls with hardcoded `trip_details.md`") but provides the exact pattern in two different forms between the Steps section (`resolve.*trip_details.md`) and Implementation Notes (`resolve\(.*['"]trip_details\.md['"]\)`). The implementation notes version is more precise, but this ambiguity could lead to the wrong pattern being coded.
**Suggestion:** Settle on the precise regex pattern in the Steps section: `/resolve\(.*['"]trip_details\.md['"]\)/`. Remove the less precise version from the Steps block to avoid confusion. The implementation notes correctly call out that `|| 'trip_details.md'` fallback must not be flagged — this guidance is clear and should be kept.

---

## 5. Best Practice Recommendations

1. **Dual-run documentation:** The test plan's strategy of running existing trip-agnostic tests with `TRIP_DETAILS_FILE=Maryan.md` is sound and aligns with the language-independence principle. Document the dual-run command in a comment at the top of `trip-config.spec.ts` as planned (TC-003 implementation notes). This serves as discoverability for future developers.

2. **Cache invalidation testing limitation:** The plan correctly identifies that cache invalidation by filename cannot be tested within a single process. The structural validation approach (TC-002 + TC-003 dual-run) is the pragmatic solution within Playwright's process model. No further action needed.

3. **Error message validation (TC-011):** The decision to validate dynamic error messages via code review rather than automated test is appropriate. Error paths require invalid input files, and Playwright lacks file-system mocking. TC-009's source-code scanning provides partial coverage by detecting hardcoded `trip_details.md` patterns in `throw` statements. This is a reasonable compromise.

4. **Progression file consolidation:** TC-006 correctly targets `progression.spec.ts` (appending to the Manifest Integrity block) per automation rule 6.4. The plan does not create a new spec file, which is correct.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-21 | Approved with Changes |

**Conditions for approval (if "Approved with Changes"):**
- [ ] QF-1: Clarify destination field coverage for REQ-005 AC-2 (add soft assert or document existing coverage)
- [ ] QF-2: Remove conditional logic from TC-006 — hard-assert `trip_details_file` presence; add note about manifest regeneration prerequisite
- [ ] QF-3: Consolidate TC-009 regex pattern to the precise form in both Steps and Implementation Notes sections
