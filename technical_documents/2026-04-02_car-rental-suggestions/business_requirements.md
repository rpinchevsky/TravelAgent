# Business Requirements Document

**Change:** Car Rental Suggestion Mechanism — Rental Company Discovery, Price Comparison & Booking Links
**Date:** 2026-04-02
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The trip generation pipeline currently handles car rental days with a hardcoded vehicle type recommendation and fuel cost estimates in the overview section (e.g., "Минивэн / MPV на 7 мест, EUR 50-75/день"). It mentions rental company names in passing ("SIXT, Rentauto, Hertz") but provides no structured comparison, no booking links, no price breakdown by category, and no connection to the traveler's stated car rental preferences.

Meanwhile, the intake wizard (Step 2 of `trip_intake.html`) already collects detailed car rental preferences via the `## Car Rental Assistance` section: car category (up to 14 options, multi-select), transmission preference, fuel type, pickup/return location, additional equipment, and daily rental budget. This data is written to the trip details markdown but explicitly ignored by the generation pipeline — `content_format_rules.md` states the section is "not currently consumed (future enhancement)."

The accommodation system (implemented in 2026-03-29_accommodation-integration) demonstrates a proven pattern: collect preferences via intake, discover options via web research, present 2-3 structured options with price comparison and booking links on an anchor day, and integrate costs into the budget. Car rental should follow the same pattern to bring the trip planner to full end-to-end coverage of major travel expenses.

**Key gap:** A family currently receives a complete itinerary with accommodation options and booking links, but must separately research car rental companies, compare prices across their preferred categories, and find booking pages — a disconnected experience for what is often the second-largest trip expense.

## 2. Scope

**In scope:**
- New "car rental block" concept: consecutive car days grouped into a rental period (analogous to stay blocks for accommodation)
- Car rental company discovery via web research (Google Search + web fetch — rental companies are commercial entities not well-covered by Google Places `type=car_rental`)
- 2-3 rental company options per car category requested by the traveler
- Price comparison table per car category (company, daily rate, total cost, booking link)
- Consumption of the `## Car Rental Assistance` section from trip details (car category, transmission, fuel type, pickup/return, equipment, budget)
- Car rental section placed on the first car day (anchor day pattern, consistent with accommodation)
- Booking/site links for each rental company
- Budget integration with rental cost ranges (anchor day budget table + aggregate budget)
- Manifest schema extension for car rental metadata
- Markdown card format for car rental options (distinct from POI and accommodation cards)
- HTML rendering of car rental section (new card type)
- CEO Audit checklist addition for car rental verification
- Automation test coverage for car rental cards
- Language-agnostic design throughout

**Out of scope:**
- Actual booking transactions or real-time availability checks
- Google Places API for car rental discovery (Google Places `type=car_rental` has poor coverage for rental comparisons — web search is more effective for rental aggregators)
- Changes to the trip intake wizard (car preferences already collected — `## Car Rental Assistance` section is stable)
- Insurance comparison or add-on pricing
- One-way rental pricing (pickup and return at different locations across cities)
- Fleet-level vehicle matching (specific make/model selection)
- Rental company loyalty program integration
- Car-sharing services (e.g., MOL Limo, GreenGo) — different product category

**Affected rule files:**
- `trip_planning_rules.md` — new "Car Rental Selection" section (parallel to Accommodation Selection), Data Source Hierarchy update (Layer 2b for car rental discovery), CEO Audit checklist addition
- `content_format_rules.md` — Per-Day File Format (car rental section template), Generation Context note update (remove "future enhancement" language), Budget Assembly (car rental line items), manifest.json schema (car rental metadata), section placement order within anchor day files
- `trip_details.md` — no structural changes (preferences already collected); the file remains destination-agnostic

## 3. Requirements

### REQ-001: Car Rental Block Identification

**Description:** The pipeline must identify "car rental blocks" — consecutive sequences of days where the itinerary calls for a rental car. These are derived from the Phase A overview: days marked with a car emoji (🚗) or whose transportation plan specifies "car rental" form a contiguous block. Multiple non-adjacent car day sequences produce multiple rental blocks.

**Acceptance Criteria:**
- [ ] AC-1: The pipeline identifies at least one car rental block when the Phase A overview contains days designated for car travel
- [ ] AC-2: Each car rental block has a defined pickup date (morning of first car day), return date (evening of last car day), and pickup/return location
- [ ] AC-3: Consecutive car days are grouped into a single rental block; non-adjacent car day groups produce separate rental blocks
- [ ] AC-4: The manifest.json includes a top-level `car_rental` object listing all rental blocks with their date ranges, day count, and anchor day reference
- [ ] AC-5: When no car days exist in the itinerary, the `car_rental` object is present but `blocks` array is empty
- [ ] AC-6: The anchor day for each rental block is the first car day of that block

**Priority:** Must-have

**Affected components:**
- Phase A logic (car rental block identification from overview)
- `manifest.json` schema
- `content_format_rules.md` — manifest schema documentation
- `trip_planning_rules.md` — car rental block identification rules

---

### REQ-002: Car Rental Preference Consumption

**Description:** The pipeline must parse the `## Car Rental Assistance` section from the active trip details file and use its fields to parameterize car rental discovery and card generation. The `content_format_rules.md` note that this section is "not currently consumed (future enhancement)" must be updated to reflect active consumption.

**Acceptance Criteria:**
- [ ] AC-1: When `## Car Rental Assistance` is present in trip details, the pipeline extracts: car_category (list), transmission, fuel_type (list), pickup_return (list), additional_equipment (list), daily_rental_budget (range)
- [ ] AC-2: Each car category in the list triggers a separate price comparison table in the car rental section (e.g., if user selected "Compact, Full-size, Premium", three comparison tables are generated)
- [ ] AC-3: Transmission and fuel type preferences are included in search queries and annotated on cards
- [ ] AC-4: Pickup/return location preference influences which company branches are researched (airport vs. city center)
- [ ] AC-5: Daily rental budget acts as a soft filter — options outside the range are deprioritized but not excluded if fewer than 2 options remain within range
- [ ] AC-6: Additional equipment (child seats, GPS, etc.) is noted in the section intro and pro-tips, with estimated surcharge when discoverable
- [ ] AC-7: When `## Car Rental Assistance` is absent, the pipeline skips the car rental section entirely — unlike accommodation, car rental is not a universal need and should not be generated without explicit preferences
- [ ] AC-8: The "future enhancement" note in `content_format_rules.md` Generation Context section is removed and replaced with active consumption language mirroring the Hotel Assistance description

**Priority:** Must-have

**Affected components:**
- Phase B day generation (preference parsing)
- `content_format_rules.md` — Generation Context note update
- `trip_planning_rules.md` — new "Car Rental Selection" section

---

### REQ-003: Car Rental Company Discovery via Web Research

**Description:** For each car rental block, the pipeline must discover rental company options available at the destination. Unlike accommodation (which uses Google Places `type=lodging`), car rental discovery uses web search to find major rental companies and aggregators operating at the destination, then web-fetches their sites for pricing.

**Acceptance Criteria:**
- [ ] AC-1: Web search queries include destination, rental dates, and each requested car category (e.g., "car rental Budapest August 2026 compact")
- [ ] AC-2: The pipeline identifies 2-3 distinct rental companies per car category that operate at the destination
- [ ] AC-3: For each company, the pipeline discovers or estimates: company name, daily rate for the requested category, total cost for the rental period, and a booking/search page URL
- [ ] AC-4: International companies (e.g., Hertz, SIXT, Europcar, Enterprise) and local/regional companies are both considered
- [ ] AC-5: Results are filtered by transmission and fuel type preferences when the company website provides this information
- [ ] AC-6: Pickup/return location availability is verified when discoverable (airport desk vs. city center office)
- [ ] AC-7: If web search fails or returns insufficient results, the pipeline uses well-known aggregator sites (e.g., rentalcars.com, kayak.com, autoeurope.com) to construct comparison links as a fallback
- [ ] AC-8: Graceful degradation: if no rental information can be discovered (network failure, no results), the car rental section is omitted with a manifest note `"discovery_source": "skipped"`. Trip generation continues — car rental is non-blocking

**Priority:** Must-have

**Affected components:**
- Phase B day generation (web search and fetch)
- `trip_planning_rules.md` — Data Source Hierarchy (new Layer 2b for car rental), Car Rental Selection section

---

### REQ-004: Price Comparison Table per Car Category

**Description:** For each car category requested by the traveler, the car rental section must include a price comparison table showing 2-3 rental company options side by side. This is the core differentiator from the current hardcoded approach.

**Acceptance Criteria:**
- [ ] AC-1: Each requested car category (from `## Car Rental Assistance`) gets its own comparison table
- [ ] AC-2: Each table contains columns: Company name, Daily rate (local currency + EUR), Total cost for rental period (local currency + EUR), Booking link
- [ ] AC-3: Each table contains 2-3 rows (one per rental company option)
- [ ] AC-4: Rows are sorted by daily rate ascending (cheapest first)
- [ ] AC-5: If the traveler requested multiple categories (e.g., Compact + Premium), tables appear sequentially under category sub-headings
- [ ] AC-6: Prices are clearly labeled as estimates when sourced from web research rather than real-time API (append localized estimate marker)
- [ ] AC-7: When a company does not have a specific vehicle in the requested category, it is noted as "category not available" rather than omitted

**Priority:** Must-have

**Affected components:**
- Phase B day generation (table construction)
- `content_format_rules.md` — car rental section template

---

### REQ-005: Car Rental Card Format in Markdown

**Description:** The car rental section must be rendered as a structured section within the anchor day file (first car day of each rental block). The format must be distinct from both POI cards and accommodation cards, using a `## 🚗` section heading and `### 🚗` option sub-headings.

**Acceptance Criteria:**
- [ ] AC-1: The car rental section appears in the anchor day file of each rental block
- [ ] AC-2: The section heading is `## 🚗 {localized_car_rental_label}` (e.g., "Аренда автомобиля" in Russian)
- [ ] AC-3: An intro paragraph states: rental period (pickup date to return date), total rental days, pickup/return location preference, transmission/fuel preferences, and notes about additional equipment
- [ ] AC-4: For each car category, a sub-heading `### 🚗 {localized_category_name}` introduces the comparison table
- [ ] AC-5: Below each comparison table, a brief recommendation note highlights the best-value option
- [ ] AC-6: Each rental company row in the table includes a booking link formatted as a clickable URL
- [ ] AC-7: The section placement within the anchor day file follows this order:
  1. Day header + schedule table
  2. POI cards
  3. Accommodation section (if anchor day for both — `## 🏨`)
  4. **Car rental section (`## 🚗`)** — NEW
  5. Daily budget table
  6. Grocery store
  7. Along-the-way stops
  8. Plan B
- [ ] AC-8: `### 🚗` headings are NOT POI headings — they are excluded from POI Parity Checks and do not generate `.poi-card` elements in HTML
- [ ] AC-9: All labels use the reporting language (localized)
- [ ] AC-10: A pro-tip section at the end covers: child seat regulations for the destination country, fuel policy tips, insurance recommendations

**Priority:** Must-have

**Affected components:**
- Phase B day generation (anchor day car rental section)
- `content_format_rules.md` — new car rental section template, section placement order update

---

### REQ-006: Booking Link Construction

**Description:** For each rental company option, the pipeline must construct a booking/search deep link that pre-fills the search with location, dates, and (where supported) vehicle category. This enables one-click access to the rental company's booking page.

**Acceptance Criteria:**
- [ ] AC-1: Each rental company option includes a clickable booking link
- [ ] AC-2: For major companies with predictable URL structures (Hertz, SIXT, Europcar, Enterprise, Avis, Budget), construct deep links pre-filling: pickup location, pickup date/time, return date/time
- [ ] AC-3: For aggregator fallbacks (rentalcars.com, kayak.com), construct search links with destination and dates pre-filled
- [ ] AC-4: Links open the rental company's search results or booking page — not a direct reservation (no authentication required)
- [ ] AC-5: The link label uses localized text (e.g., "Забронировать" / "Book" / "הזמנה") — distinct from the generic site link
- [ ] AC-6: When a deep link cannot be constructed (unknown URL structure), fall back to the company's homepage with the destination page if available

**Priority:** Must-have

**Affected components:**
- Phase B day generation (link construction)
- `content_format_rules.md` — car rental section template

---

### REQ-007: Budget Integration with Car Rental Costs

**Description:** Car rental costs must be integrated into the trip's budget structure, appearing both in the anchor day's daily budget and in the aggregate trip budget. The pattern mirrors accommodation budget integration.

**Acceptance Criteria:**
- [ ] AC-1: The anchor day's daily budget table (`### Стоимость дня`) includes a car rental line item showing the cost range across discovered options: lowest daily rate to highest daily rate, multiplied by rental days
- [ ] AC-2: The cost is labeled as an estimate (not confirmed pricing)
- [ ] AC-3: Subsequent car days within the same rental block do NOT duplicate the rental cost in their daily budget tables
- [ ] AC-4: Fuel cost estimates remain on each car day's budget table (fuel is per-day, not per-block)
- [ ] AC-5: The aggregate `budget_LANG.md` includes a "Car Rental" category row showing total estimated rental cost range for the entire trip (sum of all rental blocks)
- [ ] AC-6: If multiple car categories were compared, the budget uses the range from the cheapest option in the cheapest category to the most expensive option in the most expensive category
- [ ] AC-7: Both local currency and EUR amounts are shown, consistent with existing budget format
- [ ] AC-8: Additional equipment costs (child seats, GPS) are included as a separate line item when discoverable

**Priority:** Must-have

**Affected components:**
- Phase B day generation (budget table additions)
- Budget assembly (`budget_LANG.md`)
- `content_format_rules.md` — Budget Assembly section update

---

### REQ-008: Manifest Schema — Car Rental Metadata

**Description:** The manifest.json must be extended to track car rental blocks and their discovery status, enabling incremental edits and re-generation. The pattern mirrors the existing `accommodation` schema.

**Acceptance Criteria:**
- [ ] AC-1: The manifest includes a `car_rental` object at the top level (sibling to `languages` and `accommodation`) with this structure:
  ```json
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
  ```
- [ ] AC-2: `anchor_day` references the day file that contains the car rental section for this block
- [ ] AC-3: `categories_compared` lists the car categories for which comparison tables were generated
- [ ] AC-4: `companies_per_category` reflects the actual number of rental company options per category
- [ ] AC-5: `discovery_source` is `"web_search"` when discovered via research, `"aggregator_fallback"` when only aggregator links were available, or `"skipped"` if discovery failed
- [ ] AC-6: For trips with multiple non-adjacent car day groups, multiple entries exist in the `blocks` array

**Priority:** Should-have

**Affected components:**
- Phase A (manifest creation — car rental block identification)
- Phase B (manifest update after car rental discovery)
- `content_format_rules.md` — manifest.json schema section

---

### REQ-009: CEO Audit Checklist Addition

**Description:** The mandatory CEO Audit self-check must be extended to include car rental verification for anchor days that contain car rental sections.

**Acceptance Criteria:**
- [ ] AC-1: A new checklist item is added: "If this is the first day of a car rental block: does the car rental section contain a price comparison table per requested category with 2-3 company options, booking links, and cost estimates?"
- [ ] AC-2: The check is only evaluated on days where a car rental section is expected (first day of each rental block)
- [ ] AC-3: The check verifies that at least one option per category falls within the traveler's stated daily rental budget (if available)

**Priority:** Must-have

**Affected components:**
- `trip_planning_rules.md` — CEO Audit section

---

### REQ-010: HTML Rendering — Car Rental Card Type

**Description:** The HTML rendering pipeline (invoked via `/render` skill) must recognize car rental sections (identified by `## 🚗` section heading and `### 🚗` sub-headings) and render them as a distinct card type, visually differentiated from both POI cards and accommodation cards.

**Acceptance Criteria:**
- [ ] AC-1: The car rental section is rendered within a `<div class="car-rental-section">` (or equivalent class) in the HTML output
- [ ] AC-2: The section is visually distinct from `.poi-card` and `.accommodation-card`: a different accent color or border treatment (e.g., teal/green accent for mobility/transport theme)
- [ ] AC-3: Price comparison tables are rendered as styled HTML tables with clear column headers and alternating row colors
- [ ] AC-4: Booking links in the table are rendered as clickable buttons (not just inline links) — styled consistently with the Booking.com CTA buttons used for accommodation
- [ ] AC-5: The `## 🚗` section heading is rendered as a distinct section divider, grouping all car category tables
- [ ] AC-6: The section is responsive: tables scroll horizontally on mobile if needed, full-width on desktop
- [ ] AC-7: The rendering is language-agnostic: card structure, class names, and element identification do not depend on specific language strings
- [ ] AC-8: `### 🚗` headings do NOT produce `.poi-card` elements — they are excluded from POI counting logic

**Priority:** Must-have

**Affected components:**
- `/render` skill configuration (rendering_style_config.css, TripPage.ts markdown-to-HTML mapping)
- `content_format_rules.md` — HTML rendering notes for car rental

---

### REQ-011: Automation Test Coverage

**Description:** The regression test suite must validate car rental sections in generated trip HTML, covering presence, structure, link integrity, price comparison tables, and budget integration.

**Acceptance Criteria:**
- [ ] AC-1: A test verifies that the car rental section exists on the expected anchor day(s) when car days are present in the itinerary
- [ ] AC-2: A test verifies each car category sub-section contains a price comparison table with the expected column structure
- [ ] AC-3: A test verifies each comparison table contains 2-3 company rows with booking links
- [ ] AC-4: A test verifies booking links contain valid URL structures (not empty `href`, correct domain patterns for known rental companies or aggregators)
- [ ] AC-5: A test verifies the daily budget table on the anchor day includes a car rental line item
- [ ] AC-6: A test verifies the aggregate budget includes a car rental category
- [ ] AC-7: A test verifies that non-anchor car days do NOT contain a car rental section (no duplication)
- [ ] AC-8: All test assertions are language-agnostic: they check element presence, CSS classes, link patterns, table structure, and data attributes — never language-specific text content
- [ ] AC-9: A test verifies `### 🚗` headings are NOT counted as POI cards (POI parity check exclusion)

**Priority:** Must-have

**Affected components:**
- `TripPage.ts` — new page object methods for car rental elements
- Regression test specs
- `automation_rules.md` — test pattern documentation

---

### REQ-012: Language-Agnostic Content Generation

**Description:** All car rental content — section headings, category labels, table headers, descriptions, pro-tips — must be generated in the trip's reporting language. No English strings may be hardcoded in the output. The car rental section template must use localized labels throughout.

**Acceptance Criteria:**
- [ ] AC-1: The car rental section heading uses the reporting language
- [ ] AC-2: All table column headers (company, daily rate, total cost, booking link) use the reporting language
- [ ] AC-3: Car category names are localized (e.g., "Компакт" not "Compact" in Russian reports)
- [ ] AC-4: Price labels, estimate markers, and pro-tips are written in the reporting language
- [ ] AC-5: The booking link label is localized
- [ ] AC-6: If the trip is regenerated in a different language, car rental section in the new language file uses that language's labels

**Priority:** Must-have

**Affected components:**
- Phase B day generation
- `content_format_rules.md` — car rental section template localization notes

---

### REQ-013: Remove Overview Hardcoded Car Rental Recommendation

**Description:** The current Phase A overview includes a hardcoded `## 🚗 Рекомендация по аренде автомобиля` section with a single vehicle type, approximate cost, and passing company mentions. This must be replaced by the structured car rental section on the anchor day. The overview may retain a brief note that car rental details are in the anchor day, but must not duplicate the detailed comparison.

**Acceptance Criteria:**
- [ ] AC-1: The Phase A overview no longer contains a detailed car rental recommendation section with pricing and company names
- [ ] AC-2: The overview may include a brief one-line reference (e.g., "Car rental details: see Day 6") pointing to the anchor day
- [ ] AC-3: The anchor day's car rental section is the single source of truth for rental company options, pricing, and booking links
- [ ] AC-4: Existing trips are not retroactively modified — this applies to new trip generations only

**Priority:** Must-have

**Affected components:**
- Phase A overview generation logic
- `content_format_rules.md` — Phase A output section

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Car rental pricing varies significantly by booking date, season, and availability — web research provides estimates, not live quotes | Clearly label all prices as "indicative estimates" in cards and budget. Direct users to booking links for actual prices |
| Google Places `type=car_rental` has poor coverage for rental company comparison (returns physical branch locations, not fleet/pricing) | Use web search + web fetch instead of Google Places for car rental discovery. Google Places remains the source for accommodation only |
| Rental company website structures vary widely — deep link construction is not standardized like Booking.com | For major chains (Hertz, SIXT, Europcar, etc.), maintain known URL patterns. For others, fall back to aggregator links (rentalcars.com, kayak.com) which have consistent URL structures |
| Additional equipment pricing (child seats, GPS) may not be discoverable via web search | Include equipment in pro-tips with "verify at booking" language. Do not fabricate prices — only include when verifiable |
| Multi-category comparison (e.g., 3 categories x 3 companies = 9 rows) could make the section very long | Cap at 3 categories maximum in a single section. If the traveler selected more, group the most relevant 3 and note additional categories in the pro-tip |
| The `## Car Rental Assistance` section may contain categories not available at the destination | Note unavailability in the comparison table rather than silently omitting. Suggest the closest available alternative |
| Overlap with accommodation anchor day — a day could be anchor for both stay block and rental block | Section placement order is defined (accommodation before car rental). Both can coexist on the same day file |
| Prior accommodation integration (2026-03-29) must be stable before car rental follows the same pattern | Car rental follows the proven accommodation pattern — lower architectural risk. Implementation can proceed in parallel |
| Network dependency on web search during Phase B generation | Follows existing Network & Connectivity Rules (retry once, stop on second failure). Car rental discovery is non-blocking — trip generation continues without car rental section if network fails |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-04-02 | Approved |
