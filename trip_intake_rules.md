# Trip Intake Page — Business Rules

## Purpose

`trip_intake.html` is a standalone, self-contained wizard page that collects traveler information and outputs `llm_trip_details.md` — the input file the trip generation pipeline reads from. It replaces manual authoring of `trip_details.md` with a guided, user-friendly form.

**File:** `trip_intake.html` (project root)
**Output:** `llm_trip_details.md` (downloaded by user or copied to clipboard)
**Dependencies:** None (standalone HTML — no build step, no external JS frameworks)
**Design spec:** `trip_intake_design.md` (visual layout, CSS classes, component specs, animations)

## Wizard Flow (8 Steps)

The form is a linear multi-step wizard with a progress bar. Steps are numbered 0-7. Each step with a questionnaire follows a standardized pattern: **5 questions per quiz**, auto-advancing, with sub-step dot indicators.

### Step 0 — Where & When

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| Destination | Text + autocomplete | Yes | — | Typeahead via OpenStreetMap Nominatim API |
| Arrival | datetime-local | Yes | — | |
| Departure | datetime-local | Yes | — | Must be after arrival |
| Preferred day start | time | No | 10:00 | Collapsible section |
| Preferred day end | time | No | 18:30 | |
| Buffer time (min) | number | No | 20 | Range 0-60 |

**Validation:** Destination, arrival, and departure are mandatory. Cannot proceed to Step 1 without all three filled. Departure must be after arrival.

### Step 1 — Who's Traveling
Two sections: **Parents/Adults** and **Children**. Both are dynamic lists with add/remove via +/− counter.

#### Parent Card Fields
| Field | Type | Required | Notes |
|---|---|---|---|
| Name / Role | text | Yes | e.g., "Robert", "Anna" |
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

### Step 2 — Travel Style Questionnaire

5 quick visual questions that profile the traveler's preferences. Answers drive **pre-selection** of interest/avoid chips on the next steps. Each question has 3 options (radio behavior — one selected per question). Default is the middle option.

| # | Question Key | Question | Option A | Option B (default) | Option C |
|---|---|---|---|---|---|
| 1 | `energy` | What's your ideal day? | Chill & Relax | Mix of Both | Active & Adventurous |
| 2 | `setting` | Where do you feel most alive? | City Streets | A Bit of Both | Nature & Outdoors |
| 3 | `culture` | What draws you in? | History & Culture | Both | Fun & Entertainment |
| 4 | `food` | How important is food? | A Major Highlight | Enjoy but Not Priority | Just Fuel |
| 5 | `evening` | Your ideal evening? | Cozy Early Night | Dinner & Stroll | Late Night Out |

#### Answer → Pre-selection Mapping

The `getPreSelectionsFromStyle(poolMap)` function scans all items in the active pools and pre-selects those matching keywords associated with each answer:

| Answer | Exact items pre-selected |
|---|---|
| energy=chill | Spa & Thermal Baths, Thermal Baths & Wellness Spas, Botanical Gardens & Arboretums, Gentle River Cruises |
| energy=mixed | Scenic Walking & Viewpoints, Boat or River Cruises |
| energy=active | Hiking & Nature Trails, Cycling & E-bike Tours, Kayaking & Paddleboarding, Rope Parks & Adventure Courses |
| setting=city | Historical Landmarks & Architecture, Shopping (Outlet / Local Brands), Art Galleries & Exhibitions |
| setting=both | Parks & Gardens, Outdoor Markets & Craft Stalls |
| setting=nature | National Parks & Nature Reserves, Waterfalls & Gorges, Lake & Beach Relaxation |
| culture=culture | Historical Landmarks & Architecture, Guided Walking & History Tours, Theater Opera & Ballet |
| culture=both | Cultural Festivals & Local Events, Family-Friendly Museums |
| culture=fun | Arcade Games & Entertainment Centers, Escape Rooms & Puzzle Experiences, Amusement & Theme Parks |
| food=highlight | Local Food Markets & Street Food, Local Cooking Classes, Wine Tasting & Vineyard Tours |
| food=nice | Local Food Markets & Street Food |
| food=fuel | _(none)_ |
| evening=latenight | Rooftop Bars & Cocktail Lounges, Live Music & Jazz Clubs, Nightclubs & Dance Venues |
| evening=stroll | Photography Spots & Scenic Lookouts |
| evening=early | Scenic Walking & Viewpoints |

**Pre-selection rules:** Each answer maps to 2-4 **exact item names** (not keyword substrings). Total pre-selection target: ~8-15 chips. Items are validated against the pool map — only items that exist in a rendered pool are pre-selected. Duplicates across questions are naturally deduplicated by the Set.

**Reset rule:** When the user leaves the questionnaire step (Step 2), all saved interest/avoid selections are cleared, so changed answers always produce fresh pre-selections. Manual selections are only preserved when navigating between Steps 3↔4↔5 (not when returning through the questionnaire).

### Step 3 — Interests (Dynamic)
Interest chip suggestions are **dynamically generated** based on traveler composition (Step 1) + questionnaire answers (Step 2). A "group summary" banner shows the analyzed group (e.g., "Robert 45y M, Tamir 8y B, Ariel 6y G").

Chips are organized into labeled sections. Only sections matching active profile flags are shown. Chips matching questionnaire answers are **pre-selected**.

Free-text textarea at the bottom for custom interests not in the predefined list.

See §Dynamic Interest Engine below for the full pool definitions and flag logic.

### Step 4 — Avoid & Pace
Three parts:
1. **Avoid Mini-Quiz** — 5 visual card questions (auto-advance):

| # | Question Key | Question | Option A | Option B (default) | Option C |
|---|---|---|---|---|---|
| 1 | `mobility` | How active can your group be? | Take It Easy | Moderate | Very Active |
| 2 | `noise` | What's your crowd & noise comfort? | Quiet & Calm | Flexible | Bring the Energy |
| 3 | `foodadventure` | How adventurous with food? | Keep It Safe | Open to Try | Fearless Foodie |
| 4 | `budget` | What's your spending comfort? | Budget-Friendly | Worth the Spend | Treat Ourselves |
| 5 | `flexibility` | How structured should the plan be? | Stick to the Plan | Loose Framework | Go with the Flow |

After quiz completes, quiz collapses and avoid cards + pace selector appear below.

2. **Things to Avoid** — Dynamic cards scored by quiz answers (mobility, noise, foodadventure, budget, flexibility dimensions) + free-text textarea
3. **Trip Pace** — 3 options:
   - Relaxed (2-3 activities/day)
   - Balanced (3-5, quality over quantity) — **default selected**
   - Action-Packed (5+ activities)

### Step 5 — Food & Dining
**Food Mini-Quiz** — 5 visual card questions (auto-advance):

| # | Question Key | Question | Options |
|---|---|---|---|
| 1 | `diet` | What does your group eat? | Everything / Meat Lovers / Mostly Veggie / Plant-Based |
| 2 | `diningstyle` | Where do you love eating? | Street Food & Markets / Casual Restaurants (default) / Upscale Dining |
| 3 | `kidsfood` | Any dietary restrictions or allergies? | Very Picky / Some Flexibility (default) / Eats Everything |
| 4 | `mealpriority` | Which meal matters most? | Breakfast & Brunch / Lunch is King / Dinner is the Event (default) |
| 5 | `localfood` | How local should the food be? | Keep It Familiar / Mix of Both (default) / Full Local Immersion |

After quiz completes, quiz collapses and food experience cards + dining vibe cards appear below.

| Field | Type | Notes |
|---|---|---|
| Food experience cards | dynamic cards | Scored by diet, dining style, adventure, localness |
| Dining Vibe | chip group (dynamic) | Built from vibe pools matching traveler flags |
| Food notes textarea | textarea | Allergies, must-haves, dislikes |

### Step 6 — Language & Extras
| Field | Type | Notes |
|---|---|---|
| Report Language | select | Options: English, Russian, Hebrew, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic |
| POI Languages | text | Comma-separated, e.g., "Hungarian, English" |
| Additional Notes | textarea | Free-form |

### Step 7 — Review & Download
- **Preview:** Rendered markdown in preview box
- **Actions:**
  - "Copy to Clipboard" — copies raw markdown text
  - "Download llm_trip_details.md" — triggers browser download as `.md` file
- **Edit:** "Back" button returns to Step 6

## Destination Autocomplete

Uses **OpenStreetMap Nominatim API** (free, no API key).

### Behavior
- Triggers after 2+ characters typed
- 300ms debounce to avoid excessive API calls
- Max 6 results, deduplicated by city+country
- Each suggestion shows city name (bold) + region/country (muted)
- Keyboard navigation: Arrow Up/Down to highlight, Enter to select, Escape to close
- Click outside closes dropdown
- On selection, input is set to `"City, Country"` format

### API Call
```
GET https://nominatim.openstreetmap.org/search
  ?q={query}&format=json&addressdetails=1&limit=6
  &accept-language=en&featuretype=city
Headers: User-Agent: TripIntakeForm/1.0
```

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
- If `flags[key]` is `true` → render
- Otherwise → skip

Each rendered section gets a labeled header (e.g., "Popular for Everyone", "Great for Ages 4-7", "Popular with Men").

### Selection Persistence
When navigating between steps, selected chip states are saved to `Set` objects (`prevInterestSel`, `prevAvoidSel`) and restored when re-entering the step. This allows the user to go back, change travelers, and return to interests without losing their picks.

### Interest Pools (Current)

| Pool Key | Section Label | Count | Examples |
|---|---|---|---|
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

## Output Format (llm_trip_details.md)

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
- **Dining style:** {street food|casual|upscale}
- **Meal priority:** {breakfast|lunch|dinner focus}
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
```

### Output Rules
- Sections with no data are omitted (e.g., no Children table if no kids added)
- Custom interests (from textarea) are appended to the Universal Interests list
- Custom avoids (from textarea) are appended to the Places to Avoid list
- Gender column shows the value or `-` if not selected
- DOB shows year-only, year-month, or full date depending on what was selected; `TBD` if nothing

## How to Modify

### Adding a new interest pool
1. Add the flag to `analyzeGroup()` with its condition
2. Add the pool array to `INTEREST_POOLS` (and optionally `AVOID_POOLS`, `VIBE_POOLS`)
3. Add the section label to `SECTION_LABELS`
4. Update the flag tables in this document

### Adding a new form field
1. Add the HTML in the appropriate step section
2. Read the value in `generateMarkdown()`
3. Add it to the markdown output template
4. Update the output format spec in this document

### Changing the output structure
The output must remain compatible with `trip_details.md` format. Any structural changes here require corresponding updates to `trip_planning_rules.md` and `content_format_rules.md` which consume the file.
