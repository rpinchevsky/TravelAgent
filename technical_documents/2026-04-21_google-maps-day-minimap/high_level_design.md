# High-Level Design

**Change:** Interactive Google Maps Day Mini-Map (replace day-level route link)
**Date:** 2026-04-21
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-04-21_google-maps-day-minimap/business_requirements.md`
**Status:** Draft

---

## 1. Overview

This change introduces an embedded Google Maps JavaScript API widget per day in the rendered HTML, replacing the plain `<a class="map-link">` route link. It requires two coordinated sub-systems:

1. **Data enrichment (generation-time):** Each POI's `place_id` (returned by Google Places MCP tools during Layer 2 enrichment) is persisted into the day markdown file as a `**place_id:** ChIJ...` metadata line. This field is the stable identifier required by the Maps JS API to render rich numbered pins with place photos.

2. **HTML rendering (render-time):** `generate_html_fragments.ts` reads `maps_config.json` from the project root. When an API key is present and a day has at least one POI with a valid `place_id`, it emits a `<div class="day-map-widget">` block containing the map canvas and a server-rendered fallback `<a class="map-link">` (initially hidden by JS, revealed on failure). `generate_shell_fragments.ts` reads the same config and injects the Maps JS API `<script>` tag once into the page `<head>` via a new `{{MAPS_SCRIPT}}` placeholder in `base_layout.html`.

The `data-place-id` attribute is added to each `.poi-card` element. The client-side init script reads these attributes at DOMContentLoaded to initialize one `google.maps.Map` per day, place `AdvancedMarkerElement` pins with brand colors (navy/gold), and wire up `getDetails`-powered info windows on pin click.

Graceful degradation is unconditional: if `maps_config.json` is absent or the key is blank, zero changes are visible — all days render the original `<a class="map-link">`. If the JS API fails at runtime, the fallback link (already in DOM) becomes visible.

---

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| POI markdown format | `content_format_rules.md` | Modified — add `**place_id:**` field to Per-Day File Format template |
| Trip planning rules | `trip_planning_rules.md` | Modified — Layer 2 section: mandate saving `place_id` from MCP response |
| Rendering rules | `rendering-config.md` | Modified — add day map widget rules, `data-place-id` on poi-card, `{{MAPS_SCRIPT}}` placeholder, graceful degradation |
| HTML shell template | `base_layout.html` | Modified — add `{{MAPS_SCRIPT}}` placeholder before `</body>` |
| CSS design system | `rendering_style_config.css` | Modified — add `.day-map-widget` component CSS (shimmer, responsive heights, RTL, print) |
| Fragment generator | `automation/scripts/generate_html_fragments.ts` | Modified — parse `place_id` per POI, add `data-place-id` to poi-card, emit `.day-map-widget` block, read `maps_config.json` |
| Shell generator | `automation/scripts/generate_shell_fragments.ts` | Modified — read `maps_config.json`, inject `{{MAPS_SCRIPT}}` into shell output |
| Maps API key config | `maps_config.json` (new file, project root) | New — stores `google_maps_api_key`; gitignored |
| `.gitignore` | `.gitignore` | Modified — add `maps_config.json` |

---

## 3. Data Flow

```
GENERATION TIME
────────────────
Phase B subagent
  ├─ Layer 2: mcp__google-places__maps_place_details(place_id)
  └─ Writes to day_XX_LANG.md:
       **place_id:** ChIJ...      ← new persisted field

RENDER TIME (generate_html_fragments.ts)
──────────────────────────────────────────
maps_config.json  →  read google_maps_api_key
     │
     ├─ Key present + day has ≥1 place_id POI
     │    └─ poi-card: <div class="poi-card" data-place-id="ChIJ..." id="poi-day-N-M">
     │    └─ emit: <div class="day-map-widget" data-map-day="N">
     │              <div id="day-map-N" class="day-map-widget__canvas" tabindex="0">
     │              <a class="map-link day-map-widget__fallback" ...> (hidden by JS)
     │    └─ pin data: <div data-place-id="ChIJ..." data-poi-name="..."> (in init script)
     │
     └─ Key absent OR day has 0 place_id POIs
          └─ emit: <a class="map-link" ...>  (original behavior)

RENDER TIME (generate_shell_fragments.ts)
──────────────────────────────────────────
maps_config.json  →  read google_maps_api_key
     │
     ├─ Key present
     │    └─ MAPS_SCRIPT = <script async> + inline initDayMaps function
     │
     └─ Key absent or blank
          └─ MAPS_SCRIPT = ""  (empty string)

ASSEMBLY (base_layout.html)
────────────────────────────
{{MAPS_SCRIPT}} placeholder in <head> → substituted with above value
```

---

## 4. Integration Points

### 4.1 Existing contracts preserved
- Every `.poi-card` retains all existing classes and `id="poi-day-{D}-{N}"` anchor. `data-place-id` is an additive attribute only.
- The `<a class="map-link">` element is always present in the DOM (inside `.day-map-widget` when widget is active, or standalone when degraded). Existing test assertions on `.map-link` continue to pass.
- `base_layout.html` retains all five existing placeholders (`{{PAGE_TITLE}}`, `{{NAV_LINKS}}`, `{{NAV_PILLS}}`, `{{TRIP_CONTENT}}`, `{{HTML_LANG_ATTRS}}`). One new placeholder `{{MAPS_SCRIPT}}` is added.
- CSS inlining step (assembly §3) is unaffected — new widget CSS is in `rendering_style_config.css` and gets inlined automatically.

### 4.2 New contracts
- `maps_config.json` schema: `{ "google_maps_api_key": "AIza..." }`. If file absent or key blank, renderer produces identical output to pre-feature behavior.
- `generate_shell_fragments.ts` writes `MAPS_SCRIPT` field into `shell_fragments_{lang}.json`. The assembly step reads it alongside existing fields.
- `parseDayFile()` parses `**place_id:**` lines and populates `PoiData.placeId`. Existing parse logic for other `**bold:**` lines is not affected.

---

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Existing day markdown files (no `place_id`) | Renderer falls back to `<a class="map-link">` for those days — no widget rendered | Yes |
| POI card HTML structure | `data-place-id` attribute added when place_id present; absent when not. No structural change. | Yes |
| `<a class="map-link">` selector in tests | Link is always in DOM (inside widget or standalone). Selector still works. | Yes |
| `base_layout.html` | `{{MAPS_SCRIPT}}` added before `</body>`. Empty string when no API key — produces no visible change. | Yes |
| CSS inlining (assembly) | New `.day-map-widget` CSS added to `rendering_style_config.css` → inlined automatically | Yes |
| Print output | `.day-map-widget` is `display:none` in print; fallback link is `display:block`. Printed URL preserved. | Yes |
| RTL (Hebrew) trips | Maps API auto-mirrors controls; shimmer keyframe direction is reversed via `[dir="rtl"]` CSS | Yes |
| Dark mode | Widget container uses CSS token variables that auto-switch. Map tiles stay light (v1 known limitation). | Yes (v1 limitation documented) |

---

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Persist `place_id` per POI | Yes | §3 (generation-time data flow), §2 (content_format_rules.md + trip_planning_rules.md changes) |
| REQ-002: Store Google Maps API key | Yes | §3 (maps_config.json → renderer), §2 (new config file), §4.2 (key contract) |
| REQ-003: Render embedded widget per day | Yes | §3 (render-time data flow), §2 (generate_html_fragments.ts + base_layout.html) |
| REQ-004: Responsive mobile-friendly | Yes | §2 (CSS), §5 (no overflow on parents) |
| REQ-005: Graceful degradation | Yes | §3 (degradation paths), §5 (backward compatible for files without place_id) |
| REQ-006: Language-agnostic | Yes | §4.1 (no language strings in classes/attributes), §5 (RTL/dark mode backward compat) |
