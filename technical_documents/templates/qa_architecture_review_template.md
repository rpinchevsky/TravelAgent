# QA Architecture Review

**Change:** {Change title}
**Date:** {YYYY-MM-DD}
**Reviewer:** QA Architect
**Documents Reviewed:** {Test plan, BRD file references}
**Verdict:** Approved | Approved with Changes | Rejected

---

## 1. Review Summary

{Overall assessment of the test plan's quality and coverage.}

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass / Fail | {Every acceptance criterion has at least one test} |
| No duplicate tests | Pass / Fail | {No two tests assert the same thing} |
| Correct fixture usage | Pass / Fail | {Shared-page for read-only, standard for mutations} |
| POM compliance | Pass / Fail | {All locators in TripPage.ts, not inline in specs} |
| Assertion best practices | Pass / Fail | {expect.soft for batched, descriptive messages} |
| Performance impact | Pass / Fail | {New tests don't significantly increase suite runtime} |
| Reliability | Pass / Fail | {No flaky patterns — hard sleeps, race conditions} |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-{NNN} | AC-1 | TC-{NNN} | None / {Description} |

## 4. Feedback Items

### QF-{N}: {Title}

**Severity:** Blocking | Recommendation | Observation
**Section:** {Test plan section}
**Issue:** {What is the concern?}
**Suggestion:** {How to address it}

---

*(Repeat QF block for each item)*

## 5. Best Practice Recommendations

{Any automation best-practice guidance for the automation engineer related to this change.}

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | | Approved / Approved with Changes / Rejected |

**Conditions for approval (if "Approved with Changes"):**
- [ ] {Condition 1}
- [ ] {Condition 2}
