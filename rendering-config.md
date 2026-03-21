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
- Links: **Emoji prefixes are MANDATORY** in the rendered `<a>` text: `📍 Maps`, `🌐 Сайт`, `📸 Фото`. The SVG icon is purely decorative; the emoji is part of the visible label and must always appear after the `</svg>` and before the text word.
- **Link Label Consistency (Mandatory):** All website/site links MUST use the exact label `🌐 Сайт`. Never replace with brand names, abbreviations, or custom text (e.g., do NOT use `🌐 CBA`, `🌐 Инфо`, `🌐 Меню`). The label is always `Сайт` regardless of the destination URL.
- **Grocery store tag (Mandatory POI):** Every `### 🛒` section in the markdown MUST render as a full `poi-card` with tag `<span class="poi-card__tag">🛒 …</span>` (emoji + localized label). Do NOT skip or treat as logistics.
- **Optional stop tag (Mandatory POI):** Every `### 🎯` section in the markdown MUST render as a full `poi-card` with tag `<span class="poi-card__tag">🎯 …</span>` (emoji + localized label). Do NOT skip or treat as logistics.

### POI Card Parity Rule (Mandatory)
- Every `###` section in the source markdown that describes a Point of Interest **MUST** be rendered as exactly one `<div class="poi-card">` in the HTML output. POI sections are identified by their heading emoji: 🛒 (grocery store), 🎯 (optional along-the-way stop), and all other POI types (attractions, restaurants, activities, etc.). The only `###` sections that are NOT POIs are those starting with logistics, cost, or backup-plan markers. Grocery and optional stops are full POIs — they get `poi-card` treatment like any other POI.
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

### Daily Route Map Link
- **Placement:** Render `<a class="map-link">` **before** the `<div class="itinerary-table-wrapper">`, immediately after the `<div class="day-card__content">` opening tag.
- Do NOT place it after the itinerary table.

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
- **No day-number column:** The overview table must NOT include a "День" column with numeric day indices (0, 1, 2…). Start with "Дата" (date) as the first column.

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
Transform trip data from the modular trip folder (`generated_trips/trip_YYYY-MM-DD_HHmm/`) into per-day HTML fragments and assemble them into the `base_layout.html` shell using the Enterprise Design System.

### Source: Modular Trip Folder
The pipeline reads from the trip folder structure defined in `content_format_rules.md`:
- `overview.md` — header, holiday advisory, Phase A table → `#overview` section
- `day_00.md` through `day_NN.md` — each day → one `#day-{N}` section
- `budget.md` — aggregated budget → `#budget` section

### Step 1: Analyze Data
- Read `manifest.json` from the trip folder to determine total days and their status.
- Verify all days have `status: "complete"` before full HTML generation.
- Map activity types to their corresponding SVG icons as per the Component Usage Rules above.

### Step 2: Per-Day Fragment Generation

Generate per-day HTML fragments using batched parallel subagents for full generation mode. Each `day_XX.md` produces one HTML fragment file containing:
- The `<div class="day-card" id="day-{N}">` wrapper with banner.
- The itinerary table for that day.
- All POI cards for that day.
- The daily budget pricing grid.
- Plan B advisory section.

This per-day approach avoids output token limits — each day's HTML is generated independently.

#### Step 2a: Shell Fragments (Sequential)

Generate the three shell fragments sequentially. These provide navigation context required by day fragment subagents and must be resolved before the parallel step.

**Shell Fragments (generated once from overview.md + manifest.json):**

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

#### Step 2b: Batch Assignment for Day Fragments

Divide all days (day_00 through day_NN) into contiguous batches using the same sizing table as Phase B (see `content_format_rules.md` § Day Generation Protocol):

| Total Days (N) | Batch Count | Batch Size |
|---|---|---|
| 0 | 0 | — (no day fragments to generate) |
| 1 | 1 | 1 |
| 2-3 | 2 | ceil(N/2) |
| 4-11 | 3 | ceil(N/3) |
| 12+ | 4 | ceil(N/4) |

Batches are assigned in chronological order: batch 1 gets the lowest-numbered days, batch 2 the next range, etc. The last batch may contain fewer days (remainder). Every day must appear in exactly one batch — no gaps, no overlaps.

**Example:** 12 days (day_00 through day_11), 4 batches of ceil(12/4) = 3:
- Batch 1: day_00, day_01, day_02
- Batch 2: day_03, day_04, day_05
- Batch 3: day_06, day_07, day_08
- Batch 4: day_09, day_10, day_11

#### Step 2c: Parallel Subagent Execution

Spawn all subagents in the same single response block using the Agent tool: one overview subagent, one budget subagent, and one subagent per day batch. **All subagent calls must appear in the same response block** so they execute in parallel, not sequentially. No subagent within this block may depend on the output of any other subagent within this block.

**Overview subagent:**
- Receives: `rendering-config.md` + `overview_LANG.md` + `manifest.json` (see Step 2.5 for full contract).
- Writes: `fragment_overview_LANG.html` to the trip folder.
- Fragment contains only the `<section id="overview">...</section>` block — no `<html>`, `<head>`, or `<body>` wrappers.
- Does NOT modify day fragments, shell fragments, budget fragment, or `manifest.json`.

**Budget subagent:**
- Receives: `rendering-config.md` + `budget_LANG.md` + `manifest.json` (see Step 2.5 for full contract).
- Writes: `fragment_budget_LANG.html` to the trip folder.
- Fragment contains only the `<section id="budget">...</section>` block — no `<html>`, `<head>`, or `<body>` wrappers.
- Does NOT modify day fragments, shell fragments, overview fragment, or `manifest.json`.

**Day batch subagents (one per batch):**
- Each receives the context defined in Step 2.5 (Agent Prompt Contract) plus its batch-specific day assignment.
- Reads only its assigned `day_XX_LANG.md` files from the trip folder.
- Generates one `fragment_day_XX_LANG.html` file per assigned day, written to the trip folder.
- Each fragment file contains only the `<div class="day-card" id="day-{N}">...</div>` block — no `<html>`, `<head>`, or `<body>` wrappers.
- Does NOT read or write fragment files outside its assigned day range.
- Does NOT modify `manifest.json`, shell fragments, overview fragment, or budget fragment.

Fragment files are ephemeral build artifacts: overwritten on each full generation and not used by incremental rebuild mode.

**Incremental rebuild exception:** Overview and budget parallel subagents are a full-generation-only pattern. In incremental rebuild mode (single-day edits via `stale_days`), skip overview and budget subagents — generate only the stale day fragment(s) sequentially.

#### Step 2d: Fragment Verification

After all subagents return, verify that ALL expected fragment files exist in the trip folder:
- `fragment_overview_LANG.html`
- `fragment_day_00_LANG.html` through `fragment_day_NN_LANG.html`
- `fragment_budget_LANG.html`

Verification is independent per fragment type. A missing day fragment does not affect the overview/budget retry, and vice versa.

- **All present:** Proceed to Step 3 (Assembly).
- **Missing day fragment(s):** Identify the failed batch(es). Re-spawn one subagent per failed batch (single retry). After retry, verify day fragments again:
  - All day fragments present: continue with overview/budget check.
  - Still missing: report the missing day numbers and stop.
- **Missing `fragment_overview_LANG.html`:** Re-spawn only the overview subagent (single retry). After retry, verify overview fragment again:
  - Present: continue.
  - Still missing: report and stop.
- **Missing `fragment_budget_LANG.html`:** Re-spawn only the budget subagent (single retry). After retry, verify budget fragment again:
  - Present: continue.
  - Still missing: report and stop.

Do NOT proceed to Step 3 (Assembly) with any fragment missing. All three fragment types (overview, days, budget) must be fully present before assembly.

Verification checks fragment file existence only — content validation happens in Step 4 (pre-regression gate).

### Step 2.5: Agent Prompt Contract (Mandatory)
When delegating HTML fragment generation to a sub-agent (whether for full parallel generation or single-day incremental rebuild), the prompt MUST include these items:

#### Core Contract (9 mandatory items)
1. The full `TripPage.ts` — defines the structural contract (CSS classes, IDs, locators)
2. The `rendering-config.md` — component structure and design system rules
3. Explicit list of required section IDs: `#overview`, `#budget`, `#day-0` (if applicable) through `#day-N`
4. Advisory class rules: `.advisory--warning` = Holiday Advisory ONLY; `.advisory--info` = Plan B + Logistics
5. Pro-tip rule: wrap in `<div class="pro-tip">`, not just `<strong>` text
6. SVG rule: sidebar links need inline `<svg>` with explicit `width`/`height`
7. CSS inlining rule: full CSS in `<style>` tag, never `<link>`
8. Activity label linking rule: POI-referencing labels use `<a class="activity-label" href="#poi-day-{D}-{N}">`, POI cards have matching `id="poi-day-{D}-{N}"`
9. **Modular source rule:** HTML is generated per-day from individual `day_XX.md` files, not from a monolithic trip file. The agent must read each day file separately and produce one HTML fragment file per day.

#### Batch-Specific Context (for parallel day batch subagents)
10. **Assigned day list:** Explicit list of day numbers the subagent must generate (e.g., "Generate fragments for day_03, day_04, day_05"). The subagent generates ONLY these days.
11. **Day source files:** Only the `day_XX_LANG.md` files for the assigned batch — not all day files.
12. **Shell context (read-only):** `overview_LANG.md` and `manifest.json` for cross-referencing (trip metadata, navigation structure). The subagent does NOT regenerate shell, overview, or budget fragments.
13. **Fragment output path:** The trip folder path where `fragment_day_XX_LANG.html` files must be written.

#### Overview Subagent Context (for parallel overview fragment generation)
14. **Source file:** `overview_LANG.md` from the trip folder.
15. **Reference file:** `manifest.json` for trip metadata.
16. **Output file:** `fragment_overview_LANG.html` written to the trip folder. Contains only the `<section id="overview">...</section>` block — no `<html>`, `<head>`, or `<body>` wrappers.
17. **Isolation:** The overview subagent MUST NOT modify day fragments, shell fragments, budget fragment, or `manifest.json`. It does NOT require NAV_LINKS or NAV_PILLS.

#### Budget Subagent Context (for parallel budget fragment generation)
18. **Source file:** `budget_LANG.md` from the trip folder.
19. **Reference file:** `manifest.json` for trip metadata.
20. **Output file:** `fragment_budget_LANG.html` written to the trip folder. Contains only the `<section id="budget">...</section>` block — no `<html>`, `<head>`, or `<body>` wrappers.
21. **Isolation:** The budget subagent MUST NOT modify day fragments, shell fragments, overview fragment, or `manifest.json`. It does NOT require NAV_LINKS or NAV_PILLS.

**Gate:** Never delegate HTML generation without all 9 core items in the prompt. For parallel day batch subagents, items 10-13 are also mandatory. For the overview subagent, items 14-17 are mandatory. For the budget subagent, items 18-21 are mandatory. See `development_rules.md` Rule 4.

### Step 3: Assembly & Final Export
1. **Read** (do not modify) `base_layout.html` to use as a template.
2. **Assemble** `{{TRIP_CONTENT}}` by reading and concatenating these fragment files from the trip folder, in order:
   - `fragment_overview_LANG.html` — the `#overview` section
   - `fragment_day_00_LANG.html` through `fragment_day_NN_LANG.html` — day cards, in chronological order
   - `fragment_budget_LANG.html` — the `#budget` section
   All three fragment types are read exclusively from their respective files. There is no inline or embedded fallback for overview or budget content.
3. **Inject** all fragments into the placeholders.
4. **Save** the result as `trip_full_LANG.html` inside the trip folder.
5. **Validation:** Ensure the original `base_layout.html` still contains its `{{PAGE_TITLE}}`, `{{NAV_LINKS}}`, `{{NAV_PILLS}}`, `{{TRIP_CONTENT}}` placeholders for future use.

### Incremental HTML Rebuild

When a single day is edited (detected via `manifest.json → assembly.stale_days`):

1. **Regenerate** only the HTML fragment for the stale day(s) from their updated `day_XX.md`.
2. **Re-assemble** `trip_full_LANG.html`:
   - Read the existing `trip_full_LANG.html`.
   - Locate the `<div class="day-card" id="day-{N}">` section for the stale day.
   - Replace that section's HTML with the newly generated fragment.
   - If navigation changed (days added/removed), regenerate `{{NAV_LINKS}}` and `{{NAV_PILLS}}`.
3. **Update** `manifest.json`: clear the rebuilt days from `stale_days`, update `assembly.trip_full_html_built`.
4. **Run** pre-regression validation (see `development_rules.md`) on the rebuilt HTML.

**When to do a full rebuild instead:**
- Days were added or removed (not just edited).
- Overview or budget changed.
- More than half the days are stale.

**Constraints:**
- Output the final, fully-assembled HTML file. Do NOT modify `rendering_style_config.css` or `base_layout.html` source files.
- **CSS Inlining (Mandatory):** During assembly, replace the `<link rel="stylesheet" href="rendering_style_config.css">` tag in `base_layout.html` with a `<style>` block containing the full contents of `rendering_style_config.css`. The Google Fonts `<link>` tags may remain (they are external CDN resources). The output must never reference `rendering_style_config.css` via `<link>`.
- **SVG Resilience:** Every inline `<svg>` element in the output must have explicit `width` and `height` HTML attributes.
- **Country Flag Rule (Mandatory):** Windows does not render country flag emojis — it displays two-letter ISO codes (e.g., "HU" instead of a flag). Therefore, **never use flag emojis** in the HTML output. Instead, render the destination country's flag as an inline `<svg>` with the correct colors. The SVG must have `width="28" height="20"`, `role="img"`, `aria-label="{Country} flag"`, `style="vertical-align:middle;display:inline-block;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.1)"`. Look up the official flag colors for the destination from `trip_details.md → trip_context.destination`.
- **Post-Action:** Confirm the successful creation of `trip_full.html` in the trip folder.
- **Consistency:** Ensure the timestamp logic and contrast rules from the external config are applied to every export.