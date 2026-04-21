# Architecture Review

**Change:** Interactive Google Maps Day Mini-Map (replace day-level route link)
**Date:** 2026-04-21
**Reviewer:** Software Architect
**Documents Reviewed:**
- `technical_documents/2026-04-21_google-maps-day-minimap/high_level_design.md`
- `technical_documents/2026-04-21_google-maps-day-minimap/detailed_design.md`
- `technical_documents/2026-04-21_google-maps-day-minimap/business_requirements.md`
- `technical_documents/2026-04-21_google-maps-day-minimap/ux_design.md`
- `rendering-config.md` (current state)
- `development_rules.md` §1–3, §6
- `automation/scripts/generate_shell_fragments.ts` (implementation)
- `automation/scripts/generate_html_fragments.ts` (implementation)
- `base_layout.html` (current state)

**Verdict:** Approved

---

## 1. Review Summary

The design is architecturally sound. The two-phase split (generation-time `place_id` persistence + render-time widget injection) is the correct approach. Content/presentation separation is clean: `place_id` lives in markdown, the widget is pure rendering concern. The graceful degradation contract is thorough and correctly implemented at multiple layers. The `{{MAPS_SCRIPT}}` wiring through `generate_shell_fragments.ts` → `shell_fragments_{lang}.json` → assembly is fully implemented and verified in the actual code.

All blocking items (FB-001, FB-002, FB-003) have been resolved and verified in the implementation. Three recommendation-level items address the development_rules.md §1 HTML contract table and pre-regression validation coverage (FB-004, FB-005) — these remain as non-blocking guidance for follow-up.

---

## 2. Architecture Principles Checklist

| Principle | Status | Notes |
|---|---|---|
| Content / presentation separation | Pass | `place_id` stored in markdown (generation-time content); widget rendered in HTML only (render-time presentation). Changing widget appearance requires no markdown changes. |
| Easy to extend for new requirements | Pass | Adding a new language to `MAP_ARIA_LABELS` is a one-line change in both `generate_html_fragments.ts` and `generate_shell_fragments.ts`. Adding a new POI attribute follows the established `**key:** value` bold-line pattern. |
| Consistent with existing patterns | Pass | `data-place-id` / `data-poi-name` follows `data-link-type` precedent. Fallback `<a class="map-link">` always-in-DOM mirrors existing graceful degradation (accommodation section). Shimmer skeleton is new but uses existing CSS design tokens. |
| No unnecessary coupling | Pass | `generate_html_fragments.ts` and `generate_shell_fragments.ts` independently read the same `maps_config.json` — no cross-script dependency. The widget div and the `initDayMaps` script are completely decoupled (script reads DOM attributes at runtime). |
| Regeneration performance | Pass | `maps_config.json` key change triggers re-run of both scripts (expected). A change to `place_id` in a single day markdown file triggers only that day's fragment regeneration via `--stale-days`. CSS changes trigger full HTML rebuild (standard). |

---

## 3. Feedback Items

### FB-001: Assembly step does not inject `{{MAPS_SCRIPT}}` — RESOLVED

**Severity:** Blocking — RESOLVED
**Affected document:** `rendering-config.md` (as implemented — Step 3: Assembly & Final Export)
**Section:** Step 3, item 3: "Inject all fragments into the placeholders"
**Resolution verified:** `rendering-config.md` Step 3 item 3 now reads "Inject all fragments into the placeholders (PAGE_TITLE, NAV_LINKS, NAV_PILLS, TRIP_CONTENT, HTML_LANG_ATTRS, **MAPS_SCRIPT**)." Item 5 also lists `{{MAPS_SCRIPT}}` in the preservation check. Confirmed at `rendering-config.md` lines 361–363.

---

### FB-002: `fitBounds` / single-center logic fails silently when some POIs return no geometry — RESOLVED

**Severity:** Blocking — RESOLVED
**Affected document:** DD §1.3 (rendering-config.md JS spec), `generate_shell_fragments.ts` INIT_SCRIPT_BODY
**Section:** JS `initDayMaps` — `getDetails` callback, `placedCount` logic
**Resolution verified:** `generate_shell_fragments.ts` `INIT_SCRIPT_BODY` now declares `var failedCount = 0` alongside `var placedCount = 0` (line 293). The `getDetails` failure path increments `failedCount++` and checks `placedCount + failedCount === poiCards.length` to detect when all callbacks have settled (lines 316–322); when `placedCount === 0` at that point, `.day-map-widget--error` is applied and the fallback revealed. The success path also checks `placedCount + failedCount === poiCards.length` before calling `fitBounds` or `setCenter` (lines 329–336), ensuring view resolution is never deferred indefinitely.

---

### FB-003: CSS `.day-map-widget--loading` shimmer class is never removed on error path — RESOLVED

**Severity:** Recommendation — RESOLVED
**Affected document:** DD §1.5 (`rendering_style_config.css`), DD §1.3 JS spec
**Section:** `.day-map-widget--error` CSS rules; `initDayMaps` error handling
**Resolution verified:** The zero-POI early-return path in `INIT_SCRIPT_BODY` (lines 275–279 of `generate_shell_fragments.ts`) now calls `widget.classList.remove('day-map-widget--loading')` before adding `.day-map-widget--error`, stopping the shimmer immediately. `rendering_style_config.css` lines 869–871 add `.day-map-widget--error { animation: none; }` as a belt-and-suspenders CSS guard covering the partial-failure callback path.

---

### FB-004: `development_rules.md` §1 HTML contract table does not include `.day-map-widget` or `.map-link` locators — Recommendation

**Severity:** Recommendation
**Affected document:** `development_rules.md` §1 (HTML Generation Contract — TripPage.ts Locators table)
**Section:** §1, Source 1 table
**Issue:** The HTML Generation Contract table in `development_rules.md` §1 is the canonical reference for what structural elements HTML generation must produce. This change introduces `.day-map-widget`, `.day-map-widget__canvas`, `.day-map-widget__fallback`, and the always-present `.map-link` inside the widget. These are not listed in the contract table. When a future developer reads the table before generating HTML, they will not know these elements are required. The AE test plan will likely add assertions on these elements — but the authoritative contract is `development_rules.md`, not the test specs.

**Suggestion:** After AE adds `.map-link` and `.day-map-widget` locators to `TripPage.ts`, add corresponding rows to the `development_rules.md` §1 table. At minimum: `a.map-link` (always present in DOM, either standalone or inside widget), `.day-map-widget` (conditional on API key + place_id availability), and `data-poi-name` (mandatory on every `.poi-card`).

---

### FB-005: Pre-regression validation gate (§3) does not include map widget structural checks — Recommendation

**Severity:** Recommendation
**Affected document:** `development_rules.md` §3 (Pre-Regression Validation Gate)
**Section:** §3 validation checklist
**Issue:** The pre-regression validation gate runs grep/regex checks on the generated HTML before Playwright. The current 13-item checklist does not include any check for the new widget elements. If the `{{MAPS_SCRIPT}}` placeholder is left un-substituted (see FB-001) or `data-poi-name` is missing from POI cards, the pre-regression gate would pass but Playwright tests would fail. Adding structural checks here catches the failure 2–3 minutes earlier.

**Suggestion:** Add two items to the pre-regression checklist:
- Item 14: `MAPS_SCRIPT not literal — when API key is configured, assert that `{{MAPS_SCRIPT}}` does NOT appear as a literal string in the assembled HTML (i.e., substitution was performed).`
- Item 15: `data-poi-name completeness — assert every .poi-card element has a non-empty data-poi-name attribute.`

---

## 4. Best Practice Recommendations

**JS init script co-location:** The `INIT_SCRIPT_BODY` constant is defined in `generate_shell_fragments.ts` as a raw string template. This is appropriate for a small script but will become difficult to maintain as the widget grows. Consider extracting the init function to a separate `.js` file at `automation/scripts/maps_init.js` and reading it with `fs.readFileSync` at build time. This would enable syntax highlighting, linting, and easier debugging of the client-side code. Not a blocking concern for v1.

**API key in `src` attribute vs. separate exposure:** The current implementation embeds the API key directly in the `src` URL (`?key=${safeKey}`). This is standard practice for Maps JS API frontend keys. The design correctly documents domain-restriction as an operational requirement. No change needed — just confirming the approach is architecturally intentional.

**`mapId` requirement for AdvancedMarkerElement:** The Google Maps JS API v3 documentation requires a `mapId` to be set on the `google.maps.Map` constructor options when using `AdvancedMarkerElement` (as of API v3.55). Without `mapId`, `AdvancedMarkerElement` silently falls back to legacy `Marker`. The UX spec (§13) flags this as a condition for Dev to verify. This should be a checklist item in the implementation — either a `mapId` pointing to a default Google Cloud map style, or an explicit fallback to legacy `Marker` with a custom SVG icon matching the pin design spec. Recommend adding a `TODO` comment in the JS init body documenting this requirement.

**Closure capture of `marker` and `photoUrl` in `getDetails` callback:** The current implementation uses `forEach` + a callback that closes over `marker` and `photoUrl`. In the IIFE-style ES5 code used in the init script, this closure pattern is correct. However, because `photoUrl` is declared inside the `getDetails` callback (not in the outer `forEach` scope), `marker.addListener('click', ...)` is also defined inside the callback — this means click listeners are only registered after `getDetails` resolves. This is intentional (lazy load) and correct. Call this out explicitly in a code comment to prevent future refactoring from moving the `addListener` call to the outer scope.

---

## 5. Sign-off

| Role | Date | Verdict |
|---|---|---|
| Software Architect | 2026-04-21 | Approved with Changes |
| Software Architect | 2026-04-21 | **Approved** (re-review — all blocking items resolved) |

**Conditions for approval — all resolved:**

- [x] FB-001: `rendering-config.md` Step 3 now includes `MAPS_SCRIPT` in the placeholder injection list and preservation validation check.
- [x] FB-002: `failedCount` tracked; `fitBounds`/`setCenter` fires on `placedCount + failedCount === poiCards.length`; error state applied when `placedCount === 0`.
- [x] FB-003: `widget.classList.remove('day-map-widget--loading')` present in error path; `.day-map-widget--error { animation: none }` added to `rendering_style_config.css`.
