# Trip Planning Rules — Phase B Extract

> **Subset of `trip_planning_rules.md` for Phase B day-generation subagents.** Excludes Phase A-only sections. Keep in sync.

## Pre-Flight Setup (Mandatory)
1. Read the active trip details file (default: `trip_details.md`).
2. Calculate each traveler's exact age at `trip_context.timing.arrival`. Use for all age filters and Kids' Fun Index.
3. Use `language_preference` for all output; `poi_languages` for all POI names everywhere (headings, table cells, any reference) — format per order, separated by ` / `.
4. **Along-the-Way Stops (Mandatory per day):** 1–2 places from `kids_interests` within 5–10 min detour of the day's route. Present as a dedicated `### 🎯 По пути` section — not embedded in POI cards. Each stop: name (poi_languages), one-line description, Google Maps link, interest fit.

---

## Data Source Hierarchy

> **Graceful degradation:** If any discovery source fails after one retry, omit that section and set `discovery_source: "skipped"` in manifest. Discovery is non-blocking. Omit missing fields — don't render empty.

| Layer | Source | Purpose |
|---|---|---|
| 1 | Web Search + Fetch | Narrative content: descriptions, pro-tips, family context, photos, pricing |
| 2 | Google Places | Structured fields: phone, rating, wheelchair accessibility, verified hours/website. Takes precedence over Layer 1 for structured fields. |
| 2a | Google Places (`type=lodging`) | Accommodation discovery for stay-block anchor days |
| 2b | Web Search + Fetch | Car rental discovery — Google Places `type=car_rental` is insufficient for fleet/pricing data |
| 2c | Inline image URL | One publicly accessible image per POI (`**Image:** <url>`), after links/rating block. Wikimedia Commons preferred (thumbnail format). **WebSearch only — never WebFetch Wikimedia pages** (triggers IP 429, breaks all images). If no suitable image found, omit the `**Image:**` line entirely. |

**Default wheelchair:** If trip details has no `Wheelchair accessible` field, treat as `no`.

---

## Strategic Planning Logic

### Interest Hierarchy
- **Primary:** `universal_interests` — must-haves for the family unit.
- **Secondary:** Shared `### Kids Interests` — kid-focused activities; inform `По пути` stops and backup plans.
- **Tertiary:** `travelers.children[].specific_interests` — weave in when geographically close to a Primary activity.
- **Conflict:** Universal wins; mention Specific as alternative or quick stop.
- **Avoidance:** Exclude `places_to_avoid`.
- **"Only Here" Rule:** Prioritize attractions unique to this city/country.

### "Only Here" Research Gate (Mandatory)
After initial draft, run a dedicated research pass:
1. Search: `[destination] unique attractions NOT found elsewhere + [each child's specific_interests]`
2. Search: `[destination] endemic experiences families children [interests]`
3. Cross-reference both shared `### Kids Interests` and per-child `specific_interests` against results. Replace generic POIs (soft play, generic mall) with results.

**Priority:** "Only Here" POI > Universal Interest match > Generic attraction

### Age-Appropriate Filter
- **Safety:** Every activity must be safe for the youngest (calculated age).
- **Pace:** Follow `pace_preference` (controls tempo between activities, not POI count). Each full day targets **4–5 POI cards** (attractions + sit-down restaurants + secondary stops); hard minimum 3 (see CEO Audit). Quick snacks/street food don't count.
- **Movement:** Prioritize per `universal_interests` and `specific_interests`.

### Geographic Clustering
- Keep morning, lunch, and afternoon activities within 15–35 min travel radius.
- Group car rental days consecutively to optimize costs.

### Culinary Selection
- Match `culinary_profile.dietary_style` and `must_haves`. Respect `vibe_preference`. Strictly avoid `dislikes_or_avoid`.
- Flag Michelin options (special SVG) when a good fit; always provide an alternative.
- **Sit-down** (30+ min): full `###` POI card with hours, prices, links, pro-tip.
- **Grab-and-go / snacks:** mention inline in schedule table "Детали" column or as a pro-tip in the nearest POI card — no separate POI card.

---

## Accommodation Discovery (Anchor Day Only)

1. **Parse** `## Hotel Assistance`: accommodation_type, location_priority, quality_level, must_have_amenities, pets, daily_budget, cancellation_preference. Defaults if absent: mid-range, city center, no pets, no amenity filter.
2. **Search** `maps_search_places` — query: `"{accommodation_type} {stay_area}"`, type: `lodging`. Adjust center per `location_priority` (center=historic, attractions=tourist district, transport=main station, quiet=residential, beach=waterfront).
3. **Filter:** exclude CLOSED_PERMANENTLY/CLOSED_TEMPORARILY; hard-filter on `daily_budget` vs `price_level`; if `pets=Yes`, annotate "verify pet policy with property."
4. **Select** 2–3 options at different price points. If <2 remain after filtering, broaden to city-level and retry once.
5. **Enrich** via `maps_place_details`: name, address, rating, review count, price_level, website, phone, maps URL.
6. **Construct** Booking.com deep link per option (see `content_format_rules_phaseB.md`).
7. **Write** accommodation section (see `content_format_rules_phaseB.md` for card template).

**Price level mapping:** Destination-aware, not hardcoded. Example (Budapest): 0=Free, 1=Budget (15K–25K HUF / 38–63€), 2=Mid (25K–50K / 63–125€), 3=Up (50K–90K / 125–225€), 4=Lux (90K+ / 225€+). If `price_level` absent, omit line and note "check Booking.com link."

---

## Car Rental Discovery (Anchor Day Only)

1. **Parse** `## Car Rental Assistance`: car_category, transmission, fuel_type, pickup_return, additional_equipment, daily_rental_budget. **If section absent, skip entirely** — no tables, no budget line items, no web search. Set `discovery_source: "skipped"`.
2. **Search** for each category (max 3): `"car rental {destination} {month} {year} {category} {transmission}"`. Identify 2–3 companies per category.
3. **Fetch** each company for daily rate, total cost for rental period, booking URL.
4. **Filter:** apply transmission/fuel preferences when data supports it; apply pickup/return preference when branch data is available.
5. **Budget soft filter:** deprioritize options outside range; don't exclude unless 3+ options remain within range.
6. **Include** a direct booking/search URL for each company as discovered via web fetch.
7. **Write** car rental section (see `content_format_rules_phaseB.md` for template).

---

## Environmental & Event Intelligence

If a local holiday, festival, or bridge day falls during `trip_context.timing`:
- **Family programming:** Search `[destination] + [holiday] + "children's activities"`. Prioritize alignment with `universal_interests`.
- **Infrastructure alerts:** Identify bridge/square/transit closures. If found, override car rental logic with walking/metro route for those 24–48 hours.
- **Crowd management:** Schedule iconic landmarks for non-holiday weekdays. During peak hours, suggest high-capacity event zones (parks, festival grounds).
- **Holiday Advisory note (always include):** List closures (e.g., "grocery stores closed X date") and atmosphere (e.g., "high noise/festivity in Y district").

---

## Research & Quality Control

### Search Persistence (Mandatory)
Before marking any data "not found," attempt **3 distinct queries** with different terms:
1. English/standard name
2. Local language name (e.g., "Stari Grad Budva" instead of "Budva Old Town")
3. Broader category or combined with destination / "Wikimedia Commons" / "Wikipedia"

Applies to: images (**max 2 WebSearch, no WebFetch on Wikimedia**), phone numbers, ratings, hours, prices, and any other POI field. A connectivity failure after 1 retry is separate from an empty search result — see Network & Connectivity Rules in `CLAUDE.md`.

### Live Verification
- Confirm hours, prices, and events for the specific `trip_context.timing` dates.
- Search for "local secrets" (hidden playgrounds, non-tourist stalls) in the specific neighborhood.
- **Google Places enrichment (mandatory per POI):** phone number, rating with review count, wheelchair accessibility.
- **Permanently Closed Gate (Blocking):** If a POI is discovered permanently closed (via Google Places `business_status`, web search, or official site), replace it with an alternative in the same area serving the same interest. Applies to all POI types.

### CEO Audit (Mandatory — internal, not shared with user)
- [ ] Age-appropriate for youngest (calculated age)?
- [ ] Hits at least one Universal Interest?
- [ ] **≥3 POI cards** (attractions + sit-down restaurants + secondary stops)? Arrival/departure days exempt. **Blocking — do not write the day file until passed.**
- [ ] Additional options provided if traveler dislikes a POI?
- [ ] Logistics/transportation plan efficient?
- [ ] POI card count in HTML matches `###` sections in markdown? (Parity Check)
- [ ] Accommodation anchor day: 2–3 complete cards; ≥1 matching budget preference?
- [ ] Car rental anchor day: price comparison table per category, 2–3 companies, booking links, cost estimates; ≥1 within daily rental budget?
- [ ] If `wheelchair accessible: yes`: all POIs verified; inaccessible ones flagged or replaced?

Plan B must include a reason for use and follow the same rules and format as primary POIs.

---

## Technical Instructions
- Verify each location is open on the specific day of the week (many museums close Mondays).
- If information is missing, ask the user — do not guess.
- For internet-dependent research, follow **Network & Connectivity Rules** in `CLAUDE.md`.
