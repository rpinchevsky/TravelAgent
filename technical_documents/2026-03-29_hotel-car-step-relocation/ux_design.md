# UX Design Document

**Change:** Relocate Hotel & Car Rental Assistance to a New Dedicated Step 2
**Date:** 2026-03-29
**Author:** UX/UI Principal Engineer
**BRD Reference:** `technical_documents/2026-03-29_hotel-car-step-relocation/business_requirements.md`
**Status:** Approved

---

## 1. Overview

Users naturally think about accommodation and transport logistics early in trip planning — immediately after deciding where, when, and who. The current placement of hotel and car rental assistance in Step 6 ("Language & Extras") buries these logistics decisions among unrelated supplementary fields, causing low discoverability and a jarring context switch.

This change introduces a new Step 2 ("Plan Your Stay & Travel") that creates a clean logistics cluster: **Where & When (Step 0) -> Who's Traveling (Step 1) -> Stay & Travel (Step 2)**. The user settles the "hard logistics" before exploring preferences and interests. Both hotel and car toggles default to "No," so the step is a quick pass-through for users who don't need assistance — preserving the wizard's low-friction feel.

No new components are introduced. All existing UI patterns (`.assistance-section`, `.option-grid`, `.chip-toggle`, `.range-slider`, `.q-card`, `.depth-extra-question`) are relocated unchanged.

## 2. User Flow

The updated wizard journey with the new Step 2 inserted:

```
Step 0: Where & When (destination + dates)
  |
Step 1: Who's Traveling (travelers)
  |
  v
[Depth Selector Overlay — fires on leaving Step 1, before Step 3]
  |
Step 2: Plan Your Stay & Travel (hotel + car toggles, both default "No")
  |  -> If both "No": user clicks Continue, passes through in ~2 seconds
  |  -> If "Yes" on either: collapsible sub-questions expand inline
  |
Step 3: All Preferences (one-by-one questionnaire, formerly Step 2)
  |
Step 4: Interests (card selection, formerly Step 3)
  |
Step 5: Things to Avoid (card selection, formerly Step 4)
  |
Step 6: Food & Dining (card selection, formerly Step 5)
  |
Step 7: Language & Extras (language, notes, photo, accessibility, wheelchair — formerly Step 6, minus hotel/car)
  |
Step 8: Review & Download (formerly Step 7)
```

**Key flow decisions:**

1. **Depth selector fires between Step 1 and Step 3** (the questionnaire), not between Step 1 and Step 2. The depth selector determines how many preference questions appear in the questionnaire step. Hotel/car logistics are supplementary fields unrelated to question depth, so the user should not encounter the depth overlay before the logistics step.

2. **Navigation sequence:** Continue on Step 1 triggers depth overlay -> depth confirmed -> wizard advances to Step 2 (logistics) -> Continue on Step 2 advances to Step 3 (questionnaire). Back on Step 3 returns to Step 2. Back on Step 2 returns to Step 1.

3. **No validation gate on Step 2.** Hotel and car are optional. The Continue button is always enabled. Users can pass through without any interaction.

## 3. Placement & Navigation

| Element | New Location | Previous Location | Rationale |
|---|---|---|---|
| Hotel Assistance toggle + 7 sub-questions | Step 2, first section | Step 6, after wheelchair | Logistics cluster: destination -> travelers -> stay/travel |
| Car Rental Assistance toggle + 6 sub-questions | Step 2, second section (below hotel) | Step 6, after hotel section | Grouped with hotel — both are travel logistics |
| Step 2 stepper circle | Stepper position index 2 | N/A (new) | Between Travelers (1) and Style (now 3) |
| Language & Extras (Step 7, formerly 6) | Step 7 | Step 6 | Retains language, notes, photo, accessibility, wheelchair only |

**Rationale for Step 2 placement:**
- **Cognitive sequence:** Users plan logistics (where to stay, how to get around) before exploring interests and preferences. This mirrors the booking.com mental model where accommodation/transport are early decisions.
- **Progressive disclosure:** Both toggles default to "No" with collapsed sub-questions. Users who don't need assistance see only two compact toggle cards and can skip through in seconds.
- **Discoverability:** A dedicated step with its own stepper icon (hotel/building emoji) makes the feature visible. In Step 6, it was buried below 5+ other fields.
- **Separation of concerns:** Step 7 (formerly 6) becomes a clean "Language & Final Details" step without logistics noise.

## 4. Layout & Wireframes

### 4.1 Step 2 — Plan Your Stay & Travel

The step panel uses the standard `<section class="step" data-step="2">` container with the same spacing and structure as all other steps.

**Desktop (>=1024px):**
```
+----------------------------------------------------------+
| [Step Title]  Plan Your Stay & Travel                     |
| [Step Desc]   Need help with hotels or car rental?        |
|               Toggle the options below.                   |
|                                                           |
| ── Hotel Assistance ─────────────────────────────────── |
| [Toggle: No, I'll Handle It]  [Toggle: Yes, Help Me]    |
|                                                           |
| (if Yes: sub-questions expand with slide animation)      |
| [Accommodation Type - 4x3 option grid]                   |
| [Location Priority - 5 q-cards]                          |
| [Quality Level - 4 q-cards]                              |
| [Must-Have Amenities - 12 chip toggles]                  |
| [Traveling with Pets - 2 q-cards]                        |
| [Cancellation Flexibility - 3 q-cards]                   |
| [Daily Budget per Room - range slider]                   |
|                                                           |
| ── Car Rental Assistance ────────────────────────────── |
| [Toggle: No, I'll Handle It]  [Toggle: Yes, Help Me]    |
|                                                           |
| (if Yes: sub-questions expand with slide animation)      |
| [Car Category - 4x4 option grid]                         |
| [Transmission - 3 q-cards]                               |
| [Fuel Type - 5 q-cards]                                  |
| [Pickup & Return - 4 q-cards]                            |
| [Additional Equipment - 7 chip toggles]                  |
| [Daily Rental Budget - range slider]                     |
|                                                           |
| [<- Back]                            [Continue ->]       |
+----------------------------------------------------------+
```

**Mobile (<=480px):**
```
+------------------------------+
| Plan Your Stay & Travel      |
| Need help with hotels or     |
| car rental? Toggle below.    |
|                               |
| ── Hotel Assistance ──────  |
| [No, I'll Handle It]        |
| [Yes, Help Me Choose]       |
|                               |
| (if Yes: same sub-questions  |
|  stack vertically, grids     |
|  collapse to 2-column)      |
|                               |
| ── Car Rental ────────────  |
| [No, I'll Handle It]        |
| [Yes, Help Me Choose]       |
|                               |
| [<- Back]   [Continue ->]   |
+------------------------------+
```

**Structure notes:**
- The step title and description follow the standard `.step__title` + `.step__desc` pattern used by all steps.
- The two assistance sections are separated by the existing `.assistance-section` border-top + margin pattern, providing clear visual separation.
- The hotel section appears first (accommodation is typically decided before transport).
- Both toggles default to "No" (`.is-selected` on the "No" q-card), keeping the step compact by default.

### 4.2 Step 7 — Language & Extras (After Removal)

With hotel and car sections removed, Step 7 contains only:

```
+----------------------------------------------------------+
| [Step Title]  Almost Done!                                |
| [Step Desc]   Choose your report language and add notes.  |
|                                                           |
| [Report Language dropdown]                                |
| [POI Languages auto-hint]                                 |
| [Additional Notes textarea]                               |
|                                                           |
| [Photography - 3 q-cards]                                 |
| [Accessibility - 3 q-cards]                               |
| [Wheelchair - 2 q-cards]                                  |
|                                                           |
| [<- Back]                     [Review My Trip ->]         |
+----------------------------------------------------------+
```

This is a cleaner, more focused step. The removal of hotel/car sections reduces the scroll depth significantly, improving completion rate for the finalize phase.

## 5. Component Specifications

No new components are introduced. All components are existing patterns relocated to a new step container. The specifications below cover the only new elements.

### 5.1 Stepper Entry — Step 2

**Visual:**
- Circle: 28px diameter (matches all other stepper circles)
- Icon: Hotel/building emoji (🏨, HTML entity `&#127976;`) — communicates "stay & travel" at a glance
- Label: "Stay" (short, consistent with other 4-6 character stepper labels)
- i18n key: `step_stay` (new key, to be added to all 12 locale files)

**States:**
- Pending: border-strong circle, muted text, hotel emoji visible
- Active: brand-primary bg, white text, outer glow (4px rgba), hotel emoji visible
- Done: accent gold bg, white checkmark replaces emoji

**Behavior:**
- Clickable to navigate back to Step 2 when step is in "done" state
- Follows existing stepper click navigation pattern

### 5.2 Step 2 Panel — Title & Description

**Title:**
- Element: `<h2 class="step__title" data-i18n="s2_title">`
- English text: "Plan Your Stay & Travel"
- i18n key: `s2_title`

**Description:**
- Element: `<p class="step__desc" data-i18n="s2_desc">`
- English text: "Need help finding accommodation or a rental car? Toggle the options below — skip if you've got it covered."
- i18n key: `s2_desc`

**Visual:** Identical to all other step titles — uses `.step__title` (brand-primary accent bar left border, text-xl, weight 700) and `.step__desc` (text-sm, muted color).

### 5.3 Visual Separation Between Hotel and Car Sections

Both sections use the existing `.assistance-section` container which provides:
- `margin-top: var(--space-5)` (40px) between sections
- `border-top: 1px solid var(--color-border)` as visual divider
- `padding-top: var(--space-4)` (32px) inner spacing

This is the same separation pattern already used in the current Step 6 implementation. No changes to the CSS needed.

## 6. Interaction Patterns

| Interaction | Trigger | Behavior | Duration |
|---|---|---|---|
| Navigate to Step 2 | Depth overlay confirmed (from Step 1) | Step 2 panel slides in from right (slideInRight) | 0.35s ease |
| Navigate back to Step 2 | Back button on Step 3 | Step 2 panel slides in from left (slideInLeft) | 0.35s ease |
| Hotel section expand | Toggle "Yes, Help Me Choose" | `.assistance-section__body` gains `.is-expanded`: max-height 0->4000px, opacity 0->1 | max-height 0.4s, opacity 0.3s ease |
| Hotel section collapse | Toggle "No, I'll Handle It" | `.is-expanded` removed, all hotel child selections reset to defaults | max-height 0.4s, opacity 0.3s ease |
| Car section expand | Toggle "Yes, Help Me Choose" | Same expand pattern as hotel | max-height 0.4s, opacity 0.3s ease |
| Car section collapse | Toggle "No, I'll Handle It" | Same collapse + reset pattern as hotel | max-height 0.4s, opacity 0.3s ease |
| Quick pass-through | Continue on Step 2 (both toggles "No") | Advances to Step 3, no validation gate | Immediate (standard step transition) |
| Stepper circle click | Click Step 2 circle (when done) | Navigates back to Step 2, preserving selections | Standard step transition |

**Navigation flow detail — depth overlay sequencing:**

The depth overlay must fire when leaving Step 1 (not when entering Step 2). The sequence is:
1. User clicks Continue on Step 1 (validation passes)
2. Depth selector overlay appears
3. User selects depth and confirms
4. Wizard advances to Step 2 (not Step 3)
5. User interacts with Step 2 (or passes through)
6. User clicks Continue on Step 2
7. Wizard advances to Step 3 (questionnaire)

Clicking Back on Step 2 returns to Step 1 without re-triggering the depth overlay.

## 7. Responsive Behavior

All responsive behavior is inherited from existing component CSS. No new breakpoint rules are needed.

| Breakpoint | Layout Change |
|---|---|
| Desktop (>=1024px) | Hotel/car toggle cards: 2-column side-by-side. Option grids: 4-column. Q-card groups: 3-column. Chip toggles: flex-wrap row. |
| Tablet (768px) | Option grids: 3-column. Q-card groups: 3-column. All other components unchanged. |
| Mobile (<=480px) | Toggle cards: full-width stacked. Option grids: 2-column. Q-card groups: single-column stack. Chip toggles: wrap to fill width. Range sliders: full width with adequate thumb spacing. |

**Stepper with 9 steps — responsive concern:**

The stepper now has 9 circles (was 8). At narrow widths, the stepper may overflow.

| Width | Stepper Behavior |
|---|---|
| Desktop (>=1024px) | All 9 circles visible with labels. Circle spacing ~80px between centers. Fits comfortably within 800px max-width. |
| Tablet (768px) | All 9 circles visible. Labels visible. Spacing tighter (~65px between centers). Still fits within viewport. |
| Small tablet (640px) | Labels hidden except active step (existing behavior). 9 circles at ~55px spacing. Fits within viewport. |
| Mobile (<=480px) | Labels hidden except active step (existing behavior). 9 circles at ~45px spacing. Circle size maintained at 28px. Minimum viable spacing achieved. At 320px viewports, the stepper may be tight but functional — the existing `overflow-x: auto` on `.stepper` allows horizontal scroll if needed. |

**Mitigation for narrow viewports:** The existing stepper CSS already uses flexible spacing with `justify-content: space-between` within a fixed-width container. Adding one circle (from 8 to 9) reduces inter-circle spacing by ~12% which is within tolerance. The existing label-hiding behavior at mobile widths ensures the stepper remains legible. No new CSS rules required.

## 8. Accessibility

**ARIA for new Step 2:**
- Step panel: `<section class="step" data-step="2" role="tabpanel">` (consistent with all other steps)
- Stepper circle: `<div class="stepper__step" data-step="2" role="tab" aria-selected="false">` — `aria-selected="true"` when active
- On step entry: focus programmatically moved to `.step__title` (existing pattern via `tabindex="-1"`)

**Tab order within Step 2:**
1. Step title (receives focus on entry)
2. Hotel toggle "No" card (tabindex="0")
3. Hotel toggle "Yes" card (tabindex="0")
4. (If hotel expanded) Hotel sub-question cards/chips/sliders in DOM order
5. Car toggle "No" card (tabindex="0")
6. Car toggle "Yes" card (tabindex="0")
7. (If car expanded) Car sub-question cards/chips/sliders in DOM order
8. Back button
9. Continue button

**Keyboard interactions (all existing):**
- Enter/Space on toggle cards: select and trigger expand/collapse
- Tab through all focusable elements in DOM order
- Arrow keys on range sliders: adjust value by step increment
- Enter/Space on chip toggles: toggle selection

**Screen reader announcements:**
- Step title announced on focus: "Plan Your Stay & Travel"
- Toggle cards: role="button" with visible label, announces selected state
- Collapsible sections: the expand/collapse transition is conveyed through DOM visibility changes. The `.assistance-section__body` content becomes focusable only when expanded.

**Contrast:** All components inherit existing design system colors which meet WCAG 2.1 AA contrast ratios.

**Touch targets:** All interactive elements (q-cards, chip toggles, range slider handles, buttons) already meet the 44x44px minimum.

## 9. RTL Support

All RTL behavior is inherited from existing component CSS. No new RTL rules are needed.

| Element | LTR | RTL |
|---|---|---|
| Step title accent bar | `border-left: 4px solid` | `border-right: 4px solid` (existing `.rtl` rule) |
| Stepper line fill direction | Left to right | Right to left (existing `.rtl` rule) |
| Option grid layout | Standard grid flow (LTR) | Grid flow reverses (existing `dir="rtl"` on `<html>`) |
| Range slider track | Left = min, Right = max | Right = min, Left = max (existing slider RTL logic) |
| Chip toggle text | Left-aligned | Right-aligned (existing `text-align: start`) |
| Back/Continue buttons | Back on left, Continue on right | Back on right, Continue on left (existing `.btn-bar` RTL rules) |

The hotel and car sections use the same RTL-aware patterns as their current Step 6 implementation. Relocating them to Step 2 does not change their RTL behavior.

## 10. Dark Mode

All dark mode behavior is inherited from existing CSS custom properties. No new dark mode overrides are needed.

| Element | Light Mode | Dark Mode |
|---|---|---|
| Step 2 panel background | `var(--color-bg)` = #F8F7F4 | `var(--color-bg)` dark override |
| Assistance section border | `var(--color-border)` | `var(--color-border)` dark override |
| Q-card background | `var(--color-surface)` = #FFFFFF | `var(--color-surface)` dark override |
| Q-card selected | Brand-primary border + tinted bg | Same with dark palette variables |
| Chip toggle default | `var(--color-border)` border | Dark border override |
| Chip toggle selected | Brand-primary bg, white text | Same (brand-primary is unchanged) |
| Range slider track | `var(--color-border-strong)` bg | Dark border-strong override |
| Range slider fill | Brand-primary bg | Same |
| Range slider handle | Surface bg, brand-primary border | Dark surface override |

All components reference CSS custom properties that have dark mode overrides defined in the existing `@media (prefers-color-scheme: dark)` block. No new rules required.

## 11. Design Consistency Check

| Pattern | Existing/New | Reference |
|---|---|---|
| Step panel (title + desc + content + btn-bar) | Existing | All steps (0-7) follow this pattern |
| Stepper circle (emoji + label + states) | Existing | 8 existing stepper entries |
| Assistance section (border-top separator + header + toggle + collapsible body) | Existing | Current Step 6 hotel/car sections |
| Toggle card (2-option q-card, Yes/No) | Existing | Wheelchair (Step 6), Hotel toggle, Car toggle |
| Option grid (4-col responsive card grid) | Existing | hotelType (12), carCategory (14) |
| Q-card (single-select card with icon/title/desc) | Existing | All questionnaire questions, hotel/car sub-questions |
| Chip toggle (pill-shaped multi-select) | Existing | hotelAmenities (12), carExtras (7) |
| Range slider (dual-handle budget) | Existing | hotelBudget, carBudget |
| Depth-extra-question container | Existing | Photography, Accessibility, Wheelchair, all hotel/car sub-questions |

**New patterns introduced:** None. This change exclusively reuses existing patterns.

**Visual consistency verification:**
- Step 2 uses the same `.step__title` + `.step__desc` as all other steps
- The stepper circle follows the same 28px / emoji / label pattern
- Hotel and car sections are moved as-is with no visual changes
- The step follows the "Data & Questions phase" visual style (form-based, no card grids), consistent with Steps 0 and 1

## 12. BRD Coverage Matrix

| Requirement | UX Addressed? | Section |
|---|---|---|
| REQ-001: Create New Step 2 | Yes | §4.1, §5.1, §5.2 |
| REQ-002: Relocate Hotel Assistance | Yes | §3, §4.1 |
| REQ-003: Relocate Car Rental Assistance | Yes | §3, §4.1 |
| REQ-004: Renumber All Subsequent Steps | Yes | §2 (flow diagram shows all 9 steps with new numbering) |
| REQ-005: Update Stepper Navigation to 9 Steps | Yes | §5.1, §7 (stepper responsive analysis) |
| REQ-006: Remove Hotel & Car from Step 7 | Yes | §4.2 |
| REQ-007: Preserve Markdown Output Format | N/A | No UX impact — backend/output logic only |
| REQ-008: Navigation Continuity | Yes | §2, §6 (depth overlay sequencing, back/forward flow) |
| REQ-009: Sub-step Auto-advance in Step 3 | Yes | §2 (flow shows Step 3 as questionnaire) |
| REQ-010: Selection Reset Rule Update | N/A | Logic-only, no UX impact |
| REQ-011: Update Rule Files | N/A | Documentation-only, no UX impact |
| REQ-012: Automation Test Updates | N/A | Test-only, no UX impact |

## 13. Approval Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| Product Manager | Product Manager | 2026-03-29 | Approved |
| Dev Team Lead | Dev Team Lead | 2026-03-29 | Approved |
| UX/UI Principal Engineer | UX/UI Principal Engineer | 2026-03-29 | Self-approved |

**Conditions:** None. This is a pure relocation with no new components, no new interaction patterns, and no visual changes to the relocated content. All existing responsive, RTL, dark mode, and accessibility patterns apply without modification.
