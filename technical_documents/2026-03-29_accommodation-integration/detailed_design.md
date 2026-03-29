# Detailed Design

**Change:** Accommodation Integration — Hotel Discovery & Booking Referral Cards in Trip Output
**Date:** 2026-03-29
**Author:** Development Team
**HLD Reference:** high_level_design.md
**Status:** Revised per SA feedback

---

## 1. File Changes

### 1.1 `trip_planning_rules.md` — New "Accommodation Selection" Section

**Action:** Modify

**Current state:** The file has sections: Pre-Flight Setup, Data Source Hierarchy, Strategic Planning Logic (5 subsections), Environmental & Event Intelligence, Research & Quality Control (Live Verification, CEO Audit). No accommodation-related content exists.

**Target state — Insert new section after "Strategic Planning Logic" (after §5 Culinary Selection) and before "Environmental & Event Intelligence":**

```markdown
---

## Accommodation Selection

### Stay Block Identification (Phase A)

After building the Phase A overview table, analyze the area column across all days to identify distinct stay blocks:

1. **Same-area rule:** Consecutive days in the same city or district = one stay block.
2. **Area change rule:** When the planned area changes to a different city or district requiring accommodation relocation, a new stay block begins.
3. **Coverage rule:** Every night of the trip must belong to exactly one stay block. No gaps, no overlaps.
4. **Check-in / check-out:** Check-in date = first night's date. Check-out date = morning after the last night (departure day date, or the first day of the next stay block).
5. **Single-base trips:** If all days are in the same city, produce exactly one stay block spanning arrival night to departure morning.
6. **Anchor day:** The first day of each stay block is the "anchor day." Accommodation cards are placed in this day's file only.

Record stay blocks in `manifest.json` under `accommodation.stays[]` (see content_format_rules.md for schema).

### Accommodation Discovery (Phase B — Anchor Day Only)

During Phase B, the subagent generating an anchor day's file performs accommodation research:

1. **Parse preferences:** Read the `## Hotel Assistance` section from the active trip details file. Extract: accommodation_type, location_priority, quality_level, must_have_amenities, pets, daily_budget, cancellation_preference. If section absent, use defaults: mid-range quality, city center location, no pet requirement, no amenity filtering.
2. **Google Places query:** Call `mcp__google-places__maps_search_places` with:
   - `query`: "{accommodation_type} {stay_area}" (e.g., "Apartment Budapest" or "Hotel Budapest city center")
   - `type`: `lodging`
   - Adjust query center based on `location_priority`: center = historic center, attractions = tourist district, transport = main station area, quiet = residential area, beach = waterfront.
3. **Filter results:**
   - Exclude `business_status` = "CLOSED_PERMANENTLY" or "CLOSED_TEMPORARILY"
   - Hard filter: if `daily_budget` is specified, exclude properties whose `price_level` maps to a range clearly outside the budget
   - Hard filter: if `pets` = "Yes", note pet policy requirement (Google Places may not confirm — annotate as "verify with property")
   - Soft rank: prefer properties matching `quality_level` → `price_level` mapping
4. **Select 2-3 options:** Choose properties at different price points (budget, mid-range, upscale) where possible. Minimum 2, maximum 3. If fewer than 2 results remain after filtering, broaden search to city-level and retry once.
5. **Enrich each option:** Call `mcp__google-places__maps_place_details` for each selected property to get: name, formatted_address, rating, user_ratings_total, price_level, website, international_phone_number, photos, url (Google Maps link).
6. **Construct Booking.com deep link** for each option (see content_format_rules.md for URL format).
7. **Write accommodation section** in the anchor day's markdown file (see content_format_rules.md for card template).
8. **Graceful degradation:** If Google Places MCP is unavailable or returns no lodging results, skip the accommodation section entirely. Log in manifest as `"discovery_source": "skipped"`. Continue with day generation — accommodation is non-blocking.

### Preference-to-Search Mapping

| Preference Field | Google Places Influence | Card Annotation |
|---|---|---|
| accommodation_type | Query keyword (e.g., "Apartment", "Boutique Hotel") | Mentioned in card description |
| location_priority | Search center point adjustment | Proximity noted in description |
| quality_level | `price_level` filter: Budget=0-1, Mid-range=2, Upscale=3, Luxury=4 | Price level shown on card |
| must_have_amenities | Not filterable via API; mentioned when verifiable | Listed in description; unverifiable ones noted as "check with property" |
| pets | Hard filter annotation | Pet policy note in pro-tip |
| daily_budget | Hard filter on `price_level` range | Budget alignment noted |
| cancellation_preference | Not filterable via API | Mentioned in pro-tip (e.g., "Look for free cancellation on Booking.com") |

### Price Level to Cost Range Mapping (Destination-Aware)

Cost estimation uses Google Places `price_level` (0-4) mapped to destination-appropriate nightly ranges. The mapping is determined by the destination's market level, not hardcoded globally.

**Budapest, Hungary (example):**

| price_level | Label | HUF/night | EUR/night |
|---|---|---|---|
| 0 | Free / Бесплатно | — | — |
| 1 | Budget / Бюджетный | 15,000–25,000 | 38–63 |
| 2 | Mid-range / Средний | 25,000–50,000 | 63–125 |
| 3 | Upscale / Высокий | 50,000–90,000 | 125–225 |
| 4 | Luxury / Люксовый | 90,000+ | 225+ |

When `price_level` is absent from Google Places data, omit the price level line from the card and note: "Price level unavailable — check Booking.com link for current rates" (in the reporting language).
```

**Target state — Extend Data Source Hierarchy, add after existing Layer 2 paragraph:**

```markdown
### Layer 2a: Google Places API (Accommodation Discovery)
- For stay-block anchor days, query Google Places with `type=lodging` to discover accommodation options.
- Uses the same MCP tool (`mcp__google-places__maps_search_places` → `mcp__google-places__maps_place_details`) as POI enrichment.
- Provides: property name, rating, review count, price level, address, Google Maps link, phone, website, photos.
- **Precedence rule:** Same as Layer 2 — Google Places structured fields take precedence over other sources.
- **Graceful degradation:** Same as Layer 2 — if MCP unavailable or place not found, skip accommodation section. Trip generation continues without accommodation cards.
```

**Target state — Extend CEO Audit checklist, add new item after the POI Parity Check item:**

```markdown
- [ ] If this is the first day of a stay block: does the accommodation section contain 2-3 options with complete cards (name, rating, maps link, booking link, price level)? Does at least one option's price level align with the traveler's stated budget preference (if available)?
```

**Rationale:** Centralizes all accommodation planning logic in the trip planning rules, following the pattern established for POI research and culinary selection. The CEO Audit extension ensures accommodation quality is validated before output.

---

### 1.2 `content_format_rules.md` — Accommodation Card Template

**Action:** Modify

**Target state — Insert new subsection in "Per-Day File Format" after the POI card sections and before the daily budget table subsection, and before "Day Generation Protocol":**

```markdown
### Accommodation Section (Anchor Day Only)

On the first day of each stay block (the "anchor day"), include an accommodation section after the POI cards and before the daily budget table. This section is NOT present on non-anchor days.

**Section placement order within anchor day files:**
1. Day header + schedule table
2. POI cards (### headings)
3. **Accommodation section (## 🏨)** ← NEW (anchor days only)
4. Daily budget table (### Стоимость дня)
5. Grocery store (### 🛒)
6. Along-the-way stops (### 🎯)
7. Plan B (### 🅱️)
8. *(end of file)*

> **Rationale:** The accommodation section appears before the daily budget table so that the reader encounters accommodation options before seeing their cost in the budget. The `## 🏨` heading (h2 level) acts as a major section divider between POI content and the operational/logistics sections that follow.

**Section format:**

```
## 🏨 {localized_accommodation_label}

{Intro line: stay period (check-in → check-out), number of nights. Note that options are sorted by price level.}

### 🏨 {Property Name in poi_languages}

📍 [Google Maps]({google_maps_url})
🌐 [{localized_website_label}]({website_url})
📸 [{localized_photos_label}]({photos_url})
📞 {localized_phone_label}: {phone}
⭐ {rating}/5 ({review_count} {localized_reviews_label})
💰 {localized_price_level_label}: {descriptive_price_level}

{2-3 sentence description: property vibe, family-relevant features, proximity to day activities}

🔗 [{localized_check_prices_label}]({booking_com_deep_link})

> **{localized_tip_label}:** {One actionable tip}

### 🏨 {Property Name 2 in poi_languages}
{... same card structure ...}

### 🏨 {Property Name 3 in poi_languages}
{... same card structure ...}
```

**Rules:**
- The section heading uses `##` (h2), not `###` (h3), to distinguish from POI cards.
- Individual accommodation option cards use `### 🏨` (h3) with the hotel emoji prefix.
- `### 🏨` headings are NOT POI headings. They are excluded from POI Parity Checks and do not generate `.poi-card` elements in HTML.
- Property names follow `poi_languages` convention (e.g., "Hotel Parlament Budapest / Отель Парламент Будапешт").
- 2-3 cards per section, ordered from lowest to highest price level.
- When a property has no website or phone from Google Places, those lines are omitted (not rendered as empty).
- All labels (website, photos, phone, rating, price level, check prices, tip) use the reporting language.
- The `💰` price level maps `price_level` (0-4) to localized descriptors per `trip_planning_rules.md`.
- The Booking.com link label must be distinct from the website label — clearly communicates "check prices / book" intent (e.g., "Проверить цены" in Russian, not "Сайт").

**Booking.com Deep Link Format:**
```
https://www.booking.com/searchresults.html?ss={hotel_name}+{destination}&checkin={checkin_date}&checkout={checkout_date}&group_adults={adult_count}&group_children={child_count}&age={child1_age}&age={child2_age}&age={child3_age}
```

- `{hotel_name}`: URL-encoded property name (spaces → `+`, special characters percent-encoded)
- `{destination}`: URL-encoded destination city + country
- `{checkin_date}` / `{checkout_date}`: Stay block dates in `YYYY-MM-DD` format
- `{adult_count}`: Number of parents/adults from trip details travelers section
- `{child_count}`: Number of children from trip details travelers section
- `{age}`: Each child's age calculated at check-in date (same age calculation as pipeline Pre-Flight Setup)
- Multiple `age=` parameters, one per child
```

**Target state — Extend manifest.json Schema section, add after existing field rules:**

```markdown
**Accommodation metadata (written during Phase A, updated after Phase B):**

```json
{
  "accommodation": {
    "stays": [
      {
        "id": "stay_01",
        "checkin": "2026-08-20",
        "checkout": "2026-08-31",
        "nights": 11,
        "area": "Budapest, Hungary",
        "anchor_day": "day_00",
        "options_count": 3,
        "discovery_source": "google_places"
      }
    ]
  }
}
```

- `accommodation` is a top-level key (sibling to `languages`).
- `stays` is an ordered array of stay block objects.
- `id`: Sequential identifier (`stay_01`, `stay_02`, ...).
- `checkin` / `checkout`: ISO date strings (YYYY-MM-DD). Check-in = first night, check-out = morning after last night.
- `nights`: Integer convenience field — number of nights in the stay block (`checkout_date - checkin_date` in days). Eliminates ambiguity and off-by-one risks for consumers (budget calculation, anchor day intro line, Booking.com link description).
- `area`: Geographic area name matching the Phase A overview area column.
- `anchor_day`: Reference to the day file key (e.g., `day_00`) containing the accommodation cards.
- `options_count`: Set to `0` during Phase A, updated to actual count (2-3) after Phase B accommodation discovery.
- `discovery_source`: Set to `"pending"` during Phase A, updated to `"google_places"` after successful discovery, `"skipped"` if MCP unavailable or zero results, `"manual"` if overridden by user.
- For multi-stay trips, multiple entries with non-overlapping date ranges.
```

**Target state — Extend Budget Assembly section, add after existing rules:**

```markdown
### Accommodation Budget Integration

3. If the trip contains accommodation stay blocks (check `manifest.json → accommodation.stays`):
   - Add an "Accommodation" category row to `budget_LANG.md` showing the total estimated accommodation cost range for the entire trip.
   - The range is: (lowest option per-night cost * total nights) to (highest option per-night cost * total nights).
   - Both local currency and EUR amounts are shown, consistent with existing format.
   - Label the row as "{localized_accommodation_label} ({localized_estimate_label})" to indicate these are indicative estimates.

**Anchor day budget table integration:**
- On the anchor day's `### Стоимость дня` table, add an accommodation line item:
  - Label: "{localized_accommodation_label} ({nights} {localized_nights_label})"
  - HUF column: "{per_night_low}–{per_night_high} x {nights} = {total_low}–{total_high}"
  - EUR column: same structure
  - Mark as estimate: append "{localized_estimate_label}" or use italics
- Subsequent days within the same stay block do NOT include accommodation in their budget table.
```

**Target state — Update "Generation Context per Day" note (line ~106 in current file):**

The existing note reads:
> *"Note: The trip details file may contain optional `## Hotel Assistance` and `## Car Rental Assistance` sections at the end. These sections carry structured accommodation and vehicle preferences. The trip generation pipeline does not currently consume these sections (future enhancement). Their presence does not affect existing generation behavior."*

Replace with:
```markdown
> **Note:** The trip details file may contain optional `## Hotel Assistance` and `## Car Rental Assistance` sections at the end. These sections carry structured accommodation and vehicle preferences. The `## Hotel Assistance` section **is consumed** by the accommodation discovery logic: on anchor days (the first day of each stay block), the subagent parses this section to parameterize Google Places lodging queries and annotate accommodation cards. If the section is absent, sensible defaults are used (mid-range, city center, no pet requirement). The `## Car Rental Assistance` section is not currently consumed (future enhancement). Its presence does not affect existing generation behavior.
```

**Rationale (FB-2):** Without this update, Phase B subagents reading `content_format_rules.md` would see the instruction to ignore `## Hotel Assistance`, defeating REQ-006 preference matching. This is the gating instruction that subagents read before generating day content.

**Rationale:** Extends the content format rules to fully specify the accommodation card template, manifest schema, and budget integration, maintaining consistency with existing per-day file format and budget assembly patterns.

---

### 1.3 `rendering-config.md` — Accommodation Card Component Spec

**Action:** Modify

**Target state — Add new subsection under "Component Usage Rules (Mandatory)" after "POI Card Parity Rule":**

```markdown
### Accommodation Section & Card Layout

- **Section wrapper:** The `## 🏨` heading in markdown maps to `<div class="accommodation-section">` containing a `<h2 class="section-title accommodation-section__title">` and all child accommodation cards.
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

### Accommodation Budget in Pricing Grid

- The accommodation line item in the anchor day's pricing grid uses the standard `.pricing-cell` component.
- The pricing cell label includes a `<span class="pricing-cell__badge pricing-cell__badge--estimate">` indicator to distinguish estimated costs from confirmed costs.
```

**Target state — Extend POI Card Parity Rule with exclusion clause:**

Add to the existing POI Card Parity Rule section:

```markdown
- **Accommodation exclusion:** `###` headings prefixed with `🏨` are accommodation cards, not POIs. They render as `.accommodation-card` elements and are excluded from the parity count. The count of `.poi-card` elements must equal the count of non-accommodation `###` POI headings.
```

**Rationale:** Defines the complete HTML rendering contract for accommodation cards, following the established pattern for POI cards while maintaining visual and structural distinction.

---

### 1.4 `rendering_style_config.css` — Accommodation Styles

**Action:** Modify (append new rules after the `.pro-tip` section, before the Advisory section)

**Target state — New CSS rules:**

```css
/* =====================================================================
   ACCOMMODATION SECTION & CARDS
   Visually distinct from POI cards: warm amber accent, different layout
   ===================================================================== */

.accommodation-section {
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 2px solid var(--color-brand-accent);
}

.accommodation-section__title {
  color: var(--color-brand-accent);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.accommodation-section__intro {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-4);
}

.accommodation-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .accommodation-grid {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
}

.accommodation-card {
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  border-left: 4px solid var(--color-brand-accent);
  border-radius: 12px;
  padding: var(--space-4);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base), transform var(--transition-base);
}

.accommodation-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.accommodation-card__tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: 6px;
  font-size: var(--text-xs);
  font-weight: var(--font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background-color: rgba(201, 151, 43, 0.12);
  color: var(--color-brand-accent);
}

@media (prefers-color-scheme: dark) {
  .accommodation-card__tag {
    background-color: rgba(212, 168, 58, 0.15);
  }
}

.accommodation-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-secondary);
  margin-left: var(--space-2);
}

.accommodation-card__name {
  font-size: var(--text-lg);
  font-weight: var(--font-weight-semibold);
  margin: var(--space-2) 0;
  line-height: 1.3;
}

.accommodation-card__links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
}

.accommodation-card__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-sm);
  color: var(--color-brand-accent-alt);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.accommodation-card__link:hover {
  color: var(--color-brand-primary);
  text-decoration: underline;
}

.accommodation-card__price-level {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: var(--space-2) 0;
  font-size: var(--text-sm);
}

.price-pip {
  font-size: var(--text-base);
}

.price-pip--filled {
  opacity: 1;
}

.price-pip--empty {
  opacity: 0.3;
}

.accommodation-card__description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  margin: var(--space-2) 0;
}

/* Booking.com CTA button */
.booking-cta {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: 10px 20px;
  background-color: var(--color-brand-accent);
  color: #fff;
  font-size: var(--text-sm);
  font-weight: var(--font-weight-semibold);
  border-radius: 6px;
  text-decoration: none;
  transition: background-color var(--transition-fast), box-shadow var(--transition-fast);
  margin: var(--space-3) 0;
}

.booking-cta:hover {
  background-color: #B8871F;
  box-shadow: var(--shadow-md);
}

.booking-cta:focus-visible {
  outline: var(--focus-ring);
  outline-offset: 2px;
}

/* Estimate badge in pricing grid */
.pricing-cell__badge--estimate {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-style: italic;
}
```

**Rationale:** The warm amber accent (`--color-brand-accent` = `#C9972B`) differentiates accommodation cards from POI cards (which use the teal `--color-brand-accent-alt` in their tags). The left border treatment matches the advisory card pattern. The Booking CTA uses the accent color as a solid button background, making it the most prominent interactive element on the card. The `.accommodation-card__tag` background is defined separately in a `@media (prefers-color-scheme: dark)` block using the dark-mode accent value (`#D4A83A` → `rgba(212, 168, 58, 0.15)`) to ensure visual consistency across color schemes. All styles use existing design tokens and follow the spacing scale (8px base).

---

### 1.5 `automation/code/tests/pages/TripPage.ts` — New Locators

**Action:** Modify (add new locator properties and helper methods)

**Target state — Add new properties to the constructor (after `poiCardRatings`):**

```typescript
  // --- Accommodation cards ---
  readonly accommodationSections: Locator;
  readonly accommodationCards: Locator;
  readonly accommodationCardRatings: Locator;
  readonly bookingCtaButtons: Locator;
```

**Target state — Initialize in constructor (after `this.poiCardRatings = ...`):**

```typescript
    // Accommodation
    this.accommodationSections = page.locator('.accommodation-section');
    this.accommodationCards = page.locator('.accommodation-card');
    this.accommodationCardRatings = page.locator('.accommodation-card__rating');
    this.bookingCtaButtons = page.locator('.booking-cta');
```

**Target state — Add new helper methods (after `getDayActivityLabels`):**

```typescript
  getDayAccommodationSection(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .accommodation-section`);
  }

  getDayAccommodationCards(dayNumber: number): Locator {
    return this.page.locator(`#day-${dayNumber} .accommodation-card`);
  }

  getAccommodationCardName(card: Locator): Locator {
    return card.locator('.accommodation-card__name');
  }

  getAccommodationCardLinks(card: Locator): Locator {
    return card.locator('.accommodation-card__link');
  }

  getAccommodationCardRating(card: Locator): Locator {
    return card.locator('.accommodation-card__rating');
  }

  getAccommodationCardPriceLevel(card: Locator): Locator {
    return card.locator('.accommodation-card__price-level');
  }

  getAccommodationCardBookingCta(card: Locator): Locator {
    return card.locator('.booking-cta');
  }

  getAccommodationCardProTip(card: Locator): Locator {
    return card.locator('.pro-tip');
  }
```

**Rationale:** Follows the existing POM pattern — properties for global locators, helper methods for scoped-to-day or scoped-to-card locators. All selectors use CSS classes, never text content, maintaining language independence (automation_rules.md §7.1).

---

### 1.6 `automation/code/automation_rules.md` — Document Accommodation Test Pattern

**Action:** Modify (add note in relevant sections)

**Target state — Add to §6.3 "Batch Per-Day Assertions":**

```markdown
* **Accommodation cards:** Accommodation tests check `.accommodation-card` elements per anchor day. These cards use a different class than `.poi-card` and are NOT included in POI parity counts. Use `expect.soft()` within the anchor-day test to validate card count, link patterns, and price level presence.
```

**Rationale:** Documents the test pattern to prevent future confusion between POI and accommodation card assertions.

---

### 1.7 `development_rules.md` §1 — TripPage.ts Structural Requirements Table

**Action:** Modify

**Target state — Extend the "Current structural requirements derived from TripPage.ts" table with accommodation locators:**

Add the following rows to the table:

```markdown
| `.accommodation-section` | `<div class="accommodation-section">` wrapping accommodation cards on anchor days |
| `.accommodation-card` | `<div class="accommodation-card" id="accom-stay-{S}-{N}">` |
| `.accommodation-card__rating` | `<span class="accommodation-card__rating">` inside each accommodation card |
| `.accommodation-card__name` | `<h3 class="accommodation-card__name">` inside each accommodation card |
| `.accommodation-card__link` | `<a class="accommodation-card__link">` for Maps, Site, Photos, Phone links |
| `.accommodation-card__price-level` | `<div class="accommodation-card__price-level">` with `.price-pip` children |
| `.booking-cta` | `<a class="booking-cta" href="..." target="_blank" rel="noopener noreferrer">` — Booking.com CTA button |
```

**Rationale (FB-4):** Without this update, rendering subagents that consult `development_rules.md` as part of their generation checklist will not know they must generate `.accommodation-card` elements — they only see the existing `.poi-card` contract.

---

## 2. Markdown Format Specification

### 2.1 Accommodation Section — Complete Example (Russian, Budapest trip)

This example shows the full section as it would appear in `day_00_ru.md` after the POI cards and before the daily budget table, for a single-base Budapest trip (stay_01: 2026-08-20 to 2026-08-31, 11 nights).

```markdown
## 🏨 Варианты размещения

Проживание в Будапеште: заезд 20.08.2026 (четверг) — выезд 31.08.2026 (понедельник), 11 ночей. Варианты отсортированы по уровню цен.

### 🏨 Meininger Hotel Budapest Great Market Hall / Майнингер Отель Будапешт

📍 [Google Maps](https://maps.google.com/?cid=12345678901234567890)
🌐 [Сайт](https://www.meininger-hotels.com/en/hotels/budapest/)
📸 [Фото](https://www.google.com/maps/place/?q=place_id:ChIJ...#photos)
📞 Телефон: +36 1 555 0100
⭐ 4.1/5 (3,250 отзывов)
💰 Уровень цен: Бюджетный

Современный хостел-отель прямо у Центрального рынка — идеальная база для семьи с детьми. Просторные семейные номера с двухъярусными кроватями, которые обожают дети. Общая кухня позволяет готовить самостоятельно, а до главных достопримечательностей Пешта — 10 минут пешком.

🔗 [Проверить цены](https://www.booking.com/searchresults.html?ss=Meininger+Hotel+Budapest+Great+Market+Hall+Budapest+Hungary&checkin=2026-08-20&checkout=2026-08-31&group_adults=2&group_children=3&age=8&age=6&age=4)

> **Совет:** Бронируйте семейный номер на 4-5 человек — отдельная ванная и больше места для чемоданов. Завтрак-буфет включён в большинство тарифов.

### 🏨 Hotel Parlament Budapest / Отель Парламент Будапешт

📍 [Google Maps](https://maps.google.com/?cid=98765432109876543210)
🌐 [Сайт](https://www.parlament-hotel.hu/)
📸 [Фото](https://www.google.com/maps/place/?q=place_id:ChIJ...#photos)
📞 Телефон: +36 1 374 6000
⭐ 4.4/5 (1,890 отзывов)
💰 Уровень цен: Средний

Элегантный бутик-отель в 100 метрах от здания Парламента с видом на Дунай. Номера с кондиционером и мини-кухней — удобно для семейных перекусов. Район тихий вечером, но днём все ключевые достопримечательности в пешей доступности.

🔗 [Проверить цены](https://www.booking.com/searchresults.html?ss=Hotel+Parlament+Budapest+Budapest+Hungary&checkin=2026-08-20&checkout=2026-08-31&group_adults=2&group_children=3&age=8&age=6&age=4)

> **Совет:** Запросите номер с видом на Дунай — особенно красив на закате. Кроватку для Итая предоставляют бесплатно по запросу при бронировании.

### 🏨 Corinthia Budapest / Коринтия Будапешт

📍 [Google Maps](https://maps.google.com/?cid=11223344556677889900)
🌐 [Сайт](https://www.corinthia.com/budapest/)
📸 [Фото](https://www.google.com/maps/place/?q=place_id:ChIJ...#photos)
📞 Телефон: +36 1 479 4000
⭐ 4.7/5 (5,120 отзывов)
💰 Уровень цен: Высокий

Роскошный гранд-отель в самом центре Пешта с детским клубом, бассейном и легендарным спа Royal. Просторные семейные люксы с отдельной спальней для родителей. Рядом с проспектом Андраши и оперным театром — идеальная стартовая точка для пеших прогулок.

🔗 [Проверить цены](https://www.booking.com/searchresults.html?ss=Corinthia+Budapest+Budapest+Hungary&checkin=2026-08-20&checkout=2026-08-31&group_adults=2&group_children=3&age=8&age=6&age=4)

> **Совет:** Забронируйте Family Experience Package — включает детские халаты, приветственные сладости и поздний выезд. Ищите вариант с бесплатной отменой на Booking.com.
```

### 2.2 Booking.com Deep Link — Construction Algorithm

Given trip details for the Budapest trip:
- Destination: Budapest, Hungary
- Stay block: checkin=2026-08-20, checkout=2026-08-31
- Adults: Robert, Anna → `group_adults=2`
- Children: Tamir (DOB 2018-01-15 → age 8 at checkin), Ariel (DOB 2020-03-22 → age 6 at checkin), Itay (DOB 2022-09-10 → age 3 at checkin, turns 4 on 2026-09-10) → `group_children=3`, `age=8&age=6&age=3`

**URL encoding standard:** Use `application/x-www-form-urlencoded` encoding for the `ss=` parameter: spaces become `+`, non-ASCII characters (e.g., Hungarian á, é, ö, ü) and reserved characters (`&`, `=`, `+`, etc.) are percent-encoded as `%XX`. Example: `K%2BK+Hotel+Opera` for the hotel name `K+K Hotel Opera`.

**URL construction steps:**
1. Base: `https://www.booking.com/searchresults.html`
2. `ss=` = URL-encode(property_name + " " + destination) per the encoding standard above: `Meininger+Hotel+Budapest+Great+Market+Hall+Budapest+Hungary`
3. `checkin=2026-08-20`
4. `checkout=2026-08-31`
5. `group_adults=2`
6. `group_children=3`
7. `age=8&age=6&age=3` (one `age=` per child, calculated at check-in date)

**Result:**
```
https://www.booking.com/searchresults.html?ss=Meininger+Hotel+Budapest+Great+Market+Hall+Budapest+Hungary&checkin=2026-08-20&checkout=2026-08-31&group_adults=2&group_children=3&age=8&age=6&age=3
```

### 2.3 Daily Budget Table — Anchor Day Accommodation Line Item

```markdown
### Стоимость дня 0

| Статья | HUF | EUR |
|--------|-----|-----|
| Такси аэропорт → отель | 11 000 | 28 |
| Поздний ужин | 15 000 | 38 |
| 🏨 Проживание (11 ночей, оценка) | 165 000–990 000 | 418–2 475 |
| **Итого день 0** | **191 000–1 016 000** | **~484–2 541** |
```

Note: The accommodation line shows the total stay cost range (per-night range * nights). The wide range reflects budget-to-upscale options. This appears only on the anchor day.

### 2.4 Aggregate Budget — Accommodation Category

```markdown
### Итого поездка

| Категория | HUF | EUR |
|-----------|-----|-----|
| Достопримечательности | 180 000 | 450 |
| Питание | 420 000 | 1 050 |
| Транспорт | 95 000 | 238 |
| 🏨 Проживание (оценка) | 165 000–990 000 | 418–2 475 |
| **Итого** | **860 000–1 685 000** | **~2 156–4 213** |
```

---

## 3. HTML Rendering Specification

### 3.1 Markdown-to-HTML Mapping

| Markdown Pattern | HTML Output | CSS Class |
|---|---|---|
| `## 🏨 {title}` | `<div class="accommodation-section"><h2 class="section-title accommodation-section__title">{title}</h2>` | `.accommodation-section` |
| Intro paragraph after `## 🏨` | `<p class="accommodation-section__intro">{text}</p>` | `.accommodation-section__intro` |
| `### 🏨 {name}` | `<div class="accommodation-card" id="accom-stay-{S}-{N}">` | `.accommodation-card` |
| `⭐ {rating}/5 ({count})` | `<span class="accommodation-card__rating">⭐ {rating} ({count})</span>` | `.accommodation-card__rating` |
| `📍 [Google Maps](url)` | `<a class="accommodation-card__link" href="{url}">📍 Maps</a>` | `.accommodation-card__link` |
| `🌐 [{label}](url)` | `<a class="accommodation-card__link" href="{url}">🌐 {label}</a>` | `.accommodation-card__link` |
| `📸 [{label}](url)` | `<a class="accommodation-card__link" href="{url}">📸 {label}</a>` | `.accommodation-card__link` |
| `📞 {label}: {phone}` | `<a class="accommodation-card__link" href="tel:{phone}">📞 {label}</a>` | `.accommodation-card__link` |
| `💰 {label}: {level}` | `<div class="accommodation-card__price-level"><span class="price-pip price-pip--filled">💰</span>...` | `.accommodation-card__price-level` |
| Description paragraph | `<div class="accommodation-card__description">{text}</div>` | `.accommodation-card__description` |
| `🔗 [{label}](url)` | `<a class="booking-cta" href="{url}" target="_blank" rel="noopener noreferrer">🔗 {label}</a>` | `.booking-cta` |
| `> **{tip_label}:** {text}` | `<div class="pro-tip"><svg ...></svg><div><strong>{tip_label}:</strong> {text}</div></div>` | `.pro-tip` |

### 3.2 Price Level Visual Scale

The `💰` price level line is rendered as a visual scale showing filled and empty pips:

| price_level | Visual Rendering |
|---|---|
| 0 | (no price level rendered) |
| 1 | `💰○○○` |
| 2 | `💰💰○○` |
| 3 | `💰💰💰○` |
| 4 | `💰💰💰💰` |

HTML structure:
```html
<div class="accommodation-card__price-level">
  <span class="accommodation-card__price-label">{localized_label}:</span>
  <span class="price-pip price-pip--filled">💰</span>
  <span class="price-pip price-pip--filled">💰</span>
  <span class="price-pip price-pip--filled">💰</span>
  <span class="price-pip price-pip--empty">○</span>
  <span class="accommodation-card__price-text">{localized_level_name}</span>
</div>
```

### 3.3 Complete HTML Fragment Example

```html
<div class="accommodation-section">
  <h2 class="section-title accommodation-section__title">🏨 Варианты размещения</h2>
  <p class="accommodation-section__intro">Проживание в Будапеште: заезд 20.08.2026 — выезд 31.08.2026, 11 ночей.</p>

  <div class="accommodation-grid">
    <div class="accommodation-card" id="accom-stay-1-1">
      <span class="accommodation-card__tag">🏨</span>
      <span class="accommodation-card__rating">⭐ 4.1 (3,250)</span>
      <h3 class="accommodation-card__name">Meininger Hotel Budapest Great Market Hall / Майнингер Отель Будапешт</h3>
      <div class="accommodation-card__links">
        <a class="accommodation-card__link" href="https://maps.google.com/?cid=...">
          <svg width="14" height="14" aria-hidden="true">...</svg> 📍 Maps
        </a>
        <a class="accommodation-card__link" href="https://www.meininger-hotels.com/...">
          <svg width="14" height="14" aria-hidden="true">...</svg> 🌐 Сайт
        </a>
        <a class="accommodation-card__link" href="https://www.google.com/maps/place/...#photos">
          <svg width="14" height="14" aria-hidden="true">...</svg> 📸 Фото
        </a>
        <a class="accommodation-card__link" href="tel:+3615550100">
          <svg width="14" height="14" aria-hidden="true">...</svg> 📞 Телефон
        </a>
      </div>
      <div class="accommodation-card__price-level">
        <span class="accommodation-card__price-label">Уровень цен:</span>
        <span class="price-pip price-pip--filled">💰</span>
        <span class="price-pip price-pip--empty">○</span>
        <span class="price-pip price-pip--empty">○</span>
        <span class="price-pip price-pip--empty">○</span>
        <span class="accommodation-card__price-text">Бюджетный</span>
      </div>
      <div class="accommodation-card__description">
        Современный хостел-отель прямо у Центрального рынка — идеальная база для семьи с детьми...
      </div>
      <a class="booking-cta" href="https://www.booking.com/searchresults.html?ss=Meininger+Hotel+Budapest+Great+Market+Hall+Budapest+Hungary&checkin=2026-08-20&checkout=2026-08-31&group_adults=2&group_children=3&age=8&age=6&age=3" target="_blank" rel="noopener noreferrer">
        🔗 Проверить цены
      </a>
      <div class="pro-tip">
        <svg width="16" height="16" aria-hidden="true">...</svg>
        <div><strong>Совет:</strong> Бронируйте семейный номер на 4-5 человек...</div>
      </div>
    </div>

    <!-- accommodation-card #2 and #3 follow same structure -->
  </div>
</div>
```

### 3.4 POI Parity Check Update

The HTML rendering fragment verification must be updated:
- Count of `.poi-card` elements per `#day-N` must equal the count of `###` POI headings for that day, **excluding** `### 🏨` headings.
- Count of `.accommodation-card` elements per `#day-N` is validated separately (2-3 on anchor days, 0 on non-anchor days).

---

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `trip_planning_rules.md` | New "Accommodation Selection" section | Add stay block identification rules, accommodation discovery algorithm, preference-to-search mapping, price level mapping |
| `trip_planning_rules.md` | Data Source Hierarchy | Add Layer 2a for accommodation discovery |
| `trip_planning_rules.md` | CEO Audit | Add accommodation completeness check item |
| `content_format_rules.md` | Per-Day File Format | Add "Accommodation Section (Anchor Day Only)" subsection with card template and placement rules |
| `content_format_rules.md` | manifest.json Schema | Add `accommodation.stays[]` schema documentation |
| `content_format_rules.md` | Budget Assembly | Add accommodation budget integration rules (daily + aggregate) |
| `content_format_rules.md` | Generation Context per Day (note) | Update `## Hotel Assistance` note to reflect consumption by accommodation discovery on anchor days |
| `rendering-config.md` | Component Usage Rules | Add "Accommodation Section & Card Layout" subsection |
| `rendering-config.md` | POI Card Parity Rule | Add accommodation exclusion clause |
| `rendering_style_config.css` | (new section) | Add `.accommodation-section`, `.accommodation-card`, `.accommodation-card__*`, `.booking-cta`, `.price-pip`, `.pricing-cell__badge--estimate` styles |
| `automation/code/tests/pages/TripPage.ts` | Constructor + methods | Add accommodation locator properties and helper methods |
| `automation/code/automation_rules.md` | §6.3 | Add accommodation test pattern note |
| `development_rules.md` | §1 TripPage.ts structural requirements table | Add `.accommodation-section`, `.accommodation-card`, `.accommodation-card__rating`, `.booking-cta` locator-to-element mappings |

---

## 5. Implementation Checklist

### Phase 1: Rule File Updates
- [ ] Add "Accommodation Selection" section to `trip_planning_rules.md` (stay block identification, discovery algorithm, preference mapping, price mapping, CEO Audit)
- [ ] Add "Layer 2a" to Data Source Hierarchy in `trip_planning_rules.md`
- [ ] Add accommodation card template to `content_format_rules.md` Per-Day File Format
- [ ] Add `accommodation.stays[]` schema to `content_format_rules.md` manifest.json section
- [ ] Add accommodation budget integration rules to `content_format_rules.md` Budget Assembly
- [ ] Add accommodation component spec to `rendering-config.md`
- [ ] Add accommodation exclusion to POI Card Parity Rule in `rendering-config.md`
- [ ] Update `content_format_rules.md` "Generation Context per Day" note to reflect `## Hotel Assistance` consumption
- [ ] Extend `development_rules.md` §1 TripPage.ts structural requirements table with accommodation locators

### Phase 2: CSS & Rendering Infrastructure
- [ ] Add `.accommodation-section`, `.accommodation-card`, `.booking-cta`, `.price-pip` styles to `rendering_style_config.css`
- [ ] Verify dark mode variables apply correctly to new styles
- [ ] Verify responsive breakpoints (mobile full-width, desktop grid)

### Phase 3: Automation Infrastructure
- [ ] Add accommodation locators and helpers to `TripPage.ts`
- [ ] Add accommodation test pattern documentation to `automation_rules.md`
- [ ] Create accommodation regression spec (see test plan for details)

### Phase 4: Verification
- [ ] Generate a test trip with `## Hotel Assistance` preferences present
- [ ] Verify manifest.json contains `accommodation.stays[]`
- [ ] Verify anchor day file contains `## 🏨` section with 2-3 `### 🏨` cards
- [ ] Verify Booking.com deep links contain correct parameters (dates, adults, children, ages)
- [ ] Verify non-anchor day files do NOT contain accommodation sections
- [ ] Verify daily budget on anchor day includes accommodation line
- [ ] Verify aggregate budget includes "Accommodation" category
- [ ] Verify HTML renders `.accommodation-card` elements (not `.poi-card`)
- [ ] Verify POI parity check passes (accommodation cards excluded)
- [ ] Run full regression suite — all existing tests must pass

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001: Stay Block Identification | AC-1: At least one stay block per trip | `trip_planning_rules.md` §Accommodation Selection — stay block identification rules |
| REQ-001 | AC-2: Check-in, check-out, area defined | `trip_planning_rules.md` §Accommodation Selection — check-in/check-out rules |
| REQ-001 | AC-3: No gaps, no overlaps | `trip_planning_rules.md` §Accommodation Selection — coverage rule |
| REQ-001 | AC-4: manifest.json includes accommodation object | `content_format_rules.md` §manifest.json Schema — `accommodation.stays[]` |
| REQ-001 | AC-5: Single-base trip = one stay block | `trip_planning_rules.md` §Accommodation Selection — single-base trips rule |
| REQ-002: Google Places Discovery | AC-1: type=lodging search | `trip_planning_rules.md` §Accommodation Discovery step 2 |
| REQ-002 | AC-2: Preferences used for filtering | `trip_planning_rules.md` §Preference-to-Search Mapping table |
| REQ-002 | AC-3: Defaults when preferences absent | `trip_planning_rules.md` §Accommodation Discovery step 1 (defaults) |
| REQ-002 | AC-4: 2-3 options at different price points | `trip_planning_rules.md` §Accommodation Discovery step 4 |
| REQ-002 | AC-5: Property includes name, rating, price_level, etc. | `trip_planning_rules.md` §Accommodation Discovery step 5 |
| REQ-002 | AC-6: Graceful degradation | `trip_planning_rules.md` §Accommodation Discovery step 8 |
| REQ-002 | AC-7: Closed properties excluded | `trip_planning_rules.md` §Accommodation Discovery step 3 |
| REQ-003: Booking.com Deep Links | AC-1: Each card has Booking.com link | `content_format_rules.md` §Accommodation Card Template — `🔗` line |
| REQ-003 | AC-2: URL format correct | `content_format_rules.md` §Booking.com Deep Link Format |
| REQ-003 | AC-3: Hotel name URL-encoded | §2.2 Booking.com Deep Link Construction Algorithm |
| REQ-003 | AC-4: Dates in YYYY-MM-DD | `content_format_rules.md` §Booking.com Deep Link Format |
| REQ-003 | AC-5: Adult/child counts from trip details | §2.2 Booking.com Deep Link Construction Algorithm |
| REQ-003 | AC-6: Child ages at check-in | §2.2 Booking.com Deep Link Construction Algorithm |
| REQ-003 | AC-7: Search results page, not direct booking | `content_format_rules.md` §Booking.com Deep Link Format (uses `searchresults.html`) |
| REQ-004: Card Format | AC-1: Cards in anchor day file | `content_format_rules.md` §Accommodation Section placement rules |
| REQ-004 | AC-2: Section heading `## 🏨` + localized label | `content_format_rules.md` §Accommodation Card Template — section format |
| REQ-004 | AC-3: Intro line with stay period | §2.1 complete example — intro line |
| REQ-004 | AC-4: Card structure (name, links, rating, price, desc, booking, tip) | `content_format_rules.md` §Accommodation Card Template — card format |
| REQ-004 | AC-5: Property names in poi_languages | `content_format_rules.md` §Accommodation Card Template — rules |
| REQ-004 | AC-6: Price level mapped to localized descriptor | `trip_planning_rules.md` §Price Level to Cost Range Mapping |
| REQ-004 | AC-7: Booking link label distinct from website | `content_format_rules.md` §Accommodation Card Template — rules (last bullet) |
| REQ-004 | AC-8: Missing website/phone omitted | `content_format_rules.md` §Accommodation Card Template — rules |
| REQ-004 | AC-9: 2-3 cards per section | `trip_planning_rules.md` §Accommodation Discovery step 4 |
| REQ-004 | AC-10: Ordered by price level ascending | `content_format_rules.md` §Accommodation Card Template — rules |
| REQ-005: Budget Integration | AC-1: Anchor day budget includes accommodation | §2.3 Daily Budget Table example; `content_format_rules.md` §Accommodation Budget Integration |
| REQ-005 | AC-2: Labeled as estimate | `content_format_rules.md` §Accommodation Budget Integration — estimate label |
| REQ-005 | AC-3: Non-anchor days no duplication | `content_format_rules.md` §Accommodation Budget Integration — anchor day only |
| REQ-005 | AC-4: Aggregate budget has accommodation row | §2.4 Aggregate Budget example; `content_format_rules.md` §Accommodation Budget Integration |
| REQ-005 | AC-5: Destination-aware price mapping | `trip_planning_rules.md` §Price Level to Cost Range Mapping |
| REQ-005 | AC-6: Both local currency and EUR | §2.3, §2.4 examples; `content_format_rules.md` §Accommodation Budget Integration |
| REQ-006: Preference Matching | AC-1: Accommodation type influences query | `trip_planning_rules.md` §Preference-to-Search Mapping — accommodation_type row |
| REQ-006 | AC-2: Location priority adjusts search center | `trip_planning_rules.md` §Preference-to-Search Mapping — location_priority row |
| REQ-006 | AC-3: Quality level maps to price_level | `trip_planning_rules.md` §Preference-to-Search Mapping — quality_level row |
| REQ-006 | AC-4: Amenities mentioned in descriptions | `trip_planning_rules.md` §Preference-to-Search Mapping — must_have_amenities row |
| REQ-006 | AC-5: Pet policy in card | `trip_planning_rules.md` §Preference-to-Search Mapping — pets row |
| REQ-006 | AC-6: Budget as hard filter | `trip_planning_rules.md` §Accommodation Discovery step 3 |
| REQ-006 | AC-7: Cancellation in pro-tip | `trip_planning_rules.md` §Preference-to-Search Mapping — cancellation_preference row |
| REQ-006 | AC-8: Defaults when preferences absent | `trip_planning_rules.md` §Accommodation Discovery step 1 |
| REQ-007: CEO Audit Addition | AC-1: New checklist item for accommodation | `trip_planning_rules.md` §CEO Audit — new checkbox |
| REQ-007 | AC-2: Only evaluated on anchor days | `trip_planning_rules.md` §CEO Audit — "If this is the first day of a stay block" conditional |
| REQ-007 | AC-3: Verifies price-budget alignment | `trip_planning_rules.md` §CEO Audit — "at least one option's price level aligns" |
| REQ-008: Manifest Schema | AC-1: `accommodation.stays[]` structure | `content_format_rules.md` §manifest.json Schema — accommodation metadata |
| REQ-008 | AC-2: anchor_day references day file | `content_format_rules.md` §manifest.json Schema — `anchor_day` field |
| REQ-008 | AC-3: options_count reflects actual | `content_format_rules.md` §manifest.json Schema — `options_count` field |
| REQ-008 | AC-4: discovery_source values | `content_format_rules.md` §manifest.json Schema — `discovery_source` field |
| REQ-008 | AC-5: Multi-stay non-overlapping | `content_format_rules.md` §manifest.json Schema — last bullet |
| REQ-009: HTML Rendering | AC-1: `.accommodation-card` class | `rendering-config.md` §Accommodation Section & Card Layout |
| REQ-009 | AC-2: Visually distinct from `.poi-card` | `rendering_style_config.css` — amber accent vs teal; §1.4 rationale |
| REQ-009 | AC-3: Booking CTA as button | `rendering-config.md` §Accommodation Card Layout — `.booking-cta`; `rendering_style_config.css` |
| REQ-009 | AC-4: Price level visual scale | §3.2 Price Level Visual Scale; `rendering-config.md` — `.price-pip` |
| REQ-009 | AC-5: `## 🏨` as section divider | `rendering-config.md` §Accommodation Section & Card Layout — section wrapper |
| REQ-009 | AC-6: Responsive layout | `rendering_style_config.css` — `.accommodation-grid` media queries |
| REQ-009 | AC-7: Language-agnostic rendering | `rendering-config.md` §Accommodation Card Layout — last bullet |
| REQ-010: Test Coverage | AC-1: Accommodation section presence test | `TripPage.ts` — `getDayAccommodationSection()`; test spec |
| REQ-010 | AC-2: Card structure validation | `TripPage.ts` — `getAccommodationCardName/Links/Rating`; test spec |
| REQ-010 | AC-3: Booking.com URL parameter validation | Test spec — URL pattern matching on `.booking-cta` href |
| REQ-010 | AC-4: Budget table accommodation line | Test spec — pricing grid validation on anchor day |
| REQ-010 | AC-5: Aggregate budget accommodation row | Test spec — `#budget` section validation |
| REQ-010 | AC-6: Card count 2-3 per stay | Test spec — `.accommodation-card` count per anchor day |
| REQ-010 | AC-7: All assertions language-agnostic | `TripPage.ts` — CSS selectors only; `automation_rules.md` §7 |
| REQ-011: Language-Agnostic | AC-1: Section heading in reporting language | `content_format_rules.md` §Accommodation Card Template — rules |
| REQ-011 | AC-2: Labels in reporting language | `content_format_rules.md` §Accommodation Card Template — card format |
| REQ-011 | AC-3: Price level descriptors localized | `trip_planning_rules.md` §Price Level to Cost Range Mapping |
| REQ-011 | AC-4: Descriptions in reporting language | `content_format_rules.md` §Accommodation Card Template — card format |
| REQ-011 | AC-5: Booking link label localized | `content_format_rules.md` §Accommodation Card Template — rules (last bullet) |
| REQ-011 | AC-6: Multi-language regeneration | `content_format_rules.md` — file naming with `_LANG` suffix; each language generates its own accommodation cards |
