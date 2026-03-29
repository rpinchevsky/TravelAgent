# High-Level Design

**Change:** Hotel Assistance & Car Rental Assistance — Optional Intake Sections
**Date:** 2026-03-28
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-28_hotel-car-assistance/business_requirements.md`
**Status:** Draft

---

## 1. Overview

This change adds two optional, toggle-gated sections to Step 6 (Language & Extras) of `trip_intake.html`: **Hotel Assistance** (7 sub-questions) and **Car Rental Assistance** (6 sub-questions). Each section is collapsed by default (toggle = No) and expands with a smooth animation when the user selects Yes. The change also introduces a new **dual-handle range slider** component for budget questions (hotel and car). All new UI text is internationalized across 12 locale files. The `generateMarkdown()` function is extended to conditionally emit `## Hotel Assistance` and `## Car Rental Assistance` sections in the output markdown. Three rule files are updated to document the new fields, output format, and design specs.

The technical approach follows existing patterns closely: the wheelchair accessibility toggle in Step 6 serves as the architectural template for both new sections, the q-card radio-select and multi-select chip patterns are reused, and the patched `generateMarkdown()` function is extended (not rewritten). The dual-handle range slider is the only genuinely new component.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Step 6 DOM — Hotel section | `trip_intake.html` (HTML) | Add new section with toggle + 7 sub-questions |
| Step 6 DOM — Car section | `trip_intake.html` (HTML) | Add new section with toggle + 6 sub-questions |
| CSS — Collapsible sections | `trip_intake.html` (CSS) | New `.assistance-section`, `.assistance-section__body` styles |
| CSS — Card grid for large option sets | `trip_intake.html` (CSS) | New `.option-grid` responsive grid (3-4 cols desktop, 2 cols mobile) |
| CSS — Multi-select chips | `trip_intake.html` (CSS) | New `.chip-toggle` pill-shaped multi-select buttons |
| CSS — Dual-handle range slider | `trip_intake.html` (CSS) | New `.range-slider` component styles |
| JS — Range slider component | `trip_intake.html` (JS) | New `initRangeSlider()` function (pointer/touch events, keyboard, RTL) |
| JS — Toggle show/hide logic | `trip_intake.html` (JS) | New event delegation for hotel/car toggles controlling sub-question visibility |
| JS — Markdown generation | `trip_intake.html` (JS) | Extend patched `generateMarkdown()` to emit hotel/car sections |
| i18n catalogs | `locales/ui_*.json` (12 files) | Add ~95 new keys (section headers, questions, option labels) |
| Rule file — intake rules | `trip_intake_rules.md` | Update Step 6 field table, Supplementary Fields table, Output Format section |
| Rule file — intake design | `trip_intake_design.md` | Add component specs for assistance sections, card grid, chip toggle, range slider |
| Rule file — content format | `content_format_rules.md` | Add optional `## Hotel Assistance` and `## Car Rental Assistance` to markdown structure |

## 3. Data Flow

```
User Action                    DOM State                           Markdown Output
───────────────────────────────────────────────────────────────────────────────────
1. Step 6 loads                Hotel toggle = No (default)         (no hotel section)
                               Car toggle = No (default)           (no car section)
                               Sub-questions hidden

2. User clicks "Yes"           Toggle card gets .is-selected       —
   on Hotel toggle             .assistance-section__body expands
                               (max-height + opacity transition)
                               7 sub-questions become visible

3. User fills hotel prefs      Cards/chips/slider get selections   —
   (type, location, stars,     stored via .is-selected class,
   amenities, pets,            data-value attributes, and
   cancellation, budget)       range slider state

4. User clicks "Yes"           Car section expands similarly       —
   on Car toggle               6 sub-questions visible

5. User fills car prefs        Same selection mechanisms            —

6. User navigates to Step 7    generateMarkdown() runs:            Full markdown with:
                               - Checks hotel toggle value         ## Hotel Assistance
                               - If "yes": reads all 7 fields,      - **Accommodation type:** ...
                                 maps to English labels,             - **Location priority:** ...
                                 appends ## Hotel Assistance          ...
                               - Checks car toggle value           ## Car Rental Assistance
                               - If "yes": reads all 6 fields,      - **Car category:** ...
                                 appends ## Car Rental Assistance     ...

7. User clicks "No" on a      Sub-questions collapse               Section omitted from markdown
   toggle after "Yes"          All selections within section
                               reset to defaults/cleared
```

### Key Data Points

- **Toggle state**: Stored as `data-value="yes"|"no"` on the selected q-card within each toggle's `.depth-extra-question` container.
- **Single-select values**: Read from `.q-card.is-selected` within each sub-question's `.depth-extra-question` container, via `data-value` attribute.
- **Multi-select values**: Read from `.chip-toggle.is-selected` elements, via `data-en-name` attribute (English name for markdown).
- **Range slider values**: Read from the slider component's min/max state (stored as `data-min-val` and `data-max-val` on the slider container element).
- **Markdown output**: Always uses English labels regardless of UI language (consistent with existing `data-en-name` pattern).

## 4. Integration Points

### 4.1 Existing q-card Click Delegation (line ~4401)

The global `document.addEventListener('click', ...)` handler already supports both `.question-slide` and `.depth-extra-question` containers. The new toggle cards and single-select sub-questions use `.depth-extra-question` containers and `.q-card` elements, so they integrate seamlessly with the existing click delegation — no modifications needed to the click handler itself.

### 4.2 Toggle → Sub-Question Visibility

A new event listener (attached to each `.assistance-section`) listens for q-card selection changes on the toggle question. When the toggle value changes:
- **Yes**: Set `max-height` and `opacity` on `.assistance-section__body` to reveal sub-questions.
- **No**: Collapse `.assistance-section__body`, iterate all sub-questions within it and reset selections (remove `.is-selected` from all cards/chips, reset slider to full range).

This mirrors how existing quiz collapse/expand works (max-height + opacity, 0.3-0.4s ease) per the animation spec.

### 4.3 Patched generateMarkdown() (line ~6648)

The existing `patchGenerateMarkdown()` IIFE wraps the original `generateMarkdown()` and appends `## Additional Preferences`. The hotel and car sections are appended **after** `## Additional Preferences` within the same patched function. This keeps the insertion point consistent and avoids a second wrapper layer.

### 4.4 i18n System

All new elements use `data-i18n` attributes. Option labels that appear in markdown output also carry `data-en-name` attributes. The existing `setLanguage()` function automatically translates all `[data-i18n]` elements, so no changes to the translation system are needed.

### 4.5 Multi-Select Chips (New Pattern)

The existing codebase has chip-style selectors for interests/avoids (`.interest-card`, `.avoid-card`) but these are too large for inline form sub-questions. A new `.chip-toggle` class provides compact pill-shaped multi-select buttons (similar to the flexible dates pills in the calendar). Click handler uses event delegation — a single listener on each chip container toggles `.is-selected` on the clicked chip.

### 4.6 Dual-Handle Range Slider (New Component)

This is the only entirely new component. It is self-contained within `trip_intake.html` (CSS + JS), with no external dependencies. The component is instantiated via `initRangeSlider(container, { min, max, step, prefix })` and manages its own pointer/touch events. Two instances are created: one for hotel budget, one for car budget.

### 4.7 RTL Support

All new components use CSS logical properties (`margin-inline-start`, `padding-inline-end`, etc.) and the existing `[dir="rtl"]` selector for overrides. The range slider reverses its track direction under RTL. The card grids and chip layouts inherit RTL behavior from the existing grid/flex patterns.

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Step 6 layout | Two new sections appended after wheelchair toggle, before button bar | Yes — existing fields unchanged, new sections collapsed by default |
| Markdown output | Two new optional `##` sections appended after `## Additional Preferences` | Yes — sections only present when opted in; existing parsers ignore unknown sections |
| q-card click delegation | No change — existing handler already supports `.depth-extra-question` | Yes |
| `generateMarkdown()` | Extended within existing patch — no structural change to base function | Yes — output without hotel/car is identical to before |
| CSS bundle size | ~150 new CSS lines for assistance sections, card grid, chip toggle, range slider | Yes — additive only, no existing selectors modified |
| JS bundle size | ~180 new JS lines for toggle logic, chip click handler, range slider, markdown generation | Yes — additive only |
| i18n catalogs | ~95 new keys added to each of 12 files | Yes — additive; no existing keys modified |
| Step 7 preview | Shows new sections if opted in | Yes — preview renders whatever markdown is generated |
| Downloaded file | Contains new sections if opted in | Yes — pipeline ignores unknown sections |
| Existing trips without these sections | Fully functional — pipeline does not require these sections | Yes |
| Trip planning pipeline (`trip_planning_rules.md`) | Does not consume these sections yet (future enhancement, out of scope) | Yes |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Hotel Assistance Toggle | Yes | §3 (toggle flow), §4.2 (visibility logic) |
| REQ-002: Hotel Preference Questions (7) | Yes | §2 (DOM), §3 (data flow), §4.1 (q-card delegation) |
| REQ-003: Car Rental Assistance Toggle | Yes | §3 (toggle flow), §4.2 (visibility logic) |
| REQ-004: Car Rental Preference Questions (6) | Yes | §2 (DOM), §3 (data flow), §4.1 (q-card delegation) |
| REQ-005: Dual-Handle Range Slider | Yes | §2 (CSS+JS), §4.6 (component spec) |
| REQ-006: Markdown Output — Hotel | Yes | §3 (data flow step 6), §4.3 (generateMarkdown patch) |
| REQ-007: Markdown Output — Car | Yes | §3 (data flow step 6), §4.3 (generateMarkdown patch) |
| REQ-008: i18n — 12 Locale Files | Yes | §2 (locale files), §4.4 (i18n system) |
| REQ-009: Design System Compliance | Yes | §4.2 (animations), §4.5 (chips), §4.7 (RTL), §5 (backward compat) |
| REQ-010: Step 6 Layout & Ordering | Yes | §2 (DOM), §5 (layout impact) |
| REQ-011: Supplementary Field Registration | Yes | §2 (rule files) |
