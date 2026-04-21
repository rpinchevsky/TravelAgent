# Test Plan

**Change:** Interactive Google Maps Day Mini-Map (replace day-level route link)
**Date:** 2026-04-21
**Author:** Automation Engineer
**BRD Reference:** `technical_documents/2026-04-21_google-maps-day-minimap/business_requirements.md`
**DD Reference:** `technical_documents/2026-04-21_google-maps-day-minimap/detailed_design.md`
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- Static HTML structure of `.day-map-widget` (present, correct attributes, correct position)
- Fallback `<a class="map-link">` presence and behavior (no API key path; zero-place_id-day path)
- `data-place-id` on `.poi-card` — present when `**place_id:**` is in markdown; absent when not
- `data-poi-name` on `.poi-card` — always present, non-empty
- `{{MAPS_SCRIPT}}` literal guard — must not appear in assembled HTML
- `base_layout.html` placeholder — `{{MAPS_SCRIPT}}` present in template source
- Widget DOM structure: `.day-map-widget__canvas`, `.day-map-widget__fallback` inside widget
- `data-map-day` attribute on widget container — matches day number
- ARIA structure: `role="region"`, `aria-labelledby` pointing to valid `sr-only` span when language is in MAP_ARIA_LABELS table
- CSS presence: `.day-map-widget` rules inlined in rendered HTML; height rules present; print rules present
- Responsive height: computed height differs between desktop and mobile viewport
- Placement: widget precedes `.itinerary-table-wrapper` within its day section
- Language independence: only CSS selectors and `data-*` attributes used in tests; no natural-language string assertions
- Graceful degradation path: no-key HTML uses `<a class="map-link">` (plain), no `.day-map-widget` elements
- Smoke-level integration: widget or fallback present on sampled days

**Out of scope:**
- Live Google Maps JS API rendering (requires a real API key and network; cannot be end-to-end tested in Playwright offline)
- Pin placement, info window content, map viewport fitBounds — JS runtime behavior post-API-load
- Maps API quota, `getDetails` latency, or browser console error assertions (would require live API)
- `gestureHandling: 'cooperative'` at runtime (touch-gesture behavior, not testable without live Maps JS)
- WCAG contrast on map tiles or Google-rendered pin glyphs (provided by Maps API, not our HTML)
- Dark mode tile swap (explicitly deferred to v2 per UX doc §10)

**Test type:** Both (Progression — new checks; Regression — guard existing behavior)

---

## 2. Test Environment

- **Browser:** Chromium (desktop viewport: 1280×800 by default; mobile viewport 375×667 for TC-212)
- **Framework:** Playwright + TypeScript
- **Pattern:** Page Object Model — `TripPage.ts` extended with map widget locators
- **Fixture:**
  - Shared-page fixture (`tests/fixtures/shared-page`) for all read-only DOM checks
  - Filesystem-only (`async () =>`) for source-file checks (TC-201) — no browser launch
- **Target file:** `trip_full_{LANG}.html` (resolved via existing `trip-config.ts` / `trip-folder.ts` utils)
- **Secondary target:** `base_layout.html` (source file, TC-201); `maps_config.json` absent scenario (TC-200, TC-203) simulated by inspecting a trip rendered without a key

**Assumption:** The test suite runs against HTML generated with `maps_config.json` key set to empty string (graceful degradation path). A second fixture or test tag (`@with-key`) is reserved for widget-present assertions; in CI, tests tagged `@with-key` run only when `MAPS_API_KEY` environment variable is set. All untagged tests must pass in keyless environments.

---

## 3. Test Cases

---

### TC-200: No `{{MAPS_SCRIPT}}` literal in assembled HTML

**Traces to:** REQ-002 AC-2 (key absent → no injection), REQ-003 AC-3 (script injected only via placeholder), DD §1.7c (FB-001 fix — literal must be substituted)
**Type:** Regression
**Spec file:** `regression/progression.spec.ts` (append to existing file)
**Tag:** `@smoke`
**Priority:** Critical

**Preconditions:**
- `trip_full_{LANG}.html` has been assembled (generated HTML on disk)

**Steps:**
1. Read `trip_full_{LANG}.html` from disk as raw string (filesystem test — no browser)
2. Check for the literal string `{{MAPS_SCRIPT}}`

**Expected result:**
- The literal string `{{MAPS_SCRIPT}}` does not appear anywhere in the assembled HTML

**Implementation notes:**
- Filesystem test — use `async () =>` (no `{ page }` destructure) to skip browser launch per automation_rules §8.8
- Use `fs.readFileSync` with `getHtmlPath()` from existing `trip-folder.ts` utils
- Hard `expect` (not soft) — an unsubstituted placeholder is a critical rendering failure

---

### TC-201: `{{MAPS_SCRIPT}}` placeholder present in `base_layout.html` source

**Traces to:** DD §1.4 (base_layout.html modification)
**Type:** Regression
**Spec file:** `regression/progression.spec.ts`
**Priority:** High

**Preconditions:**
- `base_layout.html` exists at its known project path

**Steps:**
1. Read `base_layout.html` as raw string from disk
2. Check for `{{MAPS_SCRIPT}}` before `</body>`

**Expected result:**
- `base_layout.html` contains `{{MAPS_SCRIPT}}`
- The placeholder appears before `</body>` (order check via string index comparison)

**Implementation notes:**
- Filesystem test — no browser
- Path resolved relative to project root via existing utils pattern

---

### TC-202: `.day-map-widget--loading` shimmer animation is active

**Traces to:** REQ-003 AC-8 (height rules present), DD §1.5 (CSS block added to `rendering_style_config.css`), rendering pipeline Step 3 CSS inlining
**Type:** Regression
**Spec file:** `regression/progression.spec.ts`
**Priority:** High

**Preconditions:**
- `trip_full_{LANG}.html` assembled with CSS inlined; shared-page fixture

**Steps:**
1. Locate the first `.day-map-widget` element on the page
2. Use `page.evaluate` to add the class `day-map-widget--loading` to that element (simulating the loading state)
3. Read `getComputedStyle(el).animationName` on the element
4. Assert `animationName` is not `'none'`

**Expected result:**
- When `.day-map-widget--loading` is applied, the computed `animation-name` is not `none` (shimmer keyframe is active)

**Implementation notes:**
- Uses `page.evaluate` + `getComputedStyle` — no CSS source scanning (automation_rules §8.2)
- Shared-page fixture; hard `expect` (animation-name absent means shimmer CSS was never inlined)
- Class is added programmatically for test purposes only — does not mutate shared page state because it operates on the in-memory DOM during `page.evaluate`

---

### TC-203: Graceful degradation — no widget emitted when API key absent

**Traces to:** REQ-005 AC-1 (key absent → all days render plain `<a class="map-link">`); no `.day-map-widget` elements
**Type:** Regression (guards existing fallback behavior)
**Spec file:** `regression/progression.spec.ts`
**Priority:** Critical

**Preconditions:**
- HTML generated with `maps_config.json` containing empty `google_maps_api_key` (standard CI state)

**Steps:**
1. Count `.day-map-widget` elements on the page
2. Count `a.map-link:not(.day-map-widget__fallback)` elements (plain map links)
3. Count day sections

**Expected result:**
- Zero `.day-map-widget` elements (widget not rendered when key is absent)
- At least one plain `a.map-link` present (at least one day has a map link)
- The number of plain `a.map-link` elements equals the number of day sections that have map links (≥ 1)

**Implementation notes:**
- Shared-page fixture; `expect.soft` for individual assertions
- This is the baseline state for all CI runs without a live key — must always pass

---

### TC-204: Widget DOM structure — required child elements present (with key)

**Traces to:** REQ-003 AC-1, DD §1.3 Day Map Widget Structure, DD §3
**Type:** Progression
**Spec file:** `regression/progression.spec.ts`
**Tag:** `@with-key` (skipped in keyless CI)
**Priority:** Critical

**Preconditions:**
- HTML generated with a valid (non-empty) `google_maps_api_key`

**Steps:**
1. Locate all `.day-map-widget` elements
2. For each widget:
   a. Check `data-map-day` attribute is present and numeric
   b. Check `.day-map-widget__canvas` child exists
   c. Check `a.map-link.day-map-widget__fallback` child exists
   d. Check `role="region"` attribute on widget root

**Expected result:**
- At least one `.day-map-widget` element on the page
- Every widget has `data-map-day` matching a positive integer
- Every widget contains exactly one `.day-map-widget__canvas`
- Every widget contains exactly one `.day-map-widget__fallback` anchor
- Every widget has `role="region"`

**Implementation notes:**
- Loop over widgets using `expect.soft` per assertion; include `data-map-day` value in message
- Use new `TripPage` locators: `dayMapWidgets`, `getDayMapWidget(N)`, `getDayMapCanvas(N)`, `getDayMapFallback(N)`

---

### TC-205: `data-map-day` value matches day section ID (with key)

**Traces to:** REQ-003 AC-1 (`id="map-day-{N}"`), DD §1.6f
**Type:** Progression
**Spec file:** `regression/progression.spec.ts`
**Tag:** `@with-key`
**Priority:** High

**Preconditions:**
- HTML with valid API key

**Steps:**
1. For each `.day-map-widget`, read `data-map-day` value (call it N)
2. Assert `#day-{N}` section exists on the page
3. Assert `.day-map-widget__canvas` id is `day-map-{N}`

**Expected result:**
- `data-map-day` value N corresponds to an existing `#day-{N}` section
- Canvas `id` = `day-map-{N}` for every widget

**Implementation notes:**
- Use `page.evaluate` to collect all widget `data-map-day` values, then assert each
- Soft assertions per widget

---

### TC-206: Widget positioned before itinerary table within its day (with key)

**Traces to:** REQ-003 AC-2 (placement before `.itinerary-table-wrapper`), UX §3
**Type:** Progression
**Spec file:** `regression/progression.spec.ts`
**Tag:** `@with-key`
**Priority:** High

**Preconditions:**
- HTML with valid API key; sample first available day with a widget

**Steps:**
1. Locate first `.day-map-widget` and its containing day section
2. Locate `.itinerary-table-wrapper` in the same day section
3. Compare document position of widget vs table-wrapper using `compareDocumentPosition`

**Expected result:**
- Widget appears BEFORE `.itinerary-table-wrapper` in document order (DOCUMENT_POSITION_FOLLOWING set on table when compared against widget)

**Implementation notes:**
- Use `page.evaluate` for `compareDocumentPosition` (same pattern as existing `smoke.spec.ts` TC "Assembly Order")
- Test a sampled day (first day with widget); no need to check all days

---

### TC-207: `data-poi-name` present and non-empty on all POI cards

**Traces to:** REQ-006 AC-2, DD §1.6d (`data-poi-name` always emitted), REQ-006 AC-1 (ASCII attribute name)
**Type:** Progression
**Spec file:** `regression/poi-cards.spec.ts` (append to existing file)
**Priority:** High

**Preconditions:**
- Any rendered HTML (attribute always emitted regardless of `place_id` or API key)

**Steps:**
1. Collect all `.poi-card` elements
2. For each card, read `data-poi-name` attribute
3. Assert attribute exists and has non-empty trimmed value

**Expected result:**
- Every `.poi-card` on the page has a `data-poi-name` attribute
- The attribute value is a non-empty string

**Implementation notes:**
- Shared-page fixture; `expect.soft` per card with card index in message
- Language-agnostic: only attribute name checked, not attribute value content
- Use new `TripPage.getPoiCardPoisName(card)` helper (reads `data-poi-name` attribute)

---

### TC-208: `data-place-id` present only on POI cards derived from enriched POIs

**Traces to:** REQ-001 AC-1, REQ-001 AC-2 (absent when no Places result), DD §1.6d, DD §1.6c (parser)
**Type:** Progression
**Spec file:** `regression/poi-cards.spec.ts`
**Priority:** High

**Preconditions:**
- HTML generated from a trip where at least some POIs were enriched via Google Places (have `**place_id:**` in markdown)
- `markdown-pois.ts` or a new `markdown-place-ids.ts` util reads `**place_id:**` lines from day files

**Steps:**
1. For each day, read `**place_id:**` entries from the corresponding `day_{NN}_{LANG}.md` file (filesystem read)
2. Locate the corresponding `.poi-card` elements in the rendered HTML
3. For POIs that have a `place_id` in markdown: assert `data-place-id` attribute present and matches the markdown value
4. For POIs that do NOT have a `place_id` in markdown: assert `data-place-id` attribute is absent

**Expected result:**
- POIs with `**place_id:**` in markdown → `.poi-card` has `data-place-id` matching that value
- POIs without `**place_id:**` in markdown → `.poi-card` has no `data-place-id` attribute

**Implementation notes:**
- Shared-page fixture for DOM reads; direct `fs.readFileSync` for markdown reads
- Spot-check approach: sample first and last day only (to avoid O(N×POIs) test time)
- If no `**place_id:**` lines exist in current trip's markdown (old trip), test is skipped with a descriptive message
- Use new `markdown-place-ids.ts` util or extend existing `markdown-pois.ts`
- `expect.soft` per POI card with POI name in message

---

### TC-209: `data-place-id` value format is a valid Google Places ID

**Traces to:** REQ-001 AC-3 (format `**place_id:** {value}`), DD §1.6c
**Type:** Progression
**Spec file:** `regression/poi-cards.spec.ts`
**Priority:** Medium

**Preconditions:**
- At least one `.poi-card` with `data-place-id` present in rendered HTML

**Steps:**
1. Locate all `.poi-card[data-place-id]` elements
2. For each, read `data-place-id` value
3. Assert value matches the Google Place ID pattern: starts with `ChIJ` or `EiA` followed by alphanumeric characters (minimum 20 characters total)

**Expected result:**
- Every `data-place-id` value matches `/^(ChIJ|EiA)[A-Za-z0-9_-]{10,}$/` (heuristic check — not a registry lookup)
- No `data-place-id` attribute contains whitespace or an empty string

**Implementation notes:**
- If no `.poi-card[data-place-id]` elements found (no enriched POIs in current trip), skip with message
- Regex pattern is a guard against parser bugs emitting malformed values; not a live Places API validation

---

### TC-210: Fallback link inside widget uses correct `href` format (with key)

**Traces to:** REQ-005 AC-4 (server-rendered fallback inside widget), REQ-005 AC-6 (same URL format as current dir link)
**Type:** Progression
**Spec file:** `regression/progression.spec.ts`
**Tag:** `@with-key`
**Priority:** High

**Preconditions:**
- HTML with valid API key; at least one `.day-map-widget` present

**Steps:**
1. For each `.day-map-widget`, locate `.day-map-widget__fallback`
2. Read its `href` attribute
3. Assert `href` starts with `https://www.google.com/maps/dir/`
4. Assert `aria-hidden="true"` is set (fallback hidden by default when widget active)

**Expected result:**
- Fallback `<a>` has `href` starting with `https://www.google.com/maps/dir/`
- Fallback `<a>` has `aria-hidden="true"` in the static HTML (hidden until API fails)

**Implementation notes:**
- Soft assertions per widget
- The `aria-hidden` check validates the static server-rendered state, not the post-JS state

---

### TC-211: ARIA structure — `role="region"` and `aria-labelledby` for known languages (with key)

**Traces to:** REQ-003 AC-9 (role + aria-labelledby), DD §1.6f (MAP_ARIA_LABELS table), REQ-006 AC-5 (absent if language not in table)
**Type:** Progression
**Spec file:** `regression/progression.spec.ts`
**Tag:** `@with-key`
**Priority:** Medium

**Preconditions:**
- HTML with valid API key, language is one of `ru`, `en`, `he`

**Steps:**
1. Locate all `.day-map-widget` elements
2. For each widget: assert `role="region"` present
3. Assert `aria-labelledby` attribute present and references an element ID of the form `map-day-{N}-label`
4. Locate the referenced `<span>` element by that ID
5. Assert the span has class `sr-only`
6. Assert the span's text content is non-empty

**Expected result:**
- All widgets have `role="region"`
- All widgets have `aria-labelledby` referencing a valid `sr-only` span
- Span text is non-empty (localized label resolved at render time)

**Implementation notes:**
- Test only runs for languages in MAP_ARIA_LABELS; add a guard: skip if `tripConfig.labels.langCode` is not in `['ru', 'en', 'he']`
- Soft assertions per widget
- Language-agnostic: no assertion on the specific label text content

---

### TC-212: Responsive — widget height differs between desktop and mobile viewports

**Traces to:** REQ-003 AC-8, REQ-004 AC-1, DD §1.5 (CSS heights)
**Type:** Progression
**Spec file:** `regression/responsive.spec.ts` (append to existing file, or new `regression/day-map-widget.spec.ts`)
**Priority:** High

**Preconditions:**
- HTML with valid API key (`@with-key`), or HTML with at least one `.day-map-widget` present
- Both desktop (1280×800) and mobile (375×667) viewports tested within one test using `test.use`

**Steps:**
1. Load page at desktop viewport (1280×800)
2. Locate first `.day-map-widget`
3. Get computed `height` using `getComputedStyle`
4. Assert height is greater than 250px (desktop height ≥ 280px per spec)
5. Reload page at mobile viewport (375×667) within same test (or use a separate `test.use` block)
6. Get computed `height` of first `.day-map-widget`
7. Assert height is less than 260px (mobile height ≤ 220px per spec)
8. Assert desktop height > mobile height

**Expected result:**
- Desktop computed height ≥ 250px (nominal: 280px)
- Mobile computed height ≤ 250px (nominal: 220px)
- Desktop height strictly greater than mobile height

**Implementation notes:**
- Do NOT assert exact pixel values (automation_rules §8.3) — use range checks
- Use `test.use({ viewport: { width: 375, height: 667 } })` in a separate `test.describe` block for the mobile check
- Standard `@playwright/test` import (not shared-page) because viewport mutation is needed
- Tag `@with-key` — widget must be present for this test to have meaning

---

### TC-213: `.day-map-widget--error` clears shimmer animation

**Traces to:** DD §1.5 (error state removes shimmer animation), REQ-005 AC-4 (API runtime failure → fallback visible)
**Type:** Regression
**Spec file:** `regression/progression.spec.ts`
**Priority:** Medium

**Preconditions:**
- `trip_full_{LANG}.html` assembled with CSS inlined; shared-page fixture

**Steps:**
1. Locate the first `.day-map-widget` element on the page
2. Use `page.evaluate` to add both `day-map-widget--loading` and `day-map-widget--error` classes to that element
3. Read `getComputedStyle(el).animationName` on the element
4. Assert `animationName` is `'none'`

**Expected result:**
- When `.day-map-widget--error` is present on the widget, the computed `animation-name` is `none` (shimmer is cleared in error state)

**Implementation notes:**
- Uses DOM manipulation + `getComputedStyle` — no CSS source scanning (automation_rules §8.2)
- Both classes added in the same `page.evaluate` call to simulate the error state replacing the loading state
- Shared-page fixture; soft assertion with message `'error state must clear shimmer animation'`

---

### TC-214: No duplicate widget containers per day (with key)

**Traces to:** DD §4 (risks — Maps JS API `<script>` not duplicated; widget emitted once per day)
**Type:** Regression
**Spec file:** `regression/structure.spec.ts` (append to existing file)
**Tag:** `@with-key`
**Priority:** Medium

**Preconditions:**
- HTML with valid API key

**Steps:**
1. For each day section `#day-{N}`:
   a. Count `.day-map-widget` elements within that section
2. Assert every day section has at most one `.day-map-widget`

**Expected result:**
- No day section contains more than one `.day-map-widget` element

**Implementation notes:**
- `page.evaluate` loop across all day sections; return violations as array
- Hard `expect` on empty violations array

---

### TC-215: `{{MAPS_SCRIPT}}` in assembled HTML is replaced — not just absent

This test is subsumed by TC-200. Do not add a separate test.

---

### TC-216: `data-poi-name` attribute is language-agnostic (no hardcoded language in test)

**Traces to:** REQ-006 AC-2 (tests use data-* attributes only, no language-specific strings), automation_rules §7.1
**Type:** Regression (code-quality guard)
**Spec file:** `code-quality/language-independence.spec.ts` — extend existing scan
**Priority:** Medium

**Preconditions:**
- Spec files on disk

**Steps:**
1. Extend the existing language-independence lint guard to also scan for direct attribute value assertions on `data-poi-name` (e.g., `expect(...).toHaveAttribute('data-poi-name', 'someName')`) — these would be language-specific
2. Assert no spec file contains `toHaveAttribute.*data-poi-name.*['"]\w` pattern that hardcodes a POI name

**Expected result:**
- No spec file asserts a specific language-string value for `data-poi-name`

**Implementation notes:**
- Filesystem test (no browser)
- Extends existing `language-independence.spec.ts` regex scan

---

### TC-217: Smoke — sampled days have a map element or fallback link (smoke addition)

**Traces to:** BRD REQ-003 / REQ-005 (widget or fallback always present per day); key constraint section
**Type:** Regression (smoke)
**Spec file:** `regression/smoke.spec.ts` — add to existing `Smoke — Day Content (sampled)` describe block
**Priority:** Critical

**Preconditions:**
- Any rendered HTML (both with-key and without-key)

**Steps:**
1. For each sampled day index (existing `sampleDays` array in smoke.spec.ts):
   a. Locate `.day-map-widget` OR `a.map-link:not(.day-map-widget__fallback)` within that day's section
2. Assert at least one of those two selectors is present per sampled day

**Expected result:**
- Each sampled day section contains either a `.day-map-widget` container OR a plain `a.map-link`
- Never both (widget replaces the plain link), never neither

**Implementation notes:**
- Add 1–2 `expect.soft` assertions to the existing `sampled days have banner, itinerary table, and POI cards` test in smoke.spec.ts
- The "never both" check: `expect.soft(widgetCount + plainLinkCount, ...).toBe(1)` — exactly one of the two
- Uses existing `sampleDays` computation from the smoke spec

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 AC-1 | Every enriched POI has `**place_id:**` rendered as `data-place-id` | TC-208 | Soft per card |
| REQ-001 AC-2 | POIs without Places result have no `data-place-id` | TC-208 | Soft per card |
| REQ-001 AC-3 | `place_id` format: valid Google Places ID string | TC-209 | Soft per card |
| REQ-001 AC-4 | Layer 2 section docs requirement | Out of scope (rule file validation, not HTML test) | — |
| REQ-001 AC-5 | Template includes `**place_id:**` | Out of scope (rule file validation) | — |
| REQ-001 AC-6 | Grocery/waypoint POIs also get `data-place-id` when available | TC-208 (all card types included in scan) | Soft per card |
| REQ-002 AC-1 | `maps_config.json` with `google_maps_api_key` | Out of scope (filesystem/config check; not HTML output) | — |
| REQ-002 AC-2 | Renderer falls back when key absent | TC-203 | Hard |
| REQ-002 AC-3 | Config location documented | Out of scope (docs check) | — |
| REQ-002 AC-4 | No key value in committed files | TC-200 (guards that key not leaked as unsubstituted placeholder) | Hard |
| REQ-003 AC-1 | `<div class="day-map-widget">` per day with valid structure | TC-204, TC-205 | Soft per widget |
| REQ-003 AC-2 | Widget before `.itinerary-table-wrapper` | TC-206 | Soft |
| REQ-003 AC-3 | Maps JS API script in `<head>` once (template placeholder) | TC-201, TC-200 | Hard |
| REQ-003 AC-4 | Numbered pins in visit order | Out of scope (requires live Maps JS; runtime JS behavior) | — |
| REQ-003 AC-5 | Info window on pin click | Out of scope (requires live Maps JS) | — |
| REQ-003 AC-6 | `fitBounds` | Out of scope (requires live Maps JS) | — |
| REQ-003 AC-7 | Only POIs with `place_id` contribute to widget pins | TC-208 (presence/absence of `data-place-id`); JS init filter tested via attribute structure | Soft |
| REQ-003 AC-8 | 280px desktop / 220px mobile | TC-202 (CSS rules inlined), TC-212 (computed height range) | Soft |
| REQ-003 AC-9 | `role="region"` + `aria-labelledby` | TC-204 (role), TC-211 (full ARIA structure) | Soft |
| REQ-003 AC-10 | `loading=async` + callback pattern | Out of scope (script tag content; would need live key to observe) — guarded by TC-201 placeholder check | — |
| REQ-004 AC-1 | Mobile 220px, 100% width | TC-212 (computed height) | Soft |
| REQ-004 AC-2 | No `overflow:hidden` on parent containers | Existing `responsive.spec.ts` covers overflow violations; no new test needed | — |
| REQ-004 AC-3 | Touch gestures work | Out of scope (Maps JS runtime behavior) | — |
| REQ-004 AC-4 | `gestureHandling: 'cooperative'` set | Out of scope (Maps JS init option; not visible in static HTML) | — |
| REQ-005 AC-1 | Key absent → plain `<a class="map-link">` for all days | TC-203 | Hard |
| REQ-005 AC-2 | Mixed `place_id` coverage → widget with available pins | TC-208 (partial attribute presence validated), full pin behavior out of scope | Soft |
| REQ-005 AC-3 | Day with 0 `place_ids` → plain link for that day | TC-203 (covers full absence); per-day mixed case partially covered via TC-208 | Soft |
| REQ-005 AC-4 | API runtime failure → fallback link visible | TC-210 (fallback in DOM; JS behavior out of scope) | Soft |
| REQ-005 AC-5 | No JS errors in degraded mode | Out of scope (requires live browser console capture with live API) | — |
| REQ-005 AC-6 | Fallback URL same as current dir link format | TC-210 | Soft per widget |
| REQ-006 AC-1 | ASCII-only class/attribute names | TC-216 (code quality scan) | Hard |
| REQ-006 AC-2 | Tests use CSS selectors and `data-*` only | TC-216 (lint guard) | Hard |
| REQ-006 AC-3 | No language branching in map generation | Out of scope (TypeScript source check; not HTML output) | — |
| REQ-006 AC-4 | POI names from markdown, not Places runtime | TC-207 (`data-poi-name` present; attribute is markdown-sourced) | Soft per card |
| REQ-006 AC-5 | `aria-label` omitted if language not in table | TC-211 (skips if lang not in known set) | Soft |

---

## 5. New TripPage.ts Locators Required

The following additions are needed in `TripPage.ts`:

```typescript
// --- Day Map Widget ---
readonly dayMapWidgets: Locator;          // '.day-map-widget'
readonly dayMapFallbacks: Locator;        // 'a.map-link.day-map-widget__fallback'
readonly plainMapLinks: Locator;          // 'a.map-link:not(.day-map-widget__fallback)'

getDayMapWidget(dayNumber: number): Locator;
// returns: page.locator(`#day-${dayNumber} .day-map-widget`)

getDayMapCanvas(dayNumber: number): Locator;
// returns: page.locator(`#day-${dayNumber} .day-map-widget__canvas`)

getDayMapFallback(dayNumber: number): Locator;
// returns: page.locator(`#day-${dayNumber} .day-map-widget__fallback`)

getPoiCardPlaceId(poiCard: Locator): Promise<string | null>;
// returns: poiCard.getAttribute('data-place-id')

getPoiCardDataName(poiCard: Locator): Promise<string | null>;
// returns: poiCard.getAttribute('data-poi-name')
```

---

## 6. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `trip_full_{LANG}.html` | Assembled HTML DOM | Regenerate trip with updated renderer to see widget elements |
| `day_{NN}_{LANG}.md` files | `**place_id:**` lines for TC-208 | No change — read at test runtime from existing markdown files |
| `manifest.json` | Day count (existing) | No change |
| `trip-config.ts` | `dayCount`, `labels.langCode` | No change |
| `base_layout.html` | Template source for TC-201 | Modified by Dev — test reads post-modification |
| `maps_config.json` | Absent in CI (keyless) / present for `@with-key` | CI: keep absent; local with-key runs: populate with test key |

---

## 7. New Utility File Required

**`tests/utils/markdown-place-ids.ts`** (new)
- Reads `day_{NN}_{LANG}.md` files from the current trip folder
- Returns a map of `{dayN: {poiIndex: placeId | null}[]}` by parsing `**place_id:**` lines
- Language-agnostic: uses `getMarkdownPath()` from existing `trip-folder.ts`
- Should follow the same pattern as existing `markdown-pois.ts` to keep the utility layer consistent

---

## 8. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Trip generated without any `**place_id:**` lines (old trip, no enrichment) | TC-208 and TC-209 skip with a descriptive message when zero `data-place-id` attributes found; TC-203/TC-207 still run on attribute absence |
| `@with-key` tests never run in CI (no key configured) | `@with-key` tests are tagged and optional — TC-203 (no-key path) provides the always-on regression guard; `@with-key` tests run locally or in dedicated CI stage with key env var |
| Playwright `getComputedStyle` returns `0px` for off-screen or hidden elements | TC-212 loads the page normally; widget is in document flow and visible — `getComputedStyle` returns the correct value for in-flow elements |
| `maps_config.json` accidentally committed with a real API key | TC-200 guards against `{{MAPS_SCRIPT}}` leakage; `.gitignore` change (DD §1.9) prevents key commit; no test can guard against a deliberately committed key |
| `data-poi-name` contains HTML entities (e.g., `&#39;`) | TC-207 asserts `length > 0` on attribute value — does not validate entity encoding; entity correctness is covered by existing HTML-validity tests |
| Language-independence regression (future dev hardcodes text in map widget tests) | TC-216 extends existing `language-independence.spec.ts` lint scan to cover new attribute |

---

## 9. Estimated Impact

- **New test count:** 16 test cases
  - TC-200 through TC-214: 14 tests (progression.spec.ts / poi-cards.spec.ts / responsive.spec.ts / structure.spec.ts)
  - TC-216: 1 test (code-quality/language-independence.spec.ts extension)
  - TC-217: 1 test (smoke.spec.ts addition)
  - TC-218 removed — duplicate of TC-200; TC-200 promoted with `@smoke` tag instead
- **Progression / Regression split:**
  - Progression (new behavior validated): TC-204, TC-205, TC-206, TC-207, TC-208, TC-209, TC-210, TC-211, TC-212 = **9 tests**
  - Regression (guards existing or new invariants): TC-200 (`@smoke`), TC-201, TC-202, TC-203, TC-213, TC-214, TC-216, TC-217 = **7 tests**
- **Tests that run without an API key (always-on in CI):** TC-200, TC-201, TC-202, TC-203, TC-207, TC-208, TC-209, TC-213, TC-216, TC-217 = **10 tests**
- **Tests that require `@with-key`:** TC-204, TC-205, TC-206, TC-210, TC-211, TC-212, TC-214 = **6 tests**
- **Estimated runtime increase:** ~4–6 seconds for untagged tests (filesystem reads + shared-page DOM assertions); `@with-key` suite adds ~8–12 seconds when run
- **Files modified:**
  - `automation/code/tests/regression/smoke.spec.ts` — add TC-217; tag TC-200 with `@smoke`
  - `automation/code/tests/regression/progression.spec.ts` — add TC-200, TC-201, TC-202, TC-203, TC-204, TC-205, TC-206, TC-210, TC-211, TC-213
  - `automation/code/tests/regression/poi-cards.spec.ts` — add TC-207, TC-208, TC-209
  - `automation/code/tests/regression/structure.spec.ts` — add TC-214
  - `automation/code/tests/regression/responsive.spec.ts` — add TC-212 (or new `day-map-widget.spec.ts`)
  - `automation/code/tests/code-quality/language-independence.spec.ts` — extend TC-216
  - `automation/code/tests/pages/TripPage.ts` — add map widget locators (5 new locators / methods)
  - `automation/code/tests/utils/markdown-place-ids.ts` — **new file**
