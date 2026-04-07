# Content & Output Format Rules — Phase B Extract

> **This is a subset of `content_format_rules.md` for Phase B day-generation subagents.** It contains only the per-day file format, templates, and content requirements. Excludes: folder structure, manifest schema, Phase A, Day Generation Protocol, budget assembly, trip assembly, incremental edits, HTML export. Keep in sync with the full file.

## Generation Context per Day

When generating `day_XX_LANG.md`, load only:
1. The active trip details file — travelers, interests, schedule preferences.
2. `overview_LANG.md` — the Phase A master plan (for cross-day context).
3. The current day's row from the Phase A table.

Do NOT load other day files — Phase A provides all cross-day coordination.

> **Note:** The trip details file may contain optional `## Hotel Assistance` and `## Car Rental Assistance` sections at the end. These sections are **not consumed by day subagents**. Accommodation and car rental recommendations are generated as standalone files (`accommodation_LANG.md`, `car_rental_LANG.md`) by the main agent after all day batches complete. Day subagents do NOT generate `## 🏨` or `## 🚗` sections in day files.

## Per-Day File Format

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

> **Section placement order:** The template above shows all possible sections in their required order. The daily budget table follows POI cards directly. Accommodation and car rental sections are NOT part of day files — they are generated as standalone files by the main agent.

**Section placement order within day files** (no accommodation/car rental — those are standalone files):
1. Day header + schedule table
2. POI cards (### headings)
3. Daily budget table (### Стоимость дня) — anchor days still include accommodation/car budget line items
4. Grocery store (### 🛒)
5. Along-the-way stops (### 🎯)
6. Plan B (### 🅱️)
7. *(end of file)*

> **Important:** Accommodation (`## 🏨`) and car rental (`## 🚗`) recommendation sections are NOT generated in day files. They are generated as standalone files (`accommodation_LANG.md`, `car_rental_LANG.md`) by the main agent after all day batches complete. Do NOT include these sections in any day file.

---

## Per-Day Content Requirements

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

## Anchor Day Budget Integration

**Accommodation (on stay block anchor day's budget table):**
- Label: "{localized_accommodation_label} ({nights} {localized_nights_label})"
- HUF column: "{per_night_low}–{per_night_high} x {nights} = {total_low}–{total_high}"
- EUR column: same structure. Mark as estimate. Subsequent days in same stay block do NOT include accommodation.

**Car rental (on rental block anchor day's budget table):**
- Label: "{localized_car_rental_label} ({days} {localized_days_label})"
- HUF column: "{daily_low}–{daily_high} × {days} = {total_low}–{total_high}"
- EUR column: same structure. Mark as estimate. Subsequent car days do NOT include rental cost. Fuel estimates remain per-day.
