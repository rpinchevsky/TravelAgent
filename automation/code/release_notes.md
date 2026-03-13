# Release Notes

## 2026-03-13_1830 — Arcade & Indoor Entertainment Expansion (51 POI Cards)

### Changes

#### Trip Content (Incremental Edit — 10 New POIs)
- **10 new POI cards added** (1 per day, Days 1-10): total now 51 POIs (was 41).
- **Theme:** arcade games, trampoline parks, VR, pinball, indoor entertainment.
- **POI distribution:** Day 0:1, 1:5, 2:5, 3:5, 4:5, 5:5, 6:4, 7:4, 8:4, 9:6, 10:5, 11:2
- **Budget total**: ~1 854 EUR / ~703 640 HUF (was ~1 572 EUR / ~596 140 HUF).
- **New POIs by day:**
  - Day 1: SuperFly Trambulinpark (trampoline park, XIII district)
  - Day 2: Gamerland (VR + arcade center, III district, Sat evening)
  - Day 3: Elevenpark Játszóház (indoor playground, XI district)
  - Day 4: Gameroom Budapest (high-tech interactive arcade, IX district)
  - Day 5: Budavári Labirintus (underground labyrinth, promoted from backup)
  - Day 6: CyberJump Trambulinpark (trampoline park, XI district)
  - Day 7: Flippermúzeum (pinball museum, 160+ machines, XIII district)
  - Day 8: Aquaworld Játékterem (arcade game zone at resort)
  - Day 9: VR Vidámpark Budapest (VR amusement park)
  - Day 10: Let's Go Arcade revisit (birthday arcade treat)

#### Test Data Synchronized
- **poi-cards.spec.ts**: Min POI threshold 35 → 45 (51 total POIs now).
- **overview-budget.spec.ts**: Budget EUR 1 572 → 1 854.
- **progression-2026-03-13_1557.spec.ts**: Removed (replaced by new progression).

#### New Progression Tests
- **progression-2026-03-13_1830.spec.ts**: 51 POI count, per-day counts, 10 new POI presence checks, updated budget 1 854, previous POIs still present checks.

### Affected Sections
- Day 1-10 sections — new POI cards added
- Budget section — new totals (1 854 EUR / 703 640 HUF)
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)

---

## 2026-03-13_1557 — Expanded Trip with 41 POI Cards and Full Day Coverage

### Changes

#### Trip Content (New Generation)
- **Full 12-day trip regenerated** with expanded itinerary: 41 POI cards (was 28).
- **All days now have POI cards** — Day 0 (arrival) and Day 11 (departure) now include POIs.
- **POI distribution:** Day 0: 1, Day 1: 4, Day 2: 4, Day 3: 4, Day 4: 4, Day 5: 4, Day 6: 3, Day 7: 3, Day 8: 3, Day 9: 5, Day 10: 4, Day 11: 2
- **Budget total**: ~1 572 EUR / ~596 140 HUF (was ~1 527 EUR / ~607 200 HUF).
- **12 day sections**, **14 navigation links** (unchanged structure).
- **New/changed POIs:**
  - Day 0: Airport POI card added (was 0 POIs)
  - Day 1: Added lunch POI (4 total, was 3)
  - Day 2: Added cafe POI (Városliget Café) — 4 total (was 4)
  - Day 4: Restructured as Pest Center day — Miniversum, Market, Arcade
  - Day 5: Halászbástya + Budai Várnegyed + Danube cruise (was 2 POIs, now 4)
  - Day 6: Tropicarium + Campona shopping (3 total, was 2)
  - Day 7: Csodák Palotája + Railway Museum (3 total, was 2)
  - Day 8: Aquaworld + Aqua Spray Park (3 total, was 1)
  - Day 9: Playground + Lake + Andrássy shopping + Hősök tere (5 total, was 2)
  - Day 10: Birthday — Palatinus + Riso + Mini Zoo + Gelarto Rosa (4 total, was 3)
  - Day 11: Airport + Aran Bakery (2 total, was 0)

#### Config Changes
- **playwright.config.ts**: Updated `filePath` to point to `trip_2026-03-13_1557.html`.

#### Test Data Synchronized
- **day-cards.spec.ts**: Day loop 1..10 → 0..11, added Day 0/11 titles and dates, min itinerary rows 4 → 3.
- **overview-budget.spec.ts**: Budget EUR 1 527 → 1 572, overview day loop uses `td` instead of `td.col-time`.
- **poi-cards.spec.ts**: Min POI threshold 25 → 35 (41 total POIs now).
- **poi-parity.spec.ts**: Day loop 1..10 → 0..11.
- **Visual snapshots**: Cleared for regeneration.

#### New Progression Tests
- **progression-2026-03-13_1557.spec.ts**: 41 POI count, per-day POI counts, new POI presence checks (Gelarto Rosa, Hősök tere, Aqua Spray Park, Campona, Day 0/11 POI coverage), updated budget 1 572.

### Affected Sections
- All day sections (Day 0-11) — full content regeneration
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)
- Budget section — new totals (1 572 EUR / 596 140 HUF)
- 41 POI cards — expanded descriptions, dual-language names

---

## 2026-03-13_1216 — Revised Trip with 28 POI Cards and Restructured Days

### Changes

#### Trip Content (New Generation)
- **Full 11-day trip regenerated** with revised itinerary: 28 POI cards (was 34).
- **POI distribution:** Day 0: 0, Day 1: 3, Day 2: 4, Day 3: 4, Day 4: 5, Day 5: 2, Day 6: 2, Day 7: 2, Day 8: 1, Day 9: 2, Day 10: 3, Day 11: 0
- **Budget total**: ~1 527 EUR / ~607 200 HUF (was ~1 463 EUR).
- **12 day sections**, **14 navigation links** (unchanged structure).
- **28 clickable activity labels** linking to POI cards.
- **New/changed POIs:**
  - Day 1: Margitsziget Szokokut (Musical Fountain), Margitsziget Jatszóter (playground) — replaced Kisallatkert, Japankert, Zenelo szokokut
  - Day 3: House of Houdini, Riso Ristorante, Dunai Hajokirandulas — replaced Szimpla Kert, Labirintus, Ruszwurm
  - Day 4: Zugligeti Libego, Anna-reti Jatszóter, IDE Etterem — restructured as Budai Hills day (was different theme)
  - Day 5: Medveotthon (Bear Sanctuary) — now on Day 5 (was Day 6 area)
  - Day 6: Tropicarium + Flippermuzeum (2 POIs, was 5)
  - Day 7: Kozponti Vasarcsarnok + Miniversum (2 POIs, was 2)
  - Day 8: Aquaworld only (1 POI, was 4)
  - Day 10: Let's Go Arcade, VakVarju Buda, Allatkert revisit
- **Title fixed** to Cyrillic: "Будапешт 2026 — Семейный маршрут"

#### Config Changes
- **playwright.config.ts**: Updated `filePath` to point to `trip_2026-03-13_1216.html`.

#### Test Data Synchronized
- **overview-budget.spec.ts**: Budget EUR 1 463 -> 1 527.
- **poi-cards.spec.ts**: Min POI threshold 30 -> 25 (28 total POIs now).

#### New Progression Tests
- **progression-2026-03-13_1216.spec.ts**: 28 POI count, per-day POI counts, new POI presence checks (Houdini, Zugligeti Libego, Medveotthon, Let's Go Arcade), updated budget 1 527.

### Affected Sections
- All day sections (Day 0-11) — full content regeneration
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)
- Budget section — new totals (1 527 EUR)
- 28 POI cards — revised descriptions, dual-language names

---

## 2026-03-13_0109 — Enhanced Trip with 34 POI Cards and New Attractions

### Changes

#### Trip Content (New Generation)
- **Full 11-day trip regenerated** with enriched itinerary: 34 POI cards (was 23).
- **New POIs added:**
  - Day 1: Zenélő szökőkút (Musical Fountain) — 4th POI
  - Day 2: VakVarjú Étterem (restaurant with babysitter), Városligeti Nagyjátszótér (13k m² playground) — 5 POIs total
  - Day 3: Szimpla Kert Vasárnapi piac (Sunday farmers market), Ruszwurm Cukrászda — 5 POIs total
  - Day 6: Fogaskerekű Vasút (Cogwheel Railway), Libegő (Chairlift), Normafa Delikat (mountain café) — 5 POIs total
  - Day 8: Magyar Zene Háza (House of Music), Menza Étterem — 4 POIs total
  - Day 10: VakVarjú for birthday, Daubner Cukrászda — 3 POIs total
- **POI distribution:** Day 0: 0, Day 1: 4, Day 2: 5, Day 3: 5, Day 4: 2, Day 5: 3, Day 6: 5, Day 7: 2, Day 8: 4, Day 9: 1, Day 10: 3, Day 11: 0
- **Budget total**: ~1 463 EUR / ~570 250 HUF (was ~1 334 EUR).
- **12 day sections**, **14 navigation links** (unchanged structure).
- **34 clickable activity labels** linking to POI cards.

#### Config Changes
- **playwright.config.ts**: Updated `filePath` to point to `trip_2026-03-13_0109.html`.

#### Test Data Synchronized
- **overview-budget.spec.ts**: Budget EUR 1 334 → 1 463.
- **poi-cards.spec.ts**: Min POI threshold 20 → 30.
- **svg-integrity.spec.ts**: Min SVG threshold 13 → 14.
- **activity-poi-linking.spec.ts**: Day loop 0..10 → 0..11.

#### New Progression Tests
- **progression-2026-03-13_0109.spec.ts**: 34 POI count, per-day POI counts, new POI presence checks (Zene Háza, Szimpla Kert, Fogaskerekű, Libegő), updated budget 1 463.

### Affected Sections
- All day sections (Day 0–11) — full content regeneration
- Navigation — 14 items (unchanged count)
- Overview table — 12 rows (unchanged count)
- Budget section — new totals (1 463 EUR)
- 34 POI cards — enriched descriptions, dual-language names

---

## 2026-03-13_0030 — Full Trip Regeneration with New Itinerary

### Changes

#### Trip Content (New Generation)
- **Full 11-day trip regenerated** with new itinerary structure: Days 0 (arrival) through 11 (departure).
- **Day 11 (departure)** added as a new day section with minimal content (no POIs, no Plan B).
- **12 day sections** total (was 11): `#day-0` through `#day-11`.
- **14 navigation links** (was 13): overview + 12 days + budget.
- **23 POI cards** total (was 36): leaner itinerary with quality-over-quantity approach.
  - Day 1: 3, Day 2: 3, Day 3: 3, Day 4: 2, Day 5: 3, Day 6: 2, Day 7: 2, Day 8: 2, Day 9: 1, Day 10: 2
- **POI names in dual language** (Hungarian / Russian) per `poi_languages` setting.
- **Budget total**: ~1 334 EUR (was ~1 745 EUR). No car rental in this trip.
- **Overview table**: 12 data rows (was 11) — includes Day 11 departure row.
- **Holiday advisory**: St. Stephen's Day (Aug 20) — single `advisory--warning`.
- **Activity label linking**: 23 clickable `<a class="activity-label">` elements linking to POI cards.

#### Config Changes
- **playwright.config.ts**: Updated `filePath` to point to `trip_2026-03-13_0030.html`.

#### Test Data Synchronized
- **structure.spec.ts**: Day section count 11 → 12.
- **navigation.spec.ts**: Sidebar/pill count 13 → 14, added `#day-11` href.
- **overview-budget.spec.ts**: Overview rows 11 → 12, budget EUR amount 1 745 → 1 334, removed car rental assertion.

### Affected Sections
- All day sections (Day 0–11) — full content regeneration
- Navigation (sidebar + mobile pills) — 14 items
- Overview table — 12 rows
- Budget section — new totals
- All 23 POI cards — dual-language names

---

## 2026-03-12_2215 — Full Trip Regeneration with POI Parity & Language Compliance

### Changes

#### Trip Content (New Generation)
- **Full 10-day trip regenerated** from scratch with updated rules applied throughout.
- **POI names in dual language** (Hungarian + Russian) for all 36 POI cards across 10 days, per `trip_details.md → language_preference.poi_languages: ["Hungarian", "Russian"]`.
- **POI Parity enforced**: Every `###` POI section in the markdown produces exactly one `poi-card` in the HTML. Expected counts:
  - Day 1: 3, Day 2: 4, Day 3: 5, Day 4: 4, Day 5: 4, Day 6: 3, Day 7: 4, Day 8: 2, Day 9: 4, Day 10: 3 (Total: 36)
- **Holiday advisory** rendered as `advisory--warning` before overview table.
- **Day 0** (arrival) included in navigation and content.
- **Overview table** rendered as standalone `section-title` + `itinerary-table-wrapper` table.
- **Pricing sections** use `pricing-grid` with `pricing-cell` components (not itinerary-table).
- **Plan B sections** use `advisory advisory--info` (not card--featured).
- **Logistics sections** use `advisory advisory--info`.
- **Budget summary** and reminders included at bottom.
- **CSS fully inlined** — no external `<link>` to CSS file.

#### Config Changes
- **playwright.config.ts**: Updated `filePath` to point to `trip_2026-03-12_2215.html`.

### Affected Sections
- All day sections (Day 0–10) — full content regeneration
- All navigation (sidebar + mobile pills) — 11 items (Day 0–10)
- Overview table — new rendering
- Holiday advisory — new rendering
- Budget summary — new section
- All 36 POI cards — dual-language names, full descriptions

---

## 2026-03-12 — POI Parity & Language Compliance (Initial Rules Update)

### Changes

#### Rules & Config
- **CLAUDE.md**: Added POI Parity Rule to Fragment Generation Step 2. Added POI Parity Check to CEO Audit checklist. Added POI language requirement.
- **rendering-config.md**: Added "POI Card Parity Rule (Mandatory)" subsection under Component Usage Rules.

#### New Regression Tests
- **poi-parity.spec.ts**: Validates per-day and total POI card count in HTML matches `###` POI sections in source markdown.
- **poi-languages.spec.ts**: Validates every `.poi-card__name` contains both Hungarian (Latin) and Russian (Cyrillic) text.

#### New Files
- **test_plan.md**: Comprehensive test plan covering all 10 regression suites.
