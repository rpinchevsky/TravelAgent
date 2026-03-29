# UX Design Document

**Change:** Hotel/Car Multi-Select and Step Reorder
**Date:** 2026-03-29
**Author:** UX/UI Principal Engineer
**BRD Reference:** `technical_documents/2026-03-29_hotel-car-multiselect-reorder/business_requirements.md`
**Status:** Draft

---

## 1. Overview

This change addresses two user experience gaps in the trip intake wizard:

1. **Multi-select for accommodation and car types.** Travelers frequently need multiple accommodation types (e.g., hotel for city nights + Airbnb for countryside) and multiple car categories (e.g., compact for daily use + minivan for group outings). The current single-select radio behavior forces an artificial either-or choice. Converting hotelType (H1) and carCategory (C1) to multi-select toggle behavior removes this constraint while keeping all other sub-questions (H2-H7, C2-C6) in single-select mode.

2. **Step reorder for informed depth selection.** Users currently choose their question depth (10-30 questions) before answering hotel/car logistics. By moving Step 2 (Plan Your Stay & Travel) before the depth overlay, users provide their stay/travel context first, making the depth decision more informed.

**Design goal:** Introduce multi-select behavior on exactly two option grids (hotelType, carCategory) with minimal visual deviation from the existing q-card pattern. The user must immediately understand that these two grids allow multiple selections while all other q-card groups remain single-select. The step reorder must be invisible to users who have no prior expectations — the flow should feel natural.

## 2. User Flow

### Current Flow (Before)
```
Step 0 (Where & When)
  -> Step 1 (Who's Traveling)
    -> [Depth Overlay]
      -> Step 2 (Hotel/Car)
        -> Step 3 (Questionnaire)
          -> Steps 4-8
```

### New Flow (After)
```
Step 0 (Where & When)
  -> Step 1 (Who's Traveling)
    -> Step 2 (Hotel/Car)          <-- moved before depth
      -> [Depth Overlay]           <-- now triggers after Step 2
        -> Step 3 (Questionnaire)
          -> Steps 4-8
```

### Multi-Select User Journey (hotelType / carCategory)

1. User expands hotel assistance (toggle "Yes").
2. Accommodation Type grid appears (12 cards, 4-column on desktop).
3. User taps "Hotel" — card enters selected state (blue border, tinted bg, checkmark badge).
4. User taps "Airbnb" — card enters selected state independently. "Hotel" remains selected.
5. User taps "Hotel" again — card deselects (toggle off). "Airbnb" remains selected.
6. User can select 0 to 12 types simultaneously. No maximum limit.
7. Same toggle behavior applies to Car Category (14 cards).

### Step Reorder Navigation Chain

| Action | Result |
|---|---|
| Complete Step 1, click Continue | Navigate to Step 2 (hotel/car). No overlay. |
| Complete Step 2, click Continue | Open depth selector overlay. |
| Confirm depth in overlay | Navigate to Step 3 (or first active step after Step 2). |
| Back from Step 3 | Return to Step 2. |
| Back from Step 2 | Return to Step 1. |
| Depth pill re-entry (from any step) | Open depth overlay; `stepBeforeOverlay` tracks current step. Confirm returns to that step. |

## 3. Placement & Navigation

| Element | Location | Rationale |
|---|---|---|
| Multi-select option grids | Step 2, within hotel and car assistance sections (unchanged DOM position) | No relocation needed — only behavior changes from radio to toggle |
| Depth overlay trigger | Step 2 Continue button (was: Step 1 Continue) | Users now provide stay/travel context before choosing depth |
| `stepBeforeOverlay` | Tracks Step 2 on initial trigger (was: Step 1) | Ensures correct return point on overlay dismiss |
| Multi-select hint text | Below each option-grid label (new element) | Communicates multi-select affordance |

## 4. Layout & Wireframes

### 4.1 Multi-Select Option Grid (hotelType / carCategory)

The option grid layout remains unchanged. The only visual additions are a hint label and per-card checkmark badges.

**Desktop (>=1024px):**
```
+-- Accommodation Type -----------------------------------------+
|  Select one or more                                           |  <-- NEW hint text
|                                                               |
|  [x Hotel]   [x Boutique]   [ Resort]   [ Apartment]         |  4-column grid
|  [ Apart-H]  [ Villa]       [x B&B]     [ Hostel]            |  x = selected (with checkmark)
|  [ Farmhse]  [ Cabin]       [ Glamping] [ Houseboat]         |
+---------------------------------------------------------------+
```

**Mobile (<=480px):**
```
+-- Accommodation Type -----------+
|  Select one or more             |
|                                 |
|  [x Hotel]     [x Boutique]    |  2-column grid
|  [ Resort]     [ Apartment]    |
|  [ Apart-H]    [ Villa]        |
|  [x B&B]       [ Hostel]       |
|  [ Farmhse]    [ Cabin]        |
|  [ Glamping]   [ Houseboat]    |
+---------------------------------+
```

### 4.2 Step Flow After Reorder

The stepper shows the same step sequence as before (Step 0, 1, 2, 3, 4...). The depth overlay is not represented in the stepper — it remains a modal interstitial. The only change is **when** the overlay appears relative to the steps.

## 5. Component Specifications

### 5.1 Multi-Select Hint Label (NEW)

A subtle instructional label placed between the field label and the option grid, communicating that multiple selections are allowed.

**Visual:**
- Font size: `var(--text-xs)` (same scale as `.chip-section__desc`)
- Font weight: `var(--font-weight-normal)` (400)
- Color: `var(--color-text-muted)`
- Margin: `margin-top: -var(--space-1); margin-bottom: var(--space-2)` (tucks close under the field label)
- CSS class: `.option-grid__hint`

**Content (i18n):**
- i18n key: `s6_multiselect_hint`
- English: "Select one or more"
- Appears only on the hotelType and carCategory option-grids

**States:**
- Default: visible whenever the parent assistance section is expanded
- Hidden: when assistance toggle is "No" (inherits parent collapse)

### 5.2 Multi-Select Checkmark Badge (NEW)

A small checkmark indicator on each selected card within multi-select option grids. Provides clear visual feedback that a card is selected, especially important when multiple cards are selected simultaneously.

**Visual:**
- Size: 20px circle
- Position: `absolute; top: 6px; right: 6px` (inside the q-card, which needs `position: relative`)
- Background: `var(--color-brand-primary)`
- Icon: white checkmark (CSS `::after` content: "\2713", font-size 12px, font-weight 700)
- Border-radius: 50%
- Box-shadow: `0 1px 3px rgba(0,0,0,0.15)`
- CSS class: `.option-grid__check`

**Animation:**
- On select: scale from 0 to 1 with spring easing (`transform: scale(0)` -> `scale(1)`, 0.25s cubic-bezier(0.34, 1.56, 0.64, 1))
- On deselect: scale from 1 to 0 (0.15s ease-out)

**Implementation approach:**
- The badge is rendered via CSS pseudo-element (`::after`) on `.option-grid .q-card.is-selected`
- No additional DOM elements needed — purely CSS-driven
- Matches the pattern used by interest cards (22px check badge with spring easing), adapted to the smaller option-grid card size (20px)

**States:**
- Hidden: when card is not `.is-selected` (`transform: scale(0)`)
- Visible: when card has `.is-selected` class (`transform: scale(1)`)

### 5.3 Option Grid Q-Card (MODIFIED — multi-select behavior)

The existing `.option-grid .q-card` component is modified for hotelType and carCategory containers only. All visual properties remain identical. Only the click behavior and ARIA attributes change.

**Visual (unchanged):**
- Dimensions: min-height 100px, compact padding
- Colors: same `.is-selected` styles (brand-primary border, tinted bg, outer glow)
- Typography: icon 1.5rem, title `var(--text-xs)`
- Border radius: `var(--radius-interactive)`

**States:**
- **Default:** Surface bg, standard border, no checkmark badge
- **Hover:** accent-alt border, translateY(-2px), shadow-md (unchanged)
- **Selected (single):** brand-primary border, tinted bg, outer glow, checkmark badge visible
- **Selected (multiple):** Same as single-selected — each card shows its own independent selected state. No visual difference between "1 of N selected" and "only one selected."
- **Focus:** focus-visible outline (2px brand-primary offset 2px) — unchanged

**Behavior:**
- **Click/tap:** Toggle `.is-selected` on the clicked card. Do NOT clear sibling selections. (This is the key change from radio to toggle.)
- **Keyboard:** Enter/Space toggles selection on focused card. Tab moves between cards. Arrow keys move focus within the grid.

### 5.4 Depth Overlay Trigger Point (MODIFIED)

**Before:** Step 1 Continue click -> validate Step 1 -> open depth overlay.
**After:** Step 2 Continue click -> open depth overlay (Step 2 has no validation gate).

The overlay itself is visually unchanged. Only the trigger hook and `stepBeforeOverlay` tracking change.

**Focus management update:**
- On overlay open (initial): focus moves to pre-selected depth card (unchanged behavior)
- On overlay confirm (initial): navigate to Step 3 / first active step after Step 2 (was: first active step after Step 1)
- On overlay escape (initial): focus returns to Step 2 Continue button (was: Step 1 Continue button)
- On overlay confirm (re-entry): return to `stepBeforeOverlay` step (unchanged behavior)

## 6. Interaction Patterns

| Interaction | Trigger | Behavior | Duration |
|---|---|---|---|
| Multi-select toggle on | Click/tap unselected card in `.option-grid[data-multi-select]` | Add `.is-selected`, show checkmark badge (scale in) | 0.25s spring |
| Multi-select toggle off | Click/tap selected card in `.option-grid[data-multi-select]` | Remove `.is-selected`, hide checkmark badge (scale out) | 0.15s ease-out |
| Assistance section expand | Toggle "Yes" click | Slide open body (unchanged) | 0.4s ease |
| Assistance section collapse + reset | Toggle "No" click | Remove `.is-selected` from ALL cards in body (handles multi-select), collapse body | 0.3s ease |
| Depth overlay open | Step 2 Continue click (was: Step 1) | Show overlay with backdrop | Existing animation |
| Step 2 -> Step 1 back | Back button on Step 2 | Navigate to Step 1 (unchanged, but now no overlay in between) | Existing transition |

**No auto-advance:** Multi-select option grids must NOT trigger auto-advance. The 400ms auto-advance timer in the q-card click handler only applies to Step 3 questionnaire slides. Option grids in Step 2 are inside `.depth-extra-question` containers (not `.question-slide`), and the auto-advance code is already gated by `currentStep === 3`. No change needed here.

**Scoping the multi-select behavior:** The global q-card click handler (line ~4951) currently applies radio behavior to all `.depth-extra-question` containers. For multi-select, the handler must check whether the clicked card is inside an `.option-grid` that has a `data-multi-select` attribute. If yes, toggle only the clicked card. If no, apply existing radio behavior (clear siblings, select clicked).

**Data attribute for multi-select identification:**
- Add `data-multi-select` attribute to the `.option-grid` containers for hotelType and carCategory only
- This scopes the toggle behavior precisely, avoiding accidental multi-select on other q-card groups (hotelLocation, hotelStars, carTransmission, etc.)

## 7. Responsive Behavior

| Breakpoint | Layout Change |
|---|---|
| Desktop (>=1024px) | Option grid: 4-column. Hint text: inline below label. Checkmark badge: top-right 6px inset. |
| Tablet (<=768px) | Option grid: 3-column. No layout change for hint or badge. |
| Mobile (<=480px) | Option grid: 2-column. Hint text wraps naturally. Checkmark badge unchanged (cards are still large enough). Touch targets remain >=44x44px (option-grid cards are min-height 100px). |

All breakpoints already defined in the existing `.option-grid` CSS. No new breakpoint rules needed.

## 8. Accessibility

### ARIA Attributes for Multi-Select Cards

**Current (single-select):** Cards use `role="button"` which implies toggle or action. For radio behavior, this works but is semantically imprecise.

**New (multi-select option grids):**
- Container: Add `role="group"` and `aria-label="{field label text}"` (e.g., "Accommodation Type") to the `.option-grid[data-multi-select]` element
- Each card: Change from `role="button"` to `role="option"` (ARIA Listbox pattern is not ideal here since these are visual cards, not a list)

**Recommended approach:** Keep `role="button"` on cards but add `aria-pressed` attribute (same pattern as `.chip-toggle`):
- Unselected: `aria-pressed="false"`
- Selected: `aria-pressed="true"`
- This is consistent with the existing chip-toggle multi-select pattern in the same Step 2 (amenities H4, equipment C5)
- Screen readers will announce: "Hotel, toggle button, not pressed" / "Hotel, toggle button, pressed"

**Single-select q-cards (unchanged):** Continue using `role="button"` without `aria-pressed`. The radio behavior is communicated by the visual state (one selected at a time).

### Keyboard Navigation

- **Tab:** Moves focus between cards in the grid (standard tab order, left-to-right, top-to-bottom)
- **Enter / Space:** Toggles selection on the focused card (add/remove `.is-selected`)
- **Arrow keys:** Not required for option grids (cards are independent toggles, not a radio group). Standard tab order is sufficient.

### Screen Reader Announcements

- Hint text ("Select one or more") is visible and read naturally as the user reaches the section
- Each card announces its name and pressed state: "Hotel, toggle button, pressed"
- No live region needed — the visual checkmark badge is decorative (the `aria-pressed` state carries the semantics)

### Contrast Requirements

- Checkmark badge: white (#FFFFFF) on brand-primary (#1A3C5E) = contrast ratio ~9.5:1 (exceeds WCAG AAA)
- Selected card border + outer glow: brand-primary on surface — already validated in existing design system
- Hint text: muted color on surface — same as `.chip-section__desc`, already WCAG AA compliant

### Touch Targets

- Option grid cards: min-height 100px, full grid-cell width — exceeds 44x44px minimum
- No change to touch target sizing

## 9. RTL Support

| Element | LTR | RTL |
|---|---|---|
| Option grid direction | Left-to-right flow (CSS Grid auto) | Right-to-left flow (inherits `dir="rtl"`) |
| Checkmark badge position | `top: 6px; right: 6px` | `top: 6px; left: 6px` — use `inset-inline-end: 6px` for automatic flip |
| Hint text alignment | `text-align: start` (left) | `text-align: start` (right) — natural alignment |
| Stepper direction | Already handles RTL | No change needed for step reorder |
| Depth overlay | Already handles RTL | No change needed |

**Implementation note:** Use CSS logical properties (`inset-inline-end` instead of `right`) for the checkmark badge position to get automatic RTL support without additional CSS rules.

## 10. Dark Mode

| Element | Light Mode | Dark Mode |
|---|---|---|
| Option grid card (selected) bg | `rgba(26,60,94,0.05)` | `rgba(26,60,94,0.3)` (existing override) |
| Checkmark badge bg | `var(--color-brand-primary)` (#1A3C5E) | Same — brand-primary is consistent across modes |
| Checkmark icon | white (#FFFFFF) | white (#FFFFFF) — sufficient contrast on #1A3C5E in both modes |
| Hint text | `var(--color-text-muted)` | Inherits dark mode muted color (already handled by design system tokens) |
| Selected card border + glow | `var(--color-brand-primary)` | Same — brand-primary visible on dark surfaces |

No new dark mode overrides needed. All new elements use design system tokens that already have dark mode variants.

## 11. Design Consistency Check

| Pattern | Existing/New | Reference |
|---|---|---|
| Option grid layout (4/3/2 column responsive) | Existing | hotelType (12 cards), carCategory (14 cards) in Step 2 |
| `.q-card.is-selected` visual state | Existing | All q-card groups throughout Steps 2, 3, 7 |
| Toggle (multi-select) click behavior | Existing | `.chip-toggle` in amenities (H4) and equipment (C5) |
| `aria-pressed` for toggle buttons | Existing | `.chip-toggle` pattern |
| Checkmark badge on selection | Existing | Interest cards (22px circle, accent bg, spring scale) |
| `data-multi-select` attribute for behavioral scoping | **New** | Introduced to distinguish multi-select grids from radio grids |
| `.option-grid__hint` label | **New** | Small instructional text below field label, follows `.chip-section__desc` visual pattern |
| `.option-grid__check` pseudo-element badge | **New** | Adapts interest card checkmark pattern to smaller option-grid cards |

**New patterns introduced: 2** (hint label + checkmark badge). Both are adaptations of existing patterns — no novel design elements.

**Single-select grids remain untouched:** hotelLocation (5), hotelStars (4), hotelPets (2), hotelCancellation (3), carTransmission (3), carFuel (5), carPickup (4), wheelchairAccessible (2), and all Step 3 questionnaire q-cards retain radio behavior. The `data-multi-select` attribute on the `.option-grid` container is the discriminator.

## 12. BRD Coverage Matrix

| Requirement | UX Addressed? | Section |
|---|---|---|
| REQ-001: Accommodation Type (H1) Multi-Select | Yes | S5.3 (modified q-card behavior), S5.1 (hint), S5.2 (checkmark badge), S6 (toggle interaction), S8 (ARIA) |
| REQ-002: Car Category (C1) Multi-Select | Yes | S5.3, S5.1, S5.2, S6, S8 — same patterns as REQ-001 |
| REQ-003: Markdown Output for Multi-Select Fields | N/A (backend logic) | No UX component — `generateMarkdown()` code change only |
| REQ-004: Step Reorder — Hotel/Car Before Depth Selector | Yes | S2 (user flow), S3 (placement), S5.4 (trigger point), S6 (interaction table) |
| REQ-005: Reset Behavior Preservation for Multi-Select | Yes | S6 (collapse + reset interaction) — existing reset logic already clears all `.is-selected` in body, which works for multi-select |

## 13. Approval Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| Product Manager | | | Pending |
| Dev Team Lead | | | Pending |
| UX/UI Principal Engineer | UX/UI Principal Engineer | 2026-03-29 | Self-approved |

**Conditions:**
- [ ] Dev team confirms `data-multi-select` attribute approach is feasible within the existing click delegation handler
- [ ] PM confirms "Select one or more" hint text wording (i18n key `s6_multiselect_hint`)
