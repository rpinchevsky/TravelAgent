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
- **Language code mapping:** Russian → `ru`, English → `en`, Hebrew → `he`, German → `de`, French → `fr`, Spanish → `es`, etc. Derived from `language_preference.reporting_language` in `trip_details.md`.
- **Timestamping:** Always run `date +"%Y-%m-%d_%H%M"` via the Bash tool to determine the correct current local time.
- **Re-generation in another language:** When regenerating an existing trip in a different language, write new `_LANG` files into the **same** trip folder. The manifest tracks each language's state independently.
- **Day files:** `day_00_LANG.md` through `day_NN_LANG.md` — zero-padded two-digit day number + language code.
- **Legacy trips:** Older trips without language suffixes (e.g., `day_01.md`) are treated as the default language. New trips must use the `_LANG` suffix.

### manifest.json Schema

Created during Phase A, updated after each day is generated:

```json
{
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
- `languages` — keyed by ISO 639-1 code. Each language has its own `phase_a_complete`, `days`, `budget_complete`, and `assembly` state. Adding a new language creates a new key (e.g., `"en": { ... }`).
- `days` keys match filenames without the language suffix (e.g., `day_00` → `day_00_ru.md`).
- `status` values: `"pending"` | `"complete"`.
- `title` is populated from the Phase A overview table.
- `stale_days` lists any days modified after the last full assembly — triggers incremental rebuild.
- After editing a day, add it to `stale_days` and update its `last_modified`.

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
3. Write `manifest.json` with the language key under `languages`, all days listed as `"pending"`, `phase_a_complete: true`.
4. Proceed directly to Phase B (do not wait for user approval).

---

## Phase B: Detailed Operational Plan (Day-by-Day Generation)

Phase B generates **one day at a time**, each into its own file. This avoids output token limits and enables per-day editing.

### Generation Context per Day

When generating `day_XX_LANG.md`, load only:
1. `trip_details.md` — travelers, interests, schedule preferences.
2. `overview_LANG.md` — the Phase A master plan (for cross-day context).
3. The current day's row from the Phase A table.

Do NOT load other day files — Phase A provides all cross-day coordination.

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

### Day Generation Protocol

1. Generate `day_00_LANG.md` (arrival) first, if applicable.
2. Generate `day_01_LANG.md` through `day_NN_LANG.md` sequentially.
3. After writing each day file:
   - Update `manifest.json`: under `languages.LANG`, set that day's `status` to `"complete"`, record `last_modified`.
4. After all days are complete, proceed to Budget and Assembly.

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

---

## Trip Assembly (Mechanical Step)

After all days + budget are complete for a given language, assemble `trip_full_LANG.md`:

1. Start with the contents of `overview_LANG.md`.
2. Append `day_00_LANG.md` through `day_NN_LANG.md` in order, with `---` separators.
3. Append `budget_LANG.md` at the end.
4. Write the result to `trip_full_LANG.md` in the trip folder.
5. Update `manifest.json`: under `languages.LANG.assembly`, set `trip_full_md_built` timestamp, clear `stale_days`.

**This is a mechanical concatenation** — no LLM generation needed. Use file read + write operations.

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
