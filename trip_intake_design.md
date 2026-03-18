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
- **Max width:** 720px, centered
- **Responsive:** Grid rows collapse to single column at 480px breakpoint

## Step Layouts

### Step 0 — Where & When (Card-Based Layout)
Three visual cards (`.step0-card`), each with:
- Icon header (`.step0-card__icon`) — 44x44px, gradient background, rounded
- Label + sublabel text
- Bottom border separator

**Destination Card:** Globe icon, teal accent (`rgba(46,125,154,0.15)`). Uses `.step0-dest-input` — larger text (text-lg), raised surface bg, 2px border, container radius, focus glow with accent-alt color.

**Travel Dates Card:** Calendar icon, gold accent (`rgba(201,151,43,0.15)`). Standard 2-column grid for arrival/departure.

**Schedule Preferences Card:** Clock icon, green accent (`rgba(45,125,58,0.12)`). Collapsible via `.step0-schedule-toggle` button — body hidden by default (`max-height: 0`), expands on click with transition. Arrow rotates when open.

### Step 1 — Travelers (Airbnb-style Counters)
- Guest counter bar (`.guest-counter`) — flex row, surface bg, shadow-sm, rounded
- +/− buttons (`.guest-counter__btn`) — 36px circle, border, hover → brand-primary
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
- Schedule toggle: max-height 0.3s ease, arrow rotation
- Card interactions: hover translateY(-2px), active scale(0.97)
- Check/X badges: scale(0.5) → scale(1) with spring easing (cubic-bezier 0.34, 1.56, 0.64, 1)
