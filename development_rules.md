# Development Rules & Quality Gates

## 1. HTML Generation Contract (Mandatory)

Before generating any HTML output, the developer (or agent) MUST cross-reference these sources to build a **Generation Checklist**:

### Source 1: TripPage.ts Locators (Test Contract)
Every locator in `automation/code/tests/pages/TripPage.ts` defines a **structural requirement** for the HTML. If a locator references a CSS class or ID, the HTML MUST contain matching elements.

**Current structural requirements derived from TripPage.ts:**

| Locator | Required HTML Element |
|---|---|
| `h1.page-title` | `<h1 class="page-title">` |
| `p.page-subtitle` | `<p class="page-subtitle">` |
| `.advisory--warning` | Exactly ONE section with this class (Holiday Advisory only) |
| `.advisory--warning .advisory__title` | Title inside the holiday advisory |
| `aside.sidebar` | `<aside class="sidebar">` with SVG icons |
| `.sidebar__nav .sidebar__link` | Navigation links with inline `<svg>` elements |
| `.sidebar__link.is-active` | First link has `is-active` class |
| `nav.mobile-nav` | `<nav class="mobile-nav">` |
| `.mobile-nav__pill` | Pills matching sidebar links |
| `#main-content` | `<main id="main-content">` |
| `#overview` | `<section id="overview">` with `.itinerary-table` |
| `#overview .itinerary-table tbody tr` | Overview table rows |
| `.day-card[id^="day-"]` | Day cards with `id="day-X"` on the `.day-card` element |
| `.day-card__banner` | Banner inside each day card |
| `.day-card__banner-title` | Day title in banner |
| `.day-card__banner-date` | Date in banner |
| `.poi-card[id^="poi-day-"]` | POI card wrapper with anchor ID (`poi-day-{D}-{N}`) |
| `.poi-card__name` | POI name element |
| `.poi-card__link` | Links inside POI cards |
| `.pro-tip` | Pro-tip wrapper div (NOT just bold text) |
| `a.activity-label[href^="#poi-day-"]` | Clickable activity labels linking to POI cards |
| `.advisory--info` | Plan B and Logistics sections |
| `#budget` | `<section id="budget">` |
| `head style` | Inlined CSS (no external `<link>`) |

### Source 2: rendering-config.md (Design System)
All component structures, CSS classes, and SVG icon mappings defined in `rendering-config.md` are authoritative.

### Source 3: Regression Test Specs
Review all `*.spec.ts` files in `automation/code/tests/regression/` for hardcoded assertions (text content, counts, thresholds) that may need updating when trip content changes.

---

## 2. Trip Completeness Validation (Modular Architecture)

After Phase B day-by-day generation and BEFORE assembly, validate the trip folder is complete:

### Completeness Checklist:

```
1. Manifest exists:           manifest.json present in trip folder
2. All days complete:         Every day in manifest.days has status: "complete"
3. Day files exist:           Every key in manifest.days has a matching .md file in the folder
4. Day count matches:         Number of day files == manifest.total_days (including day_00 if applicable)
5. Overview exists:           overview.md present and non-empty
6. Per-day budget:            Each day_XX.md contains a "### Стоимость дня" section
7. No orphan files:           No day_XX.md files exist that aren't listed in manifest.days
8. POI minimum count:         Each full day (excluding day_00 arrival and last-day departure) has >= 3 POI
                              headings (### sections that are NOT Расписание/Стоимость/Запасной план/Логистика)
```

### How to run:
Read `manifest.json`, then verify each item with file existence checks and grep. If ANY check fails, fix the missing/incomplete day BEFORE proceeding to assembly.

---

## 3. Pre-Regression Validation Gate (Step 2.5)

After HTML generation and BEFORE running Playwright regression, perform an automated structural validation. This catches 80%+ of failures instantly without waiting for full test execution.

### Validation Checklist (run as grep/search commands):

```
1. Section IDs exist:        #overview, #budget, #day-0 (if arrival), #day-1 through #day-N
2. Day IDs on correct element: .day-card[id^="day-"] (not <section>)
3. Required classes present:  .pro-tip, .poi-card, .poi-card__name, .poi-card__link
4. Advisory class uniqueness: .advisory--warning appears only in Holiday Advisory
5. Sidebar SVGs:              .sidebar__link elements contain <svg>
6. Inlined CSS:               <style> tag in <head>, no <link> to rendering_style_config.css (Google Fonts <link> OK)
7. SVG attributes:            All <svg> have explicit width="" and height=""
8. POI parity:                Count of .poi-card per day matches markdown ### POI count in source day_XX.md
9. Navigation completeness:   sidebar__link count matches mobile-nav__pill count
10. POI card anchors:          Every .poi-card has id="poi-day-{D}-{N}"
11. Activity label links:      POI-referencing .activity-label elements are <a> with href matching a .poi-card id
```

### How to run:
Use simple text searches (grep/regex) on the generated HTML file. If ANY check fails, fix the HTML BEFORE running regression.

---

## 4. Test Data Synchronization Rule

When trip content changes (new trip generated, budget updated, dates changed), the following test artifacts MUST be reviewed and updated BEFORE regression:

| What Changed | Tests to Update |
|---|---|
| Budget amounts | `overview-budget.spec.ts` — EUR/HUF values |
| Number of days | `day-cards.spec.ts` — DAY_TITLES/DAY_DATES arrays |
| Trip dates | `day-cards.spec.ts` — DAY_DATES array |
| Number of SVGs | `svg-integrity.spec.ts` — minimum SVG count |
| Visual layout | Run `--update-snapshots` for visual regression |
| POI count per day | `poi-parity.spec.ts` reads markdown dynamically (no update needed) |
| POI language format | `poi-languages.spec.ts` reads HTML dynamically (no update needed) |

**Rule:** Any test that asserts on content-specific values (hardcoded strings, counts, amounts) must be updated in the SAME commit as the HTML that changes those values.

---

## 5. HTML Generation Agent Prompt Requirements

When delegating HTML generation to a sub-agent, follow the **9-item Agent Prompt Contract** defined in `rendering-config.md` → Step 2.5. Never delegate without all 9 items in the prompt.

---

## 6. Change Impact Matrix

Before running regression, classify each change and predict affected test areas:

| Change Type | Impact Area | Action |
|---|---|---|
| New trip generated | ALL tests | Full regression + update hardcoded values |
| Single day edited | Day-specific tests + structural | Incremental HTML rebuild + targeted regression |
| Days added/removed | Navigation + structural tests | Full HTML rebuild + update nav counts |
| CSS class renamed | TripPage.ts locators | Update POM + all specs using affected locators |
| New section added | Navigation tests | Update nav link counts |
| Layout restructured | Visual regression | Update snapshots |
| rendering-config.md changed | HTML generation | Regenerate HTML |
| base_layout.html changed | All structural tests | Regenerate HTML |
| TripPage.ts changed | Affected spec files | Review all specs using changed locators |

---

## 7. Post-Generation Quality Gate (Phase C) & Definition of Done

After every HTML generation and after Rules 2–4 pass, a full regression cycle MUST be performed. This phase is **blocking** — the HTML delivery is not considered complete until regression passes.

**Definition of Done checklist:**
- [ ] Trip completeness validation passes (Rule 2)
- [ ] Pre-regression validation gate passes (Rule 3)
- [ ] Test data is synchronized (Rule 4)
- [ ] Release notes updated (`automation/code/release_notes.md`)
- [ ] Progression tests written for new/changed features
- [ ] Full regression passes with 0 failures
- [ ] Visual snapshots updated if layout changed

### Step 1: Release Notes (Dev Team)
- **Action:** Before any testing begins, update `automation/code/release_notes.md` with a log of all changes included in the generated HTML.
- **Format:** Each entry must include the date, a summary of changes, and affected sections.
- **Gate:** If `automation/code/release_notes.md` is not updated, create it and populate it based on the diff between the previous and current HTML output.

### Step 2: Progression Testing (Automation Team)
- **Action:** Before regression, write new test cases that cover the **progression changes** documented in `automation/code/release_notes.md`.
- **Scope:** New or modified UI components, new day sections, changed data, updated navigation links — anything that changed in this release.
- **Gate:** New progression tests must pass before proceeding to regression. If they fail, fix the HTML or tests before continuing.

### Step 3: Full Regression Execution (Automation Team)
- **Action:** Execute the full regression test suite, including the newly added progression tests. Follow all standards in `automation/code/automation_rules.md` (POM pattern, zero-flakiness policy, reporting standards).
- **Reporting:** Generate Playwright HTML reports with traces and screenshots. Reports are saved to `automation/Reports/automation_report_{timestamp}/`.
- **Gate:** Regression must pass. Any failures must be triaged:
  - **Real bug:** Fix the HTML output and re-run.
  - **Flaky test:** Quarantine per the Zero-Flakiness Policy in `automation/code/automation_rules.md`.
- **Completion:** Only after regression passes is the HTML generation considered **done**.
