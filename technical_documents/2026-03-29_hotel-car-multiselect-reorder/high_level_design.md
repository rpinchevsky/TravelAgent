# High-Level Design

**Change:** Hotel/Car Multi-Select and Step Reorder
**Date:** 2026-03-29
**Author:** Development Team
**BRD Reference:** `technical_documents/2026-03-29_hotel-car-multiselect-reorder/business_requirements.md`
**UX Reference:** `technical_documents/2026-03-29_hotel-car-multiselect-reorder/ux_design.md`
**Status:** Draft

---

## 1. Overview

This change modifies two behavioral aspects of the trip intake wizard and their downstream outputs:

1. **Multi-select for hotelType and carCategory option grids.** The global q-card click handler currently enforces radio behavior (single-select) on all `.depth-extra-question` containers. We introduce a `data-multi-select` attribute on exactly two `.option-grid` containers (hotelType and carCategory) and branch the click handler to toggle individual cards without clearing siblings when this attribute is present. All other q-card groups retain radio behavior. A CSS-only checkmark badge (`.option-grid__check`) and a hint label (`.option-grid__hint`) provide multi-select affordance.

2. **Depth overlay trigger relocation.** The depth overlay currently intercepts the Step 1 Continue button click (line ~7316). We move this intercept to trigger on the Step 2 Continue button click instead, so the flow becomes: Step 1 -> Step 2 -> [depth overlay] -> Step 3. The overlay confirm handler advances to the first active step after Step 2 (was: after Step 1). Escape/outside-click focus returns to Step 2 Continue (was: Step 1 Continue).

Both changes are scoped to `trip_intake.html` with supporting updates to `trip_intake_rules.md` and `trip_intake_design.md`. No new files are created. No external dependencies are introduced.

## 2. Affected Components

| Component | File(s) | Type of Change |
|---|---|---|
| Q-card click handler | `trip_intake.html` (line ~4951) | Modified — add multi-select branch for `data-multi-select` grids |
| Option grid HTML (hotelType) | `trip_intake.html` (line ~2333) | Modified — add `data-multi-select` attr, hint label, `aria-pressed` on cards |
| Option grid HTML (carCategory) | `trip_intake.html` (line ~2536) | Modified — add `data-multi-select` attr, hint label, `aria-pressed` on cards |
| Option grid CSS | `trip_intake.html` (CSS section, line ~1162) | Modified — add `.option-grid__hint`, `.option-grid__check` pseudo-element, `position: relative` on cards |
| `generateMarkdown()` hotel output | `trip_intake.html` (line ~7513) | Modified — `querySelector` to `querySelectorAll`, join with ", " |
| `generateMarkdown()` car output | `trip_intake.html` (line ~7550) | Modified — `querySelector` to `querySelectorAll`, join with ", " |
| Depth overlay intercept | `trip_intake.html` (line ~7316) | Modified — change `currentStep === 1` to `currentStep === 2` |
| Depth confirm handler | `trip_intake.html` (line ~7166) | Modified — advance to first active step after Step 2 (was: after Step 1) |
| Depth escape/outside-click handler | `trip_intake.html` (lines ~7113, ~7178) | Modified — focus Step 2 Continue button (was: Step 1) |
| Wizard flow documentation | `trip_intake_rules.md` | Modified — Wizard Flow section, Step 2 field table, Output Format |
| Design spec documentation | `trip_intake_design.md` | Modified — Option Grid spec, Depth Selector Overlay section, Assistance Section |
| i18n locale files | `locales/ui_*.json` (12 files) | Modified — add `s6_multiselect_hint` key |

## 3. Data Flow

### Multi-Select Data Flow

```
User clicks q-card in .option-grid[data-multi-select]
  -> Click handler detects data-multi-select on ancestor .option-grid
  -> TOGGLE: card.classList.toggle('is-selected')
  -> Update aria-pressed attribute
  -> CSS pseudo-element ::after shows/hides checkmark badge via .is-selected

User clicks Generate/Preview (Step 8)
  -> generateMarkdown() runs
  -> For hotelType: querySelectorAll('.q-card.is-selected') -> map data-en-name -> join(', ')
  -> For carCategory: querySelectorAll('.q-card.is-selected') -> map data-en-name -> join(', ')
  -> If 0 selected: "Not specified"
  -> Output: "- **Accommodation type:** Hotel, Airbnb, Resort"
```

### Step Reorder Data Flow

```
Step 1 (Who's Traveling) -> [Continue] -> Step 2 (Hotel/Car)
  -> No overlay interception
  -> Standard goToStep(2)

Step 2 (Hotel/Car) -> [Continue]
  -> hookDepthNavigation intercepts at currentStep === 2
  -> openDepthOverlay(false)
  -> stepBeforeOverlay = 2
  -> User selects depth, clicks Confirm
  -> applyDepth(selectedDepth)
  -> goToStep(firstActive > 2)   // typically Step 3

Step 3+ -> [depth pill re-entry]
  -> openDepthOverlay(true)
  -> stepBeforeOverlay = currentStep
  -> On confirm: returns to stepBeforeOverlay (unchanged behavior)
```

## 4. Integration Points

| Integration Point | Contract | Impact |
|---|---|---|
| Q-card click delegation (global handler) | Radio behavior preserved for all containers WITHOUT `data-multi-select` attribute | Zero impact on Step 3 questionnaire, Step 7 wheelchair, assistance toggles, and all other single-select q-card groups |
| Assistance toggle reset handler (line ~5010) | Calls `body.querySelectorAll('.q-card.is-selected').forEach(c => c.classList.remove('is-selected'))` | Already handles multi-select correctly — clears ALL selected cards, not just one. Also needs to reset `aria-pressed` on multi-select cards. |
| `generateMarkdown()` patched version (depth IIFE, line ~7400) | Wrapper calls `_origGenerateMarkdown()` then appends depth-gated fields | Hotel/car output is inside the wrapper — changes propagate automatically |
| Trip planning pipeline consumers | Parse `- **Accommodation type:** {value}` and `- **Car category:** {value}` from trip details | Must accept comma-separated values (e.g., "Hotel, Airbnb"). Existing parsing reads the line as a string — no regex split needed; the pipeline passes the value through as-is |
| Automation test specs | `intake-hotel-car-assistance.spec.ts` validates card selection behavior | Must be updated to verify multi-select (covered in AE test plan, not in this design) |

## 5. Impact on Existing Behavior

| Area | Impact | Backward Compatible? |
|---|---|---|
| Single-select q-card groups (H2-H7, C2-C6, Step 3, Step 7) | No change — radio behavior preserved by the `data-multi-select` guard | Yes |
| Option grid visual appearance | Minimal — new checkmark badge appears on selected cards; hint text added above grid | Yes (additive) |
| Depth overlay UI and options | No change — same 5-depth options, same animations, same re-entry pill | Yes |
| Depth overlay trigger timing | Fires after Step 2 instead of Step 1 — users will see Step 2 before depth selection | No (intentional flow change per BRD) |
| Markdown output for accommodation type / car category | Single value becomes comma-separated list when multiple selected; "Not specified" when none selected | No (intentional output format change per BRD) |
| Assistance toggle collapse reset | Already clears all `.is-selected` cards — works correctly with multi-select. Minor addition: reset `aria-pressed` to `"false"` on multi-select cards. | Yes |
| Step navigation (goToStep, back/forward) | No change to step numbering. Only the depth overlay insertion point moves. | Yes |

## 6. BRD Coverage Matrix

| Requirement | Addressed in HLD? | Section |
|---|---|---|
| REQ-001: Accommodation Type (H1) Multi-Select | Yes | §2 (click handler + HTML), §3 (data flow), §4 (reset handler) |
| REQ-002: Car Category (C1) Multi-Select | Yes | §2 (click handler + HTML), §3 (data flow), §4 (reset handler) |
| REQ-003: Markdown Output for Multi-Select Fields | Yes | §2 (generateMarkdown), §3 (data flow) |
| REQ-004: Step Reorder — Hotel/Car Before Depth Selector | Yes | §2 (depth intercept + confirm), §3 (step reorder flow) |
| REQ-005: Reset Behavior Preservation for Multi-Select | Yes | §4 (assistance toggle reset), §5 (backward compatibility) |
