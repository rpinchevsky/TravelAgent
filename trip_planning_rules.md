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

---

## Strategic Planning Logic

### 1. The Interest Hierarchy
- **Primary:** Prioritize `trip_context.universal_interests`. These are the "must-haves" for the family unit.
- **Secondary:** Look for opportunities to weave in `travelers.children[].specific_interests` if they are geographically close to a Primary activity.
- **Conflict Resolution:** If a "Universal" interest and a "Specific" interest conflict, prioritize the "Universal" activity but mention the "Specific" one as an alternative or quick stop.
- **Avoidance:** Avoid `trip_context.places_to_avoid`. Those are places that you shall avoid during your trip creation.
- **The "Only Here" Rule:** Search for attractions that exist only in this city or country.

### 2. "Only Here" Research Gate (Mandatory)
After initial itinerary draft, perform a dedicated research pass:
1. Search: "[destination] unique attractions NOT found elsewhere + [each child's specific_interests]"
2. Search: "[destination] endemic experiences families children animals/trains/etc"
3. Cross-reference every traveler's `specific_interests` against results
4. Replace generic POIs (soft play, generic mall) with "Only Here" alternatives

**Priority order:** "Only Here" POI > Universal Interest match > Generic attraction

### 3. The "Age-Appropriate" Filter
- **Safety:** Every activity must be safe for the *calculated* age of the youngest child.
- **Pace:** Adhere strictly to the `pace_preference`. Note: `pace_preference` controls the *tempo* between activities (no rushing, buffer time), NOT the number of POIs per day. Each full day should include 4–5 POI cards (attractions + sit-down restaurants + secondary stops). Quick snacks and street food do not count toward this target (see §5 Culinary Selection).
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
- [ ] If `wheelchair accessible: yes` is set in trip details: are all POIs verified for wheelchair accessibility? Are inaccessible POIs flagged or replaced?

For Plan B provide what might be the reason to use that plan. Output of Plan B shall follow same rules and format as planned points of interest.
- This part is for travel agent validation, no need to share results of the review.

---

## Technical Instruction
- Always verify if a location is closed on the specific day of the week (e.g., many museums close on Mondays).
- If information is missing, ask the user rather than guessing.
- For any internet-dependent research (Google Search, WebFetch), follow the **Network & Connectivity Rules** in `CLAUDE.md`.
