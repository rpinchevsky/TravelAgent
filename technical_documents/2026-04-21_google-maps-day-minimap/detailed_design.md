# Detailed Design

**Change:** Interactive Google Maps Day Mini-Map (replace day-level route link)
**Date:** 2026-04-21
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-04-21_google-maps-day-minimap/high_level_design.md`
**Status:** Draft

---

## 1. File Changes

### 1.1 `content_format_rules.md`

**Action:** Modify

**Current state (Per-Day File Format POI block):**
```
### {POI Name 1}

📍 [Google Maps](https://maps.google.com/...)
🌐 [Сайт](https://...)
📸 [Фото Google](https://www.google.com/maps/place/...)
📞 Телефон: +36 1 234 5678
⭐ 4.5/5 (2,340 отзывов)
♿ Доступно для колясок
**Image:** https://upload.wikimedia.org/wikipedia/commons/thumb/...

{Full POI content per Content Guidelines below}
```

**Target state (add `**place_id:**` line after the links block, before `**Image:**`):**
```
### {POI Name 1}

📍 [Google Maps](https://maps.google.com/...)
🌐 [Сайт](https://...)
📸 [Фото Google](https://www.google.com/maps/place/...)
📞 Телефон: +36 1 234 5678
⭐ 4.5/5 (2,340 отзывов)
♿ Доступно для колясок
**place_id:** ChIJN1t_tDeuEmsRUsoyG83frY4
**Image:** https://upload.wikimedia.org/wikipedia/commons/thumb/...

{Full POI content per Content Guidelines below}
```

**Rationale:** The `place_id` is a stable Google Places identifier returned by `mcp__google-places__maps_place_details`. It must be persisted alongside other structured Google Places fields (phone, rating) so the renderer can use it for Maps JS API widget initialization. Using a `**bold:**` key-value format is consistent with the existing `**Image:**` field pattern.

**Additional change — Daily Route Map Link section:**
Add a note below the existing format rule:
```
- **HTML rendering:** When `maps_config.json` has a valid `google_maps_api_key` and the day has at least one POI with a `**place_id:**` line, the `/render` skill replaces this markdown line with a `<div class="day-map-widget">` widget containing an embedded Google Maps canvas. The original route URL is preserved as a hidden fallback `<a class="map-link">` inside the widget, revealed if the Maps JS API fails to load.
```

---

### 1.2 `trip_planning_rules.md`

**Action:** Modify

**Current state (Layer 2: Google Places API — end of section):**
```
- **Scope limitation:** Google Places does NOT replace web fetch for narrative content ...
- **Default wheelchair behavior:** If the trip details file does not contain a `Wheelchair accessible` field, treat as `wheelchair accessible: no`.
```

**Target state (add after the existing bullet points in the Layer 2 section):**
```
- **place_id persistence (Mandatory):** After calling `mcp__google-places__maps_place_details` for a POI, save the returned `place_id` into the day markdown file as `**place_id:** {place_id_value}` — a line by itself in the POI metadata block, after the links/phone/rating/accessibility block and before the `**Image:**` line. Omit the line entirely if Google Places returned no result for this POI (no empty placeholder). This field is required for the Maps JS widget to render rich numbered pins. Applies to all POI types: main attractions, restaurants, grocery stores (`### 🛒`), and along-the-way stops (`### 🎯`).
```

**Rationale:** The `place_id` returned by the MCP tool is currently discarded after enrichment. This rule makes it mandatory to persist it in the markdown so it is available at render time.

---

### 1.3 `rendering-config.md`

**Action:** Modify

**Current state (Daily Route Map Link section):**
```
### Daily Route Map Link
- **Placement:** Render `<a class="map-link">` **before** the `<div class="itinerary-table-wrapper">`, immediately after the `<div class="day-card__content">` opening tag.
- Do NOT place it after the itinerary table.
```

**Target state (replace with full widget spec):**
```
### Daily Route Map Link / Day Map Widget

#### Behavior
- When `maps_config.json` (project root) contains a non-blank `google_maps_api_key` AND the day has at least one POI with a valid `data-place-id` attribute, render the full **Day Map Widget** (see structure below).
- When the API key is absent/blank OR the day has zero POIs with `place_id`, render the original fallback only: `<a class="map-link" href="{dir_url}" target="_blank" rel="noopener noreferrer">🗺️ {label}</a>`.
- **Placement:** Immediately after `<div class="day-card__content">` opening tag, **before** `<div class="itinerary-table-wrapper">`.
- Do NOT place after the itinerary table.

#### Day Map Widget Structure
```html
<div class="day-map-widget" data-map-day="{N}" role="region" aria-labelledby="map-day-{N}-label">
  <span id="map-day-{N}-label" class="sr-only">{localized map region label — from MAP_ARIA_LABELS table; omit span+aria-labelledby if label absent}</span>
  <div id="day-map-{N}" class="day-map-widget__canvas" tabindex="0"></div>
  <a class="map-link day-map-widget__fallback" href="{existing maps/dir URL}"
     target="_blank" rel="noopener noreferrer" aria-hidden="true">
    🗺️ {mapLinkLabel}
  </a>
</div>
```

#### POI card: `data-place-id` attribute
When a POI section in the markdown contains a `**place_id:** {value}` line, the rendered `.poi-card` MUST include `data-place-id="{value}"` on the root `<div>`:
```html
<div class="poi-card" id="poi-day-{D}-{N}" data-place-id="ChIJ...">
```
When no `place_id` is present, the attribute is omitted entirely.

#### POI card: `data-poi-name` attribute
Always emit `data-poi-name="{POI name}"` on every `.poi-card` root `<div>` (regardless of place_id). Used by the init script to populate info window names without a Places API call:
```html
<div class="poi-card" id="poi-day-{D}-{N}" data-place-id="ChIJ..." data-poi-name="Stortorget">
```

#### `{{MAPS_SCRIPT}}` placeholder
`base_layout.html` contains `{{MAPS_SCRIPT}}` before `</body>`. `generate_shell_fragments.ts` substitutes:
- **Key present:** A `<script async>` tag loading the Maps JS API with `callback=initDayMaps` + an inline `<script>` block containing the `initDayMaps` function (see JS specification below).
- **Key absent or blank:** Empty string — `{{MAPS_SCRIPT}}` replaced with nothing.

#### Maps JS API Script Injection (generate_shell_fragments.ts)
```html
<script>
(function() {
  window.__mapsApiKey = "AIza...";
})();
</script>
<script async
  src="https://maps.googleapis.com/maps/api/js?key=AIza...&libraries=places,marker&v=weekly&callback=initDayMaps">
</script>
<script>
function initDayMaps() {
  var widgets = document.querySelectorAll('.day-map-widget[data-map-day]');
  widgets.forEach(function(widget) {
    var dayN = widget.getAttribute('data-map-day');
    var canvas = document.getElementById('day-map-' + dayN);
    var fallback = widget.querySelector('.day-map-widget__fallback');
    if (!canvas) return;

    // Collect POI cards with place_id for this day
    var daySection = document.getElementById('day-' + dayN);
    if (!daySection) return;
    var poiCards = Array.prototype.slice.call(
      daySection.querySelectorAll('.poi-card[data-place-id]')
    );
    if (!poiCards.length) {
      // No pinnable POIs — show fallback
      widget.classList.add('day-map-widget--error');
      if (fallback) { fallback.removeAttribute('aria-hidden'); }
      return;
    }

    var map = new google.maps.Map(canvas, {
      gestureHandling: 'cooperative',
      mapTypeControl: false,
      fullscreenControl: true,
      streetViewControl: false
    });

    var bounds = new google.maps.LatLngBounds();
    var infoWindow = new google.maps.InfoWindow({ maxWidth: 220 });
    var service = new google.maps.places.PlacesService(map);
    var markers = [];

    poiCards.forEach(function(card, i) {
      var placeId = card.getAttribute('data-place-id');
      var poiName = card.getAttribute('data-poi-name') || String(i + 1);
      var pinNum = i + 1;

      var pin = new google.maps.marker.PinElement({
        background: '#1A3C5E',
        borderColor: '#C9972B',
        glyphColor: '#FAFAFA',
        glyph: String(pinNum)
      });

      var marker = new google.maps.marker.AdvancedMarkerElement({
        map: map,
        title: poiName,
        content: pin.element
      });

      // We geocode via getDetails to get lat/lng AND photos at once
      service.getDetails({ placeId: placeId, fields: ['name', 'geometry', 'photos'] }, function(place, status) {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place || !place.geometry || !place.geometry.location) {
          return;
        }
        marker.position = place.geometry.location;
        bounds.extend(place.geometry.location);

        // Once all markers placed, fit bounds
        var placed = markers.filter(function(m) { return m.position; }).length;
        if (placed === poiCards.length) {
          if (placed === 1) {
            map.setCenter(place.geometry.location);
            map.setZoom(15);
          } else {
            map.fitBounds(bounds);
          }
        }

        // Pre-fetch photo URL (lazy — only used on click)
        var photoUrl = null;
        if (place.photos && place.photos.length > 0) {
          photoUrl = place.photos[0].getUrl({ maxWidth: 300, maxHeight: 120 });
        }

        marker.addListener('click', function() {
          var content = '<div style="max-width:200px">';
          if (photoUrl) {
            content += '<img src="' + photoUrl + '" style="width:100%;height:auto;border-radius:4px;margin-bottom:6px" onerror="this.style.display=\'none\'">';
          }
          content += '<strong style="font-size:14px">' + (place.name || poiName) + '</strong>';
          content += '</div>';
          infoWindow.setContent(content);
          infoWindow.open({ map: map, anchor: marker });
        });
      });

      markers.push(marker);
    });

    // Remove loading shimmer and show fallback on error
    map.addListener('tilesloaded', function() {
      widget.classList.remove('day-map-widget--loading');
      // Hide fallback (map loaded successfully)
      if (fallback) { fallback.setAttribute('aria-hidden', 'true'); }
    });
  });
}
</script>
```

**Note:** The `initDayMaps` init script calls `getDetails` during map init (not on first pin click) to resolve lat/lng — this is required because the markdown does not contain coordinates. Photo fetching is bundled in the same call. This uses Places API quota per POI per page load but is unavoidable without storing lat/lng in markdown.

**FB-002 fix:** The `getDetails` callback now tracks a `failedCount` counter alongside `placedCount`. The `fitBounds`/`setCenter+setZoom` branch fires when `placedCount + failedCount === poiCards.length` (all callbacks have settled), not when `placedCount === poiCards.length`. This eliminates the silent blank-grey-map failure when one or more `getDetails` calls fail (quota exceeded, network error, stale place_id). The `placedCount === 1` single-pin branch fires regardless of `poiCards.length` (so even when only one of several POIs resolves, the map centers on that pin at zoom 15 rather than calling `fitBounds` on a single point). When `placedCount === 0` after all callbacks settle, `.day-map-widget--error` is applied and the fallback link is revealed.

**FB-003 fix:** In the zero-POI early-return path (before `Map` construction), `widget.classList.remove('day-map-widget--loading')` is called before adding `.day-map-widget--error`, stopping the shimmer immediately. The CSS rule `.day-map-widget--error { animation: none; }` was added to `rendering_style_config.css` as a belt-and-suspenders guard — covers the partial-failure path where the error state is applied after callbacks settle.

#### Graceful degradation rules
1. **`maps_config.json` missing or key blank:** `{{MAPS_SCRIPT}}` = empty string. All days render `<a class="map-link">`. No `.day-map-widget` elements emitted.
2. **Day has zero POIs with `place_id`:** Emit `<a class="map-link">` for that day only (not the widget). Other days in the same file may still have widgets.
3. **Day has some POIs with `place_id`, some without:** Widget is rendered; only POIs with `place_id` get pins. POIs without `place_id` remain as cards but are not pinned.
4. **Maps JS API fails at runtime (all `getDetails` fail):** After all callbacks settle with `placedCount === 0`, `.day-map-widget--error` applied; `aria-hidden` removed from fallback → link becomes visible. Shimmer stopped.
5. **Maps JS API partial failure (some `getDetails` fail):** Map view is fitted to whichever POIs resolved. Failed POIs are silently omitted from the map (their cards remain visible). No error state — the partial map is valid.

#### Google Maps API prerequisites (operational)
- Google Cloud project with Maps JavaScript API + Places API enabled (billing required).
- API key should be domain-restricted to the site serving the HTML.
- Dark mode map tiles: NOT supported in v1. Map tiles remain light regardless of `prefers-color-scheme`. Documented as a known v1 limitation.
- Touch target size for pins (~26px): below WCAG 44×44px recommendation. Accepted limitation of Google Maps default pin size.

#### Localized map region label table (MAP_ARIA_LABELS)
Used for `aria-labelledby` of the `.day-map-widget` region:
```
ru: "Карта дня {N}"
en: "Day {N} map"
he: "מפת יום {N}"
```
The `{N}` token is replaced with the day number at render time. If the language is not in this table, the `aria-labelledby` attribute and `<span>` label are omitted (not rendered).
```

**Rationale:** Documents the full widget contract, placement rules, JS initialization, and degradation logic. Replaces the single-line Daily Route Map Link rule.

---

### 1.4 `base_layout.html`

**Action:** Modify — add `{{MAPS_SCRIPT}}` placeholder before `</body>`

**Current state (lines 62–64):**
```html
</script>
</body>
</html>
```

**Target state:**
```html
</script>
{{MAPS_SCRIPT}}
</body>
</html>
```

**Rationale:** Provides the injection point for the Maps JS API `<script>` tag. When the key is absent, `{{MAPS_SCRIPT}}` is substituted with an empty string — no change to rendered output.

---

### 1.5 `rendering_style_config.css`

**Action:** Modify — add `.day-map-widget` component CSS block after the existing `§8 ACTIVITY / POI SECTION` block (after the `.pro-tip` rule)

**Target state (new CSS block to insert before `§8a`):**
```css
/* --------------------------------------------------------------------------
   8b. DAY MAP WIDGET — Embedded Google Maps per day
   -------------------------------------------------------------------------- */

.day-map-widget {
  position: relative;
  width: 100%;
  height: 220px;           /* Mobile-first: 220px */
  border-radius: var(--radius-container);
  overflow: hidden;
  margin-bottom: var(--space-4);
  /* Loading state: shimmer skeleton */
  background: linear-gradient(
    90deg,
    var(--color-surface-raised) 25%,
    var(--color-border) 50%,
    var(--color-surface-raised) 75%
  );
  background-size: 200% 100%;
  animation: day-map-shimmer 1.5s infinite ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .day-map-widget {
    animation: none;
    background: var(--color-surface-raised);
  }
}

@keyframes day-map-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Desktop: taller map */
@media (min-width: 768px) {
  .day-map-widget {
    height: 280px;
  }
}

/* Map canvas fills container */
.day-map-widget__canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* Fallback route link — always in DOM, hidden when map loads */
.day-map-widget__fallback {
  display: none;  /* Hidden by default when widget is active */
  padding: var(--space-2) 0;
}

/* Error/degraded state: hide canvas, show fallback link */
.day-map-widget--error .day-map-widget__canvas {
  display: none;
}

.day-map-widget--error .day-map-widget__fallback {
  display: block;
}

/* Loaded state: remove shimmer (JS removes .day-map-widget--loading) */
/* Shimmer is on the parent; once class removed the background disappears naturally */
/* JS removes animation by removing the --loading class */
.day-map-widget--loading {
  /* shimmer already on base .day-map-widget; this class is present during load */
}

/* Keyboard focus on map canvas */
.day-map-widget__canvas:focus-visible {
  outline: var(--focus-ring);
  outline-offset: var(--focus-ring-offset);
}

/* RTL overrides */
[dir="rtl"] .day-map-widget__fallback {
  text-align: right;
}

[dir="rtl"] .day-map-widget {
  /* Reverse shimmer direction for RTL */
  animation-name: day-map-shimmer-rtl;
}

@keyframes day-map-shimmer-rtl {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  [dir="rtl"] .day-map-widget {
    animation: none;
  }
}
```

**Print additions (add to existing `§15 PRINT STYLES` `@media print` block):**
```css
  .day-map-widget {
    display: none !important;
  }

  .day-map-widget__fallback {
    display: block !important;
  }
```

**Rationale:** `.day-map-widget` follows the existing container pattern (12px radius, `overflow:hidden`, design tokens for spacing). Shimmer skeleton uses CSS custom properties that auto-switch in dark mode. Print styles hide the map and reveal the fallback route link URL.

---

### 1.6 `automation/scripts/generate_html_fragments.ts`

**Action:** Modify

#### 1.6a — Add `placeId` to `PoiData` interface
```typescript
interface PoiData {
  // ... existing fields ...
  placeId?: string;          // NEW: Google Places place_id (from **place_id:** line)
}
```

#### 1.6b — Add `mapApiKey` parameter to `renderDayFragment` and `renderPoiCard`
The main function reads `maps_config.json` once and passes the key (or empty string) through the render pipeline.

```typescript
// Read maps_config.json from project root (located 2 levels above automation/scripts/)
function readMapsApiKey(scriptDir: string): string {
  // Walk up: automation/scripts/ → automation/ → project root
  const projectRoot = path.resolve(scriptDir, '..', '..');
  const configPath = path.join(projectRoot, 'maps_config.json');
  if (!fs.existsSync(configPath)) return '';
  try {
    const raw = fs.readFileSync(configPath, 'utf8');
    const cfg = JSON.parse(raw) as { google_maps_api_key?: string };
    return (cfg.google_maps_api_key ?? '').trim();
  } catch {
    return '';
  }
}
```

#### 1.6c — Parse `place_id` in `parseDayFile` POI_SECTION handler
Add to the `POI_SECTION` case in the line-by-line parser (after the `**Image:**` detection block):
```typescript
} else if (/^\*\*place_id\b/.test(trimmed)) {
  // place_id: **place_id:** ChIJ...
  const pidMatch = trimmed.match(/^\*\*place_id\*\*:?\s*(\S+)/);
  if (pidMatch && currentPoi) currentPoi.placeId = pidMatch[1].trim();
}
```

#### 1.6d — Add `data-place-id` and `data-poi-name` to `renderPoiCard`
Modify the opening `<div class="poi-card"...>` line:
```typescript
const placeIdAttr = poi.placeId ? ` data-place-id="${escapeHtml(poi.placeId)}"` : '';
const poiNameAttr = ` data-poi-name="${escapeHtml(poi.name)}"`;
parts.push(`<div class="poi-card" id="poi-day-${dayNum}-${poiIndex}"${exemptAttr}${placeIdAttr}${poiNameAttr}>`);
```

#### 1.6e — Replace map-link with widget in `renderDayFragment`
The existing map-link block (lines ~1603–1612):
```typescript
// Map link — BEFORE itinerary table
if (day.mapLink) {
  const rawLabel = day.mapLinkLabel ?? 'Маршрут дня на Google Maps';
  const mapLabel = rawLabel.startsWith('🗺') ? rawLabel : `🗺️ ${rawLabel}`;
  parts.push(
    `    <a class="map-link" href="${day.mapLink}" target="_blank" rel="noopener noreferrer">${escapeHtml(mapLabel)}</a>`
  );
  parts.push('');
}
```

Replace with:
```typescript
// Day map widget (or fallback link) — BEFORE itinerary table
if (day.mapLink) {
  parts.push(renderDayMapWidget(day, lang, mapsApiKey));
  parts.push('');
}
```

Where `mapsApiKey` is passed into `renderDayFragment(day, lang, mapsApiKey)`.

#### 1.6f — New `renderDayMapWidget` function
```typescript
const MAP_ARIA_LABELS: Record<string, string> = {
  ru: 'Карта дня {N}',
  en: 'Day {N} map',
  he: 'מפת יום {N}',
};

function renderDayMapWidget(day: DayData, lang: string, mapsApiKey: string): string {
  const rawLabel = day.mapLinkLabel ?? 'Маршрут дня на Google Maps';
  const mapLabel = rawLabel.startsWith('🗺') ? rawLabel : `🗺️ ${rawLabel}`;
  const fallbackHtml =
    `    <a class="map-link day-map-widget__fallback" href="${escapeHtml(day.mapLink!)}"` +
    ` target="_blank" rel="noopener noreferrer" aria-hidden="true">${escapeHtml(mapLabel)}</a>`;

  // Fallback path: no API key or no POIs with place_id
  const poisWithPlaceId = day.pois.filter(p => p.placeId);
  if (!mapsApiKey || poisWithPlaceId.length === 0) {
    // Emit the plain map-link (original behavior)
    return `    <a class="map-link" href="${escapeHtml(day.mapLink!)}" target="_blank" rel="noopener noreferrer">${escapeHtml(mapLabel)}</a>`;
  }

  // Widget path
  const N = day.dayNumber;
  const ariaLabelTemplate = MAP_ARIA_LABELS[lang] ?? '';
  const ariaLabel = ariaLabelTemplate.replace('{N}', String(N));
  const ariaAttr = ariaLabel
    ? ` role="region" aria-labelledby="map-day-${N}-label"`
    : '';
  const labelSpan = ariaLabel
    ? `\n      <span id="map-day-${N}-label" class="sr-only">${escapeHtml(ariaLabel)}</span>`
    : '';

  const parts: string[] = [];
  parts.push(`    <div class="day-map-widget day-map-widget--loading" data-map-day="${N}"${ariaAttr}>${labelSpan}`);
  parts.push(`      <div id="day-map-${N}" class="day-map-widget__canvas" tabindex="0"></div>`);
  parts.push(fallbackHtml);
  parts.push(`    </div>`);
  return parts.join('\n');
}
```

#### 1.6g — Thread `mapsApiKey` through `main()`
In `main()`, after reading the manifest:
```typescript
const mapsApiKey = readMapsApiKey(path.dirname(process.argv[1]));
```
Pass to `renderDayFragment(dayData, lang, mapsApiKey)` for each day.

---

### 1.7 `automation/scripts/generate_shell_fragments.ts`

**Action:** Modify

#### 1.7a — Add `MAPS_SCRIPT` to shell fragments JSON output
Add to the output JSON written to `shell_fragments_{lang}.json`:
```json
{
  "PAGE_TITLE": "...",
  "NAV_LINKS": "...",
  "NAV_PILLS": "...",
  "HTML_LANG_ATTRS": "...",
  "MAPS_SCRIPT": "..."
}
```

#### 1.7b — Read `maps_config.json` and build `MAPS_SCRIPT`
Add a `buildMapsScript(apiKey: string): string` function that returns the full `<script>` block (inline init + async API loader) when `apiKey` is non-blank, or empty string otherwise.

The script block template:

```typescript
function buildMapsScript(apiKey: string): string {
  if (!apiKey) return '';
  const escapedKey = apiKey.replace(/"/g, '&quot;');
  return `<script>
(function() { window.__mapsApiKey = "${escapedKey}"; })();
</script>
<script async
  src="https://maps.googleapis.com/maps/api/js?key=${escapedKey}&libraries=places,marker&v=weekly&callback=initDayMaps">
</script>
<script>
${INIT_SCRIPT_BODY}
</script>`;
}
```

Where `INIT_SCRIPT_BODY` is the `initDayMaps` function text extracted as a TypeScript constant (keeping it co-located with the other shell fragment logic).

#### 1.7c — Assembly step reads `MAPS_SCRIPT`
The existing assembly step (rendering-config.md §Step 3) substitutes all `{{...}}` placeholders from `shell_fragments_{lang}.json`. Adding `MAPS_SCRIPT` to that JSON is sufficient — the assembly substitution logic already handles all keys generically (or if it doesn't, update the placeholder substitution to also handle `{{MAPS_SCRIPT}}`).

**FB-001 fix:** `rendering-config.md` Step 3 item 3 has been updated to explicitly name `MAPS_SCRIPT` in the placeholder injection list. Item 5 (preservation check) now also includes `{{MAPS_SCRIPT}}`. This ensures LLM assembly agents do not leave the literal token in the output HTML.

---

### 1.8 `maps_config.json` (new file)

**Action:** Create at project root `c:/VscodeProjects/Budapest/maps_config.json`

**Content:**
```json
{
  "_comment": "Google Maps API key for the day map widget. Get a key at https://console.cloud.google.com. Enable: Maps JavaScript API + Places API. Domain-restrict this key to your serving domain.",
  "google_maps_api_key": ""
}
```

**Rationale:** Empty key by default — renderer falls back to plain `<a class="map-link">` until the key is populated. Storing the comment in the JSON helps operators who encounter the file without documentation.

---

### 1.9 `.gitignore`

**Action:** Modify — add `maps_config.json`

**Target state (append):**
```
maps_config.json
```

**Rationale:** The API key is a credential. Even though Maps JS API keys are client-side (frontend embeds are standard practice), keeping the key out of version control is hygiene.

---

## 2. Markdown Format Specification

**New field:** `**place_id:**`
**Position in day file:** After links/phone/rating/accessibility lines in a POI section, before `**Image:**`
**Required:** No — omitted when Google Places returned no result for this POI

**Example:**
```markdown
### Stortorget / Stortorget (Malmö's Main Square)

📍 [Google Maps](https://www.google.com/maps/place/Stortorget,+211+34+Malmö,+Sweden)
🌐 [Website](https://www.guidebook-sweden.com/en/guidebook/destination/stortorget-historic-market-square-in-malmoe)
📸 [Google Photos](https://www.google.com/maps/search/Stortorget+Malmö/@55.6061,13.0002,17z)
⭐ 4.6/5
**place_id:** ChIJN1t_tDeuEmsRUsoyG83frY4
**Image:** https://upload.wikimedia.org/wikipedia/commons/9/9e/Torgbrunn...

Stortorget is Malmö's oldest and grandest public square...
```

---

## 3. HTML Rendering Specification

### Day Map Widget (API key present, day has ≥1 place_id POI)
```html
<div class="day-map-widget day-map-widget--loading" data-map-day="1"
     role="region" aria-labelledby="map-day-1-label">
  <span id="map-day-1-label" class="sr-only">Day 1 map</span>
  <div id="day-map-1" class="day-map-widget__canvas" tabindex="0"></div>
  <a class="map-link day-map-widget__fallback"
     href="https://www.google.com/maps/dir/..."
     target="_blank" rel="noopener noreferrer" aria-hidden="true">
    🗺️ Open Day Route on Google Maps
  </a>
</div>
```

### POI card with place_id
```html
<div class="poi-card" id="poi-day-1-1"
     data-place-id="ChIJN1t_tDeuEmsRUsoyG83frY4"
     data-poi-name="Stortorget / Stortorget (Malmö&#39;s Main Square)">
  <!-- ... existing card content unchanged ... -->
</div>
```

### Fallback only (no API key or no place_ids)
```html
<a class="map-link" href="https://www.google.com/maps/dir/..."
   target="_blank" rel="noopener noreferrer">
  🗺️ Open Day Route on Google Maps
</a>
```

---

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `content_format_rules.md` | Per-Day File Format POI block | Add `**place_id:** {place_id}` line after links/meta |
| `content_format_rules.md` | Daily Route Map Link | Add note about widget replacing the link in rendered HTML |
| `trip_planning_rules.md` | Layer 2: Google Places API | Add `place_id` persistence mandate after `get_place_details` call |
| `rendering-config.md` | Daily Route Map Link | Replace with full Day Map Widget spec, widget structure, JS init spec, degradation rules, MAP_ARIA_LABELS table |
| `rendering-config.md` | POI Card Structure | Add `data-place-id` and `data-poi-name` attribute rules |

---

## 5. Implementation Checklist

- [x] Write `high_level_design.md`
- [x] Write `detailed_design.md`
- [ ] Update `content_format_rules.md` — add `**place_id:**` to POI format template; add widget note to Daily Route Map Link
- [ ] Update `trip_planning_rules.md` — Layer 2: add `place_id` persistence mandate
- [ ] Update `rendering-config.md` — replace Daily Route Map Link section; add `data-place-id`/`data-poi-name` to POI card rules; add MAP_ARIA_LABELS table
- [ ] Update `base_layout.html` — add `{{MAPS_SCRIPT}}` placeholder before `</body>`
- [ ] Update `rendering_style_config.css` — add `.day-map-widget` CSS block (§8b); add print rules to §15
- [ ] Update `automation/scripts/generate_html_fragments.ts` — `placeId` in PoiData; parse `**place_id:**`; `data-place-id`/`data-poi-name` on poi-card; `renderDayMapWidget`; `readMapsApiKey`; thread through main
- [ ] Update `automation/scripts/generate_shell_fragments.ts` — `readMapsApiKey`; `buildMapsScript`; add `MAPS_SCRIPT` to shell fragments JSON
- [ ] Create `maps_config.json` with empty key placeholder
- [ ] Update `.gitignore` — add `maps_config.json`

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: `**place_id:**` in POI metadata after enrichment | `trip_planning_rules.md` Layer 2 + `content_format_rules.md` template |
| REQ-001 | AC-2: Omit line when Places returned no result | `trip_planning_rules.md` rule text |
| REQ-001 | AC-3: Format `**place_id:** {value}` | `content_format_rules.md` example |
| REQ-001 | AC-4: Layer 2 section documents requirement | `trip_planning_rules.md` |
| REQ-001 | AC-5: Template includes `**place_id:**` | `content_format_rules.md` Per-Day File Format |
| REQ-001 | AC-6: Grocery/waypoint POIs also receive `place_id` | `trip_planning_rules.md` — "all POI types" language |
| REQ-002 | AC-1: `maps_config.json` with `google_maps_api_key` field | §1.8 |
| REQ-002 | AC-2: Renderer reads key; falls back if absent/blank | `generate_html_fragments.ts` §1.6b; `generate_shell_fragments.ts` §1.7b |
| REQ-002 | AC-3: Config location documented in `rendering-config.md` | §1.3 Google Maps API prerequisites |
| REQ-002 | AC-4: No key value in committed template/script source | `maps_config.json` has empty string; `.gitignore` excludes it |
| REQ-002 | AC-5: Key name is ASCII `google_maps_api_key` | §1.8 |
| REQ-003 | AC-1: `<div class="day-map-widget" id="map-day-{N}">` per day | §1.6f `renderDayMapWidget` |
| REQ-003 | AC-2: Widget position before itinerary table | §1.6e rendering order |
| REQ-003 | AC-3: Maps JS API `<script>` in `<head>` once per page | `{{MAPS_SCRIPT}}` in `base_layout.html` via shell fragment |
| REQ-003 | AC-4: Numbered pins in visit order | JS init: `forEach` over `.poi-card[data-place-id]` in DOM order, `pinNum = i+1` |
| REQ-003 | AC-5: Info window with name + photo on pin click | JS init: `addListener('click', ...)` → `getDetails` → `InfoWindow` |
| REQ-003 | AC-6: `map.fitBounds(bounds)` | JS init |
| REQ-003 | AC-7: Only POIs with valid `place_id` pinned | JS init: `querySelectorAll('.poi-card[data-place-id]')` |
| REQ-003 | AC-8: 280px desktop / 220px mobile | CSS §1.5 |
| REQ-003 | AC-9: `role="region"` + `aria-labelledby` | §1.6f widget HTML |
| REQ-003 | AC-10: `loading=async` + `callback` pattern | §1.7b `buildMapsScript` |
| REQ-004 | AC-1: Mobile 220px, width 100% | CSS `@media (max-width: 767px)` base height |
| REQ-004 | AC-2: No `overflow:hidden` on parent containers | CSS: `overflow:hidden` on `.day-map-widget` only |
| REQ-004 | AC-3: Touch gestures work | Maps API default |
| REQ-004 | AC-4: `gestureHandling: 'cooperative'` | JS init map options |
| REQ-005 | AC-1: Key absent → plain `<a class="map-link">` for all days | §1.6e–f |
| REQ-005 | AC-2: Mixed place_id coverage → widget with available pins | JS init: `querySelectorAll` filters by attribute presence |
| REQ-005 | AC-3: Day with 0 place_ids → fallback link for that day | `renderDayMapWidget` early return |
| REQ-005 | AC-4: API runtime failure → fallback `<a>` visible | `.day-map-widget--error` CSS; JS error handling |
| REQ-005 | AC-5: No JS errors in degraded mode | Guards in JS init (`if (!place || !place.geometry)`) |
| REQ-005 | AC-6: Fallback URL same as current dir link | `day.mapLink` used unchanged |
| REQ-006 | AC-1: ASCII-only class names and data-* attributes | All new attributes/classes are ASCII |
| REQ-006 | AC-2: Tests use CSS selectors and data-* attributes | AE scope (TripPage.ts) |
| REQ-006 | AC-3: No language branching in map widget generation | `renderDayMapWidget` is language-agnostic except for `MAP_ARIA_LABELS` lookup |
| REQ-006 | AC-4: POI names from markdown, not Google Places runtime | `data-poi-name` set at render time from `poi.name` |
| REQ-006 | AC-5: `aria-label` omitted if language not in table | `renderDayMapWidget`: `ariaLabel ? ... : ''` |

---

## 7. Code Review Fixes (applied after Team Leader review 2026-04-21)

### Fix for BLOCK-1 — `generate_shell_fragments.ts` `INIT_SCRIPT_BODY`

**File:** `automation/scripts/generate_shell_fragments.ts`

Added `&& placedCount === 0` guard to the error-state branch inside the `getDetails` failure callback. The `.day-map-widget--error` class is now applied only when all callbacks have settled AND zero pins were successfully placed. The `fitBounds`/`setCenter` call in the success callback still fires whenever `placedCount + failedCount === poiCards.length` (regardless of `placedCount`), so partial-success days continue to render a working map with however many pins resolved.

**Before:**
```javascript
if (placedCount + failedCount === poiCards.length) {
  // All callbacks settled but zero POIs resolved — show error state
  widget.classList.remove('day-map-widget--loading');
  widget.classList.add('day-map-widget--error');
  if (fallback) { fallback.removeAttribute('aria-hidden'); }
}
```

**After:**
```javascript
if (placedCount + failedCount === poiCards.length && placedCount === 0) {
  // All callbacks settled AND zero POIs resolved — show error state
  widget.classList.remove('day-map-widget--loading');
  widget.classList.add('day-map-widget--error');
  if (fallback) { fallback.removeAttribute('aria-hidden'); }
}
```

---

### Fix for BLOCK-2 — `generate_html_fragments.ts` `renderDayMapWidget`

**File:** `automation/scripts/generate_html_fragments.ts`

Replaced the hardcoded Russian string `'Маршрут дня на Google Maps'` with the language-neutral fallback `'🗺️ Google Maps'` (emoji + brand name), matching the `MAP_ARIA_LABELS` pattern already used in the same function for language-neutral fallbacks. This satisfies REQ-006 AC-3: no language-specific characters in core render logic.

**Before:**
```typescript
const rawLabel = day.mapLinkLabel ?? 'Маршрут дня на Google Maps';
```

**After:**
```typescript
const rawLabel = day.mapLinkLabel ?? '🗺️ Google Maps';
```
