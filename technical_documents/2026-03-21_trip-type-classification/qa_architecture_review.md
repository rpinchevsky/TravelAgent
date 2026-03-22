# QA Architecture Review

**Change:** Trip Type Classification & Type-Aware Question Bank
**Date:** 2026-03-21
**Reviewer:** QA Architect
**Documents Reviewed:** test_plan.md, business_requirements.md, automation_rules.md, IntakePage.ts, existing intake spec files
**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is comprehensive and well-structured. It covers all 10 BRD requirements across 38 test cases in 8 new spec files. The plan demonstrates strong adherence to language-independence rules, proper use of `data-*` attributes for assertions, and a clear coverage matrix. Three items require attention before implementation: a naming collision between a proposed locator property and a parameterized method, a potential duplication between two ordering-related test cases, and the need to document fixture import rationale for read-only structural tests. None of these are blocking.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 52 acceptance criteria across REQ-001 through REQ-010 are mapped. REQ-002 AC-4 (i18n), REQ-002 AC-6 (RTL), REQ-008 (pipeline rules), and REQ-009 AC-5 (depth i18n) are correctly scoped out with justification. |
| No duplicate tests | Pass (with note) | TC-136 (tier ordering in `intake-type-filtering.spec.ts`) and TC-143 (within-category tier ordering in `intake-question-ordering.spec.ts`) assert the same property. See QF-1. |
| Correct fixture usage | Pass | Standard `@playwright/test` import with `beforeEach` is specified for all specs — correct, since every test mutates page state (wizard navigation). |
| POM compliance | Pass (with note) | All proposed locators and methods align with existing IntakePage.ts patterns. Naming collision on `depthCardCount` — see QF-2. |
| Assertion best practices | Pass | `expect.soft()` used consistently for batched/data-driven assertions. Descriptive messages included. Regex-based markdown assertions are appropriate. |
| Performance impact | Pass | 38 new tests with ~45-60s estimated runtime is reasonable. TC-175 (6 full wizard traversals) correctly flagged as `@slow`. Data-driven patterns and `page.evaluate()` shortcuts reduce unnecessary navigation. |
| Reliability | Pass | No hard sleeps. Toast assertion uses Playwright auto-wait. DOB select timing risk is mitigated with `expect(select).not.toBeEmpty()`. Traveler setup encapsulated in a reusable helper. |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 AC-1 | Solo: 1 adult 25 → Solo | TC-100 | No |
| REQ-001 AC-2 | Couple: 2 adults 30, 28 → Couple | TC-101 | No |
| REQ-001 AC-3 | Young: 3 adults 18-30 → Young | TC-102 | No |
| REQ-001 AC-4 | Family: 2 adults + 1 child → Family | TC-103 | No |
| REQ-001 AC-5 | Multi-gen: seniors + adult + child → Multi-gen | TC-104 | No |
| REQ-001 AC-6 | Adults: 4 adults 40-55 → Adults | TC-105 | No |
| REQ-001 AC-7 | 2 adults 18-30 → Couple (not Young) | TC-106 | No |
| REQ-001 AC-8 | Re-detection on traveler change | TC-107 | No |
| REQ-001 AC-9 | Age at arrival date (not current date) | TC-108 | No |
| REQ-001 AC-10 | 1 senior 70 → Solo (overrides Adults) | TC-109 | No |
| REQ-002 AC-1 | Indicator after Step 1 | TC-110 | No |
| REQ-002 AC-2 | Context bar pill with icon + name | TC-111 | No |
| REQ-002 AC-3 | Pill updates on traveler change | TC-112 | No |
| REQ-002 AC-4 | i18n for 12 languages | Out of scope (existing i18n specs) | No — justified |
| REQ-002 AC-5 | Pill click → Step 1 | TC-113 | No |
| REQ-002 AC-6 | RTL layout | Out of scope (existing RTL specs) | No — justified |
| REQ-003 AC-1 | 65-75 questions total | TC-120 | No |
| REQ-003 AC-2 | All 30 existing preserved | TC-121 | No |
| REQ-003 AC-3 | Category, tier, options per question | TC-122 | No |
| REQ-003 AC-4 | >= 15 questions per trip type | TC-123 | No |
| REQ-003 AC-5 | Category H >= 7, all new | TC-124 | No |
| REQ-003 AC-6 | 3-4 option format | TC-125 | No |
| REQ-003 AC-7 | QUESTION_DEFAULTS for all | TC-126 | No |
| REQ-004 AC-1 | Solo filtering at depth 20 | TC-130 | No |
| REQ-004 AC-2 | Family filtering at depth 20 | TC-131 | No |
| REQ-004 AC-3 | Non-applicable never shown | TC-132 | No |
| REQ-004 AC-4 | Hidden questions use defaults in markdown | TC-133 | No |
| REQ-004 AC-5 | Depth overlay shows available count | TC-134 | No |
| REQ-004 AC-6 | Pool < depth → show all, no error | TC-135 | No |
| REQ-004 AC-7 | Tier ordering preserved | TC-136 | No |
| REQ-004 AC-8 | Sub-step dots reflect filtered count | TC-137 | No |
| REQ-004 AC-9 | Trip type change resets Step 2 | TC-138 | No |
| REQ-005 AC-1 | Toddler → more kid-safety questions | TC-150, TC-152 | No |
| REQ-005 AC-2 | Toddler + teen → balanced | TC-151 | No |
| REQ-005 AC-3 | Balance within Family pool only | TC-153 | No |
| REQ-005 AC-4 | Markdown includes Family Balance | TC-154 | No |
| REQ-006 AC-1 | Scoring bonus/penalty by type | TC-160, TC-161, TC-162 | No |
| REQ-006 AC-2 | Couple >= 2 romantic cards | TC-160 | No |
| REQ-006 AC-3 | Multi-gen accessibility avoid | TC-161 | No |
| REQ-006 AC-4 | Solo safety/comfort card | TC-162 | No |
| REQ-006 AC-5 | Pre-selection 8-15 range | TC-163 | No |
| REQ-006 AC-6 | analyzeGroup() still works alongside | TC-164 | No |
| REQ-007 AC-1 | Trip Type in markdown | TC-170 | No |
| REQ-007 AC-2 | Field in ## Trip Context section | TC-170 | No |
| REQ-007 AC-3 | Family Balance sub-field | TC-171 | No |
| REQ-007 AC-4 | Non-family omits Family Balance | TC-172 | No |
| REQ-007 AC-5 | Value always English | TC-173 | No |
| REQ-007 AC-6 | Preview shows trip type | TC-174 | No |
| REQ-008 AC-1..5 | Planning pipeline reads trip type | Out of scope | No — rule file content, not UI-testable |
| REQ-009 AC-1 | Depth overlay shows type name | TC-139 | No |
| REQ-009 AC-2 | Depth cards show actual count | TC-134 | No |
| REQ-009 AC-3 | Pool < 30 → "(max)" badge | TC-135 | No |
| REQ-009 AC-4 | Recommended badge adjusts | TC-141 | No |
| REQ-009 AC-5 | Depth text translated | Out of scope (existing i18n specs) | No — justified |
| REQ-009 AC-6 | Keyboard navigation on depth cards | TC-142 | No |
| REQ-010 AC-1 | Same-category grouped | TC-140 | No |
| REQ-010 AC-2 | Categories A-H order | TC-140 | No |
| REQ-010 AC-3 | Lower tier first in category | TC-143 | No |
| REQ-010 AC-4 | Consistent ordering across types | TC-144 | No |

**Coverage: 100% of in-scope acceptance criteria are mapped to test cases. No gaps detected.**

## 4. Feedback Items

### QF-1: Potential Duplication Between TC-136 and TC-143

**Severity:** Recommendation
**Section:** Spec files `intake-type-filtering.spec.ts` (TC-136) and `intake-question-ordering.spec.ts` (TC-143)
**Issue:** TC-136 asserts "within each category group, questions are ordered by tier (T1 before T2)" in the type-filtering spec. TC-143 asserts "within each category group, tier values are non-decreasing" in the ordering spec. These are semantically identical assertions — the test plan itself notes "Combine with TC-136 or keep separate for clear traceability."
**Suggestion:** Merge TC-136 into TC-143 within `intake-question-ordering.spec.ts`, since tier ordering within a category is fundamentally an ordering concern, not a filtering concern. The filtering spec should only verify that non-applicable questions are excluded. This reduces the total from 38 to 37 tests and removes a dual-maintenance burden. Alternatively, if traceability to REQ-004 AC-7 is the concern, add a comment in TC-143 noting it also covers REQ-004 AC-7, and remove TC-136 entirely.

---

### QF-2: Naming Collision — `depthCardCount` Locator vs. Method

**Severity:** Recommendation
**Section:** Section 6 — New IntakePage.ts Locators & Methods
**Issue:** The plan proposes both a readonly property `depthCardCount: Locator` (generic `.depth-card__count` locator) and a parameterized method `depthCardCount(depth: number): Locator`. TypeScript does not allow a property and a method with the same name on a class. The existing POM has a clear pattern: generic locators are readonly properties (e.g., `depthCards`), while parameterized locators are methods (e.g., `depthCard(depth)`).
**Suggestion:** Remove the generic readonly property `depthCardCount`. Keep only the parameterized method `depthCardCount(depth: number)`. If a generic "all count elements" locator is needed for any test, use `this.page.locator('.depth-card__count')` inline in the test or add it with a different name like `allDepthCardCounts`.

---

### QF-3: Structural Tests Could Use Shared-Page Fixture

**Severity:** Observation
**Section:** Section 2 — Test Environment
**Issue:** The test plan specifies `@playwright/test` (standard mutation fixture) for all specs. However, several tests in `intake-question-bank.spec.ts` are read-only structural checks (TC-120: count all question elements, TC-121: verify 30 existing keys exist, TC-122: verify attributes, TC-125: verify option counts, TC-126: verify defaults). These only read DOM state after page load — they do not click, type, or navigate.
**Suggestion:** Consider using the shared-page fixture (`tests/fixtures/shared-page.ts`) for `intake-question-bank.spec.ts` to eliminate redundant `page.goto()` calls. The automation rules (Section 6.2) recommend shared-page for read-only tests. This would reduce the runtime of the 7 tests in that file from ~7 page loads to ~1. Note: TC-123 (per-type question count) does require navigation and should either remain with standard fixture or be moved to a separate describe block. This is an optimization suggestion, not a correctness issue.

---

### QF-4: TC-153 Assertion Precision — "First Half" Ordering Is Fragile

**Severity:** Recommendation
**Section:** TC-153 (Family balance within filtered pool)
**Issue:** The test asserts that "kid-safety tagged questions appear in the first half of their respective categories" for kid-focused balance. This positional assertion is fragile: adding one new question to a category could shift positions and fail the test, even though the ordering logic is correct. The test plan acknowledges this ("soft assertion on ordering patterns, not a strict positional check") but the expected result still references "first half."
**Suggestion:** Redefine the assertion: instead of checking that kid-safety questions are in the "first half," verify that within the Family-filtered pool for kid-focused balance, kid-safety-tagged questions appear at a lower index (earlier) than non-kid-safety-tagged questions in the same category. This is a relative ordering check, not an absolute positional check, and is resilient to question bank size changes.

---

### QF-5: TC-133 — Clarify Expected Behavior for Hidden Question Defaults

**Severity:** Recommendation
**Section:** TC-133 (Hidden questions use default values in markdown)
**Issue:** The expected result states "Hidden questions' default values are present in the generated markdown (or the question is omitted entirely if that is the design decision)." This ambiguity means the AE cannot write a definitive assertion without checking the implementation first. The DD should specify which behavior is correct.
**Suggestion:** Coordinate with Dev to confirm the design decision (defaults included vs. questions omitted) before implementation. Update the test case expected result to be unambiguous. If defaults are included, assert their presence via regex. If omitted, assert their absence. Do not write a test that passes for both behaviors.

---

### QF-6: Existing `intake-depth-questions.spec.ts` Regression Impact

**Severity:** Observation
**Section:** Out of scope, but worth noting
**Issue:** The existing `intake-depth-questions.spec.ts` hardcodes the current 30-question structure with specific tier-to-key mappings (T1_KEYS through T5_KEYS) and exact expected counts per depth level (10, 15, 20, 25, 30). After the expanded question bank (REQ-003) is implemented, these existing tests will fail because the question set, counts, and tier assignments will change.
**Suggestion:** The existing spec must be updated or replaced as part of the implementation phase. This should be documented as a known regression impact in the implementation plan. The new `intake-question-bank.spec.ts` and `intake-type-filtering.spec.ts` effectively supersede the old depth-questions tests. Consider marking this in the dev implementation notes so the AE knows to update/retire the old spec.

## 5. Best Practice Recommendations

1. **Traveler setup helper centralization:** The proposed `setupTravelers()` and `completeStep1WithTripType()` POM methods are excellent. Ensure these are the only way tests set up travelers — no inline clicks in individual test bodies. This makes maintenance trivial when the traveler card UI changes.

2. **Data-driven test patterns:** TC-175 (all 6 types in markdown) and TC-163 (pre-selection range for all types) correctly use data-driven patterns. Consider extracting the traveler composition definitions into a shared constant (e.g., `TRIP_TYPE_COMPOSITIONS` in a test utils file) so all 8 spec files use identical traveler setups for each type.

3. **Dev requirements coordination:** Section 9 (qa_2_dev_requirements.txt) is thorough. The 9 data attribute requirements should be shared with Dev early — ideally before Dev starts Phase 5 implementation — to avoid retrofitting attributes after the HTML is built.

4. **`@slow` tag usage:** TC-175 is correctly tagged `@slow`. Also consider tagging TC-163 (6 trip types x 2 steps of pre-selection checking) if its runtime exceeds 30s in practice.

5. **Language independence compliance:** The test plan fully complies with automation rules Section 7. All assertions use `data-*` attributes, DOM structure, or regex on English identifiers (Trip Type values are always English per REQ-007 AC-5). No hardcoded natural language text in any test case. This is well done.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-21 | Approved with Changes |

**Conditions for approval:**
- [ ] Resolve QF-2 (naming collision): remove the generic `depthCardCount` readonly property, keep only the parameterized method
- [ ] Resolve QF-5 (TC-133 ambiguity): confirm with Dev whether hidden questions include defaults or are omitted, and update the expected result accordingly
- [ ] Address QF-1 (duplicate): either merge TC-136 into TC-143, or document the intentional separation with cross-references in both test cases
