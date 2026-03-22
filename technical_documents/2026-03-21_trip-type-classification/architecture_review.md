# Architecture Review

**Change:** Trip Type Classification & Type-Aware Question Bank
**Date:** 2026-03-21
**Reviewer:** Software Architect
**Documents Reviewed:** `high_level_design.md` (HLD), `detailed_design.md` (DD)
**Verdict:** Approved

---

## 1. Review Summary

The HLD and DD present a well-structured, additive design that layers trip type classification onto the existing intake wizard without breaking backward compatibility. The core principle -- two-stage filtering (type + tier) applied before depth selection -- is sound and minimally invasive. All 10 BRD requirements are addressed with full traceability (DD section 12). The detection algorithm is deterministic with clear priority ordering, and the expanded question bank (72 questions across 8 categories) is well-organized.

Key strengths:
- `analyzeGroup()` remains untouched; `detectTripType()` consumes its output cleanly
- `QUESTION_META` is additive alongside existing `QUESTION_TIERS` / `QUESTION_DEFAULTS`
- Pre-selection scoring is additive (+1 to +3 modifiers), preserving existing thresholds
- Backward compatibility is maintained at every integration point
- i18n strategy follows established patterns (en/ru/he full, others fallback)

Concerns center on: (1) a design inconsistency in `A6.energyManagement` that introduces a flag-based escape hatch inside the trip type system, (2) a gap in the "Recommended" badge adjustment logic, and (3) a minor DOM ordering question for the new question slides. None are fundamental -- all are fixable within the current design.

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | Trip type detection is pure logic (JS function returning data). UI rendering (pill, toast, depth overlay) is separate. Question metadata (`QUESTION_META`) is a data structure independent of DOM. `generateMarkdown()` reads from the data layer, not from UI state of the trip type pill. |
| Easy to extend for new requirements | Pass | Adding a 7th trip type requires: (1) add a detection rule in priority order, (2) add `appliesTo` entries in `QUESTION_META`, (3) add a `TRIP_TYPE_SCORING` entry, (4) add i18n keys, (5) add an icon. No structural changes needed. The `appliesTo` array pattern makes this straightforward. |
| Consistent with existing patterns | Pass | Follows the established single-file architecture, uses existing `analyzeGroup()` flags, extends existing constants additively, and uses the same i18n `data-i18n` attribute pattern. The `appliesTo` model is a pure string-match array throughout (FB-1 caveat resolved in v2). |
| No unnecessary coupling | Pass | `detectTripType()` depends on `analyzeGroup()` output but not vice versa. `QUESTION_META` is independent of `TRIP_TYPE_SCORING`. Pre-selection scoring additions are modular. The planning rules consume trip type as an optional field with fallback. |
| Regeneration performance | Pass | Content-only changes (adding/editing questions) require updating `QUESTION_META` and DOM slides only -- no structural rebuilds. Trip type detection is instant (DOM reads + arithmetic). No API calls or async operations introduced. |

## 3. Feedback Items

### FB-1: A6 `energyManagement` Hybrid Filter Breaks Pure Trip-Type Model

**Severity:** Blocking
**Affected document:** DD
**Section:** 3.2 (Category A, question A6)

**Issue:** The `energyManagement` question (A6) is defined as applying to "Family, Multi-gen, Senior-containing Adults". The note clarifies it should also appear for Adults trips where `flags.senior` is true. This creates a hybrid filter that depends on both `tripType` and `analyzeGroup()` flags, breaking the clean model where `appliesTo` is a simple array of trip type strings. The `getTypeFilteredQuestions()` function (DD 4.1) does a simple `meta.appliesTo.includes(tripType)` check -- it has no mechanism to say "Adults, but only when senior flag is true."

**Suggestion:** Two options:
- **(Preferred) Remove the hybrid condition.** Since Multi-generational already covers seniors + children, and "Adults" with a senior is an edge case (a group of adults including someone 65+), simply set `appliesTo: ['Family', 'Multi-generational']` and omit the Adults edge case. If an all-adult group with a senior wants energy management guidance, the depth selector at 25+ will surface `relaxationTime` (F2) and `restDayFrequency` (A7) which cover similar ground.
- **(Alternative) Introduce a `conditionalAppliesTo` property** in `QUESTION_META` that takes a function: `conditionalAppliesTo: (tripType, flags) => tripType === 'Adults' && flags.senior`. This adds API complexity but preserves the intent. If chosen, update `getTypeFilteredQuestions()` to check the conditional in addition to the static array.

---

### FB-2: Recommended Badge Adjustment Logic Underspecified

**Severity:** Recommendation
**Affected document:** DD
**Section:** 4.5 (Depth Selector Adaptation)

**Issue:** REQ-009 AC-4 requires the "Recommended" badge to adjust if the standard depth (20) exceeds the available pool. DD section 4.5 mentions this in the traceability table (line 886: "If standard depth (20) > pool, recommend nearest lower") but the `updateDepthCardsForTripType()` code snippet does not implement this logic. The code handles count display and disabling, but never moves the "Recommended" badge.

**Suggestion:** Add explicit logic in `updateDepthCardsForTripType()` to:
1. Check if the type-filtered pool at depth 20 (tier <= T3) has fewer questions than 20.
2. If so, move the "Recommended" badge to the highest depth card whose available count equals or exceeds the depth number.
3. If all depth levels have counts below their number, place "Recommended" on the card with the highest available count.

This is unlikely to trigger in practice (minimum per-type availability is 46), but the depth 30 card could trigger it for some types, and the logic should be complete for robustness.

---

### FB-3: New Question Slides Inserted at End of DOM -- Ordering Implications

**Severity:** Recommendation
**Affected document:** DD
**Section:** 10 (New DOM Elements for Question Slides)

**Issue:** DD section 10 states that 42 new slides will be added after the existing 30, with `data-qindex` values 30-71. The `getVisibleStyleSlides()` function (DD 4.3) sorts by category then tier for presentation, so DOM order should not matter for navigation. However, two concerns:

1. The existing `rebuildStyleSubDots()` function (line 7712 in `trip_intake.html`) may rely on DOM order to assign dot indices. If it iterates DOM children rather than calling the new sorted `getVisibleStyleSlides()`, the sub-dot indices will not match the presentation order.
2. The existing `applyDepth()` function iterates `querySelectorAll('[data-question]')` which returns DOM order. The DD modifies `applyDepth()` but does not explicitly state that it calls the sorted `getVisibleStyleSlides()` for sub-dot rebuilding.

**Suggestion:** In the implementation, ensure that `rebuildStyleSubDots()` uses the same sorted order from `getVisibleStyleSlides()` rather than DOM order. Document this dependency explicitly in the DD to prevent implementation drift.

---

### FB-4: `QUESTION_META` Parallel Structure with `QUESTION_TIERS` / `QUESTION_DEFAULTS`

**Severity:** Recommendation
**Affected document:** DD
**Section:** 3.1 (Data Structure: QUESTION_META)

**Issue:** `QUESTION_META` includes `tier` and `default` properties that duplicate data already in `QUESTION_TIERS` and `QUESTION_DEFAULTS`. The HLD explicitly states these existing structures remain unchanged and `QUESTION_META` is additive. While this preserves backward compatibility, it creates a maintenance risk: if someone updates a tier in `QUESTION_TIERS` but forgets `QUESTION_META`, the two diverge.

**Suggestion:** After implementation is stable, consider making `QUESTION_META` the single source of truth and deriving `QUESTION_TIERS` and `QUESTION_DEFAULTS` from it:
```javascript
const QUESTION_TIERS = Object.fromEntries(
  Object.entries(QUESTION_META).map(([k, v]) => [k, v.tier])
);
```
This is not a blocking concern for initial implementation (backward compatibility is the right call for phase 1), but should be tracked as a follow-up refactoring task to eliminate data duplication.

---

### FB-5: `TRIP_TYPE_SCORING` Uses Exact Item Names -- Fragile Coupling

**Severity:** Recommendation
**Affected document:** DD
**Section:** 6.1 (TRIP_TYPE_SCORING Table)

**Issue:** The `TRIP_TYPE_SCORING` table maps exact item names (e.g., `'Romantic Sunset Cruises'`, `'Candlelit Dinner Experiences'`) to scoring bonuses. These names must exactly match entries in `INTEREST_POOLS`, `AVOID_POOLS`, and `FOOD_POOLS`. If a pool item is renamed or removed, the scoring entry silently becomes a no-op. There is no compile-time or runtime validation that scoring keys match actual pool items.

**Suggestion:** Add a development-time validation (e.g., a `console.warn` in debug mode) that checks all keys in `TRIP_TYPE_SCORING.*.interestBonus` / `avoidBonus` / `foodBonus` exist in the corresponding pool databases. This can be a one-time check on page load that only runs when a debug flag is set. This prevents silent regressions when pool items are renamed.

---

### FB-6: Multi-generational Detection -- Senior Without Children Gap

**Severity:** Observation
**Affected document:** DD
**Section:** 2.2 (Detection Rules)

**Issue:** A group of 3+ adults where one is 65+ and none are children will be classified as "Adults" (Priority 6 catch-all), not "Multi-generational" (Priority 4 requires both senior AND child). This is by BRD design (Multi-gen = senior + child), but worth noting: a grandparent traveling with adult children (aged 30-40) will get the generic "Adults" treatment and miss accessibility/energy-management questions that Multi-gen provides.

**Suggestion:** No design change needed -- this matches the BRD definition. However, if user feedback indicates this is a common scenario, a future iteration could add a 7th type ("Senior Adults") or expand Adults scoring to include accessibility bonuses when `flags.senior` is true. Document this as a known limitation in the rule file update.

---

### FB-7: Category B Has 8 Questions, BRD Says 7

**Severity:** Observation
**Affected document:** DD
**Section:** 3.3 (Category B), 3.10 (Question Count Summary)

**Issue:** The BRD (REQ-003) specifies Category B as "7 questions, 4 new." The DD lists 8 questions in Category B (B1-B8: budget, flexibility, transport, weatherSensitivity, accommodationType, luggageStyle, travelInsurance, carRental). The summary table (DD 3.10) confirms 8. Similarly, Category D has 14 questions (DD) vs. 13 (BRD). Total is 72 questions, which falls within the BRD's 65-75 range (REQ-003 AC-1), so this is not a violation. The per-category counts in the BRD were approximate.

**Suggestion:** No change needed. The 72 total is within the BRD's 65-75 range. Note the deviation in the BRD traceability for auditability.

---

### FB-8: `computeFamilyBalance` Boundary Values

**Severity:** Observation
**Affected document:** DD
**Section:** 2.3 (Family Balance Computation)

**Issue:** The boundary thresholds (ratio <= 0.4 for kid-focused, >= 0.7 for teen-friendly) were chosen without explicit documentation of why these specific values. For example, a single school-age child (age 10) gives ratio = 3/4 = 0.75, which classifies as "teen-friendly" despite being a 10-year-old. A single preschooler (age 5) gives ratio = 2/4 = 0.5, which is "balanced" rather than "kid-focused."

**Suggestion:** These thresholds may need tuning based on real usage. Consider extracting them as named constants (`FAMILY_KID_THRESHOLD = 0.4`, `FAMILY_TEEN_THRESHOLD = 0.7`) alongside `SENIOR_AGE` for easy adjustment. Document the rationale for the chosen values (or mark them as initial estimates subject to tuning).

## 4. Best Practice Recommendations

1. **Test data fixtures:** Create a set of standard traveler compositions (one per trip type, plus edge cases from BRD ACs) as test fixtures. This enables automated validation of `detectTripType()` and `computeFamilyBalance()` without manual setup.

2. **Gradual DOM construction:** The 42 new question slides should be built via JavaScript (like existing dynamic cards) rather than static HTML, to avoid bloating the initial DOM. The DD does not specify this, but given the project already dynamically builds interest/avoid/food cards, the same pattern should apply to question slides. If static HTML is chosen, lazy-build only the current question's DOM on navigation.

3. **Feature flag consideration:** For a change of this magnitude (42 new questions, new detection system, new scoring), consider wrapping the trip type system behind a feature flag (`ENABLE_TRIP_TYPE_DETECTION = true`) during initial deployment. This allows quick rollback without code changes if unexpected issues arise. The flag can be removed once the feature is validated.

4. **Language-agnostic testing reminder:** Per project rules (CLAUDE.md "Language-Agnostic Rule"), all new test assertions for trip type detection, question filtering, and family balancing must validate structure and behavior without matching language-specific strings. Trip type values are English constants, which is good, but test assertions for the UI (toast text, pill text) must use `data-i18n` key checks, not text content checks.

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-03-21 | ~~Approved with Changes~~ |
| Software Architect | 2026-03-21 | **Approved** (Round 2) |

**Conditions for approval (from Round 1 -- all resolved in v2):**
- [x] FB-1: Resolve `A6.energyManagement` hybrid filter -- either remove the Adults+senior edge case from `appliesTo` or introduce a documented conditional mechanism in `getTypeFilteredQuestions()`
- [x] FB-2: Add explicit "Recommended" badge adjustment logic to `updateDepthCardsForTripType()` code in the DD
- [x] FB-3: Confirm that `rebuildStyleSubDots()` will use the sorted order from `getVisibleStyleSlides()`, not DOM order

---

## 6. Round 2 Review

**Reviewed documents:** HLD v2, DD v2 (revision history sections and all modified sections)
**Date:** 2026-03-21

### 6.1 Blocking Items -- Resolution Status

| Item | Severity | Status | Verification |
|---|---|---|---|
| FB-1: A6 `energyManagement` hybrid filter | Blocking | **Resolved** | DD section 3.2: `appliesTo` is now `['Family', 'Multi-generational']` only. The `Adults + flags.senior` edge case has been removed entirely. DD section 3.1 explicitly states "No conditional/flag-based filtering -- this is a pure string-match model." HLD section 4.2 echoes this: "pure string-match model" with "no conditional or flag-based filtering logic." The `getTypeFilteredQuestions()` function (DD 4.1) remains a clean `includes()` check. The rationale is sound: `relaxationTime` (F2) and `restDayFrequency` (A7), both applying to all trip types, cover energy management for Adults trips with a senior. Adults per-type count properly adjusted from 50 to 49 in section 3.10. |

### 6.2 Recommendations -- Resolution Status

| Item | Severity | Status | Verification |
|---|---|---|---|
| FB-2: Recommended badge logic | Recommendation | **Resolved** | DD section 4.5 now contains complete badge relocation logic with three-tier fallback: (1) depth 20 has enough questions -- keep badge, (2) find highest depth card where available >= depth number, (3) fallback to card with highest absolute count. Code is explicit and handles all edge cases. |
| FB-3: `rebuildStyleSubDots()` ordering | Recommendation | **Resolved** | DD section 4.3 now explicitly documents that `rebuildStyleSubDots()` must delegate to `getVisibleStyleSlides()` for sorted order. Includes a code snippet with `data-sortIndex` assignment. The dependency chain (`applyDepth()` -> `rebuildStyleSubDots()` -> `getVisibleStyleSlides()`) is clearly stated. |
| FB-4: `QUESTION_META` parallel structure | Recommendation | **Deferred (acceptable)** | DD section 3.1 documents the post-stabilization refactoring plan with the exact derivation code. Deferral rationale (backward compatibility during rollout) is sound. This is the right approach for a phase 1 release. |
| FB-5: `TRIP_TYPE_SCORING` fragile coupling | Recommendation | **Resolved** | New DD section 6.2 adds `validateTripTypeScoring()` with dev-only `DEBUG_TRIP_TYPE` flag. Validates all scoring keys against actual pool items at runtime. Added to implementation checklist (Phase 1). |

### 6.3 Observations -- Acknowledgment Status

| Item | Severity | Status | Notes |
|---|---|---|---|
| FB-6: Senior-without-children gap | Observation | Acknowledged | Matches BRD definition. No design change needed. |
| FB-7: Category B/D count mismatch | Observation | Acknowledged | Total 72 within BRD's 65-75 range. |
| FB-8: `computeFamilyBalance` thresholds | Observation | **Resolved** | Thresholds extracted as named constants (`FAMILY_KID_THRESHOLD`, `FAMILY_TEEN_THRESHOLD`) in DD section 2.3 with documentation marking them as initial estimates subject to tuning. Added to implementation checklist (Phase 1). |

### 6.4 New Issues Introduced by v2 Changes

None. The v2 revisions are surgical and well-scoped:
- Removing the Adults edge case from A6 is a data change with no structural impact (one fewer entry in the `appliesTo` array).
- The Recommended badge relocation logic is self-contained within `updateDepthCardsForTripType()` and does not affect other functions.
- The `rebuildStyleSubDots()` documentation clarifies an existing dependency without introducing new coupling.
- The `validateTripTypeScoring()` function is isolated behind a debug flag with no production side effects.
- The named constants for family balance thresholds improve readability without changing behavior.

The HLD and DD revisions are consistent with each other -- both documents align on the pure string-match `appliesTo` model, the `getVisibleStyleSlides()` ordering requirement, and the Recommended badge behavior.

### 6.5 Round 2 Verdict

**Approved.** All blocking items are resolved. All recommendations are either resolved or appropriately deferred with documented rationale. No new architectural concerns. The design is ready for implementation.
