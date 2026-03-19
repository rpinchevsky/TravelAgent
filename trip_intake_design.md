# Trip Intake Page — Design Specification

## Internationalization (i18n)

The page supports **12 languages** with a language selector on the hero section. All static UI text is translatable via `data-i18n` attributes.

### Supported Languages
| Code | Language | Direction |
|---|---|---|
| `en` | English | LTR |
| `ru` | Russian | LTR |
| `he` | Hebrew | RTL |
| `es` | Spanish | LTR |
| `fr` | French | LTR |
| `de` | German | LTR |
| `it` | Italian | LTR |
| `pt` | Portuguese | LTR |
| `zh` | Chinese (Simplified) | LTR |
| `ja` | Japanese | LTR |
| `ko` | Korean | LTR |
| `ar` | Arabic | RTL |

### Language Selector (`.lang-selector`)
- **Position:** Top-right corner of hero section, `position: absolute; top: 16px; right: 16px`
- Globe icon (🌐) + current language name + dropdown chevron
- Dropdown: surface bg, shadow-lg, radius-interactive, z-index 50
- Each item shows: flag emoji + native language name
- Selected item gets brand-primary bg, inverse text
- On selection: entire page translates instantly (no reload)
- Choice persisted in `localStorage('tripIntakeLang')`
- Default: browser language (`navigator.language`) if supported, else English

### Translation System
- All static text elements have `data-i18n="key"` attribute
- Placeholders use `data-i18n-placeholder="key"`
- `TRANSLATIONS` object contains all strings keyed by language code
- `setLanguage(code)` function:
  1. Iterates all `[data-i18n]` elements and sets `textContent`
  2. Iterates all `[data-i18n-placeholder]` elements and sets `placeholder`
  3. Sets `dir="rtl"` on `<html>` for Hebrew/Arabic, `dir="ltr"` otherwise
  4. Adds `lang` attribute on `<html>`
  5. Updates `localStorage`
  6. Dispatches `languagechange` custom event for dynamic content

### RTL Support
- Hebrew (`he`) and Arabic (`ar`) trigger `dir="rtl"` on `<html>`
- CSS logical properties used where possible (`margin-inline-start` instead of `margin-left`)
- Key RTL overrides (`.rtl` class on `<html>`):
  - Search bar segments: `border-right` → `border-left`
  - Step title accent bar: `border-left` → `border-right`, `padding-left` → `padding-right`
  - Stepper line fill: direction reverses
  - Button arrows: ← / → swap
  - Autocomplete, dropdowns: alignment flips
  - Text alignment: natural (`text-align: start`)

### Dynamic Content
- Interest/avoid card names remain in English (they are data keys, not UI chrome)
- Question card titles and descriptions are translated via `data-i18n`
- Month names and day abbreviations come from the translation dictionary
- The generated markdown output (Step 7) uses the **Report Language** (Step 6), not the UI language

## Platform & Device Requirements

The page **must work on desktop and mobile**, across all major platforms:
- **Desktop:** Windows (Chrome, Edge, Firefox), macOS (Safari, Chrome)
- **Mobile:** iOS (Safari, Chrome), Android (Chrome, Samsung Internet)

**Rules:**
- Every feature must be tested visually at desktop (≥1024px), tablet (768px), and mobile (≤480px) widths
- Touch targets: minimum 44×44px on all interactive elements (buttons, cards, dropdowns, counter buttons)
- No hover-only interactions — every hover effect must have a tap/click equivalent for touch devices
- Bottom sheets replace dropdowns on mobile (≤640px); dropdowns are desktop-only
- CSS must not rely on desktop-only features (e.g., `:hover` as sole interaction trigger) — use `:hover` for enhancement only, never as the only way to reveal content
- Inputs must not trigger unexpected zoom on iOS (minimum `font-size: 16px` on `<input>`, `<select>`, `<textarea>`)
- Use `100dvh` instead of `100vh` where full-viewport height is needed (accounts for mobile browser chrome)
- Scroll behavior must be smooth on iOS (`-webkit-overflow-scrolling: touch` on scrollable containers)
- All features must be usable via keyboard (desktop) and touch (mobile) — no mouse-only patterns
- Test with both light and dark mode on all platforms

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

## Booking.com UX Patterns

### 1. Sticky Compact Search Bar (`.search-bar-wrap.is-sticky`)
When the user scrolls past the hero, the search bar compacts and sticks to the viewport top — keeping destination/dates/travelers always visible, exactly like Booking.com's sticky header.

**Behavior:**
- Triggers when search bar's original position scrolls above viewport (IntersectionObserver)
- Adds `.is-sticky` to `.search-bar-wrap`
- Removes negative margin, pins to `position: fixed; top: 0; left: 0; right: 0`
- Bar height reduces: segment padding shrinks from 12px to 8px
- Labels (`.search-bar__label`) hide — only values shown
- Border-radius flattens to 0 (full-width bar)
- Shadow changes to `shadow-md` (lighter)
- Hero gets a spacer div (`.hero__sticky-spacer`) equal to bar height to prevent content jump
- Smooth transition: height + padding animate 0.25s ease
- z-index: 100 (above everything except modals)

**Responsive (≤ 640px):**
- Sticky bar shows single-line summary: "Budapest · 15 Jun–22 Jun · 2 travelers" with tap to expand
- Full search bar opens as a **bottom sheet** overlay when tapped

### 2. Mobile Bottom Sheets (`.bottom-sheet`)
On mobile (≤ 640px), dropdowns transform into full-screen bottom sheets — the standard mobile pattern Booking.com uses for date picker, travelers, and filters.

**Structure:**
```
.bottom-sheet-overlay  (fixed, inset 0, bg rgba(0,0,0,0.5), z-index 500)
  .bottom-sheet        (fixed, bottom 0, max-height 85vh, surface bg, radius-container top only)
    .bottom-sheet__handle  (centered 36px × 4px pill, muted bg, drag indicator)
    .bottom-sheet__header  (title + close button)
    .bottom-sheet__body    (scrollable content)
    .bottom-sheet__footer  (sticky bottom CTA: "Apply" / "Done")
```

**Behavior:**
- Slides up from bottom with `bottomSheetUp` keyframe (0.3s ease-out)
- Overlay fades in simultaneously (0.2s)
- Close on: overlay tap, close button, swipe down, "Done" button
- Body scrolls independently; sheet itself does not exceed 85vh
- Prevents body scroll while open (`overflow: hidden` on `<body>`)

**Applied to:**
- Date picker → bottom sheet with full calendar, flex dates bar, and "Apply" footer
- Travelers dropdown → bottom sheet with counters and "Done" footer
- Autocomplete → bottom sheet with search input + results list

### 3. Top Progress Bar (`.progress-bar`)
A thin (3px) colored bar fixed to the very top of the viewport, showing overall wizard completion percentage — a subtle but effective progress indicator Booking.com uses throughout their checkout flow.

**Layout:**
- `position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 200`
- Background: `var(--color-border)` (track)
- Fill (`.progress-bar__fill`): `var(--color-brand-accent)` (gold), animates width with `transition: width 0.4s ease`
- When sticky search bar is active, progress bar sits above it

**Calculation:**
- Total steps: 8 (steps 0–7). Each completed step = 12.5%
- Within each step, sub-progress contributes partial fill (e.g., filling 2/3 fields in Step 0 = ~8% total)
- Reaches 100% on Step 7 (Review) — fill color changes to `var(--color-success)` green

### 4. Inline Validation Indicators (`.field--valid`, `.field--error`)
Real-time validation feedback with visual icons, matching Booking.com's pattern of showing green checkmarks and red crosses inside input fields as the user types.

**Valid state (`.field--valid`):**
- Green border: `var(--color-success)`
- Green checkmark icon (✓) appears at right edge of input, 20px from right
- Subtle green glow: `box-shadow: 0 0 0 3px rgba(45,125,58,0.1)`
- Icon fades in with 0.2s ease

**Error state (`.field--error`):**
- Red border: `var(--color-error)`
- Red cross icon (✕) appears at right edge of input
- Error message (`.field__error`) slides down below field (max-height transition)
- Subtle red glow: `box-shadow: 0 0 0 3px rgba(181,59,59,0.1)`

**Validation triggers:**
- On blur: validate required fields, format constraints
- On input (debounced 300ms): validate as user types for immediate feedback
- On step navigation: validate all fields in current step before advancing
- Auto-clear: remove error state on input/change events

**Icon implementation:**
- CSS `::after` pseudo-element on `.field` container
- `content: '✓'` or `content: '✕'`
- Positioned `absolute; right: 12px; top: 50%` within the input area
- Inputs get `padding-right: 40px` when validation state is active

### 5. Selection Summary Strip (`.context-bar`)
A persistent, compact bar below the sticky search bar (or below the stepper on desktop) that shows the user's current selections at a glance — Booking.com does this to maintain context as users go deeper into the flow.

**Layout:**
- Full-width, surface-raised bg, border-bottom 1px, shadow-sm
- Content max-width matches page-shell (800px), centered
- Horizontal flex row of tag-like items, gap 8px, wrapping
- Each item: pill shape (radius 999px), small text (text-xs), semibold
- Item types with distinct colors:
  - Destination: brand-primary bg, inverse text, pin icon prefix
  - Dates: accent bg, dark text, calendar icon prefix
  - Travelers: accent-alt bg, inverse text, people icon prefix
  - Trip style (after Step 2): info bg, icon prefix
- Only visible after Step 0 (once search bar data is confirmed)
- Tapping any pill scrolls back to / opens the relevant section for editing

**Responsive:**
- On mobile, horizontally scrollable (overflow-x: auto, no-wrap)
- Hide on Step 7 (Review) since the full preview is visible

### 6. Toast Notifications (`.toast`)
Non-intrusive, ephemeral feedback messages that appear briefly to confirm actions — Booking.com uses these for "Saved!", "Added to wishlist", etc.

**Layout (`.toast`):**
- `position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%)`
- Surface bg, shadow-lg, radius-container, padding 12px 24px
- Flex row: icon (20px) + message text (text-sm, medium weight)
- z-index: 600 (above everything)
- Max-width: 400px

**Types:**
- **Success** (`.toast--success`): green left-border (3px), green check icon
- **Info** (`.toast--info`): blue left-border, info icon
- **Warning** (`.toast--warning`): amber left-border, warning icon

**Animation:**
- Enter: slide up 12px + fade in (0.3s ease)
- Stay: 2.5s default (configurable)
- Exit: fade out + slide down (0.2s ease)
- Stacking: multiple toasts stack vertically with 8px gap (newest at bottom)

**Usage:**
- "Dates saved" — after selecting date range
- "3 interests selected" — after toggling interest cards
- "Traveler added" — after adding adult/child
- "Copied to clipboard" — after copy button

### 7. Pulse CTA Animation (`.btn--pulse`)
When all required fields in the current step are valid, the primary "Continue" button glows with a subtle pulse animation to draw the user's eye — Booking.com does this on their "Reserve" and "Book now" buttons.

**Animation (`.btn--pulse`):**
- Applies automatically when current step validation passes
- `@keyframes ctaPulse`: alternates `box-shadow` between normal and expanded glow
  - `0%`: `box-shadow: 0 0 0 0 rgba(26,60,94,0.4)`
  - `70%`: `box-shadow: 0 0 0 10px rgba(26,60,94,0)`
  - `100%`: `box-shadow: 0 0 0 0 rgba(26,60,94,0)`
- Duration: 2s, infinite, ease-out
- For accent buttons: uses accent gold rgba instead
- Stops immediately on hover (user is about to click) or when step becomes invalid

### 8. Floating Labels (`.field--float`)
Material Design-inspired floating labels that Booking.com uses on their search inputs — the label sits inside the input as placeholder, then animates up to become a small label on focus or when filled.

**Structure:**
```
.field.field--float
  input.input (placeholder=" ")
  label.field__label--float
```

**States:**
- **Empty + unfocused:** label positioned inside input (left: 12px, top: 50%, text-base, muted color), acts as visual placeholder
- **Focused or filled:** label floats up (top: -8px, left: 8px), shrinks (text-xs), gets a small surface-bg padding (0 4px) to mask the border behind it, color changes to brand-accent
- Transition: `transform 0.2s ease, font-size 0.2s ease, color 0.2s ease`

**Applied to:**
- Destination input in search bar (already has placeholder — enhance to floating label)
- Name fields in traveler cards
- Textarea fields (custom interests, food notes, extra notes)
- NOT applied to: select dropdowns, time inputs, DOB row (these keep standard labels)

### 9. Info Tooltips (`.tooltip`)
Small (i) icon buttons next to complex field labels that reveal explanatory text on hover/tap — Booking.com uses these for "What's included", pricing explanations, etc.

**Layout:**
- Icon: 16px circle, border 1px border-strong, text "i" centered (text-xs, muted color)
- Inline with label text, margin-left 6px, vertical-align middle
- Cursor: help

**Tooltip bubble (`.tooltip__bubble`):**
- Positioned above icon (bottom: calc(100% + 8px)), centered
- Surface bg, shadow-md, radius-interactive, padding 8px 12px
- Text: text-xs, line-height 1.4, max-width 240px
- Arrow: 6px CSS triangle pointing down at icon center
- z-index: 50

**Behavior:**
- Desktop: show on hover (with 150ms delay to prevent flicker), hide on mouse leave
- Mobile: show on tap, hide on tap elsewhere
- Transition: opacity 0.15s + translateY(-2px)

**Applied to:**
- "Buffer (min)" field → "Extra time between activities for walking, rest, or transitions"
- "Day starts at" → "When you'd like to begin sightseeing each day"
- "POI Languages" → "Languages for point-of-interest info cards. Include local language for authentic experience"
- "Flexible dates" → "We'll look for the best options within this range"

### 10. Accessibility & Keyboard Navigation
Booking.com meets WCAG 2.1 AA standards. The intake page follows these patterns:

**Focus management:**
- All interactive elements have visible focus rings: `outline: 2px solid var(--color-brand-accent); outline-offset: 2px`
- Focus ring only on keyboard navigation (`:focus-visible`), not on mouse click
- When changing steps, focus moves to the step title (`tabindex="-1"`, programmatic focus)
- When opening dropdowns/bottom sheets, focus moves to first interactive element inside
- On close, focus returns to the trigger element

**ARIA attributes:**
- Search bar segments: `role="button"`, `aria-expanded`, `aria-controls`
- Dropdowns: `role="dialog"`, `aria-label`
- Calendar: `role="grid"`, days have `aria-label="DD Month YYYY"`, `aria-selected`
- Counter buttons: `aria-label="Add adult"` / `"Remove adult"`
- Step panels: `role="tabpanel"`, stepper circles: `role="tab"`, `aria-selected`
- Progress bar: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
- Toast: `role="status"`, `aria-live="polite"`

**Keyboard patterns:**
- Tab: move between interactive elements
- Enter/Space: activate buttons, select cards
- Escape: close dropdowns, bottom sheets, dismiss toasts
- Arrow keys: navigate calendar days, questionnaire options
- Home/End: jump to first/last day in calendar month

## Animations
- Hero fade-in: 0.8s ease, translateY(12px) → 0, subtitle delayed 0.2s
- Step transitions: slideInRight/slideInLeft 0.35s, triggered by nav direction
- Quiz collapse: max-height + opacity transition 0.3-0.4s ease
- Search bar dropdown: sbDropIn 0.2s ease (fade + translateY(-4px))
- Calendar month transition: slide left/right 0.25s ease when navigating months
- Date range highlight: background color fade-in 0.15s ease on hover preview
- Card interactions: hover translateY(-2px), active scale(0.97)
- Check/X badges: scale(0.5) → scale(1) with spring easing (cubic-bezier 0.34, 1.56, 0.64, 1)
- **Sticky bar:** height + padding 0.25s ease on compact transition
- **Bottom sheet:** slideUp 0.3s ease-out entry, overlay fade 0.2s
- **Progress bar fill:** width 0.4s ease, color change 0.3s on completion
- **Floating labels:** transform + font-size 0.2s ease
- **Toast:** slideUp 0.3s entry, fade 0.2s exit
- **Pulse CTA:** 2s infinite ease-out glow cycle
- **Tooltips:** opacity + translateY 0.15s ease
- **Validation icons:** opacity 0.2s ease fade-in
