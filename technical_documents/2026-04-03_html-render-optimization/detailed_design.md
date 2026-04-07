# Detailed Design

**Change:** HTML Render Pipeline Optimization — Script-Based Shell Fragments & Template-Engine Day Generation
**Date:** 2026-04-03
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-04-03_html-render-optimization/high_level_design.md`
**Status:** Revised — SA Review Round 2 (addresses all Blocking items from architecture_review.md)

---

## 1. File Changes

### 1.1 `automation/scripts/generate_shell_fragments.ts` (NEW)

**Action:** Create

**Current state:** N/A — new file

**Target state:** A standalone TypeScript CLI script. Invoked as:
```bash
npx tsx automation/scripts/generate_shell_fragments.ts \
  --trip-folder <path> \
  --lang <lang_code>
```

**Preflight check (FB-7 resolution):**
The script MUST begin with a Node.js version check:
```typescript
const nodeVersion = parseInt(process.versions.node.split('.')[0], 10);
if (nodeVersion < 18) {
  process.stderr.write(
    `ERROR: generate_shell_fragments.ts requires Node.js >= 18 (found ${process.versions.node}).\n` +
    `Upgrade Node.js and retry.\n`
  );
  process.exit(1);
}
```
This check runs before any arg parsing. Exit code 1 if Node.js < 18.

**Script logic:**

```
1. Node.js version preflight check (>= 18 required; exit(1) with message if not met)

2. Parse CLI args: --trip-folder (required), --lang (required)
   - Missing or empty either arg: stderr "ERROR: --trip-folder and --lang are required"; exit(1)

3. Read and JSON.parse <trip-folder>/manifest.json
   - If missing or malformed: stderr "ERROR: manifest.json missing or invalid at <path>"; exit(1)

4. Validate language in manifest (FB-15 resolution):
   - If manifest.languages[lang] is undefined:
     stderr "ERROR: language '{lang}' not found in manifest.json. Available: {Object.keys(manifest.languages).join(', ')}"; exit(1)

5. Derive PAGE_TITLE (FB-1 resolution — language-agnostic, no Russian fallback):
   - destination = manifest.destination  (e.g. "Budapest, Hungary")
   - year = manifest.arrival.substring(0, 4)  (e.g. "2026")
   - city = destination.split(",")[0].trim()   (e.g. "Budapest")
   - suffix = TITLE_SUFFIX_BY_LANG[lang] ?? (() => { throw new Error(`Unsupported lang: ${lang}`) })()
     where TITLE_SUFFIX_BY_LANG is a constant lookup table (see below)
   - PAGE_TITLE = `${city} ${year} — ${suffix}`
   NOTE: The fragment_overview_LANG.html fallback is ELIMINATED entirely. PAGE_TITLE is
   always derived from manifest + language lookup table. There is no dependency on any
   previously-generated HTML file.

6. Determine present files in trip folder:
   - hasAccommodation = fs.existsSync(`${tripFolder}/accommodation_${lang}.md`)
   - hasCarRental     = fs.existsSync(`${tripFolder}/car_rental_${lang}.md`)

7. Build ordered section list:
   sections = ["overview"]
   if hasAccommodation: sections.push("accommodation")
   if hasCarRental:     sections.push("car-rental")
   // Enumerate day files via glob (FB-14 resolution — more robust than manifest arithmetic)
   dayFiles = fs.readdirSync(tripFolder)
     .filter(f => /^day_\d{2}_${lang}\.md$/.test(f))
     .sort()  // lexicographic sort = numeric order for zero-padded names
   dayNumbers = dayFiles.map(f => parseInt(f.slice(4, 6), 10))
   for each dayNumber in dayNumbers:
     sections.push(`day-${dayNumber}`)
   sections.push("budget")

8. Build NAV_LINKS (one <a class="sidebar__link"> per section):
   - First section gets is-active + aria-current="page"
   - Each entry: <a class="sidebar__link [is-active]" href="#{id}" [aria-current="page"]>
       <svg ...>  (section-type-specific inline SVG, 16x16, aria-hidden="true")
       <span>{label}</span>
     </a>
   - Labels (language-agnostic — read from manifest, never hardcoded for day titles):
     · overview → manifest.languages[lang].overview_title if present, else NAV_LABEL_OVERVIEW[lang]
     · accommodation → NAV_LABEL_ACCOMMODATION[lang]
     · car-rental → NAV_LABEL_CAR_RENTAL[lang]
     · day-N → manifest.languages[lang].days[`day_${pad(N,2)}`].title
     · budget → NAV_LABEL_BUDGET[lang]
   NOTE: All non-day labels use per-language constant lookup tables (see below).
   Day labels come from manifest (which stores titles in the trip's language).

9. Build NAV_PILLS (one <a class="mobile-nav__pill [is-active]"> per section):
   - Same order and is-active logic as NAV_LINKS
   - No SVG icons; text only

10. Read shell_fragments_LANG.json from Step 3 — see §1.3 SKILL.md for how
    this JSON is consumed in the assembly step.

11. Write output:
    outputPath = `${tripFolder}/shell_fragments_${lang}.json`
    fs.writeFileSync(outputPath, JSON.stringify({PAGE_TITLE, NAV_LINKS, NAV_PILLS}, null, 2))
    console.log(`Shell fragments written to ${outputPath}`)
    exit(0)
```

**Language lookup tables (FB-1 resolution):**

All label constants are defined at the top of the script. The developer MUST add all supported
languages. Currently supported: `ru`, `en`, `he`.

```typescript
const TITLE_SUFFIX_BY_LANG: Record<string, string> = {
  ru: "Семейный маршрут",
  en: "Family Trip",
  he: "מסלול משפחתי",
};

const NAV_LABEL_OVERVIEW: Record<string, string> = {
  ru: "Обзор",
  en: "Overview",
  he: "סקירה",
};

const NAV_LABEL_ACCOMMODATION: Record<string, string> = {
  ru: "Проживание",
  en: "Accommodation",
  he: "לינה",
};

const NAV_LABEL_CAR_RENTAL: Record<string, string> = {
  ru: "Аренда авто",
  en: "Car Rental",
  he: "השכרת רכב",
};

const NAV_LABEL_BUDGET: Record<string, string> = {
  ru: "Бюджет",
  en: "Budget",
  he: "תקציב",
};
```

If `lang` is not found in a lookup table (i.e., a new language is added without updating the
tables), the script MUST NOT silently fall back to Russian. It MUST exit(1) with:
```
ERROR: generate_shell_fragments.ts — language '{lang}' is missing from label lookup tables.
Add '{lang}' entries to TITLE_SUFFIX_BY_LANG, NAV_LABEL_OVERVIEW, NAV_LABEL_ACCOMMODATION,
NAV_LABEL_CAR_RENTAL, NAV_LABEL_BUDGET before proceeding.
```

**SVG icons for NAV_LINKS** (constants in script — never derived from input):
- overview: home icon (feather home, 16x16)
- accommodation: bed/hotel icon (feather home alt or custom bed SVG, 16x16)
- car-rental: car icon (feather truck/car, 16x16)
- day-N: calendar icon (feather calendar, 16x16)
- budget: credit card icon (feather credit-card, 16x16)

**Exit codes:**
- 0 = success
- 1 = Node.js version too low; manifest.json missing/malformed/missing lang; label table missing lang entry

**Rationale:** Replaces Step 2a LLM subagent. Zero tokens consumed. Deterministic output. Completes in < 500 ms.

---

### 1.2 `automation/scripts/generate_html_fragments.ts` (NEW)

**Action:** Create

**Current state:** N/A — new file

**Target state:** A standalone TypeScript CLI script. Two invocation modes:

```bash
# Full generation: all fragment types
npx tsx automation/scripts/generate_html_fragments.ts \
  --trip-folder <path> \
  --lang <lang_code>

# Incremental: stale days only
npx tsx automation/scripts/generate_html_fragments.ts \
  --trip-folder <path> \
  --lang <lang_code> \
  --stale-days "1,3,5"
```

**Preflight check (FB-7 resolution):**
Same Node.js >= 18 version check as `generate_shell_fragments.ts`. Placed at top of script
before arg parsing. Exit code 1 with clear message if version requirement not met.

**Module structure:**

```
generate_html_fragments.ts
├── main()                      — CLI entry point, arg parsing, orchestration
├── parseArgs()                 — Validates --trip-folder, --lang, optional --stale-days
│                                  Also validates manifest.languages[lang] exists (FB-15)
├── parseDayFile()              — Parses day_XX_LANG.md → DayData object
├── parseOverviewFile()         — Parses overview_LANG.md → OverviewData object
├── parseBudgetFile()           — Parses budget_LANG.md → BudgetData object
├── parseAccommodationFile()    — Parses accommodation_LANG.md → AccommodationData object
├── parseCarRentalFile()        — Parses car_rental_LANG.md → CarRentalData object
├── renderDayFragment()         — DayData → fragment_day_XX_LANG.html string
├── renderOverviewFragment()    — OverviewData → fragment_overview_LANG.html string
├── renderBudgetFragment()      — BudgetData → fragment_budget_LANG.html string
├── renderAccommodationFragment()— AccommodationData → fragment_accommodation_LANG.html string
├── renderCarRentalFragment()   — CarRentalData → fragment_car_rental_LANG.html string
├── renderPoiCard()             — Single POI → .poi-card HTML string (counts via counter)
├── renderAccommodationCard()   — Single property → .accommodation-card HTML string
├── renderCarRentalCategory()   — Single category → .car-rental-category HTML string
├── renderItineraryTable()      — Schedule table rows → .itinerary-table HTML string
├── renderPricingGrid()         — Cost table → .pricing-grid HTML string
├── renderPlanB()               — Plan B section → .advisory--info[data-section-type="plan-b"] string
├── SVG_ICONS                   — Constant map of all SVG strings used in output
├── FLAG_SVG                    — Country flag SVG map (see §1.2.5 — FB-4 resolution)
└── escapeHtml()                — Escapes &, <, >, ", ' in text content
```

---

#### 1.2.1 Data Types

```typescript
interface PoiData {
  headingEmoji: string;       // e.g. "💦", "🏛️", "🛒", "🎯"
  name: string;               // Full heading text after emoji
  tag: string;                // Computed: emoji + uppercase label
  rating?: string;            // e.g. "4.5" or "4.5/5"
  reviewCount?: string;       // e.g. "2,340" (already formatted)
  accessible: boolean;        // true if ♿ present
  mapsUrl?: string;
  siteUrl?: string;
  photoUrl?: string;
  phone?: string;             // Raw phone string from markdown
  description: string[];      // Array of paragraph strings (before links section)
  proTip?: string;
  isAccommodation: false;
  isCarRental: false;
}

interface AccommodationCardData {
  name: string;
  rating?: string;
  reviewCount?: string;
  mapsUrl?: string;
  siteUrl?: string;
  photoUrl?: string;
  phone?: string;
  priceLevel: number;         // 1–4
  description: string;
  bookingUrl: string;
  bookingLabel: string;
  proTip?: string;
  stayIndex: number;          // S in id="accom-stay-{S}-{N}"
  cardIndex: number;          // N in id="accom-stay-{S}-{N}"
}

interface CarRentalCategoryData {
  name: string;
  rows: CarRentalRow[];
  estimateText: string;
  recommendationText: string;
  proTip?: string;
}

interface CarRentalRow {
  company: string;
  dailyRate: string;
  total: string;
  bookingUrl: string;
  bookingLabel: string;
}

interface ItineraryRow {
  time: string;
  activityRaw: string;        // Original markdown activity text
  details: string;
  poiRef?: string;            // Resolved POI name if matches a POI in the day
}

interface DayData {
  dayNumber: number;
  title: string;              // Full heading text, e.g. "День 1 — Остров Маргит 🏊"
  dateStr: string;            // e.g. "Пятница, 21 августа 2026"
  area: string;
  mapLink?: string;           // Optional Google Maps day route link
  itineraryRows: ItineraryRow[];
  pois: PoiData[];
  pricingRows: string[][];    // Raw table rows from ### Стоимость дня
  planB?: string;             // Content of ### 🅱️ section
  poiNameIndex: Map<string, number>; // normalized POI name part → 1-based index
}
```

---

#### 1.2.2 Markdown Parser Design

**Preprocessing (FB-11 resolution — CRLF/BOM handling):**

Before line splitting, every parse function MUST apply:
```typescript
function preprocessContent(raw: string): string {
  // Strip UTF-8 BOM if present (prevents h1 detection failure on first line)
  let content = raw.replace(/^\uFEFF/, '');
  // Normalize CRLF and lone CR to LF
  content = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  return content;
}
```
This preprocessing step MUST occur before splitting into lines in ALL parse functions
(`parseDayFile`, `parseOverviewFile`, `parseBudgetFile`, `parseAccommodationFile`,
`parseCarRentalFile`). Without it, BOM will cause FSM to never enter `FRONT_MATTER` state,
producing empty DayData with zero POIs and a confusing error.

The parser operates on the preprocessed file line-by-line using a finite-state machine with these states:

```
FRONT_MATTER        — Day header lines (# heading, **Дата:**, **Район:**)
SCHEDULE_TABLE      — Inside the ### Расписание table
MAP_LINK            — The 🗺️ Google Maps day route link line
POI_SECTION         — Inside a ### POI heading block
POI_LINKS           — The links paragraph within a POI (📍, 🌐, 📸, 📞)
PRICING_TABLE       — Inside the ### Стоимость дня table
PLAN_B              — Inside the ### 🅱️ block
ACCOMMODATION_FRONT — accommodation_LANG.md header
ACCOMMODATION_CARD  — Inside a ### 🏨 card block (parseAccommodationFile only)
CAR_RENTAL_FRONT    — car_rental_LANG.md header
CAR_RENTAL_CATEGORY — Inside a ### 🚗 category block (parseCarRentalFile only)
CAR_RENTAL_TABLE    — Inside the comparison table
OVERVIEW_FRONT      — overview_LANG.md header and holiday advisory
OVERVIEW_TABLE      — Phase A summary table
BUDGET_TABLE        — budget_LANG.md tables
```

**POI boundary detection:**
- A line matching `/^### /` starts a new section
- `### 🏨` → ONLY valid in `parseAccommodationFile()` — accommodation card
- `### 🚗` → ONLY valid in `parseCarRentalFile()` — car rental category
- `### 🅱️` → plan B section (not a POI)
- `### Расписание` → schedule table (not a POI); match is language-agnostic: detect by presence of `### ` followed by non-emoji text that matches the schedule heading pattern (see note below)
- `### Стоимость дня` → pricing table (not a POI); same language-agnostic detection note
- `### 🛒` → **POI section** — MUST produce `.poi-card` output and be counted in parity (FB-3 resolution)
- `### 🎯` → **POI section** — MUST produce `.poi-card` output and be counted in parity (FB-3 resolution)
- All other `### ` → POI section

**Explicit statement (FB-3 resolution):**
`### 🛒` and `### 🎯` headings are POI sections and MUST produce `.poi-card` output.
They are included in the POI parity count alongside all other POI types.
The FSM "All other `### `" branch handles them; they are NOT listed in the non-POI exclusion list.
The implementation checklist (§5) includes an explicit checkbox for this.

**Cross-file boundary enforcement (FB-5 resolution):**
`parseDayFile()` MUST treat `### 🏨` in a day file as a hard error:
```
ERROR: generate_html_fragments.ts — {dayFile}: unexpected ### 🏨 heading.
Accommodation headings are only valid in accommodation_LANG.md, not in day files.
```
Similarly, `parseDayFile()` MUST treat `### 🚗` in a day file as a hard error:
```
ERROR: generate_html_fragments.ts — {dayFile}: unexpected ### 🚗 heading.
Car rental headings are only valid in car_rental_LANG.md, not in day files.
```
Both conditions trigger exit(1). They are NOT treated as POIs or silently skipped.
These error conditions MUST be added to the error list in §1.2.6.

**Note on language-agnostic section detection:**
`### Расписание` and `### Стоимость дня` are the Russian-language headings. For full
language-agnostic operation these headings should be detected by a configurable pattern.
However, since `content_format_rules.md` specifies these exact headings and does not define
multilingual variants, the implementation may match these Russian strings for now.
The DD explicitly acknowledges this as the single remaining language dependency in the parser;
it is acceptable until `content_format_rules.md` adds multi-language schedule/cost headings.

**Links detection within POI:**
- Line starting with `📍` → maps URL
- Line starting with `🌐` → site URL
- Line starting with `📸` → photo URL
- Line starting with `📞` → phone number (extract digits + leading `+`)
- Line starting with `⭐` → rating + optional review count
- Line starting with `♿` → accessibility = true

**Phone number normalization (FB-3 resolution — exact regex specified):**

```typescript
function normalizePhone(raw: string): string {
  // Step 1: Extract only [+\d] characters from the raw string
  // Step 2: If string starts with +, keep the + and all following digits
  // Step 3: Strip everything after the first non-digit that follows the leading +
  // Implementation:
  const hasPlus = raw.trimStart().startsWith('+');
  const digitsOnly = raw.replace(/[^\d]/g, '');
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}
```

This regex guarantees:
- `+36 1 234-5678` → `+3612345678`
- `(36) 1 234-5678` → `3612345678`
- `+36 1 234-5678 ext. 99` → `+3612345678` (extension dropped because non-digits are stripped)
- `+972-50-123-4567` → `+97250123456`

The `tel:` href uses the normalized value: `href="tel:{normalizePhone(raw)}"`.

**Two-pass POI linking (FB-12 resolution — multilingual slash-name handling):**

Pass 1: Walk all `### ` headings that are POI sections. For each POI heading:
1. Extract the full name text (heading text after emoji)
2. Normalize the full name: lowercase, strip emojis, strip punctuation (`/[^\w\s]/gu`), trim, collapse whitespace
3. Split by `/` (the Hungarian Name / Russian Name separator pattern) into name parts
4. Normalize each part independently using the same rules
5. Store ALL non-empty normalized parts in `poiNameIndex → 1-based index`

Example:
- Heading: `### 💦 Palatinus Strand / Палатинус`
- Full normalized: `"palatinus strand  палатинус"`
- Split parts: `["palatinus strand", "палатинус"]`
- Map entries: `"palatinus strand" → 1`, `"палатинус" → 1`

Pass 2: For each itinerary row's activity text:
1. Normalize the activity text the same way (lowercase, strip emojis, strip punctuation, trim)
2. For each POI in `poiNameIndex`, check if the normalized activity text **contains** any of
   the POI's normalized name parts as a substring
3. Use the LONGEST matching part to reduce false positives (prefer specific over generic)
4. If matched: render `<a class="activity-label" href="#poi-day-{D}-{N}">`
5. If not matched: render `<span class="activity-label">`

**False positive mitigation:** Match must be for the longest part only; a short generic part
(e.g., `"рынок"` from `"Рынок / Piac"`) that matches inside a generic phrase should not win
over a longer, more specific part that also matches. Implementation: collect all matching parts
for all POIs, then select the one with the longest matched part string.

**`escapeHtml()` application rules (FB-17 resolution):**

`escapeHtml()` MUST be applied to every user-supplied text value before interpolation into HTML.
The following table is exhaustive — any interpolation point NOT listed here is an implementation bug:

| Template location | Field | escapeHtml applied? | Notes |
|---|---|---|---|
| `renderPoiCard` | `poi.name` | YES | |
| `renderPoiCard` | `poi.tag` | YES | |
| `renderPoiCard` | `poi.rating` | YES | |
| `renderPoiCard` | `poi.reviewCount` | YES | |
| `renderPoiCard` | `poi.description[i]` | YES | inline markdown stripped to plain text |
| `renderPoiCard` | `poi.proTip` | YES | |
| `renderPoiCard` | link href values | NO | URLs passed as-is; malformed URLs are a source data problem |
| `renderItineraryTable` | `row.time` | YES | |
| `renderItineraryTable` | `row.activityRaw` | YES | after POI link resolution |
| `renderItineraryTable` | `row.details` | YES | |
| `renderDayFragment` | `day.title` | YES | |
| `renderDayFragment` | `day.dateStr` | YES | |
| `renderDayFragment` | `day.area` | YES | |
| `renderPricingGrid` | cell content | YES | |
| `renderPlanB` | `content` | YES | |
| `renderOverviewFragment` | all text fields | YES | |
| `renderAccommodationCard` | `card.name` | YES | |
| `renderAccommodationCard` | `card.description` | YES | |
| `renderAccommodationCard` | `card.proTip` | YES | |
| `renderCarRentalCategory` | `cat.name` | YES | |
| `renderCarRentalCategory` | `cat.estimateText` | YES | |
| `renderCarRentalCategory` | `cat.recommendationText` | YES | |
| `renderCarRentalCategory` | `row.company` | YES | |
| `renderCarRentalCategory` | `row.dailyRate` | YES | |
| `renderCarRentalCategory` | `row.total` | YES | |
| `renderBudgetFragment` | all cell content | YES | |

**Inline markdown in text fields:** Activity text and description paragraphs may contain
`**bold**` or `_italic_` markdown. The script strips these markers to plain text
(remove `**`, `*`, `__`, `_` wrapping) before applying `escapeHtml()`. Full markdown-to-HTML
conversion is out of scope for this change.

---

#### 1.2.3 HTML Rendering Rules (Template Functions)

**`renderPoiCard(poi: PoiData, dayNum: number, poiIndex: number, lang: string): string`**

Output structure (matches `fragment_day_01_ru.html` reference implementation):
```html
<div class="poi-card" id="poi-day-{dayNum}-{poiIndex}">
  <div class="poi-card__body">
    <span class="poi-card__tag">{tag}</span>
    [if rating] <span class="poi-card__rating">⭐ {rating} [({reviewCount})]</span>
    [if accessible] <span class="poi-card__accessible">♿</span>
    <h3 class="poi-card__name">{name}</h3>
    [foreach paragraph in description]
      <p class="poi-card__description">{paragraph}</p>
    [if proTip]
      <div class="pro-tip">
        {SVG_ICONS.info}
        <span>{proTip}</span>
      </div>
    <div class="poi-card__links">
      [if mapsUrl]  <a class="poi-card__link" data-link-type="maps"  href="{mapsUrl}"  target="_blank" rel="noopener noreferrer">{SVG_ICONS.mapPin} 📍 {LINK_LABELS_BY_LANG[lang].maps}</a>
      [if siteUrl]  <a class="poi-card__link" data-link-type="site"  href="{siteUrl}"  target="_blank" rel="noopener noreferrer">{SVG_ICONS.globe}  🌐 {LINK_LABELS_BY_LANG[lang].site}</a>
      [if photoUrl] <a class="poi-card__link" data-link-type="photo" href="{photoUrl}" target="_blank" rel="noopener noreferrer">{SVG_ICONS.camera} 📸 {LINK_LABELS_BY_LANG[lang].photo}</a>
      [if phone]    <a class="poi-card__link" data-link-type="phone" href="tel:{normalizePhone(phone)}" target="_blank" rel="noopener noreferrer">{SVG_ICONS.phone} 📞 {LINK_LABELS_BY_LANG[lang].phone}</a>
    </div>
  </div>
</div>
```

**`data-link-type` values for ALL link types (FB-5 resolution — complete enumeration):**

| Element class | data-link-type value | Used in |
|---|---|---|
| `poi-card__link` | `maps` | POI card Maps link |
| `poi-card__link` | `site` | POI card Site link |
| `poi-card__link` | `photo` | POI card Photo link |
| `poi-card__link` | `phone` | POI card Phone link |
| `accommodation-card__link` | `maps` | Accommodation card Maps link |
| `accommodation-card__link` | `site` | Accommodation card Site link |
| `accommodation-card__link` | `photo` | Accommodation card Photo link |
| `accommodation-card__link` | `phone` | Accommodation card Phone link |
| `booking-cta` | `booking` | Accommodation booking CTA button |
| `rental-cta` | `rental-booking` | Car rental booking CTA |

Every `<a>` element in a POI card or accommodation card MUST have `data-link-type` set.
The `booking-cta` and `rental-cta` link types are implementation requirements for the
Playwright tests in `accommodation.spec.ts` and `car-rental.spec.ts`.

**Key rules implemented:**
- Links block ALWAYS renders after all description paragraphs (REQ-002 AC-10)
- Link order: Maps → Site → Photo → Phone (REQ-002 AC-6)
- Phone link absent if no phone in source (REQ-002 AC-6)
- Site link label always `🌐 {LINK_LABELS_BY_LANG[lang].site}` — never brand name, never hardcoded Russian (REQ-002 AC-7; `rendering-config.md` Link Label Consistency; NB-4 resolution)
- Rating rendered only if present (REQ-002 AC-8)
- Accessibility badge rendered only if ♿ in source (REQ-002 AC-9)
- Pro-tip uses `<div class="pro-tip">` (REQ-002 AC-11)

**`renderItineraryTable(rows: ItineraryRow[], dayNum: number, poiNameIndex: Map): string`**

- For each row: if `poiRef` resolved, render `<a class="activity-label" href="#poi-day-{D}-{N}">` 
- Otherwise: render `<span class="activity-label">`
- Time cells get `class="col-time"`
- Wraps in `<div class="itinerary-table-wrapper"><table class="itinerary-table">`

**`renderDayFragment(day: DayData): string`**

Full day-card structure:
```html
<div class="day-card" id="day-{N}">
  <div class="day-card__banner">
    <h2 class="day-card__banner-title" style="color: var(--color-text-inverse)">{title}</h2>
    <p class="day-card__banner-date" style="color: var(--color-text-inverse)">{dateStr}</p>
  </div>
  <div class="day-card__content">
    [if mapLink] <a class="map-link" href="{mapLink}" target="_blank" rel="noopener noreferrer">🗺️ ...</a>
    {renderItineraryTable(day)}
    <div class="itinerary-grid">
      {foreach poi: renderPoiCard(poi, dayNum, index, lang)}
    </div>
    [if pricingRows] {renderPricingGrid(day)}
    [if planB] {renderPlanB(day)}
  </div>
</div>
```

**Themed container rule (REQ-002 AC-16):** Banner children use inline `style="color: var(--color-text-inverse)"`. This is belt-and-suspenders alongside the CSS class rule. The inline style ensures the themed container rule is never broken regardless of CSS reset specificity.

**IMPORTANT — inline style is mandatory (FB-16 resolution):** The inline `style` on banner children MUST NOT be removed even though CSS class-based color also exists. The pre-regression gate (Step 4, `development_rules.md` §3 item 12) validates the CSS class definition, not the inline style. The inline style is the operative runtime defense. Removing it would break themed container display without triggering the pre-regression gate.

**Map link placement:** Rendered BEFORE `itinerary-table-wrapper`, immediately after `day-card__content` opening tag (matches `rendering-config.md` §Daily Route Map Link).

**`renderPricingGrid(rows: string[][]): string`**

- Wraps in `<div class="pricing-grid">`
- Each data row → `<div class="pricing-cell"><span class="pricing-cell__label">...</span><span class="pricing-cell__amount">...</span><span class="pricing-cell__currency">...</span></div>`
- Total row detection: **the last non-empty data row** in the pricing table — detected by structural position, NOT by matching any language-specific string such as `**Итого**` (FB-7 resolution — language-agnostic)
- Total row rendered with `<strong>` wrapping on content cells
- Does NOT use `itinerary-table` for pricing data (uses `pricing-grid`)

**`renderPlanB(content: string): string`**

```html
<div class="advisory advisory--info" data-section-type="plan-b">
  {SVG_ICONS.info}
  <div>
    <h3 class="advisory__title">🅱️ {title}</h3>
    <div class="advisory__body">{content}</div>
  </div>
</div>
```

**`renderOverviewFragment(data: OverviewData): string`**

```html
<section id="overview">
  <h1 class="page-title">{title} {FLAG_SVG[countryCode]}</h1>
  <p class="page-subtitle">{subtitle}</p>
  [if holidayAdvisory]
    <div class="advisory advisory--warning">
      {SVG_ICONS.warning}
      <div>
        <h3 class="advisory__title">⚠️ {advisoryTitle}</h3>
        <div class="advisory__body">{advisoryContent}</div>
      </div>
    </div>
  <h2 class="section-title">{tableTitle}</h2>
  <div class="itinerary-table-wrapper">
    <table class="itinerary-table">
      <thead><tr>{headers}</tr></thead>
      <tbody>{rows}</tbody>
    </table>
  </div>
</section>
```

**No day-number column:** The overview table is rendered directly from the `overview_LANG.md`
markdown table content (which was generated without the day-number column per
`content_format_rules.md`). The parser skips any "День" / day-number column if detected.

**Country flag SVG (FB-4 resolution — minimum required set enumerated):**

The script MUST include all flags in the `FLAG_SVG` constant map. Unrecognized countries
MUST cause `exit(1)` — silent omission of the flag SVG is not acceptable.

**Minimum required flag set (covers all current and immediately planned destinations):**

| Code | Country |
|---|---|
| `HU` | Hungary |
| `IL` | Israel |
| `DE` | Germany |
| `FR` | France |
| `ES` | Spain |
| `IT` | Italy |
| `GB` | United Kingdom |
| `US` | United States |
| `PT` | Portugal |
| `GR` | Greece |
| `CZ` | Czech Republic |
| `AT` | Austria |
| `PL` | Poland |

Country code is derived from `manifest.destination`:
```typescript
function extractCountryCode(destination: string): string {
  // destination format: "City, Country" e.g. "Budapest, Hungary"
  // Map country name to ISO 3166-1 alpha-2 code
  const country = destination.split(',').slice(1).join(',').trim();
  const code = COUNTRY_NAME_TO_CODE[country.toLowerCase()];
  if (!code) {
    process.stderr.write(
      `ERROR: generate_html_fragments.ts — unrecognized country "${country}" in manifest.destination.\n` +
      `Add "${country.toLowerCase()}" to COUNTRY_NAME_TO_CODE and add its SVG to FLAG_SVG.\n`
    );
    process.exit(1);
  }
  return code;
}
```

Each flag SVG must have `role="img"` and `aria-label="{country name} flag"` (REQ-002 AC-12).
SVG sources: use the `flag-icons` CSS library SVG files or equivalent public domain country
flag SVGs (square or 4:3 ratio, 16x24 or 16x16).

**`renderAccommodationFragment(data: AccommodationData): string`**

```html
<div class="accommodation-section" id="accommodation">
  <h2 class="section-title accommodation-section__title">{sectionTitle}</h2>
  <p class="accommodation-section__intro">{introText}</p>
  <div class="accommodation-grid">
    {foreach card: renderAccommodationCard(card, lang)}
  </div>
</div>
```

Note (NB-2 resolution): The wrapper element is `<div>`, NOT `<section>`. This matches `rendering-config.md` §Accommodation Section & Card Layout (`<div class="accommodation-section" id="accommodation">`) and BRD AC-15 exactly. The `rendering-config.md` rule is NOT being changed — the DD previously introduced a `<section>` tag in error; this revision reverts it to align with the existing contract.

**`renderAccommodationCard(card: AccommodationCardData, lang: string): string` (FB-2 resolution)**

Full template with explicit `data-link-type` on all link elements:

```html
<div class="accommodation-card" id="accom-stay-{S}-{N}">
  <span class="accommodation-card__tag">🏨</span>
  [if rating] <span class="accommodation-card__rating">⭐ {rating}/5 ({reviewCount})</span>
  <h3 class="accommodation-card__name">{name}</h3>
  <div class="accommodation-card__links">
    [if mapsUrl]  <a class="accommodation-card__link" data-link-type="maps"  href="{mapsUrl}"  target="_blank" rel="noopener noreferrer">{SVG_ICONS.mapPin} 📍 {LINK_LABELS_BY_LANG[lang].maps}</a>
    [if siteUrl]  <a class="accommodation-card__link" data-link-type="site"  href="{siteUrl}"  target="_blank" rel="noopener noreferrer">{SVG_ICONS.globe}  🌐 {LINK_LABELS_BY_LANG[lang].site}</a>
    [if photoUrl] <a class="accommodation-card__link" data-link-type="photo" href="{photoUrl}" target="_blank" rel="noopener noreferrer">{SVG_ICONS.camera} 📸 {LINK_LABELS_BY_LANG[lang].photo}</a>
    [if phone]    <a class="accommodation-card__link" data-link-type="phone" href="tel:{normalizePhone(phone)}" target="_blank" rel="noopener noreferrer">{SVG_ICONS.phone} 📞 {LINK_LABELS_BY_LANG[lang].phone}</a>
  </div>
  <div class="accommodation-card__price-level">
    {repeat priceLevel times: <span class="price-pip price-pip--filled">💰</span>}
    {repeat (4-priceLevel) times: <span class="price-pip price-pip--empty">○</span>}
  </div>
  <div class="accommodation-card__description">{description}</div>
  <a class="booking-cta" data-link-type="booking" href="{bookingUrl}" target="_blank" rel="noopener noreferrer">🔗 {bookingLabel}</a>
  [if proTip]
    <div class="pro-tip">{SVG_ICONS.info} <div>{proTip}</div></div>
</div>
```

Note: The `booking-cta` element now includes `data-link-type="booking"` (FB-5 resolution).
Every `<a>` in accommodation must have `data-link-type` to satisfy `accommodation.spec.ts`.

**`renderCarRentalFragment(data: CarRentalData): string`**

```html
<section id="car-rental" class="car-rental-section" role="region" aria-labelledby="car-rental-title-{blockId}">
  <h2 class="section-title car-rental-section__title" id="car-rental-title-{blockId}">{sectionTitle}</h2>
  <p class="car-rental-section__intro">{introText}</p>
  {foreach category: renderCarRentalCategory(category)}
</section>
```

**`renderCarRentalCategory(cat: CarRentalCategoryData): string`**

```html
<div class="car-rental-category">
  <span class="car-rental-category__tag">🚗</span>
  <h3 class="car-rental-category__title">{name}</h3>
  <div class="car-rental-table-wrapper">
    <table class="car-rental-table">
      <thead><tr><th>...</th><th>...</th><th>...</th><th>...</th></tr></thead>
      <tbody>
        {foreach row:}
          <tr>
            <td>{company}</td>
            <td>{dailyRate}</td>
            <td>{total}</td>
            <td><a class="rental-cta" data-link-type="rental-booking" href="{bookingUrl}" target="_blank" rel="noopener noreferrer">{bookingLabel}</a></td>
          </tr>
      </tbody>
    </table>
  </div>
  <p class="car-rental-category__estimate"><em>{estimateText}</em></p>
  <p class="car-rental-category__recommendation">💡 {recommendationText}</p>
  [if proTip] <div class="pro-tip">{SVG_ICONS.info} <div>{proTip}</div></div>
</div>
```

**`renderBudgetFragment(data: BudgetData): string`**

- Wraps in `<section id="budget">`
- Renders multiple tables (per-day summary, accommodation estimate, car rental estimate) as `<div class="itinerary-table-wrapper"><table class="itinerary-table">` blocks
- **Total row detection (FB-7 resolution — language-agnostic):** Total row is the **last non-empty
  data row** of each budget table. Detection is purely structural — the last `<tr>` in the `<tbody>`
  that is not a separator row. This does NOT match any language-specific string (`**Итого**`,
  `**Total**`, or any other text). The last row receives `<strong>` content wrapping.
- Language-agnostic structure validation: CSS selector `#budget table tbody tr:last-child strong` (not text matching)

Note (FB-13 observation): `itinerary-table` is correctly used for the budget fragment (summary table),
not `pricing-grid`. `pricing-grid` is for day-level per-item cost tables. This distinction is correct
per existing LLM behavior and should be documented in `rendering-config.md` separately.

---

#### 1.2.4 POI Parity Validation (Built-In)

**FB-6 resolution — counter-based parity (not string scanning):**

Rather than post-hoc string matching on the rendered HTML, parity is tracked via an explicit
counter incremented at the call site of `renderPoiCard()`:

```typescript
// Inside renderDayFragment():
let renderedPoiCount = 0;
const poiCards = day.pois.map((poi, idx) => {
  renderedPoiCount++;
  return renderPoiCard(poi, day.dayNumber, idx + 1, lang);
});

if (renderedPoiCount !== day.pois.length) {
  throw new Error(
    `POI parity failure in day ${day.dayNumber}: parsed ${day.pois.length} POIs, ` +
    `rendered ${renderedPoiCount} cards`
  );
}
```

This assertion fires BEFORE the fragment file is written (before the atomic rename step),
guaranteeing parity or aborting with a clear error (REQ-002 AC-2; REQ-005 AC-4).

The counter approach is immune to string-matching artifacts (no false positives from
pro-tip text containing HTML, no false negatives from quote-style changes).

**Parity scope clarification (FB-3 resolution):**
`day.pois` MUST include all `### ` headings that are POI sections, including `### 🛒` and
`### 🎯` headings. The parity check is per-day. If a day has 2 regular POIs + 1 `🛒` + 1 `🎯`,
then `day.pois.length = 4` and `renderedPoiCount` must equal 4.

---

#### 1.2.5 SVG Constants and Language Label Constants

**Link label lookup tables (NB-4 resolution — language-agnostic POI and accommodation card labels):**

All user-visible link labels in card renderers MUST be looked up per-language. The following
constants MUST be defined at the top of `generate_html_fragments.ts` and used in ALL card
renderer functions (`renderPoiCard()`, `renderAccommodationCard()`, and any future card
renderer). Hardcoded Russian strings are NOT acceptable.

```typescript
const LINK_LABELS_BY_LANG: Record<string, {
  site:  string;
  photo: string;
  phone: string;
  maps:  string;
  book:  string;
}> = {
  ru: { site: "Сайт",        photo: "Фото",   phone: "Телефон",  maps: "Maps", book: "Забронировать" },
  en: { site: "Site",        photo: "Photos", phone: "Phone",    maps: "Maps", book: "Book" },
  he: { site: "אתר",         photo: "תמונות", phone: "טלפון",    maps: "Maps", book: "הזמנה" },
};
```

All renderer functions that output link labels accept `lang: string` as a parameter and
resolve labels as `LINK_LABELS_BY_LANG[lang].site`, `LINK_LABELS_BY_LANG[lang].photo`, etc.
If `lang` is not in `LINK_LABELS_BY_LANG`, the script MUST exit(1) with:
```
ERROR: generate_html_fragments.ts — language '{lang}' is missing from LINK_LABELS_BY_LANG.
Add '{lang}' entries to LINK_LABELS_BY_LANG before proceeding.
```

Note: `rendering-config.md` §POI Card Structure currently states "all site/website links
MUST use the exact label `🌐 Сайт`". That rule is Russian-specific. The `rendering-config.md`
update (§1.4) must extend this rule to: "site link label MUST use `LINK_LABELS_BY_LANG[lang].site`
for the given trip language". The English label is `Site`; Hebrew is `אתר`.

**All SVG strings are defined as `const SVG_ICONS` in the script. Each string has:**
- Explicit `width` and `height` attributes (REQ-002 AC-12)
- `aria-hidden="true"` for decorative icons (REQ-002 AC-12)
- `role="img"` + `aria-label` for semantic icons (country flag)
- Feather icon style (`fill="none"`, `stroke="currentColor"`, `stroke-width="2"`)

Constant keys: `mapPin`, `globe`, `camera`, `phone`, `info`, `warning`, `calendar`,
`creditCard`, `home`, `car`.

Country flags are defined in a separate `FLAG_SVG` constant map keyed by ISO 3166-1 alpha-2
country code (uppercase). See minimum required set in §1.2.3 `renderOverviewFragment`.

---

#### 1.2.6 Error Handling

All errors follow the same pattern:
```
ERROR: [script name] — [file path]: [description]
```

Exit code 1 on any error. No partial output files are written when an error occurs
(write to temp file then rename on success — see atomic write pattern below).

**Temp file naming convention (FB-6 observation resolution):**
Temp files use suffix `.tmp` with a process ID: `fragment_day_01_ru.html.{pid}.tmp`.
A script crash leaving a `.tmp` file is diagnosable by the `.tmp` extension and visible PID.

Specific error conditions:
- Node.js version < 18 (both scripts)
- `manifest.json` missing or invalid JSON
- Language `--lang` not present in `manifest.languages` (FB-15 resolution)
- Language `--lang` missing from label lookup tables (generate_shell_fragments.ts only)
- Country in `manifest.destination` not found in `COUNTRY_NAME_TO_CODE` or `FLAG_SVG`
- Required day file missing (`day_NN_LANG.md`) when expected by day enumeration
- Day file has zero POI headings when day number > 0 (Day 0 arrival is exempt — may have 0 POIs)
- **Day file contains `### 🏨` heading** → error, accommodation headings are only valid in accommodation_LANG.md (FB-5 resolution)
- **Day file contains `### 🚗` heading** → error, car rental headings are only valid in car_rental_LANG.md (FB-5 resolution)
- POI parity assertion failure (per-day)
- `accommodation_LANG.md` exists but has zero `### 🏨` cards
- `car_rental_LANG.md` exists but has zero `### 🚗` categories

Warnings (non-fatal, logged to stderr with `WARN:` prefix):
- Activity label text matches no POI name (rendered as `<span>` — expected for generic actions)
- POI has no links at all (renders empty `<div class="poi-card__links">`)

---

### 1.3 `.claude/skills/render/SKILL.md` (MODIFIED)

**Action:** Modify

**Current state:** Steps 2a, 2b, 2c, 2d, 2.5 describe spawning LLM subagents.

**Target state:** Rewrite to describe script invocation. The following section changes are required:

**Step 2a replacement:**
```markdown
**Step 2a — Shell fragment script:**
Run `generate_shell_fragments.ts` to produce PAGE_TITLE, NAV_LINKS, and NAV_PILLS:

\`\`\`bash
rtk npx tsx automation/scripts/generate_shell_fragments.ts \
  --trip-folder "{trip_folder_path}" \
  --lang "{lang_code}"
\`\`\`

Check exit code. If non-zero: report the error message from stderr and stop — do NOT proceed to Step 2c.
On success: shell_fragments_{lang}.json is written to the trip folder and consumed in Step 3.
```

**Step 2b — Remove:** Batch assignment table is no longer needed. The script processes all files sequentially in a single invocation.

**Step 2c replacement:**
```markdown
**Step 2c — HTML fragment generation script:**
Run `generate_html_fragments.ts` to produce all fragment files:

\`\`\`bash
rtk npx tsx automation/scripts/generate_html_fragments.ts \
  --trip-folder "{trip_folder_path}" \
  --lang "{lang_code}"
\`\`\`

The script generates all fragment types in one invocation:
- `fragment_overview_{lang}.html`
- `fragment_accommodation_{lang}.html` (only if `accommodation_{lang}.md` exists)
- `fragment_car_rental_{lang}.html` (only if `car_rental_{lang}.md` exists)
- `fragment_day_00_{lang}.html` through `fragment_day_NN_{lang}.html`
- `fragment_budget_{lang}.html`

Check exit code. If non-zero: report the per-file error messages from stderr and stop.
No retry loop — errors require investigation (missing/malformed source files).
```

**Step 2d replacement:**
```markdown
**Step 2d — Fragment verification:**
Verify all expected fragment files exist using Bash ls or Glob:
- `fragment_overview_{lang}.html`
- `fragment_accommodation_{lang}.html` (only if `accommodation_{lang}.md` exists)
- `fragment_car_rental_{lang}.html` (only if `car_rental_{lang}.md` exists)
- `fragment_day_00_{lang}.html` through `fragment_day_NN_{lang}.html`
- `fragment_budget_{lang}.html`

If any are missing: the script would have already exited with non-zero code and error message.
Re-running the script without fixing the underlying cause will produce the same error.
Report and stop — do NOT proceed to assembly.
```

**Step 2.5 replacement:**
```markdown
**Script Invocation Contract (replaces Agent Prompt Contract)**

Both scripts accept:
- `--trip-folder <path>` — absolute or relative path to the trip folder (required)
- `--lang <lang_code>` — ISO 639-1 language code matching file suffixes (required)
- `--stale-days <comma-list>` — day numbers to regenerate (incremental mode; generate_html_fragments.ts only)

Exit codes: 0 = success; 1 = validation or parse error (message to stderr).

Scripts are located at `automation/scripts/` and run via `npx tsx`.
Node.js >= 18 is required. Both scripts include a preflight version check and will exit
with a clear error message if the requirement is not met.
```

**Step 3 update (FB-9 resolution — explicit shell_fragments_LANG.json consumption):**

Step 3 assembly MUST be updated to read `shell_fragments_{lang}.json` before substituting
placeholders in `base_layout.html`. The updated Step 3 description:

```markdown
**Step 3 — Assembly:**
Read `{trip_folder}/shell_fragments_{lang}.json` (written by Step 2a):

\`\`\`typescript
const shellFragments = JSON.parse(
  fs.readFileSync(`${tripFolder}/shell_fragments_${lang}.json`, 'utf8')
);
const PAGE_TITLE = shellFragments.PAGE_TITLE;
const NAV_LINKS  = shellFragments.NAV_LINKS;
const NAV_PILLS  = shellFragments.NAV_PILLS;
\`\`\`

Substitute into `base_layout.html` placeholders:
- `{{PAGE_TITLE}}` → `PAGE_TITLE`
- `{{NAV_LINKS}}`  → `NAV_LINKS`
- `{{NAV_PILLS}}`  → `NAV_PILLS`

Then concatenate all fragment files in section order (overview → accommodation? →
car-rental? → day-00 … day-NN → budget) to produce `trip_full_{lang}.html`.

If `shell_fragments_{lang}.json` is missing: Step 2a did not complete successfully.
Re-run Step 2a before proceeding.
```

This replaces any prior Step 3 description that relied on in-memory strings from a subagent.

**Incremental rebuild section update:**

```markdown
**Incremental rebuild exception:**
When only specific days changed (detected via `manifest.json → assembly.stale_days`):

\`\`\`bash
rtk npx tsx automation/scripts/generate_html_fragments.ts \
  --trip-folder "{trip_folder_path}" \
  --lang "{lang_code}" \
  --stale-days "{comma-separated day numbers}"
\`\`\`

Re-run `generate_shell_fragments.ts` (which also re-writes shell_fragments_{lang}.json) if ANY
of the following structural changes occurred (FB-10 resolution):
- Days added or removed from the trip
- A day title changed in manifest.json (FB-18 resolution — manifest must be updated first)
- `accommodation_{lang}.md` added or removed
- `car_rental_{lang}.md` added or removed

Then proceed to in-place HTML section replacement as before.
```

**Rationale:** Removes all LLM subagent delegation from the render skill. Steps 2a and 2c are now single Bash invocations. No prompt engineering, no context loading, no parallel subagent management.

---

### 1.4 `rendering-config.md` (MODIFIED)

**Action:** Modify — HTML Generation Pipeline section only

**Current state:** Steps 2a–2d and 2.5 describe LLM subagent orchestration (parallel spawning, batch sizing table, agent prompt contract items).

**Target state:** Rewrite these sections to describe the deterministic script model. Preserve all component-level rules (POI card structure, accommodation, car rental, activity labels, SVG requirements, themed container rule, etc.) — those sections are unchanged.

**Specific section changes:**

| Section | Change |
|---|---|
| Step 2a (Shell Fragments) | Replace subagent description with script invocation description. Remove "sequential subagent" language. Add note: shell_fragments_{lang}.json is consumed by Step 3 Read. |
| Step 2b (Batch Assignment) | Remove the batch sizing table — no longer applicable. Replace with: "The fragment generation script processes all files in a single sequential invocation; no batching is required." |
| Step 2c (Parallel Subagent Execution) | Replace with: "Run `generate_html_fragments.ts` script (see SKILL.md for invocation). The script generates all fragment types in one pass." Remove all subagent-specific language. |
| Step 2d (Fragment Verification) | Simplify: verification is now a file-existence check; the script errors on missing source files before writing output. |
| Step 2.5 (Agent Prompt Contract) | Replace heading with "Script Output Contract". List output files and exit code semantics. Remove all 29 mandatory-item prompt rules. |
| Step 3 (Assembly) | Add: "Read shell_fragments_{lang}.json from trip folder to get PAGE_TITLE, NAV_LINKS, NAV_PILLS. Substitute into base_layout.html placeholders." (FB-9 resolution) |

**Sections NOT changed:**
- All component usage rules (POI cards, accommodation, car rental, activity labels, pricing, etc.)
- SVG requirements
- Themed container rule
- Overview, budget, plan B section rules
- Page header rules
- Navigation rules
- Interactive elements section
- Step 1 (Analyze Data)
- Incremental HTML Rebuild section
- **Accommodation Section & Card Layout rule** — specifically, the rule `<div class="accommodation-section" id="accommodation">` is NOT changed. The DD §1.2.3 `renderAccommodationFragment()` template uses `<div>` to match this rule. (NB-2 resolution: a prior draft of the DD incorrectly used `<section>`; this has been reverted.)

---

### 1.5 `automation/scripts/tsconfig.json` (NEW — FB-8 resolution)

**Action:** Create

A dedicated `tsconfig.json` for the scripts folder to ensure correct TypeScript compilation
independent of the Playwright-specific tsconfig in `automation/code/`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "lib": ["ES2022"]
  },
  "include": ["*.ts"],
  "exclude": ["node_modules"]
}
```

`npx tsx` respects `tsconfig.json` in the script's directory. Both scripts must compile
cleanly under `--strict` with no TypeScript errors before PE code review approval.
The implementation checklist (§5) includes a checkbox for this.

---

## 2. Markdown Format Specification

No changes to markdown format. The scripts parse the existing `content_format_rules.md` format without modification. All day files, accommodation files, car rental files, overview files, and budget files continue to use the same format.

---

## 3. HTML Rendering Specification

The output HTML is structurally identical to what LLM subagents currently produce. Reference implementation: `generated_trips/trip_2026-04-03_0021/fragment_day_01_ru.html` (and corresponding fragment files in the same folder).

Key structural invariants enforced by the scripts (not to be varied):

**POI card ID pattern:** `id="poi-day-{D}-{N}"` where D = day number (no leading zero), N = 1-based POI index within the day.

**Accommodation card ID pattern:** `id="accom-stay-{S}-{N}"` where S = 1-based stay block number, N = 1-based option index within that stay.

**Car rental section aria:** `<section id="car-rental" class="car-rental-section" role="region" aria-labelledby="car-rental-title-{blockId}">` where blockId comes from `manifest.car_rental.blocks[0].id`.

**Activity label rules:**
- Named POI reference → `<a class="activity-label" href="#poi-day-{D}-{N}">`
- Generic action → `<span class="activity-label">`
- Never an `<a>` without a valid `href` target

**Day banner themed container:** Banner children use `style="color: var(--color-text-inverse)"` as inline style override in addition to being members of CSS classes that set color. This is belt-and-suspenders implementation of the themed container rule.

---

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `rendering-config.md` | § HTML Generation Pipeline — Steps 2a, 2b, 2c, 2d, 2.5, Step 3 | Replace LLM subagent model with script invocation model; add Step 3 JSON read (see §1.4 above) |
| `.claude/skills/render/SKILL.md` | Steps 2a, 2b, 2c, 2d, 2.5, Step 3, Incremental Rebuild | Replace subagent orchestration with script invocation; add Step 3 JSON consumption; add incremental triggers (see §1.3 above) |
| `content_format_rules.md` | All sections | No change |
| `automation_rules.md` | All sections | No change |
| `development_rules.md` | All sections | No change (pre-regression gate unchanged) |

---

## 5. Implementation Checklist

### Script: `generate_shell_fragments.ts`
- [ ] Node.js >= 18 preflight check — exit(1) with message if not met (FB-7)
- [ ] CLI arg parser: `--trip-folder`, `--lang` with validation
- [ ] `manifest.json` reader with JSON.parse + error handling
- [ ] Validate `manifest.languages[lang]` exists before accessing — exit(1) if missing (FB-15)
- [ ] `TITLE_SUFFIX_BY_LANG` lookup table: `ru`, `en`, `he` entries
- [ ] `NAV_LABEL_*` lookup tables: `ru`, `en`, `he` entries for all 5 nav sections
- [ ] `PAGE_TITLE` derived from manifest.destination + year + `TITLE_SUFFIX_BY_LANG[lang]` — NO Russian fallback, NO reading from any HTML file (FB-1)
- [ ] Section list builder: enumerate day files via `fs.readdirSync` + regex filter + sort (FB-14)
- [ ] Day file existence confirmed via enumeration (not manifest arithmetic)
- [ ] `NAV_LINKS` renderer with correct SVG icons, is-active on first only
- [ ] Day nav labels from `manifest.languages[lang].days[day_NN].title` (not hardcoded)
- [ ] Non-day nav labels from lookup tables (not hardcoded)
- [ ] `NAV_PILLS` renderer matching NAV_LINKS order, is-active on first only
- [ ] `shell_fragments_LANG.json` writer
- [ ] Exit code 0 on success, exit code 1 + stderr on any error
- [ ] Manual test: run against `generated_trips/trip_2026-04-03_0021` → verify JSON output matches current trip_full_ru.html nav structure

### Script: `generate_html_fragments.ts`
- [ ] Node.js >= 18 preflight check — exit(1) with message if not met (FB-7)
- [ ] CLI arg parser: `--trip-folder`, `--lang`, `--stale-days` (optional)
- [ ] `manifest.json` reader; validate `manifest.languages[lang]` exists (FB-15)
- [ ] `preprocessContent()` — BOM strip + CRLF normalization in ALL parse functions (FB-11)
- [ ] `SVG_ICONS` constants: mapPin, globe, camera, phone, info, warning, calendar, creditCard, home, car
- [ ] `FLAG_SVG` constant map — all 13 minimum required countries (HU, IL, DE, FR, ES, IT, GB, US, PT, GR, CZ, AT, PL) (FB-4)
- [ ] `COUNTRY_NAME_TO_CODE` map for all 13 countries (FB-4)
- [ ] `extractCountryCode()` — exit(1) on unrecognized country, NOT silent omission (FB-4)
- [ ] `escapeHtml()` utility applied at ALL interpolation points listed in §1.2.2 table (FB-17)
- [ ] `normalizePhone()` — regex: keep `+` prefix + `[^\d]` stripped (FB-3 exact specification)
- [ ] `parseDayFile()` — BOM/CRLF preprocessing; FSM for all day file sections
- [ ] `parseDayFile()` — exit(1) on `### 🏨` in day file (FB-5)
- [ ] `parseDayFile()` — exit(1) on `### 🚗` in day file (FB-5)
- [ ] `parseDayFile()` — `### 🛒` counted as POI in `day.pois` (FB-3)
- [ ] `parseDayFile()` — `### 🎯` counted as POI in `day.pois` (FB-3)
- [ ] Two-pass POI name index: split by `/`, normalize each part, store all parts (FB-12)
- [ ] POI activity matching: use longest-matching part strategy (FB-12)
- [ ] `parseOverviewFile()` — BOM/CRLF preprocessing; header, holiday advisory, table
- [ ] `parseBudgetFile()` — BOM/CRLF preprocessing; multiple tables, last-row total detection (FB-7)
- [ ] `parseAccommodationFile()` — BOM/CRLF preprocessing; section header, intro, card blocks
- [ ] `parseCarRentalFile()` — BOM/CRLF preprocessing; section header, intro, category blocks with tables
- [ ] `LINK_LABELS_BY_LANG` constant table defined with `ru`, `en`, `he` entries for site, photo, phone, maps, book (NB-4)
- [ ] `renderPoiCard()` — all fields, correct order, conditional elements; accepts `lang` parameter
- [ ] `renderPoiCard()` — all `<a>` elements have `data-link-type` (maps, site, photo, phone) (FB-5)
- [ ] `renderPoiCard()` — all link labels use `LINK_LABELS_BY_LANG[lang].*` — NO hardcoded Russian strings (NB-4)
- [ ] `renderAccommodationCard()` — accepts `lang` parameter; all link labels use `LINK_LABELS_BY_LANG[lang].*` (NB-4)
- [ ] `renderItineraryTable()` — activity label linking, time column class
- [ ] `renderPricingGrid()` — pricing-cell structure, last-row total detection (language-agnostic) (FB-7)
- [ ] `renderPlanB()` — advisory--info with data-section-type="plan-b"
- [ ] `renderDayFragment()` — full day-card structure, map link before table
- [ ] `renderDayFragment()` — inline `style="color: var(--color-text-inverse)"` on banner children MANDATORY (FB-16)
- [ ] `renderOverviewFragment()` — section#overview, h1 + FLAG_SVG, subtitle, advisory, table
- [ ] `renderBudgetFragment()` — section#budget, multiple itinerary-table blocks, last-row bold (FB-7)
- [ ] `renderAccommodationCard()` — full template with explicit `data-link-type` on all links including `booking-cta` (FB-2, FB-5)
- [ ] `renderAccommodationFragment()` — accommodation-section wrapper
- [ ] `renderCarRentalCategory()` — car-rental-category, table, estimate, recommendation
- [ ] `renderCarRentalFragment()` — car-rental-section wrapper with role/aria
- [ ] POI parity assertion: counter-based (not string scan), per-day, fires BEFORE file write (FB-6, FB-3)
- [ ] Stale-only mode (`--stale-days` flag)
- [ ] Error handling: fail-fast, per-file messages, exit code 1
- [ ] Write to temp file `fragment_*.html.{pid}.tmp` then rename (atomic write) (FB-6 observation)
- [ ] `automation/scripts/tsconfig.json` — strict mode, scripts compile cleanly (FB-8)
- [ ] Manual test: run against `generated_trips/trip_2026-04-03_0021` → diff output vs existing fragment files
- [ ] Edge-case test: run against a day file containing at least one `🛒` and one `🎯` heading — verify `.poi-card` output and correct parity count (FB-3)
- [ ] Multi-language test: run against a non-Russian trip fragment (English or Hebrew) to confirm language-agnostic behavior (FB-4 best practice)

### Rule file updates
- [ ] Update `rendering-config.md` Steps 2a–2d, 2.5, and Step 3 (add JSON read) (FB-9)
- [ ] Update `.claude/skills/render/SKILL.md` Steps 2a, 2b, 2c, 2d, 2.5, Step 3, Incremental Rebuild (FB-9, FB-10, FB-18)
- [ ] Update SKILL.md incremental section: add all 4 structural-change triggers for re-running shell fragment script (FB-10, FB-18)

### Validation
- [ ] PE code review of both scripts — covers all items in §4 Best Practice list from architecture_review.md
- [ ] Run full Playwright regression against script-generated HTML
- [ ] Verify POI parity per-day: counter fires before write; check all days including day 0
- [ ] Verify `🛒` and `🎯` POI cards present and counted in parity
- [ ] Verify accommodation `data-link-type` attributes on all link types including `booking-cta`
- [ ] Verify navigation: NAV_LINKS order matches expected sections for trip_2026-04-03_0021
- [ ] Verify incremental mode: modify day_01_ru.md, run with `--stale-days 1`, verify only fragment_day_01_ru.html changes
- [ ] Verify English/Hebrew generation: page title uses correct language suffix, not Russian fallback

---

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: < 500 ms | `generate_shell_fragments.ts` — pure string ops, no I/O except manifest read + JSON write |
| REQ-001 | AC-2: One `<a>` per section in mandatory order | `generate_shell_fragments.ts` §1.1 section list builder |
| REQ-001 | AC-3: NAV_PILLS matches NAV_LINKS order | `generate_shell_fragments.ts` §1.1 — same section list, different renderer |
| REQ-001 | AC-4: Exactly one is-active, always first link | `generate_shell_fragments.ts` §1.1 — first section hardcoded as active |
| REQ-001 | AC-5: #accommodation only if file exists | `generate_shell_fragments.ts` §1.1 `hasAccommodation = fs.existsSync(...)` |
| REQ-001 | AC-6: #car-rental only if file exists | `generate_shell_fragments.ts` §1.1 `hasCarRental = fs.existsSync(...)` |
| REQ-001 | AC-7: PAGE_TITLE pattern — language-agnostic | `generate_shell_fragments.ts` §1.1 — manifest + TITLE_SUFFIX_BY_LANG lookup table (FB-1) |
| REQ-001 | AC-8: Non-zero exit on missing/malformed manifest | `generate_shell_fragments.ts` §1.1 error handling |
| REQ-001 | AC-9: navigation.spec.ts passes | No test changes; script produces identical nav structure |
| REQ-002 | AC-1: < 10 s for 12-day trip | `generate_html_fragments.ts` — sequential FS reads + string concat; no network |
| REQ-002 | AC-2: POI parity — every `###` POI = one .poi-card | `generate_html_fragments.ts` §1.2.4 counter-based parity assertion (FB-6) |
| REQ-002 | AC-3: 🏨 → .accommodation-card; 🚗 → .car-rental-category | `generate_html_fragments.ts` §1.2.2 cross-file boundary enforcement (FB-5) |
| REQ-002 | AC-4: `id="poi-day-{D}-{N}"` | `generate_html_fragments.ts` §1.2.3 `renderPoiCard()` |
| REQ-002 | AC-5: Activity label linking | `generate_html_fragments.ts` §1.2.2 two-pass algorithm with slash-part matching (FB-12) |
| REQ-002 | AC-6: Link order Maps→Site→Photo→Phone; no phone if absent | `generate_html_fragments.ts` §1.2.3 `renderPoiCard()` |
| REQ-002 | AC-7: Site link label is language-specific, never brand name | `generate_html_fragments.ts` §1.2.3 `LINK_LABELS_BY_LANG[lang].site` (NB-4 resolution) |
| REQ-002 | AC-8: Rating conditional | `generate_html_fragments.ts` §1.2.3 `[if rating]` branch |
| REQ-002 | AC-9: ♿ badge conditional | `generate_html_fragments.ts` §1.2.3 `[if accessible]` branch |
| REQ-002 | AC-10: Links after description | `generate_html_fragments.ts` §1.2.3 `renderPoiCard()` — links div always last |
| REQ-002 | AC-11: pro-tip uses `.pro-tip` | `generate_html_fragments.ts` §1.2.3 `renderPoiCard()` |
| REQ-002 | AC-12: SVG width/height/aria-hidden | `generate_html_fragments.ts` §1.2.5 SVG constants |
| REQ-002 | AC-13: #overview uses section wrapper, no day-card | `generate_html_fragments.ts` §1.2.3 `renderOverviewFragment()` |
| REQ-002 | AC-14: #budget uses section wrapper, total row with strong | `generate_html_fragments.ts` §1.2.3 `renderBudgetFragment()` — last-row detection (FB-7) |
| REQ-002 | AC-15: .accommodation-section and .car-rental-section at top level | `generate_html_fragments.ts` §1.2.3 — separate fragment files |
| REQ-002 | AC-16: Banner children with explicit color | `generate_html_fragments.ts` §1.2.3 `renderDayFragment()` inline style — MANDATORY (FB-16) |
| REQ-002 | AC-17: Language-agnostic | Label lookup tables; manifest day titles; no Russian strings in page title or nav (FB-1) |
| REQ-002 | AC-18: Non-zero exit on missing/invalid source | `generate_html_fragments.ts` §1.2.6 fail-fast error handling |
| REQ-002 | AC-19: Full regression passes | Structural identity with LLM output + data-link-type on accommodation (FB-2) |
| REQ-002 | AC-20: 12-point structural validation passes | Same HTML structure; Step 4 gate unchanged |
| REQ-003 | AC-1: SKILL.md Step 2a describes script invocation | `SKILL.md` §1.3 |
| REQ-003 | AC-2: SKILL.md Step 2c describes script, no subagents | `SKILL.md` §1.3 |
| REQ-003 | AC-3: SKILL.md incremental uses --stale-days | `SKILL.md` §1.3 incremental section (FB-10, FB-18) |
| REQ-003 | AC-4: Agent Prompt Contract replaced with Script Invocation Contract | `SKILL.md` §1.3 step 2.5 replacement |
| REQ-003 | AC-5: rendering-config.md updated to reflect script model + Step 3 JSON read | `rendering-config.md` §1.4 (FB-9) |
| REQ-004 | AC-1–AC-4: PE code review before merge | Tracked in `architecture_review.md`; expanded checklist covers FB items |
| REQ-005 | AC-1: All spec files pass | Structural identity guarantee + accommodation data-link-type fix (FB-2) |
| REQ-005 | AC-2: No test modifications | Out-of-scope per BRD |
| REQ-005 | AC-3: 12-point validation passes | Enforced by Step 4 gate in SKILL.md (unchanged) |
| REQ-005 | AC-4: POI parity per day | `generate_html_fragments.ts` §1.2.4 counter-based assertion fires before file write |

---

## 7. SA Review Resolution

This section documents how each Blocking item from `architecture_review.md` was resolved in this revision.

| # | Blocking Item | Resolution |
|---|---|---|
| FB-1 | PAGE_TITLE hard-codes Russian suffix; fragment_overview fallback creates race condition | **Resolved.** `TITLE_SUFFIX_BY_LANG` lookup table added with `ru`, `en`, `he` entries. Derivation is always `manifest.destination + year + TITLE_SUFFIX_BY_LANG[lang]`. The `fragment_overview_LANG.html` fallback is eliminated entirely. If `lang` is not in the table the script exits(1) with a message to add the entry. See §1.1 script logic step 5 and language lookup tables. |
| FB-2 | `accommodation-card__link` missing `data-link-type` | **Resolved.** `renderAccommodationCard()` template expanded with full HTML showing explicit `data-link-type` on all four link types (maps, site, photo, phone) and on `booking-cta` (`data-link-type="booking"`). Complete `data-link-type` enumeration table added to §1.2.3. Implementation checklist §5 includes explicit checkbox. |
| FB-3 | `### 🛒` and `### 🎯` not explicitly confirmed as POI → parity risk | **Resolved.** §1.2.2 now includes an explicit statement: "`### 🛒` and `### 🎯` headings are POI sections and MUST produce `.poi-card` output and be counted in parity." §1.2.4 parity section clarifies that `day.pois` includes all POI types including `🛒` and `🎯`. §5 checklist includes explicit checkboxes and an edge-case test requirement. |
| FB-4 | Country flag gap — silent omission on unrecognized country | **Resolved.** Silent omission replaced with `exit(1)` on unrecognized country. Minimum required flag set enumerated: 13 countries (HU, IL, DE, FR, ES, IT, GB, US, PT, GR, CZ, AT, PL). `FLAG_SVG` constant map and `COUNTRY_NAME_TO_CODE` map are required implementation artifacts. See §1.2.3 `renderOverviewFragment` and §1.2.5. |
| FB-5 | `parseDayFile()` silently processes `### 🏨` and `### 🚗` as wrong type | **Resolved.** §1.2.2 now specifies that `parseDayFile()` MUST exit(1) on `### 🏨` or `### 🚗` in a day file context. These are added to the error conditions list in §1.2.6. `ACCOMMODATION_CARD` and `CAR_RENTAL_CATEGORY` FSM states are only reachable from `parseAccommodationFile()` and `parseCarRentalFile()` respectively. |
| FB-7 | Budget total row detection matches Russian `**Итого**` string | **Resolved.** Total row detection in both `renderBudgetFragment()` and `renderPricingGrid()` is now structural: the **last non-empty data row** of the table. No language-specific string matching. §1.2.3 `renderBudgetFragment` and `renderPricingGrid` both specify this. §5 checklist includes explicit checkbox for language-agnostic last-row detection. |
| FB-9 | SKILL.md Step 3 lacks mechanism to consume `shell_fragments_LANG.json` | **Resolved.** §1.3 SKILL.md changes now includes an explicit Step 3 update: read `shell_fragments_{lang}.json`, extract `PAGE_TITLE`, `NAV_LINKS`, `NAV_PILLS`, substitute into `base_layout.html` placeholders. Error handling if JSON is missing specified. `rendering-config.md` §1.4 update table also includes Step 3. See §1.3 "Step 3 update" block. |

**Recommendation items addressed in this revision:**

| # | Item | Action taken |
|---|---|---|
| FB-6 | Parity check uses fragile string scan | **Resolved.** Replaced with counter incremented at `renderPoiCard()` call site. |
| FB-8 | No tsconfig.json for new scripts | **Resolved.** §1.5 specifies a dedicated `automation/scripts/tsconfig.json` with `--strict`. |
| FB-10 | Incremental mode doesn't re-run shell fragments for nav structural changes | **Resolved.** §1.3 incremental section lists 4 structural-change triggers. |
| FB-11 | CRLF/BOM not handled in FSM parser | **Resolved.** `preprocessContent()` function specified in §1.2.2; mandatory in ALL parse functions. |
| FB-12 | Activity label matching: false positive/negative risk with slash-name format | **Resolved.** Pass 1 splits by `/` and stores all normalized parts; Pass 2 uses longest-match strategy. |
| FB-14 | Day enumeration via manifest arithmetic may miss last day | **Resolved.** Section list builder uses `fs.readdirSync` + regex enumeration; manifest arithmetic removed. |
| FB-15 | No validation that `manifest.languages[lang]` exists | **Resolved.** Both scripts validate this in `parseArgs()` / step 4 of shell fragment script; exit(1) with available languages listed. |
| FB-16 | Inline style on banner children not documented as mandatory | **Resolved.** §1.2.3 `renderDayFragment` includes explicit MANDATORY note explaining why inline style must not be removed even though CSS class check also exists. |
| FB-17 | `escapeHtml()` scope underspecified | **Resolved.** §1.2.2 includes exhaustive table of all interpolation points and whether escapeHtml is applied. |
| FB-18 | Day title change doesn't trigger shell fragment re-run | **Resolved.** §1.3 incremental section specifies: re-run shell fragment script if day title changes in manifest. |

**Items not requiring design changes (Observation only):**

| # | Item | Note |
|---|---|---|
| FB-13 | `itinerary-table` for budget vs `pricing-grid` | Correct as-is; observation flagged for future `rendering-config.md` clarification. |

---

## 8. SA Review Resolution — Pass 2

This section documents the resolution of the three Blocking items raised in `architecture_review_pass2.md`.

| # | Blocking Item | Resolution |
|---|---|---|
| NB-1 | FB-1 resolution contained a Russian fallback (`?? TITLE_SUFFIX_BY_LANG["ru"]`) in step 5 pseudo-code, contradicting the prose requirement to exit(1) on unknown lang | **Resolved.** Step 5 pseudo-code in §1.1 is updated to `TITLE_SUFFIX_BY_LANG[lang] ?? (() => { throw new Error(\`Unsupported lang: ${lang}\`) })()`. There is now exactly one specification for this behavior in the DD: the pseudo-code and prose are consistent — unknown language always throws/exits, never falls back to Russian. |
| NB-2 | `renderAccommodationFragment()` template used `<section id="accommodation" class="accommodation-section">`, diverging from `rendering-config.md` and BRD AC-15 which specify `<div class="accommodation-section" id="accommodation">` | **Resolved.** The template in §1.2.3 is reverted to `<div class="accommodation-section" id="accommodation">` to match the existing contract exactly. A note is added in §1.2.3 explicitly stating the wrapper is `<div>`, NOT `<section>`. A note is added to §1.4 confirming the `rendering-config.md` Accommodation Section & Card Layout rule is NOT being changed — the prior draft's use of `<section>` was an error. |
| NB-4 | `renderPoiCard()` and `renderAccommodationCard()` templates had hardcoded Russian link labels (`Сайт`, `Фото`, `Телефон`), violating language-agnostic requirement BRD REQ-002 AC-17 | **Resolved.** A `LINK_LABELS_BY_LANG` constant table is added in §1.2.5, covering `ru`, `en`, and `he` for labels: site (`Сайт` / `Site` / `אתר`), photo (`Фото` / `Photos` / `תמונות`), phone (`Телефон` / `Phone` / `טלפון`), maps (`Maps` for all languages), book (`Забронировать` / `Book` / `הזמנה`). Both `renderPoiCard()` and `renderAccommodationCard()` templates are updated to accept `lang: string` and use `LINK_LABELS_BY_LANG[lang].*` for all link labels. §5 checklist adds explicit checkboxes. BRD traceability row for AC-7 updated. §1.4 note added requiring `rendering-config.md` POI Card Structure site-label rule to be extended to cover language-specific labels. |
