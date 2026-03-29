# Trip Intake Page — Business Rules

## Purpose

`trip_intake.html` is a standalone, self-contained wizard page that collects traveler information and outputs a trip details file — the input file the trip generation pipeline reads from. It replaces manual authoring of `trip_details.md` with a guided, user-friendly form.

**File:** `trip_intake.html` (project root)
**Output:** Downloaded with a dynamic filename `{name}_trip_details_{date}.md` (see Output Format for construction rules). The user may rename the downloaded file. Any file following the trip details markdown structure is a valid input to the Trip Generation Pipeline.
**Bridge server:** `trip_bridge.js` — optional Node.js server (`node trip_bridge.js`) that enables one-click trip generation. When running, the "Build My Dream Trip" button saves the file directly to the project directory and launches `claude` in a new terminal to generate the trip. When not running, the page falls back to browser download + copy command. Endpoints: `GET /` and `/trip_intake.html` (intake page), `POST /generate` (save + start), `GET /progress/:id` (SSE stream), `POST /cancel/:id` (stop generation), `GET /latest-trip` (find generated HTML), `GET /file/*` (serve from generated_trips/), `GET /locales/*` (i18n catalog JSON files).
**Dependencies:** HTTP server required for i18n catalog loading (recommended: `node trip_bridge.js`). No build step, no external JS frameworks.
**Design spec:** `trip_intake_design.md` (visual layout, CSS classes, component specs, animations)

### Internationalization (i18n)

The page supports 12 languages: English, Russian, Hebrew, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic. A language selector in the hero section lets the user switch the entire UI language instantly.

**Rules:**
- All static UI text uses `data-i18n="key"` attributes. Placeholders use `data-i18n-placeholder="key"`.
- **Translation catalogs are external JSON files** in the `locales/` folder:
  - `locales/ui_{lang}.json` — one per language (12 files), flat key-value objects
  - Each `ui_{lang}.json` also contains an `_items` key with item name translations (merged from the former `ITEM_I18N` object)
- `setLanguage(code)` fetches `locales/ui_{lang}.json` via `fetch()`, caches in memory, and applies translations. Falls back to English catalog, then a minimal inline emergency catalog.
- `tItem(name)` reads from `_uiCache[currentLang]._items` with fallback to `_uiCache.en._items`. Same observable behavior as before.
- The page requires HTTP serving (e.g., `node trip_bridge.js` on `localhost:3456`) for catalog loading. Direct `file://` access shows an informative error message.
- Default language: detected from `navigator.language` (browser locale), falling back to English.
- **All UI text — including dynamically generated card names — must display in the selected UI language.** The `_items` key in each `ui_{lang}.json` provides translations for all INTEREST_DB, AVOID_DB, FOOD_DB, and VIBE_DB items. The `tItem(name)` helper returns the translated display name. Each card stores its English name in `data-en-name` for markdown output.
- **The generated markdown output always uses English names** regardless of UI language. `getSelectedDynamic()` reads `data-en-name` attributes to ensure the trip planning pipeline receives consistent English identifiers.
- The generated markdown output (Step 8 preview) always uses the **Report Language** selected in Step 7, not the UI language. The report language defaults to match the UI language.
- When adding new UI text, always include a `data-i18n` attribute and add the key to all `locales/ui_{lang}.json` files for all 12 languages.
- When adding new items to INTEREST_DB, AVOID_DB, FOOD_DB, or VIBE_DB, also add the item's translated name to the `_items` key in `locales/ui_ru.json` and `locales/ui_he.json`, and the English identity mapping to all other `ui_{lang}.json` files.
- RTL languages (Hebrew, Arabic) flip layout direction: borders, paddings, text alignment, button arrows, and stepper direction all reverse.
- **Language consistency rule:** Every screen the user sees during trip customization must display entirely in the selected UI language. Mixed-language screens (e.g., Hebrew labels with English card names) are a bug.

## Wizard Flow (9 Steps)

The form follows a strict **two-phase** design:

1. **Data & Questions Phase** (Steps 0-3): Collect trip details, traveler info, stay/travel logistics, and all preference questions one-by-one.
2. **Card Selection Phase** (Steps 4-6): Present pre-scored card grids for the user to select/deselect POIs, avoids, and food experiences.

Steps are numbered 0-8. The two phases are kept strictly separate — **no questions appear on card selection steps**, and **no card grids appear on question steps**. This keeps the flow simple and intuitive.

**Phase 1 — Data & Questions:**
- **Step 0**: Define country and dates (search bar)
- **Step 1**: Define people in trip (traveler form)
- **Step 2**: Plan your stay & travel (hotel + car assistance toggles, optional)
- **Depth selector overlay**: Choose how many questions (10-30)
- **Step 3**: ALL preference questions, asked one-by-one with auto-advance and sub-step dots. The number of questions matches the selected depth. No card selection grids on this step.

**Phase 2 — Card Selection:**
- **Step 4**: Interests — multi-select card grid (pre-scored based on Step 3 answers)
- **Step 5**: Things to Avoid — multi-select card grid (pre-scored based on Step 3 answers)
- **Step 6**: Food & Dining — multi-select card grid + dining vibes

**Finalize:**
- **Step 7**: Language & extras (simple form: report language + notes)
- **Step 8**: Review & download

**Design consistency rule:** Steps 4, 5, and 6 must follow the same visual pattern at both page-structure and card-component levels: step title, description, and a grid of selectable cards. All cards share the same dimensions, padding, layout (centered vertical), and font sizes — differing only in selection color. Sub-sections use `.chip-section__title` + `.chip-section__desc` consistently.

**Search bar & hero visibility:** The search bar and value-prop badges are only visible on Step 0. Hidden on Steps 1+.

**Question Depth Selector:** After completing Step 1, an overlay presents 5 depth options: 10 (Quick), 15 (Light), 20 (Standard — default), 25 (Detailed), 30 (Deep Dive). The selected depth determines which questions are shown in Step 3. Steps 0, 1, 2, 4-8 are always fully present regardless of depth.

### Step 0 — Where & When

**Search Bar Fields (Booking.com-style bar in hero):**

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| Destination | Text + autocomplete | Yes | — | Typeahead via OpenStreetMap Nominatim API |
| Arrival | Calendar date picker | Yes | — | Booking.com-style dual-month calendar |
| Departure | Calendar date picker | Yes | — | Must be after arrival |

**Validation:** Destination, arrival, and departure are mandatory. Cannot proceed to Step 1 without all three filled. Departure must be after arrival.

**Note:** Travel rhythm was previously on Step 0 as card selector. It is now a one-by-one question in Step 3 (question key: `rhythm`).

### Step 1 — Who's Traveling
Two sections: **Parents/Adults** and **Children**. Both are dynamic lists with add/remove via +/− counter.

#### Parent Card Fields
| Field | Type | Required | Notes |
|---|---|---|---|
| Name | text | Yes | e.g., "Robert", "Anna" |
| Gender | select | No | Options: Male, Female |
| Date of Birth — Year | dropdown | Yes | Year range: 1940–current year, most recent first |
| Date of Birth — Month | dropdown | No | January–December, zero-padded values (01–12) |
| Date of Birth — Day | dropdown | No | 1–31, auto-adjusts max based on selected year+month |

- First parent card is pre-rendered (no remove button)
- Additional parent cards have a remove button

#### Child Card Fields
| Field | Type | Required | Notes |
|---|---|---|---|
| Name | text | Yes | e.g., "Tamir" |
| Gender | select | No | Options: Boy (Male), Girl (Female) |
| Date of Birth — Year | dropdown | Yes | Year range: last 18 years–current year |
| Date of Birth — Month | dropdown | No | |
| Date of Birth — Day | dropdown | No | |
| Notes | text | No | e.g., "No stroller", "Eats everything" |

- No pre-rendered child cards — user adds them via counter

#### DOB Output Format
- All three selected → `YYYY-MM-DD`
- Year + month only → `YYYY-MM`
- Year only → `YYYY`
- Nothing → `TBD`

**Validation:** Name and birth year are mandatory for every traveler. Cannot proceed to Step 2 without all travelers having name + year filled.

### Step 2 — Plan Your Stay & Travel

Hotel and car rental assistance toggles with optional sub-questions. Both toggles default to "No" (collapsed). No validation gate — the user can pass through without interaction.

| Field | Type | Notes |
|-------|------|-------|
| Hotel Assistance (toggle) | 2-option card (supplementary) | Yes = show hotel sub-questions, No = hide (default). Clearing resets all hotel selections. |
| Hotel sub-questions (7) | Various (supplementary) | hotelType (card grid 12, multi-select), hotelLocation (q-card 5), hotelStars (q-card 4), hotelAmenities (chips 12), hotelPets (toggle 2), hotelCancellation (q-card 3), hotelBudget (range slider $30-$1000) |
| Car Rental Assistance (toggle) | 2-option card (supplementary) | Yes = show car sub-questions, No = hide (default). Clearing resets all car selections. |
| Car sub-questions (6) | Various (supplementary) | carCategory (card grid 14, multi-select), carTransmission (q-card 3), carFuel (q-card 5), carPickup (q-card 4), carExtras (chips 7), carBudget (range slider $0-$1000) |

### Step 3 — All Preferences (One-by-One Questionnaire)

**ALL preference questions** are presented here in a single one-by-one questionnaire with sub-step dots and auto-advance. The number of visible questions depends on the selected depth (10-30). Each question has 3-4 options (radio behavior — one selected per question). Default is the middle/balanced option. Sub-step dots are dynamically rebuilt based on visible questions at the selected depth.

This step contains questions that were previously spread across Steps 0 (rhythm), 5 (avoid-quiz), 6 (food-quiz), and 7 (photography/accessibility). They are now consolidated here for a clean sequential experience.

**Derived values (not asked as questions):**
- `energy`: derived from pace answer (relaxed→chill, balanced→mixed, packed→active)
- `food`: derived from foodadventure (fearless→highlight, open→nice, safe→fuel)
- `evening`: derived from rhythm (early→early, balanced→stroll, latenight→latenight)

#### Answer → Pre-selection Mapping

The scoring function uses `energy` and `food` as derived values (see above). Pre-selection is driven by multi-dimensional scoring against INTEREST_DB item tags.

| Answer | Exact items pre-selected |
|---|---|
| setting=city | Historical Landmarks & Architecture, Shopping (Outlet / Local Brands), Art Galleries & Exhibitions |
| setting=both | Parks & Gardens, Outdoor Markets & Craft Stalls |
| setting=nature | National Parks & Nature Reserves, Waterfalls & Gorges, Lake & Beach Relaxation |
| culture=culture | Historical Landmarks & Architecture, Guided Walking & History Tours, Theater Opera & Ballet |
| culture=both | Cultural Festivals & Local Events, Family-Friendly Museums |
| culture=fun | Arcade Games & Entertainment Centers, Escape Rooms & Puzzle Experiences, Amusement & Theme Parks |
| evening=latenight | Rooftop Bars & Cocktail Lounges, Live Music & Jazz Clubs, Nightclubs & Dance Venues |
| evening=stroll | Photography Spots & Scenic Lookouts |
| evening=early | Scenic Walking & Viewpoints |

**Pre-selection rules:** Each answer maps to 2-4 **exact item names** (not keyword substrings). Total pre-selection target: ~8-15 chips. Items are validated against the pool map — only items that exist in a rendered pool are pre-selected. Duplicates across questions are naturally deduplicated by the Set.

**Reset rule:** When the user leaves the questionnaire step (Step 3), all saved interest/avoid selections are cleared, so changed answers always produce fresh pre-selections. Manual selections are only preserved when navigating between Steps 4↔5↔6 (not when returning through the questionnaire).

### Step 4 — Interests (Card Selection)
Interest card suggestions are **dynamically generated** based on traveler composition (Step 1) + questionnaire answers (Step 3). A "group summary" banner shows the analyzed group.

Cards are organized into labeled sections. Only sections matching active profile flags are shown. Cards matching questionnaire answers are **pre-selected**. Free-text textarea at bottom for custom interests.

**Local Highlights Rule:** Always includes a "Local Tourist Highlights" section for iconic attractions. Not gated by any profile flag.

See §Dynamic Interest Engine below for pool definitions and flag logic.

### Step 5 — Things to Avoid (Card Selection)
Dynamic avoid cards filtered by audience flags and scored using Step 3 answers (noise, foodadventure, budget, flexibility, pace). Cards with score ≥ 3 are pre-selected. Free-text textarea for custom avoids.

**No hidden quiz DOM.** All preference questions are now asked in Step 3. Scoring functions read answers directly from Step 3's question slides.

### Step 6 — Food & Dining (Card Selection)
Three parts:

1. **Food Experience Cards** — Dynamic cards scored using Step 3 answers (diet, diningstyle, foodadventure). Pre-selected based on scores.
2. **Dining Vibe Cards** — Accent-gold variant (`.avoid-card--vibe`). Filtered by audience flags.
3. **Food Notes** — Free-text textarea for allergies, must-haves, dislikes.

**No hidden quiz DOM.** All food preference questions are now asked in Step 3.

### Step 7 — Language & Extras
| Field | Tier | Type | Notes |
|---|---|---|---|
| Report Language | — | select (supplementary) | Options: English, Russian, Hebrew, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic. Defaults to match UI language. |
| POI Languages | — | auto-hint (read-only) | Automatically set to "Local destination language, {report language}". No user input needed. |
| Additional Notes | — | textarea (supplementary) | Free-form |
| Photography | T4 | 3-option card | Not a Priority / Nice Bonus (default) / Major Activity |
| Accessibility | T5 | 3-option card | No Special Needs (default) / Prefer Flat Routes / Wheelchair Accessible |
| Wheelchair Accessible | — | 2-option card (supplementary) | Always visible. "No Requirement" (default) / "Wheelchair Accessible Required" |

### Step 8 — Review & Download
- **Preview:** Rendered markdown in preview box. The preview tab label shows the dynamic filename (`{name}_trip_details_{date}.md`) and refreshes each time Step 8 is entered.
- **Actions:**
  - "Copy to Clipboard" — copies raw markdown text
  - "Download" — triggers browser download with the dynamic filename `{name}_trip_details_{date}.md` (see Output Format below for filename construction rules)
- **Post-Download:** After download, a "Next Step" section appears with:
  - Success message confirming the profile was saved
  - Pre-filled command: `generate trip from {filename}` (using the exact downloaded filename)
  - "Copy Command" button (copies to clipboard, shows toast)
  - Instructional text directing the user to paste into Claude Code
  - The section updates if the user downloads again after making edits
  - The section resets (hides) when navigating away from Step 8 and back
  - **Pipeline Roadmap:** A visual timeline showing the 6 generation pipeline steps (Overview, Day Generation, Budget, Assembly, HTML Render, Quality Testing) with proportional duration bars and estimated times (~28 min total). Steps 2 and 5 are visually emphasized as the two longest phases.
- **Bridge Integration:** The download button first attempts to connect to the bridge server (`localhost:3456`). If available, it saves the file directly and starts trip generation in a new terminal — no copy-paste needed. If the bridge is not running, it falls back to browser download + copy command.
- **Generating mode:** During trip generation, the hero, search bar, preview, and wizard steps are hidden (`body.is-generating` CSS class). Only the pipeline roadmap and log are visible.
- **Stop button:** A "Stop Generation" button allows cancelling the running generation via `POST /cancel/:id`. Clicking it kills the claude process, resets the pipeline UI, and restores the wizard for editing.
- **Open Trip button:** After successful generation, an "Open Trip" button appears. It fetches the latest generated trip folder via `GET /latest-trip` and opens the HTML file via `GET /file/*`.
- **Edit:** "Back" button returns to Step 7

## Destination Autocomplete

Uses a **three-tier hybrid approach**: local country list + local islands/regions list for instant multilingual matching, plus GeoNames API for city fallback.

### Behavior
- **Local countries** (50 entries with en/ru/he names): matched instantly as the user types, shown with 🌍 icon. Matching works across all 3 languages (e.g., typing "ישראל" matches Israel).
- **Local islands & regions** (~40 popular travel destinations with en/ru/he names + parent country): matched instantly, shown with 🏝️ icon. Includes Greek islands (Crete, Santorini, Rhodes…), Spanish islands (Mallorca, Tenerife, Ibiza…), Italian regions (Tuscany, Amalfi Coast…), Thai islands (Phuket, Koh Samui…), and more.
- **GeoNames API cities**: fetched after 2+ characters with 300ms debounce, shown with 🏙️ icon. Max 6 results, deduplicated against local lists by name.
- Display order: countries first → islands/regions second → cities third. Duplicate entries are removed.
- Keyboard navigation: Arrow Up/Down to highlight, Enter to select, Escape to close
- Click outside closes dropdown
- On country selection, input is set to the country name only (not "Country, Country") and a **city hint** appears below the search bar: "Tip: specify a city for a more detailed itinerary" (red text).
- On island/region or city selection, input is set to `"Name, Country"` format and the city hint is hidden.

### API Call
```
GET https://secure.geonames.org/searchJSON
  ?name_startsWith={query}&featureClass=P&maxRows=6
  &lang={currentLang}&username=robertp
```
- `featureClass=P` returns populated places (cities, towns, villages)
- Islands and regions are covered by the local REGIONS list, not the API
- GeoNames username: `robertp` (free tier, requires account activation at geonames.org)

## Question Inventory & Depth Tiers

The wizard supports 5 depth levels: 10 (Quick), 15 (Light), 20 (Standard), 25 (Detailed), 30 (Deep Dive). Each question has a tier assignment (T1-T5) that determines at which depth levels it appears.

### Tier Table (Quiz Questions Only)

All 30 tiered questions are real visual quiz-card questions with 3 selectable options each. **Note:** Questions assigned to Steps 5 and 6 are present in the DOM with default values but their quiz UI is hidden. Only Step 3 questions are visually interactive. Steps 5-6 quiz defaults are used for scoring card relevance.

| Tier | Questions | Count | Cumulative | Depth Levels |
|------|-----------|-------|------------|-------------|
| T1 | rhythm, setting, culture, noise, foodadventure, pace, diet, budget, flexibility, diningstyle | 10 | 10 | 10, 15, 20, 25, 30 |
| T2 | kidsfood, mealpriority, localfood, walkingTolerance, weatherSensitivity | 5 | 15 | 15, 20, 25, 30 |
| T3 | crowdTolerance, culturalImmersion, nightlife, transport, morningPreference | 5 | 20 | 20, 25, 30 |
| T4 | groupSplitting, souvenirShopping, relaxationTime, snacking, photography | 5 | 25 | 25, 30 |
| T5 | socialInteraction, surpriseOpenness, visitDuration, shopping, accessibility | 5 | 30 | 30 |

### Supplementary Fields (Always Visible)

These fields are always visible within their step and do not count toward the question budget:

| Field | Type | Step |
|-------|------|------|
| interests | Chip selection grid | Step 4 |
| customInterests | Textarea | Step 4 |
| avoidChips | Chip selection grid | Step 5 |
| customAvoid | Textarea | Step 5 |
| foodExperience | Dynamic cards | Step 6 |
| diningVibe | Chip group | Step 6 |
| foodNotes | Textarea | Step 6 |
| hotelAssistToggle | 2-option card | Step 2 |
| hotelType | Multi-select card grid (12 options) | Step 2 |
| hotelLocation | q-card (5 options) | Step 2 |
| hotelStars | q-card (4 options) | Step 2 |
| hotelAmenities | Multi-select chips (12 options) | Step 2 |
| hotelPets | 2-option card | Step 2 |
| hotelCancellation | q-card (3 options) | Step 2 |
| hotelBudget | Dual-handle range slider | Step 2 |
| carAssistToggle | 2-option card | Step 2 |
| carCategory | Multi-select card grid (14 options) | Step 2 |
| carTransmission | q-card (3 options) | Step 2 |
| carFuel | q-card (5 options) | Step 2 |
| carPickup | q-card (4 options) | Step 2 |
| carExtras | Multi-select chips (7 options) | Step 2 |
| carBudget | Dual-handle range slider | Step 2 |
| reportLang | Dropdown | Step 7 |
| poiLangs | Text input | Step 7 |
| extraNotes | Textarea | Step 7 |
| wheelchairAccessible | 2-option card | Step 7 |

### Depth Defaults

When a question is hidden due to depth selection, its default value is used in the generated markdown. Defaults are always the "middle" or "balanced" option. For Steps 5-6 quiz questions (which are always hidden from the UI), the DOM `is-selected` defaults are used: noise=flexible, foodadventure=open, budget=balanced, flexibility=loose, diet=omnivore, diningstyle=casual. See the `QUESTION_DEFAULTS` constant in `trip_intake.html` for the complete default values table.

### Step Visibility Rules

- Steps 0, 1, 2, 4, 5, 6, 7, 8 are **always visible** in the stepper regardless of depth level.
- Step 3 (Travel Style) visibility depends on depth: if ALL style questions are hidden, step is auto-skipped.
- Steps 4-6 always show their card-selection grids (supplementary content, not gated by depth).
- Step merging is disabled — Step 6 is never merged into Step 5.
- Quiz sub-step dots in Step 3 reflect only visible questions at the selected depth.

## Dynamic Interest Engine

### Profile Flags

The `analyzeGroup()` function computes the following boolean flags by analyzing all traveler cards. Ages are calculated relative to the **arrival date**.

| Flag | Condition |
|---|---|
| `adultsOnly` | No children added |
| `withKids` | At least one child card exists |
| `toddler` | Any child age 0-3 |
| `preschool` | Any child age 4-7 |
| `schoolAge` | Any child age 8-12 |
| `teen` | Any child age 13-17 |
| `senior` | Any adult age 65+ |
| `youngAdult` | Any adult age 18-30 |
| `couple` | Exactly 2 adults, no children |
| `maleAdult` | Any adult with gender = Male |
| `femaleAdult` | Any adult with gender = Female |
| `boyKid` | Any male child age 3-12 |
| `girlKid` | Any female child age 3-12 |
| `nature` | Always `true` (nature section always shown) |

### Pool Structure

Three pool maps exist: `INTEREST_POOLS`, `AVOID_POOLS`, `VIBE_POOLS`. Each is a JS object keyed by flag name, with an array of string options as the value. The `core` key is always shown regardless of flags.

### Section Display Logic
For each key in a pool map:
- If key is `core` → always render
- If key is `localHighlights` → always render (not gated by any flag)
- If `flags[key]` is `true` → render
- Otherwise → skip

Each rendered section gets a labeled header (e.g., "Popular for Everyone", "Great for Ages 4-7", "Popular with Men").

### Selection Persistence
When navigating between steps, selected chip states are saved to `Set` objects (`prevInterestSel`, `prevAvoidSel`) and restored when re-entering the step. This allows the user to go back, change travelers, and return to interests without losing their picks.

### Interest Pools (Current)

| Pool Key | Section Label | Count | Examples |
|---|---|---|---|
| `localHighlights` | 🏛️ Local Tourist Highlights | 8 | Top-rated landmarks, iconic viewpoints, must-see museums, famous squares, signature bridges, historic districts, renowned monuments, popular observation decks |
| `core` | Popular for Everyone | 12 | Food markets, parks, boat cruises, photography spots |
| `adultsOnly` | Great for Adults | 20 | Wine tasting, fine dining, rooftop bars, spa, hiking, paragliding |
| `youngAdult` | Young & Energetic (18-30) | 15 | Nightclubs, pub crawls, music festivals, bungee jumping |
| `couple` | Romantic & Couples | 10 | Sunset cruises, couples spa, candlelit dinners, stargazing |
| `maleAdult` | Popular with Men | 10 | Sports bars, whiskey tours, motorsport, fishing, BBQ |
| `femaleAdult` | Popular with Women | 10 | Boutique shopping, afternoon tea, pottery, perfume workshops |
| `withKids` | Family with Kids | 12 | Playgrounds, museums, aquariums, zoo, family cooking |
| `toddler` | Toddler-Friendly (0-3) | 8 | Soft play, petting zoos, splash pads, sandbox parks |
| `preschool` | Great for Ages 4-7 | 12 | Circus, puppet shows, train rides, treasure hunts, butterfly houses |
| `schoolAge` | Fun for Ages 8-12 | 15 | Arcade, go-karts, trampolines, escape rooms, drone workshops |
| `teen` | Teen-Approved (13+) | 16 | Theme parks, VR, skateparks, gaming cafes, water sports |
| `boyKid` | Popular with Boys | 8 | Construction vehicles, dinosaur parks, LEGO, pirate attractions |
| `girlKid` | Popular with Girls | 8 | Princess cafes, horse riding, dance studios, fairy gardens |
| `nature` | Nature & Outdoors | 12 | National parks, waterfalls, caves, camping, horseback riding |
| `senior` | Comfortable for Seniors | 10 | Thermal baths, scenic trains, classical music, gardens |

### Avoid Pools (Current)

Items are stored in `AVOID_DB` with scoring dimensions: `mobility`, `noise`, `foodadventure`, `budget`, `flexibility`. Each item has audience tags for filtering and dimension tags for scoring against avoid-quiz answers.

| Pool Key | Count | Examples |
|---|---|---|
| `core` | 3+5 | Tourist traps, crowded attractions, scam areas, overpriced restaurants, unstructured time blocks |
| `adultsOnly` | 2 | Kid-oriented attractions, noisy family restaurants |
| `youngAdult` | 2 | Slow tours, touristy restaurants |
| `couple` | 2 | Crowded family attractions, group tour buses |
| `withKids` | 7 | Long tours, static museums, sitting still, spicy food |
| `toddler` | 4 | Long walks, loud fireworks, no changing facilities |
| `teen` | 2 | Small-child attractions, dry exhibits |
| `senior` | 4 | Heavy physical effort, steep stairs, loud clubs |

### Vibe Pools (Current)

| Pool Key | Count | Examples |
|---|---|---|
| `core` | 6 | Casual, outdoor seating, hidden gems, budget-friendly |
| `withKids` | 5 | Forgiving environments, playgrounds, quick service |
| `adultsOnly` | 7 | Romantic, trendy, fine dining, live music, farm-to-table |
| `youngAdult` | 5 | Late-night eats, viral spots, rooftop, brunch |
| `couple` | 4 | Candlelit, wine bar, chef's table, private dining |
| `senior` | 4 | Quiet, heritage venues, accessible, early dining |

## Output Format

The generated markdown is downloaded with a dynamic filename following the pattern `{name}_trip_details_{date}.md`:

- **`{name}`**: First parent's name from Step 1, lowercased, spaces replaced with underscores, non-`[a-z0-9_]` characters stripped. Falls back to `traveler` if empty after sanitization.
- **`{date}`**: Arrival date from Step 0 in `YYYY-MM-DD` format. Falls back to `undated` if not set.
- **Examples:** `robert_trip_details_2026-07-15.md`, `anna_maria_trip_details_2026-08-01.md`, `traveler_trip_details_undated.md`

The generated markdown must match the structure of `trip_details.md` so it can be consumed by the trip generation pipeline. The exact structure:

```markdown
# Trip Details

## Trip Context

- **Destination:** {city}, {country}
- **Arrival:** {ISO datetime without trailing Z}
- **Departure:** {ISO datetime without trailing Z}

### Daily Schedule

- **Preferred start:** {HH:MM}
- **Preferred finish:** {HH:MM}
- **Buffer time (minutes):** {number}

### Universal Interests

- {interest 1}
- {interest 2}
...

### Places to Avoid

- {avoid 1}
- {avoid 2}
...

### Pace Preference

{pace description}

### Culinary Profile

- **Dietary style:** {style}
- **Food adventure level:** {conservative|moderate|adventurous}
- **Dining style:** {street food|casual|upscale|mix of all styles}
- **Meal priority:** {breakfast|lunch|dinner focus|every meal matters equally}
- **Local food preference:** {familiar|mix|full local immersion}
- **Budget style:** {budget-conscious|balanced|premium}
- **Schedule style:** {structured|flexible|spontaneous}
- **Must-haves:** {comma-separated list}
- **Notes:** {free-text, only if provided}
- **Vibe preference:** {comma-separated list}

## Travelers

### Parents

| Role   | Gender | Date of Birth |
|--------|--------|---------------|
| {name} | {gender or -} | {YYYY-MM-DD or YYYY-MM or YYYY} |

### Children

| Name  | Gender | Date of Birth | Notes |
|-------|--------|---------------|-------|
| {name} | {gender or -} | {YYYY-MM-DD or YYYY-MM or YYYY} | {notes} |

## Language Preference

- **Reporting language:** {language}
- **POI languages:** {comma-separated}

## Additional Notes

{free-text, only if provided}

## Additional Preferences

- **Transport preference:** {walking|public transit|taxi & rideshare|mix — whatever fits best}
- **Morning preference:** {morning person|no preference|afternoon starter}
- **Snacking importance:** {skip|occasional|serious}
- **Photography importance:** {not a priority|nice bonus|major activity}
- **Visit duration style:** {quick highlights|moderate exploration|deep immersion}
- **Shopping importance:** {skip|browse if convenient|dedicated time}
- **Accessibility needs:** {none|prefer flat routes|wheelchair accessible}
- **Wheelchair accessible:** {yes|no}
- **Walking tolerance:** {light (~2km/day)|moderate (~5km/day)|marathon (~10km+/day)}
- **Weather sensitivity:** {indoor backup needed|flexible|rain or shine}
- **Crowd tolerance:** {prefer off-peak|some crowds OK|don't mind queuing}
- **Cultural immersion:** {photo ops & highlights|some context|full history & stories}
- **Nightlife importance:** {not important|a night or two|essential}
- **Group splitting:** {stay together|maybe for 1-2 activities|totally fine}
- **Souvenir shopping:** {skip|local crafts & food|everything}
- **Relaxation time:** {keep going|short breaks|long leisurely breaks}
- **Social interaction:** {private & intimate|small group OK|love meeting people}
- **Spontaneity:** {prefer the plan|small detours OK|surprise me!}

## Hotel Assistance

- **Accommodation type:** {comma-separated values or "Not specified"}
- **Location priority:** {value}
- **Quality level:** {value}
- **Must-have amenities:** {comma-separated list or "None"}
- **Traveling with pets:** {Yes/No}
- **Cancellation preference:** {value}
- **Daily budget per room:** ${min} - ${max}

## Car Rental Assistance

- **Car category:** {comma-separated values or "Not specified"}
- **Transmission:** {value}
- **Fuel type:** {value}
- **Pickup & return:** {value}
- **Additional equipment:** {comma-separated list or "None"}
- **Daily rental budget:** ${min} - ${max}
```

_The `## Hotel Assistance` and `## Car Rental Assistance` sections are conditional — they appear only when the corresponding toggle is set to Yes in Step 2. If the toggle is No, the section is omitted entirely._

### Output Rules
- Sections with no data are omitted (e.g., no Children table if no kids added)
- Custom interests (from textarea) are appended to the Universal Interests list
- Custom avoids (from textarea) are appended to the Places to Avoid list
- Gender column shows the value or `-` if not selected
- DOB shows year-only, year-month, or full date depending on what was selected; `TBD` if nothing

## How to Modify

### Adding new UI text
1. Add the `data-i18n="key"` attribute to the HTML element (or `data-i18n-placeholder` for input placeholders)
2. Add the key with the English value to `locales/ui_en.json`
3. Add the key with translated values to `locales/ui_ru.json` and `locales/ui_he.json`
4. Add the key with the English fallback value to the remaining 9 `locales/ui_{lang}.json` files
5. Update this document if the key belongs to a documented section

### Adding new items to INTEREST_DB/AVOID_DB/FOOD_DB/VIBE_DB
1. Add the item to the appropriate pool in `trip_intake.html`
2. Add the item's translated name to the `_items` key in `locales/ui_ru.json` and `locales/ui_he.json`
3. Add the item's English identity mapping to the `_items` key in all other 10 `locales/ui_{lang}.json` files
4. Update the pool tables in this document

### Adding a new interest pool
1. Add the flag to `analyzeGroup()` with its condition
2. Add the pool array to `INTEREST_POOLS` (and optionally `AVOID_POOLS`, `VIBE_POOLS`)
3. Add the section label to `SECTION_LABELS`
4. Update the flag tables in this document
5. Add RU and HE translations for all new items to the `_items` key in `locales/ui_ru.json` and `locales/ui_he.json`, and English identity mappings to all other `ui_{lang}.json` files

### Adding a new form field
1. Add the HTML in the appropriate step section
2. Read the value in `generateMarkdown()`
3. Add it to the markdown output template
4. Update the output format spec in this document

### Changing the output structure
The output must remain compatible with `trip_details.md` format. Any structural changes here require corresponding updates to `trip_planning_rules.md` and `content_format_rules.md` which consume the file.
