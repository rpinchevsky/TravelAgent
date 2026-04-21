# Business Requirements Document

**Change:** Interactive Google Maps Day Mini-Map (replace day-level route link)
**Date:** 2026-04-21
**Author:** Product Manager
**Status:** Draft

---

## 1. Background & Motivation

Each generated trip day currently includes a `🗺️ [Открыть маршрут дня на Google Maps]` text link in the day header that opens Google Maps Directions in a new browser tab. While functional, this link provides no at-a-glance spatial context — the user must leave the trip page to visualize the day's route, and no visual connection exists between the POI cards and a map.

The user has requested an embedded interactive mini-map per day — matching what the Claude desktop app shows — with all POIs plotted as numbered pins, each displaying its place photo and name. This feature elevates the trip page from a reference document to a self-contained planning tool: travelers can orient themselves spatially without leaving the page.

The current `📍 [Google Maps]` links on individual POI cards serve a different purpose (deep-linking to a specific place) and are NOT replaced by this feature. Only the day-level route link is superseded by the embedded map widget.

A key infrastructure gap must also be closed: the `place_id` returned by the Google Places API during trip generation is not currently persisted to the day markdown files. Without `place_id`, the Maps JavaScript API cannot render rich pins (photos + names). This BRD therefore has two tightly coupled concerns: a **data persistence change** (save `place_id` during generation) and a **rendering change** (embed the map widget in HTML).

---

## 2. Scope

**In scope:**
- Add `place_id` field to the per-POI markdown format in every `day_XX_LANG.md` file going forward
- Define a project-level configuration for the Google Maps API key (accessible to the renderer, not hardcoded)
- Replace the `🗺️` day-level route link in day markdown files with an embedded Google Maps JS widget in the rendered HTML
- The widget displays all day POIs as numbered pins; each pin shows the POI's place photo and name (via Maps JS API + Places API)
- Responsive widget (desktop and mobile)
- Graceful degradation to the existing `🗺️` route link if API key is absent or any POI is missing a `place_id`
- Language-agnostic implementation — all logic is structural, no language-specific strings
- Changes apply to ALL future trip generations (rules updated, not one-off)

**Out of scope:**
- Backfilling `place_id` into previously generated trip markdown files
- Routing / turn-by-turn directions inside the embedded map (the existing Google Maps Directions link covers this via the graceful fallback)
- Replacing the per-POI `📍 [Google Maps]` card links — those stay as-is
- Real-time traffic or transit overlays
- Map style customization beyond what Google Maps JS API provides by default
- Authentication flow for the Maps API key (domain restriction is an operational concern, not a rendering concern)

**Affected rule files:**
- `content_format_rules.md` — Per-Day File Format: add `place_id` to POI metadata block; add map widget placement rule
- `trip_planning_rules.md` — Layer 2 Google Places enrichment: mandate saving `place_id` to markdown
- `rendering-config.md` — Add map widget rendering rules; update Daily Route Map Link section; add graceful degradation logic
- `automation/scripts/generate_html_fragments.ts` — Implement map widget HTML generation
- New or updated project config file — Store Google Maps API key

---

## 3. Requirements

### REQ-001: Persist `place_id` per POI during trip generation

**Description:** During Phase B day generation, when Layer 2 Google Places enrichment is performed for a POI, the `place_id` returned by `mcp__google-places__maps_place_details` (or `mcp__google-places__maps_search_places`) must be saved into the day markdown file as part of the POI metadata block. This is the stable, canonical identifier required by the Maps JavaScript API to render rich pins.

**Acceptance Criteria:**
- [ ] AC-1: Every POI section in `day_XX_LANG.md` that was enriched via Google Places contains a `**place_id:** ChIJ...` line in its metadata block (after the links block, before the description)
- [ ] AC-2: POIs for which Google Places returned no result (graceful degradation path) omit the `**place_id:**` line entirely — no empty placeholder
- [ ] AC-3: The `place_id` line format is `**place_id:** {place_id_value}` — language-agnostic key name (ASCII, not translated)
- [ ] AC-4: `trip_planning_rules.md` Layer 2 section documents the `place_id` save requirement
- [ ] AC-5: `content_format_rules.md` Per-Day File Format template includes `**place_id:** {place_id}` in the POI metadata block example
- [ ] AC-6: Grocery store (`### 🛒`) and along-the-way stop (`### 🎯`) POIs also receive `place_id` when available from Google Places

**Priority:** Must-have

**Affected components:**
- `content_format_rules.md` (POI markdown format template)
- `trip_planning_rules.md` (Layer 2 enrichment instructions)
- Phase B day generation subagents (runtime behavior)

---

### REQ-002: Store Google Maps API key in project configuration

**Description:** A Google Maps API key is required to load the Maps JavaScript API (and Places API) in the rendered HTML. The key must be stored in a single, discoverable project-level config location — accessible to the rendering scripts at HTML generation time — and must never be hardcoded in templates or rendering scripts. The key should be domain-restricted (operational concern; documented as a setup note, not enforced by code).

**Acceptance Criteria:**
- [ ] AC-1: A project config file (e.g., `maps_config.md` or a dedicated section in `trip_details.md` base template) defines a `google_maps_api_key` field
- [ ] AC-2: The rendering script (`generate_html_fragments.ts`) reads the API key from this config at runtime; if the key is absent or blank, it falls back to graceful degradation (REQ-005)
- [ ] AC-3: The config file location and field name are documented in `rendering-config.md`
- [ ] AC-4: The API key value is never present in any committed template file, rule file, or script source — only in the config file (which may be `.gitignore`d)
- [ ] AC-5: The config file format is language-agnostic (key name is ASCII `google_maps_api_key`)

**Priority:** Must-have

**Affected components:**
- New config file (`maps_config.md` or equivalent)
- `rendering-config.md` (documents key location and lookup rule)
- `automation/scripts/generate_html_fragments.ts` (reads key at runtime)

---

### REQ-003: Render embedded Google Maps JS widget per day in HTML

**Description:** In the rendered HTML, each day section must include an embedded Google Maps JavaScript API widget that replaces the `<a class="map-link">` route link. The widget plots all POIs for that day as numbered pins. Each pin, when tapped/clicked, shows the POI's place photo (via Places API) and name. The widget is initialized with the day's POIs in visit order.

**Acceptance Criteria:**
- [ ] AC-1: Each `#day-{N}` section in `trip_full_LANG.html` contains a `<div class="day-map-widget" id="map-day-{N}">` element in place of the `<a class="map-link">` route link
- [ ] AC-2: The widget is positioned in the same location as the current map link — immediately after `<div class="day-card__content">` opening tag, before the itinerary table
- [ ] AC-3: The Maps JS API script tag is included once in the page `<head>` (not once per day), loaded with the API key from REQ-002 config
- [ ] AC-4: Each POI pin is numbered in visit order (1, 2, 3…) matching the POI card sequence
- [ ] AC-5: Clicking/tapping a pin opens an info window displaying the POI name and place photo (fetched via Places API `getDetails` with `fields: ['name', 'photos']`)
- [ ] AC-6: The map auto-fits its viewport to show all pins for that day (uses `bounds.extend` + `map.fitBounds`)
- [ ] AC-7: Only POIs with a valid `place_id` in the markdown are plotted as pins — POIs without `place_id` are excluded from pin rendering (they remain visible as POI cards)
- [ ] AC-8: The widget height is fixed at 280px on desktop, 220px on mobile (breakpoint: 768px); width is 100% of the day card content width
- [ ] AC-9: The `<div class="day-map-widget">` has `role="region"` and `aria-label` set to a language-agnostic attribute (populated from a localized string in the rendering config, or omitted if not configured)
- [ ] AC-10: The Maps JS API is loaded with `loading=async` and `callback` pattern to avoid render-blocking

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` (map widget placement and structure rules)
- `automation/scripts/generate_html_fragments.ts` (widget HTML generation)
- `base_layout.html` (Maps JS API script tag in `<head>`)

---

### REQ-004: Map widget is responsive (mobile-friendly)

**Description:** The embedded map widget must render correctly on mobile viewports. The widget must not overflow its container, must not break the sticky navigation, and must be touch-interactive (pinch-zoom, pan).

**Acceptance Criteria:**
- [ ] AC-1: On viewports < 768px, the widget height is 220px and width is 100% (no horizontal overflow)
- [ ] AC-2: The widget container uses `overflow: hidden` on itself only — no `overflow: hidden` is added to any parent container that would break sticky navigation (per existing Universal Sticky Navigation Rules)
- [ ] AC-3: Google Maps touch gestures (pinch-zoom, two-finger pan) work correctly on mobile
- [ ] AC-4: The Maps JS API `gestureHandling: 'cooperative'` option is set so that single-finger scroll does not get captured by the map (prevents scroll-trap on mobile)
- [ ] AC-5: Map widget passes WCAG 2.1 Level AA contrast requirements for any overlaid text (pin labels, info window text)

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` (responsive rules for map widget)
- `rendering_style_config.css` (map widget responsive CSS)
- `automation/scripts/generate_html_fragments.ts` (widget initialization options)

---

### REQ-005: Graceful degradation when API key or `place_id` is missing

**Description:** The map widget is an enhancement — the trip page must remain fully functional without it. If the Google Maps API key is not configured, or if a day has zero POIs with a `place_id`, the rendering pipeline must fall back to the existing `<a class="map-link">` route link behavior with no broken elements or console errors.

**Acceptance Criteria:**
- [ ] AC-1: If `google_maps_api_key` is absent or blank in config, `generate_html_fragments.ts` renders the `<a class="map-link">` route link (existing behavior) for all days — no `<div class="day-map-widget">` is emitted
- [ ] AC-2: If a day has at least one POI with a valid `place_id` but also has POIs without `place_id`, the widget renders with only the pinned POIs — missing-`place_id` POIs are silently excluded from pins (no error state)
- [ ] AC-3: If a day has zero POIs with `place_id` (all missing), the widget falls back to `<a class="map-link">` for that specific day only — other days in the same file may still render widgets
- [ ] AC-4: If the Maps JS API fails to load at runtime (network error, quota exceeded), the `<div class="day-map-widget">` displays a fallback `<a>` route link inside it (rendered server-side, hidden by JS when map loads successfully)
- [ ] AC-5: No JavaScript errors are thrown in the browser console when operating in degraded mode
- [ ] AC-6: The `<a class="map-link">` fallback link is constructed using the same URL format as the current day route link (`https://www.google.com/maps/dir/...`) — no change to existing fallback content

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` (degradation rules)
- `automation/scripts/generate_html_fragments.ts` (conditional rendering logic)

---

### REQ-006: Language-agnostic implementation

**Description:** The map widget implementation must contain no language-specific strings in logic, class names, data attributes, or test selectors. All user-visible text in the widget (if any) is either provided by the Maps JS API itself (POI names come from the markdown, not hardcoded) or uses a localized label resolved from the trip's reporting language at render time.

**Acceptance Criteria:**
- [ ] AC-1: CSS class names, element IDs, and `data-*` attributes introduced by this feature contain no language-specific characters (ASCII only)
- [ ] AC-2: Automation tests for the map widget use CSS selectors and `data-*` attributes only — no assertions on visible text strings that vary by language
- [ ] AC-3: The rendering script does not branch on language code for map widget generation — identical logic produces the widget for `ru`, `en`, `he`, or any other language
- [ ] AC-4: POI names displayed in pin info windows are sourced from the markdown `### {POI Name}` heading — they appear in whatever language the markdown was generated in (`poi_languages` format), not fetched from Google Places at render time
- [ ] AC-5: If an `aria-label` for the map region is desired, it is resolved from a per-language label map in `rendering-config.md` (same mechanism as other localized labels) — its absence does not break rendering

**Priority:** Must-have

**Affected components:**
- `rendering-config.md` (language-agnostic class/attribute names)
- `automation/scripts/generate_html_fragments.ts` (no language branching in map logic)
- Automation test specs (selector strategy)

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Google Maps JS API requires a billing-enabled Google Cloud project with Maps JavaScript API + Places API enabled | Document as a prerequisite in `rendering-config.md`; graceful degradation (REQ-005) ensures trips render without the key |
| `place_id` is only available for POIs successfully enriched via Google Places (Layer 2) — POIs that fall back to web-search-only will have no `place_id` | REQ-001 AC-2 and REQ-005 AC-2/AC-3 handle partial-coverage days; widget renders with available pins |
| Google Maps JS API key exposed in rendered HTML (client-side) is a security surface | Key must be domain-restricted via Google Cloud Console; document this requirement in `maps_config.md`; key is not a server secret in this use case (standard practice for frontend Maps embeds) |
| The Maps JS API `<script>` tag in `<head>` (REQ-003 AC-3) must not be duplicated when the HTML is assembled from multiple fragments | `generate_shell_fragments.ts` or `base_layout.html` owns the script tag — it is NOT emitted per fragment; assembly logic already handles one `<head>` per page |
| CSS inlining rule (Step 3 of rendering pipeline) requires `rendering_style_config.css` to be inlined — new map widget CSS must be added there | Map widget CSS additions go into `rendering_style_config.css`; the existing CSS inlining step covers it automatically |
| `base_layout.html` modification (adding Maps JS script tag to `<head>`) may affect regression tests that validate `<head>` structure | AE must update or add a regression test to verify the script tag is present and correctly parameterized when API key is configured |
| Regression tests must not assert on map widget presence when API key is absent (graceful degradation must not cause test failures) | Test plan must include both "with API key" and "without API key" test scenarios; the latter asserts `<a class="map-link">` is present instead of `.day-map-widget` |
| Hebrew RTL layout (`dir="rtl"`) may affect info window or map control positioning | Verify Maps JS API handles RTL natively (it does for `dir="rtl"` on `<html>`); document in REQ-006 AC-3 |

---

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | | | Approved / Rejected |
