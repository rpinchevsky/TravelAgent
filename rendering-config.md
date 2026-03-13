# 🌐 Enterprise Travel UI System v3.0

## 🏗️ Design Tokens (The "Source of Truth")
- **Spacing Scale:** 8px base (4px, 8px, 16px, 24px, 32px, 48px, 64px). 
- **Border Radius:** 12px for containers; 6px for interactive elements.
- **Typography:** - Primary: 'Inter', system-ui, -apple-system, sans-serif.
  - Weights: Regular (400), Medium (500), Semi-bold (600).
  - Line Height: 1.5 for body; 1.2 for headings.

## 🌗 Smart Theming & Accessibility (A11y)
- **Contrast Ratios:** Must pass WCAG 2.1 Level AA (min 4.5:1).
- **Auto-Theme Logic:**
  - Background is primary anchor. Use `prefers-color-scheme` media queries to allow user-level overrides.
  - For dark backgrounds, use high-legibility white (#FAFAFA) and muted borders (rgba(255,255,255,0.1)).
- **Interactive Elements:** All links must have a visible `:focus` state (2px outline) for keyboard navigation.

## 📊 Data Visualization (The Trip Table)
- **Compactness:** Use "Comfortable" density for desktop, "Compact" for mobile.
- **Header:** Sticky headers (`position: sticky`) so the itinerary day is always visible while scrolling.
- **Visual Cues:** Use icons (SVG only) next to activity types (e.g., 🍽️ for meals, 🏛️ for museums).

## 📱 Performance & Responsiveness
- **Lazy Loading:** Ensure any images in the MD are exported with `loading="lazy"`.
- **Fluid Layout:** Use CSS Grid for the itinerary layout to allow cards to wrap naturally on smaller screens without breaking the table logic.

## 🧩 Component Usage Rules (Mandatory)

### POI Cards Layout
- **MUST** wrap all POI cards within a day inside `<div class="itinerary-grid">`. This enables CSS Grid side-by-side layout on desktop.
- Never stack POI cards vertically without the grid wrapper.

### POI Card Structure
- **Anchor ID (Mandatory):** Every `<div class="poi-card">` MUST have a unique `id` attribute following the pattern `id="poi-day-{D}-{N}"` where `{D}` is the day number and `{N}` is the 1-based POI index within that day. Example: `id="poi-day-1-1"`, `id="poi-day-1-2"`, `id="poi-day-2-1"`.
- Tag: `<span class="poi-card__tag">` with emoji prefix (e.g., `🏊 Бассейн`, `🍽️ Ужин`, `🏛️ Музей`)
- Name: Use `<h3 class="poi-card__name">` (semantic heading), NOT `<div>`
- Links: Use emoji prefixes: `📍 Maps`, `🌐 Сайт`, `📸 Фото`

### POI Card Parity Rule (Mandatory)
- Every `###` section in the source markdown that describes a Point of Interest (attractions, restaurants, activities — anything that is NOT Логистика, Стоимость, or Запасной план) **MUST** be rendered as exactly one `<div class="poi-card">` in the HTML output.
- **No silent truncation:** Do NOT cap the number of POI cards per day. If a day has 4 POI descriptions in the markdown, the HTML must contain 4 `poi-card` elements for that day.
- **No merging:** Each POI gets its own card — never combine two POIs into one card.
- **Validation:** After HTML generation, the count of `.poi-card` elements inside each `#day-N` section must equal the count of `###` POI headings for that day in the source markdown.

### Activity Labels in Itinerary Tables
- **Clickable POI Link (Mandatory):** When an activity label references a specific POI that has a corresponding `<div class="poi-card">` in the same day, the label MUST be rendered as a clickable anchor: `<a class="activity-label" href="#poi-day-{D}-{N}">` instead of a plain `<span>`. The `href` must match the `id` of the target POI card. Generic actions (transport, walks without a named POI) that have no corresponding POI card remain as `<span class="activity-label">`.
- Use emoji icons in activity labels (e.g., `🚗 Выезд`, `💦 Palatinus Strand / Палатинус`, `🍽️ Обед`, `🏛️ Állatkert / Зоопарк`, `🛒 Шоппинг`, `🚂 Поезд`)
- **POI Language Rule (Mandatory):** When an activity label references a specific POI (attraction, restaurant, park, landmark), the name MUST follow the `language_preference.poi_languages` format — `Hungarian Name / Russian Name`. Generic actions (Выезд, Обед, Переезд) remain in the reporting language only.
- Do NOT use inline SVG icons inside activity labels.

### Pricing Display
- **MUST** use `pricing-grid` with `pricing-cell` components for all daily cost sections.
- Structure: `<div class="pricing-grid">` containing `<div class="pricing-cell">` items, each with `.pricing-cell__label`, `.pricing-cell__amount`, `.pricing-cell__currency`.
- Do NOT use `itinerary-table` for pricing data.

### Plan B (Backup Plan) Sections
- **MUST** use `<div class="advisory advisory--info">` with the info SVG icon.
- Title format: `🅱️ Запасной план — [Name]`
- Do NOT use `card card--featured` for Plan B sections.

### Day 0 / Arrival Section
- Always include a Day 0 (`id="day-0"`) arrival section when the trip data contains arrival information.
- Include it in both sidebar navigation and mobile pills.

### Page Header
- **Page Title (`<title>`):** Derive from destination and year: `"{Destination} {Year} — Семейный маршрут"`. Populated via the `{{PAGE_TITLE}}` placeholder in `base_layout.html`.
- **Main Heading:** `<h1 class="page-title">` — same text as `<title>` plus an inline SVG country flag (see Country Flag Rule in Step 3).
- **Subtitle:** `<p class="page-subtitle">` — trip dates + traveler names (in `language_preference.reporting_language`) with ages at time of arrival. Example: `20–31 августа 2026 · Роберт (45), Анна (44), Тамир (8), Ариэль (6), Итай (3→4!)`

### Overview Section
- Wrap in `<section id="overview">` — this is what TripPage.ts `#overview` locator targets.
- Inside: `<h2 class="section-title">` + `<div class="itinerary-table-wrapper">` table.
- Do NOT wrap the overview in a `day-card` with a banner.

### Budget Section
- Wrap in `<section id="budget">` — this is what TripPage.ts `#budget` locator targets.
- Inside: `<h2 class="section-title">` + budget breakdown table with category/HUF/EUR columns.
- Must contain a total row with `<strong>Итого</strong>`.

### Pro-Tip Component
- Every POI card should contain a pro-tip wrapped in `<div class="pro-tip">`.
- Do NOT render pro-tips as just `<strong>` text — must use the `.pro-tip` class.

### Sidebar Logo
- Include emoji in sidebar logo: `🌐 TravelUI`

### Banner Titles
- Use emoji in `day-card__banner-title` (e.g., `День 1 — Остров Маргит 🏊`)

### SVG Requirements (Consolidated)
- All `<svg>` elements MUST have explicit `width` and `height` HTML attributes.
- Decorative SVGs: add `aria-hidden="true"`.
- Semantic SVGs (e.g., country flag): add `role="img"` + `aria-label="{description}"`.
- Sidebar link SVGs: `width="16" height="16"` with Feather-icon style strokes.

## 🔗 Interactive Elements
- **Navigation:**
  - Desktop only: Fixed sidebar with Auto-Dark Mode. Active-state tracking: JavaScript `IntersectionObserver` watches each `[id^="day-"]` section; when a section enters the viewport, the corresponding `.sidebar__link` receives `is-active` class (and `aria-current="page"`) while all others lose it.
  - Mobile: Horizontal scrollable pill row pinned to top. Same observer toggles `is-active` on the matching `.mobile-nav__pill`.

## 📱 Universal Sticky Navigation Rules for mobile
- **Positioning:** Use both `position: -webkit-sticky;` and `position: sticky;` for maximum compatibility.
- **Top Offset:** Explicitly set `top: 0;`. To handle phone notches, use `top: env(safe-area-inset-top, 0);`.
- **Z-Index:** Set `z-index: 1000;` to ensure the navigation stays above all other content layers.
- **Layout Integrity (Critical):** Do NOT apply `overflow: hidden`, `overflow: auto`, or `overflow: scroll` to any parent container (like `body` or a main wrapper). Stickiness only works if the scroll happens on the root level.
- **Width:** Ensure the sticky element has `width: 100%;` or is a flex/grid item that spans the full viewport width.

---

## HTML Generation Pipeline (Fragment Master Mode)

### Objective
Transform raw trip data from `trip.md` into highly structured HTML fragments and assemble them into the `base_layout.html` shell using the Enterprise Design System.

### Step 1: Analyze Data
- Scan latest `trip_YYYY-MM-DD_HHmm.md` (or file specified by user) to identify the total number of "Days" or "Major Sections."
- Map activity types to their corresponding SVG icons as per the Component Usage Rules above.

### Step 2: Fragment Generation
Generate the necessary HTML strings for these 4 placeholders in `base_layout.html`:

1. **{{PAGE_TITLE}}**:
   - Derive from destination and year: `"{Destination} {Year} — Семейный маршрут"`.

2. **{{NAV_LINKS}}**:
   - Create a list of `<a class="sidebar__link">` tags with inline `<svg>` icons.
   - Assign `href="#day-X"` and include the `is-active` class and `aria-current="page"` for the first item only.
   - **Ordering (Mandatory):** `#overview`, `#day-0` (if applicable), `#day-1` through `#day-N`, `#budget` — always overview first, budget last.

3. **{{NAV_PILLS}}**:
   - Create a list of `<a class="mobile-nav__pill">` tags.
   - Assign matching `href="#day-X"` and include the `is-active` class for the first item only.
   - **Ordering:** Must match `{{NAV_LINKS}}` exactly.

4. **{{TRIP_CONTENT}}**:
   - Convert itinerary data into `<table class="itinerary-table">`.
   - Wrap specific locations/stops in `<div class="poi-card">`. Each POI card MUST have `id="poi-day-{D}-{N}"`.
   - **Activity Label Linking:** POI-referencing labels use `<a class="activity-label" href="#poi-day-{D}-{N}">`. Generic actions remain as `<span class="activity-label">`.
   - Ensure all `<img>` tags include `loading="lazy"`.
   - **POI Parity:** Verify per-day `.poi-card` count matches markdown `###` POI count.

### Step 2.5: Agent Prompt Contract (Mandatory)
When delegating HTML generation to a sub-agent, the prompt MUST include these 8 items:
1. The full `TripPage.ts` — defines the structural contract (CSS classes, IDs, locators)
2. The `rendering-config.md` — component structure and design system rules
3. Explicit list of required section IDs: `#overview`, `#budget`, `#day-1` to `#day-N`
4. Advisory class rules: `.advisory--warning` = Holiday Advisory ONLY; `.advisory--info` = Plan B + Logistics
5. Pro-tip rule: wrap in `<div class="pro-tip">`, not just `<strong>` text
6. SVG rule: sidebar links need inline `<svg>` with explicit `width`/`height`
7. CSS inlining rule: full CSS in `<style>` tag, never `<link>`
8. Activity label linking rule: POI-referencing labels use `<a class="activity-label" href="#poi-day-{D}-{N}">`, POI cards have matching `id="poi-day-{D}-{N}"`

**Gate:** Never delegate HTML generation without all 8 items in the prompt. See `development_rules.md` Rule 4.

### Step 3: Assembly & Final Export
1. **Read** (do not modify) `base_layout.html` to use as a template.
2. **Inject** the generated fragments into the placeholders.
3. **Save/Output** the result as a NEW file named `trip_output.html`.
4. **Validation:** Ensure the original `base_layout.html` still contains its `{{PAGE_TITLE}}`, `{{NAV_LINKS}}`, `{{NAV_PILLS}}`, `{{TRIP_CONTENT}}` placeholders for future use.

**Constraints:**
- Output the final, fully-assembled HTML file. Do NOT modify `rendering_style_config.css` or `base_layout.html` source files.
- **CSS Inlining (Mandatory):** During assembly, replace the `<link rel="stylesheet" href="rendering_style_config.css">` tag in `base_layout.html` with a `<style>` block containing the full contents of `rendering_style_config.css`. The Google Fonts `<link>` tags may remain (they are external CDN resources). The output must never reference `rendering_style_config.css` via `<link>`.
- **SVG Resilience:** Every inline `<svg>` element in the output must have explicit `width` and `height` HTML attributes.
- **Country Flag Rule (Mandatory):** Windows does not render country flag emojis — it displays two-letter ISO codes (e.g., "HU" instead of a flag). Therefore, **never use flag emojis** in the HTML output. Instead, render the destination country's flag as an inline `<svg>` with the correct colors. The SVG must have `width="28" height="20"`, `role="img"`, `aria-label="{Country} flag"`, `style="vertical-align:middle;display:inline-block;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.1)"`. Look up the official flag colors for the destination from `trip_details.json → trip_context.destination`.
- **Post-Action:** Confirm the successful creation of the `.html` file matching the `.md` source's timestamp.
- **Consistency:** Ensure the timestamp logic and contrast rules from the external config are applied to every export.