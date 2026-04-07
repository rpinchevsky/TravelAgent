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
- **Inline image (Optional):** If the markdown source contains `**Image:** <url>` (or `**Изображение:**`, `**תמונה:**`), render `<div class="poi-card__image-wrapper"><img src="{url}" alt="{POI name}" loading="lazy" onerror="this.parentElement.style.display='none'"></div>` as the **first child** of `.poi-card`, before `.poi-card__body`. If no image URL is present, omit the wrapper entirely. The `onerror` handler hides the wrapper if the image fails to load.
- **Anchor ID (Mandatory):** Every `<div class="poi-card">` MUST have a unique `id` attribute following the pattern `id="poi-day-{D}-{N}"` where `{D}` is the day number and `{N}` is the 1-based POI index within that day. Example: `id="poi-day-1-1"`, `id="poi-day-1-2"`, `id="poi-day-2-1"`.
- Tag: `<span class="poi-card__tag">` with emoji prefix (e.g., `🏊 Бассейн`, `🍽️ Ужин`, `🏛️ Музей`)
- Rating: `<span class="poi-card__rating">` placed between `.poi-card__tag` and `<h3 class="poi-card__name">`. Contains a star icon (⭐ emoji) followed by the numeric rating and optional review count in parentheses. Example: `<span class="poi-card__rating">⭐ 4.5 (2,340)</span>`. If no rating exists in the markdown source, this element is not rendered. The review count uses locale-appropriate number formatting (e.g., comma separators).
- Accessibility indicator: When present in the markdown source (`♿`), render as `<span class="poi-card__accessible">♿</span>` placed after `.poi-card__rating` (or after `.poi-card__tag` if no rating), before `<h3 class="poi-card__name">`. This is a simple inline badge, not a link.
- Name: Use `<h3 class="poi-card__name">` (semantic heading), NOT `<div>`
- Links: **Emoji prefixes are MANDATORY** in the rendered `<a>` text: `📍 Maps`, `🌐 Сайт`, `📸 Фото Google`, `📞 Телефон`. The SVG icon is purely decorative; the emoji is part of the visible label and must always appear after the `</svg>` and before the text word. Note: the photo link always points to a Google Maps place page — the label must include "Google" (e.g. "Фото Google", "Google Photos", "תמונות Google") to set correct expectations.
- **Link type attribute (Mandatory):** Every `<a class="poi-card__link">` MUST include a `data-link-type` attribute identifying the link purpose. Values: `maps`, `site`, `photo`, `phone`. Example: `<a class="poi-card__link" data-link-type="maps" href="https://maps.google...">`. This enables robust test detection without relying on SVG innerHTML or href pattern matching. The same attribute applies to `<a class="accommodation-card__link">` elements.
- **Links after description (Mandatory):** The links block (📍 📸 🌐 📞 ⭐) MUST always render after the description text, regardless of the order they appear in the markdown source.
- **Link order (Mandatory):** Maps, Site, Photo, Phone. Phone link uses `<a href="tel:{number}" class="poi-card__link" data-link-type="phone">` with the phone SVG icon + `📞` emoji + localized label. If no phone number exists in the markdown source, no phone link is rendered (no empty/placeholder link). The `href` value strips all characters except digits and leading `+` from the phone number (extensions are dropped).
- **Link Label Consistency (Mandatory):** All website/site links MUST use the exact label `🌐 Сайт`. Never replace with brand names, abbreviations, or custom text (e.g., do NOT use `🌐 CBA`, `🌐 Инфо`, `🌐 Меню`). The label is always `Сайт` regardless of the destination URL.
- **Grocery store tag (Mandatory POI):** Every `### 🛒` section in the markdown MUST render as a full `poi-card` with tag `<span class="poi-card__tag">🛒 …</span>` (emoji + localized label). Do NOT skip or treat as logistics.
- **Optional stop tag (Mandatory POI):** Every `### 🎯` section in the markdown MUST render as a full `poi-card` with tag `<span class="poi-card__tag">🎯 …</span>` (emoji + localized label). Do NOT skip or treat as logistics.

### POI Card Parity Rule (Mandatory)
- Every `###` section in the source markdown that describes a Point of Interest **MUST** be rendered as exactly one `<div class="poi-card">` in the HTML output. POI sections are identified by their heading emoji: 🛒 (grocery store), 🎯 (optional along-the-way stop), and all other POI types (attractions, restaurants, activities, etc.). The only `###` sections that are NOT POIs are those starting with logistics, cost, or backup-plan markers. Grocery and optional stops are full POIs — they get `poi-card` treatment like any other POI.
- **No silent truncation:** Do NOT cap the number of POI cards per day. If a day has 4 POI descriptions in the markdown, the HTML must contain 4 `poi-card` elements for that day.
- **No merging:** Each POI gets its own card — never combine two POIs into one card.
- **Accommodation exclusion:** `###` headings prefixed with `🏨` are accommodation cards, not POIs. They render as `.accommodation-card` elements and are excluded from the parity count.
- **Car rental exclusion:** `###` headings prefixed with `🚗` are car rental category cards, not POIs. They render as `.car-rental-category` elements and are excluded from the parity count. The count of `.poi-card` elements must equal the count of non-accommodation, non-car-rental `###` POI headings.
- **Validation:** After HTML generation, the count of `.poi-card` elements inside each `#day-N` section must equal the count of `###` POI headings for that day in the source markdown.

### Accommodation Section & Card Layout

- **Section wrapper:** The `## 🏨` heading in markdown maps to `<div class="accommodation-section" id="accommodation">` as a **top-level section** in the HTML document (not inside any `<div class="day-card">`). It is placed after the overview section and before the first day card. Contains a `<h2 class="section-title accommodation-section__title">` and all child accommodation cards. The accommodation content comes from the standalone `accommodation_LANG.md` file.
- **Card wrapper:** Each `### 🏨` heading maps to `<div class="accommodation-card" id="accom-stay-{S}-{N}">` where `{S}` is the stay block number and `{N}` is the 1-based option index.
- **Distinction from POI cards:** Accommodation cards use `.accommodation-card`, NOT `.poi-card`. They are NOT counted in the POI Parity Check. The `### 🏨` prefix is the identifier — any `###` heading starting with `🏨` is an accommodation card, not a POI.
- **Card internal structure:**
  - Tag: `<span class="accommodation-card__tag">🏨</span>`
  - Rating: `<span class="accommodation-card__rating">⭐ {rating} ({count})</span>` — same pattern as `.poi-card__rating`
  - Name: `<h3 class="accommodation-card__name">` (semantic heading)
  - Links: Same emoji-prefix pattern as POI cards (📍 Maps, 🌐 Site, 📸 Photos, 📞 Phone) using `<a class="accommodation-card__link">`
  - Price level: `<div class="accommodation-card__price-level">` containing filled/unfilled currency symbols rendered as `<span class="price-pip price-pip--filled">💰</span>` and `<span class="price-pip price-pip--empty">○</span>`. For price_level=3: `💰💰💰○`.
  - Description: `<div class="accommodation-card__description">`
  - Booking CTA: `<a class="booking-cta" href="{booking_com_url}" target="_blank" rel="noopener noreferrer">` — styled as a prominent button, not an inline link
  - Pro-tip: `<div class="pro-tip">` (reuses existing pro-tip component)
- **Visual distinction:** `.accommodation-card` uses a warm amber accent (`#D4A83A` / `var(--color-brand-accent)`) for the left border and tag background, contrasting with the blue/teal used for POI cards. Background uses a subtle warm tint.
- **Responsive:** Full-width on mobile; on desktop (>768px), cards may display in a responsive grid (1-3 columns depending on viewport width) using the `.accommodation-section` grid wrapper.
- **Language-agnostic:** Card structure, class names, and element identification do not depend on specific language strings. Tests use CSS selectors only.

### Car Rental Section & Card Layout

- **Section wrapper:** The `## 🚗` heading in markdown maps to `<div class="car-rental-section" id="car-rental" role="region" aria-labelledby="car-rental-title-{block_id}">` as a **top-level section** in the HTML document (not inside any `<div class="day-card">`). It is placed after the accommodation section (or after overview if no accommodation) and before the first day card. Contains a `<h2 class="section-title car-rental-section__title">` and an intro paragraph, followed by category sub-sections. The car rental content comes from the standalone `car_rental_LANG.md` file.
- **Section intro:** `<p class="car-rental-section__intro">` — rental period, pickup location, transmission, fuel, equipment preferences in a compact `·`-separated format.
- **Category sub-section:** Each `### 🚗` heading maps to `<div class="car-rental-category">` containing a category title, comparison table, estimate disclaimer, and best-value recommendation.
- **Distinction from POI cards and accommodation cards:** Car rental categories use `.car-rental-category`, NOT `.poi-card` and NOT `.accommodation-card`. They are NOT counted in the POI Parity Check. The `### 🚗` prefix is the identifier — any `### ` heading starting with `🚗` is a car rental category, not a POI.
- **Category card internal structure:**
  - Tag: `<span class="car-rental-category__tag">🚗</span>`
  - Title: `<h3 class="car-rental-category__title">` (semantic heading)
  - Comparison table: `<div class="car-rental-table-wrapper"><table class="car-rental-table">` with 4 columns: Company, Daily Rate, Total Cost, Booking Link
  - Estimate disclaimer: `<p class="car-rental-category__estimate">` — italic muted text
  - Recommendation: `<p class="car-rental-category__recommendation">` — 💡 prefixed best-value note
- **Booking CTA:** `<a class="rental-cta" data-link-type="rental-booking" href="{url}" target="_blank" rel="noopener noreferrer">` — teal button, distinct from amber `.booking-cta`
- **Pro-tip:** Reuses existing `<div class="pro-tip">` component for child seat regulations, fuel policy, insurance tips
- **Visual distinction:** `.car-rental-section` uses a teal accent (`#2E7D9A` / `var(--color-info)`) for the top border and heading color, contrasting with amber used for accommodation. `.car-rental-category` uses teal left border, contrasting with accommodation's amber left border.
- **Responsive:** Full-width tables on desktop; tables wrapped in `.car-rental-table-wrapper` with `overflow-x: auto` on mobile (<768px). Company column sticky-left on mobile for comparison readability.
- **Language-agnostic:** Card structure, class names, and element identification do not depend on specific language strings. Tests use CSS selectors and `data-link-type` attributes only.

### Accommodation Budget in Pricing Grid

- The accommodation line item in the anchor day's pricing grid uses the standard `.pricing-cell` component.
- The pricing cell label includes a `<span class="pricing-cell__badge pricing-cell__badge--estimate">` indicator to distinguish estimated costs from confirmed costs.

### Activity Labels in Itinerary Tables
- **Clickable POI Link (Mandatory):** When an activity label references a specific POI that has a corresponding `<div class="poi-card">` in the same day, the label MUST be rendered as a clickable anchor: `<a class="activity-label" href="#poi-day-{D}-{N}">` instead of a plain `<span>`. The `href` must match the `id` of the target POI card. Generic actions (transport, walks without a named POI) that have no corresponding POI card remain as `<span class="activity-label">`.
- Use emoji icons in activity labels (e.g., `🚗 Выезд`, `💦 Palatinus Strand / Палатинус`, `🍽️ Обед`, `🏛️ Állatkert / Зоопарк`, `🛒 Шоппинг`, `🚂 Поезд`)
- **POI Language Rule (Mandatory):** When an activity label references a specific POI (attraction, restaurant, park, landmark), the name MUST follow the `language_preference.poi_languages` format — `Hungarian Name / Russian Name`. Generic actions (Выезд, Обед, Переезд) remain in the reporting language only.
- Do NOT use inline SVG icons inside activity labels.

### Pricing Display
- **MUST** use `pricing-grid` with `pricing-cell` components for all daily cost sections.
- Structure: `<div class="pricing-grid">` containing `<div class="pricing-cell">` items, each with `.pricing-cell__label`, `.pricing-cell__amount`, `.pricing-cell__currency`.
- Do NOT use `itinerary-table` for pricing data.

### Daily Route Map Link
- **Placement:** Render `<a class="map-link">` **before** the `<div class="itinerary-table-wrapper">`, immediately after the `<div class="day-card__content">` opening tag.
- Do NOT place it after the itinerary table.

### Plan B (Backup Plan) Sections
- **MUST** use `<div class="advisory advisory--info">` with the info SVG icon.
- Title format: `🅱️ Запасной план — [Name]`
- Do NOT use `card card--featured` for Plan B sections.
- **MUST NOT use `poi-card` class** for Plan B blocks. Plan B is an advisory/informational element, not a POI. Wrapping it in `<div class="poi-card">` causes test failures because every `.poi-card` is expected to have an `<h3 class="poi-card__name">`. Plan B sections have no such name element.
- **Class ownership:** `poi-card` is reserved exclusively for actual Points of Interest (attractions, restaurants, activities, etc.). Any non-POI block (Plan B, logistics, cost summaries) that needs a visual container must use its own dedicated class, never `poi-card`.

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
- **No day-number column:** The overview table must NOT include a "День" column with numeric day indices (0, 1, 2…). Start with "Дата" (date) as the first column.

### Budget Section
- Wrap in `<section id="budget">` — this is what TripPage.ts `#budget` locator targets.
- Inside: `<h2 class="section-title">` + budget breakdown table with category/HUF/EUR columns.
- Must contain a total row with `<strong>Итого</strong>`.

### Pro-Tip Component
- Every POI card should contain a pro-tip wrapped in `<div class="pro-tip">`.
- Do NOT render pro-tips as just `<strong>` text — must use the `.pro-tip` class.
- **Inline markdown in descriptions and pro-tips (Mandatory):** POI description paragraphs and pro-tip text MUST have markdown syntax converted to HTML before output — never call `escapeHtml()` directly on raw description/pro-tip strings. Specifically: `[text](url)` → `<a href="url" target="_blank" rel="noopener noreferrer">text</a>`, `**text**` → `<strong>text</strong>`. Use `renderInlineMd()` (which calls `processInlineMd()`) for all description and pro-tip output. Violation: raw `[text](url)` appearing as visible text in the rendered HTML. Test: TC-161.

### Sidebar Logo
- Include emoji in sidebar logo: `🌐 TravelUI`

### Banner Titles
- Use emoji in `day-card__banner-title` (e.g., `День 1 — Остров Маргит 🏊`)

### Themed Container Rule (Mandatory)

A **themed container** is any element that meets BOTH conditions:
1. It has a gradient background, solid colored background, or any background that is visually distinct from the default page background.
2. It sets an explicit `color` on itself (or inherits a non-default text color from its parent) that differs from `var(--color-text-primary)`.

**Known themed containers:** `.day-card__banner` (gradient background + `color: var(--color-text-inverse)`).

**Rule:** Every child element inside a themed container that uses a semantic HTML tag (`h1`-`h6`, `p`, `a`, `span` containing visible text) **MUST** have an explicit `color` declaration in its own CSS class. Do NOT rely on CSS `color` inheritance inside themed containers.

**Reason:** Global CSS resets (e.g., `h1, h2, h3, h4, h5, h6 { color: var(--color-text-primary) }`) target semantic tags with higher specificity than inherited `color` from a parent class. This causes child text to silently revert to the default dark color on a colored/gradient background, producing unreadable text.

**Canonical example — `.day-card__banner`:**

```css
/* Parent sets color on the container */
.day-card__banner {
  background: linear-gradient(135deg, var(--color-brand-primary), var(--color-brand-accent-alt));
  color: var(--color-text-inverse);
}

/* REQUIRED: children must set color explicitly */
.day-card__banner-title {
  color: var(--color-text-inverse);  /* Explicit — survives global h2 reset */
}

.day-card__banner-date {
  color: var(--color-text-inverse);  /* Explicit — belt-and-suspenders, safe even if tag changes */
}
```

**When adding new themed containers:** Apply this rule to all child text elements. Add the new container to the "Known themed containers" list above, and extend the pre-regression validation gate (item 12 in `development_rules.md` Section 3) to include the new container's child classes.

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
Transform trip data from the modular trip folder (`generated_trips/trip_YYYY-MM-DD_HHmm/`) into per-day HTML fragments and assemble them into the `base_layout.html` shell using the Enterprise Design System.

### Source: Modular Trip Folder
The pipeline reads from the trip folder structure defined in `content_format_rules.md`:
- `overview_LANG.md` — header, holiday advisory, Phase A table → `#overview` section
- `day_00_LANG.md` through `day_NN_LANG.md` — each day → one `#day-{N}` section
- `budget_LANG.md` — aggregated budget → `#budget` section

### Step 1: Analyze Data
- Read `manifest.json` from the trip folder to determine total days and their status.
- Verify all days have `status: "complete"` before full HTML generation.
- Map activity types to their corresponding SVG icons as per the Component Usage Rules above.

### Step 2: Per-Day Fragment Generation (Script-Based)

Fragment generation is handled by two deterministic Node.js/TypeScript scripts in `automation/scripts/`. No LLM subagents are spawned for fragment generation.

#### Step 2a: Shell Fragments (Script)

Run `generate_shell_fragments.ts` to produce PAGE_TITLE, NAV_LINKS, and NAV_PILLS:

```bash
rtk npx tsx automation/scripts/generate_shell_fragments.ts \
  --trip-folder "{trip_folder_path}" \
  --lang "{lang_code}"
```

The script reads `manifest.json`, enumerates day files, detects accommodation/car-rental presence, and writes `shell_fragments_{lang}.json` to the trip folder. Check exit code — non-zero means error; stderr contains the message. The `shell_fragments_{lang}.json` file is consumed by Step 3.

**Shell Fragments (generated from manifest.json):**

1. **{{PAGE_TITLE}}**: Derived from `manifest.destination` + year + language suffix lookup table. No LLM involvement.

2. **{{NAV_LINKS}}**: List of `<a class="sidebar__link">` tags with inline SVG icons.
   - **Ordering (Mandatory):** `#overview`, `#accommodation` (if exists), `#car-rental` (if exists), `#day-0` (if applicable), `#day-1` through `#day-N`, `#budget`.
   - First item gets `is-active` and `aria-current="page"`.

3. **{{NAV_PILLS}}**: List of `<a class="mobile-nav__pill">` tags.
   - **Ordering:** Must match `{{NAV_LINKS}}` exactly.

#### Step 2b: Batch Assignment

**Removed.** The fragment generation script processes all files in a single sequential invocation; no batching is required.

#### Step 2c: Fragment Generation (Script)

Run `generate_html_fragments.ts` to produce all fragment files in one pass:

```bash
rtk npx tsx automation/scripts/generate_html_fragments.ts \
  --trip-folder "{trip_folder_path}" \
  --lang "{lang_code}"
```

The script generates:
- `fragment_overview_{lang}.html`
- `fragment_accommodation_{lang}.html` (only if `accommodation_{lang}.md` exists)
- `fragment_car_rental_{lang}.html` (only if `car_rental_{lang}.md` exists)
- `fragment_day_00_{lang}.html` through `fragment_day_NN_{lang}.html`
- `fragment_budget_{lang}.html`

The script implements all rules from this file (POI cards, accommodation cards, car rental cards, activity labels, pricing grids, plan B advisories, SVG requirements, themed container rule, etc.). Check exit code — non-zero means error with per-file diagnostics on stderr.

**Incremental rebuild exception:** Pass `--stale-days "N,M"` to regenerate only specific day fragments without regenerating overview/budget/accommodation/car-rental.

#### Step 2d: Fragment Verification

Verify all expected fragment files exist in the trip folder:
- `fragment_overview_{lang}.html`
- `fragment_accommodation_{lang}.html` (only if `accommodation_{lang}.md` exists)
- `fragment_car_rental_{lang}.html` (only if `car_rental_{lang}.md` exists)
- `fragment_day_00_{lang}.html` through `fragment_day_NN_{lang}.html`
- `fragment_budget_{lang}.html`

If any are missing: the script exited with non-zero code and reported the error on stderr. Re-running without fixing the underlying cause will produce the same error. Report and stop — do NOT proceed to assembly.

### Step 2.5: Script Output Contract (replaces Agent Prompt Contract — deprecated)

**The Agent Prompt Contract is deprecated.** HTML generation no longer uses LLM subagents. The deterministic scripts (`generate_shell_fragments.ts` and `generate_html_fragments.ts`) implement all rendering rules from this file.

**Script invocation contract:**

Both scripts accept:
- `--trip-folder <path>` — absolute or relative path to the trip folder (required)
- `--lang <lang_code>` — ISO 639-1 language code matching file suffixes (required)
- `--stale-days <comma-list>` — day numbers to regenerate (`generate_html_fragments.ts` only, incremental mode)

Exit codes: 0 = success; 1 = validation or parse error (message to stderr).

Scripts are located at `automation/scripts/` and run via `npx tsx`. Node.js >= 18 required.

**Output files produced:**
- `shell_fragments_{lang}.json` — PAGE_TITLE, NAV_LINKS, NAV_PILLS (from `generate_shell_fragments.ts`)
- `fragment_overview_{lang}.html`, `fragment_day_NN_{lang}.html`, `fragment_budget_{lang}.html`, and conditional accommodation/car-rental fragments (from `generate_html_fragments.ts`)

### Step 3: Assembly & Final Export

**Read** `{trip_folder}/shell_fragments_{lang}.json` (written by Step 2a script) to obtain PAGE_TITLE, NAV_LINKS, NAV_PILLS, and HTML_LANG_ATTRS. If missing, Step 2a did not complete — re-run the shell fragment script before proceeding.

1. **Read** (do not modify) `base_layout.html` to use as a template.
2. **Assemble** `{{TRIP_CONTENT}}` by reading and concatenating these fragment files from the trip folder, in order:
   - `fragment_overview_LANG.html` — the `#overview` section
   - `fragment_accommodation_LANG.html` (if exists) — the `#accommodation` section
   - `fragment_car_rental_LANG.html` (if exists) — the `#car-rental` section
   - `fragment_day_00_LANG.html` through `fragment_day_NN_LANG.html` — day cards, in chronological order
   - `fragment_budget_LANG.html` — the `#budget` section
   All fragment types are read exclusively from their respective files. There is no inline or embedded fallback. Accommodation and car rental fragments are conditionally included only when their source markdown files exist.
3. **Inject** all fragments into the placeholders (PAGE_TITLE, NAV_LINKS, NAV_PILLS, TRIP_CONTENT, HTML_LANG_ATTRS). For Hebrew, HTML_LANG_ATTRS = `lang="he" dir="rtl"`.
4. **Save** the result as `trip_full_LANG.html` inside the trip folder.
5. **Validation:** Ensure the original `base_layout.html` still contains its `{{PAGE_TITLE}}`, `{{NAV_LINKS}}`, `{{NAV_PILLS}}`, `{{TRIP_CONTENT}}`, `{{HTML_LANG_ATTRS}}` placeholders for future use.

### Incremental HTML Rebuild

When a single day is edited (detected via `manifest.json → assembly.stale_days`):

1. **Regenerate** only the HTML fragment for the stale day(s) using the `--stale-days` flag:
   ```bash
   rtk npx tsx automation/scripts/generate_html_fragments.ts \
     --trip-folder "{trip_folder_path}" \
     --lang "{lang_code}" \
     --stale-days "{comma-separated day numbers}"
   ```
2. **Re-run shell fragment script** if navigation structure changed (days added/removed/renamed, accommodation or car-rental files added/removed):
   ```bash
   rtk npx tsx automation/scripts/generate_shell_fragments.ts \
     --trip-folder "{trip_folder_path}" \
     --lang "{lang_code}"
   ```
3. **Re-assemble** `trip_full_LANG.html`:
   - Read the existing `trip_full_LANG.html`.
   - Locate the `<div class="day-card" id="day-{N}">` section for the stale day.
   - Replace that section's HTML with the newly generated fragment.
   - If navigation changed, read updated `shell_fragments_{lang}.json` and replace `{{NAV_LINKS}}` and `{{NAV_PILLS}}` sections.
4. **Update** `manifest.json`: clear the rebuilt days from `stale_days`, update `assembly.trip_full_html_built`.
5. **Run** pre-regression validation (see `development_rules.md`) on the rebuilt HTML.

**When to do a full rebuild instead:**
- Days were added or removed (not just edited).
- Overview, accommodation, car rental, or budget changed.
- More than half the days are stale.

**Constraints:**
- Output the final, fully-assembled HTML file. Do NOT modify `rendering_style_config.css` or `base_layout.html` source files.
- **CSS Inlining (Mandatory):** During assembly, replace the `<link rel="stylesheet" href="rendering_style_config.css">` tag in `base_layout.html` with a `<style>` block containing the full contents of `rendering_style_config.css`. The Google Fonts `<link>` tags may remain (they are external CDN resources). The output must never reference `rendering_style_config.css` via `<link>`.
- **SVG Resilience:** Every inline `<svg>` element in the output must have explicit `width` and `height` HTML attributes.
- **Country Flag Rule (Mandatory):** Windows does not render country flag emojis — it displays two-letter ISO codes (e.g., "HU" instead of a flag). Therefore, **never use flag emojis** in the HTML output. Instead, render the destination country's flag as an inline `<svg>` with the correct colors. The SVG must have `width="28" height="20"`, `role="img"`, `aria-label="{Country} flag"`, `style="vertical-align:middle;display:inline-block;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.1)"`. Look up the official flag colors for the destination from the active trip details file (identified by `trip_details_file` in `manifest.json`) → `trip_context.destination`.
- **Post-Action:** Confirm the successful creation of `trip_full.html` in the trip folder.
- **Consistency:** Ensure the timestamp logic and contrast rules from the external config are applied to every export.