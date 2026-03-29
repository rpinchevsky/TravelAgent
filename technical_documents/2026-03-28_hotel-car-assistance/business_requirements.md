# Business Requirements Document

**Change:** Hotel Assistance & Car Rental Assistance — Optional Intake Sections
**Date:** 2026-03-28
**Author:** Product Manager
**Status:** Approved

---

## 1. Background & Motivation

The trip intake wizard currently collects traveler composition, preference questions, interest/avoid/food selections, and language/accessibility extras. However, two of the most time-consuming logistics tasks for family trips — finding suitable accommodation and renting a car — are not addressed. Users must separately research hotels and car rentals after receiving their itinerary.

By adding optional Hotel Assistance and Car Rental Assistance sections to the intake wizard, the generated trip details file can carry structured accommodation and vehicle preferences. This enables the trip generation pipeline (or future integrations) to provide targeted hotel and car rental recommendations aligned with traveler needs, completing the end-to-end travel planning experience.

Both features are opt-in (toggle-gated) so they add zero friction for users who do not need them.

## 2. Scope

**In scope:**
- Two new collapsible sections in Step 6 (Language & Extras): Hotel Assistance and Car Rental Assistance
- Toggle cards (Yes/No) controlling visibility of sub-questions for each section
- 7 hotel preference questions and 6 car rental preference questions (UI types: single-select card grid, q-card single-select, multi-select chips, toggle Yes/No cards, dual-handle range slider)
- A new UI component: dual-handle range slider for budget questions
- New markdown output sections (conditional — only when user opted in)
- i18n support across all 12 locale files for all new UI text, option labels, and section headers
- Updates to trip_intake_rules.md (output format, Step 6 field table, supplementary fields table)
- Updates to trip_intake_design.md (new component specs, Step 6 layout additions)
- Updates to content_format_rules.md (new markdown sections in trip details structure)

**Out of scope:**
- Actual hotel booking or car rental booking integrations
- Price comparison or availability checks against external APIs
- Automatic hotel/car recommendations in the generated trip itinerary (future pipeline enhancement)
- Changes to Steps 0-5 or Step 7 layout (beyond rendering the new markdown in preview)
- Changes to the trip generation pipeline logic (trip_planning_rules.md consumption of these sections is a future enhancement)

**Affected rule files:**
- `trip_intake_rules.md` — Step 6 field table, Supplementary Fields table, Output Format section, "Adding a new form field" how-to
- `trip_intake_design.md` — Step 6 layout section, new component specs (dual-handle range slider, collapsible toggle section, single-select card grid for hotel/car types)
- `content_format_rules.md` — trip details markdown structure (new optional sections)

## 3. Requirements

### REQ-001: Hotel Assistance Toggle

**Description:** Step 6 must include a collapsible "Hotel Assistance" section with a Yes/No toggle. When set to "No" (default), the 7 hotel preference questions are hidden. When set to "Yes", they are revealed with a smooth expand animation.

**Acceptance Criteria:**
- [ ] AC-1: A "Hotel Assistance" section heading is visible on Step 6 below the existing fields (after Wheelchair Accessibility)
- [ ] AC-2: The section contains a Yes/No toggle using the existing q-card pattern (2-option card grid, compact sizing consistent with `.depth-extra-question`)
- [ ] AC-3: Default state is "No" (sub-questions hidden)
- [ ] AC-4: Selecting "Yes" reveals 7 sub-questions with a smooth max-height/opacity transition
- [ ] AC-5: Selecting "No" after "Yes" collapses the sub-questions and clears all hotel selections to defaults
- [ ] AC-6: The toggle label and both option labels have `data-i18n` attributes and entries in all 12 locale files
- [ ] AC-7: RTL layout (Hebrew, Arabic) renders correctly with mirrored alignment

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — Step 6 DOM, toggle logic
- `locales/ui_*.json` (12 files) — new i18n keys

---

### REQ-002: Hotel Preference Questions (7 questions)

**Description:** When Hotel Assistance is toggled to "Yes", the following 7 preference questions must be displayed in order within the collapsible section.

| # | Key | Question | UI Type | Options |
|---|-----|----------|---------|---------|
| 1 | `hotelType` | Accommodation type | Single-select card grid | Hotel, Boutique Hotel, Resort & Spa, Apartment / Condo, Apart-Hotel, Villa / House, B&B / Guesthouse, Hostel, Farmhouse / Agriturismo, Cabin / Cottage, Glamping, Houseboat |
| 2 | `hotelLocation` | Location priority | q-card (single) | City center & walkable, Near main attractions, Quiet & residential, Beachfront or waterfront, Near transport hub |
| 3 | `hotelStars` | Quality level | q-card (single) | Budget (1-2 stars), Mid-range (3 stars), Upscale (4 stars), Luxury (5 stars) |
| 4 | `hotelAmenities` | Must-have amenities | Multi-select chips | Pool, Free Parking, Kitchen, Free WiFi, Gym, Spa & Wellness, Air Conditioning, Laundry, Kids Play Area, Restaurant On-site, Non-smoking Rooms, Airport Shuttle |
| 5 | `hotelPets` | Traveling with pets? | Toggle Yes/No cards | No, Yes |
| 6 | `hotelCancellation` | Cancellation flexibility | q-card (single) | Free cancellation (even if pricier), Non-refundable is fine (cheaper), No preference |
| 7 | `hotelBudget` | Daily budget per room | Dual-handle range slider | Min $30 — Max $1,000 |

**Acceptance Criteria:**
- [ ] AC-1: All 7 questions render in the specified order inside the Hotel Assistance collapsible section
- [ ] AC-2: `hotelType` uses a card grid with 12 options; exactly one can be selected at a time (radio behavior); no default selection
- [ ] AC-3: `hotelLocation` uses q-card (single-select, 5 options); no default
- [ ] AC-4: `hotelStars` uses q-card (single-select, 4 options); no default
- [ ] AC-5: `hotelAmenities` uses multi-select chip pattern (pill-shaped toggles); zero or more can be selected
- [ ] AC-6: `hotelPets` uses 2-option toggle cards (same as wheelchair pattern); default is "No"
- [ ] AC-7: `hotelCancellation` uses q-card (single-select, 3 options); no default
- [ ] AC-8: `hotelBudget` renders a dual-handle range slider with min=30, max=1000, step=10, currency prefix "$"; both handles are draggable; current range displayed as "$X - $Y"
- [ ] AC-9: All question labels and option labels have `data-i18n` attributes
- [ ] AC-10: All i18n keys are present in all 12 `locales/ui_*.json` files
- [ ] AC-11: Cards and chips follow existing design system patterns (same sizing, padding, colors, hover/selected states)

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — Step 6 DOM, selection handlers
- `locales/ui_*.json` (12 files)

---

### REQ-003: Car Rental Assistance Toggle

**Description:** Step 6 must include a collapsible "Car Rental Assistance" section with a Yes/No toggle, placed after the Hotel Assistance section. Behavior mirrors REQ-001.

**Acceptance Criteria:**
- [ ] AC-1: A "Car Rental Assistance" section heading is visible on Step 6 after the Hotel Assistance section
- [ ] AC-2: The section contains a Yes/No toggle using the q-card pattern (compact sizing)
- [ ] AC-3: Default state is "No" (sub-questions hidden)
- [ ] AC-4: Selecting "Yes" reveals 6 sub-questions with a smooth expand animation
- [ ] AC-5: Selecting "No" after "Yes" collapses the sub-questions and clears all car selections to defaults
- [ ] AC-6: The toggle label and option labels have `data-i18n` attributes and entries in all 12 locale files
- [ ] AC-7: RTL layout renders correctly

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — Step 6 DOM, toggle logic
- `locales/ui_*.json` (12 files)

---

### REQ-004: Car Rental Preference Questions (6 questions)

**Description:** When Car Rental Assistance is toggled to "Yes", the following 6 preference questions must be displayed.

| # | Key | Question | UI Type | Options |
|---|-----|----------|---------|---------|
| 1 | `carCategory` | Car category | Single-select card grid | Mini, Economy, Compact, Intermediate, Standard, Full-size, Premium, Luxury, SUV Compact, SUV Full-size, Minivan / MPV, Van (7-9 seats), Convertible, Oversize |
| 2 | `carTransmission` | Transmission | q-card (single) | Automatic, Manual, No preference |
| 3 | `carFuel` | Fuel type preference | q-card (single) | Petrol, Diesel, Hybrid, Electric, No preference |
| 4 | `carPickup` | Pickup & return | q-card (single) | Airport, City center office, Hotel or accommodation delivery, Train station |
| 5 | `carExtras` | Additional equipment needed | Multi-select chips | Child seat (infant), Child seat (toddler), Booster seat, GPS Navigation, Roof rack, Snow chains, Additional driver |
| 6 | `carBudget` | Daily rental budget | Dual-handle range slider | Min $0 — Max $1,000 |

**Acceptance Criteria:**
- [ ] AC-1: All 6 questions render in the specified order inside the Car Rental Assistance collapsible section
- [ ] AC-2: `carCategory` uses a card grid with 14 options (ACRISS-based); exactly one can be selected (radio behavior); no default
- [ ] AC-3: `carTransmission` uses q-card (single-select, 3 options); no default
- [ ] AC-4: `carFuel` uses q-card (single-select, 5 options); no default
- [ ] AC-5: `carPickup` uses q-card (single-select, 4 options); no default
- [ ] AC-6: `carExtras` uses multi-select chip pattern; zero or more can be selected
- [ ] AC-7: `carBudget` renders a dual-handle range slider with min=0, max=1000, step=10, currency prefix "$"
- [ ] AC-8: All question labels and option labels have `data-i18n` attributes
- [ ] AC-9: All i18n keys are present in all 12 locale files
- [ ] AC-10: Cards and chips follow existing design system patterns

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — Step 6 DOM, selection handlers
- `locales/ui_*.json` (12 files)

---

### REQ-005: Dual-Handle Range Slider Component

**Description:** A new reusable UI component — a dual-handle range slider — must be implemented for the budget questions (`hotelBudget` and `carBudget`). This component does not exist in the current intake page.

**Acceptance Criteria:**
- [ ] AC-1: The slider has two draggable handles (min and max) on a single track
- [ ] AC-2: The filled range between the two handles is visually highlighted (brand-primary or accent color)
- [ ] AC-3: Handles cannot cross each other (min handle cannot exceed max handle and vice versa)
- [ ] AC-4: Current selected range is displayed as a formatted label (e.g., "$30 - $500")
- [ ] AC-5: Touch-friendly: handles have minimum 44x44px touch target
- [ ] AC-6: Keyboard accessible: handles are focusable and respond to arrow keys (left/right to adjust value)
- [ ] AC-7: Step increments are configurable (step=10 for both budget sliders)
- [ ] AC-8: Min and max bounds are configurable per instance
- [ ] AC-9: RTL layout mirrors the slider direction (low values on right, high on left)
- [ ] AC-10: The component follows the existing design system (brand colors, radius, shadow)
- [ ] AC-11: Works on desktop (mouse drag) and mobile (touch drag) without layout issues

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — new CSS + JS for the slider component

---

### REQ-006: Markdown Output — Hotel Assistance Section

**Description:** When the user has opted in to Hotel Assistance (toggle = Yes) and at least one preference is filled, the generated markdown must include a `## Hotel Assistance` section after the existing `## Additional Preferences` section.

**Acceptance Criteria:**
- [ ] AC-1: The `## Hotel Assistance` section appears in the markdown output only when the hotel toggle is "Yes"
- [ ] AC-2: The section is omitted entirely when the hotel toggle is "No"
- [ ] AC-3: The section contains all 7 fields as bold-label bullet points in this exact format:
  ```
  ## Hotel Assistance
  - **Accommodation type:** {value}
  - **Location priority:** {value}
  - **Quality level:** {value}
  - **Must-have amenities:** {comma-separated list or "None"}
  - **Traveling with pets:** {Yes/No}
  - **Cancellation preference:** {value}
  - **Daily budget per room:** ${min} - ${max}
  ```
- [ ] AC-4: All field values use English text regardless of UI language (consistent with existing `data-en-name` pattern)
- [ ] AC-5: Fields with no selection show a sensible default or "Not specified"
- [ ] AC-6: The section is visible in the Step 7 preview
- [ ] AC-7: The section is present in the downloaded markdown file

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — `generateMarkdown()` function
- `content_format_rules.md` — output structure documentation
- `trip_intake_rules.md` — output format documentation

---

### REQ-007: Markdown Output — Car Rental Assistance Section

**Description:** When the user has opted in to Car Rental Assistance (toggle = Yes) and at least one preference is filled, the generated markdown must include a `## Car Rental Assistance` section after the Hotel Assistance section (or after Additional Preferences if no hotel section).

**Acceptance Criteria:**
- [ ] AC-1: The `## Car Rental Assistance` section appears in the markdown output only when the car rental toggle is "Yes"
- [ ] AC-2: The section is omitted entirely when the car rental toggle is "No"
- [ ] AC-3: The section contains all 6 fields as bold-label bullet points in this exact format:
  ```
  ## Car Rental Assistance
  - **Car category:** {value}
  - **Transmission:** {value}
  - **Fuel type:** {value}
  - **Pickup & return:** {value}
  - **Additional equipment:** {comma-separated list or "None"}
  - **Daily rental budget:** ${min} - ${max}
  ```
- [ ] AC-4: All field values use English text regardless of UI language
- [ ] AC-5: Fields with no selection show "Not specified"
- [ ] AC-6: The section is visible in the Step 7 preview
- [ ] AC-7: The section is present in the downloaded markdown file

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — `generateMarkdown()` function
- `content_format_rules.md` — output structure documentation
- `trip_intake_rules.md` — output format documentation

---

### REQ-008: i18n — All New Keys Across 12 Locale Files

**Description:** Every new piece of UI text (section headers, toggle labels, question labels, option labels, slider labels, placeholder text) must follow the existing i18n pattern with `data-i18n` attributes and entries in all 12 `locales/ui_*.json` files.

**Acceptance Criteria:**
- [ ] AC-1: All new DOM elements with visible text have `data-i18n` or `data-i18n-placeholder` attributes
- [ ] AC-2: All new i18n keys exist in `locales/ui_en.json` with English values
- [ ] AC-3: All new i18n keys exist in `locales/ui_ru.json` with Russian translations
- [ ] AC-4: All new i18n keys exist in `locales/ui_he.json` with Hebrew translations
- [ ] AC-5: All new i18n keys exist in the remaining 9 locale files (`es`, `fr`, `de`, `it`, `pt`, `zh`, `ja`, `ko`, `ar`) with English fallback values
- [ ] AC-6: Option labels for card grids and chips that appear in markdown output store English values in `data-en-name` attributes (for language-agnostic markdown generation)
- [ ] AC-7: Switching UI language updates all new labels and option text instantly (no mixed-language rendering)

**Priority:** Must-have

**Affected components:**
- `locales/ui_*.json` (12 files)
- `trip_intake.html` — `data-i18n` attributes on all new elements

---

### REQ-009: Design System Compliance

**Description:** All new UI elements must follow the existing design system documented in `trip_intake_design.md` — same spacing scale, radius values, color tokens, typography, responsive breakpoints, and interaction patterns.

**Acceptance Criteria:**
- [ ] AC-1: Collapsible sections use the same expand/collapse animation pattern (max-height + opacity, 0.3-0.4s ease)
- [ ] AC-2: Card grids for `hotelType` (12 options) and `carCategory` (14 options) use a responsive grid that adapts from 3-4 columns on desktop to 2 columns on mobile
- [ ] AC-3: q-card single-select questions use the existing `.q-card` pattern with `.depth-extra-question` compact sizing (min-height 140px)
- [ ] AC-4: Multi-select chips use the existing chip selector pattern (pill-shaped, radius 999px, brand-primary when selected)
- [ ] AC-5: Toggle Yes/No cards use the existing 2-option `.q-card` pattern (consistent with wheelchair accessibility question)
- [ ] AC-6: All interactive elements have minimum 44x44px touch targets
- [ ] AC-7: Sections render correctly at desktop (1024px+), tablet (768px), and mobile (480px) widths
- [ ] AC-8: Dark mode renders correctly for all new components

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — CSS for new sections
- `trip_intake_design.md` — component spec updates

---

### REQ-010: Step 6 Layout — Section Ordering and Collapsibility

**Description:** The two new sections must be placed in Step 6 after the existing fields, using a clear visual hierarchy with section headers and collapsible bodies.

**Acceptance Criteria:**
- [ ] AC-1: Step 6 field order is: Report Language, POI Languages, Additional Notes, Photography, Accessibility, Wheelchair Accessible, **Hotel Assistance**, **Car Rental Assistance**
- [ ] AC-2: Each new section has a distinct section header (styled as `.chip-section__title` or equivalent uppercase accent-alt header)
- [ ] AC-3: The toggle (Yes/No) is visually prominent as the gatekeeper for the sub-questions
- [ ] AC-4: Sub-questions animate in/out smoothly when the toggle changes
- [ ] AC-5: The two sections are visually separated from each other and from preceding fields (consistent spacing/dividers)
- [ ] AC-6: Collapsing a section does not cause layout jumps or content overlap

**Priority:** Must-have

**Affected components:**
- `trip_intake.html` — Step 6 DOM structure
- `trip_intake_design.md` — Step 6 layout spec

---

### REQ-011: Supplementary Field Registration

**Description:** All new fields must be registered as supplementary fields (always visible within Step 6, not gated by question depth tiers). They do not count toward the question budget.

**Acceptance Criteria:**
- [ ] AC-1: The hotel toggle, all 7 hotel sub-questions, the car toggle, and all 6 car sub-questions are listed in the Supplementary Fields table in `trip_intake_rules.md`
- [ ] AC-2: No new fields are assigned to depth tiers (T1-T5)
- [ ] AC-3: The new sections are visible at all depth levels (10, 15, 20, 25, 30)

**Priority:** Must-have

**Affected components:**
- `trip_intake_rules.md` — Supplementary Fields table

---

## 4. Dependencies & Risks

| Dependency / Risk | Mitigation |
|---|---|
| Dual-handle range slider is a new component not present in the current codebase | Implement as a self-contained CSS+JS component within `trip_intake.html`; no external library dependencies (keeping the page self-contained) |
| 12-option and 14-option card grids are larger than existing grids (max ~8 options currently for q-cards) | Use a responsive multi-column grid (3-4 cols desktop, 2 cols mobile) distinct from the 3-column `.question-options` used for Step 2 q-cards |
| Large number of new i18n keys (~80-100 new keys across section headers, questions, and options) | Follow the established pattern strictly; use a consistent key prefix (`s6_hotel_*`, `s6_car_*`) for easy identification |
| Two new conditional markdown sections may affect downstream pipeline parsing | Sections are optional and appended at the end of the markdown; the trip generation pipeline currently ignores unknown sections, so backward compatibility is maintained |
| Step 6 becomes visually longer with two new collapsible sections | Sections are collapsed by default (toggle = No), so users who do not need them see only two additional toggle rows — minimal visual overhead |
| Touch interaction for range slider handles on mobile may conflict with page scroll | Implement `touch-action: none` on slider track and use pointer events (not mouse events) for cross-platform compatibility |

## 5. Acceptance Sign-off

| Role | Name | Date | Verdict |
|---|---|---|---|
| PM | Product Manager | 2026-03-28 | Approved |
