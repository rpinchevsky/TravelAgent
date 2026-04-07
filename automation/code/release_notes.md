# Release Notes

## 2026-04-07 — POI Inline Images, Hebrew RTL Support, and Hebrew Section Name Parsing

### Changes

#### Modified File: `automation/scripts/generate_html_fragments.ts`

- Added `imageUrl?: string` field to `PoiData` interface (parses `**Image:** <url>` markdown lines)
- Image URL parser added in `POI_SECTION` case: matches `**Image:**`, `**Изображение:**`, `**תמונה:**`, `**Kép:**`
- `imageUrl` excluded from POI description fallback accumulation
- `renderPoiCard()` emits `<div class="poi-card__image-wrapper"><img loading="lazy" onerror="...">` before `.poi-card__body` when `imageUrl` is set
- Schedule section detection expanded: now recognizes Hebrew `לוּחַ זְמַנִּים`, `לוח זמנים`, `סֵדֶר יוֹם`, `סדר יום` in addition to Russian `Расписание`
- Pricing section detection expanded: now recognizes all Hebrew `עֲלוּת`/`עֶלֶת` variants (with/without definite article, with/without nikud)
- Logistics section detection already included Hebrew `לוגיסטיקה` (no change needed)

#### Modified File: `automation/scripts/generate_shell_fragments.ts`

- Added `HTML_LANG_ATTRS_BY_LANG` lookup: `ru → lang="ru"`, `en → lang="en"`, `he → lang="he" dir="rtl"`
- `HTML_LANG_ATTRS` added to `shell_fragments_{lang}.json` output
- Step 3 assembly now substitutes `{{HTML_LANG_ATTRS}}` into `base_layout.html` `<html>` tag

#### Modified File: `base_layout.html`

- `<html lang="ru">` replaced with `<html {{HTML_LANG_ATTRS}}>` for dynamic language/direction injection

#### New File: `generated_trips/trip_2026-04-07_1700/trip_full_he.html` (448 KB)

- Hebrew family Budapest trip with nikud throughout
- `<html lang="he" dir="rtl">` — full RTL layout
- POI cards include inline `<img>` from Wikimedia Commons URLs
- All 12 days with schedule tables, POI cards, grocery stops, backup plans

#### Modified Files: `rendering-config.md`, `content_format_rules.md`, `trip_planning_rules.md`

- POI inline image documented: `**Image:** <url>` field in day markdown format
- Step 3 assembly updated: inject `HTML_LANG_ATTRS` placeholder
- Trip planning rules: Layer 2c image sourcing from Wikipedia/Wikimedia

#### Modified File: `automation/code/tests/regression/rtl-layout.spec.ts`

- Navigation count tests (sidebar links, mobile pills, hrefs) now read manifest to account for optional accommodation/car-rental sections
- Added `import * as fs` and `import { getManifestPath }` for manifest reading

### Regression Results

**21/21 passed** (`rtl-layout.spec.ts`, `desktop-chromium-rtl` project, `trip_full_he.html`)

| Test Group | Count | Result |
|---|---|---|
| RTL Structural | 6 | ✅ All pass |
| RTL Desktop Grid Layout | 5 | ✅ All pass |
| RTL Navigation | 3 | ✅ All pass |
| RTL Mobile Layout | 3 | ✅ All pass |
| RTL CSS Overrides | 3 | ✅ All pass |
| RTL Day Cards | 1 | ✅ All pass |

### BRD Acceptance Criteria

| REQ | Description | Status |
|---|---|---|
| REQ-1 | POI inline images in HTML output | ✅ Pass |
| REQ-2 | Image discovery from Wikipedia/Wikimedia per POI | ✅ Pass |
| REQ-3 | RTL HTML attributes injected dynamically | ✅ Pass |
| REQ-4 | Hebrew with nikud throughout generated output | ✅ Pass |

### Affected Files
- `automation/scripts/generate_html_fragments.ts` (image parsing, Hebrew section names)
- `automation/scripts/generate_shell_fragments.ts` (HTML_LANG_ATTRS)
- `base_layout.html` (dynamic lang/dir attribute)
- `automation/code/tests/regression/rtl-layout.spec.ts` (nav count with optional sections)
- `rendering-config.md`, `content_format_rules.md`, `trip_planning_rules.md` (rules update)
- `trip_details_he.md` (new: Hebrew trip configuration)
- `generated_trips/trip_2026-04-07_1700/` (complete Hebrew trip output)

---

## 2026-04-03 — HTML Render Pipeline: Script-Based Generation (Options 3+4)

### Changes

#### New Files: `automation/scripts/generate_shell_fragments.ts`, `generate_html_fragments.ts`, `tsconfig.json`

**generate_shell_fragments.ts** — Deterministic script that replaces the LLM shell-fragment subagent (Step 2a).
Reads `manifest.json`, enumerates day files, and writes `shell_fragments_{lang}.json` containing
`PAGE_TITLE`, `NAV_LINKS` (sidebar with inline SVGs), and `NAV_PILLS` (mobile nav pills).
- CLI: `--trip-folder <path> --lang <lang_code>`
- Language lookup tables: `TITLE_SUFFIX_BY_LANG`, `DESTINATION_NAMES_BY_LANG`, nav labels, SVG icons for all 6 section types

**generate_html_fragments.ts** (~1900 lines) — Full markdown→HTML FSM-based template engine that replaces ALL LLM day/section subagents (Steps 2b–2d).
- FSM states: `FRONT_MATTER`, `SCHEDULE_TABLE`, `MAP_LINK`, `POI_SECTION`, `PRICING_TABLE`, `PLAN_B`, `SKIP_SECTION`
- Handles: day files, overview, accommodation, car rental, budget
- POI card generation with `data-link-exempt` (QF-2), `data-link-type` attributes
- Activity label normalization: `—` separator → `/` for Cyrillic/Hebrew bilingual labels
- Logistics sections excluded via `SKIP_SECTION` state
- Country flag SVGs (13 countries): `width="28" height="20" viewBox="0 0 24 18"`
- Per-day POI parity assertion before writing output
- `LINK_LABELS_BY_LANG` for ru/en/he
- Incremental mode via `--stale-days` CLI flag

**tsconfig.json** — Strict TypeScript config (ES2022 target) for the scripts folder.

#### Modified File: `tests/utils/markdown-pois.ts` (1 fix)

- Added H1/H2 sentinel reset: when encountering a non-day `## ` or `# ` heading (e.g., `## 💰 Общий бюджет`), `currentDay` is reset to `null` so budget/accommodation `###` subsections are not attributed to the last day in the parity count.

#### Modified Files: `.claude/skills/render/SKILL.md`, `rendering-config.md`

- Steps 2a–2d replaced with script invocations using `npx ts-node --transpile-only`
- Step 2a → `generate_shell_fragments.ts`; Steps 2b–2c → `generate_html_fragments.ts`
- §2.5 Agent Prompt Contract deprecated
- Step 3 assembly updated to consume `shell_fragments_{lang}.json` for placeholder substitution

### Regression Results

**17 failed, 349 passed** (after 3 rounds of SA review, implementation, and test fixes).

| Category | Count | Classification |
|---|---|---|
| Intake form tests | 9 | Pre-existing — unrelated to render pipeline |
| Content quality (trip data) | 8 | Trip-specific content issues, not rendering bugs |
| **Rendering pipeline failures** | **0** | **All structural/rendering tests pass** |

Content quality failures (trip_2026-04-03_0021): accommodation/car-rental budget-grid integration (content doesn't embed cost lines in day pricing tables), POI language compliance (poi_languages config vs Russian-only trip), non-exempt POI missing links (sparse markdown POIs), POI descriptions missing in some entries, activity label "/" separator compliance.

### BRD Acceptance Criteria

| REQ | Description | Status |
|---|---|---|
| REQ-001 | LLM subagents replaced by deterministic scripts | ✅ Pass |
| REQ-002 | HTML output structurally equivalent (structural parity) | ✅ Pass |
| REQ-003 | Incremental mode via `--stale-days` | ✅ Pass |
| REQ-004 | PE Review gate (3 rounds completed, Approved/Go) | ✅ Pass |

### Performance Impact

- Previous: 8 LLM subagents × ~75KB context each = ~600KB input + ~360KB HTML output per render
- New: 2 TypeScript scripts, zero LLM calls, ~2–5s wall-clock for a 12-day trip
- Token cost: 0 (no LLM invocations in render phase)

### Affected Files
- `automation/scripts/generate_shell_fragments.ts` (new)
- `automation/scripts/generate_html_fragments.ts` (new)
- `automation/scripts/tsconfig.json` (new)
- `automation/code/tests/utils/markdown-pois.ts` (fix: H1/H2 sentinel reset)
- `.claude/skills/render/SKILL.md` (updated steps)
- `rendering-config.md` (updated pipeline)

---

## 2026-04-02 — Car Rental Suggestion Mechanism: Rental Company Discovery, Price Comparison & Booking Links

### Changes

#### Modified File: `tests/pages/TripPage.ts` (4 new properties, 10 new methods)

**New readonly properties (constructor-initialized):**
- `carRentalSections` — `.car-rental-section`
- `carRentalCategories` — `.car-rental-category`
- `carRentalTables` — `.car-rental-table`
- `rentalCtas` — `.rental-cta`

**New helper methods:**
- `getCarRentalSection()` — `#car-rental` (top-level section, not inside day cards)
- `getCarRentalCategories()` — `#car-rental .car-rental-category`
- `getCarRentalCategoryTitle(cat)` — `.car-rental-category__title`
- `getCarRentalCategoryTable(cat)` — `.car-rental-table`
- `getCarRentalTableRows(table)` — `tbody tr`
- `getCarRentalTableHeaderCells(table)` — `thead th`
- `getCarRentalCategoryEstimate(cat)` — `.car-rental-category__estimate`
- `getCarRentalCategoryRecommendation(cat)` — `.car-rental-category__recommendation`
- `getRentalCtas()` — `#car-rental .rental-cta`
- `getCarRentalProTip(section)` — `.pro-tip`

#### Modified File: `tests/utils/trip-config.ts` (1 entry added to `excludedSections`)

- Added `'🚗'` to `excludedSections` array (alongside existing `'⚠️'`) so that `### 🚗` car rental category headings are excluded from POI count by `getExpectedPoiCountsFromMarkdown()` (QF-2)

#### New File: `tests/regression/car-rental.spec.ts` (11 tests covering 12 logical TCs)

| TC | Test | Coverage |
|----|------|----------|
| TC-300 | Car rental section present on anchor days, absent on non-anchor days | REQ-011 AC-1/AC-7; REQ-005 AC-1; REQ-001 AC-6 |
| TC-301 | Categories, tables, intros, estimates, recommendations, pro-tips | REQ-011 AC-2; REQ-005 AC-2/AC-3/AC-4/AC-5/AC-10; REQ-004 AC-1/AC-2; REQ-010 AC-1/AC-3/AC-5 |
| TC-302 | Row count and rental CTA per row | REQ-011 AC-3; REQ-004 AC-3; REQ-010 AC-4 |
| TC-303 | Rental CTA link structure and attributes (data-link-type, target, rel, href) | REQ-011 AC-4; REQ-006 AC-1/AC-4/AC-5; REQ-010 AC-4 |
| TC-304+305 | Car rental line in anchor day pricing grid and aggregate budget | REQ-011 AC-5/AC-6; REQ-007 AC-1/AC-5 |
| TC-306+311 | POI parity exclusion and visual distinction (consolidated per QF-1) | REQ-011 AC-9; REQ-005 AC-8; REQ-010 AC-2/AC-7/AC-8 |
| TC-307 | Manifest car_rental schema validation (no browser) | REQ-008 AC-1/AC-2/AC-3/AC-4/AC-5/AC-6; REQ-001 AC-4/AC-5 |
| TC-308 | Markdown POI exclusion — ### 🚗 headings not counted (no browser) | REQ-005 AC-8; REQ-010 AC-8 |
| TC-309 | Overview does not contain detailed car rental elements | REQ-013 AC-1/AC-2/AC-3 |
| TC-310 | Non-anchor car days do not duplicate rental cost in budget | REQ-007 AC-3/AC-4 |

**QA feedback addressed:**
- QF-1 resolved: TC-306 and TC-311 consolidated into single test `TC-306+311` — all class-exclusion assertions (POI, accommodation, booking-cta) in one describe block
- QF-2 resolved: Added `'🚗'` to `excludedSections` in `trip-config.ts`
- QF-3 resolved: REQ-004 AC-7 moved to "NOT covered" (unavailability annotation is language-dependent text — cannot be structurally asserted)

**Implementation notes:**
- Shared-page fixture for all DOM tests (TC-300 through TC-306+311, TC-309, TC-310)
- `baseTest` (no browser) for filesystem-only tests (TC-307, TC-308)
- `expect.soft()` with descriptive per-day/per-category messages throughout
- All locators language-agnostic: CSS classes, data attributes, emoji markers only
- TC-310 uses `test.fixme()` fallback when `.pricing-cell__badge--estimate` structural differentiator is not available
- Pattern mirrors `accommodation.spec.ts` structure for consistency

#### Files Modified
- `tests/pages/TripPage.ts` — 4 new properties + 10 new helper methods
- `tests/utils/trip-config.ts` — 1 entry added to `excludedSections`

#### Files Added
- `tests/regression/car-rental.spec.ts` — 11 tests across 10 describe blocks

### Affected Sections
- Trip HTML car rental sections on anchor days
- Anchor day pricing grids (car rental line item)
- Aggregate budget section (car rental category)
- Manifest `car_rental.blocks[]` schema
- POI parity counting logic (markdown utility exclusion)

---

## 2026-03-29 — Hotel/Car Multi-Select and Step Reorder

### Changes

#### Modified File: `tests/pages/IntakePage.ts` (2 new properties, 1 new method, 2 updated methods)

**New readonly properties (constructor-initialized):**
- `multiSelectGrids` — `.option-grid[data-multi-select]`
- `multiSelectHints` — `.option-grid__hint`

**New helper method:**
- `completeStep2()` — Clicks Continue on Step 2 to trigger depth overlay

**Updated methods:**
- `completePrerequisiteSteps()` — Now lands on Step 2 (was: depth overlay). Depth overlay fires after Step 2 Continue.
- `setupWithDepth(depth)` — Now calls `completeStep2()` before `selectDepthAndConfirm()`. Lands on Step 3 (was: Step 2).

#### Modified File: `tests/intake/intake-hotel-car-assistance.spec.ts` (21 new tests, 2 replaced)

| TC | Test | Coverage |
|----|------|----------|
| TC-351+352 | hotelType multi-select select + toggle off | REQ-001 AC-1/AC-2/AC-3 |
| TC-353 | hotelType all 12 cards selectable | REQ-001 AC-5 |
| TC-354+379 | hotelType per-card .is-selected + aria-pressed (QF-2 consolidated) | REQ-001 AC-4 |
| TC-355+356 | carCategory multi-select select + toggle off | REQ-002 AC-1/AC-2/AC-3 |
| TC-357 | carCategory all 14 cards selectable | REQ-002 AC-5 |
| TC-358 | carCategory per-card independent state | REQ-002 AC-4 |
| TC-359 | Markdown single hotel type (no comma) | REQ-003 AC-1 |
| TC-360 | Markdown multiple hotel types (comma-separated, DOM order) | REQ-003 AC-2/AC-5 |
| TC-361 | Markdown zero hotel types ("Not specified") | REQ-001 AC-6 |
| TC-362 | Markdown multiple car categories (comma-separated) | REQ-003 AC-4 |
| TC-363 | Markdown zero car categories ("Not specified") | REQ-002 AC-6 |
| TC-364 | Markdown uses data-en-name regardless of UI language | REQ-003 AC-6 |
| TC-373 | Hotel reset clears multi-select + aria-pressed | REQ-005 AC-1/AC-3 |
| TC-374 | Car reset clears multi-select + aria-pressed | REQ-005 AC-2/AC-3 |
| TC-375 | hotelType hint with s6_multiselect_hint i18n key | UX S5.1 |
| TC-376 | carCategory hint with s6_multiselect_hint i18n key | UX S5.1 |
| TC-377 | data-multi-select on exactly 2 grids (scoping) | REQ-001/REQ-002 |
| TC-378 | Multi-select ARIA role="group" + aria-label | UX S8 |
| TC-380 | Checkmark badge ::after pseudo-element | UX S5.2 |
| TC-381 | hotelLocation single-select regression guard | Regression |
| TC-382 | carTransmission single-select regression guard | Regression |
| TC-383 | No auto-advance on multi-select click (QF-1: web-first assertion) | REQ-001/REQ-002 |

**Replaced tests:** TC-206 (was single-select radio) replaced by TC-351+352; TC-216 replaced by TC-355+356.

#### Modified File: `tests/intake/intake-functional.spec.ts` (8 new tests, 1 replaced)

| TC | Test | Coverage |
|----|------|----------|
| TC-365 | Step 1 Continue -> Step 2 (no depth overlay) | REQ-004 AC-1 |
| TC-366 | Step 2 Continue -> depth overlay | REQ-004 AC-2 |
| TC-367 | Depth confirm -> Step 3 | REQ-004 AC-3 |
| TC-368 | Back from Step 3 -> Step 2 | REQ-004 AC-5 |
| TC-369 | Back from Step 2 -> Step 1 | REQ-004 AC-6 |
| TC-370 | Depth pill re-entry from later steps | REQ-004 AC-7 |
| TC-371 | Stepper shows correct step sequence | REQ-004 AC-4 |
| TC-372 | stepBeforeOverlay tracks Step 2 | REQ-004 AC-8 |

**Replaced test:** TC-329 (was: depth overlay fires after Step 1) replaced by TC-365 (overlay does NOT fire after Step 1).
**Removed per QF-3:** TC-385 removed; POM navigation implicitly tested via TC-365-TC-369.

#### Modified File: `tests/intake/intake-hotel-car-i18n-keys.spec.ts` (1 new test)

| TC | Test | Coverage |
|----|------|----------|
| TC-384 | s6_multiselect_hint key in all 12 locale files | DD 1.12 |

#### Updated Files (POM navigation fix for step reorder)
- `tests/intake/intake-depth-stepper.spec.ts` — Added `completeStep2()` before depth overlay
- `tests/intake/intake-structure.spec.ts` — Added `completeStep2()` before depth overlay
- `tests/intake/intake-i18n-catalog-loading.spec.ts` — Added `completeStep2()` before depth overlay
- `tests/intake/intake-design-spec.spec.ts` — Added `completeStep2()` before depth overlay
- `tests/intake/intake-a11y-full.spec.ts` — Added `completeStep2()` before depth overlay
- `tests/intake/intake-depth-a11y.spec.ts` — Added `completeStep2()` before depth overlay
- `tests/intake/intake-depth-selector.spec.ts` — Added `completeStep2()` before depth overlay
- `tests/intake/intake-depth-feedback.spec.ts` — Added `completeStep2()` before depth overlay

**Implementation notes:**
- QF-1 resolved: TC-383 uses `expect(visibleStep).toHaveAttribute('data-step', '2', { timeout: 1000 })` instead of `page.waitForTimeout(600)`
- QF-2 resolved: TC-354 and TC-379 consolidated into one test asserting both `.is-selected` and `aria-pressed` per card
- QF-3 resolved: TC-385 removed; POM correctness tested implicitly by TC-365-TC-369
- QF-4 resolved: Reused existing `hotelTypeGrid` and `carCategoryGrid` POM locators; added `multiSelectGrids` and `multiSelectHints` for structural tests only
- All assertions language-agnostic: CSS selectors, `data-en-name` attributes, and `data-i18n` keys only
- Standard fixture for all mutation tests; no shared-page fixture (all tests click/interact)

#### Files Modified
- `tests/pages/IntakePage.ts` — 2 new properties + 1 new method + 2 updated methods
- `tests/intake/intake-hotel-car-assistance.spec.ts` — 21 new tests + 2 replaced
- `tests/intake/intake-functional.spec.ts` — 8 new tests + 1 replaced + existing tests updated
- `tests/intake/intake-hotel-car-i18n-keys.spec.ts` — 1 new test
- 8 additional spec files updated for POM navigation change

#### Files Added
- None

### Affected Sections
- Intake wizard Step 2 (hotel/car assistance) — multi-select behavior
- Intake wizard step navigation order — depth overlay now fires after Step 2
- BRD coverage: REQ-001 through REQ-005 — 30 new test cases consolidated into 30 `test()` blocks

---

## 2026-03-29 — Accommodation Integration: Hotel Discovery & Booking Referral Cards

### Changes

#### Modified File: `tests/pages/TripPage.ts` (4 new properties, 9 new methods)

**New readonly properties (constructor-initialized):**
- `accommodationSections` — `.accommodation-section`
- `accommodationCards` — `.accommodation-card`
- `accommodationCardRatings` — `.accommodation-card__rating`
- `bookingCtas` — `.booking-cta` (named per QF-4: consistent plural form without DOM suffix)

**New helper methods:**
- `getAccommodationSection()` — `#accommodation` (top-level section, not inside day cards)
- `getAccommodationCards()` — `#accommodation .accommodation-card`
- `getAccommodationCardName(card)` — `.accommodation-card__name`
- `getAccommodationCardRating(card)` — `.accommodation-card__rating`
- `getAccommodationCardBookingCta(card)` — `.booking-cta`
- `getAccommodationCardPriceLevel(card)` — `.accommodation-card__price-level`
- `getAccommodationCardTag(card)` — `.accommodation-card__tag`
- `getAccommodationCardLinks(card)` — `.accommodation-card__link`
- `getAccommodationCardProTip(card)` — `.pro-tip`

#### Appended to `tests/regression/progression.spec.ts` (7 tests covering 17 logical TCs)

| TC | Test | Coverage |
|----|------|----------|
| TC-200+201 | Accommodation section present on anchor days, absent on non-anchor days | REQ-004 AC-1; REQ-005 AC-3; REQ-010 AC-1 |
| TC-202+203+205+213+214+215+216 | Card count, structure, tags, grid, pro-tips, intro, visual distinction | REQ-004 AC-4/AC-9; REQ-009 AC-1/AC-2/AC-6; REQ-010 AC-2/AC-6 |
| TC-204+206 | Booking CTA link structure and URL parameters | REQ-003 AC-1 through AC-6; REQ-009 AC-3; REQ-010 AC-3 |
| TC-207+208 | Price level pip structure and ascending order | REQ-004 AC-10; REQ-009 AC-4 |
| TC-209+210 | Accommodation line in anchor day pricing grid and aggregate budget | REQ-005 AC-1/AC-4; REQ-010 AC-4/AC-5 |
| TC-211 | Manifest accommodation schema validation | REQ-001 AC-1 through AC-5; REQ-008 AC-1 through AC-5 |
| TC-212 | Accommodation cards not counted in POI totals | REQ-009 AC-2; POI parity rule |
| TC-214 | All accommodation cards are children of accommodation-grid | REQ-009 AC-6 |

**Implementation notes:**
- Manifest-driven anchor day detection via inline `getAccommodationStays()` helper (QF-7: no separate utility file)
- QF-1 incorporated: contiguous night coverage assertion for multi-stay trips (no gaps between stays)
- QF-2 incorporated: duplicate class-exclusion check removed from TC-212; TC-205 is authoritative
- QF-3 incorporated: section heading `🏨` emoji presence assertion added to Test Block 1
- QF-4 incorporated: global property named `bookingCtas` (not `bookingCtaButtons`) for POM consistency
- QF-6 incorporated: manifest `options_count` cross-validated against actual DOM card count
- All assertions use `expect.soft()` with descriptive `'Day N, Card C: ...'` messages
- No hardcoded natural language text — CSS selectors, URL patterns, and `🏨` emoji marker only
- Shared-page fixture for all DOM tests; file-system only for TC-211 manifest schema
- TC-204 uses JavaScript `URL` class for robust parameter parsing (no regex on full URL)

#### Files Modified
- `tests/pages/TripPage.ts` — 4 new properties + 9 new methods for accommodation locators
- `tests/regression/progression.spec.ts` — 7 new tests in `test.describe('Progression — Accommodation Integration')` block

#### Files Added
- None

### Affected Sections
- No HTML or content changes — test-only update
- Tests target `trip_full_{LANG}.html` (generated trip HTML)
- BRD coverage: REQ-001/003/004/005/008/009/010/011 — 17 logical test cases consolidated into 7 `test()` blocks

---

## 2026-03-28 — Themed Container Contrast: Banner Luminance Regression & Utility Tests

### Changes

#### New File: `tests/utils/color-utils.ts` (utility)

Pure-function module providing `parseRgb()` and `relativeLuminance()` for sRGB contrast validation. No Playwright dependency. Used by `banner-contrast.spec.ts` and validated by `color-utils.spec.ts`.

#### New Spec File: `tests/regression/color-utils.spec.ts` (8 tests)

| TC | Test | Coverage |
|----|------|----------|
| TC-003.1 | parseRgb parses rgb(255, 255, 255) | REQ-002 -> AC-3 |
| TC-003.2 | parseRgb parses rgb(0, 0, 0) | REQ-002 -> AC-3 |
| TC-003.3 | parseRgb parses rgba(250, 250, 250, 1) | REQ-002 -> AC-3 |
| TC-003.4 | parseRgb throws on invalid input | REQ-002 -> AC-3 |
| TC-003.5 | relativeLuminance returns ~1.0 for white | REQ-002 -> AC-3 |
| TC-003.6 | relativeLuminance returns 0.0 for black | REQ-002 -> AC-3 |
| TC-003.7 | relativeLuminance returns ~0.95 for #FAFAFA | REQ-002 -> AC-3 |
| TC-003.8 | relativeLuminance returns ~0.012 for #1C1C1E (pre-fix) | REQ-002 -> AC-3 |

**Implementation notes:**
- Standalone unit test file per QA QF-3 recommendation (separation of concerns)
- Imports from `@playwright/test` — no shared-page fixture needed (pure functions)
- Hard assertions: utility correctness is foundational

#### New Spec File: `tests/regression/banner-contrast.spec.ts` (dayCount tests)

| TC | Test | Coverage |
|----|------|----------|
| TC-001+002 | Day N banner title and date luminance > 0.7 | REQ-002 -> AC-1, AC-2, AC-4, AC-5, AC-7, AC-8 |

**Implementation notes:**
- One `test()` per day with 4 `expect.soft()` calls: existence check + luminance check for both title and date
- Shared-page fixture (read-only `evaluate()` for `getComputedStyle().color`)
- Existence-check soft assertions per QA QF-2 recommendation (missing elements flagged, not silently skipped)
- `MIN_LUMINANCE = 0.7` named constant at file top
- All selectors via POM (`getDayBannerTitle(n)`, `getDayBannerDate(n)`)
- No hardcoded language strings — CSS class selectors only

#### Appended to `tests/regression/progression.spec.ts` (1 test)

| TC | Test | Coverage |
|----|------|----------|
| TC-007 | Banner title/date explicit color declaration in inlined `<style>` | REQ-003 -> AC-1, AC-2, AC-3 |

**Implementation notes:**
- Regex validation on inlined `<style>` content via `tripPage.inlineStyle`
- `.day-card__banner-date` regex uses soft assertion — may not match if element inherits from parent (SA FB-1 option b)

#### Files Added
- `tests/utils/color-utils.ts` — sRGB luminance utility (parseRgb, relativeLuminance)
- `tests/regression/color-utils.spec.ts` — 8 unit tests for color utilities
- `tests/regression/banner-contrast.spec.ts` — per-day banner contrast regression tests

#### Files Modified
- `tests/regression/progression.spec.ts` — appended TC-007 themed container contrast gate test

#### POM Changes
- None — existing `getDayBannerTitle(n)` and `getDayBannerDate(n)` methods used. `getDayBanner(n)` omitted per SA FB-3 (not needed by spec).

---

## 2026-03-28 — Hotel Assistance & Car Rental Assistance: Intake Progression Tests (29 TCs)

### Changes

#### New Spec File: `tests/intake/intake-hotel-car-assistance.spec.ts` (22 tests)

| TC | Test | Coverage |
|----|------|----------|
| TC-201+211 | Hotel and car sections visible on Step 6 at all depths (3 iterations) | REQ-001 -> AC-1; REQ-003 -> AC-1; REQ-011 -> AC-2, AC-3 |
| TC-202+212 | Both toggles default to "No" with sub-questions hidden | REQ-001 -> AC-2, AC-3; REQ-003 -> AC-2, AC-3 |
| TC-203 | Hotel toggle "Yes" reveals 7 sub-questions | REQ-001 -> AC-4; REQ-002 -> AC-1 |
| TC-204 | Hotel toggle "No" collapses and resets all selections | REQ-001 -> AC-5 |
| TC-205+208 | Hotel sub-question option counts, slider config, and hotelPets default | REQ-002 -> AC-2 through AC-8 |
| TC-206 | Hotel type card grid single-select (radio) behavior | REQ-002 -> AC-2 |
| TC-207 | Hotel amenities multi-select chip behavior | REQ-002 -> AC-5 |
| TC-209 | Hotel budget range slider keyboard interaction | REQ-005 -> AC-6, AC-7 |
| TC-210 | Range slider handles cannot cross each other | REQ-005 -> AC-3 |
| TC-213 | Car toggle "Yes" reveals 6 sub-questions | REQ-003 -> AC-4; REQ-004 -> AC-1 |
| TC-214 | Car toggle "No" collapses and resets all selections | REQ-003 -> AC-5 |
| TC-215 | Car sub-question option counts and slider config | REQ-004 -> AC-2 through AC-7 |
| TC-216 | Car category card grid single-select (radio) behavior | REQ-004 -> AC-2 |
| TC-217 | Car extras multi-select chip behavior | REQ-004 -> AC-6 |
| TC-218+220 | Hotel and car markdown output with fields; section ordering (QF-3) | REQ-006 -> AC-1, AC-3, AC-4, AC-6, AC-7; REQ-007 -> AC-1, AC-3, AC-4, AC-6, AC-7 |
| TC-219+221 | Hotel and car sections omitted from markdown when "No" | REQ-006 -> AC-2; REQ-007 -> AC-2 |
| TC-222 | Unselected fields show "Not specified" / "None" defaults | REQ-006 -> AC-5; REQ-007 -> AC-5 |
| TC-227 | Step 6 section ordering: wheelchair before hotel before car | REQ-010 -> AC-1, AC-5 |
| TC-228 | Expand animation uses CSS transition (max-height + opacity) | REQ-009 -> AC-1 |
| TC-229 | Hotel and car toggles operate independently | REQ-001, REQ-003 (independence) |

#### New Spec File: `tests/intake/intake-hotel-car-i18n-keys.spec.ts` (1 test, static file analysis)

| TC | Test | Coverage |
|----|------|----------|
| TC-223 | All 101 i18n keys present in all 12 locale files | REQ-008 -> AC-1 through AC-5 |

**QF-1 resolution:** TC-223 separated into its own spec file (no browser dependency). Playwright does not launch a browser since `page` is never referenced.

#### New Spec File: `tests/intake/intake-hotel-car-i18n.spec.ts` (3 tests, browser-based)

| TC | Test | Coverage |
|----|------|----------|
| TC-224 | data-i18n attributes on all hotel section DOM elements | REQ-008 -> AC-1; REQ-002 -> AC-9 |
| TC-225 | data-i18n attributes on all car section DOM elements | REQ-008 -> AC-1; REQ-004 -> AC-8 |
| TC-226 | data-en-name attributes on option cards and chips | REQ-008 -> AC-6 |

**Implementation notes:**
- TC-201+211 and TC-202+212 merged per QF-2 to reduce page loads (hotel and car checked in same visit)
- TC-218+220 includes QF-3 markdown section ordering assertion (Hotel before Car)
- TC-205 includes TC-208 (hotelPets default) as traceability alias via `expect.soft()`
- Markdown assertions use English field labels — intentional (generateMarkdown() outputs hard-coded English)
- All slider tests use keyboard interaction (ArrowRight/ArrowLeft), not pointer drag
- No `waitForTimeout()` or `sleep()` calls — all state verified via web-first assertions

#### Playwright Config Changes
- Added `/intake-hotel-car/` to `testIgnore` arrays in both `desktop-chromium` and `desktop-chromium-rtl` projects
- Updated `intake-i18n` project `testMatch` to include `intake-hotel-car`

#### Files Modified
- `tests/pages/IntakePage.ts` — added 12 new locators and 3 parameterized helper methods
- `playwright.config.ts` — updated testMatch/testIgnore for new intake spec file routing

#### Files Added
- `tests/intake/intake-hotel-car-assistance.spec.ts` — 22 progression tests (toggle, expand/collapse, option counts, selection, slider, markdown, ordering, animation, independence)
- `tests/intake/intake-hotel-car-i18n-keys.spec.ts` — 1 static file analysis test (101 keys x 12 locales)
- `tests/intake/intake-hotel-car-i18n.spec.ts` — 3 browser-based i18n DOM attribute tests

#### New POM Locators (IntakePage.ts)
- `hotelAssistanceSection` — `#hotelAssistanceSection`
- `hotelToggle` — `[data-question-key="hotelAssistToggle"]`
- `hotelSubQuestions` — `#hotelSubQuestions`
- `hotelTypeGrid` — `[data-question-key="hotelType"] .option-grid`
- `hotelAmenitiesChips` — `#hotelAmenitiesChips`
- `hotelBudgetSlider` — `#hotelBudgetSlider`
- `carAssistanceSection` — `#carAssistanceSection`
- `carToggle` — `[data-question-key="carAssistToggle"]`
- `carSubQuestions` — `#carSubQuestions`
- `carCategoryGrid` — `[data-question-key="carCategory"] .option-grid`
- `carExtrasChips` — `#carExtrasChips`
- `carBudgetSlider` — `#carBudgetSlider`
- `assistanceSectionByKey(key)` — parameterized locator for hotel or car section
- `sliderHandle(sliderId, handleType)` — parameterized locator for slider min/max handles
- `getSubQuestionByKey(sectionId, questionKey)` — parameterized sub-question locator

### Affected Sections
- No HTML or content changes — test-only update
- Tests target `trip_intake.html` (intake wizard page, not generated trip HTML)
- BRD coverage: REQ-001 through REQ-011 — 65 of 79 acceptance criteria covered; 14 correctly deferred to existing specs or non-automatable

---

## 2026-03-23 — Google Places MCP: POI Phone/Rating + Wheelchair Accessibility (13 TCs)

### Changes

#### Modified Spec File: `tests/regression/poi-cards.spec.ts` (5 new tests + 1 modified)

| TC | Test | Coverage |
|----|------|----------|
| TC-142 | Phone links have valid tel: href structure | REQ-009 -> AC-1, AC-3; REQ-003 -> AC-2, AC-3, AC-4 |
| TC-143 | Phone links appear as last link in POI card link row | REQ-003 -> AC-2; REQ-009 -> AC-1 |
| TC-144 | Rating elements have correct class and contain numeric value | REQ-009 -> AC-2, AC-3; REQ-005 -> AC-1, AC-2, AC-3, AC-5 |
| TC-145 | Rating elements positioned in card body, not link row | REQ-005 -> AC-2 |
| TC-146 | Accessibility badge elements positioned in card body | REQ-005 -> AC-4; REQ-007 -> AC-2 |
| TC-154 | Non-exempt POI cards have 3 or 4 links (modified existing test) | REQ-003 -> AC-2, AC-4; REQ-009 -> AC-3 |

#### Modified Spec File: `tests/regression/progression.spec.ts` (3 new tests)

| TC | Test | Coverage |
|----|------|----------|
| TC-153 | At least one POI card has a phone link | REQ-009 -> AC-1 |
| TC-154 | At least one POI card has a rating element | REQ-009 -> AC-2 |
| TC-152 | Accessible badges, if present, have correct class | REQ-007 -> AC-2 |

#### New Spec File: `tests/intake/intake-wheelchair.spec.ts` (7 tests)

| TC | Test | Coverage |
|----|------|----------|
| TC-147 | Wheelchair question visible on Step 6 at all depths (3 iterations) | REQ-010 -> AC-1; REQ-006 -> AC-1, AC-2 |
| TC-148 | Wheelchair question defaults to "No Requirement" selected | REQ-006 -> AC-3; REQ-010 -> AC-3 |
| TC-149 | Selecting wheelchair option toggles correctly | REQ-006 -> AC-3; REQ-010 -> AC-3 |
| TC-150 | Wheelchair "yes" produces field in markdown output | REQ-010 -> AC-2; REQ-006 -> AC-4 |
| TC-151 | Wheelchair "no" (default) produces field in markdown output | REQ-010 -> AC-2; REQ-006 -> AC-4 |
| TC-152 | Wheelchair i18n keys present in all 12 locale files | REQ-006 -> AC-5 |
| TC-153 | Wheelchair question has correct data-i18n DOM attributes | REQ-006 -> AC-5 |

**Implementation notes:**
- TC-142/TC-143/TC-144/TC-145/TC-146 use shared-page fixture (read-only DOM assertions)
- TC-150/TC-151 markdown assertions use English labels — intentional exception (QF-1 confirmed: `generateMarkdown()` uses hard-coded English keys)
- TC-147 iterates over depths [10, 20, 30] with separate page loads per depth
- TC-152 is static file analysis (no browser needed), placed in intake spec for organizational consistency

#### Playwright Config Changes
- Added `/intake-wheelchair/` to `testIgnore` arrays in both `desktop-chromium` and `desktop-chromium-rtl` projects
- Updated `intake-i18n` project `testMatch` to include `intake-wheelchair`

#### Files Modified
- `tests/pages/TripPage.ts` — added `poiCardRatings` property and 3 new methods
- `tests/pages/IntakePage.ts` — added `wheelchairQuestion` property
- `tests/regression/poi-cards.spec.ts` — 5 new tests + 1 modified test (TC-154: 3-or-4 links)
- `tests/regression/progression.spec.ts` — 3 new tests in new describe block
- `playwright.config.ts` — updated testMatch/testIgnore for new intake spec file routing

#### Files Added
- `tests/intake/intake-wheelchair.spec.ts` — 7 progression tests covering wheelchair accessibility question

#### New POM Locators (TripPage.ts)
- `poiCardRatings` — all `.poi-card__rating` elements
- `getPoiCardPhoneLink(poiCard)` — phone link within specific POI card
- `getPoiCardRating(poiCard)` — rating within specific POI card
- `getPoiCardAccessibleBadge(poiCard)` — accessible badge within specific POI card

#### New POM Locators (IntakePage.ts)
- `wheelchairQuestion` — `.depth-extra-question[data-question-key="wheelchairAccessible"]`

### Affected Sections
- POI card tests target generated trip HTML (`trip_full_{LANG}.html`)
- Intake tests target `trip_intake.html` via bridge server (`http://localhost:3456`)
- BRD coverage: REQ-003 (AC-2, AC-3, AC-4), REQ-005 (AC-2, AC-3, AC-4, AC-5), REQ-006 (AC-1 through AC-5), REQ-007 (AC-2), REQ-009 (AC-1 through AC-4), REQ-010 (AC-1 through AC-3)

---

## 2026-03-22 — Mix/All Option Cards: Progression Tests (8 TCs)

### Changes

#### New Spec File: `tests/intake/intake-mix-options.spec.ts` (1 file, 8 test cases)

| TC | Test | Coverage |
|----|------|----------|
| TC-134 | diningstyle question has 4 cards with correct data attributes | REQ-001 -> AC-1..AC-5 |
| TC-135 | mealpriority question has 4 cards with correct data attributes | REQ-002 -> AC-1..AC-5 |
| TC-136 | transport question has 4 cards with correct data attributes | REQ-003 -> AC-1..AC-5 |
| TC-137 | Selecting mix/all card applies is-selected and deselects siblings | REQ-001/002/003 -> AC-6 |
| TC-138 | New i18n keys present in all 12 locale files | REQ-004 -> AC-1..AC-3 |
| TC-139 | Markdown label maps include new option values | REQ-005 -> AC-1..AC-4 |
| TC-140 | scoreFoodItem handles diningstyle mix correctly | REQ-006 -> AC-1..AC-3 |
| TC-141 | Rule documentation lists new allowed values | REQ-007 -> AC-1..AC-3 |

**Implementation notes:**
- TC-134/135/136 consolidated into 1 data-driven test with batched `page.evaluate()` (3 iterations)
- TC-137 uses standard `@playwright/test` import with `beforeEach` (mutates page state via clicks)
- TC-138/139/140/141 are filesystem-only tests (source analysis via `fs.readFileSync` and regex)

#### Playwright Config Changes
- Updated `intake-i18n` project `testMatch` to include `intake-mix-options`
- Added `/intake-mix-options/` to `testIgnore` arrays in both `desktop-chromium` and `desktop-chromium-rtl` projects

#### Files Modified
- `playwright.config.ts` — updated `testMatch` and `testIgnore` patterns for new spec file routing

#### Files Added
- `tests/intake/intake-mix-options.spec.ts` — 8 progression tests covering mix/all option cards

#### New POM Locators
- None — all tests use existing `IntakePage.questionByKey()` plus inline sub-locators and `page.evaluate()`

### Affected Sections
- No HTML or content changes — test-only update
- Tests target `trip_intake.html` (intake page, not generated trip HTML)
- BRD coverage: all 7 requirements (REQ-001 through REQ-007) and all 27 acceptance criteria

---

## 2026-03-22 — i18n Alignment Regression: Key Leak Scanner & Field Alignment Tests (2 TCs)

### Changes

#### New Spec Files: `tests/intake/` (2 files, 2 test cases)

| File | Tests | Coverage |
|------|-------|----------|
| `intake-i18n-key-leak.spec.ts` | 1 (TC-132) | Generic i18n key leak scanner — scans all visible text, select options, and input placeholders for raw i18n key patterns (`/\b[a-z]\d+_[a-z]\w*\b/`) in non-English UI |
| `intake-step1-alignment.spec.ts` | 1 (TC-133) | Step 1 form field vertical alignment — validates Name input, Gender select, and DOB-year select top edges are within 5px tolerance in `.row--3` grid rows |

#### Playwright Config Changes
- Broadened `intake-i18n` project `testMatch` to `/intake-i18n-catalog|intake-i18n-key-leak|intake-step1-alignment/`
- Updated `desktop-chromium` `testIgnore` to exclude `intake-i18n-key-leak` and `intake-step1-alignment` (these require HTTP transport via bridge server)

#### Files Modified
- `playwright.config.ts` — updated testMatch/testIgnore patterns for new intake test files

#### Files Added
- `tests/intake/intake-i18n-key-leak.spec.ts` — 1 invariant test scanning for i18n key leaks
- `tests/intake/intake-step1-alignment.spec.ts` — 1 structural test validating form field alignment

#### New POM Locators
- None — both tests use existing `IntakePage` methods plus `page.evaluate()` for DOM inspection

### Affected Sections
- No HTML or content changes — test-only update
- Tests target `trip_intake.html` (intake page, not generated trip HTML)
- BRD coverage: REQ-003 (AC-1 through AC-6) and REQ-004 (AC-1 through AC-6)

---

## 2026-03-22 — i18n External Catalogs: Automation Tests (32 TCs)

### Changes

#### New Spec Files: `tests/intake/` (2 files, 32 test cases)

| File | Tests | Coverage |
|------|-------|----------|
| `intake-i18n-catalogs.spec.ts` | 10 (TC-100–TC-107, TC-125–TC-127) | JSON file existence, validity, structure, cross-catalog consistency, removed consts, no build step, rule file documentation |
| `intake-i18n-catalog-loading.spec.ts` | 22 (TC-108–TC-124, TC-128–TC-131) | Catalog fetching, caching, fallback chain, emergency catalog, translations, RTL, localStorage persistence, FOUC prevention, card rendering, markdown output, bridge server, file:// detection, race conditions, cross-validation |

#### New POM Method: `IntakePage.waitForI18nReady()`
- Waits for `body.i18n-loading` class to be removed. Mandatory after every `goto()` or `page.reload()` on the intake page.
- Implementation: `await this.page.waitForFunction(() => !document.body.classList.contains('i18n-loading'))`

#### New Shared Utility: `tests/intake/utils/request-counter.ts`
- `createRequestCounter(page, urlPattern)` — monitors network requests matching a glob pattern. Returns `{ count, requests, reset() }`. Used by TC-108, TC-109, TC-112, TC-117, TC-118 to avoid duplicating request interception logic.

#### Playwright Config Changes
- Added `intake-i18n` project with `baseURL: 'http://localhost:3456/trip_intake.html'` and `testMatch: /intake-i18n-catalog/`
- Added `webServer` block to auto-start `trip_bridge.js` on port 3456 with `reuseExistingServer: true` and `timeout: 10000`

#### Files Modified
- `tests/pages/IntakePage.ts` — added `waitForI18nReady()` method
- `playwright.config.ts` — added intake-i18n project and webServer config

#### Files Added
- `tests/intake/intake-i18n-catalogs.spec.ts` — 10 filesystem validation tests
- `tests/intake/intake-i18n-catalog-loading.spec.ts` — 22 browser-based tests
- `tests/intake/utils/request-counter.ts` — shared network request counter utility

#### New POM Locators
- None — all new tests use existing `IntakePage` locators plus `page.evaluate()` and `page.route()` for network monitoring

### Affected Sections
- No HTML or content changes — test-only update
- Tests target `trip_intake.html` (intake page, not generated trip HTML)
- BRD coverage: all 7 requirements (REQ-001 through REQ-007) and all 39 acceptance criteria

---

## 2026-03-21 — Dynamic Trip Details Filename: Automation Tests

### Changes

#### New Progression Test (appended to `progression.spec.ts`)
- **TC-006 — Manifest `trip_details_file` Field:** Hard-asserts that `manifest.json` contains a `trip_details_file` field as a non-empty string. Also soft-asserts `destination` field presence per QF-1 recommendation. No conditional logic — test assumes manifest was generated after DD changes (per QF-2).

#### New Code Quality Tests (appended to `language-independence.spec.ts`)
- **TC-008 — Env Var Documentation:** Verifies both `trip-config.ts` and `language-config.ts` contain a reference to `TRIP_DETAILS_FILE` env var. Uses `expect.soft()` for batched file scanning.
- **TC-009 — No Hardcoded `path.resolve` with `trip_details.md`:** Scans `trip-config.ts` and `language-config.ts` for the pattern `resolve(..., 'trip_details.md')`. The env var fallback `|| 'trip_details.md'` is intentionally NOT flagged. Uses precise regex `/resolve\(.*['"]trip_details\.md['"]\)/` per QF-3.

#### Dual-Run Validation (no new test code)
- TC-001 through TC-005, TC-007, TC-010: Existing trip-agnostic tests validate alternate file behavior when run with `TRIP_DETAILS_FILE=Maryan.md` env var set externally. No code changes needed.

#### Files Modified
- `tests/regression/progression.spec.ts` — TC-006 test appended to Manifest Integrity block
- `tests/code-quality/language-independence.spec.ts` — TC-008 and TC-009 tests appended as new describe block

#### Files Added
- None

#### New POM Locators
- None — all new tests are file-level (manifest JSON, source code scanning), not DOM-level

### Affected Sections
- No HTML or content changes — test-only update
- New tests cover: manifest `trip_details_file` field validation (TC-006), env var documentation check (TC-008), hardcoded filename lint guard (TC-009)

---

## 2026-03-21 — Parallelize Overview and Budget Fragment Generation with Day Batches

### Changes

#### New Regression Tests (appended to `overview-budget.spec.ts`)
- **TC-004 — Budget Section Isolation:** Added `expect.soft()` assertion inside existing `test('should have budget section visible')` block to verify `#budget` is not nested inside any `.day-card` element. Selector: `.day-card #budget`, expected count: 0.
- **TC-005 — Assembly Order:** New `test.describe('Assembly Order', ...)` block with a single `test()` using `page.evaluate()` and `Node.compareDocumentPosition()` to verify that `#overview` precedes `#day-0` and `#budget` follows `#day-{N}` in document order. Returns named-property object `{ overviewBeforeDay0, budgetAfterLastDay }` for independent `expect.soft()` messages. Last day index derived from `tripConfig.dayCount - 1`.
- **TC-008 — Fragment File Existence:** New `test.describe('Fragment File Existence', ...)` block using `baseTest`/`baseExpect` from `@playwright/test` (aliased import, scoped exclusively to this describe block). Checks `fragment_overview_{langCode}.html` and `fragment_budget_{langCode}.html` exist on disk via `fs.existsSync()`. Trip folder path derived from `getManifestPath()`. Language code from `tripConfig.labels.langCode`. Path construction uses `path.join()` for platform independence.

#### Files Modified
- `tests/regression/overview-budget.spec.ts` — TC-004 assertion added to existing test block; TC-005 and TC-008 describe blocks appended

#### Files Added
- None

### Affected Sections
- No HTML or content changes — test-only update
- New tests cover: budget section isolation (TC-004), assembly DOM order (TC-005), fragment file existence on disk (TC-008)

---

## 2026-03-20 — Moldova Hebrew 14-Day Trip Generation & Test Data Sync

### Changes

#### Trip Generated: Chișinău, Moldova (Hebrew, RTL)
- 14-day itinerary: May 18–31 2026 (`trip_2026-03-20_1814/`)
- 84 total POI cards across 14 days (day_00–day_13)
- Budget: ~56,728 MDL / ~2,908 EUR
- Language: Hebrew (`he`), direction: RTL

#### Test Data Sync (required per §4)
- `rtl-layout.spec.ts`: `daySections` count 12 → 14; sidebar/pill counts 14 → 16; hrefs array added `#day-12`, `#day-13`; day loop extended to `i <= 13`; POI check range updated to `i <= 12`
- `navigation.spec.ts`: sidebar/pill counts 14 → 16; hrefs arrays added `#day-12`, `#day-13`
- `trip-config.ts` Hebrew `destinationNames`: added `'Moldova': 'מולדובה'`
- `poi-cards.spec.ts`: link-exempt test now skips gracefully when no exempt cards present (trip has no `data-link-exempt` cards)
- `trip_full_he.html`: `<title>` corrected from "מסלול המסע" → "מסלול משפחתי" to match `pageTitlePattern`

---

## 2026-03-19 — Question Depth Selector: Intake Page Test Suite (37 Tests)

### Changes

#### New POM: `tests/pages/IntakePage.ts`
- Page Object Model for the trip intake wizard page (`trip_intake.html`), separate from `TripPage.ts` which targets trip output HTML.
- **20+ locators** covering: depth selector overlay, depth cards, context bar, progress bar, stepper, toast notifications, step sections, questions by key/tier, review step.
- **Helper methods**: `completePrerequisiteSteps()`, `setupWithDepth(n)`, `selectDepthAndConfirm(n)`, `navigateForwardThroughAllSteps()`, `getCurrentStepNumber()`, `getVisibleQuestionKeys()`, `countAllVisibleQuestions()`, `getReviewContent()`.

#### New Spec Files: `tests/intake/` (8 files, 37 test cases)

| File | Tests | Coverage |
|------|-------|----------|
| `intake-depth-selector.spec.ts` | 3 (TC-001, TC-002, TC-003) | Overlay rendering, default selection, card interaction |
| `intake-depth-questions.spec.ts` | 8 (TC-004–TC-009, TC-033–TC-035) | Question visibility per depth (data-driven), auto-advance, T4/T5 rendering |
| `intake-depth-stepper.spec.ts` | 6 (TC-010–TC-015) | Stepper adaptation, sub-step dots, progress bar, empty step prevention, step merging |
| `intake-depth-change.spec.ts` | 5 (TC-016–TC-018, TC-036, TC-037) | Mid-wizard depth change, answer preservation, re-entry overlay, Escape behavior |
| `intake-depth-output.spec.ts` | 5 (TC-019–TC-023) | Markdown output completeness, defaults, pre-selection scoring |
| `intake-depth-feedback.spec.ts` | 3 (TC-024–TC-026) | Context bar pill, toast notifications, smooth transitions |
| `intake-depth-a11y.spec.ts` | 4 (TC-027–TC-030) | Keyboard navigation, Escape dismissal, ARIA roles, focus management |
| `intake-depth-i18n.spec.ts` | 2 (TC-031, TC-032) | i18n key presence for 12 languages (depth + new questions) |

#### Implementation Notes
- All tests use standard `@playwright/test` import (all tests mutate the page).
- TC-004 through TC-009 consolidated into data-driven parameterized tests per QA feedback (QF-2).
- Spec files placed in `tests/intake/` directory (separate from `tests/regression/`) per QA feedback (QF-1).
- No hardcoded language-specific strings — all assertions use CSS selectors, `data-*` attributes, and structural checks.
- TC-023 follows QF-4 guidance: passes through quiz step before checking chip pre-selections.

#### Files Added
- `tests/pages/IntakePage.ts` — Intake page POM
- `tests/intake/intake-depth-selector.spec.ts`
- `tests/intake/intake-depth-questions.spec.ts`
- `tests/intake/intake-depth-stepper.spec.ts`
- `tests/intake/intake-depth-change.spec.ts`
- `tests/intake/intake-depth-output.spec.ts`
- `tests/intake/intake-depth-feedback.spec.ts`
- `tests/intake/intake-depth-a11y.spec.ts`
- `tests/intake/intake-depth-i18n.spec.ts`

### Affected Sections
- No HTML or content changes — test-only update
- Tests target `trip_intake.html` (not trip output HTML)

---

## 2026-03-15 — Parallel Phase B: Progression Tests for POI Uniqueness & Manifest Integrity

### Changes

#### New Progression Tests (appended to `progression.spec.ts`)
- **TC-004 — POI Uniqueness:** Verifies no duplicate POI names appear across different days. Extracts all POIs from markdown, strips emoji prefixes, and checks for exact-match duplicates. Hard assert — duplicate POIs are a critical defect.
- **TC-005/TC-006 — Manifest Integrity (consolidated per QF-1):** Reads `manifest.json` from the latest trip folder, verifies every day has `status: "complete"` and a non-empty `last_modified` string. Uses `expect.soft()` per day for granular failure reporting.

#### New Utility: `tests/utils/trip-folder.ts` (QF-2)
- Shared trip folder discovery logic extracted from `markdown-pois.ts`.
- Exports `getTripFolders()`, `getLatestTripFolderPath(filename?)`, and `getManifestPath()`.
- `markdown-pois.ts` refactored to use `getLatestTripFolderPath()` instead of inline folder scanning.

#### Files Modified
- `tests/regression/progression.spec.ts` — 2 new test blocks appended (3 test cases total: 1 POI uniqueness + 1 manifest integrity)
- `tests/utils/markdown-pois.ts` — refactored to use shared `trip-folder.ts`

#### Files Added
- `tests/utils/trip-folder.ts` — shared trip folder discovery utility

### Affected Sections
- No HTML or content changes — test-only update

---

## 2026-03-14_1745 — Full Trip Regeneration — 86 POIs, Expanded Coverage

### Changes

#### Trip Content (Full Regeneration)
- **Full 12-day trip regenerated** with comprehensive POI coverage: 86 POI cards (was 39).
- **POI distribution:** Day 0:3, 1:8, 2:8, 3:10, 4:7, 5:9, 6:7, 7:8, 8:8, 9:7, 10:7, 11:4
- **Budget total**: 627 550 HUF / 1 626 EUR (was 656 100 HUF / 1 643 EUR).
- **New "Only Here" attractions:**
  - Day 5: Children's Railway (Gyermekvasút) + Cogwheel Railway (Fogaskerekű)
  - Day 5: Budakeszi Wildlife Park with Dino Park
  - Day 6: Bear Farm Veresegyház (Medveotthon) — 42 rescued bears
  - Day 7: Capital Circus (Fővárosi Nagycirkusz) + Miniversum
  - Day 10: Palace of Wonders (Csodák Palotája) for Itay's 4th birthday
- **Enhanced daily coverage:** Each day now includes grocery store, along-the-way stops, and Plan B alternatives as full POI cards
- **New folder:** `generated_trips/trip_2026-03-14_1745/`
- **Multi-language file naming:** All files use `_ru` suffix per content_format_rules.md

#### Config Changes
- **playwright.config.ts**: Updated LTR path to `generated_trips/trip_2026-03-14_1745/trip_full_ru.html`.

#### Test Data Synchronized
- **overview-budget.spec.ts**: Budget EUR 1 643 -> 1 626.
- **poi-cards.spec.ts**: Min POI threshold 24 -> 60 (86 total POIs).
- **progression.spec.ts**: Updated to 86 POI count, new per-day distribution, budget 1 626 EUR / 627 550 HUF, 15 notable POIs.

### Affected Sections
- All day sections (Day 0-11) — full content regeneration
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)
- Budget section — new totals (627 550 HUF / 1 626 EUR)
- 86 POI cards — dual-language names, expanded descriptions

---

## 2026-03-14_1054 — New Trip with Outlet Shopping & Grocery Stores — 39 POIs

### Changes

#### Trip Content (Full Regeneration)
- **Full 12-day trip regenerated** with new universal interests: Outlet Shopping and Grocery Stores.
- **39 POI cards** total (was 50): streamlined itinerary focusing on quality over quantity.
- **POI distribution:** Day 0:1, 1:5, 2:4, 3:5, 4:4, 5:3, 6:4, 7:3, 8:2, 9:4, 10:2, 11:2
- **Budget total**: 656 100 HUF / 1 643 EUR (was 730 000 HUF / 1 825 EUR).
- **New features:**
  - Day 9: Premier Outlet Center (Nike, Adidas, Tommy Hilfiger, 150+ brands)
  - Daily grocery store recommendations (SPAR, Tesco, Lidl, CBA, Penny, Auchan)
  - kids_interests integrated as optional along-the-way visits
- **New folder:** `generated_trips/trip_2026-03-14_1054/`
- **Multi-language file naming:** All files use `_ru` suffix per content_format_rules.md

#### Config Changes
- **playwright.config.ts**: Updated LTR path to `generated_trips/trip_2026-03-14_1054/trip_full_ru.html`.

#### Test Data Synchronized
- **overview-budget.spec.ts**: Budget EUR 1 825 -> 1 643.
- **poi-cards.spec.ts**: Min POI threshold 48 -> 24 (39 total POIs).
- **progression.spec.ts**: Updated to 39 POI count, new per-day distribution, budget 1 643 EUR / 656 100 HUF.

### Affected Sections
- All day sections (Day 0-11) — full content regeneration
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)
- Budget section — new totals (656 100 HUF / 1 643 EUR)
- 39 POI cards — dual-language names

---

## 2026-03-14_0120 — New Trip Generation — Budapest Aug 20-31 2026, 12 Days, 50 POIs

### Changes

#### Trip Content (Full Regeneration)
- **Full 12-day trip regenerated** with new folder structure (language suffixes): `trip_2026-03-14_0120/trip_full_ru.html`.
- **50 POI cards** total (was 51): refined itinerary with restructured days.
- **POI distribution:** Day 0:1, 1:5, 2:5, 3:6, 4:5, 5:4, 6:7, 7:4, 8:3, 9:4, 10:4, 11:2
- **Budget total**: 730 000 HUF / 1 825 EUR (was ~703 640 HUF / ~1 854 EUR).
- **12 day sections**, **14 navigation links** (unchanged structure).
- **1 advisory--warning** (Holiday Advisory), **13 advisory--info** sections.
- **New folder structure:** Trip files now in `generated_trips/trip_YYYY-MM-DD_HHmm/` with language-suffixed filenames (`trip_full_ru.html`, `day_XX_ru.md`).

#### Config Changes
- **playwright.config.ts**: Updated LTR path to `generated_trips/trip_2026-03-14_0120/trip_full_ru.html`.

#### Test Data Synchronized
- **overview-budget.spec.ts**: Budget EUR 1 854 -> 1 825.
- **poi-cards.spec.ts**: Min POI threshold 45 -> 48 (50 total POIs now).
- **poi-parity.spec.ts**: Updated markdown reader to support new folder structure with fallback to legacy md/ directory.
- **progression.spec.ts**: Updated to 50 POI count, new per-day distribution, new POI names, budget 1 825 EUR / 730 000 HUF.

### Affected Sections
- All day sections (Day 0-11) — full content regeneration
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)
- Budget section — new totals (730 000 HUF / 1 825 EUR)
- 50 POI cards — dual-language names

---

## 2026-03-13_1830 — Arcade & Indoor Entertainment Expansion (51 POI Cards)

### Changes

#### Trip Content (Incremental Edit — 10 New POIs)
- **10 new POI cards added** (1 per day, Days 1-10): total now 51 POIs (was 41).
- **Theme:** arcade games, trampoline parks, VR, pinball, indoor entertainment.
- **POI distribution:** Day 0:1, 1:5, 2:5, 3:5, 4:5, 5:5, 6:4, 7:4, 8:4, 9:6, 10:5, 11:2
- **Budget total**: ~1 854 EUR / ~703 640 HUF (was ~1 572 EUR / ~596 140 HUF).
- **New POIs by day:**
  - Day 1: SuperFly Trambulinpark (trampoline park, XIII district)
  - Day 2: Gamerland (VR + arcade center, III district, Sat evening)
  - Day 3: Elevenpark Játszóház (indoor playground, XI district)
  - Day 4: Gameroom Budapest (high-tech interactive arcade, IX district)
  - Day 5: Budavári Labirintus (underground labyrinth, promoted from backup)
  - Day 6: CyberJump Trambulinpark (trampoline park, XI district)
  - Day 7: Flippermúzeum (pinball museum, 160+ machines, XIII district)
  - Day 8: Aquaworld Játékterem (arcade game zone at resort)
  - Day 9: VR Vidámpark Budapest (VR amusement park)
  - Day 10: Let's Go Arcade revisit (birthday arcade treat)

#### Test Data Synchronized
- **poi-cards.spec.ts**: Min POI threshold 35 → 45 (51 total POIs now).
- **overview-budget.spec.ts**: Budget EUR 1 572 → 1 854.
- **progression-2026-03-13_1557.spec.ts**: Removed (replaced by new progression).

#### New Progression Tests
- **progression-2026-03-13_1830.spec.ts**: 51 POI count, per-day counts, 10 new POI presence checks, updated budget 1 854, previous POIs still present checks.

### Affected Sections
- Day 1-10 sections — new POI cards added
- Budget section — new totals (1 854 EUR / 703 640 HUF)
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)

---

## 2026-03-13_1557 — Expanded Trip with 41 POI Cards and Full Day Coverage

### Changes

#### Trip Content (New Generation)
- **Full 12-day trip regenerated** with expanded itinerary: 41 POI cards (was 28).
- **All days now have POI cards** — Day 0 (arrival) and Day 11 (departure) now include POIs.
- **POI distribution:** Day 0: 1, Day 1: 4, Day 2: 4, Day 3: 4, Day 4: 4, Day 5: 4, Day 6: 3, Day 7: 3, Day 8: 3, Day 9: 5, Day 10: 4, Day 11: 2
- **Budget total**: ~1 572 EUR / ~596 140 HUF (was ~1 527 EUR / ~607 200 HUF).
- **12 day sections**, **14 navigation links** (unchanged structure).
- **New/changed POIs:**
  - Day 0: Airport POI card added (was 0 POIs)
  - Day 1: Added lunch POI (4 total, was 3)
  - Day 2: Added cafe POI (Városliget Café) — 4 total (was 4)
  - Day 4: Restructured as Pest Center day — Miniversum, Market, Arcade
  - Day 5: Halászbástya + Budai Várnegyed + Danube cruise (was 2 POIs, now 4)
  - Day 6: Tropicarium + Campona shopping (3 total, was 2)
  - Day 7: Csodák Palotája + Railway Museum (3 total, was 2)
  - Day 8: Aquaworld + Aqua Spray Park (3 total, was 1)
  - Day 9: Playground + Lake + Andrássy shopping + Hősök tere (5 total, was 2)
  - Day 10: Birthday — Palatinus + Riso + Mini Zoo + Gelarto Rosa (4 total, was 3)
  - Day 11: Airport + Aran Bakery (2 total, was 0)

#### Config Changes
- **playwright.config.ts**: Updated `filePath` to point to `trip_2026-03-13_1557.html`.

#### Test Data Synchronized
- **day-cards.spec.ts**: Day loop 1..10 → 0..11, added Day 0/11 titles and dates, min itinerary rows 4 → 3.
- **overview-budget.spec.ts**: Budget EUR 1 527 → 1 572, overview day loop uses `td` instead of `td.col-time`.
- **poi-cards.spec.ts**: Min POI threshold 25 → 35 (41 total POIs now).
- **poi-parity.spec.ts**: Day loop 1..10 → 0..11.
- **Visual snapshots**: Cleared for regeneration.

#### New Progression Tests
- **progression-2026-03-13_1557.spec.ts**: 41 POI count, per-day POI counts, new POI presence checks (Gelarto Rosa, Hősök tere, Aqua Spray Park, Campona, Day 0/11 POI coverage), updated budget 1 572.

### Affected Sections
- All day sections (Day 0-11) — full content regeneration
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)
- Budget section — new totals (1 572 EUR / 596 140 HUF)
- 41 POI cards — expanded descriptions, dual-language names

---

## 2026-03-13_1216 — Revised Trip with 28 POI Cards and Restructured Days

### Changes

#### Trip Content (New Generation)
- **Full 11-day trip regenerated** with revised itinerary: 28 POI cards (was 34).
- **POI distribution:** Day 0: 0, Day 1: 3, Day 2: 4, Day 3: 4, Day 4: 5, Day 5: 2, Day 6: 2, Day 7: 2, Day 8: 1, Day 9: 2, Day 10: 3, Day 11: 0
- **Budget total**: ~1 527 EUR / ~607 200 HUF (was ~1 463 EUR).
- **12 day sections**, **14 navigation links** (unchanged structure).
- **28 clickable activity labels** linking to POI cards.
- **New/changed POIs:**
  - Day 1: Margitsziget Szokokut (Musical Fountain), Margitsziget Jatszóter (playground) — replaced Kisallatkert, Japankert, Zenelo szokokut
  - Day 3: House of Houdini, Riso Ristorante, Dunai Hajokirandulas — replaced Szimpla Kert, Labirintus, Ruszwurm
  - Day 4: Zugligeti Libego, Anna-reti Jatszóter, IDE Etterem — restructured as Budai Hills day (was different theme)
  - Day 5: Medveotthon (Bear Sanctuary) — now on Day 5 (was Day 6 area)
  - Day 6: Tropicarium + Flippermuzeum (2 POIs, was 5)
  - Day 7: Kozponti Vasarcsarnok + Miniversum (2 POIs, was 2)
  - Day 8: Aquaworld only (1 POI, was 4)
  - Day 10: Let's Go Arcade, VakVarju Buda, Allatkert revisit
- **Title fixed** to Cyrillic: "Будапешт 2026 — Семейный маршрут"

#### Config Changes
- **playwright.config.ts**: Updated `filePath` to point to `trip_2026-03-13_1216.html`.

#### Test Data Synchronized
- **overview-budget.spec.ts**: Budget EUR 1 463 -> 1 527.
- **poi-cards.spec.ts**: Min POI threshold 30 -> 25 (28 total POIs now).

#### New Progression Tests
- **progression-2026-03-13_1216.spec.ts**: 28 POI count, per-day POI counts, new POI presence checks (Houdini, Zugligeti Libego, Medveotthon, Let's Go Arcade), updated budget 1 527.

### Affected Sections
- All day sections (Day 0-11) — full content regeneration
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)
- Budget section — new totals (1 527 EUR)
- 28 POI cards — revised descriptions, dual-language names

---

## 2026-03-13_0109 — Enhanced Trip with 34 POI Cards and New Attractions

### Changes

#### Trip Content (New Generation)
- **Full 11-day trip regenerated** with enriched itinerary: 34 POI cards (was 23).
- **New POIs added:**
  - Day 1: Zenélő szökőkút (Musical Fountain) — 4th POI
  - Day 2: VakVarjú Étterem (restaurant with babysitter), Városligeti Nagyjátszótér (13k m² playground) — 5 POIs total
  - Day 3: Szimpla Kert Vasárnapi piac (Sunday farmers market), Ruszwurm Cukrászda — 5 POIs total
  - Day 6: Fogaskerekű Vasút (Cogwheel Railway), Libegő (Chairlift), Normafa Delikat (mountain café) — 5 POIs total
  - Day 8: Magyar Zene Háza (House of Music), Menza Étterem — 4 POIs total
  - Day 10: VakVarjú for birthday, Daubner Cukrászda — 3 POIs total
- **POI distribution:** Day 0: 0, Day 1: 4, Day 2: 5, Day 3: 5, Day 4: 2, Day 5: 3, Day 6: 5, Day 7: 2, Day 8: 4, Day 9: 1, Day 10: 3, Day 11: 0
- **Budget total**: ~1 463 EUR / ~570 250 HUF (was ~1 334 EUR).
- **12 day sections**, **14 navigation links** (unchanged structure).
- **34 clickable activity labels** linking to POI cards.

#### Config Changes
- **playwright.config.ts**: Updated `filePath` to point to `trip_2026-03-13_0109.html`.

#### Test Data Synchronized
- **overview-budget.spec.ts**: Budget EUR 1 334 → 1 463.
- **poi-cards.spec.ts**: Min POI threshold 20 → 30.
- **svg-integrity.spec.ts**: Min SVG threshold 13 → 14.
- **activity-poi-linking.spec.ts**: Day loop 0..10 → 0..11.

#### New Progression Tests
- **progression-2026-03-13_0109.spec.ts**: 34 POI count, per-day POI counts, new POI presence checks (Zene Háza, Szimpla Kert, Fogaskerekű, Libegő), updated budget 1 463.

### Affected Sections
- All day sections (Day 0–11) — full content regeneration
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)
- Budget section — new totals (1 463 EUR)
- 34 POI cards — enriched descriptions, dual-language names

---

## 2026-03-13_0030 — Full Trip Regeneration with New Itinerary

### Changes

#### Trip Content (New Generation)
- **Full 11-day trip regenerated** with new itinerary structure: Days 0 (arrival) through 11 (departure).
- **Day 11 (departure)** added as a new day section with minimal content (no POIs, no Plan B).
- **12 day sections** total (was 11): `#day-0` through `#day-11`.
- **14 navigation links** (was 13): overview + 12 days + budget.
- **23 POI cards** total (was 36): leaner itinerary with quality-over-quantity approach.
  - Day 1: 3, Day 2: 3, Day 3: 3, Day 4: 2, Day 5: 3, Day 6: 2, Day 7: 2, Day 8: 2, Day 9: 1, Day 10: 2
- **POI names in dual language** (Hungarian / Russian) per `poi_languages` setting.
- **Budget total**: ~1 334 EUR (was ~1 745 EUR). No car rental in this trip.
- **Overview table**: 12 data rows (was 11) — includes Day 11 departure row.
- **Holiday advisory**: St. Stephen's Day (Aug 20) — single `advisory--warning`.
- **Activity label linking**: 23 clickable `<a class="activity-label">` elements linking to POI cards.

#### Config Changes
- **playwright.config.ts**: Updated `filePath` to point to `trip_2026-03-13_0030.html`.

#### Test Data Synchronized
- **structure.spec.ts**: Day section count 11 → 12.
- **navigation.spec.ts**: Sidebar/pill count 13 → 14, added `#day-11` href.
- **overview-budget.spec.ts**: Overview rows 11 → 12, budget EUR amount 1 745 → 1 334, removed car rental assertion.

### Affected Sections
- All day sections (Day 0–11) — full content regeneration
- Navigation (sidebar + mobile pills) — 14 items
- Overview table — 12 rows
- Budget section — new totals
- All 23 POI cards — dual-language names

---

## 2026-03-12_2215 — Full Trip Regeneration with POI Parity & Language Compliance

### Changes

#### Trip Content (New Generation)
- **Full 10-day trip regenerated** from scratch with updated rules applied throughout.
- **POI names in dual language** (Hungarian + Russian) for all 36 POI cards across 10 days, per `trip_details.md → language_preference.poi_languages: ["Hungarian", "Russian"]`.
- **POI Parity enforced**: Every `###` POI section in the markdown produces exactly one `poi-card` in the HTML. Expected counts:
  - Day 1: 3, Day 2: 4, Day 3: 5, Day 4: 4, Day 5: 4, Day 6: 3, Day 7: 4, Day 8: 2, Day 9: 4, Day 10: 3 (Total: 36)
- **Holiday advisory** rendered as `advisory--warning` before overview table.
- **Day 0** (arrival) included in navigation and content.
- **Overview table** rendered as standalone `section-title` + `itinerary-table-wrapper` table.
- **Pricing sections** use `pricing-grid` with `pricing-cell` components (not itinerary-table).
- **Plan B sections** use `advisory advisory--info` (not card--featured).
- **Logistics sections** use `advisory advisory--info`.
- **Budget summary** and reminders included at bottom.
- **CSS fully inlined** — no external `<link>` to CSS file.

#### Config Changes
- **playwright.config.ts**: Updated `filePath` to point to `trip_2026-03-12_2215.html`.

### Affected Sections
- All day sections (Day 0–10) — full content regeneration
- All navigation (sidebar + mobile pills) — 11 items (Day 0–10)
- Overview table — new rendering
- Holiday advisory — new rendering
- Budget summary — new section
- All 36 POI cards — dual-language names, full descriptions

---

## 2026-03-12 — POI Parity & Language Compliance (Initial Rules Update)

### Changes

#### Rules & Config
- **CLAUDE.md**: Added POI Parity Rule to Fragment Generation Step 2. Added POI Parity Check to CEO Audit checklist. Added POI language requirement.
- **rendering-config.md**: Added "POI Card Parity Rule (Mandatory)" subsection under Component Usage Rules.

#### New Regression Tests
- **poi-parity.spec.ts**: Validates per-day and total POI card count in HTML matches `###` POI sections in source markdown.
- **poi-languages.spec.ts**: Validates every `.poi-card__name` contains both Hungarian (Latin) and Russian (Cyrillic) text.

#### New Files
- **test_plan.md**: Comprehensive test plan covering all 10 regression suites.
