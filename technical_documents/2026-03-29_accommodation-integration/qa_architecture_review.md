# QA Architecture Review

**Change:** Accommodation Integration
**Date:** 2026-03-29
**Reviewer:** QA Architect
**Documents Reviewed:** test_plan.md, business_requirements.md
**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is well-structured and demonstrates strong alignment with the BRD's 11 requirements. The consolidation from 17 logical test cases into 7 `test()` blocks is sound and follows automation rule 6.3/6.4. The manifest-driven anchor day discovery is the correct approach, the fixture usage is appropriate, and the language-independence discipline is maintained throughout. All assertions are structural (CSS selectors, URL patterns, emoji markers) with no natural-language text matching.

There are no blocking issues. Five recommendations and two observations are raised to improve robustness, eliminate a minor gap, prevent a potential duplicate, and tighten the POM proposal.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 11 REQs mapped. Pipeline-only ACs (REQ-001 AC-1/2/3/5, REQ-002 all, REQ-006 all, REQ-007 all) correctly scoped out. REQ-004 AC-2 (section heading emoji) is implicitly covered via `.accommodation-section` presence but could be explicit — see QF-3. |
| No duplicate tests | Pass | TC-205 (visual distinction) and TC-212 step 3 (no dual `.poi-card` + `.accommodation-card` class) overlap slightly. See QF-2 for consolidation recommendation. |
| Correct fixture usage | Pass | All DOM tests use shared-page fixture. TC-211 (manifest schema) correctly uses file-system only — consistent with existing manifest test pattern in `progression.spec.ts`. |
| POM compliance | Pass | Proposed locator naming follows existing `get{Entity}{SubElement}(param)` pattern. Four readonly properties and eight helper methods match the established convention. Minor refinement suggested — see QF-4. |
| Assertion best practices | Pass | `expect.soft()` with descriptive messages throughout. No hardcoded text. Emoji markers (`🏨`) used as structural identifiers — consistent with existing `🛒` grocery pattern. |
| Performance impact | Pass | 7 test blocks, estimated 2-3 seconds on shared page. Minimal overhead. One optimization opportunity noted in QF-5. |
| Reliability | Pass | Manifest-driven anchor day detection is deterministic. Graceful skip when `getAccommodationStays()` returns empty. No flaky patterns (no waits, no network, no mutations). |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 AC-1 | At least one stay block per trip | TC-211 (stays array non-empty) | No |
| REQ-001 AC-2 | Check-in, check-out, area defined | TC-211 (field validation) | No |
| REQ-001 AC-3 | Stay blocks cover every night, no gaps/overlaps | TC-211 (non-overlapping dates) | Partial — overlap check present, but gap check (full night coverage) not asserted. See QF-1. |
| REQ-001 AC-4 | Manifest includes accommodation object | TC-211 | No |
| REQ-001 AC-5 | Single-base trip = one stay block | TC-211 (structure validates any count) | No (tested indirectly) |
| REQ-002 AC-1–7 | Google Places discovery logic | Out of scope (pipeline) | No — correct exclusion |
| REQ-003 AC-1 | Each card has Booking.com link | TC-204 | No |
| REQ-003 AC-2 | URL format correct | TC-204 | No |
| REQ-003 AC-3 | Hotel name URL-encoded | TC-204 (`ss` non-empty) | No |
| REQ-003 AC-4 | Dates in YYYY-MM-DD | TC-204 (regex) | No |
| REQ-003 AC-5 | Adult/child counts | TC-204 | No |
| REQ-003 AC-6 | Child ages at check-in | TC-204 (`age` param count = `group_children`) | No |
| REQ-003 AC-7 | Link opens search results | Out of scope (network) | No — correct exclusion |
| REQ-004 AC-1 | Cards on anchor day | TC-200, TC-201 | No |
| REQ-004 AC-2 | Section heading localized | Not directly tested | Minor — see QF-3 |
| REQ-004 AC-3 | Intro line with stay period | TC-216 | No |
| REQ-004 AC-4 | Card structure complete | TC-203 | No |
| REQ-004 AC-5 | Property names in poi_languages | Out of scope (language content) | No — correct exclusion |
| REQ-004 AC-6 | Price level localized descriptor | Out of scope (language content) | No — correct exclusion |
| REQ-004 AC-7 | Booking link label distinct | TC-206 (CTA is separate element) | No |
| REQ-004 AC-8 | Missing fields omitted gracefully | TC-203 (price level count >= 0) | No |
| REQ-004 AC-9 | 2-3 cards per section | TC-202 | No |
| REQ-004 AC-10 | Ordered by price level | TC-208 | No |
| REQ-005 AC-1 | Anchor day budget has accommodation | TC-209 | No |
| REQ-005 AC-2 | Cost labeled as estimate | Out of scope (language content) | No — correct exclusion |
| REQ-005 AC-3 | Non-anchor days no budget duplication | TC-201 (no accommodation section on non-anchor) | No |
| REQ-005 AC-4 | Aggregate budget has accommodation | TC-210 | No |
| REQ-005 AC-5 | Price-level-to-range mapping | Out of scope (pipeline) | No — correct exclusion |
| REQ-005 AC-6 | Local currency + EUR | Out of scope (pipeline) | No — correct exclusion |
| REQ-006 AC-1–8 | Preference matching logic | Out of scope (pipeline) | No — correct exclusion |
| REQ-007 AC-1–3 | CEO Audit checklist | Out of scope (pipeline) | No — correct exclusion |
| REQ-008 AC-1 | Manifest accommodation.stays[] structure | TC-211 | No |
| REQ-008 AC-2 | anchor_day references day file | TC-211 | No |
| REQ-008 AC-3 | options_count reflects actual | TC-211 (integer >= 0) | No |
| REQ-008 AC-4 | discovery_source valid values | TC-211 | No |
| REQ-008 AC-5 | Multi-stay non-overlapping dates | TC-211 | No |
| REQ-009 AC-1 | `.accommodation-card` class used | TC-205 | No |
| REQ-009 AC-2 | Visually distinct from `.poi-card` | TC-205, TC-212 | No |
| REQ-009 AC-3 | Booking CTA as prominent button | TC-206 | No |
| REQ-009 AC-4 | Price level visual scale | TC-207 | No |
| REQ-009 AC-5 | Section heading as divider | TC-200 (`.accommodation-section` presence) | No |
| REQ-009 AC-6 | Responsive grid layout | TC-214 | No |
| REQ-009 AC-7 | Language-agnostic rendering | All TCs (CSS selectors only) | No |
| REQ-010 AC-1 | Section presence test | TC-200 | No |
| REQ-010 AC-2 | Card structure validation | TC-203 | No |
| REQ-010 AC-3 | Booking URL parameters | TC-204 | No |
| REQ-010 AC-4 | Budget table accommodation line | TC-209 | No |
| REQ-010 AC-5 | Aggregate budget accommodation | TC-210 | No |
| REQ-010 AC-6 | Card count 2-3 | TC-202 | No |
| REQ-010 AC-7 | All assertions language-agnostic | All TCs | No |
| REQ-011 AC-1–6 | Localized content generation | Indirectly via structural assertions | No — language content correctness is pipeline scope |

## 4. Feedback Items

### QF-1: Manifest Stay Night Coverage Assertion (REQ-001 AC-3)

**Severity:** Recommendation
**Section:** TC-211, step 5
**Issue:** The test plan validates that multi-stay date ranges do not overlap (REQ-001 AC-5 / REQ-008 AC-5), but does not validate the complementary constraint from REQ-001 AC-3: that stay blocks cover every night of the trip with no gaps. For a single-stay trip this is trivially satisfied, but the architecture supports multi-stay trips, and a gap between stays (e.g., stay_01 checks out on Aug 25, stay_02 checks in on Aug 27 — leaving Aug 25-26 uncovered) would violate the BRD.
**Suggestion:** Add an optional assertion to TC-211: when multiple stays exist, verify that `stays[i+1].checkin === stays[i].checkout` (contiguous) or that the union of all stay date ranges covers arrival-to-departure. This can be a soft assertion since multi-stay trips are MVP-deferred, but having the check in place ensures correctness when multi-stay is exercised.

---

### QF-2: Consolidate Duplicate Class-Exclusion Check Between TC-205 and TC-212

**Severity:** Recommendation
**Section:** TC-205 step 2, TC-212 step 3
**Issue:** Both TC-205 and TC-212 assert that no `.accommodation-card` element also has the `.poi-card` class. TC-205 checks it as its primary purpose ("visual distinction"), and TC-212 step 3 repeats the same assertion as a secondary check alongside POI count parity. This is a minor duplication.
**Suggestion:** Remove the class-exclusion check from TC-212 (step 3) since TC-205 already covers it definitively. TC-212 should focus solely on the POI count parity assertion (step 4), which is its unique value. This keeps each test's responsibility clean and avoids double-reporting the same failure.

---

### QF-3: Accommodation Section Heading Emoji Marker Assertion (REQ-004 AC-2)

**Severity:** Recommendation
**Section:** TC-200 or TC-213
**Issue:** REQ-004 AC-2 specifies the section heading as `## 🏨 {localized_label}`. While the localized label cannot be asserted (language independence), the `🏨` emoji in the rendered section heading is a structural marker. TC-200 checks for `.accommodation-section` presence and TC-213 checks `.accommodation-card__tag` for the emoji, but neither explicitly verifies that the section-level heading element itself contains the `🏨` marker. This is a minor gap — if the section wrapper exists but the heading rendering strips the emoji, it would go undetected.
**Suggestion:** In TC-200 or TC-213, add a soft assertion that the `.accommodation-section` contains a heading-level element (e.g., `.accommodation-section h2, .accommodation-section .section-title`) with `🏨` in its text content. This mirrors the existing pattern in TC-213 for the card tag.

---

### QF-4: POM Property Naming — Use Plural Form Consistently for Global Locators

**Severity:** Observation
**Section:** Section 3.1, TripPage.ts locator proposals
**Issue:** The proposed `bookingCtaButtons` property name uses a plural noun ("Buttons"), but the existing POM pattern for global locators uses the element's semantic role without an explicit suffix — e.g., `poiCards` (not `poiCardElements`), `poiCardRatings` (not `poiCardRatingElements`), `activityLabels` (not `activityLabelElements`). The name `bookingCtaButtons` is slightly inconsistent because it appends a DOM-concept suffix ("Buttons") rather than using the CSS class concept ("CTAs" or just `bookingCtas`).
**Suggestion:** Consider renaming to `bookingCtas` for consistency with the existing pattern where the property name mirrors the CSS class concept. This is a minor naming preference, not a functional concern.

---

### QF-5: Test Block 1 Consolidation — Consider Merging Non-Anchor Validation

**Severity:** Observation
**Section:** Section 5, Test Block 1
**Issue:** Test Block 1 is estimated at "~2 tests" (one per anchor day + one for non-anchor validation). Given that the current trip is single-base (one stay block, one anchor day), this means 2 tests. However, the non-anchor day loop (TC-201) iterates over `dayCount - 1` days with `expect.soft()`, which is fine. The separation into two tests within one block is justified for clarity. No change needed — this is an observation confirming the approach is correct.
**Suggestion:** No action required. The two-test split within Block 1 is appropriate. If future trips have multiple anchor days, the test count scales linearly (one test per anchor + one for all non-anchors), which remains efficient.

---

### QF-6: Manifest options_count Cross-Validation Against DOM Card Count

**Severity:** Recommendation
**Section:** TC-202
**Issue:** TC-202 mentions comparing card count against `manifest.options_count` if available, but the primary assertion is the range check (2-3). The cross-validation between manifest `options_count` and actual DOM card count is valuable for detecting manifest-DOM drift (e.g., manifest says 3 but only 2 cards rendered). The test plan describes it as an "or" condition — it should be an "and" condition when `options_count > 0`.
**Suggestion:** Make the cross-validation explicit: when `manifest.options_count > 0`, assert that the DOM card count equals `manifest.options_count` AND falls within the 2-3 range. This catches both under-rendering (DOM < manifest) and manifest staleness (manifest != DOM).

---

### QF-7: Manifest Reader Utility — Inline vs. Separate File Decision

**Severity:** Recommendation
**Section:** Section 3.2, Section 9 (estimated impact)
**Issue:** The test plan proposes a `ManifestStay` interface and `getAccommodationStays()` function, noting the implementation location is "TBD during implementation" — either inline in `progression.spec.ts` or in a new `manifest-reader.ts`. The existing codebase has no `manifest-reader.ts` (confirmed by file search). The `trip-folder.ts` already provides `getManifestPath()`, and the existing manifest tests in `progression.spec.ts` read the manifest inline with `fs.readFileSync`.
**Suggestion:** Follow the established pattern: implement `getAccommodationStays()` inline within the `progression.spec.ts` test describe block (or as a module-level helper function in the same file), not in a separate utility file. This avoids adding a new file for a single function and is consistent with how `progression.spec.ts` already reads the manifest directly. If future features also need manifest reading, extract to a shared utility at that point. Resolve the TBD now to prevent implementation ambiguity.

## 5. Best Practice Recommendations

1. **Graceful skip pattern:** The plan correctly uses `test.skip()` when `getAccommodationStays()` returns empty. Ensure the skip message is descriptive (e.g., `"No accommodation.stays in manifest — trip may predate accommodation feature"`) so developers running against older trip outputs understand why tests are skipped rather than thinking they passed.

2. **`expect.soft()` message format:** The plan consistently uses `'Day ${d}, Card ${c}: should have {element}'` format, which matches the existing codebase pattern (e.g., `'Day ${day}: pricing-grid count'` in the current progression spec). Maintain this convention during implementation.

3. **URL parsing in TC-204:** The plan specifies using JavaScript's `URL` class rather than regex. This is the right call. Ensure the implementation handles the edge case where `href` is a relative URL (it should not be, but defensive parsing prevents cryptic failures).

4. **`markdown-pois.ts` update (section 3.3):** The emoji-based exclusion for `### 🏨` is the correct structural approach. Ensure the exclusion check happens before the `excludedSections` string match, so both emoji-prefixed sections and language-specific excluded sections are handled in a clear precedence order.

5. **Test numbering:** TC-200 through TC-216 continues from the existing test case numbering (the current spec has TC-004 through TC-007 implicitly, plus TC-152/153/154). The jump to TC-200 provides clean namespace separation for the accommodation feature. This is a good practice — maintain it for future features.

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-29 | Approved with Changes |

**Condition for final approval:** Address QF-1 (contiguous stay coverage assertion), QF-2 (duplicate elimination), and QF-6 (cross-validation) during implementation. QF-3, QF-4, QF-5, and QF-7 are recommendations/observations that may be addressed at the implementer's discretion.
