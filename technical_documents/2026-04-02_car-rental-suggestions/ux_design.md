# UX Design Document

**Change:** Car Rental Suggestion Mechanism — Rental Company Discovery, Price Comparison & Booking Links
**Date:** 2026-04-02
**Author:** UX/UI Principal Engineer
**BRD Reference:** `technical_documents/2026-04-02_car-rental-suggestions/business_requirements.md`
**Status:** Approved

---

## 1. Overview

Users currently receive a complete trip itinerary with structured accommodation options and booking links, but must independently research car rental companies, compare prices, and locate booking pages. This creates a fragmented experience for what is often the second-largest trip expense.

The goal is to bring car rental to visual and functional parity with accommodation: structured option cards, a price comparison table per requested car category, and one-click booking links — all placed on the anchor day (first day requiring a car) within the generated trip HTML page.

**Key UX principle:** The car rental section reuses the proven accommodation visual language (section wrapper, cards, CTA buttons, pro-tips) but applies a distinct teal/green mobility accent to differentiate the transport context from the warm amber accommodation context.

## 2. User Flow

The car rental section is a passive content element within the generated trip HTML — the user does not interact with a wizard or form here. The flow is purely read-and-act:

```
1. User scrolls/navigates to the anchor car day (e.g., Day 6)
2. User reads the day's schedule, POI cards (as usual)
3. User encounters the car rental section (## 🚗)
   — Section intro: rental period, pickup/return location, transmission/fuel preferences
4. For each car category (e.g., Compact, Full-size):
   a. Category sub-heading (### 🚗 Compact)
   b. Price comparison table: 2-3 companies, daily rate, total cost, booking link
   c. Best-value recommendation note
5. Pro-tips: child seat regulations, fuel policy, insurance
6. User clicks a booking CTA button → rental company search page opens in new tab
```

## 3. Placement & Navigation

| Element | Location | Rationale |
|---|---|---|
| Car rental section (`div.car-rental-section`) | Inside `div.day-card#day-{N}` on the anchor car day, after POI cards and after accommodation section (if present), before daily budget table | Matches accommodation placement pattern — user reads options before seeing costs in budget |
| Sidebar/mobile nav | No new entries — car rental is a sub-section within an existing day | Keeps navigation clean; user finds it by navigating to the anchor day |

**Section placement order within anchor day HTML (updated from BRD REQ-005 AC-7):**
1. Day banner + schedule table
2. POI cards (`.itinerary-grid > .poi-card`)
3. Accommodation section (`.accommodation-section`) — if anchor for both stay + car
4. **Car rental section (`.car-rental-section`)** — NEW
5. Daily budget table (`.pricing-grid`)
6. Grocery store (`.poi-card` with `🛒` tag)
7. Along-the-way stops (`.poi-card` with `🎯` tag)
8. Plan B (`.advisory--info`)

## 4. Layout & Wireframes

### 4.1 Car Rental Section — Full Layout

**Desktop (>=1024px):**
```
+------------------------------------------------------------------+
| ─── 2px teal border-top ─────────────────────────────────────── |
|                                                                  |
| 🚗  [Car Rental Section Title]        (h2, teal accent color)   |
|                                                                  |
| Rental period: Aug 26 → Aug 27 (2 days)                         |
| Pickup/return: Airport · Transmission: Automatic · Fuel: Petrol  |
| Additional equipment: 2x child seats, GPS                        |
|                                                                  |
| ┌──────────────────────────────────────────────────────────────┐ |
| │ 🚗  [Category Name: Compact]              (h3, teal accent) │ |
| │                                                              │ |
| │ ┌────────────┬──────────┬──────────┬─────────────────────┐   │ |
| │ │ Company    │ /day     │ Total    │                     │   │ |
| │ ├────────────┼──────────┼──────────┼─────────────────────┤   │ |
| │ │ SIXT       │ €38/day  │ €76      │ [Book ➜]  (button)  │   │ |
| │ │ Europcar   │ €42/day  │ €84      │ [Book ➜]  (button)  │   │ |
| │ │ Hertz      │ €45/day  │ €90      │ [Book ➜]  (button)  │   │ |
| │ └────────────┴──────────┴──────────┴─────────────────────┘   │ |
| │ * Prices are indicative estimates                            │ |
| │                                                              │ |
| │ 💡 Best value: SIXT — lowest daily rate at €38/day           │ |
| └──────────────────────────────────────────────────────────────┘ |
|                                                                  |
| ┌──────────────────────────────────────────────────────────────┐ |
| │ 🚗  [Category Name: Full-size]             (h3, teal accent) │ |
| │ ... same table pattern ...                                   │ |
| └──────────────────────────────────────────────────────────────┘ |
|                                                                  |
| ┌──────────────────────────────────────────────────────────────┐ |
| │ 💡 Pro-tip: child seat regulations, fuel policy, insurance   │ |
| │ (reuses .pro-tip component)                                  │ |
| └──────────────────────────────────────────────────────────────┘ |
+------------------------------------------------------------------+
```

**Mobile (<=480px):**
```
+-----------------------------------+
| ── 2px teal border-top ────────── |
|                                   |
| 🚗 [Car Rental Title]  (h2)     |
|                                   |
| Rental: Aug 26 → Aug 27 (2 days) |
| Pickup: Airport                   |
| Transmission: Automatic           |
| Equipment: 2x child seats, GPS   |
|                                   |
| 🚗 [Compact]           (h3)     |
|                                   |
| ┌─────────────────────────────┐   |
| │ ← horizontal scroll →      │   |
| │ Company | /day | Total | CTA│   |
| │─────────┼──────┼───────┼────│   |
| │ SIXT    │ €38  │ €76   │[📋]│   |
| │ Europcar│ €42  │ €84   │[📋]│   |
| │ Hertz   │ €45  │ €90   │[📋]│   |
| └─────────────────────────────┘   |
| * Indicative estimates            |
| 💡 Best value: SIXT at €38/day  |
|                                   |
| 🚗 [Full-size]          (h3)    |
| ... same pattern, scrollable ... |
|                                   |
| 💡 Pro-tip: child seat regs...  |
+-----------------------------------+
```

### 4.2 Comparison Table Detail

**Desktop (>=768px):** Standard HTML table with 4 columns. Full-width within the category sub-section container.

**Mobile (<768px):** Table is wrapped in a horizontal scroll container (`overflow-x: auto`) with a subtle fade gradient on the right edge indicating more content. Column widths are set with `min-width` to prevent text wrapping into unreadable columns. The Company column is sticky-left so the user always sees which company's row they are reading while scrolling.

**Alternative considered and rejected:** Converting the table to stacked cards on mobile. Rejected because the primary value of this section is side-by-side comparison — stacked cards lose that affordance. Horizontal scroll preserves column alignment and comparison utility.

## 5. Component Specifications

### 5.1 Car Rental Section Wrapper (`.car-rental-section`)

**Visual:**
- Margin-top: `var(--space-5)` (32px) — same as `.accommodation-section`
- Padding-top: `var(--space-4)` (24px) — same as `.accommodation-section`
- Border-top: `2px solid var(--color-info)` — teal accent (`#2E7D9A`), distinct from accommodation's amber `var(--color-brand-accent)`

**Rationale for teal accent:** The design system already uses `--color-info` / `--color-brand-accent-alt` (`#2E7D9A`) for destinations and maps. Car rental is a mobility/transport concept — teal connects to the travel/navigation theme. Accommodation uses warm amber (`--color-brand-accent`) for its hospitality warmth. This visual separation allows users to distinguish sections instantly.

### 5.2 Section Title (`.car-rental-section__title`)

**Visual:**
- Extends `.section-title` base class
- Color: `var(--color-info)` (teal `#2E7D9A`) — overrides default text-primary
- Display: flex, align-items: center, gap: `var(--space-2)`
- Contains `🚗` emoji prefix (from markdown `## 🚗` heading)

**Dark mode:** `var(--color-info)` remains `#2E7D9A` in dark mode (already defined in design tokens — sufficient contrast on dark surface).

### 5.3 Section Intro (`.car-rental-section__intro`)

**Visual:**
- Font-size: `var(--text-sm)` (14px)
- Color: `var(--color-text-secondary)` (`#4A4A52` light / `#C8CDD6` dark)
- Margin-bottom: `var(--space-4)` (24px)
- Lists rental period, pickup location, transmission, fuel, and equipment preferences as a compact block

**Content pattern:** Single paragraph with key details separated by ` · ` (middle dot). Example:
`26.08 → 27.08 (2 дня) · Аэропорт · Автомат · Бензин · Доп. оборудование: 2 детских кресла, GPS`

### 5.4 Category Sub-Section (`.car-rental-category`)

**Visual:**
- Background: `var(--color-surface)` (white light / `#1A2A3A` dark)
- Border: `1px solid var(--color-border)`
- Border-left: `4px solid var(--color-info)` — teal left accent (mirrors `.accommodation-card`'s `4px solid var(--color-brand-accent)`)
- Border-radius: `var(--radius-container)` (12px)
- Padding: `var(--space-4)` (24px)
- Box-shadow: `var(--shadow-sm)`
- Margin-bottom: `var(--space-4)` (24px) between consecutive categories
- Transition: `box-shadow var(--transition-base), transform var(--transition-base)`

**Hover:**
- Box-shadow: `var(--shadow-lg)`
- Transform: `translateY(-2px)` — same lift effect as `.poi-card` and `.accommodation-card`

### 5.5 Category Heading (`.car-rental-category__title`)

**Visual:**
- Tag: `<h3>` (semantic heading, same level as POI card names)
- Font-size: `var(--text-lg)` (18px)
- Font-weight: `var(--font-weight-semibold)` (600)
- Color: `var(--color-info)` (teal)
- Margin-bottom: `var(--space-3)` (16px)
- Contains `🚗` emoji prefix (from markdown `### 🚗` heading)

### 5.6 Comparison Table (`.car-rental-table`)

**Visual:**
- Width: `100%`
- Border-collapse: collapse (uses table reset from `rendering_style_config.css`)
- Margin-bottom: `var(--space-2)` (8px)

**Table header (`thead th`):**
- Background: `var(--color-surface-raised)` (`#F2F0EC` light / `#1F3247` dark)
- Font-size: `var(--text-xs)` (12px)
- Font-weight: `var(--font-weight-semibold)` (600)
- Text-transform: `uppercase`
- Letter-spacing: `0.05em`
- Color: `var(--color-text-muted)` (`#8A8A96` light / `#7B8693` dark)
- Padding: `var(--space-2) var(--space-3)` (8px 16px)
- Text-align: `left` (overridden to `right` for RTL)
- Border-bottom: `2px solid var(--color-border-strong)`

**Table columns:**
| # | Column | Class | Width | Content |
|---|---|---|---|---|
| 1 | Company name | `.car-rental-table__company` | `auto` (flexible) | Company name as text |
| 2 | Daily rate | `.car-rental-table__daily` | `min-width: 100px` | Local currency + EUR |
| 3 | Total cost | `.car-rental-table__total` | `min-width: 100px` | Local currency + EUR |
| 4 | Booking link | `.car-rental-table__action` | `min-width: 110px` | CTA button |

**Table body rows (`tbody tr`):**
- Padding: `var(--space-3) var(--space-3)` (16px)
- Border-bottom: `1px solid var(--color-border)`
- Alternating row background: even rows get `var(--color-surface-raised)` — odd rows use `transparent`
- Transition: `background-color var(--transition-fast)`

**Row hover:**
- Background: `rgba(46, 125, 154, 0.06)` — subtle teal tint matching the section accent

**Cell text:**
- Company name: `var(--text-sm)`, `var(--font-weight-semibold)`, `var(--color-text-primary)`
- Pricing cells: `var(--text-sm)`, `var(--font-weight-medium)`, `var(--color-text-primary)`. EUR shown on a second line in `var(--text-xs)`, `var(--color-text-muted)`
- Unavailable category: Cell text `var(--color-text-muted)`, italic — "category not available" (localized)

### 5.7 Booking CTA Button (`.rental-cta`)

**Visual:**
- Display: `inline-flex`
- Align-items: `center`
- Gap: `var(--space-2)` (8px)
- Padding: `8px 16px` (slightly more compact than `.booking-cta`'s `10px 20px` to fit table cells)
- Background: `var(--color-info)` (teal `#2E7D9A`) — distinct from accommodation's amber `.booking-cta`
- Color: `#fff`
- Font-size: `var(--text-xs)` (12px) — smaller than `.booking-cta` to fit table column
- Font-weight: `var(--font-weight-semibold)` (600)
- Border-radius: `var(--radius-interactive)` (6px)
- Text-decoration: `none`
- White-space: `nowrap`
- Transition: `background-color var(--transition-fast), box-shadow var(--transition-fast)`

**Hover:**
- Background: `#245F78` (darker teal)
- Box-shadow: `var(--shadow-md)`

**Focus-visible:**
- Outline: `var(--focus-ring)` (2px solid gold)
- Outline-offset: `2px`

**Content:** Localized booking label (e.g., "Забронировать", "Book", "הזמנה") — label text comes from markdown, not hardcoded.

**`data-link-type` attribute:** Every `.rental-cta` element carries `data-link-type="rental-booking"` for test automation detection. This parallels the `data-link-type` pattern used on `.poi-card__link` and `.accommodation-card__link` elements.

### 5.8 Estimate Disclaimer (`.car-rental-category__estimate`)

**Visual:**
- Font-size: `var(--text-xs)` (12px)
- Color: `var(--color-text-muted)`
- Font-style: `italic`
- Margin-top: `var(--space-1)` (4px)
- Content: `*` + localized "prices are indicative estimates" text

### 5.9 Best-Value Recommendation (`.car-rental-category__recommendation`)

**Visual:**
- Display: `flex`
- Align-items: `center`
- Gap: `var(--space-2)` (8px)
- Margin-top: `var(--space-2)` (8px)
- Font-size: `var(--text-sm)` (14px)
- Color: `var(--color-text-secondary)`
- Prefix: `💡` emoji

### 5.10 Pro-Tip (reused `.pro-tip`)

**Visual:** Reuses the existing `.pro-tip` component exactly — no new styling needed.
- Background: `rgba(46, 125, 154, 0.08)` (teal tint)
- Border-left: `3px solid var(--color-brand-accent-alt)` (teal)
- Padding, font-size, gap: inherited from existing `.pro-tip` rules
- Contains SVG info icon + text span

**Content:** Child seat regulations, fuel policy tips, insurance recommendations (localized).

## 6. Interaction Patterns

| Interaction | Trigger | Behavior | Duration |
|---|---|---|---|
| Section hover (category card) | Mouse enter on `.car-rental-category` | Lift + deeper shadow (translateY -2px, shadow-lg) | 250ms ease |
| Row hover (table) | Mouse enter on `tbody tr` | Subtle teal background tint | 150ms ease |
| CTA button hover | Mouse enter on `.rental-cta` | Darker teal background + shadow | 150ms ease |
| CTA click | Click on `.rental-cta` | Opens rental company booking page in `target="_blank"` new tab | Instant |
| Mobile table scroll | Touch-drag horizontally | Table scrolls within `.car-rental-table-wrapper` container | Native scroll |
| Anchor navigation | Activity label click (from itinerary table) | Not applicable — car rental section has no `#poi-day-{D}-{N}` anchors. It is not a POI | N/A |

**No conditional visibility or progressive disclosure:** The car rental section renders fully expanded. Unlike the intake wizard, there are no toggles, accordions, or reveal interactions. This is read-only trip output.

## 7. Responsive Behavior

| Breakpoint | Layout Change |
|---|---|
| Desktop (>=1024px) | Full-width table within `.car-rental-category` card. All 4 columns visible without scrolling. Category cards single-column stacked (full width of `.main-content`) |
| Tablet (768px-1023px) | Same as desktop — table columns still fit at 768px due to min-widths totaling ~420px. `.main-content` padding reduces |
| Mobile (<768px) | Table wrapped in `.car-rental-table-wrapper` with `overflow-x: auto`. Company column gets `position: sticky; left: 0` with opaque background to remain visible during horizontal scroll. Right-edge fade gradient (`::after` pseudo on wrapper) hints at scrollable content |

### Table Scroll Wrapper (`.car-rental-table-wrapper`)

**Visual (mobile only — active below 768px):**
- Overflow-x: `auto`
- Scrollbar-width: `none` (hidden scrollbar — content is touch-scrollable)
- `-webkit-overflow-scrolling: touch`
- Position: `relative` (for fade pseudo-element)

**Fade indicator (`::after`):**
- Position: `absolute`, right: 0, top: 0, bottom: 0
- Width: `40px`
- Background: `linear-gradient(to right, transparent, var(--color-surface))`
- Pointer-events: `none`

**Sticky company column (`.car-rental-table__company`):**
- On screens <768px: `position: sticky; left: 0; z-index: 1`
- Background: `var(--color-surface)` (opaque to cover scrolled content behind it)
- Dark mode: `var(--color-surface)` adapts automatically via CSS custom properties

## 8. Accessibility

- **ARIA:**
  - `.car-rental-section`: `role="region"` with `aria-labelledby` pointing to the `<h2>` ID
  - `.car-rental-table`: Standard `<table>` semantics — `<thead>`, `<tbody>`, `<th scope="col">` for headers
  - `.rental-cta`: `<a>` element with descriptive text — no additional ARIA needed (link text is the localized booking label)
  - No `aria-hidden` on any visible content

- **Keyboard:**
  - Tab order follows DOM order: section title -> category heading -> table cells (links only) -> booking CTAs -> pro-tip links
  - Booking CTA buttons are focusable `<a>` elements with `focus-visible` ring (inherited from global styles)
  - Table is not interactive beyond links — no keyboard trap

- **Screen reader:**
  - `<h2>` and `<h3>` headings provide structural navigation
  - `<table>` with `<caption>` element describing the category (e.g., "Compact car rental price comparison")
  - `<th scope="col">` for all header cells
  - Estimate disclaimer is visually placed but also part of table `<caption>` or `<tfoot>` for screen reader context

- **Contrast:**
  - Teal (`#2E7D9A`) on white (`#FFFFFF`): ratio 4.58:1 — passes WCAG 2.1 AA for normal text
  - Teal (`#2E7D9A`) on dark surface (`#1A2A3A`): ratio 3.63:1 — passes AA for large text (headings at `var(--text-lg)` qualify). For body text in dark mode, the section intro uses `--color-text-secondary` (`#C8CDD6`) which passes at 10.3:1
  - White (`#fff`) on teal button (`#2E7D9A`): ratio 4.58:1 — passes AA
  - All pricing text uses `--color-text-primary` — 15.3:1 on light, 17.4:1 on dark

- **Touch targets:**
  - `.rental-cta` button: minimum 44px height (8px padding top/bottom + 12px font = 28px content + padding = 44px with table cell padding)
  - Table rows have `var(--space-3)` (16px) padding — sufficient for touch differentiation

## 9. RTL Support

| Element | LTR | RTL |
|---|---|---|
| Section border-top | `border-top: 2px solid var(--color-info)` | Same — border-top is direction-agnostic |
| Category card border-left | `border-left: 4px solid var(--color-info)` | `border-left: none; border-right: 4px solid var(--color-info)` |
| Table header text-align | `text-align: left` | `text-align: right` |
| Table body text-align | `text-align: left` | `text-align: right` |
| Sticky company column | `position: sticky; left: 0` | `position: sticky; right: 0` |
| Scroll fade gradient | Right edge fade | Left edge fade (gradient direction reversed) |
| `.rental-cta` text direction | LTR | RTL — text flows right-to-left, no layout change needed |
| Pro-tip border | `border-left: 3px solid ...` | `border-right: 3px solid ...` (inherited from existing `[dir="rtl"] .pro-tip` rule) |
| Intro paragraph dot separators | LTR order | Content order is locale-driven by the generator — no CSS change needed |

**Implementation:** Add `[dir="rtl"]` overrides in the RTL section (Section 14) of `rendering_style_config.css`, following the existing pattern for `.pro-tip` and `.itinerary-table`.

## 10. Dark Mode

All colors use CSS custom properties that are already defined with dark mode overrides in `rendering_style_config.css`. New components use the same tokens — no additional `@media (prefers-color-scheme: dark)` rules are needed except for the category tag background.

| Element | Light Mode | Dark Mode |
|---|---|---|
| Section border-top | `#2E7D9A` (`--color-info`) | `#2E7D9A` (unchanged — sufficient contrast on `#0F1923`) |
| Section title color | `#2E7D9A` (`--color-info`) | `#2E7D9A` (unchanged) |
| Category card background | `#FFFFFF` (`--color-surface`) | `#1A2A3A` (`--color-surface`) |
| Category card border | `rgba(0,0,0,0.10)` (`--color-border`) | `rgba(255,255,255,0.10)` (`--color-border`) |
| Category left accent | `#2E7D9A` (`--color-info`) | `#2E7D9A` (unchanged) |
| Table header bg | `#F2F0EC` (`--color-surface-raised`) | `#1F3247` (`--color-surface-raised`) |
| Table alt-row bg | `#F2F0EC` (`--color-surface-raised`) | `#1F3247` (`--color-surface-raised`) |
| Row hover bg | `rgba(46,125,154,0.06)` | `rgba(46,125,154,0.10)` (slightly stronger on dark) |
| `.rental-cta` background | `#2E7D9A` | `#2E7D9A` (unchanged — button is self-colored) |
| `.rental-cta` hover bg | `#245F78` | `#245F78` (unchanged) |
| `.rental-cta` text | `#fff` | `#fff` (unchanged) |
| Category tag background | `rgba(46,125,154,0.12)` | `rgba(46,125,154,0.15)` (needs dark mode override) |
| Price text | `#1C1C1E` (`--color-text-primary`) | `#FAFAFA` (`--color-text-primary`) |
| Estimate text | `#8A8A96` (`--color-text-muted`) | `#7B8693` (`--color-text-muted`) |
| Scroll fade gradient | `transparent → #FFFFFF` (`--color-surface`) | `transparent → #1A2A3A` (`--color-surface`) |

**One explicit dark mode override needed:**
```css
@media (prefers-color-scheme: dark) {
  .car-rental-category__tag {
    background-color: rgba(46, 125, 154, 0.15);
  }
  .car-rental-table tbody tr:hover {
    background-color: rgba(46, 125, 154, 0.10);
  }
}
```

## 11. Design Consistency Check

| Pattern | Existing/New | Reference |
|---|---|---|
| Section wrapper with border-top accent | Existing | `.accommodation-section` (amber border-top) — car rental uses same pattern with teal |
| Card with left border accent + hover lift | Existing | `.accommodation-card` (amber left border) — category card uses same pattern with teal |
| Section title as `<h2>` with emoji prefix | Existing | `.accommodation-section__title` (`🏨`) — car rental uses `🚗` |
| Intro paragraph (`..*__intro`) | Existing | `.accommodation-section__intro` |
| CTA button (solid bg, white text, rounded) | Existing | `.booking-cta` (amber) — `.rental-cta` uses same shape with teal |
| Pro-tip component | Existing | `.pro-tip` — reused unchanged |
| Estimate badge | Existing | `.pricing-cell__badge--estimate` — similar italic muted style |
| **Price comparison table** | **New** | Defined in SS 5.6 — new component type not previously in the design system |
| **Horizontal scroll wrapper with fade** | **New** | Defined in SS 7 — `.car-rental-table-wrapper` for mobile table overflow |
| **Sticky table column** | **New** | Defined in SS 7 — company column sticky on mobile for comparison readability |

**New pattern count:** 3 new patterns (comparison table, scroll wrapper, sticky column). All other elements reuse existing patterns with teal accent substitution.

## 12. HTML Structure Reference

The following HTML structure maps the component specifications to concrete markup. This serves as the contract between UX design and the dev/rendering implementation.

```html
<div class="car-rental-section" role="region" aria-labelledby="car-rental-title-{block_id}">
  <h2 class="section-title car-rental-section__title" id="car-rental-title-{block_id}">
    🚗 {localized_car_rental_label}
  </h2>
  <p class="car-rental-section__intro">
    {rental_period} · {pickup_location} · {transmission} · {fuel_type} · {equipment_note}
  </p>

  <!-- Repeat per car category -->
  <div class="car-rental-category">
    <span class="car-rental-category__tag">🚗</span>
    <h3 class="car-rental-category__title">🚗 {localized_category_name}</h3>

    <div class="car-rental-table-wrapper">
      <table class="car-rental-table">
        <caption class="sr-only">{localized_category_name} — {localized_price_comparison}</caption>
        <thead>
          <tr>
            <th scope="col" class="car-rental-table__company">{localized_company}</th>
            <th scope="col" class="car-rental-table__daily">{localized_daily_rate}</th>
            <th scope="col" class="car-rental-table__total">{localized_total}</th>
            <th scope="col" class="car-rental-table__action">{localized_booking}</th>
          </tr>
        </thead>
        <tbody>
          <!-- Repeat per company (2-3 rows, sorted by daily rate ascending) -->
          <tr>
            <td class="car-rental-table__company">{company_name}</td>
            <td class="car-rental-table__daily">
              {daily_rate_local_currency}<br>
              <span class="text-xs text-muted">~{daily_rate_eur}</span>
            </td>
            <td class="car-rental-table__total">
              {total_local_currency}<br>
              <span class="text-xs text-muted">~{total_eur}</span>
            </td>
            <td class="car-rental-table__action">
              <a class="rental-cta" data-link-type="rental-booking"
                 href="{booking_url}" target="_blank" rel="noopener noreferrer">
                {localized_booking_label}
              </a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p class="car-rental-category__estimate">* {localized_estimate_disclaimer}</p>
    <p class="car-rental-category__recommendation">💡 {localized_best_value_note}</p>
  </div>
  <!-- End category repeat -->

  <div class="pro-tip">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
    <span>{localized_pro_tips: child_seats, fuel_policy, insurance}</span>
  </div>
</div>
```

**Key structural rules:**
- `.car-rental-category` is NOT a `.poi-card` and NOT an `.accommodation-card`. It uses its own class namespace
- `### 🚗` headings in markdown produce `.car-rental-category` divs, NOT `.poi-card` divs
- The section contains no `id="poi-day-{D}-{N}"` anchors — car rental options are not POIs
- `data-link-type="rental-booking"` on CTA links enables language-agnostic test detection
- All text content is localized — no hardcoded English or Russian strings in the HTML structure

## 13. BRD Coverage Matrix

| Requirement | UX Addressed? | Section |
|---|---|---|
| REQ-001 (Car Rental Block Identification) | N/A | Pipeline logic, no visual impact. Section placement relies on block identification but rendering is agnostic |
| REQ-002 (Preference Consumption) | Yes | SS 5.3 (intro displays preferences), SS 5.6 (multi-category tables) |
| REQ-003 (Company Discovery) | N/A | Pipeline/research logic, no direct visual impact. Results feed into table rows |
| REQ-004 (Price Comparison Table) | Yes | SS 4.1, SS 4.2, SS 5.6 (full table spec), SS 7 (responsive), SS 12 (HTML structure) |
| REQ-005 (Card Format in Markdown) | Yes | SS 3 (placement order), SS 5.1-5.10 (all component specs), SS 12 (HTML mapping) |
| REQ-006 (Booking Link Construction) | Yes | SS 5.7 (`.rental-cta` spec), SS 12 (`data-link-type="rental-booking"`) |
| REQ-007 (Budget Integration) | Partial | SS 3 (placement order — budget table after car rental section). Budget table itself uses existing `.pricing-grid` — no new UX component needed |
| REQ-008 (Manifest Schema) | N/A | Data schema, no visual impact |
| REQ-009 (CEO Audit) | N/A | Process checklist, no visual impact |
| REQ-010 (HTML Rendering) | Yes | SS 4, SS 5 (all component specs), SS 6 (interactions), SS 7 (responsive), SS 8 (a11y), SS 9 (RTL), SS 10 (dark mode), SS 11 (consistency), SS 12 (HTML structure) |
| REQ-011 (Automation Test Coverage) | Yes | SS 5.7 (`data-link-type` attribute for test detection), SS 12 (class names as test selectors) |
| REQ-012 (Language-Agnostic Content) | Yes | SS 12 (all labels are `{localized_*}` placeholders, no hardcoded strings) |
| REQ-013 (Remove Overview Hardcoded) | N/A | Content removal — no new UX component needed. Overview is existing structure |

## 14. Approval Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| Product Manager | — | — | Approved (BRD coverage complete per SS 13) |
| Dev Team Lead | — | — | Approved (implementation feasible, patterns reuse existing CSS architecture) |
| UX/UI Principal Engineer | UX/UI Principal Engineer | 2026-04-02 | Self-approved |

**Conditions:**
- [x] All visually-impacting BRD requirements have UX design entries (verified in SS 13)
- [x] No conflicts with existing design system patterns identified
- [x] Dark mode, RTL, and responsive behaviors fully specified
