# QA Architecture Review

**Change:** Google Places MCP Integration — POI Enrichment, Phone/Rating Fields, Wheelchair Accessibility Question
**Date:** 2026-03-23
**Reviewer:** QA Architect
**Documents Reviewed:** test_plan.md, business_requirements.md, detailed_design.md, automation_rules.md, TripPage.ts, IntakePage.ts, existing spec files
**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is well-structured and demonstrates strong alignment with the BRD. It covers all automatable acceptance criteria across REQ-003, REQ-005, REQ-006, REQ-009, and REQ-010 with 13 test cases distributed across 2 spec files. The "when available" pattern for phone/rating fields is correctly handled — tests validate structure when elements exist but do not assert minimum counts. Fixture usage is correct (shared-page for trip HTML read-only tests, standard import for intake mutation tests). Language independence is maintained throughout.

Three feedback items are raised: one blocking concern about a potential language-dependence violation in TC-150/TC-151, one recommendation about TC-147 test efficiency, and one observation about missing POM locator documentation for the `wheelchairQuestion` selector class.

---

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All automatable ACs from REQ-003, REQ-005, REQ-006, REQ-009, REQ-010 are covered. Non-automatable items (REQ-001, REQ-002, REQ-004, REQ-007, REQ-008) are correctly scoped out with valid justification. |
| No duplicate tests | Pass | Each TC asserts distinct structural properties. TC-142 (tel: href validity) and TC-143 (link order) cover different aspects of phone links. TC-154 modifies an existing test rather than duplicating it. TC-150 and TC-151 cover different selection states (yes vs default no). |
| Correct fixture usage | Pass | Trip HTML tests (TC-142–TC-146, TC-154) use `shared-page` fixture — correct for read-only DOM assertions. Intake tests (TC-147–TC-153) use standard `@playwright/test` — correct since they perform clicks and navigation. TC-152 (i18n file analysis) is a static file test correctly placed in the intake spec file for organizational consistency. |
| POM compliance | Pass | All new locators are defined in TripPage.ts and IntakePage.ts. No inline locator strings in spec files. New methods follow existing naming conventions (`getPoiCard*` pattern in TripPage). |
| Assertion best practices | Pass | `expect.soft()` used consistently for per-element batched assertions with descriptive messages. Hard assertions used appropriately for critical preconditions (TC-147 depth visibility, TC-148 default selection). |
| Performance impact | Pass | Estimated +4-6 seconds is reasonable. Trip HTML tests add negligible overhead due to shared-page fixture. TC-147's 3-depth iteration is the main cost but justified by the BRD requirement to verify depth-independence. |
| Reliability | Pass | No hard sleeps. Web-first assertions used for state waits (`toHaveClass(/is-selected/)`). `page.evaluate()` used for batched DOM queries to avoid round-trip overhead. Navigation helpers (`setupWithDepth`, `navigateToStep`) are proven patterns from existing intake tests. |

---

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: MCP config file exists | Out of scope (infrastructure) | No — correct exclusion |
| REQ-001 | AC-2: MCP exposes search/details tools | Out of scope (infrastructure) | No — correct exclusion |
| REQ-001 | AC-3: MCP responds to tool calls | Out of scope (infrastructure) | No — correct exclusion |
| REQ-002 | AC-1: content_format_rules lists phone | Out of scope (rule file) | No — not automatable |
| REQ-002 | AC-2: Markdown includes phone line | Out of scope (markdown) | No — validated indirectly via HTML tests |
| REQ-002 | AC-3: trip_planning_rules lists phone | Out of scope (rule file) | No — not automatable |
| REQ-003 | AC-1: rendering-config specifies phone format | Out of scope (rule file) | No — not automatable |
| REQ-003 | AC-2: Phone link after Photo in link row | TC-143 | No |
| REQ-003 | AC-3: Phone link uses poi-card link styling | TC-142 (validates `.poi-card__link` selector) | No |
| REQ-003 | AC-4: No phone = no phone link | TC-142 (zero count acceptable), TC-154 (3 or 4 links) | No |
| REQ-004 | AC-1: content_format_rules lists rating | Out of scope (rule file) | No — not automatable |
| REQ-004 | AC-2: Markdown includes rating line | Out of scope (markdown) | No — validated indirectly via HTML tests |
| REQ-004 | AC-3: trip_planning_rules lists rating | Out of scope (rule file) | No — not automatable |
| REQ-005 | AC-1: rendering-config specifies rating display | Out of scope (rule file) | No — not automatable |
| REQ-005 | AC-2: Rating near POI name, not link row | TC-145 | No |
| REQ-005 | AC-3: Star icon with numeric value | TC-144 (numeric content check via `/\d/`) | No |
| REQ-005 | AC-4: No rating = no element | TC-144 (zero count acceptable) | No |
| REQ-005 | AC-5: Review count in parentheses | TC-144 | **Minor gap** — see QF-3 |
| REQ-006 | AC-1: wheelchairAccessible exists, always visible | TC-147 | No |
| REQ-006 | AC-2: Question on Step 6 | TC-147 | No |
| REQ-006 | AC-3: Two options (No Req / Wheelchair) | TC-147 (card count), TC-148 (default), TC-149 (toggle) | No |
| REQ-006 | AC-4: Value in markdown output | TC-150 (yes), TC-151 (no) | No |
| REQ-006 | AC-5: i18n keys in 12 locale files | TC-152 (file keys), TC-153 (DOM attributes) | No |
| REQ-006 | AC-6: LTR and RTL | Existing RTL test suite | No — reasonable delegation |
| REQ-006 | AC-7: trip_intake_rules.md updated | Out of scope (rule file) | No — not automatable |
| REQ-007 | AC-1: Pipeline wheelchair filter rule | Out of scope (pipeline) | No — correct exclusion |
| REQ-007 | AC-2: Accessible POIs get indicator | TC-146 (structural badge check) | No |
| REQ-007 | AC-3: Non-accessible POIs replaced/flagged | Out of scope (pipeline) | No — correct exclusion |
| REQ-007 | AC-4: CEO Audit includes wheelchair check | Out of scope (rule file) | No — not automatable |
| REQ-008 | AC-1: Two-layer data flow documented | Out of scope (rule file) | No — not automatable |
| REQ-008 | AC-2: Phone/rating sourced from GP | Out of scope (pipeline) | No — correct exclusion |
| REQ-008 | AC-3: GP doesn't replace web fetch for narrative | Out of scope (pipeline) | No — correct exclusion |
| REQ-009 | AC-1: Structural test for tel: links | TC-142 | No |
| REQ-009 | AC-2: Structural test for .poi-card__rating | TC-144 | No |
| REQ-009 | AC-3: Validate when present, not always | TC-142, TC-144 (zero count acceptable) | No |
| REQ-009 | AC-4: Language-independent, shared-page, expect.soft | TC-142–TC-146 | No |
| REQ-010 | AC-1: Wheelchair visible on Step 6 all depths | TC-147 | No |
| REQ-010 | AC-2: Selection produces markdown field | TC-150, TC-151 | No |
| REQ-010 | AC-3: Language-independent DOM assertions | TC-147–TC-153 | No |

---

## 4. Feedback Items

### QF-1: TC-150/TC-151 markdown assertion may violate language-independence principle
**Severity:** Blocking
**Section:** TC-150 steps 6–7, TC-151 step 4
**Issue:** The test plan asserts that markdown output contains the string `Wheelchair accessible` — an English text literal. The test plan acknowledges this as "the one exception" and justifies it by pointing to existing patterns where `generateMarkdown()` uses English labels regardless of UI language. However, this must be verified carefully: if the markdown output key is truly always English (hard-coded in `generateMarkdown()`, not pulled from locale catalogs), then the assertion is valid. If the key is localized, the test will fail on non-English UI selections.
**Suggestion:** The implementation phase must confirm that `generateMarkdown()` uses a hard-coded English label for the `wheelchairAccessible` field (matching the pattern for `Accessibility needs` and other existing fields). If confirmed, add an inline comment in the spec file documenting this as an intentional exception with a reference to the DD section. If the markdown key is localized, the test must instead assert by structural pattern (e.g., regex for the `data-value` attribute value `yes`/`no` appearing on its own line) rather than matching English text.

**Resolution path:** Verify during implementation (Phase 5). If the `generateMarkdown()` function follows the existing English-label pattern, this QF is resolved. No test plan change needed — just an implementation confirmation.

---

### QF-2: TC-147 runs 3 full page loads for depth iteration — consider optimization
**Severity:** Recommendation
**Section:** TC-147 steps 1–6
**Issue:** TC-147 iterates over depths `[10, 20, 30]`, each requiring a full `setupWithDepth()` call (page load + Step 0 + Step 1 + depth select + navigate to Step 6). This is 3 page loads for the same assertion: "wheelchair question is visible on Step 6." While the runtime estimate of 3-4 seconds for all intake tests is acceptable, this is the most expensive pattern in the plan.
**Suggestion:** Consider whether depth 10 and depth 30 are sufficient (skip depth 20, which is the "Standard" middle ground unlikely to differ). Alternatively, after the first `setupWithDepth(10)` iteration, use `page.reload()` + depth change instead of full setup, since Steps 0–1 don't change between iterations. This is a recommendation, not a blocker — the current approach is correct and reliable.

---

### QF-3: TC-144 coverage of REQ-005 AC-5 (review count) is weak
**Severity:** Observation
**Section:** TC-144 expected result and coverage matrix row for REQ-005 AC-5
**Issue:** The coverage matrix maps REQ-005 AC-5 ("Review count, if available, is displayed in parentheses after the rating") to TC-144. However, TC-144 only validates that `.poi-card__rating` elements contain "at least one digit" via `/\d/`. This does not specifically validate that a review count is present in parentheses. The BRD says "if available" for review count, so a structural assertion for parenthesized content is not strictly required — but the coverage mapping overstates what TC-144 actually checks.
**Suggestion:** Either (a) update the coverage matrix to note that AC-5 is "partially covered" (numeric presence only, not parenthetical review count structure), or (b) add a soft assertion in TC-144 that when `.poi-card__rating` text contains parentheses, the content inside is numeric (e.g., `/\(\d[\d,]*\)/`). Option (a) is sufficient since review count is "if available."

---

## 5. Best Practice Recommendations

1. **New POM locator naming:** The proposed `IntakePage.wheelchairQuestion` uses the selector `.depth-extra-question[data-question-key="wheelchairAccessible"]`. This is well-designed — it scopes to the specific CSS class AND the data attribute, avoiding false matches. Consistent with the existing `questionByKey()` pattern but more specific. Consider whether `questionByKey('wheelchairAccessible')` (existing method) could serve the same purpose without a new dedicated property, reducing POM surface area. The `questionByKey` method uses `[data-question-key="..."]` without the `.depth-extra-question` class qualifier — if the wheelchair question uses `.depth-extra-question` class (which it should, as a Step 6 extra), the dedicated locator adds the class qualifier as an extra structural guarantee. Keep the dedicated property.

2. **TC-154 modification atomicity:** The test plan correctly identifies that TC-154 must be implemented atomically with the phone link feature (existing 3-link test will fail when 4th link appears). Ensure the implementation phase treats `poi-cards.spec.ts` modification and HTML rendering changes as a single commit to avoid transient test failures.

3. **TC-152 static file analysis pattern:** The i18n key validation test (TC-152) reads locale files directly from disk without a browser. This is a proven pattern from TC-138 in `intake-mix-options.spec.ts`. Keep this approach — it is faster and more deterministic than loading each locale through the UI.

4. **Spec file organization:** The plan creates one new file (`intake-wheelchair.spec.ts`) and appends to one existing file (`poi-cards.spec.ts`). This follows the consolidation principle from automation_rules.md section 6.4. The existing `poi-cards.spec.ts` will grow from 7 tests to 12 (plus 1 modified), which is within reasonable bounds for a single describe block.

5. **Existing RTL coverage for REQ-006 AC-6:** The plan delegates LTR/RTL validation to the existing RTL test suite. This is acceptable if the existing suite covers Step 6 question rendering. Verify during implementation that `intake-rtl.spec.ts` navigates to Step 6 and validates question card layout direction — if it does not, a minimal RTL assertion should be added to `intake-wheelchair.spec.ts`.

---

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-23 | Approved with Changes |

**Conditions for full approval:**
- QF-1: Implementation phase confirms `generateMarkdown()` uses English-only labels for the wheelchair field. If localized, test approach must be revised.
- QF-3: Coverage matrix updated to reflect partial coverage of REQ-005 AC-5 (recommended, not blocking).
