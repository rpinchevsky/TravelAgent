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
| `.poi-card` | POI card wrapper |
| `.poi-card__name` | POI name element |
| `.poi-card__link` | Links inside POI cards |
| `.pro-tip` | Pro-tip wrapper div (NOT just bold text) |
| `.advisory--info` | Plan B and Logistics sections |
| `#budget` | `<section id="budget">` |
| `head style` | Inlined CSS (no external `<link>`) |

### Source 2: rendering-config.md (Design System)
All component structures, CSS classes, and SVG icon mappings defined in `rendering-config.md` are authoritative.

### Source 3: Regression Test Specs
Review all `*.spec.ts` files in `automation/code/tests/regression/` for hardcoded assertions (text content, counts, thresholds) that may need updating when trip content changes.

---

## 2. Pre-Regression Validation Gate (Step 2.5)

After HTML generation and BEFORE running Playwright regression, perform an automated structural validation. This catches 80%+ of failures instantly without waiting for full test execution.

### Validation Checklist (run as grep/search commands):

```
1. Section IDs exist:        #overview, #budget, #day-1 through #day-N
2. Day IDs on correct element: .day-card[id^="day-"] (not <section>)
3. Required classes present:  .pro-tip, .poi-card, .poi-card__name, .poi-card__link
4. Advisory class uniqueness: .advisory--warning appears only in Holiday Advisory
5. Sidebar SVGs:              .sidebar__link elements contain <svg>
6. Inlined CSS:               <style> tag in <head>, no <link> to .css
7. SVG attributes:            All <svg> have explicit width="" and height=""
8. POI parity:                Count of .poi-card per day matches markdown ### POI count
9. Navigation completeness:   sidebar__link count matches mobile-nav__pill count
```

### How to run:
Use simple text searches (grep/regex) on the generated HTML file. If ANY check fails, fix the HTML BEFORE running regression.

---

## 3. Test Data Synchronization Rule

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

## 4. HTML Generation Agent Prompt Requirements

When delegating HTML generation to a sub-agent, the prompt MUST include:

1. **The full TripPage.ts file** — so the agent knows the structural contract
2. **The rendering-config.md** — for component structure and CSS classes
3. **Explicit list of required section IDs** — `#overview`, `#budget`, `#day-1` to `#day-N`
4. **Advisory class rules** — `.advisory--warning` for Holiday Advisory ONLY; `.advisory--info` for Plan B and Logistics
5. **Pro-tip rule** — Must be wrapped in `<div class="pro-tip">`, not just bold text
6. **SVG rule** — Sidebar links must contain inline `<svg>` with explicit `width` and `height`
7. **Inlining rule** — CSS must be in `<style>` tag, not `<link>`

**Never delegate HTML generation without these 7 items in the prompt.**

---

## 5. Change Impact Matrix

Before running regression, classify each change and predict affected test areas:

| Change Type | Impact Area | Action |
|---|---|---|
| New trip generated | ALL tests | Full regression + update hardcoded values |
| CSS class renamed | TripPage.ts locators | Update POM + all specs using affected locators |
| New section added | Navigation tests | Update nav link counts |
| Layout restructured | Visual regression | Update snapshots |
| rendering-config.md changed | HTML generation | Regenerate HTML |
| base_layout.html changed | All structural tests | Regenerate HTML |
| TripPage.ts changed | Affected spec files | Review all specs using changed locators |

---

## 6. Definition of Done — HTML Generation

An HTML generation task is NOT complete until:

- [ ] Pre-regression validation gate passes (Rule 2)
- [ ] Test data is synchronized (Rule 3)
- [ ] Release notes updated (`automation/code/release_notes.md`)
- [ ] Progression tests written for new/changed features
- [ ] Full regression passes with 0 failures
- [ ] Visual snapshots updated if layout changed
