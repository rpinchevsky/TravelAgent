# Content & Output Format Rules

## Trip Folder Structure (Modular Architecture)

Each trip is stored in its own timestamped folder under `generated_trips/`:

```
generated_trips/
  trip_YYYY-MM-DD_HHmm/           # Trip folder (one folder per trip, all languages inside)
    manifest.json                  # Trip metadata + day index + per-language state
    overview_LANG.md               # Phase A table (e.g., overview_ru.md, overview_en.md)
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

Created during Phase A, updated after all days are generated (see Day Generation Protocol):

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
        "day_00": { "status": "complete", "title": "Прилёт", "last_modified": "2026-03-15T09:05:00" },
        "day_01": { "status": "complete", "title": "Остров Маргит", "last_modified": "2026-03-15T09:08:00" },
        "day_02": { "status": "pending", "title": "Варошлигет", "last_modified": null }
      },
      "budget_complete": false,
      "assembly": {
        "trip_full_md_built": "2026-03-15T09:30:00",
        "trip_full_html_built": "2026-03-15T09:45:00",
        "stale_days": []
      }
    }
  }
}
```

**Field rules:**
- `trip_details_file` — the filename of the trip details source file used to generate this trip (e.g., `"trip_details.md"`, `"Maryan.md"`). Defaults to `"trip_details.md"` if absent (backward compatibility with older manifests). Written during Phase A manifest creation.
- `languages` — keyed by ISO 639-1 code. Each language has its own `phase_a_complete`, `days`, `budget_complete`, and `assembly` state. Adding a new language creates a new key (e.g., `"en": { ... }`).
- `days` keys match filenames without the language suffix (e.g., `day_00` → `day_00_ru.md`).
- `status` values: `"pending"` | `"complete"`.
- `title` is populated from the Phase A overview table.
- `stale_days` lists any days modified after the last full assembly — triggers incremental rebuild.
- After editing a day, add it to `stale_days` and update its `last_modified`.

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

---

## Phase A: High-Level Summary

Provide a table with:
- Date/Day-of-week/Area.
- Morning/Lunch/Afternoon summary.
- CEO Audit Status (pass/fail).
- **No day-number column:** Do NOT include a "День" / day-number column (0, 1, 2…). Use the date column as the primary row identifier.

*Note: No links or prices in this phase.*

### Phase A Output

1. Create the trip folder: `generated_trips/trip_YYYY-MM-DD_HHmm/`.
2. Write `overview_LANG.md` (e.g., `overview_ru.md`) containing:
   - Trip title and subtitle (destination, dates, travelers with ages).
   - Holiday advisory (if applicable).
   - Phase A summary table.
3. Write `manifest.json` with `trip_details_file` set to the active trip details filename, the language key under `languages`, all days listed as `"pending"`, `phase_a_complete: true`.
4. Proceed directly to Phase B (do not wait for user approval).

---

## Phase B: Detailed Operational Plan (Day-by-Day Generation)

Phase B generates **each day into its own file**, using parallel subagents for faster execution. This avoids output token limits and enables per-day editing.

### Generation Context per Day

When generating `day_XX_LANG.md`, load only:
1. The active trip details file — travelers, interests, schedule preferences.
2. `overview_LANG.md` — the Phase A master plan (for cross-day context).
3. The current day's row from the Phase A table.

Do NOT load other day files — Phase A provides all cross-day coordination.

> **Note:** The trip details file may contain optional `## Hotel Assistance` and `## Car Rental Assistance` sections at the end. These sections carry structured accommodation and vehicle preferences. The `## Hotel Assistance` section **is consumed** by the accommodation discovery logic: on anchor days (the first day of each stay block), the subagent parses this section to parameterize Google Places lodging queries and annotate accommodation cards. If the section is absent, sensible defaults are used (mid-range, city center, no pet requirement). The `## Car Rental Assistance` section is not currently consumed (future enhancement). Its presence does not affect existing generation behavior.

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
<!-- Quick food stops (street food, grab-and-go snacks) go here as schedule rows,
     NOT as separate ### POI sections. Example:
     | 14:00 | 🍩 Кюртёшкалач | Édes Mackó — дымковый торт на углях, ~1 500 HUF 📍 [Maps](link) |
     The "Детали" column carries the venue name, one-line description, price, and optional Maps link. -->

---

### {POI Name 1}

📍 [Google Maps](https://maps.google.com/...)
🌐 [Сайт](https://...)
📸 [Фото](https://...)
📞 Телефон: +36 1 234 5678
⭐ 4.5/5 (2,340 отзывов)
♿ Доступно для колясок

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

- `{hotel_name}`: URL-encoded property name using `application/x-www-form-urlencoded` encoding (spaces → `+`, non-ASCII characters and reserved characters like `&`, `=`, `+` are percent-encoded as `%XX`). Example: `K%2BK+Hotel+Opera` for the hotel name `K+K Hotel Opera`.
- `{destination}`: URL-encoded destination city + country
- `{checkin_date}` / `{checkout_date}`: Stay block dates in `YYYY-MM-DD` format
- `{adult_count}`: Number of parents/adults from trip details travelers section
- `{child_count}`: Number of children from trip details travelers section
- `{age}`: Each child's age calculated at check-in date (same age calculation as pipeline Pre-Flight Setup)
- Multiple `age=` parameters, one per child

### Day Generation Protocol

Phase B generates days in parallel across multiple subagents for faster wall-clock execution. Each day file is self-contained (Phase A provides all cross-day coordination), so days can be generated independently.

#### Step 1: Batch Assignment

The main agent divides all days (day_00 through day_NN) into contiguous batches:

| Total Days (N) | Batch Count | Batch Size |
|---|---|---|
| 0 | 0 | — (skip Phase B, proceed to Budget) |
| 1 | 1 | 1 |
| 2-3 | 2 | ceil(N/2) |
| 4-11 | 3 | ceil(N/3) |
| 12+ | 4 | ceil(N/4) |

Batches are assigned in chronological order: batch 1 gets the lowest-numbered days, batch 2 the next range, etc. The last batch may contain fewer days (remainder). Every day must appear in exactly one batch -- no gaps, no overlaps.

**Example:** 12 days (day_00 through day_11), 4 batches:
- Batch 1: day_00, day_01, day_02
- Batch 2: day_03, day_04, day_05
- Batch 3: day_06, day_07, day_08
- Batch 4: day_09, day_10, day_11

#### Step 2: Parallel Subagent Execution

The main agent spawns one subagent per batch using the Agent tool. **All subagent calls must appear in the same response block** so they execute in parallel, not sequentially.

Each subagent receives this context:
1. The active trip details file -- travelers, interests, schedule preferences.
2. `overview_LANG.md` -- the Phase A master plan (for cross-day context).
3. The assigned day rows from the Phase A table (only the rows for this batch).
4. The trip folder path and language code.
5. The list of day numbers to generate (e.g., "Generate day_03, day_04, day_05").

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
- **HTML rendering:** The `/render` skill maps this to `<a class="map-link" ...>`.

#### 2. Hourly Table (trip_context.daily_schedule)
- Structured schedule with specific arrival/departure times.
- Estimated travel times and walking distances between each spot.
- Brief description for each point.

#### 3. Universal Location Standards
For **EVERY** location mentioned (attractions, landmarks, parks, and restaurants):
- **Google Maps**: A direct link to the specific entrance or pin.
- **Official Website**: A link to the official site (or a reliable primary source like TripAdvisor if no site exists).
- **Photo Gallery**: A link to visual galleries to help the family identify the spot.
- **Phone number**: When available (sourced from Google Places or web fetch). Format: `📞 {localized_label}: {phone_number}` — the label is language-dependent (e.g., "Телефон" in Russian, "Phone" in English).
- **Rating**: When available (sourced from Google Places). Format: `⭐ {rating}/5 ({review_count} {localized_reviews_label})` — e.g., `⭐ 4.5/5 (2,340 отзывов)`.

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
- **Required** on every day (including Day 0 — note if stores are closed due to holidays).
- Format as a full `###` POI section with: store name + chain, distance from nearest day POI, Google Maps link.
- This section MUST be rendered as a `poi-card` in HTML (tag: `🛒 МАГАЗИН`).

#### 9. Optional Along-the-Way Stops
- **Required** on every full day (Day 0 / departure day exempt).
- Include 1–2 places from `kids_interests` that are within a 5–10 minute detour from the day's planned route.
- Format as a `###` POI section with: name in `poi_languages`, one-line hook, Google Maps link, matched interest.
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

## Budget Assembly

After all days are complete for a given language:
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

---

## Trip Assembly (Bash Command — No Subagent)

After all days + budget are complete for a given language, assemble `trip_full_LANG.md` using a single Bash command:

```bash
cd <trip_folder> && { cat overview_LANG.md; for f in day_[0-9][0-9]_LANG.md; do printf '\n---\n\n'; cat "$f"; done; printf '\n---\n\n'; cat budget_LANG.md; } > trip_full_LANG.md
```

Replace `<trip_folder>` with the actual path and `LANG` with the language code (e.g., `ru`, `en`).

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
