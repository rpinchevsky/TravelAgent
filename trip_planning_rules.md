# Trip Planning Rules

## Pre-Flight Setup (Mandatory)
Before any planning or answering, perform these steps:
1. **Data Retrieval:** Read the active trip details file (as specified at pipeline invocation; defaults to `trip_details.md`).
2. **Age Calculation:** Calculate the exact age of each traveler at the time of `trip_context.timing.arrival`.
   - Use these calculated ages for all "Age Filters" and the "Kids' Fun Index."
   - *Example:* If the youngest is calculated as 4, apply the 4-year-old safety/engagement rules.
3. **Language:** Use languages from `language_preference`.
4. **POI:** All points of interest shall use languages from `language_preference.poi_languages` — this applies **everywhere** the POI name appears: POI card headings, activity labels in itinerary tables (including restaurants, stations, and any named location in the Activity column), and any other reference. Format per `poi_languages` order, separated by ` / `.
    - **Optional Along-the-Way Stops (Mandatory per day):** For each day, identify 1–2 places from `kids_interests` that are geographically close to the day's route (within 5–10 min detour). Present them as a dedicated `### 🎯 По пути` section in the day file — not embedded inside other POI cards. Each optional stop must include: name (in `poi_languages`), one-line description, Google Maps link, and why it fits the kids' interests. These are "bonus" stops the family can grab if energy/time allows.

---

## Data Source Hierarchy

The trip generation pipeline uses a two-layer data source approach for POI details:

### Layer 1: Web Search & Fetch (Primary)
- Web search discovers POIs, gets narrative descriptions, pro-tips, and family-specific context.
- Web fetch retrieves official websites, photo galleries, and pricing.
- This layer provides the creative and contextual content that makes each POI description unique.

### Layer 2: Google Places API (Enrichment & Validation)
- After web fetch, query Google Places for each POI using `search_places(name, location)` → `get_place_details(place_id)`.
- Google Places provides structured fields: **phone number**, **rating** (with review count), **wheelchair accessibility**, verified hours, verified website URL.
- **Precedence rule:** For structured fields (hours, website URL, phone, rating), Google Places data takes precedence over web fetch when both are available.
- **Scope limitation:** Google Places does NOT replace web fetch for narrative content (descriptions, pro-tips, family-specific notes, photo gallery links) — only for structured fields.
- **Graceful degradation:** If Google Places MCP is not configured or a place is not found, the pipeline continues with web fetch data only. Phone and rating fields are omitted (not rendered as empty).
- **Default wheelchair behavior:** If the trip details file does not contain a `Wheelchair accessible` field, treat as `wheelchair accessible: no`.

### Layer 2a: Google Places API (Accommodation Discovery)
- For stay-block anchor days, query Google Places with `type=lodging` to discover accommodation options.
- Uses the same MCP tool (`mcp__google-places__maps_search_places` → `mcp__google-places__maps_place_details`) as POI enrichment.
- Provides: property name, rating, review count, price level, address, Google Maps link, phone, website, photos.
- **Precedence rule:** Same as Layer 2 — Google Places structured fields take precedence over other sources.
- **Graceful degradation:** Same as Layer 2 — if MCP unavailable or place not found, skip accommodation section. Trip generation continues without accommodation cards.

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

**Booking Link URL Patterns (Data-Driven Reference):**

| Company | URL Pattern | Pre-filled Parameters |
|---|---|---|
| SIXT | `https://www.sixt.com/car-rental/{city}/?{params}` | `pickup_date`, `return_date`, `pickup_station` |
| Hertz | `https://www.hertz.com/rentacar/reservation/?{params}` | `pickUpDate`, `returnDate`, `pickUpLocationCode` |
| Europcar | `https://www.europcar.com/en/car-hire/results?{params}` | `pickupDate`, `returnDate`, `pickupLocation` |
| Enterprise | `https://www.enterprise.com/en/car-rental/results.html?{params}` | `pickupdate`, `returndate`, `pickuplocation` |
| Avis | `https://www.avis.com/en/reserve?{params}` | `pickUpDate`, `returnDate`, `loc` |
| Budget | `https://www.budget.com/en/reserve?{params}` | `pickUpDate`, `returnDate`, `loc` |

**Aggregator fallback URL patterns:**

| Aggregator | URL Pattern |
|---|---|
| rentalcars.com | `https://www.rentalcars.com/search-results?location={destination}&pick_date={pickup}&drop_date={return}` |
| kayak.com | `https://www.kayak.com/cars/{destination}/{pickup}/{return}` |
| autoeurope.com | `https://www.autoeurope.com/go/results/?{params}` |

**URL construction rules:**
- Dates in URL use ISO format (YYYY-MM-DD) or the format required by the specific company's URL pattern.
- Location codes are destination-specific — use web fetch to discover the correct location code for the destination.
- When a deep link cannot be reliably constructed, fall back to the company's homepage or destination-specific landing page.
- All links use `target="_blank" rel="noopener noreferrer"`.

---

## Strategic Planning Logic

### 1. The Interest Hierarchy
- **Primary:** Prioritize `trip_context.universal_interests`. These are the "must-haves" for the family unit.
- **Secondary — Shared Kids:** Use the `### Kids Interests` section (shared across all children) to identify kid-focused activities that complement Universal Interests. These inform along-the-way stops (§ `По пути`) and backup plans.
- **Tertiary — Per-Child:** Look for opportunities to weave in `travelers.children[].specific_interests` (per-child column in the Children table) if they are geographically close to a Primary activity.
- **Conflict Resolution:** If a "Universal" interest and a "Specific" interest conflict, prioritize the "Universal" activity but mention the "Specific" one as an alternative or quick stop.
- **Avoidance:** Avoid `trip_context.places_to_avoid`. Those are places that you shall avoid during your trip creation.
- **The "Only Here" Rule:** Search for attractions that exist only in this city or country.

### 2. "Only Here" Research Gate (Mandatory)
After initial itinerary draft, perform a dedicated research pass:
1. Search: "[destination] unique attractions NOT found elsewhere + [each child's specific_interests]"
2. Search: "[destination] endemic experiences families children animals/trains/etc"
3. Cross-reference both `### Kids Interests` (shared) and each traveler's per-child `specific_interests` against results
4. Replace generic POIs (soft play, generic mall) with "Only Here" alternatives

**Priority order:** "Only Here" POI > Universal Interest match > Generic attraction

### 3. The "Age-Appropriate" Filter
- **Safety:** Every activity must be safe for the *calculated* age of the youngest child.
- **Pace:** Adhere strictly to the `pace_preference`. Note: `pace_preference` controls the *tempo* between activities (no rushing, buffer time), NOT the number of POIs per day. Each full day should target 4–5 POI cards (attractions + sit-down restaurants + secondary stops); hard minimum is 3 (see CEO Audit). Quick snacks and street food do not count toward this target (see §5 Culinary Selection).
- **Movement:** Prioritize according to `universal_interests` and `specific_interests` of persons in trip.

### 4. Geographic Clustering (Zero Waste Time)
- Keep morning, lunch, and afternoon activities within a 15–35 minute travel radius.
- Group "Car Rental" days consecutively in the schedule to optimize costs.

### 5. Culinary Selection
- Match restaurants to `culinary_profile.dietary_style` and `must_haves`.
- Respect `vibe_preference` (e.g., casual/loud/outdoor).
- Strictly avoid anything in `dislikes_or_avoid`.
- If there are michelin restaurants that might be good fit for us, please advice and put special svg. Always provide alternative to micheline restaurant.
- **Sit-down vs. grab-and-go distinction:**
  - **Sit-down restaurants** (meals where the family sits for 30+ minutes) → full `###` POI section with hours, prices, links, pro-tip.
  - **Quick snacks / street food / grab-and-go** (kürtőskalács stand, gelato cart, lángos window, etc.) → do NOT create a separate POI card. Instead, mention inline in the schedule table's "Детали" column (e.g., `Édes Mackó — kürtőskalács на углях, ~1 500 HUF`) or as a pro-tip inside the nearest POI card. Include a Google Maps link in the details text if available.

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

---

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
7. **Construct booking deep links** for each company (see Layer 2b Booking Link URL Patterns table for URL patterns).
8. **Write car rental section** in the anchor day's markdown file (see content_format_rules.md for template).
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

---

## Environmental & Event Intelligence
If `Google Search` detects a local holiday, major festival, or "bridge day" during the `trip_context.timing`:

### 1. Identify "Family-First" Programming
- Actively search for `trip_context.destination` + `[Identified Holiday]` + "children's activities" or "interactive workshops".
- Prioritize events that align with the `trip_context.universal_interests` found in the active trip details file.

### 2. Infrastructure & Mobility Alert
- Identify specific closures of **Bridges**, **Main Squares**, or **Transit Hubs** due to festivities.
- If closures are detected, override the standard "Car Rental" logic and provide a specific "Walking/Metro" route for those 24–48 hours.

### 3. Strategic Crowd Management
- Cross-reference the holiday dates with the trip's duration.
- Automatically schedule "Iconic Landmarks" (e.g., Parliament, Royal Palaces) for non-holiday weekdays.
- During peak holiday hours, suggest high-capacity "Event Zones" (parks, festival grounds) that are designed to handle crowds.

### 4. Impact Summary
Always include a "Holiday Advisory" note explaining:
- **Closures:** (e.g., "Grocery stores closed on X date").
- **Atmosphere:** (e.g., "Expect high noise/festivity in specific districts").

---

## Research & Quality Control

### Live Verification
- Use `Google Search` to confirm opening hours, prices, and special events for the specific `trip_context.timing`.
- Search for "local secrets" (hidden playgrounds, non-tourist stalls) in the specific neighborhood being planned.
- **Google Places Enrichment (Mandatory per POI):** After web-fetching a POI, query Google Places to collect:
  - **Phone number:** Include in the POI card when available (see content_format_rules.md for format).
  - **Rating:** Numeric rating out of 5 with review count. Include in the POI card when available.
  - **Wheelchair accessibility:** When `wheelchair accessible: yes` is set in trip details, verify each POI's accessibility via Google Places. Accessible POIs receive a `♿` indicator. Inaccessible POIs must be replaced with accessible alternatives or explicitly flagged with a warning note.
- **Permanently Closed POI Gate (Blocking):** During Phase B research, if a POI is discovered to be permanently closed (via Google Places `business_status`, web search, or official website), it must **not** appear in the report. Replace it with an alternative POI in the same area that serves the same interest category. This check applies to all POI types: attractions, restaurants, stores, and along-the-way stops.

### CEO Audit (Mandatory)
Before presenting any "Day" to the user, you must pass this self-check:
- [ ] Is it age-appropriate for the youngest (based on calculated age)?
- [ ] Does it hit at least one Universal Interest?
- [ ] **POI Minimum Count:** Does this full day have at least 3 POI cards (attractions + restaurants + secondary stops)? Arrival/departure days are exempt. If a day has fewer than 3 POIs, add more POIs from the area before proceeding. This is a **blocking** check — do not write the day file until it passes.
- [ ] Provide additional options in area if we won't like some of advised POI.
- [ ] Is the logistics/transportation plan efficient?
- [ ] Does the number of POI cards in the HTML match the number of `###` POI sections in the markdown for this day? (POI Parity Check)
- [ ] If this is the first day of a stay block: does the accommodation section contain 2-3 options with complete cards (name, rating, maps link, booking link, price level)? Does at least one option's price level align with the traveler's stated budget preference (if available)?
- [ ] If this is the first day of a car rental block: does the car rental section contain a price comparison table per requested category with 2-3 company options, booking links, and cost estimates? Does at least one option per category fall within the traveler's stated daily rental budget (if available)?
- [ ] If `wheelchair accessible: yes` is set in trip details: are all POIs verified for wheelchair accessibility? Are inaccessible POIs flagged or replaced?

For Plan B provide what might be the reason to use that plan. Output of Plan B shall follow same rules and format as planned points of interest.
- This part is for travel agent validation, no need to share results of the review.

---

## Technical Instruction
- Always verify if a location is closed on the specific day of the week (e.g., many museums close on Mondays).
- If information is missing, ask the user rather than guessing.
- For any internet-dependent research (Google Search, WebFetch), follow the **Network & Connectivity Rules** in `CLAUDE.md`.
