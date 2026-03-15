# Detailed Design

**Change:** Language-Independence Refactor — Eliminate Hardcoded Language & Trip Content from Automation Tests
**Date:** 2026-03-15
**Author:** Development Team
**HLD Reference:** `technical_documents/2026-03-15_language-independence-refactor/high_level_design.md`
**Status:** Revised (SA feedback FB-1 through FB-7 addressed)

---

## 1. File Changes

### 1.1 `automation/code/tests/utils/trip-config.ts` (NEW)

**Action:** Create

**Purpose:** Central utility that extracts all trip-specific and language-specific values from `trip_details.md` and generated markdown. Single source of truth for all spec files.

**Target state:**
```typescript
import * as fs from 'fs';
import * as path from 'path';

// ────────────────────────────────────────────────────────
// Language-to-label mappings
// ────────────────────────────────────────────────────────

interface LanguageLabels {
  langCode: string;             // HTML lang attribute value
  direction: 'ltr' | 'rtl';    // Text direction — inherent property of the script
  dayTitle: (n: number) => string;  // "День 0", "Day 0", "יום 0"
  monthNames: string[];         // 12 month names in locale
  sectionPlanB: string;         // "Запасной план", "Plan B", "תוכנית ב'"
  sectionLogistics: string;     // "Логистика", "Logistics", "לוגיסטיקה"
  sectionCost: string;          // "Стоимость", "Cost", "עלות"
  sectionGrocery: string;       // "Ближайший магазин", "Nearest Store", "חנות קרובה"
  sectionAlongTheWay: string;   // "По пути", "Along the Way", "בדרך"
  sectionTransfer: string;      // "Трансфер", "Transfer", "העברה"
  sectionMornPrep: string;      // "Утренние сборы", "Morning Prep", "הכנות בוקר"
  sectionLunch: string;         // "Обед:", "Lunch:", "ארוחת צהריים:"
  sectionBirthdayLunch: string; // "Праздничный обед", "Birthday Lunch", "ארוחת יום הולדת"
  budgetTotal: string;          // "Итого", "Total", "סה\"כ"
  pageTitlePattern: (destination: string, year: number) => string;
  fileSuffix: string;           // "ru", "en", "he"
  dayHeadingRegex: RegExp;      // /^#{1,2}\s+День\s+(\d+)/, /^#{1,2}\s+Day\s+(\d+)/
}

const LANGUAGE_LABELS: Record<string, LanguageLabels> = {
  Russian: {
    langCode: 'ru',
    direction: 'ltr',
    dayTitle: (n) => `День ${n}`,
    monthNames: ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'],
    sectionPlanB: 'Запасной план',
    sectionLogistics: 'Логистика',
    sectionCost: 'Стоимость',
    sectionGrocery: 'Ближайший магазин',
    sectionAlongTheWay: 'По пути',
    sectionTransfer: 'Трансфер',
    sectionMornPrep: 'Утренние сборы',
    sectionLunch: 'Обед:',
    sectionBirthdayLunch: 'Праздничный обед',
    budgetTotal: 'Итого',
    pageTitlePattern: (dest, year) => `${dest} ${year} — Семейный маршрут`,
    fileSuffix: 'ru',
    dayHeadingRegex: /^#{1,2}\s+День\s+(\d+)/,
  },
  English: {
    langCode: 'en',
    direction: 'ltr',
    dayTitle: (n) => `Day ${n}`,
    monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
    sectionPlanB: 'Plan B',
    sectionLogistics: 'Logistics',
    sectionCost: 'Cost',
    sectionGrocery: 'Nearest Store',
    sectionAlongTheWay: 'Along the Way',
    sectionTransfer: 'Transfer',
    sectionMornPrep: 'Morning Prep',
    sectionLunch: 'Lunch:',
    sectionBirthdayLunch: 'Birthday Lunch',
    budgetTotal: 'Total',
    pageTitlePattern: (dest, year) => `${dest} ${year} — Family Itinerary`,
    fileSuffix: 'en',
    dayHeadingRegex: /^#{1,2}\s+Day\s+(\d+)/,
  },
  Hebrew: {
    langCode: 'he',
    direction: 'rtl',
    dayTitle: (n) => `יום ${n}`,
    monthNames: ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'],
    sectionPlanB: 'תוכנית ב׳',
    sectionLogistics: 'לוגיסטיקה',
    sectionCost: 'עלות',
    sectionGrocery: 'חנות קרובה',
    sectionAlongTheWay: 'בדרך',
    sectionTransfer: 'העברה',
    sectionMornPrep: 'הכנות בוקר',
    sectionLunch: 'ארוחת צהריים:',
    sectionBirthdayLunch: 'ארוחת יום הולדת',
    budgetTotal: 'סה"כ',
    pageTitlePattern: (dest, year) => `${dest} ${year} — מסלול משפחתי`,
    fileSuffix: 'he',
    dayHeadingRegex: /^#{1,2}\s+יום\s+(\d+)/,
  },
};

// ────────────────────────────────────────────────────────
// Language-to-label contract (FB-1):
//   - Every entry must implement ALL LanguageLabels fields (enforced by TypeScript)
//   - Section names must exactly match the rendering pipeline's output text
//   - fileSuffix must match the trip_full_{suffix}.html naming convention
//   - direction is an inherent property of the script, not user-configurable
//   - To add a new language: add one entry here, no spec files change
// ────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────
// Trip details extraction
// ────────────────────────────────────────────────────────

export interface TripConfig {
  // From trip_details.md
  destination: string;
  arrivalDate: Date;
  departureDate: Date;
  dayCount: number;             // total days including arrival + departure
  travelers: string[];          // all traveler names
  reportingLanguage: string;    // "Russian", "English", "Hebrew"

  // Derived from reporting language
  labels: LanguageLabels;

  // Derived from dates + language
  dayTitles: string[];          // ["День 0", "День 1", ...]
  dayDates: string[];           // ["20 августа", "21 августа", ...]
  tripYear: number;
  pageTitle: string;            // "Budapest 2026 — Семейный маршрут"

  // File paths (derived from reporting language)
  markdownFilename: string;     // "trip_full_ru.md"
  htmlFilename: string;         // "trip_full_ru.html"

  // Text direction (derived from reporting language script)
  direction: 'ltr' | 'rtl';

  // Excluded sections for markdown parsing (language-specific names)
  excludedSections: string[];
}

// Module-level cache (FB-5): file is read once, result is frozen and reused.
let _cached: TripConfig | null = null;

export function loadTripConfig(): TripConfig {
  if (_cached) return _cached;

  const projectRoot = path.resolve(__dirname, '..', '..', '..', '..');
  const tripDetailsPath = path.resolve(projectRoot, 'trip_details.md');
  const raw = fs.readFileSync(tripDetailsPath, 'utf-8');

  // Parse destination
  const destMatch = raw.match(/\*\*Destination:\*\*\s*(.+)/i);
  const destination = destMatch ? destMatch[1].trim().split(',')[0].trim() : 'Unknown';

  // Parse dates
  const arrivalMatch = raw.match(/\*\*Arrival:\*\*\s*(.+)/i);
  const departureMatch = raw.match(/\*\*Departure:\*\*\s*(.+)/i);
  const arrivalDate = new Date(arrivalMatch![1].trim());
  const departureDate = new Date(departureMatch![1].trim());

  // Calculate day count
  const msPerDay = 86400000;
  const dayCount = Math.round((departureDate.getTime() - arrivalDate.getTime()) / msPerDay) + 1;

  // Parse travelers (parents + children)
  const travelers: string[] = [];
  // Parents table: | Role | Date |  → extract Role column
  const parentRows = raw.match(/\|\s*(\w+)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/g);
  if (parentRows) {
    for (const row of parentRows) {
      const m = row.match(/\|\s*(\w+)\s*\|/);
      if (m) travelers.push(m[1]);
    }
  }
  // Children table: | Name | Date | Interests | Notes |  → extract Name column
  const childSection = raw.split('### Children')[1];
  if (childSection) {
    const childRows = childSection.match(/\|\s*(\w+)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/g);
    if (childRows) {
      for (const row of childRows) {
        const m = row.match(/\|\s*(\w+)\s*\|/);
        if (m) travelers.push(m[1]);
      }
    }
  }

  // Parse reporting language
  const reportingMatch = raw.match(/\*\*Reporting language:\*\*\s*(.+)/i);
  const reportingLanguage = reportingMatch ? reportingMatch[1].trim() : 'English';

  // Get language labels
  const labels = LANGUAGE_LABELS[reportingLanguage];
  if (!labels) {
    throw new Error(
      `No label mapping for reporting language "${reportingLanguage}". ` +
      `Supported: ${Object.keys(LANGUAGE_LABELS).join(', ')}`
    );
  }

  // Generate day titles and dates
  const dayTitles: string[] = [];
  const dayDates: string[] = [];
  for (let i = 0; i < dayCount; i++) {
    dayTitles.push(labels.dayTitle(i));
    const d = new Date(arrivalDate.getTime() + i * msPerDay);
    const day = d.getDate();
    const month = labels.monthNames[d.getMonth()];
    dayDates.push(`${day} ${month}`);
  }

  const tripYear = arrivalDate.getFullYear();

  // Build excluded sections list from language labels
  const excludedSections = [
    labels.sectionLogistics,
    labels.sectionCost,
    labels.sectionPlanB,
    labels.sectionGrocery,
    labels.sectionAlongTheWay,
    labels.sectionTransfer,
    '⚠️',
    labels.sectionMornPrep,
    labels.sectionLunch,
    labels.sectionBirthdayLunch,
  ];

  const result: TripConfig = {
    destination,
    arrivalDate,
    departureDate,
    dayCount,
    travelers,
    reportingLanguage,
    labels,
    dayTitles,
    dayDates,
    tripYear,
    pageTitle: labels.pageTitlePattern(destination, tripYear),
    markdownFilename: `trip_full_${labels.fileSuffix}.md`,
    htmlFilename: `trip_full_${labels.fileSuffix}.html`,
    direction: labels.direction,
    excludedSections,
  };

  // Freeze to prevent accidental mutation by any consumer (FB-1/FB-5)
  _cached = Object.freeze(result) as TripConfig;
  return _cached;
}
```

**Rationale:** Centralizes ALL language-dependent and trip-dependent values. Adding a new language requires adding one entry to `LANGUAGE_LABELS`. No spec file needs modification.

---

### 1.2 `automation/code/tests/utils/language-config.ts`

**Action:** Modify — no breaking changes

**Current state:** Already language-independent. Exports `loadPoiLanguageConfig()`, `findMissingLanguages()`, `requiresMultipleScripts()`.

**Target state:** No changes needed. The existing API is already correctly designed. `trip-config.ts` handles the reporting language; `language-config.ts` handles POI language validation. They serve complementary roles.

**Rationale:** Don't merge — separation of concerns. POI language validation is a distinct domain from trip metadata extraction.

---

### 1.3 `automation/code/playwright.config.ts`

**Action:** Modify

**Current state:**
```typescript
const ltrPath = process.env.TRIP_LTR_HTML
  ? path.resolve(process.env.TRIP_LTR_HTML).replace(/\\/g, '/')
  : resolveLatestTrip(projectRoot, 'trip_full_ru.html');
// ...
const rtlPath = process.env.TRIP_RTL_HTML
  ? path.resolve(process.env.TRIP_RTL_HTML).replace(/\\/g, '/')
  : resolveLatestTrip(projectRoot, 'trip_full_he.html');
```

**Target state (revised per FB-2 — flat logic, no scoping bug, no suffix scan):**
```typescript
import { loadTripConfig } from './tests/utils/trip-config';

const tripConfig = loadTripConfig();

// Main regression target — always the reporting language's HTML.
// Direction (ltr/rtl) is derived from the language's script, not configured.
const mainPath = process.env.TRIP_HTML_OVERRIDE
  ? path.resolve(process.env.TRIP_HTML_OVERRIDE).replace(/\\/g, '/')
  : resolveLatestTrip(projectRoot, tripConfig.htmlFilename);
const MAIN_HTML = `file:///${mainPath}`;

// Secondary direction HTML (optional — only if env var provided).
// Single-language trips have no secondary HTML; the project is simply omitted.
const secondaryEnvVar = tripConfig.direction === 'ltr'
  ? process.env.TRIP_RTL_HTML
  : process.env.TRIP_LTR_HTML;
let secondaryHtml: string | null = null;
if (secondaryEnvVar) {
  secondaryHtml = `file:///${path.resolve(secondaryEnvVar).replace(/\\/g, '/')}`;
}

// Build project list dynamically based on direction
const projects: PlaywrightTestConfig['projects'] = [
  {
    name: tripConfig.direction === 'ltr' ? 'desktop-chromium' : 'desktop-chromium-rtl',
    use: { ...devices['Desktop Chrome'], baseURL: MAIN_HTML },
    testIgnore: tripConfig.direction === 'ltr' ? /rtl-/ : undefined,
    testMatch: tripConfig.direction === 'rtl' ? /rtl-/ : undefined,
  },
];

if (secondaryHtml) {
  projects.push({
    name: tripConfig.direction === 'ltr' ? 'desktop-chromium-rtl' : 'desktop-chromium',
    use: { ...devices['Desktop Chrome'], baseURL: secondaryHtml },
    testMatch: tripConfig.direction === 'ltr' ? /rtl-/ : undefined,
    testIgnore: tripConfig.direction === 'rtl' ? /rtl-/ : undefined,
  });
}
```

**Rationale:** Text direction is an inherent property of the language's script — not a trip preference. The main HTML is always resolved from `tripConfig.htmlFilename`. The secondary direction project is only added when an explicit env var points to its HTML file — no hardcoded suffix scanning, no scoping bugs, graceful degradation for single-language trips.

---

### 1.4 `automation/code/tests/pages/TripPage.ts`

**Action:** Modify

**Current state (line 133):**
```typescript
getDayLogistics(dayNumber: number): Locator {
  return this.page.locator(`#day-${dayNumber} .advisory--info`).filter({ hasText: 'Логистика' });
}
```

**Target state:**
```typescript
getDayLogistics(dayNumber: number): Locator {
  return this.page.locator(`#day-${dayNumber} .advisory--info[data-section-type="logistics"]`);
}

getDayPlanB(dayNumber: number): Locator {
  return this.page.locator(`#day-${dayNumber} .advisory--info[data-section-type="plan-b"]`);
}
```

**Rationale:** Uses `data-section-type` attribute (proposed in HLD §4.1) instead of Russian text filter. Requires rendering pipeline to add these attributes.

---

### 1.5 `automation/code/tests/regression/activity-label-languages.spec.ts`

**Action:** Modify — major simplification

**Current state:** 44-entry `GENERIC_PREFIXES` array + `GENERIC_FULL_PATTERNS` array with Russian strings. `referencesPoi()` function parses Russian text to determine if a label is a POI.

**Target state:** Delete `GENERIC_PREFIXES`, `GENERIC_FULL_PATTERNS`, `referencesPoi()`, `isGenericAction()`, and `stripEmoji()`. Replace with structural detection:

```typescript
// POI-referencing labels are <a> elements; generic labels are <span> elements.
// The rendering pipeline already encodes this distinction — no text parsing needed.

test('POI-referencing activity labels should contain all configured poi_languages', async ({ tripPage }) => {
  // Only check <a> activity labels (POI references) — skip <span> (generic actions)
  const poiLabels = tripPage.clickableActivityLabels;
  const count = await poiLabels.count();
  expect(count).toBeGreaterThan(0);

  const failures: string[] = [];
  for (let i = 0; i < count; i++) {
    const text = (await poiLabels.nth(i).textContent()) ?? '';
    const missing = findMissingLanguages(text, config.poiLanguages);
    if (missing.length > 0) {
      failures.push(`Label #${i + 1}: "${text}" — missing ${missing.join(', ')}`);
    }
  }
  // ... assertion unchanged
});
```

The `<a>` vs `<span>` distinction replaces 50+ lines of Russian text parsing with a single CSS selector that already exists in `TripPage.ts` (`clickableActivityLabels`).

**Rationale:** The rendering pipeline already guarantees that `<a class="activity-label">` = POI reference and `<span class="activity-label">` = generic action. The test was duplicating this contract in Russian — fragile and redundant.

---

### 1.6 `automation/code/tests/regression/poi-parity.spec.ts`

**Action:** Modify

**Current state:**
```typescript
const EXCLUDED_SECTIONS = [
  'Логистика', 'Стоимость', 'Запасной план',
  'Ближайший магазин', 'По пути',
  'Трансфер', '⚠️', 'Утренние сборы',
  'Обед:',
  'Праздничный обед',
];
// ...
const fullMdPath = path.join(tripsDir, folder, 'trip_full_ru.md');
// ...
const headingMatch = line.match(/^#{1,2}\s+День\s+(\d+)/);
```

**Target state:**
```typescript
import { loadTripConfig } from '../utils/trip-config';

const tripConfig = loadTripConfig();
const EXCLUDED_SECTIONS = tripConfig.excludedSections;
// ...
const fullMdPath = path.join(tripsDir, folder, tripConfig.markdownFilename);
// ...
const headingMatch = line.match(tripConfig.labels.dayHeadingRegex);
```

**Rationale:** All three Russian-dependent values replaced with config lookups.

---

### 1.7 `automation/code/tests/regression/day-cards.spec.ts`

**Action:** Modify

**Current state:**
```typescript
const DAY_TITLES = ['День 0', 'День 1', ... 'День 11'];
const DAY_DATES = ['20 августа', '21 августа', ... '31 августа'];
// ...
const planB = sharedPage.locator(`#day-${i} .advisory--info`).filter({ hasText: 'Запасной план' });
```

**Target state:**
```typescript
import { loadTripConfig } from '../utils/trip-config';

const tripConfig = loadTripConfig();
const DAY_TITLES = tripConfig.dayTitles;
const DAY_DATES = tripConfig.dayDates;
// ...
const planB = sharedPage.locator(`#day-${i} .advisory--info[data-section-type="plan-b"]`);
```

**Rationale:** Day titles and dates derived from trip dates + reporting language locale. Plan B uses data attribute instead of text filter.

---

### 1.8 `automation/code/tests/regression/structure.spec.ts`

**Action:** Modify

**Current state:**
```typescript
await expect(sharedPage).toHaveTitle('Budapest 2026 — Семейный маршрут');
await expect(tripPage.pageSubtitle).toContainText('Роберт');
await expect(tripPage.pageSubtitle).toContainText('Анна');
// ... etc
const lang = await sharedPage.locator('html').getAttribute('lang');
expect(lang).toBe('ru');
```

**Target state:**
```typescript
import { loadTripConfig } from '../utils/trip-config';

const tripConfig = loadTripConfig();

test('should have correct page title', async ({ sharedPage }) => {
  await expect(sharedPage).toHaveTitle(tripConfig.pageTitle);
});

test('should display page subtitle with family info', async ({ tripPage }) => {
  await expect(tripPage.pageSubtitle).toBeVisible();
  for (const name of tripConfig.travelers) {
    await expect(tripPage.pageSubtitle).toContainText(name);
  }
});

test('should have correct lang attribute on html element', async ({ sharedPage }) => {
  const lang = await sharedPage.locator('html').getAttribute('lang');
  expect(lang).toBe(tripConfig.labels.langCode);
});
```

**Rationale:** All trip-specific and language-specific values derived from config.

---

### 1.9 `automation/code/tests/regression/overview-budget.spec.ts`

**Action:** Modify

**Current state:**
```typescript
await expect(tripPage.overviewTableRows.first()).toContainText('20.08');
const dates = ['20.08', '21.08', ... '31.08'];
await expect(tripPage.holidayAdvisoryTitle).toContainText('Иштвана');
await expect(tripPage.holidayAdvisory).toContainText('закрыт');
await expect(tripPage.budgetSection).toContainText('1 887');
```

**Target state:**
```typescript
import { loadTripConfig } from '../utils/trip-config';

const tripConfig = loadTripConfig();

// Generate date strings in DD.MM format from trip dates
function getOverviewDates(): string[] {
  const dates: string[] = [];
  for (let i = 0; i < tripConfig.dayCount; i++) {
    const d = new Date(tripConfig.arrivalDate.getTime() + i * 86400000);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    dates.push(`${dd}.${mm}`);
  }
  return dates;
}

test('overview table should contain arrival row', async ({ tripPage }) => {
  const dates = getOverviewDates();
  await expect(tripPage.overviewTableRows.first()).toContainText(dates[0]);
});

test('overview table should contain all day date rows', async ({ tripPage }) => {
  const dates = getOverviewDates();
  for (const date of dates) {
    const cell = tripPage.overviewTable.locator('td').filter({ hasText: date });
    await expect(cell).toBeAttached();
  }
});
```

For holiday advisory — replace content assertions with structural checks:
```typescript
test('advisory should have a title', async ({ tripPage }) => {
  await expect(tripPage.holidayAdvisoryTitle).toBeVisible();
  const text = await tripPage.holidayAdvisoryTitle.textContent();
  expect(text!.trim().length).toBeGreaterThan(0);
});

test('advisory should have body content', async ({ tripPage }) => {
  const body = tripPage.holidayAdvisory.locator('.advisory__body');
  await expect(body).toBeVisible();
  const text = await body.textContent();
  expect(text!.trim().length).toBeGreaterThan(0);
});
```

For budget — structural validation (revised per FB-4, no hardcoded currency):
```typescript
test('budget table should contain total label', async ({ tripPage }) => {
  await expect(tripPage.budgetSection).toContainText(tripConfig.labels.budgetTotal);
});

test('budget table should contain a recognized currency code', async ({ tripPage }) => {
  // Structural check: budget section must contain at least one 3-letter currency code
  const text = await tripPage.budgetSection.textContent() ?? '';
  const hasCurrency = /[A-Z]{3}/.test(text);
  expect(hasCurrency, 'Budget section should contain a 3-letter currency code (e.g., EUR, HUF, USD)').toBe(true);
});
```

**Rationale:** Dates derived from trip config. Holiday advisory becomes structural (content varies by destination). Budget total label is config-driven. Currency is validated structurally (3-letter code pattern) — no hardcoded `EUR`, so a Japan trip with `JPY` passes without code changes.

---

### 1.10 `automation/code/tests/regression/poi-cards.spec.ts`

**Action:** Modify

**Current state:** 69-entry `SUB_VENUE_POIS` array with Russian/Hungarian POI names.

**Target state — Option A (preferred): Data attribute on sub-venue POI cards:**
```typescript
test('every main POI card should have all 3 link types', async ({ tripPage }) => {
  const count = await tripPage.poiCards.count();
  const missing: string[] = [];
  for (let i = 0; i < count; i++) {
    const card = tripPage.poiCards.nth(i);

    // Skip sub-venue POI cards (marked by rendering pipeline)
    const isSubVenue = await card.getAttribute('data-link-exempt');
    if (isSubVenue !== null) continue;

    // ... rest of link validation unchanged
  }
});
```

This requires the rendering pipeline to add `data-link-exempt` to POI cards that are sub-venue entries. The rendering pipeline already knows which POIs are sub-venues — it renders them differently (e.g., within parent sections). The attribute makes this semantic distinction testable.

**Target state — Option B (fallback if SA rejects data attribute):**

Validate that every POI card has **at least one** link (Maps OR Site OR Photo) instead of requiring all three. The 3-link requirement was never a formal rule — it was an aspirational check with a massive exclusion list that undermined its value.

```typescript
test('every POI card should have at least one external link', async ({ tripPage }) => {
  const count = await tripPage.poiCards.count();
  const missing: string[] = [];
  for (let i = 0; i < count; i++) {
    const card = tripPage.poiCards.nth(i);
    const links = tripPage.getPoiCardLinks(card);
    const linkCount = await links.count();
    if (linkCount === 0) {
      const name = await tripPage.getPoiCardName(card).textContent();
      missing.push(`${name?.trim()}: no external links`);
    }
  }
  expect(missing, `POI cards with no links:\n${missing.join('\n')}`).toHaveLength(0);
});
```

**Rationale:** Option A is the clean solution — the rendering pipeline encodes semantics via data attributes (same pattern as `data-section-type`). Option B is a pragmatic fallback that eliminates the 69-entry exclusion list by relaxing the assertion. SA decides.

---

### 1.11 `automation/code/tests/regression/progression.spec.ts`

**Action:** Modify

**Current state:**
```typescript
const EXPECTED_POI_COUNTS: Record<number, number> = { 0: 2, 1: 6, ... };
const NOTABLE_POIS: { day: number; search: string; label: string }[] = [ ... ];
// ...
await expect.soft(tripPage.holidayAdvisory, 'mentions Иштван').toContainText('Иштван');
await expect.soft(budget, 'contains Итого').toContainText('Итого');
```

**Target state:**
```typescript
import { loadTripConfig } from '../utils/trip-config';

const tripConfig = loadTripConfig();

// POI counts extracted from markdown (reuse poi-parity mechanism)
import { getExpectedPoiCountsFromMarkdown } from './poi-parity-utils';

// ...
await expect.soft(tripPage.holidayAdvisory, 'advisory visible and has content').toBeAttached();
const advisoryText = await tripPage.holidayAdvisory.textContent();
expect.soft(advisoryText!.trim().length, 'advisory has text').toBeGreaterThan(0);

await expect.soft(budget, 'contains total label').toContainText(tripConfig.labels.budgetTotal);
```

**Design decision on NOTABLE_POIS (revised per FB-7):**

Progression tests serve as a "did we lose a POI?" regression signal that is distinct from poi-parity's structural count check. The hardcoded `NOTABLE_POIS` array violates language independence, but the regression signal it provides is valuable.

**Approach:** Replace with dynamic extraction. Parse the markdown for main POI headings (excluding `excludedSections`), pick the first POI per day, and verify each appears as a rendered POI card by checking that the `poi-card__name` element contains text matching the markdown heading. This preserves the regression signal without hardcoding any names.

```typescript
import { getExpectedPoiCountsFromMarkdown } from '../utils/markdown-pois';

test('each day should have its first POI from markdown rendered as a card', async ({ tripPage }) => {
  const expected = getExpectedPoiCountsFromMarkdown();
  for (const [dayStr, data] of Object.entries(expected)) {
    const day = parseInt(dayStr, 10);
    if (data.names.length === 0) continue;
    const firstPoiName = data.names[0];
    const dayCards = tripPage.getDayPoiCards(day);
    const count = await dayCards.count();
    let found = false;
    for (let i = 0; i < count; i++) {
      const name = await tripPage.getPoiCardName(dayCards.nth(i)).textContent();
      // Partial match — markdown heading may differ slightly from rendered name
      if (name && name.includes(firstPoiName.split('/')[0].trim())) {
        found = true;
        break;
      }
    }
    expect.soft(found, `Day ${day}: first POI "${firstPoiName}" not found in rendered cards`).toBe(true);
  }
});
```

`EXPECTED_POI_COUNTS` is removed — poi-parity already validates this dynamically.

---

### 1.12 `automation/code/tests/regression/poi-parity.spec.ts` — Shared Utility Extraction

**Action:** Modify — extract `getExpectedPoiCountsFromMarkdown` into a shared utility

**Purpose:** Allow `progression.spec.ts` to reuse the markdown POI counting logic without duplication.

**Target state:** Create `automation/code/tests/utils/markdown-pois.ts`:
```typescript
import * as fs from 'fs';
import * as path from 'path';
import { loadTripConfig } from './trip-config';

export function getExpectedPoiCountsFromMarkdown(): Record<number, { count: number; names: string[] }> {
  const tripConfig = loadTripConfig();
  const tripsDir = path.resolve(__dirname, '..', '..', '..', '..', 'generated_trips');
  // ... same logic as current poi-parity.spec.ts but using:
  //   tripConfig.markdownFilename instead of 'trip_full_ru.md'
  //   tripConfig.labels.dayHeadingRegex instead of /День\s+(\d+)/
  //   tripConfig.excludedSections instead of hardcoded Russian array
}
```

---

## 2. Markdown Format Specification

No changes to markdown format. This refactor only affects how tests read and validate existing markdown/HTML.

## 3. HTML Rendering Specification

### 3.1 Advisory `data-section-type` Attribute

**Component:** `.advisory--info`

**New attribute:** `data-section-type="plan-b"` or `data-section-type="logistics"`

**Before:**
```html
<div class="advisory advisory--info">
  <div class="advisory__title">🅱️ Запасной план — Tropicarium</div>
  ...
</div>
```

**After:**
```html
<div class="advisory advisory--info" data-section-type="plan-b">
  <div class="advisory__title">🅱️ Запасной план — Tropicarium</div>
  ...
</div>
```

**Logistics before:**
```html
<div class="advisory advisory--info">
  <div class="advisory__title">🚗 Логистика</div>
  ...
</div>
```

**Logistics after:**
```html
<div class="advisory advisory--info" data-section-type="logistics">
  <div class="advisory__title">🚗 Логистика</div>
  ...
</div>
```

### 3.2 Link-Exempt POI `data-link-exempt` Attribute (revised per FB-3)

**Component:** `.poi-card`

**New attribute:** `data-link-exempt` (boolean, presence-only)

**Semantic:** This POI card is not expected to have all 3 link types (Maps, Site, Photo). Covers: sub-venue POIs inside a parent attraction, grocery stores, along-the-way stops, playgrounds, bridges, fountains, street food stands, and any other POI that legitimately has fewer than 3 external links.

**Rendering rule:** The rendering pipeline adds `data-link-exempt` automatically at render time when a POI card is generated with fewer than 3 distinct external link types. This is a rendering-time fact derived from the source markdown — not a test-time guess and not a name-based exclusion list.

**Before:**
```html
<div class="poi-card" id="poi-day-4-3">
  <h3 class="poi-card__name">Bongo Kids Club</h3>
  ...
</div>
```

**After:**
```html
<div class="poi-card" id="poi-day-4-3" data-link-exempt>
  <h3 class="poi-card__name">Bongo Kids Club</h3>
  ...
</div>
```

## 4. Rule File Updates

| Rule File | Section | Change |
|---|---|---|
| `automation_rules.md` | New §7 | Add "Language Independence" enforcement rule |
| `rendering-config.md` | Component rules | Add `data-section-type` and `data-link-exempt` attribute specs |
| `development_rules.md` §4 | Test Data Synchronization | Reference `trip-config.ts` as the source of truth instead of manual constant updates |

### 4.1 New Section for `automation_rules.md`

```markdown
## 7. Language Independence

All automation tests must be language-independent and trip-independent.

### 7.1 No Hardcoded Natural Language Text
* **Rule:** No spec file, page object, or fixture may contain hardcoded text in any natural language (Russian, English, Hebrew, etc.) for content assertions or element filtering.
* **Source of Truth:** All language-dependent values (day titles, section names, month names, page title) must come from `tests/utils/trip-config.ts`.
* **Structural Preferred:** When the DOM already encodes semantic distinctions (e.g., `<a>` vs `<span>` for activity labels, `data-section-type` for advisory boxes), use structural CSS selectors instead of text matching.

### 7.2 No Hardcoded Trip-Specific Constants
* **Rule:** No spec file may contain trip-specific constants (POI names, budget amounts, traveler names, day counts, dates) as string or number literals.
* **Source of Truth:** All trip-specific values must be derived from `trip_details.md` (via `trip-config.ts`) or extracted from the generated markdown (via `markdown-pois.ts`).
* **Exception:** Visual regression snapshot filenames are inherently trip-specific and are exempt.

### 7.3 Enforcement
* QA-A and SA are jointly responsible for catching violations during Phase 3 (Architecture Review) and Phase 4 (Test Planning).
* Any PR that introduces hardcoded language or trip content in test code must be rejected.
```

## 5. Implementation Checklist

Implementation must be done file-by-file with a regression run after each to avoid big-bang risk.
Rendering pipeline changes (data attributes) must land before tests that depend on them (SA best practice #3).

**Phase A — Foundation (no test behavior change yet):**
- [ ] 1. Create `tests/utils/trip-config.ts` with caching + Object.freeze (REQ-001, FB-1, FB-5)
- [ ] 2. Create `tests/regression/trip-config.spec.ts` — smoke test validating config completeness (FB-1)
- [ ] 3. Extract shared utility `tests/utils/markdown-pois.ts` from `poi-parity.spec.ts`
- [ ] 4. Update `rendering-config.md` — add `data-section-type` and `data-link-exempt` attribute specs
- [ ] 5. Regenerate HTML with new data attributes (rendering pipeline change)
- [ ] 6. Update `playwright.config.ts` to use trip-config (REQ-009, FB-2)

**Phase B — Tests that depend on data attributes:**
- [ ] 7. Update `TripPage.ts` — use `data-section-type` instead of Russian text filter (REQ-010)
- [ ] 8. Refactor `day-cards.spec.ts` — config-driven + `data-section-type` (REQ-004)
- [ ] 9. Refactor `poi-cards.spec.ts` — `data-link-exempt` attribute (REQ-007, FB-3)

**Phase C — Tests that need only trip-config (no data attributes):**
- [ ] 10. Refactor `activity-label-languages.spec.ts` — structural detection via `<a>` vs `<span>` (REQ-002)
- [ ] 11. Refactor `poi-parity.spec.ts` — config-driven (REQ-003)
- [ ] 12. Refactor `structure.spec.ts` — config-driven (REQ-005)
- [ ] 13. Refactor `overview-budget.spec.ts` — structural + config-driven, no hardcoded EUR (REQ-006, FB-4)
- [ ] 14. Refactor `progression.spec.ts` — dynamic POI presence, config-driven labels (REQ-008, FB-7)

**Phase D — Rule updates and final validation:**
- [ ] 15. Update `automation_rules.md` §7 (REQ-011)
- [ ] 16. Update `development_rules.md` §4 — reference trip-config.ts
- [ ] 17. Run full regression suite — all tests pass

## 6. BRD Traceability

| Requirement | Acceptance Criterion | Implemented in |
|---|---|---|
| REQ-001 | AC-1: Extract trip metadata | `trip-config.ts`: `loadTripConfig()` |
| REQ-001 | AC-2: Derive language labels | `trip-config.ts`: `LANGUAGE_LABELS` |
| REQ-001 | AC-3: Auto-discover trip folder | `trip-config.ts`: reuses `resolveLatestTrip()` |
| REQ-001 | AC-4: Single source of truth | `trip-config.ts`: all labels in one map |
| REQ-001 | AC-5: New language = one map entry | `trip-config.ts`: `LANGUAGE_LABELS` extensible |
| REQ-002 | AC-1: Replace GENERIC_PREFIXES | `activity-label-languages.spec.ts`: use `<a>` vs `<span>` |
| REQ-002 | AC-2: Replace GENERIC_FULL_PATTERNS | `activity-label-languages.spec.ts`: deleted (structural) |
| REQ-002 | AC-3: Works for 3 languages | Structural — language-agnostic by design |
| REQ-002 | AC-4: Zero Russian literals | `activity-label-languages.spec.ts`: verified |
| REQ-003 | AC-1: Config-driven exclusions | `poi-parity.spec.ts`: `tripConfig.excludedSections` |
| REQ-003 | AC-2: Config-driven filename | `poi-parity.spec.ts`: `tripConfig.markdownFilename` |
| REQ-003 | AC-3: Config-driven heading regex | `poi-parity.spec.ts`: `tripConfig.labels.dayHeadingRegex` |
| REQ-003 | AC-4: Works for 3 languages | `trip-config.ts`: all 3 have `dayHeadingRegex` |
| REQ-004 | AC-1: Config-driven day titles | `day-cards.spec.ts`: `tripConfig.dayTitles` |
| REQ-004 | AC-2: Config-driven dates | `day-cards.spec.ts`: `tripConfig.dayDates` |
| REQ-004 | AC-3: Config-driven Plan B selector | `day-cards.spec.ts`: `data-section-type="plan-b"` |
| REQ-004 | AC-4: Works for 3 languages | `trip-config.ts`: labels for all 3 |
| REQ-005 | AC-1: Config-driven page title | `structure.spec.ts`: `tripConfig.pageTitle` |
| REQ-005 | AC-2: Config-driven travelers | `structure.spec.ts`: `tripConfig.travelers` |
| REQ-005 | AC-3: Config-driven lang code | `structure.spec.ts`: `tripConfig.labels.langCode` |
| REQ-005 | AC-4: Works for any trip | All values from `trip_details.md` |
| REQ-006 | AC-1: Structural holiday check | `overview-budget.spec.ts`: presence + non-empty |
| REQ-006 | AC-2: Structural closure check | `overview-budget.spec.ts`: advisory body non-empty |
| REQ-006 | AC-3: Config-driven budget label | `overview-budget.spec.ts`: `tripConfig.labels.budgetTotal` |
| REQ-006 | AC-4: Config-driven dates | `overview-budget.spec.ts`: `getOverviewDates()` |
| REQ-007 | AC-1: Data attribute for sub-venues | `poi-cards.spec.ts`: `data-link-exempt` |
| REQ-007 | AC-2: No POI names in test | `poi-cards.spec.ts`: SUB_VENUE_POIS deleted |
| REQ-007 | AC-3: Rendering pipeline doc | `rendering-config.md`: data attribute spec |
| REQ-008 | AC-1: Dynamic POI counts | `progression.spec.ts`: uses `markdown-pois.ts` |
| REQ-008 | AC-2: Remove NOTABLE_POIS | `progression.spec.ts`: deleted (covered by poi-parity) |
| REQ-008 | AC-3: Config-driven labels | `progression.spec.ts`: `tripConfig.labels.budgetTotal` |
| REQ-008 | AC-4: No hardcoded amounts | `progression.spec.ts`: budget from markdown |
| REQ-009 | AC-1: Config-driven filename | `playwright.config.ts`: `tripConfig.htmlFilename` |
| REQ-009 | AC-2: Direction from script | `trip-config.ts`: `labels.direction` in `LANGUAGE_LABELS` |
| REQ-009 | AC-3: Auto-detect main project | `playwright.config.ts`: `tripConfig.direction` routes to LTR or RTL project |
| REQ-009 | AC-4: Auto-discover secondary HTML | `playwright.config.ts`: scans for RTL/LTR suffixes in trip folder |
| REQ-009 | AC-5: No language codes | `playwright.config.ts`: verified |
| REQ-010 | AC-1: Data attribute for logistics | `TripPage.ts`: `data-section-type="logistics"` |
| REQ-010 | AC-2: No Russian in POM | `TripPage.ts`: verified |
| REQ-010 | AC-3: Rendering pipeline doc | `rendering-config.md`: data attribute spec |
| REQ-011 | AC-1: New automation rule section | `automation_rules.md` §7 |
| REQ-011 | AC-2: No hardcoded text rule | `automation_rules.md` §7.1 |
| REQ-011 | AC-3: No trip-specific constants rule | `automation_rules.md` §7.2 |
| REQ-011 | AC-4: Joint SA/QA-A enforcement | `automation_rules.md` §7.3 |
