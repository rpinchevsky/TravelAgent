# QA Architecture Review

**Change:** Parallelize Phase B Day Generation
**Date:** 2026-03-15
**Reviewer:** QA Architect
**Documents Reviewed:** `business_requirements.md`, `test_plan.md`, `automation_rules.md`, `TripPage.ts`
**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is well-structured with clear traceability to BRD requirements. The scope justification for excluding LLM orchestration concerns (batch assignment, parallel spawning, file ownership isolation) is sound — these are behavioral rules for the agent, not observable from generated artifacts. The plan correctly identifies that the testable surface is outcomes (file existence, content integrity, manifest correctness) and leverages existing regression coverage where appropriate. Three progression tests are proposed, all lightweight and correctly placed in `progression.spec.ts`. Two minor feedback items need addressing before implementation.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All testable ACs covered; untestable ACs justified with clear rationale |
| No duplicate tests | Pass | TC-001 through TC-007 each assert distinct properties; no overlap |
| Correct fixture usage | Pass | All new tests use shared-page fixture (read-only: file I/O + DOM reads) |
| POM compliance | Pass | New tests use `getExpectedPoiCountsFromMarkdown()` or file I/O; no new DOM locators needed. Existing tests already use TripPage.ts locators |
| Assertion best practices | Pass | `expect.soft()` for per-day manifest checks; hard assert for duplicate POI (correct — it is a critical defect) |
| Performance impact | Pass | < 1 second estimated; manifest read is file I/O, POI dedup is in-memory set |
| Reliability | Pass | No hard sleeps, no race conditions; deterministic file reads |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: Batch count/size | — | None (untestable: LLM orchestration rule) |
| REQ-001 | AC-2: Every day assigned exactly once | TC-001 | None (indirect: all days exist in HTML) |
| REQ-001 | AC-3: Chronological order within batch | — | None (untestable: LLM orchestration rule) |
| REQ-002 | AC-1: Parallel spawning | — | None (untestable: LLM orchestration rule) |
| REQ-002 | AC-2: Subagent generates only its batch | TC-001 | None (indirect: all days correct) |
| REQ-002 | AC-3: Same generation context | TC-002, TC-003 | None (indirect: content quality unchanged) |
| REQ-003 | AC-1: No subagent writes manifest | TC-005, TC-006 | None (indirect: manifest correct post-completion) |
| REQ-003 | AC-2: File ownership isolation | TC-001 | None (indirect: all days exist) |
| REQ-003 | AC-3: No cross-batch file access | — | None (untestable: LLM orchestration rule) |
| REQ-004 | AC-1: All days complete in manifest | TC-005 | None (direct) |
| REQ-004 | AC-2: Non-null timestamps | TC-006 | None (direct) |
| REQ-004 | AC-3: Single manifest write | — | None (untestable: timing not observable post-hoc) |
| REQ-005 | AC-1: Existing tests pass unchanged | TC-007 | None (full suite execution) |
| REQ-005 | AC-2: Day file format intact | TC-002, TC-003 | None (direct) |
| REQ-005 | AC-3: No duplicate POIs | TC-004 | None (direct) |
| REQ-006 | AC-1: File existence verification | TC-001 | None (indirect: all days render) |
| REQ-006 | AC-2: Missing files reported | — | None (untestable: LLM error-handling behavior) |
| REQ-006 | AC-3: Pipeline blocked if missing | — | None (untestable: LLM control-flow behavior) |

## 4. Feedback Items

### QF-1: TC-005 and TC-006 should be a single test, not two

**Severity:** Recommendation
**Section:** Test Cases (TC-005, TC-006)
**Issue:** The test plan notes in TC-006 implementation notes: "Combine with TC-005 into a single test using `expect.soft()` for both status and timestamp per day." However, TC-005 and TC-006 are listed as separate test cases with separate descriptions. The plan should be explicit that these produce exactly one `test()` block in code, not two, per the consolidation guidance in automation_rules.md section 6.4 ("Consolidate per-day loops into a single test with `expect.soft()` where possible").
**Suggestion:** Merge TC-005 and TC-006 into a single test case description (e.g., "TC-005: Manifest has all days with status complete and non-null timestamps"). This aligns the test plan document with the stated implementation intent and avoids ambiguity during implementation.

### QF-2: Manifest reader utility — clarify trip folder discovery pattern

**Severity:** Recommendation
**Section:** Test Data Dependencies / Risk & Mitigation
**Issue:** The test plan mentions "A manifest reader function in `trip-config.ts` (or a new `manifest-reader.ts` utility)" but does not specify how the trip folder is discovered. The existing `markdown-pois.ts` already implements trip folder discovery logic (scanning `generated_trips/` for the latest `trip_YYYY-MM-DD_HHmm` folder). Duplicating this logic in a second utility would violate DRY.
**Suggestion:** Extract the trip folder discovery logic from `markdown-pois.ts` into a shared utility (e.g., `trip-folder.ts`) that both `markdown-pois.ts` and the new manifest reader can import. Alternatively, add a `getLatestTripFolder()` function to `trip-config.ts` and have both utilities call it. This prevents two independent implementations of the same folder-scanning pattern from drifting apart.

---

## 5. Best Practice Recommendations

1. **Manifest schema validation**: When reading `manifest.json`, use defensive parsing. If the file does not exist or is malformed JSON, fail with a clear error message rather than an unhandled exception. Follow the same fail-fast pattern used in `trip-config.ts` (`throw new Error(...)` with actionable context).

2. **POI dedup comparison**: TC-004 should compare cleaned POI names (after emoji stripping) rather than raw names, consistent with how `progression.spec.ts` already handles POI name matching in the "Dynamic POI Presence" test. The existing `getExpectedPoiCountsFromMarkdown()` returns raw names including emoji prefixes, so the dedup logic must normalize before comparison.

3. **Test naming**: When appending to `progression.spec.ts`, place the manifest tests in a new `test.describe('Progression — Manifest Integrity')` block and the POI dedup test in the existing `Progression — POI Cards & Distribution` block for logical grouping.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-15 | Approved with Changes |

**Conditions for approval (if "Approved with Changes"):**
- [ ] QF-1: Merge TC-005 and TC-006 into a single test case in the test plan document
- [ ] QF-2: Use shared trip folder discovery logic rather than duplicating the pattern from markdown-pois.ts
