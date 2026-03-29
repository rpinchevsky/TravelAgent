# Business Requirements Document

**Change:** Accommodation Integration — Hotel Discovery & Booking Referral Cards in Trip Output
**Date:** 2026-03-29
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The trip generation pipeline produces detailed day-by-day itineraries with POI cards, schedule tables, daily budgets, and backup plans. A prior change (2026-03-28_hotel-car-assistance) added accommodation preference collection to the intake wizard, outputting a `## Hotel Assistance` section in the trip details markdown. However, the pipeline does not yet consume those preferences or produce accommodation recommendations.

Accommodation is typically the single largest expense of a family trip and a major logistical decision. Families currently receive a rich itinerary but must separately research where to stay — a disconnected experience. By integrating accommodation discovery into the trip output, the planner becomes a complete end-to-end solution.

**Technology decisions (pre-approved by user):**
1. **Google Places API** (`type=lodging`) via existing MCP tool `mcp__google-places__maps_search_places` — hotel discovery: name, rating, photos, coordinates, price level.
2. **Booking.com affiliate deep links** — URL construction only; no API signup. Format: `https://www.booking.com/searchresults.html?ss={hotel_name}+{destination}&checkin={date}&checkout={date}&group_adults={n}&group_children={n}&age={ages}`.
3. **No scraping, no paid APIs, no booking engine.**

## 2. Scope

**In scope:**
- New "stay block" concept: accommodation spans multiple nights, not single days — the system groups contiguous nights at the same location into a stay
- Accommodation discovery via Google Places API (`type=lodging`) filtered by traveler preferences from trip details
- Booking.com affiliate deep-link construction for each recommended property
- 2-3 accommodation options per stay block at different price points
- Accommodation card format in markdown day files (placed in the first day of each stay)
- Accommodation section in HTML rendering (new card type)
- Budget integration: per-night and total-stay costs in daily and aggregate budgets
- Consumption of the `## Hotel Assistance` section from trip details (preferences: type, location, stars, amenities, pets, cancellation, budget)
- Graceful degradation when `## Hotel Assistance` is absent (use sensible defaults)
- CEO Audit checklist addition for accommodation verification
- Updates to manifest.json schema (accommodation metadata per stay)
- Language-agnostic design: all rendering and test logic works in any language

**Out of scope:**
- Actual booking transactions or availability checks
- Real-time pricing (prices shown are indicative based on Google Places `price_level`)
- Scraping Booking.com or any other provider for live prices
- Car rental recommendations (separate future feature)
- Changes to the trip intake wizard (already handled by 2026-03-28_hotel-car-assistance)
- Accommodation mid-trip relocation optimization (the itinerary author decides stay splits; this feature populates options for those splits)
- Review aggregation beyond Google Places rating

**Affected rule files:**
- `trip_planning_rules.md` — new "Accommodation Selection" section, Data Source Hierarchy update, CEO Audit checklist addition
- `content_format_rules.md` — Per-Day File Format (accommodation card template), Budget Assembly (accommodation line items), manifest.json schema (accommodation metadata), Trip Folder Structure (no new files — embedded in day files)
- `trip_details.md` — no changes (preferences already collected by prior feature; file remains destination-agnostic)

## 3. Requirements

### REQ-001: Stay Block Identification

**Description:** The pipeline must identify distinct "stay blocks" — contiguous sequences of nights where the traveler sleeps in the same area. For most trips this is a single stay block (entire trip at one base). For multi-city or split-location trips, multiple stay blocks may exist. Stay blocks are derived from the Phase A overview: if the planned area changes significantly (different city or district requiring relocation), a new stay block begins.

**Acceptance Criteria:**
- [ ] AC-1: The pipeline identifies at least one stay block per trip
- [ ] AC-2: Each stay block has a defined check-in date (first night), check-out date (morning after last night), and geographic area
- [ ] AC-3: Stay blocks cover every night of the trip with no gaps and no overlaps
- [ ] AC-4: The manifest.json includes a top-level `accommodation` object listing all stay blocks with their date ranges and area names
- [ ] AC-5: For a single-base trip (all days in the same city), exactly one stay block is produced spanning arrival night to departure morning

**Priority:** Must-have

**Affected components:**
- Phase A logic (stay block identification from overview)
- `manifest.json` schema
- `content_format_rules.md` — manifest schema documentation
- `trip_planning_rules.md` — stay block identification rules

---

### REQ-002: Accommodation Discovery via Google Places API

**Description:** For each stay block, the pipeline must query Google Places API (`type=lodging`) to discover accommodation options near the stay block's geographic area. The query must be filtered/ranked by traveler preferences from the `## Hotel Assistance` section of the trip details file.

**Acceptance Criteria:**
- [ ] AC-1: Google Places search is executed with `type=lodging` and the stay block's area as the location parameter
- [ ] AC-2: When `## Hotel Assistance` section exists in trip details, its preferences are used to filter and rank results: accommodation type maps to Google Places type refinement, quality level maps to `price_level` filtering, location priority influences search center point
- [ ] AC-3: When `## Hotel Assistance` section is absent, the pipeline uses sensible defaults: mid-range price level, central location, family-friendly amenities
- [ ] AC-4: At least 2 and at most 3 accommodation options are selected per stay block, spanning different price points (budget, mid-range, upscale) where possible
- [ ] AC-5: Each discovered property includes: name, Google Places rating (with review count), price level (0-4 scale mapped to descriptive label), address, Google Maps link, and Google Places photo reference
- [ ] AC-6: If Google Places MCP is unavailable or returns no results, the pipeline logs a warning and continues without accommodation cards (graceful degradation, consistent with existing POI enrichment pattern)
- [ ] AC-7: Properties with `business_status` of "CLOSED_PERMANENTLY" or "CLOSED_TEMPORARILY" are excluded

**Priority:** Must-have

**Affected components:**
- Phase B day generation (accommodation research step)
- `trip_planning_rules.md` — new "Accommodation Selection" section under Strategic Planning Logic

---

### REQ-003: Booking.com Affiliate Deep Link Construction

**Description:** For each discovered accommodation option, the pipeline must construct a Booking.com deep link that pre-fills the search with the property name, destination, check-in/check-out dates, and traveler composition. This enables one-click booking referral without any API integration.

**Acceptance Criteria:**
- [ ] AC-1: Each accommodation card includes a Booking.com deep link
- [ ] AC-2: The URL follows the format: `https://www.booking.com/searchresults.html?ss={hotel_name}+{destination}&checkin={checkin_date}&checkout={checkout_date}&group_adults={adult_count}&group_children={child_count}&age={child1_age}&age={child2_age}...`
- [ ] AC-3: `{hotel_name}` is URL-encoded (spaces become `+`, special characters percent-encoded)
- [ ] AC-4: `{checkin_date}` and `{checkout_date}` use the stay block's dates in `YYYY-MM-DD` format
- [ ] AC-5: `{adult_count}` and `{child_count}` are derived from the trip details travelers section
- [ ] AC-6: Child ages in the `age=` parameters are calculated at the time of check-in (same age calculation logic used throughout the pipeline)
- [ ] AC-7: The link opens a Booking.com search results page that shows the target hotel (or similar properties) — not a direct booking page, since no affiliate ID is required for deep links

**Priority:** Must-have

**Affected components:**
- Phase B day generation (link construction)
- `content_format_rules.md` — accommodation card template

---

### REQ-004: Accommodation Card Format in Markdown

**Description:** Each accommodation option must be rendered as a structured card within the day file for the first day of its stay block. The card format must be distinct from POI cards (using a `### 🏨` prefix) so it is identifiable for HTML rendering, while following a similar structured pattern.

**Acceptance Criteria:**
- [ ] AC-1: Accommodation cards appear in a dedicated `## Accommodation` section within the day file of the first day of the stay block (e.g., if stay block starts on Day 0 arrival, cards appear in `day_00_LANG.md`)
- [ ] AC-2: The section heading is `## 🏨 {localized_accommodation_label}` (localized per reporting language, e.g., "Варианты размещения" in Russian)
- [ ] AC-3: A brief intro line states the stay period (check-in date to check-out date, number of nights) and notes that options are sorted by price level
- [ ] AC-4: Each option uses this card structure:
  ```
  ### 🏨 {Property Name in poi_languages}

  📍 [Google Maps]({maps_url})
  🌐 [{localized_website_label}]({website_url})
  📸 [{localized_photos_label}]({photos_url})
  📞 {localized_phone_label}: {phone}
  ⭐ {rating}/5 ({review_count} {localized_reviews_label})
  💰 {localized_price_level_label}: {descriptive_price_level}

  {2-3 sentence description: property vibe, family-relevant features, proximity to day activities}

  🔗 [{localized_check_prices_label}]({booking_com_deep_link})

  > **{localized_tip_label}:** {One actionable tip — e.g., "Book the family suite for a separate kids' bedroom" or "Request a crib at booking time"}
  ```
- [ ] AC-5: Property names follow existing `poi_languages` convention (Hungarian / Russian for Budapest trips, per trip details)
- [ ] AC-6: The `💰` price level line maps Google Places `price_level` (0-4) to a localized descriptor: 0 = Free/Бесплатно, 1 = Budget/Бюджетный, 2 = Mid-range/Средний, 3 = Upscale/Высокий, 4 = Luxury/Люксовый
- [ ] AC-7: The booking link label is distinct from the website link — clearly communicates "check prices / book" intent
- [ ] AC-8: When a property has no website or phone from Google Places, those lines are omitted (not rendered as empty), consistent with existing POI graceful degradation
- [ ] AC-9: The section contains exactly 2-3 option cards (not more, not fewer — unless fewer than 2 results are returned from discovery, in which case include all available)
- [ ] AC-10: Cards are ordered from lowest to highest price level

**Priority:** Must-have

**Affected components:**
- Phase B day generation subagents
- `content_format_rules.md` — new "Accommodation Card Template" section under Per-Day File Format

---

### REQ-005: Accommodation Budget Integration

**Description:** Accommodation costs must be integrated into the trip's budget structure. Since accommodation spans multiple nights, costs should appear both in the day-level budget of the first day of the stay block and in the aggregate trip budget.

**Acceptance Criteria:**
- [ ] AC-1: The daily budget table (`### Стоимость дня`) on the first day of each stay block includes an accommodation line item showing the per-night estimated cost range (low option to high option) and the total stay cost range (per-night range multiplied by number of nights)
- [ ] AC-2: The accommodation cost is clearly labeled as an estimate (not confirmed pricing) and marked as "indicative" based on Google Places price level
- [ ] AC-3: Subsequent days within the same stay block do NOT duplicate the accommodation cost in their daily budget tables
- [ ] AC-4: The aggregate `budget_LANG.md` includes a separate "Accommodation" category row showing the total estimated accommodation cost range for the entire trip
- [ ] AC-5: Cost estimation uses a price-level-to-range mapping appropriate for the destination's market (e.g., Budapest: level 1 = ~15,000-25,000 HUF/night, level 2 = ~25,000-50,000 HUF/night, level 3 = ~50,000-90,000 HUF/night, level 4 = ~90,000+ HUF/night). The mapping is destination-aware, not hardcoded
- [ ] AC-6: Both local currency and EUR amounts are shown, consistent with existing budget format

**Priority:** Must-have

**Affected components:**
- Phase B day generation (budget table addition)
- Budget assembly (`budget_LANG.md`)
- `content_format_rules.md` — Budget Assembly section update

---

### REQ-006: Preference Matching Logic

**Description:** When accommodation preferences are available from the trip details `## Hotel Assistance` section, the pipeline must use them to filter, rank, and annotate accommodation options. Preferences act as soft filters (prefer but do not hard-exclude) except for pet policy and budget range which are hard filters.

**Acceptance Criteria:**
- [ ] AC-1: `Accommodation type` preference (e.g., "Apartment / Condo") influences the Google Places search query to prioritize matching property types
- [ ] AC-2: `Location priority` preference (e.g., "City center & walkable") adjusts the search center point: city center stays search the historic center, "Near transport hub" searches near the main train/metro station, etc.
- [ ] AC-3: `Quality level` preference maps to Google Places `price_level` filtering: Budget = 0-1, Mid-range = 2, Upscale = 3, Luxury = 4
- [ ] AC-4: `Must-have amenities` are mentioned in card descriptions when a property matches (e.g., "Pool on-site, Free WiFi, Kitchen available") — Google Places data may not confirm all amenities, so unverifiable amenities are noted as "check with property"
- [ ] AC-5: `Traveling with pets: Yes` adds a note to each card about pet policy verification and includes `&pet=1` or similar signal in Booking.com link if supported
- [ ] AC-6: `Daily budget per room` range acts as a hard filter: exclude properties whose estimated price level is clearly outside the stated budget range
- [ ] AC-7: `Cancellation preference` is mentioned in the pro-tip section of each card (e.g., "Look for free cancellation options on Booking.com")
- [ ] AC-8: When preferences are absent (no `## Hotel Assistance` section), defaults are used: mid-range, city center, no pet requirement, no amenity filtering — the pipeline still produces accommodation cards

**Priority:** Must-have

**Affected components:**
- Phase B day generation (preference parsing and filtering logic)
- `trip_planning_rules.md` — new "Accommodation Selection" section

---

### REQ-007: CEO Audit Checklist Addition

**Description:** The mandatory CEO Audit self-check must be extended to include accommodation verification for days that contain accommodation cards.

**Acceptance Criteria:**
- [ ] AC-1: A new checklist item is added: "If this is the first day of a stay block: does the accommodation section contain 2-3 options with complete cards (name, rating, maps link, booking link, price level)?"
- [ ] AC-2: The check is only evaluated on days where an accommodation section is expected (first day of each stay block)
- [ ] AC-3: The check verifies that at least one option's price level aligns with the traveler's stated budget preference (if available)

**Priority:** Must-have

**Affected components:**
- `trip_planning_rules.md` — CEO Audit section

---

### REQ-008: Manifest Schema — Accommodation Metadata

**Description:** The manifest.json must be extended to track accommodation stay blocks and their discovery status, enabling incremental edits and re-generation.

**Acceptance Criteria:**
- [ ] AC-1: The manifest includes an `accommodation` object at the top level (sibling to `languages`) with this structure:
  ```json
  {
    "accommodation": {
      "stays": [
        {
          "id": "stay_01",
          "checkin": "2026-08-20",
          "checkout": "2026-08-31",
          "area": "Budapest, Hungary",
          "anchor_day": "day_00",
          "options_count": 3,
          "discovery_source": "google_places"
        }
      ]
    }
  }
  ```
- [ ] AC-2: `anchor_day` references the day file that contains the accommodation cards for this stay
- [ ] AC-3: `options_count` reflects the actual number of accommodation cards written
- [ ] AC-4: `discovery_source` is `"google_places"` when discovered via API, or `"manual"` if overridden by user
- [ ] AC-5: For multi-stay trips, multiple entries exist in the `stays` array with non-overlapping date ranges

**Priority:** Should-have

**Affected components:**
- Phase A (manifest creation)
- Phase B (manifest update after accommodation discovery)
- `content_format_rules.md` — manifest.json Schema section

---

### REQ-009: HTML Rendering — Accommodation Card Type

**Description:** The HTML rendering pipeline (invoked via `/render` skill) must recognize accommodation cards (identified by `### 🏨` prefix or `## 🏨` section) and render them as a distinct card type, visually differentiated from POI cards.

**Acceptance Criteria:**
- [ ] AC-1: Accommodation cards are rendered as `<div class="accommodation-card">` (or equivalent class) in the HTML output
- [ ] AC-2: The card is visually distinct from `.poi-card`: different accent color or border treatment (e.g., warm/amber accent vs. the blue used for POI cards)
- [ ] AC-3: The Booking.com link is rendered as a prominent call-to-action button (not just an inline link) — styled as a branded booking button
- [ ] AC-4: The price level indicator is rendered with a visual scale (e.g., filled/unfilled currency symbols: `💰💰💰○` for level 3 out of 4)
- [ ] AC-5: The `## 🏨` section heading is rendered as a distinct section divider, grouping all accommodation cards for that stay block
- [ ] AC-6: Accommodation cards are responsive: full-width on mobile, side-by-side (2-3 columns) on desktop if space permits
- [ ] AC-7: The rendering is language-agnostic: card structure, class names, and element identification do not depend on specific language strings

**Priority:** Must-have

**Affected components:**
- `/render` skill configuration (rendering_style_config.css, TripPage.ts markdown-to-HTML mapping)
- `content_format_rules.md` — HTML rendering notes for accommodation

---

### REQ-010: Automation Test Coverage

**Description:** The regression test suite must validate accommodation cards in generated trip HTML, covering presence, structure, link integrity, and budget integration.

**Acceptance Criteria:**
- [ ] AC-1: A test verifies that the accommodation section exists on the expected anchor day(s)
- [ ] AC-2: A test verifies each accommodation card contains: property name, rating element, Google Maps link, Booking.com link, price level indicator
- [ ] AC-3: A test verifies the Booking.com deep link contains expected URL parameters (destination, dates, adult count, child count) — validated structurally, not by language-specific strings
- [ ] AC-4: A test verifies that the daily budget table on the anchor day includes an accommodation line item
- [ ] AC-5: A test verifies that the aggregate budget includes an accommodation category
- [ ] AC-6: A test verifies the accommodation card count is between 2 and 3 per stay block (or fewer if discovery returned fewer)
- [ ] AC-7: All test assertions are language-agnostic: they check element presence, CSS classes, link patterns, and structural attributes — never language-specific text content

**Priority:** Must-have

**Affected components:**
- `TripPage.ts` — new page object methods for accommodation elements
- Regression test specs
- `automation_rules.md` — test pattern documentation

---

### REQ-011: Language-Agnostic Content Generation

**Description:** All accommodation content — section headings, card labels, descriptions, pro-tips — must be generated in the trip's reporting language (from `language_preference.reporting_language`). No English strings may be hardcoded in the output. The accommodation card template must use localized labels throughout.

**Acceptance Criteria:**
- [ ] AC-1: The accommodation section heading uses the reporting language (not hardcoded English)
- [ ] AC-2: All label prefixes (website, photos, phone, rating, price level, check prices, tip) use the reporting language
- [ ] AC-3: Price level descriptors are localized (e.g., "Средний" not "Mid-range" for Russian reports)
- [ ] AC-4: Property descriptions and pro-tips are written in the reporting language
- [ ] AC-5: The Booking.com link label is localized
- [ ] AC-6: If the trip is regenerated in a different language, accommodation cards in the new language file use that language's labels and descriptions

**Priority:** Must-have

**Affected components:**
- Phase B day generation
- `content_format_rules.md` — accommodation card template localization notes

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Google Places API `type=lodging` may return limited results for smaller destinations or specific neighborhoods | Fall back to broader area search (city-level) if neighborhood search returns fewer than 2 results. Graceful degradation: if zero results, omit accommodation section with a note in the manifest |
| Google Places `price_level` is not always populated for all properties | When `price_level` is absent, omit the price level line from the card and note "Price level unavailable — check Booking.com link for current rates" |
| Booking.com deep links may not always resolve to the exact property (name matching is fuzzy) | The link is a search-results page, not a direct property page — this is by design. The `ss=` parameter pre-fills the search, so the target property typically appears at the top. No mitigation needed beyond correct URL encoding |
| Accommodation cost estimation from `price_level` is imprecise (0-4 scale, no actual prices) | Clearly label all cost figures as "indicative estimates" in both the card and the budget. Direct users to Booking.com link for actual prices |
| Multi-stay trips (e.g., 3 days in Budapest, 4 days at Lake Balaton) require the Phase A planner to explicitly define stay splits | For MVP, assume single-base trips (one stay block). Multi-stay support is additive — the architecture supports it via the `stays` array, but the Phase A planner does not need to optimize relocation decisions in this iteration |
| Prior feature (2026-03-28_hotel-car-assistance) must be implemented first — `## Hotel Assistance` section must exist in trip details format | The accommodation pipeline gracefully degrades without preferences (REQ-006 AC-8). However, preference-driven filtering requires the intake feature to be complete. Implementation order: intake first, then accommodation integration |
| HTML rendering requires new CSS class and card template in the render skill | The render skill already supports multiple card types (poi-card, pro-tip). Adding `accommodation-card` follows the established pattern |
| Network dependency on Google Places MCP during Phase B generation | Follows existing Network & Connectivity Rules (retry once, stop on second failure). Accommodation discovery is non-blocking — trip generation continues without accommodation cards if network fails |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-29 | Approved |
