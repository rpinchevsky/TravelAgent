# Test Plan

**Change:** Car Rental Suggestion Mechanism — Rental Company Discovery, Price Comparison & Booking Links
**Date:** 2026-04-02
**Author:** Automation Engineer
**BRD Reference:** `technical_documents/2026-04-02_car-rental-suggestions/business_requirements.md`
**DD Reference:** `technical_documents/2026-04-02_car-rental-suggestions/detailed_design.md`
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- Car rental section presence/absence on anchor vs non-anchor days (HTML)
- Car rental category card structure: sub-sections, comparison tables, column count, row count
- Booking CTA link structure: `data-link-type`, `target`, `rel`, `href` validity
- Budget integration: anchor day pricing grid car rental line item, aggregate budget car rental category
- Manifest schema: `car_rental` top-level key, `blocks[]` array structure and field validation
- POI parity exclusion: `### 🚗` headings not counted as `.poi-card` elements
- Section visual distinction: car rental categories do not carry `.poi-card` or `.accommodation-card` classes
- Section intro, estimate disclaimer, best-value recommendation, and pro-tip presence
- Overview simplification: no detailed car rental recommendation section in overview
- Markdown POI exclusion: `### 🚗` headings excluded from `getExpectedPoiCountsFromMarkdown()` counts

**Out of scope:**
- Actual booking flow or URL content beyond structural validity (no live availability checks)
- Visual regression screenshots (handled separately by existing visual testing framework)
- Accommodation tests (canonical home in `accommodation.spec.ts` — unchanged)
- Intake wizard car rental preferences (already covered by intake tests — no intake changes)
- Deep link URL parameter validation for specific rental companies (URLs vary by company; only structural checks)
- CSS pixel values or exact color assertions (per Rule 8.3)

**Test type:** Both — progression tests for new car rental behavior, regression tests for POI parity exclusion

## 2. Test Environment

- **Browser:** Chromium (desktop viewport)
- **Framework:** Playwright + TypeScript
- **Fixture:** Shared-page (read-only) for all HTML DOM tests; standard `async () =>` for filesystem-only tests (manifest, markdown)
- **Target file:** `trip_full_{LANG}.html`

## 3. Test Cases

### TC-300: Car rental section present on anchor day(s), absent on non-anchor days

**Traces to:** REQ-011 AC-1, REQ-011 AC-7, REQ-005 AC-1, REQ-001 AC-6
**Type:** Progression
**Spec file:** `car-rental.spec.ts`
**Priority:** Critical

**Preconditions:**
- Manifest contains `car_rental.blocks[]` with at least one block where `discovery_source !== "skipped"`
- Each block has a valid `anchor_day` reference

**Steps:**
1. Read `manifest.json` to extract car rental blocks and their anchor day numbers
2. For each anchor day: assert `.car-rental-section` count is 1
3. For each non-anchor day (0..dayCount-1, excluding anchor days): assert `.car-rental-section` count is 0

**Expected result:**
- `expect.soft(sectionCount, 'Day ${day}: car rental section should be present on anchor day').toBe(1)` for each anchor day
- `expect.soft(sectionCount, 'Day ${day}: non-anchor day should have no car rental section').toBe(0)` for each non-anchor day

**Implementation notes:**
- Shared-page fixture (read-only DOM assertions)
- Single test with `expect.soft()` batching across all days (per Rule 6.3)
- Anchor days derived dynamically from manifest — no hardcoded day numbers
- Pattern mirrors `accommodation.spec.ts` TC-200+201

---

### TC-301: Car rental category count, structure, comparison tables, intros, estimates, recommendations, and pro-tips

**Traces to:** REQ-011 AC-2, REQ-005 AC-2/AC-3/AC-4/AC-5/AC-10, REQ-004 AC-1/AC-2/AC-3/AC-7, REQ-010 AC-1/AC-2/AC-3/AC-5
**Type:** Progression
**Spec file:** `car-rental.spec.ts`
**Priority:** Critical

**Preconditions:**
- At least one car rental anchor day with `discovery_source !== "skipped"`

**Steps:**
1. For each anchor day, locate all `.car-rental-category` elements
2. Assert category count >= 1 (at least one car category compared)
3. Assert category count matches `categories_compared.length` from manifest block (if > 0)
4. For each category:
   a. Assert `.car-rental-category__title` exists with non-empty text
   b. Assert `.car-rental-table` exists and is visible
   c. Assert table has 4 `thead th` header cells
   d. Assert `.car-rental-category__estimate` exists (italic estimate disclaimer)
   e. Assert `.car-rental-category__recommendation` exists (best-value note with text)
5. Assert `.car-rental-section__intro` exists with non-empty text
6. Assert section heading `h2` contains `🚗` emoji
7. Assert `.pro-tip` exists within `.car-rental-section`

**Expected result:**
- All structural elements present per category
- Table header count is exactly 4
- Category count >= 1 and <= 3 (max 3 categories per BRD constraint)

**Implementation notes:**
- Shared-page fixture
- Single test with `expect.soft()` per assertion, batched by anchor day and category
- Category count from manifest's `categories_compared` list (dynamic, not hardcoded)
- No text content matching (language-agnostic — checks presence and non-emptiness only)

---

### TC-302: Comparison table row count and rental CTA presence per row

**Traces to:** REQ-011 AC-3, REQ-004 AC-3, REQ-010 AC-4
**Type:** Progression
**Spec file:** `car-rental.spec.ts`
**Priority:** Critical

**Preconditions:**
- At least one car rental category with a comparison table

**Steps:**
1. For each anchor day, for each `.car-rental-category`:
   a. Locate `.car-rental-table tbody tr` rows
   b. Assert row count >= 2 and <= 3
   c. For each row, assert `.rental-cta` element exists and is visible

**Expected result:**
- `expect.soft(rowCount, '...').toBeGreaterThanOrEqual(2)`
- `expect.soft(rowCount, '...').toBeLessThanOrEqual(3)`
- Each row contains a `.rental-cta` element

**Implementation notes:**
- Shared-page fixture
- Batched `expect.soft()` with descriptive messages per day/category/row
- Row count validated against `companies_per_category` from manifest when > 0

---

### TC-303: Rental CTA link structure and attributes

**Traces to:** REQ-011 AC-4, REQ-006 AC-1/AC-4/AC-5, REQ-010 AC-4
**Type:** Progression
**Spec file:** `car-rental.spec.ts`
**Priority:** High

**Preconditions:**
- At least one `.rental-cta` element on an anchor day

**Steps:**
1. For each anchor day, locate all `.rental-cta` elements
2. Assert total CTA count >= 2 (at least 2 companies)
3. For each CTA:
   a. Assert `data-link-type` attribute equals `"rental-booking"`
   b. Assert `target` attribute equals `"_blank"`
   c. Assert `rel` attribute contains `"noopener"`
   d. Assert `href` is truthy and matches `^https?://` pattern
   e. Assert element tag is `<a>`

**Expected result:**
- All CTAs have valid structure: correct `data-link-type`, `target="_blank"`, valid URL href
- No empty or missing `href` attributes

**Implementation notes:**
- Shared-page fixture
- `expect.soft()` per CTA attribute
- URL validation is structural only (valid URL pattern) — no domain-specific assertions (rental companies vary)
- Pattern mirrors `accommodation.spec.ts` TC-204+206 for booking CTA validation

---

### TC-304: Anchor day budget includes car rental line item

**Traces to:** REQ-011 AC-5, REQ-007 AC-1/AC-2
**Type:** Progression
**Spec file:** `car-rental.spec.ts`
**Priority:** High

**Preconditions:**
- At least one car rental anchor day

**Steps:**
1. For each anchor day, locate `.pricing-grid`
2. Assert pricing grid exists
3. Assert pricing grid text content contains `🚗` emoji (language-agnostic car rental marker)

**Expected result:**
- `expect.soft(gridText?.includes('🚗'), 'Day ${day}: pricing grid should have car rental line item (🚗 marker)').toBe(true)`

**Implementation notes:**
- Shared-page fixture
- Uses emoji marker `🚗` for language-agnostic detection — same pattern as accommodation's `🏨` check in TC-209
- Does not validate exact amounts (prices are estimates and vary between trips)

---

### TC-305: Aggregate budget includes car rental category

**Traces to:** REQ-011 AC-6, REQ-007 AC-5/AC-7
**Type:** Progression
**Spec file:** `car-rental.spec.ts`
**Priority:** High

**Preconditions:**
- Trip has car rental blocks in manifest

**Steps:**
1. Locate `#budget` section
2. Assert budget text content contains `🚗` emoji

**Expected result:**
- `expect.soft(budgetText?.includes('🚗'), 'Aggregate budget should have car rental category (🚗 marker)').toBe(true)`

**Implementation notes:**
- Combined with TC-304 into a single test (budget integration) — same pattern as accommodation TC-209+210
- Shared-page fixture

---

### TC-306: Car rental categories are not counted as POI cards (POI parity exclusion)

**Traces to:** REQ-011 AC-9, REQ-005 AC-8, REQ-010 AC-8
**Type:** Progression (validates new exclusion behavior)
**Spec file:** `car-rental.spec.ts`
**Priority:** Critical

**Preconditions:**
- At least one car rental anchor day

**Steps:**
1. For each anchor day:
   a. Count `.poi-card` elements (POI cards)
   b. Count `.car-rental-category` elements
   c. For each `.poi-card`, assert it does NOT have `.car-rental-category` class
   d. For each `.car-rental-category`, assert it does NOT have `.poi-card` class
2. Verify `.car-rental-category` elements exist (> 0) on anchor days

**Expected result:**
- POI cards and car rental categories are mutually exclusive class sets
- No element has both `.poi-card` and `.car-rental-category`

**Implementation notes:**
- Shared-page fixture
- `expect.soft()` per element
- Pattern mirrors accommodation TC-212 POI parity exclusion

---

### TC-307: Manifest `car_rental` schema validation

**Traces to:** REQ-008 AC-1/AC-2/AC-3/AC-4/AC-5/AC-6, REQ-001 AC-4/AC-5
**Type:** Progression
**Spec file:** `car-rental.spec.ts`
**Priority:** High

**Preconditions:**
- `manifest.json` exists and is valid JSON

**Steps:**
1. Parse `manifest.json`
2. Assert `car_rental` key exists at top level
3. Assert `car_rental.blocks` is an array
4. For each block in `blocks[]`:
   a. Assert `id` matches `rental_NN` pattern
   b. Assert `pickup_date` matches `YYYY-MM-DD` format
   c. Assert `return_date` matches `YYYY-MM-DD` format
   d. Assert `return_date >= pickup_date`
   e. Assert `days` is a positive integer
   f. Assert `days` equals date difference between return and pickup + 1 (pickup and return are inclusive)
   g. Assert `pickup_location` is a non-empty string
   h. Assert `anchor_day` matches `day_NN` pattern
   i. Assert `categories_compared` is an array
   j. Assert `companies_per_category` is a non-negative integer
   k. Assert `discovery_source` is one of: `"web_search"`, `"aggregator_fallback"`, `"skipped"`, `"pending"`
5. If no car days exist, assert `blocks` is an empty array

**Expected result:**
- All schema constraints satisfied
- Date formats valid, date ordering correct
- `discovery_source` is from the allowed enum

**Implementation notes:**
- No browser needed — `async () =>` callback without `{ page }` destructuring (per Rule 8.8)
- Uses `fs.readFileSync` on manifest path from `getManifestPath()`
- `expect.soft()` per field per block
- Pattern mirrors accommodation TC-211 manifest validation

---

### TC-308: Markdown POI exclusion — `### 🚗` headings not counted by `getExpectedPoiCountsFromMarkdown()`

**Traces to:** REQ-005 AC-8, REQ-010 AC-8
**Type:** Regression (ensures POI parity counting logic excludes car rental)
**Spec file:** `car-rental.spec.ts`
**Priority:** High

**Preconditions:**
- Trip markdown file exists and contains `### 🚗` headings on anchor day(s)

**Steps:**
1. Read the trip markdown file content directly
2. Identify all `### 🚗` lines (car rental category headings)
3. Call `getExpectedPoiCountsFromMarkdown()` and get counts for anchor days
4. For each anchor day with `### 🚗` headings, verify the POI count does NOT include them
5. Cross-reference: count `### ` headings that are NOT excluded sections and NOT `🚗`-prefixed — this should match the returned count

**Expected result:**
- `getExpectedPoiCountsFromMarkdown()` does not count `### 🚗` headings as POIs
- Returned count equals non-excluded, non-car-rental `###` heading count

**Implementation notes:**
- No browser needed — filesystem-only test (`async () =>`)
- This test validates the utility itself, ensuring the parity check infrastructure is correct
- The `excludedSections` in `trip-config.ts` or the regex in `markdown-pois.ts` must exclude `🚗`-prefixed headings

---

### TC-309: Overview does not contain detailed car rental recommendation

**Traces to:** REQ-013 AC-1/AC-2/AC-3
**Type:** Progression
**Spec file:** `car-rental.spec.ts`
**Priority:** Medium

**Preconditions:**
- Trip HTML loaded with `#overview` section

**Steps:**
1. Locate `#overview` section
2. Assert `.car-rental-section` does NOT exist within `#overview`
3. Assert no `.car-rental-table` exists within `#overview`
4. Assert no `.rental-cta` exists within `#overview`

**Expected result:**
- `expect.soft(overviewCarRentalCount, 'overview should not have car-rental-section').toBe(0)`
- `expect.soft(overviewTableCount, 'overview should not have car-rental-table').toBe(0)`
- `expect.soft(overviewCtaCount, 'overview should not have rental-cta').toBe(0)`

**Implementation notes:**
- Shared-page fixture
- Validates that the overview is clean of car rental detail content
- Does NOT assert overview text for a brief reference line (language-dependent content)

---

### TC-310: Non-anchor car days do not duplicate rental cost in budget

**Traces to:** REQ-007 AC-3/AC-4
**Type:** Progression
**Spec file:** `car-rental.spec.ts`
**Priority:** Medium

**Preconditions:**
- Multiple car days exist in a single rental block (at least 2 days)
- Manifest identifies which days are car days but not anchor

**Steps:**
1. From manifest, identify all car days in each rental block (pickup_date to return_date)
2. For non-anchor car days in the block:
   a. Locate `.pricing-grid`
   b. Assert pricing grid does NOT contain a car rental cost line (no `🚗` in the pricing grid context that represents the full rental cost)
   c. Note: fuel costs (per-day) may still use car-related content — the check is specifically for the rental block cost marker

**Expected result:**
- Non-anchor car days have pricing grids without the car rental block cost marker

**Implementation notes:**
- Shared-page fixture
- This is a nuanced check: the anchor day pricing grid has `🚗` for the rental block cost, but non-anchor days should not duplicate it
- If fuel estimates also use `🚗`, this test needs to differentiate — inspect the pricing cell structure for the estimate badge pattern (car rental uses `.pricing-cell__badge--estimate`)
- Fallback: if `🚗` appears on non-anchor days for fuel costs (which is legitimate), skip this check and rely on structural difference (estimate badge count or text pattern). Mark as `test.fixme()` if the distinction is not yet rendered

---

### TC-311: Car rental section visual distinction — no class overlap with POI or accommodation cards

**Traces to:** REQ-010 AC-2/AC-7, REQ-005 AC-8
**Type:** Progression
**Spec file:** `car-rental.spec.ts`
**Priority:** Medium

**Preconditions:**
- At least one car rental section rendered

**Steps:**
1. For each `.car-rental-section`:
   a. Assert it does NOT have class `.poi-card`
   b. Assert it does NOT have class `.accommodation-section`
2. For each `.car-rental-category`:
   a. Assert it does NOT have class `.poi-card`
   b. Assert it does NOT have class `.accommodation-card`
3. For each `.rental-cta`:
   a. Assert it does NOT have class `.booking-cta`

**Expected result:**
- Complete class namespace separation between car rental, POI, and accommodation elements

**Implementation notes:**
- Shared-page fixture
- `expect.soft()` per element
- Consolidate with TC-306 if running both in the same describe block to avoid redundant DOM traversal

---

## 4. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 (Block Identification) | AC-4: manifest car_rental object | TC-307 | Soft |
| REQ-001 | AC-5: empty blocks when no car days | TC-307 | Soft |
| REQ-001 | AC-6: anchor day is first car day of block | TC-300, TC-307 | Soft |
| REQ-004 (Price Comparison Table) | AC-1: each category gets comparison table | TC-301 | Soft |
| REQ-004 | AC-2: table has 4 columns | TC-301 | Soft |
| REQ-004 | AC-3: 2-3 rows per table | TC-302 | Soft |
| REQ-004 | AC-7: unavailable category noted | TC-301 (estimate disclaimer present) | Soft |
| REQ-005 (Card Format) | AC-1: section on anchor day | TC-300 | Soft |
| REQ-005 | AC-2: `## 🚗` heading | TC-301 | Soft |
| REQ-005 | AC-3: intro paragraph | TC-301 | Soft |
| REQ-005 | AC-4: `### 🚗` category sub-headings | TC-301 | Soft |
| REQ-005 | AC-5: best-value recommendation | TC-301 | Soft |
| REQ-005 | AC-8: NOT POI headings | TC-306, TC-308 | Soft |
| REQ-005 | AC-10: pro-tip section | TC-301 | Soft |
| REQ-006 (Booking Links) | AC-1: clickable booking link | TC-303 | Soft |
| REQ-006 | AC-4: opens in new tab | TC-303 | Soft |
| REQ-006 | AC-5: localized link label | TC-303 (non-empty text) | Soft |
| REQ-007 (Budget Integration) | AC-1: anchor day budget has car rental line | TC-304 | Soft |
| REQ-007 | AC-3: non-anchor days no duplicate cost | TC-310 | Soft |
| REQ-007 | AC-5: aggregate budget has car rental category | TC-305 | Soft |
| REQ-008 (Manifest Schema) | AC-1: car_rental object structure | TC-307 | Soft |
| REQ-008 | AC-2: anchor_day reference | TC-307 | Soft |
| REQ-008 | AC-3: categories_compared list | TC-307 | Soft |
| REQ-008 | AC-4: companies_per_category count | TC-307 | Soft |
| REQ-008 | AC-5: discovery_source enum | TC-307 | Soft |
| REQ-008 | AC-6: multiple blocks for non-adjacent groups | TC-307 | Soft |
| REQ-010 (HTML Rendering) | AC-1: car-rental-section div | TC-300, TC-301 | Soft |
| REQ-010 | AC-2: visual distinction from POI/accommodation | TC-311 | Soft |
| REQ-010 | AC-3: styled HTML tables | TC-301 | Soft |
| REQ-010 | AC-4: booking links as CTA buttons | TC-302, TC-303 | Soft |
| REQ-010 | AC-5: `## 🚗` section divider | TC-301 | Soft |
| REQ-010 | AC-7: language-agnostic rendering | All tests (no text matching) | Soft |
| REQ-010 | AC-8: `### 🚗` excluded from POI count | TC-306, TC-308 | Soft |
| REQ-011 (Automation Coverage) | AC-1: section exists on anchor day | TC-300 | Soft |
| REQ-011 | AC-2: category has comparison table | TC-301 | Soft |
| REQ-011 | AC-3: 2-3 rows with booking links | TC-302 | Soft |
| REQ-011 | AC-4: valid URL structures | TC-303 | Soft |
| REQ-011 | AC-5: anchor day budget has car rental | TC-304 | Soft |
| REQ-011 | AC-6: aggregate budget has car rental | TC-305 | Soft |
| REQ-011 | AC-7: non-anchor days no section | TC-300 | Soft |
| REQ-011 | AC-8: language-agnostic assertions | All tests | Soft |
| REQ-011 | AC-9: POI parity exclusion | TC-306, TC-308 | Soft |
| REQ-013 (Overview Simplified) | AC-1: no detailed car rental in overview | TC-309 | Soft |
| REQ-013 | AC-2: brief reference allowed | TC-309 (no assertion on text) | N/A |
| REQ-013 | AC-3: anchor day is source of truth | TC-300 | Soft |

**BRD requirements NOT covered by automation (by design):**
| Requirement | Reason Not Tested |
|---|---|
| REQ-001 AC-1/AC-2/AC-3 (block identification logic) | Pipeline logic — tested via manifest output (TC-307), not internal algorithm |
| REQ-002 (Preference Consumption) | Pipeline logic — preferences influence content generation, not HTML structure. No structural assertion possible without language-dependent text matching |
| REQ-003 (Company Discovery) | Pipeline research logic — web search execution is not testable via HTML output. Manifest `discovery_source` validated (TC-307) |
| REQ-004 AC-4/AC-5/AC-6 (sorting, multiple categories, estimate labels) | AC-4 (sort order) would require parsing prices, which are locale-formatted and language-dependent. AC-5 covered by TC-301 (multiple categories rendered). AC-6 estimate label covered by TC-301 (estimate element present) |
| REQ-005 AC-7 (section placement order) | Placement order within a day card is a content layout concern — asserting DOM order of siblings is fragile and adds test maintenance cost. Covered implicitly by visual inspection during generation |
| REQ-005 AC-9 (reporting language labels) | Cannot assert label language without hardcoding expected text — violates language-agnostic rule |
| REQ-006 AC-2/AC-3/AC-6 (deep link construction, aggregator fallback) | URL structures vary by company and are not standardizable. TC-303 validates URLs are valid — deeper validation is not feasible language-agnostically |
| REQ-007 AC-2/AC-4/AC-6/AC-7/AC-8 (estimate labels, fuel per day, multi-category range, currency) | Budget content validation beyond emoji marker requires language-dependent text matching |
| REQ-009 (CEO Audit) | Process checklist — not testable via HTML output |
| REQ-010 AC-6 (responsive tables) | Viewport-specific behavior — would require mobile viewport test. Can be added as a follow-up if needed (per Rule 6.1, set viewport via `test.use()`) |
| REQ-012 (Language-Agnostic Content) | Meta-requirement — enforced by all tests being language-agnostic. No specific test needed |
| REQ-013 AC-4 (existing trips not modified) | Not testable in the current pipeline — applies to generation behavior, not HTML structure |

## 5. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `manifest.json` | `car_rental.blocks[]` — anchor days, categories, discovery source | Yes — after new trip generation with car rental blocks |
| `trip_full_{LANG}.html` | DOM structure for all HTML assertions | Yes — after new trip generation + HTML rendering |
| `trip_full_{LANG}.md` | `### 🚗` heading count for POI exclusion test (TC-308) | Yes — after new trip generation |
| `trip_details.md` | Day count, language, destination (via `trip-config.ts`) | No — existing file, no structural changes |

## 6. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Car rental section may not be generated if `## Car Rental Assistance` is absent from trip details | TC-300/TC-307 use `test.skip()` when manifest has no blocks or discovery_source is `"skipped"` — tests degrade gracefully |
| POI parity tests may double-count car rental headings as POIs | TC-308 validates the exclusion at the utility level; TC-306 validates at the DOM level |
| `🚗` emoji used in both anchor day pricing grid (rental cost) and non-anchor days (fuel cost) could cause false positives in TC-310 | TC-310 implementation note acknowledges this risk; uses structural differentiator (`.pricing-cell__badge--estimate` pattern) if possible, or marks as `test.fixme()` pending renderer implementation |
| Manifest schema may evolve during implementation | TC-307 uses soft assertions per field — individual field changes cause isolated failures, not cascading breaks |
| Multiple rental blocks (non-adjacent car day groups) are rare in current trips | TC-307 validates the `blocks` array handles 0, 1, or N blocks via the same loop — no hardcoded block count |

## 7. Estimated Impact

- **New test count:** 12 tests across 7 describe blocks (in 1 new spec file `car-rental.spec.ts`)
  - TC-300: 1 test (anchor/non-anchor presence)
  - TC-301: 1 test (structure + categories)
  - TC-302: 1 test (table rows + CTAs per row)
  - TC-303: 1 test (CTA link attributes)
  - TC-304+305: 1 test (budget integration — anchor day + aggregate, combined)
  - TC-306: 1 test (POI parity exclusion)
  - TC-307: 1 test (manifest schema — no browser)
  - TC-308: 1 test (markdown POI exclusion — no browser)
  - TC-309: 1 test (overview clean of car rental)
  - TC-310: 1 test (non-anchor budget no duplicate)
  - TC-311: 1 test (class namespace separation)
  - Total assertion count: ~60-80 soft assertions (depending on day count and category count)
- **Estimated runtime increase:** ~2-3 seconds (shared-page fixture amortizes page load; 2 tests skip browser entirely)
- **Files added/modified:**
  - **New:** `automation/code/tests/regression/car-rental.spec.ts`
  - **Modified:** `automation/code/tests/pages/TripPage.ts` (new locators and helpers)
  - **Modified:** `automation/code/tests/utils/markdown-pois.ts` (ensure `🚗` headings excluded from POI count)

## 8. New POM Locators (TripPage.ts)

| Locator / Method | Selector | Purpose |
|---|---|---|
| `carRentalSections` (property) | `.car-rental-section` | All car rental sections on page |
| `carRentalCategories` (property) | `.car-rental-category` | All car rental category sub-sections |
| `carRentalTables` (property) | `.car-rental-table` | All comparison tables |
| `rentalCtas` (property) | `.rental-cta` | All rental booking CTA buttons |
| `getDayCarRentalSection(day)` | `#day-${day} .car-rental-section` | Car rental section within a specific day |
| `getDayCarRentalCategories(day)` | `#day-${day} .car-rental-category` | Category cards within a specific day |
| `getCarRentalCategoryTitle(cat)` | `cat.locator('.car-rental-category__title')` | Category heading within a card |
| `getCarRentalCategoryTable(cat)` | `cat.locator('.car-rental-table')` | Comparison table within a category |
| `getCarRentalTableRows(table)` | `table.locator('tbody tr')` | Data rows in a comparison table |
| `getCarRentalTableHeaderCells(table)` | `table.locator('thead th')` | Header cells in a comparison table |
| `getCarRentalCategoryEstimate(cat)` | `cat.locator('.car-rental-category__estimate')` | Estimate disclaimer text |
| `getCarRentalCategoryRecommendation(cat)` | `cat.locator('.car-rental-category__recommendation')` | Best-value recommendation |
| `getDayRentalCtas(day)` | `#day-${day} .rental-cta` | Rental CTAs within a specific day |
| `getCarRentalProTip(section)` | `section.locator('.pro-tip')` | Pro-tip within car rental section |

**Total new locators:** 4 properties + 10 helper methods = 14 new POM additions

## 9. Spec File Organization

```
car-rental.spec.ts
├── describe: Car Rental — Section Presence
│   └── test: TC-300 (anchor vs non-anchor days)
├── describe: Car Rental — Category Structure
│   └── test: TC-301 (categories, tables, intros, estimates, recommendations, pro-tips)
├── describe: Car Rental — Comparison Table Rows
│   └── test: TC-302 (row count, CTA per row)
├── describe: Car Rental — Booking Links
│   └── test: TC-303 (CTA attributes: data-link-type, target, rel, href)
├── describe: Car Rental — Budget Integration
│   └── test: TC-304+305 (anchor day pricing + aggregate budget)
├── describe: Car Rental — POI Parity Exclusion
│   ├── test: TC-306 (DOM class separation)
│   └── test: TC-308 (markdown utility exclusion)
├── describe: Car Rental — Manifest Schema
│   └── test: TC-307 (car_rental block schema)
├── describe: Car Rental — Overview Clean
│   └── test: TC-309 (no detailed car rental in overview)
├── describe: Car Rental — Non-Anchor Day Budget
│   └── test: TC-310 (no duplicate rental cost)
└── describe: Car Rental — Visual Distinction
    └── test: TC-311 (class namespace separation)
```

**Imports:**
```typescript
import * as fs from 'fs';
import { test, expect } from '../fixtures/shared-page';
import { test as baseTest, expect as baseExpect } from '@playwright/test';
import { loadTripConfig } from '../utils/trip-config';
import { getExpectedPoiCountsFromMarkdown } from '../utils/markdown-pois';
import { getManifestPath } from '../utils/trip-folder';
```

**Manifest helper function** (module-level, mirrors `getAccommodationStays()` in `accommodation.spec.ts`):
```typescript
interface ManifestCarRentalBlock {
  id: string;
  pickup_date: string;
  return_date: string;
  days: number;
  pickup_location: string;
  anchor_day: string;
  anchor_day_number: number;
  categories_compared: string[];
  companies_per_category: number;
  discovery_source: string;
}

function getCarRentalBlocks(): ManifestCarRentalBlock[] {
  const manifestPath = getManifestPath();
  const raw = fs.readFileSync(manifestPath, 'utf-8');
  const manifest = JSON.parse(raw);
  const carRental = manifest['car_rental'];
  if (!carRental) return [];
  const blocks = carRental['blocks'];
  if (!Array.isArray(blocks) || blocks.length === 0) return [];
  return blocks.map((b: Record<string, unknown>) => {
    const anchorDay = String(b['anchor_day'] ?? '');
    const match = anchorDay.match(/day_(\d+)/);
    return {
      id: String(b['id'] ?? ''),
      pickup_date: String(b['pickup_date'] ?? ''),
      return_date: String(b['return_date'] ?? ''),
      days: typeof b['days'] === 'number' ? b['days'] : 0,
      pickup_location: String(b['pickup_location'] ?? ''),
      anchor_day: anchorDay,
      anchor_day_number: match ? parseInt(match[1], 10) : -1,
      categories_compared: Array.isArray(b['categories_compared']) ? b['categories_compared'].map(String) : [],
      companies_per_category: typeof b['companies_per_category'] === 'number' ? b['companies_per_category'] : 0,
      discovery_source: String(b['discovery_source'] ?? ''),
    };
  });
}
```
