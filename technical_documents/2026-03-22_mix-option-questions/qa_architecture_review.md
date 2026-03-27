# QA Architecture Review

**Change:** Add "Mix of All" option to categorical quiz questions
**Date:** 2026-03-22
**Reviewer:** QA Architect
**Review Round:** 2 (re-review of revised test plan)
**Documents Reviewed:** `test_plan.md` (revised), `business_requirements.md`, `detailed_design.md`, `automation_rules.md`, `IntakePage.ts`, `playwright.config.ts`
**Verdict:** Approved

---

## 1. Review Summary

The revised test plan fully addresses the blocking item (QF-1) from the first review. The Playwright config routing is now explicitly documented in both Section 2 (Config prerequisite) and Section 7 (Playwright config changes) with the exact three modifications required: updating the `intake-i18n` project `testMatch` regex and adding `intake-mix-options` to the `testIgnore` arrays in both `desktop-chromium` and `desktop-chromium-rtl` projects. I verified these against the actual `playwright.config.ts` and confirmed the line references and patterns are correct.

All non-blocking feedback items (QF-2 through QF-5) have also been addressed or acknowledged with clear rationale. The selector inconsistency (QF-3) is resolved — step descriptions now consistently reference `[data-question-key="..."]` matching the POM locator. The Option A/B ambiguity (QF-4) is resolved — TC-139 now commits to Option A as the sole approach with no fallback. No new issues were introduced by the revisions.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 7 REQs and 27 ACs mapped to test cases; no orphaned ACs |
| No duplicate tests | Pass | Each AC is tested exactly once; TC-137 consolidates AC-6 across REQ-001/002/003 without redundancy |
| Correct fixture usage | Pass | Standard import for TC-137 (mutations); browser tests routed to `intake-i18n` project with HTTP baseURL; config changes documented |
| POM compliance | Pass | Uses `IntakePage.questionByKey()` for question access; inline sub-locators for `.q-card` / `data-value` are appropriate since they are test-specific DOM queries not reusable across specs |
| Assertion best practices | Pass | `expect.soft()` with descriptive messages throughout; hard assertions only for TC-140 scoring logic where fail-fast is appropriate |
| Performance impact | Pass | Estimated ~4s runtime increase is reasonable; consolidation of TC-134/135/136 into 1 data-driven test is good; filesystem tests add negligible overhead |
| Reliability | Pass | No hard sleeps; uses auto-waiting (`toHaveClass`, `toBeVisible`); `page.evaluate()` batching avoids animation timing issues |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: 4 `.q-card` in diningstyle | TC-134 | None |
| REQ-001 | AC-2: card with `data-value="mix"` | TC-134 | None |
| REQ-001 | AC-3: title `data-i18n="q_dine_mix"` | TC-134 | None |
| REQ-001 | AC-4: desc `data-i18n="q_dine_mix_desc"` | TC-134 | None |
| REQ-001 | AC-5: `.q-card__icon` with emoji | TC-134 | None |
| REQ-001 | AC-6: `is-selected` single-select | TC-137 | None |
| REQ-002 | AC-1: 4 `.q-card` in mealpriority | TC-135 | None |
| REQ-002 | AC-2: card with `data-value="all"` | TC-135 | None |
| REQ-002 | AC-3: title `data-i18n="q_meal_all"` | TC-135 | None |
| REQ-002 | AC-4: desc `data-i18n="q_meal_all_desc"` | TC-135 | None |
| REQ-002 | AC-5: `.q-card__icon` with emoji | TC-135 | None |
| REQ-002 | AC-6: `is-selected` single-select | TC-137 | None |
| REQ-003 | AC-1: 4 `.q-card` in transport | TC-136 | None |
| REQ-003 | AC-2: card with `data-value="mix"` | TC-136 | None |
| REQ-003 | AC-3: title `data-i18n="q_transport_mix"` | TC-136 | None |
| REQ-003 | AC-4: desc `data-i18n="q_transport_mix_desc"` | TC-136 | None |
| REQ-003 | AC-5: `.q-card__icon` with emoji | TC-136 | None |
| REQ-003 | AC-6: `is-selected` single-select | TC-137 | None |
| REQ-004 | AC-1: 6 keys in all 12 locale files | TC-138 | None |
| REQ-004 | AC-2: no empty string values | TC-138 | None |
| REQ-004 | AC-3: valid JSON after update | TC-138 | None |
| REQ-005 | AC-1: `diningStyleLabels` has `mix` | TC-139 | None |
| REQ-005 | AC-2: `mealLabels` has `all` | TC-139 | None |
| REQ-005 | AC-3: `transportLabels` has `mix` | TC-139 | None |
| REQ-005 | AC-4: non-empty label in markdown | TC-139 | None |
| REQ-006 | AC-1: no 0 points for mix style | TC-140 | None |
| REQ-006 | AC-2: all items >= 1 point for mix | TC-140 | None |
| REQ-006 | AC-3: existing scoring unchanged | TC-140 | None |
| REQ-007 | AC-1: `mix` listed for diningstyle | TC-141 | None |
| REQ-007 | AC-2: `all` listed for mealpriority | TC-141 | None |
| REQ-007 | AC-3: `mix` listed for transport | TC-141 | None |

## 4. Feedback Items (Round 1 Resolution Status)

### QF-1: Playwright config testMatch pattern does not include new spec file

**Severity:** Blocking (Round 1)
**Status:** Resolved
**Resolution:** The revised test plan now documents the exact config changes in Section 2 ("Config prerequisite") and Section 7 ("Playwright config changes"), including all three required modifications: (1) `intake-i18n` project `testMatch` regex update, (2) `desktop-chromium` `testIgnore` addition, (3) `desktop-chromium-rtl` `testIgnore` addition. Verified against `playwright.config.ts` — line references and regex patterns are correct.

---

### QF-2: TC-138 (filesystem test) runs under wrong project

**Severity:** Recommendation (Round 1)
**Status:** Acknowledged — accepted with rationale
**Resolution:** TC-138 implementation notes now explicitly state the design decision: keeping filesystem tests in the same spec file for simplicity, accepting minor browser context overhead. This is a reasonable trade-off per the automation rules' emphasis on consolidation (Rule 6.4).

---

### QF-3: TC-134/135/136 selector inconsistency

**Severity:** Recommendation (Round 1)
**Status:** Resolved
**Resolution:** Step descriptions now consistently reference `IntakePage.questionByKey('{key}')` targeting `[data-question-key="{key}"]`, matching the actual POM locator.

---

### QF-4: TC-139 Option A regex fragility — no fallback threshold

**Severity:** Observation (Round 1)
**Status:** Resolved
**Resolution:** TC-139 now commits to Option A as the sole approach with explicit statement: "If the regex fails to match due to code refactoring, the test should fail clearly — that failure is the correct signal to update the regex pattern, not to fall back to Option B."

---

### QF-5: TC-140 static analysis may not catch runtime edge cases

**Severity:** Observation (Round 1)
**Status:** Acknowledged — no action required
**Resolution:** Remains acceptable for a progression test. The plan includes a comment explaining why runtime testing is deferred.

## 5. Best Practice Recommendations

1. **Config update is implementation scope.** The three `playwright.config.ts` changes (Section 7) must be implemented alongside the production code, not deferred as a separate task. Without them, browser tests are dead on arrival.

2. **Data-driven consolidation.** The plan's proposal to consolidate TC-134/135/136 into a single data-driven test with an array of config objects is the correct pattern per Rule 6.4. Implement as described.

3. **Single spec file.** Keeping all 8 test cases in `intake-mix-options.spec.ts` is the right call. The filesystem test overhead under the `intake-i18n` project is negligible and avoids splitting maintenance.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-22 | Approved |

**No blocking conditions remain.** The test plan is ready for implementation.
