# Test Plan — Trip HTML Generation

## Scope
Regression and progression testing for the generated trip HTML output (`generated_trips/html/trip_*.html`).

## Test Suites

### 1. Structural Integrity (`structure.spec.ts`)
- Page loads, inline styles present, semantic HTML structure

### 2. Navigation (`navigation.spec.ts`)
- Sidebar links, mobile pills, active state, anchor targets

### 3. Day Cards (`day-cards.spec.ts`)
- Banner titles/dates, itinerary tables, POI cards, Plan B, logistics per day

### 4. POI Cards — Content & Links (`poi-cards.spec.ts`)
- POI card names, descriptions, pro-tips, link presence and href validity

### 5. POI Cards — Language Compliance (`poi-languages.spec.ts`)
- Every POI card name must contain both Hungarian (Latin) and Russian (Cyrillic) text
- Per `trip_details.json → language_preference.poi_languages: ["Hungarian", "Russian"]`
- **Assertions:**
  - Latin script characters present in every `.poi-card__name`
  - Cyrillic script characters present in every `.poi-card__name`
  - Combined check: both scripts in every name

### 6. POI Parity — Markdown vs HTML (`poi-parity.spec.ts`)
- **Business rule:** Every `###` POI section in the source markdown must produce exactly one `poi-card` in the HTML output
- **Excluded sections:** Логистика, Стоимость, Запасной план
- **Assertions:**
  - Per-day count: HTML `.poi-card` count inside `#day-N` == markdown `###` POI count for that day
  - Total count: sum of all HTML POI cards == sum of all markdown POI sections
  - Error messages list the specific missing POI names for quick debugging
- **Edge cases:** Day 0 (arrival) has no POI sections — excluded from parity check

### 7. Overview & Budget (`overview-budget.spec.ts`)
- Overview table, budget section

### 8. SVG Integrity (`svg-integrity.spec.ts`)
- All SVGs have width/height attributes, aria-hidden

### 9. Responsive (`responsive.spec.ts`)
- Mobile/desktop layout differences

### 10. Visual (`visual.spec.ts`)
- Screenshot comparison for key components
