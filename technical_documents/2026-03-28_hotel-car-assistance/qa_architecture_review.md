# QA Architecture Review

**Change:** Hotel Assistance & Car Rental Assistance -- Optional Intake Sections
**Date:** 2026-03-28
**Reviewer:** QA Architect
**Documents Reviewed:** `test_plan.md`, `business_requirements.md`, `automation_rules.md`, `IntakePage.ts`, `TripPage.ts`
**Verdict:** Approved with Changes

---

## 1. Review Summary

The test plan is thorough, well-structured, and demonstrates strong alignment with both the BRD and the automation engineering standards. It correctly targets the intake wizard (`trip_intake.html`) rather than generated trip output, uses the appropriate POM (`IntakePage.ts`), and follows the existing test naming/organization conventions established by the 22 existing intake spec files.

Coverage is comprehensive across all 11 BRD requirements with 29 test cases spread over 2 spec files. The plan makes good use of `expect.soft()` for batched assertions, data-driven depth loops, keyboard-based slider testing (avoiding flaky pointer drag), and properly defers RTL/dark-mode/responsive concerns to existing specs.

Three feedback items are identified -- one blocking concern about fixture usage for the i18n file validation test, one recommendation about test consolidation to reduce count, and one observation about a missing coverage area.

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 11 requirements and 79 acceptance criteria mapped. Out-of-scope items are justified and handled by existing specs. |
| No duplicate tests | Pass | TC-208 (hotelPets default) is noted as a traceability alias for assertions already in TC-205, not a separate test. No redundancy found. |
| Correct fixture usage | Fail | TC-223 (i18n file validation) reads JSON files from disk -- this is a static analysis test that does not need a browser. It should use `shared-page.ts` fixture or, better, no page fixture at all (Node.js `fs` only). See QF-1. |
| POM compliance | Pass | All new locators are planned for `IntakePage.ts` with parameterized helpers (`assistanceSectionByKey`, `sliderHandle`). Good use of `data-question-key`, `data-value`, and ID-based selectors. |
| Assertion best practices | Pass | Appropriate use of `expect.soft()` for multi-assertion tests, hard assertions for critical gate conditions, and web-first assertions for post-click state verification. |
| Performance impact | Pass | Estimated 15-20 seconds for 29 tests is reasonable. Keyboard-based slider tests avoid flaky mouse drag. Depth-loop tests (TC-201, TC-211) are limited to 3 representative depths rather than all 5. |
| Reliability | Pass | No `waitForTimeout()` or `sleep()` calls. All state changes verified via web-first assertions. Slider tests use keyboard, not pointer drag. Reset verification (TC-204, TC-214) uses DOM attribute checks. |

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 (Hotel Toggle) | AC-1: Section visible | TC-201 | None |
| REQ-001 | AC-2: Yes/No toggle pattern | TC-202 | None |
| REQ-001 | AC-3: Default "No" | TC-202 | None |
| REQ-001 | AC-4: "Yes" reveals sub-questions | TC-203 | None |
| REQ-001 | AC-5: "No" collapses and resets | TC-204 | None |
| REQ-001 | AC-6: i18n attributes + locale keys | TC-223, TC-224 | None |
| REQ-001 | AC-7: RTL layout | Out of scope | Justified -- existing `intake-rtl.spec.ts` will cover |
| REQ-002 (Hotel Questions) | AC-1: 7 questions in order | TC-203, TC-205 | None |
| REQ-002 | AC-2: hotelType 12 cards, radio | TC-205, TC-206 | None |
| REQ-002 | AC-3: hotelLocation 5 options | TC-205 | None |
| REQ-002 | AC-4: hotelStars 4 options | TC-205 | None |
| REQ-002 | AC-5: hotelAmenities multi-select | TC-205, TC-207 | None |
| REQ-002 | AC-6: hotelPets default "No" | TC-205, TC-208 | None |
| REQ-002 | AC-7: hotelCancellation 3 options | TC-205 | None |
| REQ-002 | AC-8: hotelBudget slider config | TC-205, TC-209, TC-210 | None |
| REQ-002 | AC-9: data-i18n on labels | TC-224 | None |
| REQ-002 | AC-10: i18n keys in 12 files | TC-223 | None |
| REQ-002 | AC-11: Design system compliance | TC-228 | None |
| REQ-003 (Car Toggle) | AC-1: Section visible | TC-211 | None |
| REQ-003 | AC-2: Yes/No toggle | TC-212 | None |
| REQ-003 | AC-3: Default "No" | TC-212 | None |
| REQ-003 | AC-4: "Yes" reveals sub-questions | TC-213 | None |
| REQ-003 | AC-5: "No" collapses and resets | TC-214 | None |
| REQ-003 | AC-6: i18n attributes + locale keys | TC-223, TC-225 | None |
| REQ-003 | AC-7: RTL layout | Out of scope | Justified -- existing `intake-rtl.spec.ts` will cover |
| REQ-004 (Car Questions) | AC-1: 6 questions in order | TC-213, TC-215 | None |
| REQ-004 | AC-2: carCategory 14 cards, radio | TC-215, TC-216 | None |
| REQ-004 | AC-3: carTransmission 3 options | TC-215 | None |
| REQ-004 | AC-4: carFuel 5 options | TC-215 | None |
| REQ-004 | AC-5: carPickup 4 options | TC-215 | None |
| REQ-004 | AC-6: carExtras multi-select | TC-215, TC-217 | None |
| REQ-004 | AC-7: carBudget slider config | TC-215 | None |
| REQ-004 | AC-8: data-i18n on labels | TC-225 | None |
| REQ-004 | AC-9: i18n keys in 12 files | TC-223 | None |
| REQ-004 | AC-10: Design system compliance | TC-228 | None |
| REQ-005 (Range Slider) | AC-1: Two draggable handles | TC-209 | None |
| REQ-005 | AC-2: Filled range highlight | TC-228 | None |
| REQ-005 | AC-3: Handles cannot cross | TC-210 | None |
| REQ-005 | AC-4: Label displays range | TC-205 | None |
| REQ-005 | AC-5: Touch-friendly 44px | Out of scope | Justified -- visual/design spec |
| REQ-005 | AC-6: Keyboard accessible | TC-209 | None |
| REQ-005 | AC-7: Step configurable | TC-205, TC-209 | None |
| REQ-005 | AC-8: Min/max configurable | TC-205 | None |
| REQ-005 | AC-9: RTL mirroring | Out of scope | Justified -- existing rtl spec |
| REQ-005 | AC-10: Design system colors | Out of scope | Justified -- visual spec |
| REQ-005 | AC-11: Desktop + mobile | Out of scope | Justified -- existing responsive spec |
| REQ-006 (Hotel Markdown) | AC-1: Present when Yes | TC-218 | None |
| REQ-006 | AC-2: Omitted when No | TC-219 | None |
| REQ-006 | AC-3: 7 field format | TC-218 | None |
| REQ-006 | AC-4: English values | TC-218 | None |
| REQ-006 | AC-5: "Not specified" defaults | TC-222 | None |
| REQ-006 | AC-6: Visible in Step 7 preview | TC-218 | None |
| REQ-006 | AC-7: Present in downloaded md | TC-218 | None |
| REQ-007 (Car Markdown) | AC-1: Present when Yes | TC-220 | None |
| REQ-007 | AC-2: Omitted when No | TC-221 | None |
| REQ-007 | AC-3: 6 field format | TC-220 | None |
| REQ-007 | AC-4: English values | TC-220 | None |
| REQ-007 | AC-5: "Not specified" defaults | TC-222 | None |
| REQ-007 | AC-6: Visible in Step 7 preview | TC-220 | None |
| REQ-007 | AC-7: Present in downloaded md | TC-220 | None |
| REQ-008 (i18n) | AC-1: data-i18n attributes | TC-224, TC-225 | None |
| REQ-008 | AC-2: Keys in ui_en.json | TC-223 | None |
| REQ-008 | AC-3: Keys in ui_ru.json | TC-223 | None |
| REQ-008 | AC-4: Keys in ui_he.json | TC-223 | None |
| REQ-008 | AC-5: Remaining 9 files | TC-223 | None |
| REQ-008 | AC-6: data-en-name attributes | TC-226 | None |
| REQ-008 | AC-7: Language switch updates | Out of scope | Justified -- existing `intake-i18n-full.spec.ts` |
| REQ-009 (Design System) | AC-1: Expand/collapse animation | TC-228 | None |
| REQ-009 | AC-2: Responsive grid | Out of scope | Justified -- existing design-spec |
| REQ-009 | AC-3: q-card compact sizing | Out of scope | Justified -- existing design-spec |
| REQ-009 | AC-4: Chip selector pattern | TC-207, TC-217 | None |
| REQ-009 | AC-5: Toggle Yes/No pattern | TC-202, TC-212 | None |
| REQ-009 | AC-6: 44px touch targets | Out of scope | Justified -- visual spec |
| REQ-009 | AC-7: Responsive widths | Out of scope | Justified -- existing responsive spec |
| REQ-009 | AC-8: Dark mode | Out of scope | Justified -- existing darkmode spec |
| REQ-010 (Section Order) | AC-1: Field order | TC-227 | None |
| REQ-010 | AC-2: Section headers styled | TC-201, TC-211 | None |
| REQ-010 | AC-3: Toggle prominent | TC-202, TC-212 | None |
| REQ-010 | AC-4: Smooth animation | TC-228 | None |
| REQ-010 | AC-5: Visual separation | TC-227 | None |
| REQ-010 | AC-6: No layout jumps | TC-229 | None |
| REQ-011 (Supplementary) | AC-1: Listed in rule file | Out of scope | Justified -- rule file content, not automatable |
| REQ-011 | AC-2: No tier assignment | TC-201, TC-211 | None |
| REQ-011 | AC-3: Visible at all depths | TC-201, TC-211 | None |

**Coverage summary:** 79 acceptance criteria total. 65 covered by test cases. 14 correctly deferred to existing specs or marked as non-automatable. Zero gaps identified.

## 4. Feedback Items

### QF-1: i18n File Validation Test (TC-223) Should Not Use Browser Fixture

**Severity:** Blocking
**Section:** TC-223 (intake-hotel-car-i18n.spec.ts)
**Issue:** TC-223 is described as a static file analysis test that reads and parses 12 JSON files from disk. It does not interact with the browser at all. However, the test plan places it in a spec file (`intake-hotel-car-i18n.spec.ts`) alongside TC-224, TC-225, and TC-226 which DO require browser interaction. If the spec file uses the standard `@playwright/test` import, TC-223 will spin up an unnecessary browser context. If the spec file uses `shared-page.ts`, TC-223 will load the intake page unnecessarily.

Per automation rule 6.2, `shared-page.ts` is for read-only DOM tests. TC-223 does not read the DOM at all -- it reads JSON files.

**Suggestion:** Either:
(a) Move TC-223 into a separate spec file (e.g., `intake-hotel-car-i18n-keys.spec.ts`) that uses only Node.js `fs` with the standard `@playwright/test` import (Playwright supports non-browser tests). This keeps it fast and avoids unnecessary browser launch.
(b) Alternatively, keep it in `intake-hotel-car-i18n.spec.ts` but use `test.describe` with `test.use({ browserName: undefined })` or simply wrap it in a `test()` block that does not reference `page`. Playwright will not launch a browser if `page` is never accessed.

Option (a) is preferred as it makes the test's nature explicit.

---

### QF-2: Consider Merging TC-201/TC-211 and TC-202/TC-212 Pairs to Reduce Test Count

**Severity:** Recommendation
**Section:** TC-201, TC-211, TC-202, TC-212
**Issue:** TC-201 and TC-211 are structurally identical tests (section visibility at depth levels) for hotel and car respectively. Similarly, TC-202 and TC-212 test default toggle state for each section. Since hotel and car sections coexist on the same Step 6 page, both assertions can be checked in a single page load.

Currently the plan has 3 sub-tests for TC-201 (3 depths) + 3 sub-tests for TC-211 (3 depths) = 6 sub-tests, each requiring full navigation from scratch.

**Suggestion:** Merge each pair into a single test that checks both hotel and car in the same page visit:
- Merged TC-201+211: For each depth level, assert both `#hotelAssistanceSection` and `#carAssistanceSection` are visible (3 tests instead of 6)
- Merged TC-202+212: Single test asserting both hotel and car default states in one page visit (1 test instead of 2)

This reduces the `setupWithDepth()` navigation count (the most expensive operation per the plan's own risk section) and aligns with rule 6.3's philosophy of batching related assertions. Net reduction: ~4 fewer page navigations.

---

### QF-3: Missing Coverage for Markdown Section Ordering (Hotel Before Car)

**Severity:** Recommendation
**Section:** TC-218, TC-220 (Markdown output tests)
**Issue:** BRD REQ-007 AC-1 specifies that Car Rental Assistance appears "after the Hotel Assistance section (or after Additional Preferences if no hotel section)." The test plan verifies each section's presence independently (TC-218 for hotel, TC-220 for car) but does not verify the relative ORDER of these sections in the markdown output when both are enabled.

If a code defect causes `## Car Rental Assistance` to render before `## Hotel Assistance`, no test would catch it.

**Suggestion:** Add a soft assertion in either TC-218 or TC-220 (or a combined test where both toggles are "Yes") that verifies the markdown `indexOf('## Hotel Assistance')` < `indexOf('## Car Rental Assistance')`. This is a single-line addition to an existing test, not a new test case.

---

## 5. Best Practice Recommendations

1. **POM locator naming:** The planned locator list in Section 7 is well-structured. One enhancement: add a `getSubQuestionByKey(sectionId: string, questionKey: string)` parameterized method to avoid repetitive `page.locator(\`[data-question-key="${key}"]\`)` calls across multiple tests. This mirrors the existing `getDaySection(dayNumber)` pattern in `TripPage.ts`.

2. **Test data externalization:** The 93 i18n key names used in TC-223 should be defined as a constant array in a shared utility file (e.g., `tests/utils/hotel-car-keys.ts`) rather than hardcoded in the spec. This ensures the key list can be reused if other tests need it and provides a single point of maintenance.

3. **Markdown assertions and language independence:** The plan correctly notes that markdown field labels are hardcoded English by design (matching the `data-en-name` pattern). This is consistent with rule 7.1's exception for structural format assertions. The `implementation notes` annotation in TC-218 is a good practice -- keep it in the actual spec file as a code comment for future maintainers.

4. **Progression file placement:** Per rule 6.4, progression tests go in `progression.spec.ts`. However, these tests are intake-specific, not trip-HTML-specific. The plan correctly places them in dedicated intake spec files rather than the trip `progression.spec.ts`. This is the right call -- rule 6.4 applies to trip HTML progression, and intake tests have their own spec-per-feature convention (22 existing intake specs confirm this pattern).

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-03-28 | Approved with Changes |

**Conditions for Approval:**
- QF-1 (Blocking): TC-223 must be separated from browser-dependent tests or structured to avoid unnecessary browser launch. AE must confirm the approach before implementation.
- QF-2 and QF-3 are recommendations that improve efficiency and coverage respectively. AE should adopt them but they are not blocking.
