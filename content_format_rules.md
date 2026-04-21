# Content & Output Format Rules

## Trip Folder Structure (Modular Architecture)

Each trip is stored in its own timestamped folder under `generated_trips/`:

```
generated_trips/
  trip_YYYY-MM-DD_HHmm/           # Trip folder (one folder per trip, all languages inside)
    manifest.json                  # Trip metadata + day index + per-language state
    overview_LANG.md               # Phase A table (e.g., overview_ru.md, overview_en.md)
    accommodation_LANG.md          # Standalone hotel recommendations (one file per language)
    car_rental_LANG.md             # Standalone car rental recommendations (optional, one per language)
    day_00_LANG.md                 # Day 0 (e.g., day_00_ru.md)
    day_01_LANG.md                 # Day 1
    day_NN_LANG.md                 # One file per day per language
    budget_LANG.md                 # Aggregated budget
    trip_full_LANG.md              # Auto-assembled from all parts for that language
    trip_full_LANG.html            # Final HTML output for that language
```

### Naming Rules
- **Folder name:** `trip_YYYY-MM-DD_HHmm` — timestamp only. One folder holds all language variants of the same trip.
- **File language suffix:** Every content file includes a two-letter ISO 639-1 language code before the extension: `day_01_ru.md`, `day_01_en.md`, `overview_he.md`, `trip_full_ru.html`, etc. This ensures reports in different languages coexist without overwriting each other.
- **Language code mapping:** Russian → `ru`, English → `en`, Hebrew → `he`, German → `de`, French → `fr`, Spanish → `es`, etc. Derived from `language_preference.reporting_language` in the active trip details file.
- **Timestamping:** Always run `date +"%Y-%m-%d_%H%M"` via the Bash tool to determine the correct current local time.
- **Re-generation in another language:** When regenerating an existing trip in a different language, write new `_LANG` files into the **same** trip folder. The manifest tracks each language's state independently.
- **Day files:** `day_00_LANG.md` through `day_NN_LANG.md` — zero-padded two-digit day number + language code.
- **Legacy trips:** Older trips without language suffixes (e.g., `day_01.md`) are treated as the default language. New trips must use the `_LANG` suffix.

### manifest.json Schema

Created during Phase A, updated after Phase B. Combined example:

```json
{
  "trip_details_file": "trip_details.md",
  "destination": "Budapest, Hungary",
  "arrival": "2026-08-20",
  "departure": "2026-08-31",
  "total_days": 11,
  "created": "2026-03-15T09:00:00",
  "languages": {
    "ru": {
      "phase_a_complete": true,
      "days": {
        "day_00": { "status": "complete", "title": "Прилёт", "last_modified": "..." },
        "day_01": { "status": "pending", "title": "Остров Маргит", "last_modified": null }
      },
      "accommodation_complete": false,
      "car_rental_complete": false,
      "budget_complete": false,
      "assembly": { "trip_full_md_built": "...", "trip_full_html_built": "...", "stale_days": [] }
    }
  },
  "accommodation": {
    "stays": [{
      "id": "stay_01", "checkin": "2026-08-20", "checkout": "2026-08-31", "nights": 11,
      "area": "Budapest, Hungary", "anchor_day": "day_00",
      "options_count": 0, "discovery_source": "pending"
    }]
  },
  "car_rental": {
    "blocks": [{
      "id": "rental_01", "pickup_date": "2026-08-26", "return_date": "2026-08-27", "days": 2,
      "pickup_location": "Airport", "anchor_day": "day_06",
      "categories_compared": [], "companies_per_category": 0, "discovery_source": "pending"
    }]
  }
}
```

**Field semantics:**
- `trip_details_file`: Defaults to `"trip_details.md"` if absent. `languages` keyed by ISO 639-1; each language has independent state.
- `status`: `"pending"` | `"complete"`. Day keys = filenames without language suffix (e.g., `day_00` → `day_00_ru.md`).
- `stale_days`: Days modified after last assembly — triggers incremental rebuild. After editing, add day here + update `last_modified`.
- `checkin` = first night, `checkout` = morning after last night. `nights` = checkout − checkin.
- `accommodation_complete` / `car_rental_complete`: Track whether standalone files have been generated for this language.
- `options_count` / `companies_per_category`: `0` in Phase A, updated to 2-3 after Phase B.
- `discovery_source`: `"pending"` → `"google_places"` | `"web_search"` | `"aggregator_fallback"` | `"skipped"` | `"manual"`.
- `pickup_location`: From trip details `pickup_return`; defaults to accommodation area.
- `anchor_day`: Identifies which day's budget table includes the accommodation/car rental cost line item. Accommodation and car rental recommendation content is in standalone files, not in day files.
- `car_rental.blocks`: Empty `[]` when no car days. Multiple entries for non-adjacent car day groups.
- `stays` / `blocks`: Non-overlapping date ranges. Multi-stay/multi-block trips have multiple entries.

---

## Phase A: High-Level Summary

Provide a table with:
- Date/Day-of-week/Area.
- Morning/Lunch/Afternoon summary.
- **No day-number column:** Do NOT include a "День" / day-number column (0, 1, 2…). Use the date column as the primary row identifier.
- **No audit column:** Do NOT include any audit/status column (e.g., "Аудит", "CEO Audit", "✅ Pass"). The CEO Audit checklist is a silent internal self-check only — it must never appear in the overview table.

*Note: No links or prices in this phase.*

### Phase A Output

1. Create the trip folder: `generated_trips/trip_YYYY-MM-DD_HHmm/`.
2. Write `overview_LANG.md` (e.g., `overview_ru.md`) containing:
   - Trip title and subtitle (destination, dates, travelers with ages).
   - Holiday advisory (if applicable).
   - Phase A summary table.
3. Write `manifest.json` with `trip_details_file` set to the active trip details filename, the language key under `languages`, all days listed as `"pending"`, `phase_a_complete: true`.
4. Proceed directly to Phase B (do not wait for user approval).

> **Car rental note:** The Phase A overview must NOT contain a detailed car rental recommendation section with pricing and company names. Car rental recommendations are generated as a standalone file (`car_rental_LANG.md`) placed before the day-by-day content in the assembled report.

---

## Phase B: Detailed Operational Plan (Day-by-Day Generation)

Phase B generates **each day into its own file**, using parallel subagents in batches of 2 days each. This avoids output token limits and enables per-day editing.

### Generation Context per Day

When generating `day_XX_LANG.md`, load only:
1. The active trip details file — travelers, interests, schedule preferences.
2. `overview_LANG.md` — the Phase A master plan (for cross-day context).
3. The current day's row from the Phase A table.

Do NOT load other day files — Phase A provides all cross-day coordination.

> **Note:** The trip details file may contain optional `## Hotel Assistance` and `## Car Rental Assistance` sections at the end. These sections carry structured accommodation and vehicle preferences. They are **not consumed by day subagents** — instead, they are used after all day batches complete to generate standalone `accommodation_LANG.md` and `car_rental_LANG.md` files (see Standalone Accommodation & Car Rental Generation below). Day subagents do NOT generate `## 🏨` or `## 🚗` sections.

### Per-Day File Format

Each `day_XX_LANG.md` is self-contained and follows this structure:

```markdown
# День {N} — {Title} {Emoji}
**Дата:** {Day of week}, {Date}
**Район:** {Area}

### Расписание

| Время | Активность | Детали |
|-------|-----------|--------|
| ...   | ...       | ...    |
<!-- Quick food stops go as schedule rows, NOT ### POI sections (see trip_planning_rules.md §5) -->

---

### {POI Name 1}

📍 [Google Maps](https://maps.google.com/...)
🌐 [Сайт](https://...)
📸 [Фото Google](https://www.google.com/maps/place/...)
📞 Телефон: +36 1 234 5678
⭐ 4.5/5 (2,340 отзывов)
♿ Доступно для колясок
**place_id:** ChIJN1t_tDeuEmsRUsoyG83frY4
**Image:** https://upload.wikimedia.org/wikipedia/commons/thumb/...

{Full POI content per Content Guidelines below}

### {POI Name 2}
{Full POI content}

...

### Стоимость дня {N}

| Статья | HUF | EUR |
|--------|-----|-----|
| ...    | ... | ... |
| **Итого день {N}** | **...** | **...** |

### 🛒 Ближайший магазин
{Nearest supermarket(s) to the day's route — name, chain, walking distance from nearest POI, Google Maps link. This is a full POI section and MUST be rendered as a `poi-card` in HTML.}

### 🎯 По пути (опционально)
{1–2 optional kid-interest stops near the day's route. Each entry: POI name in `poi_languages`, one-line description, Google Maps link, which kid interest it matches. Rendered as `poi-card` elements in HTML with tag `🎯 ПО ПУТИ`.}

### 🅱️ Запасной план — {Name}
{Backup plan content}
```

> **Section placement order:** The template above shows all possible sections in their required order. The daily budget table follows POI cards directly. Accommodation and car rental sections are NOT part of day files — they are generated as standalone files (see below).

### Standalone Accommodation File (`accommodation_LANG.md`)

Accommodation recommendations are generated as a standalone file `accommodation_LANG.md` in the trip folder. This file is placed **before the day-by-day content** in the assembled report, allowing travelers to review lodging options before reading the daily itinerary.

**Section placement order within day files** (no accommodation/car rental — those are standalone):
1. Day header + schedule table
2. POI cards (### headings)
3. Daily budget table (### Стоимость дня) — anchor days still include accommodation/car budget line items
4. Grocery store (### 🛒)
5. Along-the-way stops (### 🎯)
6. Plan B (### 🅱️)
7. *(end of file)*

> **Rationale:** Placing accommodation and car rental at the beginning of the report matches the natural trip-planning decision order — travelers book lodging and vehicles before reviewing daily activities. Budget line items remain on anchor days for per-day cost context.

**Generation:** After all Phase B day batches complete, the main agent generates `accommodation_LANG.md` using the `## Hotel Assistance` section from the trip details file and Google Places lodging queries. If the `## Hotel Assistance` section is absent, sensible defaults are used (mid-range, city center, no pet requirement). Multi-stay trips include all stay blocks in a single file, separated by `---`.

**File format:**

```
## 🏨 {localized_accommodation_label}

{Intro line: stay period (check-in → check-out), number of nights. Note that options are sorted by price level.}

### 🏨 {Property Name in poi_languages}

📍 [Google Maps]({google_maps_url})
🌐 [{localized_website_label}]({website_url})
📸 [{localized_photos_label — always include "Google", e.g. "Фото Google" / "Google Photos" / "תמונות Google"}]({google_maps_place_url})
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
- Section heading: `##` (h2). Option cards: `### 🏨` (h3) — NOT POI headings (excluded from POI Parity Checks, no `.poi-card` in HTML).
- 3-5 cards ordered lowest to highest price level. Omit missing fields (no empty lines). All labels use reporting language.
- `💰` price level maps per `trip_planning_rules.md`. Booking.com link label must say "check prices" (e.g., "Проверить цены"), not "Сайт".

**Booking.com Deep Link Format:**
```
https://www.booking.com/searchresults.html?ss={hotel_name}+{destination}&checkin={checkin_date}&checkout={checkout_date}&group_adults={adult_count}&group_children={child_count}&age={child1_age}&age={child2_age}&age={child3_age}
```

- `{hotel_name}`: URL-encoded property name using `application/x-www-form-urlencoded` encoding (spaces → `+`, non-ASCII characters and reserved characters like `&`, `=`, `+` are percent-encoded as `%XX`). Example: `K%2BK+Hotel+Opera` for the hotel name `K+K Hotel Opera`.
- `{destination}`: URL-encoded destination city + country
- `{checkin_date}` / `{checkout_date}`: Stay block dates in `YYYY-MM-DD` format
- `{adult_count}`: Number of parents/adults from trip details travelers section
- `{child_count}`: Number of children from trip details travelers section
- `{age}`: Each child's age calculated at check-in date (same age calculation as pipeline Pre-Flight Setup)
- Multiple `age=` parameters, one per child

### Standalone Car Rental File (`car_rental_LANG.md`)

Car rental recommendations are generated as a standalone file `car_rental_LANG.md` in the trip folder. This file is placed **after accommodation and before the day-by-day content** in the assembled report. This file is only generated when `## Car Rental Assistance` is present in the trip details file — unlike accommodation, car rental is not a universal need and requires explicit preferences.

**Generation:** After all Phase B day batches complete (and after accommodation generation), the main agent generates `car_rental_LANG.md` using the `## Car Rental Assistance` section from the trip details file and web search queries. Multi-block trips include all rental blocks in a single file, separated by `---`.

**Section format:**

```
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

**Rules:**
- Section heading: `##` (h2). Category sub-sections: `### 🚗` (h3) — NOT POI headings (excluded from POI Parity Checks, no `.poi-card` in HTML).
- Table rows sorted by daily rate ascending. All labels localized. Estimate disclaimer italic.
- Max 3 categories. If >3 selected, prioritize most relevant, note others in pro-tip.

### Day Generation Protocol

Phase B generates days in parallel across multiple subagents, with each subagent handling **2 days**. Each day file is self-contained (Phase A provides all cross-day coordination), so days can be generated independently.

#### Step 1: Batch Assignment

The main agent divides all days (day_00 through day_NN) into contiguous batches of **2 days each**:

| Total Days (N) | Batch Count | Batch Size |
|---|---|---|
| 0 | 0 | — (skip Phase B, proceed to Budget) |
| 1 | 1 | 1 |
| 2+ | ceil(N/2) | 2 (last batch may have 1) |

Batches are assigned in chronological order: batch 1 gets the lowest-numbered days, batch 2 the next pair, etc. The last batch may contain 1 day (remainder). Every day must appear in exactly one batch -- no gaps, no overlaps.

**Example:** 12 days (day_00 through day_11), 6 batches:
- Batch 1: day_00, day_01
- Batch 2: day_02, day_03
- Batch 3: day_04, day_05
- Batch 4: day_06, day_07
- Batch 5: day_08, day_09
- Batch 6: day_10, day_11

#### Step 2: Parallel Subagent Execution

The main agent spawns one subagent per batch using the Agent tool. **All subagent calls must appear in the same response block** so they execute in parallel, not sequentially.

Each subagent receives this context:
1. `trip_planning_rules.md` — full trip planning rules. Phase A-only sections are marked *(Phase A only)* — skip them.
2. `content_format_rules_phaseB.md` — Phase B extract of content format rules (NOT the full `content_format_rules.md`).
3. The active trip details file — travelers, interests, schedule preferences.
4. `overview_LANG.md` — the Phase A master plan (for cross-day context).
5. The assigned day rows from the Phase A table (only the rows for this batch).
6. The trip folder path and language code.
7. The list of day numbers to generate (e.g., "Generate day_03, day_04, day_05").

Each subagent:
- Generates its assigned `day_XX_LANG.md` files following the Per-Day File Format and Per-Day Content Requirements (unchanged).
- Writes only its own day files to the trip folder.
- Does NOT write to `manifest.json`.
- Does NOT read or write day files outside its assigned range.

#### Step 3: Verification

After all subagents return, the main agent verifies that every expected day file (`day_00_LANG.md` through `day_NN_LANG.md`) exists on disk.

- If all files are present: proceed to Step 4.
- If any files are missing: identify the failed batch(es) and re-spawn one subagent per failed batch (single retry). After the retry, verify again:
  - If all files are now present: proceed to Step 4.
  - If files are still missing after retry: report the missing day numbers and their batch assignment. Do NOT proceed to Budget or Assembly.

#### Step 4: Manifest Update

Write `manifest.json` once with all days set to `"complete"`:
- Under `languages.LANG.days`, set every day's `status` to `"complete"` and `last_modified` to the current timestamp.
- This is a single write operation, not incremental.

#### Step 5: Proceed

After manifest is written, proceed to Budget and Assembly as normal.

### Per-Day Content Requirements

Each day file MUST include all of the following:

#### 1. Daily Route Map Link
- **Required** on every `day_XX_LANG.md` (including Day 0 and the final departure day — use airport as sole waypoint).
- **Placement:** Immediately **before** the `### Расписание` table (after the day banner/header, before the itinerary table).
- **Format (Markdown):**
  ```
  🗺️ [Открыть маршрут дня на Google Maps](https://www.google.com/maps/dir/POI1+Budapest/POI2+Budapest/.../)
  ```
- **URL construction:** `https://www.google.com/maps/dir/` followed by each POI name (spaces → `+`, append `+Budapest` or `+Budapest+Hungary`), separated by `/`. Include all POIs in visit order.
- **HTML rendering:** The `/render` skill maps this to `<a class="map-link" ...>`. When `maps_config.json` (project root) has a non-blank `google_maps_api_key` and the day has at least one POI with a `**place_id:**` line, the renderer replaces this markdown line with a `<div class="day-map-widget">` widget containing an embedded Google Maps canvas. The original route URL is preserved as a hidden fallback `<a class="map-link">` inside the widget, revealed automatically if the Maps JS API fails to load.

#### 2. Hourly Table (trip_context.daily_schedule)
- Structured schedule with specific arrival/departure times.
- Estimated travel times and walking distances between each spot.
- Brief description for each point.

#### 3. Universal Location Standards
For **EVERY** location mentioned (attractions, landmarks, parks, and restaurants):
- **Google Maps**: A direct link to the specific entrance or pin.
- **Official Website**: A link to the official site (or a reliable primary source like TripAdvisor if no site exists).
- **Photo Gallery**: A link to visual galleries to help the family identify the spot.
- **Phone number**: When available from Google Places or web fetch. Format per Per-Day File Format template.
- **Rating**: When available from Google Places. Format per Per-Day File Format template.

#### 4. Logistics & Accessibility
- Avoid advising public transport when start point is unknown.
- **Transportation**: Specific public transport lines (bus/tram/metro) or parking name with Google Maps link if a car is used.

#### 5. Detailed Operational Data
- **Verified Hours**: Confirmed for the specific dates of the visit.
- **Pricing**: Detailed breakdown (Adults / Children / Family) in both local currency and EUR.
- **Expert Notes**: Pre-booking requirements, expected crowd levels, tips for the youngest child.

#### 6. Daily Budget Table
- Pricing breakdown per POI/activity for that day.
- Day total in both local currency and EUR.

#### 7. Backup Plan (Plan B)
- At least one alternative activity for the day in case of weather/closures.

#### 8. Grocery Store (Nearest Supermarket)
- **Required** on every day (including Day 0). Format defined in Per-Day File Format template above.
- Rendered as `poi-card` in HTML (tag: `🛒 МАГАЗИН`).

#### 9. Optional Along-the-Way Stops
- **Required** on every full day (Day 0 / departure day exempt). Rules and criteria defined in `trip_planning_rules.md` § Pre-Flight Setup.
- Rendered as `poi-card` in HTML (tag: `🎯 ПО ПУТИ`).

---

## Content Guidelines for Trip Points
- **Point Descriptions:** For every location visited, provide a structured paragraph (approx. 3-4 sentences) that includes:
  1. **The Vibe:** An engaging opening that captures the atmosphere and "feel" of the location.
  2. **The Must-See:** One specific, high-impact detail or hidden corner we shouldn't miss.
  3. **The Family Factor:** Why this spot works specifically for the travelers.
  4. **The Pro-Tip:** One piece of actionable logistics (e.g., "Best visited at 4:00 PM for the lighting"). In HTML output, the `/render` skill maps this to `<div class="pro-tip">`.
- **Tone:** Evocative yet practical; avoid generic adjectives like 'beautiful' in favor of specific imagery.

---

## Standalone Accommodation & Car Rental Generation

After all Phase B day batches complete, generate the standalone accommodation and car rental files **before** budget assembly. These are generated by the main agent directly (not as subagents — they are single files with focused scope).

### Step 1: Generate `accommodation_LANG.md`

**Context needed:** Trip details file (`## Hotel Assistance` section), manifest (stay blocks with dates), content format rules (card format, booking link format).

- Use Google Places lodging queries parameterized by the Hotel Assistance preferences.
- If `## Hotel Assistance` is absent, use sensible defaults (mid-range, city center, no pet requirement).
- Multi-stay trips: include all stay blocks in one file, separated by `---`.
- Update manifest: set `languages.LANG.accommodation_complete: true` and update `accommodation.stays[].options_count` and `discovery_source`.

### Step 2: Generate `car_rental_LANG.md` (conditional)

**Context needed:** Trip details file (`## Car Rental Assistance` section), manifest (rental blocks with dates), content format rules (table format).

- Only generate if `## Car Rental Assistance` section exists in trip details.
- Use web search queries parameterized by the Car Rental Assistance preferences.
- Multi-block trips: include all rental blocks in one file, separated by `---`.
- Update manifest: set `languages.LANG.car_rental_complete: true` and update `car_rental.blocks[].categories_compared`, `companies_per_category`, and `discovery_source`.
- If no car rental preferences exist, skip this step and set `languages.LANG.car_rental_complete: true` (nothing to generate).

---

## Budget Assembly

After all days + accommodation + car rental are complete for a given language:
1. Read the `### Стоимость дня` section from each `day_XX_LANG.md`.
2. Write `budget_LANG.md` with:
   - Per-day summary (day number, title, day total in HUF and EUR).
   - Grand total across all days.
   - Category breakdown if possible (attractions, food, transport).

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

---

## Trip Assembly (Bash Command — No Subagent)

After all days + budget are complete for a given language, assemble `trip_full_LANG.md` using a single Bash command:

```bash
cd <trip_folder> && {
  cat overview_LANG.md
  [ -f accommodation_LANG.md ] && { printf '\n---\n\n'; cat accommodation_LANG.md; }
  [ -f car_rental_LANG.md ] && { printf '\n---\n\n'; cat car_rental_LANG.md; }
  for f in day_[0-9][0-9]_LANG.md; do printf '\n---\n\n'; cat "$f"; done
  printf '\n---\n\n'
  cat budget_LANG.md
} > trip_full_LANG.md
```

Replace `<trip_folder>` with the actual path and `LANG` with the language code (e.g., `ru`, `en`). The `[ -f ... ]` tests ensure graceful handling when accommodation or car rental files don't exist.

After the file is written, update `manifest.json`: under `languages.LANG.assembly`, set `trip_full_md_built` timestamp, clear `stale_days`.

**This is a mechanical concatenation** — no LLM generation needed. Execute via Bash tool directly, never as a subagent.

---

## Incremental Edit Workflow

When the user requests changes to a specific day (within a given language):

1. **Regenerate** only the affected `day_XX_LANG.md`.
2. **Update manifest:** under `languages.LANG`, set `last_modified` on the changed day, add to `stale_days`.
3. **Re-assemble** `trip_full_LANG.md` (mechanical concat — fast).
4. **Rebuild HTML** — Invoke `/render` skill in incremental mode (rebuilds only changed day fragments).
5. **Run validation** — Invoke `/regression` skill for targeted validation on changed day.

---

## HTML Export Workflow
- **Trigger:** Whenever asked to "create an HTML page," "export to HTML," or "generate the web view."
- **Action:** Invoke the `/render` skill. It handles source discovery, fragment generation, assembly, and pre-regression validation.
- **Output:** `trip_full_LANG.html` inside the trip folder (e.g., `trip_full_ru.html`).
