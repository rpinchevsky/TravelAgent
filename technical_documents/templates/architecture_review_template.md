# Architecture Review

**Change:** {Change title}
**Date:** {YYYY-MM-DD}
**Reviewer:** Software Architect
**Documents Reviewed:** {HLD, DD file references}
**Verdict:** Approved | Approved with Changes | Rejected

---

## 1. Review Summary

{Overall assessment of the proposed design.}

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass / Fail | {Can content change without UI rebuild?} |
| Easy to extend for new requirements | Pass / Fail | {Would a similar future change be straightforward?} |
| Consistent with existing patterns | Pass / Fail | {Does it follow established conventions?} |
| No unnecessary coupling | Pass / Fail | {Are components properly decoupled?} |
| Regeneration performance | Pass / Fail | {Content-only changes don't trigger full rebuild?} |

## 3. Feedback Items

### FB-{N}: {Title}

**Severity:** Blocking | Recommendation | Observation
**Affected document:** {HLD / DD}
**Section:** {§N}
**Issue:** {What is the concern?}
**Suggestion:** {How to address it}

---

*(Repeat FB block for each item)*

## 4. Best Practice Recommendations

{Any general best-practice guidance for the development team related to this change.}

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | | Approved / Approved with Changes / Rejected |

**Conditions for approval (if "Approved with Changes"):**
- [ ] {Condition 1}
- [ ] {Condition 2}
