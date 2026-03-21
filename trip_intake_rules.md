# Trip Intake Page — Business Rules

## Purpose

`trip_intake.html` is a standalone, self-contained wizard page that collects traveler information and outputs `llm_trip_details.md` — the input file the trip generation pipeline reads from. It replaces manual authoring of `trip_details.md` with a guided, user-friendly form.

**File:** `trip_intake.html` (project root)
**Output:** `llm_trip_details.md` (downloaded by user or copied to clipboard)
**Dependencies:** None (standalone HTML — no build step, no external JS frameworks)
**Design spec:** `trip_intake_design.md` (visual layout, CSS classes, component specs, animations)

### Internationalization (i18n)

The page supports 12 languages: English, Russian, Hebrew, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic. A language selector in the hero section lets the user switch the entire UI language instantly.

**Rules:**
- All static UI text uses `data-i18n="key"` attributes. Placeholders use `data-i18n-placeholder="key"`.
- The `setLanguage(code)` function translates all marked elements, sets `dir="rtl"` for Hebrew/Arabic, and persists the choice in `localStorage('tripIntakeLang')`.
- Default language: detected from `navigator.language` (browser locale), falling back to English.
- **Interest/avoid card names remain in English** — they are data keys used in the output markdown, not UI chrome.
- The generated markdown output (Step 7 preview) always uses the **Report Language** selected in Step 6, not the UI language.
- When adding new UI text, always include a `data-i18n` attribute and add the key to the `TRANSLATIONS` object for all 12 languages.
- RTL languages (Hebrew, Arabic) flip layout direction: borders, paddings, text alignment, button arrows, and stepper direction all reverse.

## Wizard Flow (8 Steps)

The form is a linear multi-step wizard with a progress bar. Steps are numbered 0-7. Each step with a questionnaire follows a standardized pattern: **3-5 questions per quiz**, auto-advancing, with sub-step dot indicators. Redundant questions were removed — `energy` and `food` (Step 2) and `mobility` (Step 4) are now derived from the pace selector and food adventure answer respectively.

**Question Depth Selector:** After completing Step 1 (Who's Traveling), an overlay presents 5 depth options: 10 (Quick), 15 (Light), 20 (Standard — default), 25 (Detailed), 30 (Deep Dive). The selected depth determines which questions are shown via a tier system. Steps 0, 1, and 7 are always fully present. The selector can be reopened from the context bar depth pill at any point before Step 7. See "Question Inventory & Depth Tiers" section for the full tier table.

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

2-4 visual questions (count varies by depth) that profile the traveler's preferences. Answers drive **pre-selection** of interest/avoid chips on the next steps. Each question has 3 options (radio behavior — one selected per question). Default is the middle option. Sub-step dots are dynamically rebuilt based on visible questions.

| # | Question Key | Tier | Question | Option A | Option B (default) | Option C |
|---|---|---|---|---|---|---|
| 1 | `setting` | T1 | Where do you feel most alive? | City Streets | A Bit of Both | Nature & Outdoors |
| 2 | `culture` | T1 | What draws you in? | History & Culture | Both | Fun & Entertainment |
| 3 | `culturalImmersion` | T3 | How deep do you want to go culturally? | Photo Ops & Highlights | Some Context | Full History & Stories |
| 4 | `nightlife` | T3 | How important is nightlife? | Not At All | A Night or Two | Essential |

**Removed questions (redundant):**
- `energy` ("What's your ideal day?") — redundant with Step 4 pace selector. Now **derived** from pace: relaxed→chill, balanced→mixed, packed→active.
- `food` ("How important is food?") — redundant with Step 4 `foodadventure` + Step 5 `mealpriority`. Now **derived** from foodadventure: fearless→highlight, open→nice, safe→fuel.

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

**Reset rule:** When the user leaves the questionnaire step (Step 2), all saved interest/avoid selections are cleared, so changed answers always produce fresh pre-selections. Manual selections are only preserved when navigating between Steps 3↔4↔5 (not when returning through the questionnaire).

### Step 3 — Interests (Dynamic)
Interest chip suggestions are **dynamically generated** based on traveler composition (Step 1) + questionnaire answers (Step 2). A "group summary" banner shows the analyzed group (e.g., "Robert 45y M, Tamir 8y B, Ariel 6y G").

Chips are organized into labeled sections. Only sections matching active profile flags are shown. Chips matching questionnaire answers are **pre-selected**.

**Local Highlights Rule:** The interest suggestions must always include a "Local Tourist Highlights" section advising the user to visit the destination's most popular and iconic tourist attractions. This section appears for every group composition (it is not gated by any profile flag). It contains a prompt reminding users to consider the destination's top-rated landmarks, viewpoints, and must-see spots. The section header is "🏛️ Local Tourist Highlights" and includes a helper text: "Don't miss the most popular attractions at your destination — the iconic spots every visitor should see."

Free-text textarea at the bottom for custom interests not in the predefined list.

See §Dynamic Interest Engine below for the full pool definitions and flag logic.

### Step 4 — Avoid & Pace
Three parts:
1. **Avoid Mini-Quiz** — up to 16 visual card questions (auto-advance, count varies by depth):

| # | Question Key | Tier | Question | Option A | Option B (default) | Option C |
|---|---|---|---|---|---|---|
| 1 | `noise` | T1 | What's your crowd & noise comfort? | Quiet & Calm | Flexible | Bring the Energy |
| 2 | `foodadventure` | T1 | How adventurous with food? | Keep It Safe | Open to Try | Fearless Foodie |
| 3 | `budget` | T1 | What's your spending comfort? | Budget-Friendly | Worth the Spend | Treat Ourselves |
| 4 | `flexibility` | T1 | How structured should the plan be? | Stick to the Plan | Loose Framework | Go with the Flow |
| 5 | `transport` | T3 | Preferred getting around? | Walking | Public Transit | Taxi & Rideshare |
| 6 | `morningPreference` | T3 | Morning or afternoon person? | Morning Person | No Preference | Afternoon Starter |
| 7 | `visitDuration` | T5 | Attraction visit style? | Quick Highlights | Moderate Exploration | Deep Immersion |
| 8 | `shopping` | T5 | How important is shopping? | Skip It | Browse if Convenient | Dedicated Shopping Time |
| 9 | `walkingTolerance` | T2 | How much walking can your group handle? | Light Walks (~2km) | Moderate (~5km) | Marathon Mode (~10km+) |
| 10 | `weatherSensitivity` | T2 | How does weather affect your plans? | Indoor Backup Please | Flexible | Rain or Shine |
| 11 | `crowdTolerance` | T3 | How do you feel about popular tourist spots? | Prefer Off-Peak | Some Crowds OK | Don't Mind Queuing |
| 12 | `groupSplitting` | T4 | Open to the group splitting up? | Stay Together | Maybe for 1-2 Activities | Totally Fine |
| 13 | `souvenirShopping` | T4 | What kind of souvenirs interest you? | Skip Souvenirs | Local Crafts & Food | Everything |
| 14 | `relaxationTime` | T4 | How much downtime do you need? | Keep Going | Short Breaks | Long Leisurely Breaks |
| 15 | `socialInteraction` | T5 | How social do you want the trip to be? | Private & Intimate | Small Group OK | Love Meeting People |
| 16 | `surpriseOpenness` | T5 | How open are you to spontaneous changes? | Prefer the Plan | Small Detours OK | Surprise Me! |

**Removed question:** `mobility` ("How active can your group be?") — redundant with the pace selector below. Now **derived** from pace: relaxed→limited, balanced→moderate, packed→high.

After quiz completes, quiz collapses and avoid cards + pace selector appear below.

2. **Things to Avoid** — Dynamic cards scored by quiz answers (noise, foodadventure, budget, flexibility + mobility derived from pace) + free-text textarea
3. **Trip Pace** — 3 options:
   - Relaxed (2-3 activities/day)
   - Balanced (3-5, quality over quantity) — **default selected**
   - Action-Packed (5+ activities)

### Step 5 — Food & Dining
**Food Mini-Quiz** — up to 6 visual card questions (auto-advance, count varies by depth):

| # | Question Key | Tier | Question | Options |
|---|---|---|---|---|
| 1 | `diet` | T1 | What does your group eat? | Everything / Meat Lovers / Mostly Veggie / Plant-Based |
| 2 | `diningstyle` | T1 | Where do you love eating? | Street Food & Markets / Casual Restaurants (default) / Upscale Dining |
| 3 | `kidsfood` | T2 | Any dietary restrictions or allergies? | Very Picky / Some Flexibility (default) / Eats Everything |
| 4 | `mealpriority` | T2 | Which meal matters most? | Breakfast & Brunch / Lunch is King / Dinner is the Event (default) |
| 5 | `localfood` | T2 | How local should the food be? | Keep It Familiar / Mix of Both (default) / Full Local Immersion |
| 6 | `snacking` | T4 | How important is snacking? | Skip Snacks / Occasional Nibbles (default) / Serious Snacker |

After quiz completes, quiz collapses and food experience cards + dining vibe cards appear below.

| Field | Type | Notes |
|---|---|---|
| Food experience cards | dynamic cards (supplementary) | Scored by diet, dining style, adventure, localness |
| Dining Vibe | chip group (supplementary) | Built from vibe pools matching traveler flags |
| Food notes textarea | textarea (supplementary) | Allergies, must-haves, dislikes |

### Step 6 — Language & Extras
| Field | Tier | Type | Notes |
|---|---|---|---|
| Report Language | — | select (supplementary) | Options: English, Russian, Hebrew, Spanish, French, German, Italian, Portuguese, Chinese, Japanese, Korean, Arabic |
| POI Languages | — | text (supplementary) | Comma-separated, e.g., "Hungarian, English" |
| Additional Notes | — | textarea (supplementary) | Free-form |
| Photography | T4 | 3-option card | Not a Priority / Nice Bonus (default) / Major Activity |
| Accessibility | T5 | 3-option card | No Special Needs (default) / Prefer Flat Routes / Wheelchair Accessible |

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

## Question Inventory & Depth Tiers

The wizard supports 5 depth levels: 10 (Quick), 15 (Light), 20 (Standard), 25 (Detailed), 30 (Deep Dive). Each question has a tier assignment (T1-T5) that determines at which depth levels it appears.

### Tier Table (Quiz Questions Only)

All 30 tiered questions are real visual quiz-card questions with 3 selectable options each.

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
| interests | Chip selection grid | Step 3 |
| customInterests | Textarea | Step 3 |
| avoidChips | Chip selection grid | Step 4 |
| customAvoid | Textarea | Step 4 |
| foodExperience | Dynamic cards | Step 5 |
| diningVibe | Chip group | Step 5 |
| foodNotes | Textarea | Step 5 |
| reportLang | Dropdown | Step 6 |
| poiLangs | Text input | Step 6 |
| extraNotes | Textarea | Step 6 |

### Depth Defaults

When a question is hidden due to depth selection, its default value is used in the generated markdown. Defaults are always the "middle" or "balanced" option. See the `QUESTION_DEFAULTS` constant in `trip_intake.html` for the complete default values table.

### Step Visibility Rules

- If ALL questions in a step are hidden -> step is auto-skipped (stepper hides it)
- If SOME questions in a step are hidden -> step is shown with reduced content
- Minimum 2 visible questions per shown step; if only 1, merge with adjacent step
- Quiz sub-step dots reflect only visible questions
- At depth 10/15: Step 5 (Food) has only `diet` (1 question) -> merged into Step 4

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

## Additional Preferences

- **Transport preference:** {walking|public transit|taxi & rideshare}
- **Morning preference:** {morning person|no preference|afternoon starter}
- **Snacking importance:** {skip|occasional|serious}
- **Photography importance:** {not a priority|nice bonus|major activity}
- **Visit duration style:** {quick highlights|moderate exploration|deep immersion}
- **Shopping importance:** {skip|browse if convenient|dedicated time}
- **Accessibility needs:** {none|prefer flat routes|wheelchair accessible}
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
