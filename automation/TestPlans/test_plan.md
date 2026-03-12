# Test Plan — Trip HTML Regression Suite

**Version:** 1.0
**Date:** 2026-03-12
**Target:** `trip_2026-03-12_1555.html`
**QA Lead Sign-off:** Pending

---

## 1. Scope

### In Scope
- **Structural Integrity:** Verify all 10 day sections, overview, and budget sections are rendered.
- **Navigation:** Sidebar links (desktop) and pill navigation (mobile) — correct count, hrefs, active states.
- **Day Cards:** Each day has a banner (date + title), itinerary table, POI cards, logistics, pricing, and Plan B.
- **POI Cards:** Every POI has name, description (Вайб / Не пропустить / Семейный фактор), pro-tip, and 3 links (Maps, Website, Photos).
- **Itinerary Tables:** Header row present, time column formatted, rows match expected count per day.
- **Advisory Banner:** Holiday warning is visible with correct content.
- **Budget Section:** Summary table with 10 day rows + total row; car rental table present.
- **Accessibility:** Focus rings on interactive elements, proper ARIA labels on nav landmarks.
- **Responsive Layout:** Mobile nav visible / sidebar hidden on mobile; sidebar visible / mobile nav hidden on desktop.
- **Visual Regression:** Screenshot comparison of key components (day cards, itinerary tables, POI cards, mobile nav).
- **SVG Integrity:** All inline SVGs have explicit `width` and `height` attributes.
- **Self-Contained:** No external CSS `<link>` to `rendering_style_config.css`; styles must be inlined.

### Out of Scope
- External link validation (Google Maps, restaurant websites) — these are third-party URLs.
- Performance/load testing.
- Server-side rendering — file is static HTML.

---

## 2. Business-Critical Assertions

| ID | Assertion | Priority |
|----|-----------|----------|
| BC-01 | All 10 day sections (`#day-1` through `#day-10`) exist and are visible | P0 |
| BC-02 | Overview table contains exactly 11 data rows (arrival + 10 days) | P0 |
| BC-03 | Budget total row exists and shows "~629 775 HUF" / "≈ €1 576" | P0 |
| BC-04 | Every POI card has all 3 link types (Maps, Website/Сайт, Photos/Фото) | P0 |
| BC-05 | Sidebar has exactly 12 navigation links (Обзор + 10 days + Бюджет) | P1 |
| BC-06 | Mobile nav has exactly 12 pills | P1 |
| BC-07 | Holiday advisory is visible and mentions "День Святого Иштвана" | P1 |
| BC-08 | Page title is "Будапешт 2026 — Семейный маршрут" | P1 |
| BC-09 | No external CSS `<link>` referencing `rendering_style_config.css` | P1 |
| BC-10 | All inline SVGs have `width` and `height` attributes | P2 |

---

## 3. Edge Cases

| ID | Scenario | Expected |
|----|----------|----------|
| EC-01 | Mobile viewport (375×667 iPhone SE) | Sidebar hidden, mobile nav visible and sticky |
| EC-02 | Desktop viewport (1440×900) | Sidebar visible, mobile nav hidden |
| EC-03 | Very long POI description text | No overflow outside card boundary |
| EC-04 | Horizontal scroll on itinerary table (mobile) | Table wrapper scrollable, no page-level horizontal scroll |
| EC-05 | Empty state — Day section with missing anchor | Navigation link still present, no JS errors |

---

## 4. Test Architecture

- **Framework:** Playwright
- **Language:** TypeScript
- **Pattern:** Page Object Model (POM)
- **Visual Testing:** `toHaveScreenshot()` for day cards, itinerary tables, mobile nav
- **Reports:** Playwright HTML Reporter with traces and video on failure
- **Retries:** 1 (CI policy)
