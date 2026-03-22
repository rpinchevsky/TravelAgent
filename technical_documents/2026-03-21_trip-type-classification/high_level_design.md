# High-Level Design

**Change:** Trip Type Classification & Type-Aware Question Bank
**Date:** 2026-03-21
**Author:** Development Team
**BRD Reference:** business_requirements.md
**Status:** Revised (v2)

---

## 1. Overview

This change introduces automatic trip type detection based on traveler composition, expands the question bank from 30 to ~70 questions organized into 8 categories (A-H), and filters visible questions by trip type + depth. The system detects one of six trip types (Solo, Couple, Young, Adults, Family, Multi-generational) after Step 1, displays it in the UI, filters the question bank so only relevant questions appear in Step 2, adjusts pre-selection scoring on Steps 3-5, and writes the trip type into the generated markdown for the downstream planning pipeline.

The core design principle is **additive layering**: the existing tier-based depth system (T1-T5, depth 10-30) remains intact. Trip type filtering is applied *before* depth selection, creating a two-stage funnel: first reduce by trip type applicability, then cap by depth/tier. This ensures backward compatibility — with no trip type detected, all questions remain eligible (equivalent to "Adults" type).

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Trip type detection logic | `trip_intake.html` (JS) | New function `detectTripType()` + integration into Step 1 completion flow |
| Trip type UI indicator | `trip_intake.html` (HTML + CSS + JS) | New context bar pill, toast notification after Step 1 |
| Expanded question bank | `trip_intake.html` (HTML + JS) | ~40 new question slides in Step 2 DOM, expanded `QUESTION_TIERS`, `QUESTION_DEFAULTS`, new `QUESTION_META` data structure |
| Type-aware question filtering | `trip_intake.html` (JS) | New `getTypeFilteredQuestions()` function, modified `applyDepth()`, modified `rebuildStyleSubDots()` |
| Family trip balancing | `trip_intake.html` (JS) | New `balanceFamilyQuestions()` function |
| Type-aware pre-selection scoring | `trip_intake.html` (JS) | Modified `scoreItem()` in `scoreAndFilterInterests()`, modified `scoreAvoidItem()`, modified `scoreFoodItem()` |
| Markdown output | `trip_intake.html` (JS) | Modified `generateMarkdown()` to include trip type field |
| Depth selector adaptation | `trip_intake.html` (HTML + JS) | Modified depth overlay to show type-filtered counts |
| Category-based ordering | `trip_intake.html` (JS) | New question sort in `getVisibleStyleSlides()` |
| Intake wizard rules | `trip_intake_rules.md` | New "Trip Type Detection" section, expanded Question Inventory, updated depth/filtering sections, updated Output Format |
| Intake visual design | `trip_intake_design.md` | New trip type pill spec, updated depth overlay spec |
| Trip planning rules | `trip_planning_rules.md` | Updated Pre-Flight Setup, Interest Hierarchy, Age-Appropriate Filter, Culinary Selection |
| i18n translations | `trip_intake.html` (JS) | New keys in `TRANSLATIONS` for trip type names, new question titles/descriptions, depth overlay text |

## 3. Data Flow

```
Step 0 (destination + dates)
    |
    v
Step 1 (traveler cards: name, DOB, gender)
    |
    v
detectTripType(travelers, arrivalDate)
    |
    +---> tripType: Solo|Couple|Young|Adults|Family|Multi-generational
    |     familyBalance: kid-focused|balanced|teen-friendly (Family only)
    |
    +---> UI: toast notification + context bar pill
    |
    v
Depth Selector Overlay
    |  Shows: "Customized for your {tripType} trip"
    |  Shows: per-depth available question counts (type-filtered pool size)
    |
    +---> selectedDepth (10-30)
    |
    v
getTypeFilteredQuestions(tripType)
    |  Filters QUESTION_META by "appliesTo" including tripType (pure string match)
    |  Returns: question keys eligible for this trip type
    |
    v
applyDepth(selectedDepth, typeFilteredQuestions)
    |  From filtered set, show questions up to tier = DEPTH_TO_MAX_TIER[depth]
    |  For Family: balanceFamilyQuestions() reorders within filtered set
    |  Hidden questions use QUESTION_DEFAULTS
    |
    v
Step 2 (visible questions, category-ordered, auto-advance)
    |
    v
scoreAndFilterInterests() / scoreAvoidItem() / scoreFoodItem()
    |  Existing scoring + NEW tripType bonus/penalty modifiers
    |
    v
Steps 3-5 (card selection with type-aware pre-selection)
    |
    v
generateMarkdown()
    |  Includes: "- **Trip Type:** {value}"
    |  Family: "- **Family Balance:** {value}"
    |
    v
Step 7 (preview + download)
    |
    v
trip_planning_rules.md reads Trip Type field
    |  Adjusts: interest hierarchy weights, pace defaults,
    |  culinary emphasis, activity selection bias
```

## 4. Integration Points

### 4.1 `analyzeGroup()` + `detectTripType()`
The existing `analyzeGroup()` function (line 5540) computes boolean flags (`adultsOnly`, `withKids`, `senior`, `youngAdult`, `couple`, etc.) and `ageTags`. The new `detectTripType()` function will consume these same flags plus adult count and child age distribution to produce a single trip type classification. `analyzeGroup()` is **not modified** — `detectTripType()` is a new function that calls `analyzeGroup()` internally and returns `{ tripType, familyBalance }` alongside the existing `{ flags, ageTags }`.

### 4.2 `QUESTION_TIERS` / `QUESTION_DEFAULTS` + `QUESTION_META`
The existing `QUESTION_TIERS` (line 7481) maps question keys to tier numbers (1-5). The existing `QUESTION_DEFAULTS` (line 7495) maps question keys to default values. A new `QUESTION_META` object will be added that extends each question with `category` (A-H) and `appliesTo` (array of trip types). The `appliesTo` field uses a **pure string-match model** — each entry is a simple array of trip type name strings, with no conditional or flag-based filtering logic. This keeps the filtering function (`getTypeFilteredQuestions()`) a straightforward `includes()` check. The existing structures remain unchanged — `QUESTION_META` is additive (phase 1). Post-stabilization, `QUESTION_META` will become the single source of truth with `QUESTION_TIERS` and `QUESTION_DEFAULTS` derived from it.

### 4.3 `applyDepth()` + type-aware filtering
The existing `applyDepth(level)` function (line 7675) shows/hides question slides by comparing `data-tier` against `DEPTH_TO_MAX_TIER[level]`. The modified version will also check whether each question's key is in the type-filtered set. A question is visible only if: (a) its tier <= maxTier AND (b) its key is in the type-filtered set. The `data-depth-hidden` attribute is reused for hiding. After filtering, `rebuildStyleSubDots()` must use the category-sorted order from `getVisibleStyleSlides()` (not DOM order) to ensure sub-dot indices match the presentation order. The depth selector's "Recommended" badge will relocate if the standard depth (20) exceeds the type-filtered pool at that tier level.

### 4.4 Pre-selection scoring functions
The existing `scoreItem()` (line 5894), `scoreAvoidItem()` (line 6094), and `scoreFoodItem()` (line 5690) produce numeric scores based on questionnaire answers and audience flags. Trip type scoring is additive: a `TRIP_TYPE_SCORING` table maps trip types to bonus/penalty adjustments for specific interest/avoid/food tags. This does not replace existing scoring — it adds a modifier (typically +1 to +3) to the existing score.

### 4.5 `generateMarkdown()` + trip type field
The existing `generateMarkdown()` (line 6606) builds the markdown string. The trip type field will be inserted into the `## Trip Context` section, after the `Departure` line, before `### Daily Schedule`.

### 4.6 Context bar + trip type pill
The existing context bar (line 1929) has pills for destination, dates, travelers, depth, and style. A new trip type pill will be added between travelers and depth. Clicking it navigates back to Step 1 (consistent with travelers pill behavior).

### 4.7 `trip_planning_rules.md` consumption
The planning rules Pre-Flight Setup reads the trip details file. It will be extended to read the new `Trip Type` and `Family Balance` fields. If missing (backward compatibility), the pipeline falls back to inferring trip type from traveler composition using the same detection logic.

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| `analyzeGroup()` function | Not modified. `detectTripType()` is a new function that consumes its output. | Yes |
| `QUESTION_TIERS` constant | Extended with ~40 new entries for new questions. Existing 30 entries unchanged. | Yes |
| `QUESTION_DEFAULTS` constant | Extended with ~40 new entries. Existing 30 entries unchanged. | Yes |
| `applyDepth()` function | Modified to also check type-filtered set. With no trip type (null), all questions are eligible (current behavior). | Yes |
| `getVisibleStyleSlides()` function | May return questions in category order instead of DOM order. Existing behavior: DOM order. | Yes (order change is visual only) |
| Pre-selection scoring | Additive modifiers. Existing scores remain the primary driver. With no trip type, no modifiers are applied. | Yes |
| `generateMarkdown()` output | New `Trip Type` field added. Existing fields unchanged. Old consumers that don't read this field are unaffected. | Yes |
| Depth selector overlay | Shows trip-type-aware messaging and counts. Without trip type, shows generic messaging (current behavior). | Yes |
| Context bar | New pill added. Existing pills unchanged. | Yes |
| Question slide DOM | ~40 new slides added to Step 2. Existing 30 slides unchanged (same keys, same options, same data attributes). | Yes |
| Trip planning rules | New paragraphs reading trip type. Existing logic unchanged. Fallback to inferring type if field is missing. | Yes |
| i18n TRANSLATIONS | New keys added. Existing keys unchanged. | Yes |
| Step 1 → Step 2 transition | Now passes through trip type detection + depth selector (both already happen sequentially). Detection is instant (no API call). | Yes |
| Step 2 reset on Step 1 change | Existing: leaving Step 2 clears selections. New: also rebuilds the question set from the new trip type. Same user-facing behavior. | Yes |
| Existing trip_details.md files | Pipeline falls back to inferring type if Trip Type field is missing. | Yes |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Trip Type Detection Logic | Yes | 3 (Data Flow), 4.1 (analyzeGroup + detectTripType) |
| REQ-002: Trip Type UI Indicator | Yes | 3 (Data Flow), 4.6 (Context bar + pill) |
| REQ-003: Expanded Question Bank (~70 Questions) | Yes | 2 (Affected Components), 4.2 (QUESTION_META) |
| REQ-004: Type-Aware Question Filtering | Yes | 3 (Data Flow), 4.3 (applyDepth + type-aware filtering) |
| REQ-005: Family Trip Balancing Logic | Yes | 3 (Data Flow — balanceFamilyQuestions) |
| REQ-006: Type-Aware Pre-Selection Scoring | Yes | 3 (Data Flow), 4.4 (Pre-selection scoring functions) |
| REQ-007: Trip Type in Generated Markdown | Yes | 4.5 (generateMarkdown + trip type field) |
| REQ-008: Trip Planning Pipeline Reads Trip Type | Yes | 4.7 (trip_planning_rules.md consumption) |
| REQ-009: Depth Selector Adaptation | Yes | 3 (Data Flow — Depth Selector Overlay), 4.3 |
| REQ-010: Category-Specific Question Organization | Yes | 2 (Affected Components — category-based ordering) |

---

## 7. Revision History

| Version | Date | Change |
|---|---|---|
| v1 | 2026-03-21 | Initial draft |
| v2 | 2026-03-21 | Addressed SA architecture review (FB-1 through FB-5, FB-8) |

### v2 Changes

- **Section 4.2:** Clarified that `appliesTo` uses a pure string-match model with no conditional/flag-based filtering. Added note on post-stabilization refactoring to make `QUESTION_META` the single source of truth. [FB-1, FB-4]
- **Section 4.3:** Added requirement that `rebuildStyleSubDots()` uses `getVisibleStyleSlides()` sorted order (not DOM order). Added "Recommended" badge relocation behavior. [FB-2, FB-3]
- **Section 3 (Data Flow):** Annotated `getTypeFilteredQuestions` as pure string match. [FB-1]
