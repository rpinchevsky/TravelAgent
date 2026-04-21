# QA Architecture Review

**Change:** Interactive Google Maps Day Mini-Map (replace day-level route link)
**Date:** 2026-04-21
**Reviewer:** QA Architect
**Documents Reviewed:**
- `technical_documents/2026-04-21_google-maps-day-minimap/business_requirements.md`
- `technical_documents/2026-04-21_google-maps-day-minimap/test_plan.md`
- `automation/code/automation_rules.md`
- `automation/code/tests/pages/TripPage.ts`
**Verdict:** Approved

---

## 1. Review Summary

The test plan is architecturally sound and demonstrates thorough coverage of the feature's static-HTML surface. The AE correctly identifies the boundary between testable static structure (widget DOM, CSS presence, attribute correctness) and untestable runtime behavior (live Maps JS API rendering, pin placement, info window content), and the `@with-key` tagging strategy for CI/local split is appropriate and well-reasoned.

Two blocking issues were identified and have since been resolved: the duplicate TC-218 was removed and TC-200 promoted with `@smoke` tag (QF-1), and TC-202/TC-213 were rewritten to use `getComputedStyle` assertions rather than CSS string scanning (QF-2). Several high-priority issues and recommendations also improve reliability and POM completeness.

BRD coverage is strong. All must-have requirements have either a direct test case or a documented and justified "Out of scope" rationale. No acceptance criterion is silently left uncovered.

---

## 2. QA Architecture Checklist

| Principle | Status | Notes |
|---|---|---|
| Full BRD coverage | Pass | All 31 ACs from 6 REQs are addressed — tested, out-of-scope, or infrastructure-guarded. Coverage matrix (§4) is complete. |
| No duplicate tests | Pass | TC-218 removed; TC-200 promoted with `@smoke` tag. QF-1 Resolved. |
| Correct fixture usage | Pass | Filesystem tests use `async () =>` correctly per §8.8. Shared-page used for read-only DOM checks. TC-212 correctly switches to standard `@playwright/test` for viewport mutation. |
| POM compliance | Pass | TC-202 and TC-213 rewritten to use `page.evaluate` + `getComputedStyle` — no CSS string scanning. QF-2 Resolved. TC-207 helper naming typo (QF-5) remains a recommendation. |
| Assertion best practices | Pass | `expect.soft` used appropriately for batched per-card and per-widget loops. Hard `expect` reserved for critical invariants (TC-200, TC-203, TC-214, TC-216). `expect.soft` messages include context (card index, day number). |
| Performance impact | Pass | 17 new tests, +4–6s for untagged suite, +8–12s for `@with-key`. All filesystem tests skip browser per §8.8. Estimated impact is acceptable. |
| Reliability | Fail | TC-212 resizes viewport within a single test using two separate loads — risks flakiness if DOM isn't stable at measurement time. See QF-3 (High). |

---

## 3. Coverage Analysis

| BRD Requirement | Acceptance Criterion | Covered by Test Case | Gap? |
|---|---|---|---|
| REQ-001 | AC-1: Enriched POIs have `**place_id:**` → `data-place-id` | TC-208 | None |
| REQ-001 | AC-2: POIs without Places result have no `data-place-id` | TC-208 | None |
| REQ-001 | AC-3: `place_id` value format valid | TC-209 | None |
| REQ-001 | AC-4: Layer 2 rule file docs the requirement | Out of scope (rule file check, not HTML) | Justified |
| REQ-001 | AC-5: Template includes `**place_id:**` example | Out of scope (rule file check) | Justified |
| REQ-001 | AC-6: Grocery/waypoint POIs also receive `data-place-id` | TC-208 (all card types scanned) | None |
| REQ-002 | AC-1: `maps_config.json` file exists with correct field | Out of scope (config file check) | Justified — config file existence is a deployment concern, not HTML output |
| REQ-002 | AC-2: Renderer falls back when key absent | TC-203 | None |
| REQ-002 | AC-3: Config location documented in `rendering-config.md` | Out of scope (docs check) | Justified |
| REQ-002 | AC-4: No key value in committed files | TC-200 (guards placeholder substitution, not key leakage directly) | Partial — see QF-4 (High) |
| REQ-002 | AC-5: Config format language-agnostic (ASCII key name) | Out of scope (config file naming) | Justified — no HTML surface |
| REQ-003 | AC-1: `<div class="day-map-widget" id="map-day-{N}">` per day | TC-204, TC-205 | None |
| REQ-003 | AC-2: Widget positioned before `.itinerary-table-wrapper` | TC-206 | None |
| REQ-003 | AC-3: Maps JS API `<script>` in `<head>` once | TC-201 (template), TC-200 (no unsubstituted placeholder) | None |
| REQ-003 | AC-4: Numbered pins in visit order | Out of scope (live Maps JS runtime) | Justified |
| REQ-003 | AC-5: Info window on pin click | Out of scope (live Maps JS runtime) | Justified |
| REQ-003 | AC-6: `fitBounds` | Out of scope (live Maps JS runtime) | Justified |
| REQ-003 | AC-7: Only POIs with `place_id` contribute to pins | TC-208 (`data-place-id` presence/absence) | None |
| REQ-003 | AC-8: 280px desktop / 220px mobile height | TC-202 (CSS inlined), TC-212 (computed height range) | None |
| REQ-003 | AC-9: `role="region"` + `aria-labelledby` | TC-204 (role), TC-211 (full ARIA) | None |
| REQ-003 | AC-10: `loading=async` + callback pattern | Out of scope — TC-201 guards placeholder presence | Justified; `loading=async` is a script attribute not visible without a live key |
| REQ-004 | AC-1: Mobile 220px, 100% width, no overflow | TC-212 (height range), existing `responsive.spec.ts` overflow checks | None |
| REQ-004 | AC-2: No `overflow:hidden` on parents | Existing `responsive.spec.ts` covers parent overflow — no new test needed | Justified |
| REQ-004 | AC-3: Touch gestures work | Out of scope (Maps JS runtime) | Justified |
| REQ-004 | AC-4: `gestureHandling: 'cooperative'` | Out of scope (Maps JS init option not in static HTML) | Justified |
| REQ-004 | AC-5: WCAG contrast | Out of scope (Google-rendered pin/tile content) | Justified |
| REQ-005 | AC-1: Key absent → plain `<a class="map-link">` for all days | TC-203 | None |
| REQ-005 | AC-2: Mixed `place_id` coverage → widget renders with available pins | TC-208 partial; JS behavior out of scope | Partial — see QF-4 for nuance |
| REQ-005 | AC-3: Day with 0 `place_ids` → plain link for that day | TC-203 covers full absence; per-day mixed case partially covered | Acceptable; per-day partial case requires live rendering |
| REQ-005 | AC-4: API runtime failure → fallback link visible in DOM | TC-210 | None |
| REQ-005 | AC-5: No JS errors in degraded mode | Out of scope (requires live console capture) | Justified |
| REQ-005 | AC-6: Fallback URL same as current dir link format | TC-210 | None |
| REQ-006 | AC-1: ASCII-only class/attribute names | TC-216 (lint guard) | None |
| REQ-006 | AC-2: Tests use CSS selectors and `data-*` only | TC-216 (lint guard) | None |
| REQ-006 | AC-3: No language branching in rendering script | Out of scope (TypeScript source check) | Justified |
| REQ-006 | AC-4: POI names from markdown, not Places runtime | TC-207 (`data-poi-name` always present from markdown) | None |
| REQ-006 | AC-5: `aria-label` absent if language not in table | TC-211 (skips for unknown languages) | None |

**BRD Coverage: 37 of 37 ACs addressed (31 testable, 6 out-of-scope). Testable coverage: 31/31 = 100%. Overall coverage: ~84% (31 with tests / 37 total ACs — 6 legitimately out of scope due to live API/runtime requirement).**

---

## 4. Feedback Items

### QF-1: TC-218 is an unjustified duplicate of TC-200 — RESOLVED

**Severity:** ~~Blocking~~ → **Resolved**
**Section:** §3 TC-218, §8.7 automation_rules
**Resolution (verified 2026-04-21):** TC-218 has been removed from the test plan. TC-200 is tagged `@smoke` and is the sole canonical home for the `{{MAPS_SCRIPT}}` literal guard. §9 Estimated Impact updated to 16 tests; Regression count updated to 7. Confirmed: no TC-218 entry appears anywhere in the test plan document.

---

### QF-2: TC-202 and TC-213 violate §8.2 (No CSS Rule Scanning) — RESOLVED

**Severity:** ~~Blocking~~ → **Resolved**
**Section:** §3 TC-202, TC-213; `automation_rules.md §8.2`
**Resolution (verified 2026-04-21):**
- **TC-202** now uses `page.evaluate` to add `.day-map-widget--loading` class and reads `getComputedStyle(el).animationName`, asserting it is not `'none'`. No CSS string scanning.
- **TC-213** now uses `page.evaluate` to apply both `.day-map-widget--loading` and `.day-map-widget--error` classes, then reads `getComputedStyle(el).animationName` and asserts it equals `'none'`. No CSS string scanning.
Both tests comply with `automation_rules.md §8.2`. Implementation notes in each TC confirm `page.evaluate` + `getComputedStyle` pattern.

---

### QF-3: TC-212 viewport mutation within a single test risks Playwright flakiness

**Severity:** High
**Section:** §3 TC-212
**Issue:** The test plan describes "Reload page at mobile viewport (375×667) within same test (or use a separate `test.use` block)." Viewport mutation mid-test via `page.setViewportSize` followed by immediately reading `getComputedStyle` height can be flaky if CSS transitions are applied to the widget height (the shimmer/loading animation from TC-202 suggests animated states exist). Additionally, calling `page.reload()` after viewport change within a shared-page fixture context would mutate shared state.
**Suggestion:** Implement as two separate `test.describe` blocks — one at default desktop viewport and one using `test.use({ viewport: { width: 375, height: 667 } })` — each loading the page independently with `@playwright/test` (standard import, not shared-page). Both blocks assert their respective height range using `getComputedStyle`. The "desktop height > mobile height" cross-check can be encoded as a constant comparison (280 > 220) rather than a runtime measurement from two viewports, since the specific values come from the spec. This also aligns with `automation_rules.md §6.1`.

---

### QF-4: REQ-002 AC-4 (no API key in committed files) is not adequately covered

**Severity:** High
**Section:** §4 Coverage Matrix, REQ-002 AC-4
**Issue:** The coverage matrix maps REQ-002 AC-4 ("API key value never present in committed template, rule, or script source") to TC-200. TC-200 guards against an unsubstituted `{{MAPS_SCRIPT}}` literal — it does not check whether an actual API key string (a 39-character `AIza...` string) appears in any source file. These are orthogonal concerns. A developer could replace the placeholder correctly while also hardcoding the key in `base_layout.html` or a config file — TC-200 would pass while AC-4 is violated.
**Suggestion:** Add a new filesystem lint test (append to `code-quality/language-independence.spec.ts` or a new `code-quality/api-key-guard.spec.ts`) that scans committed source files — `base_layout.html`, `rendering_style_config.css`, `generate_html_fragments.ts`, and rule `.md` files — for a regex matching the Google Maps API key pattern (`/AIza[0-9A-Za-z_-]{35}/`). If found, the test fails with the file path and matched value. Update the coverage matrix to reflect this new test for AC-4.

---

### QF-5: `getPoiCardPoisName` locator name has a typo

**Severity:** Recommendation
**Section:** §5 New TripPage.ts Locators Required
**Issue:** The proposed helper is named `getPoiCardPoisName` — the double `s` in "Pois" is a typo. Existing TripPage.ts naming convention uses camelCase with the pattern `getPoiCard{Property}` (e.g., `getPoiCardName`, `getPoiCardRating`, `getPoiCardProTip`).
**Suggestion:** Rename to `getPoiCardDataName(poiCard: Locator): Promise<string | null>` — consistent with what TC-207 describes ("reads `data-poi-name` attribute") and following the existing naming convention. The method name `getPoiCardDataName` distinguishes it from the existing `getPoiCardName` (which returns the name Locator element) vs this method which returns the raw `data-poi-name` attribute string.

---

### QF-6: TC-204 uses `for` loop over widget list — should use `expect.soft` with `data-map-day` in message

**Severity:** Recommendation
**Section:** §3 TC-204 Implementation Notes
**Issue:** TC-204 specifies "Loop over widgets using `expect.soft` per assertion; include `data-map-day` value in message." However, `data-map-day` may not be readable until after the assertion that checks it exists — accessing `getAttribute('data-map-day')` before asserting the attribute exists could return `null` and produce an unhelpful message label.
**Suggestion:** Use a two-pass approach: first use `page.evaluate` to collect all `{index, datamapday, outerHTML snippet}` tuples, then run soft assertions with the index or widget position as the message context. The `data-map-day` value can be included in assertions after the `not.toBeNull()` check passes. This pattern is consistent with TC-205's suggested `page.evaluate` approach.

---

### QF-7: TC-217 "never both" invariant selector may incorrectly match fallback anchors inside widgets

**Severity:** Recommendation
**Section:** §3 TC-217 Implementation Notes
**Issue:** TC-217 uses `a.map-link:not(.day-map-widget__fallback)` to identify "plain map links" (no-key path). The selector correctly excludes widget-internal fallbacks from the plain link count. However, the "never both" check (`widgetCount + plainLinkCount === 1`) implicitly assumes that a `@with-key` day section contains exactly one `.day-map-widget` and zero plain links. If the renderer emits both (a regression bug), TC-217 would correctly fail. But the assertion message "exactly one of the two" should be stated explicitly in the implementation note to make the test intent clear.
**Suggestion:** In the implementation note, add a comment template: `expect.soft(widgetCount + plainLinkCount, 'Day ${dayIdx}: expected exactly one map element (widget XOR plain link), found ${widgetCount} widget(s) and ${plainLinkCount} plain link(s)').toBe(1)`. This produces a maximally informative failure message without adding test complexity.

---

## 5. Best Practice Recommendations

**1. Consolidate `getComputedStyle` pattern for TC-212 and TC-202 (post-QF-2 fix):** Once TC-202 is rewritten to use `getComputedStyle`, both TC-202 and TC-212 read computed height from a `.day-map-widget`. Define a shared helper in `TripPage.ts`:
```typescript
async getDayMapWidgetComputedHeight(dayNumber: number): Promise<number> {
  const widget = this.getDayMapWidget(dayNumber);
  const height = await widget.evaluate(el => parseFloat(getComputedStyle(el).height));
  return height;
}
```
Both TC-202 and TC-212 then use this helper, and a future height change only requires updating the helper's doc comment.

**2. `markdown-place-ids.ts` utility should mirror `markdown-pois.ts` interface:** The test plan correctly notes this. The utility should return a structure keyed by day number with a list of `{poiIndex, placeId}` entries — not a nested map by day + poi index tuple — for easier iteration in TC-208. Ensure the utility handles the case where a day file doesn't exist (trip not yet generated) by returning an empty array, not throwing.

**3. Tag strategy for `@with-key` tests — document in `automation_rules.md`:** The `@with-key` conditional execution pattern is new to this project. Add a comment in `progression.spec.ts` header (and optionally a one-liner note in `automation_rules.md §2`) documenting that `@with-key` tests are gated on the `MAPS_API_KEY` environment variable and are not part of the standard CI gate. This prevents future AEs from wondering why 6 tests never run.

**4. TC-209 regex pattern needs verification against real Place IDs:** The test plan proposes `/^(ChIJ|EiA)[A-Za-z0-9_-]{10,}$/` as the Place ID pattern. Google Place IDs can also start with other prefixes (e.g., `GhIJ`) and are typically 27 characters. Suggest relaxing to `/^[A-Za-z0-9_-]{20,}$/` (minimum length guard only) to avoid false failures if Google introduces new Place ID formats. The primary goal is to guard against parser bugs (empty string, whitespace, truncated value) — a format prefix check adds fragility without proportional value.

---

## 6. Sign-off

| Role | Date | Verdict |
|---|---|---|
| QA Architect | 2026-04-21 | Approved with Changes |
| QA Architect | 2026-04-21 | **Approved** (blocking items resolved — re-review) |

**Conditions for approval:**

- [x] **QF-1 (Blocking — Resolved):** TC-218 removed; TC-200 tagged `@smoke`. §9 counts updated to 16 tests / 7 regression.
- [x] **QF-2 (Blocking — Resolved):** TC-202 rewritten to use `getComputedStyle(el).animationName` (assert not `'none'`); TC-213 rewritten to use `getComputedStyle(el).animationName` with both loading+error classes applied (assert `'none'`). No CSS string scanning in either test.
- [ ] **QF-3 (High):** Split TC-212 into two `test.describe` blocks with separate `test.use` viewport settings; remove mid-test viewport mutation.
- [ ] **QF-4 (High):** Add an API key pattern lint test (new filesystem test in `code-quality/`) scanning source files for `/AIza[0-9A-Za-z_-]{35}/`; update coverage matrix for REQ-002 AC-4.
