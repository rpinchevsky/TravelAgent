# QA Architecture Review — Pipeline Progress Bar

**Date:** 2026-03-21
**Reviewer:** QA Architect
**Artifact Reviewed:** `test_plan.md` (same folder)
**Status:** Approved

---

## 1. Verdict

**APPROVED.** The test plan is adequate for the scope and risk profile of this change. The manual-only strategy is justified, and all BRD acceptance criteria are covered by the verification checklist.

---

## 2. Strategy Assessment

### 2.1 Manual-Only Decision: Agree

The test plan's rationale for no automated tests is sound:

- The feature is a static visual component with zero JavaScript logic.
- Automating it would require navigating the full 7-step wizard and triggering download, which is a fragile end-to-end path for testing 6 static `<div>` elements.
- The existing intake test infrastructure (`IntakePage`) does not navigate past the depth selector, and extending it to Step 7's post-download section would be a significant scope expansion for minimal regression prevention value.
- The risk of regression is near-zero: the component has no event handlers, no conditional rendering, and no data dependencies.

### 2.2 Alternative Considered and Dismissed

The test plan mentions that the 8 new i18n keys *could* be added to the existing `intake-depth-i18n.spec.ts` test. I agree with the decision to defer this. If in the future the project adds more intake i18n tests, the pipeline keys should be folded in. For now, manual code review verification (MV-008 #5, #6) is sufficient.

---

## 3. Coverage Analysis

### 3.1 BRD Acceptance Criteria Mapping

| AC | Covered? | Manual Verification |
|----|----------|---------------------|
| AC-001.1 | Yes | MV-001 #3, #4 |
| AC-001.2 | Yes | MV-001 #5, #6 |
| AC-001.3 | Yes | MV-001 #1, #2 |
| AC-001.4 | Yes | MV-004 #1, #2 |
| AC-001.5 | Yes | MV-004 #3, #4 |
| AC-001.6 | Yes | MV-005 #1-#6 |
| AC-001.7 | Yes | MV-006 #1-#5 |
| AC-001.8 | Yes | MV-007 #1-#5 |
| AC-001.9 | Yes | MV-008 #1-#6 |
| AC-002.1 | Yes | MV-002 #1-#6 |
| AC-002.2 | Yes | MV-002 #8, MV-003 #5 |
| AC-002.3 | Yes | MV-002 #7 |
| AC-002.4 | Yes | MV-003 #1-#5 |
| AC-002.5 | Partial | See finding F-001 below |

**Coverage: 14/14 acceptance criteria mapped (1 partial).**

### 3.2 Findings

#### F-001: AC-002.5 — Timing as JS Data Constants (Severity: Low)

**BRD says:** "Timing values are defined as data constants in JavaScript (not hardcoded in HTML), enabling future updates without HTML surgery."

**Detailed Design says:** "step names, durations, and percentages are hardcoded in HTML" (Section 4.2) and "No new JavaScript is required" (Section 4.1).

**Assessment:** The DD explicitly chose to hardcode timing in HTML rather than use JS constants. This contradicts AC-002.5, but is an intentional design decision documented in the HLD/DD. The test plan's MV-002 section includes a parenthetical "code review note" for this AC, which is appropriate. However, the check is implicit rather than explicit.

**Recommendation:** Add a single explicit check to MV-002 for code review verification of where timing values are defined (HTML attributes vs. JS constants). This ensures the reviewer consciously notes the design deviation from the BRD, rather than silently passing it. No test plan rework required -- just a clarity improvement.

#### F-002: Hover Behavior Not Verified (Severity: Informational)

The detailed design specifies that hovering over the bar track brings all segments to full opacity (CSS transition). The test plan does not explicitly verify this.

**Assessment:** This is a minor CSS interaction enhancement, not a BRD acceptance criterion. It falls into "nice to verify" territory but does not represent a coverage gap against the BRD.

**Recommendation:** No action required. If desired, add as an optional check under MV-003.

#### F-003: Min-Width Readability Not Explicitly Verified (Severity: Informational)

The DD specifies `min-width: 60px` on steps and `min-width: 4px` on bar segments to ensure small-percentage steps (Budget, Assembly, QA at 3%) remain readable. MV-005 covers "no clipping" generically but does not call out the small-step readability concern.

**Assessment:** Covered implicitly by MV-005 #6 ("No horizontal overflow or clipping at any viewport width down to 320px") and MV-001 #3 ("Exactly 6 step elements are rendered"). If all 6 steps render without clipping, the min-width is working.

**Recommendation:** No action required.

---

## 4. Risk Assessment

| Risk | Likelihood | Impact | Mitigation in Test Plan |
|------|------------|--------|-------------------------|
| Pipeline roadmap doesn't appear on download click | Low | Medium | MV-004 #2 explicitly checks this |
| RTL direction not reversed | Low | Low | MV-007 has 5 checks for RTL |
| i18n keys missing for some languages | Low | Low | MV-008 #5, #6 cover code review |
| Dark mode colors unreadable | Very Low | Low | MV-006 has 5 checks |
| Mobile layout broken | Low | Medium | MV-005 has 6 checks including 320px minimum |
| Regression in existing features | Very Low | High | No existing code is modified (additive-only change); existing tests cover other features |

**Overall risk: Low.** The feature is additive-only. No existing HTML, CSS, or JavaScript is modified -- only new lines are inserted. Existing intake and regression tests are unaffected.

---

## 5. Summary

| Metric | Value |
|--------|-------|
| Automated test cases | 0 (justified) |
| Manual verification groups | 9 (MV-001 through MV-009) |
| Manual verification checks | 39 total |
| BRD AC coverage | 14/14 (1 partial — design deviation noted) |
| Findings | 1 low-severity, 2 informational |
| Verdict | **Approved** |
