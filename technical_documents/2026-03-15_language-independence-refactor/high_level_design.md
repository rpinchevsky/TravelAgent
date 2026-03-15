# High-Level Design

**Change:** Language-Independence Refactor — Eliminate Hardcoded Language & Trip Content from Automation Tests
**Date:** 2026-03-15
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-15_language-independence-refactor/business_requirements.md`
**Status:** Draft

---

## 1. Overview

The refactor eliminates all hardcoded Russian strings and trip-specific constants from the automation test suite by introducing two complementary strategies:

1. **Structural Detection** — Where the HTML already encodes semantic differences via element types or CSS classes, tests switch from text-matching to structural queries. This is the preferred approach because it requires zero language configuration and is inherently language-independent.

2. **Config-Driven Extraction** — Where tests must validate text content (day titles, section names, page title), a new `trip-config.ts` utility derives all values from `trip_details.md` and the generated markdown, keyed by reporting language.

**Design Principle:** Prefer structural over textual. If the DOM already tells you whether something is a POI or a generic action (via `<a>` vs `<span>`), don't parse the text at all.

### Key Architectural Insight

The biggest violation — `GENERIC_PREFIXES` (44 Russian words) — is entirely unnecessary. The rendering pipeline already encodes the generic-vs-POI distinction:
- `<span class="activity-label">` = generic action (transport, meals, walks)
- `<a class="activity-label" href="#poi-day-...">` = POI reference

The test only needs to check the element type, not parse Russian text. This pattern applies broadly: most "language-dependent" tests are actually testing structural contracts that the HTML already expresses through CSS classes and element types.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Trip config utility | `tests/utils/trip-config.ts` | **New** — central config extractor |
| Language config utility | `tests/utils/language-config.ts` | Modified — add language-to-labels mappings |
| Playwright config | `playwright.config.ts` | Modified — derive filenames from config |
| Page Object Model | `tests/pages/TripPage.ts` | Modified — remove Russian text filter |
| Activity label tests | `tests/regression/activity-label-languages.spec.ts` | Modified — structural detection |
| POI parity tests | `tests/regression/poi-parity.spec.ts` | Modified — config-driven section names |
| Day card tests | `tests/regression/day-cards.spec.ts` | Modified — config-driven titles/dates |
| Structure tests | `tests/regression/structure.spec.ts` | Modified — config-driven assertions |
| Overview/budget tests | `tests/regression/overview-budget.spec.ts` | Modified — structural + config-driven |
| POI card tests | `tests/regression/poi-cards.spec.ts` | Modified — structural approach + HTML data attributes |
| Progression tests | `tests/regression/progression.spec.ts` | Modified — config-driven + markdown extraction |
| Automation rules | `automation_rules.md` | Modified — add language-independence rule |
| Rendering config | `rendering-config.md` | Modified — add `data-section-type` attribute spec |
| HTML rendering | Generated HTML output | Modified — add data attributes for semantic sections |

## 3. Data Flow

```
trip_details.md                    Generated Markdown (trip_full_{lang}.md)
       │                                      │
       ▼                                      ▼
┌─────────────────┐               ┌──────────────────────┐
│  trip-config.ts │               │  Markdown Parser     │
│                 │               │  (in trip-config.ts)  │
│  Extracts:      │               │                      │
│  - language     │               │  Extracts:           │
│  - dates        │               │  - POI counts/day    │
│  - travelers    │               │  - budget totals     │
│  - destination  │               │  - section names     │
│  - day count    │               │  - notable POIs      │
└────────┬────────┘               └──────────┬───────────┘
         │                                   │
         ▼                                   ▼
┌─────────────────────────────────────────────────────────┐
│                    language-config.ts                     │
│                                                          │
│  Maps reporting language → localized labels:             │
│  - Day title pattern: "День {N}" / "Day {N}" / "יום {N}"|
│  - Month names in locale                                 │
│  - Section names: Plan B, Logistics, Cost, etc.          │
│  - Page title pattern                                    │
│  - Lang code for HTML lang attribute                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────┐
              │   All spec files  │
              │   (10 consumers)  │
              └──────────────────┘
```

**Text direction is derived from the language, not configured separately:**

```
Reporting language → LANGUAGE_LABELS → direction ('ltr' | 'rtl')

  Russian  → ltr    English → ltr    Hebrew → rtl
  Arabic   → rtl    French  → ltr    ...
```

The Playwright config uses `labels.direction` to resolve which HTML file is LTR (main regression target) and which is RTL (RTL layout regression target). No separate `trip_details.md` field needed — direction is an inherent property of the script.

**Alternative path (structural — no config needed):**

```
Generated HTML (trip_full_{lang}.html)
         │
         ▼
┌────────────────────────────────────────────────┐
│  Playwright locators (CSS selectors only)       │
│                                                 │
│  <span class="activity-label"> → generic        │
│  <a class="activity-label">    → POI reference  │
│  .advisory--warning            → holiday alert   │
│  .advisory--info[data-section-type="plan-b"]  → Plan B  │
│  .advisory--info[data-section-type="logistics"] → Logi. │
│  .poi-card[data-link-exempt]     → sub-venue POI  │
└────────────────────────────────────────────────┘
```

## 4. Integration Points

### 4.1 HTML Generation Contract (rendering pipeline → tests)

Two new data attributes are proposed for the HTML output:

| Attribute | Element | Values | Purpose |
|---|---|---|---|
| `data-section-type` | `.advisory--info` | `plan-b`, `logistics` | Distinguish Plan B from Logistics without text matching |
| `data-link-exempt` | `.poi-card` | (presence-only boolean attribute) | Mark POI cards not expected to have all 3 link types (sub-venues, grocery, along-the-way, etc.) |

These attributes are invisible to users, have no styling effect, and exist purely for testability. They follow the established pattern of `id="poi-day-{D}-{N}"` which already serves both navigation and testing.

**SA must approve** this addition to the rendering contract.

### 4.2 Existing Contracts Preserved

| Contract | Impact |
|---|---|
| `TripPage.ts` locator → HTML element mapping | Enhanced (new locators for data attributes), all existing CSS-class locators unchanged |
| Activity label `<a>` vs `<span>` distinction | No change — already the source of truth |
| POI card `id="poi-day-{D}-{N}"` pattern | No change |
| `language-config.ts` script detection API | No change — extended with new exports |

### 4.3 Rendering Pipeline Impact

The rendering pipeline (invoked via `/render` skill) must:
1. Add `data-section-type="plan-b"` to Plan B advisory boxes
2. Add `data-section-type="logistics"` to Logistics advisory boxes
3. Add `data-link-exempt` to POI cards that are sub-venue entries (no independent external links)

These are additive changes — no existing HTML structure is modified.

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Test results | Tests validate the same contracts but via structural queries instead of text matching | Yes — same pass/fail semantics |
| HTML output | Two new data attributes added to advisory boxes and some POI cards | Yes — additive only, no visual change |
| `trip_details.md` | No change | Yes |
| Rendering rules | Minor addition to specify data attributes on advisory/POI components | Yes — additive |
| Playwright config | Filenames derived from config instead of hardcoded | Yes — same runtime behavior for Russian trips |
| Existing CI/CD | No change to test execution commands | Yes |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001 (trip-config utility) | Yes | §3 Data Flow |
| REQ-002 (activity label Russian) | Yes | §1 Key Insight, §3 Structural path |
| REQ-003 (POI parity Russian) | Yes | §3 Config-driven path |
| REQ-004 (day cards Russian) | Yes | §3 Config-driven path |
| REQ-005 (structure Russian) | Yes | §3 Config-driven path |
| REQ-006 (overview/budget Russian) | Yes | §3 Both paths |
| REQ-007 (POI card trip-specific) | Yes | §4.1 `data-link-exempt` attribute |
| REQ-008 (progression trip-specific) | Yes | §3 Markdown parser path |
| REQ-009 (Playwright config) | Yes | §2 Affected Components, §3 Direction derivation |
| REQ-010 (POM Russian) | Yes | §4.1 `data-section-type` attribute |
| REQ-011 (enforcement rule) | Yes | §2 Affected Components |
