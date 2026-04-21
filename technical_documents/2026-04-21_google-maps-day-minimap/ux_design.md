# UX Design Document

**Change:** Interactive Google Maps Day Mini-Map (replace day-level route link)
**Date:** 2026-04-21
**Author:** UX/UI Principal Engineer
**BRD Reference:** `technical_documents/2026-04-21_google-maps-day-minimap/business_requirements.md`
**Status:** Draft

---

## 1. Overview

Each day card currently opens Google Maps in a new tab — the user loses context and returns to find their scroll position unchanged. The embedded mini-map replaces that text link with an interactive map widget directly inside the day card: numbered pins for every POI in visit order, tap a pin to see the place photo and name, all without leaving the page.

The goal is spatial orientation at a glance. The traveler scanning Day 3 should understand immediately whether the day is compact (pins clustered) or spread across the city (pins far apart), and be able to mentally connect "Pin 2" to the POI card below it. This transforms the trip page from a reading document into a planning tool.

---

## 2. User Flow

```
User scrolls to a day card
  └─ Sees embedded map widget (280px tall on desktop) between banner and itinerary table
       ├─ Map auto-fits to show all numbered pins for the day
       │    ├─ Tap/click a numbered pin
       │    │    └─ Info window opens: POI name + place photo (via Places API)
       │    │         └─ User reads, dismisses info window (click elsewhere or × button)
       │    └─ Pinch-zoom or pan to explore nearby area
       └─ Scrolls down to itinerary table and POI cards below
            └─ Activity labels in itinerary table still anchor-link to POI cards (unchanged)

Graceful degradation path (no API key, or day has 0 POIs with place_id):
  └─ Text link "🗺️ Open Day Route on Google Maps" appears instead (existing behavior)
       └─ Opens Google Maps Directions in new tab (unchanged)

JS runtime failure path:
  └─ Map tile fails to load
       └─ Fallback <a> route link (server-rendered inside widget, hidden by JS on success)
            becomes visible automatically
```

---

## 3. Placement & Navigation

| Element | Location | Rationale |
|---|---|---|
| Map widget | Inside `.day-card__content`, immediately after the opening tag, **before** `.itinerary-table-wrapper` | Matches the exact position of the existing `<a class="map-link">` per `rendering-config.md` §Daily Route Map Link. The map is orientation context — it must precede the schedule table, not follow it. A traveler reads: banner → map → schedule → POI cards. Placing it after the table would bury it below dense content where it loses its "first impression" value. |
| Fallback route link | Inside `.day-map-widget`, server-rendered, visually identical to existing `<a class="map-link">` | Preserves the existing user mental model if the map does not load. Hidden via JS class when the map initializes successfully. |
| Maps JS API script | `<head>` of `base_layout.html`, loaded once per page | Single `<script>` tag with `loading=async` and `callback=initDayMaps`. Widget containers are inert `<div>` elements until the API fires the callback. No per-day script duplication. |

---

## 4. Layout & Wireframes

### 4.1 Day Card — Desktop (≥768px)

```
┌─────────────────────────────────────────────────────────────────┐
│  .day-card__banner                                              │
│  Day 1 — Gamla Staden, Ribersborg & Taproom Saturday           │
│  Saturday, May 2, 2026                                          │
└─────────────────────────────────────────────────────────────────┘
│  .day-card__content                                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  .day-map-widget   role="region"  id="map-day-1"          │  │
│  │  height: 280px   width: 100%   overflow: hidden           │  │
│  │                                                           │  │
│  │   [Google Maps tiles — auto-fit to day's pin bounds]      │  │
│  │                                                           │  │
│  │    ①②③④  (numbered pins in visit order)                 │  │
│  │                                                           │  │
│  │   [Google Maps controls: zoom +/-, fullscreen, map/sat]   │  │
│  │                                                           │  │
│  │  ─ ─ ─ ─ ─ (skeleton shimmer until tiles load) ─ ─ ─ ─  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  .itinerary-table-wrapper                                 │  │
│  │  | Time  | Activity        | Details         |           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│  .itinerary-grid  (POI cards below)                            │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Day Card — Mobile (<768px)

```
┌──────────────────────────────────┐
│  .day-card__banner               │
│  Day 1 — ...                     │
│  Saturday, May 2, 2026           │
└──────────────────────────────────┘
│  .day-card__content              │
│  ┌──────────────────────────┐    │
│  │  .day-map-widget         │    │
│  │  height: 220px  w: 100%  │    │
│  │                          │    │
│  │  [Map tiles, numbered    │    │
│  │   pins, zoom controls]   │    │
│  │                          │    │
│  └──────────────────────────┘    │
│                                  │
│  [itinerary table — scrolls]     │
│  [POI cards — scrolls]           │
└──────────────────────────────────┘
```

**Mobile height rationale:** 220px on a 375px-wide device is 59% of viewport height — enough to show spatial context without dominating the screen. At 280px it would consume 75% of a small iPhone screen before the user even sees the day's schedule.

### 4.3 Info Window (pin tap)

```
┌─────────────────────────────────┐
│  [Place photo — 120px tall]     │
│  POI Name                       │
│                            [×]  │
└─────────────────────────────────┘
```

Photo comes from `Places API getDetails({ fields: ['name', 'photos'] })` triggered on first tap only (lazy). POI name is sourced from the markdown heading (language-matched). The `×` dismiss is the Maps JS API native info window close button — no custom implementation needed.

### 4.4 Loading State (skeleton)

```
┌──────────────────────────────────────────────┐
│                                              │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│   ░░  skeleton shimmer animation  ░░░░░░    │
│   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░    │
│                                              │
└──────────────────────────────────────────────┘
```

The `.day-map-widget` renders with a CSS shimmer background by default (class `.day-map-widget--loading`). JS removes this class once the Maps API fires `tilesloaded` on that map instance. If tiles never load (network error), the shimmer is replaced by the visible fallback link.

---

## 5. Component Specifications

### 5.1 Day Map Widget Container

**Visual:**
- Dimensions: height 280px (desktop ≥768px) / 220px (mobile <768px); width 100%
- Background (loading state): shimmer gradient `linear-gradient(90deg, var(--color-surface-raised) 25%, var(--color-border) 50%, var(--color-surface-raised) 75%)` animated left-to-right
- Border radius: `var(--radius-container)` (12px) — matches `.card`, `.poi-card`, `.day-card` containers
- `overflow: hidden` — clips map tiles and rounded corners. Applied to `.day-map-widget` only — never to parent `.day-card__content` or `.day-card` (which already has `overflow: hidden` from the CSS but that is for the banner; the content div must remain open for sticky nav compliance)
- Margin bottom: `var(--space-4)` (24px) — same spacing as the existing `<a class="map-link">` separation from the table
- Box shadow: none — the widget lives inside `.day-card__content` which is already elevated; double shadow would look heavy

**States:**
- Loading: shimmer background visible; map div has `.day-map-widget--loading` class
- Loaded: shimmer removed; Google Maps tiles fill the container
- Error / fallback: map div hidden; `.day-map-widget__fallback` `<a>` link becomes visible (styled identically to existing `.map-link`)
- Focused (keyboard): the `<div>` has `tabindex="0"`; when focused, shows `outline: var(--focus-ring); outline-offset: var(--focus-ring-offset)` (2px gold, matches system-wide focus ring)

**Behavior:**
- Map is initialized with `gestureHandling: 'cooperative'` — single-finger scroll passes through to page scroll on mobile; two-finger scroll zooms map
- `disableDefaultUI: false` — default Google Maps controls (zoom, fullscreen, map/satellite toggle) are preserved
- `mapTypeControl: false` — map/satellite toggle is suppressed to keep the widget lean; it can be added later
- Map auto-fits viewport: after markers are placed, `map.fitBounds(bounds)` is called; if only one pin, `map.setZoom(15)` and `map.setCenter(pin)` are used instead (fitBounds on a single point produces an excessively tight zoom)

### 5.2 Numbered Pin Markers

**Visual:**
- Uses Google Maps JavaScript API `AdvancedMarkerElement` (Marker V2) with a custom `PinElement`
- Pin background color: `#1A3C5E` (CSS token `--color-brand-primary` deep navy) — visually distinct from the red Google Maps default, consistent with the trip page brand palette
- Pin glyph: `1`, `2`, `3`… rendered in white (`#FAFAFA` = `--color-text-inverse`) at 11px bold
- Pin border color: `#C9972B` (`--color-brand-accent` warm gold) — 1px border on the pin for brand alignment and visual pop against diverse map backgrounds
- Scale: default `PinElement` scale (26px height approximately); no custom SVG needed

**States:**
- Default: navy pin with gold border, white number
- Hovered (pointer over marker): Maps API handles built-in hover cursor change; no custom state needed
- Info window open: Maps API shows info window anchored to pin tip; pin remains visible beneath window

**Behavior:**
- Click/tap: fires `marker.addListener('click', ...)` → `service.getDetails({ placeId, fields: ['name', 'photos'] }, callback)` → opens `InfoWindow`
- Only one info window open at a time — opening a second closes the first (standard pattern: one shared `InfoWindow` instance reused across all markers per day map)
- Keyboard: `AdvancedMarkerElement` supports focus and Enter/Space to trigger click (built into Maps API)

### 5.3 Info Window Content

**Visual:**
- Photo: `<img>` from `place.photos[0].getUrl({ maxWidth: 300, maxHeight: 120 })` — 16:9-ish crop
- Name: `<strong>` element, POI name sourced from markdown (passed as `data-poi-name` attribute on the marker element, not fetched from Places API at runtime)
- Max width: 220px — keeps info window compact on mobile
- Photo `onerror`: hides the `<img>` element if the photo URL fails (same pattern as POI card inline images in rendering-config.md)

**First-tap lazy loading:**
- `getDetails` is called only on marker click, not during map init — avoids Places API quota consumption for days the user never taps
- A loading spinner SVG (16×16, `--color-brand-accent-alt` teal) is shown inside the info window while `getDetails` resolves
- On error from `getDetails`, info window shows name only (no photo placeholder text needed — absent photo is acceptable)

---

## 6. Interaction Patterns

| Interaction | Trigger | Behavior | Duration |
|---|---|---|---|
| Widget appears in DOM | Page load | Static HTML — no animation. Widget is always present if API key and place_ids are available. | Immediate |
| Map tiles load | Maps API `tilesloaded` event | Remove `.day-map-widget--loading` class (removes shimmer); pins snap into place | Instant (no transition) |
| Pin tap — info window open | `click` on `AdvancedMarkerElement` | Close previous info window (if open); call `getDetails`; show loading spinner; replace spinner with photo + name | 0ms (JS sync open) + async photo load |
| Info window close | Click outside, or info window `×` | Maps API default dismiss behavior | Instant |
| Fallback link reveal | Maps JS API fails to load | `.day-map-widget__fallback` shown; map div hidden via `.day-map-widget--error` class | Immediate |
| Skeleton shimmer | While tiles loading | CSS animation: `@keyframes shimmer` background-position slide left-to-right | 1.5s infinite ease-in-out |
| POI card highlight | User clicks activity label (existing) | `poi-card:target` pulse animation (existing CSS, unchanged) | 1.5s ease-out |

---

## 7. Responsive Behavior

| Breakpoint | Layout Change |
|---|---|
| Desktop (≥768px) | Map widget height: **280px**; width: 100% of `.day-card__content` padding box. Sidebar visible; no mobile nav. |
| Mobile (<768px) | Map widget height: **220px**; width: 100%. Horizontal overflow prevented by `overflow: hidden` on widget. Mobile pill nav remains sticky above day cards. |
| Print | `.day-map-widget` has `display: none` in print styles — the fallback `<a>` link (always server-rendered inside the widget) is revealed via print CSS so the route URL is accessible in printed output. |

**Note on tablet (768px–1023px):** Uses the desktop height (280px) since sidebar is not yet visible at this range — the extra map height is acceptable given the wider viewport. The breakpoint is `max-width: 767px` for the mobile height rule, consistent with existing car rental responsive rules.

---

## 8. Accessibility

- **ARIA role:** `<div class="day-map-widget" role="region" aria-labelledby="map-day-{N}-label">` where `aria-labelledby` references a visually-hidden `<span id="map-day-{N}-label">` containing the localized map region label (resolved from per-language label map in `rendering-config.md`, same mechanism as other localized labels; omitted entirely if not configured rather than emitting an empty attribute).
- **Keyboard:** `tabindex="0"` on the map container lets keyboard users tab to the map region. Google Maps JS API `AdvancedMarkerElement` instances are natively focusable and respond to Enter/Space for info window open. Tab through markers in DOM order (visit order 1→N).
- **Screen reader:** The visually-hidden label announces the map region identity. Each `AdvancedMarkerElement` should have `title` set to the POI name (passed as `data-poi-name`) — this is the accessible name read by screen readers. The fallback `<a>` link (always in DOM) is accessible to screen readers even when the map is visible (it has `aria-hidden="true"` applied by JS when the map loads successfully; before JS fires it reads as a normal link).
- **Contrast:** Google Maps tiles and pin labels are rendered by the Maps API — the pin design uses white glyphs on navy (#1A3C5E) background. White-on-navy contrast ratio is 10.8:1, exceeding WCAG AA 4.5:1 for normal text and 3:1 for UI components.
- **Touch targets:** Pins are approximately 26px tall — below the 44×44px WCAG touch target recommendation. However, Google Maps pins have a wider tap target than their visual footprint (Maps API adds invisible tap area). Accept this limitation: resizing pins would visually overpower a day with 5–6 pins. Document as a known limitation.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` suppresses the shimmer animation; widget shows a static grey background instead.

---

## 9. RTL Support

| Element | LTR | RTL |
|---|---|---|
| Map widget container | `margin-left: 0` (full width) | Unchanged — map is 100% width, no directional margins |
| Map controls (zoom, fullscreen) | Bottom-right (Google Maps default) | Google Maps JS API natively detects `dir="rtl"` on the `<html>` element and mirrors control placement to bottom-left automatically |
| Info window anchor | Pin tip, below marker | Unchanged — Maps API handles anchor direction |
| Fallback `<a>` link | Left-aligned text | `[dir="rtl"] .day-map-widget__fallback { text-align: right; }` — consistent with RTL text direction |
| Shimmer animation | Slides left-to-right | `[dir="rtl"] .day-map-widget--loading` reverses `background-position` keyframe direction |
| Pin glyph numbers | 1, 2, 3… (visit order) | Unchanged — numerals are direction-neutral in Maps API |

**Key finding on RTL:** The Google Maps JavaScript API reads `document.documentElement.dir` and automatically mirrors UI controls for RTL pages. No custom JS is needed. The only CSS additions needed are the fallback link text-align and shimmer direction reversal.

---

## 10. Dark Mode

| Element | Light Mode | Dark Mode |
|---|---|---|
| Widget container background (loading) | `var(--color-surface-raised)` (#F2F0EC) shimmer | `var(--color-surface-raised)` (#1F3247) shimmer — token auto-switches via `prefers-color-scheme` |
| Shimmer highlight | `var(--color-border)` (rgba 0,0,0,0.10) | `var(--color-border)` (rgba 255,255,255,0.10) — token auto-switches |
| Pin background | `#1A3C5E` (--color-brand-primary) | Same (#1A3C5E) — navy is readable on both light and dark map tiles; no override needed |
| Pin border | `#C9972B` (--color-brand-accent) | `#D4A83A` (dark mode accent override) — token auto-switches via `:root` dark override in CSS |
| Map tiles | Google Maps light style (default) | Google Maps does not auto-detect `prefers-color-scheme`; the Maps API `styles` array or `mapId` would be needed for dark tile styles. **Decision: out of scope for v1.** Map tiles remain light even in dark mode. This is a known limitation documented in rendering-config.md. |
| Info window | White background, dark text (Maps API default) | Unchanged — Maps API info window does not respect CSS custom properties. Acceptable for v1. |
| Fallback link | `var(--color-brand-accent-alt)` teal — matches existing `.map-link` style | Auto-switches via token |

---

## 11. Design Consistency Check

| Pattern | Existing/New | Reference |
|---|---|---|
| `border-radius: var(--radius-container)` (12px) on new widget | Existing | `.card`, `.poi-card`, `.day-card`, `.accommodation-card` in CSS §6, §8 |
| `overflow: hidden` on widget only (not on parent) | Existing constraint | `rendering-config.md` §Universal Sticky Navigation Rules — no overflow on parent containers |
| Shimmer skeleton loading state | New | No existing skeleton in the CSS; new `@keyframes shimmer` added |
| `onerror` image hide pattern | Existing | POI card `__image-wrapper` uses `onerror="this.parentElement.style.display='none'"` — info window uses `onerror="this.style.display='none'"` (same intent) |
| `data-*` attribute for test targeting | Existing | `data-link-type` on all POI card links; map widget uses `data-map-day` attribute on container |
| Brand color for interactive element | Existing | `.sidebar__link.is-active` uses `--color-brand-accent`; pin border uses same token |
| Fallback graceful degradation | Existing pattern | Accommodation section falls back to no-section if file missing; map falls back to text link |
| `aria-hidden="true"` on decorative SVGs | Existing | All icon SVGs in POI cards have `aria-hidden="true"` |
| Visually-hidden accessible labels | Existing | `.sr-only` utility class already in CSS §13 |
| `role="region"` on widget container | New for map widget; pattern exists elsewhere | Accommodation section uses `role="region"` per rendering-config.md |
| `gestureHandling: 'cooperative'` | New Maps API pattern | BRD REQ-004 AC-4 mandates this; no existing equivalent |
| Print `display: none` for map | Existing pattern | `.sidebar`, `.mobile-nav` are `display: none !important` in print styles §15; map widget added to same rule |

---

## 12. BRD Coverage Matrix

| Requirement | UX Addressed? | Section |
|---|---|---|
| REQ-001: Persist `place_id` per POI | N/A | No UX surface — backend data rule only |
| REQ-002: Store Google Maps API key in config | N/A | No UX surface — config/script concern; graceful degradation is UX-addressed in §3 and §5.1 |
| REQ-003: Render embedded Google Maps JS widget per day | Yes | §3 (placement), §4 (wireframes), §5.1 (container), §5.2 (pins), §5.3 (info window), §6 (interactions) |
| REQ-003 AC-8: Heights 280px desktop / 220px mobile | Yes | §5.1 (dimensions), §7 (responsive) |
| REQ-003 AC-9: `role="region"` + `aria-label` | Yes | §8 (accessibility) |
| REQ-003 AC-10: `loading=async` + callback pattern | N/A | Script/implementation concern; UX impact addressed via loading state in §5.1 and §6 |
| REQ-004: Responsive mobile-friendly | Yes | §7 (responsive), §5.1 (overflow: hidden on widget only), §5.1 (gestureHandling cooperative) |
| REQ-004 AC-2: No overflow on parent containers | Yes | §5.1 explicitly calls this out; §11 references existing constraint |
| REQ-004 AC-4: `gestureHandling: 'cooperative'` | Yes | §5.1 behavior spec |
| REQ-005: Graceful degradation | Yes | §2 (user flow — degradation paths), §3 (placement of fallback), §4.1/4.2 (fallback in wireframe), §5.1 (error state), §6 (fallback reveal interaction), §10 (dark mode fallback) |
| REQ-006: Language-agnostic implementation | Yes | §3 (ASCII class names), §8 (aria-label mechanism language-neutral), §9 (RTL), §11 (consistency check on data-* attributes) |

---

## 13. Approval Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| Product Manager | | | Approved / Rejected |
| Dev Team Lead | | | Approved / Rejected |
| UX/UI Principal Engineer | | 2026-04-21 | Self-approved |

**Conditions:**
- [ ] Dev confirms `AdvancedMarkerElement` (Maps JS API v3.55+) is available in the target API version loaded in `base_layout.html`. If not, fall back to legacy `Marker` with custom icon SVG (same visual spec).
- [ ] Dark map tiles (matching `prefers-color-scheme: dark`) are explicitly deferred to a future change. Document in `rendering-config.md` as a known v1 limitation.
- [ ] Touch target size for pins (26px, below 44×44px WCAG recommendation) is accepted as a known limitation of the Google Maps default pin size. Document in `rendering-config.md`.
