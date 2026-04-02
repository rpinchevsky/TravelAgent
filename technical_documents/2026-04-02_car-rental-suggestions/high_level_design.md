# High-Level Design

**Change:** Car Rental Suggestion Mechanism — Rental Company Discovery, Price Comparison & Booking Links
**Date:** 2026-04-02
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-04-02_car-rental-suggestions/business_requirements.md`
**Status:** Approved

---

## 1. Overview

This change extends the trip generation pipeline to produce structured car rental sections on anchor days (the first day of each consecutive car-day block). The pattern mirrors the existing accommodation integration: user preferences are collected via the intake wizard, discovery happens during Phase B via web research, and results are presented as price comparison tables with booking links inside a distinct card type in both markdown and HTML.

**Core principle:** Follow the proven accommodation architecture — anchor-day placement, structured option cards, budget integration, manifest metadata — but substitute web search for Google Places as the discovery mechanism and use a teal accent in place of amber for visual differentiation.

The work touches four layers of the system:

1. **Planning rules** — new "Car Rental Selection" section, data source hierarchy extension, CEO audit checklist
2. **Content format** — new car rental section template in per-day files, section placement order, budget integration, manifest schema, overview simplification
3. **HTML rendering** — new `.car-rental-section` component with `.car-rental-category` sub-cards, `.car-rental-table`, and `.rental-cta` buttons
4. **Automation** — new TripPage.ts page object methods and regression test coverage

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Trip planning rules | `trip_planning_rules.md` | Modified — new "Car Rental Selection" section, Data Source Hierarchy Layer 2b, CEO Audit extension |
| Content format rules | `content_format_rules.md` | Modified — new car rental section template, section placement order, Generation Context note, Budget Assembly extension, manifest schema extension |
| Rendering config | `rendering-config.md` | Modified — new car rental card type specification, POI parity exclusion rule |
| CSS styles | `rendering_style_config.css` | Modified — new `.car-rental-section`, `.car-rental-category`, `.car-rental-table`, `.rental-cta`, responsive/dark/RTL rules |
| Page object | `automation/code/tests/pages/TripPage.ts` | Modified — new car rental locators and helper methods |
| Regression tests | `automation/code/tests/regression/*.spec.ts` | Modified/New — car rental test assertions |
| Phase A overview | Generated `overview_LANG.md` files | Changed output — hardcoded car recommendation replaced with anchor-day reference |
| Phase B anchor day files | Generated `day_XX_LANG.md` files (first car day per block) | Changed output — new `## 🚗` section with comparison tables |
| Budget file | Generated `budget_LANG.md` | Changed output — car rental category row |
| Manifest | Generated `manifest.json` | Changed schema — new `car_rental` top-level object |

## 3. Data Flow

```
┌─────────────────────┐
│  trip_details.md     │
│  ## Car Rental       │
│  Assistance          │──────────────────────────────────────────────┐
│  (car_category,      │                                              │
│   transmission,      │                                              │
│   fuel_type,         │                                              │
│   pickup_return,     │                                              │
│   equipment,         │                                              │
│   daily_budget)      │                                              │
└──────────┬───────────┘                                              │
           │                                                          │
           ▼                                                          │
┌─────────────────────┐                                               │
│  Phase A             │                                              │
│  1. Build overview   │                                              │
│  2. Identify car     │◄────── trip_planning_rules.md                │
│     rental blocks    │        (Car Rental Block                     │
│     from 🚗 days     │         Identification)                      │
│  3. Write manifest   │                                              │
│     car_rental.blocks│                                              │
│  4. Overview: brief  │                                              │
│     reference only   │                                              │
└──────────┬───────────┘                                              │
           │                                                          │
           ▼                                                          │
┌─────────────────────────────────────────────────┐                   │
│  Phase B — Anchor Day Subagent (first car day)   │                  │
│                                                   │                 │
│  1. Parse ## Car Rental Assistance ◄──────────────┘                 │
│  2. Web Search: car rental companies              │                 │
│     at destination for each category              │                 │
│  3. Web Fetch: company sites for pricing          │                 │
│  4. Construct comparison tables (2-3 companies    │                 │
│     per category, sorted by price ascending)      │                 │
│  5. Construct booking deep links                  │                 │
│  6. Write ## 🚗 section in day_XX_LANG.md         │                 │
│  7. Include car rental line in daily budget table  │                 │
│  8. Update manifest car_rental discovery_source    │                 │
└──────────┬────────────────────────────────────────┘                 │
           │                                                          │
           ▼                                                          │
┌─────────────────────┐     ┌──────────────────────────┐              │
│  Budget Assembly     │     │  HTML Rendering (/render) │             │
│  1. Read manifest    │     │  1. Detect ## 🚗 heading  │             │
│     car_rental       │     │  2. Map to                │             │
│  2. Add Car Rental   │     │     .car-rental-section   │             │
│     category row     │     │  3. Render comparison     │             │
│  3. Calculate range  │     │     tables as             │             │
│     across all blocks│     │     .car-rental-table     │             │
└──────────────────────┘     │  4. Render CTAs as        │             │
                             │     .rental-cta           │             │
                             │  5. Exclude from POI      │             │
                             │     parity count          │             │
                             └─────────┬────────────────┘              │
                                       │                               │
                                       ▼                               │
                             ┌──────────────────────────┐              │
                             │  Regression Tests         │             │
                             │  1. Validate section      │             │
                             │     presence on anchor    │             │
                             │     day                   │             │
                             │  2. Validate table        │             │
                             │     structure             │             │
                             │  3. Validate CTAs         │             │
                             │  4. Validate budget       │             │
                             │     integration           │             │
                             └──────────────────────────┘              │
```

### Key Data Transformations

| Stage | Input | Output | Format |
|---|---|---|---|
| Preference parsing | `## Car Rental Assistance` section (markdown key-value pairs) | Structured preferences object | Internal (in-context) |
| Block identification | Phase A overview table (🚗 days) | `car_rental.blocks[]` in manifest | JSON |
| Company discovery | Web search results + web fetch HTML | 2-3 company options per category with pricing | Internal (in-context) |
| Markdown generation | Company options + preferences | `## 🚗` section with comparison tables | Markdown in `day_XX_LANG.md` |
| HTML rendering | `## 🚗` markdown section | `.car-rental-section` with `.car-rental-table` | HTML fragment |
| Budget integration | Price ranges from comparison tables | Car rental line items | Markdown in `budget_LANG.md` |

## 4. Integration Points

### 4.1 Accommodation System Parallel

The car rental section follows the same architectural pattern as accommodation but with key differences:

| Aspect | Accommodation | Car Rental |
|---|---|---|
| Discovery source | Google Places (`type=lodging`) | Web Search + Web Fetch |
| Section heading | `## 🏨` | `## 🚗` |
| Option heading | `### 🏨` | `### 🚗` |
| CSS accent | Amber (`--color-brand-accent`) | Teal (`--color-info` / `--color-brand-accent-alt`) |
| Card class | `.accommodation-card` | `.car-rental-category` |
| CTA class | `.booking-cta` | `.rental-cta` |
| CTA data attribute | `data-link-type` on card links | `data-link-type="rental-booking"` on CTA |
| Anchor day | First day of stay block | First day of car rental block |
| Placement in day | After POI cards | After accommodation section (if present) |
| Budget line | Accommodation estimate on anchor day | Car rental estimate on anchor day |

### 4.2 Overlap Handling

A day can be both an accommodation anchor and a car rental anchor. The section placement order handles this:
1. POI cards
2. Accommodation section (`## 🏨`) — if applicable
3. **Car rental section (`## 🚗`)** — if applicable
4. Daily budget table

### 4.3 Phase A Overview Contract

The current overview contains a `## 🚗 Рекомендация по аренде автомобиля` section with hardcoded pricing and company mentions. This is replaced by a brief one-line reference pointing to the anchor day. The anchor day's `## 🚗` section becomes the single source of truth.

### 4.4 Manifest Contract

The manifest gains a new top-level `car_rental` key (sibling to `accommodation`). Downstream consumers (budget assembly, incremental edit, HTML rendering) read from this object to determine which days have car rental sections.

### 4.5 Preference Absence Handling

Unlike accommodation (which uses sensible defaults when `## Hotel Assistance` is absent), car rental is conditional: when `## Car Rental Assistance` is absent from trip details, the pipeline skips car rental sections entirely. This reflects the reality that car rental is not a universal trip need.

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Existing generated trips | No modification — changes apply to new generations only | Yes |
| Trips without `## Car Rental Assistance` | `car_rental.blocks` is empty, no sections generated | Yes — no change to output |
| Phase A overview | Hardcoded car rental recommendation section is removed, replaced with one-line anchor reference | No — overview content changes for new trips |
| Anchor car day files | New `## 🚗` section added between accommodation/POI cards and budget table | No — day file structure changes for anchor days |
| Non-anchor car day files | No change — no car rental section, fuel costs remain in their budget table | Yes |
| Budget file | New "Car Rental" category row added | No — budget format gains a new row |
| Manifest schema | New `car_rental` top-level object added | Yes — existing manifests without this key are treated as no car rental blocks |
| POI parity check | `### 🚗` headings excluded from count (like `### 🏨`) | Yes — no false failures |
| HTML rendering | New CSS classes and card type | Yes — existing HTML without these elements renders normally |
| Automation tests | New test assertions for car rental elements | Yes — existing tests unaffected |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001 (Car Rental Block Identification) | Yes | §3 (Data Flow — Phase A), §4.4 (Manifest Contract) |
| REQ-002 (Preference Consumption) | Yes | §3 (Data Flow — Preference Parsing), §4.5 (Preference Absence Handling) |
| REQ-003 (Company Discovery via Web Research) | Yes | §3 (Data Flow — Phase B Anchor Day Subagent), §4.1 (Discovery Source difference) |
| REQ-004 (Price Comparison Table) | Yes | §3 (Data Flow — Markdown Generation), §4.1 (parallel table) |
| REQ-005 (Card Format in Markdown) | Yes | §3 (Data Flow — Markdown Generation), §4.1 (Section Heading / Option Heading), §4.2 (Overlap Handling) |
| REQ-006 (Booking Link Construction) | Yes | §3 (Data Flow — Phase B step 5) |
| REQ-007 (Budget Integration) | Yes | §3 (Data Flow — Budget Assembly), §4.1 (Budget Line) |
| REQ-008 (Manifest Schema) | Yes | §3 (Data Flow — Block Identification), §4.4 (Manifest Contract) |
| REQ-009 (CEO Audit) | Yes | §2 (Affected Components — trip_planning_rules.md) |
| REQ-010 (HTML Rendering) | Yes | §2 (Affected Components — rendering-config.md, CSS), §3 (Data Flow — HTML Rendering), §4.1 (CSS classes) |
| REQ-011 (Automation Tests) | Yes | §2 (Affected Components — TripPage.ts, regression specs), §3 (Data Flow — Regression Tests) |
| REQ-012 (Language-Agnostic) | Yes | §4.1 (all labels localized), §4.5 (structural approach) |
| REQ-013 (Remove Overview Hardcoded) | Yes | §4.3 (Phase A Overview Contract), §5 (Impact — overview content changes) |
