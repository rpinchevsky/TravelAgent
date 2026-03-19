# Trip Intake Page — Design Specification

## Design System

The page uses the **same design tokens** as the trip rendering system (`rendering_style_config.css`). Tokens are embedded inline (no external CSS dependency) to keep the file self-contained.

### Required Tokens (must match `rendering_style_config.css`)
- **Spacing:** 8px base scale (4, 8, 16, 24, 32, 48, 64px)
- **Radius:** 12px containers, 6px interactive elements
- **Typography:** Inter font, weights 400/500/600/700, line-height 1.5 body / 1.2 headings
- **Colors:** Brand primary `#1A3C5E`, accent `#C9972B`, accent-alt `#2E7D9A`, bg `#F8F7F4`, surface `#FFFFFF`
- **Dark mode:** Supported via `prefers-color-scheme: dark` media query with dark palette overrides
- **Shadows:** sm/md/lg scale matching the trip rendering system

### Layout
- **Max width:** 960px search bar, 800px page content, centered
- **Responsive:** Search bar stacks vertically at 640px breakpoint; grid rows collapse to single column at 480px

## Search Bar (Booking.com Style)

A single horizontal bar (`.search-bar`) overlapping the hero bottom, containing three segments + action button. Wraps in `.search-bar-wrap` with negative top margin to overlap the hero.

### Bar Layout
- **Border:** 3px solid accent gold, radius-container, shadow-lg
- **Surface bg**, segments separated by 1px border-right
- Each segment (`.search-bar__seg`) is a flex row: icon + content (label + value/input)
- **Responsive:** Stacks vertically at ≤ 640px with border-bottom separators instead

### Destination Segment (`.search-bar__seg--dest`)
- Pin icon, flex 1.3
- Contains the destination text input (`.search-bar__input`) with autocomplete dropdown
- Autocomplete dropdown (`.autocomplete-list`) appears below at z-index 300

### Dates Segment (`.search-bar__seg--dates`)
- Calendar icon, shows selected range text or placeholder
- Click opens **Calendar Dropdown** (`.search-bar__dropdown--dates`) — positioned absolute below, min-width 580px
- Calendar dropdown contains the full Date Range Picker component (see below)
- On date selection, the segment display updates to "DD MMM — DD MMM (Nn)"

### Travelers Segment (`.search-bar__seg--travelers`)
- People icon, shows "N adults · N children"
- Click opens **Travelers Dropdown** (`.search-bar__dropdown--travelers`) — positioned right-aligned, min-width 320px
- Contains two counter rows (`.sb-counter`) for Adults (18+) and Children (0-17)
- +/− buttons (`.sb-counter__btn`) — 32px circle, same style as guest counter
- "Done" button closes dropdown
- Counter changes sync bidirectionally with Step 1 traveler cards

### Action Button (`.search-bar__btn`)
- Brand-primary bg, white text, right-aligned in bar
- Validates destination + dates before proceeding
- Error shown below bar (`.search-bar__error`)

### Dropdowns
- Animate in with `sbDropIn` keyframe (fade + translateY)
- Close on outside click
- Clicks inside don't propagate

## Step Layouts

### Step 0 — Schedule Preferences
Single card with daily schedule fields (start time, end time, buffer) — always visible, not collapsible. Uses `.step0-card` styling.

### Step 1 — Traveler Details
- Guest counter bar (`.guest-counter`) — flex row, surface bg, shadow-sm, rounded
- +/− buttons (`.guest-counter__btn`) — 36px circle, border, hover → brand-primary
- Counter syncs bidirectionally with search bar traveler segment
- Traveler cards (`.traveler-card`) — surface card, border, shadow-sm, radius-container
- Header: uppercase type label (accent-alt) + optional remove button
- Fields inside use row grid (`.row--3` for parents, `.row--2` for children)
- Validation error: `.card-error` adds red border, `.select-error` on DOB year dropdown

### Step 2 — Travel Style Questionnaire (One-at-a-Time)
- Sub-step dots (`.sub-dots`) — 10px circles, centered, active = brand-primary scaled 1.2x, done = accent gold
- Question slides — slide in/out with `slideInLeft`/`slideInRight` animations (0.35s ease)
- Question cards (`.q-card`) — 3-column grid (stacks on mobile), min-height 200px, centered content
  - Icon: 2.5rem emoji
  - Title: text-base, semibold
  - Description: text-sm, muted
  - Selected: brand-primary border + tinted bg + outer glow
  - Auto-advance after 400ms delay

### Steps 4 & 5 — Mini-Quizzes
Same visual pattern as Step 2 questionnaire. Quiz section collapses (`max-height` + `opacity` transition) after last question answered. Reappears when navigating back.

## UI Components

### Chip Selector
- Pill-shaped toggle buttons (border-radius 999px)
- States: default (border only), hover (raised surface), selected (brand-primary bg, inverse text)
- Click toggles selection on/off

### Date Range Picker (Booking.com Style)
Dual-month calendar for selecting check-in / check-out date range. Lives inside the Dates dropdown (`.search-bar__dropdown--dates`).

**Layout (`.date-picker`)**
- Two month grids side-by-side (`.date-picker__month`), separated by 24px gap
- Stacks vertically on ≤ 480px breakpoint (single month visible, swipe-navigable)
- Surface bg, radius-container, shadow-sm

**Month Header (`.date-picker__header`)**
- Centered month + year label — text-base, weight 700
- Left/right chevron buttons (`.date-picker__nav`) — 32px circle, border, hover → brand-primary bg + inverse icon
- Left chevron only on first month, right chevron only on second month

**Day Grid (`.date-picker__grid`)**
- 7-column CSS grid, gap 2px
- **Day-of-week headers:** Su–Sa row, text-xs, weight 600, muted color, uppercase
- **Day cells (`.date-picker__day`):** 40px × 40px, centered text, text-sm, weight 500, cursor pointer
  - **Default:** transparent bg, hover → surface-raised bg + radius 50%
  - **Today:** accent-alt text, weight 700, subtle ring (`box-shadow: inset 0 0 0 1.5px var(--accent-alt)`)
  - **Disabled (past dates):** opacity 0.3, pointer-events none
  - **Start date selected:** brand-primary bg, white text, border-radius 50% on left, 0 on right
  - **End date selected:** brand-primary bg, white text, border-radius 0 on left, 50% on right
  - **In-range:** brand-primary at 0.1 opacity bg, no border-radius (continuous band)
  - **Start = End (single day):** brand-primary bg, white text, full 50% border-radius
  - **Hover while selecting end date:** light brand-primary tint preview on range between start and hovered day

**Selection Behavior**
- First click sets check-in (start), second click sets check-out (end)
- If end < start, swap them
- Clicking again after both are set restarts selection (new start)
- Selected range label displayed below calendar: "Check-in: DD MMM → Check-out: DD MMM (N nights)" — text-sm, weight 500, muted

**Flexible Dates Bar (`.date-picker__flex`)**
- Horizontal row below the calendar grids, centered
- Pill-shaped buttons (border-radius 999px, padding 6px 16px): "Exact dates", "± 1 day", "± 2 days", "± 3 days", "± 7 days"
- States: default (border, surface bg), selected (brand-primary bg, inverse text)
- Default selection: "Exact dates"
- Selecting a ± option stores the flexibility value alongside the chosen dates

**Responsive**
- ≥ 481px: two months side-by-side
- ≤ 480px: single month with swipe/nav arrows, month header shows nav on both sides

### Interest Cards
- 2-column grid (3 on ≥640px)
- Gradient backgrounds (8 variants via `data-gradient` attribute, 0.08 opacity, 0.15 when selected)
- Check badge: 22px circle, accent bg, scales in with spring easing on select
- Hover: translateY(-2px) + shadow-md
- Active: scale(0.97)
- Selected: accent border + outer glow

### Avoid Cards
- 2-column grid (3 on ≥640px)
- Compact: flex row with icon (32px rounded square, error-tinted bg) + name
- Selected: error border + error-tinted bg
- X badge: 18px circle, error bg, scales in on select

### Pace Selector
- 3 visual cards in a grid (stacks on mobile)
- Full gradient backgrounds (relaxed = purple, balanced = teal-navy, packed = pink)
- White text, bold titles, 2.5rem emoji icons
- Check badge: 24px circle, accent bg
- Selected: accent border + outer glow + shadow-lg

### Traveler Card
- Surface card with border, shadow-sm, radius-container
- Header: type label (uppercase, accent-alt color) + optional remove button
- Fields inside use the standard row grid

### Progress Stepper
- Horizontal row of step circles (28px) with connecting line
- Line fill animates with step progress (accent gold)
- Circle states:
  - Pending: border-strong, muted text
  - Active: brand-primary bg, white text, outer glow (4px rgba)
  - Done: accent bg, white checkmark
- Labels: 10px semibold, hidden on mobile except active step
- Emoji icons per step, replaced with checkmark when done

### Preview Box (Code Editor Style)
- Dark theme container (`#1a1a2e` bg)
- Tab-style header with `#252545` bg, active tab with accent underline
- Copy button in header (ghost style, success state on copy)
- Monospace body, syntax-colored: headings blue, bold gold, bullets green, tables purple
- Max-height 500px with scroll

### Buttons
- Primary (`.btn--primary`): brand-primary bg, inverse text
- Secondary (`.btn--secondary`): transparent, border, hover → raised surface
- Accent (`.btn--accent`): gold gradient, dark text, glow shadow
- All: 44px min-height (touch target), scale hover/active, disabled opacity 0.4
- Add button (`.btn-add`): dashed border, accent-alt text, hover → solid border

### Validation States
- Field error: red border + outer glow (`rgba(181,59,59,0.1)`)
- Card error (`.card-error`): red border + outer glow on whole traveler card
- DOB year error (`.select-error`): red border + glow on year dropdown only
- Error messages: text-xs, error color, shown below field or as summary at step top
- Auto-clear: errors dismiss on input/change events

## Animations
- Hero fade-in: 0.8s ease, translateY(12px) → 0, subtitle delayed 0.2s
- Step transitions: slideInRight/slideInLeft 0.35s, triggered by nav direction
- Quiz collapse: max-height + opacity transition 0.3-0.4s ease
- Search bar dropdown: sbDropIn 0.2s ease (fade + translateY(-4px))
- Calendar month transition: slide left/right 0.25s ease when navigating months
- Date range highlight: background color fade-in 0.15s ease on hover preview
- Card interactions: hover translateY(-2px), active scale(0.97)
- Check/X badges: scale(0.5) → scale(1) with spring easing (cubic-bezier 0.34, 1.56, 0.64, 1)
