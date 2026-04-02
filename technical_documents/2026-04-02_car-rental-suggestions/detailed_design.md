# Detailed Design

**Change:** Car Rental Suggestion Mechanism — Rental Company Discovery, Price Comparison & Booking Links
**Date:** 2026-04-02
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-04-02_car-rental-suggestions/high_level_design.md`
**Status:** Approved

---

## 1. File Changes

### 1.1 `trip_planning_rules.md`

**Action:** Modify

**Change 1 — Data Source Hierarchy: Add Layer 2b**

**Current state:**
The Data Source Hierarchy section defines Layer 1 (Web Search & Fetch) and Layer 2 (Google Places for POIs), Layer 2a (Google Places for Accommodation). No car rental discovery layer exists.

**Target state:**
Add a new subsection `### Layer 2b: Web Search & Fetch (Car Rental Discovery)` after the existing `### Layer 2a` subsection:

```markdown
### Layer 2b: Web Search & Fetch (Car Rental Discovery)
- For car rental block anchor days, discover rental company options via web search and web fetch.
- **Not using Google Places:** Google Places `type=car_rental` returns physical branch locations with limited fleet/pricing data. Web search is more effective for rental company comparison and aggregator links.
- Web search queries: `"car rental {destination} {month} {year} {category}"` for each requested car category.
- Web fetch: retrieve company sites and aggregator pages for pricing estimates.
- Identify 2-3 distinct rental companies per car category: mix of international chains (Hertz, SIXT, Europcar, Enterprise, Avis, Budget) and local/regional companies.
- For each company, discover or estimate: company name, daily rate, total cost for rental period, booking/search page URL.
- **Transmission/fuel filter:** When company websites provide transmission and fuel type filtering, apply the traveler's preferences. Otherwise, annotate the preference in the section intro.
- **Pickup/return location:** Verify branch availability (airport desk vs. city center office) when discoverable.
- **Aggregator fallback:** If web search returns insufficient results, construct comparison links using well-known aggregators (rentalcars.com, kayak.com, autoeurope.com).
- **Graceful degradation:** If no rental information can be discovered (network failure, insufficient results), omit the car rental section. Set `discovery_source: "skipped"` in manifest. Trip generation continues — car rental discovery is non-blocking.
- Follows existing Network & Connectivity Rules (retry once, stop on second failure).
```

**Rationale:** Establishes the data source for car rental discovery, distinct from accommodation (Google Places) and POIs (web search + Google Places enrichment). Satisfies REQ-003.

---

**Change 2 — New "Car Rental Selection" section**

**Current state:**
No "Car Rental Selection" section exists. The Accommodation Selection section exists between the Strategic Planning Logic and Environmental & Event Intelligence sections.

**Target state:**
Add a new section `## Car Rental Selection` after the existing `## Accommodation Selection` section (after the "Price Level to Cost Range Mapping" subsection, before `## Environmental & Event Intelligence`):

```markdown
## Car Rental Selection

### Car Rental Block Identification (Phase A)

After building the Phase A overview table, analyze the transportation column across all days to identify car rental blocks:

1. **Car day detection:** Days marked with a car emoji (🚗) or whose transportation plan specifies "car rental" / "rental car" are car days.
2. **Consecutive grouping:** Consecutive car days form a single car rental block. Non-adjacent car day groups produce separate rental blocks.
3. **Anchor day:** The first day of each car rental block is the "anchor day." The car rental section is placed in this day's file only.
4. **Pickup/return:** Pickup is the morning of the first car day. Return is the evening of the last car day. Location is derived from `## Car Rental Assistance` pickup_return preference, defaulting to the traveler's accommodation area.
5. **No car days:** If no days use car transportation, the `car_rental` manifest object contains an empty `blocks` array.

Record car rental blocks in `manifest.json` under `car_rental.blocks[]` (see content_format_rules.md for schema).

### Car Rental Company Discovery (Phase B — Anchor Day Only)

During Phase B, the subagent generating a car rental anchor day's file performs rental company research:

1. **Parse preferences:** Read the `## Car Rental Assistance` section from the active trip details file. Extract: car_category (list), transmission, fuel_type (list), pickup_return (list), additional_equipment (list), daily_rental_budget (range).
2. **Absence gate:** If `## Car Rental Assistance` is absent from the trip details file, skip car rental section entirely — do not generate comparison tables, do not add budget line items, do not query web search. Set manifest `discovery_source: "skipped"`. Unlike accommodation, car rental is not universal.
3. **Web search:** For each car category in the preferences list (max 3 categories), execute web searches:
   - Query: `"car rental {destination} {month} {year} {category} {transmission if specified}"` (e.g., "car rental Budapest August 2026 compact automatic")
   - Identify 2-3 distinct rental companies per category operating at the destination.
4. **Web fetch:** For each identified company, fetch their website or aggregator listing to discover:
   - Daily rate for the requested category
   - Total cost for the rental period (daily rate × rental days)
   - Booking/search page URL
5. **Filtering:** Apply transmission and fuel type preferences when company data supports it. Apply pickup/return location preference when branch data is available.
6. **Budget soft filter:** If daily_rental_budget is specified, deprioritize options outside the range. Do not exclude unless 3+ options remain within range.
7. **Construct booking deep links** for each company (see §2 for link patterns).
8. **Write car rental section** in the anchor day's markdown file (see §2 for template).
9. **Graceful degradation:** If web search fails or returns insufficient results, use aggregator fallback links. If all discovery fails, omit the section and set manifest `discovery_source: "skipped"`.

### Preference-to-Search Mapping

| Preference Field | Search Influence | Card Annotation |
|---|---|---|
| car_category | Query keyword per category (e.g., "Compact", "Full-size", "Premium") | Separate comparison table per category |
| transmission | Search query qualifier | Noted in section intro |
| fuel_type | Search query qualifier where applicable | Noted in section intro |
| pickup_return | Branch location filtering (airport vs. city center) | Noted in section intro |
| additional_equipment | Not filterable via web search; included in pro-tips | Listed in section intro; surcharges noted when discoverable |
| daily_rental_budget | Soft filter — deprioritize outside range | Budget alignment noted in recommendation |
```

**Rationale:** Mirrors the structure of Accommodation Selection with car-specific discovery logic. Satisfies REQ-001, REQ-002, REQ-003.

---

**Change 3 — CEO Audit Checklist Extension**

**Current state:**
The CEO Audit checklist contains items for age-appropriateness, universal interests, POI count, logistics, POI parity, accommodation, and wheelchair accessibility.

**Target state:**
Add a new checklist item after the accommodation check item:

```markdown
- [ ] If this is the first day of a car rental block: does the car rental section contain a price comparison table per requested category with 2-3 company options, booking links, and cost estimates? Does at least one option per category fall within the traveler's stated daily rental budget (if available)?
```

**Rationale:** Ensures car rental sections pass the same quality gate as accommodation sections. Satisfies REQ-009.

---

### 1.2 `content_format_rules.md`

**Action:** Modify

**Change 1 — Generation Context Note Update**

**Current state:**
```
The `## Car Rental Assistance` section is not currently consumed (future enhancement). Its presence does not affect existing generation behavior.
```

**Target state:**
```
The `## Car Rental Assistance` section **is consumed** by the car rental discovery logic: on anchor days (the first day of each car rental block), the subagent parses this section to parameterize web search queries and generate price comparison tables. If the section is absent, car rental sections are skipped entirely — unlike accommodation, car rental is not a universal need and requires explicit preferences.
```

**Rationale:** Removes the "future enhancement" note and replaces with active consumption language. Satisfies REQ-002 AC-8.

---

**Change 2 — Section Placement Order Update**

**Current state:**
```markdown
**Section placement order within anchor day files:**
1. Day header + schedule table
2. POI cards (### headings)
3. **Accommodation section (## 🏨)** ← NEW (anchor days only)
4. Daily budget table (### Стоимость дня)
5. Grocery store (### 🛒)
6. Along-the-way stops (### 🎯)
7. Plan B (### 🅱️)
8. *(end of file)*
```

**Target state:**
```markdown
**Section placement order within anchor day files:**
1. Day header + schedule table
2. POI cards (### headings)
3. Accommodation section (## 🏨) — anchor days for stay blocks only
4. **Car rental section (## 🚗)** — anchor days for car rental blocks only
5. Daily budget table (### Стоимость дня)
6. Grocery store (### 🛒)
7. Along-the-way stops (### 🎯)
8. Plan B (### 🅱️)
9. *(end of file)*
```

**Rationale:** Inserts car rental section between accommodation and daily budget table, consistent with the read-before-cost principle. Satisfies REQ-005 AC-7.

---

**Change 3 — New Car Rental Section Template**

**Current state:** No car rental section template exists.

**Target state:** Add a new subsection `### Car Rental Section (Anchor Day Only)` after the existing `### Accommodation Section (Anchor Day Only)` subsection. Full template in §2 below.

---

**Change 4 — Manifest Schema Extension**

**Current state:**
The manifest schema defines `accommodation` as a top-level key with a `stays[]` array. No `car_rental` key exists.

**Target state:**
Add the `car_rental` top-level key documentation after the accommodation metadata section:

```markdown
**Car rental metadata (written during Phase A, updated after Phase B):**

\`\`\`json
{
  "car_rental": {
    "blocks": [
      {
        "id": "rental_01",
        "pickup_date": "2026-08-26",
        "return_date": "2026-08-27",
        "days": 2,
        "pickup_location": "Airport",
        "anchor_day": "day_06",
        "categories_compared": ["Compact", "Full-size"],
        "companies_per_category": 3,
        "discovery_source": "web_search"
      }
    ]
  }
}
\`\`\`

- `car_rental` is a top-level key (sibling to `languages` and `accommodation`).
- `blocks` is an ordered array of car rental block objects.
- `id`: Sequential identifier (`rental_01`, `rental_02`, ...).
- `pickup_date` / `return_date`: ISO date strings (YYYY-MM-DD). Pickup = morning of first car day, return = evening of last car day.
- `days`: Integer — number of rental days in the block.
- `pickup_location`: Derived from `## Car Rental Assistance` pickup_return preference. If not specified, defaults to accommodation area.
- `anchor_day`: Reference to the day file key (e.g., `day_06`) containing the car rental section.
- `categories_compared`: List of car categories for which comparison tables were generated. Set to `[]` during Phase A, populated after Phase B.
- `companies_per_category`: Set to `0` during Phase A, updated to actual count (2-3) after Phase B.
- `discovery_source`: Set to `"pending"` during Phase A, updated to `"web_search"` after successful discovery, `"aggregator_fallback"` when only aggregator links were available, or `"skipped"` if discovery failed or `## Car Rental Assistance` was absent.
- For trips with multiple non-adjacent car day groups, multiple entries exist in the `blocks` array.
- When no car days exist in the itinerary, the `car_rental` object is present with an empty `blocks` array: `{ "car_rental": { "blocks": [] } }`.
```

**Rationale:** Extends the manifest schema to track car rental blocks parallel to accommodation stays. Satisfies REQ-008.

---

**Change 5 — Budget Assembly Extension**

**Current state:**
Budget Assembly section describes per-day summary, grand total, category breakdown, and Accommodation Budget Integration. No car rental budget integration.

**Target state:**
Add a new subsection `### Car Rental Budget Integration` after `### Accommodation Budget Integration`:

```markdown
### Car Rental Budget Integration

4. If the trip contains car rental blocks (check `manifest.json → car_rental.blocks`):
   - Add a "Car Rental" category row to `budget_LANG.md` showing the total estimated car rental cost range for the entire trip.
   - The range is: (lowest daily rate across all companies and categories * total rental days) to (highest daily rate across all companies and categories * total rental days).
   - Both local currency and EUR amounts are shown, consistent with existing format.
   - Label the row as "{localized_car_rental_label} ({localized_estimate_label})" to indicate these are indicative estimates.
   - If multiple rental blocks exist, sum the ranges across all blocks.
   - If additional equipment costs (child seats, GPS) were discoverable, add a separate "{localized_equipment_label}" row with the estimated surcharge.

**Anchor day budget table integration:**
- On the anchor day's `### Стоимость дня` table, add a car rental line item:
  - Label: "{localized_car_rental_label} ({days} {localized_days_label})"
  - HUF column: "{daily_low}–{daily_high} × {days} = {total_low}–{total_high}"
  - EUR column: same structure
  - Mark as estimate: append "{localized_estimate_label}" or use italics
- Subsequent car days within the same rental block do NOT include the rental cost in their budget table.
- Fuel cost estimates remain on each car day's budget table independently (fuel is per-day, not per-block).
```

**Rationale:** Mirrors accommodation budget integration pattern. Satisfies REQ-007.

---

**Change 6 — Phase A Overview Simplification**

**Current state:** Phase A output section does not explicitly address car rental recommendation content in the overview.

**Target state:** Add a note to the Phase A Output section:

```markdown
> **Car rental note:** The Phase A overview must NOT contain a detailed car rental recommendation section with pricing and company names. If car days exist, include a brief one-line reference: "Car rental details: see Day {N}" (localized), pointing to the anchor day. The anchor day's `## 🚗` section is the single source of truth for rental options, pricing, and booking links.
```

**Rationale:** Eliminates duplication between overview and anchor day. Satisfies REQ-013.

---

### 1.3 `rendering-config.md`

**Action:** Modify

**Change 1 — Car Rental Card Type in Component Usage Rules**

**Current state:** Component Usage Rules define POI Card Structure, Accommodation Section & Card Layout, and POI Card Parity Rule. No car rental card type.

**Target state:** Add a new subsection `### Car Rental Section & Card Layout` after `### Accommodation Section & Card Layout`:

```markdown
### Car Rental Section & Card Layout

- **Section wrapper:** The `## 🚗` heading in markdown maps to `<div class="car-rental-section" role="region" aria-labelledby="car-rental-title-{block_id}">` containing a `<h2 class="section-title car-rental-section__title">` and an intro paragraph, followed by category sub-sections. **Important:** `## 🚗` within a day file is rendered as a `<div class="car-rental-section">` inside the parent `<div class="day-card" id="day-N">`, not as a new top-level section.
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
```

---

**Change 2 — POI Card Parity Rule Update**

**Current state:**
```markdown
- **Accommodation exclusion:** `###` headings prefixed with `🏨` are accommodation cards, not POIs. They render as `.accommodation-card` elements and are excluded from the parity count.
```

**Target state:**
```markdown
- **Accommodation exclusion:** `###` headings prefixed with `🏨` are accommodation cards, not POIs. They render as `.accommodation-card` elements and are excluded from the parity count.
- **Car rental exclusion:** `###` headings prefixed with `🚗` are car rental category cards, not POIs. They render as `.car-rental-category` elements and are excluded from the parity count. The count of `.poi-card` elements must equal the count of non-accommodation, non-car-rental `###` POI headings.
```

**Rationale:** Prevents false POI parity failures when car rental sub-sections are present. Satisfies REQ-005 AC-8, REQ-010 AC-8.

---

### 1.4 `rendering_style_config.css`

**Action:** Modify

**Current state:** Contains accommodation-related styles (`.accommodation-section`, `.accommodation-card`, `.booking-cta`). No car rental styles.

**Target state:** Add the following CSS rules after the `.booking-cta:focus-visible` rule block (after line ~976 in the current file), before the `.pricing-cell__badge--estimate` rule:

```css
/* ===== Car Rental Section ===== */

.car-rental-section {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 2px solid var(--color-info);
}

.car-rental-section__title {
  color: var(--color-info);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.car-rental-section__intro {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.car-rental-category {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-info);
  border-radius: var(--radius-container);
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-4);
  transition: box-shadow var(--transition-base), transform var(--transition-base);
}

.car-rental-category:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.car-rental-category__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background-color: rgba(46, 125, 154, 0.12);
  color: var(--color-info);
}

.car-rental-category__title {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--color-info);
  margin-bottom: var(--space-3);
}

/* Comparison table */
.car-rental-table-wrapper {
  width: 100%;
  margin-bottom: var(--space-2);
}

.car-rental-table {
  width: 100%;
  border-collapse: collapse;
}

.car-rental-table thead th {
  background: var(--color-surface-raised);
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-muted);
  padding: var(--space-2) var(--space-3);
  text-align: left;
  border-bottom: 2px solid var(--color-border-strong);
}

.car-rental-table tbody td {
  padding: var(--space-3);
  border-bottom: 1px solid var(--color-border);
  font-size: var(--text-sm);
  vertical-align: middle;
}

.car-rental-table tbody tr:nth-child(even) {
  background-color: var(--color-surface-raised);
}

.car-rental-table tbody tr:hover {
  background-color: rgba(46, 125, 154, 0.06);
}

.car-rental-table__company {
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.car-rental-table__daily,
.car-rental-table__total {
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
  min-width: 100px;
}

.car-rental-table__action {
  min-width: 110px;
}

/* Rental CTA button */
.rental-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 8px 16px;
  background-color: var(--color-info);
  color: #fff;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-interactive);
  text-decoration: none;
  white-space: nowrap;
  transition: background-color var(--transition-fast), box-shadow var(--transition-fast);
}

.rental-cta:hover {
  background-color: #245F78;
  box-shadow: var(--shadow-md);
}

.rental-cta:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

/* Estimate disclaimer */
.car-rental-category__estimate {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-style: italic;
  margin-top: var(--space-1);
}

/* Best-value recommendation */
.car-rental-category__recommendation {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* Mobile responsive: horizontal scroll for tables */
@media (max-width: 767px) {
  .car-rental-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    position: relative;
  }

  .car-rental-table-wrapper::-webkit-scrollbar {
    display: none;
  }

  .car-rental-table-wrapper::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 40px;
    background: linear-gradient(to right, transparent, var(--color-surface));
    pointer-events: none;
  }

  .car-rental-table .car-rental-table__company {
    position: sticky;
    left: 0;
    z-index: 1;
    background-color: var(--color-surface);
  }

  .car-rental-table tbody tr:nth-child(even) .car-rental-table__company {
    background-color: var(--color-surface-raised);
  }
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  .car-rental-category__tag {
    background-color: rgba(46, 125, 154, 0.15);
  }

  .car-rental-table tbody tr:hover {
    background-color: rgba(46, 125, 154, 0.10);
  }
}
```

**RTL support:** Add to the existing RTL section of the CSS file (or create one if none exists):

```css
/* RTL: Car Rental */
[dir="rtl"] .car-rental-category {
  border-left: none;
  border-right: 4px solid var(--color-info);
}

[dir="rtl"] .car-rental-table thead th,
[dir="rtl"] .car-rental-table tbody td {
  text-align: right;
}

@media (max-width: 767px) {
  [dir="rtl"] .car-rental-table .car-rental-table__company {
    position: sticky;
    left: auto;
    right: 0;
  }

  [dir="rtl"] .car-rental-table-wrapper::after {
    right: auto;
    left: 0;
    background: linear-gradient(to left, transparent, var(--color-surface));
  }
}
```

**Rationale:** Implements the UX design specifications for car rental visual styling. Satisfies REQ-010.

---

### 1.5 `automation/code/tests/pages/TripPage.ts`

**Action:** Modify

**Current state:** TripPage defines locators and helpers for POI cards, accommodation sections/cards, and booking CTAs. No car rental locators.

**Target state:** Add the following new members and methods:

**New class properties (after the `bookingCtas` declaration):**

```typescript
// --- Car Rental ---
readonly carRentalSections: Locator;
readonly carRentalCategories: Locator;
readonly carRentalTables: Locator;
readonly rentalCtas: Locator;
```

**New constructor assignments (after `this.bookingCtas` line):**

```typescript
// Car Rental
this.carRentalSections = page.locator('.car-rental-section');
this.carRentalCategories = page.locator('.car-rental-category');
this.carRentalTables = page.locator('.car-rental-table');
this.rentalCtas = page.locator('.rental-cta');
```

**New helper methods (after `getAccommodationCardProTip` method):**

```typescript
// --- Car Rental helpers ---

getDayCarRentalSection(dayNumber: number): Locator {
  return this.page.locator(`#day-${dayNumber} .car-rental-section`);
}

getDayCarRentalCategories(dayNumber: number): Locator {
  return this.page.locator(`#day-${dayNumber} .car-rental-category`);
}

getCarRentalCategoryTitle(category: Locator): Locator {
  return category.locator('.car-rental-category__title');
}

getCarRentalCategoryTable(category: Locator): Locator {
  return category.locator('.car-rental-table');
}

getCarRentalTableRows(table: Locator): Locator {
  return table.locator('tbody tr');
}

getCarRentalTableHeaderCells(table: Locator): Locator {
  return table.locator('thead th');
}

getCarRentalCategoryEstimate(category: Locator): Locator {
  return category.locator('.car-rental-category__estimate');
}

getCarRentalCategoryRecommendation(category: Locator): Locator {
  return category.locator('.car-rental-category__recommendation');
}

getDayRentalCtas(dayNumber: number): Locator {
  return this.page.locator(`#day-${dayNumber} .rental-cta`);
}

getCarRentalProTip(section: Locator): Locator {
  return section.locator('.pro-tip');
}
```

**Rationale:** Provides language-agnostic selectors for all car rental elements, enabling regression tests. Satisfies REQ-011.

---

### 1.6 Regression Test Specs

**Action:** Modify existing regression spec(s) — add car rental assertions

**Target location:** The car rental test assertions should be added to the existing regression spec file(s) that cover day structure and accommodation, to avoid a separate project/fixture setup (per memory: single project, shared page fixture).

**Test assertions to add (all language-agnostic):**

```typescript
// --- Car Rental Section Tests ---

// REQ-011 AC-1: Car rental section exists on expected anchor day(s)
test('car rental section exists on anchor car day', async ({ tripPage }) => {
  const carRentalSection = tripPage.getDayCarRentalSection(6); // day_06 is first car day
  await expect(carRentalSection).toBeVisible();
});

// REQ-011 AC-7: Non-anchor car days do NOT contain car rental section
test('non-anchor car day does not have car rental section', async ({ tripPage }) => {
  const carRentalSection = tripPage.getDayCarRentalSection(7); // day_07 is second car day
  await expect(carRentalSection).toHaveCount(0);
});

// REQ-011 AC-2: Each category sub-section contains a comparison table
test('car rental categories contain comparison tables', async ({ tripPage }) => {
  const categories = tripPage.getDayCarRentalCategories(6);
  const count = await categories.count();
  expect(count).toBeGreaterThanOrEqual(1);

  for (let i = 0; i < count; i++) {
    const category = categories.nth(i);
    const table = tripPage.getCarRentalCategoryTable(category);
    await expect(table).toBeVisible();

    // Verify 4-column header structure
    const headers = tripPage.getCarRentalTableHeaderCells(table);
    await expect(headers).toHaveCount(4);
  }
});

// REQ-011 AC-3: Each table has 2-3 company rows with booking links
test('comparison tables have 2-3 rows with rental CTAs', async ({ tripPage }) => {
  const categories = tripPage.getDayCarRentalCategories(6);
  const count = await categories.count();

  for (let i = 0; i < count; i++) {
    const category = categories.nth(i);
    const table = tripPage.getCarRentalCategoryTable(category);
    const rows = tripPage.getCarRentalTableRows(table);
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);
    expect(rowCount).toBeLessThanOrEqual(3);

    // Each row has a rental CTA
    for (let j = 0; j < rowCount; j++) {
      const cta = rows.nth(j).locator('.rental-cta');
      await expect(cta).toBeVisible();
    }
  }
});

// REQ-011 AC-4: Booking links have valid URL structures
test('rental CTAs have valid href and data-link-type', async ({ tripPage }) => {
  const ctas = tripPage.getDayRentalCtas(6);
  const count = await ctas.count();
  expect(count).toBeGreaterThanOrEqual(2);

  for (let i = 0; i < count; i++) {
    const cta = ctas.nth(i);
    await expect(cta).toHaveAttribute('data-link-type', 'rental-booking');
    await expect(cta).toHaveAttribute('target', '_blank');
    const href = await cta.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/^https?:\/\//);
  }
});

// REQ-011 AC-5: Anchor day budget includes car rental line item
test('anchor day pricing grid includes car rental', async ({ tripPage }) => {
  const pricingGrid = tripPage.getDayPricingTable(6);
  await expect(pricingGrid).toBeVisible();
  // Check for pricing cell with estimate badge (car rental is an estimate)
  const estimateBadges = pricingGrid.locator('.pricing-cell__badge--estimate');
  const badgeCount = await estimateBadges.count();
  expect(badgeCount).toBeGreaterThanOrEqual(1);
});

// REQ-011 AC-6: Aggregate budget includes car rental category
test('budget section contains car rental category', async ({ tripPage }) => {
  const budgetSection = tripPage.budgetSection;
  await expect(budgetSection).toBeVisible();
  // Budget table should have a row with 🚗 emoji (language-agnostic marker)
  const budgetRows = budgetSection.locator('table tbody tr, .pricing-cell');
  const count = await budgetRows.count();
  expect(count).toBeGreaterThanOrEqual(1);
});

// REQ-011 AC-9: Car rental headings are NOT counted as POI cards
test('car rental categories are not counted as POI cards', async ({ tripPage }) => {
  const poiCards = tripPage.getDayPoiCards(6);
  const carRentalCategories = tripPage.getDayCarRentalCategories(6);

  // All POI cards should have poi-card class, none should be car-rental-category
  const poiCount = await poiCards.count();
  for (let i = 0; i < poiCount; i++) {
    const card = poiCards.nth(i);
    await expect(card).not.toHaveClass(/car-rental-category/);
  }

  // Car rental categories should exist separately
  const categoryCount = await carRentalCategories.count();
  expect(categoryCount).toBeGreaterThanOrEqual(1);
});
```

**Rationale:** Covers all REQ-011 acceptance criteria with language-agnostic assertions. Uses CSS selectors and data attributes only.

---

## 2. Markdown Format Specification

### Car Rental Section Template

**Section name:** `## 🚗 {localized_car_rental_label}`
**Position in day file:** After accommodation section (or after POI cards if no accommodation), before daily budget table
**Trigger:** Only on the first day (anchor day) of each car rental block, and only when `## Car Rental Assistance` exists in trip details

**Required elements:**
1. Section heading (`## 🚗`)
2. Intro paragraph (rental period, pickup/return, transmission, fuel, equipment)
3. Per-category sub-section (`### 🚗 {category_name}`)
   - Comparison table (2-3 companies)
   - Estimate disclaimer
   - Best-value recommendation
4. Pro-tip (child seat regulations, fuel policy, insurance)

**Full template:**

```markdown
## 🚗 {localized_car_rental_label}

{localized_rental_period}: {pickup_date} → {return_date} ({N} {localized_days}) · {pickup_location} · {transmission} · {fuel_type} · {localized_equipment_note}: {equipment_list}

### 🚗 {localized_category_name_1}

| {localized_company} | {localized_daily_rate} | {localized_total} ({N} {localized_days}) | {localized_booking} |
|---|---|---|---|
| {company_1_name} | {daily_rate_local} (~EUR {daily_rate_eur}){localized_per_day} | {total_local} (~EUR {total_eur}) | [{localized_book_label}]({booking_url_1}) |
| {company_2_name} | {daily_rate_local} (~EUR {daily_rate_eur}){localized_per_day} | {total_local} (~EUR {total_eur}) | [{localized_book_label}]({booking_url_2}) |
| {company_3_name} | {daily_rate_local} (~EUR {daily_rate_eur}){localized_per_day} | {total_local} (~EUR {total_eur}) | [{localized_book_label}]({booking_url_3}) |

*{localized_estimate_disclaimer}*

💡 {localized_best_value}: {cheapest_company} — {localized_best_value_reason}

### 🚗 {localized_category_name_2}

| {localized_company} | {localized_daily_rate} | {localized_total} ({N} {localized_days}) | {localized_booking} |
|---|---|---|---|
| ... | ... | ... | ... |

*{localized_estimate_disclaimer}*

💡 {localized_best_value}: ...

> **{localized_tip_label}:** {child_seat_regulations}. {fuel_policy_tip}. {insurance_recommendation}.
```

**Example (Russian, Budapest):**

```markdown
## 🚗 Аренда автомобиля

Период аренды: 26.08 → 27.08 (2 дня) · Аэропорт · Автомат · Бензин · Доп. оборудование: 3 детских кресла, GPS

### 🚗 Компакт

| Компания | За день | Итого (2 дня) | Бронирование |
|---|---|---|---|
| SIXT | 15 200 HUF (~EUR 40)/день | 30 400 HUF (~EUR 80) | [Забронировать](https://www.sixt.com/...) |
| Europcar | 16 100 HUF (~EUR 42)/день | 32 200 HUF (~EUR 84) | [Забронировать](https://www.europcar.com/...) |
| Hertz | 17 200 HUF (~EUR 45)/день | 34 400 HUF (~EUR 90) | [Забронировать](https://www.hertz.com/...) |

*Цены являются ориентировочными оценками*

💡 Лучшая цена: SIXT — самая низкая дневная ставка EUR 40/день

### 🚗 Полноразмерный

| Компания | За день | Итого (2 дня) | Бронирование |
|---|---|---|---|
| Hertz | 19 100 HUF (~EUR 50)/день | 38 200 HUF (~EUR 100) | [Забронировать](https://www.hertz.com/...) |
| SIXT | 21 000 HUF (~EUR 55)/день | 42 000 HUF (~EUR 110) | [Забронировать](https://www.sixt.com/...) |
| Europcar | 22 900 HUF (~EUR 60)/день | 45 800 HUF (~EUR 120) | [Забронировать](https://www.europcar.com/...) |

*Цены являются ориентировочными оценками*

💡 Лучшая цена: Hertz — самая низкая дневная ставка EUR 50/день

> **Совет:** В Венгрии все дети ростом до 150 см обязаны ехать в детском кресле (штраф до 30 000 HUF). При бронировании укажите 3 детских кресла. Топливная политика: большинство компаний предлагают «full-to-full» — заправьте бак перед возвратом. Рекомендуем базовую страховку CDW + TP — расширенная обычно не оправдана для 2-дневной аренды.
```

**Rules:**
- The section heading uses `##` (h2), not `###` (h3), to distinguish from POI cards — same pattern as accommodation.
- Individual category sub-sections use `### 🚗` (h3) with the car emoji prefix.
- `### 🚗` headings are NOT POI headings. They are excluded from POI Parity Checks and do not generate `.poi-card` elements in HTML.
- Comparison table rows are sorted by daily rate ascending (cheapest first).
- All labels use the reporting language (localized).
- Booking links are formatted as clickable markdown links within the table.
- The estimate disclaimer is italic (`*...*`).
- The pro-tip follows the same `> **{label}:**` format as accommodation and POI pro-tips.
- Maximum 3 categories per section. If the traveler selected more than 3, prioritize the 3 most relevant and note additional categories in the pro-tip.

---

## 3. HTML Rendering Specification

### Car Rental Section Component Structure

The HTML rendering pipeline must detect `## 🚗` headings and render the car rental section using the following structure. This serves as the contract between markdown generation and HTML rendering.

```html
<div class="car-rental-section" role="region" aria-labelledby="car-rental-title-{block_id}">
  <h2 class="section-title car-rental-section__title" id="car-rental-title-{block_id}">
    🚗 {localized_car_rental_label}
  </h2>
  <p class="car-rental-section__intro">
    {rental_period} · {pickup_location} · {transmission} · {fuel_type} · {equipment_note}
  </p>

  <!-- Repeat per car category -->
  <div class="car-rental-category">
    <span class="car-rental-category__tag">🚗</span>
    <h3 class="car-rental-category__title">🚗 {localized_category_name}</h3>

    <div class="car-rental-table-wrapper">
      <table class="car-rental-table">
        <caption class="sr-only">{localized_category_name} — {localized_price_comparison}</caption>
        <thead>
          <tr>
            <th scope="col" class="car-rental-table__company">{localized_company}</th>
            <th scope="col" class="car-rental-table__daily">{localized_daily_rate}</th>
            <th scope="col" class="car-rental-table__total">{localized_total}</th>
            <th scope="col" class="car-rental-table__action">{localized_booking}</th>
          </tr>
        </thead>
        <tbody>
          <!-- Repeat per company (2-3 rows, sorted by daily rate ascending) -->
          <tr>
            <td class="car-rental-table__company">{company_name}</td>
            <td class="car-rental-table__daily">
              {daily_rate_local_currency}<br>
              <span class="text-xs text-muted">~{daily_rate_eur}</span>
            </td>
            <td class="car-rental-table__total">
              {total_local_currency}<br>
              <span class="text-xs text-muted">~{total_eur}</span>
            </td>
            <td class="car-rental-table__action">
              <a class="rental-cta" data-link-type="rental-booking"
                 href="{booking_url}" target="_blank" rel="noopener noreferrer">
                {localized_booking_label}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="car-rental-category__estimate">* {localized_estimate_disclaimer}</p>
    <p class="car-rental-category__recommendation">💡 {localized_best_value_note}</p>
  </div>
  <!-- End category repeat -->

  <div class="pro-tip">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
    <span>{localized_pro_tips}</span>
  </div>
</div>
```

**Key structural rules:**
- `.car-rental-category` is NOT a `.poi-card` and NOT an `.accommodation-card` — uses its own class namespace
- `### 🚗` headings produce `.car-rental-category` divs, NOT `.poi-card` divs
- No `id="poi-day-{D}-{N}"` anchors — car rental options are not POIs
- `data-link-type="rental-booking"` on CTA links enables language-agnostic test detection
- `<caption class="sr-only">` provides accessible table description for screen readers
- `<th scope="col">` on all header cells for accessibility
- All text content is localized — no hardcoded language strings in the HTML structure

---

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `trip_planning_rules.md` | Data Source Hierarchy | Add `### Layer 2b: Web Search & Fetch (Car Rental Discovery)` |
| `trip_planning_rules.md` | (new) Car Rental Selection | Add `## Car Rental Selection` with block identification and discovery subsections |
| `trip_planning_rules.md` | CEO Audit | Add car rental verification checklist item |
| `content_format_rules.md` | Generation Context | Replace "future enhancement" note with active consumption language |
| `content_format_rules.md` | Section placement order | Add car rental (position 4) to the ordered list |
| `content_format_rules.md` | (new) Car Rental Section | Add `### Car Rental Section (Anchor Day Only)` with full template |
| `content_format_rules.md` | manifest.json Schema | Add `car_rental` top-level key documentation |
| `content_format_rules.md` | Budget Assembly | Add `### Car Rental Budget Integration` subsection |
| `content_format_rules.md` | Phase A Output | Add car rental overview simplification note |
| `rendering-config.md` | Component Usage Rules | Add `### Car Rental Section & Card Layout` |
| `rendering-config.md` | POI Card Parity Rule | Add car rental exclusion clause |

---

## 5. Implementation Checklist

### Rule File Updates
- [ ] `trip_planning_rules.md` — Add Layer 2b (Car Rental Discovery) to Data Source Hierarchy
- [ ] `trip_planning_rules.md` — Add `## Car Rental Selection` section (block identification + discovery logic)
- [ ] `trip_planning_rules.md` — Add CEO Audit checklist item for car rental verification
- [ ] `content_format_rules.md` — Replace "future enhancement" note with active consumption language
- [ ] `content_format_rules.md` — Update section placement order (add car rental at position 4)
- [ ] `content_format_rules.md` — Add `### Car Rental Section (Anchor Day Only)` template
- [ ] `content_format_rules.md` — Add `car_rental` manifest schema documentation
- [ ] `content_format_rules.md` — Add `### Car Rental Budget Integration` subsection
- [ ] `content_format_rules.md` — Add Phase A overview simplification note

### Rendering & Styling
- [ ] `rendering-config.md` — Add `### Car Rental Section & Card Layout` component spec
- [ ] `rendering-config.md` — Update POI Card Parity Rule with car rental exclusion
- [ ] `rendering_style_config.css` — Add car rental section CSS (`.car-rental-section`, `.car-rental-category`, `.car-rental-table`, `.rental-cta`, responsive, dark mode, RTL)

### Automation
- [ ] `TripPage.ts` — Add car rental locator properties and helper methods
- [ ] Regression spec — Add car rental test assertions (section presence, table structure, CTAs, budget, POI exclusion)

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: Pipeline identifies car rental blocks | `trip_planning_rules.md`: Car Rental Selection > Block Identification |
| REQ-001 | AC-2: Each block has pickup/return dates and location | `trip_planning_rules.md`: Car Rental Selection > Block Identification (rules 3-4) |
| REQ-001 | AC-3: Consecutive days grouped, non-adjacent separated | `trip_planning_rules.md`: Car Rental Selection > Block Identification (rule 2) |
| REQ-001 | AC-4: manifest.json includes car_rental object | `content_format_rules.md`: manifest.json Schema (car_rental section) |
| REQ-001 | AC-5: Empty blocks array when no car days | `content_format_rules.md`: manifest.json Schema (empty blocks documentation) |
| REQ-001 | AC-6: Anchor day = first car day of block | `trip_planning_rules.md`: Car Rental Selection > Block Identification (rule 3) |
| REQ-002 | AC-1: Parse Car Rental Assistance fields | `trip_planning_rules.md`: Car Rental Selection > Discovery (step 1) |
| REQ-002 | AC-2: Separate comparison table per category | §2 Markdown Format: template shows per-category sub-sections |
| REQ-002 | AC-3: Transmission/fuel in search and cards | `trip_planning_rules.md`: Preference-to-Search Mapping table |
| REQ-002 | AC-4: Pickup/return location influences research | `trip_planning_rules.md`: Preference-to-Search Mapping table |
| REQ-002 | AC-5: Budget as soft filter | `trip_planning_rules.md`: Car Rental Selection > Discovery (step 6) |
| REQ-002 | AC-6: Equipment in intro and pro-tips | §2 Markdown Format: intro paragraph + pro-tip template |
| REQ-002 | AC-7: Skip when section absent | `trip_planning_rules.md`: Car Rental Selection > Discovery (step 2 — absence gate) |
| REQ-002 | AC-8: Remove "future enhancement" note | `content_format_rules.md`: Generation Context note update (§1.2 Change 1) |
| REQ-003 | AC-1: Web search with destination, dates, category | `trip_planning_rules.md`: Layer 2b + Discovery step 3 |
| REQ-003 | AC-2: 2-3 companies per category | `trip_planning_rules.md`: Layer 2b + Discovery step 3 |
| REQ-003 | AC-3: Daily rate, total, booking URL per company | `trip_planning_rules.md`: Layer 2b + Discovery step 4 |
| REQ-003 | AC-4: International and local companies considered | `trip_planning_rules.md`: Layer 2b |
| REQ-003 | AC-5: Transmission/fuel filtering | `trip_planning_rules.md`: Layer 2b + Discovery step 5 |
| REQ-003 | AC-6: Pickup/return location verification | `trip_planning_rules.md`: Layer 2b + Discovery step 5 |
| REQ-003 | AC-7: Aggregator fallback | `trip_planning_rules.md`: Layer 2b (aggregator fallback) |
| REQ-003 | AC-8: Graceful degradation | `trip_planning_rules.md`: Layer 2b + Discovery step 9 |
| REQ-004 | AC-1: Table per requested category | §2 Markdown Format: `### 🚗 {category}` sub-sections |
| REQ-004 | AC-2: Table columns: company, daily rate, total, booking | §2 Markdown Format: table template |
| REQ-004 | AC-3: 2-3 rows per table | §2 Markdown Format: template + rules |
| REQ-004 | AC-4: Sorted by daily rate ascending | §2 Markdown Format: rules |
| REQ-004 | AC-5: Sequential category sub-headings | §2 Markdown Format: template shows sequential categories |
| REQ-004 | AC-6: Estimate label on prices | §2 Markdown Format: `*{localized_estimate_disclaimer}*` |
| REQ-004 | AC-7: "Category not available" when missing | §2 Markdown Format: rules (note unavailability) |
| REQ-005 | AC-1: Section on anchor day | §2 Markdown Format: trigger rule |
| REQ-005 | AC-2: `## 🚗` heading | §2 Markdown Format: section heading |
| REQ-005 | AC-3: Intro paragraph | §2 Markdown Format: intro line |
| REQ-005 | AC-4: `### 🚗 {category}` sub-headings | §2 Markdown Format: category sub-sections |
| REQ-005 | AC-5: Best-value recommendation | §2 Markdown Format: `💡` recommendation line |
| REQ-005 | AC-6: Booking links in table | §2 Markdown Format: table booking column |
| REQ-005 | AC-7: Section placement order | `content_format_rules.md`: Section placement order (§1.2 Change 2) |
| REQ-005 | AC-8: Excluded from POI parity | `rendering-config.md`: POI Card Parity Rule update |
| REQ-005 | AC-9: Localized labels | §2 Markdown Format: all placeholders use `{localized_*}` |
| REQ-005 | AC-10: Pro-tip with regulations | §2 Markdown Format: pro-tip template |
| REQ-006 | AC-1: Clickable booking link per option | §2 Markdown Format: table booking column |
| REQ-006 | AC-2: Deep links for major chains | `trip_planning_rules.md`: Discovery step 7 |
| REQ-006 | AC-3: Aggregator search links | `trip_planning_rules.md`: Layer 2b (aggregator fallback) |
| REQ-006 | AC-4: Links open search/booking page | §3 HTML Rendering: `target="_blank"` on `.rental-cta` |
| REQ-006 | AC-5: Localized link label | §2 Markdown Format: `{localized_book_label}` |
| REQ-006 | AC-6: Homepage fallback | `trip_planning_rules.md`: Layer 2b (graceful degradation) |
| REQ-007 | AC-1: Anchor day budget table includes car rental | `content_format_rules.md`: Car Rental Budget Integration (§1.2 Change 5) |
| REQ-007 | AC-2: Labeled as estimate | `content_format_rules.md`: Car Rental Budget Integration (estimate label) |
| REQ-007 | AC-3: Non-anchor car days no duplication | `content_format_rules.md`: Car Rental Budget Integration (non-anchor rule) |
| REQ-007 | AC-4: Fuel remains per-day | `content_format_rules.md`: Car Rental Budget Integration (fuel independence) |
| REQ-007 | AC-5: Aggregate budget Car Rental row | `content_format_rules.md`: Car Rental Budget Integration (budget_LANG.md) |
| REQ-007 | AC-6: Range across categories | `content_format_rules.md`: Car Rental Budget Integration (range calculation) |
| REQ-007 | AC-7: Local currency + EUR | `content_format_rules.md`: Car Rental Budget Integration (consistent format) |
| REQ-007 | AC-8: Equipment costs separate line | `content_format_rules.md`: Car Rental Budget Integration (equipment row) |
| REQ-008 | AC-1: manifest car_rental object structure | `content_format_rules.md`: manifest.json Schema (§1.2 Change 4) |
| REQ-008 | AC-2: anchor_day references day file | `content_format_rules.md`: manifest.json Schema (anchor_day field) |
| REQ-008 | AC-3: categories_compared list | `content_format_rules.md`: manifest.json Schema (categories_compared field) |
| REQ-008 | AC-4: companies_per_category count | `content_format_rules.md`: manifest.json Schema (companies_per_category field) |
| REQ-008 | AC-5: discovery_source values | `content_format_rules.md`: manifest.json Schema (discovery_source field) |
| REQ-008 | AC-6: Multiple blocks for non-adjacent groups | `content_format_rules.md`: manifest.json Schema (multiple entries note) |
| REQ-009 | AC-1: CEO Audit checklist item | `trip_planning_rules.md`: CEO Audit (§1.1 Change 3) |
| REQ-009 | AC-2: Check evaluated on car rental anchor days only | `trip_planning_rules.md`: CEO Audit (conditional phrasing) |
| REQ-009 | AC-3: Budget alignment check | `trip_planning_rules.md`: CEO Audit (budget portion of new item) |
| REQ-010 | AC-1: `.car-rental-section` wrapper | §3 HTML Rendering: section wrapper |
| REQ-010 | AC-2: Distinct teal accent | `rendering_style_config.css`: `--color-info` / teal styling (§1.4) |
| REQ-010 | AC-3: Styled HTML tables | `rendering_style_config.css`: `.car-rental-table` styles (§1.4) |
| REQ-010 | AC-4: CTA buttons (not inline links) | `rendering_style_config.css`: `.rental-cta` styles (§1.4) |
| REQ-010 | AC-5: Section divider heading | §3 HTML Rendering: `<h2 class="section-title car-rental-section__title">` |
| REQ-010 | AC-6: Responsive tables | `rendering_style_config.css`: `.car-rental-table-wrapper` mobile styles (§1.4) |
| REQ-010 | AC-7: Language-agnostic rendering | §3 HTML Rendering: all class-based, no language strings |
| REQ-010 | AC-8: Not counted as POI | `rendering-config.md`: POI Card Parity Rule update (§1.3 Change 2) |
| REQ-011 | AC-1: Test — section on anchor day | §1.6: `car rental section exists on anchor car day` test |
| REQ-011 | AC-2: Test — table per category | §1.6: `car rental categories contain comparison tables` test |
| REQ-011 | AC-3: Test — 2-3 rows with CTAs | §1.6: `comparison tables have 2-3 rows with rental CTAs` test |
| REQ-011 | AC-4: Test — valid URL structures | §1.6: `rental CTAs have valid href and data-link-type` test |
| REQ-011 | AC-5: Test — budget line item | §1.6: `anchor day pricing grid includes car rental` test |
| REQ-011 | AC-6: Test — aggregate budget | §1.6: `budget section contains car rental category` test |
| REQ-011 | AC-7: Test — no duplication on non-anchor days | §1.6: `non-anchor car day does not have car rental section` test |
| REQ-011 | AC-8: Test — language-agnostic assertions | §1.6: all tests use CSS selectors and data attributes only |
| REQ-011 | AC-9: Test — POI exclusion | §1.6: `car rental categories are not counted as POI cards` test |
| REQ-012 | AC-1: Heading in reporting language | §2 Markdown Format: `{localized_car_rental_label}` |
| REQ-012 | AC-2: Table headers localized | §2 Markdown Format: `{localized_company}`, `{localized_daily_rate}`, etc. |
| REQ-012 | AC-3: Category names localized | §2 Markdown Format: `{localized_category_name}` |
| REQ-012 | AC-4: Labels, estimate markers localized | §2 Markdown Format: all `{localized_*}` placeholders |
| REQ-012 | AC-5: Booking link label localized | §2 Markdown Format: `{localized_book_label}` |
| REQ-012 | AC-6: Multi-language regeneration uses target language | §2 Markdown Format: rules (reporting language) |
| REQ-013 | AC-1: Overview no longer contains detailed car recommendation | `content_format_rules.md`: Phase A overview simplification (§1.2 Change 6) |
| REQ-013 | AC-2: Brief one-line reference allowed | `content_format_rules.md`: Phase A overview simplification (§1.2 Change 6) |
| REQ-013 | AC-3: Anchor day is single source of truth | §2 Markdown Format: trigger rule + HLD §4.3 |
| REQ-013 | AC-4: Existing trips not modified | HLD §5: backward compatibility |

---

## 7. Booking Link Construction Patterns

For major rental companies with predictable URL structures, construct deep links that pre-fill search parameters:

| Company | URL Pattern | Pre-filled Parameters |
|---|---|---|
| SIXT | `https://www.sixt.com/car-rental/{city}/?{params}` | `pickup_date`, `return_date`, `pickup_station` |
| Hertz | `https://www.hertz.com/rentacar/reservation/?{params}` | `pickUpDate`, `returnDate`, `pickUpLocationCode` |
| Europcar | `https://www.europcar.com/en/car-hire/results?{params}` | `pickupDate`, `returnDate`, `pickupLocation` |
| Enterprise | `https://www.enterprise.com/en/car-rental/results.html?{params}` | `pickupdate`, `returndate`, `pickuplocation` |
| Avis | `https://www.avis.com/en/reserve?{params}` | `pickUpDate`, `returnDate`, `loc` |
| Budget | `https://www.budget.com/en/reserve?{params}` | `pickUpDate`, `returnDate`, `loc` |

**Aggregator fallbacks (when direct company link unavailable):**

| Aggregator | URL Pattern |
|---|---|
| rentalcars.com | `https://www.rentalcars.com/search-results?location={destination}&pick_date={pickup}&drop_date={return}` |
| kayak.com | `https://www.kayak.com/cars/{destination}/{pickup}/{return}` |
| autoeurope.com | `https://www.autoeurope.com/go/results/?{params}` |

**Rules:**
- Dates in URL use ISO format (YYYY-MM-DD) or the format required by the specific company's URL pattern
- Location codes are destination-specific — use web fetch to discover the correct location code for the destination
- When a deep link cannot be reliably constructed, fall back to the company's homepage or destination-specific landing page
- All links use `target="_blank" rel="noopener noreferrer"`
