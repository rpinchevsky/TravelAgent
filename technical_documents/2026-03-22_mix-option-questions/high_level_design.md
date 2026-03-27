# High-Level Design

**Change:** Add "Mix of All" option to categorical quiz questions
**Date:** 2026-03-22
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-22_mix-option-questions/business_requirements.md`
**Status:** Draft

---

## 1. Overview

Three categorical quiz questions (`diningstyle`, `mealpriority`, `transport`) currently offer exactly 3 mutually exclusive option cards. This change adds a 4th "mix/all" option to each, allowing users to express a balanced preference across all categories. The change touches four layers: HTML (card DOM), JavaScript (scoring + markdown generation), i18n catalogs (12 locale files), and rule documentation.

The existing grid system already supports 4-card layouts (`question-options--4` CSS class used by the `rhythm` question, and the `diet` question which renders 4 cards in the default 3-column grid). The new cards follow the identical `q-card` component structure and participate in the existing single-select radio behavior with no new interaction patterns.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Question HTML — diningstyle | `trip_intake.html` (lines 2377-2397) | Modified — add 4th card, add `question-options--4` class |
| Question HTML — mealpriority | `trip_intake.html` (lines 2423-2443) | Modified — add 4th card, add `question-options--4` class |
| Question HTML — transport | `trip_intake.html` (lines 2557-2577) | Modified — add 4th card, add `question-options--4` class |
| Food scoring logic | `trip_intake.html` — `scoreFoodItem()` (line 4434) | Modified — add `mix` handling for dining style dimension |
| Markdown generation — culinary section | `trip_intake.html` — `diningStyleLabels` (line 5457) | Modified — add `mix` key |
| Markdown generation — culinary section | `trip_intake.html` — `mealLabels` (line 5460) | Modified — add `all` key |
| Markdown generation — additional prefs | `trip_intake.html` — `transportLabels` (line 6629) | Modified — add `mix` key |
| i18n catalogs | `locales/ui_*.json` (12 files) | Modified — add 6 new keys each |
| Rule documentation | `trip_intake_rules.md` | Modified — update allowed values in Output Format section |

## 3. Data Flow

The data flow for the new options follows the identical path as existing options — no new data paths are introduced:

```
User clicks "Mix" card on question slide
  → DOM: .is-selected applied (single-select radio behavior, unchanged)
  → getAnswer(questionKey) reads data-value from selected card
     ├── "mix" for diningstyle
     ├── "all" for mealpriority
     └── "mix" for transport
  → Used in three downstream consumers:

1. scoreFoodItem(item, fq, aq)
   └── fq.diningstyle === "mix" → all style dimensions get partial score (2 pts)
       (mealpriority and transport are NOT used in food scoring)

2. generateMarkdown() — Culinary Profile section
   ├── diningStyleLabels["mix"] → "Mix of all styles"
   └── mealLabels["all"] → "Every meal matters equally"

3. generateMarkdown() — Additional Preferences section
   └── transportLabels["mix"] → "Mix — whatever fits best"
```

## 4. Integration Points

| Integration Point | Contract | Impact |
|---|---|---|
| `getAnswer(questionKey)` | Returns string `data-value` of `.is-selected` card | No change — already handles any string value |
| `getFoodQuizAnswers()` | Returns object with `diningstyle`, `mealpriority`, `localfood` keys | No change — passes through whatever `getAnswer()` returns |
| `getAvoidQuizAnswers()` | Returns object with `transport` among other keys | No change — passes through whatever `getAnswer()` returns |
| `QUESTION_DEFAULTS` | Provides fallback values when questions are hidden by depth | No change needed — existing defaults (`casual`, `dinner`, `transit`) remain appropriate per BRD analysis |
| `scoreFoodItem()` | Scores food cards based on quiz answers | Modified — must handle `style === 'mix'` |
| `diningStyleLabels` / `mealLabels` / `transportLabels` | Maps value → human-readable label for markdown | Modified — must include new keys |
| Single-select card behavior | `.q-card` click handler applies `is-selected`, removes from siblings | No change — works for any number of cards in a `question-options` container |
| CSS grid for `question-options` | Default 3-column grid; `question-options--4` class gives 4-column grid | Existing — add class to the three question containers |
| i18n `setLanguage()` / `t()` | Reads keys from locale JSON, applies to `[data-i18n]` elements | No change — automatically picks up new keys from updated locale files |
| Trip generation pipeline | Reads markdown string values; does not validate against enumerated lists | No change — new values flow through transparently |

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Existing 3-card selections (street, casual, upscale, etc.) | Scoring, markdown, and DOM behavior unchanged | Yes |
| `QUESTION_DEFAULTS` | Unchanged; defaults remain single-category values | Yes |
| Food card scoring for non-mix diningstyle | `scoreFoodItem()` existing branches untouched; new branch only triggers for `style === 'mix'` | Yes |
| Markdown output structure | Same keys, same positions; only label text differs when new value is selected | Yes |
| CSS layout | 3 questions gain `question-options--4` class (already defined and used by `rhythm` question); other questions unchanged | Yes |
| Previously generated `trip_details.md` files | Files with old values (`casual`, `dinner`, `transit`) remain fully valid — no schema changes | Yes |
| Depth tier system | No tier changes; new cards are part of existing T1/T2/T3 questions | Yes |
| RTL layout | `question-options--4` grid respects RTL via existing CSS; no RTL-specific changes needed | Yes |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Add "Mix of All" to diningstyle | Yes | §2, §3 |
| REQ-002: Add "Every Meal Counts" to mealpriority | Yes | §2, §3 |
| REQ-003: Add "Mix It Up" to transport | Yes | §2, §3 |
| REQ-004: Internationalize all new labels | Yes | §2 |
| REQ-005: Update markdown generation | Yes | §2, §3 |
| REQ-006: Update food scoring for mix | Yes | §3, §4 |
| REQ-007: Update rule documentation | Yes | §2 |
