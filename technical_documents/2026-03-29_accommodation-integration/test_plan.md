# Test Plan

**Change:** Accommodation Integration — Hotel Discovery & Booking Referral Cards in Trip Output
**Date:** 2026-03-29
**Author:** Automation Engineer
**BRD Reference:** business_requirements.md
**DD Reference:** detailed_design.md
**Status:** Draft

---

## 1. Test Scope

**In scope:**
- Accommodation section presence on anchor day(s) determined from `manifest.json`
- Accommodation card count per stay block (2-3 expected)
- Accommodation card internal structure: name, rating, links (Maps, website, photos, phone), price level, description, booking CTA, pro-tip
- Booking.com deep link URL structure validation (domain, parameters: `ss`, `checkin`, `checkout`, `group_adults`, `group_children`, `age`)
- Budget integration: accommodation line item in anchor day pricing grid
- Budget integration: accommodation category in aggregate budget section
- Card ordering: lowest to highest price level
- Visual distinction: `.accommodation-card` class used (not `.poi-card`)
- CTA button rendering: `.booking-cta` element present and styled as a link/button
- Price level indicator rendering: `.accommodation-card__price-level` with `.price-pip` children
- Responsive grid wrapper: `.accommodation-grid` present
- Language independence: all assertions use CSS selectors, URL pattern matching, and structural checks only
- Manifest schema: `accommodation.stays[]` array present with required fields
- POI parity exclusion: accommodation cards are NOT counted in `.poi-card` totals
- Non-anchor days: zero accommodation sections/cards

**Out of scope:**
- Visual regression screenshots for accommodation cards (deferred to post-implementation visual baseline)
- Booking.com link resolution / HTTP status (no network calls in progression tests)
- Google Places API behavior / mock testing (content pipeline concern, not HTML output)
- Preference matching logic validation (pipeline concern — tested indirectly via card presence)
- Dark mode color token verification (covered by existing contrast tests if extended)
- Mobile-specific viewport tests (single-project rule: desktop only; responsive CSS is structural)

**Test type:** Progression (appended to `progression.spec.ts`)

## 2. Test Environment

- Browser: Chromium (desktop viewport)
- Framework: Playwright + TypeScript
- Fixture: Shared-page (read-only) — imported from `tests/fixtures/shared-page.ts`
- Target file: `trip_full_{LANG}.html` (resolved via `trip-config.ts → labels.fileSuffix`)
- Manifest: `manifest.json` (resolved via `trip-folder.ts → getManifestPath()`)

## 3. Pre-Implementation Infrastructure

### 3.1 New TripPage.ts Locators (POM Updates)

The following properties and methods must be added to `TripPage.ts` before test implementation:

**New readonly properties (constructor-initialized):**

| Property | Selector | Purpose |
|---|---|---|
| `accommodationSections` | `.accommodation-section` | All accommodation section wrappers |
| `accommodationCards` | `.accommodation-card` | All accommodation cards globally |
| `accommodationCardRatings` | `.accommodation-card__rating` | All rating elements globally |
| `bookingCtaButtons` | `.booking-cta` | All Booking.com CTA buttons globally |

**New helper methods:**

| Method | Returns | Selector |
|---|---|---|
| `getDayAccommodationSection(dayNumber)` | `Locator` | `#day-${dayNumber} .accommodation-section` |
| `getDayAccommodationCards(dayNumber)` | `Locator` | `#day-${dayNumber} .accommodation-card` |
| `getAccommodationCardName(card)` | `Locator` | `card.locator('.accommodation-card__name')` |
| `getAccommodationCardLinks(card)` | `Locator` | `card.locator('.accommodation-card__link')` |
| `getAccommodationCardRating(card)` | `Locator` | `card.locator('.accommodation-card__rating')` |
| `getAccommodationCardPriceLevel(card)` | `Locator` | `card.locator('.accommodation-card__price-level')` |
| `getAccommodationCardBookingCta(card)` | `Locator` | `card.locator('.booking-cta')` |
| `getAccommodationCardProTip(card)` | `Locator` | `card.locator('.pro-tip')` |

### 3.2 New Utility: Manifest Accommodation Reader

A new helper function is needed in `tests/utils/manifest-reader.ts` (or added to an existing utils file) to extract accommodation stay data from `manifest.json`:

```typescript
interface ManifestStay {
  id: string;
  checkin: string;
  checkout: string;
  nights?: number;
  area: string;
  anchor_day: string;       // e.g., "day_00"
  anchor_day_number: number; // parsed integer, e.g., 0
  options_count: number;
  discovery_source: string;
}

function getAccommodationStays(): ManifestStay[]
```

This function reads `manifest.json → accommodation.stays[]`, parses `anchor_day` to extract the integer day number, and returns the array. If the `accommodation` key is missing or `stays` is empty, it returns an empty array (allowing graceful skip of accommodation tests when running against older trip outputs).

### 3.3 Markdown POI Exclusion Update

The `getExpectedPoiCountsFromMarkdown()` function in `markdown-pois.ts` must be updated to exclude `### 🏨` headings from the POI count. The current logic excludes headings matching `excludedSections` strings. A new exclusion must be added:

- Exclude any `### ` heading where the text (after `### `) starts with the hotel emoji `🏨`.
- This is language-independent — the emoji prefix is a structural marker, not a language string.

The `excludedSections` array in `trip-config.ts` does not need updating since the emoji-based exclusion is handled at the structural level in `markdown-pois.ts`.

## 4. Test Cases

### TC-200: Accommodation Section Presence on Anchor Days

**Traces to:** REQ-004 AC-1, REQ-010 AC-1
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Critical
**Preconditions:** Manifest contains `accommodation.stays[]` with at least one entry. Trip HTML is loaded via shared-page fixture.

**Steps:**
1. Read `manifest.json → accommodation.stays[]` using the manifest reader utility
2. For each stay block, extract `anchor_day_number`
3. For each anchor day, use `tripPage.getDayAccommodationSection(anchorDayNumber)` to locate the accommodation section
4. Assert the section is attached to the DOM

**Expected result:**
- Each anchor day listed in the manifest has exactly one `.accommodation-section` element
- `expect.soft(section, 'Day ${n}: accommodation section should be present on anchor day').toBeAttached()`

**Implementation notes:**
- Use shared-page fixture (`{ tripPage }`)
- Use `expect.soft()` for each anchor day iteration
- If `getAccommodationStays()` returns empty, skip test with informative message (trip may predate this feature)

---

### TC-201: No Accommodation Section on Non-Anchor Days

**Traces to:** REQ-004 AC-1 (inverse), REQ-005 AC-3
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High
**Preconditions:** Manifest contains `accommodation.stays[]`. Trip HTML loaded.

**Steps:**
1. Read anchor day numbers from manifest
2. Build set of all day numbers (0 to `tripConfig.dayCount - 1`)
3. Subtract anchor day numbers to get non-anchor days
4. For each non-anchor day, assert `.accommodation-section` count is 0

**Expected result:**
- `expect.soft(count, 'Day ${n}: non-anchor day should have no accommodation section').toBe(0)`

**Implementation notes:**
- Batched `expect.soft()` loop over non-anchor days
- Can be combined with TC-200 in a single `test()` block with two loops (anchor + non-anchor) to minimize test count per 6.3 optimization rule

---

### TC-202: Accommodation Card Count per Stay Block

**Traces to:** REQ-004 AC-9, REQ-010 AC-6
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Critical
**Preconditions:** Manifest stay blocks loaded. Anchor days have accommodation sections.

**Steps:**
1. For each anchor day, count `.accommodation-card` elements using `tripPage.getDayAccommodationCards(anchorDayNumber).count()`
2. Compare count against manifest `options_count` if available, or validate range 2-3

**Expected result:**
- Card count is between 2 and 3 (inclusive) per anchor day, or matches `manifest.options_count` if > 0
- `expect.soft(count, 'Day ${n}: accommodation card count should be 2-3').toBeGreaterThanOrEqual(2)`
- `expect.soft(count, 'Day ${n}: accommodation card count should be 2-3').toBeLessThanOrEqual(3)`

**Implementation notes:**
- If `options_count` in manifest is 0 or `discovery_source` is `"skipped"`, skip the anchor day (graceful degradation)
- Use `expect.soft()` for each assertion

---

### TC-203: Accommodation Card Structure Completeness

**Traces to:** REQ-009 AC-1, REQ-010 AC-2, REQ-004 AC-4
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Critical
**Preconditions:** Anchor days have accommodation cards.

**Steps:**
1. For each anchor day, iterate over accommodation cards
2. For each card, verify presence of:
   a. `.accommodation-card__name` (property name heading) — count >= 1, text non-empty
   b. `.accommodation-card__rating` (rating element) — count >= 1
   c. `.accommodation-card__link` (at least one link: Maps) — count >= 1
   d. `.accommodation-card__link[href*="maps.google"]` or `.accommodation-card__link[href*="google.com/maps"]` (Google Maps link) — count >= 1
   e. `.booking-cta` (Booking.com CTA) — count >= 1
   f. `.accommodation-card__price-level` (price level indicator) — count >= 0 (may be absent if price_level unavailable)

**Expected result:**
- Each card has name, rating, at least one link, a Maps link, and a booking CTA
- `expect.soft()` per assertion per card with message: `'Day ${d}, Card ${c}: should have {element}'`

**Implementation notes:**
- Price level is soft-optional (AC-8 graceful degradation when `price_level` absent from Google Places)
- Card name text content is not language-checked — only structural presence

---

### TC-204: Booking.com Deep Link URL Structure

**Traces to:** REQ-003 AC-1/AC-2/AC-3/AC-4/AC-5/AC-6, REQ-010 AC-3
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Critical
**Preconditions:** Accommodation cards exist on anchor days.

**Steps:**
1. For each anchor day, iterate over accommodation cards
2. For each card, get the `.booking-cta` element's `href` attribute
3. Parse the URL and validate:
   a. Domain is `www.booking.com`
   b. Path starts with `/searchresults.html`
   c. `ss` parameter is present and non-empty (hotel name + destination)
   d. `checkin` parameter is present and matches `YYYY-MM-DD` format
   e. `checkout` parameter is present and matches `YYYY-MM-DD` format
   f. `group_adults` parameter is present and is a positive integer
   g. `group_children` parameter is present and is a non-negative integer
   h. If `group_children` > 0, at least one `age` parameter exists
   i. `checkin` date matches the manifest stay block's `checkin` date
   j. `checkout` date matches the manifest stay block's `checkout` date

**Expected result:**
- All URL parameters present and structurally valid
- Dates match manifest stay block dates
- `expect.soft()` per parameter per card

**Implementation notes:**
- Use JavaScript `URL` class for parsing — no regex on full URL
- Adult/child counts can be cross-validated against `tripConfig.travelers` if traveler parsing distinguishes adults from children. If not, validate they are positive integers only.
- Do NOT validate `ss` content against any natural language string — only check it is non-empty and URL-encoded
- The `age` parameter count should equal the `group_children` integer value

---

### TC-205: Accommodation Cards Visual Distinction from POI Cards

**Traces to:** REQ-009 AC-1/AC-2, REQ-010 AC-7
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High
**Preconditions:** Accommodation cards exist.

**Steps:**
1. Count all `.accommodation-card` elements globally
2. Verify none of them also have the `.poi-card` class
3. Verify the accommodation section wrapper uses `.accommodation-section` (not a POI wrapper class)

**Expected result:**
- No `.accommodation-card` element has the `poi-card` class
- `expect.soft()` for each card: `card.evaluate(el => !el.classList.contains('poi-card'))`

**Implementation notes:**
- Simple structural check — confirms rendering pipeline uses correct class
- Also implicitly validates REQ-009 AC-7 (language-agnostic rendering)

---

### TC-206: Booking CTA Button Rendering

**Traces to:** REQ-009 AC-3
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High
**Preconditions:** Accommodation cards exist.

**Steps:**
1. For each accommodation card on anchor days, locate `.booking-cta`
2. Verify it is an `<a>` element (semantic link)
3. Verify it has `target="_blank"` attribute (opens in new tab)
4. Verify it has `rel` attribute containing `noopener` (security)
5. Verify `href` starts with `https://www.booking.com/`

**Expected result:**
- Each booking CTA is a proper external link with security attributes
- `expect.soft()` per attribute per card

**Implementation notes:**
- Use `card.locator('.booking-cta').evaluate(el => el.tagName)` for tag check
- Attribute checks via `getAttribute()`

---

### TC-207: Price Level Indicator Rendering

**Traces to:** REQ-009 AC-4
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Medium
**Preconditions:** Accommodation cards exist and have price level data.

**Steps:**
1. For each accommodation card that has a `.accommodation-card__price-level` element:
2. Count `.price-pip--filled` children
3. Count `.price-pip--empty` children
4. Verify total pip count equals 4 (scale is always out of 4)
5. Verify filled pip count is between 1 and 4

**Expected result:**
- Each price level indicator has exactly 4 total pips (filled + empty)
- At least 1 pip is filled
- `expect.soft()` per card

**Implementation notes:**
- Cards without `.accommodation-card__price-level` are skipped (graceful degradation when `price_level` absent)
- Price level 0 = no price level rendered (DD spec), so if element exists, filled >= 1

---

### TC-208: Card Price Level Ordering

**Traces to:** REQ-004 AC-10
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High
**Preconditions:** Anchor day has 2+ accommodation cards with price level indicators.

**Steps:**
1. For each anchor day, iterate over accommodation cards in DOM order
2. For each card with a `.accommodation-card__price-level`, count `.price-pip--filled` elements to determine the price level
3. Verify the sequence of price levels is non-decreasing (ascending order)

**Expected result:**
- Price levels across cards within a stay block are sorted ascending
- `expect.soft(levels, 'Day ${n}: cards should be ordered by price level ascending')` — verify `levels[i] <= levels[i+1]`

**Implementation notes:**
- If a card lacks a price level element, skip it in the ordering check (don't break the sequence)
- Use filled pip count as the numeric proxy for price level

---

### TC-209: Anchor Day Budget — Accommodation Line Item

**Traces to:** REQ-005 AC-1/AC-2, REQ-010 AC-4
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High
**Preconditions:** Accommodation section exists on anchor day.

**Steps:**
1. For each anchor day, locate the pricing grid: `#day-${n} .pricing-grid`
2. Locate all `.pricing-cell` elements within the pricing grid
3. Check that at least one pricing cell contains the hotel emoji `🏨` (the structural marker for accommodation budget line items)

**Expected result:**
- At least one `.pricing-cell` in the anchor day's pricing grid contains the `🏨` character
- `expect.soft(found, 'Day ${n}: pricing grid should have accommodation line item (🏨)').toBe(true)`

**Implementation notes:**
- The `🏨` emoji is used as a structural marker (same pattern as `🛒` for grocery), not a language string
- Do NOT assert the label text in any language — only the emoji marker
- If the pricing grid uses a different structure (e.g., `.pricing-cell__badge--estimate`), check for the estimate badge class as well

---

### TC-210: Aggregate Budget — Accommodation Category

**Traces to:** REQ-005 AC-4, REQ-010 AC-5
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High
**Preconditions:** Trip has accommodation stay blocks.

**Steps:**
1. Locate the `#budget` section
2. Search for the `🏨` emoji marker within the budget section's text content

**Expected result:**
- The aggregate budget section contains a reference to accommodation (identified by `🏨` emoji)
- `expect.soft(budgetText.includes('🏨'), 'Aggregate budget should have accommodation category (🏨 marker)').toBe(true)`

**Implementation notes:**
- Language-independent: uses emoji marker, not language text
- If the budget table uses structured CSS classes for categories, prefer a CSS selector check over text search

---

### TC-211: Manifest Accommodation Schema Validation

**Traces to:** REQ-008 AC-1/AC-2/AC-3/AC-4/AC-5, REQ-001 AC-4
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Critical
**Preconditions:** Trip was generated with accommodation feature enabled.

**Steps:**
1. Read `manifest.json` and parse as JSON
2. Assert `accommodation` key exists at top level
3. Assert `accommodation.stays` is a non-empty array
4. For each stay entry, validate:
   a. `id` is a non-empty string matching `stay_\d+` pattern
   b. `checkin` is a valid `YYYY-MM-DD` date string
   c. `checkout` is a valid `YYYY-MM-DD` date string
   d. `checkout` > `checkin` (chronological order)
   e. `area` is a non-empty string
   f. `anchor_day` matches `day_\d+` pattern
   g. `options_count` is an integer >= 0
   h. `discovery_source` is one of `"google_places"`, `"manual"`, `"skipped"`, `"pending"`
5. If multiple stays exist, verify date ranges do not overlap (AC-5)
6. Verify `nights` field (if present) equals `checkout - checkin` in days

**Expected result:**
- All schema fields valid per DD specification
- `expect.soft()` per field per stay entry

**Implementation notes:**
- Uses `fs.readFileSync` + `JSON.parse` (no page interaction — manifest is a file, not DOM)
- This test runs without the shared-page fixture (file-system only), following the existing pattern in `progression.spec.ts` for manifest tests

---

### TC-212: POI Parity Exclusion — Accommodation Cards Not in POI Count

**Traces to:** REQ-009 AC-2 (distinction), rendering-config.md POI Card Parity Rule
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** High
**Preconditions:** Anchor day has both POI cards and accommodation cards.

**Steps:**
1. For each anchor day, count `.poi-card` elements
2. Count `.accommodation-card` elements
3. Verify that no `.accommodation-card` element is also a `.poi-card`
4. Verify the total `.poi-card` count on the anchor day matches the markdown POI count (which now excludes `### 🏨` headings via the updated `markdown-pois.ts`)

**Expected result:**
- `.poi-card` count matches markdown POI count (excluding accommodation headings)
- No element has both `.poi-card` and `.accommodation-card` classes
- `expect.soft()` for count match and class exclusion

**Implementation notes:**
- This test validates that the `markdown-pois.ts` update (excluding `### 🏨`) and the HTML rendering (using `.accommodation-card` not `.poi-card`) are consistent
- Depends on the `getExpectedPoiCountsFromMarkdown()` update in section 3.3

---

### TC-213: Accommodation Card Tag Element

**Traces to:** REQ-009 AC-1 (rendering-config.md card structure)
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Medium
**Preconditions:** Accommodation cards exist.

**Steps:**
1. For each accommodation card, locate `.accommodation-card__tag`
2. Verify the tag element is present
3. Verify the tag contains the `🏨` emoji

**Expected result:**
- Each accommodation card has a `.accommodation-card__tag` element containing `🏨`
- `expect.soft()` per card

**Implementation notes:**
- The tag element provides visual identification of the card type
- Checking for the emoji is structural (same emoji used in markdown heading), not language-dependent

---

### TC-214: Accommodation Section Has Grid Wrapper

**Traces to:** REQ-009 AC-6 (responsive layout)
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Medium
**Preconditions:** Accommodation section exists on anchor day.

**Steps:**
1. For each anchor day, locate `.accommodation-section`
2. Within it, verify `.accommodation-grid` wrapper exists
3. Verify all `.accommodation-card` elements within the section are children of `.accommodation-grid`

**Expected result:**
- `.accommodation-grid` exists inside `.accommodation-section`
- All cards are wrapped in the grid container
- `expect.soft()` per anchor day

**Implementation notes:**
- Validates the responsive grid infrastructure is in place
- Does not test actual responsive behavior (single-project desktop rule)

---

### TC-215: Accommodation Card Pro-Tip Presence

**Traces to:** REQ-004 AC-4 (card structure includes tip)
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Medium
**Preconditions:** Accommodation cards exist.

**Steps:**
1. For each accommodation card, locate `.pro-tip` child element
2. Verify it is present
3. Verify it has non-empty text content

**Expected result:**
- Each accommodation card has a `.pro-tip` element with text
- `expect.soft()` per card

**Implementation notes:**
- Reuses existing `.pro-tip` component class
- Text content is not language-checked — only presence and non-emptiness

---

### TC-216: Accommodation Section Intro Paragraph

**Traces to:** REQ-004 AC-3 (intro line with stay period)
**Type:** Progression
**Spec file:** `progression.spec.ts`
**Priority:** Medium
**Preconditions:** Accommodation section exists on anchor day.

**Steps:**
1. For each anchor day, locate `.accommodation-section__intro` within `.accommodation-section`
2. Verify it is present
3. Verify it has non-empty text content

**Expected result:**
- Each accommodation section has an intro paragraph with content
- `expect.soft()` per anchor day

**Implementation notes:**
- Content describes stay period — but we do NOT assert the text in any language
- Only structural presence and non-emptiness

---

## 5. Test Consolidation Plan

Per automation rule 6.3 (batch per-day assertions) and 6.4 (progression consolidation), the 17 test cases above are consolidated into the following `test()` blocks in `progression.spec.ts`:

### Test Block 1: `Progression — Accommodation Section & Card Structure`

**Contains:** TC-200, TC-201, TC-202, TC-203, TC-205, TC-213, TC-214, TC-215, TC-216
**Pattern:** Single `test()` iterating over all days. For anchor days: validate section, grid, intro, card count, card structure, tags, pro-tips, visual distinction. For non-anchor days: validate absence.
**Estimated test count:** 1 test per anchor day + 1 test for non-anchor validation = ~2 tests

### Test Block 2: `Progression — Accommodation Booking Links`

**Contains:** TC-204, TC-206
**Pattern:** Single `test()` iterating over anchor days and their cards, validating booking CTA structure and URL parameters.
**Estimated test count:** 1 test

### Test Block 3: `Progression — Accommodation Price Level & Ordering`

**Contains:** TC-207, TC-208
**Pattern:** Single `test()` per anchor day validating price pip structure and ascending order.
**Estimated test count:** 1 test

### Test Block 4: `Progression — Accommodation Budget Integration`

**Contains:** TC-209, TC-210
**Pattern:** Single `test()` checking anchor day pricing grid and aggregate budget for accommodation markers.
**Estimated test count:** 1 test

### Test Block 5: `Progression — Accommodation Manifest Schema`

**Contains:** TC-211
**Pattern:** Single file-system-only `test()` validating manifest accommodation schema.
**Estimated test count:** 1 test

### Test Block 6: `Progression — Accommodation POI Parity Exclusion`

**Contains:** TC-212
**Pattern:** Single `test()` per anchor day validating POI count excludes accommodation cards.
**Estimated test count:** 1 test

**Total consolidated test count: 7 new tests** (down from 17 logical test cases)

## 6. Coverage Matrix

| BRD Requirement | Acceptance Criterion | Test Case(s) | Assertion Type |
|---|---|---|---|
| REQ-001 AC-4 | manifest.json includes accommodation object | TC-211 | Schema validation (file-system) |
| REQ-003 AC-1 | Each card has Booking.com link | TC-204 | Structural (`.booking-cta` href) |
| REQ-003 AC-2 | URL format correct | TC-204 | URL parameter parsing |
| REQ-003 AC-3 | Hotel name URL-encoded | TC-204 | `ss` parameter non-empty |
| REQ-003 AC-4 | Dates in YYYY-MM-DD | TC-204 | Regex on `checkin`/`checkout` params |
| REQ-003 AC-5 | Adult/child counts | TC-204 | `group_adults`/`group_children` presence |
| REQ-003 AC-6 | Child ages at check-in | TC-204 | `age` parameter count = `group_children` |
| REQ-004 AC-1 | Cards in anchor day file | TC-200, TC-201 | Section presence/absence |
| REQ-004 AC-3 | Intro line with stay period | TC-216 | `.accommodation-section__intro` presence |
| REQ-004 AC-4 | Card structure complete | TC-203 | Sub-element presence per card |
| REQ-004 AC-9 | 2-3 cards per section | TC-202 | Count range validation |
| REQ-004 AC-10 | Ordered by price level | TC-208 | Price pip count sequence |
| REQ-005 AC-1 | Anchor day budget has accommodation | TC-209 | `🏨` marker in pricing grid |
| REQ-005 AC-3 | Non-anchor days no duplication | TC-201 | Absence on non-anchor days |
| REQ-005 AC-4 | Aggregate budget has accommodation | TC-210 | `🏨` marker in `#budget` |
| REQ-008 AC-1 | `accommodation.stays[]` structure | TC-211 | JSON schema field validation |
| REQ-008 AC-2 | `anchor_day` references day file | TC-211 | `day_\d+` pattern match |
| REQ-008 AC-3 | `options_count` reflects actual | TC-211 | Integer >= 0 |
| REQ-008 AC-4 | `discovery_source` valid values | TC-211 | Enum membership |
| REQ-008 AC-5 | Multi-stay non-overlapping dates | TC-211 | Date range comparison |
| REQ-009 AC-1 | `.accommodation-card` class | TC-205 | Class presence |
| REQ-009 AC-2 | Visually distinct from `.poi-card` | TC-205, TC-212 | Class exclusion |
| REQ-009 AC-3 | Booking CTA as button | TC-206 | Tag, attributes, href |
| REQ-009 AC-4 | Price level visual scale | TC-207 | `.price-pip` pip count |
| REQ-009 AC-5 | Section divider with `## 🏨` | TC-200 | `.accommodation-section` presence |
| REQ-009 AC-6 | Responsive layout | TC-214 | `.accommodation-grid` presence |
| REQ-009 AC-7 | Language-agnostic rendering | TC-205, all TCs | CSS selectors only |
| REQ-010 AC-1 | Section presence test | TC-200 | `.accommodation-section` on anchor |
| REQ-010 AC-2 | Card structure validation | TC-203 | Sub-element checks |
| REQ-010 AC-3 | Booking URL parameters | TC-204 | URL parse + validate |
| REQ-010 AC-4 | Budget table accommodation line | TC-209 | Pricing grid check |
| REQ-010 AC-5 | Aggregate budget accommodation | TC-210 | Budget section check |
| REQ-010 AC-6 | Card count 2-3 | TC-202 | Count range |
| REQ-010 AC-7 | All assertions language-agnostic | All TCs | CSS selectors, structural only |
| REQ-011 (all) | Language-agnostic content | Indirectly via all TCs | No language text in assertions |

## 7. Test Data Dependencies

| Data Source | What's Used | Update Needed? |
|---|---|---|
| `manifest.json` | `accommodation.stays[]` — anchor day numbers, stay dates, options count, discovery source | Yes — manifest must include new `accommodation` key after implementation |
| `trip-config.ts` | `dayCount`, `labels.fileSuffix`, `travelers` | No — existing fields sufficient |
| `markdown-pois.ts` | `getExpectedPoiCountsFromMarkdown()` — POI counts per day | Yes — must exclude `### 🏨` headings |
| `TripPage.ts` | New accommodation locators | Yes — 4 new properties + 8 new methods |
| `trip_full_{LANG}.html` | Rendered accommodation cards, budget sections | Yes — generated after feature implementation |
| `trip-folder.ts` | `getManifestPath()`, `getLatestTripFolderPath()` | No — existing functions sufficient |

## 8. Risk & Mitigation

| Risk | Mitigation |
|---|---|
| Accommodation section not generated (Google Places MCP unavailable during trip generation) | TC-200 checks manifest `discovery_source`; if `"skipped"`, accommodation tests are skipped gracefully with `test.skip()` and informative message |
| Price level missing on some/all cards (Google Places data gap) | TC-207 only asserts on cards that HAVE `.accommodation-card__price-level`; TC-208 ordering check skips cards without price level |
| Running tests against trip generated before accommodation feature | `getAccommodationStays()` returns empty array; all accommodation tests skip with clear message |
| Manifest schema changes during implementation | TC-211 uses soft assertions per field — partial schema is reported, not hard-failed |
| Booking.com URL format changes | TC-204 validates structural parameters only (domain, path, query params) — not exact URL format. Resilient to minor Booking.com changes |
| `markdown-pois.ts` not updated to exclude `### 🏨` | TC-212 (POI parity) will fail, surfacing the missing update. Listed as pre-implementation dependency in section 3.3 |
| Budget rendering uses different structure than expected (e.g., no emoji marker in pricing-cell) | TC-209/TC-210 use `🏨` emoji as structural marker. If rendering changes to use a CSS class instead, update to check `.pricing-cell--accommodation` or equivalent |

## 9. Estimated Impact

- **New test count:** 7 consolidated `test()` blocks (covering 17 logical test cases)
- **Estimated runtime:** ~2-3 seconds total (all read-only DOM assertions on shared page, plus one file-system manifest read)
- **Files modified:**
  - `automation/code/tests/pages/TripPage.ts` — 4 new properties + 8 new methods
  - `automation/code/tests/regression/progression.spec.ts` — 7 new tests in a new `test.describe('Progression — Accommodation Integration')` block
  - `automation/code/tests/utils/markdown-pois.ts` — exclude `### 🏨` headings from POI count
- **Files added:**
  - None (utility function for manifest accommodation reads can be added inline in progression.spec.ts or in a new `manifest-reader.ts` — TBD during implementation)
- **Existing test impact:** The `markdown-pois.ts` exclusion update will change expected POI counts on anchor days (accommodation headings no longer counted). Existing POI parity test in progression.spec.ts will benefit from the fix (otherwise it would over-count POIs on anchor days after the feature ships).
