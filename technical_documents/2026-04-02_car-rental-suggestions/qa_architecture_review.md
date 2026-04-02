# QA Architecture Review

**Change:** Car Rental Suggestion Mechanism — Rental Company Discovery, Price Comparison & Booking Links
**Date:** 2026-04-02
**Reviewer:** QA Architect
**Documents Reviewed:** `business_requirements.md` (BRD), `test_plan.md`, `automation_rules.md`, `TripPage.ts` (POM)
**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is well-structured and demonstrates strong alignment with established patterns (accommodation spec as the reference implementation). Coverage of HTML structural assertions, manifest schema validation, POI parity exclusion, and budget integration is thorough. The plan correctly identifies requirements that cannot be tested via HTML output (pipeline logic, web research execution, language-specific labels) and excludes them with documented rationale.

Three feedback items require attention before implementation. One is a blocking concern regarding a potential duplicate assertion between TC-306 and TC-311; the other two are recommendations that improve maintainability and correctness without blocking approval.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 13 requirements analyzed. Testable ACs covered; untestable ACs excluded with documented rationale |
| No duplicate tests | Fail (minor) | TC-306 and TC-311 have overlapping class-exclusion assertions (see QF-1) |
| Correct fixture usage | Pass | Shared-page for DOM tests, `async () =>` for manifest/markdown filesystem tests (TC-307, TC-308) |
| POM compliance | Pass | 14 new locators/helpers defined in Section 8; no inline selectors in test steps |
| Assertion best practices | Pass | `expect.soft()` with descriptive per-day/per-category messages throughout |
| Performance impact | Pass | ~2-3 seconds estimated increase; 2 tests skip browser; shared-page amortizes page load |
| Reliability | Pass | No flaky patterns detected. TC-310 proactively identifies emoji collision risk with `test.fixme()` fallback |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 (Block Identification) | AC-1: pipeline identifies car rental blocks | Not tested (pipeline logic) | By design — validated via manifest output |
| REQ-001 | AC-2: pickup/return dates and location | Not tested (pipeline logic) | By design — manifest fields validated in TC-307 |
| REQ-001 | AC-3: consecutive grouping logic | Not tested (pipeline logic) | By design — manifest blocks validate grouping output |
| REQ-001 | AC-4: manifest car_rental object | TC-307 | None |
| REQ-001 | AC-5: empty blocks when no car days | TC-307 | None |
| REQ-001 | AC-6: anchor day is first car day | TC-300, TC-307 | None |
| REQ-002 (Preference Consumption) | AC-1 through AC-8 | Not tested | By design — pipeline input parsing, no HTML structural assertion possible |
| REQ-003 (Company Discovery) | AC-1 through AC-8 | Not tested (discovery_source validated in TC-307) | By design — web research execution untestable via HTML |
| REQ-004 (Price Comparison Table) | AC-1: each category gets table | TC-301 | None |
| REQ-004 | AC-2: table has 4 columns | TC-301 | None |
| REQ-004 | AC-3: 2-3 rows per table | TC-302 | None |
| REQ-004 | AC-4: rows sorted by daily rate ascending | Not tested | By design — price parsing is locale-dependent |
| REQ-004 | AC-5: sequential category tables | TC-301 (multiple categories rendered) | None |
| REQ-004 | AC-6: estimate label present | TC-301 (estimate element) | None |
| REQ-004 | AC-7: unavailable category noted | TC-301 (estimate disclaimer present) | Weak coverage — see QF-3 |
| REQ-005 (Card Format) | AC-1: section on anchor day | TC-300 | None |
| REQ-005 | AC-2: `## 🚗` heading | TC-301 | None |
| REQ-005 | AC-3: intro paragraph | TC-301 | None |
| REQ-005 | AC-4: `### 🚗` category sub-headings | TC-301 | None |
| REQ-005 | AC-5: best-value recommendation | TC-301 | None |
| REQ-005 | AC-6: booking link in each row | TC-302, TC-303 | None |
| REQ-005 | AC-7: section placement order | Not tested | By design — DOM sibling order assertion is fragile |
| REQ-005 | AC-8: NOT POI headings | TC-306, TC-308 | None |
| REQ-005 | AC-9: reporting language labels | Not tested | By design — language-agnostic rule |
| REQ-005 | AC-10: pro-tip section | TC-301 | None |
| REQ-006 (Booking Links) | AC-1: clickable booking link | TC-303 | None |
| REQ-006 | AC-2/AC-3: deep link construction | Not tested | By design — URL structures vary by company |
| REQ-006 | AC-4: opens in new tab | TC-303 | None |
| REQ-006 | AC-5: localized link label | TC-303 (non-empty text check) | None |
| REQ-006 | AC-6: homepage fallback | Not tested | By design — URL structure varies |
| REQ-007 (Budget Integration) | AC-1: anchor day budget car rental line | TC-304 | None |
| REQ-007 | AC-2: cost labeled as estimate | Not tested | By design — text matching is language-dependent |
| REQ-007 | AC-3: non-anchor days no duplicate | TC-310 | None |
| REQ-007 | AC-4: fuel on each car day | Not tested | By design — fuel marker not structurally distinct from other budget lines |
| REQ-007 | AC-5: aggregate budget car rental category | TC-305 | None |
| REQ-007 | AC-6: multi-category budget range | Not tested | By design — price parsing is locale-dependent |
| REQ-007 | AC-7: local currency + EUR | Not tested | By design — currency text is language-dependent |
| REQ-007 | AC-8: equipment costs line item | Not tested | By design — discoverable only when data available |
| REQ-008 (Manifest Schema) | AC-1: car_rental object structure | TC-307 | None |
| REQ-008 | AC-2: anchor_day reference | TC-307 | None |
| REQ-008 | AC-3: categories_compared list | TC-307 | None |
| REQ-008 | AC-4: companies_per_category count | TC-307 | None |
| REQ-008 | AC-5: discovery_source enum | TC-307 | None |
| REQ-008 | AC-6: multiple blocks for non-adjacent groups | TC-307 | None |
| REQ-009 (CEO Audit) | AC-1/AC-2/AC-3 | Not tested | By design — process checklist, not HTML output |
| REQ-010 (HTML Rendering) | AC-1: car-rental-section div | TC-300, TC-301 | None |
| REQ-010 | AC-2: visual distinction | TC-311 | None |
| REQ-010 | AC-3: styled HTML tables | TC-301 | None |
| REQ-010 | AC-4: booking links as CTA buttons | TC-302, TC-303 | None |
| REQ-010 | AC-5: `## 🚗` section divider | TC-301 | None |
| REQ-010 | AC-6: responsive tables | Not tested | By design — viewport-specific, follow-up if needed |
| REQ-010 | AC-7: language-agnostic rendering | All tests (no text matching) | None |
| REQ-010 | AC-8: `### 🚗` excluded from POI count | TC-306, TC-308 | None |
| REQ-011 (Automation Coverage) | AC-1: section on anchor day | TC-300 | None |
| REQ-011 | AC-2: category has comparison table | TC-301 | None |
| REQ-011 | AC-3: 2-3 rows with booking links | TC-302 | None |
| REQ-011 | AC-4: valid URL structures | TC-303 | None |
| REQ-011 | AC-5: anchor day budget car rental | TC-304 | None |
| REQ-011 | AC-6: aggregate budget car rental | TC-305 | None |
| REQ-011 | AC-7: non-anchor days no section | TC-300 | None |
| REQ-011 | AC-8: language-agnostic assertions | All tests | None |
| REQ-011 | AC-9: POI parity exclusion | TC-306, TC-308 | None |
| REQ-012 (Language-Agnostic Content) | AC-1 through AC-6 | Not tested | By design — meta-requirement enforced by all tests being language-agnostic |
| REQ-013 (Overview Simplified) | AC-1: no detailed car rental in overview | TC-309 | None |
| REQ-013 | AC-2: brief reference allowed | TC-309 (no assertion on text) | None |
| REQ-013 | AC-3: anchor day is source of truth | TC-300 | None |
| REQ-013 | AC-4: existing trips not modified | Not tested | By design — generation behavior, not HTML structure |

## 4. Feedback Items

### QF-1: Duplicate class-exclusion assertions between TC-306 and TC-311

**Severity:** Blocking
**Section:** TC-306 (POI Parity Exclusion) and TC-311 (Visual Distinction)
**Issue:** TC-306 step 1c asserts `.poi-card` elements do not have `.car-rental-category` class, and step 1d asserts `.car-rental-category` elements do not have `.poi-card` class. TC-311 step 2a asserts the exact same thing: `.car-rental-category` elements do not have `.poi-card` class. TC-311 step 1a also checks `.car-rental-section` does not have `.poi-card` class, which partially overlaps with TC-306's intent (mutual exclusion). Per Rule 8.7 (Delete Duplicates Aggressively), one of these must be the canonical home for class-exclusion assertions.

**Suggestion:** Consolidate all class namespace separation assertions into TC-306, which is the canonical home for POI parity exclusion. TC-311 should be scoped exclusively to the `.accommodation-section` and `.accommodation-card` class exclusion (which is not covered by TC-306) and the `.booking-cta` vs `.rental-cta` distinction. Alternatively, merge TC-311 entirely into TC-306 since it tests the same concept (class namespace separation) from different angles — per Rule 8.7, keep the more comprehensive one.

---

### QF-2: `🚗` emoji must be added to `excludedSections` in `trip-config.ts`

**Severity:** Recommendation
**Section:** TC-308 (Markdown POI Exclusion) and implementation notes
**Issue:** The test plan notes that "the `excludedSections` in `trip-config.ts` or the regex in `markdown-pois.ts` must exclude `🚗`-prefixed headings" but does not specify which approach to use. The existing `markdown-pois.ts` utility uses `tripConfig.excludedSections.some(s => line.includes(s))` to check if a `### ` heading should be excluded. The `excludedSections` array in `trip-config.ts` (line 232-244) already includes `'⚠️'` as an emoji-based exclusion. The accommodation section uses `'🏨'` which is covered by `labels.sectionCost` or other label-based exclusions.

**Suggestion:** Explicitly state in the test plan that `'🚗'` must be added to the `excludedSections` array in `trip-config.ts` (alongside the existing `'⚠️'` entry). This is the established pattern and avoids modifying the regex in `markdown-pois.ts`. The Dev implementation spec should include this as a required file change. TC-308 then validates the outcome of this exclusion.

---

### QF-3: TC-301 coverage of REQ-004 AC-7 (unavailable category) is weak

**Severity:** Observation
**Section:** TC-301, Coverage Matrix row for REQ-004 AC-7
**Issue:** The coverage matrix maps REQ-004 AC-7 ("When a company does not have a specific vehicle in the requested category, it is noted as 'category not available' rather than omitted") to TC-301's estimate disclaimer check. These are different concepts: the estimate disclaimer says prices are approximate, while AC-7 requires an explicit "not available" annotation for missing categories. The test plan correctly identifies this is difficult to assert language-agnostically. However, the coverage matrix should not imply coverage where it is weak.

**Suggestion:** Move REQ-004 AC-7 to the "NOT covered by automation" table with rationale: "Unavailability annotation is text content in the reporting language — cannot be structurally asserted without language-dependent text matching. Verified during manual CEO Audit review." This is more honest than claiming coverage via the estimate disclaimer check.

---

## 5. Best Practice Recommendations

1. **Follow accommodation spec structure closely.** The accommodation spec (`accommodation.spec.ts`) establishes the canonical pattern for section-presence, card-structure, link-validation, budget-integration, manifest-schema, and POI-exclusion test blocks. The car rental spec should mirror this structure to maintain consistency across the codebase. The test plan already does this well.

2. **TC-310 `test.fixme()` is appropriate.** The acknowledged risk that `🚗` appears in both anchor-day pricing (rental block cost) and non-anchor-day pricing (fuel cost) is handled correctly. If the renderer does not produce a structural differentiator (e.g., `.pricing-cell__badge--estimate`), marking the test as `test.fixme()` is the right call rather than writing a flaky assertion. When the renderer provides the structural distinction, remove the `fixme` and implement the proper check.

3. **TC-307 `"pending"` in discovery_source enum.** The test plan adds `"pending"` to the allowed `discovery_source` values (not in the BRD, which only lists `"web_search"`, `"aggregator_fallback"`, `"skipped"`). This is a reasonable defensive addition for partially-generated manifests, but confirm with the Dev design that `"pending"` is an expected transient state. If so, document it in the manifest schema.

4. **Manifest day-count calculation.** TC-307 step 4f asserts `days` equals `return_date - pickup_date + 1` (inclusive). Verify this aligns with the detailed design. Accommodation uses `nights = checkout - checkin` (exclusive end), which is different semantics. Car rental "days" being inclusive (pickup morning to return evening) makes sense for car rental, but the `+1` calculation should be validated against the detailed design definition.

5. **Shared-page import consistency.** The test plan correctly uses `test` from `../fixtures/shared-page` for DOM tests and `baseTest` from `@playwright/test` for filesystem-only tests (TC-307, TC-308). The imports section in Section 9 shows both imports. Ensure the filesystem tests use `baseTest` (not `test`) to avoid unnecessarily launching a browser.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-04-02 | Approved with Changes |

**Conditions for approval (if "Approved with Changes"):**
- [ ] QF-1: Resolve TC-306 / TC-311 duplicate assertions — merge or clearly delineate ownership of class-exclusion checks
- [ ] QF-3: Move REQ-004 AC-7 from the coverage matrix to the "NOT covered by automation" table with documented rationale
