# Content & Output Format Rules

## Trip Folder Structure (Modular Architecture)

Each trip is stored in its own timestamped folder under `generated_trips/`:

```
generated_trips/
  trip_YYYY-MM-DD_HHmm/          # Trip folder (timestamp = trip creation time)
    manifest.json                  # Trip metadata + day index + state tracker
    overview.md                    # Phase A table + trip header + holiday advisory
    day_00.md                      # Day 0 (arrival, if applicable)
    day_01.md                      # Day 1
    day_02.md ... day_NN.md        # One file per day
    budget.md                      # Aggregated budget from all days
    trip_full.md                   # Auto-assembled from all parts (generated, not hand-edited)
    trip_full.html                 # Final HTML output
```

### Naming Rules
- **Folder name:** `trip_YYYY-MM-DD_HHmm` — same timestamp convention as before.
- **Timestamping:** Always run `date +"%Y-%m-%d_%H%M"` via the Bash tool to determine the correct current local time.
- **Day files:** `day_00.md` through `day_NN.md` — zero-padded two-digit day number.
- **Legacy trips:** Older monolithic trips in `generated_trips/md/` and `generated_trips/html/` remain as-is. New trips use the folder structure.

### manifest.json Schema

Created during Phase A, updated after each day is generated:

```json
{
  "destination": "Budapest, Hungary",
  "arrival": "2026-08-20",
  "departure": "2026-08-31",
  "total_days": 11,
  "created": "2026-03-15T09:00:00",
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
```

**Field rules:**
- `days` keys match filenames exactly (e.g., `day_00` → `day_00.md`).
- `status` values: `"pending"` | `"complete"`.
- `title` is populated from the Phase A overview table.
- `stale_days` lists any days modified after the last full assembly — triggers incremental rebuild.
- After editing a day, add it to `stale_days` and update its `last_modified`.

---

## Phase A: High-Level Summary

Provide a table with:
- Day/Date/Area.
- Morning/Lunch/Afternoon summary.
- CEO Audit Status (pass/fail).

*Note: No links or prices in this phase.*

### Phase A Output

1. Create the trip folder: `generated_trips/trip_YYYY-MM-DD_HHmm/`.
2. Write `overview.md` containing:
   - Trip title and subtitle (destination, dates, travelers with ages).
   - Holiday advisory (if applicable).
   - Phase A summary table.
3. Write `manifest.json` with all days listed as `"pending"`, `phase_a_complete: true`.
4. Proceed directly to Phase B (do not wait for user approval).

---

## Phase B: Detailed Operational Plan (Day-by-Day Generation)

Phase B generates **one day at a time**, each into its own file. This avoids output token limits and enables per-day editing.

### Generation Context per Day

When generating `day_XX.md`, load only:
1. `trip_details.json` — travelers, interests, schedule preferences.
2. `overview.md` — the Phase A master plan (for cross-day context).
3. The current day's row from the Phase A table.

Do NOT load other day files — Phase A provides all cross-day coordination.

### Per-Day File Format

Each `day_XX.md` is self-contained and follows this structure:

```markdown
# День {N} — {Title} {Emoji}
**Дата:** {Day of week}, {Date}
**Район:** {Area}

### Расписание

| Время | Активность | Детали |
|-------|-----------|--------|
| ...   | ...       | ...    |

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

### 🅱️ Запасной план — {Name}
{Backup plan content}
```

### Day Generation Protocol

1. Generate `day_00.md` (arrival) first, if applicable.
2. Generate `day_01.md` through `day_NN.md` sequentially.
3. After writing each day file:
   - Update `manifest.json`: set that day's `status` to `"complete"`, record `last_modified`.
4. After all days are complete, proceed to Budget and Assembly.

### Per-Day Content Requirements

Each day file MUST include all of the following:

#### 1. Interactive Map Display
- Provide a direct link to a Google Maps search query or a GeoJSON object containing all POIs for the day.

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

---

## Content Guidelines for Trip Points
- **Point Descriptions:** For every location visited, provide a structured paragraph (approx. 3-4 sentences) that includes:
  1. **The Vibe:** An engaging opening that captures the atmosphere and "feel" of the location.
  2. **The Must-See:** One specific, high-impact detail or hidden corner we shouldn't miss.
  3. **The Family Factor:** Why this spot works specifically for the travelers.
  4. **The Pro-Tip:** One piece of actionable logistics (e.g., "Best visited at 4:00 PM for the lighting"). In HTML output, this maps to `<div class="pro-tip">` — see `rendering-config.md`.
- **Tone:** Evocative yet practical; avoid generic adjectives like 'beautiful' in favor of specific imagery.

---

## Budget Assembly

After all days are complete:
1. Read the `### Стоимость дня` section from each `day_XX.md`.
2. Write `budget.md` with:
   - Per-day summary (day number, title, day total in HUF and EUR).
   - Grand total across all days.
   - Category breakdown if possible (attractions, food, transport).

---

## Trip Assembly (Mechanical Step)

After all days + budget are complete, assemble `trip_full.md`:

1. Start with the contents of `overview.md`.
2. Append `day_00.md` through `day_NN.md` in order, with `---` separators.
3. Append `budget.md` at the end.
4. Write the result to `trip_full.md` in the trip folder.
5. Update `manifest.json`: set `assembly.trip_full_md_built` timestamp, clear `stale_days`.

**This is a mechanical concatenation** — no LLM generation needed. Use file read + write operations.

---

## Incremental Edit Workflow

When the user requests changes to a specific day:

1. **Regenerate** only the affected `day_XX.md`.
2. **Update manifest:** set `last_modified` on the changed day, add to `stale_days`.
3. **Re-assemble** `trip_full.md` (mechanical concat — fast).
4. **Rebuild HTML** for only the changed day's fragment, then re-assemble `trip_full.html` (see `rendering-config.md` incremental rebuild rules).
5. **Run validation** only on changed-day tests + structural tests.

---

## HTML Export Workflow
- **Trigger:** Whenever asked to "create an HTML page," "export to HTML," or "generate the web view."
- **Source Selection:** Identify the most recent trip folder `generated_trips/trip_YYYY-MM-DD_HHmm/`.
- **Source Files:** Read all day files from the trip folder (or use `trip_full.md` if assembled).
- **Output Filename:** `trip_full.html` inside the same trip folder.
- **Next step:** Follow the **HTML Generation Pipeline** in `rendering-config.md` (Fragment Master Mode) to produce the HTML, then validate per `development_rules.md`.
