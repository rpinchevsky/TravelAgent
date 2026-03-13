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

### Overview Section
- Render as standalone `<h2 class="section-title">` + `<div class="itinerary-table-wrapper">` table.
- Do NOT wrap the overview in a `day-card` with a banner.

### Sidebar Logo
- Include emoji in sidebar logo: `🌐 TravelUI`

### Banner Titles
- Use emoji in `day-card__banner-title` (e.g., `День 1 — Остров Маргит 🏊`)

### SVG Accessibility
- All decorative `<svg>` elements MUST include `aria-hidden="true"` attribute.

## 🔗 Interactive Elements
- **Navigation:** - Desktop only: Fixed sidebar with active-state tracking. Sidebar shall use Auto-Dark Mode
  - Mobile: Horizontal scrollable pill row pinned to top.

## 📱 Universal Sticky Navigation Rules for mobile
- **Positioning:** Use both `position: -webkit-sticky;` and `position: sticky;` for maximum compatibility.
- **Top Offset:** Explicitly set `top: 0;`. To handle phone notches, use `top: env(safe-area-inset-top, 0);`.
- **Z-Index:** Set `z-index: 1000;` to ensure the navigation stays above all other content layers.
- **Layout Integrity (Critical):** Do NOT apply `overflow: hidden`, `overflow: auto`, or `overflow: scroll` to any parent container (like `body` or a main wrapper). Stickiness only works if the scroll happens on the root level.
- **Width:** Ensure the sticky element has `width: 100%;` or is a flex/grid item that spans the full viewport width.